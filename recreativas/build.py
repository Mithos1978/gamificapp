#!/usr/bin/env python3
"""Compila cada juego de src/juegos/*.js en un HTML autónomo (sin dependencias externas).

Uso: python3 build.py            # genera NN-nombre.html junto a este script
"""
import pathlib
import re
import sys

RAIZ = pathlib.Path(__file__).resolve().parent
SRC = RAIZ / "src"


def main() -> int:
    shell = (SRC / "shell.html").read_text(encoding="utf-8")
    css = (SRC / "core.css").read_text(encoding="utf-8")
    core = (SRC / "core.js").read_text(encoding="utf-8")
    juegos = sorted((SRC / "juegos").glob("*.js"))
    if not juegos:
        print("No hay juegos en src/juegos", file=sys.stderr)
        return 1
    for ruta in juegos:
        js = ruta.read_text(encoding="utf-8")
        m = re.search(r"titulo:\s*'([^']+)'", js)
        titulo = m.group(1) if m else ruta.stem
        for nombre, trozo in (("core.js", core), (ruta.name, js)):
            if "</script" in trozo.lower():
                print(f"{nombre}: contiene '</script', rompería el HTML", file=sys.stderr)
                return 1
        html = (shell.replace("{{TITULO}}", titulo).replace("{{CSS}}", css)
                .replace("{{CORE}}", core).replace("{{JUEGO}}", js))
        salida = RAIZ / f"{ruta.stem}.html"
        salida.write_text(html, encoding="utf-8")
        print(f"{salida.name}  ({len(html) // 1024} kB)")
    return 0


if __name__ == "__main__":
    sys.exit(main())
