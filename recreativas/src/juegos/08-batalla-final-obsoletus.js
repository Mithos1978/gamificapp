/* 08 · La batalla final contra Obsoletus */
(function () {
  'use strict';
  var A = Arcade, C = A.C, W = 400, H = 300, G = 240, BX = 338, EMAX = 5, VENTANA = 7;
  var SLOT_X = 306, SLOT_Y = 263, SLOT_DX = 23;
  var FASES = [
    { error: 'Memorizar equivale a aprender', chapa: 'MEMORIA', pluma: 'Pluma de la Metacognición', color: '#3b2a78',
      hp: 5, inter: 2.0, patron: ['bajo'],
      ops: [
        { et: 'Repetición cronometrada', ej: 'Copiar la definición diez veces y recitarla contra reloj.', ok: false,
          pista: 'Repetir más deprisa sigue siendo memorizar. Busca una herramienta que haga pensar al estudiante sobre cómo aprende o que le pida usar lo aprendido.' },
        { et: 'Autorregulación y metacognición', ej: 'Antes de estudiar, cada estudiante planifica cómo lo hará; al terminar explica con sus palabras qué ha entendido y qué cambiaría.', ok: true },
        { et: 'Puntos por recitar', ej: 'Diez puntos por cada definición dicha de memoria sin fallos.', ok: false,
          pista: 'Eso premia justo lo que Obsoletus defiende. ¿Qué herramienta ayuda a comprobar que se comprende, y no solo que se recuerda?' },
        { et: 'Evaluación formativa con casos', ej: 'Minicasos sin nota: aplican lo estudiado a una situación nueva y revisan sus errores con una pauta.', ok: true }
      ],
      porque: 'Recordar un dato no garantiza comprenderlo ni saber usarlo. Planificar, supervisar y explicar con palabras propias (o aplicar lo estudiado a un caso nuevo y revisar los errores) hace visible qué se ha aprendido de verdad.' },
    { error: 'Más puntos = más motivación', chapa: '+PUNTOS', pluma: 'Pluma del Feedback y la Autonomía', color: '#5a2a78',
      hp: 6, inter: 1.9, patron: ['bajo', 'caida'],
      ops: [
        { et: 'Feedback útil', ej: 'En lugar de «+50», un comentario: «Tu hipótesis es clara; añade ahora una evidencia que la apoye».', ok: true },
        { et: 'Duplicar los puntos', ej: 'Esta semana cada tarea entregada vale el doble.', ok: false,
          pista: 'Más cantidad de lo mismo: los puntos no dicen cómo mejorar ni dan margen de decisión. ¿Qué necesita alguien para querer seguir aprendiendo?' },
        { et: 'Ranking público semanal', ej: 'Una clasificación en la pared con los diez primeros puestos.', ok: false,
          pista: 'Un ranking compara, pero no informa de cómo avanzar y puede desanimar a quien queda atrás. Piensa en información útil o en capacidad de elegir.' },
        { et: 'Autonomía con opciones', ej: 'Elegir entre tres formatos para demostrar lo aprendido: maqueta, pódcast o informe.', ok: true }
      ],
      porque: 'Los puntos pueden animar un rato, pero no explican cómo mejorar ni dejan decidir. El feedback que informa del siguiente paso y la posibilidad de elegir suelen sostener mejor las ganas de aprender, aunque depende del contexto y de cada estudiante.' },
    { error: 'Un único tipo de jugador sirve para todos', chapa: '1 TIPO', pluma: 'Pluma de la Diversidad', color: '#2a3f78',
      hp: 7, inter: 1.8, patron: ['bajo', 'alto', 'caida'],
      ops: [
        { et: 'Torneo para toda la clase', ej: 'Competición individual obligatoria con un único ganador.', ok: false,
          pista: 'Competir atrae a algunas personas y aleja a otras. ¿Cómo darías cabida a quien prefiere cooperar, explorar o ayudar?' },
        { et: 'Diversidad de motivaciones', ej: 'Una misma meta con varias rutas: reto de dominio, misión cooperativa, exploración libre o ayudar a otro equipo.', ok: true },
        { et: 'Sondear y ajustar', ej: 'Preguntar al grupo qué le engancha, observar cómo participa y adaptar las misiones a lo que se ve.', ok: true },
        { et: 'Etiqueta fija por alumno', ej: 'Pasar un test y asignar a cada estudiante un solo tipo de misión para todo el curso.', ok: false,
          pista: 'Las motivaciones cambian con la tarea y el momento: una etiqueta fija encasilla. Mejor ofrecer variedad que clasificar personas.' }
      ],
      porque: 'En un aula conviven motivaciones distintas, y una misma persona puede responder a varias. Ofrecer rutas variadas hacia la misma meta, y escuchar al grupo para ajustarlas, incluye a más estudiantes que un único molde.' },
    { error: 'Evaluar es poner una nota al final', chapa: 'NOTA', pluma: 'Pluma de la Evaluación Formativa', color: '#6a2a4a',
      hp: 8, inter: 1.6, patron: ['bajo', 'caida', 'alto', 'bajo', 'caida'],
      ops: [
        { et: 'Autoevaluación y coevaluación', ej: 'Cada estudiante compara su borrador con los criterios y un compañero le propone un siguiente paso.', ok: true },
        { et: 'Examen final más largo', ej: 'Una única prueba de dos horas el último día, sin devolución de errores.', ok: false,
          pista: 'Sigue siendo una sola foto al final, cuando ya no hay tiempo de mejorar. ¿Qué herramienta da información durante el proceso?' },
        { et: 'Evaluación formativa', ej: 'Puntos de control durante el proyecto, con rúbrica compartida y tiempo para mejorar el trabajo antes de entregarlo.', ok: true },
        { et: 'Nota final con medalla', ej: 'La misma nota de siempre, ahora acompañada de una insignia de oro, plata o bronce.', ok: false,
          pista: 'Cambia el envoltorio, no la evaluación: sigue llegando tarde y sin orientar. Busca algo que permita corregir el rumbo a tiempo.' }
      ],
      porque: 'Una nota al final informa cuando ya no se puede mejorar. Evaluar durante el proceso, con criterios compartidos, revisión propia y de iguales y margen para rehacer, convierte la evaluación en parte del aprendizaje.' }
  ];
  var ESTRELLAS = [[22, 60], [58, 96], [96, 52], [140, 78], [176, 58], [214, 100], [248, 64], [30, 130], [120, 120], [200, 140], [262, 118], [84, 160]];
  var S;

  /* ---------- Flujo de fases ---------- */
  function empezarFase(api, reintento) {
    var F = FASES[S.fase];
    S.energia = EMAX; S.hp = F.hp; S.proy = []; S.avisos = []; S.tiros = [];
    S.j = { x: 80, y: 0, vy: 0, dir: 1, inm: 1, anda: false, escudo: false };
    S.esc = 1; S.escBloq = false; S.cad = 0; S.buf = 0; S.np = 0; S.sig = 1.1;
    S.modo = 'asedio'; S.vent = 0; S.avisoEscudo = -9;
    if (reintento) { S.tm = 3; S.activa = true; pintarHud(api); return; }
    S.tm = 4.5; S.sabe = false; S.fallosFase = []; S.activa = false;
    pintarHud(api);
    api.informar({
      titulo: 'Fase ' + (S.fase + 1) + ' de 4 · Obsoletus proclama',
      texto: '«' + F.error.toUpperCase() + '».\n' + (S.fase === 0
        ? 'Su escudo rebota tus disparos. Esquiva sus proyectiles (cada uno avisa antes de salir) mientras preparas una herramienta pedagógica para desactivarlo.'
        : 'Vuelve a levantar su escudo. Esquiva mientras preparas la herramienta que desmonte este error.'),
      boton: 'A la plataforma'
    }).then(function () { S.activa = true; });
  }

  function preguntar(api) {
    var F = FASES[S.fase];
    S.activa = false; S.proy = []; S.avisos = []; S.tiros = [];
    api.elegir({
      titulo: 'Fase ' + (S.fase + 1) + ' · Elige tu herramienta pedagógica',
      texto: 'Obsoletus insiste: «' + F.error + '». ¿Con qué herramienta desactivas su escudo? Puede haber más de una adecuada.',
      opciones: F.ops.map(function (o) { return { etiqueta: o.et, detalle: 'Ejemplo: ' + o.ej }; })
    }).then(function (r) {
      var o = F.ops[r.i];
      if (o.ok) {
        S.sabe = true; S.elegida[S.fase] = o.et;
        if (!S.fallosFase.length) { S.primeras++; S.puntos += 50; }
        api.registrar('Fase ' + (S.fase + 1) + ' («' + F.error + '»): desactivé el escudo con «' + o.et + '»' +
          (S.fallosFase.length ? ', tras probar «' + S.fallosFase.join('» y «') + '» y recibir pista' : '') + '.');
        api.sonido('ok');
        abrirVentana(api, true);
        S.activa = true;
      } else {
        if (S.fallosFase.indexOf(o.et) < 0) S.fallosFase.push(o.et);
        S.fallos++; api.sonido('error');
        api.informar({
          titulo: 'El escudo resiste',
          texto: '«' + o.et + '» no desmonta este error.\nPista: ' + o.pista + '\nNo pierdes energía ni plumas: elige otra herramienta.',
          boton: 'Elegir de nuevo'
        }).then(function () { preguntar(api); });
      }
    });
  }

  function abrirVentana(api, primera) {
    S.modo = 'ventana'; S.vent = VENTANA; S.sig = Math.max(S.sig, 0.8);
    api.mensaje(primera ? '¡Escudo caído! Dispara al núcleo de Obsoletus y sigue esquivando.' : 'Tu herramienta vuelve a abrir el escudo: ¡dispara!');
  }

  function derrota(api) {
    S.activa = false; S.derrotas++;
    api.elegir({
      titulo: 'Te has quedado sin energía',
      texto: 'No pasa nada: repites la fase ' + (S.fase + 1) + ' desde su punto de control. Conservas tus ' + S.plumas +
        ' Plumas de Conocimiento' + (S.sabe ? ' y la herramienta que ya elegiste.' : '.'),
      opciones: [{ etiqueta: 'Reintentar la fase' }, { etiqueta: 'Reintentar en modo tranquilo', detalle: 'Proyectiles más lentos y ventana de ataque sin límite de tiempo.' }]
    }).then(function (r) { if (r.i === 1) api.activarTranquilo(); empezarFase(api, true); });
  }

  function faseVencida(api) {
    var F = FASES[S.fase];
    S.activa = false; S.plumas++; S.puntos += 100 + S.energia * 10;
    pintarHud(api); api.sonido('ok');
    api.informar({
      titulo: '¡' + F.pluma + ' liberada! (' + S.plumas + '/4)',
      texto: 'Usaste «' + S.elegida[S.fase] + '» contra «' + F.error + '».\n' + F.porque,
      boton: S.fase < 3 ? 'Siguiente fase' : 'Ver el desenlace'
    }).then(function () {
      S.fase++;
      if (S.fase < 4) empezarFase(api, false); else desenlace(api);
    });
  }

  function desenlace(api) {
    S.fin = true; S.proy = []; S.avisos = []; S.tiros = [];
    var lista = '<ul>' + FASES.map(function (F, i) {
      return '<li><b>' + A.esc(F.pluma) + ':</b> frente a «' + A.esc(F.error) + '» usaste «' + A.esc(S.elegida[i]) + '».</li>';
    }).join('') + '</ul>';
    api.informar({
      titulo: '¡Obsoletus se queda sin argumentos!',
      html: '<p>Con las cuatro Plumas de Conocimiento reunidas, sus circuitos de «siempre se ha hecho así» se apagan y la Escuela del Saber enciende todas sus luces. ¡Enhorabuena, defensora!</p>' +
        '<p>Queda el último paso: tu decisión de transferencia.</p>',
      boton: 'Ir a la decisión de transferencia'
    }).then(function () {
      api.terminar({
        titulo: '¡Batalla final superada!', puntos: S.puntos,
        html: '<h3>Tus cuatro Plumas de Conocimiento</h3>' + lista,
        feedback: 'En esta partida elegiste una herramienta adecuada a la primera en ' + S.primeras + ' de 4 fases.' +
          (S.fallos ? ' En las demás, la pista te llevó a otra opción: equivocarse y reintentar forma parte del repaso.' : '') +
          (S.derrotas ? ' Reintentaste ' + S.derrotas + ' vez/veces una fase; eso habla de reflejos, no de tu criterio pedagógico.' : '') +
          ' Esto es un repaso formativo: ganar la batalla no certifica competencia docente. Lo valioso es que sepas justificar por qué cada herramienta responde a cada error, y que en un aula real dependerá del contexto y del alumnado.',
        ficha: ['Plumas de Conocimiento reunidas: 4/4', 'Herramienta adecuada al primer intento: ' + S.primeras + '/4 fases']
      });
    });
  }

  function pintarHud(api) {
    api.hud({
      Fase: Math.min(S.fase + 1, 4) + '/4', 'Energía': S.energia + '/' + EMAX, Plumas: S.plumas + '/4',
      Escudo: S.fin ? 'apagado' : S.modo === 'ventana' ? (api.tranquilo ? 'caído' : 'caído ' + Math.ceil(S.vent) + ' s') : S.modo === 'liberar' ? 'roto' : 'activo'
    });
  }

  /* ---------- Simulación ---------- */
  function cajaJ() { return { x: S.j.x - 8, y: G - S.j.y - 28, w: 16, h: 28 }; }
  function lanzarAviso(tipo) {
    S.avisos.push({ tipo: tipo, v: 0, dur: tipo === 'caida' ? 1.15 : 0.95, x: A.limitar(S.j.x, 24, 250) });
  }
  function disparaJefe(a, api) {
    if (a.tipo === 'bajo') S.proy.push({ tipo: 'bajo', x: 280, y: G - 13, w: 14, h: 12 });
    else if (a.tipo === 'alto') S.proy.push({ tipo: 'alto', x: 280, y: G - 66, w: 16, h: 12 });
    else S.proy.push({ tipo: 'caida', x: a.x - 9, y: 44, w: 18, h: 18 });
  }

  /* ---------- Dibujo ---------- */
  function etiqueta(ctx, s, x, y, color) {
    ctx.font = '700 13px monospace';
    var w = s.length * 8 + 10;
    A.caja(ctx, x - w / 2, y - 10, w, 20, 'rgba(16,22,41,0.85)', color, 2);
    A.texto(ctx, s, x, y + 1, { tam: 13, color: color, negrita: true, sombra: false });
  }
  function dibujarFondo(ctx) {
    ctx.fillStyle = C.noche2; ctx.fillRect(0, 0, W, G);
    ctx.fillStyle = '#2a3560';
    ESTRELLAS.forEach(function (e) { ctx.fillRect(e[0], e[1], 2, 2); });
    /* Escuela del Saber, al fondo a la izquierda */
    ctx.fillStyle = '#26315c'; ctx.fillRect(14, G - 62, 76, 62);
    ctx.beginPath(); ctx.moveTo(8, G - 62); ctx.lineTo(52, G - 92); ctx.lineTo(96, G - 62); ctx.closePath(); ctx.fill();
    ctx.fillStyle = S.fin ? C.oro : '#39467a';
    ctx.fillRect(24, G - 50, 12, 14); ctx.fillRect(46, G - 50, 12, 14); ctx.fillRect(68, G - 50, 12, 14);
    ctx.fillStyle = '#1b2444'; ctx.fillRect(44, G - 24, 16, 24);
    ctx.fillStyle = C.gris; ctx.fillRect(51, G - 108, 2, 18);
    ctx.fillStyle = C.menta; ctx.fillRect(53, G - 108, 12, 8);
    /* plataforma */
    ctx.fillStyle = C.morado; ctx.fillRect(0, G, W, 8);
    ctx.fillStyle = C.morado2; ctx.fillRect(0, G, W, 3);
    ctx.fillStyle = '#4a2a94';
    for (var x = 0; x < W; x += 40) ctx.fillRect(x, G + 3, 2, 5);
  }
  function dibujarMarcadores(ctx, api) {
    var i;
    A.caja(ctx, 0, G + 8, W, H - G - 8, C.noche);
    A.texto(ctx, 'ENERGÍA', 8, 262, { tam: 13, alin: 'left', negrita: true });
    for (i = 0; i < EMAX; i++) A.caja(ctx, 76 + i * 19, 254, 16, 16, i < S.energia ? C.menta : null, i < S.energia ? C.blanco : C.gris, 2);
    A.texto(ctx, 'ESCUDO', 8, 285, { tam: 13, alin: 'left', negrita: true, color: S.escBloq ? C.gris : C.blanco });
    A.caja(ctx, 76, 278, 92, 14, null, S.escBloq ? C.gris : C.blanco, 2);
    ctx.fillStyle = S.escBloq ? C.gris : C.morado2; ctx.fillRect(79, 281, Math.round(86 * S.esc), 8);
    A.texto(ctx, 'PLUMAS', SLOT_X - 20, SLOT_Y, { tam: 13, alin: 'right', negrita: true, color: C.oro });
    for (i = 0; i < 4; i++) {
      var sx = SLOT_X + i * SLOT_DX;
      A.caja(ctx, sx - 10, SLOT_Y - 13, 20, 26, i < S.plumas ? '#3a2f10' : null, i < S.plumas ? C.oro : C.gris, 2);
      if (i < S.plumas) A.pluma(ctx, sx, SLOT_Y + 1, 18, C.oro);
      else A.texto(ctx, String(i + 1), sx, SLOT_Y + 1, { tam: 13, color: C.gris });
    }
    A.texto(ctx, S.plumas + ' de 4', SLOT_X + 1.5 * SLOT_DX, SLOT_Y + 24, { tam: 13, color: C.oro });
  }
  function dibujarJefe(ctx, api) {
    var F = FASES[Math.min(S.fase, 3)], abierto = S.modo === 'ventana' || S.modo === 'liberar' || S.fin;
    var by = G - 51 + (S.fin ? 6 : Math.round(Math.sin(api.t * 2) * 2));
    var ojo = S.fin ? C.gris : abierto ? C.oro : C.rojo;
    /* hombreras y brazos-cañón (formas propias) */
    ctx.fillStyle = C.gris; ctx.fillRect(BX - 50, by - 30, 100, 12);
    ctx.fillStyle = '#5b6488'; ctx.fillRect(BX - 56, by - 34, 16, 20); ctx.fillRect(BX + 40, by - 34, 16, 20);
    ctx.fillStyle = C.gris; ctx.fillRect(BX - 52, G - 70, 8, 12); ctx.fillRect(BX - 52, G - 16, 8, 12);
    ctx.fillStyle = '#5b6488'; ctx.fillRect(BX - 60, G - 68, 12, 8); ctx.fillRect(BX - 60, G - 14, 12, 8);
    A.robot(ctx, BX, by, 96, { color: S.fin ? '#2a2f48' : F.color, ojo: ojo });
    /* corona de engranaje viejo */
    ctx.fillStyle = C.oro;
    ctx.fillRect(BX - 24, by - 46, 8, 8); ctx.fillRect(BX + 16, by - 46, 8, 8); ctx.fillRect(BX - 24, by - 40, 48, 4);
    /* placa del pecho con el error que defiende */
    A.caja(ctx, BX - 34, by + 18, 68, 22, '#101629', S.fin ? C.gris : C.oro, 2);
    A.texto(ctx, S.fin ? 'APAGADO' : F.chapa, BX, by + 30, { tam: 13, negrita: true, color: S.fin ? C.gris : C.oro, sombra: false });
    if (S.fin) return;
    /* núcleo: resistencia de la fase */
    var n = F.hp, w0 = Math.min(11, Math.floor(96 / n)), x0 = BX - (n * w0) / 2, i;
    for (i = 0; i < n; i++) A.caja(ctx, x0 + i * w0, 106, w0 - 2, 10, i < S.hp ? C.rojo : null, i < S.hp ? C.blanco : C.gris, 1);
    A.texto(ctx, 'NÚCLEO', BX, 96, { tam: 13, negrita: true });
    /* escudo del jefe */
    if (!abierto) {
      ctx.fillStyle = 'rgba(169,139,240,0.28)'; ctx.fillRect(272, 120, 10, G - 120);
      ctx.strokeStyle = C.morado2; ctx.lineWidth = 2; ctx.strokeRect(273, 121, 8, G - 122);
      ctx.fillStyle = C.morado2;
      for (i = 0; i < 6; i++) ctx.fillRect(275, 128 + i * 19 + (Math.floor(api.t * 3) % 2) * 2, 4, 9);
      etiqueta(ctx, 'ESCUDO ACTIVO', BX - 4, 70, C.morado2);
    } else if (S.modo === 'ventana') {
      ctx.fillStyle = C.morado2; ctx.fillRect(272, G - 6, 4, 6); ctx.fillRect(279, G - 10, 3, 10);
      etiqueta(ctx, '¡ESCUDO CAÍDO!', BX - 4, 62, C.oro);
      if (!api.tranquilo) {
        A.caja(ctx, BX - 52, 76, 96, 8, null, C.oro, 1);
        ctx.fillStyle = C.oro; ctx.fillRect(BX - 50, 78, Math.round(92 * Math.max(0, S.vent) / VENTANA), 4);
      }
    }
  }
  function dibujarAvisos(ctx) {
    S.avisos.forEach(function (a) {
      var p = Math.min(1, a.v / a.dur), g = 4 + Math.round(p * 8), y;
      ctx.strokeStyle = C.rojo; ctx.lineWidth = 2; ctx.setLineDash([6, 6]);
      if (a.tipo === 'caida') {
        ctx.strokeRect(a.x - 14, 50, 28, G - 50); ctx.setLineDash([]);
        ctx.fillStyle = C.rojo; ctx.fillRect(a.x - g / 2, 50, g, g);
        ctx.beginPath(); ctx.moveTo(a.x - 9, G - 16); ctx.lineTo(a.x + 9, G - 16); ctx.lineTo(a.x, G - 4); ctx.closePath(); ctx.fill();
        etiqueta(ctx, 'APARTA', A.limitar(a.x, 34, 240), 66, C.rojo);
      } else {
        y = a.tipo === 'bajo' ? G - 7 : G - 60;
        ctx.beginPath(); ctx.moveTo(12, y); ctx.lineTo(276, y); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = C.rojo; ctx.fillRect(278 - g, y - g / 2, g, g);
        etiqueta(ctx, a.tipo === 'bajo' ? 'SALTA' : 'NO SALTES', 190, a.tipo === 'bajo' ? G - 28 : G - 80, C.rojo);
      }
    });
    ctx.setLineDash([]);
  }
  function dibujarProyectiles(ctx) {
    S.proy.forEach(function (p) {
      if (p.tipo === 'bajo') {            /* engranaje rodante */
        A.caja(ctx, p.x, p.y, p.w, p.h, C.rojo, C.blanco, 2); ctx.fillStyle = '#101629'; ctx.fillRect(p.x + 5, p.y + 4, 4, 4);
      } else if (p.tipo === 'alto') {     /* sello volador */
        A.caja(ctx, p.x, p.y, p.w, p.h, C.oro, C.blanco, 2); ctx.fillStyle = C.rojo; ctx.fillRect(p.x + p.w, p.y + 3, 6, 6);
      } else {                            /* libro pesado que cae */
        A.caja(ctx, p.x, p.y, p.w, p.h, '#b06a3a', C.blanco, 2); ctx.fillStyle = C.blanco; ctx.fillRect(p.x + 4, p.y + 5, 10, 2); ctx.fillRect(p.x + 4, p.y + 10, 10, 2);
      }
    });
    ctx.fillStyle = C.menta;
    S.tiros.forEach(function (t) { ctx.fillRect(t.x - 5, t.y - 2, 10, 4); ctx.fillRect(t.x + 3, t.y - 4, 4, 8); });
  }

  A.crear({
    numero: '08', titulo: 'La batalla final contra Obsoletus', pluma: 'PLUMA-OBSOLETUS',
    ancho: W, alto: H,
    objetivo: 'Repasar cuatro errores pedagógicos frecuentes y elegir, con criterio, la herramienta que responde a cada uno: autorregulación, feedback y autonomía, diversidad de motivaciones y evaluación formativa.',
    instrucciones: [
      'Mueve a la oca por la plataforma: salta, cúbrete con el escudo o apártate según el aviso que precede a cada proyectil.',
      'En cada fase Obsoletus proclama un error: elige una herramienta pedagógica adecuada para tumbar su escudo y dispara a su núcleo.',
      'Cada fase vencida libera una Pluma de Conocimiento. Con las cuatro, la Pluma Dorada se consigue con tu decisión de transferencia.'
    ],
    teclas: 'Teclado: ←/→ o A/D para moverte, Espacio o ↑ para saltar, X para el escudo y Z para disparar. En móvil: botones táctiles.',
    transferencia: 'Elige un error real de una propuesta gamificada y rediseña qué haría el estudiante, qué feedback recibiría y cómo comprobarías el aprendizaje',
    ayuda: '<ul><li><b>Aviso «SALTA»:</b> un engranaje rodará por el suelo. Salta o usa el escudo.</li>' +
      '<li><b>Aviso «NO SALTES»:</b> un sello volará alto. Quédate en el suelo.</li>' +
      '<li><b>Aviso «APARTA»:</b> un libro caerá en la columna marcada. Muévete o usa el escudo.</li>' +
      '<li><b>Escudo de la oca:</b> bloquea todo, pero se gasta y no deja disparar; se recarga solo.</li>' +
      '<li><b>Escudo de Obsoletus:</b> solo cae con una herramienta pedagógica adecuada (a veces hay más de una). Equivocarse da una pista y no resta nada.</li></ul>' +
      '<p><b>Herramientas:</b> autorregulación y metacognición · feedback útil y autonomía · diversidad de motivaciones · evaluación formativa.</p>',
    controles: {
      cruceta: ['izq', 'der'],
      acciones: [{ id: 'saltar', etiqueta: 'Saltar' }, { id: 'escudo', etiqueta: 'Escudo', teclas: ['x', 'm'] }, { id: 'disparar', etiqueta: 'Disparar', teclas: ['z', 'n'] }]
    },
    depurar: function () { return { S: S, FASES: FASES, G: G }; },

    iniciar: function (api) {
      S = { fase: 0, plumas: 0, puntos: 0, primeras: 0, fallos: 0, derrotas: 0, elegida: [], fin: false, activa: false };
      empezarFase(api, false);
    },

    alPulsar: function (id) { if (S && (id === 'saltar' || id === 'arriba')) S.buf = 0.14; },

    actualizar: function (dt, api) {
      if (!S.activa) return;
      var F = FASES[S.fase], j = S.j, i, p, cj;
      if (S.modo === 'liberar') {
        S.tm -= dt;
        if (j.y > 0) { j.y = Math.max(0, j.y + j.vy * dt); j.vy -= 900 * dt; }
        if (S.tm <= 0) faseVencida(api); else pintarHud(api);
        return;
      }
      /* oca */
      var dx = (api.teclas.der ? 1 : 0) - (api.teclas.izq ? 1 : 0);
      j.anda = !!dx;
      if (dx) { j.x = A.limitar(j.x + dx * 125 * dt, 16, 250); j.dir = dx; }
      S.buf = Math.max(0, S.buf - dt);
      if (S.buf > 0 && j.y === 0) { j.vy = 330; j.y = 0.01; S.buf = 0; api.sonido('salto'); }
      if (j.y > 0) { j.y += j.vy * dt; j.vy -= 900 * dt; if (j.y <= 0) { j.y = 0; j.vy = 0; } }
      j.inm = Math.max(0, j.inm - dt);
      if (S.escBloq && S.esc >= 0.4) S.escBloq = false;
      j.escudo = !!(api.teclas.escudo || api.teclas.abajo) && !S.escBloq && S.esc > 0;
      if (j.escudo) {
        S.esc -= 0.7 * dt;
        if (S.esc <= 0) { S.esc = 0; S.escBloq = true; j.escudo = false; api.mensaje('Escudo agotado: se recarga solo en un par de segundos.'); }
      } else S.esc = Math.min(1, S.esc + 0.4 * dt);
      S.cad = Math.max(0, S.cad - dt);
      if (api.teclas.disparar && !j.escudo && S.cad === 0) {
        S.tiros.push({ x: j.x + 16, y: G - j.y - 19 }); S.cad = 0.38; j.dir = 1; api.sonido('disparo');
      }
      /* jefe */
      if (S.modo === 'asedio') {
        S.tm -= dt;
        if (S.tm <= 0) { if (S.sabe) abrirVentana(api, false); else { preguntar(api); return; } }
      } else if (!api.tranquilo) {
        S.vent -= dt;
        if (S.vent <= 0) {
          S.modo = 'asedio'; S.tm = 3.5;
          api.mensaje('Obsoletus recompone su escudo unos segundos. Tu herramienta sigue activa: aguanta y volverá a caer.');
        }
      }
      S.sig -= dt * api.vel;
      if (S.sig <= 0) { lanzarAviso(F.patron[S.np % F.patron.length]); S.np++; S.sig = F.inter; }
      for (i = S.avisos.length - 1; i >= 0; i--) {
        S.avisos[i].v += dt * api.vel;
        if (S.avisos[i].v >= S.avisos[i].dur) { disparaJefe(S.avisos[i], api); S.avisos.splice(i, 1); }
      }
      cj = cajaJ();
      for (i = S.proy.length - 1; i >= 0; i--) {
        p = S.proy[i];
        if (p.tipo === 'caida') p.y += 230 * api.vel * dt; else p.x -= 115 * api.vel * dt;
        if (p.x < -20 || p.y + p.h >= G) { S.proy.splice(i, 1); continue; }
        if (!A.choca(cj, p)) continue;
        if (j.escudo) { S.proy.splice(i, 1); S.puntos += 5; api.flotar('¡Bloqueado!', j.x, G - j.y - 40, { color: C.menta }); api.sonido('punto'); continue; }
        if (j.inm > 0) continue;
        S.proy.splice(i, 1); S.energia--; j.inm = 1.3; api.sonido('golpe');
        api.flotar('-1 energía', j.x, G - j.y - 40, { color: C.rojo });
        if (S.energia <= 0) { pintarHud(api); derrota(api); return; }
      }
      for (i = S.tiros.length - 1; i >= 0; i--) {
        p = S.tiros[i]; p.x += 280 * dt;
        if (S.modo !== 'ventana') {
          if (p.x >= 270) {
            S.tiros.splice(i, 1);
            if (api.t - S.avisoEscudo > 4) {
              S.avisoEscudo = api.t;
              api.mensaje(S.sabe ? 'El escudo ha vuelto: espera a que caiga otra vez.' : 'El escudo rebota tus disparos: hará falta una herramienta pedagógica.');
            }
          }
        } else if (p.x >= BX - 40) {
          S.tiros.splice(i, 1); S.hp--; S.puntos += 10; api.sonido('punto');
          api.flotar('¡Impacto!', 232, p.y - 12, { color: C.oro });
          if (S.hp <= 0) { S.modo = 'liberar'; S.tm = 1.4; S.proy = []; S.avisos = []; S.tiros = []; break; }
        }
      }
      pintarHud(api);
    },

    dibujar: function (ctx, api) {
      if (!S || !S.j) return;
      var j = S.j, jy = G - j.y;
      dibujarFondo(ctx);
      dibujarJefe(ctx, api);
      dibujarAvisos(ctx);
      dibujarProyectiles(ctx);
      /* oca defensora */
      if (j.inm > 0 && !S.fin) { ctx.strokeStyle = C.blanco; ctx.lineWidth = 1; ctx.setLineDash([3, 3]); ctx.strokeRect(j.x - 15, jy - 34, 30, 36); ctx.setLineDash([]); }
      A.oca(ctx, j.x, jy - 15, 30, { dir: j.dir, paso: j.anda && j.y === 0 && Math.floor(api.t * 8) % 2 });
      ctx.fillStyle = C.morado2; ctx.fillRect(j.x - 9 * j.dir - 2, jy - 15, 4, 9);      /* capa de defensora */
      if (j.escudo) {
        ctx.strokeStyle = C.menta; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.arc(j.x, jy - 15, 23, 0, Math.PI * 2); ctx.stroke();
        ctx.fillStyle = 'rgba(66,214,164,0.18)'; ctx.fill();
      }
      /* pluma liberada volando hacia su hueco */
      if (S.modo === 'liberar' && !S.fin) {
        var q = A.limitar(1 - S.tm / 1.4, 0, 1), sx = SLOT_X + S.plumas * SLOT_DX;
        A.pluma(ctx, BX + (sx - BX) * q, (G - 60) + (SLOT_Y - (G - 60)) * q - Math.sin(q * Math.PI) * 30, 22, C.oro);
      }
      dibujarMarcadores(ctx, api);
    }
  });

  /* Tres acciones + cruceta no caben en un móvil de 360–390 px con el ancho por defecto del motor:
     se estrechan un poco los botones táctiles de ESTE juego (ver informe: mejor resolverlo en core.css). */
  try {
    var ac = document.getElementById('acciones'), cr = document.getElementById('cruceta');
    ac.style.gap = '4px'; cr.style.gridTemplateColumns = 'repeat(2,56px)';
    Array.prototype.forEach.call(ac.children, function (b) { b.style.minWidth = '70px'; b.style.fontSize = '13px'; b.style.padding = '2px'; });
  } catch (e) { /* sin controles táctiles */ }
})();
