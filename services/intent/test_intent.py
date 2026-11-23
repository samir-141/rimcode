import io
import json
import math
import tempfile
import threading
import unittest
import urllib.error
import urllib.request
from collections import Counter
from pathlib import Path
from time import perf_counter

from classifier import RESERVATION_QUESTION
from dataset import ROOT, read_rows
from export_low_confidence import export_rows
from server import IntentServer


DIALOGUE = {
    "¿Cómo estás?": "charla_social",
    "¿Cómo hago una reserva?": "ambiguo_reserva",
    "¿Cómo realizo un pedido?": "cotizar",
    "¿Cómo me contatcto con el programador?": "contactar_programador",
    "¿Qué planes de host tienen?": "consultar_hosting",
}


class IntentTests(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.server = IntentServer(0, 0.55, 2)
        cls.worker = threading.Thread(target=cls.server.serve_forever, daemon=True)
        cls.worker.start()
        cls.url = f"http://127.0.0.1:{cls.server.server_port}"

    @classmethod
    def tearDownClass(cls):
        cls.server.shutdown()
        cls.server.server_close()
        cls.worker.join()

    def post(self, message, history=None, state=None):
        body = json.dumps({"mensaje": message, "historial_reciente": history or [], "estado": state or {}}).encode()
        request = urllib.request.Request(self.url + "/intent", data=body, headers={"Content-Type": "application/json"})
        with urllib.request.urlopen(request, timeout=2) as response:
            return json.load(response)

    def test_user_dialogue(self):
        for message, label in DIALOGUE.items():
            with self.subTest(message=message):
                result = self.post(message)
                self.assertEqual(label, result["intencion"])
                self.assertEqual(label == "ambiguo_reserva", result["necesita_aclaracion"])
                self.assertEqual(RESERVATION_QUESTION if label == "ambiguo_reserva" else None, result["pregunta_aclaracion"])

    def test_state_history_and_low_confidence(self):
        self.assertEqual("agendar_reunion", self.post("la reunión", [{"rol": "asistente", "contenido": RESERVATION_QUESTION}])["intencion"])
        self.assertEqual("cotizar", self.post("¿Y el otro?", state={"opcion_reserva": "agendar_reunion"})["intencion"])
        self.assertEqual("consultar_hosting", self.post("¿Qué planes de host tienen?", state={"flujo_activo": "aclarar_reserva"})["intencion"])
        self.assertEqual("consultar_precios", self.post("¿Y al mes?", state={"flujo_activo": "cotizacion", "landing_elegida": {}})["intencion"])
        self.assertTrue(self.post("¿Y el otro?")["necesita_aclaracion"])
        self.assertTrue(self.server.classifier.classify("tema sin pistas claras", threshold=1)["necesita_aclaracion"])

    def test_held_out_data_and_cpu(self):
        corpus = read_rows(ROOT / "intents.jsonl")
        challenge = read_rows(ROOT / "challenge.jsonl")
        sizes = Counter(row["intencion"] for row in corpus)
        self.assertGreaterEqual(sizes.pop("otro"), 100)
        self.assertTrue(all(40 <= count <= 60 for count in sizes.values()))
        self.assertTrue(all(count == 15 for count in Counter(row["intencion"] for row in challenge).values()))
        validation = [row for row in corpus if row["split"] == "validation"]
        self.assertAlmostEqual(len(validation) / len(corpus), 0.2, delta=0.005)
        self.assertFalse({row["mensaje"] for row in corpus} & {row["mensaje"] for row in challenge})
        for rows in [validation, challenge]:
            successes, timings = 0, []
            for row in rows:
                start = perf_counter()
                result = self.server.classifier.classify(row["mensaje"])
                timings.append((perf_counter() - start) * 1000)
                self.assertIn(result["intencion"], self.server.classifier.labels)
                self.assertTrue(0 <= result["confianza"] <= 1)
                successes += result["intencion"] == row["intencion"]
            self.assertGreaterEqual(successes / len(rows), 0.9, f"{successes}/{len(rows)} aciertos")
            self.assertLess(sorted(timings)[math.ceil(len(rows) * 0.95) - 1], 100)

    def test_invalid_payload(self):
        with self.assertRaises(urllib.error.HTTPError) as error:
            self.post("hola", [{"rol": "tool", "contenido": "texto"}])
        self.assertEqual(error.exception.code, 400)

    def test_export_low_confidence(self):
        entries = [
            {"evento": "turno", "turno": "a", "intencion": "otro", "confianza": 0.31, "mensaje": "dato [correo omitido]"},
            {"evento": "boton_clic", "turno": "a"},
            {"evento": "turno", "turno": "b", "intencion": "saludo", "confianza": 0.99, "mensaje": "holis"},
        ]
        with tempfile.TemporaryDirectory() as directory:
            directory = Path(directory)
            (directory / "turnos-2026-11-23.jsonl").write_text("\n".join(map(json.dumps, entries)), encoding="utf-8")
            output = io.StringIO()
            self.assertEqual(1, export_rows(directory, output, 0.55))
            row = json.loads(output.getvalue())
            self.assertEqual("dato [correo omitido]", row["mensaje"])
            self.assertIsNone(row["intencion"])


if __name__ == "__main__":
    unittest.main()
