"""Compara TF-IDF y MiniLM, calibra probabilidades y exporta la cabeza ONNX int8."""

import argparse
import json
import platform
import tempfile
from pathlib import Path
from time import perf_counter

import numpy as np
import onnx
from onnx import TensorProto, helper, numpy_helper
from onnxruntime.quantization import QuantType, quantize_dynamic
from scipy.optimize import minimize_scalar
from scipy.sparse import csr_matrix, hstack
from scipy.special import softmax
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, confusion_matrix, f1_score, log_loss
from sklearn.model_selection import StratifiedKFold
from sklearn.pipeline import make_pipeline

from classifier import Encoder, IntentClassifier, MODEL, character_ngrams
from dataset import ROOT, normalize, read_rows


def fold_split(features, labels):
    return StratifiedKFold(5, shuffle=True, random_state=2026).split(features, labels)


def calibrate(logits, labels):
    classes = np.unique(labels)
    result = minimize_scalar(lambda temperature: log_loss(labels, softmax(logits / temperature, axis=1), labels=classes),
                             bounds=(0.15, 5), method="bounded")
    return float(result.x), float(result.fun)


def fit_calibrated(model, features, labels):
    # Los logits para calibración siempre provienen de pliegues que excluyen ese ejemplo.
    classes = np.unique(labels)
    logits = np.empty((len(labels), len(classes)))
    for train, holdout in fold_split(features, labels):
        model.fit(features[train], labels[train])
        logits[holdout] = model.decision_function(features[holdout])
    return model.fit(features, labels), calibrate(logits, labels)[0]


def lexical_vectorizer():
    return TfidfVectorizer(analyzer=character_ngrams, min_df=2, sublinear_tf=True, dtype=np.float32)


def train_hybrid(messages, embeddings, labels):
    # Selección y calibración internas. La validación y el reto quedan fuera de los pliegues.
    weights = [0.5, 1.0, 1.5, 2.0]
    logits = {weight: np.empty((len(labels), len(np.unique(labels)))) for weight in weights}
    for train, holdout in fold_split(messages, labels):
        vec = lexical_vectorizer().fit(messages[train])
        train_chars, test_chars = vec.transform(messages[train]), vec.transform(messages[holdout])
        for weight in weights:
            design = hstack((csr_matrix(embeddings[train]), train_chars * weight), format="csr")
            testing = hstack((csr_matrix(embeddings[holdout]), test_chars * weight), format="csr")
            fitted = LogisticRegression(C=28, max_iter=600).fit(design, labels[train])
            logits[weight][holdout] = fitted.decision_function(testing)
    calibration = {weight: calibrate(out, labels) for weight, out in logits.items()}
    weight = min(weights, key=lambda candidate: calibration[candidate][1])
    vec = lexical_vectorizer().fit(messages)
    design = hstack((csr_matrix(embeddings), vec.transform(messages) * weight), format="csr")
    head = LogisticRegression(C=28, max_iter=600).fit(design, labels)
    terms = list(zip(vec.get_feature_names_out(), vec.idf_.tolist()))
    (MODEL / "lexical.json").write_text(json.dumps({"weight": weight, "terms": terms}, ensure_ascii=False) + "\n", encoding="utf-8")
    return head, calibration[weight][0], vec, weight


def export_head(model, temperature, path):
    weights = (model.coef_.T / temperature).astype(np.float32)
    bias = (model.intercept_ / temperature).astype(np.float32)
    graph = helper.make_graph([
        helper.make_node("MatMul", ["embedding", "weights"], ["product"]),
        helper.make_node("Add", ["product", "bias"], ["logits"]),
        helper.make_node("Softmax", ["logits"], ["probabilities"], axis=1),
    ], "rimy-intent", [helper.make_tensor_value_info("embedding", TensorProto.FLOAT, [None, weights.shape[0]])],
       [helper.make_tensor_value_info("probabilities", TensorProto.FLOAT, [None, weights.shape[1]])],
       [numpy_helper.from_array(weights, "weights"), numpy_helper.from_array(bias, "bias")])
    head = helper.make_model(graph, opset_imports=[helper.make_opsetid("", 17)], ir_version=9)
    onnx.checker.check_model(head)
    with tempfile.TemporaryDirectory() as folder:
        original = Path(folder) / "head.onnx"
        onnx.save(head, original)
        quantize_dynamic(original, path, weight_type=QuantType.QInt8, per_channel=True)
    onnx.checker.check_model(str(path))


def features(encoder, messages):
    # La cuantización dinámica depende de la escala de las activaciones del lote.
    # Ajusta y evalúa con la misma entrada de un solo mensaje que usa el servicio.
    return np.concatenate([encoder.encode([message]) for message in messages])


def onnx_probabilities(classifier, vectors):
    return np.concatenate([classifier.head.run(["probabilities"], {"embedding": vector[None, :]})[0] for vector in vectors])


def load_split(rows):
    return np.asarray([row["mensaje"] for row in rows]), np.asarray([row["intencion"] for row in rows])


def assess(labels, expected, probabilities):
    guessed = labels[probabilities.argmax(axis=1)]
    return {
        "accuracy": float(accuracy_score(expected, guessed)),
        "f1_macro": float(f1_score(expected, guessed, labels=labels, average="macro", zero_division=0)),
        "f1_por_clase": dict(zip(labels, f1_score(expected, guessed, labels=labels, average=None, zero_division=0).tolist())),
        "log_loss": float(log_loss(expected, probabilities, labels=labels)),
        "matriz_confusion": confusion_matrix(expected, guessed, labels=labels).tolist(),
        "errores": [{"indice": i, "esperado": truth, "predicho": guess, "confianza": round(float(probabilities[i].max()), 4)}
                    for i, (truth, guess) in enumerate(zip(expected, guessed)) if truth != guess],
    }


