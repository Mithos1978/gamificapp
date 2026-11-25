#!/usr/bin/env python3
"""Valida un config.json de reel-comenta y genera dos páginas:

  <slug>-guia.html  la guía bilingüe (castellano/valenciano) que recibe quien comenta
  <slug>-kit.html   el kit de publicación (texto del post, mensajes, automatización), solo para ti

Uso: python build.py config.json -o carpeta_de_salida/
"""
import argparse
import html
import json
import re
import sys
from pathlib import Path

PLANTILLA = Path(__file__).resolve().parent.parent / "assets" / "plantilla.html"
LANGS = ("es", "va")
# Formas más catalanas que valencianas: solo avisan, no bloquean.
NO_VALENCIANO = {
    r"\baquest(a|s|es)?\b": "este/esta/estos/estes",
    r"\bserveix\b": "servix",
    r"\bsegueix(en)?\b": "seguix/seguixen",
    r"\bsurt(en)?\b": "ix/ixen",
    r"\bavui\b": "hui",
    r"\bnoi(a|s|es)?\b": "xic/xica",
    r"\bsortir\b": "eixir",
}


class Check:
    def __init__(self):
        self.err, self.avisos = [], []

    def bi(self, obj, ruta):
        """Campo bilingüe {"es": ..., "va": ...} con los dos textos."""
        if not isinstance(obj, dict):
            self.err.append(f"{ruta}: debe ser {{\"es\": \"…\", \"va\": \"…\"}}.")
            return
        for l in LANGS:
            if not isinstance(obj.get(l), str) or not obj[l].strip():
                self.err.append(f"{ruta}.{l}: falta el texto.")
        va = obj.get("va") or ""
        for pat, alt in NO_VALENCIANO.items():
            m = re.search(pat, va, re.I)
            if m:
                self.avisos.append(f"{ruta}.va: «{m.group(0)}» suena más catalán que valenciano; prueba con «{alt}».")

    def txt(self, v, ruta):
        if not isinstance(v, str) or not v.strip():
            self.err.append(f"{ruta}: falta el texto.")

    def lista(self, v, ruta, minimo=1):
        if not isinstance(v, list) or len(v) < minimo:
            self.err.append(f"{ruta}: debe ser una lista con al menos {minimo} elemento(s).")
            return []
        return v


