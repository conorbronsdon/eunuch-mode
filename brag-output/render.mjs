// render.mjs: frame-by-frame render of composition/index.html with Playwright (Chromium) + FFmpeg.
//
//   npm install                     (installs the pinned playwright-core; uses your installed Chrome)
//   node render.mjs --fmt=16x9 --out=brag.mp4            render video + mixed audio (-14 LUFS)
//   node render.mjs --fmt=9x16 --out=brag-9x16.mp4
//   node render.mjs --fmt=16x9 --check                   reading-time, text-fit and seal-collision checks
//   node render.mjs --fmt=16x9 --stills=0,1.5,3 --outdir=stills    full-resolution PNG stills
//   options: --fps=60 --workers=4 --crf=16 --draft (lower JPEG quality) --png (lossless capture, slow) --nograin --no-audio --music-only=FILE --chrome=PATH (or CHROME_PATH)
//
// The page is a pure function of t: window.seek(t) positions one paused GSAP timeline. No timers are used.
import { chromium } from 'playwright-core';
import http from 'node:http';
import fs from 'node:fs';
import os from 'node:os';
import { spawn, spawnSync } from 'node:child_process';
import { dirname, join, extname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = dirname(fileURLToPath(import.meta.url));
const COMP = join(HERE, 'composition');
const args = Object.fromEntries(process.argv.slice(2).map(a => { const [k, ...v] = a.replace(/^--/, '').split('='); return [k, v.length ? v.join('=') : true]; }));
const fmt = args.fmt || '16x9';
const [W, H] = fmt === '9x16' ? [1080, 1920] : [1920, 1080];
const fps = +(args.fps || 60);

const CHROME = args.chrome || process.env.CHROME_PATH || [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/usr/bin/google-chrome', '/usr/bin/chromium', '/usr/bin/chromium-browser',
].find(p => fs.existsSync(p));
if (!CHROME) { console.error('No Chrome/Chromium found; pass --chrome=PATH'); process.exit(1); }

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.ttf': 'font/ttf', '.svg': 'image/svg+xml', '.png': 'image/png' };
const srv = http.createServer((req, res) => {
  const p = resolve(join(COMP, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
  if (!p.startsWith(resolve(COMP))) { res.writeHead(403); return res.end(); }
  fs.readFile(p, (e, b) => { if (e) { res.writeHead(404); return res.end(); } res.writeHead(200, { 'content-type': TYPES[extname(p)] || 'application/octet-stream' }); res.end(b); });
});
await new Promise(ok => srv.listen(0, '127.0.0.1', ok));
const URL_ = `http://127.0.0.1:${srv.address().port}/index.html?fmt=${fmt}&fps=${fps}${args.nograin ? '&nograin' : ''}`;
const browser = await chromium.launch({ executablePath: CHROME, headless: true,
  args: ['--force-color-profile=srgb', '--font-render-hinting=none', '--disable-background-timer-throttling', '--disable-renderer-backgrounding', '--hide-scrollbars'] });

async function openPage(tries = 3) {
  for (let i = 1; ; i++) { try { return await openPageOnce(); } catch (e) { if (i >= tries) throw e; console.log(`[retry] page load failed (${e.message}); attempt ${i + 1}`); } }
}
async function openPageOnce() {
  const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
  page.on('pageerror', e => console.log('[page error]', e.message));
  page.on('console', m => { if (m.type() === 'error') console.log('[page]', m.text()); });
  await page.goto(URL_);
  await page.waitForFunction('window.ready === true || window.buildError', null, { timeout: 60000 });
  const err = await page.evaluate(() => window.buildError);
  if (err) throw new Error(err);
  return page;
}
const seek = (page, t) => page.evaluate(t => new Promise(r => { window.seek(t); requestAnimationFrame(() => r()); }), t);

const probe = await openPage();
const META = await probe.evaluate(() => window.META);
const dur = META.dur, N = Math.round(dur * fps);
console.log(`${fmt} ${W}x${H} ${dur}s @${fps}fps, ${N} frames`);

function run(cmd, a) { const r = spawnSync(cmd, a, { encoding: 'utf8', maxBuffer: 1 << 26 }); if (r.status) { console.error(r.stderr); throw new Error(cmd + ' failed'); } return r; }

if (args.check) {
  // Reading time: every data-read element must be fully opaque, on screen and still (<= 3 px drift) for its whole read
  // window, and that window must be at least max(1.2 s, words / 3.3 + 0.6 s). Text must fit its box and the frame.
  const READS = await probe.evaluate(() => window.READS);
  console.log('scenes: ' + (await probe.evaluate(() => window.SCENES)).map(x => x.sel + ' ' + x.a.toFixed(2) + '-' + x.b.toFixed(2)).join(', '));
  const fails = [];
  const sample = (page, t) => page.evaluate(({ t, reads }) => {
    window.seek(t);
    const eff = el => { let o = 1; for (let e = el; e && e.nodeType === 1; e = e.parentElement) { const cs = getComputedStyle(e); o *= +cs.opacity; if (cs.visibility === 'hidden' || cs.display === 'none') return 0; } return o; };
    const seal = document.getElementById('seal').getBoundingClientRect(); const sealLive = seal.width > 4;
    return reads.map(r => { const el = document.querySelector(r.sel); const b = el.getBoundingClientRect();
      const kids = [el, ...el.querySelectorAll('span')]; const op = Math.min(...kids.map(eff));
      // seal clearance: the seal's inner 60% must not touch any rendered glyph run (word) of this element
      const sx0 = seal.left + seal.width * .2, sx1 = seal.right - seal.width * .2, sy0 = seal.top + seal.height * .2, sy1 = seal.bottom - seal.height * .2;
      let hit = false; const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
      for (let n; (n = walker.nextNode());) { if (getComputedStyle(n.parentElement).color === 'rgba(0, 0, 0, 0)') continue;
        const re = /\S+/g; let m; while ((m = re.exec(n.data))) { const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length);
          for (const q of rg.getClientRects()) if (q.right > sx0 && q.left < sx1 && q.bottom > sy0 && q.top < sy1) hit = true; } }
      if (!sealLive) hit = false; const ix = hit ? 1 : 0, iy = hit ? 1 : 0;
      // the adviser's head and torso must not cover any glyph either
      const advEl = document.getElementById('adv'), advBox = document.getElementById('adv-hit');
      let advHit = false;
      // the adviser must not be drawn over any glyph: hit-test points across every word (true visual occlusion)
      if (advEl && getComputedStyle(advEl).visibility !== 'hidden') { const w2 = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
        for (let n; (n = w2.nextNode());) { const re2 = /\S+/g; let m2; while ((m2 = re2.exec(n.data))) { const rg = document.createRange(); rg.setStart(n, m2.index); rg.setEnd(n, m2.index + m2[0].length);
          for (const q of rg.getClientRects()) for (const fx of [.1, .5, .9]) for (const fy of [.3, .7]) { const stack = document.elementsFromPoint(q.left + q.width * fx, q.top + q.height * fy);
            for (const hitEl of stack) { if (hitEl === el || el.contains(hitEl)) break; if (hitEl.closest && hitEl.closest('#adv') && eff(hitEl) > .05) { advHit = true; break; } } } } } }
      // text collision: no other visible text block may overlap this one
      const others = [...document.querySelectorAll('[data-read], .slip-text, .slip-label, .imp, #chip, .label')].filter(o => o !== el && !o.contains(el) && !el.contains(o) && eff(o) > .05);
      const glyphs = node => { const out = [], w = document.createTreeWalker(node, NodeFilter.SHOW_TEXT); for (let n; (n = w.nextNode());) { if (eff(n.parentElement) < .05) continue; const re = /\S+/g; let m;
        while ((m = re.exec(n.data))) { const rg = document.createRange(); rg.setStart(n, m.index); rg.setEnd(n, m.index + m[0].length); out.push(...rg.getClientRects()); } } return out; };
      const mine = glyphs(el), box = o => { if (o.classList.contains('imp')) { const q = o.getBoundingClientRect(); return [q]; } return glyphs(o); };
      const collide = others.some(o => box(o).some(q => mine.some(r => q.right > r.left + 1 && q.left < r.right - 1 && q.bottom > r.top + 2 && q.top < r.bottom - 2)));
      const kidsOverflow = [...el.querySelectorAll('span')].some(k => { const kb = k.getBoundingClientRect(); return kb.width && (kb.right > innerWidth - 8 || kb.left < 8); });
      const V = innerHeight > innerWidth;   // 9:16: keep reads inside the platform-safe column (TikTok/Reels/Shorts UI)
      const safe = !V || (b.left >= 40 && b.right <= innerWidth - 150 && b.top >= 250 && b.bottom <= innerHeight - 400);
      return { x: b.left, y: b.top, w: b.width, h: b.height, op, safe, collide: collide || advHit, fit: el.scrollWidth <= el.clientWidth + 2 && b.left >= 8 && b.right <= innerWidth - 8 && b.top >= 8 && b.bottom <= innerHeight - 8 && !kidsOverflow, sealHit: ix * iy > 0 && seal.width < innerWidth * .5 }; });
  }, { t, reads: READS });
  for (const [i, r] of READS.entries()) {
    const have = +(r.out - r.in).toFixed(3);
    if (have + 1e-3 < r.need) fails.push(`READ ${r.sel}: window ${have}s < need ${r.need}s`);
  }
  const step = 1 / 30; let ref = null;
  const state = READS.map(() => ({ ref: null, worstDrift: 0, minOp: 1, fit: true, seal: false, safe: true, collide: false }));
  for (let t = 0; t <= dur; t += step) {
    const s = await sample(probe, +t.toFixed(4));
    READS.forEach((r, i) => { if (t < r.in - 1e-6 || t > r.out - step) return; const st = state[i], b = s[i];
      if (!st.ref) st.ref = b; st.worstDrift = Math.max(st.worstDrift, Math.abs(b.x - st.ref.x), Math.abs(b.y - st.ref.y));
      st.minOp = Math.min(st.minOp, b.op); st.fit = st.fit && b.fit; st.seal = st.seal || b.sealHit; st.safe = st.safe && b.safe; if (b.collide && !st.collide) st.collideAt = +t.toFixed(2); st.collide = st.collide || b.collide; });
  }
  READS.forEach((r, i) => { const st = state[i];
    const line = `${r.sel.padEnd(28)} in ${r.in.toFixed(2)} out ${r.out.toFixed(2)} need ${r.need.toFixed(2)} drift ${st.worstDrift.toFixed(1)}px minOpacity ${st.minOp.toFixed(3)} fit ${st.fit} sealOverlap ${st.seal} safeZone ${st.safe} collision ${st.collide}${st.collide ? ' @' + st.collideAt + 's' : ''}`;
    console.log(line);
    if (st.worstDrift > 3) fails.push('DRIFT ' + line); if (st.minOp < .98) fails.push('OPACITY ' + line); if (!st.fit) fails.push('FIT ' + line); if (st.seal) fails.push('SEAL ' + line); if (!st.safe) fails.push('SAFE ' + line); if (st.collide) fails.push('COLLISION ' + line); });
  // determinism: the same t renders the same pixels after seeking elsewhere
  await seek(probe, 7.3); const a = await probe.screenshot(); await seek(probe, 21); await seek(probe, 7.3); const b = await probe.screenshot();
  if (!a.equals(b)) fails.push('DETERMINISM: t=7.3 differs after a seek round-trip');
  console.log(fails.length ? 'FAIL\n' + fails.join('\n') : 'PASS: reading time, stillness, opacity, fit, seal clearance, text collisions, 9:16 safe zone, determinism');
  await browser.close(); srv.close(); process.exit(fails.length ? 1 : 0);
}

if (args.stills) {
  const outdir = args.outdir || 'stills'; fs.mkdirSync(outdir, { recursive: true });
  for (const t of String(args.stills).split(',').map(Number)) { await seek(probe, t); await probe.screenshot({ path: join(outdir, `${fmt}-${t.toFixed(2).padStart(6, '0')}.png`) }); }
  console.log('stills ->', outdir); await browser.close(); srv.close(); process.exit(0);
}

// ---------- frames: parallel workers, each piping PNG frames into its own FFmpeg segment ----------
const out = args.out || `brag-${fmt}.mp4`;
const tmp = fs.mkdtempSync(join(os.tmpdir(), 'petition-'));
const workers = +(args.workers || 4), crf = args.crf || 16;
const per = Math.ceil(N / workers);
const t0 = Date.now();
await Promise.all([...Array(workers).keys()].map(async w => {
  const page = w === 0 ? probe : await openPage();
  const a = w * per, b = Math.min(N, a + per); if (a >= b) return;
  const ff = spawn('ffmpeg', ['-v', 'error', '-y', '-f', 'image2pipe', '-framerate', String(fps), ...(args.png ? [] : ['-c:v', 'mjpeg']), '-i', '-', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-colorspace', 'bt709', join(tmp, `seg${w}.mp4`)], { stdio: ['pipe', 'inherit', 'inherit'] });
  for (let i = a; i < b; i++) {
    await seek(page, i / fps);
    const png = await page.screenshot(args.png ? { type: 'png' } : { type: 'jpeg', quality: args.draft ? 88 : 96 });   // JPEG q96 by default (PNG capture is ~10x slower); --png for lossless
    if (!ff.stdin.write(png)) await new Promise(r => ff.stdin.once('drain', r));
    if (w === 0 && i % 120 === 0) console.log(`frame ${i}/${per} (worker 0) ${((Date.now() - t0) / 1000).toFixed(0)}s`);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
}));
fs.writeFileSync(join(tmp, 'list.txt'), [...Array(workers).keys()].filter(w => fs.existsSync(join(tmp, `seg${w}.mp4`))).map(w => `file 'seg${w}.mp4'`).join('\n'));
const silent = join(tmp, 'video.mp4');
run('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', join(tmp, 'list.txt'), '-c', 'copy', silent]);

// ---------- audio: music bed + CC0 cues, two-pass loudnorm to -14 LUFS / -1.5 dBTP ----------
if (args['no-audio']) { fs.copyFileSync(silent, out); }
else {
  const CUES = await probe.evaluate(() => window.CUES);
  const A = join(COMP, 'assets', 'audio');
  const inputs = ['-ss', String(META.musicOffset), '-t', String(dur + .2), '-i', join(A, 'trouble-in-the-garden-15-57s.ogg')];
  const SFX_GAIN = 0.34;               // cues sit under the music
  const parts = [`[0:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=1.0,afade=t=in:d=0.08,afade=t=out:st=${(dur - 1.6).toFixed(2)}:d=1.6[m]`];
  CUES.forEach((c, i) => { inputs.push('-i', join(A, `${c.sfx}.ogg`));
    parts.push(`[${i + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume=${(c.gain * SFX_GAIN).toFixed(3)},adelay=${Math.round(c.t * 1000)}|${Math.round(c.t * 1000)}[s${i}]`); });
  const mixIn = '[m]' + CUES.map((_, i) => `[s${i}]`).join('');
  parts.push(`${mixIn}amix=inputs=${CUES.length + 1}:normalize=0:dropout_transition=0,atrim=0:${dur},asetpts=N/SR/TB[mix]`);
  const raw = join(tmp, 'mix.wav'), musicRaw = join(tmp, 'music.wav');
  run('ffmpeg', ['-v', 'error', '-y', ...inputs, '-filter_complex', parts.join(';'), '-map', '[mix]', raw]);
  run('ffmpeg', ['-v', 'error', '-y', ...inputs.slice(0, 6), '-filter_complex', parts[0] + `;[m]atrim=0:${dur}[mm]`, '-map', '[mm]', musicRaw]);
  const norm = (src, dst) => {
    const m = run('ffmpeg', ['-hide_banner', '-i', src, '-af', 'loudnorm=I=-14:TP=-2:LRA=11:print_format=json', '-f', 'null', '-']).stderr;
    const j = JSON.parse(m.slice(m.lastIndexOf('{'), m.lastIndexOf('}') + 1));
    run('ffmpeg', ['-v', 'error', '-y', '-i', src, '-af', `loudnorm=I=-14:TP=-2:LRA=11:measured_I=${j.input_i}:measured_TP=${j.input_tp}:measured_LRA=${j.input_lra}:measured_thresh=${j.input_thresh}:offset=${j.target_offset}:linear=true,alimiter=limit=0.7:level=false,aresample=48000`, '-c:a', 'aac', '-b:a', '256k', dst]);
  };
  const aac = join(tmp, 'mix.m4a'); norm(raw, aac);
  run('ffmpeg', ['-v', 'error', '-y', '-i', silent, '-i', aac, '-c:v', 'copy', '-c:a', 'copy', '-shortest', '-movflags', '+faststart', out]);
  if (args['music-only']) { const mo = join(tmp, 'music.m4a'); norm(musicRaw, mo); fs.copyFileSync(mo, args['music-only']); }
}
console.log(`wrote ${out} in ${((Date.now() - t0) / 1000).toFixed(0)}s`);
await browser.close(); srv.close();