def summarize(samples):
    return dict(zip(("p50_ms", "p95_ms", "max_ms"), np.round(np.percentile(samples, [50, 95, 100]), 2).tolist()))


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--threads", type=int, default=2)
    parser.add_argument("--cpu", default=platform.processor() or platform.machine())
    parser.add_argument("--min-accuracy", type=float, default=0.90)
    args = parser.parse_args()
    rows = read_rows(ROOT / "intents.jsonl")
    train, target = load_split([row for row in rows if row["split"] == "train"])
    validation, expected = load_split([row for row in rows if row["split"] == "validation"])
    challenge, challenge_labels = load_split(read_rows(ROOT / "challenge.jsonl"))
    labels = np.unique(target)
    baseline, temp_baseline = fit_calibrated(make_pipeline(
        TfidfVectorizer(analyzer="char_wb", ngram_range=(2, 5), sublinear_tf=True, preprocessor=normalize),
        LogisticRegression(C=12, max_iter=600)), train, target)
    encoder = Encoder(MODEL, args.threads)
    vectors = features(encoder, train)
    head, temperature = fit_calibrated(LogisticRegression(C=28, max_iter=600), vectors, target)
    export_head(head, temperature, MODEL / "minilm.int8.onnx")
    hybrid, hybrid_temperature, vectorizer, lexical_weight = train_hybrid(train, vectors, target)
    export_head(hybrid, hybrid_temperature, MODEL / "intent.int8.onnx")
    (MODEL / "labels.json").write_text(json.dumps(labels.tolist(), ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    classifier = IntentClassifier(MODEL, args.threads, encoder=encoder)
    semantic = IntentClassifier(MODEL, args.threads, lexical=False, encoder=encoder)
    report = {"clases": labels.tolist(), "ejemplos": {"entrenamiento": len(train), "validacion": len(validation), "reto": len(challenge)}}
    pending = {}
    for name, messages, truth in [("validacion", validation, expected), ("reto", challenge, challenge_labels)]:
        baseline_proba = softmax(baseline.decision_function(messages) / temp_baseline, axis=1)
        semantic_vectors = features(encoder, messages)
        int8_proba = onnx_probabilities(semantic, semantic_vectors)
        lexical = classifier.lexical.encode(messages)
        hybrid_proba = onnx_probabilities(classifier, np.concatenate((semantic_vectors, lexical), axis=1))
        char_reference = vectorizer.transform(messages) * lexical_weight
        np.testing.assert_allclose(lexical, char_reference.toarray(), atol=1e-6)
        design = hstack((csr_matrix(semantic_vectors), char_reference), format="csr")
        fp32_proba = softmax(hybrid.decision_function(design) / hybrid_temperature, axis=1)
        report[name] = {"tfidf": assess(labels, truth, baseline_proba), "minilm_int8": assess(labels, truth, int8_proba),
                        "hibrido_int8": assess(labels, truth, hybrid_proba),
                        "acuerdo_head_hibrido_fp32_vs_int8": float(np.mean(hybrid_proba.argmax(axis=1) == fp32_proba.argmax(axis=1)))}
        pending[name] = messages
    samples, samples_semantic, samples_baseline = [], [], []
    for message in pending["validacion"]:
        start = perf_counter()
        classifier.classify(message)
        samples.append((perf_counter() - start) * 1000)
        start = perf_counter()
        semantic.classify(message)
        samples_semantic.append((perf_counter() - start) * 1000)
        start = perf_counter()
        softmax(baseline.decision_function([message]) / temp_baseline, axis=1)
        samples_baseline.append((perf_counter() - start) * 1000)
    report["cpu"] = {"procesador": args.cpu, "plataforma": platform.platform(), "hilos_onnx": args.threads,
                     "muestras_por_modelo": len(samples), "hibrido_int8": summarize(samples),
                     "minilm_int8": summarize(samples_semantic), "tfidf": summarize(samples_baseline)}
    report["bytes"] = {name: (MODEL / name).stat().st_size for name in ["encoder.onnx", "intent.int8.onnx", "minilm.int8.onnx", "lexical.json", "tokenizer.json", "labels.json"]}
    report["temperatura"] = {"tfidf": temp_baseline, "minilm": temperature, "hibrido": hybrid_temperature}
    report["peso_lexico_elegido_por_validacion_cruzada"] = lexical_weight
    (ROOT / "metrics.json").write_text(json.dumps(report, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    print(json.dumps({"validacion": {key: value["accuracy"] for key, value in report["validacion"].items() if isinstance(value, dict)},
                      "reto": {key: value["accuracy"] for key, value in report["reto"].items() if isinstance(value, dict)},
                      "cpu": report["cpu"], "bytes": report["bytes"]}, indent=2))
    if report["validacion"]["hibrido_int8"]["accuracy"] < args.min_accuracy or report["cpu"]["hibrido_int8"]["p95_ms"] >= 100:
        raise SystemExit("El modelo no alcanza la precisión o latencia mínima.")


if __name__ == "__main__":
    main()
