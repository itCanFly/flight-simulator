// Music.js
export class Music {
    constructor() {
        // Core audio files (these should exist)
        this.menuAudio = new Audio('./assets/audio/before_game_starts.mp3');
        this.gameAudio = new Audio('./assets/audio/main_game_sound.mp3');
        this.gameOverAudio = new Audio('./assets/audio/main_game_sound.mp3');
        this.crashAudio = new Audio('./assets/audio/crash.mp3');
        
        // Optional audio files (may not exist yet)
        this.fuelWarningAudio = this.createOptionalAudio('./assets/audio/fuel_warning.mp3');
        this.refuelAudio = this.createOptionalAudio('./assets/audio/refuel_sound.mp3');
        this.buttonAudio = this.createOptionalAudio('./assets/audio/button_sound.mp3');
        this.achievedAudio = this.createOptionalAudio('./assets/audio/achieved_sound.mp3');
        this.planeMovementAudio = this.createOptionalAudio('./assets/audio/plane_moving_sound.mp3');

        // Configure core audio with error handling
        this.menuAudio.preload = 'auto';
        this.gameAudio.preload = 'auto';
        this.gameOverAudio.preload = 'auto';
        this.crashAudio.preload = 'auto';
        
        // Add error handling for core audio files
        this.menuAudio.addEventListener('error', (e) => console.warn('Menu audio error:', e));
        this.gameAudio.addEventListener('error', (e) => console.warn('Game audio error:', e));
        this.gameOverAudio.addEventListener('error', (e) => console.warn('Game over audio error:', e));
        this.crashAudio.addEventListener('error', (e) => console.warn('Crash audio error:', e));
        
        // Loop settings
        this.menuAudio.loop = true;
        this.gameAudio.loop = true;
        this.gameOverAudio.loop = false; 
        this.crashAudio.loop = false;
        
        // Set reasonable volumes (20-50%)
        this.menuAudio.volume = 0.3;
        this.gameAudio.volume = 0.7;
        this.gameOverAudio.volume = 0.4;
        this.crashAudio.volume = 1.0;
        
        // Configure plane movement audio if it exists
        if (this.planeMovementAudio) {
            this.planeMovementAudio.loop = true;
            this.planeMovementAudio.volume = 0.08;
        }
        
        // Track movement audio state
        this.isMovementAudioPlaying = false;
        
        // Auto-start music after loading - FORCE autoplay without user interaction
        this.hasUserInteracted = true;
        this.pendingMenuMusic = false;
        this.autoplayEnabled = true;
        
        // Audio transition settings
        this.fadeConfig = {
            duration: 0.8, // Fade duration in seconds
            steps: 40,     // Number of fade steps
            interval: 20   // Milliseconds between steps
        };
        
        // Store target volumes for each audio
        this.targetVolumes = {
            menu: 0.3,
            game: 0.5,
            gameOver: 0.4,
            movement: 0.08
        };
        
        // Track current fade operations
        this.activeFades = new Set();
        
        // Auto-start music after page load
        this.initAutoplay();
    }

    // Helper to create optional audio that won't break if file doesn't exist
    createOptionalAudio(src) {
        try {
            const audio = new Audio(src);
            audio.addEventListener('error', () => {
                console.warn(`Optional audio file not found: ${src}`);
            });
            return audio;
        } catch (err) {
            console.warn(`Failed to create audio for ${src}:`, err);
            return null;
        }
    }

    // Smooth fade out audio
    fadeOut(audio, callback = null) {
        if (!audio || this.activeFades.has(audio)) return;
        
        this.activeFades.add(audio);
        const startVolume = audio.volume;
        const volumeStep = startVolume / this.fadeConfig.steps;
        
        const fadeInterval = setInterval(() => {
            audio.volume = Math.max(0, audio.volume - volumeStep);
            
            if (audio.volume <= 0) {
                clearInterval(fadeInterval);
                audio.pause();
                audio.currentTime = 0;
                this.activeFades.delete(audio);
                if (callback) callback();
            }
        }, this.fadeConfig.interval);
    }

