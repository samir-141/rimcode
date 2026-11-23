"""Servicio privado de síntesis para respuestas verificadas de Rimy."""

import argparse
from collections import OrderedDict
from hashlib import sha256
from hmac import compare_digest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from io import BytesIO
import json
import logging
import os
from pathlib import Path
import re
import select
import socket
from threading import BoundedSemaphore, Lock
from time import perf_counter
from unicodedata import normalize

MAX_TEXT = 1800
MAX_WAV = 14_000_000
CACHE_BYTES = 32 * 1024 * 1024
VOICE_DESIGN = (
    "Voz juvenil, cálida y amigable, de español latinoamericano natural, con "
    "pronunciación clara y una entonación conversacional. Expresa curiosidad y "
    "entusiasmo moderado, utiliza pausas naturales, evita una cadencia robótica "
    "y mantiene un estilo profesional y cercano."
)


def split_text(text, width=270):
    parts = []
    for sentence in re.split(r"(?<=[.!?…])\s+", text):
        while len(sentence) > width:
            split = sentence.rfind(" ", 0, width + 1)
            split = split if split > 0 else width
            parts.append(sentence[:split])
            sentence = sentence[split:].lstrip()
        if sentence:
            parts.append(sentence)
    return parts


class Voice:
    def __init__(self, engine, device, profile_version):
        self.engine = engine
        self.sampling_rate = 24000
        if engine == "kokoro":
            from kokoro import KPipeline
            self.model = KPipeline(lang_code="e", repo_id="hexgrad/Kokoro-82M", device=device)
            self.profile = os.getenv("RIMY_KOKORO_VOICE", "ef_dora")
            self.model.load_voice(self.profile)
        else:
            import torch
            from huggingface_hub import snapshot_download
            from qwen_tts import Qwen3TTSModel
            model_name = (
                "Qwen/Qwen3-TTS-12Hz-1.7B-VoiceDesign" if engine == "qwen-design"
                else "Qwen/Qwen3-TTS-12Hz-0.6B-CustomVoice"
            )
            dtype = torch.bfloat16 if device.startswith("cuda") and torch.cuda.is_bf16_supported() else (
                torch.float16 if device.startswith("cuda") else torch.float32
            )
            model_dir = snapshot_download(model_name)
            self.model = Qwen3TTSModel.from_pretrained(model_dir, device_map=device, dtype=dtype)
            self.profile = (os.getenv("RIMY_QWEN_STYLE", VOICE_DESIGN) if engine == "qwen-design"
                            else os.getenv("RIMY_QWEN_SPEAKER", "Ryan"))
        self.version = f"{engine}:{self.profile}:{profile_version}:es"

    def samples(self, text):
        import numpy as np
        if self.engine == "kokoro":
            outputs = [part.audio.numpy() for part in self.model(text, voice=self.profile) if part.audio is not None]
            return np.concatenate(outputs) if outputs else np.array([], dtype=np.float32), self.sampling_rate
        if self.engine == "qwen-design":
            audio, rate = self.model.generate_voice_design(text=text, language="Spanish", instruct=self.profile)
        else:
            audio, rate = self.model.generate_custom_voice(text=text, language="Spanish", speaker=self.profile)
        return audio[0], rate

    def wav(self, text, cancelled=lambda: False):
        import numpy as np
        import soundfile as sf

        audio = []
        for segment in split_text(text):
            if cancelled():
                return None
            samples, rate = self.samples(segment)
            if samples.size < rate * 0.1 or not np.isfinite(samples).all() or np.max(np.abs(samples)) < 0.0001:
                raise ValueError("El modelo produjo una señal vacía")
            if audio:
                audio.append(np.zeros(int(rate * 0.13), dtype=np.float32))
            audio.append(samples)
        if not audio or cancelled():
            return None
        buffer = BytesIO()
        sf.write(buffer, np.concatenate(audio), rate, format="WAV", subtype="PCM_16")
        result = buffer.getvalue()
        if len(result) > MAX_WAV:
            raise ValueError("El audio excedió el tamaño permitido")
        return result


class VoiceService(ThreadingHTTPServer):
    daemon_threads = True
    request_queue_size = 12

    def __init__(self, address, voice, token):
        super().__init__(address, Handler)
        self.voice = voice
        self.token = token
        self.worker = BoundedSemaphore(1)
        self.connections = BoundedSemaphore(12)
        self.cache_lock = Lock()
        self.cache = OrderedDict()
        self.cache_size = 0

    def process_request(self, request, address):
        if not self.connections.acquire(blocking=False):
            self.shutdown_request(request)
            return
        try:
            super().process_request(request, address)
        except Exception:
            self.connections.release()
            raise

    def process_request_thread(self, request, address):
        try:
            super().process_request_thread(request, address)
        finally:
            self.connections.release()

    def read_cache(self, key):
        with self.cache_lock:
            result = self.cache.get(key)
            if result is not None:
                self.cache.move_to_end(key)
            return result

    def cache_audio(self, key, result):
        with self.cache_lock:
            previous = self.cache.pop(key, b"")
            self.cache[key] = result
            self.cache_size += len(result) - len(previous)
            while self.cache_size > CACHE_BYTES:
                _, oldest = self.cache.popitem(last=False)
                self.cache_size -= len(oldest)


