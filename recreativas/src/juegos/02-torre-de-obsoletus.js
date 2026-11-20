/* 02 · La torre de Obsoletus */
(function () {
  'use strict';
  var A = Arcade, C = A.C, W = 360, H = 480;
  var L = [466, 370, 274, 178, 82];              /* altura del suelo de cada nivel (0 = base, 4 = azotea) */
  var FASES = ['Plan', 'Actúo', 'Reviso', 'Ajusto'];
  var ANDAR = 95, TREPAR = 85, SALTO = -250, GRAV = 640, VMIN = 56;
  var TABLON = { a: 150, b: 176 }, ANTENA = 300;
  var PISOS = [
    { ini: 40, esc: 300, boca: 346, dir: -1, vel: 62, cada: 2.9, barril: 'plan poco realista', sim: '?', banda: C.morado2 },
    { ini: 300, esc: 60, boca: 14, dir: 1, vel: 70, cada: 2.7, barril: 'distracción', sim: '!', banda: C.rojo },
    { ini: 60, esc: 300, boca: 346, dir: -1, vel: 78, cada: 2.5, barril: 'no revisar errores', sim: '×', banda: C.gris },
    { ini: 300, esc: 60, boca: 14, dir: 1, vel: 84, cada: 2.4, barril: 'procrastinación', sim: 'z', banda: C.menta }
  ];
  var DEC = [
    { titulo: 'Piso 1 · Planifico',
      texto: 'Antes de moverte, fija tu plan para este piso. Los barriles de «plan poco realista» empezarán a rodar en cuanto elijas.',
      ops: [
        { id: 'prisa', et: 'Llegar a la antena en 10 segundos, pase lo que pase', corto: 'plan de 10 segundos', eficaz: false,
          msg: 'Con un plan tan ajustado llegan más barriles seguidos. Se puede superar: espera, salta uno y avanza.' },
        { id: 'meta', et: 'Objetivo concreto: llegar a la escalera en unos 30 s, con una parada a mitad de piso', corto: 'objetivo concreto y tiempo realista', eficaz: true,
          msg: 'Plan concreto: aparece un punto de control a mitad de piso y un tiempo orientativo en el marcador.' },
        { id: 'vago', et: 'Subir sin fijar objetivo ni tiempo: ya iré viendo', corto: 'sin objetivo ni tiempo', eficaz: false,
          msg: 'Sin objetivo ni tiempo no hay referencias en este piso: ni punto de control ni tiempo orientativo.' }
      ] },
    { titulo: 'Piso 2 · Actúo y superviso',
      texto: 'Llegan barriles de «distracción». ¿Qué técnica de atención aplicas mientras avanzas?',
      ops: [
        { id: 'multi', et: 'Atender varias cosas a la vez para aprovechar el tiempo', corto: 'multitarea', eficaz: false,
          msg: 'Con varias cosas a la vez llegan más barriles de distracción. Céntrate en uno cada vez.' },
        { id: 'voluntad', et: 'Dejar el móvil a la vista y confiar en la fuerza de voluntad', corto: 'fuerza de voluntad sin cambiar el entorno', eficaz: false,
          msg: 'Sin cambiar el entorno, las distracciones siguen llegando al mismo ritmo.' },
        { id: 'bloques', et: 'Silenciar avisos y trabajar en bloques cortos con pausas', corto: 'bloques cortos sin avisos', eficaz: true,
          msg: 'Avisos silenciados: los barriles de distracción ruedan más despacio y más separados.' }
      ] },
    { titulo: 'Piso 3 · Reviso',
      texto: 'Pista del trayecto: en este piso hay un tablón con una grieta, y los barriles de «no revisar errores» botan justo al pasar por él. Antes de cruzar, ¿qué error conviene detectar?',
      ops: [
        { id: 'suerte', et: 'Ninguno: si algo sale mal será mala suerte', corto: 'no buscar el error', eficaz: false,
          msg: 'Nada señalado en el suelo. La grieta sigue ahí: fíjate dónde botan los barriles.' },
        { id: 'tablon', et: 'Pisar el tablón agrietado sin mirar: hay que saltarlo', corto: 'detectar el tablón agrietado', eficaz: true,
          msg: 'Error detectado: una pista luminosa marca el tablón agrietado y el salto para evitarlo.' },
        { id: 'correr', et: 'Ir demasiado despacio: lo que hace falta es correr', corto: 'correr más', eficaz: false,
          msg: 'Con las prisas llegan más barriles y el tablón sigue sin señalar. Fíjate dónde botan.' }
      ] },
    { titulo: 'Piso 4 · Ajusto',
      texto: 'Imprevisto: Obsoletus ha roto la escalera prevista y lanza barriles de «procrastinación». ¿Qué haces con tu plan?',
      ops: [
        { id: 'esperar', et: 'Esperar a que la escalera se arregle sola', corto: 'esperar sin cambiar el plan', eficaz: false,
          msg: 'La escalera tardará 10 s en arreglarse. Mientras esperas, siguen llegando barriles.' },
        { id: 'ajustar', et: 'Ajustar el plan: buscar otra ruta y dividir el tramo en dos pasos', corto: 'ajustar el plan con otra ruta', eficaz: true,
          msg: 'Plan ajustado: aparece una escalera alternativa a mitad de piso y un punto de control.' },
        { id: 'improvisar', et: 'Tirar el plan e improvisar por donde salen los barriles', corto: 'improvisar sin plan', eficaz: false,
          msg: 'Hay una subida, pero pegada a la trampilla de los barriles: salta uno y sube enseguida.' }
      ] }
  ];
  var S;

  function opcion(n) { var d = S.dec[n]; return d.length ? DEC[n].ops[d[d.length - 1]] : null; }
  function resaltado() { return S.ef === 'tablon' || S.tablonVisto; }

  /* ---------- Flujo de pisos ---------- */
  function preguntar(api, cambio) {
    var n = S.piso, D = DEC[n];
    S.activa = false; S.barriles = [];
    api.elegir({
      titulo: D.titulo, texto: (cambio ? 'Cambias de estrategia para este piso. ' : '') + D.texto,
      opciones: D.ops.map(function (o) { return { etiqueta: o.et }; })
    }).then(function (r) {
      var o = D.ops[r.i];
      S.dec[n].push(r.i);
      api.registrar('Piso ' + (n + 1) + ' (' + FASES[n] + '): ' + (cambio ? 'cambié a' : 'elegí') + ' «' + o.corto + '».');
      S.medidor[n] = Math.max(S.medidor[n], 0.5);
      montarPiso(api);
      api.mensaje(o.msg, 5200);
    });
  }

  function montarPiso(api) {
    var n = S.piso, P = PISOS[n];
    S.ef = opcion(n).id;
    S.barriles = []; S.sig = 0.7; S.tPiso = 0; S.vidas = 3; S.inmune = 1; S.avisoMeta = false;
    S.cp = { x: P.ini }; S.bandera = null; S.reparo = 0;
    S.escs = S.escs.filter(function (e) { return e.n !== n; });
    if (n < 3) S.escs.push({ x: P.esc, n: n });
    else {
      S.escs.push({ x: P.esc, n: 3, rota: true });
      if (S.ef === 'ajustar') S.escs.push({ x: 170, n: 3, alt: true });
      if (S.ef === 'improvisar') S.escs.push({ x: 40, n: 3, alt: true });
      if (S.ef === 'esperar') S.reparo = 10;
    }
    if (n === 0 && S.ef === 'meta') S.bandera = { x: 170, ok: false };
    if (n === 3 && S.ef === 'ajustar') S.bandera = { x: 240, ok: false };
    S.meta = n === 0 ? (S.ef === 'meta' ? 30 : S.ef === 'prisa' ? 10 : 0) : 0;
    S.j = { x: P.ini, y: L[n], vy: 0, suelo: true, esc: null, dir: P.dir < 0 ? 1 : -1, anda: false };
    S.salto = -9; S.activa = true;
  }

  function recolocar() {
    var j = S.j;
    j.x = S.cp.x; j.y = L[S.piso]; j.vy = 0; j.suelo = true; j.esc = null;
    S.barriles = []; S.sig = 1.2; S.inmune = 1.6; S.salto = -9;
  }

  function tropezar(api, tablon) {
    var n = S.piso, P = PISOS[n];
    S.vidas--; S.caidas[n]++; api.sonido('golpe');
    if (tablon) S.tablonVisto = true;
    if (S.vidas <= 0) { derrota(api); return; }
    recolocar();
    api.mensaje(tablon ? 'El tablón agrietado ha cedido. Ahora queda señalado: pásalo saltando.'
      : 'Te alcanzó un barril de «' + P.barril + '». Vuelves al punto de control. ' +
        (S.ef === 'prisa' || S.ef === 'multi' || S.ef === 'correr' ? 'Con esta estrategia llegan más seguidos: espera, salta uno y avanza.'
          : S.ef === 'improvisar' ? 'Junto a la trampilla hay poco margen: salta el barril y sube enseguida.'
            : 'Salta cuando esté a un paso de la oca.'), 4200);
  }

  function derrota(api) {
    var n = S.piso;
    S.activa = false; S.intentos++; S.barriles = [];
    api.elegir({
      titulo: 'Tres caídas en el piso ' + (n + 1),
      texto: 'No pasa nada: conservas los pisos superados, tus puntos y el medidor. ¿Cómo quieres volver a intentarlo?',
      opciones: [
        { etiqueta: 'Reintentar tramo', detalle: 'Mismo piso y misma estrategia, con tres vidas.' },
        { etiqueta: 'Reintentar en modo tranquilo', detalle: 'Barriles más lentos y sin tiempo.' },
        { etiqueta: 'Reintentar cambiando de estrategia', detalle: 'Vuelves a elegir cómo afrontar este piso.' }
      ]
    }).then(function (r) {
      if (r.i === 1) { api.activarTranquilo(); api.registrar('Piso ' + (n + 1) + ': reintenté en modo tranquilo.'); }
      if (r.i === 2) preguntar(api, true); else montarPiso(api);
    });
  }

  function subirPiso(api) {
    var n = S.piso, j = S.j, extra = 100 + S.vidas * 20;
    if (S.meta === 30 && !api.tranquilo && S.tPiso <= 30) { extra += 30; api.mensaje('Objetivo de tiempo cumplido: +30.'); }
    S.puntos += extra; S.medidor[n] = 1; S.tiempos[n] = Math.round(S.tPiso);
    api.sonido('ok'); api.flotar('+' + extra, j.x, j.y - 34);
    S.piso++; S.barriles = []; S.bandera = null; S.vidas = 3; S.meta = 0; S.reparo = 0;
    j.y = L[S.piso]; j.vy = 0; j.suelo = true; j.esc = null;
    S.cp = { x: j.x };
    if (S.piso < 4) preguntar(api);
    else api.mensaje('Azotea alcanzada. Camina hasta la antena para desconectarla.', 4500);
  }

  function ganar(api) {
    S.activa = false;
    var eficaces = 0, cambios = 0, caidas = 0, h = '<h3>Cómo evolucionó tu plan</h3><ol>';
    for (var n = 0; n < 4; n++) {
      var ops = S.dec[n].map(function (i) { return DEC[n].ops[i]; }), fin = ops[ops.length - 1];
      if (fin.eficaz) eficaces++;
      cambios += ops.length - 1; caidas += S.caidas[n];
      h += '<li><b>' + FASES[n] + ':</b> ' + ops.map(function (o) { return A.esc(o.corto); }).join(' → ') +
        '. ' + (S.caidas[n] ? S.caidas[n] + (S.caidas[n] === 1 ? ' caída' : ' caídas') : 'Sin caídas') + ', ' + S.tiempos[n] + ' s.</li>';
    }
    h += '</ol><p class="nota">Medidor Plan–Actúo–Reviso–Ajusto: completo (4/4). Las fases forman un ciclo: lo que ajustas alimenta el siguiente plan.</p>';
    api.terminar({
      titulo: '¡Antena desconectada!', puntos: S.puntos, html: h,
      feedback: 'En esta partida ' + (eficaces === 4 ? 'las cuatro estrategias que usaste facilitaron el tramo'
        : eficaces === 0 ? 'las estrategias que usaste hicieron los tramos más exigentes, y aun así llegaste arriba'
          : eficaces + ' de tus 4 estrategias finales facilitaron el tramo y el resto lo hicieron más exigente') + '. ' +
        (cambios ? 'Cambiaste de estrategia ' + cambios + (cambios === 1 ? ' vez' : ' veces') + ' tras un tropiezo: eso es ajustar. ' : '') +
        (caidas ? 'Hubo ' + caidas + (caidas === 1 ? ' caída' : ' caídas') + ' y seguiste desde el punto de control. ' : '') +
        'Son decisiones dentro de un juego: una sola partida no dice cómo aprendes ni cómo te organizas fuera de él.'
    });
  }

  /* ---------- Simulación ---------- */
  function escaleraEn(x) {
    for (var i = 0; i < S.escs.length; i++) {
      var e = S.escs[i];
      if (e.n === S.piso && !e.rota && Math.abs(e.x - x) < 13) return e;
    }
    return null;
  }

  function moverOca(dt, api) {
    var j = S.j, n = S.piso, t = api.teclas, dx = (t.der ? 1 : 0) - (t.izq ? 1 : 0);
    j.anda = false;
    if (j.esc) {
      if (dx && j.y > L[n] - 5) { j.esc = null; j.y = L[n]; j.suelo = true; }
      else {
        var dy = (t.abajo ? 1 : 0) - (t.arriba ? 1 : 0);
        j.y += dy * TREPAR * dt; j.anda = !!dy;
        if (j.y >= L[n]) { j.y = L[n]; if (dy > 0) { j.esc = null; j.suelo = true; } }
        if (j.y <= L[n + 1]) { subirPiso(api); }
        return;
      }
    }
    if (dx) { j.x = A.limitar(j.x + dx * ANDAR * dt, 12, W - 12); j.dir = dx; j.anda = j.suelo; }
    if (j.suelo && api.t - S.salto < 0.14) { j.vy = SALTO; j.suelo = false; S.salto = -9; api.sonido('salto'); }
    if (!j.suelo) {
      j.vy += GRAV * dt; j.y += j.vy * dt;
      if (j.y >= L[n]) { j.y = L[n]; j.vy = 0; j.suelo = true; }
    } else if (t.arriba && n < 4) {
      var e = escaleraEn(j.x);
      if (e) { j.esc = e; j.x = e.x; j.suelo = false; j.vy = 0; }
    }
  }

  function alturaBarril(b) {
    if (S.piso !== 2 || b.x < TABLON.a - 8 || b.x > TABLON.b + 8) return 0;
    return Math.sin((b.x - TABLON.a + 8) / (TABLON.b - TABLON.a + 16) * Math.PI) * 8;
  }

  function moverBarriles(dt, api) {
    var n = S.piso, P = PISOS[n], j = S.j;
    var v = Math.max(VMIN, P.vel * api.vel * (S.ef === 'bloques' ? 0.8 : 1));
    var k = S.ef === 'prisa' || S.ef === 'multi' ? 0.72 : S.ef === 'correr' ? 0.75 : S.ef === 'bloques' ? 1.6 : 1;
    S.sig -= dt;
    if (S.sig <= 0) { S.barriles.push({ x: P.boca, hecho: false }); S.sig = P.cada * k / api.vel; }
    var caja = { x: j.x - 4, y: j.y - 22, w: 8, h: 22 };
    for (var i = S.barriles.length - 1; i >= 0; i--) {
      var b = S.barriles[i], by;
      b.x += P.dir * v * dt;
      if (b.x < 10 || b.x > W - 10) { S.barriles.splice(i, 1); continue; }
      by = L[n] - alturaBarril(b);
      if (!b.hecho && !j.suelo && !j.esc && Math.abs(b.x - j.x) < 7 && j.y < by - 13) {
        b.hecho = true; S.puntos += 10; S.saltados++; api.sonido('punto'); api.flotar('+10', j.x, j.y - 30);
      }
      if (S.inmune <= 0 && A.choca(caja, { x: b.x - 4, y: by - 11, w: 8, h: 11 })) { tropezar(api, false); return; }
    }
  }

  /* ---------- Dibujo ---------- */
  function dibMedidor(ctx) {
    for (var i = 0; i < 4; i++) {
      var x = 5 + i * 88, m = S.medidor[i];
      A.caja(ctx, x, 5, 86, 24, C.noche2);
      if (m > 0) { ctx.fillStyle = C.morado; ctx.fillRect(x, 5, 86 * m, 24); }
      A.caja(ctx, x, 5, 86, 24, null, m >= 1 ? C.menta : S.piso === i ? C.blanco : C.morado2, 2);
      A.texto(ctx, FASES[i] + (m >= 1 ? ' ✓' : m > 0 ? ' …' : ''), x + 43, 18, { tam: 13, negrita: true });
    }
  }
  function dibEscalera(ctx, e) {
    var y0 = L[e.n + 1], y1 = L[e.n], activa = e.n === S.piso, col = e.alt ? C.menta : activa ? C.blanco : C.gris, y;
    ctx.fillStyle = col;
    if (e.rota) {
      ctx.fillRect(e.x - 9, y0, 3, 34); ctx.fillRect(e.x + 6, y0, 3, 26);
      ctx.fillRect(e.x - 9, y0 + 12, 18, 3); ctx.fillRect(e.x - 9, y0 + 24, 12, 3);
      ctx.fillRect(e.x - 9, y1 - 14, 3, 14); ctx.fillRect(e.x + 6, y1 - 8, 3, 8);
      A.texto(ctx, 'ROTA', e.x, y0 + 50, { tam: 12, color: C.rojo, negrita: true });
      if (S.reparo > 0 && activa) A.texto(ctx, Math.ceil(S.reparo) + ' s', e.x, y0 + 66, { tam: 13, negrita: true });
      return;
    }
    ctx.fillRect(e.x - 9, y0, 3, y1 - y0); ctx.fillRect(e.x + 6, y0, 3, y1 - y0);
    for (y = y0 + 8; y < y1 - 2; y += 12) ctx.fillRect(e.x - 9, y, 18, 3);
  }
  function dibBandera(ctx, b, y) {
    ctx.fillStyle = C.blanco; ctx.fillRect(b.x - 1, y - 34, 3, 34);
    if (b.ok) { ctx.fillStyle = C.menta; ctx.fillRect(b.x + 2, y - 34, 16, 12); A.texto(ctx, '✓', b.x + 10, y - 28, { tam: 11, color: C.noche, negrita: true, sombra: false }); }
    else { ctx.strokeStyle = C.menta; ctx.lineWidth = 2; ctx.strokeRect(b.x + 3, y - 33, 14, 10); }
  }
  function dibBarril(ctx, x, y, P) {
    ctx.fillStyle = '#7a4f33'; ctx.fillRect(x - 8, y - 16, 16, 16);
    ctx.fillStyle = '#a06a45'; ctx.fillRect(x - 6, y - 16, 12, 16);
    ctx.fillStyle = P.banda; ctx.fillRect(x - 8, y - 14, 16, 2); ctx.fillRect(x - 8, y - 4, 16, 2);
    A.texto(ctx, P.sim, x, y - 8, { tam: 12, negrita: true, color: C.blanco });
  }

  A.crear({
    numero: '02', titulo: 'La torre de Obsoletus', pluma: 'PLUMA-AUTORREGULACION',
    ancho: W, alto: H,
    objetivo: 'Experimentar las fases de la autorregulación del aprendizaje: planificar, ejecutar y supervisar, evaluar y ajustar.',
    instrucciones: [
      'Sube los cuatro pisos de la torre hasta la antena de Obsoletus: camina, salta los barriles y trepa por las escaleras.',
      'Al llegar a cada piso tomas una decisión (plan, atención, revisión, ajuste) que cambia lo que encuentras en ese tramo.',
      'Tienes tres vidas por piso y punto de control en cada uno. La Pluma Dorada se consigue con la reflexión final.'
    ],
    teclas: 'Teclado: flechas o WASD para andar y subir escaleras, Espacio para saltar. En móvil o tableta: cruceta y botón Saltar.',
    transferencia: '¿Qué actividad permitiría a tus estudiantes hacer visible cómo planifican, supervisan y ajustan su aprendizaje?',
    ayuda: '<ul><li><b>Plan:</b> fijar un objetivo concreto y un tiempo realista.</li>' +
      '<li><b>Actúo:</b> aplicar la estrategia y supervisar la atención mientras se trabaja.</li>' +
      '<li><b>Reviso:</b> comparar lo ocurrido con el plan y localizar el error.</li>' +
      '<li><b>Ajusto:</b> cambiar el plan cuando algo no funciona o surge un imprevisto.</li></ul>' +
      '<p>Los barriles ruedan siempre por el piso en el sentido de las flechas del suelo. Salta cuando estén a un paso de la oca. ' +
      'Para subir, colócate en la escalera y mantén ▲.</p>',
    controles: { cruceta: ['arriba', 'abajo', 'izq', 'der'], acciones: [{ id: 'saltar', etiqueta: 'Saltar' }] },
    _estado: function () { return S; },

    iniciar: function (api) {
      S = { piso: 0, puntos: 0, medidor: [0, 0, 0, 0], dec: [[], [], [], []], caidas: [0, 0, 0, 0], tiempos: [0, 0, 0, 0],
        intentos: 0, saltados: 0, tablonVisto: false, escs: [], barriles: [], vidas: 3, activa: false, ef: null,
        bandera: null, reparo: 0, meta: 0, tPiso: 0, inmune: 0, salto: -9, cp: { x: 40 },
        j: { x: 40, y: L[0], vy: 0, suelo: true, esc: null, dir: 1, anda: false } };
      preguntar(api);
    },
    alPulsar: function (id, api) { if (id === 'saltar' && S) S.salto = api.t; },

    actualizar: function (dt, api) {
      if (!S || !S.activa) return;
      var n = S.piso, j = S.j;
      S.inmune = Math.max(0, S.inmune - dt);
      moverOca(dt, api);
      if (!S.activa) return;
      if (S.piso !== n) n = S.piso;
      else if (n < 4) {
        S.tPiso += dt;
        if (S.meta && !api.tranquilo && !S.avisoMeta && S.tPiso > S.meta) {
          S.avisoMeta = true;
          api.mensaje(S.meta === 10 ? 'Han pasado los 10 s: el plan no era realista para este tramo. Sigue a tu ritmo, sin penalización.'
            : 'Has pasado el tiempo orientativo. No hay penalización: sirve para comparar plan y resultado.', 4500);
        }
        if (S.reparo > 0) {
          S.reparo -= dt;
          if (S.reparo <= 0) {
            S.escs.forEach(function (e) { if (e.n === 3) e.rota = false; });
            api.mensaje('La escalera ya está arreglada. Esperar ha costado tiempo y barriles: otra ruta habría sido un ajuste.', 4500);
          }
        }
        if (S.bandera && !S.bandera.ok && Math.abs(j.x - S.bandera.x) < 10 && !j.esc) {
          S.bandera.ok = true; S.cp = { x: S.bandera.x }; S.puntos += 20; api.sonido('ok');
          api.flotar('Punto de control', S.bandera.x, L[n] - 44, { color: C.menta });
        }
        if (n === 2 && j.suelo && !j.esc && S.inmune <= 0 && j.x > TABLON.a + 2 && j.x < TABLON.b - 2) { tropezar(api, true); }
        if (S.activa) moverBarriles(dt, api);
      } else if (Math.abs(j.x - ANTENA) < 14 && j.suelo) { ganar(api); }
      api.hud({
        Piso: Math.min(S.piso + 1, 4) + '/4', Vidas: S.vidas,
        Tiempo: S.piso > 3 ? null : api.tranquilo ? 'sin límite' : S.meta ? Math.max(0, Math.ceil(S.meta - S.tPiso)) + ' s' : Math.floor(S.tPiso) + ' s',
        Puntos: S.puntos
      });
    },

    dibujar: function (ctx, api) {
      if (!S) return;
      var n = S.piso, P = PISOS[Math.min(n, 3)], j = S.j, i, x, y;
      /* muro de la torre */
      ctx.fillStyle = C.noche2;
      for (y = 44; y < H; y += 24) for (x = (y / 24 % 2) * 30 - 20; x < W; x += 60) ctx.fillRect(x, y, 26, 2);
      /* pisos */
      for (i = 0; i < 5; i++) {
        A.caja(ctx, 0, L[i], W, 10, C.morado); ctx.fillStyle = C.morado2; ctx.fillRect(0, L[i], W, 3);
        ctx.fillStyle = '#4a2a94'; for (x = 10; x < W; x += 40) ctx.fillRect(x, L[i] + 5, 4, 3);
      }
      /* tablón agrietado del piso 3 */
      ctx.fillStyle = '#2b1d55'; ctx.fillRect(TABLON.a, L[2], TABLON.b - TABLON.a, 10);
      ctx.strokeStyle = C.noche; ctx.lineWidth = 2; ctx.beginPath();
      ctx.moveTo(TABLON.a + 4, L[2]); ctx.lineTo(TABLON.a + 10, L[2] + 5); ctx.lineTo(TABLON.a + 7, L[2] + 10);
      ctx.moveTo(TABLON.a + 15, L[2]); ctx.lineTo(TABLON.a + 20, L[2] + 6); ctx.lineTo(TABLON.a + 16, L[2] + 10); ctx.stroke();
      if (n === 2 && resaltado()) {
        A.caja(ctx, TABLON.a - 2, L[2] - 2, TABLON.b - TABLON.a + 4, 14, null, C.oro, 2);
        ctx.fillStyle = C.oro;
        for (i = 0; i <= 8; i++) { x = TABLON.a - 22 + i * 8.8; ctx.fillRect(x, L[2] - 8 - Math.sin(i / 8 * Math.PI) * 30, 3, 3); }
        A.texto(ctx, 'SALTA', (TABLON.a + TABLON.b) / 2, L[2] - 50, { tam: 13, color: C.oro, negrita: true });
      }
      /* antena y Obsoletus en la azotea */
      ctx.fillStyle = C.gris; ctx.fillRect(ANTENA - 2, 42, 4, 40); ctx.fillRect(ANTENA - 10, 50, 20, 3); ctx.fillRect(ANTENA - 6, 60, 12, 3);
      ctx.fillStyle = S.medidor[3] >= 1 && !S.activa ? C.gris : C.rojo; ctx.fillRect(ANTENA - 4, 36, 8, 8);
      A.robot(ctx, 336, L[4] - 13, 26);
      if (n === 4) A.texto(ctx, 'ANTENA ▶', ANTENA - 60, L[4] - 34, { tam: 13, color: C.oro, negrita: true });
      /* escaleras */
      S.escs.forEach(function (e) { dibEscalera(ctx, e); });
      if (n < 3) dibEscalera(ctx, { x: PISOS[3].esc, n: 3, rota: true });
      for (i = n + 1; i < 3; i++) dibEscalera(ctx, { x: PISOS[i].esc, n: i });
      if (n < 4 && S.dec[n].length) {
        /* trampilla, sentido de los barriles y rótulo */
        A.caja(ctx, P.boca - 12, L[n] - 22, 24, 22, '#000', C.gris, 2);
        var fin = P.dir < 0 ? 2 : W - 12;
        A.caja(ctx, fin, L[n] - 12, 10, 12, '#000', C.gris, 2);
        ctx.strokeStyle = C.gris; ctx.lineWidth = 2;
        for (x = 50; x < W - 30; x += 52) {
          ctx.beginPath(); ctx.moveTo(x - P.dir * 4, L[n] + 13); ctx.lineTo(x + P.dir * 4, L[n] + 17); ctx.lineTo(x - P.dir * 4, L[n] + 21); ctx.stroke();
        }
        A.texto(ctx, '«' + P.sim + '» ' + P.barril, W / 2, L[n] - 78, { tam: 13, color: C.blanco });
        if (S.bandera) dibBandera(ctx, S.bandera, L[n]);
        S.barriles.forEach(function (b) { dibBarril(ctx, b.x, L[n] - alturaBarril(b), P); });
      }
      /* oca */
      if (S.inmune > 0 && S.activa) { ctx.strokeStyle = C.menta; ctx.lineWidth = 2; ctx.strokeRect(j.x - 13, j.y - 26, 26, 27); }
      A.oca(ctx, j.x, j.y - 12, 24, { dir: j.dir, paso: j.anda && Math.floor(api.t * 9) % 2 });
      /* medidor Plan–Actúo–Reviso–Ajusto */
      ctx.fillStyle = C.noche; ctx.fillRect(0, 0, W, 34);
      dibMedidor(ctx);
    }
  });
})();
