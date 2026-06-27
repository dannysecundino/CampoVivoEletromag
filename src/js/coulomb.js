(function () {

    'use strict';



    /* ══════ Constantes físicas ══════ */

    const K = 8.99e9;       /* constante de Coulomb, N·m²/C² */

    const Q_SCALE = 1e-6;   /* µC → C */



    /* ══════ Canvas ══════ */

    const canvas = document.getElementById('coul-canvas');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const W = canvas.width, H = canvas.height;



    /* ══════ Estado das cargas (em pixels canvas) ══════ */

    let state = {

    q1: 1.0,   /* µC */

    q2: -1.0,  /* µC */

    x1: W * 0.32, y1: H * 0.5,

    x2: W * 0.68, y2: H * 0.5,

    };



    /* ══════ Drag ══════ */

    let drag = null;    /* 'q1' | 'q2' | null */

    let hinted = false;



    function pxToMeters(dx, dy) {

    /* escala: 300 px = 4 m → 1 m = 75 px */

    const PX_PER_M = W / 5.5;

    return { dx: dx / PX_PER_M, dy: dy / PX_PER_M };

    }

    function metersToPx(m) { return m * (W / 5.5); }



    function distPx() {

    const dx = state.x2 - state.x1, dy = state.y2 - state.y1;

    return Math.sqrt(dx*dx + dy*dy);

    }

    function distMeters() {

    const dpx = distPx();

    return dpx / (W / 5.5);

    }



    /* ══════ Cor por sinal ══════ */

    function chargeColor(q) {

    return q >= 0 ? '#f43f5e' : '#38bdf8';

    }

    function chargeLabel(q) {

    return (q >= 0 ? '+' : '') + q.toFixed(1) + ' µC';

    }



    /* ══════ Força de Coulomb ══════ */

    function forceN() {

    const r = distMeters();

    if (r < 0.05) return Infinity;

    return K * Math.abs(state.q1 * Q_SCALE) * Math.abs(state.q2 * Q_SCALE) / (r * r);

    }



    /* ══════ Desenho das linhas de campo ══════ */

    function drawFieldLines() {

    const STEP = 3;     /* px por passo */

    const STEPS = 600;  /* máx de iterações por linha */

    const N_LINES = 12; /* linhas por carga */

    const START_R = 18; /* raio do ponto de partida */



    /* pares de cargas: [ {x,y,q} ] */

    const charges = [

        { x: state.x1, y: state.y1, q: state.q1 },

        { x: state.x2, y: state.y2, q: state.q2 },

    ];



    /* campo elétrico resultante em (px, py) — retorna vetor unitário */

    function fieldDir(px, py) {

        let ex = 0, ey = 0;

        charges.forEach(c => {

        const dx = px - c.x, dy = py - c.y;

        const r2 = dx*dx + dy*dy;

        if (r2 < 1) return;

        const r = Math.sqrt(r2);

        const sign = c.q >= 0 ? 1 : -1;

        ex += sign * dx / (r2 * r);

        ey += sign * dy / (r2 * r);

        });

        const mag = Math.sqrt(ex*ex + ey*ey);

        if (mag < 1e-12) return { x: 0, y: 0 };

        return { x: ex/mag, y: ey/mag };

    }



    ctx.save();

    ctx.lineWidth = 1;

    ctx.globalAlpha = 0.28;



    /* lança linhas de cada carga positiva (ou de ambas se nenhuma for positiva) */

    charges.forEach(src => {

        if (src.q < 0) return; /* linhas saem só de positivas */

        for (let i = 0; i < N_LINES; i++) {

        const ang = (i / N_LINES) * Math.PI * 2;

        let px = src.x + START_R * Math.cos(ang);

        let py = src.y + START_R * Math.sin(ang);



        ctx.beginPath();

        ctx.moveTo(px, py);



        const baseHue = src.q >= 0 ? '#f43f5e' : '#38bdf8';

        ctx.strokeStyle = '#38bdf8';



        for (let s = 0; s < STEPS; s++) {

            const dir = fieldDir(px, py);

            px += STEP * dir.x;

            py += STEP * dir.y;



            /* termina se sair da tela */

            if (px < -10 || px > W+10 || py < -10 || py > H+10) break;



            /* termina se chegar perto de uma carga negativa */

            let absorbed = false;

            charges.forEach(c => {

            if (c.q < 0) {

                const dx = px-c.x, dy = py-c.y;

                if (dx*dx+dy*dy < START_R*START_R) absorbed = true;

            }

            });

            if (absorbed) break;



            ctx.lineTo(px, py);

        }

        ctx.stroke();

        }

    });



    /* se não há cargas positivas, lança linhas chegando nas negativas */

    const hasPos = charges.some(c => c.q >= 0);

    if (!hasPos) {

        charges.forEach(src => {

        for (let i = 0; i < N_LINES; i++) {

            const ang = (i / N_LINES) * Math.PI * 2;

            let px = src.x + START_R * Math.cos(ang);

            let py = src.y + START_R * Math.sin(ang);

            ctx.beginPath(); ctx.moveTo(px, py);

            ctx.strokeStyle = '#a78bfa';

            for (let s = 0; s < STEPS; s++) {

            const dir = fieldDir(px, py);

            /* inverte direção para chegar na negativa */

            px -= STEP * dir.x;

            py -= STEP * dir.y;

            if (px < -10||px>W+10||py<-10||py>H+10) break;

            ctx.lineTo(px, py);

            }

            ctx.stroke();

        }

        });

    }



    ctx.globalAlpha = 1;

    ctx.restore();

    }



    /* ══════ Desenha uma seta ══════ */

    function drawArrow(x1, y1, x2, y2, color, width) {

    const dx = x2-x1, dy = y2-y1;

    const len = Math.sqrt(dx*dx+dy*dy);

    if (len < 2) return;

    const ux = dx/len, uy = dy/len;

    const headLen = Math.min(12, len * 0.35);



    ctx.save();

    ctx.strokeStyle = color; ctx.fillStyle = color;

    ctx.lineWidth = width;

    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(x2, y2);

    ctx.lineTo(x2 - headLen*(ux - 0.45*uy), y2 - headLen*(uy + 0.45*ux));

    ctx.lineTo(x2 - headLen*(ux + 0.45*uy), y2 - headLen*(uy - 0.45*ux));

    ctx.closePath(); ctx.fill();

    ctx.restore();

    }



    /* ══════ Render principal ══════ */

    function render() {

    ctx.clearRect(0, 0, W, H);



    /* fundo */

    ctx.fillStyle = '#07090f';

    ctx.fillRect(0, 0, W, H);



    /* grid sutil */

    ctx.save();

    ctx.strokeStyle = '#1c2d45';

    ctx.lineWidth = 0.5;

    for (let gx = 0; gx <= W; gx += 40) {

        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();

    }

    for (let gy = 0; gy <= H; gy += 40) {

        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();

    }

    ctx.restore();



    /* linhas de campo */

    drawFieldLines();



    /* linha de distância tracejada */

    const midX = (state.x1 + state.x2) / 2;

    const midY = (state.y1 + state.y2) / 2;

    ctx.save();

    ctx.strokeStyle = '#2a3f5f';

    ctx.lineWidth = 1.2;

    ctx.setLineDash([5, 5]);

    ctx.beginPath(); ctx.moveTo(state.x1, state.y1); ctx.lineTo(state.x2, state.y2); ctx.stroke();

    ctx.setLineDash([]);



    /* rótulo r */

    const r = distMeters();

    ctx.fillStyle = '#4b6080';

    ctx.font = '11px Space Mono, monospace';

    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';

    ctx.fillText('r = ' + r.toFixed(2) + ' m', midX, midY - 5);

    ctx.restore();



    /* ── vetores de força ── */

    const dx = state.x2 - state.x1, dy = state.y2 - state.y1;

    const dpx = distPx();

    const ux = dx/dpx, uy = dy/dpx;

    const sameSign = (state.q1 >= 0) === (state.q2 >= 0) && state.q1 !== 0 && state.q2 !== 0;



    const F = forceN();

    /* escala: log para abranger melhor a faixa dinâmica de F */

    const arrowLen = isFinite(F) ? Math.min(75, Math.max(22, Math.log10(1 + F * 1e6) * 18)) : 0;



    /* raio visual de cada carga — seta começa na borda do disco */

    const R1 = 14 + Math.min(8, Math.abs(state.q1) * 2.5);

    const R2 = 14 + Math.min(8, Math.abs(state.q2) * 2.5);



    if (arrowLen > 0 && state.q1 !== 0 && state.q2 !== 0) {

        if (sameSign) {

        /* repulsão: seta sai de cada carga para longe da outra */

        drawArrow(

            state.x1 - ux * R1, state.y1 - uy * R1,

            state.x1 - ux * (R1 + arrowLen), state.y1 - uy * (R1 + arrowLen),

            '#10b981', 2.5

        );

        drawArrow(

            state.x2 + ux * R2, state.y2 + uy * R2,

            state.x2 + ux * (R2 + arrowLen), state.y2 + uy * (R2 + arrowLen),

            '#10b981', 2.5

        );

        } else {

        /* atração: seta sai de cada carga em direção à outra */

        drawArrow(

            state.x1 + ux * R1, state.y1 + uy * R1,

            state.x1 + ux * (R1 + arrowLen), state.y1 + uy * (R1 + arrowLen),

            '#10b981', 2.5

        );

        drawArrow(

            state.x2 - ux * R2, state.y2 - uy * R2,

            state.x2 - ux * (R2 + arrowLen), state.y2 - uy * (R2 + arrowLen),

            '#10b981', 2.5

        );

        }

    }



    /* ── cargas ── */

    [{ x: state.x1, y: state.y1, q: state.q1, id:'q1' },

    { x: state.x2, y: state.y2, q: state.q2, id:'q2' }].forEach(c => {

        const col = chargeColor(c.q);

        const R   = 14 + Math.min(8, Math.abs(c.q) * 2.5);



        /* glow */

        const grd = ctx.createRadialGradient(c.x, c.y, R*0.3, c.x, c.y, R*2.2);

        grd.addColorStop(0, col + '44');

        grd.addColorStop(1, col + '00');

        ctx.beginPath(); ctx.arc(c.x, c.y, R*2.2, 0, Math.PI*2);

        ctx.fillStyle = grd; ctx.fill();



        /* disco */

        ctx.beginPath(); ctx.arc(c.x, c.y, R, 0, Math.PI*2);

        ctx.fillStyle = col;

        ctx.shadowColor = col; ctx.shadowBlur = 14;

        ctx.fill(); ctx.shadowBlur = 0;



        /* contorno */

        ctx.strokeStyle = '#07090f'; ctx.lineWidth = 1.5;

        ctx.stroke();



        /* sinal */

        ctx.fillStyle = '#07090f';

        ctx.font = `bold ${R > 16 ? 14 : 12}px Space Grotesk, sans-serif`;

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        ctx.fillText(c.q >= 0 ? '+' : '−', c.x, c.y);



        /* label */

        ctx.fillStyle = col;

        ctx.font = '10px Space Mono, monospace';

        ctx.textBaseline = 'bottom';

        ctx.fillText(c.id + ' = ' + chargeLabel(c.q), c.x, c.y - R - 4);

    });

    }



    /* ══════ Atualizar UI ══════ */

    function updateUI() {

    const q1 = state.q1, q2 = state.q2;

    const r  = distMeters();

    const F  = forceN();



    document.getElementById('coul-q1-val').textContent = (q1 >= 0 ? '+' : '') + q1.toFixed(1) + ' µC';

    document.getElementById('coul-q2-val').textContent = (q2 >= 0 ? '+' : '') + q2.toFixed(1) + ' µC';

    document.getElementById('coul-r-val').textContent  = r.toFixed(2) + ' m';



    /* sincroniza slider de r com posição real */

    const rSlider = document.getElementById('coul-r-slider');

    rSlider.value = Math.min(4, Math.max(0.5, r));



    /* força */

    const fEl = document.getElementById('coul-fval');

    if (!isFinite(F)) {

        fEl.textContent = '∞  (cargas sobrepostas)';

        fEl.style.color = '#f43f5e';

    } else if (F > 1e6) {

        fEl.textContent = F.toExponential(2) + ' N';

        fEl.style.color = '#f43f5e';

    } else if (F > 1) {

        fEl.textContent = F.toFixed(2) + ' N';

        fEl.style.color = '#f59e0b';

    } else {

        fEl.textContent = (F * 1000).toFixed(2) + ' mN';

        fEl.style.color = '#10b981';

    }



    /* tipo */

    const tipoEl = document.getElementById('coul-tipo');

    const sameSign = (q1 >= 0) === (q2 >= 0) && q1 !== 0 && q2 !== 0;

    if (q1 === 0 || q2 === 0) {

        tipoEl.textContent = 'Nenhuma (q = 0)';

        tipoEl.style.color = '#4b6080';

    } else if (sameSign) {

        tipoEl.textContent = '↔  Repulsão';

        tipoEl.style.color = '#f43f5e';

    } else {

        tipoEl.textContent = '→← Atração';

        tipoEl.style.color = '#38bdf8';

    }



    /* F se r dobrar */

    const fDoubleR = isFinite(F) ? F / 4 : Infinity;

    const rdEl = document.getElementById('coul-rdoub');

    rdEl.textContent = isFinite(fDoubleR)

        ? (fDoubleR > 1 ? fDoubleR.toFixed(2) + ' N' : (fDoubleR*1000).toFixed(2) + ' mN') + ' (¼ de F)'

        : '—';

    rdEl.style.color = '#4b6080';



    /* insight */

    const ins = document.getElementById('coul-insight');

    if (!isFinite(F)) {

        ins.textContent = 'As cargas estão sobrepostas — na prática, cargas pontuais não se tocam.';

    } else if (q1 === 0 || q2 === 0) {

        ins.textContent = 'Uma das cargas é zero: não há força elétrica. A força de Coulomb exige que ambas sejam não-nulas.';

    } else if (sameSign) {

        ins.textContent = `Cargas de mesmo sinal (${q1>0?'ambas positivas':'ambas negativas'}): as setas se afastam — repulsão. Aumente a distância e veja F cair com 1/r².`;

    } else {

        ins.textContent = `Cargas de sinais opostos: as setas apontam uma para a outra — atração. As linhas de campo saem de q${q1>0?'1':'2'} e chegam em q${q1>0?'2':'1'}.`;

    }

    }



    /* ══════ Loop de animação ══════ */

    let _running = false;

    let _rafId = null;

    let _started = false;

    function loop() {

    if (!_running) return;

    render();

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



    /* ══════ Sliders de carga ══════ */

    window.coulUpdate = function () {

    state.q1 = +document.getElementById('coul-q1').value;

    state.q2 = +document.getElementById('coul-q2').value;

    updateUI();

    };



    /* ══════ Slider de distância → move q2 mantendo q1 fixo ══════ */

    window.coulSyncFromSlider = function () {

    const rTarget  = +document.getElementById('coul-r-slider').value;

    const rPx = rTarget * (W / 5.5);

    const dx = state.x2 - state.x1, dy = state.y2 - state.y1;

    const cur = Math.sqrt(dx*dx+dy*dy);

    if (cur < 1) {

        state.x2 = state.x1 + rPx;

        state.y2 = state.y1;

    } else {

        state.x2 = state.x1 + (dx/cur)*rPx;

        state.y2 = state.y1 + (dy/cur)*rPx;

    }

    /* limita canvas */

    state.x2 = Math.max(20, Math.min(W-20, state.x2));

    state.y2 = Math.max(20, Math.min(H-20, state.y2));

    updateUI();

    };



    /* ══════ Drag das cargas ══════ */

    function getPos(e) {

    const rect = canvas.getBoundingClientRect();

    const scaleX = W / rect.width;

    const scaleY = H / rect.height;

    const clientX = e.touches ? e.touches[0].clientX : e.clientX;

    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    return {

        x: (clientX - rect.left) * scaleX,

        y: (clientY - rect.top)  * scaleY,

    };

    }



    function hitRadius(q) { return 14 + Math.min(8, Math.abs(q) * 2.5) + 10; }



    function onDown(e) {

    const p = getPos(e);

    const d1 = Math.hypot(p.x - state.x1, p.y - state.y1);

    const d2 = Math.hypot(p.x - state.x2, p.y - state.y2);

    if (d1 < hitRadius(state.q1) && d1 <= d2) { drag = 'q1'; canvas.classList.add('dragging'); }

    else if (d2 < hitRadius(state.q2))          { drag = 'q2'; canvas.classList.add('dragging'); }

    if (drag) {

        e.preventDefault();

        if (!hinted) {

        document.getElementById('coul-hint').classList.add('hidden');

        hinted = true;

        }

    }

    }



    function onMove(e) {

    if (!drag) return;

    e.preventDefault();

    const p = getPos(e);

    const x = Math.max(20, Math.min(W-20, p.x));

    const y = Math.max(20, Math.min(H-20, p.y));

    if (drag === 'q1') { state.x1 = x; state.y1 = y; }

    else               { state.x2 = x; state.y2 = y; }

    updateUI();

    }



    function onUp() { drag = null; canvas.classList.remove('dragging'); }



    canvas.addEventListener('mousedown',  onDown);

    canvas.addEventListener('mousemove',  onMove);

    canvas.addEventListener('mouseup',    onUp);

    canvas.addEventListener('mouseleave', onUp);

    canvas.addEventListener('touchstart', onDown, { passive: false });

    canvas.addEventListener('touchmove',  onMove, { passive: false });

    canvas.addEventListener('touchend',   onUp);



    /* ══════ Init ══════ */

    updateUI();

    // start será chamado pelo controller

    window.__coulombController = { start, stop };



})();