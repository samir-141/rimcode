"""Descarga el encoder int8 y tokenizer fijados. Ejecutar solo al preparar el despliegue."""

import hashlib
import shutil
import urllib.request
from pathlib import Path

DIRECTORY = Path(__file__).resolve().parent / "model"
SOURCE = "https://huggingface.co/sentence-transformers/paraphrase-multilingual-MiniLM-L12-v2/resolve/e8f8c211226b894fcb81acc59f3b34ba3efd5f42/"
ARTIFACTS = {
    "encoder.onnx": ("onnx/model_quint8_avx2.onnx", "98a01d88b7de996cdea58c32ca71208c09968d143798814b2ea09d3439dc334f"),
    "tokenizer.json": ("tokenizer.json", "2c3387be76557bd40970cec13153b3bbf80407865484b209e655e5e4729076b8"),
}


def sha256(path):
    with path.open("rb") as stream:
        return hashlib.file_digest(stream, "sha256").hexdigest()


def main():
    DIRECTORY.mkdir(exist_ok=True)
    for name, (remote, expected) in ARTIFACTS.items():
        destination = DIRECTORY / name
        if destination.is_file() and sha256(destination) == expected:
            print(f"{name} verificado")
            continue
        partial = destination.with_suffix(".part")
        try:
            with urllib.request.urlopen(SOURCE + remote, timeout=60) as response, partial.open("wb") as output:
                shutil.copyfileobj(response, output)
            if sha256(partial) != expected:
                raise ValueError(f"SHA-256 inesperado en {name}")
            partial.replace(destination)
            print(f"{name} instalado")
        finally:
            partial.unlink(missing_ok=True)


if __name__ == "__main__":
    main()
