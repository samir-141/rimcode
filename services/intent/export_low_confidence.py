"""Exporta los turnos que conviene revisar antes de etiquetarlos para entrenamiento."""

import argparse
import json
import sys
from pathlib import Path


def export_rows(directory, output, maximum_confidence):
    count = 0
    for path in sorted(directory.glob("turnos-*.jsonl")):
        with path.open(encoding="utf-8") as stream:
            for line in stream:
                try:
                    entry = json.loads(line)
                except json.JSONDecodeError:
                    print(f"Línea incompleta omitida en {path.name}", file=sys.stderr)
                    continue
                if entry.get("evento") != "turno" or entry["confianza"] >= maximum_confidence:
                    continue
                record = {"turno": entry["turno"], "mensaje": entry["mensaje"], "intencion_predicha": entry["intencion"],
                          "confianza": entry["confianza"], "intencion": None}
                output.write(json.dumps(record, ensure_ascii=False) + "\n")
                count += 1
    return count


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("log_dir", type=Path)
    parser.add_argument("output", type=Path)
    parser.add_argument("--threshold", type=float, default=0.55)
    args = parser.parse_args()
    if not 0 <= args.threshold <= 1 or not args.log_dir.is_dir() or args.output.resolve().parent == args.log_dir.resolve():
        parser.error("Usa un umbral de 0 a 1 y guarda el resultado fuera del directorio de registros.")
    with args.output.open("x", encoding="utf-8", newline="\n") as output:
        print(f"{export_rows(args.log_dir, output, args.threshold)} turnos exportados para revisión.")


if __name__ == "__main__":
    main()
