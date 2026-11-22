---
name: reel-comenta
description: Prepara un reel de vídeo IA del tipo «comenta PALABRA y te envío el prompt» en castellano y valenciano. Genera la guía bilingüe que recibe por mensaje privado quien comenta (prompts, voz en off, montaje, costes) y el kit de publicación (texto del post, respuestas, mensajes de ManyChat, checklist). Usa esta skill siempre que el usuario quiera hacer un reel con palabra clave en comentarios, un lead magnet por DM, una guía de prompts para seguidores, un reel de hooks de IA, o adaptar a castellano/valenciano un reel de este tipo, aunque no nombre la skill.
---

# Reel «Comenta y te lo envío»

Cada reel produce **dos páginas** a partir de un solo `config.json`:

| Archivo | Para quién | Qué es |
|---|---|---|
| `<slug>-guia.html` | Seguidores (enlace público) | Guía con botón Castellano / Valencià: prompts copiables (inglés + castellano), voz en off, montaje, reglas y costes. |
| `<slug>-kit.html` | Solo el usuario (privado) | Anatomía del formato, voz en los dos idiomas, enlaces `#es`/`#va`, texto del post, respuestas públicas, mensajes de ManyChat y checklist. |

El motor está hecho (`assets/plantilla.html` + `scripts/build.py`). El trabajo es escribir el **contenido** del config. No reescribas la plantilla para cada reel.

## Idiomas

- Todo lo que lee una persona va **en castellano y en valenciano**. No añadas inglés ni otros idiomas a los textos.
- Excepción: los **prompts** van en inglés (los modelos lo siguen mejor) con su traducción al **castellano** en la pestaña de al lado. No hay prompt en valenciano porque los modelos de vídeo lo entienden peor; la guía lo explica.
- Valenciano normativo de la AVL con formas valencianas: *este/esta, ací, açò, eixe, servix, seguix, ixen, isca, la teua, pugues, siga, t'envie, botar, davall, hui*. El build avisa de algunas formas más catalanas (*aquest, serveix, surten…*).
- La palabra que se escribe en el cristal es **COMENTA "PALABRA"**: se escribe igual en los dos idiomas, así que un solo vídeo sirve para los dos y solo cambia la voz en off.

## Flujo

1. **Concreta el reel** con el usuario: concepto (por defecto, «Esto es un hook de IA»: 4 hooks imposibles + CTA), escenario, personaje y **palabra clave**. Si falta algo que no puedas deducir, pregúntalo una vez.
2. **Copia `assets/ejemplo-config.json`** (es un reel completo y válido: léelo antes) y cambia el contenido. Mantén la estructura.
3. **Compila**: `python scripts/build.py config.json -o ejemplos/`. Corrige los errores en el JSON, no en el HTML. Los avisos no bloquean, pero léeselos al usuario si afectan (p. ej. `@tu_cuenta` sin cambiar).
4. **Publica la guía** como Artifact (título = `titulo.es`). Si el usuario ya tiene el vídeo y las imágenes, ponlos en `media/` junto al HTML, rellena `video` e `imagen` en el config y publícalos con `files`. Sin medios, la guía muestra un «cristal» con la palabra en lugar del vídeo y una tarjeta numerada en cada plano.
5. **Pega la URL de la guía** en `publicacion.url_guia`, vuelve a compilar y **publica el kit** (privado). Recuerda al usuario que la guía solo la puede abrir quien tenga acceso hasta que la comparta con **«cualquiera con el enlace»** desde el menú Compartir.
6. Entrega los dos enlaces y lo que falta para publicar (checklist del kit).

## Reglas del formato (por qué funciona)

