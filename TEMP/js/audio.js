(function (global) {
    "use strict";

    var LXH = global.LXH = global.LXH || {};
    var SILENCE = 0.0001;
    var AudioContextClass = global.AudioContext || global.webkitAudioContext;

    function midiFrequency(note) {
        return 440 * Math.pow(2, (note - 69) / 12);
    }

    function AudioSystem(game) {
        this.game = game || null;
        this.enabled = !(game && game.settings && game.settings.sound === false);
        this.supported = !!AudioContextClass;
        this.unlocked = false;
        this.ctx = null;
        this.master = null;
        this.ambienceBus = null;
        this.musicBus = null;
        this.sfxBus = null;
        this.noiseBuffer = null;
        this.ambientSource = null;
        this.ambientLfo = null;
        this._masterLevel = 0.58;
        this._hidden = typeof document !== "undefined" && document.hidden;
        this._destroyed = false;
        this._ambienceStarted = false;
        this._unlockPromise = null;
        this._suspendTimer = 0;
        this._nextMusicTime = 0;
        this._nextBirdTime = 0;
        this._musicStep = 0;
        this._lastPlayed = Object.create(null);
        this._musicPattern = [
            62, null, 69, null, 66, null, 64, null,
            null, null, 69, null, 71, null, 66, null,
            64, null, 66, null, 69, null, 74, null,
            71, null, 69, null, 66, null, null, null
        ];

        var self = this;
        this._gestureHandler = function () {
            if (self.enabled && !self._destroyed) {
                self.unlock();
            }
        };
        this._visibilityHandler = function () {
            self._hidden = typeof document !== "undefined" && document.hidden;
            if (self._hidden) {
                self._suspendForHiddenPage();
            } else if (self.enabled && self.unlocked) {
                self._resumeContext();
            }
        };
        this._pageHideHandler = function () {
            self._hidden = true;
            self._suspendForHiddenPage();
        };
        this._pageShowHandler = function () {
            self._visibilityHandler();
        };

        if (typeof document !== "undefined") {
            document.addEventListener("pointerdown", this._gestureHandler, true);
            document.addEventListener("mousedown", this._gestureHandler, true);
            document.addEventListener("touchstart", this._gestureHandler, true);
            document.addEventListener("keydown", this._gestureHandler, true);
            document.addEventListener("visibilitychange", this._visibilityHandler, false);
        }
        if (global.addEventListener) {
            global.addEventListener("pagehide", this._pageHideHandler, false);
            global.addEventListener("pageshow", this._pageShowHandler, false);
        }
    }

    AudioSystem.prototype.unlock = function () {
        var self = this;
        var resumeResult;

        if (this._destroyed || !this.supported || !this.enabled || this._hidden) {
            return Promise.resolve(false);
        }

        if (!this.ctx) {
            try {
                this.ctx = new AudioContextClass();
                this._buildGraph();
            } catch (error) {
                var failedContext = this.ctx;
                this.ctx = null;
                if (failedContext && failedContext.close) {
                    try {
                        failedContext.close();
                    } catch (closeError) {}
                }
                return Promise.resolve(false);
            }
        }

        if (this.ctx.state === "running") {
            this.unlocked = true;
            this._removeGestureListeners();
            this._activate();
            return Promise.resolve(true);
        }

        if (this._unlockPromise) {
            return this._unlockPromise;
        }

        try {
            resumeResult = this.ctx.resume();
        } catch (error) {
            return Promise.resolve(false);
        }

        var pending = Promise.resolve(resumeResult).then(function () {
            if (!self.ctx || self._destroyed) {
                return false;
            }
            self.unlocked = self.ctx.state === "running";
            if (self.unlocked) {
                self._removeGestureListeners();
                if (self.enabled && !self._hidden) {
                    self._activate();
                } else {
                    self._suspendForHiddenPage();
                }
            }
            return self.unlocked;
        }).catch(function () {
            return false;
        });

        this._unlockPromise = pending;
        pending.then(function () {
            if (self._unlockPromise === pending) {
                self._unlockPromise = null;
            }
        });
        return pending;
    };

    AudioSystem.prototype._buildGraph = function () {
        var ctx = this.ctx;
        var limiter = ctx.createDynamicsCompressor();

        this.master = ctx.createGain();
        this.master.gain.value = 0;
        limiter.threshold.value = -20;
        limiter.knee.value = 18;
        limiter.ratio.value = 5;
        limiter.attack.value = 0.008;
        limiter.release.value = 0.22;

        this.ambienceBus = ctx.createGain();
        this.ambienceBus.gain.value = 0.72;
        this.musicBus = ctx.createGain();
        this.musicBus.gain.value = 0.4;
        this.sfxBus = ctx.createGain();
        this.sfxBus.gain.value = 0.72;

        this.ambienceBus.connect(limiter);
        this.musicBus.connect(limiter);
        this.sfxBus.connect(limiter);
        limiter.connect(this.master);
        this.master.connect(ctx.destination);
        this.limiter = limiter;
        this.noiseBuffer = this._createNoiseBuffer(4);
    };

    AudioSystem.prototype._createNoiseBuffer = function (seconds) {
        var ctx = this.ctx;
        var length = Math.max(1, Math.floor(ctx.sampleRate * seconds));
        var buffer = ctx.createBuffer(2, length, ctx.sampleRate);
        var fadeLength = Math.min(Math.floor(ctx.sampleRate * 0.08), Math.floor(length / 4));

        for (var channel = 0; channel < 2; channel += 1) {
            var data = buffer.getChannelData(channel);
            var previous = 0;
            for (var i = 0; i < length; i += 1) {
                var white = Math.random() * 2 - 1;
                previous = (previous + white * 0.035) / 1.035;
                data[i] = (white * 0.42 + previous * 1.8) * 0.55;
            }
            for (var j = 0; j < fadeLength; j += 1) {
                var fade = j / fadeLength;
                data[j] *= fade;
                data[length - 1 - j] *= fade;
            }
        }
        return buffer;
    };

    AudioSystem.prototype._activate = function () {
        if (!this.ctx || !this.unlocked || !this.enabled || this._hidden || this._destroyed) {
            return;
        }
        this._clearSuspendTimer();
        this._startAmbience();
        this._fadeMaster(this._masterLevel, 0.12);
        this.update(0);
    };

    AudioSystem.prototype._startAmbience = function () {
        if (this._ambienceStarted || !this.ctx || !this.noiseBuffer) {
            return;
        }

        var ctx = this.ctx;
        var source = ctx.createBufferSource();
        var leavesHighpass = ctx.createBiquadFilter();
        var leavesLowpass = ctx.createBiquadFilter();
        var leavesGain = ctx.createGain();
        var windFilter = ctx.createBiquadFilter();
        var windGain = ctx.createGain();
        var lfo = ctx.createOscillator();
        var windDepth = ctx.createGain();
        var leavesDepth = ctx.createGain();

        source.buffer = this.noiseBuffer;
        source.loop = true;
        source.playbackRate.value = 0.83;

        leavesHighpass.type = "highpass";
        leavesHighpass.frequency.value = 260;
        leavesHighpass.Q.value = 0.25;
        leavesLowpass.type = "lowpass";
        leavesLowpass.frequency.value = 1900;
        leavesLowpass.Q.value = 0.35;
        leavesGain.gain.value = 0.075;

        windFilter.type = "lowpass";
        windFilter.frequency.value = 390;
        windFilter.Q.value = 0.3;
        windGain.gain.value = 0.12;

        lfo.type = "sine";
        lfo.frequency.value = 0.065;
        windDepth.gain.value = 0.032;
        leavesDepth.gain.value = 0.018;

        source.connect(leavesHighpass);
        leavesHighpass.connect(leavesLowpass);
        leavesLowpass.connect(leavesGain);
        leavesGain.connect(this.ambienceBus);
        source.connect(windFilter);
        windFilter.connect(windGain);
        windGain.connect(this.ambienceBus);
        lfo.connect(windDepth);
        windDepth.connect(windGain.gain);
        lfo.connect(leavesDepth);
        leavesDepth.connect(leavesGain.gain);

        source.start(0);
        lfo.start(0);
        this.ambientSource = source;
        this.ambientLfo = lfo;
        this._ambienceStarted = true;
    };

    AudioSystem.prototype.update = function (dt) {
        if (!this.ctx || !this.unlocked || !this.enabled || this._hidden || this._destroyed || this.ctx.state !== "running") {
            return;
        }

        var now = this.ctx.currentTime;
        var horizon = now + 0.32;
        var scheduled = 0;

        if (!isFinite(this._nextMusicTime) || this._nextMusicTime < now - 0.6 || this._nextMusicTime > now + 12) {
            this._nextMusicTime = now + 0.18;
        }

        while (this._nextMusicTime < horizon && scheduled < 4) {
            var note = this._musicPattern[this._musicStep];
            var start = Math.max(now + 0.015, this._nextMusicTime);
            if (note !== null) {
                var volume = this._musicStep % 8 === 0 ? 0.125 : 0.095;
                this._pluck(note, start, 1.75, this.musicBus, volume);
            }
            if (this._musicStep === 0 || this._musicStep === 16) {
                this._tone(midiFrequency(50), start, 2.8, "sine", 0.035, 0, this.musicBus, 0.12);
            }
            this._musicStep = (this._musicStep + 1) % this._musicPattern.length;
            this._nextMusicTime += 0.48;
            scheduled += 1;
        }

        if (!isFinite(this._nextBirdTime) || this._nextBirdTime <= 0 || this._nextBirdTime < now - 1) {
            this._nextBirdTime = now + 5 + Math.random() * 7;
        }
        if (this._nextBirdTime < horizon) {
            this._bird(Math.max(now + 0.02, this._nextBirdTime));
            this._nextBirdTime = now + 9 + Math.random() * 11;
        }
    };

    AudioSystem.prototype.play = function (name) {
        if (!this.ctx || !this.unlocked || !this.enabled || this._hidden || this._destroyed) {
            return false;
        }
        if (this.ctx.state !== "running") {
            this._resumeContext();
            if (this.ctx.state !== "running") {
                return false;
            }
        }

        var key = String(name || "").toLowerCase().replace(/[\s_\-]/g, "");
        var aliases = {
            spatial: "teleport",
            transfer: "teleport",
            "传送": "teleport",
            metalcontrol: "metal",
            "御金": "metal",
            interaction: "interact",
            dialogue: "interact",
            pickup: "interact",
            ui: "interact",
            click: "interact",
            select: "interact",
            "交互": "interact",
            hurt: "hit",
            damage: "hit",
            "受击": "hit",
            victory: "complete",
            win: "complete",
            ending: "complete",
            questcomplete: "complete",
            gamecomplete: "complete",
            pass: "complete",
            "通关": "complete",
            spirit: "heixiu"
        };
        key = aliases[key] || key;

        var cooldowns = {
            teleport: 0.12,
            metal: 0.055,
            interact: 0.045,
            hit: 0.1,
            complete: 0.8,
            dash: 0.07,
            heixiu: 0.08,
            heal: 0.15
        };
        if (!cooldowns[key]) {
            return false;
        }

        var now = this.ctx.currentTime;
        if (this._lastPlayed[key] !== undefined && now - this._lastPlayed[key] < cooldowns[key]) {
            return false;
        }
        this._lastPlayed[key] = now;

        try {
            switch (key) {
                case "teleport":
                    this._soundTeleport(now + 0.008);
                    break;
                case "metal":
                    this._soundMetal(now + 0.008);
                    break;
                case "interact":
                    this._soundInteract(now + 0.008);
                    break;
                case "hit":
                    this._soundHit(now + 0.008);
                    break;
                case "complete":
                    this._soundComplete(now + 0.008);
                    break;
                case "dash":
                    this._soundDash(now + 0.008);
                    break;
                case "heixiu":
                    this._soundHeixiu(now + 0.008);
                    break;
                case "heal":
                    this._soundHeal(now + 0.008);
                    break;
            }
            return true;
        } catch (error) {
            return false;
        }
    };

    AudioSystem.prototype.setEnabled = function (enabled) {
        var value = !!enabled;
        if (this._destroyed) {
            return false;
        }
        this._clearSuspendTimer();

        if (this.enabled === value) {
            if (value && this.ctx && this.unlocked && !this._hidden) {
                this._resumeContext();
            }
            return this.enabled;
        }

        this.enabled = value;
        if (!value) {
            this._fadeMaster(0, 0.035);
            var self = this;
            if (this.ctx && this.ctx.state === "running") {
                this._suspendTimer = global.setTimeout(function () {
                    self._suspendTimer = 0;
                    if ((!self.enabled || self._hidden) && self.ctx && self.ctx.state === "running") {
                        try {
                            var result = self.ctx.suspend();
                            if (result && result.catch) {
                                result.catch(function () {});
                            }
                        } catch (error) {}
                    }
                }, 90);
            }
        } else if (!this._hidden) {
            this.unlock();
        }
        return this.enabled;
    };

    AudioSystem.prototype._resumeContext = function () {
        var self = this;
        if (!this.ctx || this._destroyed || !this.enabled || this._hidden) {
            return;
        }
        this._clearSuspendTimer();
        if (this.ctx.state === "running") {
            this._activate();
            return;
        }
        try {
            var result = this.ctx.resume();
            Promise.resolve(result).then(function () {
                if (!self.ctx || self._destroyed || self.ctx.state !== "running") {
                    return;
                }
                if (self.enabled && !self._hidden) {
                    self.unlocked = true;
                    self._activate();
                } else {
                    self._suspendForHiddenPage();
                }
            }).catch(function () {});
        } catch (error) {}
    };

    AudioSystem.prototype._suspendForHiddenPage = function () {
        this._clearSuspendTimer();
        if (!this.ctx || this._destroyed) {
            return;
        }
        if (this.master) {
            var now = this.ctx.currentTime;
            this.master.gain.cancelScheduledValues(now);
            this.master.gain.setValueAtTime(0, now);
        }
        if (this.ctx.state === "running") {
            try {
                var result = this.ctx.suspend();
                if (result && result.catch) {
                    result.catch(function () {});
                }
            } catch (error) {}
        }
    };

    AudioSystem.prototype._clearSuspendTimer = function () {
        if (this._suspendTimer) {
            global.clearTimeout(this._suspendTimer);
            this._suspendTimer = 0;
        }
    };

    AudioSystem.prototype._fadeMaster = function (value, duration) {
        if (!this.ctx || !this.master) {
            return;
        }
        var now = this.ctx.currentTime;
        var gain = this.master.gain;
        gain.cancelScheduledValues(now);
        gain.setValueAtTime(gain.value, now);
        gain.linearRampToValueAtTime(value, now + Math.max(0.005, duration || 0.005));
    };

    AudioSystem.prototype._removeGestureListeners = function () {
        if (typeof document === "undefined") {
            return;
        }
        document.removeEventListener("pointerdown", this._gestureHandler, true);
        document.removeEventListener("mousedown", this._gestureHandler, true);
        document.removeEventListener("touchstart", this._gestureHandler, true);
        document.removeEventListener("keydown", this._gestureHandler, true);
    };

    AudioSystem.prototype._tone = function (frequency, start, duration, type, volume, endFrequency, bus, attack) {
        var ctx = this.ctx;
        var oscillator = ctx.createOscillator();
        var envelope = ctx.createGain();
        var destination = bus || this.sfxBus;
        var attackTime = Math.min(duration * 0.35, attack || 0.012);

        oscillator.type = type || "sine";
        oscillator.frequency.setValueAtTime(Math.max(20, frequency), start);
        if (endFrequency > 0) {
            oscillator.frequency.exponentialRampToValueAtTime(Math.max(20, endFrequency), start + duration);
        }
        envelope.gain.setValueAtTime(SILENCE, start);
        envelope.gain.exponentialRampToValueAtTime(Math.max(SILENCE, volume), start + attackTime);
        envelope.gain.exponentialRampToValueAtTime(SILENCE, start + duration);

        oscillator.connect(envelope);
        envelope.connect(destination);
        oscillator.start(start);
        oscillator.stop(start + duration + 0.035);
        oscillator.onended = function () {
            oscillator.disconnect();
            envelope.disconnect();
        };
        return oscillator;
    };

    AudioSystem.prototype._pluck = function (note, start, duration, bus, volume) {
        var ctx = this.ctx;
        var fundamental = ctx.createOscillator();
        var overtone = ctx.createOscillator();
        var overtoneGain = ctx.createGain();
        var envelope = ctx.createGain();
        var filter = ctx.createBiquadFilter();
        var frequency = midiFrequency(note);

        fundamental.type = "triangle";
        fundamental.frequency.setValueAtTime(frequency, start);
        overtone.type = "sine";
        overtone.frequency.setValueAtTime(frequency * 2.002, start);
        overtoneGain.gain.value = 0.16;
        envelope.gain.setValueAtTime(SILENCE, start);
        envelope.gain.exponentialRampToValueAtTime(volume, start + 0.022);
        envelope.gain.exponentialRampToValueAtTime(SILENCE, start + duration);
        filter.type = "lowpass";
        filter.frequency.value = Math.min(3400, Math.max(1200, frequency * 5));
        filter.Q.value = 0.35;

        fundamental.connect(envelope);
        overtone.connect(overtoneGain);
        overtoneGain.connect(envelope);
        envelope.connect(filter);
        filter.connect(bus || this.musicBus);
        fundamental.start(start);
        overtone.start(start);
        fundamental.stop(start + duration + 0.04);
        overtone.stop(start + duration + 0.04);
        fundamental.onended = function () {
            fundamental.disconnect();
            overtone.disconnect();
            overtoneGain.disconnect();
            envelope.disconnect();
            filter.disconnect();
        };
    };

    AudioSystem.prototype._noiseBurst = function (start, duration, volume, frequency, endFrequency, filterType, q) {
        var ctx = this.ctx;
        var source = ctx.createBufferSource();
        var filter = ctx.createBiquadFilter();
        var envelope = ctx.createGain();
        var maxOffset = Math.max(0, this.noiseBuffer.duration - duration - 0.05);

        source.buffer = this.noiseBuffer;
        filter.type = filterType || "bandpass";
        filter.frequency.setValueAtTime(frequency, start);
        filter.Q.value = q || 0.7;
        if (endFrequency > 0) {
            filter.frequency.exponentialRampToValueAtTime(endFrequency, start + duration);
        }
        envelope.gain.setValueAtTime(SILENCE, start);
        envelope.gain.exponentialRampToValueAtTime(volume, start + Math.min(0.018, duration * 0.2));
        envelope.gain.exponentialRampToValueAtTime(SILENCE, start + duration);

        source.connect(filter);
        filter.connect(envelope);
        envelope.connect(this.sfxBus);
        source.start(start, Math.random() * maxOffset, duration + 0.03);
        source.stop(start + duration + 0.04);
        source.onended = function () {
            source.disconnect();
            filter.disconnect();
            envelope.disconnect();
        };
    };

    AudioSystem.prototype._bird = function (start) {
        var base = 1280 + Math.random() * 180;
        this._tone(base, start, 0.17, "sine", 0.022, base * 1.31, this.ambienceBus, 0.025);
        this._tone(base * 1.18, start + 0.16, 0.2, "sine", 0.018, base * 0.96, this.ambienceBus, 0.02);
        if (Math.random() > 0.45) {
            this._tone(base * 1.08, start + 0.39, 0.16, "sine", 0.014, base * 1.25, this.ambienceBus, 0.02);
        }
    };

    AudioSystem.prototype._soundTeleport = function (start) {
        this._noiseBurst(start, 0.58, 0.11, 360, 2100, "bandpass", 0.8);
        this._tone(230, start, 0.58, "sine", 0.075, 820, this.sfxBus, 0.025);
        this._tone(690, start + 0.055, 0.48, "triangle", 0.035, 185, this.sfxBus, 0.035);
        this._pluck(74, start + 0.31, 0.85, this.sfxBus, 0.07);
    };

    AudioSystem.prototype._soundMetal = function (start) {
        var base = 310 + Math.random() * 35;
        this._tone(base, start, 0.5, "sine", 0.09, base * 0.985, this.sfxBus, 0.006);
        this._tone(base * 2.756, start, 0.3, "sine", 0.033, base * 2.71, this.sfxBus, 0.004);
        this._tone(base * 4.95, start, 0.18, "sine", 0.012, base * 4.8, this.sfxBus, 0.003);
    };

    AudioSystem.prototype._soundInteract = function (start) {
        this._tone(midiFrequency(74), start, 0.2, "sine", 0.075, 0, this.sfxBus, 0.008);
        this._tone(midiFrequency(81), start + 0.065, 0.28, "triangle", 0.045, 0, this.sfxBus, 0.012);
    };

    AudioSystem.prototype._soundHit = function (start) {
        this._noiseBurst(start, 0.22, 0.12, 310, 120, "lowpass", 0.65);
        this._tone(145, start, 0.26, "triangle", 0.1, 72, this.sfxBus, 0.006);
    };

    AudioSystem.prototype._soundComplete = function (start) {
        var notes = [62, 66, 69, 71, 74, 81];
        var offsets = [0, 0.15, 0.3, 0.45, 0.64, 0.9];
        for (var i = 0; i < notes.length; i += 1) {
            this._pluck(notes[i], start + offsets[i], i === notes.length - 1 ? 2.1 : 1.15, this.sfxBus, i === notes.length - 1 ? 0.13 : 0.1);
        }
        this._tone(midiFrequency(50), start + 0.82, 2.15, "sine", 0.04, 0, this.sfxBus, 0.08);
        this._tone(midiFrequency(57), start + 0.82, 2.15, "sine", 0.025, 0, this.sfxBus, 0.08);
    };

    AudioSystem.prototype._soundDash = function (start) {
        this._noiseBurst(start, 0.18, 0.055, 520, 1350, "bandpass", 0.75);
        this._tone(240, start, 0.16, "sine", 0.035, 410, this.sfxBus, 0.008);
    };

    AudioSystem.prototype._soundHeixiu = function (start) {
        this._tone(390, start, 0.22, "sine", 0.055, 570, this.sfxBus, 0.025);
        this._tone(585, start + 0.1, 0.25, "sine", 0.04, 460, this.sfxBus, 0.02);
    };

    AudioSystem.prototype._soundHeal = function (start) {
        this._pluck(62, start, 0.9, this.sfxBus, 0.065);
        this._pluck(66, start + 0.12, 1, this.sfxBus, 0.06);
        this._pluck(69, start + 0.24, 1.2, this.sfxBus, 0.06);
    };

    AudioSystem.prototype.destroy = function () {
        if (this._destroyed) {
            return;
        }
        this._destroyed = true;
        this.enabled = false;
        this._clearSuspendTimer();
        this._removeGestureListeners();
        if (typeof document !== "undefined") {
            document.removeEventListener("visibilitychange", this._visibilityHandler, false);
        }
        if (global.removeEventListener) {
            global.removeEventListener("pagehide", this._pageHideHandler, false);
            global.removeEventListener("pageshow", this._pageShowHandler, false);
        }
        if (this.ambientSource) {
            try {
                this.ambientSource.stop();
            } catch (error) {}
        }
        if (this.ambientLfo) {
            try {
                this.ambientLfo.stop();
            } catch (error) {}
        }
        if (this.ctx && this.ctx.state !== "closed") {
            try {
                var result = this.ctx.close();
                if (result && result.catch) {
                    result.catch(function () {});
                }
            } catch (error) {}
        }
        this.unlocked = false;
    };

    LXH.AudioSystem = AudioSystem;
})(typeof window !== "undefined" ? window : globalThis);
