---
name: ludocaptura
description: Crea un minijuego web de exploración y captura de criaturas (mapa con trozos de pasto alto, encuentros aleatorios, pregunta de contenido como "batalla", lanzamiento de Ludobola y álbum de medallas) para introducir un tema de La Oca de Obsoletus o de cualquier otra materia. Usa esta skill siempre que el usuario pida un juego "tipo Pokémon", de capturar bichos/criaturas/"Pokoludos"/Ludobichos, un juego de pasto y captura, un juego para ganar las medallas de la Oca, o quiera convertir un temario o banco de preguntas en un juego de coleccionar criaturas, aunque no nombre la skill.
---

# Ludocaptura

Genera, para un tema concreto, un juego de un solo archivo HTML en el que el jugador
recorre un mapa, encuentra criaturas escondidas en el pasto alto y las captura
respondiendo bien una pregunta del contenido. Cada criatura es una **medalla circular
con vida** de La Oca: capturarla es ganar la medalla.

El motor ya está hecho (`assets/plantilla.html`). El trabajo consiste en diseñar el
**contenido** (criaturas, medallas, preguntas, zonas) en un `config.json` y compilarlo
con `scripts/build.py`. No reescribas el motor para cada juego: así todos los temas se
comportan igual y un arreglo en la plantilla beneficia a todos.

## Flujo de trabajo

1. **Reúne el contenido.** Necesitas el tema, las medallas del tramo de La Oca que cubre
   (nombre y, si existe, imagen o color) y el material del que salen las preguntas. Si el
   usuario ya dio el temario o un banco de preguntas, úsalo tal cual; si falta algo que no
   puedas deducir (sobre todo los nombres reales de las medallas), pregúntalo una vez. Si
   no hay medallas definidas, propón una por concepto clave del tema.
2. **Diseña las criaturas**: una por medalla. Ver "Diseño de criaturas".
3. **Escribe las preguntas**: ver "Preguntas".
4. **Agrupa en zonas de pasto** y decide el modo de puntos: ver más abajo.
5. **Escribe `config.json`** siguiendo `assets/ejemplo-config.json` (es un ejemplo
   completo y válido; léelo antes de escribir el tuyo).
6. **Compila**: `python scripts/build.py config.json -o <tema>.html`. El script valida la
   configuración y explica cada error; corrígelos en el JSON, no en el HTML.
7. **Pruébalo** abriéndolo en un navegador si hay uno disponible (basta con comprobar que
   arranca, que salta un encuentro y que una captura suma al contador) y entrega el HTML
   junto con el `config.json`, que es lo que el usuario editará después.

## Diseño de criaturas

- **Nombres y aspecto originales.** El género (pasto, captura, colección) es libre, pero
  los nombres, personajes y gráficos de Pokémon son marca registrada de terceros: no uses
  "Pokémon", "Pokébola", ni nombres o diseños de criaturas existentes, tampoco deformados
  ("Pikaludo"). Si el usuario dice "Pokoludos" o "Pokebola", usa en el juego
  "Ludobichos"/"Ludobola" (o el nombre que prefiera sin "Poke-") y coméntaselo en una
  línea. `nombreCriatura` y `nombreBola` son configurables.
- **El nombre debe evocar el concepto** de la medalla (Fluxor → flow, Puntix → puntos):
  así el álbum funciona como mapa mental del tema.
- El motor dibuja cada criatura como una medalla circular con ojos y patas a partir de
  `medalla.color` + `medalla.emoji`, o de `medalla.imagen` (URL o data URI de la medalla
  real). Da a cada una un color distinto para que se distingan en el álbum.
- **Rareza = profundidad del concepto**, no capricho: `comun` para ideas básicas,
  `raro`/`epico` para las que exigen relacionar, `legendario` para la idea cumbre del
  tema (una, como mucho dos). La rareza controla la frecuencia de aparición y el umbral
  de puntos.
- Entre 4 y 10 criaturas por juego. Menos se queda corto; más alarga la búsqueda hasta
  aburrir.

## Preguntas

La pregunta es la "batalla", así que tiene que poder leerse y contestarse en unos
segundos:

