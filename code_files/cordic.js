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
     * Vector Mode: Compute magnitude and angle from dx, dy
     */
    calculate(dx, dy, iterations = 10) {
        let x = Math.abs(dx);
        let y = Math.abs(dy);
        let z = 0; 
        const steps = [];

        for (let i = 0; i < iterations; i++) {
            let x_new, y_new;
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
            x = x_new; y = y_new;
            steps.push({ iter: i, x: x.toFixed(2), y: y.toFixed(2), angle: z.toFixed(2) });
        }

        let magnitude = x * this.K;
        let finalAngle = z;
        if (dx < 0 && dy >= 0) finalAngle = 180 - z;
        else if (dx < 0 && dy < 0) finalAngle = -180 + z;
        else if (dx >= 0 && dy < 0) finalAngle = -z;

        return { magnitude, angle: finalAngle, steps };
    }

    /**
     * Rotation Mode: Compute dx, dy from magnitude and angle
     */
    rotate(magnitude, targetAngle, iterations = 10) {
        let x = magnitude * this.K; 
        let y = 0;
        let z = targetAngle;
        
        // Handle angles outside [-90, 90] with pre-rotation
        if (z > 90) {
            z -= 180;
            x = -x;
            y = -y;
        } else if (z < -90) {
            z += 180;
            x = -x;
            y = -y;
        }

        const steps = [];
        for (let i = 0; i < iterations; i++) {
            let x_new, y_new;
            const shiftY = y / Math.pow(2, i);
            const shiftX = x / Math.pow(2, i);

            if (z >= 0) {
                x_new = x - shiftY;
                y_new = y + shiftX;
                z -= this.atanLUT[i] || 0;
            } else {
                x_new = x + shiftY;
                y_new = y - shiftX;
                z += this.atanLUT[i] || 0;
            }
            x = x_new; y = y_new;
            steps.push({ iter: i, x: x.toFixed(2), y: y.toFixed(2), angle: z.toFixed(2) });
        }

        return { dx: x, dy: y, steps };
    }
}

const fpgaCordic = new CORDIC();
