/* 01 · El laberinto de las recompensas */
(function () {
  'use strict';
  var A = Arcade, C = A.C, T = 32, COLS = 15, FILAS = 11;
  var BASE = [
    '###############',
    '#S....#.......#',
    '#.##..#.##.##.#',
    '#.#.......#...#',
    '#.#.##.##.#.#.#',
    '#..h...#...v..#',
    '#.#.##.##.#.#.#',
    '#...#...K...#.#',
    '#.##.##.#..##.#',
    '#....h..#....E#',
    '###############'
  ];
  var RONDAS = [
    { clave: 'A', nombre: 'Puntos inmediatos', corto: 'puntos',
      intro: 'Cada chispa suma puntos al instante y el contador está siempre a la vista. Recoge 12 chispas para abrir la puerta y sal por ella.' },
    { clave: 'B', nombre: 'Insignias y llave de acceso', corto: 'insignias y llave',
      intro: 'Aquí no verás puntos mientras juegas: ganarás insignias de estatus (bronce, plata y oro) y necesitas la llave para tener acceso a la puerta.' },
    { clave: 'C', nombre: 'Feedback útil y elección', corto: 'feedback y elección',
      intro: 'Verás las rutas de los guardianes y recibirás avisos sobre tu progreso. Además eliges tú la ayuda. Recoge 12 chispas y sal por la puerta.' }
  ];
  var DIR = { arriba: [0, -1], abajo: [0, 1], izq: [-1, 0], der: [1, 0] };
  var S;

  function mapaDe(n) {
    if (n === 1) return BASE.map(function (f) { return f.split('').reverse().join(''); });
    if (n === 2) return BASE.slice().reverse();
    return BASE.slice();
  }
  function libre(x, y) { return S.muro[y] && S.muro[y][x] === false; }

  function montar(api) {
    var m = mapaDe(S.ronda), R = RONDAS[S.ronda];
    S.muro = []; S.chispas = {}; S.total = 0; S.guardias = []; S.llave = null;
    for (var y = 0; y < FILAS; y++) {
      S.muro.push([]);
      for (var x = 0; x < COLS; x++) {
        var c = m[y][x];
        S.muro[y].push(c === '#');
        if (c === '.') { S.chispas[x + ',' + y] = true; S.total++; }
        if (c === 'S') S.inicio = { x: x, y: y };
        if (c === 'E') S.puerta = { x: x, y: y };
        if (c === 'K') { if (R.clave === 'B') S.llave = { x: x, y: y }; else { S.chispas[x + ',' + y] = true; S.total++; } }
        if (c === 'h' || c === 'v') {
          S.guardias.push({ tx: x, ty: y, dx: c === 'h' ? 1 : 0, dy: c === 'v' ? 1 : 0, p: 0, eje: c });
          S.chispas[x + ',' + y] = true; S.total++;
        }
      }
    }
    S.guardias.forEach(function (g) {            /* ruta fija de cada guardián, para dibujarla */
      var a = { x: g.tx, y: g.ty }, b = { x: g.tx, y: g.ty };
      while (libre(a.x - g.dx, a.y - g.dy)) { a.x -= g.dx; a.y -= g.dy; }
      while (libre(b.x + g.dx, b.y + g.dy)) { b.x += g.dx; b.y += g.dy; }
      g.a = a; g.b = b;
    });
    S.meta = Math.min(12, S.total);
    S.j = { tx: S.inicio.x, ty: S.inicio.y, dx: 0, dy: 0, p: 0, mira: 1 };
    S.vidas = 3; S.tiempo = 45; S.cogidas = 0; S.puntosRonda = 0; S.tieneLlave = false;
    S.insignias = 0; S.inmune = 1.5; S.pista = []; S.activa = true; S.avisado = 0;
  }

  function empezarRonda(api) {
    var R = RONDAS[S.ronda];
    S.activa = false;
    montar(api); S.activa = false;
    var p;
    if (R.clave === 'C') {
      p = api.elegir({
        titulo: 'Ronda C · ' + R.nombre, texto: R.intro + '\nElige tu ayuda para esta ronda:',
        opciones: [
          { etiqueta: 'Ruta con pistas', detalle: 'Se dibuja el camino hacia la chispa más cercana y, después, hacia la puerta.' },
          { etiqueta: 'Guardianes más lentos', detalle: 'Los guardianes patrullan más despacio; tú decides la ruta.' }
        ]
      }).then(function (r) {
        S.ayudaC = r.i === 0 ? 'pistas' : 'lentos';
        api.registrar('Ronda C: elegí «' + (r.i === 0 ? 'Ruta con pistas' : 'Guardianes más lentos') + '».');
      });
    } else {
      p = api.informar({ titulo: 'Ronda ' + R.clave + ' · ' + R.nombre, texto: R.intro, boton: 'Empezar ronda' });
    }
    p.then(function () { S.activa = true; });
  }

  function repetir(api, motivo) {
    S.activa = false; S.intentos++;
    api.elegir({
      titulo: motivo, texto: 'No pasa nada: repites esta ronda y conservas todo lo que ya has valorado en las anteriores.',
      opciones: [{ etiqueta: 'Repetir la ronda' }, { etiqueta: 'Repetir en modo tranquilo', detalle: 'Sin tiempo y con guardianes más lentos.' }]
    }).then(function (r) { if (r.i === 1) api.activarTranquilo(); empezarRonda(api); });
  }

  function finRonda(api) {
    var R = RONDAS[S.ronda];
    S.activa = false;
    S.puntosRonda += 50 + S.vidas * 20; S.puntos += S.puntosRonda;
    api.sonido('ok');
    api.elegir({
      titulo: '¿Qué me ayudó más a continuar?',
      texto: 'Ronda ' + R.clave + ' superada (' + S.puntosRonda + ' puntos de juego). Valora de 1 (nada) a 5 (mucho) cuánto te ayudaron ' +
        (R.clave === 'A' ? 'los puntos inmediatos' : R.clave === 'B' ? 'las insignias y la llave' : 'el feedback y poder elegir') + ' a seguir jugando.',
      campo: 'Razón (opcional)', enFila: true, opciones: ['1', '2', '3', '4', '5']
    }).then(function (r) {
      S.valor[S.ronda] = r.i + 1; S.razon[S.ronda] = r.texto;
      api.registrar('Ronda ' + R.clave + ' (' + R.corto + '): valoración ' + (r.i + 1) + '/5' + (r.texto ? ' — «' + r.texto + '»' : '') + '.');
      S.ronda++;
      if (S.ronda < 3) empezarRonda(api); else cierre(api);
    });
  }

  function cierre(api) {
    var barras = '<div class="barras">';
    RONDAS.forEach(function (R, i) {
      barras += '<span>' + R.clave + ' · ' + A.esc(R.corto) + '</span><span class="b" style="width:' + (S.valor[i] * 20) + '%"></span><span>' + S.valor[i] + '/5</span>';
    });
    barras += '</div>';
    var saps = '<h3>Cuatro tipos de recompensa (SAPS)</h3><ul>' +
      '<li><b>Estatus:</b> las insignias de bronce, plata y oro de la ronda B.</li>' +
      '<li><b>Acceso:</b> la llave que abría la puerta en la ronda B.</li>' +
      '<li><b>Poder:</b> elegir tu ayuda y tu ruta en la ronda C.</li>' +
      '<li><b>Objetos (stuff):</b> los puntos y chispas acumulados en la ronda A.</li></ul>' +
      '<p class="nota">Tus tres valoraciones describen solo esta partida. Otra persona, u otra tarea, podría responder de forma distinta: ninguna recompensa motiva a todo el mundo por igual.</p>';
    S.resumen = '<h3>Lo que te ayudó a continuar (esta partida)</h3>' + barras;
    api.informar({ titulo: 'Tus tres rondas, comparadas', html: S.resumen + saps, boton: 'Ir a la decisión final' }).then(function () {
      return api.elegir({
        titulo: 'Microdecisión',
        texto: 'Una alumna ha dejado de intentar los ejercicios porque cree que «no se le dan bien»: le falta sensación de competencia. ¿Qué recompensa eliges para ella?',
        opciones: [
          { etiqueta: 'Más puntos por cada ejercicio entregado' },
          { etiqueta: 'Una insignia para quienes terminen primero' },
          { etiqueta: 'Feedback formativo: qué ha hecho bien y cuál es su siguiente paso alcanzable' },
          { etiqueta: 'Acceso a un minijuego si completa la ficha' }
        ]
      });
    }).then(function (r) {
      var nombres = ['más puntos', 'insignia a los primeros', 'feedback formativo', 'acceso a un minijuego'];
      var exp = [
        'Los puntos pueden animar a entregar, pero no le dicen qué hacer mejor. Si el problema es que no se siente capaz, sumar puntos (o no conseguirlos) puede confirmar su idea de que «no vale».',
        'Una insignia por rapidez premia a quien ya domina la tarea. Para quien duda de su competencia suele ser un recordatorio de lo lejos que está.',
        'En este caso suele ser preferible: el feedback formativo le muestra un progreso real y un siguiente paso a su alcance, que es justo lo que alimenta la sensación de competencia.',
        'El acceso puede funcionar como incentivo puntual, pero no cambia su creencia sobre lo que es capaz de hacer; la tarea sigue pareciéndole inalcanzable.'
      ][r.i];
      api.registrar('Microdecisión (alumna desmotivada por falta de competencia): elegí «' + nombres[r.i] + '».');
      S.micro = r.i;
      return api.informar({
        titulo: 'Sobre tu elección',
        texto: exp + '\nCuando falta sensación de competencia, más puntos no explican cómo mejorar. El feedback formativo sí, y puede combinarse con otras recompensas. Aun así, depende del contexto y de cada estudiante.',
        boton: 'Ver pantalla final'
      });
    }).then(function () {
      var mx = Math.max.apply(null, S.valor), mejores = RONDAS.filter(function (R, i) { return S.valor[i] === mx; }).map(function (R) { return R.corto; });
      api.terminar({
        titulo: '¡Laberinto superado!', puntos: S.puntos, html: S.resumen,
        feedback: 'En esta partida valoraste más: ' + mejores.join(' y ') + '. Es una impresión de un momento concreto, no un rasgo tuyo. ' +
          (S.micro === 2 ? 'En la microdecisión optaste por el feedback formativo, coherente con el caso planteado.' :
            'En la microdecisión elegiste otra recompensa; piensa qué información recibiría la alumna para mejorar.') +
          (S.intentos ? ' Repetiste ' + S.intentos + ' ronda(s): reintentar forma parte del juego.' : '')
      });
    });
  }

  /* ---------- Movimiento ---------- */
  function quiere(api) {
    if (S.ultima && api.teclas[S.ultima]) return S.ultima;
    for (var k in DIR) if (api.teclas[k]) return k;
    return null;
  }
  function moverJugador(dt, api) {
    var j = S.j, q = quiere(api), d = q && DIR[q], v = 4.6 * api.vel;
    if (d && d[0]) j.mira = d[0];
    if (!j.dx && !j.dy) {
      if (d && libre(j.tx + d[0], j.ty + d[1])) { j.dx = d[0]; j.dy = d[1]; j.p = 0; } else return;
    } else if (d && d[0] === -j.dx && d[1] === -j.dy) {       /* media vuelta inmediata */
      j.tx += j.dx; j.ty += j.dy; j.dx = -j.dx; j.dy = -j.dy; j.p = 1 - j.p;
    }
    j.p += v * dt;
    if (j.p >= 1) {
      j.tx += j.dx; j.ty += j.dy; j.p -= 1;
      alLlegar(api);
      if (d && libre(j.tx + d[0], j.ty + d[1])) { j.dx = d[0]; j.dy = d[1]; }
      else if (!(q && libre(j.tx + j.dx, j.ty + j.dy))) { j.dx = 0; j.dy = 0; j.p = 0; }
    }
  }
  function puertaAbierta() { return RONDAS[S.ronda].clave === 'B' ? S.tieneLlave : S.cogidas >= S.meta; }
  function alLlegar(api) {
    var j = S.j, k = j.tx + ',' + j.ty, R = RONDAS[S.ronda], px = j.tx * T + T / 2, py = j.ty * T;
    if (S.chispas[k]) {
      delete S.chispas[k]; S.cogidas++; S.puntosRonda += 10; api.sonido('punto');
      if (R.clave === 'A') api.flotar('+10', px, py);
      if (R.clave === 'B' && S.insignias < 3 && S.cogidas >= [5, 10, 15][S.insignias]) {
        S.insignias++;
        api.mensaje('Insignia de ' + ['bronce', 'plata', 'oro'][S.insignias - 1] + ' conseguida (estatus).');
      }
      if (R.clave === 'C' && S.cogidas % 4 === 0 && S.cogidas < S.meta) {
        api.mensaje('Llevas ' + S.cogidas + ' de ' + S.meta + ' chispas. La puerta está ' + (S.puerta.y > 5 ? 'abajo' : 'arriba') + ' a la ' + (S.puerta.x > 7 ? 'derecha' : 'izquierda') + '.');
      }
      if (R.clave !== 'B' && S.cogidas === S.meta) api.mensaje('¡Puerta abierta! Ve hacia la salida.');
    }
    if (S.llave && j.tx === S.llave.x && j.ty === S.llave.y) {
      S.llave = null; S.tieneLlave = true; api.sonido('ok'); api.mensaje('Tienes la llave: ya tienes acceso a la puerta.');
    }
    if (j.tx === S.puerta.x && j.ty === S.puerta.y) {
      if (puertaAbierta()) finRonda(api);
      else if (api.t - S.avisado > 3) {
        S.avisado = api.t;
        api.mensaje(R.clave === 'B' ? 'Puerta cerrada: necesitas la llave.' : 'Puerta cerrada: te faltan ' + (S.meta - S.cogidas) + ' chispas.');
      }
    }
    if (R.clave === 'C' && S.ayudaC === 'pistas') calcularPista();
  }
  function calcularPista() {
    var ini = S.j.tx + ',' + S.j.ty, previo = {}, cola = [[S.j.tx, S.j.ty]], fin = null, abierta = puertaAbierta();
    previo[ini] = null;
    while (cola.length) {
      var n = cola.shift(), k = n[0] + ',' + n[1];
      if (k !== ini && (abierta ? (n[0] === S.puerta.x && n[1] === S.puerta.y) : S.chispas[k])) { fin = k; break; }
      for (var d in DIR) {
        var x = n[0] + DIR[d][0], y = n[1] + DIR[d][1], kk = x + ',' + y;
        if (libre(x, y) && !(kk in previo)) { previo[kk] = k; cola.push([x, y]); }
      }
    }
    S.pista = [];
    while (fin && fin !== ini) { S.pista.push(fin.split(',').map(Number)); fin = previo[fin]; }
  }
  function moverGuardia(g, dt, api) {
    var v = 2.1 * api.vel * (RONDAS[S.ronda].clave === 'C' && S.ayudaC === 'lentos' ? 0.6 : 1);
    g.p += v * dt;
    if (g.p >= 1) { g.tx += g.dx; g.ty += g.dy; g.p -= 1; }
    if (!libre(g.tx + g.dx, g.ty + g.dy)) { if (g.p > 0) g.p = 0; g.dx = -g.dx; g.dy = -g.dy; }
  }
  function pos(e) { return { x: (e.tx + e.dx * e.p) * T + T / 2, y: (e.ty + e.dy * e.p) * T + T / 2 }; }

  A.crear({
    numero: '01', titulo: 'El laberinto de las recompensas', pluma: 'PLUMA-RECOMPENSAS',
    ancho: COLS * T, alto: FILAS * T,
    objetivo: 'Experimentar cómo cambian tus ganas de seguir según la recompensa: puntos inmediatos, insignias y acceso, o feedback útil con autonomía.',
    instrucciones: [
      'Mueve la oca por el laberinto, recoge chispas de aprendizaje y esquiva a los tres guardianes de Obsoletus.',
      'Hay tres rondas en mapas equivalentes; en cada una cambia la recompensa que recibes.',
      'Tras cada ronda valoras qué te ayudó a continuar. La Pluma Dorada se consigue con la reflexión final.'
    ],
    transferencia: '¿Cómo diseñarías una recompensa que reconociera el progreso sin desplazar el interés por aprender?',
    ayuda: '<ul><li><b>Refuerzo extrínseco:</b> premio externo a la tarea (puntos, insignias, premios).</li>' +
      '<li><b>Feedback informativo:</b> información que te dice cómo vas y qué hacer después.</li>' +
      '<li><b>Autonomía:</b> poder elegir cómo afrontar la tarea.</li>' +
      '<li><b>SAPS:</b> estatus, acceso, poder y objetos.</li></ul><p>Los guardianes siempre recorren el mismo pasillo de un extremo a otro.</p>',
    controles: { cruceta: ['arriba', 'abajo', 'izq', 'der'] },

    iniciar: function (api) {
      S = { ronda: 0, puntos: 0, valor: [0, 0, 0], razon: ['', '', ''], intentos: 0, ultima: null, ayudaC: null };
      empezarRonda(api);
    },
    alPulsar: function (id) { if (DIR[id]) S.ultima = id; },

    actualizar: function (dt, api) {
      var R = RONDAS[S.ronda];
      if (!S.activa || !R) return;
      if (!api.tranquilo) {
        S.tiempo -= dt;
        if (S.tiempo <= 0) { repetir(api, 'Se acabó el tiempo'); return; }
      }
      moverJugador(dt, api);
      if (!S.activa) return;
      S.inmune = Math.max(0, S.inmune - dt);
      var pj = pos(S.j);
      for (var i = 0; i < S.guardias.length; i++) {
        var g = S.guardias[i]; moverGuardia(g, dt, api);
        var pg = pos(g);
        if (!S.inmune && Math.abs(pg.x - pj.x) < T * 0.62 && Math.abs(pg.y - pj.y) < T * 0.62) {
          S.vidas--; api.sonido('golpe');
          if (S.vidas <= 0) { repetir(api, 'Los guardianes te han alcanzado'); return; }
          S.j = { tx: S.inicio.x, ty: S.inicio.y, dx: 0, dy: 0, p: 0, mira: 1 }; S.inmune = 2; S.pista = [];
          api.mensaje(R.clave === 'C'
            ? 'Te alcanzó el guardián del pasillo ' + (g.eje === 'h' ? 'horizontal' : 'vertical') + '. Su ruta está marcada: espera a que se aleje antes de cruzar.'
            : 'Un guardián te ha alcanzado. Vuelves a la casilla de salida.');
          break;
        }
      }
      api.hud({
        Ronda: R.clave + ' (' + (S.ronda + 1) + '/3)', Vidas: S.vidas,
        Tiempo: api.tranquilo ? 'sin límite' : Math.ceil(S.tiempo) + ' s',
        Puntos: R.clave === 'A' ? S.puntos + S.puntosRonda : null,
        Insignias: R.clave === 'B' ? S.insignias + '/3' : null,
        Llave: R.clave === 'B' ? (S.tieneLlave ? 'sí' : 'no') : null,
        Chispas: R.clave !== 'B' ? S.cogidas + '/' + S.meta : null
      });
    },

    dibujar: function (ctx, api) {
      if (!S || !S.muro) return;
      var R = RONDAS[Math.min(S.ronda, 2)], x, y;
      for (y = 0; y < FILAS; y++) for (x = 0; x < COLS; x++) {
        if (S.muro[y][x]) { A.caja(ctx, x * T, y * T, T, T, C.morado); ctx.fillStyle = C.morado2; ctx.fillRect(x * T, y * T, T, 3); ctx.fillStyle = '#4a2a94'; ctx.fillRect(x * T, y * T + T - 3, T, 3); }
        else if (S.chispas[x + ',' + y]) {
          ctx.fillStyle = C.menta; ctx.fillRect(x * T + 13, y * T + 11, 6, 10); ctx.fillRect(x * T + 11, y * T + 13, 10, 6);
        }
      }
      if (R.clave === 'C') {                         /* feedback: rutas de los guardianes */
        ctx.strokeStyle = C.rojo; ctx.lineWidth = 2; ctx.setLineDash([4, 6]);
        S.guardias.forEach(function (g) {
          ctx.beginPath(); ctx.moveTo(g.a.x * T + T / 2, g.a.y * T + T / 2); ctx.lineTo(g.b.x * T + T / 2, g.b.y * T + T / 2); ctx.stroke();
        });
        ctx.setLineDash([]);
        S.pista.forEach(function (p) { ctx.fillStyle = C.oro; ctx.fillRect(p[0] * T + 4, p[1] * T + 4, 5, 5); ctx.fillRect(p[0] * T + T - 9, p[1] * T + T - 9, 5, 5); });
      }
      if (S.j.tx !== S.inicio.x || S.j.ty !== S.inicio.y) A.texto(ctx, 'INICIO', S.inicio.x * T + T / 2, S.inicio.y * T + T / 2, { tam: 9, color: C.gris });
      var px = S.puerta.x * T, py = S.puerta.y * T, ab = puertaAbierta();
      A.caja(ctx, px + 2, py + 2, T - 4, T - 4, ab ? '#0d3b2c' : '#3a2f10', ab ? C.menta : C.oro, 3);
      if (ab) A.texto(ctx, 'SAL', px + T / 2, py + T / 2, { tam: 11, color: C.menta, negrita: true });
      else { ctx.fillStyle = C.oro; for (var b = 0; b < 3; b++) ctx.fillRect(px + 8 + b * 7, py + 6, 3, T - 12); }
      if (S.llave) {
        var kx = S.llave.x * T + T / 2, ky = S.llave.y * T + T / 2;
        ctx.fillStyle = C.oro; ctx.fillRect(kx - 10, ky - 5, 10, 10); ctx.fillRect(kx, ky - 2, 11, 4); ctx.fillRect(kx + 6, ky + 2, 3, 4);
        ctx.fillStyle = C.noche; ctx.fillRect(kx - 7, ky - 2, 4, 4);
      }
      S.guardias.forEach(function (g) { var p = pos(g); A.robot(ctx, p.x, p.y + 2, 24); });
      var pj = pos(S.j);
      if (S.inmune > 0) { ctx.strokeStyle = C.menta; ctx.lineWidth = 2; ctx.strokeRect(pj.x - 14, pj.y - 14, 28, 28); }
      A.oca(ctx, pj.x, pj.y + 1, 24, { dir: S.j.mira, paso: (S.j.dx || S.j.dy) && Math.floor(api.t * 8) % 2 });
    }
  });
})();
