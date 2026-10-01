// court.js: shared cast and helpers for the v1.2 feature videos (MIT, part of eunuch-mode).
// Every page is one paused GSAP timeline; window.seek(t) is a pure function of t. Rendered by ../../render.mjs --page=features/<name>.html
// The cast are original drawings (a fictional composite court; no real person, culture or costume):
//   the adviser (bald, soft-faced, heavy-lidded, claret and teal robe) from the v1.1 film, and two rivals for v1.2:
//   the Grand Vizier (indigo top hat with a plume, waxed moustache, banner) and the Royal Treasurer (spectacles, skullcap, abacus).
(function () {
const q = new URLSearchParams(location.search);
const FMT = q.get('fmt') || '16x9', V = FMT === '9x16', NOGRAIN = q.has('nograin');
const W = V ? 1080 : 1920, H = V ? 1920 : 1080, VM = Math.min(W, H) / 100;
if (V) document.body.classList.add('v');

const LOOKS = {
  adv: { r0: '#8a2433', r1: '#4a0f1a', sl0: '#5a1420', sl1: '#7d1f2e', panel: '#1f4e4a', s0: '#f0c9a2', s1: '#dba77f', s2: '#c48c64', line: '#9b6a48', brow: '#5a3a24', lid: '#d9a47c', hat: 'none' },
  gv:  { r0: '#2d3478', r1: '#141737', sl0: '#1c2152', sl1: '#2f3780', panel: '#b08d2c', s0: '#e2b48c', s1: '#c48f66', s2: '#a87250', line: '#7d5236', brow: '#2a1a10', lid: '#bf8a62', hat: 'tall', beard: true },
  tr:  { r0: '#6e6a3a', r1: '#36341b', sl0: '#4d4a28', sl1: '#6b6738', panel: '#7d1f2e', s0: '#f6d3b8', s1: '#e6b294', s2: '#cf9878', line: '#a87458', brow: '#8a8478', lid: '#e3ad8e', hat: 'cap', specs: true },
};

function figure(p, L) {
  const g = n => `${p}-${n}`;
  const hat = L.hat === 'tall' ? `
      <g id="${g('hat')}">
        <path d="M-27 38 L-31 -34 Q0 -42 31 -34 L27 38 Q0 30 -27 38 Z" fill="${L.r0}"/>
        <path d="M-31 -34 Q0 -42 31 -34 L31 -28 Q0 -36 -31 -28 Z" fill="${L.r1}"/>
        <path d="M-28 22 Q0 15 28 22 L28 32 Q0 25 -28 32 Z" fill="url(#${g('gold')})"/>
        <rect x="-6" y="19" width="12" height="10" rx="1.5" fill="none" stroke="#3a2a14" stroke-width="2.5"/>
        <path d="M-50 40 Q0 28 50 40 Q0 52 -50 40 Z" fill="${L.r1}" stroke="#0d0f24" stroke-width="1"/>
        <path d="M22 -30 C46 -58 64 -46 70 -24 C56 -40 40 -38 26 -24 Z" fill="#e9dcc0" stroke="#b9a37a" stroke-width="1"/>
        <path d="M28 -27 C42 -42 56 -40 64 -28" stroke="#b9a37a" stroke-width="1" fill="none"/>
      </g>` : L.hat === 'cap' ? `
      <g id="${g('hat')}">
        <path d="M-31 46 C-30 16 30 16 31 46 Q0 36 -31 46 Z" fill="${L.r0}"/>
        <path d="M-31 46 Q0 36 31 46 L31 51 Q0 41 -31 51 Z" fill="url(#${g('gold')})"/>
        <circle cx="0" cy="22" r="4.5" fill="url(#${g('gold')})"/>
      </g>` : '';
  const specs = L.specs ? `
      <g id="${g('specs')}" stroke="#7a6232" stroke-width="2" fill="rgba(255,255,255,.18)">
        <circle cx="-13" cy="66" r="10"/><circle cx="13" cy="66" r="10"/><path d="M-3 64 Q0 61 3 64 M-23 64 L-33 60 M23 64 L33 60" fill="none"/>
      </g>` : '';
  const beard = L.beard ? `<path d="M-16 89 Q-8 86 -2 89 M2 89 Q8 86 16 89" stroke="#2a1a10" stroke-width="3" fill="none" stroke-linecap="round"/>` : '';
  const prop = p === 'tr' ? `
        <g id="${g('abacus')}">
          <rect x="-46" y="150" width="92" height="56" rx="4" fill="#5b3a1e" stroke="#2e1d0e" stroke-width="2"/>
          <rect x="-40" y="156" width="80" height="44" fill="#2a1a0e"/>
          ${[0, 1, 2, 3].map(r => `<path d="M-40 ${162 + r * 11} H40" stroke="#c9a257" stroke-width="1.4"/>` + [0, 1, 2, 3, 4].map(b => `<ellipse class="bead" cx="${-34 + b * 9 + (r % 2) * 22}" cy="${162 + r * 11}" rx="4.4" ry="3.6" fill="${b % 2 ? '#e2be74' : '#9E1B20'}"/>`).join('')).join('')}
          <ellipse cx="-47" cy="178" rx="7" ry="9" fill="url(#${g('skin')})" stroke="${L.line}"/><ellipse cx="47" cy="178" rx="7" ry="9" fill="url(#${g('skin')})" stroke="${L.line}"/>
        </g>` : p === 'gv' ? `
        <g id="${g('banner')}">
          <path d="M58 40 L62 214" stroke="#5b3a1e" stroke-width="5" stroke-linecap="round"/>
          <circle cx="58" cy="38" r="5" fill="url(#${g('gold')})"/>
          <path id="${g('flag')}" d="M60 48 C84 44 104 56 132 50 L126 72 L134 94 C106 100 86 88 62 92 Z" fill="#9E1B20" stroke="#e8c66e" stroke-width="1.5"/>
          <path d="M44 150 C52 140 62 138 66 146 L66 164 C58 168 48 164 44 156 Z" fill="url(#${g('skin')})" stroke="${L.line}"/>
        </g>` : '';
  return `
  <svg viewBox="-100 0 200 300">
    <defs>
      <linearGradient id="${g('robe')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${L.r0}"/><stop offset="1" stop-color="${L.r1}"/></linearGradient>
      <linearGradient id="${g('robe2')}" x1="0" x2="1"><stop offset="0" stop-color="${L.sl0}"/><stop offset=".5" stop-color="${L.sl1}"/><stop offset="1" stop-color="${L.sl0}"/></linearGradient>
      <radialGradient id="${g('skin')}" cx=".38" cy=".3" r=".8"><stop offset="0" stop-color="${L.s0}"/><stop offset=".7" stop-color="${L.s1}"/><stop offset="1" stop-color="${L.s2}"/></radialGradient>
      <linearGradient id="${g('gold')}" x1="0" x2="1"><stop offset="0" stop-color="#9c7431"/><stop offset=".5" stop-color="#ecc877"/><stop offset="1" stop-color="#9c7431"/></linearGradient>
    </defs>
    <rect id="${g('hit')}" x="-58" y="34" width="116" height="200" fill="none"/>
    <g id="${g('lower')}">
      <path d="M-42 150 C-66 170 -80 220 -88 300 L88 300 C80 220 66 170 42 150 Z" fill="url(#${g('robe')})"/>
      <path d="M-16 150 L-30 300 L30 300 L16 150 Z" fill="${L.panel}"/>
      <path d="M-16 150 L-30 300 M16 150 L30 300" stroke="url(#${g('gold')})" stroke-width="5"/>
      <path d="M-86 294 L86 294" stroke="url(#${g('gold')})" stroke-width="7"/>
    </g>
    <g id="${g('upper')}">
      <path d="M-40 112 C-62 122 -70 160 -64 206 L64 206 C70 160 62 122 40 112 Z" fill="url(#${g('robe')})"/>
      <path d="M-15 116 L-18 206 L18 206 L15 116 Z" fill="${L.panel}"/>
      <path d="M-15 116 L-18 206 M15 116 L18 206" stroke="url(#${g('gold')})" stroke-width="4"/>
      <rect x="-50" y="198" width="100" height="12" rx="4" fill="url(#${g('gold')})"/>
      <path d="M-36 108 Q0 156 36 108 L30 103 Q0 144 -30 103 Z" fill="url(#${g('gold')})"/>
      <path d="M-28 104 Q0 136 28 104 L22 100 Q0 126 -22 100 Z" fill="${L.panel}"/>
      ${p === 'adv' ? `<circle id="adv-med" cx="0" cy="140" r="8.5" fill="url(#${g('gold')})" stroke="#6e5022" stroke-width="1.2"/><circle cx="0" cy="140" r="5.5" fill="#3a2a14"/>
      <g id="adv-sealhome"><circle cx="0" cy="140" r="6.4" fill="url(#wax)"/><path d="M-3.2 141.6 L-3.6 138 L-1.7 139.8 L0 137.4 L1.7 139.8 L3.6 138 L3.2 141.6 Z M-3.2 142.2 h6.4 v.9 h-6.4 Z" fill="#6e0f13"/></g>` : ''}
      <g id="${g('h-steeple')}">
        <path d="M-44 122 C-70 132 -74 176 -58 204 L-30 196 C-38 176 -36 150 -32 134 Z" fill="url(#${g('robe2')})"/>
        <path d="M44 122 C70 132 74 176 58 204 L30 196 C38 176 36 150 32 134 Z" fill="url(#${g('robe2')})"/>
        <path d="M-58 204 L-30 196 M58 204 L30 196" stroke="url(#${g('gold')})" stroke-width="5"/>
        <path d="M-30 196 C-24 184 -10 170 -1 160 L1 163 C-4 176 -14 192 -22 202 Z" fill="url(#${g('skin')})" stroke="${L.line}" stroke-width="1"/>
        <path d="M30 196 C24 184 10 170 1 160 L-1 163 C4 176 14 192 22 202 Z" fill="url(#${g('skin')})" stroke="${L.line}" stroke-width="1"/>
      </g>
      <g id="${g('h-whisper')}" opacity="0">
        <path d="M44 122 C70 132 74 176 58 204 L30 196 C38 176 36 150 32 134 Z" fill="url(#${g('robe2')})"/>
        <path d="M58 204 L30 196" stroke="url(#${g('gold')})" stroke-width="5"/>
        <path d="M30 196 C22 188 8 186 -2 190 L0 196 C10 196 20 200 26 204 Z" fill="url(#${g('skin')})" stroke="${L.line}" stroke-width="1"/>
        <path d="M-44 120 C-66 118 -70 96 -58 84 L-44 90 C-50 100 -44 108 -32 112 Z" fill="url(#${g('robe2')})"/>
        <path d="M-58 84 L-44 90" stroke="url(#${g('gold')})" stroke-width="5"/>
        <ellipse cx="-50" cy="76" rx="7" ry="12" transform="rotate(-18 -50 76)" fill="url(#${g('skin')})" stroke="${L.line}" stroke-width="1"/>
      </g>
      <g id="${g('h-stop')}" opacity="0">
        <path d="M44 122 C70 132 74 176 58 204 L30 196 C38 176 36 150 32 134 Z" fill="url(#${g('robe2')})"/>
        <path d="M58 204 L30 196" stroke="url(#${g('gold')})" stroke-width="5"/>
        <path d="M30 196 C22 188 8 186 -2 190 L0 196 C10 196 20 200 26 204 Z" fill="url(#${g('skin')})" stroke="${L.line}" stroke-width="1"/>
        <path d="M-38 120 C-58 118 -80 112 -94 104 L-90 92 C-76 98 -56 104 -34 108 Z" fill="url(#${g('robe2')})"/>
        <path d="M-94 104 L-90 92" stroke="url(#${g('gold')})" stroke-width="6"/>
        <path d="M-112 104 L-113 80 Q-113 75 -109 75 Q-105 75 -105 80 L-105 86 L-104 71 Q-104 66 -100 66 Q-96 66 -96 71 L-96 86 L-95 73 Q-95 68 -91 68 Q-87 68 -87 73 L-87 88 L-86 79 Q-86 75 -82.5 75 Q-79 75 -79 79 L-79 96 Q-80 108 -94 110 Q-108 110 -112 104 Z" fill="url(#${g('skin')})" stroke="${L.line}" stroke-width="1.2"/>
      </g>
      <g id="${g('h-stop2')}" opacity="0"><!-- both palms out: "silence, both of you" -->
        <path d="M-38 120 C-58 118 -80 112 -94 104 L-90 92 C-76 98 -56 104 -34 108 Z" fill="url(#${g('robe2')})"/>
        <path d="M-94 104 L-90 92" stroke="url(#${g('gold')})" stroke-width="6"/>
        <path d="M-112 104 L-113 80 Q-113 75 -109 75 Q-105 75 -105 80 L-105 86 L-104 71 Q-104 66 -100 66 Q-96 66 -96 71 L-96 86 L-95 73 Q-95 68 -91 68 Q-87 68 -87 73 L-87 88 L-86 79 Q-86 75 -82.5 75 Q-79 75 -79 79 L-79 96 Q-80 108 -94 110 Q-108 110 -112 104 Z" fill="url(#${g('skin')})" stroke="${L.line}" stroke-width="1.2"/>
        <g transform="scale(-1 1)">
          <path d="M-38 120 C-58 118 -80 112 -94 104 L-90 92 C-76 98 -56 104 -34 108 Z" fill="url(#${g('robe2')})"/>
          <path d="M-94 104 L-90 92" stroke="url(#${g('gold')})" stroke-width="6"/>
          <path d="M-112 104 L-113 80 Q-113 75 -109 75 Q-105 75 -105 80 L-105 86 L-104 71 Q-104 66 -100 66 Q-96 66 -96 71 L-96 86 L-95 73 Q-95 68 -91 68 Q-87 68 -87 73 L-87 88 L-86 79 Q-86 75 -82.5 75 Q-79 75 -79 79 L-79 96 Q-80 108 -94 110 Q-108 110 -112 104 Z" fill="url(#${g('skin')})" stroke="${L.line}" stroke-width="1.2"/>
        </g>
      </g>
      <g id="${g('h-fold')}" opacity="0">
        <path d="M-46 122 C-70 134 -70 168 -54 184 L40 176 L38 160 L-30 164 C-36 150 -36 138 -32 132 Z" fill="url(#${g('robe2')})"/>
        <path d="M46 122 C70 134 70 168 54 184 L-40 176 L-38 160 L30 164 C36 150 36 138 32 132 Z" fill="url(#${g('robe2')})"/>
        <path d="M-54 184 L40 176 M54 184 L-40 176" stroke="url(#${g('gold')})" stroke-width="4"/>
        <ellipse cx="44" cy="170" rx="7" ry="5" fill="url(#${g('skin')})"/><ellipse cx="-44" cy="170" rx="7" ry="5" fill="url(#${g('skin')})"/>
      </g>
      <g id="${g('h-up')}" opacity="0"><!-- both hands thrown up in alarm -->
        <path d="M-40 120 C-64 112 -78 84 -76 60 L-62 58 C-62 80 -52 98 -32 110 Z" fill="url(#${g('robe2')})"/>
        <path d="M40 120 C64 112 78 84 76 60 L62 58 C62 80 52 98 32 110 Z" fill="url(#${g('robe2')})"/>
        <path d="M-76 60 L-62 58 M76 60 L62 58" stroke="url(#${g('gold')})" stroke-width="5"/>
        <ellipse cx="-70" cy="48" rx="8" ry="12" transform="rotate(-12 -70 48)" fill="url(#${g('skin')})" stroke="${L.line}"/>
        <ellipse cx="70" cy="48" rx="8" ry="12" transform="rotate(12 70 48)" fill="url(#${g('skin')})" stroke="${L.line}"/>
      </g>
      ${prop}
      <g id="${g('head')}">
        <rect x="-13" y="94" width="26" height="18" rx="6" fill="${L.s2}"/>
        <ellipse cx="-35" cy="72" rx="6.5" ry="10" fill="url(#${g('skin')})"/><ellipse cx="35" cy="72" rx="6.5" ry="10" fill="url(#${g('skin')})"/>
        <ellipse cx="0" cy="66" rx="35" ry="37" fill="url(#${g('skin')})"/>
        <ellipse cx="0" cy="84" rx="30" ry="22" fill="url(#${g('skin')})"/>
        <ellipse cx="-12" cy="42" rx="11" ry="5.5" fill="#fff" opacity=".28"/>
        <circle cx="-20" cy="84" r="6" fill="#e38d7c" opacity=".3"/><circle cx="20" cy="84" r="6" fill="#e38d7c" opacity=".3"/>
        <path d="M-2 72 Q4 82 -2 85" stroke="${L.line}" stroke-width="1.8" fill="none"/>
        <path id="${g('brow-l')}" d="M-22 56 Q-13 52 -5 55" stroke="${L.brow}" stroke-width="${L.specs ? 4 : 2.4}" fill="none" stroke-linecap="round"/>
        <path id="${g('brow-r')}" d="M5 55 Q13 52 22 56" stroke="${L.brow}" stroke-width="${L.specs ? 4 : 2.4}" fill="none" stroke-linecap="round"/>
        <g id="${g('eyes-open')}">
          <ellipse cx="-13" cy="66" rx="7.5" ry="4.6" fill="#fbf4ea"/><ellipse cx="13" cy="66" rx="7.5" ry="4.6" fill="#fbf4ea"/>
          <g id="${g('pupils')}"><circle cx="-13" cy="67" r="3" fill="#2a1a12"/><circle cx="13" cy="67" r="3" fill="#2a1a12"/></g>
          <g id="${g('lids')}">
            <path d="M-21.5 66.5 Q-13 57 -4.5 66.5 Q-13 63.5 -21.5 66.5 Z" fill="${L.lid}"/>
            <path d="M4.5 66.5 Q13 57 21.5 66.5 Q13 63.5 4.5 66.5 Z" fill="${L.lid}"/>
            <path d="M-21.5 66.5 Q-13 63.5 -4.5 66.5 M4.5 66.5 Q13 63.5 21.5 66.5" stroke="#3a2518" stroke-width="1.8" fill="none"/>
          </g>
        </g>
        <g id="${g('eyes-wide')}" opacity="0">
          <ellipse cx="-13" cy="65" rx="8.5" ry="7.5" fill="#fbf4ea" stroke="#3a2518" stroke-width="1.4"/><ellipse cx="13" cy="65" rx="8.5" ry="7.5" fill="#fbf4ea" stroke="#3a2518" stroke-width="1.4"/>
          <circle cx="-13" cy="65" r="2.4" fill="#2a1a12"/><circle cx="13" cy="65" r="2.4" fill="#2a1a12"/>
        </g>
        <g id="${g('eyes-closed')}" opacity="0">
          <path d="M-21 65 Q-13 70 -5 65 M5 65 Q13 70 21 65" stroke="#3a2518" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        </g>
        <g id="${g('eyes-wink')}" opacity="0">
          <ellipse cx="13" cy="66" rx="7.5" ry="4.6" fill="#fbf4ea"/><circle cx="12" cy="67" r="3" fill="#2a1a12"/>
          <path d="M4.5 66.5 Q13 57 21.5 66.5 Q13 63.5 4.5 66.5 Z" fill="${L.lid}"/>
          <path d="M4.5 66.5 Q13 63.5 21.5 66.5" stroke="#3a2518" stroke-width="1.8" fill="none"/>
          <path d="M-21 66 Q-13 70 -5 66" stroke="#3a2518" stroke-width="2.2" fill="none" stroke-linecap="round"/>
        </g>
        ${specs}
        <path id="${g('m-smirk')}" d="M-10 92 Q1 97 12 88" stroke="#6e3b2a" stroke-width="2.4" fill="none" stroke-linecap="round"/>
        <path id="${g('m-smile')}" d="M-11 90 Q0 99 11 90" stroke="#6e3b2a" stroke-width="2.4" fill="none" stroke-linecap="round" opacity="0"/>
        <ellipse id="${g('m-o')}" cx="-3" cy="92" rx="3.2" ry="3.8" fill="#6e3b2a" opacity="0"/>
        <path id="${g('m-flat')}" d="M-10 94 Q0 90.5 10 93.5" stroke="#6e3b2a" stroke-width="2.6" fill="none" stroke-linecap="round" opacity="0"/>
        <path id="${g('m-open')}" d="M-10 89 Q0 87 10 89 Q8 101 0 101 Q-8 101 -10 89 Z" fill="#5a2a1e" opacity="0"/>
        <path id="${g('m-shout')}" d="M-9 86 Q0 83 9 86 Q11 104 0 105 Q-11 104 -9 86 Z" fill="#4a1f16" stroke="#6e3b2a" stroke-width="1" opacity="0"/>
        ${beard}
        ${hat}
      </g>
    </g>
  </svg>`;
}

const SEAL_SVG = `<svg viewBox="-50 -50 100 100"><defs>
  <radialGradient id="wax" cx="-.25" cy="-.3" r="1.1"><stop offset="0" stop-color="#e0504a"/><stop offset=".45" stop-color="#a51f22"/><stop offset="1" stop-color="#5c0c10"/></radialGradient>
  <radialGradient id="wax2" cx=".3" cy=".35" r=".9"><stop offset="0" stop-color="#7a1216"/><stop offset="1" stop-color="#b3282b"/></radialGradient></defs>
  <path d="M0-47C13-48 20-40 30-37S47-24 46-10 49 12 43 24 34 44 20 46 3 50-10 47-31 44-39 33-49 17-47 3-49-16-40-27-26-45 0-47Z" fill="url(#wax)"/>
  <circle r="31" fill="url(#wax2)"/><circle r="31" fill="none" stroke="#e46a5e" stroke-opacity=".35" stroke-width="1.5"/>
  <circle r="25" fill="none" stroke="#5c0c10" stroke-opacity=".55" stroke-width="1.2"/>
  <path d="M-15 8 L-17-9 L-8-1 L0-13 L8-1 L17-9 L15 8 Z" fill="#6e0f13" stroke="#e46a5e" stroke-opacity=".5" stroke-width="1"/>
  <rect x="-15" y="10" width="30" height="4" rx="1" fill="#6e0f13" stroke="#e46a5e" stroke-opacity=".5" stroke-width="1"/></svg>`;

function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
const $ = s => document.querySelector(s), $$ = s => [...document.querySelectorAll(s)];
const readTime = words => Math.max(1.2, words / 3.3 + 0.6);
const words = el => el.textContent.trim().split(/\s+/).length;

// Build the common stage: desk, glow, motes, light, grain, the seal, and figure containers.
function stage(cast) {
  const st = $('#stage');
  for (const id of cast) { const d = document.createElement('div'); d.id = id; d.className = 'fig'; d.innerHTML = figure(id, LOOKS[id]); st.appendChild(d); }
  const s = document.createElement('div'); s.id = 'seal'; s.innerHTML = SEAL_SVG; st.appendChild(s);
  for (const id of ['light', 'grain']) { const d = document.createElement('div'); d.id = id; st.appendChild(d); }
  if (NOGRAIN) $('#grain').style.display = 'none';
  const R = rng(42), motes = [];
  for (let i = 0; i < 24; i++) { const m = document.createElement('div'); m.className = 'mote'; $('#desk').appendChild(m);
    motes.push({ el: m, x: R() * 112 - 6, y: R() * 112 - 6, vx: (R() - .5) * 1.2, vy: -(R() * .9 + .3), ph: R() * 6.28, s: .6 + R() * 1.4 }); }
  return function ambient(t) {
    const gx = 38 + 7 * Math.sin(.31 * t) + 2.5 * Math.sin(1.7 * t + 1), gy = 34 + 5 * Math.sin(.23 * t + 2) + 1.5 * Math.sin(2.1 * t);
    const g = $('#glow'); g.style.transform = `translate(${gx / 100 * W}px, ${gy / 100 * H}px)`;
    g.style.opacity = (.82 + .1 * Math.sin(5.3 * t) * Math.sin(1.9 * t + .7) + .05 * Math.sin(11.7 * t + 2)).toFixed(3);
    $('#desk').style.transform = `translate(${(Math.sin(.21 * t) * 1.2).toFixed(2)}%, ${(Math.sin(.17 * t + 1) * .9).toFixed(2)}%) scale(${(1.02 + .015 * Math.sin(.13 * t)).toFixed(4)})`;
    for (const m of motes) { const x = ((m.x + m.vx * t + 2 * Math.sin(.6 * t + m.ph)) % 112 + 112) % 112 - 6, y = ((m.y + m.vy * t * 2.2) % 112 + 112) % 112 - 6;
      m.el.style.transform = `translate(${x / 100 * W}px, ${y / 100 * H}px) scale(${m.s})`; m.el.style.opacity = (.35 + .35 * Math.sin(1.3 * t + m.ph)).toFixed(3); }
    const lx = 30 + 12 * Math.sin(.27 * t), ly = 26 + 8 * Math.sin(.19 * t + 1.3), la = .30 + .06 * Math.sin(4.1 * t) * Math.sin(1.3 * t);
    $('#light').style.background = `radial-gradient(90vmax 70vmax at ${lx}% ${ly}%, rgba(255,214,150,${la.toFixed(3)}), rgba(40,20,5,.22) 70%)`;
    if (!NOGRAIN) { const f = Math.floor(t * 24), r2 = rng(f * 7919 + 13); $('#grain').style.transform = `translate(${(r2() * 240) | 0}px, ${(r2() * 240) | 0}px)`; }
  };
}

// Timeline helpers bound to one GSAP timeline.
function director(tl) {
  const reads = [], cues = [], scenes = [];
  const EYES = ['open', 'closed', 'wink', 'wide'], MOUTH = ['smirk', 'smile', 'o', 'flat', 'open', 'shout'], HANDS = ['steeple', 'whisper', 'fold', 'stop', 'stop2', 'up'];
  const D = {
    reads, cues, scenes,
    read: (sel, tin, tout) => { reads.push({ sel, in: +tin.toFixed(3), out: +tout.toFixed(3), need: +readTime(words($(sel))).toFixed(3) }); return reads[reads.length - 1]; },
    show: (sel, a, b) => { tl.set(sel, { visibility: 'visible' }, a); tl.set(sel, { visibility: 'hidden' }, b); scenes.push({ sel, a: +a.toFixed(3), b: +b.toFixed(3) }); },
    cue: (t, sfx, gain = 1) => cues.push({ t: +t.toFixed(3), sfx, gain }),
    init(p) {
      const has = id => document.getElementById(id);
      EYES.forEach(e => has(`${p}-eyes-${e}`) && tl.set(`#${p}-eyes-${e}`, { opacity: e === 'open' ? 1 : 0 }, 0));
      MOUTH.forEach(m => tl.set(`#${p}-m-${m}`, { opacity: m === 'smirk' ? 1 : 0 }, 0));
      HANDS.forEach(h => tl.set(`#${p}-h-${h}`, { opacity: h === 'steeple' ? 1 : 0 }, 0));
      tl.set(`#${p}-pupils`, { x: 0, y: 0 }, 0); tl.set(`#${p}-brow-r`, { y: 0, rotation: 0, svgOrigin: '13 55' }, 0); tl.set(`#${p}-brow-l`, { y: 0, rotation: 0, svgOrigin: '-13 55' }, 0);
      tl.set(`#${p}-upper`, { y: 0, scaleY: 1, svgOrigin: '0 210' }, 0); tl.set(`#${p}-head`, { rotation: 0, y: 0, svgOrigin: '0 104' }, 0);
      tl.set('#' + p, { xPercent: -50, yPercent: -100, transformOrigin: '50% 100%' }, 0);
    },
    face(p, t, f) {
      if (f.eyes) EYES.forEach(e => tl.set(`#${p}-eyes-${e}`, { opacity: e === f.eyes ? 1 : 0 }, t));
      if (f.mouth) MOUTH.forEach(m => tl.set(`#${p}-m-${m}`, { opacity: m === f.mouth ? 1 : 0 }, t));
      if (f.hands) HANDS.forEach(h => tl.set(`#${p}-h-${h}`, { opacity: h === f.hands ? 1 : 0 }, t));
      if (f.look !== undefined) tl.to(`#${p}-pupils`, { x: f.look, y: f.lookY || 0, duration: .12, ease: 'power2.out' }, t);
      if (f.brow !== undefined) tl.to(`#${p}-brow-r`, { y: f.brow, duration: .15, ease: 'power2.out' }, t);
      if (f.browL !== undefined) tl.to(`#${p}-brow-l`, { y: f.browL, rotation: f.browL * 2, svgOrigin: '-13 55', duration: .15, ease: 'power2.out' }, t);
      if (f.browsUp !== undefined) { tl.to(`#${p}-brow-l`, { y: -f.browsUp, rotation: 0, duration: .12 }, t); tl.to(`#${p}-brow-r`, { y: -f.browsUp, rotation: 0, duration: .12 }, t); }
      if (f.scowl !== undefined) { tl.to(`#${p}-brow-l`, { y: f.scowl, rotation: f.scowl * 3, svgOrigin: '-13 55', duration: .12 }, t); tl.to(`#${p}-brow-r`, { y: f.scowl, rotation: -f.scowl * 3, svgOrigin: '13 55', duration: .12 }, t); }
    },
    // mouth flaps between open and a resting mouth while a line is "spoken"
    talk(p, a, b, rest = 'smirk', rate = .13) { let k = 0; for (let t = a; t < b - .05; t += rate, k++) D.face(p, t, { mouth: k % 2 ? rest : 'open' }); D.face(p, b, { mouth: rest }); },
    pose: (p, t, dur, to, ease = 'power3.out') => tl.to('#' + p, { x: to.x, y: to.y, scale: to.s, rotation: to.r || 0, duration: dur, ease }, t),
    place: (p, t, at) => { tl.set('#' + p, { visibility: 'visible', x: at.x, y: at.y, scale: at.s, rotation: at.r || 0 }, t); },
    hide: (p, t) => tl.set('#' + p, { visibility: 'hidden' }, t),
    bow(p, t, depth = 1, hold = .35) {
      tl.to(`#${p}-upper`, { keyframes: [{ y: 4 * depth, duration: .18, ease: 'sine.out' }, { y: 26 * depth, scaleY: .9, duration: .22, ease: 'power3.in' }, { y: 26 * depth, scaleY: .9, duration: hold }, { y: 0, scaleY: 1, duration: .6, ease: 'power2.out' }], svgOrigin: '0 210' }, t);
      tl.to(`#${p}-head`, { keyframes: [{ rotation: 0, duration: .18 }, { rotation: 10 * depth, duration: .22, ease: 'power3.in' }, { rotation: 10 * depth, duration: hold }, { rotation: 0, duration: .6, ease: 'power2.out' }], svgOrigin: '0 104' }, t);
    },
    nod(p, t, n = 2, amp = 6) { const k = []; for (let i = 0; i < n; i++) k.push({ rotation: amp, duration: .12, ease: 'sine.inOut' }, { rotation: 0, duration: .14, ease: 'sine.inOut' }); tl.to(`#${p}-head`, { keyframes: k, svgOrigin: '0 104' }, t); },
    shake(p, t, n = 2, amp = 7) { const k = []; for (let i = 0; i < n; i++) k.push({ rotation: -amp, duration: .14, ease: 'sine.inOut' }, { rotation: amp, duration: .16, ease: 'sine.inOut' }); k.push({ rotation: 0, duration: .16 }); tl.to(`#${p}-head`, { keyframes: k, svgOrigin: '0 104' }, t); },
    hop(p, t, h = 18) { tl.to('#' + p, { keyframes: [{ y: '-=' + h, duration: .12, ease: 'power2.out' }, { y: '+=' + h, duration: .16, ease: 'power2.in' }] }, t); },
  };
  return D;
}

window.COURT = { FMT, V, W, H, VM, $, $$, rng, readTime, words, stage, director, figure, LOOKS,
  P: .512, BEAT0: .5,
  halfBeat: (t, b0 = .5) => b0 + Math.ceil((t - b0) / (.512 / 2) - 1e-6) * (.512 / 2),
  beat: (t, b0 = .5) => b0 + Math.ceil((t - b0) / .512 - 1e-6) * .512 };
})();
