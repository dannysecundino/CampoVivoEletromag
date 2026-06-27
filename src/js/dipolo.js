(function () {

    'use strict';



    const K   = 8.99e9;

    const QSC = 1e-6;

    const PX_M = 0.002;   /* 1 px = 2 mm */



    const canvas = document.getElementById('dip-canvas');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const W = canvas.width, H = canvas.height;

    const CX = W / 2, CY = H / 2;



    /* ── estado ── */

    let sep       = 120;   /* px entre as cargas do dipolo */

    let probeSign = 1;     /* +1 ou -1 */

    let speed0    = 1.5;   /* magnitude da vel. inicial */



    /* dipolo: + à direita, − à esquerda */

    function dipPos() {

    return {

        pos: { x: CX + sep / 2, y: CY },

        neg: { x: CX - sep / 2, y: CY },

    };

    }



    /* carga de prova */

    let probe = null;   /* {x,y,vx,vy,trail:[]} */

    let running = false;



    /* posição inicial default: acima e à esquerda */

    let initX = CX - sep * 0.8;

    let initY = CY - 110;



    /* ── campo elétrico em (px,py) — retorna {ex,ey} em unidades físicas ── */

    function fieldAt(px, py) {

    const { pos, neg } = dipPos();

    let ex = 0, ey = 0;

    const charges = [{ x: pos.x, y: pos.y, q: 1 }, { x: neg.x, y: neg.y, q: -1 }];

    charges.forEach(c => {

        const dx = (px - c.x) * PX_M;

        const dy = (py - c.y) * PX_M;

        const r2 = dx*dx + dy*dy;

        if (r2 < 1e-6) return;

        const r  = Math.sqrt(r2);

        const Emag = K * Math.abs(c.q * QSC) / r2;

        const sign = c.q >= 0 ? 1 : -1;

        ex += sign * Emag * dx / r;

        ey += sign * Emag * dy / r;

    });

    return { ex, ey };

    }



    /* força sobre a carga de prova (em px/s²  → escala visual) */

    const FORCE_SCALE = 4e-8; /* converte N → aceleração visual */

    function accelAt(px, py) {

    const { ex, ey } = fieldAt(px, py);

    const fx = probeSign * ex;

    const fy = probeSign * ey;

    return { ax: fx * FORCE_SCALE / PX_M, ay: fy * FORCE_SCALE / PX_M };

    }



    /* ── linhas de campo do dipolo ── */

    function drawFieldLines() {

    const { pos, neg } = dipPos();

    const N = 16, STEP = 3, STEPS = 700, SR = 20;

    ctx.save();

    ctx.strokeStyle = 'rgba(56,189,248,0.18)';

    ctx.lineWidth = 1;



    for (let i = 0; i < N; i++) {

        const ang = (i / N) * Math.PI * 2;

        let px = pos.x + SR * Math.cos(ang);

        let py = pos.y + SR * Math.sin(ang);

        ctx.beginPath(); ctx.moveTo(px, py);

        for (let s = 0; s < STEPS; s++) {

        const { ex, ey } = fieldAt(px, py);

        const mag = Math.sqrt(ex*ex + ey*ey);

        if (mag < 1e-20) break;

        px += STEP * ex / mag;

        py += STEP * ey / mag;

        if (px < -5 || px > W+5 || py < -5 || py > H+5) break;

        const ddx = px - neg.x, ddy = py - neg.y;

        if (ddx*ddx + ddy*ddy < SR*SR) break;

        ctx.lineTo(px, py);

        }

        ctx.stroke();

    }

    ctx.restore();

    }



    /* ── cargas do dipolo ── */

    function drawDipole() {

    const { pos, neg } = dipPos();



    /* eixo */

    ctx.save();

    ctx.strokeStyle = '#1c2d45';

    ctx.lineWidth = 1; ctx.setLineDash([4, 4]);

    ctx.beginPath(); ctx.moveTo(neg.x, neg.y); ctx.lineTo(pos.x, pos.y); ctx.stroke();

    ctx.setLineDash([]);

    ctx.restore();



    /* vetor momento de dipolo */

    ctx.save();

    ctx.strokeStyle = 'rgba(245,158,11,0.4)';

    ctx.fillStyle   = 'rgba(245,158,11,0.4)';

    ctx.lineWidth = 1.5;

    ctx.beginPath(); ctx.moveTo(neg.x, neg.y - 10); ctx.lineTo(pos.x, pos.y - 10); ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(pos.x + 2, neg.y - 10);

    ctx.lineTo(pos.x - 7, neg.y - 16);

    ctx.lineTo(pos.x - 7, neg.y - 4);

    ctx.closePath(); ctx.fill();

    ctx.font = '9px Space Mono'; ctx.fillStyle = 'rgba(245,158,11,0.5)';

    ctx.textAlign = 'center';

    ctx.fillText('p⃗', CX, neg.y - 18);

    ctx.restore();



    [

        { c: pos, col: '#f43f5e', label: '+' },

        { c: neg, col: '#38bdf8', label: '−' },

    ].forEach(({ c, col, label }) => {

        ctx.save();

        ctx.beginPath(); ctx.arc(c.x, c.y, 18, 0, Math.PI * 2);

        ctx.fillStyle = col;

        ctx.shadowColor = col; ctx.shadowBlur = 18;

        ctx.fill(); ctx.shadowBlur = 0;

        ctx.font = 'bold 14px Space Mono';

        ctx.fillStyle = '#07090f';

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        ctx.fillText(label, c.x, c.y);

        ctx.restore();

    });

    }



    /* ── posição inicial (marcador arrastável) ── */

    let draggingInit = false;

    function drawInitMarker() {

    if (running && probe) return;

    ctx.save();

    ctx.beginPath(); ctx.arc(initX, initY, 10, 0, Math.PI * 2);

    ctx.strokeStyle = probeSign > 0 ? '#f43f5e' : '#38bdf8';

    ctx.lineWidth = 2; ctx.setLineDash([4, 3]);

    ctx.stroke(); ctx.setLineDash([]);

    ctx.font = '10px Space Mono';

    ctx.fillStyle = probeSign > 0 ? '#f43f5e' : '#38bdf8';

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.fillText(probeSign > 0 ? '+' : '−', initX, initY);

    ctx.font = '9px Space Grotesk';

    ctx.fillStyle = '#4b6080';

    ctx.textBaseline = 'top';

    ctx.fillText('posição inicial', initX, initY + 13);

    ctx.restore();

    }



    /* ── trajetória + carga em movimento ── */

    function drawProbe() {

    if (!probe) return;



    /* trail */

    if (probe.trail.length > 1) {

        ctx.save();

        for (let i = 1; i < probe.trail.length; i++) {

        const alpha = (i / probe.trail.length) * 0.7;

        ctx.strokeStyle = probeSign > 0

            ? `rgba(244,63,94,${alpha})`

            : `rgba(56,189,248,${alpha})`;

        ctx.lineWidth = 1.5;

        ctx.beginPath();

        ctx.moveTo(probe.trail[i-1].x, probe.trail[i-1].y);

        ctx.lineTo(probe.trail[i].x, probe.trail[i].y);

        ctx.stroke();

        }

        ctx.restore();

    }



    /* corpo */

    const col = probeSign > 0 ? '#f43f5e' : '#38bdf8';

    ctx.save();

    ctx.beginPath(); ctx.arc(probe.x, probe.y, 9, 0, Math.PI * 2);

    ctx.fillStyle = col;

    ctx.shadowColor = col; ctx.shadowBlur = 16;

    ctx.fill(); ctx.shadowBlur = 0;

    ctx.font = 'bold 10px Space Mono';

    ctx.fillStyle = '#07090f';

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.fillText(probeSign > 0 ? '+' : '−', probe.x, probe.y);



    /* vetor velocidade */

    const vMag = Math.sqrt(probe.vx*probe.vx + probe.vy*probe.vy);

    if (vMag > 0.1) {

        const vLen = Math.min(30, vMag * 5);

        const vx = probe.vx / vMag * vLen;

        const vy = probe.vy / vMag * vLen;

        ctx.strokeStyle = 'rgba(16,185,129,0.7)';

        ctx.fillStyle   = 'rgba(16,185,129,0.7)';

        ctx.lineWidth = 1.5;

        ctx.beginPath(); ctx.moveTo(probe.x, probe.y);

        ctx.lineTo(probe.x + vx, probe.y + vy); ctx.stroke();

        const ex2 = probe.x + vx, ey2 = probe.y + vy;

        const ang2 = Math.atan2(vy, vx);

        ctx.beginPath();

        ctx.moveTo(ex2, ey2);

        ctx.lineTo(ex2 - Math.cos(ang2-0.4)*7, ey2 - Math.sin(ang2-0.4)*7);

        ctx.lineTo(ex2 - Math.cos(ang2+0.4)*7, ey2 - Math.sin(ang2+0.4)*7);

        ctx.closePath(); ctx.fill();

    }

    ctx.restore();

    }



    /* ── render principal ── */

    function draw() {

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#07090f'; ctx.fillRect(0, 0, W, H);



    /* grade */

    ctx.save();

    ctx.strokeStyle = '#1c2d45'; ctx.lineWidth = 0.4; ctx.globalAlpha = 0.35;

    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }

    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    ctx.restore();



    drawFieldLines();

    drawDipole();

    drawInitMarker();

    drawProbe();

    }



    /* ── física: integração Verlet ── */

    const DT = 0.5;   /* passo de tempo (frames) */

    const MAX_TRAIL = 600;

    const CAPTURE_R = 22; /* px — raio de captura */



    function stepProbe() {

    if (!probe || !running) return;



    const { ax, ay } = accelAt(probe.x, probe.y);



    probe.vx += ax * DT;

    probe.vy += ay * DT;



    /* amortecimento leve para trajetórias mais legíveis */

    probe.vx *= 0.9995;

    probe.vy *= 0.9995;



    probe.x += probe.vx * DT;

    probe.y += probe.vy * DT;



    probe.trail.push({ x: probe.x, y: probe.y });

    if (probe.trail.length > MAX_TRAIL) probe.trail.shift();



    /* captura por uma das cargas */

    const { pos, neg } = dipPos();

    const dPos = Math.hypot(probe.x - pos.x, probe.y - pos.y);

    const dNeg = Math.hypot(probe.x - neg.x, probe.y - neg.y);



    if (dPos < CAPTURE_R || dNeg < CAPTURE_R) {

        running = false;

        const captured = dPos < dNeg ? 'carga positiva (+)' : 'carga negativa (−)';

        const reason = probeSign > 0

        ? (dPos < dNeg ? 'A carga de prova positiva foi atraída pela carga negativa do dipolo.' : 'A carga de prova positiva foi repelida até a carga negativa.')

        : (dNeg < dPos ? 'A carga de prova negativa foi atraída pela carga positiva do dipolo.' : 'A carga de prova negativa foi repelida até a carga positiva.');

        document.getElementById('dip-insight').textContent = reason + ' A trajetória curva é o campo elétrico do dipolo em ação!';

        document.getElementById('dip-estado').textContent = 'Capturada!';

        document.getElementById('dip-estado').style.color = '#f43f5e';

        return;

    }



    /* saiu da tela */

    if (probe.x < -20 || probe.x > W+20 || probe.y < -20 || probe.y > H+20) {

        running = false;

        document.getElementById('dip-insight').textContent = 'A carga escapou para longe — a distância enfraqueceu tanto a força que ela continuou em linha reta. Tente diminuir a velocidade inicial ou colocar a carga mais perto do dipolo!';

        document.getElementById('dip-estado').textContent = 'Escapou';

        document.getElementById('dip-estado').style.color = '#f59e0b';

        return;

    }



    /* atualiza leituras */

    const { ex, ey } = fieldAt(probe.x, probe.y);

    const Emag = Math.sqrt(ex*ex + ey*ey);

    const Fmag = Math.abs(probeSign) * QSC * Emag;

    const distM = Math.hypot((probe.x - CX)*PX_M, (probe.y - CY)*PX_M);



    const fEl = document.getElementById('dip-force');

    fEl.textContent = Fmag > 1e-3 ? Fmag.toExponential(2) + ' N' : (Fmag*1000).toFixed(3) + ' mN';

    fEl.style.color = Fmag > 1e-2 ? '#f43f5e' : '#38bdf8';



    document.getElementById('dip-dist').textContent = (distM * 100).toFixed(1) + ' cm';



    const speed = Math.hypot(probe.vx, probe.vy);

    document.getElementById('dip-estado').textContent = 'Em movimento';

    document.getElementById('dip-estado').style.color = '#10b981';



    /* insight dinâmico durante voo */

    if (probe.trail.length % 60 === 0) {

        const msgs = [

        'Observe como a trajetória se curva — é o campo vetorial do dipolo redirecionando a carga a cada instante.',

        'A carga acelera quando se aproxima dos polos e desacelera ao se afastar. Isso é a Lei de Coulomb em ação!',

        'Perceba que a trajetória nunca é uma linha reta — o campo do dipolo muda de direção em cada ponto do espaço.',

        ];

        document.getElementById('dip-insight').textContent = msgs[Math.floor(probe.trail.length / 60) % msgs.length];

    }

    }



    /* ── controles públicos ── */

    window.dipUpdateControls = function () {

    speed0 = parseFloat(document.getElementById('dip-spd').value);

    sep    = parseInt(document.getElementById('dip-sep').value);



    const labels = ['lento', 'médio', 'rápido', 'muito rápido'];

    const idx = Math.round((speed0 - 0.5) / (4 - 0.5) * (labels.length - 1));

    document.getElementById('dip-spd-val').textContent = labels[Math.max(0, Math.min(idx, labels.length-1))];

    document.getElementById('dip-sep-val').textContent = sep + ' px';

    };



    window.dipSetSign = function (s) {

    probeSign = s;

    document.getElementById('dip-sign-val').textContent = s > 0 ? '+ positiva' : '− negativa';

    document.getElementById('dip-btn-pos').className = 'dip-sign-btn' + (s > 0 ? ' active-pos' : '');

    document.getElementById('dip-btn-neg').className = 'dip-sign-btn' + (s < 0 ? ' active-neg' : '');

    };



    window.dipLaunch = function () {

    /* velocidade inicial aponta em direção ao dipolo com leve perturbação */

    const ang = Math.atan2(CY - initY, CX - initX) + (Math.random() - 0.5) * 0.6;

    probe = {

        x: initX, y: initY,

        vx: Math.cos(ang) * speed0,

        vy: Math.sin(ang) * speed0,

        trail: [{ x: initX, y: initY }],

    };

    running = true;

    document.getElementById('dip-estado').textContent = 'Em movimento';

    document.getElementById('dip-estado').style.color = '#10b981';

    document.getElementById('dip-insight').textContent = 'Carga lançada! Acompanhe a trajetória sendo desenhada em tempo real.';

    };



    window.dipReset = function () {

    probe   = null;

    running = false;

    document.getElementById('dip-force').textContent  = '— N';

    document.getElementById('dip-dist').textContent   = '— m';

    document.getElementById('dip-estado').textContent = '—';

    document.getElementById('dip-estado').style.color = 'var(--text)';

    document.getElementById('dip-insight').textContent = 'Trajetória apagada. Ajuste os parâmetros e lance novamente!';

    };



    window.dipRandomPos = function () {

    /* posição aleatória fora da zona das cargas */

    let x, y;

    do {

        x = 60 + Math.random() * (W - 120);

        y = 40 + Math.random() * (H - 80);

    } while (Math.hypot(x - CX, y - CY) < sep * 0.7);

    initX = x; initY = y;

    dipReset();

    };



    /* ── drag da posição inicial ── */

    canvas.addEventListener('mousedown', e => {

    const rect = canvas.getBoundingClientRect();

    const mx = (e.clientX - rect.left) * (W / rect.width);

    const my = (e.clientY - rect.top)  * (H / rect.height);

    if (!running && Math.hypot(mx - initX, my - initY) < 20) {

        draggingInit = true;

    }

    });

    canvas.addEventListener('mousemove', e => {

    if (!draggingInit) return;

    const rect = canvas.getBoundingClientRect();

    initX = (e.clientX - rect.left) * (W / rect.width);

    initY = (e.clientY - rect.top)  * (H / rect.height);

    });

    canvas.addEventListener('mouseup',    () => { draggingInit = false; });

    canvas.addEventListener('mouseleave', () => { draggingInit = false; });



    /* ── loop ── */

    let _running = false;

    let _rafId = null;

    let _started = false;

    function loop() {

    if (!_running) return;

    stepProbe();

    draw();

    _rafId = requestAnimationFrame(loop);

    }

    function start() {

    if (_started) return;

    _running = true;

    _started = true;

    loop();

    }

    function stop() {

    _running = false;

    if (_rafId) { cancelAnimationFrame(_rafId); _rafId = null; }

    }



    dipUpdateControls();

    window.__dipoloController = { start, stop };

})();