- **Algo imposible cada ~4 s**, cortes secos, total por debajo de 30 s. El reel se vuelve a ver entero.
- **El vídeo enseña exactamente lo que se regala** (los prompts), así que quien comenta sabe qué recibirá.
- **Voz seca, imágenes locas**: una frase corta por plano, sin entusiasmo. Ese contraste es el humor.
- **Una habitación y cámara fija**: todos los hooks parten de la **misma imagen de inicio A**. El CTA usa una **imagen B** (en el borde de la mesa) para que el personaje salte hacia delante sin atravesarla.
- **El CTA vive en la escena**: se escribe a rotulador en un cristal delante del objetivo y se repite en el texto del post y en un comentario fijado.

## Cómo escribir los prompts

Imagen de inicio: «Cinematic film still, 35mm, vertical 9:16, locked wide shot…», personaje entre `[corchetes]`, ropa, cada objeto que luego se usará en un hook (vaso, interruptor, pared lisa), escenario local concreto, luz, y cierre «No text, no logos, no other people».

Cada plano de vídeo sigue el mismo esqueleto, que es lo que mantiene la continuidad:

1. `Continue exactly from the first frame: same … same locked camera, same outfit and hair, the presenter's face and likeness unchanged.`
2. Tiempos por tramos (`0–1s:`, `1–3s:`, `3–4s:`) con **una sola acción imposible** y un final mirando a cámara.
3. `Realistic natural motion, correct hands with five fingers, camera does not move, no zoom, no morphing, no text, no other people.`
4. `Sound:` con 2-4 sonidos concretos (el silencio repentino funciona muy bien).

Evita lo que suele fallar: **nada que atraviese un objeto sólido** (manos que entran en pantallas o paredes, caminar a través de la mesa), textos largos, y letras con tilde, ñ, ç o apóstrofo en el cristal.

Usa «the presenter» / «la persona protagonista» en lugar de pronombres con género: así el prompt sirve a cualquiera sin cambiarlo.

Marcas en los prompts: `[texto]` se resalta en naranja y se copia con corchetes (algo que el usuario debe sustituir); `{{texto}}` se resalta y se copia sin llaves (texto literal que no debe llevar corchetes, como lo que se escribe en el cristal).

## Palabra clave

3-14 letras en MAYÚSCULAS, sin tildes, ñ, ç ni apóstrofos; igual en castellano y valenciano; fácil de teclear; que nadie la comente por otro motivo (nada de «INFO» o «GRACIAS»). Un guiño local ayuda a recordarla (PAELLA, TRACA, FALLA). El build comprueba que aparece en el prompt del CTA, en la voz en off y en el texto del post.

## Automatización (resumen; el detalle va en el kit)

Instagram en cuenta profesional, acceso a mensajes para herramientas conectadas, ManyChat conectado con el login oficial de Meta. Disparador «comentario en el reel» con la palabra → respuesta pública rotando frases bilingües → mensaje 1 con botones «Castellano» / «Valencià» → mensaje 2 con el enlace `#es` o `#va`. Límites: Meta solo deja contestar en privado durante 7 días y solo al primer comentario de cada persona; el plan gratis de ManyChat (desde marzo de 2026) da unos 25 contactos activos al mes, así que es para probar. Verifica precios antes de afirmarlos.

## Campos del config

Todo texto visible es `{"es": "…", "va": "…"}`. Lo demás:

- `slug` (minúsculas), `palabra`, `titulo`, `marca.usuario` (@ real), `video` (`null` o `{src, poster}`).
- `secciones[].planos[]`: `id` (A, B, 1…), `titulo`, `que`, `ajustes` (lista), `coste`, `prompt.en`, `prompt.es`, `nota` (opcional), `imagen` (opcional), y `segundos` + `corto` **solo** en los planos que salen en el reel (dibujan la línea de tiempo del kit; el último es el CTA).
- `voz.guion` y `voz.tabla` (una frase por plano del reel, tiempo `m:ss`).
- `montaje`, `reglas`, `coste`, `pie`.
- `publicacion`: `url_guia`, `post` (la palabra en las dos primeras líneas), `hashtags`, `respuestas` (bilingües, una por variante), `dm_apertura`, `dm_botones`, `dm.es` / `dm.va` (`texto`, `boton`).
