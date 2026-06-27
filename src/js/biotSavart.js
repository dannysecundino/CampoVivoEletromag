(function () {

    'use strict';



    function H_axial(I, a_m, z_m, dirSign) {

    const denom = Math.pow(a_m * a_m + z_m * z_m, 1.5);

    const mag = (I * a_m * a_m) / (2 * denom);

    return dirSign * mag;

    }



    const c3d = document.getElementById('bs-3d');

    const cg = document.getElementById('bs-graph');

    if (!c3d || !cg) return;



    const ctx = c3d.getContext('2d');

    const gtx = cg.getContext('2d');

    const CW = c3d.width, CH = c3d.height, GW = cg.width, GH = cg.height;



    let I = 5;

    let a_cm = 10;

    let z_cm = 5;

    let dirSign = 1;   // +1 anti-horário visto de +z, -1 horário

    let phase = 0;



    /* projeção ajustada:

    x aparece à esquerda, y à direita e z para cima */

    const ISO_SCALE = 5.2;

    const ORIGIN = { x: CW / 2, y: CH * 0.62 };



    function project(x, y, z) {

    const ang = Math.PI / 6;

    const isoX = (y - x) * Math.cos(ang);

    const isoY = (x + y) * Math.sin(ang) - z;

    return {

        px: ORIGIN.x + isoX * ISO_SCALE,

        py: ORIGIN.y + isoY * ISO_SCALE

    };

    }



    function drawAxes() {

    const L = 22;

    const axes = [

        { dx: L, dy: 0, dz: 0, col: '#f43f5e', label: 'x' },

        { dx: 0, dy: L, dz: 0, col: '#10b981', label: 'y' },

        { dx: 0, dy: 0, dz: L, col: '#38bdf8', label: 'z' }

    ];



    axes.forEach(ax => {

        const p0 = project(0, 0, 0);

        const p1 = project(ax.dx, ax.dy, ax.dz);



        ctx.save();

        ctx.strokeStyle = ax.col;

        ctx.lineWidth = 1.6;

        ctx.globalAlpha = 0.85;



        ctx.beginPath();

        ctx.moveTo(p0.px, p0.py);

        ctx.lineTo(p1.px, p1.py);

        ctx.stroke();



        const ang = Math.atan2(p1.py - p0.py, p1.px - p0.px);

        ctx.fillStyle = ax.col;

        ctx.beginPath();

        ctx.moveTo(p1.px, p1.py);

        ctx.lineTo(p1.px - Math.cos(ang - 0.4) * 7, p1.py - Math.sin(ang - 0.4) * 7);

        ctx.lineTo(p1.px - Math.cos(ang + 0.4) * 7, p1.py - Math.sin(ang + 0.4) * 7);

        ctx.closePath();

        ctx.fill();



        ctx.font = 'bold 12px Space Mono';

        ctx.textAlign = 'center';

        ctx.textBaseline = 'middle';

        ctx.fillText(ax.label, p1.px + (p1.px - p0.px) * 0.12, p1.py + (p1.py - p0.py) * 0.12);

        ctx.restore();

    });



    const p0 = project(0, 0, 0);

    ctx.save();

    ctx.fillStyle = '#4b6080';

    ctx.beginPath();

    ctx.arc(p0.px, p0.py, 2.5, 0, Math.PI * 2);

    ctx.fill();

    ctx.restore();

    }



    function drawLoop() {

    const aVis = a_cm * 0.85;

    const N = 64;

    const pts = [];



    for (let i = 0; i <= N; i++) {

        const t = (i / N) * Math.PI * 2;

        pts.push(project(aVis * Math.cos(t), aVis * Math.sin(t), 0));

    }



    ctx.save();

    ctx.strokeStyle = '#f59e0b';

    ctx.lineWidth = 2.6;

    ctx.lineJoin = 'round';

    ctx.beginPath();

    pts.forEach((p, i) => (i === 0 ? ctx.moveTo(p.px, p.py) : ctx.lineTo(p.px, p.py)));

    ctx.stroke();

    ctx.restore();



    /* setas da corrente no contorno da espira */

    const arrowCount = 8;

    for (let k = 0; k < arrowCount; k++) {

        let t = (k / arrowCount) * Math.PI * 2 + phase * 0.4 * dirSign;

        t = ((t % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);



        const dt = 0.06 * dirSign;

        const p1 = project(aVis * Math.cos(t), aVis * Math.sin(t), 0);

        const p2 = project(aVis * Math.cos(t + dt), aVis * Math.sin(t + dt), 0);

        const ang = Math.atan2(p2.py - p1.py, p2.px - p1.px);



        ctx.save();

        ctx.fillStyle = '#fbbf24';

        ctx.beginPath();

        ctx.moveTo(p2.px, p2.py);

        ctx.lineTo(p2.px - Math.cos(ang - 0.45) * 6, p2.py - Math.sin(ang - 0.45) * 6);

        ctx.lineTo(p2.px - Math.cos(ang + 0.45) * 6, p2.py - Math.sin(ang + 0.45) * 6);

        ctx.closePath();

        ctx.fill();

        ctx.restore();

    }



    const pLbl = project(aVis * 1.15, 0, 0);

    ctx.save();

    ctx.fillStyle = '#f59e0b';

    ctx.font = '10px Space Mono';

    ctx.textAlign = 'left';

    ctx.textBaseline = 'middle';

    ctx.fillText('I = ' + I.toFixed(1) + 'A, a = ' + a_cm.toFixed(1) + 'cm', pLbl.px + 6, pLbl.py);

    ctx.restore();

    }



    function drawFieldVector() {

    const a_m = a_cm / 100, z_m = z_cm / 100;

    const Hz = H_axial(I, a_m, z_m, dirSign);

    const sign = Math.sign(Hz) || dirSign;



    const zVis = z_cm * 0.85;

    const pZ = project(0, 0, zVis);

    const pC = project(0, 0, 0);



    ctx.save();

    ctx.strokeStyle = '#a78bfa';

    ctx.lineWidth = 1.5;

    ctx.setLineDash([4, 4]);

    ctx.globalAlpha = 0.7;

    ctx.beginPath();

    ctx.moveTo(pC.px, pC.py);

    ctx.lineTo(pZ.px, pZ.py);

    ctx.stroke();

    ctx.setLineDash([]);

    ctx.restore();



    ctx.save();

    ctx.fillStyle = '#a78bfa';

    ctx.beginPath();

    ctx.arc(pZ.px, pZ.py, 5, 0, Math.PI * 2);

    ctx.fill();

    ctx.restore();



    const Hvis = 12 + Math.min(18, Math.abs(Hz) * 0.4);

    const pH = project(0, 0, zVis + sign * Hvis * 0.85);



    ctx.save();

    ctx.strokeStyle = '#38bdf8';

    ctx.fillStyle = '#38bdf8';

    ctx.lineWidth = 2.6;

    ctx.globalAlpha = 0.95;

    ctx.beginPath();

    ctx.moveTo(pZ.px, pZ.py);

    ctx.lineTo(pH.px, pH.py);

    ctx.stroke();



    const ang = Math.atan2(pH.py - pZ.py, pH.px - pZ.px);

    ctx.beginPath();

    ctx.moveTo(pH.px, pH.py);

    ctx.lineTo(pH.px - Math.cos(ang - 0.4) * 8, pH.py - Math.sin(ang - 0.4) * 8);

    ctx.lineTo(pH.px - Math.cos(ang + 0.4) * 8, pH.py - Math.sin(ang + 0.4) * 8);

    ctx.closePath();

    ctx.fill();



    ctx.font = 'bold 11px Space Mono';

    ctx.textAlign = 'left';

    ctx.textBaseline = 'middle';

    ctx.fillText('H⃗', pH.px + 6, pH.py);

    ctx.restore();



    ctx.save();

    ctx.fillStyle = '#a78bfa';

    ctx.font = '9px Space Mono';

    ctx.textAlign = 'left';

    ctx.textBaseline = 'top';

    ctx.fillText('z = ' + z_cm.toFixed(1) + 'cm', pZ.px + 8, pZ.py + 8);

    ctx.restore();

    }



    function render3D() {

    ctx.clearRect(0, 0, CW, CH);

    ctx.fillStyle = '#07090f';

    ctx.fillRect(0, 0, CW, CH);



    /* grade de chão sutil */

    ctx.save();

    ctx.strokeStyle = '#1c2d45';

    ctx.lineWidth = 0.4;

    ctx.globalAlpha = 0.3;

    for (let i = -20; i <= 20; i += 10) {

        const p1 = project(i, -20, 0), p2 = project(i, 20, 0);

        ctx.beginPath(); ctx.moveTo(p1.px, p1.py); ctx.lineTo(p2.px, p2.py); ctx.stroke();

        const p3 = project(-20, i, 0), p4 = project(20, i, 0);

        ctx.beginPath(); ctx.moveTo(p3.px, p3.py); ctx.lineTo(p4.px, p4.py); ctx.stroke();

    }

    ctx.restore();



    /* sem linhas de campo azuis no anel */

    drawAxes();

    drawLoop();

    drawFieldVector();

    }



    function renderGraph() {

    gtx.clearRect(0, 0, GW, GH);

    gtx.fillStyle = '#07090f';

    gtx.fillRect(0, 0, GW, GH);



    const PAD = { l: 50, r: 18, t: 22, b: 36 };

    const pw = GW - PAD.l - PAD.r, ph = GH - PAD.t - PAD.b;

    const ZMAX = 30;

    const a_m = a_cm / 100;

    const H0 = I / (2 * a_m);

    const HMAX = H0 * 1.15;



    function gx(v) { return PAD.l + ((v + ZMAX) / (2 * ZMAX)) * pw; }

    function gy(v) { return PAD.t + ph / 2 - (v / HMAX) * (ph / 2); }



    gtx.save();

    gtx.strokeStyle = '#1c2d45';

    gtx.lineWidth = 0.5;

    [-1, -0.5, 0, 0.5, 1].forEach(f => {

        gtx.beginPath();

        gtx.moveTo(PAD.l, gy(HMAX * f));

        gtx.lineTo(PAD.l + pw, gy(HMAX * f));

        gtx.stroke();

    });

    gtx.restore();



    gtx.save();

    gtx.strokeStyle = '#243654';

    gtx.lineWidth = 1.2;

    gtx.beginPath();

    gtx.moveTo(gx(0), PAD.t);

    gtx.lineTo(gx(0), PAD.t + ph);

    gtx.stroke();

    gtx.beginPath();

    gtx.moveTo(PAD.l, gy(0));

    gtx.lineTo(PAD.l + pw, gy(0));

    gtx.stroke();

    gtx.restore();



    gtx.save();

    gtx.strokeStyle = '#38bdf8';

    gtx.lineWidth = 2.2;

    gtx.shadowColor = '#38bdf8';

    gtx.shadowBlur = 5;

    gtx.beginPath();

    for (let px = 0; px <= pw; px++) {

        const zv = -ZMAX + (px / pw) * 2 * ZMAX;

        const zM = zv / 100;

        const hv = H_axial(I, a_m, zM, dirSign);

        const x = PAD.l + px, y = gy(hv);

        px === 0 ? gtx.moveTo(x, y) : gtx.lineTo(x, y);

    }

    gtx.stroke();

    gtx.shadowBlur = 0;

    gtx.restore();



    const Hcur = H_axial(I, a_m, z_cm / 100, dirSign);

    gtx.save();

    gtx.beginPath();

    gtx.arc(gx(z_cm), gy(Hcur), 5, 0, Math.PI * 2);

    gtx.fillStyle = '#a78bfa';

    gtx.shadowColor = '#a78bfa';

    gtx.shadowBlur = 10;

    gtx.fill();

    gtx.shadowBlur = 0;

    gtx.restore();



    gtx.save();

    gtx.strokeStyle = 'rgba(167,139,250,0.4)';

    gtx.lineWidth = 1;

    gtx.setLineDash([3, 3]);

    gtx.beginPath();

    gtx.moveTo(gx(z_cm), gy(Hcur));

    gtx.lineTo(gx(z_cm), gy(0));

    gtx.stroke();

    gtx.setLineDash([]);

    gtx.restore();



    gtx.save();

    gtx.fillStyle = '#4b6080';

    gtx.font = '9px Space Mono';

    gtx.textAlign = 'center';

    gtx.textBaseline = 'top';

    gtx.fillText('z (cm)', PAD.l + pw / 2, PAD.t + ph + 14);

    gtx.save();

    gtx.translate(14, PAD.t + ph / 2);

    gtx.rotate(-Math.PI / 2);

    gtx.textBaseline = 'middle';

    gtx.fillText('H(z) (A/m)', 0, 0);

    gtx.restore();



    [-ZMAX, -ZMAX / 2, 0, ZMAX / 2, ZMAX].forEach(zv => {

        gtx.textAlign = 'center';

        gtx.textBaseline = 'top';

        gtx.fillText(zv.toFixed(0), gx(zv), PAD.t + ph + 2);

    });

    [-1, 0, 1].forEach(f => {

        gtx.textAlign = 'right';

        gtx.textBaseline = 'middle';

        gtx.fillText((HMAX * f).toFixed(1), PAD.l - 5, gy(HMAX * f));

    });

    gtx.restore();



    gtx.save();

    gtx.fillStyle = '#2a3f5f';

    gtx.font = '9px Space Mono';

    gtx.textAlign = 'right';

    gtx.textBaseline = 'top';

    gtx.fillText('H(z) = I·a² / [2(a²+z²)^1.5]', PAD.l + pw, PAD.t - 14);

    gtx.restore();

    }



    function updateUI() {

    const a_m = a_cm / 100, z_m = z_cm / 100;

    const Hz = H_axial(I, a_m, z_m, dirSign);

    const H0 = I / (2 * a_m) * dirSign;



    const hvalEl = document.getElementById('bs-hval');

    hvalEl.textContent = Hz.toFixed(2) + ' A/m';

    hvalEl.style.color = Hz >= 0 ? '#38bdf8' : '#f43f5e';



    const hdirEl = document.getElementById('bs-hdir');

    const sign = Math.sign(Hz) || dirSign;

    hdirEl.textContent = sign > 0 ? '+ẑ (para cima)' : '−ẑ (para baixo)';

    hdirEl.style.color = sign > 0 ? '#38bdf8' : '#f43f5e';



    document.getElementById('bs-h0').textContent = H0.toFixed(2) + ' A/m';



    const ratio = H0 !== 0 ? (Hz / H0) : 0;

    document.getElementById('bs-ratio').textContent = (ratio * 100).toFixed(1) + ' %';



    let msg;

    const absZ = Math.abs(z_cm);

    if (absZ < 0.6) {

        msg = `No centro da espira (z≈0), o campo atinge seu valor máximo: H(0) = I/(2a) = ${Math.abs(H0).toFixed(2)} A/m.`;

    } else if (absZ > a_cm * 2.5) {

        msg = `Longe da espira, o campo já caiu para apenas ${(ratio * 100).toFixed(1)}% do valor central, como esperado para um dipolo magnético.`;

    } else {

        msg = `Em z = ${z_cm.toFixed(1)} cm, o campo vale ${(ratio * 100).toFixed(1)}% do valor no centro.`;

    }

    document.getElementById('bs-insight').textContent = msg;

    }



    let _running = false;

    let _rafId = null;

    let _started = false;

    function loop() {

    if (!_running) return;

    phase += 0.02;

    render3D();

    renderGraph();

    updateUI();

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



    window.bsUpd = function () {

    I = parseFloat(document.getElementById('bs-si').value);

    a_cm = parseFloat(document.getElementById('bs-sa').value);

    z_cm = parseFloat(document.getElementById('bs-sz').value);

    document.getElementById('bs-li').textContent = I.toFixed(1) + ' A';

    document.getElementById('bs-la').textContent = a_cm.toFixed(1) + ' cm';

    document.getElementById('bs-lz').textContent = z_cm.toFixed(1) + ' cm';

    };



    window.bsSetDir = function (d) {

    dirSign = d;

    document.getElementById('bs-btn-ccw').className = 'bs-dir-btn' + (d > 0 ? ' active-ccw' : '');

    document.getElementById('bs-btn-cw').className = 'bs-dir-btn' + (d < 0 ? ' active-cw' : '');

    };



    window.__biotController = { start, stop };

})();