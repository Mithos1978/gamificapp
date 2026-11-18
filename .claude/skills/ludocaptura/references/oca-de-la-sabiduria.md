# Ludocaptura en La Oca de la Sabiduría

Datos del repositorio `oca-de-la-sabiduria` (asignatura «Juego y Aprendizaje en el Ser
Humano», Máster en Gamificación Educativa). Compruébalos en el código antes de fiarte: el
tablero se puede haber editado desde que se escribió esto.

## De dónde sale cada cosa

| Qué | Dónde |
|---|---|
| Temas (8 «Elementos»), clases y su tema | `web/app/curso.php` → `MODULOS`, `MISIONES` |
| Contenido de cada clase (fuente de las preguntas) | `web/contenido/mision-NN.json` |
| Monedas (medallas circulares) y sus nombres | `web/app/curso.php` → `MONEDAS`; imágenes en `web/assets/img/monedas/<clave>.webp` |
| Moneda de cada casilla | `MONEDAS_CASILLA` en `curso.php` |
| Puntos y niveles | `web/app/puntos.php` → `NIVELES_POR_DEFECTO` |
| Juegos propios | `web/juegos/<id>/index.html` (un solo archivo por juego) |

Temas y clases: T1 Homo Ludens (02–03) · T2 Flow (04–05) · T3 Gamificación (06–07) ·
T4 Motivación (08–09) · T5 Neurojuego (11) · T6 Impacto (12–13) · T7 Diseño lúdico (15–16) ·
T8 Innovación (17–18). Las clases 01, 10, 14, 19 y 20 no tienen tema propio.

Para extraer el texto de una clase, recorre `pantallas` e ignora los campos `guion` y
`planB` (son notas del docente, no contenido para el alumnado). Las actividades con
solución (`diagnostico`, `firewall`, `cartas`, `flechas`, `arrastrar`, `memory`,
`contraste`) son la mejor cantera de preguntas, porque ya traen la respuesta correcta y su
explicación. Reformula en vez de copiar literalmente la misma actividad: el juego
introduce o repasa el tema, no duplica la clase.

## Convenciones del juego

- **Carpeta e id**: `web/juegos/tN-<nombre>/index.html`, con `id` igual al nombre de la
  carpeta (`^[a-z0-9][a-z0-9-]{2,40}$`, lo exige `juego_valido()`).
- **Config fuente**: `dev/juegos/<id>.json`. `dev/` no se publica y el repositorio es
  privado, así que la palabra clave legible puede vivir ahí.
- **Compilar**: `python <skill>/scripts/build.py dev/juegos/<id>.json -o web/juegos/<id>/index.html`.
- **Monedas como criaturas**: `medalla.imagen: "../../assets/img/monedas/<clave>.webp"` y
  `medalla.nombre` con el nombre de la moneda. Incluye siempre la moneda del tema y las de
  sus casillas; completa con otras del catálogo que encajen con cada concepto. Evita dos
  monedas que se vean casi iguales (p. ej. `homoludens` y `dado` son ambas un dado) y
  `ludia` (es el personaje al que se rescata, no algo que capturar).
- **Puntos**: `"api": "../../api/puntos.php"`, `"etiqueta": "puntos de sabiduría"`. Los
  umbrales se apoyan en los niveles del tablero (0, 60, 150, 300, 500, 750, 1050…). Una
  clase da unos 135 puntos, así que ajusta al momento del curso en que se juega el tema:
  el legendario debe quedar al alcance de quien lleva las clases al día. Para el tema 1
  (semanas 1–2): `comun 0, raro 60, epico 150, legendario 300`.
- **Palabra clave**: `final.palabra`, una sola palabra del tema, en mayúsculas. El docente
  escribe la misma al añadir el juego a la clase.

## Añadir el juego a una clase

El docente lo hace en el panel (`profe/paginas.php`): página nueva de tipo «incrustado»,
enlace `juegos/<id>` y la misma palabra clave. Quien completa el álbum y escribe la
palabra suma los puntos de la actividad. No edites `mision-NN.json` para insertarlo salvo
que el usuario lo pida: cambia la numeración de las pantallas de una clase ya publicada.

## Publicación y pruebas

Cada push a `main` publica por FTP: trabaja en una rama y deja que el usuario decida
cuándo fusionar. Para probar en local: crea `dev/config.php` con un DSN `sqlite:`, ejecuta
`php dev/sembrar.php` (deja las cuentas en `dev/cuentas-prueba.txt`) y arranca
`SALA_CONFIG=$PWD/dev/config.php php -S 127.0.0.1:8766 -t web dev/router.php`. Entra con
una cuenta de aprendiz y abre `/juegos/<id>/index.html`.

Lo que Ludocaptura no hace todavía: el modo multijugador en directo de `api/juego.php`
(ver a los compañeros en el mapa, carrera, equipos) que sí tienen los juegos RPG de la Oca.