- Opción múltiple, 2–4 opciones, una sola correcta. `correcta` es el índice desde 0 (el
  motor baraja las opciones al mostrarlas, así que no importa dejarla siempre en 0).
- **Al menos 2 preguntas por criatura**, mejor 3. Si el jugador falla, la criatura huye
  y al reencontrarla sale la siguiente pregunta; con una sola se repetiría la misma con la
  respuesta ya vista. El modo "suave" además necesita 2 para funcionar.
- La dificultad acompaña a la rareza: las legendarias piden aplicar o relacionar, no
  recordar una definición.
- Distractores plausibles y de longitud parecida a la correcta; nada de "todas las
  anteriores".
- `explicacion` en una frase: se muestra tras responder, y es donde de verdad se aprende
  cuando se falla.
- Comprueba los hechos contra el material del usuario. Un error en una pregunta enseña
  algo falso a toda la clase.

## Zonas de pasto

`zonas` reparte las criaturas en trozos de pasto con nombre (2–3 criaturas por zona,
agrupadas por subtema). El álbum muestra en qué zona vive cada silueta pendiente, lo que
da al jugador un objetivo en vez de caminar a ciegas. Si se omite `zonas`, el motor las
crea solo. Toda criatura debe estar en exactamente una zona.

## Puntos de La Oca (`puntos.modo`)

Condicionar la captura a los puntos del tablero premia a los jugadores competitivos
(triunfadores, "asesinos") pero puede dejar fuera a exploradores y socializadores y a
quien va rezagado, que es justo quien más necesita el repaso. Por eso hay tres modos:

| modo | efecto | cuándo usarlo |
|---|---|---|
| `off` | Todo el mundo puede capturar todo. | Juego de introducción a un tema; es el valor más seguro. |
| `suave` | Por debajo del umbral se puede capturar igualmente, pero hay que acertar 2 preguntas seguidas. | **Recomendado** cuando el usuario quiera ligar captura y puntos: da ventaja al que va delante sin cerrar la puerta a nadie. |
| `estricto` | Por debajo del umbral la criatura no se puede capturar; avisa de cuántos puntos faltan. | Solo si el usuario lo pide expresamente o como reto final de curso. |

Si el usuario pide el condicionamiento sin precisar, usa `suave` y explícale el porqué en
una línea. Los `umbrales` van por rareza y deben crecer (común ≤ raro ≤ épico ≤
legendario); ajústalos a la escala real de puntos del tablero y deja `comun` en 0 para que
siempre haya algo capturable.

El juego obtiene los puntos del jugador, por orden: parámetro de URL `?puntos=120`, la
clave de `localStorage` indicada en `puntos.claveLocalStorage` (útil si el juego se sirve
desde el mismo origen que La Oca), o preguntándoselo al jugador en la pantalla inicial.

## Integración con La Oca

- El juego es un HTML autónomo: se puede enlazar o incrustar en un `<iframe>` desde la
  casilla correspondiente.
- Guarda el progreso en `localStorage` con la clave `ludocaptura:<id>`; usa un `id`
  distinto por tema para que las partidas no se pisen.
- Al capturar y al completar el álbum envía a la página contenedora
  `postMessage({origen:"ludocaptura", juego, tipo:"captura"|"completado", criatura, medalla, capturados, total})`,
  para que el tablero pueda otorgar la medalla real.

## Referencia rápida de `config.json`

```
id            (obligatorio) minúsculas-con-guiones, único por tema
titulo        (obligatorio)
tema          texto de introducción en la pantalla inicial
nombreCriatura {singular, plural}      por defecto Ludobicho/Ludobichos
nombreBola    por defecto "Ludobola"
mensajeFinal  frase extra al completar el álbum
probEncuentro probabilidad por paso en pasto (0.18 por defecto)
mostrarCorrecta  false para no revelar la respuesta al fallar
puntos        {modo, etiqueta, umbrales:{comun,raro,epico,legendario}, claveLocalStorage}
zonas         [{nombre, criaturas:[ids]}]
criaturas     [{id, nombre, rareza, descripcion,
                medalla:{nombre, emoji, color, imagen},
                preguntas:[{texto, opciones[], correcta, explicacion}]}]
```
