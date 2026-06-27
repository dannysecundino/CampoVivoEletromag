(function () {

    'use strict';



    /* ══ Canvas ══ */

    const cv  = document.getElementById('ltz-canvas');

    if (!cv) return;

    const ctx = cv.getContext('2d');

    const W = cv.width, H = cv.height;

    const CY = H / 2;



    /* ══ Estado ══

    * Q  : +1 ou -1

    * DIR: +1 = entra pela esquerda (v→), -1 = entra pela direita (v←)

    * B  : +1 = saindo ⊙, -1 = entrando ⊗

    *

    * Derivação da deflexão (canvas y↓, ẑ = para fora):

    *   v = DIR · v₀ · x̂

    *   B = B · ẑ

    *   v×B = DIR·v₀·B · (x̂×ẑ) = DIR·v₀·B · (−ŷ)

    *   F = Q·(v×B) = −Q·DIR·B · (v₀·ŷ_math)

    *   No canvas (ŷ_canvas = −ŷ_math):

    *   Fy_canvas = +Q·DIR·B   (positivo = para baixo no canvas)

    *

    * Logo: deflexão para baixo se Q·DIR·B > 0, para cima se < 0.

    */

    let Q   =  1;

    let DIR =  1;   /* +1 → , -1 ← */

    let B   =  1;   /* +1 ⊙, -1 ⊗  */



    /* ══ Animação da partícula ══ */

    const SPEED   = 160;   /* px/s — velocidade horizontal */

    const DEFLECT = 55;    /* px — deflexão vertical máxima ao sair da tela */



    let px = 0;            /* posição x atual (reseta no loop) */

    let last = 0;



    function resetParticle() {

    px = DIR > 0 ? -20 : W + 20;

    }

    resetParticle();



    /* ══ Desenho de seta ══ */

    function arrow(x1, y1, x2, y2, col) {

    const dx = x2-x1, dy = y2-y1;

    const len = Math.hypot(dx, dy);

    if (len < 4) return;

    const ux = dx/len, uy = dy/len;

    const sz = 9;

    ctx.save();

    ctx.strokeStyle = col; ctx.fillStyle = col;

    ctx.lineWidth = 2.5; ctx.lineCap = 'round';

    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(x2, y2);

    ctx.lineTo(x2 - Math.cos(Math.atan2(dy,dx)-.38)*sz,

                y2 - Math.sin(Math.atan2(dy,dx)-.38)*sz);

    ctx.lineTo(x2 - Math.cos(Math.atan2(dy,dx)+.38)*sz,

                y2 - Math.sin(Math.atan2(dy,dx)+.38)*sz);

    ctx.closePath(); ctx.fill();

    ctx.restore();

    }



    /* ══ Render ══ */

    function render() {

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#07090f';

    ctx.fillRect(0, 0, W, H);



    /* grade sutil */

    ctx.save();

    ctx.strokeStyle = '#1c2d45'; ctx.lineWidth = 0.4; ctx.globalAlpha = 0.28;

    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }

    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    ctx.restore();



    /* símbolos B */

    const bSym = B > 0 ? '·' : '×';

    ctx.save();

    ctx.fillStyle = '#a78bfa'; ctx.globalAlpha = 0.2;

    ctx.font = B > 0 ? 'bold 20px serif' : '15px serif';

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    for (let x = 25; x < W; x += 50)

        for (let y = 20; y < H; y += 44)

        ctx.fillText(bSym, x, y);

    ctx.restore();



    /* rótulo B no canto */

    ctx.save();

    ctx.fillStyle = '#a78bfa'; ctx.globalAlpha = 0.8;

    ctx.font = '10px Space Mono, monospace';

    ctx.textAlign = 'right'; ctx.textBaseline = 'top';

    ctx.fillText('B ' + (B > 0 ? '⊙ saindo' : '⊗ entrando'), W - 10, 8);

    ctx.restore();



    /* trajetória sem deflexão (tracejada) */

    ctx.save();

    ctx.strokeStyle = '#2a3f5f'; ctx.lineWidth = 1; ctx.setLineDash([6,5]);

    ctx.beginPath(); ctx.moveTo(0, CY); ctx.lineTo(W, CY); ctx.stroke();

    ctx.setLineDash([]);

    ctx.restore();



    /* ── posição y da partícula: deflexão proporcional ao progresso x ──

    * t = progresso 0→1 de uma ponta a outra da tela

    * deflexão: fy_canvas_sign = Q*DIR*B  (+ = baixo, − = cima)

    * usamos variação suave: dy = sign * DEFLECT * t²  (aceleração constante) */

    const fSign = Q * DIR * B;   /* +1 → baixo, -1 → cima */

    const t = DIR > 0

        ? Math.max(0, Math.min(1, px / W))

        : Math.max(0, Math.min(1, (W - px) / W));

    const py = CY + fSign * DEFLECT * t * t;



    /* velocidade instantânea — tangente à parábola */

    const vx_dir = DIR;

    /* vy ∝ 2*fSign*DEFLECT*t / W  (derivada de t² * DEFLECT, escalada) */

    const vy_raw = fSign * 2 * DEFLECT * t;

    const vmag = Math.hypot(SPEED, vy_raw);

    const vux = (vx_dir * SPEED) / vmag;

    const vuy = vy_raw / vmag;



    /* força — perpendicular à velocidade, na direção da deflexão real.

    * CORREÇÃO: a fórmula antiga rotacionava o vetor v por 90°, mas o sinal

    * de vux (que já carrega DIR) interferia no resultado, invertendo F

    * quando DIR = -1. A força deve simplesmente apontar para onde a

    * partícula está sendo desviada (fSign), com pequena componente

    * horizontal apenas para ficar perpendicular a v de fato. */

    let fux, fuy;

    if (fSign !== 0) {

        /* componente vertical pura na direção da deflexão real */

        const fy0 = fSign > 0 ? 1 : -1;

        /* projeta perpendicular a v: remove a componente de fy0 ao longo de v

        e normaliza — garante F ⊥ v mantendo o sentido vertical correto */

        const dot = fy0 * vuy;              /* vuy é a única componente não-nula de (0,fy0)·v */

        let rawx = 0 - dot * vux;

        let rawy = fy0 - dot * vuy;

        const rawmag = Math.hypot(rawx, rawy) || 1;

        fux = rawx / rawmag;

        fuy = rawy / rawmag;

    } else {

        fux = 0; fuy = 0;

    }



    const qCol = Q > 0 ? '#f43f5e' : '#38bdf8';

    const VL = 44, FL = 36;



    /* setas de v e F */

    arrow(px, py, px + vux*VL, py + vuy*VL, '#10b981');

    if (fSign !== 0)

        arrow(px, py, px + fux*FL, py + fuy*FL, '#f59e0b');



    /* glow da partícula */

    const grd = ctx.createRadialGradient(px, py, 3, px, py, 28);

    grd.addColorStop(0, qCol + '55');

    grd.addColorStop(1, qCol + '00');

    ctx.beginPath(); ctx.arc(px, py, 28, 0, Math.PI*2);

    ctx.fillStyle = grd; ctx.fill();



    /* disco */

    ctx.beginPath(); ctx.arc(px, py, 13, 0, Math.PI*2);

    ctx.fillStyle = qCol; ctx.shadowColor = qCol; ctx.shadowBlur = 18;

    ctx.fill(); ctx.shadowBlur = 0;



    /* sinal */

    ctx.fillStyle = '#07090f';

    ctx.font = 'bold 13px Space Mono, monospace';

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.fillText(Q > 0 ? '+' : '−', px, py);

    }



    /* ══ Loop ══ */

    let _running = false;

    let _rafId = null;

    let _started = false;

    function loop(ts) {

    if (!_running) return;

    const dt = Math.min((ts - last) / 1000, 0.05);

    last = ts;

    px += DIR * SPEED * dt;

    /* reseta quando sai completamente da tela */

    if (DIR > 0 && px > W + 20)  resetParticle();

    if (DIR < 0 && px < -20)     resetParticle();

    render();

    _rafId = requestAnimationFrame(loop);

    }

    function start() {

    if (_started) return;

    _running = true;

    _started = true;

    loop(0);

    }

    function stop() {

    _running = false;

    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }

    }



    /* ══ Atualizar UI ══ */

    function updateUI() {

    const fSign = Q * DIR * B;



    /* direção de F */

    const fdEl = document.getElementById('ltz-fdir');

    if (fSign > 0)       { fdEl.textContent = '↓ Para baixo'; fdEl.style.color = '#f59e0b'; }

    else if (fSign < 0)  { fdEl.textContent = '↑ Para cima';  fdEl.style.color = '#f59e0b'; }

    else                 { fdEl.textContent = '— Nulo';        fdEl.style.color = '#4b6080'; }



    /* deflexão */

    const deflEl = document.getElementById('ltz-defl');

    if (fSign > 0)       { deflEl.textContent = '↓ Desviada para baixo'; deflEl.style.color = '#f43f5e'; }

    else if (fSign < 0)  { deflEl.textContent = '↑ Desviada para cima';  deflEl.style.color = '#38bdf8'; }

    else                 { deflEl.textContent = '→ Sem deflexão';         deflEl.style.color = '#4b6080'; }



    /* labels dos botões ativos */

    document.getElementById('ltz-lq').textContent   = Q   > 0 ? '+ positiva' : '− negativa';

    document.getElementById('ltz-ldir').textContent = DIR > 0 ? '→ Direita'  : '← Esquerda';

    document.getElementById('ltz-lb').textContent   = B   > 0 ? '⊙ Saindo'   : '⊗ Entrando';



    /* ícone mão */

    document.getElementById('ltz-hicon').textContent = Q > 0 ? '🤚' : '🖐️';



    /* resultado regra da mão */

    const hres = document.getElementById('ltz-hres');

    const bTxt = B   > 0 ? 'saindo ⊙' : 'entrando ⊗';

    const vTxt = DIR > 0 ? '→ direita' : '← esquerda';

    const fTxt = fSign > 0 ? '↓ para baixo' : fSign < 0 ? '↑ para cima' : '— nula';

    const col  = Q > 0 ? '#f43f5e' : '#38bdf8';

    const txt  = Q > 0

        ? `✋ q+ : B ${bTxt}, v ${vTxt} → palma empurra ${fTxt}.`

        : `🖐️ q− : mesma mão dá ${fTxt === '↓ para baixo' ? '↑ para cima' : fTxt === '↑ para cima' ? '↓ para baixo' : '— nula'} (direção invertida).`;

    hres.textContent = txt;

    hres.style.background   = fSign !== 0 ? (Q > 0 ? 'rgba(244,63,94,.1)' : 'rgba(56,189,248,.1)') : 'transparent';

    hres.style.borderColor  = fSign !== 0 ? col : 'var(--border)';

    hres.style.color        = fSign !== 0 ? col : 'var(--muted)';



    /* insight */

    const ins = document.getElementById('ltz-insight');

    if (fSign === 0) {

        ins.textContent = 'Sem deflexão — verifique os valores de q, v e B.';

    } else {

        ins.textContent =

        `q${Q>0?'+':'−'}, v${DIR>0?'→':'←'}, B${B>0?' ⊙':' ⊗'} → F ${fTxt}. `+

        `Inverta qualquer um dos três e a deflexão muda de sentido.`;

    }

    }



    /* ══ Setters públicos ══ */

    window.ltzSetQ = function(s) {

    Q = s;

    document.getElementById('ltz-bpos').className = 'ltz-sbtn' + (s > 0 ? ' ltz-active-pos' : '');

    document.getElementById('ltz-bneg').className = 'ltz-sbtn' + (s < 0 ? ' ltz-active-neg' : '');

    resetParticle();

    updateUI();

    };

    window.ltzSetDir = function(s) {

    DIR = s;

    document.getElementById('ltz-bdir-r').className = 'ltz-sbtn' + (s > 0 ? ' ltz-active-v' : '');

    document.getElementById('ltz-bdir-l').className = 'ltz-sbtn' + (s < 0 ? ' ltz-active-v' : '');

    resetParticle();

    updateUI();

    };

    window.ltzSetB = function(s) {

    B = s;

    document.getElementById('ltz-bout').className = 'ltz-sbtn' + (s > 0 ? ' ltz-active-b' : '');

    document.getElementById('ltz-bin').className  = 'ltz-sbtn' + (s < 0 ? ' ltz-active-b' : '');

    updateUI();

    };



    /* ══ Init ══ */

    updateUI();

    window.__forcaMagController = { start, stop };



})();