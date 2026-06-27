(function () {

    /* ── Constantes físicas ── */

    const EPSILON_0 = 8.85e-12; /* F/m — permissividade do vácuo */



    /* ── Canvas ── */

    const canvas = document.getElementById('cap-canvas');

    if (!canvas) return; /* segurança: só roda se o elemento existir */

    const ctx = canvas.getContext('2d');

    const W = canvas.width, H = canvas.height;

    const CX = W / 2, CY = H / 2;



    /* ── Faixas reais usadas para o cálculo de C ──

    Área:      1 cm²  a  100 cm²   (slider 10–100 → 0,01 a 0,01 m² escalado)

    Distância: 0,5 mm a 10 mm

    Esses valores foram escolhidos para que C fique na faixa de pF,

    que é a ordem de grandeza típica de capacitores de placas paralelas reais. */

    function sliderToArea_m2(sliderVal) {

    /* sliderVal: 10–100 → área real: 1 cm² a 100 cm² → convertido para m² */

    const area_cm2 = sliderVal; /* 1:1 simples e didático */

    return area_cm2 * 1e-4; /* cm² → m² */

    }

    function sliderToDist_m(sliderVal) {

    /* sliderVal: 10–100 → distância real: 0,5 mm a 10 mm */

    const dist_mm = 0.5 + (sliderVal - 10) * (10 - 0.5) / (100 - 10);

    return dist_mm * 1e-3; /* mm → m */

    }



    /* ── Estado ── */

    let areaSlider = 55;

    let distSlider = 40;



    /* ── Geometria visual das placas no canvas ──

    A "largura visual" da placa (extensão horizontal, representando a área)

    varia de PLATE_MIN_W a PLATE_MAX_W conforme o slider de área.

    A separação vertical entre as placas varia de GAP_MIN a GAP_MAX

    conforme o slider de distância. */

    const PLATE_MIN_W = 90;

    const PLATE_MAX_W = 340;

    const PLATE_THICK = 10;

    const GAP_MIN = 30;

    const GAP_MAX = 170;



    function plateWidthPx(sliderVal) {

    const t = (sliderVal - 10) / (100 - 10);

    return PLATE_MIN_W + t * (PLATE_MAX_W - PLATE_MIN_W);

    }

    function gapPx(sliderVal) {

    const t = (sliderVal - 10) / (100 - 10);

    return GAP_MIN + t * (GAP_MAX - GAP_MIN);

    }



    /* ── Cálculo da capacitância (fórmula real) ── */

    function calcCapacitance() {

    const A = sliderToArea_m2(areaSlider);

    const d = sliderToDist_m(distSlider);

    const C = EPSILON_0 * A / d; /* Farad */

    return { A, d, C };

    }



    /* ── Formatação amigável de unidades ── */

    function formatArea(A_m2) {

    const A_cm2 = A_m2 * 1e4;

    return A_cm2.toFixed(1) + ' cm²';

    }

    function formatDist(d_m) {

    const d_mm = d_m * 1e3;

    return d_mm.toFixed(2) + ' mm';

    }

    function formatCapacitance(C_farad) {

    const C_pF = C_farad * 1e12;

    if (C_pF < 1000) return C_pF.toFixed(2) + ' pF';

    const C_nF = C_pF / 1000;

    return C_nF.toFixed(2) + ' nF';

    }



    /* ── Partículas de carga animadas nas placas ── */

    let chargePhase = 0;



    /* ── Desenho de fundo ── */

    function drawBackground() {

    const grad = ctx.createRadialGradient(CX, CY, 20, CX, CY, W * 0.7);

    grad.addColorStop(0, '#111827');

    grad.addColorStop(1, '#07090f');

    ctx.fillStyle = grad;

    ctx.fillRect(0, 0, W, H);

    }



    /* ── Desenho das linhas de campo elétrico entre as placas ── */

    function drawFieldLines(plateW, gap) {

    const topY = CY - gap / 2;

    const botY = CY + gap / 2;

    const startX = CX - plateW / 2 + plateW * 0.08;

    const endX = CX + plateW / 2 - plateW * 0.08;

    const nLines = Math.max(4, Math.round(plateW / 28));



    ctx.save();

    for (let i = 0; i < nLines; i++) {

        const x = startX + (i / (nLines - 1)) * (endX - startX);

        const alpha = 0.45;

        ctx.strokeStyle = `rgba(56,189,248,${alpha})`;

        ctx.lineWidth = 1.4;

        ctx.beginPath();

        ctx.moveTo(x, topY + 2);

        ctx.lineTo(x, botY - 2);

        ctx.stroke();



        /* seta indicando sentido do campo (de + para −, ou seja, de cima para baixo) */

        const midY = (topY + botY) / 2 + Math.sin(chargePhase * 2 + i) * 0;

        ctx.fillStyle = `rgba(56,189,248,${alpha + 0.15})`;

        ctx.beginPath();

        ctx.moveTo(x, midY + 5);

        ctx.lineTo(x - 4, midY - 3);

        ctx.lineTo(x + 4, midY - 3);

        ctx.closePath();

        ctx.fill();

    }

    ctx.restore();

    }



    /* ── Desenho das cargas (pontos +/−) ao longo das placas ── */

    function drawCharges(plateW, gap) {

    const topY = CY - gap / 2 - PLATE_THICK / 2;

    const botY = CY + gap / 2 + PLATE_THICK / 2;

    const margin = plateW * 0.09;

    const usableW = plateW - margin * 2;

    const n = Math.max(3, Math.round(plateW / 32));



    ctx.save();

    ctx.font = 'bold 11px Space Grotesk, sans-serif';

    ctx.textAlign = 'center';

    ctx.textBaseline = 'middle';



    for (let i = 0; i < n; i++) {

        const t = n === 1 ? 0.5 : i / (n - 1);

        const x = CX - usableW / 2 + t * usableW;



        /* placa superior: positiva */

        ctx.fillStyle = '#f43f5e';

        ctx.shadowColor = '#f43f5e';

        ctx.shadowBlur = 6;

        ctx.fillText('+', x, topY - 9);



        /* placa inferior: negativa */

        ctx.fillStyle = '#38bdf8';

        ctx.shadowColor = '#38bdf8';

        ctx.shadowBlur = 6;

        ctx.fillText('−', x, botY + 9);

    }

    ctx.shadowBlur = 0;

    ctx.restore();

    }



    /* ── Desenho das placas metálicas ── */

    function drawPlates(plateW, gap) {

    const topY = CY - gap / 2 - PLATE_THICK / 2;

    const botY = CY + gap / 2 - PLATE_THICK / 2;



    /* placa superior */

    const gradTop = ctx.createLinearGradient(0, topY, 0, topY + PLATE_THICK);

    gradTop.addColorStop(0, '#fecdd3');

    gradTop.addColorStop(0.5, '#f43f5e');

    gradTop.addColorStop(1, '#9f1239');

    ctx.save();

    ctx.shadowColor = 'rgba(244,63,94,0.45)';

    ctx.shadowBlur = 16;

    ctx.fillStyle = gradTop;

    roundRect(ctx, CX - plateW / 2, topY, plateW, PLATE_THICK, 3);

    ctx.fill();

    ctx.restore();



    /* placa inferior */

    const gradBot = ctx.createLinearGradient(0, botY, 0, botY + PLATE_THICK);

    gradBot.addColorStop(0, '#1e40af');

    gradBot.addColorStop(0.5, '#38bdf8');

    gradBot.addColorStop(1, '#bae6fd');

    ctx.save();

    ctx.shadowColor = 'rgba(56,189,248,0.45)';

    ctx.shadowBlur = 16;

    ctx.fillStyle = gradBot;

    roundRect(ctx, CX - plateW / 2, botY, plateW, PLATE_THICK, 3);

    ctx.fill();

    ctx.restore();



    return { topY, botY };

    }



    function roundRect(ctx, x, y, w, h, r) {

    ctx.beginPath();

    ctx.moveTo(x + r, y);

    ctx.lineTo(x + w - r, y);

    ctx.quadraticCurveTo(x + w, y, x + w, y + r);

    ctx.lineTo(x + w, y + h - r);

    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);

    ctx.lineTo(x + r, y + h);

    ctx.quadraticCurveTo(x, y + h, x, y + h - r);

    ctx.lineTo(x, y + r);

    ctx.quadraticCurveTo(x, y, x + r, y);

    ctx.closePath();

    }



    /* ── Rótulos de área e distância no canvas ── */

    function drawLabels(plateW, gap) {

    ctx.save();



    /* rótulo de distância (seta vertical à direita das placas) */

    const labelX = CX + plateW / 2 + 26;

    const topY = CY - gap / 2;

    const botY = CY + gap / 2;



    ctx.strokeStyle = 'rgba(245,158,11,0.7)';

    ctx.fillStyle = 'rgba(245,158,11,0.9)';

    ctx.lineWidth = 1.3;



    /* linha vertical com setas duplas */

    ctx.beginPath();

    ctx.moveTo(labelX, topY);

    ctx.lineTo(labelX, botY);

    ctx.stroke();



    /* seta topo */

    ctx.beginPath();

    ctx.moveTo(labelX, topY);

    ctx.lineTo(labelX - 4, topY + 7);

    ctx.lineTo(labelX + 4, topY + 7);

    ctx.closePath();

    ctx.fill();



    /* seta base */

    ctx.beginPath();

    ctx.moveTo(labelX, botY);

    ctx.lineTo(labelX - 4, botY - 7);

    ctx.lineTo(labelX + 4, botY - 7);

    ctx.closePath();

    ctx.fill();



    /* texto "d" */

    ctx.font = 'bold 13px Space Mono, monospace';

    ctx.textAlign = 'left';

    ctx.textBaseline = 'middle';

    ctx.fillText('d', labelX + 8, CY);



    /* rótulo de área (seta horizontal abaixo das placas) */

    const labelY = CY + gap / 2 + PLATE_THICK + 28;

    const leftX = CX - plateW / 2;

    const rightX = CX + plateW / 2;



    ctx.strokeStyle = 'rgba(56,189,248,0.7)';

    ctx.fillStyle = 'rgba(56,189,248,0.9)';



    ctx.beginPath();

    ctx.moveTo(leftX, labelY);

    ctx.lineTo(rightX, labelY);

    ctx.stroke();



    ctx.beginPath();

    ctx.moveTo(leftX, labelY);

    ctx.lineTo(leftX + 7, labelY - 4);

    ctx.lineTo(leftX + 7, labelY + 4);

    ctx.closePath();

    ctx.fill();



    ctx.beginPath();

    ctx.moveTo(rightX, labelY);

    ctx.lineTo(rightX - 7, labelY - 4);

    ctx.lineTo(rightX - 7, labelY + 4);

    ctx.closePath();

    ctx.fill();



    ctx.textAlign = 'center';

    ctx.textBaseline = 'top';

    ctx.fillText('A (área da placa)', CX, labelY + 6);



    ctx.restore();

    }



    /* ── Render principal ── */

    function render() {

    const plateW = plateWidthPx(areaSlider);

    const gap = gapPx(distSlider);



    drawBackground();

    drawFieldLines(plateW, gap);

    drawPlates(plateW, gap);

    drawCharges(plateW, gap);

    drawLabels(plateW, gap);



    chargePhase += 0.02;

    // requestAnimationFrame chamado pelo loop externo

    }



    /* ── Atualização do painel de leitura ── */

    function updateReadout() {

    const { A, d, C } = calcCapacitance();



    document.getElementById('cap-a-val').textContent = formatArea(A);

    document.getElementById('cap-d-val').textContent = formatDist(d);



    document.getElementById('cap-read-a').textContent = formatArea(A);

    document.getElementById('cap-read-d').textContent = formatDist(d);

    document.getElementById('cap-read-c').textContent = formatCapacitance(C);



    /* barra de capacitância relativa (escala fixa baseada nos extremos do slider) */

    const A_max = sliderToArea_m2(100);

    const d_min = sliderToDist_m(10); /* menor distância possível = maior C */

    const C_max = EPSILON_0 * A_max / d_min;

    const pct = Math.min(100, (C / C_max) * 100);



    document.getElementById('cap-bar-fill').style.width = pct.toFixed(1) + '%';

    document.getElementById('cap-bar-pct').textContent = pct.toFixed(1) + '% do máximo';



    /* insight dinâmico */

    const insightEl = document.getElementById('cap-insight');

    const areaAlta = areaSlider > 70;

    const areaBaixa = areaSlider < 30;

    const distAlta = distSlider > 70;

    const distBaixa = distSlider < 30;



    let texto;

    if (areaAlta && distBaixa) {

        texto = 'Configuração ideal: placas grandes e bem próximas. A capacitância está perto do máximo possível nesta simulação — é assim que se projetam capacitores de alta capacidade em espaços pequenos.';

    } else if (areaBaixa && distAlta) {

        texto = 'Configuração de baixa capacitância: placas pequenas e afastadas. Pouco espaço de armazenamento e um campo elétrico fraco entre as placas — a capacitância está perto do mínimo.';

    } else if (areaAlta) {

        texto = 'Observe que a placa ficou visivelmente maior no canvas. Mais área significa mais espaço para acumular cargas elétricas em cada placa, aumentando a capacitância proporcionalmente.';

    } else if (areaBaixa) {

        texto = 'Placas pequenas armazenam menos carga para a mesma tensão aplicada. Repare como a capacitância caiu junto com a largura visual das placas.';

    } else if (distAlta) {

        texto = 'A distância entre as placas aumentou visivelmente. Isso enfraquece o campo elétrico entre elas e reduz a capacitância — note a queda no valor de C.';

    } else if (distBaixa) {

        texto = 'Placas bem próximas concentram um campo elétrico mais intenso na mesma região, o que aumenta a capacitância. É por isso que capacitores reais usam dielétricos finíssimos.';

    } else {

        texto = 'Aumentar a área (A) aumenta C; aumentar a distância (d) diminui C. Ajuste os controles e observe a barra de capacitância relativa responder em tempo real.';

    }

    insightEl.textContent = texto;

    }



    /* ── Handler global chamado pelos sliders ── */

    window.capUpdateAll = function () {

    areaSlider = +document.getElementById('cap-area').value;

    distSlider = +document.getElementById('cap-dist').value;

    updateReadout();

    };



    /* ── loop ── */

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



    /* ── Inicialização ── */

    updateReadout();

    window.__capacitoresController = { start, stop };



})();