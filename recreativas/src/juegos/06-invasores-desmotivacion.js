/* 06 · Invasores de la desmotivación */
(function () {
  'use strict';
  var A = Arcade, C = A.C, W = 360, H = 420;
  var LIMITE = 338, NAVE_Y = 358, SALIDA = 72, EW = 110, EH = 44, CARRIL = [60, 180, 300];
  var ORDEN = ['op', 'dif', 'fb', 'ap'];
  var DEF = {
    op: { n: 'Dar opciones', icono: '◆', color: C.oro },
    dif: { n: 'Ajustar dificultad', icono: '▲', color: C.menta },
    fb: { n: 'Feedback útil', icono: '●', color: C.blanco },
    ap: { n: 'Apoyo/colaboración', icono: '✚', color: C.morado2 }
  };
  /* Cada amenaza: defensas reconocidas (ok) con explicación breve (para el aviso) y completa (para el final). */
  var AM = {
    aut: { n: 'sin autonomía', l: ['sin', 'autonomía'],
      pista: 'Aquí otra persona lo decide todo. ¿Qué defensa devuelve al alumnado capacidad de decidir?',
      ok: { op: ['elegir devuelve control sobre la tarea.',
        'poder elegir tema, formato u orden devolvía a este grupo parte del control sobre la tarea.'] } },
    reto: { n: 'reto imposible', l: ['reto', 'imposible'],
      pista: 'La tarea queda muy lejos de lo que hoy saben hacer. ¿Cambias el reto o lo acompañas?',
      ok: { dif: ['el reto graduado vuelve a estar al alcance.',
        'acercar el reto a lo que el grupo ya sabía hacer (pasos intermedios, niveles) lo volvía alcanzable sin vaciarlo.'],
      ap: ['con ayuda, lo inalcanzable a solas queda al alcance.',
        'con andamiaje o ayuda de compañeros, un reto inalcanzable a solas podía quedar al alcance.'] } },
    fbt: { n: 'feedback tardío', l: ['feedback', 'tardío'],
      pista: 'La información llega cuando ya no sirve para mejorar. ¿Qué defensa la da a tiempo y con contenido?',
      ok: { fb: ['información concreta y a tiempo permite corregir.',
        'una información concreta y a tiempo permitía corregir mientras la tarea aún importaba.'] } },
    ais: { n: 'aislamiento', l: ['aislamiento'],
      pista: 'Nadie con quien contar ni contrastar ideas. ¿Qué defensa crea vínculos dentro de la tarea?',
      ok: { ap: ['trabajar con otros atiende la necesidad de relación.',
        'trabajar con otras personas y sentirse acompañado atendía la necesidad de relación.'] } },
    rep: { n: 'repetición sin sentido', l: ['repetición', 'sin sentido'],
      pista: 'Se repite lo mismo sin saber para qué. ¿Y si pudieran elegir, o si la práctica cambiara al progresar?',
      ok: { op: ['elegir contexto o formato da propósito a la práctica.',
        'elegir contexto, tema o formato ayudaba a que la práctica tuviera un propósito para quien la hacía.'],
      dif: ['variar y graduar el reto hace visible el progreso.',
        'variar y graduar el reto convertía la repetición mecánica en práctica con progreso visible.'] } },
    mie: { n: 'miedo al error', l: ['miedo', 'al error'],
      pista: 'Equivocarse se vive como amenaza. ¿Qué convierte el error en información, o hace más seguro arriesgarse?',
      ok: { fb: ['el error pasa a ser información para el siguiente paso.',
        'un feedback que trata el error como información (qué pasó y cuál es el siguiente paso) le quitaba su carga de amenaza.'],
      ap: ['un clima de apoyo hace más seguro equivocarse.',
        'un clima de apoyo entre iguales hacía más seguro arriesgarse y equivocarse.'] } }
  };
  var OLEADAS = [
    { nombre: 'Fundamentos de motivación', vel: 9, max: 2, cada: 6, lista: ['aut', 'fbt', 'ais'],
      intro: 'Tres nubarrones de desánimo bajan hacia la Escuela del Saber. Elige una defensa (1–4), colócate debajo y dispara.\nSi la defensa no encaja con la amenaza verás «REVISAR» y una pista: no pierdes ninguna vida por ello. Solo pierdes una si un nubarrón llega a la escuela.' },
    { nombre: 'Decisiones de diseño', vel: 11, max: 2, cada: 5.5, lista: ['reto', 'rep', 'mie', 'aut'],
      intro: 'Ahora las amenazas nacen de cómo está diseñada una actividad. Bajan cuatro, un poco más deprisa.\nAlgunas admiten dos defensas razonables: el juego reconoce ambas.' },
    { nombre: 'Transferencia al aula', vel: 13, max: 3, cada: 5, lista: ['fbt', 'ais', 'reto', 'mie', 'rep'],
      intro: 'Última oleada: cinco amenazas en un aula ficticia, hasta tres a la vez. Piensa qué necesita cada caso antes de disparar.' }
  ];
  var S;

  function otras(clave, def) { return Object.keys(AM[clave].ok).filter(function (d) { return d !== def; }); }
  function restantes() { return S.cola.length + S.enemigos.length; }

  function empezarOleada(api, reintento) {
    var O = OLEADAS[S.oleada];
    S.activa = false; S.vidas = 3; S.balas = []; S.timer = 0.6; S.cad = 0;
    if (reintento) {
      S.enemigos.forEach(function (e) { S.cola.push(e); }); S.enemigos = [];
      S.activa = true; return;
    }
    S.enemigos = [];
    S.cola = O.lista.map(function (k) { return { clave: k, fallos: 0, revisar: 0, x: 0, y: 0, carril: 0, fase: 0 }; });
    api.informar({ titulo: 'Oleada ' + (S.oleada + 1) + ' de 3 · ' + O.nombre, texto: O.intro, boton: 'Defender la escuela' })
      .then(function () { S.activa = true; });
  }

  function derrota(api) {
    S.activa = false; S.reintentos++; S.balas = [];
    api.elegir({
      titulo: 'La escuela necesita un respiro',
      texto: 'Tres amenazas han llegado a la Escuela del Saber en esta oleada. No pasa nada: conservas las ' + S.prot +
        ' que ya has atendido y vuelves a intentar solo las que quedan.',
      opciones: [{ etiqueta: 'Reintentar la oleada' },
        { etiqueta: 'Reintentar en modo tranquilo', detalle: 'Los nubarrones bajan más despacio: más tiempo para pensar.' }]
    }).then(function (r) { if (r.i === 1) api.activarTranquilo(); empezarOleada(api, true); });
  }

  function aparecer() {
    var O = OLEADAS[S.oleada], i, c, libre;
    for (i = 0; i < 3; i++) {
      c = (S.sigCarril + i) % 3;
      libre = S.enemigos.every(function (e) { return e.carril !== c || e.y > SALIDA + EH + 16; });
      if (libre) break;
    }
    if (!libre) return false;
    var e = S.cola.shift();
    e.carril = c; e.y = SALIDA; e.x = CARRIL[c]; e.fase = S.creados * 1.7; e.revisar = 0;
    S.creados++; S.sigCarril = (c + 2) % 3;
    S.enemigos.push(e); S.timer = O.cada;
    return true;
  }

  function disparar(api) {
    if (!S || !S.activa || S.cad > 0) return;
    var d = api.herramienta;
    if (!d) {
      if (api.t - S.avisoT > 2.5) { S.avisoT = api.t; api.sonido('error'); api.mensaje('Antes de disparar, elige una defensa: teclas 1–4 o los botones de abajo.'); }
      return;
    }
    S.cad = 0.45; S.disp[d]++;
    S.balas.push({ x: S.nx, y: NAVE_Y - 22, def: d });
    api.sonido('disparo');
  }

  function impacto(b, e, api) {
    var a = AM[e.clave], bien = a.ok[b.def];
    if (!bien) {
      e.fallos++; e.revisar = api.t + 1.8; S.revisiones++; S.fall[b.def]++;
      api.sonido('error');
      api.flotar('? REVISAR', A.limitar(e.x, 50, W - 50), e.y + EH + 16, { color: C.oro, tam: 14, dur: 1.4 });
      api.mensaje(e.fallos >= 2
        ? 'Pista: contra «' + a.n + '» podría servir «' + DEF[Object.keys(a.ok)[0]].n + '». No has perdido ninguna vida.'
        : 'Revisa: ' + a.pista, 4800);
      return;
    }
    S.enemigos.splice(S.enemigos.indexOf(e), 1);
    S.prot++; S.puntos += e.fallos ? 60 : 100;
    if (!e.fallos) S.primera++;
    S.casos.push({ clave: e.clave, def: b.def, fallos: e.fallos, oleada: S.oleada });
    S.efic[b.def].push(e.clave);
    S.destellos.push({ x: e.x, y: e.y + EH / 2, t: api.t, def: b.def });
    api.sonido('ok');
    api.flotar('OK: ' + DEF[b.def].n, A.limitar(e.x, 84, W - 84), e.y + EH / 2, { color: C.menta, tam: 13, dur: 1.3 });
    var alt = otras(e.clave, b.def);
    api.mensaje('«' + a.n + '» + ' + DEF[b.def].n + ': ' + bien[0] +
      (alt.length ? ' Aquí también valía «' + DEF[alt[0]].n + '».' : ''), 4200);
  }

  function finOleada(api) {
    S.activa = false; S.puntos += S.vidas * 10; S.oleada++;
    if (S.oleada < OLEADAS.length) empezarOleada(api); else cierre(api);
  }

  /* ---------- Cierre: justificar una elección y resumen ---------- */
  function resumenHtml() {
    var h = '<h3>Intervenciones que seleccionaste</h3><ul>';
    ORDEN.forEach(function (d) {
      var cuenta = {}, lista = [];
      S.efic[d].forEach(function (k) { cuenta[k] = (cuenta[k] || 0) + 1; });
      Object.keys(cuenta).forEach(function (k) { lista.push('«' + AM[k].n + '»' + (cuenta[k] > 1 ? ' ×' + cuenta[k] : '')); });
      h += '<li><b>' + DEF[d].icono + ' ' + A.esc(DEF[d].n) + ':</b> ' + S.disp[d] + ' disparo(s). ' +
        (lista.length ? 'Eficaz aquí frente a ' + A.esc(lista.join(', ')) + '.' : 'No resolvió ninguna amenaza en esta partida.') +
        (S.fall[d] ? ' ' + S.fall[d] + ' impacto(s) pidieron revisión.' : '') + '</li>';
    });
    h += '</ul><h3>Por qué fueron eficaces en estos casos ficticios</h3><ul>';
    Object.keys(AM).forEach(function (k) {
      var usadas = {}, a = AM[k];
      S.casos.forEach(function (c) { if (c.clave === k) usadas[c.def] = true; });
      var u = Object.keys(usadas), t = '';
      u.forEach(function (d) { t += ' <b>' + A.esc(DEF[d].n) + '</b>: ' + A.esc(a.ok[d][1]); });
      Object.keys(a.ok).forEach(function (d) {
        if (!usadas[d]) t += ' <span class="nota">También se reconocía «' + A.esc(DEF[d].n) + '»: ' + A.esc(a.ok[d][1]) + '</span>';
      });
      h += '<li>«' + A.esc(a.n) + '» →' + t + '</li>';
    });
    h += '</ul><p class="nota">Son casos inventados y simplificados. En un aula real la misma amenaza puede pedir otra respuesta, o varias a la vez, según el grupo, la tarea y el momento: no hay receta universal.</p>';
    return h;
  }

  function cierre(api) {
    var caso = null, i;
    for (i = S.casos.length - 1; i >= 0 && !caso; i--) if (Object.keys(AM[S.casos[i].clave].ok).length > 1) caso = S.casos[i];
    caso = caso || S.casos[S.casos.length - 1];
    var a = AM[caso.clave], d = DEF[caso.def], razon = a.ok[caso.def][1], alt = otras(caso.clave, caso.def);
    var ops = [
      { t: 'Porque, en este caso, ' + razon, tipo: 'caso' },
      { t: 'Porque «' + d.n + '» funciona con cualquier grupo y en cualquier tarea.', tipo: 'receta' },
      { t: 'Porque así se reparten más puntos, y con eso basta para motivar.', tipo: 'puntos' }
    ];
    var giro = (S.disp.op + S.disp.dif + S.disp.fb + S.disp.ap) % 3;
    ops = ops.slice(giro).concat(ops.slice(0, giro));
    api.elegir({
      titulo: 'Escuela protegida: justifica una elección',
      texto: 'Has atendido las 12 amenazas. Una de ellas fue «' + a.n + '» y la neutralizaste con «' + d.n + '». ¿Qué justificación te parece más sólida para esa elección?',
      campo: 'Tu propia razón (opcional)',
      opciones: ops.map(function (o) { return { etiqueta: o.t }; })
    }).then(function (r) {
      var o = ops[r.i], extra = alt.length ? ' En este caso también se reconocía «' + DEF[alt[0]].n + '»: ' + a.ok[alt[0]][1] : '';
      var com = o.tipo === 'caso'
        ? 'Tu justificación se apoya en lo que le pasaba a este grupo ficticio y no en una regla general.' + extra
        : o.tipo === 'receta'
          ? 'Conviene matizar: ninguna intervención funciona siempre. Aquí «' + d.n + '» encajaba porque ' + razon + extra
          : 'Los puntos pueden animar a participar, pero no explican por qué esta defensa atendía la amenaza: ' + razon + extra;
      S.just = o.tipo;
      api.registrar('Justificación («' + a.n + '» → «' + d.n + '»): elegí «' + o.t + '»' + (r.texto ? ' — con mis palabras: «' + r.texto + '»' : '') + '.');
      return api.informar({ titulo: 'Sobre tu justificación', texto: com + '\nOtro grupo u otra tarea podrían necesitar una respuesta distinta.', boton: 'Ver pantalla final' });
    }).then(function () {
      var mas = ORDEN.slice().sort(function (x, y) { return S.disp[y] - S.disp[x]; })[0];
      ORDEN.forEach(function (k) {
        if (!S.disp[k]) { api.registrar(DEF[k].n + ': no la usé en esta partida.'); return; }
        api.registrar(DEF[k].n + ': ' + S.disp[k] + ' disparo(s), ' + S.efic[k].length + ' amenaza(s) neutralizada(s), ' + S.fall[k] + ' revisión(es).');
      });
      if (S.reintentos) api.registrar('Reintenté una oleada ' + S.reintentos + ' vez/veces.');
      api.terminar({
        titulo: '¡Escuela del Saber protegida!', puntos: S.puntos, html: resumenHtml(),
        feedback: 'En esta partida acertaste al primer intento en ' + S.primera + ' de 12 amenazas y revisaste tu elección ' + S.revisiones +
          ' vez/veces tras una pista: revisar forma parte de diseñar. La defensa que más disparaste fue «' + DEF[mas].n + '». ' +
          (S.just === 'caso' ? 'Justificaste tu elección a partir del caso concreto.' : 'En la justificación elegiste una razón general; prueba a formularla desde lo que necesitaba ese grupo.') +
          ' Todo esto describe una partida con casos ficticios, no tu forma de enseñar.'
      });
    });
  }

  /* ---------- Dibujo ---------- */
  function icono(ctx, id, x, y, r, color) {
    ctx.fillStyle = color || DEF[id].color; ctx.beginPath();
    if (id === 'op') { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y); ctx.lineTo(x, y + r); ctx.lineTo(x - r, y); }
    else if (id === 'dif') { ctx.moveTo(x, y - r); ctx.lineTo(x + r, y + r); ctx.lineTo(x - r, y + r); }
    else if (id === 'fb') { ctx.arc(x, y, r, 0, Math.PI * 2); }
    else { var g = r * 0.38; ctx.rect(x - g, y - r, g * 2, r * 2); ctx.rect(x - r, y - g, r * 2, g * 2); }
    ctx.closePath(); ctx.fill();
  }
  function nubarron(ctx, e, api) {
    var x = Math.round(e.x - EW / 2), y = Math.round(e.y), a = AM[e.clave], rev = e.revisar > api.t;
    var paso = Math.floor(api.t * 2 + e.fase) % 2;
    ctx.fillStyle = '#3b2a78';                                  /* penacho y flecos: silueta de nube de tormenta */
    ctx.fillRect(x + 12, y - 6, 26, 8); ctx.fillRect(x + 46, y - 9, 30, 11); ctx.fillRect(x + 82, y - 5, 18, 7);
    for (var i = 0; i < 5; i++) ctx.fillRect(x + 10 + i * 21, y + EH - 1, 8, 5 + ((i + paso) % 2) * 3);
    A.caja(ctx, x, y, EW, EH, '#241a4d', rev ? C.oro : C.morado2, rev ? 3 : 2);
    if (a.l.length === 1) A.texto(ctx, a.l[0], e.x, y + EH / 2 + 1, { tam: 14, negrita: true });
    else { A.texto(ctx, a.l[0], e.x, y + 14, { tam: 14, negrita: true }); A.texto(ctx, a.l[1], e.x, y + 31, { tam: 14, negrita: true }); }
    if (rev) { A.caja(ctx, x + EW - 20, y - 12, 20, 20, C.oro, '#000', 2); A.texto(ctx, '?', x + EW - 10, y - 1, { tam: 15, color: '#000', negrita: true, sombra: false }); }
  }
  function nave(ctx, api) {
    var x = Math.round(S.nx), y = NAVE_Y, d = api.herramienta;
    ctx.fillStyle = C.blanco; ctx.beginPath(); ctx.moveTo(x - 22, y + 14); ctx.lineTo(x + 22, y + 14); ctx.lineTo(x + 12, y + 3); ctx.lineTo(x - 12, y + 3); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#c9cfe8'; ctx.beginPath(); ctx.moveTo(x - 22, y + 14); ctx.lineTo(x, y + 8); ctx.lineTo(x + 22, y + 14); ctx.closePath(); ctx.fill();
    ctx.fillStyle = C.gris; ctx.fillRect(x - 2, y - 18, 4, 8);
    A.oca(ctx, x, y - 3, 20, { dir: 1 });
    if (d) { A.caja(ctx, x - 11, y - 40, 22, 20, C.noche2, DEF[d].color, 2); icono(ctx, d, x, y - 30, 6); }
    else A.texto(ctx, 'elige 1–4', A.limitar(x, 44, W - 44), y - 30, { tam: 13, color: C.oro, negrita: true });
  }

  A.crear({
    numero: '06', titulo: 'Invasores de la desmotivación', pluma: 'PLUMA-MOTIVACION',
    ancho: W, alto: H,
    objetivo: 'Relacionar amenazas a la motivación (falta de autonomía, retos mal ajustados, feedback tardío, aislamiento…) con intervenciones docentes plausibles, y justificar una elección.',
    instrucciones: [
      'Mueve la oca mecánica por la parte baja y protege la Escuela del Saber de los nubarrones de desánimo.',
      'Solo puedes disparar después de elegir una de las cuatro defensas; cada nubarrón lleva escrita su amenaza.',
      'Si la defensa no encaja recibes una pista sin perder vida. Son tres oleadas y una justificación final.'
    ],
    teclas: 'Teclado: A/D o flechas para mover, Espacio para disparar y 1–4 para elegir defensa. En móvil o tableta: botones ◀ ▶, Disparar y la barra de defensas.',
    transferencia: '¿Cómo introducirías autonomía y feedback útil en una actividad que hoy se basa solo en puntos?',
    ayuda: '<ul><li><b>◆ Dar opciones:</b> el alumnado elige tema, formato, orden o nivel (autonomía).</li>' +
      '<li><b>▲ Ajustar dificultad:</b> graduar el reto para que sea exigente pero alcanzable (competencia).</li>' +
      '<li><b>● Feedback útil:</b> información concreta y a tiempo sobre cómo va y cuál es el siguiente paso.</li>' +
      '<li><b>✚ Apoyo/colaboración:</b> andamiaje, ayuda entre iguales y clima seguro (relación).</li></ul>' +
      '<p>Elige defensa (1–4), colócate bajo el nubarrón y dispara. Un impacto con «? REVISAR» no quita vidas: lee la pista y cambia de defensa. Algunas amenazas admiten dos defensas. Solo pierdes una vida si un nubarrón cruza la línea de la escuela.</p>',
    controles: { cruceta: ['izq', 'der'], acciones: [{ id: 'disparar', etiqueta: 'Disparar' }] },
    depurar: function () { return S; },

    iniciar: function (api) {
      S = { oleada: 0, puntos: 0, prot: 0, primera: 0, revisiones: 0, reintentos: 0, vidas: 3, nx: W / 2, cad: 0, timer: 0,
        avisoT: -9, creados: 0, sigCarril: 0, activa: false, just: null,
        cola: [], enemigos: [], balas: [], destellos: [], casos: [],
        disp: { op: 0, dif: 0, fb: 0, ap: 0 }, fall: { op: 0, dif: 0, fb: 0, ap: 0 }, selec: { op: 0, dif: 0, fb: 0, ap: 0 },
        efic: { op: [], dif: [], fb: [], ap: [] } };
      api.herramientas(ORDEN.map(function (k) { return { id: k, etiqueta: DEF[k].n, icono: DEF[k].icono }; }),
        function (id) { if (S.selec[id] != null) { S.selec[id]++; api.sonido('punto'); } });
      empezarOleada(api);
    },
    alPulsar: function (id, api) { if (id === 'disparar') disparar(api); },

    actualizar: function (dt, api) {
      var O = OLEADAS[S.oleada], i, j, b, e;
      if (!S.activa || !O) return;
      S.nx = A.limitar(S.nx + ((api.teclas.der ? 1 : 0) - (api.teclas.izq ? 1 : 0)) * 200 * dt, 24, W - 24);
      S.cad = Math.max(0, S.cad - dt);
      if (api.teclas.disparar && api.herramienta) disparar(api);

      S.timer -= dt;
      if (!S.enemigos.length) S.timer = Math.min(S.timer, 0.7);
      if (S.cola.length && S.enemigos.length < O.max && S.timer <= 0) aparecer();

      for (i = S.enemigos.length - 1; i >= 0; i--) {
        e = S.enemigos[i];
        e.y += O.vel * api.vel * dt;
        e.x = CARRIL[e.carril] + Math.sin(api.t * 0.9 + e.fase) * 4;
        if (e.y + EH >= LIMITE) {
          S.enemigos.splice(i, 1); S.cola.push(e); S.vidas--; api.sonido('golpe');
          if (S.vidas <= 0) { derrota(api); return; }
          api.mensaje('«' + AM[e.clave].n + '» ha llegado a la escuela (−1 vida). Volverá a bajar: aún puedes atenderla.', 4200);
        }
      }
      for (i = S.balas.length - 1; i >= 0; i--) {
        b = S.balas[i]; b.y -= 280 * dt;
        if (b.y < 18) { S.balas.splice(i, 1); continue; }
        for (j = 0; j < S.enemigos.length; j++) {
          e = S.enemigos[j];
          if (A.choca({ x: b.x - 4, y: b.y - 7, w: 8, h: 14 }, { x: e.x - EW / 2, y: e.y, w: EW, h: EH })) {
            S.balas.splice(i, 1); impacto(b, e, api); break;
          }
        }
      }
      for (i = S.destellos.length - 1; i >= 0; i--) if (api.t - S.destellos[i].t > 0.6) S.destellos.splice(i, 1);

      api.hud({ Oleada: (S.oleada + 1) + '/3', 'Base protegida': S.prot + '/12', Vidas: S.vidas, Restantes: restantes() });
      if (!S.cola.length && !S.enemigos.length) finOleada(api);
    },

    dibujar: function (ctx, api) {
      if (!S) return;
      var O = OLEADAS[Math.min(S.oleada, 2)], i;
      ctx.fillStyle = '#2a3566';
      for (i = 0; i < 22; i++) ctx.fillRect((i * 97) % W, 30 + (i * 53) % 290, 2, 2);
      A.caja(ctx, 0, 0, W, 22, C.noche2);
      A.texto(ctx, 'Oleada ' + (Math.min(S.oleada, 2) + 1) + ' · ' + O.nombre, W / 2, 12, { tam: 13, color: C.oro, negrita: true });
      ctx.strokeStyle = C.gris; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      ctx.beginPath(); ctx.moveTo(0, LIMITE); ctx.lineTo(W, LIMITE); ctx.stroke(); ctx.setLineDash([]);
      /* Escuela del Saber: una ventana encendida por cada vida */
      A.caja(ctx, 0, 384, W, 36, C.noche2, C.morado, 2);
      ctx.fillStyle = C.morado; ctx.fillRect(0, 378, W, 6);
      for (i = 0; i < 3; i++) {
        var vx = i < 2 ? 12 + i * 30 : W - 34, on = i < S.vidas;
        A.caja(ctx, vx, 392, 22, 20, on ? C.menta : C.noche, on ? C.blanco : C.gris, 2);
        if (on) A.pluma(ctx, vx + 11, 403, 12, C.noche); else { ctx.fillStyle = C.gris; ctx.fillRect(vx + 6, 401, 10, 2); }
      }
      A.texto(ctx, 'ESCUELA DEL SABER', W / 2 + 14, 403, { tam: 13, color: C.oro, negrita: true });
      S.enemigos.forEach(function (e) { nubarron(ctx, e, api); });
      S.balas.forEach(function (b) {
        ctx.fillStyle = '#000'; ctx.fillRect(b.x - 6, b.y - 8, 12, 16);
        icono(ctx, b.def, b.x, b.y, 5);
      });
      S.destellos.forEach(function (d) {
        var p = (api.t - d.t) / 0.6, r = 14 + p * 30;
        ctx.strokeStyle = C.menta; ctx.lineWidth = 3; ctx.strokeRect(d.x - r, d.y - r * 0.5, r * 2, r);
      });
      nave(ctx, api);
    }
  });
})();
