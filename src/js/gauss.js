(function () {

    'use strict';



    const EPS0 = 8.854e-12;

    const K    = 8.99e9;

    const Q_SC = 1e-6;



    const canvas = document.getElementById('gauss-canvas');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const W = canvas.width, H = canvas.height;

    const CX = W / 2, CY = H / 2;



    let Q = 2.0;    /* µC */

    let R = 120;    /* px */



    /* ── drag da carga externa ── */

    let extCharge = null; /* {x,y,q} ou null */

    let dragging = false;

    let dragOff = {x:0,y:0};



    /* ── cor por sinal ── */

    function qColor(q) { return q >= 0 ? '#f43f5e' : '#38bdf8'; }



    /* ── formato de número ── */

    function fmt(v, digits) {

    if (!isFinite(v)) return '∞';

    return v.toFixed(digits);

    }



    /* ── campo E na superfície (simetria esférica) ── */

    function eField(q_uc, r_px) {

    const r_m = r_px * 0.002; /* 1 px ≈ 2 mm → r em metros */

    if (r_m <= 0) return Infinity;

    return K * Math.abs(q_uc * Q_SC) / (r_m * r_m);

    }



    /* ── linhas de campo saindo da carga central ── */

    function drawFieldLines(q) {

    if (q === 0) return;

    const N = 16;

    const STEP = 3, STEPS = 400, START_R = 20;

    const sign = q > 0 ? 1 : -1;



    ctx.save();

    ctx.strokeStyle = qColor(q);

    ctx.lineWidth = 1;

    ctx.globalAlpha = 0.22;



    for (let i = 0; i < N; i++) {

        const ang = (i / N) * Math.PI * 2;

        let px = CX + START_R * Math.cos(ang);

        let py = CY + START_R * Math.sin(ang);

        ctx.beginPath(); ctx.moveTo(px, py);



        for (let s = 0; s < STEPS; s++) {

        /* campo resultante de carga central + externa (se existir) */

        let ex = 0, ey = 0;



        /* carga central */

        const dx0 = px - CX, dy0 = py - CY;

        const r20 = dx0*dx0 + dy0*dy0;

        if (r20 > 1) {

            const r0 = Math.sqrt(r20);

            ex += sign * dx0 / (r20 * r0);

            ey += sign * dy0 / (r20 * r0);

        }



        /* carga externa */

        if (extCharge) {

            const dx1 = px - extCharge.x, dy1 = py - extCharge.y;

            const r21 = dx1*dx1 + dy1*dy1;

            if (r21 > 1) {

            const r1 = Math.sqrt(r21);

            const s1 = extCharge.q >= 0 ? 1 : -1;

            ex += s1 * dx1 / (r21 * r1);

            ey += s1 * dy1 / (r21 * r1);

            }

        }



        const mag = Math.sqrt(ex*ex + ey*ey);

        if (mag < 1e-12) break;

        px += STEP * ex/mag;

        py += STEP * ey/mag;

        if (px < -10 || px > W+10 || py < -10 || py > H+10) break;

        ctx.lineTo(px, py);

        }

        ctx.stroke();

    }

    ctx.restore();

    }



    /* ── setas na superfície (fluxo) ── */

    function drawFluxArrows(q, r) {

    if (q === 0) return;

    const N = 12;

    const sign = q > 0 ? 1 : -1;

    const col = qColor(q);



    ctx.save();

    for (let i = 0; i < N; i++) {

        const ang = (i / N) * Math.PI * 2;

        const ax = CX + r * Math.cos(ang);

        const ay = CY + r * Math.sin(ang);



        /* seta apontando para fora (+) ou para dentro (-) */

        const arrowLen = 14;

        const nx = Math.cos(ang) * sign;

        const ny = Math.sin(ang) * sign;



        ctx.strokeStyle = col;

        ctx.fillStyle = col;

        ctx.globalAlpha = 0.75;

        ctx.lineWidth = 1.5;



        ctx.beginPath();

        ctx.moveTo(ax - nx*arrowLen*0.5, ay - ny*arrowLen*0.5);

        ctx.lineTo(ax + nx*arrowLen*0.5, ay + ny*arrowLen*0.5);

        ctx.stroke();



        /* ponta */

        const hx = ax + nx*arrowLen*0.5;

        const hy = ay + ny*arrowLen*0.5;

        const px2 = -ny, py2 = nx;

        ctx.beginPath();

        ctx.moveTo(hx, hy);

        ctx.lineTo(hx - nx*6 + px2*3, hy - ny*6 + py2*3);

        ctx.lineTo(hx - nx*6 - px2*3, hy - ny*6 - py2*3);

        ctx.closePath(); ctx.fill();

    }

    ctx.restore();

    }



    /* ── render principal ── */

    function draw() {

    ctx.clearRect(0, 0, W, H);

    ctx.fillStyle = '#07090f';

    ctx.fillRect(0, 0, W, H);



    /* grade de fundo */

    ctx.save();

    ctx.strokeStyle = '#1c2d45';

    ctx.lineWidth = 0.5;

    ctx.globalAlpha = 0.4;

    for (let x = 0; x <= W; x += 40) { ctx.beginPath(); ctx.moveTo(x,0); ctx.lineTo(x,H); ctx.stroke(); }

    for (let y = 0; y <= H; y += 40) { ctx.beginPath(); ctx.moveTo(0,y); ctx.lineTo(W,y); ctx.stroke(); }

    ctx.restore();



    /* linhas de campo */

    drawFieldLines(Q);



    /* carga externa (se existir) */

    if (extCharge) {

        ctx.save();

        ctx.beginPath();

        ctx.arc(extCharge.x, extCharge.y, 14, 0, Math.PI*2);

        ctx.fillStyle = qColor(extCharge.q);

        ctx.globalAlpha = 0.9;

        ctx.fill();

        ctx.globalAlpha = 1;

        ctx.font = 'bold 11px Space Mono';

        ctx.fillStyle = '#07090f';

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        ctx.fillText(extCharge.q > 0 ? '+' : '−', extCharge.x, extCharge.y);

        ctx.restore();



        /* label "Carga externa — não afeta o fluxo!" */

        ctx.save();

        ctx.font = '10px Space Grotesk';

        ctx.fillStyle = '#4b6080';

        ctx.textAlign = 'center';

        ctx.fillText('carga externa', extCharge.x, extCharge.y + 24);

        ctx.restore();

    }



    /* superfície gaussiana */

    const surfCol = Q === 0 ? '#4b6080' : qColor(Q);

    ctx.save();

    ctx.beginPath();

    ctx.arc(CX, CY, R, 0, Math.PI*2);

    ctx.strokeStyle = surfCol;

    ctx.lineWidth = 2;

    ctx.setLineDash([8, 5]);

    ctx.globalAlpha = 0.7;

    ctx.stroke();

    ctx.setLineDash([]);



    /* preenchimento suave */

    ctx.beginPath();

    ctx.arc(CX, CY, R, 0, Math.PI*2);

    ctx.fillStyle = Q >= 0 ? 'rgba(244,63,94,0.04)' : 'rgba(56,189,248,0.04)';

    ctx.globalAlpha = 1;

    ctx.fill();

    ctx.restore();



    /* setas de fluxo */

    drawFluxArrows(Q, R);



    /* carga central */

    const cr = 18;

    ctx.save();

    ctx.beginPath();

    ctx.arc(CX, CY, cr, 0, Math.PI*2);

    ctx.fillStyle = qColor(Q);

    if (Q === 0) ctx.fillStyle = '#4b6080';

    ctx.shadowColor = Q === 0 ? '#4b6080' : qColor(Q);

    ctx.shadowBlur = 18;

    ctx.fill();

    ctx.shadowBlur = 0;

    ctx.font = 'bold 12px Space Mono';

    ctx.fillStyle = '#07090f';

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.fillText(Q > 0 ? '+' : Q < 0 ? '−' : '0', CX, CY);

    ctx.restore();



    /* label raio */

    ctx.save();

    ctx.strokeStyle = '#2a3f5f';

    ctx.lineWidth = 1;

    ctx.setLineDash([4,3]);

    ctx.beginPath(); ctx.moveTo(CX, CY); ctx.lineTo(CX + R, CY); ctx.stroke();

    ctx.setLineDash([]);

    ctx.font = '10px Space Mono';

    ctx.fillStyle = '#4b6080';

    ctx.textAlign = 'center';

    ctx.fillText('r = ' + R + ' px', CX + R/2, CY - 8);

    ctx.restore();



    /* label superfície */

    ctx.save();

    ctx.font = '10px Space Mono';

    ctx.fillStyle = Q === 0 ? '#4b6080' : surfCol;

    ctx.globalAlpha = 0.8;

    ctx.textAlign = 'center';

    ctx.fillText('Superfície Gaussiana', CX, CY - R - 10);

    ctx.restore();

    }



    /* ── UI update ── */

    function updateUI() {

    const flux = Q * Q_SC / EPS0;

    const e = eField(Q, R);

    const col = Q === 0 ? '#4b6080' : qColor(Q);



    document.getElementById('gauss-q-val').textContent =

        (Q >= 0 ? '+' : '') + Q.toFixed(1) + ' µC';

    document.getElementById('gauss-r-val').textContent = R + ' px';



    const qencEl = document.getElementById('gauss-qenc');

    qencEl.textContent = (Q >= 0 ? '+' : '') + Q.toFixed(1) + ' µC';

    qencEl.style.color = col;



    const fluxEl = document.getElementById('gauss-flux');

    const fluxStr = Math.abs(flux) > 1e6

        ? (flux / 1e6).toFixed(2) + ' M N·m²/C'

        : fmt(flux / 1000, 1) + ' kN·m²/C';

    fluxEl.textContent = flux >= 0 ? '+' + fluxStr : fluxStr;

    fluxEl.style.color = col;



    const eEl = document.getElementById('gauss-efield');

    const eStr = e > 1e6 ? (e/1e6).toFixed(1) + ' MV/m' : (e/1000).toFixed(1) + ' kV/m';

    eEl.textContent = eStr;

    eEl.style.color = col;



    /* insight */

    let msg;

    if (Q === 0) {

        msg = 'Sem carga dentro da superfície, o fluxo elétrico total é zero — as linhas de campo que entram são exatamente iguais às que saem.';

    } else if (Q > 0) {

        msg = `Carga positiva de ${Q.toFixed(1)} µC dentro da superfície → fluxo total positivo. As linhas de campo "brotam" da carga e atravessam a superfície para fora.`;

    } else {

        msg = `Carga negativa de ${Q.toFixed(1)} µC dentro da superfície → fluxo total negativo. As linhas de campo convergem para dentro, como um ralo elétrico.`;

    }

    document.getElementById('gauss-insight').textContent = msg;

    }



    /* ── slider callbacks ── */

    window.gaussUpdate = function () {

    Q = parseFloat(document.getElementById('gauss-q').value);

    R = parseInt(document.getElementById('gauss-r').value);

    updateUI();

    };



    /* ── drag da carga externa (duplo clique para criar/remover) ── */

    canvas.addEventListener('dblclick', function (e) {

    const rect = canvas.getBoundingClientRect();

    const scaleX = W / rect.width;

    const scaleY = H / rect.height;

    const mx = (e.clientX - rect.left) * scaleX;

    const my = (e.clientY - rect.top)  * scaleY;

    const dx = mx - CX, dy = my - CY;

    if (dx*dx + dy*dy > R*R) {

        /* fora da superfície: cria carga externa */

        extCharge = { x: mx, y: my, q: 2 };

    } else {

        extCharge = null;

    }

    });



    canvas.addEventListener('mousedown', function(e) {

    if (!extCharge) return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = W / rect.width, scaleY = H / rect.height;

    const mx = (e.clientX - rect.left)*scaleX, my = (e.clientY - rect.top)*scaleY;

    const dx = mx - extCharge.x, dy = my - extCharge.y;

    if (dx*dx + dy*dy < 400) { dragging = true; dragOff = {x:dx, y:dy}; }

    });

    canvas.addEventListener('mousemove', function(e) {

    if (!dragging || !extCharge) return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = W / rect.width, scaleY = H / rect.height;

    extCharge.x = (e.clientX - rect.left)*scaleX - dragOff.x;

    extCharge.y = (e.clientY - rect.top)*scaleY  - dragOff.y;

    });

    canvas.addEventListener('mouseup',    () => { dragging = false; });

    canvas.addEventListener('mouseleave', () => { dragging = false; });



    /* ── loop ── */

    let _running = false;

    let _rafId = null;

    let _started = false;

    function loop() {

    if (!_running) return;

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



    updateUI();

    window.__gaussController = { start, stop };

})();