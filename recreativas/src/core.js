/* Motor común de las recreativas de «Obsoletus y la Gran Oca del Saber».
   Sin dependencias externas ni almacenamiento: todo vive en memoria durante la sesión. */
(function () {
  'use strict';
  var C = { noche: '#101629', noche2: '#1b2444', morado: '#6D42C7', morado2: '#a98bf0', menta: '#42D6A4',
    oro: '#F1C453', blanco: '#f4f1e8', rojo: '#ff8a8a', gris: '#8791b5' };
  var FUENTE = 'ui-monospace,"SF Mono",Menlo,Consolas,"Liberation Mono","Courier New",monospace';
  function $(id) { return document.getElementById(id); }
  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt != null) e.textContent = txt;
    return e;
  }

  /* ---------- Ayudas de dibujo ---------- */
  function texto(ctx, s, x, y, o) {
    o = o || {};
    var tam = o.tam || 14;
    ctx.font = (o.negrita ? '700 ' : '') + tam + 'px ' + FUENTE;
    ctx.textAlign = o.alin || 'center';
    ctx.textBaseline = o.base || 'middle';
    var lineas = [String(s)];
    if (o.ancho) {
      lineas = [];
      var pal = String(s).split(' '), l = '';
      pal.forEach(function (p) {
        var t = l ? l + ' ' + p : p;
        if (ctx.measureText(t).width > o.ancho && l) { lineas.push(l); l = p; } else l = t;
      });
      lineas.push(l);
    }
    var alto = tam * 1.25, y0 = y - (lineas.length - 1) * alto / 2;
    lineas.forEach(function (ln, i) {
      if (o.sombra !== false) { ctx.fillStyle = o.sombraColor || '#000'; ctx.fillText(ln, x + 1, y0 + i * alto + 1); }
      ctx.fillStyle = o.color || C.blanco;
      ctx.fillText(ln, x, y0 + i * alto);
    });
    return lineas.length;
  }
  function caja(ctx, x, y, w, h, relleno, borde, grosor) {
    if (relleno) { ctx.fillStyle = relleno; ctx.fillRect(x, y, w, h); }
    if (borde) { ctx.strokeStyle = borde; ctx.lineWidth = grosor || 2; ctx.strokeRect(x + 1, y + 1, w - 2, h - 2); }
  }
  /* Oca exploradora: centrada en (x,y), altura aproximada t. o = {dir:-1|1, paso:bool, color:gorro} */
  function oca(ctx, x, y, t, o) {
    o = o || {};
    var u = t / 9;
    ctx.save(); ctx.translate(x, y); ctx.scale(o.dir < 0 ? -1 : 1, 1);
    function r(c, a, b, w, h) { ctx.fillStyle = c; ctx.fillRect(a * u, b * u, w * u, h * u); }
    r('#f4f1e8', -3.5, -0.5, 5.5, 3.5);
    r('#d9d4c4', -3, 0.3, 3, 1.6);
    r('#f4f1e8', 0.8, -3.5, 2, 4);
    r(o.color || C.menta, 0.3, -4.5, 3, 1);
    r('#101629', 1.9, -2.8, 0.7, 0.7);
    r(C.oro, 2.8, -2.4, 1.6, 0.9);
    var p = o.paso ? 0.8 : 0;
    r(C.oro, -2 + p, 3, 1, 1.4); r(C.oro, 0 - p, 3, 1, 1.4);
    ctx.restore();
  }
  /* Robot de Obsoletus: centrado en (x,y), altura aproximada t. o = {color, ojo, enfado} */
  function robot(ctx, x, y, t, o) {
    o = o || {};
    var u = t / 9;
    ctx.save(); ctx.translate(x, y);
    function r(c, a, b, w, h) { ctx.fillStyle = c; ctx.fillRect(a * u, b * u, w * u, h * u); }
    r(C.gris, -0.3, -4.5, 0.6, 1.2); r(o.ojo || C.rojo, -0.7, -5, 1.4, 0.8);
    r(C.blanco, -3.8, -3.6, 7.6, 5.9); r(o.color || '#3b2a78', -3.5, -3.3, 7, 5.3);
    r('#000', -2.6, -2.2, 5.2, 1.8);
    r(o.ojo || C.rojo, -2, -1.8, 1.2, 1); r(o.ojo || C.rojo, 0.8, -1.8, 1.2, 1);
    r('#000', -2, 0.6, 4, 0.6);
    r(C.gris, -2.8, 2, 2, 2.4); r(C.gris, 0.8, 2, 2, 2.4);
    ctx.restore();
  }
  function pluma(ctx, x, y, t, color) {
    var u = t / 8;
    ctx.save(); ctx.translate(x, y); ctx.rotate(-0.5);
    ctx.fillStyle = color || C.oro;
    ctx.fillRect(-1.5 * u, -4 * u, 3 * u, 6 * u); ctx.fillRect(-0.8 * u, -5 * u, 1.6 * u, 1 * u);
    ctx.fillStyle = '#000'; ctx.fillRect(-0.2 * u, -3.5 * u, 0.4 * u, 7.5 * u);
    ctx.restore();
  }
  function choca(a, b) { return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y; }
  function limitar(v, a, b) { return v < a ? a : v > b ? b : v; }

  /* ---------- Motor ---------- */
  function crear(J) {
    var lienzo = $('lienzo'), ctx = lienzo.getContext('2d'), capa = $('capa'), panel = $('panel');
    var W = J.ancho || 480, H = J.alto || 360, k = 1;
    var estado = 'inicio', gen = 0, tranquilo = false, sonido = false, audio = null;
    var registro = [], hudCache = '', herr = null, herrSel = null, alHerr = null;
    var cola = Promise.resolve(), botonesModal = null, flotantes = [];
    var ctl = J.controles || {};
    var dirs = ctl.cruceta || ['arriba', 'abajo', 'izq', 'der'];
    var acciones = ctl.acciones || [];
    var teclas = { arriba: false, abajo: false, izq: false, der: false };
    var TECLAS_DEF = [[' '], ['x', 'm'], ['z', 'n']];
    var mapa = { arrowup: 'arriba', w: 'arriba', arrowdown: 'abajo', s: 'abajo', arrowleft: 'izq', a: 'izq', arrowright: 'der', d: 'der' };
    acciones.forEach(function (a, i) {
      teclas[a.id] = false;
      (a.teclas || TECLAS_DEF[i] || []).forEach(function (t) { mapa[t.toLowerCase()] = a.id; });
    });

    var api = {
      W: W, H: H, C: C, t: 0, teclas: teclas,
      get tranquilo() { return tranquilo; },
      get vel() { return tranquilo ? 0.6 : 1; },
      get herramienta() { return herrSel; },
      get jugando() { return estado === 'jugando'; },
      hud: function (o) {
        var h = '';
        Object.keys(o).forEach(function (kk) {
          if (o[kk] == null || o[kk] === '') return;
          h += '<span class="chip"><b>' + esc(kk) + '</b>' + esc(o[kk]) + '</span>';
        });
        if (h !== hudCache) { hudCache = h; $('hud').innerHTML = h; }
      },
      sonido: bip,
      mensaje: function (txt, ms) {
        var cont = $('avisos'), a = el('div', 'aviso', txt);
        while (cont.children.length >= 2) cont.removeChild(cont.firstChild);
        cont.appendChild(a);
        setTimeout(function () { if (a.parentNode) a.parentNode.removeChild(a); }, ms || 3200);
      },
      flotar: function (txt, x, y, o) {
        o = o || {};
        flotantes.push({ txt: txt, x: x, y: y, v: 0, dur: o.dur || 1.1, color: o.color || C.oro, tam: o.tam || 13 });
        if (flotantes.length > 8) flotantes.shift();
      },
      registrar: function (txt) { registro.push(String(txt)); },
      elegir: function (cfg) {
        var g = gen;
        cola = cola.then(function () { return g === gen ? modal(cfg, g) : new Promise(function () {}); });
        return cola;
      },
      informar: function (cfg) {
        return api.elegir({ titulo: cfg.titulo, texto: cfg.texto, html: cfg.html, opciones: [cfg.boton || 'Continuar'] });
      },
      herramientas: function (lista, alElegir) {
        herr = lista && lista.length ? lista : null; alHerr = alElegir || null;
        herrSel = null; pintarHerr(); ajustar();
      },
      seleccionar: function (id) { elegirHerr(id, true); },
      ayuda: function (html) { J.ayuda = html; },
      terminar: fin
    };

    /* --- Sonido (apagado por defecto) --- */
    function bip(tipo) {
      if (!sonido) return;
      try {
        audio = audio || new (window.AudioContext || window.webkitAudioContext)();
        var f = { punto: 880, ok: 660, error: 200, golpe: 150, salto: 520, disparo: 740, gana: 990 }[tipo] || 440;
        var o = audio.createOscillator(), gn = audio.createGain();
        o.type = 'square'; o.frequency.value = f; gn.gain.value = 0.05;
        o.connect(gn); gn.connect(audio.destination);
        o.start(); o.stop(audio.currentTime + 0.09);
      } catch (e) { /* sin audio disponible */ }
    }

    /* --- Tamaño del lienzo --- */
    function ajustar() {
      var r = $('escena').getBoundingClientRect();
      var s = Math.max(0.2, Math.min((r.width - 6) / W, (r.height - 6) / H));
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      lienzo.style.width = Math.floor(W * s) + 'px';
      lienzo.style.height = Math.floor(H * s) + 'px';
      lienzo.width = Math.round(W * s * dpr); lienzo.height = Math.round(H * s * dpr);
      k = lienzo.width / W;
    }
    window.addEventListener('resize', ajustar);
    if (window.ResizeObserver) new ResizeObserver(ajustar).observe($('escena'));

    /* --- Entrada --- */
    function soltar() { Object.keys(teclas).forEach(function (t) { teclas[t] = false; }); }
    function pulsar(id) {
      if (estado !== 'jugando') return;
      if (id in teclas) teclas[id] = true;
      if (J.alPulsar) J.alPulsar(id, api);
    }
    function escribiendo(e) { var t = e.target && e.target.tagName; return t === 'TEXTAREA' || t === 'INPUT'; }
    window.addEventListener('keydown', function (e) {
      if (escribiendo(e) || e.ctrlKey || e.metaKey || e.altKey) return;
      var key = e.key.toLowerCase();
      if (estado === 'modal') {
        var n = parseInt(key, 10);
        if (botonesModal && n >= 1 && n <= botonesModal.length) { e.preventDefault(); botonesModal[n - 1].click(); }
        return;
      }
      if (key === 'p' || key === 'escape') { if (estado === 'jugando' || estado === 'pausa') { e.preventDefault(); pausa(); } return; }
      if (estado !== 'jugando') return;
      var id = mapa[key];
      if (id) { e.preventDefault(); if (!e.repeat) pulsar(id); return; }
      var d = parseInt(key, 10);
      if (d >= 1 && d <= 9) {
        if (herr && d <= herr.length) elegirHerr(herr[d - 1].id);
        if (J.alPulsar) J.alPulsar(String(d), api);
      }
    });
    window.addEventListener('keyup', function (e) {
      var id = mapa[e.key.toLowerCase()];
      if (id) teclas[id] = false;
    });
    window.addEventListener('blur', soltar);
    lienzo.addEventListener('pointerdown', function (e) {
      if (estado !== 'jugando' || !J.alPuntero) return;
      var r = lienzo.getBoundingClientRect();
      J.alPuntero((e.clientX - r.left) / r.width * W, (e.clientY - r.top) / r.height * H, api);
    });
    function botonTactil(id, etiqueta, aria) {
      var b = el('button', null, etiqueta);
      b.type = 'button'; b.setAttribute('aria-label', aria || etiqueta);
      function baja(e) { e.preventDefault(); b.classList.add('pulsado'); pulsar(id); }
      function sube(e) { e.preventDefault(); b.classList.remove('pulsado'); if (id in teclas) teclas[id] = false; }
      b.addEventListener('pointerdown', baja);
      ['pointerup', 'pointercancel', 'pointerleave'].forEach(function (n) { b.addEventListener(n, sube); });
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      return b;
    }
    (function montarTactil() {
      var cr = $('cruceta'), ac = $('acciones');
      if (dirs.length) {
        var pos = { arriba: [2, 1, '▲', 'Arriba'], izq: [1, 2, '◀', 'Izquierda'], der: [3, 2, '▶', 'Derecha'], abajo: [2, 3, '▼', 'Abajo'] };
        var soloLR = dirs.indexOf('arriba') < 0 && dirs.indexOf('abajo') < 0;
        if (soloLR) { cr.style.gridTemplateRows = '56px'; cr.style.gridTemplateColumns = 'repeat(2,64px)'; }
        dirs.forEach(function (dd) {
          var p = pos[dd], b = botonTactil(dd, p[2], p[3]);
          if (!soloLR) { b.style.gridColumn = p[0]; b.style.gridRow = p[1]; }
          cr.appendChild(b);
        });
      }
      acciones.forEach(function (a) { ac.appendChild(botonTactil(a.id, a.etiqueta)); });
    })();

    /* --- Barra de herramientas del juego --- */
    function pintarHerr() {
      var c = $('herramientas'); c.innerHTML = '';
      if (!herr) return;
      herr.forEach(function (h, i) {
        var b = el('button', null, (i + 1) + ' · ' + (h.icono ? h.icono + ' ' : '') + h.etiqueta);
        b.type = 'button'; b.setAttribute('aria-pressed', String(h.id === herrSel));
        b.addEventListener('click', function () { if (estado === 'jugando') elegirHerr(h.id); b.blur(); });
        c.appendChild(b);
      });
    }
    function elegirHerr(id, silencioso) {
      if (!herr) return;
      herrSel = id; pintarHerr();
      if (alHerr && !silencioso) alHerr(id, api);
    }

    /* --- Paneles --- */
    function abrirPanel() { capa.hidden = false; panel.scrollTop = 0; }
    function cerrarPanel() { capa.hidden = true; panel.innerHTML = ''; botonesModal = null; }
    function parrafos(dest, txt) {
      String(txt).split('\n').forEach(function (p) { if (p.trim()) dest.appendChild(el('p', null, p)); });
    }
    function modal(cfg, g) {
      return new Promise(function (res) {
        soltar(); estado = 'modal';
        var abierto = performance.now(), ta = null;
        panel.innerHTML = '';
        if (cfg.titulo) panel.appendChild(el('h2', null, cfg.titulo));
        if (cfg.texto) parrafos(panel, cfg.texto);
        if (cfg.html) { var d = el('div'); d.innerHTML = cfg.html; panel.appendChild(d); }
        if (cfg.campo) {
          var lb = el('label', null, cfg.campo); lb.htmlFor = 'campoModal';
          ta = el('textarea'); ta.id = 'campoModal'; ta.maxLength = 300;
          panel.appendChild(lb); panel.appendChild(ta);
        }
        var cont = el('div', 'opciones' + (cfg.enFila ? ' fila' : ''));
        botonesModal = [];
        (cfg.opciones || ['Continuar']).forEach(function (o, i) {
          var b = el('button'); b.type = 'button';
          var et = typeof o === 'string' ? o : o.etiqueta;
          b.appendChild(document.createTextNode((cfg.opciones && cfg.opciones.length > 1 && !cfg.enFila ? (i + 1) + ' · ' : '') + et));
          if (o.detalle) b.appendChild(el('small', null, o.detalle));
          b.addEventListener('click', function () {
            if (performance.now() - abierto < 350 || g !== gen) return;
            cerrarPanel(); estado = 'jugando';
            res({ i: i, texto: ta ? ta.value.trim() : '' });
          });
          cont.appendChild(b); botonesModal.push(b);
        });
        panel.appendChild(cont);
        abrirPanel();
        setTimeout(function () { if (g === gen && estado === 'modal' && !ta) panel.focus(); }, 50);
      });
    }
    function pausa() {
      if (estado === 'jugando') {
        soltar(); estado = 'pausa';
        panel.innerHTML = '<h2>Pausa</h2><p>El juego está detenido. Nada se mueve hasta que reanudes.</p>' +
          (J.ayuda ? '<h3>Ayuda y conceptos</h3>' + J.ayuda : '');
        var b = el('button', 'principal', 'Reanudar'); b.type = 'button'; b.addEventListener('click', pausa);
        var c = el('div', 'opciones'); c.appendChild(b); panel.appendChild(c);
        abrirPanel(); $('bPausa').textContent = 'Reanudar';
      } else if (estado === 'pausa') {
        cerrarPanel(); estado = 'jugando'; $('bPausa').textContent = 'Pausa';
      }
    }
    function conmutadores() {
      var c = el('div', 'conmutadores');
      var bt = el('button'), bs = el('button'); bt.type = bs.type = 'button';
      function pinta() {
        bt.textContent = 'Modo tranquilo: ' + (tranquilo ? 'sí' : 'no'); bt.setAttribute('aria-pressed', String(tranquilo));
        bs.textContent = 'Sonido: ' + (sonido ? 'sí' : 'no'); bs.setAttribute('aria-pressed', String(sonido));
        $('bTranquilo').textContent = 'Tranquilo: ' + (tranquilo ? 'sí' : 'no'); $('bTranquilo').setAttribute('aria-pressed', String(tranquilo));
        $('bSonido').textContent = 'Sonido: ' + (sonido ? 'sí' : 'no'); $('bSonido').setAttribute('aria-pressed', String(sonido));
      }
      bt.addEventListener('click', function () { tranquilo = !tranquilo; pinta(); });
      bs.addEventListener('click', function () { sonido = !sonido; pinta(); bip('ok'); });
      pinta(); c.appendChild(bt); c.appendChild(bs);
      return c;
    }
    function ponTranquilo(v) {
      tranquilo = v;
      $('bTranquilo').textContent = 'Tranquilo: ' + (v ? 'sí' : 'no'); $('bTranquilo').setAttribute('aria-pressed', String(v));
    }
    api.activarTranquilo = function () { ponTranquilo(true); };

    function portada() {
      estado = 'inicio';
      panel.innerHTML = '<p class="nota">Obsoletus y la Gran Oca del Saber · Recreativa ' + esc(J.numero || '') + '</p>' +
        '<h2>' + esc(J.titulo) + '</h2>' +
        '<h3>Objetivo pedagógico</h3><p>' + esc(J.objetivo) + '</p>' +
        '<h3>Cómo se juega</h3><ol>' + (J.instrucciones || []).map(function (i) { return '<li>' + esc(i) + '</li>'; }).join('') + '</ol>' +
        '<p class="nota">' + esc(J.teclas || 'Teclado: flechas o WASD. En móvil o tableta: botones táctiles en pantalla.') +
        ' P o Esc: pausa. El modo tranquilo quita la presión de tiempo y reduce la velocidad.</p>';
      panel.appendChild(conmutadores());
      var b = el('button', 'principal', 'Iniciar'); b.type = 'button'; b.id = 'bIniciar';
      b.addEventListener('click', comenzar);
      var c = el('div', 'opciones'); c.appendChild(b); panel.appendChild(c);
      abrirPanel();
    }
    function comenzar() {
      gen++; cola = Promise.resolve();
      registro = []; flotantes = []; herr = null; herrSel = null; alHerr = null; pintarHerr();
      hudCache = ''; $('hud').innerHTML = ''; $('avisos').innerHTML = '';
      api.t = 0; soltar(); cerrarPanel();
      $('bPausa').textContent = 'Pausa';
      estado = 'jugando'; ajustar();
      J.iniciar(api);
    }

    /* --- Pantalla final y Pluma Dorada --- */
    function fin(r) {
      r = r || {};
      soltar(); estado = 'fin'; bip('gana');
      var decisiones = registro.slice();
      panel.innerHTML = '<h2>' + esc(r.titulo || '¡Reto superado!') + '</h2>' +
        '<p><b>Puntuación lúdica:</b> ' + esc(r.puntos != null ? r.puntos : 0) + ' <span class="nota">(solo mide la partida, no tu aprendizaje)</span></p>' +
        (r.html || '') +
        '<h3>Decisiones que tomaste</h3>' +
        (decisiones.length ? '<ul>' + decisiones.map(function (d) { return '<li>' + esc(d) + '</li>'; }).join('') + '</ul>' : '<p>Sin decisiones registradas.</p>') +
        (r.feedback ? '<h3>Comentario sobre esta partida</h3><p>' + esc(r.feedback) + '</p>' : '') +
        '<h3>Pregunta de transferencia</h3><p><b>' + esc(J.transferencia) + '</b></p>';
      var lb = el('label', null, 'Tu respuesta (1–2 frases):'); lb.htmlFor = 'reflexion';
      var ta = el('textarea'); ta.id = 'reflexion'; ta.maxLength = 600;
      var reclamar = el('button', 'principal', 'Reclamar Pluma Dorada'); reclamar.type = 'button'; reclamar.id = 'bReclamar'; reclamar.disabled = true;
      var aviso = el('p', 'nota', 'Escribe tu reflexión (al menos 20 caracteres) para activar la Pluma Dorada.');
      var zona = el('div');
      var otra = el('button', null, 'Jugar de nuevo'); otra.type = 'button'; otra.addEventListener('click', comenzar);
      var ops = el('div', 'opciones'); ops.appendChild(reclamar); ops.appendChild(otra);
      ta.addEventListener('input', function () { reclamar.disabled = ta.value.trim().length < 20; });
      reclamar.addEventListener('click', function () {
        var f = new Date(), fecha = f.toLocaleDateString('es-ES') + ' ' + f.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
        var lineas = ['✦ ' + J.pluma + ' ✦', 'Pluma Dorada · Obsoletus y la Gran Oca del Saber',
          'Recreativa ' + (J.numero || '') + ': ' + J.titulo, 'Fecha: ' + fecha,
          'Puntuación lúdica: ' + (r.puntos != null ? r.puntos : 0) + (tranquilo ? ' (modo tranquilo)' : ''), '', 'Decisiones en esta partida:'];
        decisiones.forEach(function (d) { lineas.push('- ' + d); });
        (r.ficha || []).forEach(function (d) { lineas.push('- ' + d); });
        lineas.push('', 'Pregunta: ' + J.transferencia, 'Mi reflexión: ' + ta.value.trim(), '',
          'Repaso formativo: esta ficha no certifica competencia docente.');
        zona.innerHTML = '<h3>Pluma Dorada reclamada: ' + esc(J.pluma) + '</h3>';
        var ficha = el('div', 'ficha', lineas.join('\n')); ficha.id = 'ficha'; ficha.tabIndex = 0;
        zona.appendChild(ficha);
        var copiar = el('button', null, 'Seleccionar y copiar ficha'); copiar.type = 'button';
        var nota = el('p', 'nota', 'Esta ficha solo existe en tu pantalla: no se ha enviado al profesorado ni se guarda en ningún servidor. Cópiala o haz una captura para conservarla.');
        copiar.addEventListener('click', function () {
          var rg = document.createRange(); rg.selectNodeContents(ficha);
          var sel = window.getSelection(); sel.removeAllRanges(); sel.addRange(rg);
          var ok = false;
          try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
          copiar.textContent = ok ? 'Ficha copiada' : 'Ficha seleccionada: cópiala con Ctrl/Cmd + C';
        });
        zona.appendChild(copiar); zona.appendChild(nota);
        reclamar.disabled = true; reclamar.textContent = 'Pluma Dorada reclamada'; ta.readOnly = true;
        ficha.scrollIntoView({ block: 'nearest' });
      });
      panel.appendChild(lb); panel.appendChild(ta); panel.appendChild(aviso); panel.appendChild(ops); panel.appendChild(zona);
      abrirPanel();
    }

    /* --- Botones fijos --- */
    $('titulo').textContent = J.titulo;
    $('bPausa').addEventListener('click', function () { pausa(); this.blur(); });
    $('bReiniciar').addEventListener('click', function () { this.blur(); comenzar(); });
    $('bSonido').addEventListener('click', function () {
      sonido = !sonido; this.textContent = 'Sonido: ' + (sonido ? 'sí' : 'no'); this.setAttribute('aria-pressed', String(sonido)); this.blur(); bip('ok');
    });
    $('bTranquilo').addEventListener('click', function () { ponTranquilo(!tranquilo); this.blur(); });

    /* --- Bucle --- */
    var previo = 0;
    function cuadro(ts) {
      requestAnimationFrame(cuadro);
      var dt = Math.min(0.05, (ts - previo) / 1000 || 0); previo = ts;
      if (estado === 'jugando') {
        api.t += dt;
        J.actualizar(dt, api);
        for (var i = flotantes.length - 1; i >= 0; i--) { flotantes[i].v += dt; if (flotantes[i].v > flotantes[i].dur) flotantes.splice(i, 1); }
      }
      if (estado === 'inicio') return;
      ctx.setTransform(k, 0, 0, k, 0, 0);
      ctx.imageSmoothingEnabled = false;
      ctx.fillStyle = C.noche; ctx.fillRect(0, 0, W, H);
      J.dibujar(ctx, api);
      flotantes.forEach(function (f) { texto(ctx, f.txt, f.x, f.y - f.v * 22, { tam: f.tam, color: f.color, negrita: true }); });
    }
    ajustar(); portada(); requestAnimationFrame(cuadro);
    Arcade._ = { api: api, juego: J, estado: function () { return estado; } };
    return api;
  }

  window.Arcade = { crear: crear, C: C, esc: esc, texto: texto, caja: caja, oca: oca, robot: robot, pluma: pluma, choca: choca, limitar: limitar };
})();
