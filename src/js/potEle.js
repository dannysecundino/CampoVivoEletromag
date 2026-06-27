(function () {

    'use strict';



    const K   = 8.99e9;

    const QSC = 1e-6;

    const canvas = document.getElementById('pot-canvas');

    if (!canvas) return;

    const ctx = canvas.getContext('2d');

    const W = canvas.width, H = canvas.height;



    /* ── estado ── */

    let q1 = 2.0, q2 = -2.0;

    let x1 = W*0.35, y1 = H*0.5;

    let x2 = W*0.65, y2 = H*0.5;

    let nEq = 8;

    let cursorX = -1, cursorY = -1;

    let drag = null, dragOff = {x:0,y:0};



    const PX_M = 0.002; /* 1 px = 2 mm */



    /* ── potencial em ponto (px,py) ── */

    function Vat(px, py) {

    const charges = [{x:x1,y:y1,q:q1},{x:x2,y:y2,q:q2}];

    let v = 0;

    charges.forEach(c => {

        const dx = px-c.x, dy = py-c.y;

        const r_m = Math.sqrt(dx*dx+dy*dy) * PX_M;

        if (r_m < 0.002) return; /* evitar singularidade */

        v += K * c.q * QSC / r_m;

    });

    return v;

    }



    /* ── campo E em (px,py) → vetor unitário ── */

    function Edir(px, py) {

    const charges = [{x:x1,y:y1,q:q1},{x:x2,y:y2,q:q2}];

    let ex=0, ey=0;

    charges.forEach(c => {

        const dx=px-c.x, dy=py-c.y;

        const r2=dx*dx+dy*dy;

        if (r2<1) return;

        const r=Math.sqrt(r2);

        const sign = c.q>=0 ? 1 : -1;

        ex += sign*dx/(r2*r);

        ey += sign*dy/(r2*r);

    });

    const mag=Math.sqrt(ex*ex+ey*ey);

    if (mag<1e-14) return {x:0,y:0};

    return {x:ex/mag,y:ey/mag};

    }



    /* ── mapa de potencial (heatmap) ── */

    function drawHeatmap() {

    const imageData = ctx.createImageData(W, H);

    const data = imageData.data;

    const VMAX = 3e5; /* V — escala de cor */



    for (let py=0; py<H; py++) {

        for (let px=0; px<W; px++) {

        const v = Vat(px, py);

        const t = Math.tanh(v / VMAX); /* -1 a +1 */

        let r,g,b;

        if (t >= 0) {

            /* positivo → vermelho */

            r = Math.round(244 * t + 7*(1-t));

            g = Math.round(63  * t + 9*(1-t));

            b = Math.round(94  * t + 15*(1-t));

        } else {

            /* negativo → azul */

            const s = -t;

            r = Math.round(56  * s + 7*(1-s));

            g = Math.round(189 * s + 9*(1-s));

            b = Math.round(248 * s + 15*(1-s));

        }

        const idx = (py*W + px)*4;

        data[idx]   = r;

        data[idx+1] = g;

        data[idx+2] = b;

        data[idx+3] = Math.round(180 * Math.abs(t) + 8);

        }

    }

    ctx.putImageData(imageData, 0, 0);

    }



    /* ── linhas equipotenciais (marching squares simplificado) ── */

    function drawEquipotentials() {

    const VMAX = 2.5e5;

    const levels = [];

    for (let i = 1; i <= nEq; i++) {

        levels.push( VMAX * i / nEq);

        levels.push(-VMAX * i / nEq);

    }



    const STEP = 8; /* resolução da grade */

    const cols = Math.floor(W/STEP);

    const rows = Math.floor(H/STEP);



    /* pré-computa grid de V */

    const grid = [];

    for (let r=0; r<=rows; r++) {

        grid[r] = [];

        for (let c=0; c<=cols; c++) {

        grid[r][c] = Vat(c*STEP, r*STEP);

        }

    }



    ctx.save();

    ctx.lineWidth = 1;



    levels.forEach(lv => {

        const col = lv > 0 ? 'rgba(244,63,94,0.55)' : 'rgba(56,189,248,0.55)';

        ctx.strokeStyle = col;

        ctx.setLineDash([4,3]);



        for (let r=0; r<rows; r++) {

        for (let c=0; c<cols; c++) {

            const v00=grid[r][c], v10=grid[r][c+1];

            const v01=grid[r+1][c], v11=grid[r+1][c+1];



            /* interpola cruzamentos */

            function interp(va,vb,xa,ya,xb,yb) {

            const t = (lv-va)/(vb-va);

            return {x: xa+t*(xb-xa), y: ya+t*(yb-ya)};

            }



            const pts = [];

            if ((v00-lv)*(v10-lv)<0) pts.push(interp(v00,v10, c*STEP,r*STEP, (c+1)*STEP,r*STEP));

            if ((v10-lv)*(v11-lv)<0) pts.push(interp(v10,v11, (c+1)*STEP,r*STEP, (c+1)*STEP,(r+1)*STEP));

            if ((v01-lv)*(v11-lv)<0) pts.push(interp(v01,v11, c*STEP,(r+1)*STEP, (c+1)*STEP,(r+1)*STEP));

            if ((v00-lv)*(v01-lv)<0) pts.push(interp(v00,v01, c*STEP,r*STEP, c*STEP,(r+1)*STEP));



            if (pts.length >= 2) {

            ctx.beginPath();

            ctx.moveTo(pts[0].x, pts[0].y);

            ctx.lineTo(pts[1].x, pts[1].y);

            ctx.stroke();

            }

        }

        }

        ctx.setLineDash([]);

    });

    ctx.restore();

    }



    /* ── linhas de campo ── */

    function drawFieldLines() {

    const N = 14, STEP = 3, STEPS = 500, SR = 20;

    const charges = [{x:x1,y:y1,q:q1},{x:x2,y:y2,q:q2}];



    ctx.save();

    ctx.lineWidth = 1;

    ctx.globalAlpha = 0.3;



    charges.forEach(src => {

        if (src.q <= 0) return;

        ctx.strokeStyle = '#f43f5e';

        for (let i=0; i<N; i++) {

        const ang = (i/N)*Math.PI*2;

        let px=src.x+SR*Math.cos(ang), py=src.y+SR*Math.sin(ang);

        ctx.beginPath(); ctx.moveTo(px,py);

        for (let s=0; s<STEPS; s++) {

            const d=Edir(px,py);

            px+=STEP*d.x; py+=STEP*d.y;

            if (px<-5||px>W+5||py<-5||py>H+5) break;

            let abs=false;

            charges.forEach(c => {

            if (c.q<0) { const dx=px-c.x,dy=py-c.y; if (dx*dx+dy*dy<SR*SR) abs=true; }

            });

            if (abs) break;

            ctx.lineTo(px,py);

        }

        ctx.stroke();

        }

    });

    ctx.restore();

    }



    /* ── cargas ── */

    function drawCharges() {

    const charges = [{x:x1,y:y1,q:q1,id:'1'},{x:x2,y:y2,q:q2,id:'2'}];

    charges.forEach(c => {

        const col = c.q >= 0 ? '#f43f5e' : '#38bdf8';

        ctx.save();

        ctx.beginPath();

        ctx.arc(c.x, c.y, 18, 0, Math.PI*2);

        ctx.fillStyle = col;

        ctx.shadowColor = col; ctx.shadowBlur = 20;

        ctx.fill(); ctx.shadowBlur = 0;

        ctx.font = 'bold 13px Space Mono';

        ctx.fillStyle = '#07090f';

        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';

        ctx.fillText(c.q >= 0 ? '+' : '−', c.x, c.y);



        /* label q */

        ctx.font = '10px Space Mono';

        ctx.fillStyle = col;

        ctx.fillText('q' + c.id + ' = ' + (c.q>=0?'+':'') + c.q.toFixed(1) + 'µC',

                    c.x, c.y + 30);

        ctx.restore();

    });

    }



    /* ── cursor probe ── */

    function drawProbe() {

    if (cursorX < 0) return;

    const v = Vat(cursorX, cursorY);

    const col = v >= 0 ? '#f43f5e' : '#38bdf8';



    ctx.save();

    ctx.strokeStyle = col;

    ctx.lineWidth = 1;

    ctx.globalAlpha = 0.6;

    ctx.setLineDash([4,3]);

    ctx.beginPath(); ctx.moveTo(cursorX,0); ctx.lineTo(cursorX,H); ctx.stroke();

    ctx.beginPath(); ctx.moveTo(0,cursorY); ctx.lineTo(W,cursorY); ctx.stroke();

    ctx.setLineDash([]);



    ctx.beginPath();

    ctx.arc(cursorX, cursorY, 5, 0, Math.PI*2);

    ctx.fillStyle = col; ctx.globalAlpha = 1;

    ctx.fill();



    /* tooltip */

    const vStr = Math.abs(v) > 1e6

        ? (v/1e6).toFixed(2) + ' MV'

        : (v/1000).toFixed(1) + ' kV';

    const tx = cursorX + 12, ty = cursorY - 12;

    ctx.font = 'bold 11px Space Mono';

    const tw = ctx.measureText('V = ' + vStr).width;

    ctx.fillStyle = 'rgba(7,9,15,0.85)';

    ctx.fillRect(tx-3, ty-13, tw+8, 18);

    ctx.fillStyle = col;

    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';

    ctx.fillText('V = ' + vStr, tx, ty);

    ctx.restore();

    }



    /* ── render ── */

    function draw() {

    ctx.clearRect(0,0,W,H);

    ctx.fillStyle = '#07090f'; ctx.fillRect(0,0,W,H);

    drawHeatmap();

    drawEquipotentials();

    drawFieldLines();

    drawCharges();

    drawProbe();

    }



    /* ── UI ── */

    function fmtV(v) {

    if (!isFinite(v)) return '—';

    return Math.abs(v) > 1e6

        ? (v/1e6).toFixed(2) + ' MV'

        : (v/1000).toFixed(1) + ' kV';

    }



    function updateUI() {

    document.getElementById('pot-q1-val').textContent = (q1>=0?'+':'') + q1.toFixed(1) + ' µC';

    document.getElementById('pot-q2-val').textContent = (q2>=0?'+':'') + q2.toFixed(1) + ' µC';

    document.getElementById('pot-neq-val').textContent = nEq;



    const vq1 = Vat(x1 + 25, y1);

    const vq2 = Vat(x2 + 25, y2);

    document.getElementById('pot-vq1').textContent = fmtV(vq1);

    document.getElementById('pot-vq2').textContent = fmtV(vq2);



    if (cursorX >= 0) {

        const vc = Vat(cursorX, cursorY);

        const vcEl = document.getElementById('pot-vcursor');

        vcEl.textContent = fmtV(vc);

        vcEl.style.color = vc >= 0 ? '#f43f5e' : '#38bdf8';

    }



    let msg;

    if (q1 * q2 < 0) {

        msg = 'Dipolo elétrico! A região entre as cargas tem alto campo elétrico. As linhas equipotenciais se comprimem entre elas — quanto mais juntas, mais intenso o campo.';

    } else if (q1 > 0 && q2 > 0) {

        msg = 'Duas cargas positivas! O potencial é alto ao redor de ambas. No ponto médio entre elas existe um mínimo local — nenhuma carga de teste colocada lá sentiria força resultante.';

    } else if (q1 < 0 && q2 < 0) {

        msg = 'Duas cargas negativas! O potencial é negativo ao redor de ambas. As linhas de campo apontam para as cargas de todas as direções.';

    } else {

        msg = 'Ajuste as cargas para explorar diferentes configurações de potencial elétrico.';

    }

    document.getElementById('pot-insight').textContent = msg;

    }



    window.potUpdate = function () {

    q1  = parseFloat(document.getElementById('pot-q1').value);

    q2  = parseFloat(document.getElementById('pot-q2').value);

    nEq = parseInt(document.getElementById('pot-neq').value);

    updateUI();

    };



    /* ── drag ── */

    function getPos(e) {

    const rect = canvas.getBoundingClientRect();

    const scaleX = W/rect.width, scaleY = H/rect.height;

    const cx = e.touches ? e.touches[0].clientX : e.clientX;

    const cy = e.touches ? e.touches[0].clientY : e.clientY;

    return { x: (cx-rect.left)*scaleX, y: (cy-rect.top)*scaleY };

    }



    canvas.addEventListener('mousedown', e => {

    const {x,y} = getPos(e);

    const d1=(x-x1)**2+(y-y1)**2, d2=(x-x2)**2+(y-y2)**2;

    if (d1 < 900) { drag='q1'; dragOff={x:x-x1,y:y-y1}; }

    else if (d2 < 900) { drag='q2'; dragOff={x:x-x2,y:y-y2}; }

    });

    canvas.addEventListener('mousemove', e => {

    const {x,y} = getPos(e);

    cursorX = x; cursorY = y;

    if (drag === 'q1') { x1=x-dragOff.x; y1=y-dragOff.y; }

    if (drag === 'q2') { x2=x-dragOff.x; y2=y-dragOff.y; }

    updateUI();

    });

    canvas.addEventListener('mouseup',    () => { drag = null; });

    canvas.addEventListener('mouseleave', () => { drag = null; cursorX=-1; });

    canvas.addEventListener('touchstart', e => { e.preventDefault(); const {x,y}=getPos(e); const d1=(x-x1)**2+(y-y1)**2,d2=(x-x2)**2+(y-y2)**2; if(d1<900){drag='q1';dragOff={x:x-x1,y:y-y1};}else if(d2<900){drag='q2';dragOff={x:x-x2,y:y-y2};} }, {passive:false});

    canvas.addEventListener('touchmove',  e => { e.preventDefault(); const {x,y}=getPos(e); cursorX=x;cursorY=y; if(drag==='q1'){x1=x-dragOff.x;y1=y-dragOff.y;}if(drag==='q2'){x2=x-dragOff.x;y2=y-dragOff.y;} updateUI(); }, {passive:false});

    canvas.addEventListener('touchend',   () => { drag=null; });



    /* ── loop de renderização ── */

    let lastDraw = 0;

    let _running = false;

    let _rafId = null;

    let _started = false;

    function loop(ts) {

    if (!_running) return;

    if (ts - lastDraw > 33) { /* ~30 fps para não sobrecarregar o heatmap */

        draw();

        lastDraw = ts;

    }

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

    window.__potencialController = { start, stop };

})();