def validar(c):
    k = Check()
    if not re.fullmatch(r"[a-z0-9-]+", str(c.get("slug", ""))):
        k.err.append("slug: solo minúsculas, números y guiones (p. ej. «paella»).")
    pal = str(c.get("palabra", ""))
    if not re.fullmatch(r"[A-Z0-9]{3,14}", pal):
        k.err.append("palabra: entre 3 y 14 letras MAYÚSCULAS o números, sin tildes, ñ, ç, apóstrofos ni espacios "
                     "(la IA las dibuja mal en el cristal y la gente las escribe de formas distintas).")
    k.bi(c.get("titulo"), "titulo")
    marca = c.get("marca") or {}
    if not (marca.get("usuario") or marca.get("nombre")):
        k.err.append("marca: pon al menos «usuario» (tu @) o «nombre».")
    elif "tu_cuenta" in str(marca.get("usuario", "")):
        k.avisos.append("marca.usuario: sigue siendo «@tu_cuenta»; cámbialo por tu usuario real.")
    v = c.get("video")
    if v is not None and not (isinstance(v, dict) and v.get("src")):
        k.err.append("video: usa null o {\"src\": \"media/reel.mp4\", \"poster\": \"media/portada.jpg\"}; src puede ser {\"es\": …, \"va\": …} si cada idioma tiene su vídeo.")
    elif v is None:
        k.avisos.append("video: sin vídeo; la guía mostrará el cristal con la palabra en su lugar.")

    t = c.get("textos") or {}
    for f in ("eyebrow", "titular", "titular2", "entradilla"):
        k.bi(t.get(f), f"textos.{f}")
    for i, d in enumerate(k.lista(c.get("datos"), "datos")):
        if not isinstance(d, str):
            k.bi(d, f"datos[{i}]")

    n = c.get("necesitas") or {}
    k.bi(n.get("sub"), "necesitas.sub")
    for i, it in enumerate(k.lista(n.get("items"), "necesitas.items")):
        k.bi(it.get("titulo"), f"necesitas.items[{i}].titulo")
        k.bi(it.get("texto"), f"necesitas.items[{i}].texto")

    reel, ids = [], set()
    for si, s in enumerate(k.lista(c.get("secciones"), "secciones")):
        r = f"secciones[{si}]"
        k.bi(s.get("titulo"), f"{r}.titulo")
        k.bi(s.get("sub"), f"{r}.sub")
        for pi, p in enumerate(k.lista(s.get("planos"), f"{r}.planos")):
            rp = f"{r}.planos[{pi}]"
            pid = str(p.get("id", ""))
            if not pid:
                k.err.append(f"{rp}.id: falta (A, B, 1, 2…).")
            elif pid in ids:
                k.err.append(f"{rp}.id: «{pid}» repetido.")
            ids.add(pid)
            k.bi(p.get("titulo"), f"{rp}.titulo")
            k.bi(p.get("que"), f"{rp}.que")
            if p.get("nota") is not None:
                k.bi(p.get("nota"), f"{rp}.nota")
            if not isinstance(p.get("ajustes"), list):
                k.err.append(f"{rp}.ajustes: lista de ajustes (modelo, duración, formato…).")
            pr = p.get("prompt") or {}
            k.txt(pr.get("en"), f"{rp}.prompt.en")
            k.txt(pr.get("es"), f"{rp}.prompt.es")
            if p.get("segundos") is not None:
                if not isinstance(p["segundos"], (int, float)) or p["segundos"] <= 0:
                    k.err.append(f"{rp}.segundos: número de segundos del plano en el reel.")
                else:
                    reel.append(p)
    if not reel:
        k.err.append("Ningún plano tiene «segundos»: marca así los planos que salen en el reel.")
    else:
        total = sum(p["segundos"] for p in reel)
        if total > 35:
            k.avisos.append(f"El reel dura {total} s; este formato funciona mejor por debajo de 30 s.")
        cta = reel[-1]
        if pal and pal not in (cta.get("prompt") or {}).get("en", ""):
            k.err.append(f"El último plano del reel (CTA) no escribe «{pal}» en su prompt en inglés.")

    voz = c.get("voz") or {}
    k.bi(voz.get("sub"), "voz.sub")
    k.bi(voz.get("guion"), "voz.guion")
    for l in LANGS:
        if pal and pal not in ((voz.get("guion") or {}).get(l) or ""):
            k.err.append(f"voz.guion.{l}: la voz en off no dice la palabra «{pal}».")
    filas = k.lista(voz.get("tabla"), "voz.tabla")
    for i, f in enumerate(filas):
        if not re.fullmatch(r"\d:\d\d", str(f.get("t", ""))):
            k.err.append(f"voz.tabla[{i}].t: usa el formato m:ss (p. ej. 0:05).")
        k.bi(f.get("plano"), f"voz.tabla[{i}].plano")
        k.bi(f.get("frase"), f"voz.tabla[{i}].frase")
    if reel and filas and len(filas) != len(reel):
        k.avisos.append(f"Hay {len(reel)} planos en el reel y {len(filas)} frases de voz; lo normal es una por plano.")

    m = c.get("montaje") or {}
    k.bi(m.get("sub"), "montaje.sub")
    for i, p in enumerate(k.lista(m.get("pasos"), "montaje.pasos")):
        k.bi(p, f"montaje.pasos[{i}]")
    for i, r in enumerate(k.lista(c.get("reglas"), "reglas")):
        k.bi(r.get("titulo"), f"reglas[{i}].titulo")
        k.bi(r.get("texto"), f"reglas[{i}].texto")
    co = c.get("coste") or {}
    k.bi(co.get("nota"), "coste.nota")
    for i, f in enumerate(k.lista(co.get("filas"), "coste.filas")):
        k.bi(f.get("concepto"), f"coste.filas[{i}].concepto")
        k.txt(f.get("valor"), f"coste.filas[{i}].valor")
    k.txt(co.get("total"), "coste.total")
    k.bi(c.get("pie"), "pie")

    pub = c.get("publicacion") or {}
    if not pub.get("url_guia"):
        k.avisos.append("publicacion.url_guia: vacío. Publica la guía, compártela con enlace público, pega aquí la URL y vuelve a compilar el kit.")
    k.bi(pub.get("post"), "publicacion.post")
    for l in LANGS:
        if pal and pal not in ((pub.get("post") or {}).get(l) or ""):
            k.err.append(f"publicacion.post.{l}: el texto del post no incluye «{pal}».")
    k.lista(pub.get("respuestas"), "publicacion.respuestas", 2)
    k.txt(pub.get("dm_apertura"), "publicacion.dm_apertura")
    if not (isinstance(pub.get("dm_botones"), list) and len(pub["dm_botones"]) == 2):
        k.err.append("publicacion.dm_botones: dos textos, p. ej. [\"Castellano\", \"Valencià\"].")
    for l in LANGS:
        d = (pub.get("dm") or {}).get(l) or {}
        k.txt(d.get("texto"), f"publicacion.dm.{l}.texto")
        k.txt(d.get("boton"), f"publicacion.dm.{l}.boton")
    return k


def compilar(c, modo):
    plantilla = PLANTILLA.read_text(encoding="utf-8")
    if modo == "guia":  # la guía es pública: no lleva los textos del kit
        c = {k: v for k, v in c.items() if k != "publicacion"}
    datos = json.dumps(c, ensure_ascii=False).replace("</", "<\\/")
    titulo = c["titulo"]["es"] if modo == "guia" else f"Kit {c['palabra']}"
    out = plantilla.replace("__TITULO__", html.escape(titulo), 1)
    out = out.replace('"__MODO__"', json.dumps(modo), 1)
    out = out.replace("/*__CONFIG__*/null", datos, 1)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("config")
    ap.add_argument("-o", "--salida", default=".", help="carpeta donde escribir las dos páginas")
    a = ap.parse_args()
    try:
        c = json.loads(Path(a.config).read_text(encoding="utf-8"))
    except json.JSONDecodeError as e:
        sys.exit(f"El config no es JSON válido (línea {e.lineno}, columna {e.colno}): {e.msg}")
    k = validar(c)
    for w in k.avisos:
        print("AVISO  " + w)
    if k.err:
        print("\n".join("ERROR  " + e for e in k.err))
        sys.exit(f"\n{len(k.err)} error(es): corrígelos en el config.json, no en el HTML.")
    dest = Path(a.salida)
    dest.mkdir(parents=True, exist_ok=True)
    for modo in ("guia", "kit"):
        f = dest / f"{c['slug']}-{modo}.html"
        f.write_text(compilar(c, modo), encoding="utf-8")
        print(f"OK     {f}")


if __name__ == "__main__":
    main()
