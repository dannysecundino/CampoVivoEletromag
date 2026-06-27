(function(){

    'use strict';



    /* ════════════════════════════════════════════════════════════

    FÍSICA

    Modelamos o ímã como um dipolo magnético cujo campo axial,

    na posição da espira (centrada em x=0, no plano yz), seja

    aproximado por uma função tipo dipolo ao longo do eixo x:



        B(x) = B0 · m / (1 + (x/k)²)^(3/2)



    onde k é uma escala de decaimento ligada ao "tamanho" do ímã.

    Essa é a mesma forma funcional do campo de Biot-Savart no eixo

    de uma espira/dipolo — suave, simétrica, e que cai rapidamente

    com a distância, exatamente como um ímã real.



    Fluxo:      Φ(x) = B(x) · A          (A = área da espira)

    FEM:        ε = -dΦ/dt = -N·dΦ/dx · (dx/dt)

    Corrente:   I = ε / R                 (espira com resistência R)



    Lei de Lenz: o sinal de ε (e portanto de I) já contém a

    informação do sentido — a corrente sempre se opõe à VARIAÇÃO

    do fluxo, não ao fluxo em si. Usamos esse sinal diretamente

    para decidir o sentido de rotação desenhado na espira.

    ════════════════════════════════════════════════════════════ */



    const N = 1;         /* uma espira simples */

    const A = 1;          /* área normalizada (escala arbitrária didática) */

    const R = 2;          /* resistência da espira, em ohms (escala didática) */

    const K = 9;           /* escala de decaimento do campo do ímã, em cm */

    const B0 = 1.0;         /* magnitude base do campo do ímã */



    function Bfield(x_cm, magScale, poleSign){

    const denom = Math.pow(1 + (x_cm/K)*(x_cm/K), 1.5);

    return poleSign * B0 * magScale / denom;

    }



    function flux(x_cm, magScale, poleSign){

    return N * A * Bfield(x_cm, magScale, poleSign);

    }



    /* derivada numérica do fluxo em relação a x, para EMF precisa */

    function dFluxDx(x_cm, magScale, poleSign){

    const h = 0.05;

    return (flux(x_cm+h, magScale, poleSign) - flux(x_cm-h, magScale, poleSign)) / (2*h);

    }



    /* ── canvases ── */

    const ac = document.getElementById('far-anim');

    const gc = document.getElementById('far-graph');

    const actx = ac.getContext('2d');

    const gctx = gc.getContext('2d');

    const AW=ac.width, AH=ac.height, GW=gc.width, GH=gc.height;



    /* ── estado ── */

    let xPos = -12;        /* cm, posição do ímã no eixo horizontal */

    let autoSpeed = 0;      /* cm/s, velocidade automática (0 = parado) */

    let moveDir = 1;         /* +1 ou -1, sentido do movimento automático */

    let magScale = 1.0;       /* intensidade do ímã */

    let poleSign = 1;          /* +1 = polo N voltado para a espira, -1 = polo S */



    let lastX = xPos;           /* para fins de exibição de aproximar/afastar */

    let lastFlux = flux(xPos, magScale, poleSign); /* fluxo do frame anterior */

    let lastDt = 1/60;           /* dt do frame anterior, evita divisão por zero */

    let curEMF = 0, curCurrent = 0; /* calculados uma vez por frame no loop() */

    let phase = 0;

    const HIST = 320;

    let histEMF = new Array(HIST).fill(0);



    /* ── desenho da animação principal ── */

    function drawAnim(){

    actx.clearRect(0,0,AW,AH);

    actx.fillStyle='#07090f'; actx.fillRect(0,0,AW,AH);



    const CY = AH/2;

    const pxPerCm = (AW-80)/50; /* mapeia -25..+25 cm para a largura útil */

    const originX = AW/2;



    /* grade sutil */

    actx.save();

    actx.strokeStyle='#1c2d45'; actx.lineWidth=0.4; actx.globalAlpha=0.3;

    for(let x=0;x<=AW;x+=35){ actx.beginPath(); actx.moveTo(x,0); actx.lineTo(x,AH); actx.stroke(); }

    for(let y=0;y<=AH;y+=35){ actx.beginPath(); actx.moveTo(0,y); actx.lineTo(AW,y); actx.stroke(); }

    actx.restore();



    /* eixo x tracejado */

    actx.save();

    actx.strokeStyle='#243654'; actx.lineWidth=1; actx.setLineDash([5,4]);

    actx.beginPath(); actx.moveTo(20,CY); actx.lineTo(AW-20,CY); actx.stroke();

    actx.setLineDash([]);

    actx.restore();



    const xPx = originX + xPos*pxPerCm;



    const Phi  = flux(xPos, magScale, poleSign);

    /* emf e current já foram calculados uma vez por frame em loop() */

    const emf = curEMF;

    const current = curCurrent;



    /* ── ESPIRA (elipse representando o círculo visto em perspectiva) ── */

    const loopRX = 16, loopRY = 46;

    actx.save();

    actx.strokeStyle='#f59e0b'; actx.lineWidth=3;

    actx.beginPath();

    actx.ellipse(originX, CY, loopRX, loopRY, 0, 0, Math.PI*2);

    actx.stroke();

    actx.restore();



    /* corrente induzida: setas ao longo da espira, sentido conforme sinal de I */

    if(Math.abs(current) > 0.002){

        const dirSign = current > 0 ? 1 : -1; /* sentido de rotação visual */

        const nArrows = 6;

        actx.save();

        actx.fillStyle = '#fbbf24';

        for(let k=0;k<nArrows;k++){

        let t = (k/nArrows)*Math.PI*2 + phase*1.4*dirSign;

        const ex = originX + loopRX*Math.sin(t);

        const ey = CY + loopRY*Math.cos(t);

        const dt = 0.08*dirSign;

        const ex2 = originX + loopRX*Math.sin(t+dt);

        const ey2 = CY + loopRY*Math.cos(t+dt);

        const ang = Math.atan2(ey2-ey, ex2-ex);

        actx.beginPath();

        actx.moveTo(ex2,ey2);

        actx.lineTo(ex2-Math.cos(ang-0.45)*6, ey2-Math.sin(ang-0.45)*6);

        actx.lineTo(ex2-Math.cos(ang+0.45)*6, ey2-Math.sin(ang+0.45)*6);

        actx.closePath(); actx.fill();

        }

        actx.restore();

    }



    /* label espira */

    actx.save();

    actx.fillStyle='#f59e0b'; actx.font='9px Space Mono';

    actx.textAlign='center'; actx.textBaseline='top';

    actx.fillText('espira (R = '+R+'Ω)', originX, CY+loopRY+10);

    actx.restore();



    /* ── ÍMÃ (barra retangular com N e S) ── */

    const magW = 46, magH = 30;

    const magX = xPx, magY = CY;

    actx.save();

    actx.translate(magX, magY);



    /* metade conforme o polo voltado para a espira */

    const leftIsN  = poleSign>0 ? (xPos < 0) : (xPos >= 0);

    /* polo voltado para a espira: se ímã está à esquerda (x<0), o lado direito do ímã encara a espira */

    const facingRight = xPos < 0; /* se o ímã está à esquerda, o lado direito dele encara a espira (que está em x=0) */



    const nCol = '#f43f5e', sCol = '#38bdf8';

    /* desenha duas metades; a cor de cada metade depende de poleSign e da orientação física do ímã */

    const rightIsN = poleSign > 0; /* se poleSign=+1, convenciona-se polo N do lado "direito" do ímã (fixo no objeto) */



    actx.fillStyle = rightIsN ? sCol : nCol;

    actx.fillRect(-magW/2, -magH/2, magW/2, magH);

    actx.fillStyle = rightIsN ? nCol : sCol;

    actx.fillRect(0, -magH/2, magW/2, magH);



    actx.strokeStyle='#07090f'; actx.lineWidth=1.5;

    actx.strokeRect(-magW/2, -magH/2, magW, magH);



    actx.font='bold 13px Space Mono'; actx.textAlign='center'; actx.textBaseline='middle';

    actx.fillStyle='#07090f';

    actx.fillText(rightIsN?'S':'N', -magW/4, 0);

    actx.fillText(rightIsN?'N':'S', magW/4, 0);

    actx.restore();



    /* seta de movimento sob o ímã, se velocidade automática ativa */

    if(autoSpeed > 0.05){

        actx.save();

        actx.strokeStyle='#10b981'; actx.fillStyle='#10b981';

        actx.lineWidth=2;

        const dirArrow = moveDir;

        actx.beginPath();

        actx.moveTo(magX-14*dirArrow, magY+magH/2+16);

        actx.lineTo(magX+14*dirArrow, magY+magH/2+16);

        actx.stroke();

        const ang = dirArrow>0?0:Math.PI;

        actx.beginPath();

        actx.moveTo(magX+14*dirArrow, magY+magH/2+16);

        actx.lineTo(magX+14*dirArrow-Math.cos(ang-0.5)*7, magY+magH/2+16-Math.sin(ang-0.5)*7);

        actx.lineTo(magX+14*dirArrow-Math.cos(ang+0.5)*7, magY+magH/2+16-Math.sin(ang+0.5)*7);

        actx.closePath(); actx.fill();

        actx.restore();

    }



    /* linhas de campo do ímã, sutis, saindo do polo N */

    actx.save();

    actx.strokeStyle='rgba(244,63,94,0.15)'; actx.lineWidth=1;

    const nLines=5;

    for(let i=0;i<nLines;i++){

        const off=(i-(nLines-1)/2)*9;

        actx.beginPath();

        actx.moveTo(magX, magY+off);

        actx.quadraticCurveTo(magX+(originX-magX)*0.5, magY+off*2.2, originX, CY+off*0.5);

        actx.stroke();

    }

    actx.restore();



    /* label posição x */

    actx.save();

    actx.fillStyle='#a78bfa'; actx.font='9px Space Mono';

    actx.textAlign='center'; actx.textBaseline='top';

    actx.fillText('x = '+xPos.toFixed(1)+' cm', magX, magY+magH/2+ (autoSpeed>0.05?32:16));

    actx.restore();



    /* eixo central x=0 */

    actx.save();

    actx.strokeStyle='rgba(167,139,250,0.3)'; actx.lineWidth=1; actx.setLineDash([3,3]);

    actx.beginPath(); actx.moveTo(originX, 14); actx.lineTo(originX, AH-14); actx.stroke();

    actx.setLineDash([]);

    actx.fillStyle='rgba(167,139,250,0.6)'; actx.font='8px Space Mono';

    actx.textAlign='center'; actx.textBaseline='top';

    actx.fillText('x=0', originX, 4);

    actx.restore();

    }



    /* ── gráfico ε(t) e Φ(t) ── */

    function drawGraph(){

    gctx.clearRect(0,0,GW,GH);

    gctx.fillStyle='#07090f'; gctx.fillRect(0,0,GW,GH);



    const PAD={l:46,r:14,t:20,b:30};

    const pw=GW-PAD.l-PAD.r, ph=GH-PAD.t-PAD.b;

    const maxAbs = Math.max(...histEMF.map(v => Math.abs(v)), 0.05);

    const EMAX = maxAbs * 1.15;



    function gx(i){ return PAD.l + (i/HIST)*pw; }

    function gy(v){ return PAD.t + ph/2 - (v/EMAX)*(ph/2); }



    gctx.save();

    gctx.strokeStyle='#1c2d45'; gctx.lineWidth=0.5;

    [-1,-0.5,0,0.5,1].forEach(f=>{

        gctx.beginPath(); gctx.moveTo(PAD.l, gy(EMAX*f)); gctx.lineTo(PAD.l+pw, gy(EMAX*f)); gctx.stroke();

    });

    gctx.restore();



    gctx.save();

    gctx.strokeStyle='#243654'; gctx.lineWidth=1.2;

    gctx.beginPath(); gctx.moveTo(PAD.l,gy(0)); gctx.lineTo(PAD.l+pw,gy(0)); gctx.stroke();

    gctx.restore();



    /* curva da EMF ao longo do tempo */

    gctx.save();

    gctx.strokeStyle='#38bdf8'; gctx.lineWidth=2;

    gctx.shadowColor='#38bdf8'; gctx.shadowBlur=5;

    gctx.beginPath();

    histEMF.forEach((v,i)=>{ const y=Math.max(PAD.t,Math.min(PAD.t+ph,gy(v))); i===0?gctx.moveTo(gx(i),y):gctx.lineTo(gx(i),y); });

    gctx.stroke(); gctx.shadowBlur=0;

    gctx.restore();



    /* ponto atual */

    const cur = histEMF[histEMF.length-1];

    gctx.save();

    gctx.beginPath(); gctx.arc(gx(HIST-1), Math.max(PAD.t,Math.min(PAD.t+ph,gy(cur))), 5, 0, Math.PI*2);

    gctx.fillStyle = cur>=0 ? '#f43f5e' : '#38bdf8';

    gctx.shadowColor = gctx.fillStyle; gctx.shadowBlur=10;

    gctx.fill(); gctx.shadowBlur=0;

    gctx.restore();



    /* eixos */

    gctx.save();

    gctx.strokeStyle='#243654'; gctx.lineWidth=1.4;

    gctx.beginPath();

    gctx.moveTo(PAD.l,PAD.t); gctx.lineTo(PAD.l,PAD.t+ph); gctx.lineTo(PAD.l+pw,PAD.t+ph);

    gctx.stroke();

    gctx.fillStyle='#4b6080'; gctx.font='9px Space Mono';

    gctx.textAlign='center'; gctx.textBaseline='top';

    gctx.fillText('tempo →', PAD.l+pw/2, PAD.t+ph+14);

    gctx.save(); gctx.translate(12,PAD.t+ph/2); gctx.rotate(-Math.PI/2);

    gctx.textBaseline='middle'; gctx.fillText('ε (V)', 0,0); gctx.restore();

    [-1,0,1].forEach(f=>{

        gctx.textAlign='right'; gctx.textBaseline='middle';

        gctx.fillText((EMAX*f).toFixed(2), PAD.l-4, gy(EMAX*f));

    });

    gctx.restore();



    gctx.save();

    gctx.fillStyle='#2a3f5f'; gctx.font='9px Space Mono';

    gctx.textAlign='right'; gctx.textBaseline='top';

    gctx.fillText('ε = −N·dΦ/dt', PAD.l+pw, PAD.t-14);

    gctx.restore();

    }



    /* ── UI ── */

    function updateUI(){

    const Phi = flux(xPos, magScale, poleSign);

    const emf = curEMF;

    const current = curCurrent;



    document.getElementById('far-flux').textContent = Phi.toFixed(3)+' Wb';



    const emfEl = document.getElementById('far-emf');

    emfEl.textContent = (emf>=0?'+':'')+emf.toFixed(3)+' V';

    emfEl.style.color = Math.abs(emf)>0.01 ? (emf>0?'#f43f5e':'#38bdf8') : '#4b6080';



    const curEl = document.getElementById('far-cur');

    curEl.textContent = (current>=0?'+':'')+(current*1000).toFixed(1)+' mA';

    curEl.style.color = Math.abs(current)>0.005 ? (current>0?'#f43f5e':'#38bdf8') : '#4b6080';



    const dirEl = document.getElementById('far-dir');

    if(Math.abs(current) < 0.005){

        dirEl.textContent='— Sem indução';

        dirEl.style.color='#4b6080';

    } else {

        dirEl.textContent = current>0 ? '↻ Horário' : '↺ Anti-horário';

        dirEl.style.color = current>0 ? '#f43f5e' : '#38bdf8';

    }



    /* insight dinâmico */

    let msg;

    const movingNow = autoSpeed>0 ? true : Math.abs(xPos-lastX)>1e-6;

    const approaching = (xPos<0 && (autoSpeed>0?moveDir>0:(xPos-lastX)>0)) || (xPos>0 && (autoSpeed>0?moveDir<0:(xPos-lastX)<0));

    if(Math.abs(current) < 0.005){

        if(Math.abs(xPos) > 22){

        msg = 'O ímã está longe da espira — o campo magnético ali é fraco e quase não varia. Sem variação de fluxo, não há FEM induzida (Lei de Faraday: ε = −dΦ/dt).';

        } else {

        msg = 'Sem variação de fluxo, não há FEM. Mova o ímã, ative a velocidade automática, ou inverta o polo voltado para a espira para gerar indução.';

        }

    } else if(!movingNow){

        msg = `O ímã está parado, mas você acabou de inverter o polo voltado para a espira — isso muda o fluxo instantaneamente! Pela Lei de Faraday, essa variação súbita (mesmo sem movimento) gera uma FEM de pico, e a Lei de Lenz garante que a corrente induzida (${current>0?'horária':'anti-horária'}) se oponha a essa inversão.`;

    } else if(approaching){

        msg = `O ímã se aproxima da espira: o fluxo Φ está aumentando. Pela Lei de Lenz, a corrente induzida (${current>0?'horária':'anti-horária'}) cria seu próprio campo magnético que se OPÕE a esse aumento — tentando "empurrar" o ímã para longe.`;

    } else {

        msg = `O ímã se afasta da espira: o fluxo Φ está diminuindo. A corrente induzida (${current>0?'horária':'anti-horária'}) inverte de sentido em relação à aproximação, tentando agora "puxar" o ímã de volta — sempre se opondo à mudança, nunca à própria existência do fluxo.`;

    }

    document.getElementById('far-insight').textContent = msg;

    }



    /* ── loop ── */

    let _running = false;

    let _rafId = null;

    let _started = false;

    let lastTs=0;

    function loop(ts){

    if (!_running) return;

    const dt = Math.min((ts-lastTs)/1000, 0.05);

    lastTs = ts;

    phase += dt;



    const xBefore = xPos;



    if(autoSpeed > 0){

        xPos += autoSpeed*moveDir*dt;

        if(xPos > 25){ xPos = 25; moveDir = -1; }

        if(xPos < -25){ xPos = -25; moveDir = 1; }

        document.getElementById('far-sx').value = xPos;

        document.getElementById('far-lx').textContent = xPos.toFixed(1)+' cm';

    }



    /* EMF real: variação do fluxo entre o frame anterior e o atual, dividida pelo dt.

        Isso captura QUALQUER mudança no fluxo — movimento do ímã, mudança de

        intensidade, ou inversão do polo voltado para a espira com o ímã parado —

        exatamente como a Lei de Faraday prevê: ε = -N·dΦ/dt, sem assumir que a

        variação só pode vir de deslocamento espacial. */

    const Phi = flux(xPos, magScale, poleSign);

    if(dt > 0){

        curEMF = -N * (Phi - lastFlux) / dt;

        curCurrent = curEMF / R;

    }

    lastFlux = Phi;

    lastDt = dt;

    lastX = xBefore; /* posição ANTES deste frame, usada só para indicar aproximando/afastando */



    histEMF.push(curEMF); if(histEMF.length>HIST) histEMF.shift();



    drawAnim();

    drawGraph();

    updateUI();



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



    /* ── controles públicos ── */

    window.farUpd = function(){

    xPos      = parseFloat(document.getElementById('far-sx').value);

    autoSpeed = parseFloat(document.getElementById('far-sv').value);

    magScale  = parseFloat(document.getElementById('far-sm').value);

    document.getElementById('far-lx').textContent = xPos.toFixed(1)+' cm';

    document.getElementById('far-lv').textContent = autoSpeed.toFixed(0)+'×';

    document.getElementById('far-lm').textContent = magScale.toFixed(1)+'×';

    };



    window.farReverse = function(){

    moveDir *= -1;

    };



    window.farTogglePole = function(){

    poleSign *= -1;

    const btn = document.getElementById('far-pol-btn');

    btn.textContent = '🧲 Polo voltado p/ espira: ' + (poleSign>0 ? 'N' : 'S');

    btn.className = 'far-btn' + (poleSign<0 ? ' active-pol' : '');

    };



    window.__maxwellController = { start, stop };

})();