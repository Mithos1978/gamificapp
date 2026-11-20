/* 04 · El arquitecto de la gamificación */
(function () {
  'use strict';
  var A = Arcade, C = A.C;
  var COLS = 8, FILAS = 12, T = 34, GX = 14, GY = 54, W = 360, H = 500, PX = GX + COLS * T + 6;

  /* Los ocho componentes: abreviatura visible en cada celda, icono, color y definición de una línea */
  var CON = {
    obj:  { ab: 'OBJ',  nom: 'objetivo',    f: '#5f460d', b: C.oro,     def: 'qué se quiere aprender y para qué sirve la tarea.',
            falta: 'sin objetivo no se sabe para qué sirve la tarea' },
    reto: { ab: 'RETO', nom: 'reto',        f: '#7a2c33', b: C.rojo,    def: 'desafío ajustado que exige poner en práctica lo que se aprende.',
            falta: 'sin reto no hay nada que superar ni que practicar' },
    narr: { ab: 'NARR', nom: 'narrativa',   f: '#43278a', b: C.morado2, def: 'historia o contexto que da sentido a lo que se hace.',
            falta: 'sin narrativa el reto se queda sin contexto' },
    feed: { ab: 'FEED', nom: 'feedback',    f: '#0e5a45', b: C.menta,   def: 'información sobre cómo vas y qué hacer para mejorar.',
            falta: 'sin feedback nadie sabe cómo va ni cómo mejorar' },
    auto: { ab: 'AUTO', nom: 'autonomía',   f: '#1c4a80', b: '#8cc4ff', def: 'opciones reales para decidir cómo, cuándo o con qué trabajar.',
            falta: 'sin autonomía el alumnado no decide nada' },
    coop: { ab: 'COOP', nom: 'cooperación', f: '#6f3266', b: '#f2a6de', def: 'meta compartida que solo se alcanza trabajando con otras personas.',
            falta: 'sin cooperación se pierde el aprender con otras personas' },
    reco: { ab: 'RECO', nom: 'recompensa',  f: '#4c5216', b: '#dbe46a', def: 'reconocimiento (puntos, insignias, acceso) ligado a lo conseguido.',
            falta: 'esta misión trata de dar sentido a la recompensa, así que tiene que aparecer' },
    eval: { ab: 'EVAL', nom: 'evaluación',  f: '#39425f', b: C.blanco,  def: 'comprobar con evidencias qué se ha aprendido.',
            falta: 'sin evaluación no se comprueba qué se ha aprendido' }
  };
  var ORDEN = ['obj', 'reto', 'narr', 'feed', 'auto', 'coop', 'reco', 'eval'];

  var MISIONES = [
    { nombre: 'Da sentido al reto', intervalo: 0.85,
      idea: 'Un reto aislado es solo un obstáculo. Reúne en UNA MISMA FILA completa los componentes que le dan sentido.',
      linea: 'OBJ+RETO+NARR · OBJ+RETO+FEED · RETO+NARR+AUTO', nota: 'en la misma fila; las demás casillas son libres',
      combos: [
        { c: ['obj', 'reto', 'narr'], por: 'El objetivo dice para qué, el reto qué hay que superar y la narrativa lo sitúa en un contexto con sentido.' },
        { c: ['obj', 'reto', 'feed'], por: 'Hay una meta clara, un desafío y feedback para saber si te acercas a ella.' },
        { c: ['reto', 'narr', 'auto'], por: 'El reto tiene una historia detrás y deja margen para elegir cómo afrontarlo.' }
      ],
      bolsa: { obj: 3, reto: 3, narr: 3, feed: 2, auto: 2, coop: 1, reco: 1, eval: 1 } },
    { nombre: 'Haz visible el progreso', intervalo: 0.75,
      idea: 'Avanzar sin saber cuánto se avanza desanima. Reúne en una misma fila completa lo que hace visible el progreso.',
      linea: 'FEED+EVAL + uno de: OBJ, RETO, AUTO, COOP', nota: 'en la misma fila; las demás casillas son libres',
      combos: [
        { c: ['obj', 'feed', 'eval'], por: 'El objetivo sirve de referencia, el feedback orienta por el camino y la evaluación comprueba lo logrado.' },
        { c: ['reto', 'feed', 'eval'], por: 'El reto genera evidencias, el feedback las devuelve a tiempo y la evaluación las recoge.' },
        { c: ['feed', 'auto', 'eval'], por: 'Es una autoevaluación: el alumnado decide, recibe feedback y revisa su propio avance.' },
        { c: ['feed', 'coop', 'eval'], por: 'Es una coevaluación: el grupo se da feedback y comprueba junto lo que ha aprendido.' }
      ],
      bolsa: { feed: 3, eval: 3, obj: 2, reto: 2, auto: 2, coop: 2, narr: 2, reco: 2 } },
    { nombre: 'Evita la recompensa vacía', intervalo: 0.65, maxReco: 2,
      idea: 'Un premio que no informa de nada es puro adorno. Une la recompensa a lo que se aprende, sin que lo ocupe todo.',
      linea: 'RECO+OBJ+FEED · RECO+RETO+EVAL · RECO+OBJ+EVAL', nota: 'en la misma fila y con 2 casillas RECO como máximo',
      combos: [
        { c: ['reco', 'obj', 'feed'], por: 'La recompensa reconoce un objetivo concreto y llega acompañada de información para seguir mejorando.' },
        { c: ['reco', 'reto', 'eval'], por: 'La recompensa se gana superando un reto y la evaluación comprueba que detrás hay aprendizaje.' },
        { c: ['reco', 'obj', 'eval'], por: 'La recompensa certifica un objetivo logrado y comprobado, no la mera participación.' }
      ],
      bolsa: { reco: 4, obj: 2, feed: 2, reto: 2, eval: 2, narr: 2, auto: 1, coop: 1 } }
  ];

  /* Figuras propias de 1 a 3 celdas (ninguna de cuatro) */
  var FORMAS = [
    { id: 'punto', f: [[0, 0]], peso: 2 },
    { id: 'par',   f: [[0, 0], [1, 0]], peso: 4 },
    { id: 'barra', f: [[0, 0], [1, 0], [2, 0]], peso: 4 },
    { id: 'codo',  f: [[0, 0], [0, 1], [1, 1]], peso: 4 },
    { id: 'salto', f: [[0, 0], [1, 1]], peso: 1 }
  ];
  var S;

  function nombres(l) { return l.map(function (k) { return CON[k].nom; }); }
  function unir(l) { return l.length < 2 ? l.join('') : l.slice(0, -1).join(', ') + ' y ' + l[l.length - 1]; }
  function sorteo(pesos, excepto) {
    var tot = 0, k, r;
    for (k in pesos) if (k !== excepto) tot += pesos[k];
    r = Math.random() * tot;
    for (k in pesos) if (k !== excepto) { r -= pesos[k]; if (r < 0) return k; }
    return k;
  }
  function ancho(f) { return Math.max.apply(null, f.map(function (c) { return c[0]; })) + 1; }
  function alto(f) { return Math.max.apply(null, f.map(function (c) { return c[1]; })) + 1; }
  function girada(f) {
    var r = f.map(function (c) { return [-c[1], c[0]]; });
    var mx = Math.min.apply(null, r.map(function (c) { return c[0]; })), my = Math.min.apply(null, r.map(function (c) { return c[1]; }));
    return r.map(function (c) { return [c[0] - mx, c[1] - my]; });
  }
  function choca(f, x, y) {
    for (var i = 0; i < f.length; i++) {
      var cx = x + f[i][0], cy = y + f[i][1];
      if (cx < 0 || cx >= COLS || cy < 0 || cy >= FILAS || S.g[cy][cx]) return true;
    }
    return false;
  }
  function crearPieza() {
    var pesos = {}, m = MISIONES[S.m];
    FORMAS.forEach(function (fo, i) { pesos[i] = fo.peso; });
    var fo = FORMAS[sorteo(pesos)], a = sorteo(m.bolsa), b = sorteo(m.bolsa, a);
    return { id: fo.id, f: fo.f.map(function (c) { return c.slice(); }), con: [a, b], sel: 0, x: 0, y: 0 };
  }
  function rejillaVacia() {
    var g = [];
    for (var y = 0; y < FILAS; y++) { g.push([]); for (var x = 0; x < COLS; x++) g[y].push(null); }
    return g;
  }

  /* ¿Cumple esta fila (lista de conceptos, con huecos null) el criterio de la misión m? */
  function evaluar(fila, m) {
    var pres = {}, mejor = null;
    fila.forEach(function (k) { if (k) pres[k] = (pres[k] || 0) + 1; });
    m.combos.forEach(function (cb, i) {
      var faltan = cb.c.filter(function (k) { return !pres[k]; });
      if (!mejor || faltan.length < mejor.faltan.length) mejor = { i: i, faltan: faltan };
    });
    var exceso = !!(m.maxReco && (pres.reco || 0) > m.maxReco);
    return { ok: !mejor.faltan.length && !exceso, i: mejor.i, faltan: mejor.faltan, exceso: exceso, pres: pres };
  }
  function tarjeta(ev, m) {
    var hay = unir(nombres(ORDEN.filter(function (k) { return ev.pres[k]; })));
    if (!ev.faltan.length && ev.exceso) {
      return 'Fila eliminada sin bonificación: la combinación estaba, pero con ' + ev.pres.reco +
        ' casillas de recompensa el premio ocupa casi toda la fila y tapa lo demás (máximo 2).';
    }
    return 'Fila eliminada sin bonificación. Tenía ' + hay + '; para «' + m.nombre + '» faltaba ' +
      unir(nombres(ev.faltan)) + ': ' + CON[ev.faltan[0]].falta + '.';
  }

  function criterioHtml(m) {
    return '<p>Completa una fila de 8 casillas que contenga, como mínimo, una de estas combinaciones:</p><ul>' +
      m.combos.map(function (cb) { return '<li><b>' + nombres(cb.c).join(' + ') + '</b></li>'; }).join('') + '</ul>' +
      (m.maxReco ? '<p>Además, esa fila puede tener <b>como máximo ' + m.maxReco + ' casillas de recompensa</b>: si el premio lo ocupa todo, desplaza al aprendizaje.</p>' : '') +
      '<p class="nota">Las demás casillas de la fila pueden ser de cualquier componente. Las filas que no cumplan se eliminan igual, pero sin bonificación. ' +
      'Una marca ✓ a la izquierda de una fila indica que ya reúne la combinación.</p>';
  }

  function sacarPieza(api) {
    var p = S.sig; S.sig = crearPieza();
    p.x = Math.floor((COLS - ancho(p.f)) / 2); p.y = 0;
    S.caida = 0; S.suelo = 0; S.soltarBajar = true; S.piezas++;
    if (choca(p.f, p.x, p.y)) { S.p = null; derrota(api); return; }
    S.p = p;
  }
  function empezarMision(api, previo) {
    var m = MISIONES[S.m];
    S.activa = false; S.g = rejillaVacia(); S.p = null; S.limpia = null; S.sig = crearPieza();
    api.informar({
      titulo: 'Misión ' + (S.m + 1) + ' de 3 · ' + m.nombre,
      html: (previo || '') + '<p>' + A.esc(m.idea) + '</p>' + criterioHtml(m),
      boton: 'Empezar misión ' + (S.m + 1)
    }).then(function () { S.activa = true; sacarPieza(api); });
  }
  function derrota(api) {
    S.activa = false; S.reintentos++; api.sonido('golpe');
    api.elegir({
      titulo: 'La pila ha llegado arriba',
      texto: 'No pasa nada: se vacía la cuadrícula y repites la misión ' + (S.m + 1) + '. Conservas las ' + S.logros.length +
        ' combinación(es) que ya habías logrado y no hay ninguna penalización.',
      opciones: [{ etiqueta: 'Reintentar la misión' }, { etiqueta: 'Reintentar en modo tranquilo', detalle: 'Las piezas caen más despacio.' }]
    }).then(function (r) {
      if (r.i === 1) api.activarTranquilo();
      S.g = rejillaVacia(); S.limpia = null; S.sig = crearPieza(); S.activa = true; sacarPieza(api);
    });
  }

  function fijar(api) {
    var p = S.p, k = p.con[p.sel], m = MISIONES[S.m];
    p.f.forEach(function (c) { S.g[p.y + c[1]][p.x + c[0]] = k; });
    S.p = null; S.puntos += 5; api.sonido('punto');
    var llenas = [], y;
    for (y = 0; y < FILAS; y++) if (S.g[y].every(function (c) { return c; })) llenas.push(y);
    if (!llenas.length) { sacarPieza(api); return; }
    var evs = llenas.map(function (yy) { return evaluar(S.g[yy], m); }), buena = -1;
    evs.forEach(function (e, i) { if (e.ok && buena < 0) buena = i; });
    S.limpia = { filas: llenas, evs: evs, buena: buena, t: 0.5 };
    S.filas += llenas.length; S.puntos += 40 * llenas.length;
    if (buena >= 0) {
      api.sonido('ok'); S.puntos += 300;
      api.flotar('+300 combinación', GX + COLS * T / 2, GY + llenas[buena] * T + 6, { tam: 14 });
    } else {
      S.sinBono += llenas.length; api.sonido('error');
      api.mensaje(tarjeta(evs[0], m), 6500);
    }
  }
  function terminarLimpieza(api) {
    var L = S.limpia, m = MISIONES[S.m];
    S.limpia = null;
    L.filas.forEach(function (y) {
      S.g.splice(y, 1);
      var v = []; for (var x = 0; x < COLS; x++) v.push(null);
      S.g.unshift(v);
    });
    if (L.buena < 0) { sacarPieza(api); return; }
    var cb = m.combos[L.evs[L.buena].i], nom = nombres(cb.c).join(' + ');
    S.logros.push({ m: S.m, nom: nom, por: cb.por });
    api.registrar('Misión ' + (S.m + 1) + ' «' + m.nombre + '»: completé una fila con ' + nom + '.');
    var previo = '<p><b>Combinación justificada: ' + A.esc(nom) + '.</b> ' + A.esc(cb.por) + '</p>';
    S.m++;
    if (S.m < MISIONES.length) {
      empezarMision(api, '<h3>Misión ' + S.m + ' lograda</h3>' + previo + '<h3>Siguiente misión</h3>');
    } else {
      S.activa = false; S.m = MISIONES.length - 1; S.fin = true;
      api.informar({ titulo: '¡Tres combinaciones justificadas!', html: previo +
        '<p>Has reunido las tres combinaciones. Queda la reflexión final para reclamar la Pluma Dorada.</p>', boton: 'Ver pantalla final' })
        .then(function () { cierre(api); });
    }
  }
  function cierre(api) {
    var html = '<h3>Combinaciones logradas</h3><ol>' + S.logros.map(function (l) {
      return '<li><b>' + A.esc(MISIONES[l.m].nombre) + ':</b> ' + A.esc(l.nom) + '. ' + A.esc(l.por) + '</li>';
    }).join('') + '</ol><p class="nota"><b>Advertencia:</b> encajar componentes no es diseñar. Un diseño real exige considerar el contexto, ' +
      'el alumnado concreto y cómo se va a evaluar, además de los componentes aislados. Estas combinaciones son ejemplos coherentes, no recetas.</p>';
    api.registrar('Cambié de concepto ' + S.cambios + ' vez/veces antes de colocar una pieza.');
    if (S.sinBono) api.registrar('Eliminé ' + S.sinBono + ' fila(s) sin bonificación porque les faltaba algún componente del criterio.');
    api.terminar({
      titulo: '¡Diseño con sentido!', puntos: S.puntos, html: html,
      feedback: 'En esta partida reuniste una combinación coherente en cada misión. ' +
        (S.sinBono ? 'También completaste ' + S.sinBono + ' fila(s) que no cumplían el criterio: llenar la fila no bastaba, había que reunir componentes que se justifican entre sí. '
          : 'Todas las filas que completaste cumplían el criterio de su misión. ') +
        (S.reintentos ? 'Reintentaste ' + S.reintentos + ' vez/veces: forma parte del juego. ' : '') +
        'Es el resultado de una partida, no una medida de tu capacidad para diseñar.',
      ficha: ['Recuerda: el diseño real requiere considerar contexto, alumnado y evaluación, además de componentes aislados.']
    });
  }

  /* ---------- Acciones del jugador ---------- */
  function mover(dx) {
    var p = S.p;
    if (!p || choca(p.f, p.x + dx, p.y)) return false;
    p.x += dx; return true;
  }
  function girar(api) {
    var p = S.p; if (!p) return;
    var nf = girada(p.f), nx = p.x + Math.floor((ancho(p.f) - ancho(nf)) / 2);
    var saltos = [[0, 0], [-1, 0], [1, 0], [0, -1], [-2, 0], [2, 0]];
    for (var i = 0; i < saltos.length; i++) {
      if (!choca(nf, nx + saltos[i][0], p.y + saltos[i][1])) {
        p.f = nf; p.x = nx + saltos[i][0]; p.y += saltos[i][1]; api.sonido('salto'); return;
      }
    }
  }
  function cambiar(api) {
    if (!S.p) return;
    S.p.sel = 1 - S.p.sel; S.cambios++; api.sonido('disparo');
  }
  function destino(p) { var y = p.y; while (!choca(p.f, p.x, y + 1)) y++; return y; }

  /* ---------- Dibujo ---------- */
  function icono(ctx, k, cx, cy, u, color, fondo) {
    function r(a, b, w, h, c) { ctx.fillStyle = c || color; ctx.fillRect(cx + a * u, cy + b * u, w * u, h * u); }
    if (k === 'obj') { r(-4, -4, 8, 8); r(-3, -3, 6, 6, fondo); r(-1, -1, 2, 2); }
    else if (k === 'reto') { r(-5, 2, 10, 2); r(-3, 0, 6, 2); r(-1, -2, 2, 2); r(-1, -4, 1, 2); r(0, -4, 2, 1); }
    else if (k === 'narr') { r(-5, -3, 4, 7); r(1, -3, 4, 7); r(-1, -2, 2, 6, fondo); r(-4, -1, 2, 1, fondo); r(2, -1, 2, 1, fondo); }
    else if (k === 'feed') { r(-5, -4, 10, 6); r(-3, 2, 2, 2); r(-3, -2, 6, 1, fondo); r(-3, 0, 4, 1, fondo); }
    else if (k === 'auto') { r(-1, 0, 2, 4); r(-5, -1, 10, 2); r(-5, -4, 2, 3); r(3, -4, 2, 3); }
    else if (k === 'coop') { r(-4, -4, 2, 2); r(2, -4, 2, 2); r(-5, -1, 4, 5); r(1, -1, 4, 5); r(-1, 1, 2, 1); }
    else if (k === 'reco') { r(-3, -4, 2, 3); r(1, -4, 2, 3); r(-3, -1, 6, 5); r(-1, 1, 2, 1, fondo); }
    else { r(-5, 0, 2, 2); r(-3, 2, 2, 2); r(-1, 0, 2, 2); r(1, -2, 2, 2); r(3, -4, 2, 2); }
  }
  function celda(ctx, x, y, t, k) {
    var c = CON[k];
    A.caja(ctx, x + 1, y + 1, t - 2, t - 2, c.f, c.b, 2);
    if (t >= 30) {
      icono(ctx, k, x + t / 2, y + 10, 1, c.b, c.f);
      A.texto(ctx, c.ab, x + t / 2, y + t - 10, { tam: 12, negrita: true });
    } else icono(ctx, k, x + t / 2, y + t / 2, 1, c.b, c.f);
  }
  function marca(ctx, x, y, color) {         /* ✓ dibujada con trazos */
    ctx.strokeStyle = color; ctx.lineWidth = 2.5; ctx.beginPath();
    ctx.moveTo(x - 4, y); ctx.lineTo(x - 1, y + 4); ctx.lineTo(x + 5, y - 5); ctx.stroke();
  }

  function dibujar(ctx, api) {
    if (!S || !S.g) return;
    var m = MISIONES[S.m], x, y, i;
    /* Criterio de la misión, siempre a la vista */
    A.texto(ctx, 'MISIÓN ' + (S.m + 1) + '/3 · ' + m.nombre.toUpperCase(), 6, 12, { tam: 12, alin: 'left', negrita: true, color: C.oro });
    A.texto(ctx, m.linea, 6, 29, { tam: 11, alin: 'left', negrita: true });
    A.texto(ctx, m.nota, 6, 44, { tam: 11, alin: 'left', color: '#c9cfe8' });

    /* Cuadrícula */
    A.caja(ctx, GX - 2, GY - 2, COLS * T + 4, FILAS * T + 4, C.noche2, C.morado, 2);
    ctx.fillStyle = '#26315c';
    for (x = 1; x < COLS; x++) ctx.fillRect(GX + x * T, GY, 1, FILAS * T);
    for (y = 1; y < FILAS; y++) ctx.fillRect(GX, GY + y * T, COLS * T, 1);
    for (y = 0; y < FILAS; y++) {
      var algo = false;
      for (x = 0; x < COLS; x++) if (S.g[y][x]) { celda(ctx, GX + x * T, GY + y * T, T, S.g[y][x]); algo = true; }
      if (algo && !S.limpia) {
        var ev = evaluar(S.g[y], m);
        if (ev.ok) marca(ctx, 6, GY + y * T + T / 2, C.oro);
        else if (ev.exceso) A.texto(ctx, '!', 6, GY + y * T + T / 2, { tam: 13, negrita: true, color: C.rojo });
      }
    }
    if (S.limpia) S.limpia.filas.forEach(function (fy, n) {
      var ok = n === S.limpia.buena;
      ctx.strokeStyle = ok ? C.oro : C.blanco; ctx.lineWidth = 4;
      ctx.strokeRect(GX + 2, GY + fy * T + 2, COLS * T - 4, T - 4);
      if (ok) marca(ctx, 6, GY + fy * T + T / 2, C.oro);
    });
    var p = S.p;
    if (p) {
      var k = p.con[p.sel], dy = destino(p);
      if (dy > p.y) {
        ctx.strokeStyle = CON[k].b; ctx.lineWidth = 2; ctx.setLineDash([4, 4]);
        p.f.forEach(function (c) { ctx.strokeRect(GX + (p.x + c[0]) * T + 4, GY + (dy + c[1]) * T + 4, T - 8, T - 8); });
        ctx.setLineDash([]);
      }
      p.f.forEach(function (c) { celda(ctx, GX + (p.x + c[0]) * T, GY + (p.y + c[1]) * T, T, k); });
    }

    /* Panel lateral: siguiente pieza, concepto alternativo, logros y puntos */
    var cx = PX + (W - PX) / 2 - 1;
    A.texto(ctx, 'SIGUE', cx, GY + 8, { tam: 11, color: C.menta, negrita: true });
    A.caja(ctx, PX, GY + 18, W - PX - 2, 66, C.noche2, C.morado, 2);
    var s = S.sig;
    if (s) {
      var t = 20, ox = cx - ancho(s.f) * t / 2, oy = GY + 51 - alto(s.f) * t / 2;
      s.f.forEach(function (c) { celda(ctx, ox + c[0] * t, oy + c[1] * t, t, s.con[0]); });
      A.texto(ctx, CON[s.con[0]].ab, cx, GY + 96, { tam: 12, negrita: true, color: CON[s.con[0]].b });
      A.texto(ctx, 'o ' + CON[s.con[1]].ab, cx, GY + 111, { tam: 11, color: '#c9cfe8' });
    }
    A.texto(ctx, 'CAMBIAR', cx, GY + 140, { tam: 11, color: C.menta, negrita: true });
    A.texto(ctx, 'a (X):', cx, GY + 154, { tam: 11, color: '#c9cfe8' });
    if (p) celda(ctx, cx - T / 2, GY + 164, T, p.con[1 - p.sel]);
    else A.caja(ctx, cx - T / 2 + 1, GY + 165, T - 2, T - 2, C.noche2, C.gris, 2);
    A.texto(ctx, 'LOGROS', cx, GY + 226, { tam: 11, color: C.menta, negrita: true });
    for (i = 0; i < 3; i++) {
      var hecho = i < S.logros.length, ly = GY + 238 + i * 30;
      A.caja(ctx, cx - 26, ly, 52, 26, C.noche2, hecho ? C.oro : (i === S.m && !S.fin ? C.menta : C.gris), 2);
      A.texto(ctx, 'M' + (i + 1), cx - 11, ly + 13, { tam: 12, negrita: true, color: hecho ? C.oro : C.blanco });
      if (hecho) marca(ctx, cx + 12, ly + 13, C.oro);
      else if (i === S.m) A.texto(ctx, '…', cx + 12, ly + 12, { tam: 12 });
    }
    A.texto(ctx, 'PUNTOS', cx, GY + 348, { tam: 11, color: C.menta, negrita: true });
    A.texto(ctx, String(S.puntos), cx, GY + 364, { tam: 14, negrita: true, color: C.oro });
    A.pluma(ctx, cx, GY + 392, 20, S.logros.length === 3 ? C.oro : C.gris);

    /* Leyenda: icono → componente */
    var ly0 = GY + FILAS * T + 6;
    ORDEN.forEach(function (kk, n) {
      var lx = [3, 85, 184, 272][n % 4], yy = ly0 + 8 + Math.floor(n / 4) * 17;
      A.caja(ctx, lx, yy - 7, 14, 14, CON[kk].f, CON[kk].b, 1);
      icono(ctx, kk, lx + 7, yy, 1, CON[kk].b, CON[kk].f);
      A.texto(ctx, CON[kk].nom, lx + 17, yy, { tam: 11, alin: 'left' });
    });
  }

  A.crear({
    numero: '04', titulo: 'El arquitecto de la gamificación', pluma: 'PLUMA-DISENO',
    ancho: W, alto: H,
    objetivo: 'Comprobar que una gamificación funciona cuando sus componentes se justifican entre sí, no cuando simplemente se apilan.',
    instrucciones: [
      'Caen piezas con un componente de diseño (objetivo, reto, narrativa, feedback…). Muévelas, gíralas y completa filas de 8 casillas.',
      'Cada misión muestra antes qué combinación debe contener la fila: solo esa fila da bonificación. Puedes cambiar el concepto de la pieza que cae.',
      'Las filas que no cumplen se eliminan igual, con una explicación. Ganas al lograr las tres combinaciones y escribir tu reflexión.'
    ],
    teclas: 'Teclado: ←/→ o A/D mueven, ↑ o Espacio giran, ↓ o S bajan y X cambia el concepto. En móvil o tableta: botones táctiles en pantalla.',
    transferencia: '¿Qué elementos unirías para transformar un cuestionario con puntos en una experiencia de aprendizaje significativa?',
    ayuda: '<ul>' + ORDEN.map(function (k) {
      return '<li><b>' + CON[k].ab + ' · ' + CON[k].nom + ':</b> ' + CON[k].def + '</li>';
    }).join('') + '</ul><h3>Criterios de las misiones</h3><ol>' + MISIONES.map(function (m) {
      return '<li><b>' + m.nombre + ':</b> ' + m.combos.map(function (cb) { return nombres(cb.c).join(' + '); }).join('; o ') +
        (m.maxReco ? ' (máximo ' + m.maxReco + ' casillas de recompensa en la fila)' : '') + '.</li>';
    }).join('') + '</ol><p>La combinación debe estar en la misma fila completa. «Cambiar» alterna la pieza que cae entre sus dos conceptos posibles. ' +
      'Una ✓ a la izquierda marca las filas que ya reúnen la combinación; un «!» avisa de demasiadas recompensas.</p>',
    controles: {
      cruceta: ['izq', 'der'],
      acciones: [{ id: 'girar', etiqueta: 'Girar' }, { id: 'bajar', etiqueta: 'Bajar', teclas: [] }, { id: 'cambiar', etiqueta: 'Cambiar', teclas: ['x', 'c'] }]
    },
    depurar: function () { return S; },

    iniciar: function (api) {
      S = { m: 0, g: null, p: null, sig: null, limpia: null, activa: false, fin: false, puntos: 0, filas: 0, sinBono: 0,
        cambios: 0, reintentos: 0, piezas: 0, logros: [], caida: 0, suelo: 0, rep: 0, soltarBajar: false };
      api.hud({ 'Misión': '1/3', Logradas: '0/3', Puntos: 0 });
      empezarMision(api, '');
    },

    alPulsar: function (id, api) {
      if (!S.activa || !S.p) return;
      if (id === 'izq' || id === 'der') { if (mover(id === 'izq' ? -1 : 1)) api.sonido('punto'); S.rep = 0.22; }
      else if (id === 'arriba' || id === 'girar') girar(api);
      else if (id === 'cambiar') cambiar(api);
    },

    actualizar: function (dt, api) {
      if (!S.activa) return;
      if (S.limpia) {
        S.limpia.t -= dt;
        if (S.limpia.t <= 0) terminarLimpieza(api);
      } else if (S.p) {
        var p = S.p, tk = api.teclas, baja = tk.abajo || tk.bajar;
        if (!baja) S.soltarBajar = false;
        var rapida = baja && !S.soltarBajar, base = MISIONES[S.m].intervalo / api.vel;
        if (tk.izq !== tk.der) {                     /* repetición lateral al mantener pulsado */
          S.rep -= dt;
          if (S.rep <= 0) { mover(tk.izq ? -1 : 1); S.rep = 0.1; }
        }
        if (!choca(p.f, p.x, p.y + 1)) {
          S.suelo = 0; S.caida += dt;
          var paso = rapida ? 0.045 : base;
          while (S.caida >= paso && !choca(p.f, p.x, p.y + 1)) { p.y++; S.caida -= paso; }
        } else {
          S.caida = 0; S.suelo += dt;
          if (S.suelo >= (rapida ? 0.12 : base)) fijar(api);
        }
      }
      api.hud({ 'Misión': (S.m + 1) + '/3', Logradas: S.logros.length + '/3', Puntos: S.puntos, 'Sin bono': S.sinBono || null });
    },

    dibujar: dibujar
  });
})();
