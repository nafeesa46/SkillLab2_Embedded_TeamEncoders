// Main Application Logic
document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const predictBtn = document.getElementById('predict-btn');
    const inputX = document.getElementById('input-x');
    const inputY = document.getElementById('input-y');
    const inputDX = document.getElementById('input-dx');
    const inputDY = document.getElementById('input-dy');
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
        mlStatus: document.getElementById('ml-status'),
        fpgaStatus: document.getElementById('fpga-status'),
    };

    // Initialize Grid
    function initGrid() {
        for (let i = 0; i < 100; i++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            const x = i % 10;
            const y = Math.floor(i / 10);
            cell.dataset.coords = `${x},${9-y}`; // Cartesian coordinates
            gridContainer.appendChild(cell);
        }
    }

    function getCell(x, y) {
        const invY = 9 - y;
        const index = invY * 10 + x;
        return gridContainer.children[index];
    }

    function updatePoints() {
        const x = parseFloat(inputX.value) || 0;
        const y = parseFloat(inputY.value) || 0;
        const dx = parseFloat(inputDX.value) || 0;
        const dy = parseFloat(inputDY.value) || 0;
        
        const current = { x, y };
        const target = { x: x + dx, y: y + dy };
        
        // Ensure within grid bounds for visualization (0-10)
        const vTarget = { 
            x: Math.max(0, Math.min(10, target.x)), 
            y: Math.max(0, Math.min(10, target.y)) 
        };

        elements.mlStatus.textContent = 'PYTHON: Simulation';
        elements.mlStatus.style.background = 'var(--primary-blue)';
        
        // Update Points in DOM
        document.querySelectorAll('.point').forEach(p => p.remove());
        
        const currentPoint = createPoint(current.x, current.y, 'current');
        const targetPoint = createPoint(vTarget.x, vTarget.y, 'predicted');
        
        gridContainer.appendChild(currentPoint);
        gridContainer.appendChild(targetPoint);

        // Path Line (using actual target, even if off grid slightly in math)
        drawPathLine(current, target);

        // Math Logic
        computeMath(dx, dy);
        
        setTimeout(() => {
            elements.mlStatus.textContent = 'PYTHON: Active';
            elements.mlStatus.style.background = 'rgba(255,255,255,0.1)';
        }, 800);
    }

    function createPoint(x, y, type) {
        const p = document.createElement('div');
        p.className = `point ${type}`;
        const rect = gridContainer.getBoundingClientRect();
        const cellWidth = rect.width / 10;
        const cellHeight = rect.height / 10;
        
        p.style.left = `${x * cellWidth}px`;
        p.style.top = `${(10 - y) * cellHeight}px`;
        return p;
    }

    function drawPathLine(p1, p2) {
        document.querySelectorAll('.path-line').forEach(l => l.remove());
        
        const rect = gridContainer.getBoundingClientRect();
        const cellWidth = rect.width / 10;
        const cellHeight = rect.height / 10;
        
        const x1 = p1.x * cellWidth;
        const y1 = (10 - p1.y) * cellHeight;
        const x2 = p2.x * cellWidth;
        const y2 = (10 - p2.y) * cellHeight;

        const dist = Math.hypot(x2 - x1, y2 - y1);
        const angle = Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI;

        const line = document.createElement('div');
        line.className = 'path-line';
        line.style.width = `${dist}px`;
        line.style.left = `${x1}px`;
        line.style.top = `${y1}px`;
        line.style.transform = `rotate(${angle}deg)`;
        gridContainer.appendChild(line);
    }

    function computeMath(dx, dy) {
        // Software
        const swDist = Math.hypot(dx, dy);
        const swAngle = Math.atan2(dy, dx) * 180 / Math.PI;

        elements.swDist.textContent = swDist.toFixed(3);
        elements.swAngle.textContent = swAngle.toFixed(2) + '°';

        // FPGA CORDIC
        elements.fpgaStatus.textContent = 'FPGA: Computing...';
        const cordicRes = fpgaCordic.calculate(dx, dy, 12);
        
        elements.hwDist.textContent = cordicRes.magnitude.toFixed(3);
        elements.hwAngle.textContent = cordicRes.angle.toFixed(2) + '°';

        // Error Analysis
        const angleErr = Math.abs(swAngle - cordicRes.angle);
        const distErr = Math.abs(swDist - cordicRes.magnitude);

        elements.angleErr.textContent = angleErr.toFixed(3) + '°';
        elements.distErr.textContent = distErr.toFixed(4);

        // Iteration Log
        iterationLog.innerHTML = '';
        cordicRes.steps.forEach(s => {
            const div = document.createElement('div');
            div.textContent = `i=${s.iter}: Z=${s.angle}°, X=${s.x}`;
            iterationLog.appendChild(div);
        });
        
        elements.fpgaStatus.textContent = 'FPGA: Ready';
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
