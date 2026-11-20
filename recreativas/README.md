# Recreativas de «Obsoletus y la Gran Oca del Saber»

Ocho juegos arcade educativos, uno por cada prompt del encargo. Cada `NN-nombre.html` es un
archivo **autónomo** (sin red, sin librerías, sin almacenamiento): se puede abrir tal cual,
enlazar o incrustar con `<iframe>` en una casilla, o pegar su código en Canva Code.
`index.html` es un menú con los ocho.

| n.º | archivo | identificador de la Pluma |
|---|---|---|
| 01 | `01-laberinto-recompensas.html` | PLUMA-RECOMPENSAS |
| 02 | `02-torre-de-obsoletus.html` | PLUMA-AUTORREGULACION |
| 03 | `03-hexarrutas.html` | PLUMA-HEXAD |
| 04 | `04-arquitecto-gamificacion.html` | PLUMA-DISENO |
| 05 | `05-cruce-metacognitivo.html` | PLUMA-METACOGNICION |
| 06 | `06-invasores-desmotivacion.html` | PLUMA-MOTIVACION |
| 07 | `07-rompe-el-mal-diseno.html` | PLUMA-REDISENO |
| 08 | `08-batalla-final-obsoletus.html` | PLUMA-OBSOLETUS |

## Cómo se editan

No edites los `.html`: se generan. El motor común (portada, pausa, reinicio, sonido, modo
tranquilo, controles táctiles, pantalla final y Pluma Dorada) está en `src/core.js`,
`src/core.css` y `src/shell.html`; cada juego es un único archivo en `src/juegos/`.
El contrato entre ambos está en `src/API.md`.

```
python3 build.py          # regenera los ocho HTML
node pruebas/humo.js      # los abre en Chromium (escritorio y móvil) y falla si hay errores
node pruebas/humo.js 03   # solo uno
```

La ficha de la Pluma Dorada solo existe en la pantalla del estudiante (la copia o la
captura): no se envía ni se guarda en ningún sitio.
