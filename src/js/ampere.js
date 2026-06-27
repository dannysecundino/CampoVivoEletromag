(function () {

    /* ── Constantes geométricas (em pixels-canvas) ── */

    /* A escala visual: 0 a 100 px de canvas = 0 a 10 mm real */

    const SCALE = 0.10;   /* px → mm para os rótulos */



    /* Raios fixos (só r é ajustável pelo usuário) */

    const A_PX = 22;   /* raio do condutor interno  */

    const B_PX = 48;   /* raio interno do dielétrico */

    const C_PX = 62;   /* raio externo do condutor externo */

    const MAX_R = 100; /* raio máximo do gráfico    */



    /* ── Canvas e contextos ── */

    const crossCanvas = document.getElementById('coax-cross');

    const graphCanvas = document.getElementById('coax-graph');

    if (!crossCanvas || !graphCanvas) return; /* segurança */



    const cx = crossCanvas.getContext('2d');

    const gx = graphCanvas.getContext('2d');

    const CW = crossCanvas.width, CH = crossCanvas.height;

    const GW = graphCanvas.width, GH = graphCanvas.height;

    const CCX = CW / 2, CCY = CH / 2;



    /* ── Estado ── */

    let r = 45;       /* raio atual do laço amperiano */

    let phase = 0;    /* fase da animação de rotação  */



    /* ── Função B(r) normalizada (pico = 1 em r = A_PX) ── */

    function Bnorm(rv) {

    if (rv <= 0)      return 0;

    if (rv < A_PX)    return rv / A_PX;               /* linear dentro do condutor */

    if (rv <= B_PX)   return A_PX / rv;               /* 1/r no dielétrico         */

    if (rv <= C_PX) {                                  /* cancelamento no shell     */

        const t = (rv - B_PX) / (C_PX - B_PX);

        return (A_PX / rv) * (1 - t);

    }

    return 0;                                          /* zero lá fora              */

    }



    /* ── Cor por região ── */

    function regionColor(rv) {

    if (rv < A_PX)   return '#f59e0b';  /* âmbar  — condutor interno  */

    if (rv <= B_PX)  return '#38bdf8';  /* azul   — dielétrico        */

    if (rv <= C_PX)  return '#a78bfa';  /* violeta— condutor externo  */

    return '#10b981';                   /* verde  — exterior blindado */

    }



    function regionName(rv) {

    if (rv < A_PX)   return '① Condutor interno';

    if (rv <= B_PX)  return '② Dielétrico';

    if (rv <= C_PX)  return '③ Condutor externo';

    return '④ Exterior (blindado)';

    }



    function regionIenc(rv) {

    if (rv < A_PX)   return 'I · (r/a)²  <  I';

    if (rv <= B_PX)  return 'I  (total)';

    if (rv <= C_PX)  return 'I − I·(r−b)/(c−b)';

    return '0  (cancelamento perfeito)';

    }



    function regionInsight(rv) {

    if (rv < A_PX)

        return 'Dentro do condutor interno: apenas uma fração da corrente está encerrada no laço → B cresce linearmente com r.';

    if (rv <= B_PX)

        return 'Na região dielétrica: toda a corrente interna I está encerrada → B ∝ 1/r, comportamento clássico de fio infinito.';

    if (rv <= C_PX)

        return 'Dentro do condutor externo (blindagem): a corrente de retorno −I começa a cancelar → B cai mais rápido que 1/r.';

    return 'Exterior ao cabo: I_enc = +I − I = 0 → Lei de Ampère garante B = 0. Esta é a blindagem eletromagnética do cabo coaxial!';

    }



    /* ════════ DESENHO: seção transversal ════════ */

    function drawCross() {

    cx.clearRect(0, 0, CW, CH);

    cx.fillStyle = '#07090f';

    cx.fillRect(0, 0, CW, CH);



    /* condutor externo (shell violeta) */

    cx.beginPath(); cx.arc(CCX, CCY, C_PX, 0, Math.PI * 2);

    cx.fillStyle = '#1a1040'; cx.fill();

    cx.strokeStyle = '#7c3aed'; cx.lineWidth = 1.5; cx.stroke();



    /* dielétrico */

    cx.beginPath(); cx.arc(CCX, CCY, B_PX, 0, Math.PI * 2);

    cx.fillStyle = '#08111f'; cx.fill();

    cx.strokeStyle = '#1c3558'; cx.lineWidth = 0.5; cx.stroke();



    /* condutor interno (cobre) */

    const grad = cx.createRadialGradient(CCX - 7, CCY - 7, 1, CCX, CCY, A_PX);

    grad.addColorStop(0, '#fde68a');

    grad.addColorStop(0.6, '#f59e0b');

    grad.addColorStop(1, '#78350f');

    cx.beginPath(); cx.arc(CCX, CCY, A_PX, 0, Math.PI * 2);

    cx.fillStyle = grad; cx.fill();



    /* símbolo ⊙ de corrente saindo — pontos no condutor interno */

    cx.fillStyle = 'rgba(255,255,255,0.7)';

    cx.font = '9px monospace';

    cx.textAlign = 'center'; cx.textBaseline = 'middle';

    [[0,0],[8,0],[-8,0],[0,8],[0,-8],[5,5],[-5,-5],[5,-5],[-5,5]].forEach(([dx,dy]) => {

        cx.fillText('·', CCX + dx, CCY + dy);

    });



    /* símbolo × de corrente entrando no shell */

    cx.fillStyle = '#c4b5fd';

    cx.font = '8px monospace';

    const nm = 10;

    for (let i = 0; i < nm; i++) {

        const ang = (i / nm) * Math.PI * 2;

        const rm = (B_PX + C_PX) / 2;

        cx.fillText('×', CCX + rm * Math.cos(ang), CCY + rm * Math.sin(ang));

    }



    /* linhas de campo magnético circulares (animadas) na região dielétrica */

    cx.save();

    [0.28, 0.55, 0.82].forEach((t, i) => {

        const lr = A_PX + t * (B_PX - A_PX);

        const bv = Bnorm(lr);

        const alpha = 0.2 + bv * 0.55;

        cx.strokeStyle = `rgba(56,189,248,${alpha})`;

        cx.lineWidth = 1;

        cx.setLineDash([5, 6]);

        cx.lineDashOffset = -phase * (i % 2 === 0 ? 1.2 : -1.2);

        cx.beginPath(); cx.arc(CCX, CCY, lr, 0, Math.PI * 2); cx.stroke();

        /* setinha no topo */

        cx.setLineDash([]);

        cx.fillStyle = `rgba(56,189,248,${alpha})`;

        const ax = CCX + lr, ay = CCY;

        cx.beginPath();

        cx.moveTo(ax, ay - 5); cx.lineTo(ax + 4, ay + 3); cx.lineTo(ax - 4, ay + 3);

        cx.closePath(); cx.fill();

    });

    cx.setLineDash([]);

    cx.restore();



    /* ── Laço amperiano (controlado pelo slider) ── */

    const col = regionColor(r);

    cx.save();

    cx.strokeStyle = col;

    cx.lineWidth = 2;

    cx.shadowColor = col; cx.shadowBlur = 14;

    cx.setLineDash([7, 4]);

    cx.beginPath(); cx.arc(CCX, CCY, r, 0, Math.PI * 2); cx.stroke();

    cx.setLineDash([]);



    /* rótulo "r" na diagonal */

    const la = -Math.PI / 5;

    cx.font = 'bold 9px Space Mono, monospace';

    cx.fillStyle = col;

    cx.textAlign = 'left'; cx.textBaseline = 'middle';

    cx.shadowBlur = 0;

    cx.fillText(`r = ${(r * SCALE).toFixed(1)} mm`,

        CCX + r * Math.cos(la) + 5, CCY + r * Math.sin(la));



    /* linha de raio */

    cx.strokeStyle = col; cx.lineWidth = 0.8; cx.globalAlpha = 0.45;

    cx.beginPath();

    cx.moveTo(CCX, CCY);

    cx.lineTo(CCX + r * Math.cos(la), CCY + r * Math.sin(la));

    cx.stroke();

    cx.restore();



    /* legenda compacta */

    const legend = [

        { c: '#f59e0b', t: 'Condutor interno (I↑)' },

        { c: '#1c3558', t: 'Dielétrico' },

        { c: '#7c3aed', t: 'Condutor externo (I↓)' },

        { c: '#38bdf8', t: 'Campo B (circulante)' },

    ];

    cx.font = '8px Space Grotesk, sans-serif';

    cx.textAlign = 'left'; cx.textBaseline = 'middle';

    legend.forEach((l, i) => {

        const lx = 6, ly = CH - 10 - i * 14;

        cx.fillStyle = l.c; cx.fillRect(lx, ly - 4, 9, 9);

        cx.fillStyle = '#4b6080'; cx.fillText(l.t, lx + 13, ly);

    });



    /* marcadores a, b, c */

    cx.font = 'bold 8px Space Mono, monospace';

    cx.textAlign = 'center'; cx.textBaseline = 'top';

    [{ v: A_PX, c: '#f59e0b', l: 'a' },

    { v: B_PX, c: '#38bdf8', l: 'b' },

    { v: C_PX, c: '#a78bfa', l: 'c' }].forEach(m => {

        cx.strokeStyle = m.c; cx.lineWidth = 0.6; cx.globalAlpha = 0.4;

        cx.setLineDash([2, 3]);

        cx.beginPath(); cx.moveTo(CCX + m.v, CCY); cx.lineTo(CCX + m.v, CCY + 9); cx.stroke();

        cx.setLineDash([]); cx.globalAlpha = 1;

        cx.fillStyle = m.c; cx.fillText(m.l, CCX + m.v, CCY + 10);

    });

    }



    /* ════════ DESENHO: gráfico B(r) ════════ */

    function drawGraph() {

    gx.clearRect(0, 0, GW, GH);

    gx.fillStyle = '#07090f';

    gx.fillRect(0, 0, GW, GH);



    const PAD = { l: 42, r: 14, t: 18, b: 34 };

    const pw = GW - PAD.l - PAD.r;

    const ph = GH - PAD.t - PAD.b;



    /* regiões de fundo */

    const regions = [

        { from: 0,     to: A_PX,  col: 'rgba(245,158,11,0.07)' },

        { from: A_PX,  to: B_PX,  col: 'rgba(56,189,248,0.07)'  },

        { from: B_PX,  to: C_PX,  col: 'rgba(167,139,250,0.07)' },

        { from: C_PX,  to: MAX_R, col: 'rgba(16,185,129,0.07)'  },

    ];

    const rx = v => PAD.l + (v / MAX_R) * pw;

    const ry = v => PAD.t + ph - v * ph * 0.88;



    regions.forEach(reg => {

        gx.fillStyle = reg.col;

        gx.fillRect(rx(reg.from), PAD.t, rx(reg.to) - rx(reg.from), ph);

    });



    /* eixos */

    gx.strokeStyle = '#1c2d45'; gx.lineWidth = 1;

    gx.beginPath();

    gx.moveTo(PAD.l, PAD.t); gx.lineTo(PAD.l, PAD.t + ph);

    gx.lineTo(PAD.l + pw, PAD.t + ph); gx.stroke();



    /* divisórias de região */

    [A_PX, B_PX, C_PX].forEach(v => {

        gx.strokeStyle = '#1c2d45'; gx.lineWidth = 1; gx.setLineDash([3, 4]);

        gx.beginPath(); gx.moveTo(rx(v), PAD.t); gx.lineTo(rx(v), PAD.t + ph); gx.stroke();

        gx.setLineDash([]);

    });



    /* rótulos a, b, c no eixo x */

    gx.font = '8px Space Mono, monospace'; gx.textAlign = 'center'; gx.textBaseline = 'top';

    [{ v: A_PX, c: '#f59e0b', l: 'a' },

    { v: B_PX, c: '#38bdf8', l: 'b' },

    { v: C_PX, c: '#a78bfa', l: 'c' }].forEach(m => {

        gx.fillStyle = m.c; gx.fillText(m.l, rx(m.v), PAD.t + ph + 4);

    });



    /* eixos rótulos */

    gx.fillStyle = '#4b6080';

    gx.textAlign = 'center'; gx.textBaseline = 'middle';

    gx.fillText('r', PAD.l + pw / 2, PAD.t + ph + 22);

    gx.save(); gx.translate(11, PAD.t + ph / 2);

    gx.rotate(-Math.PI / 2); gx.fillText('B(r)', 0, 0); gx.restore();



    /* curva B(r) */

    gx.beginPath();

    for (let p = 0; p <= pw; p++) {

        const rv = (p / pw) * MAX_R;

        const bv = Bnorm(rv);

        const xp = PAD.l + p;

        const yp = ry(bv);

        p === 0 ? gx.moveTo(xp, yp) : gx.lineTo(xp, yp);

    }

    const cg = gx.createLinearGradient(PAD.l, 0, PAD.l + pw, 0);

    cg.addColorStop(A_PX / MAX_R, '#f59e0b');

    cg.addColorStop(B_PX / MAX_R, '#38bdf8');

    cg.addColorStop(C_PX / MAX_R, '#a78bfa');

    cg.addColorStop(1, '#10b981');

    gx.strokeStyle = cg; gx.lineWidth = 2.2; gx.stroke();



    /* preenchimento sob a curva */

    gx.lineTo(PAD.l + pw, PAD.t + ph); gx.lineTo(PAD.l, PAD.t + ph); gx.closePath();

    const fg = gx.createLinearGradient(PAD.l, 0, PAD.l + pw, 0);

    fg.addColorStop(A_PX / MAX_R, 'rgba(245,158,11,0.12)');

    fg.addColorStop(B_PX / MAX_R, 'rgba(56,189,248,0.10)');

    fg.addColorStop(C_PX / MAX_R, 'rgba(167,139,250,0.08)');

    fg.addColorStop(1, 'rgba(16,185,129,0.0)');

    gx.fillStyle = fg; gx.fill();



    /* "B = 0" no exterior */

    gx.fillStyle = '#10b981'; gx.font = '8px Space Mono, monospace';

    gx.textAlign = 'center'; gx.textBaseline = 'middle';

    gx.fillText('B = 0', rx((C_PX + MAX_R) / 2), PAD.t + ph * 0.45);



    /* marcador do r atual */

    const col = regionColor(r);

    const bv  = Bnorm(r);

    const mx  = rx(r);

    const my  = ry(bv);



    gx.strokeStyle = col; gx.lineWidth = 1.2; gx.setLineDash([4, 4]);

    gx.beginPath(); gx.moveTo(mx, PAD.t + ph); gx.lineTo(mx, my); gx.stroke();

    gx.setLineDash([]);



    gx.beginPath(); gx.arc(mx, my, 4.5, 0, Math.PI * 2);

    gx.fillStyle = col;

    gx.shadowColor = col; gx.shadowBlur = 12; gx.fill(); gx.shadowBlur = 0;



    /* label B = ... */

    gx.fillStyle = col; gx.font = '8px Space Mono, monospace';

    gx.textAlign = mx > GW * 0.65 ? 'right' : 'left';

    gx.textBaseline = 'bottom';

    gx.fillText('B = ' + bv.toFixed(3) + ' B₀',

        mx + (mx > GW * 0.65 ? -6 : 6), my - 3);

    }



    /* ════════ ATUALIZAR CARDS ════════ */

    function updateCards() {

    const col  = regionColor(r);

    const bv   = Bnorm(r);



    document.getElementById('coax-r-val').textContent = (r * SCALE).toFixed(1) + ' mm';



    const regEl = document.getElementById('coax-region');

    regEl.textContent = regionName(r);

    regEl.style.color = col;



    const bEl = document.getElementById('coax-bval');

    bEl.textContent = bv.toFixed(4) + ' B₀';

    bEl.style.color = col;



    const iEl = document.getElementById('coax-ienc');

    iEl.textContent = regionIenc(r);

    iEl.style.color = col;



    document.getElementById('coax-insight').textContent = regionInsight(r);

    }



    /* ════════ LOOP DE ANIMAÇÃO ════════ */

    let _running = false;

    let _rafId = null;

    let _started = false;

    function loop(ts) {

    if (!_running) return;

    phase = ts / 900;

    drawCross();

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



    /* ════════ HANDLER DO SLIDER ════════ */

    window.coaxUpdateAll = function () {

    r = +document.getElementById('coax-r').value;

    updateCards();

    };



    /* ── Inicialização ── */

    updateCards();

    window.__ampereController = { start, stop };



})();