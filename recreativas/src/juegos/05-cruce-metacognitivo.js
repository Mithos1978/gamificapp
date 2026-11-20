/* 05 · Cruce metacognitivo */
(function () {
  'use strict';
  var A = Arcade, C = A.C, T = 40, COLS = 9, FILAS = 11, W = COLS * T, H = FILAS * T;
  var CONTROL = 4, META = FILAS - 1, TIEMPO = 70, VIDAS = 3;
  var S;

  /* Carriles: [fila, tipo, dir, velocidad px/s, n.º de piezas, ancho px, separación px]
     R = carril con obstáculos, P = corriente con balsas (plataformas móviles). El resto son zonas seguras. */
  var ZONAS = [
    { nombre: 'Planificación', duro: 3, carriles: [
      [1, 'R', 1, 40, 3, 40, 140], [2, 'R', -1, 30, 2, 80, 230], [3, 'R', 1, 60, 3, 40, 150],
      [5, 'P', 1, 30, 2, 120, 240], [6, 'P', -1, 36, 3, 80, 150],
      [8, 'R', -1, 52, 3, 40, 150], [9, 'R', 1, 42, 2, 80, 230]],
      pregunta: 'Recurso de planificación: ¿cómo preparas el cruce?',
      recursos: [
        { id: 'flechas', etiqueta: 'Plan temporal', coste: 5,
          detalle: 'Cuesta 5 s de reloj. Estudias el recorrido: aparecen flechas de anticipación con el sentido de cada carril y un aviso antes de que entre cada obstáculo.' },
        { id: 'prioridad', etiqueta: 'Prioridad: el carril más difícil', coste: 3,
          detalle: 'Cuesta 3 s. Te ocupas primero del carril más rápido: se detiene un momento cada pocos segundos (verás «PAUSA»).' },
        { id: 'correr', etiqueta: 'Salir corriendo sin plan', coste: 0,
          detalle: 'No cuesta tiempo y da 40 puntos extra, pero todo va un 15 % más rápido: menos margen de respuesta.' }] },
    { nombre: 'Supervisión', duro: 3, carriles: [
      [1, 'R', 1, 52, 3, 40, 140], [2, 'R', -1, 42, 2, 80, 230], [3, 'R', -1, 70, 3, 40, 160],
      [5, 'P', -1, 38, 2, 100, 240], [6, 'P', 1, 46, 3, 80, 150],
      [8, 'R', 1, 66, 3, 40, 150], [9, 'R', -1, 52, 2, 80, 230]],
      pregunta: 'Recurso de supervisión: ¿cómo vas a comprobar que avanzas bien?',
      recursos: [
        { id: 'comprobacion', etiqueta: 'Comprobación intermedia', coste: 5,
          detalle: 'Cuesta 5 s. Colocas dos piedras fijas en la corriente: plataformas adicionales donde pararte a mirar antes de seguir.' },
        { id: 'pausado', etiqueta: 'Ritmo pausado', coste: 7,
          detalle: 'Cuesta 7 s. Avanzas comprobando cada paso: todos los carriles y balsas de la zona van un 25 % más despacio.' },
        { id: 'correr', etiqueta: 'Seguir sin comprobar', coste: 0,
          detalle: 'No cuesta tiempo y da 40 puntos extra, pero todo va un 15 % más rápido: menos margen de respuesta.' }] },
    { nombre: 'Evaluación', duro: 3, carriles: [
      [1, 'R', -1, 62, 3, 40, 140], [2, 'R', 1, 52, 2, 80, 230], [3, 'R', -1, 80, 3, 40, 170],
      [5, 'P', 1, 44, 2, 100, 240], [6, 'P', -1, 52, 3, 80, 150], [7, 'P', 1, 40, 2, 120, 240],
      [8, 'R', -1, 72, 3, 40, 160], [9, 'R', 1, 58, 2, 80, 230]],
      pregunta: 'Recurso de evaluación: ¿qué harás con los errores?',
      recursos: [
        { id: 'corregir', etiqueta: 'Corregir tras cada error', coste: 4,
          detalle: 'Cuesta 4 s. Cada vez que tropieces, el carril donde ocurrió se detiene 5 s para que lo analices y lo cruces.' },
        { id: 'ruta', etiqueta: 'Ruta segura revisada', coste: 8,
          detalle: 'Cuesta 8 s. Aprovechas lo aprendido en las zonas anteriores: un puente fijo cruza toda la corriente por la derecha.' },
        { id: 'correr', etiqueta: 'Terminar cuanto antes', coste: 0,
          detalle: 'No cuesta tiempo y da 40 puntos extra, pero todo va un 15 % más rápido: menos margen de respuesta.' }] }
  ];

  function mod(a, n) { return ((a % n) + n) % n; }
  function filaY(r) { return (FILAS - 1 - r) * T; }
  function recursoDe(z, id) { return ZONAS[z].recursos.filter(function (r) { return r.id === id; })[0]; }

  /* ---------- Montaje de una zona ---------- */
  function montarZona() {
    var Z = ZONAS[S.zona];
    S.carriles = [];
    for (var r = 0; r < FILAS; r++) S.carriles.push({ tipo: 'S', fijas: [] });
    Z.carriles.forEach(function (d) {
      S.carriles[d[0]] = { tipo: d[1], dir: d[2], v: d[3], n: d[4], w: d[5], sep: d[6], L: d[4] * d[6],
        fase: d[0] * 53 + S.zona * 31, factor: 1, pausa: 0, ciclo: false, enPausa: false, fijas: [] };
    });
    S.j = { r: 0, x: W / 2, mira: 1 };
    S.segura = 0; S.maxFila = 0; S.vidas = VIDAS; S.tz = 0; S.inmune = 1;
    S.flechas = false; S.prisa = 1; S.corregir = false; S.ajustado = false; S.preguntado = false;
    S.rep = null;
  }
  function aplicarRecurso(api) {
    var Z = ZONAS[S.zona], id = S.plan[S.zona], rec = recursoDe(S.zona, id);
    S.tiempo = TIEMPO - rec.coste;
    if (id === 'flechas') S.flechas = true;
    if (id === 'prioridad') S.carriles[Z.duro].ciclo = true;
    if (id === 'correr') S.prisa = 1.15;
    if (id === 'comprobacion') { S.carriles[5].fijas.push({ col: 4, clase: 'piedra' }); S.carriles[6].fijas.push({ col: 6, clase: 'piedra' }); }
    if (id === 'pausado') S.carriles.forEach(function (c) { if (c.tipo !== 'S') c.factor *= 0.75; });
    if (id === 'corregir') S.corregir = true;
    if (id === 'ruta') S.carriles.forEach(function (c) { if (c.tipo === 'P') c.fijas.push({ col: 7, clase: 'puente' }); });
  }
  function ajustarMapa(api) {
    var cols = [3, 5, 3], k = 0;
    for (var r = CONTROL + 1; r < META; r++) {
      var c = S.carriles[r];
      if (c.tipo === 'P') { c.fijas.push({ col: cols[k % 3], clase: 'ajuste' }); k++; }
      if (c.tipo === 'R') c.factor *= 0.75;
    }
    S.ajustado = true; S.tiempo -= 3;
  }

  /* ---------- Modales del flujo ---------- */
  function elegirRecurso(api, cambio) {
    var Z = ZONAS[S.zona], previo = S.plan[S.zona];
    S.activa = false;
    return api.elegir({
      titulo: 'Zona ' + (S.zona + 1) + ' de 3 · ' + Z.nombre,
      texto: Z.pregunta + '\nCada recurso cambia el escenario y tiene un coste. Tienes ' + TIEMPO + ' s por zona' +
        (api.tranquilo ? ' (en modo tranquilo el reloj no corre).' : '.'),
      opciones: Z.recursos.map(function (r) { return { etiqueta: r.etiqueta, detalle: r.detalle }; })
    }).then(function (r) {
      var rec = Z.recursos[r.i];
      S.plan[S.zona] = rec.id;
      if (cambio) {
        if (previo !== rec.id) {
          S.revisiones++; S.cambios[S.zona].push('cambié de recurso: «' + recursoDe(S.zona, previo).etiqueta + '» → «' + rec.etiqueta + '»');
          api.registrar('Zona ' + (S.zona + 1) + ': tras quedarme sin vidas cambié de recurso a «' + rec.etiqueta + '».');
        } else api.registrar('Zona ' + (S.zona + 1) + ': tras quedarme sin vidas mantuve «' + rec.etiqueta + '».');
      } else {
        S.inicial[S.zona] = rec.id;
        api.registrar('Zona ' + (S.zona + 1) + ' (' + Z.nombre + '): elegí «' + rec.etiqueta + '»' + (rec.coste ? ' (coste: ' + rec.coste + ' s).' : ' (sin coste de tiempo, menos margen).'));
      }
      montarZona(); aplicarRecurso(api);
      S.activa = true;
      api.mensaje(rec.id === 'correr' ? 'Sin ayudas: todo va algo más rápido.' :
        rec.id === 'flechas' ? 'Flechas de anticipación activadas en todos los carriles.' :
        rec.id === 'prioridad' ? 'El tercer carril se detiene a ratos: cruza cuando ponga PAUSA.' :
        rec.id === 'comprobacion' ? 'Dos piedras fijas te esperan en la corriente.' :
        rec.id === 'pausado' ? 'Toda la zona va más despacio.' :
        rec.id === 'corregir' ? 'Si tropiezas, ese carril se detendrá 5 s.' : 'Puente fijo a la derecha de la corriente.');
    });
  }

  function puntoDeControl(api) {
    var z = S.zona, rec = recursoDe(z, S.plan[z]), n = S.tropiezos[z][0];
    S.activa = false; S.preguntado = true;
    api.sonido('ok');
    api.elegir({
      titulo: '¿Mi plan está funcionando?',
      texto: 'Punto de control de la zona ' + (z + 1) + '. Tu recurso: «' + rec.etiqueta + '». Tropiezos hasta aquí: ' + n +
        '.\nUn tropiezo puede ser cuestión de reflejos: decide mirando si el plan te está dando margen.',
      opciones: [
        { etiqueta: 'Sí', detalle: 'Sigo con el mismo plan; el mapa no cambia.' },
        { etiqueta: 'Necesito ajustarlo', detalle: 'Cuesta 3 s. El mapa cambia: apoyos fijos en la corriente y carriles de arriba más lentos.' },
        { etiqueta: 'Seguir sin revisar', detalle: 'No cuenta como revisión del plan.' }]
    }).then(function (r) {
      if (r.i === 0) {
        S.revisiones++; S.revision[z] = 'si';
        api.registrar('Punto de control ' + (z + 1) + ': revisé el plan y lo mantuve («Sí, está funcionando»; ' + n + ' tropiezos hasta ahí).');
        api.mensaje('Plan confirmado. Sigues con «' + rec.etiqueta + '».');
      } else if (r.i === 1) {
        S.revisiones++; S.ajustes++; S.revision[z] = 'ajuste';
        ajustarMapa(api);
        S.cambios[z].push('ajusté el plan en el punto de control');
        api.registrar('Punto de control ' + (z + 1) + ': «Necesito ajustarlo» (' + n + ' tropiezos hasta ahí); el mapa cambió.');
        api.mensaje('Plan ajustado: hay apoyos fijos (+) en la corriente y los carriles de arriba van más lentos.', 4200);
      } else {
        S.revision[z] = 'no';
        api.registrar('Punto de control ' + (z + 1) + ': seguí sin revisar el plan.');
      }
      S.activa = true;
    });
  }

  function sinVidas(api, motivo) {
    S.activa = false; S.reintentos[S.zona]++;
    api.elegir({
      titulo: motivo,
      texto: 'Vuelves al comienzo de la zona ' + (S.zona + 1) + ' (' + ZONAS[S.zona].nombre + ') con las vidas y el reloj completos. Las zonas superadas y tus revisiones se conservan.',
      opciones: [
        { etiqueta: 'Reintentar zona', detalle: 'Con el mismo recurso.' },
        { etiqueta: 'Reintentar en modo tranquilo', detalle: 'Sin reloj y con todo más lento.' },
        { etiqueta: 'Cambiar de recurso y reintentar', detalle: 'Revisar el plan también es una estrategia.' }]
    }).then(function (r) {
      if (r.i === 1) api.activarTranquilo();
      if (r.i === 2) return elegirRecurso(api, true);
      montarZona(); aplicarRecurso(api); S.activa = true;
    });
  }

  function finZona(api) {
    var z = S.zona, extra = 50 + S.vidas * 20 + (S.plan[z] === 'correr' ? 40 : 0);
    S.activa = false; S.puntos += extra; S.duracion[z] = Math.round(S.tz);
    api.sonido('ok');
    if (z < 2) {
      api.flotar('+' + extra, W / 2, 30);
      S.zona++; montarZona();
      elegirRecurso(api, false);
      return;
    }
    var p = Promise.resolve();
    if (!S.revisiones) {
      p = api.elegir({
        titulo: 'Antes de cruzar la meta',
        texto: 'Has llegado al destino sin revisar tu plan en ningún punto de control. Hazlo ahora, mirando hacia atrás: ¿tu plan funcionó?',
        opciones: [
          { etiqueta: 'Sí, lo mantendría igual', detalle: 'Los recursos elegidos me dieron margen suficiente.' },
          { etiqueta: 'Lo ajustaría: invertiría más tiempo en preparar', detalle: 'Cambiaría rapidez por anticipación o apoyos.' },
          { etiqueta: 'Lo ajustaría: revisaría antes, a mitad de camino', detalle: 'Usaría los puntos de control para decidir.' }]
      }).then(function (r) {
        S.revisiones++; S.revisionFinal = r.i;
        api.registrar('En la meta revisé el plan de toda la partida: ' +
          ['lo mantendría igual.', 'invertiría más tiempo en preparar.', 'revisaría antes, a mitad de camino.'][r.i]);
      });
    }
    p.then(function () { cierre(api); });
  }

  function cierre(api) {
    var total = 0, peor = -1, mx = 0, empate = false, html = '<h3>Previsión, cambios y resultado</h3><ul>';
    ZONAS.forEach(function (Z, z) {
      var t = S.tropiezos[z], n = t[0] + t[1];
      total += n;
      if (n > mx) { mx = n; peor = z; empate = false; } else if (n === mx && n > 0) empate = true;
      html += '<li><b>Zona ' + (z + 1) + ' · ' + Z.nombre + '.</b> Plan inicial: «' + A.esc(recursoDe(z, S.inicial[z]).etiqueta) + '». ' +
        'Revisión: ' + (S.revision[z] === 'si' ? 'confirmé el plan' : S.revision[z] === 'ajuste' ? 'lo ajusté y el mapa cambió' : 'no revisé en el punto de control') +
        (S.cambios[z].length ? '. Cambios: ' + A.esc(S.cambios[z].join('; ')) : '. Sin cambios') +
        '. Resultado: superada en ' + S.duracion[z] + ' s, ' + t[0] + ' tropiezo(s) antes del punto de control y ' + t[1] + ' después' +
        (S.reintentos[z] ? ', ' + S.reintentos[z] + ' reintento(s)' : '') + '.</li>';
    });
    html += '</ul><p><b>Tu previsión inicial:</b> ' +
      (S.prevision < 3 ? 'creías que te costaría más «' + ZONAS[S.prevision].nombre + '».' : 'no sabías qué zona te costaría más.') +
      ' <b>En esta partida:</b> ' + (peor < 0 ? 'no hubo tropiezos en ninguna zona.' :
        empate ? 'los tropiezos se repartieron entre varias zonas.' : 'hubo más tropiezos en «' + ZONAS[peor].nombre + '».') + '</p>' +
      '<p class="nota">Los tropiezos dependen sobre todo de reflejos y del momento: no miden tu capacidad de planificar ni de revisar. ' +
      'Lo que este resumen recoge son tus decisiones: qué preparaste, cuándo te detuviste a revisar y qué cambiaste.</p>';
    var fb = 'Revisaste tu plan ' + S.revisiones + ' vez/veces' + (S.ajustes ? ' y lo ajustaste ' + S.ajustes : '') + '. ';
    if (S.revisionFinal != null) fb += 'La revisión llegó al final, en la meta: revisar a mitad de camino permite cambiar el recorrido cuando todavía sirve. ';
    else if (S.ajustes) fb += 'Al ajustar aceptaste un coste de tiempo a cambio de una alternativa en el mapa: eso es regular la estrategia con información de la propia tarea. ';
    else fb += 'Confirmar un plan con evidencias también es supervisar: no toda revisión acaba en un cambio. ';
    fb += (S.prevision < 3 && peor >= 0 && !empate ? (S.prevision === peor ? 'Tu previsión coincidió con la zona de más tropiezos. ' : 'Tu previsión no coincidió con la zona de más tropiezos; contrastar lo previsto con lo ocurrido es parte de evaluar. ') : '') +
      'Es una sola partida: no describe cómo aprendes, solo lo que decidiste aquí.';
    api.terminar({ titulo: '¡Cruce completado!', puntos: S.puntos, html: html, feedback: fb,
      ficha: ['Revisiones conscientes del plan: ' + S.revisiones + ' (ajustes: ' + S.ajustes + ').', 'Tropiezos totales: ' + total + ' (reflejos, no metacognición).'] });
  }

  /* ---------- Física ---------- */
  function piezas(c) {                       /* x izquierda de cada obstáculo o balsa del carril */
    var xs = [];
    for (var i = 0; i < c.n; i++) xs.push(mod(c.fase + i * c.sep, c.L) - c.w);
    return xs;
  }
  function velDe(c, api) { return c.enPausa ? 0 : c.dir * c.v * c.factor * S.prisa * api.vel; }
  function apoyo(c, x) {                     /* 'fija', 'balsa' o null bajo la posición x de un carril P */
    var i;
    for (i = 0; i < c.fijas.length; i++) if (x >= c.fijas[i].col * T - 4 && x <= c.fijas[i].col * T + T + 4) return 'fija';
    var xs = piezas(c);
    for (i = 0; i < xs.length; i++) if (x >= xs[i] - 2 && x <= xs[i] + c.w + 2) return 'balsa';
    return null;
  }
  function golpea(c, x) {
    var xs = piezas(c);
    for (var i = 0; i < xs.length; i++) if (x + 12 > xs[i] + 3 && x - 12 < xs[i] + c.w - 3) return true;
    return false;
  }

  function mover(id, api) {
    var j = S.j;
    if (id === 'arriba' && j.r < META) j.r++;
    else if (id === 'abajo' && j.r > 0) j.r--;
    else if (id === 'izq') { j.x = Math.max(T / 2, j.x - T); j.mira = -1; }
    else if (id === 'der') { j.x = Math.min(W - T / 2, j.x + T); j.mira = 1; }
    else return;
    S.salto = api.t; api.sonido('salto');
    var c = S.carriles[j.r];
    if (c.tipo === 'S') j.x = Math.floor(j.x / T) * T + T / 2;      /* en tierra firme, la oca se centra en su casilla */
    if (j.r > S.maxFila) { S.maxFila = j.r; S.puntos += 10; }
    if (c.tipo === 'S' && j.r > S.segura) {
      S.segura = j.r;
      if (j.r < META) api.flotar('Zona segura', j.x, filaY(j.r) + 8, { color: C.menta });
    }
    if (j.r === CONTROL && !S.preguntado) puntoDeControl(api);
    else if (j.r === META) finZona(api);
  }

  function tropiezo(api, c, texto) {
    var z = S.zona, j = S.j, fila = j.r;
    S.tropiezos[z][S.segura >= CONTROL ? 1 : 0]++;
    S.vidas--; api.sonido('golpe');
    if (S.vidas <= 0) { sinVidas(api, 'Te has quedado sin vidas'); return; }
    j.r = S.segura; j.x = W / 2; S.inmune = 1.2; S.rep = null;
    if (S.corregir) { c.pausa = 5; api.mensaje(texto + ' Ese carril se detiene 5 s: analízalo y crúzalo.'); }
    else api.mensaje(texto + ' Vuelves a la última zona segura.');
    S.ultimoFallo = fila;
  }

  var NOMBRES = { arriba: 1, abajo: 1, izq: 1, der: 1 };

  A.crear({
    numero: '05', titulo: 'Cruce metacognitivo', pluma: 'PLUMA-METACOGNICION',
    ancho: W, alto: H,
    objetivo: 'Practicar decisiones metacognitivas: planificar antes de actuar, supervisar si el plan funciona y evaluarlo para ajustarlo a tiempo.',
    instrucciones: [
      'Lleva a la oca hasta la meta de tres zonas: esquiva interrupciones y tareas sobrecargadas, y cruza la corriente sobre las balsas.',
      'Antes de cada zona eliges un recurso: cambia el escenario y tiene un coste. En el punto de control decides si tu plan funciona o hay que ajustarlo.',
      'Para ganar hay que llegar al destino y haber revisado el plan al menos una vez. La Pluma Dorada se consigue con la reflexión final.'
    ],
    teclas: 'Teclado: flechas o WASD (arriba avanza, abajo retrocede); cada pulsación es un paso. En móvil o tableta: cruceta táctil.',
    transferencia: '¿Qué señal usarías para que tus alumnos sepan cuándo detenerse y revisar una estrategia?',
    ayuda: '<ul><li><b>Planificar:</b> decidir recursos, tiempo y prioridades antes de empezar.</li>' +
      '<li><b>Supervisar:</b> comprobar durante la tarea si el plan está dando resultado.</li>' +
      '<li><b>Evaluar y ajustar:</b> contrastar lo previsto con lo ocurrido y cambiar de estrategia.</li></ul>' +
      '<p><b>Leyenda:</b> cajas con «!» = interrupciones (cortas y rápidas); pilas de cajas = tareas sobrecargadas (largas y lentas); ' +
      'tablones sobre el agua = balsas que te llevan con ellas; franjas con puntos = zonas seguras (ahí vuelves si tropiezas); bandera = punto de control.</p>' +
      '<p>Todos los carriles repiten siempre el mismo patrón: obsérvalo antes de dar el paso. En la corriente, quédate sobre una balsa o una piedra.</p>',
    controles: { cruceta: ['arriba', 'abajo', 'izq', 'der'] },

    iniciar: function (api) {
      S = { zona: 0, puntos: 0, activa: false, plan: [null, null, null], inicial: [null, null, null],
        revision: ['no', 'no', 'no'], cambios: [[], [], []], tropiezos: [[0, 0], [0, 0], [0, 0]],
        reintentos: [0, 0, 0], duracion: [0, 0, 0], revisiones: 0, ajustes: 0, prevision: 3, revisionFinal: null,
        tiempo: TIEMPO, salto: -1, ultimoFallo: null };
      montarZona();
      api.elegir({
        titulo: 'Tu previsión',
        texto: 'Vas a cruzar tres zonas: Planificación, Supervisión y Evaluación; cada una algo más rápida que la anterior. Antes de empezar, ¿cuál crees que te costará más?',
        opciones: ['Planificación (zona 1)', 'Supervisión (zona 2)', 'Evaluación (zona 3)', 'Todavía no lo sé']
      }).then(function (r) {
        S.prevision = r.i;
        api.registrar('Previsión inicial: ' + (r.i < 3 ? 'creí que me costaría más «' + ZONAS[r.i].nombre + '».' : 'no sabía qué zona me costaría más.'));
        return elegirRecurso(api, false);
      });
    },

    alPulsar: function (id, api) {
      if (!S || !S.activa || !NOMBRES[id]) return;
      S.rep = { id: id, t: 0.3 };
      mover(id, api);
    },

    actualizar: function (dt, api) {
      if (!S.activa) return;
      var j = S.j, i, c;
      S.tz += dt;
      if (!api.tranquilo) {
        S.tiempo -= dt;
        if (S.tiempo <= 0) { sinVidas(api, 'Se acabó el tiempo de la zona'); return; }
      }
      /* repetición al mantener pulsada una dirección */
      if (S.rep) {
        if (!api.teclas[S.rep.id]) S.rep = null;
        else { S.rep.t -= dt; if (S.rep.t <= 0) { S.rep.t = 0.17; mover(S.rep.id, api); if (!S.activa) return; } }
      }
      for (i = 1; i < META; i++) {
        c = S.carriles[i];
        if (c.tipo === 'S') continue;
        if (c.pausa > 0) c.pausa = Math.max(0, c.pausa - dt);
        c.enPausa = c.pausa > 0 || (c.ciclo && mod(S.tz, 4.6) < 1.9);
        c.fase += velDe(c, api) * dt;
      }
      S.inmune = Math.max(0, S.inmune - dt);
      c = S.carriles[j.r];
      if (c.tipo === 'P') {
        var ap = apoyo(c, j.x);
        if (!ap) tropiezo(api, c, 'Has caído a la corriente.');
        else if (ap === 'balsa') j.x = A.limitar(j.x + velDe(c, api) * dt, T / 2, W - T / 2);
      } else if (c.tipo === 'R' && !S.inmune && golpea(c, j.x)) {
        tropiezo(api, c, c.w > 40 ? 'Te ha arrollado una tarea sobrecargada.' : 'Te ha frenado una interrupción.');
      }
      api.hud({
        Zona: (S.zona + 1) + '/3 ' + ZONAS[S.zona].nombre, Vidas: S.vidas,
        Tiempo: api.tranquilo ? 'sin límite' : Math.ceil(S.tiempo) + ' s',
        Puntos: S.puntos, Revisiones: S.revisiones
      });
    },

    dibujar: function (ctx, api) {
      if (!S || !S.carriles) return;
      var r, i, y, c, xs, x, Z = ZONAS[S.zona];
      for (r = 0; r < FILAS; r++) {
        c = S.carriles[r]; y = filaY(r);
        if (c.tipo === 'S') {
          A.caja(ctx, 0, y, W, T, r === META ? '#3a2f10' : '#1d3a3a');
          ctx.fillStyle = r === META ? C.oro : C.menta;
          for (i = 0; i < COLS * 2; i++) ctx.fillRect(i * 20 + 8, y + (i % 2 ? 6 : T - 9), 3, 3);
          if (r === 0) A.texto(ctx, 'ZONA ' + (S.zona + 1) + ' · ' + Z.nombre.toUpperCase(), W / 2, y + T / 2 + 12, { tam: 13, color: C.gris, negrita: true });
          if (r === META) {
            A.texto(ctx, 'META', W / 2, y + T / 2, { tam: 16, color: C.oro, negrita: true });
            A.pluma(ctx, 70, y + T / 2 + 2, 22); A.pluma(ctx, W - 70, y + T / 2 + 2, 22);
          }
          if (r === CONTROL) {                                   /* bandera del punto de control */
            ctx.fillStyle = C.blanco; ctx.fillRect(14, y + 6, 3, T - 12);
            ctx.fillStyle = S.preguntado ? C.menta : C.oro; ctx.fillRect(17, y + 6, 14, 10);
            A.texto(ctx, S.preguntado ? 'CONTROL ✓' : 'PUNTO DE CONTROL', 40, y + T / 2, { tam: 13, color: S.preguntado ? C.menta : C.oro, alin: 'left', negrita: true });
          }
          continue;
        }
        var agua = c.tipo === 'P';
        A.caja(ctx, 0, y, W, T, agua ? '#0d2f55' : '#161d38');
        if (agua) {                                              /* olas discretas */
          ctx.fillStyle = '#2f6aa8';
          var des = mod(api.t * 6 * c.dir, 40);
          for (i = -1; i < 10; i++) { ctx.fillRect(i * 40 + des, y + 9, 10, 2); ctx.fillRect(i * 40 + 20 + des, y + T - 11, 10, 2); }
        } else {
          ctx.fillStyle = '#3a2f6e';
          for (i = 0; i < 9; i++) ctx.fillRect(i * 40 + 12, y, 16, 2);
        }
        if (S.flechas) {                                         /* flechas de anticipación (plan temporal) */
          ctx.fillStyle = C.oro;
          for (i = 0; i < 3; i++) {
            var fx = c.dir > 0 ? 6 + i * 12 : W - 6 - i * 12;
            for (var q = 0; q < 5; q++) ctx.fillRect(fx + c.dir * (2 - Math.abs(q - 2)) * 2 - 1, y + 14 + q * 3, 3, 3);
          }
        }
        xs = piezas(c);
        if (S.flechas && !agua) {                                /* aviso de entrada: barra que crece en el borde */
          var vv = Math.abs(velDe(c, api)) || 1, falta = 99;
          for (i = 0; i < xs.length; i++) {
            var d = c.dir > 0 ? (c.L - c.w) - xs[i] : xs[i] - W;
            if (xs[i] >= W && d / vv < falta) falta = d / vv;
          }
          if (falta < 1.5) {
            var hb = Math.round((1 - falta / 1.5) * (T - 8));
            ctx.fillStyle = C.rojo; ctx.fillRect(c.dir > 0 ? 0 : W - 5, y + T - 4 - hb, 5, hb);
          }
        }
        c.fijas.forEach(function (f) {
          var px = f.col * T;
          if (f.clase === 'puente') {
            A.caja(ctx, px + 2, y, T - 4, T, '#7a5a1c', C.oro, 2);
            ctx.fillStyle = C.oro; ctx.fillRect(px + 6, y + 12, T - 12, 2); ctx.fillRect(px + 6, y + 26, T - 12, 2);
          } else {
            A.caja(ctx, px + 4, y + 5, T - 8, T - 10, '#5d6685', f.clase === 'ajuste' ? C.menta : C.blanco, 2);
            if (f.clase === 'ajuste') { ctx.fillStyle = C.menta; ctx.fillRect(px + 18, y + 12, 4, 16); ctx.fillRect(px + 12, y + 18, 16, 4); }
            else { ctx.fillStyle = '#8791b5'; ctx.fillRect(px + 10, y + 12, 8, 4); ctx.fillRect(px + 20, y + 22, 8, 4); }
          }
        });
        for (i = 0; i < xs.length; i++) {
          x = Math.round(xs[i]);
          if (x >= W || x + c.w <= 0) continue;
          if (agua) {                                            /* balsa de apuntes */
            A.caja(ctx, x, y + 5, c.w, T - 10, '#1f6b57', C.menta, 2);
            ctx.fillStyle = '#2f9c80';
            for (var b = 10; b < c.w - 6; b += 20) ctx.fillRect(x + b, y + 10, 2, T - 20);
          } else if (c.w > 40) {                                 /* tarea sobrecargada: pila de cajas */
            A.caja(ctx, x + 3, y + 16, c.w - 6, T - 20, '#5a3fa8', C.blanco, 2);
            A.caja(ctx, x + 12, y + 5, c.w - 34, 13, C.oro, '#000', 1);
            A.caja(ctx, x + c.w - 30, y + 8, 18, 10, C.morado2, '#000', 1);
            ctx.fillStyle = C.blanco;
            for (b = 10; b < c.w - 14; b += 12) ctx.fillRect(x + b, y + 24, 7, 2);
            for (b = 10; b < c.w - 26; b += 12) ctx.fillRect(x + b, y + 30, 7, 2);
          } else {                                               /* interrupción: aviso con «!» */
            A.caja(ctx, x + 5, y + 5, c.w - 10, T - 14, '#b3393f', C.blanco, 2);
            ctx.fillStyle = '#b3393f'; ctx.fillRect(x + (c.dir > 0 ? 9 : c.w - 15), y + T - 10, 6, 5);
            ctx.fillStyle = C.blanco; ctx.fillRect(x + c.w / 2 - 2, y + 10, 4, 10); ctx.fillRect(x + c.w / 2 - 2, y + 22, 4, 4);
          }
        }
        if (c.enPausa) {
          A.caja(ctx, W / 2 - 46, y + 9, 92, 22, '#101629', C.oro, 2);
          ctx.fillStyle = C.oro; ctx.fillRect(W / 2 - 38, y + 14, 4, 12); ctx.fillRect(W / 2 - 31, y + 14, 4, 12);
          A.texto(ctx, 'PAUSA', W / 2 + 8, y + T / 2 + 1, { tam: 13, color: C.oro, negrita: true });
        } else if (c.factor < 1 && !agua) {                      /* carril ralentizado: marca de tortuga (≈) */
          A.texto(ctx, 'lento', c.dir > 0 ? W - 22 : 22, y + T - 8, { tam: 11, color: C.menta });
        }
      }
      var j = S.j, jy = filaY(j.r) + T / 2, bote = api.t - S.salto < 0.09 ? -4 : 0;
      if (S.inmune > 0) { ctx.strokeStyle = C.menta; ctx.lineWidth = 2; ctx.strokeRect(j.x - 16, jy - 17, 32, 34); }
      A.oca(ctx, j.x, jy + bote, 26, { dir: j.mira, paso: bote !== 0 });
    },

    /* Solo lectura, para pruebas automáticas */
    prueba: { estado: function () { return S; }, piezas: piezas, apoyo: apoyo, golpea: golpea, velDe: velDe, T: T, W: W }
  });
})();