    // Smooth fade in audio
    fadeIn(audio, targetVolume) {
        if (!audio || this.activeFades.has(audio)) return;
        
        this.activeFades.add(audio);
        audio.volume = 0;
        
        audio.play().catch(err => {
            console.warn("Audio playback failed during fade in:", err);
            this.activeFades.delete(audio);
            return;
        });
        
        const volumeStep = targetVolume / this.fadeConfig.steps;
        
        const fadeInterval = setInterval(() => {
            audio.volume = Math.min(targetVolume, audio.volume + volumeStep);
            
            if (audio.volume >= targetVolume) {
                clearInterval(fadeInterval);
                this.activeFades.delete(audio);
            }
        }, this.fadeConfig.interval);
    }

    // Smooth transition between two audio tracks
    crossFade(fromAudio, toAudio, targetVolume) {
        if (fromAudio && fromAudio !== toAudio) {
            this.fadeOut(fromAudio);
        }
        
        if (toAudio) {
            // Small delay to prevent audio overlap
            setTimeout(() => {
                this.fadeIn(toAudio, targetVolume);
            }, 100);
        }
    }

    stopAll() {
        // Fade out all currently playing audio
        if (!this.menuAudio.paused) this.fadeOut(this.menuAudio);
        if (!this.gameOverAudio.paused) this.fadeOut(this.gameOverAudio);
        
        // Stop movement audio immediately (no fade needed for short sound effects)
        if (this.planeMovementAudio && !this.planeMovementAudio.paused) {
            this.planeMovementAudio.pause();
            this.planeMovementAudio.currentTime = 0;
        }
    }

    // Immediate stop without fade (for emergency cases)
    stopAllImmediate() {
        this.menuAudio.pause();
        this.gameOverAudio.pause();
        if (this.planeMovementAudio) this.planeMovementAudio.pause();

        // Reset to start so it plays from beginning next time
        this.menuAudio.currentTime = 0;
        this.gameOverAudio.currentTime = 0;
        if (this.planeMovementAudio) this.planeMovementAudio.currentTime = 0;
        
        // Clear any active fades
        this.activeFades.clear();
    }

    initAutoplay() {
        // Force autoplay without user interaction requirement
        // Start audio muted, then unmute immediately (bypasses browser restrictions)
        setTimeout(() => {
            this.hasUserInteracted = true;
            this.autoplayEnabled = true;
            console.log("🎵 Initializing autoplay...");
            
            // Set all audio to muted initially
            this.menuAudio.muted = true;
            this.gameAudio.muted = true;
            this.gameOverAudio.muted = true;
            
            // Try to start menu audio muted (browsers allow this)
            this.menuAudio.play().then(() => {
                console.log("🎵 Menu audio started muted");
                // Unmute after a brief delay
                setTimeout(() => {
                    this.menuAudio.muted = false;
                    this.gameAudio.muted = false;
                    this.gameOverAudio.muted = false;
                    console.log("🎵 Audio unmuted - sound should now be playing");
                }, 100);
            }).catch(err => {
                console.warn("Menu audio autoplay failed:", err);
                // Fallback: wait for user interaction
                this.setupUserInteractionListener();
            });
        }, 100);
    }

    setupUserInteractionListener() {
        console.log("🎵 Waiting for user interaction to start audio...");
        const handleUserInteraction = () => {
            this.hasUserInteracted = true;
            
            // Start menu audio on first interaction
            if (!this.autoplayEnabled) {
                this.autoplayEnabled = true;
                this.menuAudio.muted = false;
                this.gameAudio.muted = false;
                this.gameOverAudio.muted = false;
                
                this.menuAudio.play().then(() => {
                    console.log("🎵 Audio started after user interaction");
                }).catch(err => {
                    console.warn("Audio failed even after interaction:", err);
                });
            }
            
            // Play pending menu music if waiting with smooth fade in
            if (this.pendingMenuMusic) {
                this.pendingMenuMusic = false;
                this.fadeIn(this.menuAudio, this.targetVolumes.menu);
            }
            
            // Remove listeners after first interaction
            document.removeEventListener('click', handleUserInteraction);
            document.removeEventListener('keydown', handleUserInteraction);
            document.removeEventListener('touchstart', handleUserInteraction);
        };
        
        document.addEventListener('click', handleUserInteraction);
        document.addEventListener('keydown', handleUserInteraction);
        document.addEventListener('touchstart', handleUserInteraction);
    }

