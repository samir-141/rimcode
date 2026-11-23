"""Genera el corpus reproducible y su conjunto independiente de regresión."""

import argparse
import json
import random
import re
import unicodedata
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def normalize(text):
    return " ".join(unicodedata.normalize("NFKC", text).casefold().split())


def read_examples(path, default_split):
    intent = None
    for raw in path.read_text(encoding="utf-8").splitlines():
        line = raw.strip()
        if not line or line.startswith("#"):
            continue
        if line.startswith("[") and line.endswith("]"):
            intent, split = line[1:-1], default_split
        elif line == "---":
            split = "validation"
        elif intent:
            for message in line.split("|"):
                yield {"mensaje": message.strip(), "intencion": intent, "split": split}
        else:
            raise ValueError(f"Falta la intención en {path}: {line}")


def write_rows(path, rows):
    with path.open("w", encoding="utf-8", newline="\n") as stream:
        for row in rows:
            stream.write(json.dumps(row, ensure_ascii=False) + "\n")


def read_rows(path):
    return [json.loads(line) for line in path.read_text(encoding="utf-8").splitlines() if line.strip()]


def deduplicate(rows):
    seen = {}
    for row in rows:
        key = re.sub(r"[^\w ]", "", normalize(row["mensaje"])).strip()
        existing = seen.get(key)
        if existing and existing["intencion"] != row["intencion"]:
            raise ValueError(f"Etiquetas en conflicto: {existing!r}, {row!r}")
        if not existing:
            seen[key] = row
    return list(seen.values())


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--extra", type=Path, help="Ejemplos JSONL revisados, reservados para entrenamiento")
    args = parser.parse_args()
    base = list(read_examples(ROOT / "examples.txt", "train"))
    challenge = list(read_examples(ROOT / "challenge.txt", "challenge"))
    extra = []
    if args.extra:
        for row in read_rows(args.extra):
            intent, message = row["intencion"], row["mensaje"].strip()
            if not re.fullmatch(r"[a-z_]{2,48}", intent) or not 2 <= len(message) <= 600:
                raise ValueError(f"Ejemplo inválido: {row!r}")
            extra.append({"mensaje": message, "intencion": intent, "split": "train"})
    rows = deduplicate(challenge + base + extra)
    fixtures = [row for row in rows if row["split"] == "challenge"]
    corpus = [row for row in rows if row["split"] != "challenge"]
    random.Random(2026).shuffle(corpus)
    write_rows(ROOT / "intents.jsonl", corpus)
    write_rows(ROOT / "challenge.jsonl", fixtures)
    print(Counter(row["split"] for row in rows))


if __name__ == "__main__":
    main()
