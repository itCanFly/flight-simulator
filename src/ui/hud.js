// src/ui/hud.js
// Central HUD / on-screen message manager
export const HUD = {
    game: null,
    init(game) {
        this.game = game;
        // Cache DOM nodes (create if missing)
        this.container = document.getElementById('hudContainer') || this._createContainer();
        this.startMsg = document.getElementById('startMessage');
        this.ascendHint = document.getElementById('ascendHint');
        this.offCourse = document.getElementById('offCourseWarning');
        this.lowAltitude = document.getElementById('lowAltitudeWarning');
        this.pointsLayer = document.getElementById('pointsLayer');
        this.fuelAlert = document.getElementById('fuelAlert');
    },

    _createContainer() {
        const c = document.createElement('div');
        c.id = 'hudContainer';
        document.body.appendChild(c);
        return c;
    },

    showStartMessage(text = 'Prepare for takeoff', duration = 3000) {
        if (!this.startMsg) return;
        this.startMsg.textContent = text;
        this.startMsg.classList.add('visible');
        setTimeout(() => this.startMsg.classList.remove('visible'), duration);
    },

    showAscendHint(duration = 2500) {
        if (!this.ascendHint) return;
        this.ascendHint.classList.add('visible');
        setTimeout(() => this.ascendHint.classList.remove('visible'), duration);
    },

    // Start an ascend countdown sequence. If player does not ascend within the countdown,
    // repeat the urgent prompt until the player ascends (presses ascend controls or plane rises).
    startAscendSequence(game, options = {}) {
        const countdownEl = document.getElementById('ascendCountdown');
        if (!countdownEl) return;

        const initialY = game.plane ? game.plane.position.y : 0;
        const grace = options.graceSeconds ?? 3;
        let cancelled = false;

        const checkAscended = () => {
            if (!game || game.state !== 'PLAYING') return true; // stop if not playing
            // considered ascended if plane gained some altitude or hasTakenOff or player pressed ascend
            const ascended = (game.plane && (game.plane.position.y - initialY) > 1.5) || game.hasTakenOff || (game.keys && (game.keys.ArrowUp || game.keys.KeyW));
            return !!ascended;
        };

        const runCountdown = async () => {
            // Run the 3..2..1 sequence exactly once, then escalate visuals and wait longer for response.
            // 3..2..1 show big numbers
            countdownEl.classList.remove('hidden');
            for (let i = grace; i >= 1; i--) {
                if (cancelled) break;
                countdownEl.innerHTML = `<span class="number">${i}</span><div class="label">Ascend in</div>`;
                // animate pop
                const num = countdownEl.querySelector('.number');
                if (num) {
                    num.style.transform = 'scale(1.12)';
                    setTimeout(() => { if (num) num.style.transform = ''; }, 250);
                }
                // wait 1s
                // eslint-disable-next-line no-await-in-loop
                await new Promise(r => setTimeout(r, 1000));
                if (checkAscended()) {
                    cancelled = true; break;
                }
            }

            if (!cancelled) {
                // After countdown complete: show urgent prompt and check again
                countdownEl.innerHTML = `<div class="urgent">ASCEND NOW!</div><div class="label">Pull up or press ↑</div>`;
                // escalate visuals
                countdownEl.classList.add('urgent-state');

                // Wait for a longer grace window while player responds (default increased to 5s)
                const responseWaitMs = (options.responseMs ?? 5000);
                const waitUntil = Date.now() + responseWaitMs;
                while (Date.now() < waitUntil && !cancelled) {
                    if (checkAscended()) { cancelled = true; break; }
                    // poll at 100ms
                    // eslint-disable-next-line no-await-in-loop
                    await new Promise(r => setTimeout(r, 100));
                }
            }

            if (!cancelled) {
                // If still not ascended, increase urgency once more (but do NOT repeat whole 3-2-1)
                countdownEl.innerHTML = `<div class="urgent">CRITICAL - ASCEND!</div><div class="label">You're drifting! Pull up now!</div>`;
                // show critical state slightly longer
                await new Promise(r => setTimeout(r, options.criticalMs ?? 2000));
            }

            // hide countdown
            try { countdownEl.classList.add('hidden'); countdownEl.innerHTML = ''; } catch (e) {}
        };

        runCountdown();
        // return handle to cancel if needed
        return () => { cancelled = true; };
    },

    showOffCourse() {
        if (!this.offCourse) return;
        this.offCourse.classList.add('visible');
    },
    hideOffCourse() {
        if (!this.offCourse) return;
        this.offCourse.classList.remove('visible');
    },

    showLowAltitude() {
        if (!this.lowAltitude) return;
        this.lowAltitude.classList.add('visible');
    },
    hideLowAltitude() {
        if (!this.lowAltitude) return;
        this.lowAltitude.classList.remove('visible');
    },

    showFuelAlert() {
        if (!this.fuelAlert) return;
        this.fuelAlert.classList.add('visible');
    },
    hideFuelAlert() {
        if (!this.fuelAlert) return;
        this.fuelAlert.classList.remove('visible');
    },

    showPoints(points = 100) {
        if (!this.pointsLayer) return;
        const el = document.createElement('div');
        el.className = 'points-popup';
        // centered, minimal popup (no heavy background) for score
        el.innerHTML = `<span class="text">+${points}</span>`;
        el.classList.add('centered');
        // center
        el.style.left = '50%';
        el.style.top = '35%';
        this.pointsLayer.appendChild(el);
        // Animate and remove with slightly longer duration for realism
        requestAnimationFrame(() => el.classList.add('animate'));
        setTimeout(() => { el.classList.remove('animate'); el.style.transition = 'opacity 400ms ease'; el.style.opacity = '0'; setTimeout(()=>el.remove(), 500); }, 1400);
    }
    ,

    showFuelPickup(amount = 15) {
        if (!this.pointsLayer) return;
        const el = document.createElement('div');
        el.className = 'points-popup fuel-pickup';
        el.innerHTML = `<span class="text">+${amount}% Fuel</span>`;
        el.classList.add('centered');
        el.style.left = '50%';
        el.style.top = '48%';
        this.pointsLayer.appendChild(el);
        requestAnimationFrame(() => el.classList.add('animate'));
        setTimeout(() => { el.classList.remove('animate'); el.style.opacity = '0'; setTimeout(()=>el.remove(), 500); }, 1600);
    },

    showTip(text = '', duration = 6000) {
        // Reuse startMsg area as a tip container or create one
        let tipEl = document.getElementById('hudTip');
        if (!tipEl) {
            tipEl = document.createElement('div');
            tipEl.id = 'hudTip';
            tipEl.className = 'hud-tip';
            document.body.appendChild(tipEl);
        }
        tipEl.textContent = text;
        tipEl.classList.add('visible');
        setTimeout(() => tipEl.classList.remove('visible'), duration);
    }

    ,

    showControlsHint(duration = 9000) {
        // Create or reuse controls hint element
        let el = document.getElementById('controlsHint');
        if (!el) {
            el = document.createElement('div');
            el.id = 'controlsHint';
            el.className = 'controls-hint';
            el.innerHTML = `
                <div class="controls-inner">
                    <div class="keys-row">
                        <div class="key large">W</div>
                    </div>
                    <div class="keys-row">
                        <div class="key small">←</div>
                        <div class="key small">↓</div>
                        <div class="key small">→</div>
                    </div>
                    <div class="hint-label">W: Increase speed • S: Decrease speed • Arrows: Pitch & Roll</div>
                </div>`;
            document.body.appendChild(el);
        }
        el.classList.add('visible');
        // auto-hide after duration
        if (this._controlsHintTimeout) clearTimeout(this._controlsHintTimeout);
        this._controlsHintTimeout = setTimeout(() => this.hideControlsHint(), duration);
    },

    hideControlsHint() {
        const el = document.getElementById('controlsHint');
        if (!el) return;
        el.classList.remove('visible');
        if (this._controlsHintTimeout) { clearTimeout(this._controlsHintTimeout); this._controlsHintTimeout = null; }
    },
};

export default HUD;
