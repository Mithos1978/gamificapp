#!/usr/bin/env python3
"""Valida un config.json de Ludocaptura y genera el juego como un único HTML.

Uso: python build.py config.json -o juego.html
"""
import argparse
import base64
import json
import re
import sys
from urllib.parse import quote
from pathlib import Path

RAREZAS = ("comun", "raro", "epico", "legendario")
MODOS = ("off", "suave", "estricto")


def validar(cfg):
    err, avisos = [], []
    for k in ("id", "titulo", "criaturas"):
        if not cfg.get(k):
            err.append(f"Falta el campo obligatorio «{k}».")
    if cfg.get("id") and not re.fullmatch(r"[a-z0-9-]+", str(cfg["id"])):
        err.append("«id» solo admite minúsculas, números y guiones.")
    ids = set()
    for i, c in enumerate(cfg.get("criaturas") or []):
        d = f"criaturas[{i}] ({c.get('nombre', '?')})"
        for k in ("id", "nombre", "rareza", "preguntas"):
            if not c.get(k):
                err.append(f"{d}: falta «{k}».")
        if c.get("id") in ids:
            err.append(f"{d}: id repetido «{c.get('id')}».")
        ids.add(c.get("id"))
        if c.get("rareza") and c["rareza"] not in RAREZAS:
            err.append(f"{d}: rareza «{c['rareza']}» no válida; usa {', '.join(RAREZAS)}.")
        if not (c.get("medalla") or {}).get("nombre"):
            avisos.append(f"{d}: sin medalla.nombre; no se anunciará medalla al capturarlo.")
        pregs = c.get("preguntas") or []
        if len(pregs) == 1:
            avisos.append(f"{d}: solo 1 pregunta; si falla, se repetirá la misma.")
        for j, p in enumerate(pregs):
            dp = f"{d} pregunta {j + 1}"
            ops = p.get("opciones") or []
            if not p.get("texto"):
                err.append(f"{dp}: falta «texto».")
            if not 2 <= len(ops) <= 4:
                err.append(f"{dp}: debe tener entre 2 y 4 opciones.")
            if len(set(ops)) != len(ops):
                err.append(f"{dp}: opciones repetidas.")
            if not isinstance(p.get("correcta"), int) or not 0 <= p["correcta"] < len(ops):
                err.append(f"{dp}: «correcta» debe ser el índice (desde 0) de la opción correcta.")
    usados = []
    for i, z in enumerate(cfg.get("zonas") or []):
        if not z.get("nombre") or not z.get("criaturas"):
            err.append(f"zonas[{i}]: necesita «nombre» y «criaturas».")
        for cid in z.get("criaturas") or []:
            if cid not in ids:
                err.append(f"zonas[{i}]: la criatura «{cid}» no existe.")
            usados.append(cid)
    if cfg.get("zonas"):
        for cid in ids - set(usados):
            err.append(f"La criatura «{cid}» no está en ninguna zona: sería imposible encontrarla.")
        for cid in {c for c in usados if usados.count(c) > 1}:
            err.append(f"La criatura «{cid}» aparece en más de una zona.")
    pts = cfg.get("puntos") or {}
    if pts.get("modo", "off") not in MODOS:
        err.append(f"puntos.modo debe ser uno de: {', '.join(MODOS)}.")
    um = pts.get("umbrales") or {}
    for k in um:
        if k not in RAREZAS:
            err.append(f"puntos.umbrales: rareza desconocida «{k}».")
    vals = [um.get(r, 0) for r in RAREZAS]
    if vals != sorted(vals):
        avisos.append("puntos.umbrales no crece con la rareza (común ≤ raro ≤ épico ≤ legendario).")
    return err, avisos


def main():
    ap = argparse.ArgumentParser(description=__doc__)
    ap.add_argument("config")
    ap.add_argument("-o", "--salida", required=True)
    a = ap.parse_args()

    cfg = json.loads(Path(a.config).read_text(encoding="utf-8"))
    err, avisos = validar(cfg)
    for w in avisos:
        print("AVISO:", w)
    if err:
        for e in err:
            print("ERROR:", e, file=sys.stderr)
        sys.exit(1)

    plantilla = (Path(__file__).resolve().parent.parent / "assets" / "plantilla.html").read_text(encoding="utf-8")
    marca = "/*__CONFIG__*/null/*__FIN__*/"
    if marca not in plantilla:
        sys.exit("ERROR: la plantilla no contiene el marcador de configuración.")
    # La palabra clave no viaja legible: se ofusca como en los demás juegos de la Oca (no es un secreto fuerte).
    fin = cfg.get("final") or {}
    if fin.get("palabra"):
        txt, k = quote(str(fin.pop("palabra"))), "ludo:" + cfg["id"]
        fin["clave"] = base64.b64encode(bytes(ord(c) ^ ord(k[i % len(k)]) for i, c in enumerate(txt))).decode()
    datos = json.dumps(cfg, ensure_ascii=False).replace("</", "<\\/")
    html = plantilla.replace(marca, datos)
    Path(a.salida).write_text(html, encoding="utf-8")
    n = len(cfg["criaturas"])
    print(f"OK: {a.salida} ({n} criaturas, {sum(len(c['preguntas']) for c in cfg['criaturas'])} preguntas)")


if __name__ == "__main__":
    main()
