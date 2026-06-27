(function () {

    'use strict';



    /* ── canvas ── */

    const cc  = document.getElementById('ohm-circuit');

    const gc  = document.getElementById('ohm-graph');

    if (!cc || !gc) return;

    const ctx = cc.getContext('2d');

    const gtx = gc.getContext('2d');

    const CW = cc.width, CH = cc.height;

    const GW = gc.width, GH = gc.height;



    let V = 6, R = 100;



    /* ── histórico de pontos para o gráfico ── */

    const history = [];   /* {v, i} */



    /* ── animação dos elétrons ── */

    let phase = 0;



    /* ──────────────────────────────────────────

    CIRCUITO

    ────────────────────────────────────────── */

    function drawCircuit() {

    ctx.clearRect(0, 0, CW, CH);

    ctx.fillStyle = '#07090f';

    ctx.fillRect(0, 0, CW, CH);



    const I = V / R;           /* corrente em Ampères  */

    const P = V * I;           /* potência em Watts    */



    /* ── geometria do circuito ── */

    const mx = CW / 2, my = CH / 2;

    const bw = 90, bh = 50;    /* bateria */

    const rw = 60, rh = 28;    /* resistor */

    const pad = 28;



    /* nós do circuito (retângulo) */

    const top    = my - 80;

    const bot    = my + 80;

    const left   = mx - 110;

    const right  = mx + 110;



    /* ── fio (cor muda com corrente) ── */

    const wireAlpha = Math.min(0.9, 0.25 + (I / 0.24) * 0.65);

    const wireColor = `rgba(56,189,248,${wireAlpha})`;



    ctx.save();

    ctx.strokeStyle = wireColor;

    ctx.lineWidth = 2.5;

    ctx.lineJoin = 'round';

    ctx.beginPath();

    ctx.moveTo(left,  top);

    ctx.lineTo(right, top);

    ctx.lineTo(right, bot);

    ctx.lineTo(left,  bot);

    ctx.lineTo(left,  top);

    ctx.stroke();

    ctx.restore();



    /* ── elétrons animados no fio ── */

    const speed = Math.min(3, I * 120); /* velocidade ∝ corrente */

    const nElec = Math.max(2, Math.round(I * 80));

    const perimeter = 2 * ((right - left) + (bot - top));



    ctx.save();

    ctx.fillStyle = '#38bdf8';

    ctx.shadowColor = '#38bdf8';

    ctx.shadowBlur = 6;



    for (let k = 0; k < nElec; k++) {

        /* distribui elétrons ao longo do perímetro */

        let t = ((k / nElec + phase * speed / perimeter) % 1 + 1) % 1;

        let ex, ey;

        const seg1 = (right - left) / perimeter;

        const seg2 = seg1 + (bot - top) / perimeter;

        const seg3 = seg2 + (right - left) / perimeter;



        if (t < seg1) {

        ex = left + t / seg1 * (right - left); ey = top;

        } else if (t < seg2) {

        ex = right; ey = top + (t - seg1) / (seg2 - seg1) * (bot - top);

        } else if (t < seg3) {

        ex = right - (t - seg2) / (seg3 - seg2) * (right - left); ey = bot;

        } else {

        ex = left; ey = bot - (t - seg3) / (1 - seg3) * (bot - top);

        }



        ctx.beginPath();

        ctx.arc(ex, ey, 3, 0, Math.PI * 2);

        ctx.fill();

    }

    ctx.restore();



    /* ── BATERIA (lado esquerdo, vertical) ── */

    const bx = left, by = my;

    const bHalf = 28;



    /* corpo */

    ctx.save();

    ctx.fillStyle = '#0f1623';

    ctx.strokeStyle = '#243654';

    ctx.lineWidth = 1;

    ctx.beginPath();

    ctx.roundRect(bx - 16, by - bHalf, 32, bHalf * 2, 6);

    ctx.fill(); ctx.stroke();



    /* polo + */

    ctx.fillStyle = '#f43f5e';

    ctx.font = 'bold 13px Space Mono';

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.fillText('+', bx, by - bHalf * 0.45);



    /* polo − */

    ctx.fillStyle = '#38bdf8';

    ctx.fillText('−', bx, by + bHalf * 0.45);



    /* label V */

    ctx.fillStyle = '#e2e8f0';

    ctx.font = 'bold 11px Space Mono';

    ctx.fillText(V.toFixed(1) + ' V', bx, by);

    ctx.restore();



    /* ── RESISTOR (topo, horizontal) ── */

    const rx = mx, ry = top;

    const rHalf = 30, rH2 = 12;



    ctx.save();

    /* corpo zigue-zague */

    ctx.strokeStyle = '#f59e0b';

    ctx.lineWidth = 2;

    ctx.lineJoin = 'round';

    ctx.beginPath();

    const segs = 6;

    ctx.moveTo(rx - rHalf, ry);

    for (let s = 0; s < segs; s++) {

        const x0 = rx - rHalf + (s / segs) * rHalf * 2;

        const x1 = rx - rHalf + ((s + 0.5) / segs) * rHalf * 2;

        const yOff = (s % 2 === 0 ? -1 : 1) * rH2;

        ctx.lineTo(x1, ry + yOff);

    }

    ctx.lineTo(rx + rHalf, ry);

    ctx.stroke();



    /* label R */

    ctx.fillStyle = '#f59e0b';

    ctx.font = 'bold 10px Space Mono';

    ctx.textAlign = 'center';

    ctx.fillText(R + ' Ω', rx, ry - 20);

    ctx.restore();



    /* ── seta de corrente ── */

    const arrowX = right, arrowY = my;

    const arrowDir = 1; /* de cima para baixo no lado direito */

    const aLen = 18;



    ctx.save();

    ctx.strokeStyle = '#10b981';

    ctx.fillStyle   = '#10b981';

    ctx.lineWidth = 2;

    ctx.globalAlpha = 0.85;



    ctx.beginPath();

    ctx.moveTo(arrowX, arrowY - aLen);

    ctx.lineTo(arrowX, arrowY + aLen);

    ctx.stroke();



    ctx.beginPath();

    ctx.moveTo(arrowX,        arrowY + aLen);

    ctx.lineTo(arrowX - 6,    arrowY + aLen - 10);

    ctx.lineTo(arrowX + 6,    arrowY + aLen - 10);

    ctx.closePath(); ctx.fill();



    /* label I */

    ctx.font = 'bold 10px Space Mono';

    ctx.textAlign = 'left';

    ctx.fillText('I = ' + (I * 1000).toFixed(1) + ' mA', arrowX + 10, arrowY);

    ctx.restore();



    /* ── calor no resistor (Efeito Joule) ── */

    const heatAlpha = Math.min(0.9, P / 0.12);

    if (heatAlpha > 0.05) {

        ctx.save();

        ctx.globalAlpha = heatAlpha * 0.6;

        for (let h = 0; h < 5; h++) {

        const hx = rx - 20 + h * 10;

        const hy = ry - 28 - ((phase * 30 + h * 20) % 18);

        ctx.font = '12px serif';

        ctx.fillStyle = h % 2 === 0 ? '#f59e0b' : '#f43f5e';

        ctx.textAlign = 'center';

        ctx.fillText('🔥', hx, hy);

        }

        ctx.restore();

    }

    }



    /* ──────────────────────────────────────────

    GRÁFICO V × I

    ────────────────────────────────────────── */

    function drawGraph() {

    gtx.clearRect(0, 0, GW, GH);

    gtx.fillStyle = '#07090f';

    gtx.fillRect(0, 0, GW, GH);



    const PAD = { l: 48, r: 18, t: 24, b: 40 };

    const pw = GW - PAD.l - PAD.r;

    const ph = GH - PAD.t - PAD.b;



    const VMAX = 24;

    const IMAX = VMAX / 10;   /* máx I com R = 10Ω */



    function gx(v) { return PAD.l + (v / VMAX) * pw; }

    function gy(i) { return PAD.t + ph - (i / IMAX) * ph; }



    /* grade */

    gtx.save();

    gtx.strokeStyle = '#1c2d45'; gtx.lineWidth = 0.5;

    for (let v = 0; v <= VMAX; v += 4) {

        gtx.beginPath(); gtx.moveTo(gx(v), PAD.t); gtx.lineTo(gx(v), PAD.t + ph); gtx.stroke();

    }

    for (let i = 0; i <= IMAX; i += 0.1) {

        gtx.beginPath(); gtx.moveTo(PAD.l, gy(i)); gtx.lineTo(PAD.l + pw, gy(i)); gtx.stroke();

    }

    gtx.restore();



    /* eixos */

    gtx.save();

    gtx.strokeStyle = '#243654'; gtx.lineWidth = 1.5;

    gtx.beginPath();

    gtx.moveTo(PAD.l, PAD.t); gtx.lineTo(PAD.l, PAD.t + ph);

    gtx.lineTo(PAD.l + pw, PAD.t + ph);

    gtx.stroke();



    /* labels eixos */

    gtx.fillStyle = '#4b6080';

    gtx.font = '9px Space Mono';

    gtx.textAlign = 'center';

    gtx.fillText('Tensão V (V)', PAD.l + pw / 2, GH - 6);

    gtx.save();

    gtx.translate(12, PAD.t + ph / 2);

    gtx.rotate(-Math.PI / 2);

    gtx.fillText('Corrente I (mA)', 0, 0);

    gtx.restore();



    /* ticks V */

    [0, 6, 12, 18, 24].forEach(v => {

        gtx.fillStyle = '#4b6080';

        gtx.textAlign = 'center';

        gtx.fillText(v, gx(v), PAD.t + ph + 14);

    });



    /* ticks I */

    [0, 0.5, 1.0, 1.5, 2.0].forEach(i => {

        gtx.textAlign = 'right';

        gtx.fillText((i * 1000).toFixed(0), PAD.l - 5, gy(i) + 3);

    });

    gtx.restore();



    /* ── retas de referência (R fixo, V varia) ── */

    const refRs = [500, 200, 50, 20];

    refRs.forEach(rr => {

        if (rr === R) return; /* linha atual destacada abaixo */

        gtx.save();

        gtx.strokeStyle = '#1c2d45';

        gtx.lineWidth = 1;

        gtx.setLineDash([4, 4]);

        gtx.beginPath();

        gtx.moveTo(gx(0), gy(0));

        gtx.lineTo(gx(VMAX), gy(VMAX / rr));

        gtx.stroke();

        gtx.setLineDash([]);



        gtx.fillStyle = '#2a3f5f';

        gtx.font = '8px Space Mono';

        gtx.textAlign = 'left';

        gtx.fillText(rr + 'Ω', gx(VMAX) + 2, gy(VMAX / rr) + 3);

        gtx.restore();

    });



    /* ── reta da Lei de Ohm para R atual ── */

    const slope = 1 / R;

    gtx.save();

    gtx.strokeStyle = '#38bdf8';

    gtx.lineWidth = 2;

    gtx.shadowColor = '#38bdf8';

    gtx.shadowBlur = 8;

    gtx.beginPath();

    gtx.moveTo(gx(0), gy(0));

    gtx.lineTo(gx(VMAX), gy(VMAX * slope));

    gtx.stroke();

    gtx.shadowBlur = 0;



    /* label da reta */

    gtx.fillStyle = '#38bdf8';

    gtx.font = 'bold 9px Space Mono';

    gtx.textAlign = 'left';

    const labelV = VMAX * 0.65;

    gtx.fillText('R = ' + R + 'Ω', gx(labelV) + 5, gy(labelV * slope) - 6);

    gtx.restore();



    /* ── ponto atual ── */

    const I = V / R;

    gtx.save();

    gtx.beginPath();

    gtx.arc(gx(V), gy(I), 6, 0, Math.PI * 2);

    gtx.fillStyle = '#f59e0b';

    gtx.shadowColor = '#f59e0b';

    gtx.shadowBlur = 14;

    gtx.fill();

    gtx.shadowBlur = 0;



    /* linhas de guia até os eixos */

    gtx.strokeStyle = 'rgba(245,158,11,0.35)';

    gtx.lineWidth = 1; gtx.setLineDash([3, 3]);

    gtx.beginPath();

    gtx.moveTo(gx(V), gy(I)); gtx.lineTo(gx(V), PAD.t + ph);

    gtx.moveTo(gx(V), gy(I)); gtx.lineTo(PAD.l, gy(I));

    gtx.stroke();

    gtx.setLineDash([]);

    gtx.restore();



    /* ── título ── */

    gtx.save();

    gtx.fillStyle = '#2a3f5f';

    gtx.font = '9px Space Mono';

    gtx.textAlign = 'right';

    gtx.fillText('Gráfico V × I', PAD.l + pw, PAD.t - 8);

    gtx.restore();

    }



    /* ── UI ── */

    function updateUI() {

    const I = V / R;

    const P = V * I;

    const Ima = I * 1000;

    const Pmw = P * 1000;



    document.getElementById('ohm-v-val').textContent    = V.toFixed(1) + ' V';

    document.getElementById('ohm-r-val').textContent    = R + ' Ω';

    document.getElementById('ohm-disp-v').textContent   = V.toFixed(1) + ' V';

    document.getElementById('ohm-disp-r').textContent   = R + ' Ω';



    const iEl = document.getElementById('ohm-disp-i');

    iEl.textContent = Ima.toFixed(1) + ' mA';

    iEl.style.color = Ima > 150 ? '#f43f5e' : Ima > 60 ? '#f59e0b' : '#10b981';



    const pEl = document.getElementById('ohm-disp-p');

    pEl.textContent = Pmw > 1000 ? (P).toFixed(2) + ' W' : Pmw.toFixed(1) + ' mW';

    pEl.style.color = Pmw > 500 ? '#f43f5e' : Pmw > 100 ? '#f59e0b' : '#10b981';



    /* insight */

    let msg;

    if (V === 0) {

        msg = 'Sem tensão, sem corrente. Os elétrons ficam parados — o circuito não funciona.';

    } else if (R <= 20) {

        msg = `Resistência muito baixa (${R} Ω)! A corrente de ${Ima.toFixed(0)} mA é alta e a potência dissipada é de ${Pmw.toFixed(0)} mW. Em resistores reais, isso poderia causar superaquecimento.`;

    } else if (R >= 400) {

        msg = `Resistência alta (${R} Ω): a corrente fica reduzida a apenas ${Ima.toFixed(1)} mA. O resistor "freia" bastante o fluxo de elétrons.`;

    } else if (V >= 18) {

        msg = `Tensão elevada de ${V.toFixed(1)} V resulta em ${Ima.toFixed(0)} mA de corrente e ${Pmw.toFixed(0)} mW de potência — parte dela convertida em calor no resistor.`;

    } else {

        msg = `V = ${V.toFixed(1)} V ÷ R = ${R} Ω → I = ${Ima.toFixed(1)} mA. Dobre a tensão: a corrente dobra. Dobre a resistência: a corrente cai pela metade. Isso é a Lei de Ohm!`;

    }

    document.getElementById('ohm-insight').textContent = msg;

    }



    window.ohmUpdate = function () {

    V = parseFloat(document.getElementById('ohm-v').value);

    R = parseInt(document.getElementById('ohm-r').value);

    updateUI();

    };



    /* ── loop ── */

    let _running = false;

    let _rafId = null;

    let _started = false;

    function loop(ts) {

    if (!_running) return;

    phase = ts / 1000;

    drawCircuit();

    drawGraph();

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



    updateUI();

    window.__resistoresController = { start, stop };

})();