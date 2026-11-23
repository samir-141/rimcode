"""Servicio HTTP privado de inferencia, servible en una VPS con Python y ONNX Runtime CPU."""

import json
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from threading import BoundedSemaphore

from classifier import IntentClassifier


def parse_payload(payload):
    if not isinstance(payload, dict):
        raise ValueError("Envía un objeto JSON.")
    message = payload.get("mensaje")
    if not isinstance(message, str) or not 2 <= len(message.strip()) <= 600 or len(message) > 600:
        raise ValueError("mensaje debe tener entre 2 y 600 caracteres.")
    history = payload.get("historial_reciente", [])
    state = payload.get("estado", {})
    if not isinstance(history, list) or len(history) > 6 or not isinstance(state, dict):
        raise ValueError("historial_reciente debe ser una lista de hasta 6 turnos y estado un objeto.")
    for turn in history:
        if (not isinstance(turn, dict) or turn.get("rol") not in ("usuario", "asistente") or
                not isinstance(turn.get("contenido"), str) or len(turn["contenido"]) > 1200):
            raise ValueError("Cada turno requiere rol y contenido de hasta 1200 caracteres.")
    return message.strip(), history, state


class IntentServer(ThreadingHTTPServer):
    daemon_threads = True

    def __init__(self, port, threshold, threads):
        self.classifier = IntentClassifier(threads=threads)
        self.threshold = threshold
        self.slots = BoundedSemaphore(2)
        super().__init__(("127.0.0.1", port), IntentHandler)

    def get_request(self):
        connection, address = super().get_request()
        connection.settimeout(2)
        return connection, address


class IntentHandler(BaseHTTPRequestHandler):
    def log_message(self, _format, *_args):
        pass  # El registro de turnos se hace en el chat, donde se conoce la respuesta efectiva.

    def respond(self, status, payload):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Cache-Control", "no-store")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        if self.path == "/health":
            return self.respond(200, {"ok": True, "clases": self.server.classifier.labels})
        self.respond(404, {"error": "Ruta desconocida."})

    def do_POST(self):
        if self.path != "/intent":
            return self.respond(404, {"error": "Ruta desconocida."})
        if self.headers.get_content_type() != "application/json":
            return self.respond(415, {"error": "Envía un objeto JSON."})
        try:
            size = int(self.headers.get("Content-Length", "0"))
            if size > 16_384:
                return self.respond(413, {"error": "La solicitud es demasiado grande."})
            if size <= 0:
                raise ValueError("Falta el cuerpo de la solicitud.")
            message, history, state = parse_payload(json.loads(self.rfile.read(size)))
        except (UnicodeError, json.JSONDecodeError, RecursionError):
            return self.respond(400, {"error": "JSON inválido."})
        except (ValueError, TimeoutError) as error:
            return self.respond(400, {"error": str(error)})
        if not self.server.slots.acquire(blocking=False):
            return self.respond(503, {"error": "Clasificador ocupado."})
        try:
            result = self.server.classifier.classify(message, history, state, self.server.threshold)
        finally:
            self.server.slots.release()
        self.respond(200, result)


if __name__ == "__main__":
    port = int(os.environ.get("RIMY_INTENT_PORT", "8820"))
    threshold = float(os.environ.get("RIMY_INTENT_THRESHOLD", "0.55"))
    threads = int(os.environ.get("RIMY_INTENT_THREADS", "2"))
    if not 0 <= threshold <= 1 or not 1 <= threads <= 16:
        raise SystemExit("Revisa RIMY_INTENT_THRESHOLD y RIMY_INTENT_THREADS.")
    with IntentServer(port, threshold, threads) as server:
        print(f"Rimy intent en http://127.0.0.1:{server.server_port}/intent", flush=True)
        server.serve_forever()
