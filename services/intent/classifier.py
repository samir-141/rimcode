"""Inferencia local. El clasificador solo devuelve etiquetas y probabilidades."""

import json
import re
import unicodedata
from collections import Counter
from pathlib import Path

import numpy as np
import onnxruntime as ort
from tokenizers import Tokenizer

from dataset import normalize

MODEL = Path(__file__).resolve().parent / "model"
RESERVATION_QUESTION = "¿Quieres agendar una reunión o solicitar una cotización?"
GENERAL_QUESTION = "¿Quieres cotizar, consultar por hosting o hablar con el programador?"
CHOICES = {"agendar_reunion": "cotizar", "cotizar": "agendar_reunion"}


def cpu_session(path, threads):
    options = ort.SessionOptions()
    options.intra_op_num_threads = threads
    options.inter_op_num_threads = 1
    return ort.InferenceSession(str(path), sess_options=options, providers=["CPUExecutionProvider"])


class Encoder:
    def __init__(self, directory, threads):
        self.session = cpu_session(directory / "encoder.onnx", threads)
        self.tokenizer = Tokenizer.from_file(str(directory / "tokenizer.json"))
        self.tokenizer.enable_truncation(max_length=64)
        self.tokenizer.enable_padding(pad_id=1, pad_token="<pad>")
        self.inputs = {entry.name for entry in self.session.get_inputs()}

    def encode(self, messages):
        tokens = self.tokenizer.encode_batch([normalize(text) for text in messages])
        inputs = {
            "input_ids": np.asarray([token.ids for token in tokens], dtype=np.int64),
            "attention_mask": np.asarray([token.attention_mask for token in tokens], dtype=np.int64),
            "token_type_ids": np.asarray([token.type_ids for token in tokens], dtype=np.int64),
        }
        (hidden,) = self.session.run(["last_hidden_state"], {key: inputs[key] for key in self.inputs})
        mask = inputs["attention_mask"][..., None].astype(np.float32)
        vectors = (hidden * mask).sum(axis=1) / mask.sum(axis=1)
        return vectors / np.maximum(np.linalg.norm(vectors, axis=1, keepdims=True), 1e-12)


def character_ngrams(text):
    for word in normalize(text).split():
        padded = f" {word} "
        for size in range(2, min(len(padded), 5) + 1):
            yield from (padded[index:index + size] for index in range(len(padded) - size + 1))


class LexicalFeatures:
    def __init__(self, path):
        params = json.loads(path.read_text(encoding="utf-8"))
        self.vocabulary = {term: (index, idf) for index, (term, idf) in enumerate(params["terms"])}
        self.weight = params["weight"]

    def encode(self, messages):
        features = np.zeros((len(messages), len(self.vocabulary)), dtype=np.float32)
        for row, message in zip(features, messages):
            counts = Counter(term for term in character_ngrams(message) if term in self.vocabulary)
            for term, count in counts.items():
                index, idf = self.vocabulary[term]
                row[index] = (1 + np.log(count)) * idf
        return features * (self.weight / np.maximum(np.linalg.norm(features, axis=1, keepdims=True), 1e-12))


class IntentClassifier:
    def __init__(self, directory=MODEL, threads=2, lexical=True, encoder=None):
        self.encoder = encoder or Encoder(directory, threads)
        self.lexical = LexicalFeatures(directory / "lexical.json") if lexical else None
        self.head = cpu_session(directory / ("intent.int8.onnx" if lexical else "minilm.int8.onnx"), 1)
        self.labels = json.loads((directory / "labels.json").read_text(encoding="utf-8"))

    def probabilities(self, messages):
        features = self.encoder.encode(messages)
        if self.lexical:
            features = np.concatenate((features, self.lexical.encode(messages)), axis=1)
        return self.head.run(["probabilities"], {"embedding": features})[0]

    def classify(self, message, history=(), state=None, threshold=0.55):
        state = state or {}
        phrase = context_words(message)
        choice = reservation_followup(phrase, history, state)
        if choice:
            return verdict(choice, 1.0, threshold)
        if alternative(phrase):
            return verdict("otro", 0.0, threshold)
        if state.get("flujo_activo") == "cotizacion" and isinstance(state.get("landing_elegida"), dict) and re.fullmatch(
                r"(?:y )?(?:con todo|todo incluido|al mes|por mes|mensual|al ano|por ano|anual)", phrase):
            return verdict("consultar_precios", 1.0, threshold)
        probabilities = self.probabilities([message])[0]
        best = int(probabilities.argmax())
        return verdict(self.labels[best], float(probabilities[best]), threshold)


def context_words(message):
    normalized = unicodedata.normalize("NFKD", normalize(message))
    return " ".join(re.findall(r"[a-z]+", "".join(c for c in normalized if not unicodedata.combining(c))))


def reservation_followup(phrase, history, state):
    last_bot = next((turn["contenido"] for turn in reversed(history) if turn["rol"] == "asistente"), None)
    active = state.get("flujo_activo")
    if active == "aclarar_reserva" or (not active and last_bot == RESERVATION_QUESTION):
        if re.fullmatch(r"(?:(?:una?|la|la primera|quiero|por favor|para|prefiero) )*(?:reunion|reu|cita|llamada|agendar|primera)(?: por favor)?", phrase):
            return "agendar_reunion"
        if re.fullmatch(r"(?:(?:una?|la|quiero|por favor|para|prefiero) )*(?:cotizacion|cotisar|cotizar|presupuesto|segunda)(?: por favor)?", phrase):
            return "cotizar"
    last = state.get("opcion_reserva")
    if isinstance(last, str) and last in CHOICES and alternative(phrase):
        return CHOICES[last]
    return None


def alternative(phrase):
    return bool(re.fullmatch(r"(?:y )?(?:la otra(?: opcion)?|el otro|otra opcion)", phrase))


def verdict(intent, confidence, threshold):
    clarify = intent == "ambiguo_reserva" or confidence < threshold
    return {
        "intencion": intent,
        "confianza": round(confidence, 4),
        "necesita_aclaracion": clarify,
        "pregunta_aclaracion": (RESERVATION_QUESTION if intent == "ambiguo_reserva" else GENERAL_QUESTION) if clarify else None,
    }
