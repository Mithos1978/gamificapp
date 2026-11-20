/* 07 · Rompe el mal diseño */
(function () {
  'use strict';
  var A = Arcade, C = A.C;
  var W = 360, H = 470, IZQ = 6, DER = 354, TECHO = 24, R = 7;
  var PALA_Y = 386, PALA_H = 18, BANDA_Y = 414, BW = 112, BH = 44, HUECO = 6, FRANJA = 24;
  var AZUL = '#7fc4ff', MIN_UY = 0.42;

  /* Las cuatro mejoras (herramientas) y la categoría de fallo que reparan de forma más directa */
  var MEJORAS = [
    { id: 'objetivos', etiqueta: 'Conectar con objetivos', icono: '◎', corto: 'objetivos', cat: 'propósito', color: C.oro },
    { id: 'opciones', etiqueta: 'Ofrecer opciones', icono: '⇄', corto: 'opciones', cat: 'inclusión', color: C.menta },
    { id: 'feedback', etiqueta: 'Feedback procesable', icono: '✎', corto: 'feedback', cat: 'feedback', color: C.morado2 },
    { id: 'reto', etiqueta: 'Ajustar el reto', icono: '▲', corto: 'reto', cat: 'reto', color: AZUL }
  ];
  var M = {};
  MEJORAS.forEach(function (m) { M[m.id] = m; });

  /* 12 fallos de una gamificación. ok[mejora] = reparación; los que tienen dos claves aceptan dos soluciones. */
  var FALLOS = [
    /* fila superior */
    { txt: ['premio sin', 'sentido'], cat: 'objetivos',
      ok: { objetivos: 'La recompensa pasa a reconocer un logro de aprendizaje concreto.' },
      pista: 'El premio no guarda relación con lo aprendido: ¿a qué meta responde?' },
    { txt: ['ritmo', 'único'], cat: 'opciones',
      ok: { opciones: 'Cada estudiante decide por dónde y cuándo avanzar.', reto: 'El ritmo se adapta: apoyos para quien los necesita y ampliación para quien va sobrado.' },
      pista: 'Todo el grupo debe ir al mismo paso: hace falta flexibilidad.' },
    { txt: ['nota', 'tardía'], cat: 'feedback',
      ok: { feedback: 'La información llega a tiempo de usarla en el siguiente intento.' },
      pista: 'La valoración llega cuando ya no se puede usar: falta información a tiempo.' },
    /* segunda fila */
    { txt: ['reto', 'imposible'], cat: 'reto',
      ok: { reto: 'El reto se divide en pasos alcanzables y con apoyos.' },
      pista: 'Es inalcanzable y frustra: acerca la dificultad a lo que ya saben hacer.' },
    { txt: ['meta', 'confusa'], cat: 'objetivos',
      ok: { objetivos: 'La meta se formula clara y ligada a lo que se quiere aprender.' },
      pista: 'Nadie sabe adónde va la actividad: falta un para qué claro.' },
    { txt: ['sin', 'alternativas'], cat: 'opciones',
      ok: { opciones: 'Ahora se puede elegir ruta, formato o papel dentro de la tarea.' },
      pista: 'Solo hay una forma de participar: falta poder elegir.' },
    /* tercera fila */
    { txt: ['ranking', 'excluyente'], cat: 'opciones',
      ok: { opciones: 'Hay varias formas de destacar: progreso propio, cooperación, creatividad.', reto: 'Retos por niveles: cada cual se mide con su marca anterior.' },
      pista: 'Siempre ganan los mismos y el resto se descuelga: abre otras vías o gradúa el reto.' },
    { txt: ['error', 'penalizado'], cat: 'feedback',
      ok: { feedback: 'El error se convierte en información para volver a intentarlo.', reto: 'Se permiten reintentos sin castigo: equivocarse forma parte del reto.' },
      pista: 'Fallar solo resta: convierte el error en información o deja reintentar.' },
    { txt: ['tarea', 'trivial'], cat: 'reto',
      ok: { reto: 'Se añade un desafío que exige pensar un poco más.' },
      pista: 'Es demasiado fácil y aburre: la dificultad no está bien calibrada.' },
    /* fila inferior (la primera que alcanza la pelota) */
    { txt: ['solo', 'puntos'], cat: 'objetivos',
      ok: { objetivos: 'Los puntos pasan a señalar avances hacia un objetivo de aprendizaje.', feedback: 'Cada punto va acompañado de información sobre qué mejorar.' },
      pista: 'Los puntos no dicen para qué sirven ni qué mejorar: dales sentido o información.' },
    { txt: ['dificultad', 'fija'], cat: 'reto',
      ok: { reto: 'La dificultad sube o baja según el progreso de cada cual.', opciones: 'Se ofrecen varios niveles y cada estudiante elige el suyo.' },
      pista: 'El mismo nivel para todo el mundo: adapta el reto o deja elegir nivel.' },
    { txt: ['sin', 'feedback'], cat: 'feedback',
      ok: { feedback: 'Cada intento devuelve qué salió bien y cuál es el siguiente paso.' },
      pista: 'Quien juega no sabe cómo va ni qué hacer después: necesita información útil.' }
  ];
  var FINAL_OK = {
    objetivos: 'Propósito: la gamificación sirve a un objetivo de aprendizaje, no al premio.',
    feedback: 'Feedback: el juego informa del progreso en lugar de limitarse a repartir premios.'
  };
  var AYUDA_BASE = '<ul>' +
    '<li><b>◎ Conectar con objetivos</b> (tecla 1): repara fallos de <b>propósito</b> (icono de diana).</li>' +
    '<li><b>⇄ Ofrecer opciones</b> (tecla 2): repara fallos de <b>inclusión</b> (icono de dos flechas).</li>' +
    '<li><b>✎ Feedback procesable</b> (tecla 3): repara fallos de <b>retroalimentación</b> (icono de bocadillo).</li>' +
    '<li><b>▲ Ajustar el reto</b> (tecla 4): repara fallos de <b>equilibrio del reto</b> (icono de escalones).</li></ul>' +
    '<p>La mejora activa se ve en la pala y en la pelota. El bloque con borde discontinuo es el próximo que tocará la pelota. ' +
    'Algunos fallos admiten dos reparaciones razonables. Con una mejora que no encaja, la pelota rebota y recibes una pista en la franja inferior: no pierdes nada.</p>' +
    '<p>Tras reparar 8 fallos aparece el bloque final, que necesita dos mejoras distintas.</p>';
  var S;

  function nombre(b) { return b.txt.join(' '); }

  /* ---------- Estado ---------- */
  function montar() {
    var bloques = FALLOS.map(function (f, i) {
      return { i: i, txt: f.txt, cat: f.cat, ok: f.ok, pista: f.pista, vivo: true, tiembla: -9, pistaT: -9,
        x: IZQ + (i % 3) * (BW + HUECO), y: TECHO + 8 + Math.floor(i / 3) * (BH + HUECO), w: BW, h: BH };
    });
    S = { bloques: bloques, final: null, rotos: 0, vidas: 3, puntos: 0, fallos: 0, reintentos: 0, bolasPerdidas: 0,
      pala: { x: W / 2 }, bola: { x: W / 2, y: PALA_Y - R, ux: 0, uy: -1, pegada: true }, meta: null, mira: 1,
      activa: true, ganaT: 0, sinPala: 0, trozos: [], reparados: [], notas: [], usos: {}, obj: null, ruta: [], avisoSin: -9,
      banda: { tipo: 'Cómo va', txt: 'Elige una mejora (1–4) y lanza. Aquí verás la explicación de cada golpe; en Pausa las tienes todas.' } };
  }
  function anchoPala(api) { return api.tranquilo ? 108 : 88; }
  function vivos() {
    var l = S.bloques.filter(function (b) { return b.vivo; });
    if (S.final && S.final.vivo) l.push(S.final);
    return l;
  }
  function direccionSaque(b) {
    var a = 0.35 * S.mira;
    b.ux = Math.sin(a); b.uy = -Math.cos(a);
  }
  function anguloMinimo(b) {
    if (Math.abs(b.uy) < MIN_UY) {
      b.uy = (b.uy < 0 ? -1 : 1) * MIN_UY;
      b.ux = (b.ux < 0 ? -1 : 1) * Math.sqrt(1 - MIN_UY * MIN_UY);
    }
  }
  /* Avanza la pelota `ds` píxeles: rebota en paredes y bloques. Devuelve el bloque tocado (ya rebotado) o null. */
  function avanzar(b, ds, lista) {
    b.x += b.ux * ds; b.y += b.uy * ds;
    if (b.x < IZQ + R) { b.x = IZQ + R; b.ux = Math.abs(b.ux); }
    if (b.x > DER - R) { b.x = DER - R; b.ux = -Math.abs(b.ux); }
    if (b.y < TECHO + R) { b.y = TECHO + R; b.uy = Math.abs(b.uy); }
    for (var i = 0; i < lista.length; i++) {
      var q = lista[i], dx = b.x - (q.x + q.w / 2), dy = b.y - (q.y + q.h / 2);
      var ox = q.w / 2 + R - Math.abs(dx), oy = q.h / 2 + R - Math.abs(dy);
      if (ox > 0 && oy > 0) {
        if (ox < oy) { var sx = dx < 0 ? -1 : 1; b.ux = sx * Math.abs(b.ux); b.x += sx * ox; }
        else { var sy = dy < 0 ? -1 : 1; b.uy = sy * Math.abs(b.uy); b.y += sy * oy; }
        anguloMinimo(b);
        return q;
      }
    }
    return null;
  }
  /* Trayectoria prevista hasta el próximo bloque (feedback para decidir la mejora con calma) */
  function predecir() {
    var o = S.bola, b = { x: o.x, y: o.y, ux: o.ux, uy: o.uy }, lista = vivos(), pts = [];
    if (o.pegada) direccionSaque(b);
    S.obj = null;
    for (var i = 0; i < 420; i++) {
      var q = avanzar(b, 3, lista);
      if (q) { S.obj = q; break; }
      if (b.uy > 0 && b.y > PALA_Y - R) break;
      if (i % 5 === 4) pts.push(b.x, b.y);
    }
    S.ruta = pts;
  }

  /* ---------- Explicaciones consultables en pausa ---------- */
  function nota(b, texto, esPista) {
    var n = null;
    S.notas.forEach(function (x) { if (x.b === b) n = x; });
    if (!n) { n = { b: b, pista: null, rep: [] }; S.notas.push(n); }
    if (esPista) n.pista = texto; else n.rep.push(texto);
  }
  function pintarAyuda(api) {
    var h = AYUDA_BASE;
    if (S.notas.length) {
      h += '<h3>Lo ya explicado en esta partida</h3><ul>';
      S.notas.forEach(function (n) {
        h += '<li><b>«' + A.esc(nombre(n.b)) + '»</b>' +
          (n.rep.length ? ' — Reparación: ' + A.esc(n.rep.join(' ')) : '') +
          (n.pista && !n.rep.length ? ' — Pista: ' + A.esc(n.pista) : '') + '</li>';
      });
      h += '</ul>';
    }
    api.ayuda(h);
  }

  /* ---------- Golpes ---------- */
  function trozos(q, color) {
    for (var i = 0; i < 8; i++) {
      S.trozos.push({ x: q.x + q.w * (0.1 + 0.8 * ((i * 37) % 100) / 100), y: q.y + q.h * (((i * 53) % 100) / 100),
        vx: ((i % 4) - 1.5) * 40, vy: -60 - (i % 3) * 30, v: 0, color: color });
    }
  }
  function pista(q, api, texto) {
    S.fallos++; q.tiembla = api.t; api.sonido('error');
    api.flotar('no encaja: pista abajo', A.limitar(q.x + q.w / 2, 84, W - 84), q.y + q.h + 12, { color: C.blanco, tam: 12 });
    S.banda = { tipo: 'Pista', txt: '«' + nombre(q) + '»: ' + texto };
    nota(q, texto, true); pintarAyuda(api);
  }
  function golpear(q, api) {
    var h = api.herramienta, m = h && M[h], cx = A.limitar(q.x + q.w / 2, 70, W - 70);
    if (!m) {
      q.tiembla = api.t;
      S.banda = { tipo: 'Aviso', txt: 'Sin mejora elegida la pelota solo rebota: pulsa 1, 2, 3 o 4 (o un botón de mejora).' };
      return;
    }
    S.usos[h] = (S.usos[h] || 0) + 1;
    if (q.esFinal) {
      if (!FINAL_OK[h]) { pista(q, api, 'eso no basta si todo gira en torno al premio. Mira sus dos sellos: diana y bocadillo.'); return; }
      if (q.sellos[h]) { pista(q, api, 'esa mitad ya está reparada; falta la otra mejora (el sello que sigue vacío).'); return; }
      q.sellos[h] = true; S.puntos += 100; api.sonido('ok');
      api.flotar('sello: ' + m.cat, cx, q.y - 6, { color: m.color });
      S.banda = { tipo: 'Reparado', txt: FINAL_OK[h] }; nota(q, FINAL_OK[h]); pintarAyuda(api);
      api.registrar('Bloque final «gamificación = premios»: apliqué ' + m.etiqueta + '.');
      if (q.sellos.objetivos && q.sellos.feedback) {
        q.vivo = false; trozos(q, C.oro); S.puntos += 100; S.activa = false; S.ganaT = api.t + 1.1;
        api.sonido('gana'); S.banda = { tipo: 'Reparado', txt: '¡«Gamificación = premios» desmontado! Propósito + feedback le dan sentido al juego.' };
      }
      return;
    }
    if (q.ok[h]) {
      q.vivo = false; S.rotos++; S.puntos += 100; trozos(q, M[q.cat].color); api.sonido('punto');
      api.flotar('reparado con ' + m.corto, cx, q.y + q.h / 2, { color: m.color });
      S.banda = { tipo: 'Reparado', txt: '«' + nombre(q) + '» → ' + q.ok[h] };
      S.reparados.push({ b: q, h: h, frase: q.ok[h] });
      nota(q, q.ok[h]); pintarAyuda(api);
      api.registrar('«' + nombre(q) + '» → ' + m.etiqueta + '.');
    } else pista(q, api, q.pista);
  }
  function crearFinal(api) {
    var f = { esFinal: true, txt: ['gamificación', '= premios'], x: 70, y: 260, w: 220, h: 48, vivo: true, tiembla: -9, pistaT: -9,
      sellos: { objetivos: false, feedback: false } };
    var b = S.bola;
    if (!b.pegada && Math.abs(b.x - 180) < f.w / 2 + R + 6 && Math.abs(b.y - (f.y + 24)) < f.h / 2 + R + 6) return;  /* espera a que la pelota salga de la zona */
    S.final = f; api.sonido('golpe');
    api.mensaje('¡Aparece el bloque final!', 2500);
    S.banda = { tipo: 'Bloque final', txt: '«Gamificación = premios» solo cae con dos mejoras distintas, un golpe con cada una: observa sus dos sellos.' };
  }

  function perderBola(api) {
    S.vidas--; S.bolasPerdidas++; api.sonido('golpe');
    S.bola.pegada = true; S.sinPala = 0;
    if (S.vidas > 0) { api.mensaje('Pelota perdida: elige con calma y vuelve a lanzar.', 2500); return; }
    S.activa = false; S.reintentos++;
    api.elegir({
      titulo: 'Te has quedado sin pelotas',
      texto: 'No pasa nada: los ' + S.rotos + ' fallos que ya has reparado siguen reparados y recuperas las tres vidas.',
      opciones: [{ etiqueta: 'Reintentar' }, { etiqueta: 'Reintentar en modo tranquilo', detalle: 'Pelota más lenta y pala más ancha.' }]
    }).then(function (r) {
      if (r.i === 1) api.activarTranquilo();
      S.vidas = 3; S.bola.pegada = true; S.meta = null; S.activa = true;
    });
  }

  function cierre(api) {
    /* Tres errores reparados, procurando que sean de categorías distintas */
    var tres = [], vistas = {};
    S.reparados.forEach(function (r) { if (tres.length < 3 && !vistas[r.b.cat]) { vistas[r.b.cat] = 1; tres.push(r); } });
    S.reparados.forEach(function (r) { if (tres.length < 3 && tres.indexOf(r) < 0) tres.push(r); });
    var html = '<h3>Tres errores frecuentes que detectaste y su reparación</h3><ol>', ficha = ['Tres errores detectados y su reparación:'];
    tres.forEach(function (r) {
      html += '<li><b>«' + A.esc(nombre(r.b)) + '»</b> (' + A.esc(M[r.b.cat].cat) + ') → <b>' + A.esc(M[r.h].etiqueta) + '</b>: ' + A.esc(r.frase) + '</li>';
      ficha.push('«' + nombre(r.b) + '» → ' + M[r.h].etiqueta + ': ' + r.frase);
    });
    html += '</ol><p><b>Bloque final:</b> «gamificación = premios» cayó al combinar propósito (conectar con objetivos) y feedback procesable.</p>' +
      '<p class="nota">Son casos de juego simplificados: en un aula real la reparación depende del contexto, del alumnado y de cómo se evalúa.</p>';
    var mas = null;
    MEJORAS.forEach(function (m) { if (S.usos[m.id] && (!mas || S.usos[m.id] > S.usos[mas.id])) mas = m; });
    var dobles = S.reparados.filter(function (r) { return Object.keys(r.b.ok).length > 1; }).length;
    api.registrar('Golpes con una mejora que no encajaba: ' + S.fallos + ' (cada uno devolvió una pista, sin penalización).');
    S.puntos += S.vidas * 50;
    api.terminar({
      titulo: '¡Mal diseño desmontado!', puntos: S.puntos, html: html, ficha: ficha,
      feedback: 'En esta partida reparaste ' + S.rotos + ' de 12 fallos y el bloque final. ' +
        (mas ? 'La mejora con la que más golpeaste fue «' + mas.etiqueta + '»; es un dato de esta partida, no una preferencia tuya. ' : '') +
        (S.fallos ? 'Probaste ' + S.fallos + ' veces una mejora que no encajaba y usaste las pistas para corregir: así funciona el feedback procesable. '
          : 'No necesitaste pistas esta vez. ') +
        (dobles ? dobles + ' de los fallos que reparaste admitían dos soluciones: rara vez hay una única receta. ' : '') +
        (S.reintentos ? 'Reintentaste ' + S.reintentos + ' vez/veces sin perder lo avanzado.' : '')
    });
  }

  /* ---------- Dibujo ---------- */
  function icono(ctx, cat, x, y, c) {
    ctx.fillStyle = c; ctx.strokeStyle = c; ctx.lineWidth = 2;
    if (cat === 'objetivos') {            /* diana */
      ctx.strokeRect(x - 7, y - 7, 14, 14); ctx.fillRect(x - 3, y - 3, 6, 6);
    } else if (cat === 'opciones') {      /* dos flechas opuestas */
      ctx.fillRect(x - 7, y - 5, 10, 3);
      ctx.beginPath(); ctx.moveTo(x + 3, y - 8); ctx.lineTo(x + 8, y - 3.5); ctx.lineTo(x + 3, y + 1); ctx.fill();
      ctx.fillRect(x - 3, y + 3, 10, 3);
      ctx.beginPath(); ctx.moveTo(x - 3, y); ctx.lineTo(x - 8, y + 4.5); ctx.lineTo(x - 3, y + 9); ctx.fill();
    } else if (cat === 'feedback') {      /* bocadillo */
      ctx.fillRect(x - 8, y - 7, 16, 11);
      ctx.beginPath(); ctx.moveTo(x - 5, y + 3); ctx.lineTo(x - 5, y + 9); ctx.lineTo(x + 1, y + 3); ctx.fill();
    } else {                              /* escalones */
      ctx.fillRect(x - 8, y + 3, 5, 5); ctx.fillRect(x - 2.5, y - 2, 5, 10); ctx.fillRect(x + 3, y - 7, 5, 15);
    }
  }
  function dibBloque(ctx, q, api) {
    var dx = api.t - q.tiembla < 0.3 ? (Math.floor((api.t - q.tiembla) * 20) % 2 ? 2 : -2) : 0;
    var x = q.x + dx, col = M[q.cat].color, largo = Math.max(q.txt[0].length, q.txt[1].length);
    A.caja(ctx, x, q.y, q.w, q.h, '#18203c', col, 2);
    ctx.fillStyle = col; ctx.fillRect(x, q.y, FRANJA, q.h);
    icono(ctx, q.cat, x + FRANJA / 2, q.y + q.h / 2, C.noche);
    var tx = x + FRANJA + (q.w - FRANJA) / 2, tam = largo > 10 ? 12 : 13;
    A.texto(ctx, q.txt[0], tx, q.y + 14, { tam: tam, negrita: true });
    A.texto(ctx, q.txt[1], tx, q.y + 31, { tam: tam, negrita: true });
  }
  function dibFinal(ctx, q, api) {
    var dx = api.t - q.tiembla < 0.3 ? (Math.floor((api.t - q.tiembla) * 20) % 2 ? 2 : -2) : 0, x = q.x + dx;
    A.caja(ctx, x, q.y, q.w, q.h, '#3a2f10', C.oro, 3);
    A.texto(ctx, q.txt[0], x + 78, q.y + 15, { tam: 14, negrita: true, color: C.oro });
    A.texto(ctx, q.txt[1], x + 78, q.y + 33, { tam: 14, negrita: true, color: C.oro });
    ['objetivos', 'feedback'].forEach(function (id, i) {
      var sx = x + q.w - 62 + i * 30, sy = q.y + 11, hecho = q.sellos[id];
      A.caja(ctx, sx, sy, 26, 26, hecho ? M[id].color : C.noche, hecho ? C.blanco : M[id].color, 2);
      icono(ctx, id, sx + 13, sy + 13, hecho ? C.noche : M[id].color);
      if (hecho) {                        /* marca de hecho, además del relleno */
        ctx.strokeStyle = C.blanco; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx + 14, sy + 24); ctx.lineTo(sx + 19, sy + 29); ctx.lineTo(sx + 28, sy + 17); ctx.stroke();
      }
    });
  }

  A.crear({
    numero: '07', titulo: 'Rompe el mal diseño', pluma: 'PLUMA-REDISENO',
    ancho: W, alto: H,
    objetivo: 'Reconocer fallos frecuentes de una gamificación (propósito, inclusión, retroalimentación y equilibrio del reto) y decidir qué mejora de diseño repara cada uno.',
    instrucciones: [
      'Mueve la pala para que la pelota no caiga y lánzala contra los 12 bloques: cada uno es un fallo de diseño.',
      'Antes de cada golpe elige una de las cuatro mejoras: la adecuada rompe el bloque; la que no encaja rebota y te da una pista.',
      'Repara 8 fallos para que aparezca el bloque final «gamificación = premios», que solo cae combinando dos mejoras.'
    ],
    teclas: 'Teclado: flechas o A/D mueven la pala, Espacio lanza la pelota y 1–4 eligen mejora. En móvil: botones ◀ ▶ y «Lanzar», barra de mejoras, o toca el lienzo para llevar la pala a ese punto.',
    transferencia: '¿Qué cambiarías primero en un sistema de insignias que aumenta la participación, pero no mejora el aprendizaje?',
    ayuda: AYUDA_BASE,
    controles: { cruceta: ['izq', 'der'], acciones: [{ id: 'lanzar', etiqueta: 'Lanzar' }] },
    depurar: function () { return S; },

    iniciar: function (api) {
      montar();
      api.herramientas(MEJORAS.map(function (m) { return { id: m.id, etiqueta: m.etiqueta, icono: m.icono }; }), function (id, a) {
        a.sonido('salto');
        a.flotar(M[id].corto, A.limitar(S.pala.x, 40, W - 40), PALA_Y - 22, { color: M[id].color, tam: 12, dur: 0.8 });
      });
      pintarAyuda(api);
            predecir();
    },

    alPulsar: function (id, api) {
      if (!S.activa) return;
      if ((id === 'lanzar' || id === 'arriba') && S.bola.pegada) {
        S.bola.pegada = false; direccionSaque(S.bola); S.sinPala = 0; api.sonido('salto');
      }
      if (id === 'izq' || id === 'der') S.meta = null;
    },
    alPuntero: function (x) { if (S.activa) S.meta = x; },

    actualizar: function (dt, api) {
      var i, t;
      for (i = S.trozos.length - 1; i >= 0; i--) {
        t = S.trozos[i]; t.v += dt; t.vy += 500 * dt; t.x += t.vx * dt; t.y += t.vy * dt;
        if (t.v > 0.8) S.trozos.splice(i, 1);
      }
      if (!S.activa) {
        if (S.ganaT && api.t >= S.ganaT) { S.ganaT = 0; cierre(api); }
        return;
      }
      /* Pala: teclado/táctil, o deslizamiento hacia el punto tocado en el lienzo */
      var p = S.pala, pw = anchoPala(api), vp = 380 * dt, b = S.bola;
      if (api.teclas.izq) { p.x -= vp; S.mira = -1; }
      if (api.teclas.der) { p.x += vp; S.mira = 1; }
      if (S.meta != null && !api.teclas.izq && !api.teclas.der) {
        var d = S.meta - p.x;
        if (Math.abs(d) <= vp) { p.x = S.meta; S.meta = null; } else { p.x += d < 0 ? -vp : vp; S.mira = d < 0 ? -1 : 1; }
      }
      p.x = A.limitar(p.x, IZQ + pw / 2, DER - pw / 2);

      if (b.pegada) { b.x = p.x; b.y = PALA_Y - R; }
      else {
        var rest = (170 + 5 * S.rotos) * api.vel * dt, lista = vivos();
        S.sinPala += dt;
        if (S.sinPala > 10) { b.uy = Math.abs(b.uy); S.sinPala = 4; }   /* salvaguarda: nunca se queda rebotando arriba indefinidamente */
        while (rest > 0 && S.activa && !b.pegada) {
          var ds = Math.min(3, rest); rest -= ds;
          var q = avanzar(b, ds, lista);
          if (q) { golpear(q, api); lista = vivos(); }
          if (b.uy > 0 && b.y + R >= PALA_Y && b.y - R <= PALA_Y + PALA_H && Math.abs(b.x - p.x) <= pw / 2 + R) {
            var ang = A.limitar((b.x - p.x) / (pw / 2), -1, 1) * 0.96;    /* el punto de la pala decide el ángulo (máx. 55°) */
            b.ux = Math.sin(ang); b.uy = -Math.cos(ang); b.y = PALA_Y - R; S.sinPala = 0; api.sonido('salto');
          } else if (b.y - R > BANDA_Y) perderBola(api);
        }
      }
      if (S.activa && !S.final && S.rotos >= 8) crearFinal(api);
      predecir();
      var f = S.final;
      api.hud({
        Reparados: S.rotos + '/12',
        Final: f ? ((f.sellos.objetivos ? 1 : 0) + (f.sellos.feedback ? 1 : 0)) + '/2' : (S.rotos < 8 ? 'faltan ' + (8 - S.rotos) : null),
        Vidas: S.vidas, Puntos: S.puntos
      });
    },

    dibujar: function (ctx, api) {
      if (!S) return;
      var h = api.herramienta, m = h && M[h], pw = anchoPala(api), b = S.bola, p = S.pala, i;
      /* cabecera con la leyenda de categorías (icono + palabra) */
      MEJORAS.forEach(function (x, k) {
        var lx = 8 + k * 90 - (k === 3 ? 6 : 0);
        icono(ctx, x.id, lx + 8, 11, x.color);
        A.texto(ctx, x.cat, lx + 20, 12, { tam: 11, alin: 'left', color: x.color });
      });
      ctx.fillStyle = C.morado; ctx.fillRect(0, TECHO - 3, W, 3); ctx.fillRect(0, TECHO - 3, IZQ - 2, BANDA_Y); ctx.fillRect(DER + 2, TECHO - 3, W - DER - 2, BANDA_Y);
      /* trayectoria prevista y próximo bloque */
      if (S.activa) {
        ctx.fillStyle = C.gris;
        for (i = 0; i < S.ruta.length; i += 2) ctx.fillRect(S.ruta[i] - 1, S.ruta[i + 1] - 1, 2, 2);
      }
      S.bloques.forEach(function (q) { if (q.vivo) dibBloque(ctx, q, api); });
      if (S.final && S.final.vivo) dibFinal(ctx, S.final, api);
      if (S.activa && S.obj) {
        ctx.strokeStyle = C.blanco; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
        ctx.strokeRect(S.obj.x - 2, S.obj.y - 2, S.obj.w + 4, S.obj.h + 4); ctx.setLineDash([]);
      }
      S.trozos.forEach(function (t) { ctx.fillStyle = t.color; ctx.fillRect(t.x - 3, t.y - 3, 6, 6); });
      /* pala y mejora activa */
      A.caja(ctx, p.x - pw / 2, PALA_Y, pw, PALA_H, m ? m.color : C.gris, C.blanco, 2);
      if (m) {
        icono(ctx, h, p.x - pw / 2 + 13, PALA_Y + 9, C.noche);
        A.texto(ctx, m.corto, p.x + 9, PALA_Y + 10, { tam: 12, color: C.noche, negrita: true, sombra: false });
      } else A.texto(ctx, 'elige 1–4', p.x, PALA_Y + 10, { tam: 12, color: C.noche, negrita: true, sombra: false });
      /* franja fija de explicación (no tapa el juego ni caduca) */
      var bc = S.banda.tipo === 'Pista' || S.banda.tipo === 'Aviso' ? C.oro : C.menta;
      A.caja(ctx, 0, BANDA_Y, W, H - BANDA_Y, C.noche2, bc, 2);
      A.texto(ctx, S.banda.tipo + ' · ' + S.banda.txt, W / 2, BANDA_Y + (H - BANDA_Y) / 2 + 1, { tam: 12, ancho: W - 16 });
      if (b.pegada && S.activa) A.texto(ctx, 'Espacio o «Lanzar»', A.limitar(p.x, 80, W - 80), PALA_Y - 32, { tam: 12, color: C.blanco });
      /* pelota: color de la mejora y núcleo oscuro si aún no hay ninguna */
      ctx.fillStyle = C.blanco; ctx.fillRect(b.x - R, b.y - R + 2, R * 2, R * 2 - 4); ctx.fillRect(b.x - R + 2, b.y - R, R * 2 - 4, R * 2);
      ctx.fillStyle = m ? m.color : C.noche; ctx.fillRect(b.x - R + 2, b.y - R + 2, R * 2 - 4, R * 2 - 4);
    }
  });
})();
