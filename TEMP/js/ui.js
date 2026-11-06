(function (window, document) {
    'use strict';

    var LXH = window.LXH = window.LXH || {};
    var SETTINGS_KEY = 'lxh-yeji-settings-v1';
    var DEFAULT_SETTINGS = {
        moveSpeed: 1,
        flightSpeed: 1,
        timeScale: 1,
        dayTime: 0.34,
        autoDay: true,
        lighting: true,
        quality: 'high',
        sound: true,
        reducedMotion: false
    };
    var OVERLAYS = {
        pause: 'pause-screen',
        settings: 'settings-screen',
        codex: 'codex-screen',
        sources: 'codex-screen',
        help: 'help-screen',
        ending: 'ending-screen'
    };
    var ABILITIES = ['teleport', 'metal', 'dash', 'heixiu'];

    function finite(value, fallback) {
        var number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function asText(value) {
        if (value === null || value === undefined) return '';
        if (typeof value === 'string' || typeof value === 'number') return String(value);
        if (Array.isArray(value)) {
            return value.map(asText).filter(Boolean).join('、');
        }
        if (typeof value === 'object') {
            return asText(value.name || value.title || value.text || value.label || value.id || value.url || value.href || '');
        }
        return '';
    }

    function readSettings() {
        try {
            var raw = window.localStorage.getItem(SETTINGS_KEY);
            if (!raw) return {};
            var parsed = JSON.parse(raw);
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (error) {
            return {};
        }
    }

    function writeSettings(settings) {
        var saved = {};
        Object.keys(DEFAULT_SETTINGS).forEach(function (key) {
            saved[key] = settings[key];
        });
        try {
            window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(saved));
        } catch (error) {
            return false;
        }
        return true;
    }

    function timeText(value) {
        var ratio = ((finite(value, 0.34) % 1) + 1) % 1;
        var minutes = Math.floor(ratio * 24 * 60 + 0.5) % (24 * 60);
        var hours = Math.floor(minutes / 60);
        return String(hours).padStart(2, '0') + ':' + String(minutes % 60).padStart(2, '0');
    }

    function collectionItems(collection) {
        if (!collection) return [];
        if (Array.isArray(collection)) return collection.slice();
        if (Array.isArray(collection.items)) return collection.items.slice();
        if (Array.isArray(collection.entries)) return collection.entries.slice();
        if (typeof collection === 'object') {
            return Object.keys(collection).map(function (key) {
                var value = collection[key];
                if (value && typeof value === 'object' && !Array.isArray(value)) {
                    var copy = Object.assign({}, value);
                    if (!copy.name && !copy.title) copy.name = key;
                    if (!copy.id) copy.id = key;
                    return copy;
                }
                return { name: key, description: value };
            });
        }
        return [{ name: '手账记录', description: collection }];
    }

    function UI(game) {
        if (UI.instance) {
            if (game) UI.instance.attachGame(game);
            return UI.instance;
        }
        UI.instance = this;
        this.game = null;
        this.dom = {};
        this.storedSettings = readSettings();
        this.motionExplicit = Object.prototype.hasOwnProperty.call(this.storedSettings, 'reducedMotion');
        this.settings = Object.assign({}, DEFAULT_SETTINGS, this.storedSettings);
        this.activeOverlay = null;
        this.overlayStack = [];
        this.focusStack = [];
        this.pausedByOverlay = false;
        this.lastFocus = null;
        this.codexTab = 'characters';
        this.codexSearch = '';
        this.dialogueQueue = [];
        this.currentDialogue = null;
        this.objective = null;
        this.armedAbility = null;
        this.joystickPointer = null;
        this.touchPointers = new Map();
        this.touchVector = { x: 0, y: 0 };
        this.lastTouchTrigger = 0;
        this.lastToast = { text: '', time: 0 };
        this.hudCache = Object.create(null);
        this.objectiveClock = 0;
        this.pausedLast = false;
        this.endingVisible = false;
        this.boundGame = null;
        this._cacheDOM();
        this._detectCapabilities();
        this._bindEvents();
        this._setupSettings();
        this._setupCodex();
        this.refreshContinue();
        this.attachGame(game || null);
        this._renderCodex();
    }

    UI.prototype._cacheDOM = function () {
        var ids = [
            'launch-screen', 'game-shell', 'game-canvas', 'start-game', 'continue-game', 'boot-error',
            'health-meter', 'health-fill', 'health-value', 'energy-meter', 'energy-fill', 'energy-value',
            'hud-form', 'hud-zone', 'hud-time', 'time-icon', 'objective-title', 'objective-detail',
            'objective-progress', 'objective-progress-fill', 'objective-count', 'interaction-hint',
            'interaction-text', 'ability-dock', 'touch-controls', 'joystick-zone', 'joystick-base',
            'joystick-knob', 'dialogue-box', 'dialogue-portrait', 'dialogue-speaker', 'dialogue-text',
            'dialogue-progress', 'dialogue-next', 'toast-region', 'aim-hint', 'overlay-backdrop',
            'pause-screen', 'pause-button', 'resume-button', 'save-button', 'restart-button',
            'restart-confirm', 'restart-confirm-yes', 'restart-confirm-no', 'title-button',
            'settings-screen', 'settings-form', 'reset-settings', 'fullscreen-button', 'codex-screen',
            'codex-panel', 'codex-content', 'codex-search', 'help-screen', 'ending-screen',
            'ending-title', 'ending-text', 'ending-stats', 'ending-roam', 'ending-restart',
            'ending-title-button'
        ];
        for (var i = 0; i < ids.length; i += 1) this.dom[ids[i]] = document.getElementById(ids[i]);
        this.abilityButtons = Array.prototype.slice.call(document.querySelectorAll('[data-ability], [data-touch-action="teleport"], [data-touch-action="metal"], [data-touch-action="dash"], [data-touch-action="heixiu"]'));
        this.overlayElements = Array.prototype.slice.call(document.querySelectorAll('.overlay'));
        if (this.dom['toast-region'] && this.dom['toast-region'].parentElement !== document.getElementById('main-content')) {
            document.getElementById('main-content').appendChild(this.dom['toast-region']);
        }
    };

    UI.prototype._detectCapabilities = function () {
        var coarse = false;
        try {
            coarse = window.matchMedia('(pointer: coarse)').matches;
        } catch (error) {
            coarse = false;
        }
        this.touchCapable = coarse || finite(window.navigator.maxTouchPoints, 0) > 0;
        document.body.classList.toggle('touch-capable', this.touchCapable);
        this.motionQuery = null;
        try {
            this.motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
            if (!this.motionExplicit && this.motionQuery.matches) this.settings.reducedMotion = true;
        } catch (error) {
            this.motionQuery = null;
        }
    };

    UI.prototype._bindEvents = function () {
        var self = this;
        document.addEventListener('click', function (event) {
            var open = event.target.closest('[data-open]');
            if (open) {
                event.preventDefault();
                self._openNamed(open.getAttribute('data-open'), open);
                return;
            }
            var close = event.target.closest('[data-close]');
            if (close) {
                event.preventDefault();
                self.closeOverlay();
                return;
            }
            var ability = event.target.closest('[data-ability]');
            if (ability) {
                event.preventDefault();
                self._desktopAbility(ability.getAttribute('data-ability'));
                return;
            }
            var action = event.target.closest('[data-action]');
            if (action) {
                event.preventDefault();
                self._performAction(action.getAttribute('data-action'));
                return;
            }
            var tab = event.target.closest('[data-codex-tab]');
            if (tab) {
                event.preventDefault();
                self._selectCodexTab(tab.getAttribute('data-codex-tab'), true);
                return;
            }
            var touchAction = event.target.closest('[data-touch-action]');
            if (touchAction && event.detail === 0 && Date.now() - self.lastTouchTrigger > 450) {
                event.preventDefault();
                self._performAction(touchAction.getAttribute('data-touch-action'));
            }
        });

        this.overlayElements.forEach(function (overlay) {
            overlay.addEventListener('pointerdown', function (event) {
                if (event.target === overlay && overlay.id !== 'pause-screen' && overlay.id !== 'ending-screen') self.closeOverlay();
            });
        });

        this.dom['start-game'].addEventListener('click', function () { LXH.boot({ load: false }); });
        this.dom['continue-game'].addEventListener('click', function () { LXH.boot({ load: true }); });
        this.dom['pause-button'].addEventListener('click', function () { self.togglePause(true); });
        this.dom['resume-button'].addEventListener('click', function () { self.togglePause(false); });
        this.dom['save-button'].addEventListener('click', function () { self._saveGame(); });
        this.dom['restart-button'].addEventListener('click', function () {
            self.dom['restart-confirm'].hidden = false;
            self.dom['restart-confirm-yes'].focus();
        });
        this.dom['restart-confirm-no'].addEventListener('click', function () {
            self.dom['restart-confirm'].hidden = true;
            self.dom['restart-button'].focus();
        });
        this.dom['restart-confirm-yes'].addEventListener('click', function () { self._restartGame(); });
        this.dom['title-button'].addEventListener('click', function () { self._returnToTitle(); });
        this.dom['ending-title-button'].addEventListener('click', function () { self._returnToTitle(); });
        this.dom['ending-restart'].addEventListener('click', function () { self._restartGame(); });
        this.dom['ending-roam'].addEventListener('click', function () {
            self.endingVisible = false;
            self._closeAllOverlays(false);
            if (self.game) self.game.paused = false;
            self._focusCanvas();
        });
        this.dom['dialogue-next'].addEventListener('click', function () { self._advanceDialogue(); });
        this.dom['reset-settings'].addEventListener('click', function () { self._resetSettings(); });
        this.dom['fullscreen-button'].addEventListener('click', function () { self._toggleFullscreen(); });
        this.dom['codex-search'].addEventListener('input', function () {
            self.codexSearch = self.dom['codex-search'].value;
            self._renderCodex();
        });

        document.querySelector('.codex-tabs').addEventListener('keydown', function (event) {
            if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) return;
            var tabs = Array.prototype.slice.call(document.querySelectorAll('[data-codex-tab]'));
            var index = tabs.indexOf(document.activeElement);
            if (index < 0) return;
            event.preventDefault();
            if (event.key === 'Home') index = 0;
            else if (event.key === 'End') index = tabs.length - 1;
            else index = (index + (event.key === 'ArrowRight' ? 1 : -1) + tabs.length) % tabs.length;
            self._selectCodexTab(tabs[index].getAttribute('data-codex-tab'), true);
        });

        this._bindCanvas();
        this._bindTouch();
        document.addEventListener('keydown', function (event) { self._onKeyDown(event); });
        window.addEventListener('blur', function () { self._releaseAllInput(); });
        document.addEventListener('visibilitychange', function () {
            if (document.hidden) self._releaseAllInput();
        });
        window.addEventListener('pagehide', function () { self._releaseAllInput(); });
        var fitCanvas = function () {
            var canvas = self.dom['game-canvas'];
            canvas.style.width = '100%';
            canvas.style.height = '100%';
            if (self.game && typeof self.game.resize === 'function') self.game.resize();
        };
        window.addEventListener('resize', fitCanvas);
        window.addEventListener('orientationchange', function () { window.setTimeout(fitCanvas, 0); });
        if (window.visualViewport) window.visualViewport.addEventListener('resize', fitCanvas);
        if (this.motionQuery) {
            var motionChanged = function (event) {
                if (!self.motionExplicit) {
                    self.settings.reducedMotion = event.matches;
                    self._applySettings();
                    self._syncSettingsForm();
                }
            };
            if (typeof this.motionQuery.addEventListener === 'function') this.motionQuery.addEventListener('change', motionChanged);
            else if (typeof this.motionQuery.addListener === 'function') this.motionQuery.addListener(motionChanged);
        }
    };

    UI.prototype._bindCanvas = function () {
        var self = this;
        var canvas = this.dom['game-canvas'];
        canvas.addEventListener('pointerdown', function (event) {
            if (!self.armedAbility || !self.game || self.game.paused) return;
            if (event.button !== undefined && event.button !== 0) return;
            event.preventDefault();
            event.stopImmediatePropagation();
            var rect = canvas.getBoundingClientRect();
            var logicalWidth = finite(self.game.width, rect.width) || rect.width;
            var logicalHeight = finite(self.game.height, rect.height) || rect.height;
            var x = (event.clientX - rect.left) * logicalWidth / Math.max(1, rect.width);
            var y = (event.clientY - rect.top) * logicalHeight / Math.max(1, rect.height);
            var used = self._useAbility(self.armedAbility, x, y);
            if (used !== false) self._disarmAbility();
        }, { capture: true });
        canvas.addEventListener('contextmenu', function (event) {
            if (self.armedAbility) {
                event.preventDefault();
                self._disarmAbility();
            }
        });
        document.addEventListener('pointerdown', function (event) {
            if (event.button === 2 && self.armedAbility) self._disarmAbility();
        });
    };

    UI.prototype._bindTouch = function () {
        var self = this;
        var zone = this.dom['joystick-zone'];
        zone.addEventListener('pointerdown', function (event) {
            if (!self.game || self.game.paused || self.activeOverlay || self.currentDialogue) return;
            if (self.joystickPointer !== null) return;
            event.preventDefault();
            self.joystickPointer = event.pointerId;
            try { zone.setPointerCapture(event.pointerId); } catch (error) { /* 部分旧浏览器不支持捕获。 */ }
            zone.classList.add('is-active');
            self._updateJoystick(event);
        });
        zone.addEventListener('pointermove', function (event) {
            if (event.pointerId !== self.joystickPointer) return;
            event.preventDefault();
            self._updateJoystick(event);
        });
        function releaseJoystick(event) {
            if (event.pointerId !== self.joystickPointer) return;
            event.preventDefault();
            self._resetJoystick();
        }
        zone.addEventListener('pointerup', releaseJoystick);
        zone.addEventListener('pointercancel', releaseJoystick);
        zone.addEventListener('lostpointercapture', function (event) {
            if (event.pointerId === self.joystickPointer) self._resetJoystick();
        });

        var buttons = document.querySelectorAll('[data-touch-action]');
        buttons.forEach(function (button) {
            button.addEventListener('pointerdown', function (event) {
                if (!self.game || self.game.paused || self.activeOverlay || self.currentDialogue) return;
                if (event.button !== undefined && event.button !== 0) return;
                event.preventDefault();
                event.stopPropagation();
                try { button.setPointerCapture(event.pointerId); } catch (error) { /* 无需额外处理。 */ }
                self.touchPointers.set(event.pointerId, button);
                button.classList.add('is-active');
                self.lastTouchTrigger = Date.now();
                self._performAction(button.getAttribute('data-touch-action'));
            });
            function release(event) {
                var held = self.touchPointers.get(event.pointerId);
                if (!held) return;
                self.touchPointers.delete(event.pointerId);
                var stillHeld = false;
                self.touchPointers.forEach(function (other) { if (other === held) stillHeld = true; });
                if (!stillHeld) held.classList.remove('is-active');
            }
            button.addEventListener('pointerup', release);
            button.addEventListener('pointercancel', release);
            button.addEventListener('lostpointercapture', release);
        });
    };

    UI.prototype._updateJoystick = function (event) {
        var base = this.dom['joystick-base'];
        var rect = base.getBoundingClientRect();
        var radius = Math.max(24, rect.width * 0.32);
        var dx = event.clientX - (rect.left + rect.width / 2);
        var dy = event.clientY - (rect.top + rect.height / 2);
        var length = Math.hypot(dx, dy);
        if (length > radius) {
            dx = dx / length * radius;
            dy = dy / length * radius;
        }
        var x = dx / radius;
        var y = dy / radius;
        var strength = Math.hypot(x, y);
        if (strength < 0.08) { x = 0; y = 0; }
        this.touchVector.x = x;
        this.touchVector.y = y;
        this.dom['joystick-knob'].style.transform = 'translate(calc(-50% + ' + dx.toFixed(1) + 'px), calc(-50% + ' + dy.toFixed(1) + 'px))';
        this._writeInput({ x: x, y: y });
    };

    UI.prototype._resetJoystick = function () {
        this.joystickPointer = null;
        this.touchVector.x = 0;
        this.touchVector.y = 0;
        this.dom['joystick-zone'].classList.remove('is-active');
        this.dom['joystick-knob'].style.transform = '';
        this._writeInput({ x: 0, y: 0 });
    };

    UI.prototype._releaseAllInput = function () {
        this._resetJoystick();
        this.touchPointers.forEach(function (button) { button.classList.remove('is-active'); });
        this.touchPointers.clear();
        this._writeInput({ x: 0, y: 0, run: false, fly: false });
        if (this.game && this.game.keys && typeof this.game.keys.clear === 'function') this.game.keys.clear();
        this._disarmAbility();
    };

    UI.prototype._writeInput = function (values) {
        if (!this.game) return;
        var input = this.game.input = this.game.input || { x: 0, y: 0, run: false, fly: false };
        Object.keys(values).forEach(function (key) { input[key] = values[key]; });
    };

    UI.prototype._onKeyDown = function (event) {
        if (event.key === 'Tab' && this.activeOverlay) {
            this._trapFocus(event);
            return;
        }
        if (event.key === 'Escape') {
            event.stopImmediatePropagation();
            if (this.armedAbility) {
                event.preventDefault();
                this._disarmAbility();
                return;
            }
            if (this.currentDialogue && !this.activeOverlay) {
                event.preventDefault();
                this._advanceDialogue();
                return;
            }
            if (this.activeOverlay) {
                event.preventDefault();
                if (this.activeOverlay === 'pause-screen') this.togglePause(false);
                else if (this.activeOverlay === 'ending-screen') this.dom['ending-roam'].click();
                else this.closeOverlay();
                return;
            }
            if (document.body.classList.contains('is-playing')) {
                event.preventDefault();
                this.togglePause(true);
            }
            return;
        }
        if (this.activeOverlay || event.ctrlKey || event.metaKey || event.altKey) return;
        var tag = event.target && event.target.tagName;
        if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || (event.target && event.target.isContentEditable)) return;
        if (this.currentDialogue && (event.key === 'Enter' || event.key === ' ') && (event.target === document.body || event.target === this.dom['game-canvas'])) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this._advanceDialogue();
            return;
        }
        if (event.repeat) return;
        if (event.code === 'KeyI') {
            event.preventDefault();
            event.stopImmediatePropagation();
            this._openNamed('codex', document.activeElement);
        } else if (event.code === 'KeyH') {
            event.preventDefault();
            event.stopImmediatePropagation();
            this._openNamed('help', document.activeElement);
        } else if (event.code === 'KeyP' && document.body.classList.contains('is-playing')) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this.togglePause(true);
        } else if (event.code === 'KeyR' && this.game && !this.game.paused) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this._useDirectionalAbility('heixiu');
        } else if (event.code === 'KeyV' && this.game && !this.game.paused) {
            event.preventDefault();
            event.stopImmediatePropagation();
            this._performAction('fly');
        }
    };

    UI.prototype._trapFocus = function (event) {
        var overlay = document.getElementById(this.activeOverlay);
        if (!overlay) return;
        var selectors = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';
        var items = Array.prototype.slice.call(overlay.querySelectorAll(selectors)).filter(function (element) {
            return !element.hidden && element.getAttribute('aria-hidden') !== 'true' && element.getClientRects().length > 0;
        });
        if (!items.length) {
            event.preventDefault();
            overlay.setAttribute('tabindex', '-1');
            overlay.focus();
            return;
        }
        var first = items[0];
        var last = items[items.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        } else if (!overlay.contains(document.activeElement)) {
            event.preventDefault();
            first.focus();
        }
    };

    UI.prototype.attachGame = function (game) {
        if (game) this.game = game;
        if (!this.game) {
            this.settings = Object.assign({}, DEFAULT_SETTINGS, this.settings, this.storedSettings);
            this._applySettings();
            this._syncSettingsForm();
            return this;
        }
        var gameSettings = this.game.settings || {};
        this.game.settings = Object.assign({}, DEFAULT_SETTINGS, gameSettings, this.storedSettings);
        this.settings = this.game.settings;
        this.game.input = this.game.input || { x: 0, y: 0, run: false, fly: false };
        this.game.ui = this;
        if (this.boundGame !== this.game) {
            this.boundGame = this.game;
            this.pausedLast = !!this.game.paused;
            this.objectiveClock = 0;
            this._clearDialogue();
        }
        this._applySettings();
        this._syncSettingsForm();
        this.refreshContinue();
        return this;
    };

    UI.prototype._setupSettings = function () {
        var self = this;
        var form = this.dom['settings-form'];
        form.addEventListener('input', function (event) {
            var input = event.target;
            if (!input.name) return;
            self._changeSetting(input);
        });
        form.addEventListener('change', function (event) {
            var input = event.target;
            if (!input.name) return;
            self._changeSetting(input);
        });
        this._syncSettingsForm();
    };

    UI.prototype._changeSetting = function (input) {
        var key = input.name;
        if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, key)) return;
        var value;
        if (input.type === 'checkbox') value = input.checked;
        else if (input.type === 'range') value = finite(input.value, DEFAULT_SETTINGS[key]);
        else value = input.value;
        if (key === 'quality' && !['high', 'medium', 'low'].includes(value)) value = 'high';
        this.settings[key] = value;
        if (key === 'dayTime') this.settings.autoDay = false;
        if (key === 'reducedMotion') this.motionExplicit = true;
        this.storedSettings = Object.assign({}, this.storedSettings);
        this.storedSettings[key] = value;
        if (key === 'dayTime') this.storedSettings.autoDay = false;
        if (this.game) this.game.settings = this.settings;
        this._applySettings();
        this._syncSettingsForm();
        writeSettings(this.settings);
    };

    UI.prototype._applySettings = function () {
        var settings = this.settings || DEFAULT_SETTINGS;
        var previousQuality = this.appliedQuality;
        this.appliedQuality = settings.quality || 'high';
        document.body.classList.toggle('reduced-motion', !!settings.reducedMotion);
        document.body.setAttribute('data-quality', this.appliedQuality);
        if (this.game) {
            this.game.settings = settings;
            if (this.game.audio && typeof this.game.audio.setEnabled === 'function') this.game.audio.setEnabled(!!settings.sound);
            if (previousQuality && previousQuality !== this.appliedQuality && typeof this.game.resize === 'function') {
                this.dom['game-canvas'].style.width = '100%';
                this.dom['game-canvas'].style.height = '100%';
                this.game.resize();
            }
        }
    };

    UI.prototype._syncSettingsForm = function () {
        if (!this.dom['settings-form']) return;
        var settings = this.settings || DEFAULT_SETTINGS;
        var fields = {
            moveSpeed: 'setting-move', flightSpeed: 'setting-flight', timeScale: 'setting-time-scale',
            dayTime: 'setting-day', autoDay: 'setting-auto-day', lighting: 'setting-lighting',
            quality: 'setting-quality', sound: 'setting-sound', reducedMotion: 'setting-motion'
        };
        Object.keys(fields).forEach(function (key) {
            var input = document.getElementById(fields[key]);
            if (!input) return;
            if (input.type === 'checkbox') input.checked = !!settings[key];
            else input.value = settings[key];
        });
        document.getElementById('setting-move-value').value = finite(settings.moveSpeed, 1).toFixed(1) + '×';
        document.getElementById('setting-flight-value').value = finite(settings.flightSpeed, 1).toFixed(1) + '×';
        document.getElementById('setting-time-scale-value').value = finite(settings.timeScale, 1).toFixed(1) + '×';
        document.getElementById('setting-day-value').value = timeText(settings.dayTime);
        document.getElementById('setting-auto-day').checked = !!settings.autoDay;
    };

    UI.prototype._resetSettings = function () {
        var reduced = this.motionQuery && this.motionQuery.matches;
        this.settings = Object.assign({}, DEFAULT_SETTINGS, { reducedMotion: !!reduced });
        this.storedSettings = {};
        this.motionExplicit = false;
        if (this.game) this.game.settings = this.settings;
        this._applySettings();
        this._syncSettingsForm();
        writeSettings(this.settings);
        this.toast('已恢复默认旅途设置');
    };

    UI.prototype._toggleFullscreen = function () {
        var self = this;
        if (document.fullscreenElement) {
            var exit = document.exitFullscreen && document.exitFullscreen();
            if (exit && typeof exit.catch === 'function') exit.catch(function () { self.toast('暂时无法退出全屏'); });
            return;
        }
        var root = document.documentElement;
        if (!root.requestFullscreen) {
            this.toast('当前浏览器不支持全屏，可横屏获得更宽视野');
            return;
        }
        try {
            var request = root.requestFullscreen();
            if (request && typeof request.catch === 'function') request.catch(function () { self.toast('全屏未开启，仍可正常游玩'); });
        } catch (error) {
            this.toast('全屏未开启，仍可正常游玩');
        }
    };

    UI.prototype._setupCodex = function () {
        this._selectCodexTab('characters', false);
    };

    UI.prototype._selectCodexTab = function (tab, focus) {
        var valid = ['characters', 'places', 'terms', 'questText', 'sources'];
        if (!valid.includes(tab)) tab = 'characters';
        this.codexTab = tab;
        var selected = document.querySelector('[data-codex-tab="' + tab + '"]');
        document.querySelectorAll('[data-codex-tab]').forEach(function (button) {
            var active = button === selected;
            button.setAttribute('aria-selected', active ? 'true' : 'false');
            button.tabIndex = active ? 0 : -1;
        });
        if (selected) {
            this.dom['codex-panel'].setAttribute('aria-labelledby', selected.id);
            if (focus) selected.focus();
        }
        this.dom['codex-search'].value = '';
        this.codexSearch = '';
        this._renderCodex();
    };

    UI.prototype._entryText = function (entry) {
        if (typeof entry === 'string' || typeof entry === 'number') return String(entry);
        if (!entry || typeof entry !== 'object') return '';
        var parts = [];
        function add(label, value) {
            var text = asText(value);
            if (text) parts.push((label ? label + '：' : '') + text);
        }
        var base = entry.description !== undefined ? entry.description : entry.text !== undefined ? entry.text : entry.detail !== undefined ? entry.detail : entry.summary !== undefined ? entry.summary : entry.content !== undefined ? entry.content : entry.lore !== undefined ? entry.lore : entry.note !== undefined ? entry.note : entry.identity !== undefined ? entry.identity : entry.premise !== undefined ? entry.premise : entry.disclaimer;
        add('', base);
        if (entry.identity && base !== entry.identity) add('身份', entry.identity);
        if (entry.premise && base !== entry.premise) add('故事前提', entry.premise);
        if (entry.disclaimer && base !== entry.disclaimer) add('原创声明', entry.disclaimer);
        if (entry.appearance && entry.appearance.shared) add('外形资料', entry.appearance.shared);
        if (Array.isArray(entry.abilities)) {
            add('能力资料', entry.abilities.map(function (ability) {
                return asText(ability.name || ability.title) + (ability.text ? '——' + asText(ability.text) : '');
            }).join('\n'));
        }
        add('可以确认', entry.confirmed);
        add('尚未明确', entry.unknown);
        add('地点性质', entry.canonStatus);
        add('原作依据', entry.canonBasis);
        add('资料性质', entry.level);
        add('时间边界', entry.timeline);
        add('游戏改编', entry.gameRule || entry.gameUse || entry.gameAdaptation);
        if (!entry.unknown) add('资料边界', entry.boundaries);
        return parts.join('\n\n');
    };

    UI.prototype._entrySource = function (entry) {
        if (!entry || typeof entry !== 'object') return '';
        return asText(entry.sourceIds || entry.sourceId || entry.sources || entry.source || entry.refs || entry.evidence || entry.credit || '');
    };

    UI.prototype._isOriginal = function (entry) {
        if (this.codexTab === 'questText') return true;
        if (!entry || typeof entry !== 'object') return false;
        var kind = asText([entry.kind, entry.type, entry.category, entry.status, entry.origin, entry.level]).toLowerCase();
        return entry.original === true || entry.unofficial === true || entry.canon === false || kind.includes('原创') || kind.includes('game_original') || kind.includes('original_side_story');
    };

    UI.prototype._questItems = function (quest) {
        if (!quest || typeof quest !== 'object' || !quest.mainQuest) return collectionItems(quest);
        var main = quest.mainQuest;
        var items = [{
            name: quest.title || main.title || '叶隙回响',
            description: [quest.disclaimer, quest.timeline, main.premise, asText(main.canonSafety)].filter(Boolean).join('\n\n'),
            sourceIds: ['ORIGINAL_SIDE_STORY'],
            original: true
        }];
        (main.stages || []).forEach(function (stage, index) {
            var dialogue = (stage.dialogue || []).map(function (line) {
                return asText(line.speaker || '旁白') + '：“' + asText(line.text || line.content) + '”';
            }).join('\n');
            items.push({
                name: '第 ' + (index + 1) + ' 幕 · ' + asText(stage.title || stage.id),
                description: asText(stage.objective && (stage.objective.detail || stage.objective.title)) + (dialogue ? '\n\n' + dialogue : ''),
                sourceIds: ['ORIGINAL_SIDE_STORY'],
                original: true
            });
        });
        return items;
    };

    UI.prototype._renderCodex = function () {
        if (!this.dom['codex-content']) return;
        var data = LXH.DATA || {};
        var items = this.codexTab === 'questText' ? this._questItems(data.questText) : collectionItems(data[this.codexTab]);
        if (this.codexTab === 'sources' && !items.length && Array.isArray(data.sourceList)) items = data.sourceList.slice();
        var query = this.codexSearch.trim().toLowerCase();
        var fragment = document.createDocumentFragment();
        if (this.codexTab === 'sources') fragment.appendChild(this._sourceBoundary());
        var shown = 0;
        for (var i = 0; i < items.length; i += 1) {
            var entry = items[i];
            var name = entry && typeof entry === 'object' ? asText(entry.name || entry.title || entry.label || entry.id || '未命名记录') : '手账记录 ' + (i + 1);
            var description = this._entryText(entry);
            var source = this._entrySource(entry);
            var url = entry && typeof entry === 'object' ? asText(entry.url || entry.href || entry.link || '') : '';
            var haystack = (name + ' ' + description + ' ' + source).toLowerCase();
            if (query && haystack.indexOf(query) < 0) continue;
            fragment.appendChild(this._codexCard(name, description, source, url, this._isOriginal(entry)));
            shown += 1;
        }
        if (this.codexTab === 'sources') {
            var localSource = window.location.protocol === 'file:';
            var handbookNote = localSource ? '非官方公开资料整理与阅读索引。本游戏只将其作为设定核对入口，不把它当作官方设定集，也不收录完整正片。' : '非官方公开资料整理与阅读索引。研究原文仅保存在完整离线包，公开版不上传；本游戏不收录完整正片。';
            fragment.appendChild(this._codexCard('用户提供｜罗小黑设定集·森林手账', handbookNote, localSource ? '本地研究资料' : '完整离线包研究资料', localSource ? 'TEMP/research/source-text.txt' : '', false));
            fragment.appendChild(this._codexCard('《罗小黑战记》官方电影站', '用于回查作品、角色与公开物料。外部链接只在你主动点击时打开。', '官方资料', 'https://luoxiaohei-movie.com/1st/', false));
            shown += 2;
        }
        this.dom['codex-content'].textContent = '';
        if (!shown) {
            var empty = document.createElement('div');
            empty.className = 'codex-empty';
            var strong = document.createElement('strong');
            strong.textContent = query ? '这片叶隙暂时没有对应记录' : '这一页还在等待记录';
            var text = document.createElement('span');
            text.textContent = query ? '换一个关键词试试。' : '进入森林后，可继续翻看人物、地点、术语与原创主线。';
            empty.appendChild(strong);
            empty.appendChild(text);
            this.dom['codex-content'].appendChild(empty);
        } else {
            this.dom['codex-content'].appendChild(fragment);
        }
    };

    UI.prototype._sourceBoundary = function () {
        var note = document.createElement('div');
        note.className = 'source-boundary';
        var strong = document.createElement('strong');
        strong.textContent = '创作边界';
        var text = document.createElement('p');
        text.textContent = '《叶隙回响》是非官方二次创作，主线、原创事件与玩法数值均为本游戏创作，不属于原作正史。原作角色、作品与相关权利归相应权利方所有；完整作品请沿来源回到正版页面。资料未明确处，不以想象冒充官方设定。';
        note.appendChild(strong);
        note.appendChild(text);
        return note;
    };

    UI.prototype._codexCard = function (name, description, source, url, original) {
        var card = document.createElement('article');
        card.className = 'codex-card';
        var title = document.createElement('h3');
        title.textContent = name;
        var tag = document.createElement('span');
        tag.className = 'codex-tag ' + (original ? 'original' : 'canon');
        tag.textContent = original ? '游戏原创' : (this.codexTab === 'sources' ? '资料来源' : '原作资料');
        card.appendChild(title);
        card.appendChild(tag);
        if (description) {
            var text = document.createElement('p');
            text.textContent = description;
            card.appendChild(text);
        }
        if (source) {
            var credit = document.createElement('small');
            credit.textContent = (/^[A-Z]\d{2}-\d{3}/.test(source) ? '依据条目：' : '来源：') + source;
            card.appendChild(credit);
        }
        if (url && (/^https?:\/\//i.test(url) || /^TEMP\//.test(url))) {
            var link = document.createElement('a');
            link.href = url;
            link.target = '_blank';
            link.rel = 'noopener noreferrer';
            link.textContent = url.indexOf('TEMP/') === 0 ? '打开本地资料入口 →' : '主动回查原始来源 →';
            card.appendChild(link);
        }
        return card;
    };

    UI.prototype._openNamed = function (name, trigger) {
        if (name === 'sources') {
            this._selectCodexTab('sources', false);
            this._openOverlay('codex-screen', trigger, true);
        } else if (name === 'codex') {
            this._renderCodex();
            this._openOverlay('codex-screen', trigger, true);
        } else if (name === 'settings') {
            this._syncSettingsForm();
            this._openOverlay('settings-screen', trigger, true);
        } else if (name === 'help') {
            this._openOverlay('help-screen', trigger, true);
        } else if (name === 'pause') {
            this.togglePause(true);
        }
    };

    UI.prototype._openOverlay = function (id, trigger, pauseGame) {
        if (!id) return;
        if (this.activeOverlay === id) return;
        this._disarmAbility();
        if (this.activeOverlay) {
            this.overlayStack.push(this.activeOverlay);
            this.focusStack.push(document.activeElement);
            document.getElementById(this.activeOverlay).hidden = true;
        } else {
            this.lastFocus = trigger || document.activeElement;
            if (pauseGame && this.game && document.body.classList.contains('is-playing') && !this.game.paused) {
                this.game.paused = true;
                this.pausedByOverlay = true;
            }
        }
        this.activeOverlay = id;
        var overlay = document.getElementById(id);
        if (!overlay) return;
        overlay.hidden = false;
        this.dom['overlay-backdrop'].hidden = false;
        document.body.classList.add('has-overlay');
        this.dom['restart-confirm'].hidden = true;
        this._focusOverlay(overlay);
    };

    UI.prototype._focusOverlay = function (overlay) {
        var target = overlay.querySelector('button:not([disabled]), input:not([disabled]), select:not([disabled]), [tabindex="0"]');
        if (target) target.focus({ preventScroll: true });
        else {
            overlay.setAttribute('tabindex', '-1');
            overlay.focus({ preventScroll: true });
        }
    };

    UI.prototype.closeOverlay = function () {
        if (!this.activeOverlay) return;
        var current = document.getElementById(this.activeOverlay);
        if (current) current.hidden = true;
        if (this.activeOverlay === 'ending-screen') this.endingVisible = false;
        if (this.overlayStack.length) {
            this.activeOverlay = this.overlayStack.pop();
            var previous = document.getElementById(this.activeOverlay);
            previous.hidden = false;
            var focus = this.focusStack.pop();
            if (focus && focus.isConnected && typeof focus.focus === 'function') focus.focus({ preventScroll: true });
            else this._focusOverlay(previous);
            return;
        }
        this.activeOverlay = null;
        this.dom['overlay-backdrop'].hidden = true;
        document.body.classList.remove('has-overlay');
        if (this.pausedByOverlay && this.game) this.game.paused = false;
        this.pausedByOverlay = false;
        var focusTarget = this.lastFocus;
        this.lastFocus = null;
        if (focusTarget && focusTarget.isConnected && focusTarget.getClientRects().length && typeof focusTarget.focus === 'function') focusTarget.focus({ preventScroll: true });
        else if (this.game && document.body.classList.contains('is-playing')) this._focusCanvas();
    };

    UI.prototype._closeAllOverlays = function (restoreFocus) {
        this.overlayElements.forEach(function (overlay) { overlay.hidden = true; });
        this.activeOverlay = null;
        this.overlayStack.length = 0;
        this.focusStack.length = 0;
        this.dom['overlay-backdrop'].hidden = true;
        document.body.classList.remove('has-overlay');
        this.pausedByOverlay = false;
        if (restoreFocus) this._focusCanvas();
    };

    UI.prototype.toggleSettings = function (open) {
        var shouldOpen = open === undefined ? this.activeOverlay !== 'settings-screen' : !!open;
        if (shouldOpen) this._openNamed('settings', document.activeElement);
        else if (this.activeOverlay === 'settings-screen') this.closeOverlay();
    };

    UI.prototype.togglePause = function (force) {
        if (!this.game || !document.body.classList.contains('is-playing')) return;
        var pause = force === undefined ? !this.game.paused : !!force;
        if (pause) {
            if (this.endingVisible) return;
            this.game.paused = true;
            this._releaseAllInput();
            if (this.activeOverlay !== 'pause-screen') this._openOverlay('pause-screen', this.dom['pause-button'], false);
        } else {
            this.game.paused = false;
            this._closeAllOverlays(false);
            this.pausedLast = false;
            this._focusCanvas();
        }
    };

    UI.prototype._saveGame = function () {
        if (!this.game || typeof this.game.save !== 'function') {
            this.toast('当前还无法保存，请先踏入叶隙');
            return;
        }
        var self = this;
        function done(result) {
            self.toast(result === false ? '未能保存，请检查浏览器存储权限' : '旅途进度已保存');
            self.refreshContinue();
        }
        try {
            var result = this.game.save();
            if (result && typeof result.then === 'function') result.then(done).catch(function () { self.toast('未能保存，请检查浏览器存储权限'); });
            else done(result);
        } catch (error) {
            this.toast('未能保存，请检查浏览器存储权限');
        }
    };

    UI.prototype._restartGame = function () {
        if (!this.game) return;
        this._clearDialogue();
        this._releaseAllInput();
        try {
            if (typeof this.game.restart === 'function') this.game.restart();
            this.game.paused = false;
            this.endingVisible = false;
            this._closeAllOverlays(false);
            this.objective = null;
            this.update();
            this._focusCanvas();
            this.toast('新的叶隙之旅开始了');
        } catch (error) {
            this.toast('重新开始未完成，请刷新页面再试');
        }
    };

    UI.prototype._returnToTitle = function () {
        this._releaseAllInput();
        window.location.reload();
    };

    UI.prototype._desktopAbility = function (name) {
        if (!this.game || this.game.paused) return;
        if (name === 'teleport' || name === 'metal') {
            if (this.armedAbility === name) this._disarmAbility();
            else this._armAbility(name);
        } else {
            this._useAbility(name);
        }
    };

    UI.prototype._armAbility = function (name) {
        this.armedAbility = name;
        this.dom['game-canvas'].classList.add('is-aiming');
        this.dom['aim-hint'].hidden = false;
        document.querySelectorAll('[data-ability]').forEach(function (button) {
            button.classList.toggle('is-armed', button.getAttribute('data-ability') === name);
        });
        this.toast(name === 'teleport' ? '点击场景选择空间转送落点' : '点击场景选择御金方向');
    };

    UI.prototype._disarmAbility = function () {
        this.armedAbility = null;
        this.dom['game-canvas'].classList.remove('is-aiming');
        this.dom['aim-hint'].hidden = true;
        document.querySelectorAll('[data-ability].is-armed').forEach(function (button) { button.classList.remove('is-armed'); });
    };

    UI.prototype._performAction = function (action) {
        if (!this.game || this.game.paused) return;
        if (action === 'interact') {
            if (typeof this.game.interact === 'function') this.game.interact();
            else this.toast('附近还没有可互动的目标');
        } else if (action === 'form') {
            if (this.game.abilities && typeof this.game.abilities.toggleForm === 'function') this._useAbility('form');
            else this.toast('形态能力还在准备中');
        } else if (action === 'fly') {
            var input = this.game.input = this.game.input || { x: 0, y: 0, run: false, fly: false };
            input.fly = !input.fly;
            this._updateFlightButton();
        } else if (ABILITIES.includes(action)) {
            this._useDirectionalAbility(action);
        }
    };

    UI.prototype._useDirectionalAbility = function (name) {
        if (!this.game || this.game.paused) return false;
        if (this.game.audio && typeof this.game.audio.unlock === 'function') this.game.audio.unlock();
        if (this.game.abilities && typeof this.game.abilities.use === 'function') {
            try { return this.game.abilities.use(name); } catch (error) {
                this.toast('能力暂时未能施放，请再试一次');
                return false;
            }
        }
        return this._useAbility(name);
    };

    UI.prototype._useAbility = function (name, x, y) {
        if (!this.game || this.game.paused) return false;
        if (this.game.audio && typeof this.game.audio.unlock === 'function') this.game.audio.unlock();
        try {
            if (typeof this.game.useAbility === 'function') {
                if (Number.isFinite(x) && Number.isFinite(y)) return this.game.useAbility(name, x, y);
                return this.game.useAbility(name);
            }
            if (this.game.abilities && typeof this.game.abilities.use === 'function') {
                if (Number.isFinite(x) && Number.isFinite(y)) return this.game.abilities.use(name, x, y);
                return this.game.abilities.use(name);
            }
        } catch (error) {
            this.toast('能力暂时未能施放，请再试一次');
            return false;
        }
        this.toast('能力模块还在准备中');
        return false;
    };

    UI.prototype.showDialogue = function (dialogue) {
        if (!dialogue) return;
        var lines = [];
        if (Array.isArray(dialogue)) lines = dialogue.slice();
        else if (Array.isArray(dialogue.queue)) lines = dialogue.queue.slice();
        else if (Array.isArray(dialogue.dialogues)) lines = dialogue.dialogues.slice();
        else lines = [dialogue];
        for (var i = 0; i < lines.length; i += 1) {
            var line = typeof lines[i] === 'string' ? { speaker: '森林回响', text: lines[i] } : lines[i];
            if (line && (line.text || line.content || line.dialogue)) this.dialogueQueue.push(line);
        }
        if (!this.currentDialogue) this._nextDialogue();
    };

    UI.prototype._nextDialogue = function () {
        if (!this.dialogueQueue.length) {
            this._clearDialogue();
            return;
        }
        this.currentDialogue = this.dialogueQueue.shift();
        var line = this.currentDialogue;
        this._setText('dialogue-speaker', asText(line.speaker || line.name || line.id || '森林回响'));
        var text = asText(line.text || line.content || line.dialogue || '');
        this.dom['dialogue-text'].textContent = text;
        this.dom['dialogue-progress'].textContent = this.dialogueQueue.length ? '还有 ' + this.dialogueQueue.length + ' 段' : '';
        this.dom['dialogue-box'].hidden = false;
        this.dom['interaction-hint'].hidden = true;
        document.body.classList.add('has-dialogue');
        this._drawPortrait(line.id || line.portrait || line.speaker);
        this.dom['dialogue-next'].focus({ preventScroll: true });
    };

    UI.prototype._advanceDialogue = function () {
        if (!this.currentDialogue) return;
        var line = this.currentDialogue;
        this.currentDialogue = null;
        if (typeof line.onClose === 'function') {
            try { line.onClose(); } catch (error) {
                if (window.console && console.error) console.error('[LXH.UI] 对话回调执行失败', error);
            }
        }
        if (!this.currentDialogue) {
            if (this.dialogueQueue.length) this._nextDialogue();
            else this._clearDialogue();
        }
    };

    UI.prototype._clearDialogue = function () {
        this.currentDialogue = null;
        this.dialogueQueue.length = 0;
        this.dom['dialogue-box'].hidden = true;
        document.body.classList.remove('has-dialogue');
        var context = this.dom['dialogue-portrait'].getContext('2d');
        if (context) context.clearRect(0, 0, 112, 112);
    };

    UI.prototype._drawPortrait = function (id) {
        var canvas = this.dom['dialogue-portrait'];
        var context = canvas.getContext('2d');
        if (!context) return;
        context.clearRect(0, 0, canvas.width, canvas.height);
        if (!LXH.Art || typeof LXH.Art.drawPortrait !== 'function') {
            context.fillStyle = '#315b49';
            context.font = '700 34px "Kaiti SC", "KaiTi", serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(asText(id || '灵').slice(0, 1), 56, 56);
            return;
        }
        try { LXH.Art.drawPortrait(context, id || 'xiaohei', 0, 0, canvas.width); } catch (error) {
            context.fillStyle = '#315b49';
            context.font = '700 34px "Kaiti SC", "KaiTi", serif';
            context.textAlign = 'center';
            context.textBaseline = 'middle';
            context.fillText(asText(id || '灵').slice(0, 1), 56, 56);
        }
    };

    UI.prototype.toast = function (text) {
        text = asText(text).trim();
        if (!text) return;
        var now = Date.now();
        if (text === this.lastToast.text && now - this.lastToast.time < 500) return;
        this.lastToast = { text: text, time: now };
        var region = this.dom['toast-region'];
        while (region.children.length >= 4) region.removeChild(region.firstElementChild);
        var item = document.createElement('div');
        item.className = 'toast';
        item.textContent = text;
        region.appendChild(item);
        window.setTimeout(function () {
            item.classList.add('is-leaving');
            window.setTimeout(function () { if (item.parentNode) item.parentNode.removeChild(item); }, 280);
        }, 3200);
    };

    UI.prototype.setObjective = function (objective) {
        if (!objective) return;
        this.objective = objective;
        this._setText('objective-title', asText(objective.title || '循着叶脉继续前行'));
        this._setText('objective-detail', asText(objective.detail || objective.description || '沿着微光，寻找下一声回响。'));
        var current = finite(objective.current, NaN);
        var total = finite(objective.total, NaN);
        var ratio = NaN;
        if (Number.isFinite(current) && Number.isFinite(total) && total > 0) ratio = current / total;
        else if (Number.isFinite(Number(objective.progress))) {
            var progress = Number(objective.progress);
            ratio = progress >= 0 && progress <= 1 ? progress : progress / 100;
        }
        var hasProgress = Number.isFinite(ratio);
        this.dom['objective-progress'].hidden = !hasProgress;
        if (hasProgress) this.dom['objective-progress-fill'].style.width = (clamp(ratio, 0, 1) * 100).toFixed(1) + '%';
        var showCount = Number.isFinite(current) && Number.isFinite(total) && total > 0;
        this.dom['objective-count'].hidden = !showCount;
        if (showCount) this._setText('objective-count', current + ' / ' + total);
    };

    UI.prototype.showEnding = function (ending) {
        ending = ending && typeof ending === 'object' ? ending : {};
        this._clearDialogue();
        this._releaseAllInput();
        this._setText('ending-title', asText(ending.title || '叶隙重新有了回声'));
        if (ending.text || ending.description) this.dom['ending-text'].textContent = asText(ending.text || ending.description);
        this.dom['ending-stats'].textContent = '';
        var stats = ending.stats;
        if (!stats && this.game && this.game.story && typeof this.game.story.serialize === 'function') {
            try {
                var saved = this.game.story.serialize();
                stats = saved && saved.stats;
            } catch (error) { stats = null; }
        }
        if (stats && typeof stats === 'object') {
            var fragment = document.createDocumentFragment();
            Object.keys(stats).slice(0, 4).forEach(function (key) {
                var item = document.createElement('span');
                var strong = document.createElement('strong');
                strong.textContent = asText(stats[key]);
                item.appendChild(strong);
                item.appendChild(document.createTextNode(asText(key)));
                fragment.appendChild(item);
            });
            this.dom['ending-stats'].appendChild(fragment);
        }
        this.endingVisible = true;
        if (this.game) this.game.paused = true;
        this._closeAllOverlays(false);
        this._openOverlay('ending-screen', this.dom['game-canvas'], false);
        if (this.game && typeof this.game.save === 'function') {
            try {
                var result = this.game.save();
                if (result && typeof result.catch === 'function') result.catch(function () { return false; });
            } catch (error) { /* 结局展示不依赖保存成功。 */ }
        }
    };

    UI.prototype._setText = function (id, text) {
        if (this.hudCache[id] === text) return;
        this.hudCache[id] = text;
        this.dom[id].textContent = text;
    };

    UI.prototype._updateMeter = function (name, value, maximum) {
        var max = Math.max(1, finite(maximum, 100));
        var current = clamp(finite(value, max), 0, max);
        var percent = current / max * 100;
        var key = name + '-percent';
        var rounded = Math.round(percent * 10) / 10;
        if (this.hudCache[key] !== rounded) {
            this.hudCache[key] = rounded;
            this.dom[name + '-fill'].style.width = rounded + '%';
            this.dom[name + '-meter'].setAttribute('aria-valuemax', String(Math.round(max)));
            this.dom[name + '-meter'].setAttribute('aria-valuenow', String(Math.round(current)));
            this.dom[name + '-meter'].setAttribute('aria-valuetext', Math.round(current) + ' / ' + Math.round(max));
        }
        this._setText(name + '-value', String(Math.round(current)));
    };

    UI.prototype._updateFlightButton = function () {
        var button = document.querySelector('[data-touch-action="fly"]');
        if (!button) return;
        var active = !!(this.game && ((this.game.input && this.game.input.fly) || (this.game.player && this.game.player.flying)));
        button.setAttribute('aria-pressed', active ? 'true' : 'false');
        button.setAttribute('aria-label', active ? '落地' : '切换飞行');
    };

    UI.prototype._updateCooldowns = function () {
        if (!this.game || !this.game.abilities || typeof this.game.abilities.getCooldown !== 'function') return;
        for (var i = 0; i < this.abilityButtons.length; i += 1) {
            var button = this.abilityButtons[i];
            var name = button.getAttribute('data-ability') || button.getAttribute('data-touch-action');
            var cooldown = this.game.abilities.getCooldown(name);
            if (!cooldown) continue;
            var remaining = Math.max(0, finite(cooldown.remaining, 0));
            var ready = cooldown.ready !== false && remaining <= 0;
            button.setAttribute('data-ready', ready ? 'true' : 'false');
            button.setAttribute('aria-disabled', ready ? 'false' : 'true');
            var overlay = button.querySelector('.cooldown');
            var text = remaining > 0.05 ? remaining.toFixed(1) : '';
            if (overlay && overlay.textContent !== text) overlay.textContent = text;
            if (!button.hasAttribute('data-base-label')) button.setAttribute('data-base-label', button.getAttribute('aria-label') || name);
            var baseLabel = button.getAttribute('data-base-label');
            button.setAttribute('aria-label', baseLabel + (text ? '，冷却 ' + text + ' 秒' : ''));
        }
    };

    UI.prototype._updateInteraction = function () {
        if (!this.game || !this.game.player || this.currentDialogue || this.activeOverlay) {
            this.dom['interaction-hint'].hidden = true;
            return;
        }
        var target = this.game.interactionTarget || null;
        if (!target && this.game.world && typeof this.game.world.nearestInteraction === 'function') {
            var player = this.game.player;
            target = this.game.world.nearestInteraction(player.x, player.y, finite(player.interactionRadius, 76));
        }
        this.dom['interaction-hint'].hidden = !target;
        if (target) this._setText('interaction-text', asText(target.prompt || target.action || target.name || '调查'));
    };

    UI.prototype.update = function () {
        if (!this.game) return;
        var game = this.game;
        var player = game.player;
        if (player) {
            this._updateMeter('health', player.health, player.maxHealth);
            this._updateMeter('energy', player.energy, player.maxEnergy);
            var form = player.form === 'cat' ? '猫形' : player.form === 'human' ? '人形' : asText(player.form || '猫形');
            if (player.flying) form += ' · 飞行';
            this._setText('hud-form', form);
            if (game.world && typeof game.world.zoneAt === 'function') {
                var zone = game.world.zoneAt(player.x, player.y);
                this._setText('hud-zone', asText(zone && (zone.name || zone.title) || zone || '叶隙森林'));
            }
        }
        this._setText('hud-time', timeText(this.settings.dayTime));
        var night = finite(this.settings.dayTime, 0.34) < 0.22 || finite(this.settings.dayTime, 0.34) >= 0.79;
        var use = this.dom['time-icon'].querySelector('use');
        if (use && use.getAttribute('href') !== (night ? '#i-moon' : '#i-sun')) use.setAttribute('href', night ? '#i-moon' : '#i-sun');
        this._updateFlightButton();
        this._updateCooldowns();
        this._updateInteraction();
        var now = finite(game.time, 0);
        if (game.story && typeof game.story.getObjective === 'function' && (now - this.objectiveClock > 0.2 || now < this.objectiveClock)) {
            this.objectiveClock = now;
            var objective = game.story.getObjective();
            if (objective) this.setObjective(objective);
        }
        if (game.paused && !this.pausedLast && !this.activeOverlay && !this.currentDialogue && !this.endingVisible && document.body.classList.contains('is-playing')) {
            this._openOverlay('pause-screen', this.dom['pause-button'], false);
        } else if (!game.paused && this.activeOverlay === 'pause-screen') {
            this._closeAllOverlays(false);
        }
        this.pausedLast = !!game.paused;
    };

    UI.prototype.refreshContinue = function () {
        var button = this.dom['continue-game'];
        if (!button) return;
        var available = false;
        try {
            if (LXH.Game && typeof LXH.Game.hasSave === 'function') available = !!LXH.Game.hasSave();
            if (!available) {
                for (var i = 0; i < window.localStorage.length; i += 1) {
                    var key = window.localStorage.key(i) || '';
                    if (/^(lxh|luoxiaohei)/i.test(key) && /(save|progress|checkpoint)/i.test(key)) {
                        available = true;
                        break;
                    }
                }
            }
        } catch (error) { available = false; }
        button.disabled = !available;
        button.title = available ? '读取上次保存的旅途' : '还没有可继续的旅途';
        button.setAttribute('aria-label', button.title);
    };

    function showBootError(message) {
        var error = document.getElementById('boot-error');
        error.textContent = message;
        error.hidden = false;
    }

    function boot(options) {
        options = options || {};
        var ui = UI.instance || new UI(null);
        if (typeof LXH.Game !== 'function') {
            showBootError('游戏模块尚未完整加载。请确认 TEMP/data 与 TEMP/js 文件齐全，然后刷新页面。');
            return null;
        }
        var canvas = document.getElementById('game-canvas');
        var game = LXH.game || window.lxhGame;
        try {
            if (!game) game = new LXH.Game(canvas);
            LXH.game = window.lxhGame = game;
            ui.attachGame(game);
            game.ui = ui;
            document.getElementById('launch-screen').hidden = true;
            document.getElementById('game-shell').hidden = false;
            document.body.classList.remove('is-launching');
            document.body.classList.add('is-playing');
            ui._closeAllOverlays(false);
            if (typeof game.resize === 'function') game.resize();
            game.paused = false;
            if (!game.running && typeof game.start === 'function') game.start();
            else if (game.running && game.paused) game.paused = false;
            if (options.load && typeof game.load === 'function') {
                var afterLoad = function (result) {
                    if (result === false) {
                        ui.toast('没有找到可继续的旅途');
                        return;
                    }
                    ui._clearDialogue();
                    ui.settings = game.settings;
                    ui.storedSettings = Object.assign({}, game.settings);
                    ui._applySettings();
                    ui._syncSettingsForm();
                    writeSettings(game.settings);
                    ui.update();
                };
                var loaded = game.load();
                if (loaded && typeof loaded.then === 'function') loaded.then(afterLoad).catch(function () { ui.toast('读取进度失败，已开始当前旅途'); });
                else afterLoad(loaded);
            }
            if (game.audio && typeof game.audio.unlock === 'function') game.audio.unlock();
            ui.update();
            ui._focusCanvas();
            return game;
        } catch (error) {
            document.getElementById('game-shell').hidden = true;
            document.getElementById('launch-screen').hidden = false;
            document.body.classList.remove('is-playing');
            document.body.classList.add('is-launching');
            showBootError('森林暂时未能苏醒。请刷新页面重试，或检查游戏文件是否完整。');
            if (window.console && console.error) console.error('[LXH] 游戏启动失败', error);
            return null;
        }
    }

    UI.prototype._focusCanvas = function () {
        if (document.body.classList.contains('is-playing') && !this.activeOverlay) {
            this.dom['game-canvas'].focus({ preventScroll: true });
        }
    };

    LXH.UI = UI;
    LXH.boot = boot;

    function initialize() {
        if (!UI.instance) LXH.ui = new UI(null);
        else LXH.ui = UI.instance;
        var networkProtocol = window.location.protocol === 'http:' || window.location.protocol === 'https:';
        if (networkProtocol && !document.querySelector('link[rel="manifest"]')) {
            var manifest = document.createElement('link');
            manifest.rel = 'manifest';
            manifest.href = 'TEMP/manifest.webmanifest';
            document.head.appendChild(manifest);
        }
        if (networkProtocol && 'serviceWorker' in window.navigator) {
            var registerWorker = function (scope) {
                try {
                    var registration = window.navigator.serviceWorker.register('TEMP/sw.js', { scope: scope });
                    if (registration && typeof registration.catch === 'function') registration.catch(function () { return null; });
                } catch (error) { return null; }
                return null;
            };
            try {
                window.fetch('TEMP/sw.js', { method: 'HEAD', cache: 'no-store', credentials: 'same-origin' }).then(function (response) {
                    var allowed = response.ok ? response.headers.get('Service-Worker-Allowed') : null;
                    var rootPath = new URL('./', window.location.href).pathname;
                    var rootAllowed = !!allowed && rootPath.indexOf(allowed) === 0;
                    registerWorker(rootAllowed ? './' : './TEMP/');
                }).catch(function () { registerWorker('./TEMP/'); });
            } catch (error) { registerWorker('./TEMP/'); }
        }
    }

    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initialize, { once: true });
    else initialize();
})(window, document);
