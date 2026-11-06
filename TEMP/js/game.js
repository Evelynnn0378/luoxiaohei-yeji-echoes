(function (global) {
  'use strict';

  var LXH = global.LXH = global.LXH || {};
  var FIXED_STEP = 1 / 60;
  var MAX_FRAME_DELTA = 0.2;
  var MAX_STEPS = 8;
  var SAVE_VERSION = 1;
  var DEFAULT_SPAWN = { x: 620, y: 1880 };
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
  var QUALITY_VALUES = { low: true, medium: true, high: true };
  var CONTROL_CODES = {
    KeyW: true, KeyA: true, KeyS: true, KeyD: true,
    ArrowUp: true, ArrowDown: true, ArrowLeft: true, ArrowRight: true,
    ShiftLeft: true, ShiftRight: true, KeyF: true, KeyE: true,
    KeyQ: true, KeyJ: true, Space: true, KeyC: true, Escape: true
  };

  function finite(value, fallback) {
    var number = Number(value);
    return Number.isFinite(number) ? number : fallback;
  }

  function clamp(value, minimum, maximum) {
    return Math.max(minimum, Math.min(maximum, value));
  }

  function bool(value, fallback) {
    return typeof value === 'boolean' ? value : fallback;
  }

  function errorMessage(error) {
    if (!error) return '未知错误';
    if (typeof error.message === 'string' && error.message) return error.message;
    return String(error);
  }

  function normaliseSettings(target, source) {
    var output = target || {};
    var input = source && typeof source === 'object' ? source : {};
    output.moveSpeed = clamp(finite(input.moveSpeed, DEFAULT_SETTINGS.moveSpeed), 0.25, 3);
    output.flightSpeed = clamp(finite(input.flightSpeed, DEFAULT_SETTINGS.flightSpeed), 0.25, 3);
    output.timeScale = clamp(finite(input.timeScale, DEFAULT_SETTINGS.timeScale), 0, 4);
    var dayTime = finite(input.dayTime, DEFAULT_SETTINGS.dayTime);
    if (dayTime < 0 || dayTime >= 1) dayTime = ((dayTime % 1) + 1) % 1;
    output.dayTime = dayTime;
    output.autoDay = bool(input.autoDay, DEFAULT_SETTINGS.autoDay);
    output.lighting = bool(input.lighting, DEFAULT_SETTINGS.lighting);
    output.quality = QUALITY_VALUES[input.quality] ? input.quality : DEFAULT_SETTINGS.quality;
    output.sound = bool(input.sound, DEFAULT_SETTINGS.sound);
    output.reducedMotion = bool(input.reducedMotion, DEFAULT_SETTINGS.reducedMotion);
    return output;
  }

  function copySettings(settings) {
    return normaliseSettings({}, settings);
  }

  function keyCode(event) {
    if (event.code) return event.code;
    var key = event.key || '';
    var names = {
      w: 'KeyW', a: 'KeyA', s: 'KeyS', d: 'KeyD', f: 'KeyF',
      e: 'KeyE', q: 'KeyQ', j: 'KeyJ', c: 'KeyC', r: 'KeyR', l: 'KeyL',
      ArrowUp: 'ArrowUp', ArrowDown: 'ArrowDown', ArrowLeft: 'ArrowLeft',
      ArrowRight: 'ArrowRight', Shift: 'ShiftLeft', ' ': 'Space', Escape: 'Escape'
    };
    return names[key] || names[String(key).toLowerCase()] || key;
  }

  function editableTarget(target) {
    if (!target) return false;
    var tag = String(target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || tag === 'select' || tag === 'button' || tag === 'a') return true;
    if (target.isContentEditable) return true;
    if (typeof target.closest === 'function') {
      return !!target.closest('[contenteditable="true"], [role="textbox"]');
    }
    return false;
  }

  function Game(canvas) {
    this.canvas = canvas || null;
    this.ctx = null;
    this.width = 1;
    this.height = 1;
    this.dpr = 1;
    this.time = 0;
    this.dt = 0;
    this.world = null;
    this.player = null;
    this.npcs = [];
    this.enemies = [];
    this.abilities = null;
    this.vfx = null;
    this.story = null;
    this.ui = null;
    this.audio = null;
    this.keys = new Set();
    this.input = { x: 0, y: 0, run: false, fly: false };
    this.settings = copySettings(DEFAULT_SETTINGS);
    this.camera = { x: DEFAULT_SPAWN.x, y: DEFAULT_SPAWN.y, zoom: 1 };
    this.running = false;
    this.paused = false;
    this.ended = false;
    this.won = false;
    this.outcome = null;
    this.objective = null;
    this.currentZone = null;
    this.zone = null;
    this.interactionTarget = null;
    this.nearbyInteraction = null;
    this.saveKey = Game.SAVE_KEY;
    this.lastSaveTime = 0;
    this.storageAvailable = true;
    this.lastStorageError = null;
    this.errors = [];
    this.moduleErrors = Object.create(null);

    this._fatalErrors = [];
    this._listeners = [];
    this._rafId = null;
    this._lastTimestamp = 0;
    this._accumulator = 0;
    this._started = false;
    this._endingShown = false;
    this._lastSound = this.settings.sound;
    this._lastObjectiveKey = '';
    this._lastZoneKey = '';
    this._zoneNoticeUntil = 0;
    this._screenNoticeUntil = 0;
    this._screenNotice = '';
    this._errorVisibleUntil = 0;
    this._lastErrorAt = Object.create(null);
    this._reportedDefeatedEnemies = new Set();
    this._pointer = { x: 0, y: 0, active: false, type: 'mouse' };
    this._zoomUserSet = false;
    this._directUIX = 0;
    this._directUIY = 0;
    this._externalRun = false;
    this._lastWrittenX = 0;
    this._lastWrittenY = 0;
    this._lastWrittenRun = false;
    this._lastNoInteractionToast = 0;
    this._domError = null;
    this._destroyed = false;

    this._boundFrame = this._frame.bind(this);
    this._requestFrameCallback = global.requestAnimationFrame
      ? global.requestAnimationFrame.bind(global)
      : function (callback) { return global.setTimeout(function () { callback(Date.now()); }, 16); };
    this._cancelFrameCallback = global.cancelAnimationFrame
      ? global.cancelAnimationFrame.bind(global)
      : global.clearTimeout.bind(global);

    if (this.canvas && typeof this.canvas.getContext === 'function') {
      try {
        this.ctx = this.canvas.getContext('2d', { alpha: false, desynchronized: true }) || this.canvas.getContext('2d');
      } catch (error) {
        this._reportError('画布初始化', error, true);
      }
    } else {
      this._reportError('画布初始化', new Error('需要有效的 Canvas 元素'), true);
    }

    this.resize();
    this._installInput();
    this._buildModules(false);
    this._updateCamera(0, true);
  }

  Game.SAVE_KEY = 'lxh-yexi-save-v1';
  Game.FIXED_STEP = FIXED_STEP;
  Game.hasSave = function () {
    try {
      return !!(global.localStorage && global.localStorage.getItem(Game.SAVE_KEY));
    } catch (error) {
      return false;
    }
  };

  Game.prototype._listen = function (target, type, handler, options) {
    if (!target || typeof target.addEventListener !== 'function') return;
    target.addEventListener(type, handler, options);
    this._listeners.push({ target: target, type: type, handler: handler, options: options });
  };

  Game.prototype._reportError = function (scope, error, critical) {
    var message = scope + '：' + errorMessage(error);
    var now = Date.now();
    this.moduleErrors[scope] = message;
    this._errorVisibleUntil = now + 9000;
    if (!this._lastErrorAt[scope] || now - this._lastErrorAt[scope] > 4000) {
      this._lastErrorAt[scope] = now;
      this.errors.push({ scope: scope, message: message, critical: !!critical, at: now });
      if (this.errors.length > 12) this.errors.shift();
      if (global.console && typeof global.console.error === 'function') {
        global.console.error('[LXH] ' + message, error || '');
      }
    }
    if (critical && this._fatalErrors.indexOf(message) === -1) this._fatalErrors.push(message);
    return message;
  };

  Game.prototype._showDOMFatal = function (message) {
    if (!global.document || !global.document.body) return;
    if (!this._domError) {
      var panel = global.document.createElement('div');
      panel.setAttribute('role', 'alert');
      panel.style.cssText = 'position:fixed;inset:0;z-index:99999;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#14201f;color:#f6f0df;font:16px/1.7 sans-serif;text-align:center;white-space:pre-wrap;';
      global.document.body.appendChild(panel);
      this._domError = panel;
    }
    this._domError.textContent = message;
    this._domError.style.display = 'flex';
  };

  Game.prototype._hideDOMFatal = function () {
    if (this._domError) this._domError.style.display = 'none';
  };

  Game.prototype._construct = function (name, args, critical) {
    var Constructor = LXH[name];
    if (typeof Constructor !== 'function') {
      this._reportError(name + ' 模块', new Error('未找到 LXH.' + name + '，请检查脚本路径与加载顺序'), !!critical);
      return null;
    }
    try {
      var Bound = Function.prototype.bind.apply(Constructor, [null].concat(args || []));
      return new Bound();
    } catch (error) {
      this._reportError(name + ' 模块初始化', error, !!critical);
      return null;
    }
  };

  Game.prototype._call = function (target, method, args, scope) {
    if (!target || typeof target[method] !== 'function') return { ok: false, value: undefined };
    try {
      return { ok: true, value: target[method].apply(target, args || []) };
    } catch (error) {
      this._reportError(scope || method, error, false);
      return { ok: false, value: undefined, error: error };
    }
  };

  Game.prototype._drawCall = function (target, method, args, scope) {
    if (!this.ctx || !target || typeof target[method] !== 'function') return false;
    var saved = false;
    try {
      this.ctx.save();
      saved = true;
      target[method].apply(target, args || []);
      return true;
    } catch (error) {
      this._reportError(scope || method, error, false);
      return false;
    } finally {
      if (saved) {
        try { this.ctx.restore(); } catch (restoreError) { this._reportError('画布状态恢复', restoreError, false); }
      }
    }
  };

  Game.prototype._buildModules = function (reuseShell) {
    var oldUI = reuseShell ? this.ui : null;
    var oldAudio = reuseShell ? this.audio : null;
    this.world = null;
    this.player = null;
    this.npcs = [];
    this.enemies = [];
    this.abilities = null;
    this.vfx = null;
    this.story = null;
    if (!reuseShell) {
      this.ui = null;
      this.audio = null;
    }
    this._fatalErrors = [];
    this.errors = [];
    this.moduleErrors = Object.create(null);
    this._lastErrorAt = Object.create(null);
    this._reportedDefeatedEnemies = new Set();
    this._started = false;
    this._endingShown = false;
    this.currentZone = null;
    this.zone = null;
    this.interactionTarget = null;
    this.nearbyInteraction = null;
    this.objective = null;
    this._lastObjectiveKey = '';
    this._lastZoneKey = '';

    if (!this.ctx) this._fatalErrors.push('画布初始化：无法取得 Canvas 2D 上下文');
    this.world = this._construct('World', [this], true);
    var spawn = this.world && this.world.spawn ? this.world.spawn : DEFAULT_SPAWN;
    var spawnX = finite(spawn.x, DEFAULT_SPAWN.x);
    var spawnY = finite(spawn.y, DEFAULT_SPAWN.y);
    this.player = this._construct('Player', [this, spawnX, spawnY], true);
    this.camera.x = finite(this.player && this.player.x, spawnX);
    this.camera.y = finite(this.player && this.player.y, spawnY);

    this._populateActors('npc');
    this._populateActors('enemy');
    this.abilities = this._construct('Abilities', [this], false);
    this.vfx = this._construct('VFX', [this], false);
    this.audio = oldAudio || this._construct('AudioSystem', [this], false);
    this.story = this._construct('Story', [this], false);
    this.ui = oldUI || this._construct('UI', [this], false);
    if (this.audio) this._call(this.audio, 'setEnabled', [this.settings.sound], '音频设置');
    this._lastSound = this.settings.sound;
    this._refreshObjective(true);
  };

  Game.prototype._populateActors = function (kind) {
    var isNPC = kind === 'npc';
    var constructorName = isNPC ? 'NPC' : 'Enemy';
    var target = isNPC ? this.npcs : this.enemies;
    if (!this.world) return;
    var candidates = isNPC
      ? [this.world.npcDefinitions, this.world.npcDefs, this.world.npcSpawns, this.world.npcSpawnPoints, this.world.npcs]
      : [this.world.enemyDefinitions, this.world.enemyDefs, this.world.enemySpawns, this.world.patrolPoints, this.world.enemies];
    var definitions = null;
    for (var i = 0; i < candidates.length; i += 1) {
      if (Array.isArray(candidates[i])) { definitions = candidates[i]; break; }
    }
    if (!definitions) return;
    for (var j = 0; j < definitions.length; j += 1) {
      var definition = definitions[j];
      if (!definition) continue;
      if (definition.game === this && typeof definition.update === 'function') {
        if (target.indexOf(definition) === -1) target.push(definition);
        continue;
      }
      var actor = this._construct(constructorName, [this, definition], false);
      if (actor) target.push(actor);
    }
  };

  Game.prototype._installInput = function () {
    var self = this;
    this._listen(global, 'keydown', function (event) { self._onKeyDown(event); }, true);
    this._listen(global, 'keyup', function (event) { self._onKeyUp(event); }, false);
    this._listen(global, 'blur', function () {
      self._clearMotionInput();
      if (self.running && !self.ended && !self._hasFatal()) self.togglePause(true);
    });
    this._listen(global.document, 'visibilitychange', function () {
      if (global.document.hidden && self.running && !self.ended && !self._hasFatal()) self.togglePause(true);
    });
    this._listen(global, 'resize', function () { self.resize(); });
    if (global.visualViewport) this._listen(global.visualViewport, 'resize', function () { self.resize(); });

    this._listen(this.canvas, 'pointermove', function (event) {
      self._updatePointer(event);
    }, { passive: true });
    this._listen(this.canvas, 'pointerenter', function (event) {
      self._updatePointer(event);
      self._pointer.active = true;
    }, { passive: true });
    this._listen(this.canvas, 'pointerleave', function () {
      self._pointer.active = false;
    }, { passive: true });
    this._listen(this.canvas, 'pointerdown', function (event) {
      self._updatePointer(event);
      self._pointer.active = true;
      self._unlockAudio();
      if (self.ui && self.ui.armedAbility) return;
      if (self.canvas && typeof self.canvas.focus === 'function') {
        try { self.canvas.focus({ preventScroll: true }); } catch (error) { self.canvas.focus(); }
      }
      if (event.button === 0 && event.pointerType !== 'touch' && self.running && !self.paused && !self.ended) {
        self.useAbility('metal', self._pointer.x, self._pointer.y);
        event.preventDefault();
      }
    }, true);
    this._listen(this.canvas, 'wheel', function (event) {
      if (!self.running || self.paused || self.ended) return;
      var zoom = self.camera.zoom * Math.exp(-finite(event.deltaY, 0) * 0.001);
      self.setZoom(zoom);
      event.preventDefault();
    }, { passive: false });
  };

  Game.prototype._onKeyDown = function (event) {
    var code = keyCode(event);
    var uiOwnsInput = this.ui && (this.ui.currentDialogue || this.ui.activeOverlay || this.ui.endingVisible);
    if (uiOwnsInput) return;
    if (code === 'Escape') {
      if (event.repeat) return;
      if (this.ui && typeof this.ui.togglePause === 'function') return;
      this.togglePause();
      event.preventDefault();
      return;
    }
    if (editableTarget(event.target)) return;
    if (CONTROL_CODES[code] && this.running) event.preventDefault();
    this.keys.add(code);
    if (event.key) this.keys.add(String(event.key).toLowerCase());
    this._unlockAudio();
    if (event.repeat) return;

    if (code === 'KeyR' && (this.paused || this.ended)) {
      this.restart();
      return;
    }
    if (code === 'KeyL' && (this.paused || this.ended)) {
      this.load();
      return;
    }
    if (!this.running || this.paused || this.ended || this._hasFatal()) return;

    if (code === 'KeyF') {
      this.input.fly = !this.input.fly;
      this._toast(this.input.fly ? '飞行已开启' : '飞行已关闭');
    } else if (code === 'KeyE') {
      this.interact();
    } else if (code === 'KeyQ') {
      this.useAbility('teleport');
    } else if (code === 'KeyJ') {
      event.stopImmediatePropagation();
      this.useAbility('metal');
    } else if (code === 'Space') {
      this.useAbility('dash');
    } else if (code === 'KeyC') {
      this.toggleForm();
    }
  };

  Game.prototype._onKeyUp = function (event) {
    var code = keyCode(event);
    this.keys.delete(code);
    if (event.key) this.keys.delete(String(event.key).toLowerCase());
    if (code === 'ShiftLeft') this.keys.delete('ShiftRight');
  };

  Game.prototype._down = function (code, alias) {
    return this.keys.has(code) || (alias && this.keys.has(alias));
  };

  Game.prototype._readUIAxis = function (axis) {
    var input = this.input || {};
    var capital = axis.toUpperCase();
    var candidates = [
      input['move' + capital], input['joy' + capital], input['touch' + capital],
      input.joystick && input.joystick[axis], input.stick && input.stick[axis],
      input.joy && input.joy[axis], input.virtual && input.virtual[axis]
    ];
    for (var i = 0; i < candidates.length; i += 1) {
      if (Number.isFinite(Number(candidates[i]))) return clamp(Number(candidates[i]), -1, 1);
    }
    return null;
  };

  Game.prototype._syncInput = function () {
    if (!this.input || typeof this.input !== 'object') this.input = { x: 0, y: 0, run: false, fly: false };
    var left = this._down('KeyA', 'a') || this._down('ArrowLeft', 'arrowleft');
    var right = this._down('KeyD', 'd') || this._down('ArrowRight', 'arrowright');
    var up = this._down('KeyW', 'w') || this._down('ArrowUp', 'arrowup');
    var down = this._down('KeyS', 's') || this._down('ArrowDown', 'arrowdown');
    var keyX = (right ? 1 : 0) - (left ? 1 : 0);
    var keyY = (down ? 1 : 0) - (up ? 1 : 0);

    if (finite(this.input.x, 0) !== this._lastWrittenX) this._directUIX = clamp(finite(this.input.x, 0), -1, 1);
    if (finite(this.input.y, 0) !== this._lastWrittenY) this._directUIY = clamp(finite(this.input.y, 0), -1, 1);
    var uiX = this._readUIAxis('x');
    var uiY = this._readUIAxis('y');
    if (uiX === null) uiX = this._directUIX;
    if (uiY === null) uiY = this._directUIY;
    var x = clamp(keyX + uiX, -1, 1);
    var y = clamp(keyY + uiY, -1, 1);
    var length = Math.sqrt(x * x + y * y);
    if (length > 1) { x /= length; y /= length; }

    if (!!this.input.run !== this._lastWrittenRun) this._externalRun = !!this.input.run;
    var externalRun = this._externalRun || !!this.input.touchRun || !!this.input.sprint;
    var run = externalRun || this._down('ShiftLeft', 'shift') || this._down('ShiftRight', 'shift');
    this.input.x = x;
    this.input.y = y;
    this.input.run = run;
    this.input.fly = !!this.input.fly;
    this._lastWrittenX = x;
    this._lastWrittenY = y;
    this._lastWrittenRun = run;
  };

  Game.prototype._clearMotionInput = function () {
    this.keys.clear();
    this._directUIX = 0;
    this._directUIY = 0;
    this._externalRun = false;
    if (this.input) {
      this.input.x = 0;
      this.input.y = 0;
      this.input.run = false;
      if (this.input.joystick) { this.input.joystick.x = 0; this.input.joystick.y = 0; }
      if (this.input.stick) { this.input.stick.x = 0; this.input.stick.y = 0; }
    }
    this._lastWrittenX = 0;
    this._lastWrittenY = 0;
    this._lastWrittenRun = false;
  };

  Game.prototype._updatePointer = function (event) {
    var point = this._eventPoint(event);
    this._pointer.x = point.x;
    this._pointer.y = point.y;
    this._pointer.type = event.pointerType || 'mouse';
  };

  Game.prototype._eventPoint = function (event) {
    if (!this.canvas || typeof this.canvas.getBoundingClientRect !== 'function') {
      return { x: finite(event.clientX, 0), y: finite(event.clientY, 0) };
    }
    var rect = this.canvas.getBoundingClientRect();
    var width = rect.width || this.width || 1;
    var height = rect.height || this.height || 1;
    return {
      x: (finite(event.clientX, rect.left) - rect.left) * this.width / width,
      y: (finite(event.clientY, rect.top) - rect.top) * this.height / height
    };
  };

  Game.prototype._abilityPoint = function (screenX, screenY) {
    if (Number.isFinite(Number(screenX)) && Number.isFinite(Number(screenY))) {
      return { x: Number(screenX), y: Number(screenY) };
    }
    if (!this.player) return { x: this.width / 2, y: this.height / 2 };
    var touchVector = this.ui && this.ui.touchVector;
    if (touchVector && Math.hypot(finite(touchVector.x, 0), finite(touchVector.y, 0)) > 0.15) {
      var touchLength = Math.hypot(finite(touchVector.x, 0), finite(touchVector.y, 0)) || 1;
      return this.worldToScreen(
        finite(this.player.x, 0) + finite(touchVector.x, 0) / touchLength * 220,
        finite(this.player.y, 0) + finite(touchVector.y, 0) / touchLength * 220
      );
    }
    if (this._pointer.active) return { x: this._pointer.x, y: this._pointer.y };
    var facing = this.player.facing;
    var dx = finite(this.player.lookX, NaN);
    var dy = finite(this.player.lookY, NaN);
    if (Number.isFinite(dx) && Number.isFinite(dy) && Math.hypot(dx, dy) > 0.001) {
      var lookLength = Math.hypot(dx, dy);
      dx /= lookLength;
      dy /= lookLength;
    } else if (Number.isFinite(this.player.facingAngle)) {
      dx = Math.cos(this.player.facingAngle);
      dy = Math.sin(this.player.facingAngle);
    } else if (typeof facing === 'number' && Number.isFinite(facing)) {
      if (facing === 1 || facing === -1) { dx = facing; dy = 0; }
      else { dx = Math.cos(facing); dy = Math.sin(facing); }
    } else {
      dx = 1;
      dy = 0;
      var direction = String(facing || 'right').toLowerCase();
      if (direction.indexOf('left') !== -1 || direction.indexOf('左') !== -1) { dx = -1; dy = 0; }
      else if (direction.indexOf('up') !== -1 || direction.indexOf('上') !== -1) { dx = 0; dy = -1; }
      else if (direction.indexOf('down') !== -1 || direction.indexOf('下') !== -1) { dx = 0; dy = 1; }
      else if (direction.indexOf('right') !== -1 || direction.indexOf('右') !== -1) { dx = 1; dy = 0; }
      if (direction.indexOf('up-left') !== -1 || direction.indexOf('左上') !== -1) { dx = -0.707; dy = -0.707; }
      if (direction.indexOf('up-right') !== -1 || direction.indexOf('右上') !== -1) { dx = 0.707; dy = -0.707; }
      if (direction.indexOf('down-left') !== -1 || direction.indexOf('左下') !== -1) { dx = -0.707; dy = 0.707; }
      if (direction.indexOf('down-right') !== -1 || direction.indexOf('右下') !== -1) { dx = 0.707; dy = 0.707; }
    }
    return this.worldToScreen(finite(this.player.x, 0) + dx * 220, finite(this.player.y, 0) + dy * 220);
  };

  Game.prototype._unlockAudio = function () {
    if (this.audio) this._call(this.audio, 'unlock', [], '音频解锁');
  };

  Game.prototype._toast = function (text, duration) {
    this._screenNotice = String(text || '');
    this._screenNoticeUntil = Date.now() + (finite(duration, 2.6) * 1000);
    if (this.ui) this._call(this.ui, 'toast', [String(text || '')], '界面提示');
  };

  Game.prototype._hasFatal = function () {
    return this._fatalErrors.length > 0;
  };

  Game.prototype.resize = function () {
    if (!this.canvas) return;
    var rect = null;
    if (typeof this.canvas.getBoundingClientRect === 'function') {
      try { rect = this.canvas.getBoundingClientRect(); } catch (error) { rect = null; }
    }
    var width = rect && rect.width > 0 ? rect.width : finite(this.canvas.clientWidth, 0);
    var height = rect && rect.height > 0 ? rect.height : finite(this.canvas.clientHeight, 0);
    if (!(width > 0)) width = finite(global.innerWidth, 300);
    if (!(height > 0)) height = finite(global.innerHeight, 150);
    this.width = Math.max(1, Math.round(width));
    this.height = Math.max(1, Math.round(height));
    var qualityCap = this.settings.quality === 'low' ? 1 : this.settings.quality === 'medium' ? 1.5 : 2;
    this.dpr = clamp(finite(global.devicePixelRatio, 1), 1, qualityCap);
    var pixelWidth = Math.max(1, Math.round(this.width * this.dpr));
    var pixelHeight = Math.max(1, Math.round(this.height * this.dpr));
    if (this.canvas.width !== pixelWidth) this.canvas.width = pixelWidth;
    if (this.canvas.height !== pixelHeight) this.canvas.height = pixelHeight;
    if (this.canvas.style) {
      this.canvas.style.width = this.width + 'px';
      this.canvas.style.height = this.height + 'px';
      this.canvas.style.touchAction = 'none';
    }
    if (this.ctx) {
      this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
      this.ctx.imageSmoothingEnabled = true;
    }
    if (!this._zoomUserSet) {
      this.camera.zoom = clamp(Math.min(this.width / 960, this.height / 540), 0.7, 1.35);
    }
    this._clampCamera();
  };

  Game.prototype.setZoom = function (zoom) {
    this._zoomUserSet = true;
    this.camera.zoom = clamp(finite(zoom, this.camera.zoom || 1), 0.55, 2.2);
    this._clampCamera();
    return this.camera.zoom;
  };

  Game.prototype.worldToScreen = function (x, y) {
    return {
      x: (finite(x, 0) - this.camera.x) * this.camera.zoom + this.width / 2,
      y: (finite(y, 0) - this.camera.y) * this.camera.zoom + this.height / 2
    };
  };

  Game.prototype.screenToWorld = function (x, y) {
    return {
      x: (finite(x, 0) - this.width / 2) / this.camera.zoom + this.camera.x,
      y: (finite(y, 0) - this.height / 2) / this.camera.zoom + this.camera.y
    };
  };

  Game.prototype._clampCamera = function () {
    var worldWidth = finite(this.world && this.world.width, 4800);
    var worldHeight = finite(this.world && this.world.height, 3600);
    var halfWidth = this.width / (2 * Math.max(0.01, this.camera.zoom));
    var halfHeight = this.height / (2 * Math.max(0.01, this.camera.zoom));
    this.camera.x = finite(this.camera.x, DEFAULT_SPAWN.x);
    this.camera.y = finite(this.camera.y, DEFAULT_SPAWN.y);
    this.camera.x = halfWidth * 2 >= worldWidth ? worldWidth / 2 : clamp(this.camera.x, halfWidth, worldWidth - halfWidth);
    this.camera.y = halfHeight * 2 >= worldHeight ? worldHeight / 2 : clamp(this.camera.y, halfHeight, worldHeight - halfHeight);
  };

  Game.prototype._updateCamera = function (dt, snap) {
    if (!this.player) { this._clampCamera(); return; }
    var playerX = finite(this.player.x, this.camera.x);
    var playerY = finite(this.player.y, this.camera.y);
    var distance = Math.hypot(playerX - this.camera.x, playerY - this.camera.y);
    var blend = snap ? 1 : 1 - Math.exp(-Math.max(0, dt) * 8);
    if (distance > Math.max(this.width, this.height) / Math.max(0.1, this.camera.zoom)) blend = 1;
    this.camera.x += (playerX - this.camera.x) * blend;
    this.camera.y += (playerY - this.camera.y) * blend;
    this._clampCamera();
  };

  Game.prototype._startStory = function () {
    if (this.story) this._call(this.story, 'start', [], '剧情启动');
    this._refreshObjective(true);
    this._updateZone(true);
  };

  Game.prototype.start = function () {
    if (this._destroyed) return this;
    if (!this.ctx) {
      this._showDOMFatal('游戏无法启动：浏览器没有提供 Canvas 2D 画布。\n请使用支持 Canvas 的现代浏览器打开根目录 index.html。');
      return this;
    }
    this._hideDOMFatal();
    if (this.running) return this;
    this.running = true;
    if (!this._started) {
      this._started = true;
      this.paused = false;
      this.ended = false;
      this.won = false;
      this.outcome = null;
      this._startStory();
    }
    this._lastTimestamp = 0;
    this._accumulator = 0;
    this._scheduleFrame();
    return this;
  };

  Game.prototype._scheduleFrame = function () {
    if (this.running && this._rafId === null) this._rafId = this._requestFrameCallback(this._boundFrame);
  };

  Game.prototype._frame = function (timestamp) {
    this._rafId = null;
    if (!this.running || this._destroyed) return;
    try {
      var now = finite(timestamp, Date.now());
      var frameDelta = this._lastTimestamp ? clamp((now - this._lastTimestamp) / 1000, 0, MAX_FRAME_DELTA) : 0;
      this._lastTimestamp = now;
      if (!this.paused && !this.ended && !this._hasFatal()) {
        this._accumulator = Math.min(this._accumulator + frameDelta, FIXED_STEP * MAX_STEPS);
        var steps = 0;
        while (this._accumulator >= FIXED_STEP && steps < MAX_STEPS) {
          this.update(FIXED_STEP);
          this._accumulator -= FIXED_STEP;
          steps += 1;
          if (this.paused || this.ended || this._hasFatal()) {
            this._accumulator = 0;
            break;
          }
        }
        if (steps === MAX_STEPS && this._accumulator >= FIXED_STEP) this._accumulator %= FIXED_STEP;
      } else {
        this._accumulator = 0;
        this.dt = 0;
        if (this.ui) this._call(this.ui, 'update', [], '界面更新');
      }
      this.draw();
    } catch (error) {
      this._reportError('游戏主循环', error, true);
      try { this.draw(); } catch (drawError) {
        this._showDOMFatal('游戏渲染遇到问题：' + errorMessage(drawError) + '\n请刷新页面，或检查浏览器控制台中的 [LXH] 错误信息。');
      }
    } finally {
      this._scheduleFrame();
    }
  };

  Game.prototype.stop = function () {
    this.running = false;
    if (this._rafId !== null) this._cancelFrameCallback(this._rafId);
    this._rafId = null;
    this._lastTimestamp = 0;
    this._accumulator = 0;
    this._clearMotionInput();
    return this;
  };

  Game.prototype._syncSettings = function (dt) {
    normaliseSettings(this.settings, this.settings);
    if (this.settings.sound !== this._lastSound) {
      if (this.audio) this._call(this.audio, 'setEnabled', [this.settings.sound], '音频设置');
      this._lastSound = this.settings.sound;
    }
    if (this.settings.quality !== this._lastQuality) {
      this._lastQuality = this.settings.quality;
      this.resize();
    }
    if (this.settings.autoDay) this.settings.dayTime = (this.settings.dayTime + dt * this.settings.timeScale / 300) % 1;
  };

  Game.prototype.applySettings = function (patch) {
    if (!patch || typeof patch !== 'object') return this.settings;
    var source = Object.assign({}, this.settings, patch);
    normaliseSettings(this.settings, source);
    this._syncSettings(0);
    if (this.ui) this._call(this.ui, 'update', [], '设置界面更新');
    return this.settings;
  };

  Game.prototype.setSetting = function (name, value) {
    if (!Object.prototype.hasOwnProperty.call(DEFAULT_SETTINGS, name)) return false;
    var patch = {};
    patch[name] = value;
    this.applySettings(patch);
    return this.settings[name];
  };

  Game.prototype._updateActors = function (actors, label, dt) {
    if (!Array.isArray(actors)) return;
    var snapshot = actors.slice();
    for (var i = 0; i < snapshot.length; i += 1) {
      var actor = snapshot[i];
      if (!actor || actor.removed || typeof actor.update !== 'function') continue;
      var id = actor.id || actor.name || i;
      this._call(actor, 'update', [dt], label + '「' + id + '」更新');
    }
  };

  Game.prototype._notifyEnemyDefeats = function () {
    if (!this.story || !Array.isArray(this.enemies)) return;
    for (var i = 0; i < this.enemies.length; i += 1) {
      var enemy = this.enemies[i];
      if (!enemy || this._reportedDefeatedEnemies.has(enemy) || enemy._storyDefeatNotified) continue;
      var defeated = enemy.defeated === true || enemy.dead === true || enemy.state === 'defeated' || finite(enemy.health, 1) <= 0;
      if (!defeated) continue;
      this._reportedDefeatedEnemies.add(enemy);
      if (enemy._defeatNotified) continue;
      enemy._storyDefeatNotified = true;
      enemy._defeatNotified = true;
      this._call(this.story, 'onEnemyDefeated', [enemy], '剧情战斗结算');
    }
  };

  Game.prototype._updateZone = function (initial) {
    if (!this.world || !this.player || typeof this.world.zoneAt !== 'function') return;
    var result = this._call(this.world, 'zoneAt', [this.player.x, this.player.y], '区域检测');
    if (!result.ok) return;
    var zone = result.value;
    if (!zone) return;
    var name = typeof zone === 'string' ? zone : zone.name || zone.title || zone.id;
    if (!name) return;
    var key = typeof zone === 'string' ? zone : String(zone.id || name);
    this.currentZone = zone;
    this.zone = zone;
    if (key !== this._lastZoneKey) {
      var hadZone = !!this._lastZoneKey;
      this._lastZoneKey = key;
      this._zoneNoticeUntil = Date.now() + 2800;
      this._zoneNotice = String(name);
      if (!initial && hadZone) this._toast('抵达 · ' + name);
    }
  };

  Game.prototype._updateInteraction = function () {
    this.interactionTarget = null;
    this.nearbyInteraction = null;
    if (!this.player) return;
    var radius = clamp(finite(this.player.interactionRadius, 112), 32, 256);
    if (this.world && typeof this.world.nearestInteraction === 'function') {
      var result = this._call(this.world, 'nearestInteraction', [this.player.x, this.player.y, radius], '交互目标检测');
      if (result.ok && result.value) this.interactionTarget = result.value;
    }
    if (!this.interactionTarget && Array.isArray(this.npcs)) {
      var bestDistance = radius;
      for (var i = 0; i < this.npcs.length; i += 1) {
        var npc = this.npcs[i];
        if (!npc || npc.hidden || npc.removed) continue;
        var distance = Math.hypot(finite(npc.x, 1e9) - this.player.x, finite(npc.y, 1e9) - this.player.y);
        if (distance < bestDistance) {
          bestDistance = distance;
          this.interactionTarget = npc;
        }
      }
    }
    this.nearbyInteraction = this.interactionTarget;
  };

  Game.prototype._refreshObjective = function (force) {
    if (!this.story || typeof this.story.getObjective !== 'function') return;
    var result = this._call(this.story, 'getObjective', [], '主线目标读取');
    if (!result.ok) return;
    var objective = result.value || null;
    this.objective = objective;
    var key = '';
    if (objective) {
      key = [objective.title, objective.detail, objective.progress, objective.current, objective.total].join('|');
    }
    if (force || key !== this._lastObjectiveKey) {
      this._lastObjectiveKey = key;
      if (this.ui) this._call(this.ui, 'setObjective', [objective], '主线目标界面');
    }
  };

  Game.prototype._checkOutcome = function () {
    if (this.outcome) return;
    if (this.player && (this.player.dead === true || this.player.defeated === true || (finite(this.player.health, 1) <= 0 && this.player.exhausted !== true))) {
      this.finishDefeat();
      return;
    }
    var story = this.story;
    if (story && (story.completed === true || story.complete === true || story.ended === true || story.won === true || story.victory === true)) {
      this.finishVictory();
    }
  };

  Game.prototype.update = function (dt) {
    var baseDelta = clamp(finite(dt, 0), 0, MAX_FRAME_DELTA);
    var delta = baseDelta;
    this.dt = delta;
    if (this.paused || this.ended || this._hasFatal()) {
      this.dt = 0;
      if (this.ui) this._call(this.ui, 'update', [], '界面更新');
      return;
    }
    this.time += delta;
    this._syncSettings(delta);
    if (this.ui && this.ui.currentDialogue) this._clearMotionInput();
    this._syncInput();

    if (this.world) this._call(this.world, 'update', [delta], '世界更新');
    if (this.player && !(this.player.abilityLock && this.abilities && this.abilities.action)) {
      this._call(this.player, 'update', [delta], '罗小黑更新');
    }
    this._updateActors(this.npcs, '角色', delta);
    this._updateActors(this.enemies, '对手', delta);
    this._notifyEnemyDefeats();
    if (this.abilities) this._call(this.abilities, 'update', [delta], '技能更新');
    if (this.vfx) this._call(this.vfx, 'update', [delta], '特效更新');
    if (this.story) this._call(this.story, 'update', [delta], '剧情更新');
    if (this.audio) this._call(this.audio, 'update', [delta], '音频更新');

    this._updateZone(false);
    this._updateInteraction();
    this._updateCamera(delta, false);
    this._refreshObjective(false);
    this._checkOutcome();
    if (this.ui) this._call(this.ui, 'update', [], '界面更新');
  };

  Game.prototype.interact = function (target) {
    if (this.paused || this.ended || this._hasFatal()) return false;
    this._unlockAudio();
    if (!target) {
      this._updateInteraction();
      target = this.interactionTarget;
    }
    if (!target) {
      var now = Date.now();
      if (now - this._lastNoInteractionToast > 1200) {
        this._toast('附近没有可以互动的目标');
        this._lastNoInteractionToast = now;
      }
      return false;
    }
    var scope = '目标「' + (target.name || target.id || '未知') + '」互动';
    if (target.type === 'npc' && typeof target.interact === 'function') {
      var npcResult = this._call(target, 'interact', [], scope);
      return npcResult.ok && npcResult.value !== false;
    }
    if (!this.story || typeof this.story.interact !== 'function') {
      this._reportError('交互', new Error('剧情模块不可用，无法处理目标「' + (target.name || target.id || '未知') + '」'), false);
      this._toast('当前无法互动，请查看错误提示');
      return false;
    }
    var result = this._call(this.story, 'interact', [target], scope);
    if (result.ok) this._call(this.audio, 'play', ['interact'], '交互音效');
    return result.ok && result.value !== false;
  };

  Game.prototype.useAbility = function (name, screenX, screenY) {
    if (this.paused || this.ended || this._hasFatal() || !name) return false;
    this._unlockAudio();
    if (!this.abilities || typeof this.abilities.use !== 'function') {
      this._reportError('技能调用', new Error('技能模块不可用：' + name), false);
      this._toast('技能当前不可用，请查看错误提示');
      return false;
    }
    var point = this._abilityPoint(screenX, screenY);
    var result = this._call(this.abilities, 'use', [name, point.x, point.y], '技能「' + name + '」');
    return result.ok && result.value !== false;
  };

  Game.prototype.toggleForm = function () {
    if (this.paused || this.ended || this._hasFatal()) return false;
    this._unlockAudio();
    if (!this.abilities || typeof this.abilities.toggleForm !== 'function') {
      this._reportError('形态切换', new Error('技能模块未提供 toggleForm()'), false);
      return false;
    }
    var result = this._call(this.abilities, 'toggleForm', [], '形态切换');
    return result.ok && result.value !== false;
  };

  Game.prototype.togglePause = function (forcePause) {
    if (this._hasFatal() || this.ended) return this.paused;
    var next = typeof forcePause === 'boolean' ? forcePause : !this.paused;
    if (next && !this.running) return this.paused;
    this.paused = next;
    this._lastTimestamp = 0;
    this._accumulator = 0;
    this._clearMotionInput();
    if (this.ui) this._call(this.ui, 'update', [], '暂停界面更新');
    return this.paused;
  };

  Game.prototype.finishVictory = function (details) {
    if (this.outcome) return false;
    this.outcome = 'victory';
    this.ended = false;
    this.won = true;
    var storyAlreadyShown = !!(this.story && this.story.endingShown);
    if (!this._endingShown && !storyAlreadyShown && this.ui) {
      this._call(this.ui, 'showEnding', details === undefined ? [] : [details], '结局界面');
      this._call(this.audio, 'play', ['complete'], '结局音效');
    }
    this._endingShown = true;
    this._toast('《叶隙回响》主线已通关，仍可继续自由探索', 4.5);
    return true;
  };

  Game.prototype.finishDefeat = function () {
    if (this.outcome) return false;
    this.outcome = 'defeat';
    this.ended = true;
    this.won = false;
    this.paused = false;
    this._clearMotionInput();
    this._toast('这次切磋先到这里，小黑需要休息一下');
    return true;
  };

  Game.prototype.showEnding = function (details) {
    return this.finishVictory(details);
  };

  Game.prototype._serialiseActor = function (actor) {
    if (!actor) return null;
    var data = { id: actor.id || '' };
    var numeric = ['x', 'y', 'vx', 'vy', 'health', 'maxHealth', 'energy', 'maxEnergy', 'animationPhase'];
    for (var i = 0; i < numeric.length; i += 1) {
      var key = numeric[i];
      if (Number.isFinite(Number(actor[key]))) data[key] = Number(actor[key]);
    }
    var textual = ['name', 'facing', 'form', 'state'];
    for (var j = 0; j < textual.length; j += 1) {
      var textKey = textual[j];
      if (typeof actor[textKey] === 'string' || typeof actor[textKey] === 'number') data[textKey] = actor[textKey];
    }
    var flags = ['active', 'hidden', 'dead', 'defeated'];
    for (var k = 0; k < flags.length; k += 1) {
      var flag = flags[k];
      if (typeof actor[flag] === 'boolean') data[flag] = actor[flag];
    }
    return data;
  };

  Game.prototype._applyActorState = function (actor, data) {
    if (!actor || !data || typeof data !== 'object') return;
    var worldWidth = finite(this.world && this.world.width, 4800);
    var worldHeight = finite(this.world && this.world.height, 3600);
    if (Number.isFinite(Number(data.x))) actor.x = clamp(Number(data.x), 0, worldWidth);
    if (Number.isFinite(Number(data.y))) actor.y = clamp(Number(data.y), 0, worldHeight);
    var numeric = ['vx', 'vy', 'maxHealth', 'maxEnergy', 'animationPhase'];
    for (var i = 0; i < numeric.length; i += 1) {
      var key = numeric[i];
      if (Number.isFinite(Number(data[key]))) actor[key] = Number(data[key]);
    }
    if (Number.isFinite(Number(data.maxHealth))) actor.maxHealth = Math.max(1, Number(data.maxHealth));
    if (Number.isFinite(Number(data.maxEnergy))) actor.maxEnergy = Math.max(0, Number(data.maxEnergy));
    if (Number.isFinite(Number(data.health))) actor.health = clamp(Number(data.health), 0, Math.max(1, finite(actor.maxHealth, Number(data.health))));
    if (Number.isFinite(Number(data.energy))) actor.energy = clamp(Number(data.energy), 0, Math.max(0, finite(actor.maxEnergy, Number(data.energy))));
    var textual = ['facing', 'form', 'state'];
    for (var j = 0; j < textual.length; j += 1) {
      var textKey = textual[j];
      if (typeof data[textKey] === 'string' || typeof data[textKey] === 'number') actor[textKey] = data[textKey];
    }
    var flags = ['active', 'hidden', 'dead', 'defeated'];
    for (var k = 0; k < flags.length; k += 1) {
      var flag = flags[k];
      if (typeof data[flag] === 'boolean') actor[flag] = data[flag];
    }
  };

  Game.prototype._applyActorList = function (actors, saved) {
    if (!Array.isArray(actors) || !Array.isArray(saved)) return;
    var byId = Object.create(null);
    for (var i = 0; i < saved.length; i += 1) {
      if (saved[i] && saved[i].id) byId[saved[i].id] = saved[i];
    }
    for (var j = 0; j < actors.length; j += 1) {
      var actor = actors[j];
      if (!actor) continue;
      var data = actor.id && byId[actor.id] ? byId[actor.id] : saved[j];
      this._applyActorState(actor, data);
    }
  };

  Game.prototype._storage = function () {
    try {
      var storage = global.localStorage;
      if (!storage) throw new Error('当前环境没有 localStorage');
      this.storageAvailable = true;
      this.lastStorageError = null;
      return storage;
    } catch (error) {
      this.storageAvailable = false;
      this.lastStorageError = errorMessage(error);
      throw error;
    }
  };

  Game.prototype.save = function () {
    if (!this.player || !this.story || this._hasFatal()) {
      this._toast('关键模块尚未就绪，暂时无法保存');
      return false;
    }
    try {
      if (typeof this.story.serialize !== 'function') throw new Error('剧情模块未提供 serialize()');
      var storyResult = this._call(this.story, 'serialize', [], '剧情存档');
      if (!storyResult.ok || storyResult.value === undefined) throw new Error('剧情数据无法序列化');
      var data = {
        version: SAVE_VERSION,
        savedAt: new Date().toISOString(),
        time: this.time,
        settings: copySettings(this.settings),
        player: this._serialiseActor(this.player),
        npcs: this.npcs.map(this._serialiseActor.bind(this)),
        enemies: this.enemies.map(this._serialiseActor.bind(this)),
        story: storyResult.value,
        camera: { x: this.camera.x, y: this.camera.y, zoom: this.camera.zoom },
        zone: this._lastZoneKey
      };
      if (this.abilities && typeof this.abilities.serialize === 'function') {
        var abilityResult = this._call(this.abilities, 'serialize', [], '技能存档');
        if (abilityResult.ok) data.abilities = abilityResult.value;
      }
      var encoded = JSON.stringify(data);
      this._storage().setItem(this.saveKey, encoded);
      this.lastSaveTime = Date.now();
      this._toast('旅程已保存');
      return true;
    } catch (error) {
      this.lastStorageError = errorMessage(error);
      this._reportError('保存', error, false);
      this._toast('保存失败：' + errorMessage(error));
      return false;
    }
  };

  Game.prototype.load = function () {
    if (!this.player || !this.story || this._hasFatal()) {
      this._toast('关键模块尚未就绪，暂时无法读档');
      return false;
    }
    try {
      var raw = this._storage().getItem(this.saveKey);
      if (!raw) {
        this._toast('还没有可读取的旅程存档');
        return false;
      }
      var data = JSON.parse(raw);
      if (!data || typeof data !== 'object' || data.version !== SAVE_VERSION) throw new Error('存档版本不受支持');
      if (!data.player || typeof data.player !== 'object') throw new Error('存档缺少主角数据');
      if (!Object.prototype.hasOwnProperty.call(data, 'story')) throw new Error('存档缺少主线数据');
      if (typeof this.story.load !== 'function') throw new Error('剧情模块未提供 load(data)');

      normaliseSettings(this.settings, data.settings || this.settings);
      this._applyActorState(this.player, data.player);
      var storyResult = this._call(this.story, 'load', [data.story], '剧情读档');
      if (!storyResult.ok || storyResult.value === false) throw new Error('主线数据读取失败');
      this._applyActorList(this.npcs, data.npcs);
      this._applyActorList(this.enemies, data.enemies);
      if (this.abilities && data.abilities !== undefined && typeof this.abilities.load === 'function') {
        var abilityResult = this._call(this.abilities, 'load', [data.abilities], '技能读档');
        if (!abilityResult.ok || abilityResult.value === false) throw new Error('技能数据读取失败');
      }
      this.time = Math.max(0, finite(data.time, this.time));
      if (data.camera && typeof data.camera === 'object') {
        this.camera.x = finite(data.camera.x, this.player.x);
        this.camera.y = finite(data.camera.y, this.player.y);
        this.camera.zoom = clamp(finite(data.camera.zoom, this.camera.zoom), 0.55, 2.2);
        this._zoomUserSet = true;
      } else {
        this.camera.x = this.player.x;
        this.camera.y = this.player.y;
      }
      this._clampCamera();
      this.paused = false;
      this.ended = false;
      this.won = this.story.completed === true || this.story.complete === true;
      this.outcome = this.won ? 'victory' : null;
      this._endingShown = this.won && this.story.endingShown === true;
      this._reportedDefeatedEnemies = new Set();
      this._clearMotionInput();
      this._lastZoneKey = '';
      this._updateZone(true);
      this._updateInteraction();
      this._syncSettings(0);
      this._refreshObjective(true);
      this.lastSaveTime = Date.parse(data.savedAt) || Date.now();
      this._toast('已读取保存的旅程');
      return true;
    } catch (error) {
      this.lastStorageError = errorMessage(error);
      this._reportError('读档', error, false);
      this._toast('读档失败：' + errorMessage(error));
      return false;
    }
  };

  Game.prototype.restart = function () {
    if (this._destroyed) return this;
    var savedSettings = copySettings(this.settings);
    this.stop();
    this.time = 0;
    this.dt = 0;
    this.paused = false;
    this.ended = false;
    this.won = false;
    this.outcome = null;
    normaliseSettings(this.settings, savedSettings);
    this.input = { x: 0, y: 0, run: false, fly: false };
    this._directUIX = 0;
    this._directUIY = 0;
    this._externalRun = false;
    this._lastWrittenX = 0;
    this._lastWrittenY = 0;
    this._lastWrittenRun = false;
    this._screenNotice = '';
    this._screenNoticeUntil = 0;
    this._zoneNoticeUntil = 0;
    this._buildModules(true);
    this.resize();
    this._updateCamera(0, true);
    return this.start();
  };

  Game.prototype._drawActors = function () {
    var actors = [];
    if (Array.isArray(this.npcs)) actors = actors.concat(this.npcs);
    if (Array.isArray(this.enemies)) actors = actors.concat(this.enemies);
    if (this.player) actors.push(this.player);
    actors = actors.filter(function (actor) { return actor && !actor.hidden && !actor.removed; });
    actors.sort(function (a, b) {
      var difference = finite(a.y, 0) - finite(b.y, 0);
      if (difference) return difference;
      return String(a.id || '').localeCompare(String(b.id || ''));
    });
    for (var i = 0; i < actors.length; i += 1) {
      var actor = actors[i];
      var scope = '角色「' + (actor.name || actor.id || i) + '」绘制';
      if (typeof actor.draw === 'function') this._drawCall(actor, 'draw', [this.ctx], scope);
      else if (LXH.Art && typeof LXH.Art.drawActor === 'function') this._drawCall(LXH.Art, 'drawActor', [this.ctx, actor, this.time], scope);
    }
  };

  Game.prototype._wrapLines = function (text, maxWidth, maxLines) {
    var lines = [];
    var paragraphs = String(text || '').split('\n');
    for (var p = 0; p < paragraphs.length; p += 1) {
      var line = '';
      var characters = Array.from(paragraphs[p]);
      for (var i = 0; i < characters.length; i += 1) {
        var candidate = line + characters[i];
        if (line && this.ctx.measureText(candidate).width > maxWidth) {
          lines.push(line);
          line = characters[i];
          if (lines.length >= maxLines) return lines;
        } else line = candidate;
      }
      if (line || !paragraphs[p]) lines.push(line);
      if (lines.length >= maxLines) return lines;
    }
    return lines;
  };

  Game.prototype._drawTextPanel = function (title, lines, options) {
    var ctx = this.ctx;
    var settings = options || {};
    var width = Math.min(finite(settings.width, 520), this.width - 32);
    var x = (this.width - width) / 2;
    var y = finite(settings.y, Math.max(70, this.height * 0.22));
    var padding = this.width < 480 ? 18 : 24;
    var lineHeight = this.width < 480 ? 22 : 25;
    var wrapped = [];
    for (var i = 0; i < lines.length; i += 1) {
      wrapped = wrapped.concat(this._wrapLines(lines[i], width - padding * 2, 4));
    }
    var height = 62 + wrapped.length * lineHeight + padding;
    ctx.save();
    if (settings.dim) {
      ctx.fillStyle = 'rgba(8, 18, 20, 0.68)';
      ctx.fillRect(0, 0, this.width, this.height);
    }
    ctx.fillStyle = settings.fatal ? 'rgba(45, 31, 31, 0.97)' : 'rgba(20, 38, 38, 0.94)';
    ctx.strokeStyle = settings.fatal ? '#e5a498' : '#bad9c0';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    if (typeof ctx.roundRect === 'function') ctx.roundRect(x, y, width, height, 14);
    else ctx.rect(x, y, width, height);
    ctx.fill();
    ctx.stroke();
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillStyle = '#fff8e8';
    ctx.font = '600 ' + (this.width < 480 ? 21 : 25) + 'px sans-serif';
    ctx.fillText(title, this.width / 2, y + padding);
    ctx.textAlign = 'left';
    ctx.fillStyle = '#e7eddf';
    ctx.font = (this.width < 480 ? 13 : 15) + 'px sans-serif';
    for (var j = 0; j < wrapped.length; j += 1) {
      ctx.fillText(wrapped[j], x + padding, y + padding + 45 + j * lineHeight);
    }
    ctx.restore();
  };

  Game.prototype._drawFatal = function () {
    var ctx = this.ctx;
    ctx.fillStyle = '#14201f';
    ctx.fillRect(0, 0, this.width, this.height);
    var messages = this._fatalErrors.slice(-4);
    messages.push('请确认各脚本按 architecture.json 的顺序加载，并查看控制台中的 [LXH] 错误。');
    this._drawTextPanel('游戏未能完整启动', messages, { fatal: true, width: 650, y: Math.max(36, this.height * 0.16) });
  };

  Game.prototype._drawNotices = function () {
    var ctx = this.ctx;
    var now = Date.now();
    if (this._zoneNotice && now < this._zoneNoticeUntil && !this.paused && !this.ended) {
      ctx.save();
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.font = '600 ' + (this.width < 480 ? 19 : 25) + 'px sans-serif';
      var width = Math.min(this.width - 32, ctx.measureText(this._zoneNotice).width + 58);
      var remaining = (this._zoneNoticeUntil - now) / 2800;
      ctx.globalAlpha = clamp(remaining * 2.5, 0, 1);
      ctx.fillStyle = 'rgba(16, 37, 36, 0.76)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect((this.width - width) / 2, 28, width, 54, 27);
      else ctx.rect((this.width - width) / 2, 28, width, 54);
      ctx.fill();
      ctx.fillStyle = '#f4f0d9';
      ctx.fillText(this._zoneNotice, this.width / 2, 55);
      ctx.restore();
    }

    if (this.interactionTarget && !this.ui && !this.paused && !this.ended) {
      var targetName = this.interactionTarget.name || this.interactionTarget.title || this.interactionTarget.id || '目标';
      var interactionText = 'E / 交互 · ' + targetName;
      ctx.save();
      ctx.font = (this.width < 480 ? 13 : 15) + 'px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      var promptWidth = Math.min(this.width - 28, ctx.measureText(interactionText).width + 34);
      var promptY = this.height - (this.width < 480 ? 174 : 58);
      ctx.fillStyle = 'rgba(14, 31, 32, 0.82)';
      ctx.beginPath();
      if (typeof ctx.roundRect === 'function') ctx.roundRect((this.width - promptWidth) / 2, promptY - 19, promptWidth, 38, 19);
      else ctx.rect((this.width - promptWidth) / 2, promptY - 19, promptWidth, 38);
      ctx.fill();
      ctx.fillStyle = '#fff5cf';
      ctx.fillText(interactionText, this.width / 2, promptY, promptWidth - 20);
      ctx.restore();
    }

    if (this._screenNotice && now < this._screenNoticeUntil && !this.ui && !this.paused && !this.ended) {
      ctx.save();
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = 'rgba(16, 31, 31, 0.88)';
      var noticeWidth = Math.min(this.width - 30, ctx.measureText(this._screenNotice).width + 32);
      ctx.fillRect((this.width - noticeWidth) / 2, this.height - 112, noticeWidth, 38);
      ctx.fillStyle = '#fff8e8';
      ctx.fillText(this._screenNotice, this.width / 2, this.height - 93, noticeWidth - 18);
      ctx.restore();
    }
  };

  Game.prototype._drawErrors = function () {
    if (this._hasFatal() || Date.now() > this._errorVisibleUntil || !this.errors.length) return;
    var latest = this.errors[this.errors.length - 1];
    var ctx = this.ctx;
    ctx.save();
    ctx.font = '12px sans-serif';
    var lines = this._wrapLines(latest.message, Math.min(430, this.width - 58), 3);
    var width = Math.min(460, this.width - 28);
    var height = 31 + lines.length * 18;
    var y = this.width < 480 ? 90 : 14;
    ctx.fillStyle = 'rgba(71, 36, 34, 0.94)';
    ctx.fillRect(14, y, width, height);
    ctx.fillStyle = '#ffe1d7';
    ctx.fillText('部分模块遇到问题（游戏已隔离该错误）', 25, y + 22, width - 22);
    ctx.fillStyle = '#fff4e9';
    for (var i = 0; i < lines.length; i += 1) ctx.fillText(lines[i], 25, y + 41 + i * 18, width - 22);
    ctx.restore();
  };

  Game.prototype.draw = function () {
    if (!this.ctx) {
      this._showDOMFatal('游戏无法绘制：Canvas 2D 上下文不可用。\n请检查浏览器画布支持，以及控制台中的 [LXH] 错误。');
      return;
    }
    var ctx = this.ctx;
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.globalAlpha = 1;
    ctx.globalCompositeOperation = 'source-over';
    ctx.clearRect(0, 0, this.width, this.height);
    ctx.fillStyle = '#172927';
    ctx.fillRect(0, 0, this.width, this.height);
    if (this._hasFatal()) {
      this._drawFatal();
      return;
    }

    ctx.save();
    ctx.translate(this.width / 2, this.height / 2);
    ctx.scale(this.camera.zoom, this.camera.zoom);
    ctx.translate(-this.camera.x, -this.camera.y);
    if (this.world) {
      this._drawCall(this.world, 'drawGround', [ctx], '世界地面绘制');
      this._drawCall(this.world, 'drawScenery', [ctx, 'back'], '世界物件绘制');
    }
    this._drawActors();
    if (this.story) this._drawCall(this.story, 'drawWorld', [ctx], '剧情标记绘制');
    if (this.abilities) this._drawCall(this.abilities, 'drawWorld', [ctx], '技能世界绘制');
    if (this.vfx) this._drawCall(this.vfx, 'drawWorld', [ctx], '特效世界绘制');
    if (this.world) {
      this._drawCall(this.world, 'drawScenery', [ctx, 'front'], '世界近景物件绘制');
      this._drawCall(this.world, 'drawForeground', [ctx], '世界前景绘制');
    }
    ctx.restore();

    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    if (this.vfx && this.settings.lighting) this._drawCall(this.vfx, 'drawLighting', [ctx], '光照绘制');
    if (this.abilities) this._drawCall(this.abilities, 'drawScreen', [ctx], '技能屏幕绘制');
    this._drawNotices();
    var uiOwnsOverlay = this.ui && (this.ui.activeOverlay || this.ui.currentDialogue || this.ui.endingVisible);
    if (this.paused && !this.ended && !uiOwnsOverlay) {
      this._drawTextPanel('旅程已暂停', ['Esc 继续旅程', 'R 重新开始 · L 读取存档'], { dim: true, width: 440 });
    } else if (this.outcome === 'defeat') {
      this._drawTextPanel('先休息一下吧', ['这次切磋没有胜负惩罚。', 'R 重新开始 · L 读取存档'], { dim: true, width: 480 });
    } else if (this.outcome === 'victory' && this.ended && !this.ui) {
      this._drawTextPanel('叶隙回响 · 主线完成', ['感谢一路同行。', '按 R 再次踏上旅程'], { dim: true, width: 480 });
    }
    this._drawErrors();
  };

  Game.prototype.destroy = function () {
    if (this._destroyed) return;
    this.stop();
    this._destroyed = true;
    for (var i = this._listeners.length - 1; i >= 0; i -= 1) {
      var listener = this._listeners[i];
      listener.target.removeEventListener(listener.type, listener.handler, listener.options);
    }
    this._listeners = [];
    var modules = [this.world, this.player, this.abilities, this.vfx, this.story, this.ui, this.audio];
    for (var j = 0; j < modules.length; j += 1) {
      if (modules[j] && typeof modules[j].destroy === 'function') this._call(modules[j], 'destroy', [], '模块清理');
    }
    if (this._domError && this._domError.parentNode) this._domError.parentNode.removeChild(this._domError);
    this._domError = null;
  };

  LXH.Game = Game;
})(typeof window !== 'undefined' ? window : globalThis);
