# Motor común de las recreativas (`core.js`)

Cada juego es **un solo archivo** `src/juegos/NN-nombre.js` que llama a `Arcade.crear({...})`.
`python3 build.py` lo incrusta junto con `shell.html`, `core.css` y `core.js` en `NN-nombre.html`
(autónomo, sin red, sin almacenamiento). `node pruebas/humo.js NN` lo abre en Chromium
(escritorio y móvil), pulsa teclas y falla si hay errores de consola o scroll.
Ejemplo completo: `src/juegos/01-laberinto-recompensas.js`.

El motor ya pone: portada (objetivo, 3 instrucciones, Iniciar), Pausa/Reanudar (P/Esc),
Reiniciar, Sonido (apagado por defecto), Modo tranquilo, HUD, botones táctiles, modales,
pantalla final con pregunta de transferencia, caja de reflexión, «Reclamar Pluma Dorada» y
ficha copiable. **El juego no reimplementa nada de eso.**

## Configuración

```js
Arcade.crear({
  numero: '02', titulo: '…', pluma: 'PLUMA-…',
  ancho: 480, alto: 360,          // tamaño lógico del lienzo; el motor lo escala
  objetivo: '…',                  // objetivo pedagógico (1 frase)
  instrucciones: ['…', '…', '…'], // exactamente 3 líneas
  teclas: 'Teclado: … En móvil: …', // opcional, línea de controles de la portada
  transferencia: '¿…?',           // pregunta final literal del encargo
  ayuda: '<ul>…</ul>',            // HTML que se ve en el panel de pausa (conceptos, pistas)
  controles: {
    cruceta: ['arriba','abajo','izq','der'],   // o ['izq','der'], o []
    acciones: [{ id: 'saltar', etiqueta: 'Saltar' },          // 1.ª acción: Espacio
               { id: 'escudo', etiqueta: 'Escudo', teclas: ['x','m'] }]
  },
  iniciar(api) {},        // estado LIMPIO; se llama en Iniciar, Reiniciar y «Jugar de nuevo»
  actualizar(dt, api) {}, // solo se llama jugando (no en pausa, modal ni final); dt ≤ 0.05 s
  dibujar(ctx, api) {},   // se llama siempre tras iniciar (también con modal encima); no cambia estado
  alPulsar(id, api) {},   // flanco: 'arriba','abajo','izq','der', id de acción, o '1'…'9'
  alPuntero(x, y, api) {} // toque/clic en el lienzo, en coordenadas lógicas (opcional)
});
```

## `api`

| miembro | uso |
|---|---|
| `api.teclas.izq` … / `api.teclas[idAccion]` | estado mantenido (teclado y táctil) |
| `api.t` | segundos de juego (se congela en pausa/modales). **Usa esto para animar y temporizar; nunca `setTimeout`/`Date.now()`** |
| `api.tranquilo`, `api.vel` | modo tranquilo; `vel` es 0.6 o 1: multiplica las velocidades de enemigos/obstáculos y **no descuentes tiempo límite si `api.tranquilo`** (puede cambiar a mitad de partida) |
| `api.activarTranquilo()` | lo activa (p. ej. opción «Reintentar en modo tranquilo») |
| `api.hud({Fase:'1/3', Vidas:3, Tiempo:'30 s'})` | marcadores; llamar cada cuadro es barato. Valores `null` se omiten |
| `api.mensaje(texto, ms?)` | aviso flotante no bloqueante (DOM, legible en móvil) |
| `api.flotar(texto, x, y, {color,tam}?)` | texto que sube sobre el lienzo |
| `api.sonido('punto'|'ok'|'error'|'golpe'|'salto'|'disparo'|'gana')` | pitido si el sonido está activado |
| `api.registrar(texto)` | añade una decisión del estudiante al resumen final y a la ficha |
| `api.elegir({titulo, texto, html?, opciones:[{etiqueta, detalle?}|string], campo?, enFila?})` | modal que **detiene el juego**; devuelve `Promise<{i, texto}>`. `campo` añade un cuadro de texto opcional; `enFila` para escalas 1–5. Tras Reiniciar, las promesas antiguas no se resuelven nunca (seguro) |
| `api.informar({titulo, texto, html?, boton?})` | modal de un botón; `Promise` |
| `api.herramientas([{id, etiqueta, icono?}], (id, api)=>{})` | barra de botones bajo el lienzo (teclas 1–9). `api.herramienta` = id seleccionado o `null`; `api.seleccionar(id)`; `api.herramientas(null)` la quita |
| `api.ayuda(html)` | sustituye el HTML de ayuda del panel de pausa (p. ej. para acumular lo ya explicado) |
| `api.terminar({titulo?, puntos, html?, feedback, ficha?:[lineas]})` | **solo al ganar**: abre la pantalla final con reflexión y Pluma |
| `api.W`, `api.H`, `api.C` | tamaño lógico y paleta |

Dibujo: `Arcade.texto(ctx, s, x, y, {tam, color, alin, negrita, ancho})` (con `ancho` parte líneas),
`Arcade.caja(ctx,x,y,w,h,relleno,borde,grosor)`, `Arcade.oca(ctx,x,y,alto,{dir,paso,color})`,
`Arcade.robot(ctx,x,y,alto,{color,ojo})`, `Arcade.pluma(ctx,x,y,alto,color)`,
`Arcade.choca(a,b)` (AABB `{x,y,w,h}`), `Arcade.limitar(v,a,b)`, `Arcade.esc(s)` (escapa HTML).
Paleta `Arcade.C`: `noche, noche2, morado, morado2, menta, oro, blanco, rojo, gris`.

## Reglas

- Mientras hay un modal, `actualizar` no corre. Usa una bandera propia (`S.activa`) para no
  abrir dos modales por el mismo suceso ni seguir simulando tras ganar/perder.
- Derrota = `api.elegir` con «Reintentar tramo» / «Reintentar en modo tranquilo»; nunca se
  pierde lo ya conseguido ni hay penalización. `api.terminar` solo tras una victoria real.
- Texto dentro del lienzo: ≥ 11 px lógicos y poco; las frases van a `api.mensaje` o a modales.
  En un móvil vertical el lienzo mide ~370 px de ancho: con `ancho: 480` un texto de 12 px se ve a ~9 px.
  Si el juego lleva palabras en los sprites, usa un lienzo estrecho (p. ej. 360×480) y letras de ≥ 13 px.
- Nada de información solo por color (añade icono, forma o texto), sin parpadeos.
- No uses `localStorage`, `fetch`, imágenes, fuentes ni librerías externas. No escribas `</script` en el JS.
- Prueba de fuego: `Arcade._.estado()` devuelve `inicio|jugando|pausa|modal|fin`; `Arcade._.api` y
  `Arcade._.juego` sirven para depurar desde Playwright.
- Los avisos de `api.mensaje` salen en una franja propia sobre el lienzo (uno cada vez, máx. ~3 líneas); en móvil apaisado se superponen a la parte alta del lienzo.
- La fuente del lienzo no dibuja bien símbolos como «✓»: usa formas o texto («OK»).
- Convención de pruebas: cada juego expone `depurar()` en su configuración (lectura del estado), accesible como `Arcade._.juego.depurar()`.
- En móvil caben la cruceta completa y hasta 3 acciones; los botones de acción se estrechan solos.
