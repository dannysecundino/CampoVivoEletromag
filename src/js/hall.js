(function () {

    'use strict';



    /* ── Canvas ── */

    const canvas = document.getElementById('hall-canvas');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const W = canvas.width, H = canvas.height;



    /* ── Geometria do condutor no canvas ── */

    const COND = {

    x: W * 0.18,         /* borda esquerda  */

    y: H * 0.22,         /* borda superior  */

    w: W * 0.64,         /* largura         */

    h: H * 0.56,         /* altura          */

    };

    const COND_CX = COND.x + COND.w / 2;

    const COND_CY = COND.y + COND.h / 2;



    /* ── Constantes físicas para cálculo ── */

    const N_DENSITY = 8.5e28;  /* elétrons/m³ — cobre */

    const Q_E       = 1.6e-19; /* C */

    /* dimensão transversal real assumida: largura do condutor = 5 mm */

    const W_COND_M  = 5e-3;    /* m */

    /* seção transversal para cálculo de v_d: 5 mm × 1 mm */

    const A_COND    = 5e-6;    /* m² */



    /* ── Estado ── */

    let I_amp = 3.0;   /* Amperes */

    let B_T   = 1.0;   /* Tesla   */



    /* ── Partículas (elétrons animados) ── */

    const N_PARTICLES = 28;

    const particles = [];



    function initParticles() {

    particles.length = 0;

    for (let i = 0; i < N_PARTICLES; i++) {

        particles.push({

        x:     COND.x + Math.random() * COND.w,

        y:     COND.y + Math.random() * COND.h,

        baseY: COND.y + Math.random() * COND.h,  /* posição vertical "natural" */

        vx:    -(1.5 + Math.random() * 1.5),      /* elétrons da direita p/ esquerda */

        vy:    0,

        phase: Math.random() * Math.PI * 2,

        r:     2.8 + Math.random() * 1.5,

        });

    }

    }

    initParticles();



    /* acúmulo vertical: quanto cada elétron foi desviado (0 = nenhum, 1 = máximo) */

    let accumulation = 0;   /* 0→1, animado suavemente */

    let targetAcc    = 0;



    /* ── Física ── */

    function calcPhysics() {

    /* velocidade de deriva: v_d = I / (n·q·A) */

    const v_d = I_amp / (N_DENSITY * Q_E * A_COND);  /* m/s */



    /* Força magnética sobre 1 elétron: F_B = q·v_d·B */

    const F_B = Q_E * v_d * B_T;



    /* Campo Hall de equilíbrio: E_H = v_d · B */

    const E_H = v_d * B_T;



    /* Força elétrica de Hall sobre 1 elétron: F_E = q·E_H (opõe F_B no equilíbrio) */

    const F_E = Q_E * E_H;



    /* Tensão Hall: V_H = E_H · w  (w = largura do condutor) */

    const V_H = E_H * W_COND_M;



    /* acúmulo visual normalizado */

    targetAcc = Math.min(1, (I_amp / 6) * (B_T / 3) * 1.4);



    return { F_B, F_E, E_H, V_H };

    }



    /* ── Atualizar UI ── */

    function updateUI() {

    const { F_B, F_E, E_H, V_H } = calcPhysics();



    document.getElementById('hall-i-val').textContent = I_amp.toFixed(1) + ' A';

    document.getElementById('hall-b-val').textContent = B_T.toFixed(2) + ' T';



    const active = B_T > 0 && I_amp > 0;



    /* Força magnética */

    const fbEl = document.getElementById('hall-fb');

    fbEl.textContent = active ? F_B.toExponential(2) + ' N' : '0,00 N';

    fbEl.style.color = active ? '#f43f5e' : '#4b6080';



    /* Força elétrica de Hall */

    const feEl = document.getElementById('hall-fe');

    feEl.textContent = active ? F_E.toExponential(2) + ' N' : '0,00 N';

    feEl.style.color = active ? '#38bdf8' : '#4b6080';



    /* Campo Hall */

    const ehEl = document.getElementById('hall-eh');

    ehEl.textContent = active ? E_H.toExponential(2) + ' V/m' : '0,00 V/m';

    ehEl.style.color = active ? '#a78bfa' : '#4b6080';



    /* Tensão Hall */

    const vhEl = document.getElementById('hall-vh');

    if (!active) {

        vhEl.textContent = '0,00 µV';

        vhEl.style.color = '#4b6080';

    } else {

        const V_H_uV = V_H * 1e6;

        if (V_H_uV < 1000) {

        vhEl.textContent = V_H_uV.toFixed(2) + ' µV';

        } else {

        vhEl.textContent = (V_H * 1000).toFixed(3) + ' mV';

        }

        vhEl.style.color = '#10b981';

    }



    /* insight */

    const ins = document.getElementById('hall-insight');

    if (I_amp < 0.1) {

        ins.textContent = 'Sem corrente: os elétrons não se movem, não há força magnética e o efeito Hall não ocorre.';

    } else if (B_T < 0.05) {

        ins.textContent = 'Sem campo magnético: os elétrons fluem em linha reta, F_B = 0 e nenhuma tensão Hall surge.';

    } else if (accumulation < 0.2) {

        ins.textContent = 'F_B (vermelha) empurra os elétrons para baixo. O acúmulo ainda é pequeno.';

    } else if (accumulation < 0.6) {

        ins.textContent = 'Elétrons se acumulando na borda inferior!';

    } else {

        ins.textContent = 'Grandes forças magnética e elétrica!';

    }

    }



    /* ── Desenho ── */

    function drawBackground() {

    ctx.fillStyle = '#07090f';

    ctx.fillRect(0, 0, W, H);



    /* grid sutil */

    ctx.save();

    ctx.strokeStyle = '#111e30';

    ctx.lineWidth = 0.5;

    for (let gx = 0; gx <= W; gx += 40) {

        ctx.beginPath(); ctx.moveTo(gx, 0); ctx.lineTo(gx, H); ctx.stroke();

    }

    for (let gy = 0; gy <= H; gy += 40) {

        ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke();

    }

    ctx.restore();

    }



    function drawBField() {

    if (B_T < 0.05) return;

    const alpha = Math.min(0.7, B_T / 3);

    const spacing = 38;

    const rows = Math.ceil(H / spacing);

    const cols = Math.ceil(W / spacing);



    ctx.save();

    ctx.fillStyle = `rgba(167,139,250,${alpha * 0.55})`;

    ctx.font = `${11 + B_T * 3}px monospace`;

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';



    for (let r = 0; r <= rows; r++) {

        for (let c = 0; c <= cols; c++) {

        /* ⊗ = campo entrando na tela (por convenção: B apontando para dentro) */

        ctx.fillText('⊙', c * spacing + 19, r * spacing + 19);

        }

    }

    ctx.restore();



    /* rótulo B */

    ctx.save();

    ctx.font = 'bold 11px Space Mono, monospace';

    ctx.fillStyle = `rgba(167,139,250,${alpha})`;

    ctx.textAlign = 'right'; ctx.textBaseline = 'top';

    ctx.fillText('B ⊙  (saindo)', W - 10, 8);

    ctx.restore();

    }



    function drawConductor() {

    const { x, y, w, h } = COND;

    const r = 10; /* cantos arredondados */



    ctx.save();



    /* sombra / glow */

    ctx.shadowColor = 'rgba(56,189,248,0.15)';

    ctx.shadowBlur = 20;



    /* corpo do condutor */

    ctx.beginPath();

    ctx.moveTo(x + r, y);

    ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r);

    ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);

    ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r);

    ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);

    ctx.closePath();

    ctx.fillStyle = '#0d1f35';

    ctx.fill();

    ctx.strokeStyle = '#1c3a5c';

    ctx.lineWidth = 1.5;

    ctx.stroke();

    ctx.shadowBlur = 0;



    /* bordas com acúmulo de carga */

    const acc = accumulation;



    /* ── borda inferior: elétrons acumulados (carga −) ── */

    if (acc > 0.02) {

        const negAlpha = acc * 0.85;

        /* gradiente de borda */

        const gradNeg = ctx.createLinearGradient(x, y + h - 14, x, y + h);

        gradNeg.addColorStop(0, `rgba(56,189,248,0)`);

        gradNeg.addColorStop(1, `rgba(56,189,248,${negAlpha * 0.4})`);

        ctx.fillStyle = gradNeg;

        ctx.beginPath();

        ctx.moveTo(x, y + h - 14);

        ctx.lineTo(x + w, y + h - 14);

        ctx.lineTo(x + w - r, y + h); ctx.lineTo(x + r, y + h);

        ctx.quadraticCurveTo(x, y + h, x, y + h - r);

        ctx.closePath();

        ctx.fill();



        /* linha de borda iluminada */

        ctx.strokeStyle = `rgba(56,189,248,${negAlpha})`;

        ctx.lineWidth = 2;

        ctx.beginPath(); ctx.moveTo(x + r, y + h); ctx.lineTo(x + w - r, y + h); ctx.stroke();

    }



    /* ── borda superior: deficiência de elétrons (carga +) ── */

    if (acc > 0.02) {

        const posAlpha = acc * 0.85;

        const gradPos = ctx.createLinearGradient(x, y, x, y + 14);

        gradPos.addColorStop(0, `rgba(244,63,94,${posAlpha * 0.4})`);

        gradPos.addColorStop(1, `rgba(244,63,94,0)`);

        ctx.fillStyle = gradPos;

        ctx.beginPath();

        ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y);

        ctx.quadraticCurveTo(x + w, y, x + w, y + r);

        ctx.lineTo(x + w, y + 14); ctx.lineTo(x, y + 14);

        ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y);

        ctx.closePath();

        ctx.fill();



        ctx.strokeStyle = `rgba(244,63,94,${posAlpha})`;

        ctx.lineWidth = 2;

        ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.stroke();

    }



    ctx.restore();

    }



    function drawChargeLabels() {

    const acc = accumulation;

    if (acc < 0.05) return;

    const { x, y, w, h } = COND;

    const alpha = Math.min(1, acc * 1.4);



    ctx.save();

    ctx.font = `bold ${10 + acc * 8}px Space Grotesk, sans-serif`;

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';



    /* "−" na borda inferior */

    ctx.fillStyle = `rgba(56,189,248,${alpha})`;

    ctx.fillText('− − − − (elétrons acumulados)', x + 8, y + h - 7);



    /* "+" na borda superior */

    ctx.fillStyle = `rgba(244,63,94,${alpha})`;

    ctx.fillText('+ + + + (falta de elétrons)', x + 8, y + 8);



    ctx.restore();

    }



    function drawVoltmeter() {

    const acc = accumulation;

    const { x, y, w, h } = COND;

    if (acc < 0.05) return;



    /* Voltímetro na direita do condutor */

    const vx = x + w + 22;

    const vy = COND_CY;

    const alpha = Math.min(1, acc * 1.5);



    ctx.save();



    /* fios conectores */

    ctx.strokeStyle = `rgba(16,185,129,${alpha * 0.7})`;

    ctx.lineWidth = 1.5;

    ctx.setLineDash([4,4]);

    /* fio superior (+ borda) */

    ctx.beginPath(); ctx.moveTo(x + w, y + 6); ctx.lineTo(vx + 18, y + 6);

    ctx.lineTo(vx + 18, vy - 20); ctx.stroke();

    /* fio inferior (− borda) */

    ctx.beginPath(); ctx.moveTo(x + w, y + h - 6); ctx.lineTo(vx + 18, y + h - 6);

    ctx.lineTo(vx + 18, vy + 20); ctx.stroke();

    ctx.setLineDash([]);



    /* círculo do voltímetro */

    ctx.shadowColor = '#10b981';

    ctx.shadowBlur = 12 * alpha;

    ctx.beginPath(); ctx.arc(vx + 18, vy, 18, 0, Math.PI * 2);

    ctx.fillStyle = '#0d1f35';

    ctx.fill();

    ctx.strokeStyle = `rgba(16,185,129,${alpha})`;

    ctx.lineWidth = 1.5;

    ctx.stroke();

    ctx.shadowBlur = 0;



    /* "V" dentro */

    ctx.fillStyle = `rgba(16,185,129,${alpha})`;

    ctx.font = 'bold 12px Space Grotesk, sans-serif';

    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

    ctx.fillText('V', vx + 18, vy);



    /* rótulo V_H */

    const { V_H } = calcPhysics();

    const V_H_uV = V_H * 1e6;

    const label = V_H_uV < 1000

        ? V_H_uV.toFixed(1) + ' µV'

        : (V_H * 1000).toFixed(2) + ' mV';



    ctx.fillStyle = `rgba(16,185,129,${alpha})`;

    ctx.font = `bold 9px Space Mono, monospace`;

    ctx.textAlign = 'center'; ctx.textBaseline = 'top';

    ctx.fillText('V_H = ' + label, vx + 18, vy + 22);



    ctx.restore();

    }



    function drawCurrentArrows() {

    const speed = Math.max(0, I_amp / 6);

    if (speed < 0.05) return;



    const { x, y, w, h } = COND;

    const alpha = speed * 0.7;

    const arrowY = COND_CY;



    /* seta de corrente (I da esquerda p/ direita convencionalmente) */

    ctx.save();

    ctx.strokeStyle = `rgba(245,158,11,${alpha})`;

    ctx.fillStyle   = `rgba(245,158,11,${alpha})`;

    ctx.lineWidth = 2;



    /* cabo entrando pela esquerda */

    ctx.beginPath(); ctx.moveTo(x - 40, arrowY); ctx.lineTo(x, arrowY); ctx.stroke();

    /* seta cabeça */

    ctx.beginPath();

    ctx.moveTo(x, arrowY);

    ctx.lineTo(x - 10, arrowY - 5); ctx.lineTo(x - 10, arrowY + 5);

    ctx.closePath(); ctx.fill();



    /* cabo saindo pela direita */

    ctx.beginPath(); ctx.moveTo(x + w, arrowY); ctx.lineTo(x + w + 40, arrowY); ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(x + w + 40, arrowY);

    ctx.lineTo(x + w + 30, arrowY - 5); ctx.lineTo(x + w + 30, arrowY + 5);

    ctx.closePath(); ctx.fill();



    /* rótulo I */

    ctx.font = 'bold 10px Space Mono, monospace';

    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';

    ctx.fillText('I →', x - 18, arrowY - 3);

    ctx.fillText('I →', x + w + 22, arrowY - 3);



    ctx.restore();

    }



    function drawLorentzArrow() {

    const acc = accumulation;

    if (acc < 0.05 || I_amp < 0.1 || B_T < 0.05) return;

    const alpha = Math.min(1, acc * 1.3);



    /* seta F_B apontando para baixo */

    const sx = COND_CX + 55, sy = COND_CY - 14, ey = COND_CY + 14;



    ctx.save();

    ctx.strokeStyle = `rgba(244,63,94,${alpha})`;

    ctx.fillStyle   = `rgba(244,63,94,${alpha})`;

    ctx.lineWidth = 2.2;

    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, ey); ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(sx, ey);

    ctx.lineTo(sx - 5, ey - 9); ctx.lineTo(sx + 5, ey - 9);

    ctx.closePath(); ctx.fill();



    ctx.font = '9px Space Mono, monospace';

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';

    ctx.fillText('F_B ↓', sx + 7, COND_CY);

    ctx.restore();

    }



    function drawElectricForceArrow() {

    const acc = accumulation;

    /* F_E só aparece quando há acúmulo significativo */

    if (acc < 0.12 || I_amp < 0.1 || B_T < 0.05) return;

    const alpha = Math.min(1, (acc - 0.12) * 2.0);



    /* seta F_E apontando para cima (opõe F_B) */

    const sx = COND_CX - 20, sy = COND_CY + 14, ey = COND_CY - 14;



    ctx.save();

    ctx.strokeStyle = `rgba(56,189,248,${alpha})`;

    ctx.fillStyle   = `rgba(56,189,248,${alpha})`;

    ctx.lineWidth = 2.2;

    ctx.beginPath(); ctx.moveTo(sx, sy); ctx.lineTo(sx, ey); ctx.stroke();

    ctx.beginPath();

    ctx.moveTo(sx, ey);

    ctx.lineTo(sx - 5, ey + 9); ctx.lineTo(sx + 5, ey + 9);

    ctx.closePath(); ctx.fill();



    ctx.font = '9px Space Mono, monospace';

    ctx.textAlign = 'right'; ctx.textBaseline = 'middle';

    ctx.fillText('F_E ↑', sx - 7, COND_CY);

    ctx.restore();

    }



    function drawParticles(ts) {

    const speed      = Math.max(0, I_amp / 6);   /* 0→1 */

    const deflection = accumulation;              /* 0→1 */

    const { x, y, w, h } = COND;



    particles.forEach(p => {

        /* movimento horizontal (elétrons da direita → esquerda, convenção) */

        p.x -= speed * 1.8;

        if (p.x < x - 4) p.x = x + w + 4;



        /* desvio vertical: elétrons acumulam na borda inferior */

        const targetY = y + h * (0.5 + deflection * 0.36) + Math.sin(ts * 0.001 + p.phase) * 3;

        p.y += (targetY - p.y) * 0.04;



        /* clip para dentro do condutor */

        p.y = Math.max(y + p.r + 1, Math.min(y + h - p.r - 1, p.y));



        /* desenha elétron */

        ctx.save();

        const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 2);

        grd.addColorStop(0, 'rgba(56,189,248,0.5)');

        grd.addColorStop(1, 'rgba(56,189,248,0)');

        ctx.fillStyle = grd;

        ctx.beginPath(); ctx.arc(p.x, p.y, p.r * 2, 0, Math.PI * 2); ctx.fill();



        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);

        ctx.fillStyle = '#38bdf8';

        ctx.shadowColor = '#38bdf8'; ctx.shadowBlur = 6;

        ctx.fill(); ctx.shadowBlur = 0;



        /* sinal "−" */

        ctx.fillStyle = '#07090f';

        ctx.font = `bold ${p.r + 3}px monospace`;

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        ctx.fillText('−', p.x, p.y + 0.5);

        ctx.restore();

    });

    }



    /* ── Loop principal ── */

    let _running = false;

    let _rafId = null;

    let _started = false;

    function loop(ts) {

    if (!_running) return;

    /* suaviza acúmulo */

    accumulation += (targetAcc - accumulation) * 0.04;



    drawBackground();

    drawBField();

    drawCurrentArrows();

    drawConductor();



    /* clip para desenhar partículas dentro do condutor */

    const { x, y, w, h } = COND;

    ctx.save();

    ctx.beginPath();

    ctx.rect(x + 1, y + 1, w - 2, h - 2);

    ctx.clip();

    drawParticles(ts);

    ctx.restore();



    drawChargeLabels();

    drawLorentzArrow();

    drawElectricForceArrow();

    drawVoltmeter();

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



    /* ── Handlers dos sliders ── */

    window.hallUpdate = function () {

    I_amp = +document.getElementById('hall-I').value;

    B_T   = +document.getElementById('hall-B').value;

    calcPhysics();

    updateUI();

    };



    /* ── Init ── */

    calcPhysics();

    updateUI();

    window.__hallController = { start, stop };



})();