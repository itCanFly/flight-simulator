    // Controls Handling
    export function setupControls(keys,stats) {
        window.addEventListener("keydown", (e) => {
            if (e.code in keys) keys[e.code] = true;
        });

        window.addEventListener("keyup", (e) => {
            if (e.code in keys) {
                keys[e.code] = false;
                stats.fuel = stats.fuel -1;
            }
        });
    }