    playMenu() {
        // Don't do anything if autoplay hasn't initialized yet (it will start menu audio)
        if (!this.autoplayEnabled) {
            console.log("🎵 Menu will play after autoplay initializes");
            return;
        }
        
        // Find currently playing audio to fade from
        let currentAudio = null;
        if (!this.gameOverAudio.paused) currentAudio = this.gameOverAudio;
        if (!this.gameAudio.paused) currentAudio = this.gameAudio;
        
        // Start menu music automatically - no user interaction check
        this.crossFade(currentAudio, this.menuAudio, this.targetVolumes.menu);
    }

    playGame() {
        // Find currently playing audio to fade from
        let currentAudio = null;
        if (!this.menuAudio.paused) currentAudio = this.menuAudio;
        
        // Cross-fade to game music - no user interaction check
        this.crossFade(currentAudio, this.gameAudio, this.targetVolumes.game);
    }

    playGameOver() {
        // Find currently playing audio to fade from
        let currentAudio = null;
        if (!this.menuAudio.paused) currentAudio = this.menuAudio;
        
        // Cross-fade to game over music
        this.crossFade(currentAudio, this.gameOverAudio, this.targetVolumes.gameOver);
    }

    playCrash() {
        // Play crash sound immediately (not looped)
        this.crashAudio.currentTime = 0; // Reset to beginning
        this.crashAudio.play().catch(err => {
            console.warn("Crash audio playback failed:", err);
        });
    }

    playAchieved() {
        if (this.achievedAudio) {
            this.achievedAudio.play().catch(err => {
                console.warn("Achieved audio playback failed:", err);
            });
        }
    }

    // Additional utility methods for optional sounds
    playFuelWarning() {
        if (this.fuelWarningAudio) {
            this.fuelWarningAudio.play().catch(err => {
                console.warn("Fuel warning audio playback failed:", err);
            });
        }
    }

    playButton() {
        if (this.buttonAudio) {
            // Reset audio to beginning for quick successive clicks
            this.buttonAudio.currentTime = 0;
            this.buttonAudio.volume = 0.4; // Clear button sound
            this.buttonAudio.play().catch(err => {
                console.warn("Button audio playback failed:", err);
            });
        }
    }

    playRefuel() {
        if (this.refuelAudio) {
            this.refuelAudio.play().catch(err => {
                console.warn("Refuel audio playback failed:", err);
            });
        }
    }

    // Plane movement audio control with smooth transitions
    startMovementAudio() {
        if (this.planeMovementAudio && !this.isMovementAudioPlaying) {
            // Quick fade in for movement audio (shorter duration for responsiveness)
            this.planeMovementAudio.volume = 0;
            this.planeMovementAudio.currentTime = 0;
            this.planeMovementAudio.play().catch(err => {
                console.warn("Plane movement audio playback failed:", err);
                return;
            });
            
            // Fast fade in over 200ms
            const steps = 10;
            const volumeStep = this.targetVolumes.movement / steps;
            const interval = 20; // 20ms between steps
            
            const fadeInterval = setInterval(() => {
                this.planeMovementAudio.volume = Math.min(
                    this.targetVolumes.movement, 
                    this.planeMovementAudio.volume + volumeStep
                );
                
                if (this.planeMovementAudio.volume >= this.targetVolumes.movement) {
                    clearInterval(fadeInterval);
                }
            }, interval);
            
            this.isMovementAudioPlaying = true;
        }
    }

    stopMovementAudio() {
        if (this.planeMovementAudio && this.isMovementAudioPlaying) {
            // Quick fade out for movement audio
            const startVolume = this.planeMovementAudio.volume;
            const steps = 8;
            const volumeStep = startVolume / steps;
            const interval = 25; // 25ms between steps
            
            const fadeInterval = setInterval(() => {
                this.planeMovementAudio.volume = Math.max(0, this.planeMovementAudio.volume - volumeStep);
                
                if (this.planeMovementAudio.volume <= 0) {
                    clearInterval(fadeInterval);
                    this.planeMovementAudio.pause();
                    this.planeMovementAudio.currentTime = 0;
                    this.isMovementAudioPlaying = false;
                }
            }, interval);
        }
    }

    // Update movement audio based on whether plane is moving
    updateMovementAudio(isMoving) {
        if (isMoving) {
            this.startMovementAudio();
        } else {
            this.stopMovementAudio();
        }
    }
}
