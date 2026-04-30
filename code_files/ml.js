// ML Logic: A simple linear predictor simulation
class TrajectoryML {
    constructor() {
        // Simple weights for x and y prediction based on previous points
        this.weights = {
            x: [0.8, 0.2], // Weight for current x and delta x
            y: [0.8, 0.2]
        };
    }

    /**
     * Predicts the next point based on current point and history
     * @param {Object} current - {x, y}
     * @param {Object} prev - {x, y}
     */
    predict(current, prev) {
        if (!prev) return { x: Math.min(9, current.x + 1), y: Math.min(9, current.y + 1) };

        const dx = current.x - prev.x;
        const dy = current.y - prev.y;

        // Simulate ML inference: NewX = CurrentX + DeltaX + some 'noise/learning'
        let nextX = current.x + dx;
        let nextY = current.y + dy;

        // Constraint to 10x10 grid
        nextX = Math.max(0, Math.min(9, Math.round(nextX)));
        nextY = Math.max(0, Math.min(9, Math.round(nextY)));

        console.log(`ML Inference: Input(${current.x}, ${current.y}) -> Predicted(${nextX}, ${nextY})`);
        return { x: nextX, y: nextY };
    }
}

const robotML = new TrajectoryML();
