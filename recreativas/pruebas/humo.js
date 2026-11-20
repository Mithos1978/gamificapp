/* Prueba de humo: node pruebas/humo.js [NN]  -> carga cada HTML, inicia, pulsa teclas y vigila errores.
   Guarda capturas (escritorio y móvil) en la carpeta indicada por CAPTURAS (por defecto, el directorio temporal). */
const { chromium } = require('playwright');
const fs = require('fs'), path = require('path'), os = require('os');
(async () => {
  const raiz = path.resolve(__dirname, '..'), filtro = process.argv[2] || '';
  const sal = process.env.CAPTURAS || os.tmpdir();
  const htmls = fs.readdirSync(raiz).filter(f => /^\d\d-.*\.html$/.test(f) && f.startsWith(filtro));
  const nav = await chromium.launch();
  let fallos = 0;
  for (const f of htmls) {
    for (const [nombre, vp] of [['pc', { width: 1100, height: 720 }], ['movil', { width: 390, height: 780, hasTouch: true, isMobile: true }]]) {
      const ctx = await nav.newContext({ viewport: { width: vp.width, height: vp.height }, hasTouch: !!vp.hasTouch, isMobile: !!vp.isMobile });
      const pag = await ctx.newPage(), errores = [];
      pag.on('pageerror', e => errores.push(String(e)));
      pag.on('console', m => { if (m.type() === 'error') errores.push(m.text()); });
      await pag.goto('file://' + path.join(raiz, f));
      await pag.screenshot({ path: path.join(sal, f.replace('.html', `-${nombre}-0inicio.png`)) });
      await pag.click('#bIniciar');
      for (let i = 0; i < 40; i++) {
        await pag.waitForTimeout(150);
        if (await pag.evaluate(() => Arcade._.estado()) === 'modal') {
          await pag.waitForTimeout(400);
          await pag.evaluate(() => { const b = document.querySelectorAll('#panel .opciones button'); b[0] && b[0].click(); });
          continue;
        }
        const k = ['ArrowRight', 'ArrowDown', ' ', 'ArrowLeft', 'ArrowUp', '1', '2'][i % 7];
        await pag.keyboard.down(k); await pag.waitForTimeout(120); await pag.keyboard.up(k);
      }
      await pag.screenshot({ path: path.join(sal, f.replace('.html', `-${nombre}-1juego.png`)) });
      const desborda = await pag.evaluate(() => document.documentElement.scrollHeight > innerHeight + 1 || document.documentElement.scrollWidth > innerWidth + 1 ||
        [...document.querySelectorAll('#lienzo,#cruceta button,#acciones button,#herramientas button,#botones button')].some(e => { const r = e.getBoundingClientRect(); return r.width && (r.left < -1 || r.top < -1 || r.right > innerWidth + 1 || r.bottom > innerHeight + 1); }));
      const lienzo = await pag.evaluate(() => { const r = document.getElementById('lienzo').getBoundingClientRect(); return [Math.round(r.width), Math.round(r.height)]; });
      await pag.keyboard.press('p'); await pag.waitForTimeout(100);
      const est = await pag.evaluate(() => Arcade._.estado());
      console.log(`${errores.length || desborda ? 'FALLO' : 'ok   '} ${f} [${nombre}] lienzo=${lienzo} estado=${est}${desborda ? ' DESBORDA' : ''}`);
      errores.slice(0, 5).forEach(e => console.log('   ' + e));
      if (errores.length || desborda) fallos++;
      await ctx.close();
    }
  }
  await nav.close();
  process.exit(fallos ? 1 : 0);
})();
