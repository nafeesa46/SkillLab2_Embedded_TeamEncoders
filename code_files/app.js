// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const predictBtn = document.getElementById('predict-btn');
    const inputX = document.getElementById('input-x');
    const inputY = document.getElementById('input-y');
    const inputDX = document.getElementById('input-dx');
    const inputDY = document.getElementById('input-dy');
    const inputDist = document.getElementById('input-dist');
    const inputAngle = document.getElementById('input-angle');
    const navMode = document.getElementById('nav-mode');
    const clearBtn = document.getElementById('clear-btn');
    const vectorInputs = document.getElementById('vector-inputs');
    const rotationInputs = document.getElementById('rotation-inputs');
    const iterationLog = document.getElementById('cordic-iterations');

    let currentIdx = 0;
    const trajectory = getTrajectoryDataset();
    
    // UI Elements
    const elements = {
        swDist: document.getElementById('sw-dist'),
        swAngle: document.getElementById('sw-angle'),
        hwDist: document.getElementById('hw-dist'),
        hwAngle: document.getElementById('hw-angle'),
        angleErr: document.getElementById('angle-error'),
        distErr: document.getElementById('dist-error'),
        targetXVal: document.getElementById('target-x-val'),
        targetYVal: document.getElementById('target-y-val'),
        keepHistory: document.getElementById('keep-history'),
        mlStatus: document.getElementById('ml-status'),
        fpgaStatus: document.getElementById('fpga-status'),
    };

    // Initialize Grid
    function initGrid() {
        gridContainer.innerHTML = '';
        for (let i = 0; i < 400; i++) { // 20x20 visual cells for 800px grid
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            gridContainer.appendChild(cell);
        }
    }

    navMode.addEventListener('change', () => {
        if (navMode.value === 'vector') {
            vectorInputs.style.display = 'flex';
            rotationInputs.style.display = 'none';
        } else {
            vectorInputs.style.display = 'none';
            rotationInputs.style.display = 'flex';
        }
    });

    clearBtn.addEventListener('click', () => {
        document.querySelectorAll('.point, .path-line').forEach(el => el.remove());
        iterationLog.innerHTML = '';
    });

    function updatePoints() {
        if (!elements.keepHistory.checked) {
            document.querySelectorAll('.point, .path-line').forEach(el => el.remove());
        }

        const startX = parseFloat(inputX.value) || 0;
        const startY = parseFloat(inputY.value) || 0;
        let dx, dy, targetX, targetY;

        if (navMode.value === 'vector') {
            dx = parseFloat(inputDX.value) || 0;
            dy = parseFloat(inputDY.value) || 0;
            targetX = startX + dx;
            targetY = startY + dy;
            
            // CORDIC Vector Mode
            const result = fpgaCordic.calculate(dx, dy);
            updateAnalytics(result, targetX, targetY);
        } else {
            const dist = parseFloat(inputDist.value) || 0;
            const angle = parseFloat(inputAngle.value) || 0;
            
            // CORDIC Rotation Mode
            const result = fpgaCordic.rotate(dist, angle);
            dx = result.dx;
            dy = result.dy;
            targetX = startX + dx;
            targetY = startY + dy;
            
            updateAnalytics({ magnitude: dist, angle: angle, steps: result.steps }, targetX, targetY);
        }
        
        const current = { x: startX, y: startY };
        const target = { x: targetX, y: targetY };
        
        // Update Points in DOM (Persistent)
        const currentPoint = createPoint(current.x, current.y, 'current');
        const targetPoint = createPoint(target.x, target.y, 'predicted');
        
        gridContainer.appendChild(currentPoint);
        gridContainer.appendChild(targetPoint);

        drawPathLine(current, target);
    }

    function updateAnalytics(result, tx, ty) {
        elements.swDist.textContent = result.magnitude.toFixed(3);
        elements.swAngle.textContent = result.angle.toFixed(2) + '°';
        elements.targetXVal.textContent = tx.toFixed(2);
        elements.targetYVal.textContent = ty.toFixed(2);
        
        // Simulating Hardware delay
        setTimeout(() => {
            elements.hwDist.textContent = result.magnitude.toFixed(3);
            elements.hwAngle.textContent = result.angle.toFixed(2) + '°';
            
            iterationLog.innerHTML = result.steps.map(s => 
                `<div>i=${s.iter}: Z=${s.angle}°, X=${s.x}, Y=${s.y}</div>`
            ).join('');
        }, 100);
    }

    function createPoint(x, y, type) {
        const p = document.createElement('div');
        p.className = `point ${type}`;
        const rect = gridContainer.getBoundingClientRect();
        const center = rect.width / 2;
        const pxPerUnit = rect.width / 200; // Map -100...100 to 0...800
        
        p.style.left = `${center + (x * pxPerUnit)}px`;
        p.style.top = `${center - (y * pxPerUnit)}px`;
        return p;
    }

    function drawPathLine(p1, p2) {
        const line = document.createElement('div');
        line.className = 'path-line';
        
        const rect = gridContainer.getBoundingClientRect();
        const center = rect.width / 2;
        const pxPerUnit = rect.width / 200;

        const x1 = center + (p1.x * pxPerUnit);
        const y1 = center - (p1.y * pxPerUnit);
        const x2 = center + (p2.x * pxPerUnit);
        const y2 = center - (p2.y * pxPerUnit);

        const dist = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        line.style.width = `${dist}px`;
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.transform = `rotate(${angle}deg)`;
        
        gridContainer.appendChild(line);
    }

    predictBtn.addEventListener('click', (e) => {
        console.log("Button clicked!");
        e.preventDefault();
        updatePoints();
    });

    // Expose for manual triggering if needed
    window.runSim = updatePoints;

    initGrid();
    setTimeout(updatePoints, 500); // Initial draw
});