class Handler(BaseHTTPRequestHandler):
    server_version = "RimyVoice"

    def setup(self):
        self.request.settimeout(8)
        super().setup()

    def log_message(self, *_args):
        pass

    def output(self, status, content=b"", content_type="application/json", duration=None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        if duration is not None:
            self.send_header("Server-Timing", f"tts;dur={duration:.1f}")
        self.end_headers()
        self.wfile.write(content)

    def authorized(self):
        provided = self.headers.get("Authorization", "").encode()
        return compare_digest(provided, self.server.token)

    def disconnected(self):
        try:
            ready, _, _ = select.select([self.connection], [], [], 0)
            return bool(ready and not self.connection.recv(1, socket.MSG_PEEK))
        except OSError:
            return True

    def do_GET(self):
        if not self.authorized():
            return self.output(401, b"{}")
        if self.path != "/health":
            return self.output(404, b"{}")
        self.output(200, b'{"ready":true}')

    def do_POST(self):
        if not self.authorized():
            return self.output(401, b"{}")
        if self.path != "/synthesize":
            return self.output(404, b"{}")
        if self.headers.get_content_type() != "application/json":
            return self.output(415, b"{}")
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length < 1 or length > 14_000:
                return self.output(413, b"{}")
            payload = json.loads(self.rfile.read(length))
            text = payload.get("text") if isinstance(payload, dict) else None
            if not isinstance(text, str) or len(text) > MAX_TEXT:
                return self.output(422, b"{}")
            text = " ".join(normalize("NFC", text).split())
            if not text or not any(ch.isalnum() for ch in text):
                return self.output(422, b"{}")
        except (ValueError, OSError):
            return self.output(400, b"{}")

        cacheable = payload.get("cache") == "public-answer"
        key = sha256(f"{self.server.voice.version}\0{text}".encode()).digest()
        started = perf_counter()
        result = self.server.read_cache(key) if cacheable else None
        cached = result is not None
        if result is None:
            if not self.server.worker.acquire(blocking=False):
                return self.output(503, b"{}")
            try:
                result = self.server.read_cache(key) if cacheable else None
                cached = result is not None
                if result is None:
                    result = self.server.voice.wav(text, self.disconnected)
                    if result is not None and cacheable:
                        self.server.cache_audio(key, result)
            except Exception as error:
                logging.error("Síntesis fallida (%s)", type(error).__name__)
                return self.output(502, b"{}")
            finally:
                self.server.worker.release()
        if result is None or self.disconnected():
            return

        elapsed = (perf_counter() - started) * 1000
        logging.info("engine=%s cached=%s total_ms=%.1f bytes=%d", self.server.voice.engine, cached, elapsed, len(result))
        try:
            self.output(200, result, "audio/wav", elapsed)
        except OSError:
            pass


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--engine", choices=("qwen-design", "qwen-custom", "kokoro"), default="qwen-design")
    parser.add_argument("--device", default="cuda:0")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=8810)
    parser.add_argument("--warm-faq", type=Path, action="append", default=[])
    args = parser.parse_args()
    token = os.environ.get("RIMY_TTS_TOKEN", "")
    if len(token) < 24:
        parser.error("Configura RIMY_TTS_TOKEN con al menos 24 caracteres")
    logging.basicConfig(level=logging.INFO, format="%(asctime)s %(message)s")
    logging.getLogger("httpx").setLevel(logging.WARNING)
    started = perf_counter()
    voice = Voice(args.engine, args.device, os.environ.get("RIMY_TTS_PROFILE_VERSION", "v1"))
    voice.wav("Hola. Soy Rimy.")
    logging.info("engine=%s preload_ms=%.1f", args.engine, (perf_counter() - started) * 1000)
    with VoiceService((args.host, args.port), voice, f"Bearer {token}".encode()) as server:
        for faq_path in args.warm_faq:
            items = json.loads(faq_path.read_text(encoding="utf-8"))["items"]
            for item in items:
                text = " ".join(normalize("NFC", item["answer"]).split())
                if not text or len(text) > MAX_TEXT:
                    continue
                key = sha256(f"{voice.version}\0{text}".encode()).digest()
                if server.read_cache(key) is None:
                    result = voice.wav(text)
                    if result:
                        server.cache_audio(key, result)
        logging.info("Síntesis disponible en el puerto %d", args.port)
        server.serve_forever()


if __name__ == "__main__":
    main()
