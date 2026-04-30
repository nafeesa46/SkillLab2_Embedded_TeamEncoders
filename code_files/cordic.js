// CORDIC Algorithm Implementation (Vector Mode)
// Simulating FPGA bit-parallel architecture

class CORDIC {
    constructor() {
        // Pre-computed atan(2^-i) in degrees
        this.atanLUT = [
            45.0, 26.565, 14.036, 7.125, 3.576, 
            1.79, 0.895, 0.448, 0.224, 0.112, 0.056
        ];
        // CORDIC Gain Constant K ~ 1.64676
        this.K = 0.607252935; // 1/K for magnitude scaling
    }

    /**
     * Compute magnitude and angle using CORDIC vector mode
     * @param {number} dx - change in x
     * @param {number} dy - change in y
     * @param {number} iterations - number of iterations
     */
    calculate(dx, dy, iterations = 10) {
        let x = Math.abs(dx);
        let y = Math.abs(dy);
        let z = 0; // Accumulated angle

        const steps = [];

        for (let i = 0; i < iterations; i++) {
            let x_new, y_new;
            let di = y < 0 ? 1 : -1; // Vector mode: rotate y towards zero

            // FPGA logic: x_new = x - di * (y >> i)
            // y_new = y + di * (x >> i)
            const shiftY = y / Math.pow(2, i);
            const shiftX = x / Math.pow(2, i);

            if (y > 0) {
                x_new = x + shiftY;
                y_new = y - shiftX;
                z += this.atanLUT[i] || 0;
            } else {
                x_new = x - shiftY;
                y_new = y + shiftX;
                z -= this.atanLUT[i] || 0;
            }

            x = x_new;
            y = y_new;

            steps.push({ iter: i, x: x.toFixed(4), y: y.toFixed(4), angle: z.toFixed(2) });
        }

        // Apply gain to get final magnitude
        let magnitude = x * this.K;
        
        // Handle quadrant corrections
        let finalAngle = z;
        if (dx < 0 && dy >= 0) finalAngle = 180 - z;
        else if (dx < 0 && dy < 0) finalAngle = -180 + z;
        else if (dx >= 0 && dy < 0) finalAngle = -z;

        return {
            magnitude: magnitude,
            angle: finalAngle,
            steps: steps
        };
    }
}

const fpgaCordic = new CORDIC();
