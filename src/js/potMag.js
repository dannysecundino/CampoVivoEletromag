(function () {

    'use strict';



    /* ════════════════════════════════════════════════════════════

    FÍSICA



    CENÁRIO — Espira quadrada de lado L, centrada na origem,

    no plano xy, com simetria de rotação em torno de z:



    No eixo z (ρ=0), cada elemento de corrente dl possui um elemento

    espelhado do lado oposto da espira. Para um ponto sobre o eixo,

    as duas contribuições de A têm o mesmo módulo e direções opostas

    no plano, então se cancelam aos pares:



        A(0,0,z) = 0  para todo z



    Isso não significa ausência de campo magnético. O campo B depende

    de como A varia ao redor do ponto, não do valor de A exatamente nele.

    ════════════════════════════════════════════════════════════ */



    const MU0 = 4 * Math.PI * 1e-7; /* T·m/A */



    function B_squareLoopAxis(I, L_m, z_m) {

    const halfL = L_m / 2;

    const r2 = halfL * halfL + z_m * z_m;

    const term = (4 * MU0 * I * halfL * halfL) / (4 * Math.PI * r2 * Math.sqrt(r2 + halfL * halfL));

    return term;

    }



    const canvas = document.getElementById('av-canvas');

    if (!canvas) return;



    const ctx = canvas.getContext('2d');

    const CW = canvas.width;

    const CH = canvas.height;



    let phase = 0;

    let I_loop = 5;

    let L_cm = 12;

    let z_cm = 8;



    /* projeção isométrica:

    x aparece à esquerda, y à direita e z para cima */

    const ISO_SCALE = 5.0;

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



    function drawAxes3D() {

    const Lax = 22;

    const axes = [

        { dx: Lax, dy: 0, dz: 0, col: '#f43f5e', label: 'x' },

        { dx: 0, dy: Lax, dz: 0, col: '#10b981', label: 'y' },

        { dx: 0, dy: 0, dz: Lax, col: '#38bdf8', label: 'z' },

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

    }



    function drawSquareLoop() {

    const half = L_cm * 0.42;

    const corners = [

        project(-half, -half, 0),

        project(half, -half, 0),

        project(half, half, 0),

        project(-half, half, 0)

    ];



    ctx.save();

    ctx.strokeStyle = '#f59e0b';

    ctx.lineWidth = 2.6;

    ctx.lineJoin = 'round';

    ctx.beginPath();

    ctx.moveTo(corners[0].px, corners[0].py);

    corners.slice(1).forEach(p => ctx.lineTo(p.px, p.py));

    ctx.closePath();

    ctx.stroke();

    ctx.restore();



    /* setas de corrente ao longo dos lados */

    for (let side = 0; side < 4; side++) {

        const a = corners[side];

        const b = corners[(side + 1) % 4];

        const mx = (a.px + b.px) / 2;

        const my = (a.py + b.py) / 2;

        const ang = Math.atan2(b.py - a.py, b.px - a.px);



        ctx.save();

        ctx.fillStyle = '#fbbf24';

        ctx.beginPath();

        ctx.moveTo(mx + Math.cos(ang) * 7, my + Math.sin(ang) * 7);

        ctx.lineTo(mx - Math.cos(ang - 0.5) * 6, my - Math.sin(ang - 0.5) * 6);

        ctx.lineTo(mx - Math.cos(ang + 0.5) * 6, my - Math.sin(ang + 0.5) * 6);

        ctx.closePath();

        ctx.fill();

        ctx.restore();

    }



    const pLbl = project(half * 1.3, 0, 0);

    ctx.save();

    ctx.fillStyle = '#f59e0b';

    ctx.font = '10px Space Mono';

    ctx.textAlign = 'left';

    ctx.textBaseline = 'middle';

    ctx.fillText('I = ' + I_loop.toFixed(1) + ' A, L = ' + L_cm.toFixed(1) + ' cm', pLbl.px + 6, pLbl.py);

    ctx.restore();

    }



    function drawLoopScene() {

    ctx.clearRect(0, 0, CW, CH);

    ctx.fillStyle = '#07090f';

    ctx.fillRect(0, 0, CW, CH);



    /* grade de chão */

    ctx.save();

    ctx.strokeStyle = '#1c2d45';

    ctx.lineWidth = 0.4;

    ctx.globalAlpha = 0.3;

    for (let i = -20; i <= 20; i += 10) {

        const p1 = project(i, -20, 0);

        const p2 = project(i, 20, 0);

        ctx.beginPath();

        ctx.moveTo(p1.px, p1.py);

        ctx.lineTo(p2.px, p2.py);

        ctx.stroke();



        const p3 = project(-20, i, 0);

        const p4 = project(20, i, 0);

        ctx.beginPath();

        ctx.moveTo(p3.px, p3.py);

        ctx.lineTo(p4.px, p4.py);

        ctx.stroke();

    }

    ctx.restore();



    drawAxes3D();

    drawSquareLoop();



    /* ponto de inspeção no eixo z */

    const zVis = z_cm * 0.85;

    const pC = project(0, 0, 0);

    const pZ = project(0, 0, zVis);



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

    ctx.arc(pZ.px, pZ.py, 6, 0, Math.PI * 2);

    ctx.fill();

    ctx.restore();



    /* símbolo de zero / cancelamento */

    ctx.save();

    ctx.strokeStyle = '#4b6080';

    ctx.lineWidth = 2;

    ctx.beginPath();

    ctx.arc(pZ.px, pZ.py, 16, 0, Math.PI * 2);

    ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(pZ.px - 11, pZ.py + 11);

    ctx.lineTo(pZ.px + 11, pZ.py - 11);

    ctx.stroke();

    ctx.restore();



    ctx.save();

    ctx.fillStyle = '#a78bfa';

    ctx.font = '9px Space Mono';

    ctx.textAlign = 'left';

    ctx.textBaseline = 'top';

    ctx.fillText('z = ' + z_cm.toFixed(1) + ' cm  →  A = 0', pZ.px + 20, pZ.py - 6);

    ctx.restore();



    /* pares de lados opostos com cancelamento visual */

    const half = L_cm * 0.42;

    const pairs = [

        [project(-half, 0, 0), project(half, 0, 0)],

        [project(0, -half, 0), project(0, half, 0)],

    ];



    ctx.save();

    ctx.strokeStyle = 'rgba(167,139,250,0.35)';

    ctx.lineWidth = 1;

    ctx.setLineDash([3, 3]);

    pairs.forEach(([a, b]) => {

        ctx.beginPath();

        ctx.moveTo(a.px, a.py);

        ctx.lineTo(b.px, b.py);

        ctx.stroke();

    });

    ctx.setLineDash([]);

    ctx.restore();

    }



    function updateUI() {

    const Bz = B_squareLoopAxis(I_loop, L_cm / 100, z_cm / 100);



    document.getElementById('av-aloop').textContent = '0,000000 T·m';

    document.getElementById('av-bloop').textContent = Bz.toExponential(2) + ' T';



    let msg;

    if (Math.abs(z_cm) < 0.5) {

        msg = 'No centro da espira, o cancelamento é completo: cada lado tem um lado oposto à mesma distância do ponto, e as contribuições de A se anulam exatamente. A simetria não deixa sobra de direção no plano, então A = 0.';

    } else {

        msg = `Em z = ${z_cm.toFixed(1)} cm, o mesmo cancelamento continua valendo. O ponto está sobre o eixo de simetria, então cada segmento da espira encontra um segmento espelhado que produz contribuição igual e oposta. Por isso, A(0,0,z) permanece exatamente zero para qualquer z.`;

    }

    msg += ' O fato de A ser zero não elimina o campo magnético: B depende de como A varia ao redor do ponto, não do valor pontual de A.';

    document.getElementById('av-insight').textContent = msg;

    }



    let _running = false;

    let _rafId = null;

    let _started = false;

    function loop() {

    if (!_running) return;

    phase += 0.02;

    drawLoopScene();

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



    window.avUpd = function () {

    I_loop = parseFloat(document.getElementById('av-si').value);

    L_cm = parseFloat(document.getElementById('av-sl').value);

    z_cm = parseFloat(document.getElementById('av-sz').value);



    document.getElementById('av-li').textContent = I_loop.toFixed(1) + ' A';

    document.getElementById('av-ll').textContent = L_cm.toFixed(1) + ' cm';

    document.getElementById('av-lz').textContent = z_cm.toFixed(1) + ' cm';

    };



    avUpd();

    window.__potencialMagController = { start, stop };

})();