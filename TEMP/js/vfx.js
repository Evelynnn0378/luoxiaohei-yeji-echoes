(function (root) {
  'use strict';

  var LXH = root.LXH = root.LXH || {};
  var TAU = Math.PI * 2;
  var QUALITY = {
    low: { particles: 160, effects: 40, rays: 18, lights: 4, segments: 36, stars: 24, fireflies: 7, leafRate: 0.35, lightScale: 0.65, refresh: 0.18 },
    medium: { particles: 320, effects: 64, rays: 32, lights: 6, segments: 64, stars: 44, fireflies: 14, leafRate: 0.8, lightScale: 0.85, refresh: 0.12 },
    high: { particles: 520, effects: 80, rays: 56, lights: 9, segments: 96, stars: 70, fireflies: 24, leafRate: 1.35, lightScale: 1, refresh: 0.08 }
  };
  var NAMED_COLORS = {
    white: '255,255,255',
    black: '0,0,0',
    gold: '255,215,0',
    yellow: '255,255,0',
    cyan: '0,255,255',
    transparent: '0,0,0'
  };

  function finite(value, fallback) {
    value = Number(value);
    return isFinite(value) ? value : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function lerp(a, b, t) {
    return a + (b - a) * t;
  }

  function smoothstep(min, max, value) {
    var t = clamp((value - min) / (max - min || 1), 0, 1);
    return t * t * (3 - 2 * t);
  }

  function random(min, max) {
    return min + Math.random() * (max - min);
  }

  function seededRandom(seed) {
    return function () {
      seed |= 0;
      seed = seed + 0x6D2B79F5 | 0;
      var value = Math.imul(seed ^ seed >>> 15, 1 | seed);
      value = value + Math.imul(value ^ value >>> 7, 61 | value) ^ value;
      return ((value ^ value >>> 14) >>> 0) / 4294967296;
    };
  }

  function colorAlpha(color, alpha) {
    color = color || '#ffffff';
    alpha = clamp(finite(alpha, 1), 0, 1);
    var match;
    if (color.charAt(0) === '#') {
      var hex = color.slice(1);
      if (hex.length === 3) {
        hex = hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
      }
      if (hex.length >= 6) {
        return 'rgba(' + parseInt(hex.slice(0, 2), 16) + ',' + parseInt(hex.slice(2, 4), 16) + ',' + parseInt(hex.slice(4, 6), 16) + ',' + alpha + ')';
      }
    }
    match = /^rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)/.exec(color);
    if (match) {
      return 'rgba(' + match[1] + ',' + match[2] + ',' + match[3] + ',' + alpha + ')';
    }
    if (NAMED_COLORS[color.toLowerCase()]) {
      return 'rgba(' + NAMED_COLORS[color.toLowerCase()] + ',' + alpha + ')';
    }
    return color;
  }

  function roughEllipse(ctx, x, y, rx, ry, seed, rotation, segments, wobble) {
    var i;
    var angle;
    var radius;
    var px;
    var py;
    ctx.beginPath();
    for (i = 0; i <= segments; i += 1) {
      angle = (i % segments) / segments * TAU + rotation;
      radius = 1 + Math.sin(i * 2.17 + seed) * wobble + Math.cos(i * 1.31 + seed * 0.7) * wobble * 0.45;
      px = x + Math.cos(angle) * rx * radius;
      py = y + Math.sin(angle) * ry * radius;
      if (i === 0) {
        ctx.moveTo(px, py);
      } else {
        ctx.lineTo(px, py);
      }
    }
    ctx.closePath();
  }

  function VFX(game) {
    this.game = game;
    this.particles = [];
    this.effects = [];
    this.lights = [];
    this.time = 0;
    this.shadowsEnabled = true;
    this._nextId = 1;
    this._leafClock = 0;
    this._fireflyClock = 0;
    this._lightCanvas = null;
    this._lightContext = null;
    this._lightScale = 1;
    this._visibility = new Map();
    this._occluders = { source: null, length: -1, time: -10, revision: 0, segments: [] };
    this._systemReducedMotion = false;
    if (root.matchMedia) {
      this._systemReducedMotion = !!root.matchMedia('(prefers-reduced-motion: reduce)').matches;
    }
    this.stars = [];
    var rand = seededRandom(17062011);
    for (var i = 0; i < 80; i += 1) {
      this.stars.push({
        x: rand(),
        y: Math.pow(rand(), 1.65) * 0.62,
        size: 0.45 + rand() * 1.35,
        phase: rand() * TAU,
        color: rand() > 0.78 ? '#ffe8bd' : '#d9edff'
      });
    }
  }

  VFX.prototype._settings = function () {
    return this.game && this.game.settings ? this.game.settings : {};
  };

  VFX.prototype._reduced = function () {
    return this._systemReducedMotion || this._settings().reducedMotion === true;
  };

  VFX.prototype._quality = function () {
    var name = this._settings().quality || 'high';
    if (name === '低' || name === 'low' || name === 0) {
      name = 'low';
    } else if (name === '中' || name === 'medium' || name === 'med' || name === 1) {
      name = 'medium';
    } else if (name === 'auto') {
      name = this._screenSize().width < 760 ? 'medium' : 'high';
    } else if (name !== 'low' && name !== 'medium') {
      name = 'high';
    }
    var source = QUALITY[name];
    var compact = this._screenSize().width < 720;
    var reduced = this._reduced();
    return {
      name: name,
      particles: Math.round((compact ? Math.min(source.particles, 360) : source.particles) * (reduced ? 0.48 : 1)),
      effects: Math.round(source.effects * (reduced ? 0.65 : 1)),
      rays: Math.max(12, Math.round((compact ? Math.min(source.rays, 40) : source.rays) * (reduced ? 0.55 : 1))),
      lights: compact ? Math.min(source.lights, 6) : source.lights,
      segments: source.segments,
      stars: Math.round(source.stars * (reduced ? 0.55 : 1)),
      fireflies: Math.round(source.fireflies * (reduced ? 0.4 : 1)),
      leafRate: source.leafRate * (reduced ? 0.22 : 1),
      lightScale: source.lightScale,
      refresh: source.refresh
    };
  };

  VFX.prototype._screenSize = function () {
    var game = this.game || {};
    var canvas = game.canvas || {};
    var dpr = finite(game.dpr, root.devicePixelRatio || 1);
    return {
      width: Math.max(1, finite(game.width, finite(canvas.clientWidth, finite(canvas.width, 800) / dpr))),
      height: Math.max(1, finite(game.height, finite(canvas.clientHeight, finite(canvas.height, 600) / dpr)))
    };
  };

  VFX.prototype.worldToScreen = function (x, y) {
    var game = this.game || {};
    if (typeof game.worldToScreen === 'function') {
      var converted = game.worldToScreen(x, y);
      if (converted && isFinite(converted.x) && isFinite(converted.y)) {
        return { x: converted.x, y: converted.y };
      }
    }
    var camera = game.camera || {};
    var size = this._screenSize();
    var zoom = clamp(finite(camera.zoom, 1), 0.1, 5);
    var left;
    var top;
    if (isFinite(camera.left) && isFinite(camera.top)) {
      left = finite(camera.left, 0);
      top = finite(camera.top, 0);
    } else if (camera.topLeft === true || camera.mode === 'top-left' || camera.origin === 'top-left') {
      left = finite(camera.x, 0);
      top = finite(camera.y, 0);
    } else {
      left = finite(camera.x, 0) - size.width / (2 * zoom);
      top = finite(camera.y, 0) - size.height / (2 * zoom);
    }
    return { x: (x - left) * zoom, y: (y - top) * zoom };
  };

  VFX.prototype.screenToWorld = function (x, y) {
    var game = this.game || {};
    if (typeof game.screenToWorld === 'function') {
      var converted = game.screenToWorld(x, y);
      if (converted && isFinite(converted.x) && isFinite(converted.y)) {
        return { x: converted.x, y: converted.y };
      }
    }
    var camera = game.camera || {};
    var size = this._screenSize();
    var zoom = clamp(finite(camera.zoom, 1), 0.1, 5);
    var left;
    var top;
    if (isFinite(camera.left) && isFinite(camera.top)) {
      left = finite(camera.left, 0);
      top = finite(camera.top, 0);
    } else if (camera.topLeft === true || camera.mode === 'top-left' || camera.origin === 'top-left') {
      left = finite(camera.x, 0);
      top = finite(camera.y, 0);
    } else {
      left = finite(camera.x, 0) - size.width / (2 * zoom);
      top = finite(camera.y, 0) - size.height / (2 * zoom);
    }
    return { x: x / zoom + left, y: y / zoom + top };
  };

  VFX.prototype._viewBounds = function (padding) {
    var size = this._screenSize();
    var topLeft = this.screenToWorld(0, 0);
    var bottomRight = this.screenToWorld(size.width, size.height);
    padding = finite(padding, 0);
    return {
      left: Math.min(topLeft.x, bottomRight.x) - padding,
      top: Math.min(topLeft.y, bottomRight.y) - padding,
      right: Math.max(topLeft.x, bottomRight.x) + padding,
      bottom: Math.max(topLeft.y, bottomRight.y) + padding
    };
  };

  VFX.prototype._daylight = function () {
    var settings = this._settings();
    var dayTime = finite(settings.dayTime, finite(this.game && this.game.dayTime, 0.34));
    if (dayTime > 1 && dayTime <= 24) {
      dayTime /= 24;
    }
    dayTime = ((dayTime % 1) + 1) % 1;
    var elevation = Math.sin((dayTime - 0.25) * TAU);
    var day = smoothstep(-0.16, 0.28, elevation);
    var twilight = Math.max(0, 1 - Math.abs(elevation) / 0.34) * (1 - Math.abs(dayTime - 0.5));
    return { day: day, night: 1 - day, twilight: twilight, elevation: elevation };
  };

  VFX.prototype._addParticle = function (data) {
    var quality = this._quality();
    if (this.particles.length >= quality.particles) {
      this.particles.splice(0, this.particles.length - quality.particles + 1);
    }
    data.x = finite(data.x, 0);
    data.y = finite(data.y, 0);
    data.vx = finite(data.vx, 0);
    data.vy = finite(data.vy, 0);
    data.life = Math.max(0.03, finite(data.life, 0.7));
    data.maxLife = data.life;
    data.size = Math.max(0.2, finite(data.size, 3));
    data.color = data.color || '#b9ead7';
    data.alpha = clamp(finite(data.alpha, 1), 0, 1);
    data.drag = clamp(finite(data.drag, 0.96), 0, 1);
    data.gravity = finite(data.gravity, 0);
    data.rotation = finite(data.rotation, random(0, TAU));
    data.spin = finite(data.spin, 0);
    data.phase = finite(data.phase, random(0, TAU));
    data.sway = finite(data.sway, 0);
    data.seed = finite(data.seed, random(0, 1000));
    this.particles.push(data);
    return data;
  };

  VFX.prototype._addEffect = function (kind, x, y, options) {
    options = options || {};
    var quality = this._quality();
    if (this.effects.length >= quality.effects) {
      this.effects.splice(0, this.effects.length - quality.effects + 1);
    }
    var durations = { teleport: 0.8, ripple: 0.65, metal: 0.34, hit: 0.3, heal: 1, dash: 0.28, heixiu: 0.75 };
    var life = Math.max(0.05, finite(options.duration, finite(options.life, durations[kind] || 0.6)));
    var effect = {
      id: 'vfx-' + this._nextId++,
      kind: kind,
      x: finite(x, 0),
      y: finite(y, 0),
      x2: finite(options.x2, finite(options.endX, finite(options.tx, x))),
      y2: finite(options.y2, finite(options.endY, finite(options.ty, y))),
      target: options.target || null,
      follow: options.follow || null,
      offsetX: finite(options.offsetX, 0),
      offsetY: finite(options.offsetY, 0),
      angle: finite(options.angle, 0),
      radius: Math.max(2, finite(options.radius, finite(options.size, kind === 'teleport' ? 68 : 72))),
      color: options.color || (kind === 'metal' ? '#d8e5eb' : kind === 'hit' ? '#f6d79a' : kind === 'heal' ? '#a7e6ae' : '#a7eee5'),
      life: life,
      maxLife: life,
      seed: random(0, 1000),
      intensity: clamp(finite(options.intensity, 1), 0, 3),
      light: options.light !== false,
      shadow: options.shadow,
      priority: finite(options.priority, 2)
    };
    this.effects.push(effect);
    return effect;
  };

  VFX.prototype._motionCount = function (count, ambient) {
    var scale = this._settings().quality === 'low' ? 0.55 : this._settings().quality === 'medium' ? 0.78 : 1;
    scale *= this._reduced() ? 0.35 : 1;
    var result = Math.round(count * scale);
    return ambient ? result : Math.max(1, result);
  };

  VFX.prototype._burst = function (x, y, options) {
    options = options || {};
    var count = this._motionCount(finite(options.count, 10), false);
    var speed = finite(options.speed, 90);
    var kind = options.kind || 'spark';
    for (var i = 0; i < count; i += 1) {
      var angle = finite(options.angle, 0) + (options.spread ? random(-options.spread / 2, options.spread / 2) : random(0, TAU));
      var velocity = speed * random(0.35, 1);
      this._addParticle({
        kind: kind,
        x: x + random(-3, 3),
        y: y + random(-3, 3),
        vx: Math.cos(angle) * velocity * (this._reduced() ? 0.22 : 1),
        vy: Math.sin(angle) * velocity * (this._reduced() ? 0.22 : 1) + finite(options.lift, 0),
        life: random(0.35, finite(options.duration, 0.8)),
        size: random(1.2, finite(options.size, 3.4)),
        color: options.color || '#b9eee4',
        drag: 0.94,
        gravity: finite(options.gravity, kind === 'hit' ? 90 : 0)
      });
    }
  };

  VFX.prototype.emit = function (type, x, y, options) {
    options = options || {};
    x = finite(x, 0);
    y = finite(y, 0);
    var normalized = String(type || 'spark').toLowerCase().replace(/[\s_\-]+/g, '');
    var aliases = {
      leaves: 'leaf', foliage: 'leaf', '落叶': 'leaf',
      spirit: 'ripple', energy: 'ripple', spiritual: 'ripple', teleportprepare: 'ripple', heixiuinteract: 'ripple', '灵力': 'ripple', '灵力波纹': 'ripple',
      portal: 'teleport', transfer: 'teleport', space: 'teleport', blink: 'teleport', dispel: 'teleport', '传送': 'teleport', '传送环': 'teleport', '转送': 'teleport',
      metaltrail: 'metal', metalcontrol: 'metal', '御金': 'metal', '金属': 'metal', '金属轨迹': 'metal',
      impact: 'hit', damage: 'hit', metalhit: 'hit', '命中': 'hit',
      healing: 'heal', form: 'heal', '治愈': 'heal', '治疗': 'heal',
      wisp: 'heixiu', spiritwisp: 'heixiu', '嘿咻': 'heixiu'
    };
    if (options.direction && isFinite(options.direction.x) && isFinite(options.direction.y) && !isFinite(options.angle)) {
      options.angle = Math.atan2(options.direction.y, options.direction.x);
    }
    if (normalized === 'metalhit' && !options.color) {
      options.color = '#d8e5eb';
    }
    var kind = aliases[normalized] || normalized;
    var i;
    var count;
    var effect;
    if (kind === 'leaf') {
      count = this._motionCount(finite(options.count, 8), false);
      for (i = 0; i < count; i += 1) {
        this._addParticle({
          kind: 'leaf',
          x: x + random(-22, 22),
          y: y + random(-12, 12),
          vx: random(-24, 32) * (this._reduced() ? 0.15 : 1),
          vy: random(12, 42) * (this._reduced() ? 0.2 : 1),
          life: random(1.8, finite(options.duration, 4.2)),
          size: random(4, finite(options.size, 8)),
          color: options.color || (Math.random() > 0.45 ? '#86ad68' : '#c0c77a'),
          sway: random(8, 22),
          spin: random(-1.8, 1.8) * (this._reduced() ? 0 : 1),
          drag: 0.995,
          alpha: 0.85
        });
      }
      return this.particles[this.particles.length - 1] || null;
    }
    if (kind === 'teleport') {
      effect = this._addEffect('teleport', x, y, options);
      this._burst(x, y, { count: finite(options.count, 18), speed: 115, color: effect.color, size: 3.2, duration: 0.75 });
      return effect;
    }
    if (kind === 'ripple') {
      effect = this._addEffect('ripple', x, y, options);
      this._burst(x, y, { count: finite(options.count, 7), speed: 55, color: effect.color, duration: 0.7 });
      return effect;
    }
    if (kind === 'metal') {
      var target = options.target || null;
      var tx = finite(options.x2, finite(options.endX, finite(options.tx, target ? target.x : NaN)));
      var ty = finite(options.y2, finite(options.endY, finite(options.ty, target ? target.y : NaN)));
      if (!isFinite(tx) || !isFinite(ty)) {
        var angle = finite(options.angle, NaN);
        if (!isFinite(angle)) {
          var facing = this.game && this.game.player ? this.game.player.facing : 1;
          angle = facing === 'left' || facing === -1 ? Math.PI : facing === 'up' ? -Math.PI / 2 : facing === 'down' ? Math.PI / 2 : 0;
        }
        var length = finite(options.length, 150);
        tx = x + Math.cos(angle) * length;
        ty = y + Math.sin(angle) * length;
      }
      options.x2 = tx;
      options.y2 = ty;
      options.angle = Math.atan2(ty - y, tx - x);
      effect = this._addEffect('metal', x, y, options);
      this._burst(tx, ty, { count: finite(options.count, 8), speed: 75, color: '#e7f2f1', size: 2.6, duration: 0.42, kind: 'metal' });
      return effect;
    }
    if (kind === 'hit') {
      effect = this._addEffect('hit', x, y, options);
      this._burst(x, y, { count: finite(options.count, 12), speed: 145, color: effect.color, duration: 0.48, gravity: 85, kind: 'spark' });
      return effect;
    }
    if (kind === 'heal') {
      effect = this._addEffect('heal', x, y, options);
      count = this._motionCount(finite(options.count, 12), false);
      for (i = 0; i < count; i += 1) {
        this._addParticle({
          kind: i % 3 === 0 ? 'leaf' : 'mote',
          x: x + random(-28, 28),
          y: y + random(-8, 18),
          vx: random(-10, 10) * (this._reduced() ? 0 : 1),
          vy: random(-58, -24) * (this._reduced() ? 0.12 : 1),
          life: random(0.65, 1.25),
          size: random(2.5, 5.5),
          color: effect.color,
          sway: 7,
          spin: random(-1, 1) * (this._reduced() ? 0 : 1),
          drag: 0.985
        });
      }
      return effect;
    }
    if (kind === 'dash') {
      effect = this._addEffect('dash', x, y, options);
      this._burst(x, y, { count: finite(options.count, 7), speed: 65, color: effect.color, duration: 0.35 });
      return effect;
    }
    if (kind === 'heixiu') {
      effect = this._addEffect('heixiu', x, y, options);
      this._burst(x, y, { count: finite(options.count, 6), speed: 35, color: '#637e80', duration: 0.8 });
      return effect;
    }
    if (kind === 'firefly') {
      return this._spawnFirefly(x, y, options);
    }
    if (kind === 'light') {
      return this.addLight(x, y, options);
    }
    this._burst(x, y, {
      count: finite(options.count, 8),
      speed: finite(options.speed, 70),
      color: options.color || '#b9eee4',
      duration: finite(options.duration, 0.7),
      size: finite(options.size, 3),
      kind: normalized === 'mote' ? 'mote' : 'spark'
    });
    return this.particles[this.particles.length - 1] || null;
  };

  VFX.prototype._spawnFirefly = function (x, y, options) {
    options = options || {};
    return this._addParticle({
      kind: 'firefly',
      x: x,
      y: y,
      vx: random(-5, 5) * (this._reduced() ? 0 : 1),
      vy: random(-4, 4) * (this._reduced() ? 0 : 1),
      life: finite(options.life, random(4.5, 8)),
      size: finite(options.size, random(1.5, 2.6)),
      color: options.color || '#e8ec9c',
      sway: random(6, 16),
      drag: 1,
      alpha: finite(options.alpha, 0.85)
    });
  };

  VFX.prototype._updateAmbient = function (dt) {
    var quality = this._quality();
    var bounds = this._viewBounds(90);
    var reduced = this._reduced();
    this._leafClock += dt * quality.leafRate;
    if (this._leafClock >= 1) {
      this._leafClock %= 1;
      this._addParticle({
        kind: 'leaf',
        x: random(bounds.left, bounds.right),
        y: reduced ? random(bounds.top, bounds.bottom) : bounds.top - 20,
        vx: random(8, 28) * (reduced ? 0 : 1),
        vy: random(15, 32) * (reduced ? 0.1 : 1),
        life: random(4, 7),
        size: random(3.5, 7),
        color: Math.random() > 0.5 ? '#789c62' : '#b4bb72',
        sway: random(8, 20) * (reduced ? 0 : 1),
        spin: random(-1.2, 1.2) * (reduced ? 0 : 1),
        drag: 1,
        alpha: 0.62
      });
    }
    var night = this._daylight().night;
    if (night > 0.42 && quality.fireflies > 0) {
      var active = 0;
      for (var i = 0; i < this.particles.length; i += 1) {
        if (this.particles[i].kind === 'firefly') {
          active += 1;
        }
      }
      this._fireflyClock += dt;
      if (active < quality.fireflies && this._fireflyClock >= 0.16) {
        this._fireflyClock = 0;
        this._spawnFirefly(random(bounds.left, bounds.right), random(bounds.top, bounds.bottom), { life: random(4, 7) });
      }
    } else {
      this._fireflyClock = 0;
    }
  };

  VFX.prototype.update = function (dt) {
    dt = clamp(finite(dt, 0), 0, 0.1);
    if (dt <= 0 || this.game && this.game.paused) {
      return;
    }
    this.time += dt;
    var reduced = this._reduced();
    var i;
    var particle;
    for (i = this.particles.length - 1; i >= 0; i -= 1) {
      particle = this.particles[i];
      particle.life -= dt;
      if (particle.life <= 0) {
        this.particles.splice(i, 1);
        continue;
      }
      var drag = Math.pow(particle.drag, dt * 60);
      particle.vx *= drag;
      particle.vy = particle.vy * drag + particle.gravity * dt;
      particle.x += particle.vx * dt;
      particle.y += particle.vy * dt;
      if (particle.sway && !reduced) {
        particle.x += Math.sin(this.time * 1.7 + particle.phase) * particle.sway * dt;
      }
      particle.rotation += particle.spin * dt;
    }
    for (i = this.effects.length - 1; i >= 0; i -= 1) {
      var effect = this.effects[i];
      effect.life -= dt;
      if (effect.follow) {
        effect.x = finite(effect.follow.x, effect.x) + effect.offsetX;
        effect.y = finite(effect.follow.y, effect.y) + effect.offsetY;
      }
      if (effect.target) {
        effect.x2 = finite(effect.target.x, effect.x2);
        effect.y2 = finite(effect.target.y, effect.y2);
      }
      if (effect.life <= 0) {
        this.effects.splice(i, 1);
        this._visibility.delete(effect.id);
      }
    }
    for (i = this.lights.length - 1; i >= 0; i -= 1) {
      if (isFinite(this.lights[i].life)) {
        this.lights[i].life -= dt;
        if (this.lights[i].life <= 0) {
          this._visibility.delete(this.lights[i].id);
          this.lights.splice(i, 1);
        }
      }
    }
    this._updateAmbient(dt);
  };

  VFX.prototype._visible = function (x, y, radius, bounds) {
    return x + radius >= bounds.left && x - radius <= bounds.right && y + radius >= bounds.top && y - radius <= bounds.bottom;
  };

  VFX.prototype._drawLeaf = function (ctx, particle, alpha) {
    var size = particle.size;
    ctx.save();
    ctx.translate(particle.x, particle.y);
    ctx.rotate(particle.rotation);
    ctx.globalAlpha = alpha * particle.alpha;
    ctx.fillStyle = particle.color;
    ctx.strokeStyle = 'rgba(49,82,57,0.55)';
    ctx.lineWidth = 0.7;
    ctx.beginPath();
    ctx.moveTo(0, -size);
    ctx.bezierCurveTo(size * 0.9, -size * 0.45, size * 0.8, size * 0.55, 0, size);
    ctx.bezierCurveTo(-size * 0.72, size * 0.42, -size * 0.8, -size * 0.5, 0, -size);
    ctx.fill();
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(0, -size * 0.72);
    ctx.quadraticCurveTo(size * 0.12, 0, 0, size * 0.85);
    ctx.stroke();
    ctx.restore();
  };

  VFX.prototype._drawParticle = function (ctx, particle) {
    var progress = 1 - particle.life / particle.maxLife;
    var alpha = clamp(particle.life / Math.min(0.45, particle.maxLife), 0, 1) * clamp(progress * 5, 0, 1);
    if (particle.kind === 'leaf') {
      this._drawLeaf(ctx, particle, alpha);
      return;
    }
    ctx.globalAlpha = alpha * particle.alpha;
    if (particle.kind === 'firefly') {
      var pulse = this._reduced() ? 0.75 : 0.55 + Math.sin(this.time * 3.1 + particle.phase) * 0.25;
      ctx.fillStyle = colorAlpha(particle.color, 0.1 * pulse);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = colorAlpha(particle.color, 0.28 * pulse);
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * 2.5, 0, TAU);
      ctx.fill();
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * pulse, 0, TAU);
      ctx.fill();
      return;
    }
    if (particle.kind === 'mote') {
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(particle.x, particle.y, particle.size * (1 - progress * 0.35), 0, TAU);
      ctx.fill();
      ctx.strokeStyle = 'rgba(255,255,255,0.45)';
      ctx.lineWidth = 0.7;
      ctx.stroke();
      return;
    }
    ctx.strokeStyle = particle.color;
    ctx.lineCap = 'round';
    if (particle.kind === 'metal') {
      ctx.lineWidth = Math.max(0.8, particle.size * 0.55);
      ctx.beginPath();
      ctx.moveTo(particle.x - particle.vx * 0.035, particle.y - particle.vy * 0.035);
      ctx.lineTo(particle.x + particle.vx * 0.015, particle.y + particle.vy * 0.015);
      ctx.stroke();
      ctx.strokeStyle = 'rgba(72,91,105,0.65)';
      ctx.lineWidth = 0.6;
      ctx.stroke();
      return;
    }
    ctx.lineWidth = Math.max(0.7, particle.size * (1 - progress * 0.6));
    ctx.beginPath();
    ctx.moveTo(particle.x - particle.vx * 0.025, particle.y - particle.vy * 0.025);
    ctx.lineTo(particle.x, particle.y);
    ctx.stroke();
  };

  VFX.prototype._drawTeleport = function (ctx, effect, progress, alpha) {
    var reduced = this._reduced();
    var eased = 1 - Math.pow(1 - progress, 3);
    var radius = effect.radius * (0.35 + eased * 0.85);
    var rotation = reduced ? effect.seed : effect.seed + this.time * 0.9;
    var segments = this._quality().name === 'low' ? 20 : 32;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 2.2;
    ctx.globalAlpha = alpha * 0.85;
    roughEllipse(ctx, effect.x, effect.y, radius, radius * 0.56, effect.seed, rotation * 0.08, segments, 0.035);
    ctx.stroke();
    ctx.strokeStyle = '#e9fff7';
    ctx.lineWidth = 0.9;
    ctx.globalAlpha = alpha * 0.9;
    roughEllipse(ctx, effect.x, effect.y, radius * 0.72, radius * 0.39, effect.seed + 4, -rotation * 0.1, segments, 0.025);
    ctx.stroke();
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 1.3;
    for (var i = 0; i < 7; i += 1) {
      var angle = rotation + i / 7 * TAU;
      var inner = radius * 0.82;
      var outer = radius * (i % 2 ? 1.02 : 1.1);
      ctx.beginPath();
      ctx.moveTo(effect.x + Math.cos(angle) * inner, effect.y + Math.sin(angle) * inner * 0.56);
      ctx.lineTo(effect.x + Math.cos(angle) * outer, effect.y + Math.sin(angle) * outer * 0.56);
      ctx.stroke();
    }
    var glow = ctx.createRadialGradient(effect.x, effect.y, 0, effect.x, effect.y, radius * 0.85);
    glow.addColorStop(0, colorAlpha(effect.color, alpha * 0.13));
    glow.addColorStop(1, colorAlpha(effect.color, 0));
    ctx.fillStyle = glow;
    ctx.globalAlpha = 1;
    ctx.beginPath();
    ctx.ellipse(effect.x, effect.y, radius * 0.85, radius * 0.5, 0, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  VFX.prototype._drawRipple = function (ctx, effect, progress, alpha) {
    var radius = effect.radius * (0.15 + progress * 0.85);
    var segments = this._quality().name === 'low' ? 18 : 28;
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = effect.color;
    ctx.globalAlpha = alpha * 0.75;
    ctx.lineWidth = 2.4 * (1 - progress) + 0.7;
    roughEllipse(ctx, effect.x, effect.y, radius, radius * 0.58, effect.seed, 0, segments, 0.025);
    ctx.stroke();
    ctx.globalAlpha = alpha * 0.38;
    ctx.lineWidth = 1;
    roughEllipse(ctx, effect.x, effect.y, radius * 0.72, radius * 0.4, effect.seed + 9, 0, segments, 0.035);
    ctx.stroke();
    ctx.restore();
  };

  VFX.prototype._drawMetal = function (ctx, effect, progress, alpha) {
    var dx = effect.x2 - effect.x;
    var dy = effect.y2 - effect.y;
    var length = Math.sqrt(dx * dx + dy * dy) || 1;
    var bend = Math.sin(effect.seed) * Math.min(38, length * 0.14);
    var cx = (effect.x + effect.x2) / 2 - dy / length * bend;
    var cy = (effect.y + effect.y2) / 2 + dx / length * bend;
    var head = clamp(progress * 1.7, 0.06, 1);
    function point(t) {
      var u = 1 - t;
      return {
        x: u * u * effect.x + 2 * u * t * cx + t * t * effect.x2,
        y: u * u * effect.y + 2 * u * t * cy + t * t * effect.y2
      };
    }
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha;
    for (var pass = 0; pass < 2; pass += 1) {
      ctx.strokeStyle = pass === 0 ? 'rgba(52,70,82,0.7)' : effect.color;
      ctx.lineWidth = pass === 0 ? 5 : 1.7;
      ctx.beginPath();
      for (var i = 0; i <= 18; i += 1) {
        var p = point(head * i / 18);
        if (i === 0) {
          ctx.moveTo(p.x, p.y);
        } else {
          ctx.lineTo(p.x, p.y);
        }
      }
      ctx.stroke();
    }
    var tip = point(head);
    var before = point(Math.max(0, head - 0.04));
    var angle = Math.atan2(tip.y - before.y, tip.x - before.x);
    ctx.translate(tip.x, tip.y);
    ctx.rotate(angle);
    ctx.fillStyle = '#e9f2f2';
    ctx.strokeStyle = '#586d7b';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(13, 0);
    ctx.lineTo(-5, -3.5);
    ctx.lineTo(-1, 0);
    ctx.lineTo(-5, 3.5);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#ffffff';
    ctx.globalAlpha = alpha * 0.8;
    ctx.beginPath();
    ctx.moveTo(7, -5);
    ctx.lineTo(7, 5);
    ctx.moveTo(2, 0);
    ctx.lineTo(12, 0);
    ctx.stroke();
    ctx.restore();
  };

  VFX.prototype._drawHit = function (ctx, effect, progress, alpha) {
    var radius = effect.radius * 0.42 * (0.35 + progress * 0.9);
    ctx.save();
    ctx.translate(effect.x, effect.y);
    ctx.rotate(effect.seed + (this._reduced() ? 0 : progress * 0.35));
    ctx.globalAlpha = alpha;
    ctx.fillStyle = colorAlpha(effect.color, 0.34);
    ctx.strokeStyle = effect.color;
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    for (var i = 0; i < 16; i += 1) {
      var angle = i / 16 * TAU;
      var r = i % 2 === 0 ? radius : radius * 0.34;
      var x = Math.cos(angle) * r;
      var y = Math.sin(angle) * r;
      if (i === 0) {
        ctx.moveTo(x, y);
      } else {
        ctx.lineTo(x, y);
      }
    }
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = '#fff9df';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-radius * 0.55, 0);
    ctx.lineTo(radius * 0.55, 0);
    ctx.moveTo(0, -radius * 0.55);
    ctx.lineTo(0, radius * 0.55);
    ctx.stroke();
    ctx.restore();
  };

  VFX.prototype._drawHeal = function (ctx, effect, progress, alpha) {
    var radius = effect.radius * (0.25 + progress * 0.65);
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    ctx.strokeStyle = effect.color;
    ctx.globalAlpha = alpha * 0.6;
    ctx.lineWidth = 1.5;
    roughEllipse(ctx, effect.x, effect.y + 4, radius, radius * 0.4, effect.seed, 0, 24, 0.025);
    ctx.stroke();
    for (var i = 0; i < 5; i += 1) {
      var angle = i / 5 * TAU + effect.seed;
      var drift = this._reduced() ? 0 : progress * 20;
      var x = effect.x + Math.cos(angle) * radius * 0.55;
      var y = effect.y + Math.sin(angle) * radius * 0.22 - drift;
      ctx.strokeStyle = i % 2 ? '#e5f7c9' : effect.color;
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(x - 3, y);
      ctx.lineTo(x + 3, y);
      ctx.moveTo(x, y - 3);
      ctx.lineTo(x, y + 3);
      ctx.stroke();
    }
    ctx.restore();
  };

  VFX.prototype._drawDash = function (ctx, effect, progress, alpha) {
    var angle = effect.angle;
    var length = effect.radius * (0.7 + progress * 0.4);
    ctx.save();
    ctx.translate(effect.x, effect.y);
    ctx.rotate(angle);
    ctx.strokeStyle = effect.color;
    ctx.lineCap = 'round';
    for (var i = -2; i <= 2; i += 1) {
      ctx.globalAlpha = alpha * (1 - Math.abs(i) * 0.14);
      ctx.lineWidth = i === 0 ? 2 : 1;
      ctx.beginPath();
      ctx.moveTo(-length * (0.35 + Math.abs(i) * 0.08), i * 7);
      ctx.quadraticCurveTo(0, i * 7 + Math.sin(effect.seed + i) * 2, length * (0.65 - Math.abs(i) * 0.07), i * 5);
      ctx.stroke();
    }
    ctx.restore();
  };

  VFX.prototype._drawHeixiu = function (ctx, effect, progress, alpha) {
    ctx.save();
    ctx.translate(effect.x, effect.y - (this._reduced() ? 0 : progress * 24));
    ctx.globalAlpha = alpha * 0.85;
    ctx.fillStyle = '#253334';
    ctx.strokeStyle = '#91c9bb';
    ctx.lineWidth = 1;
    for (var i = 0; i < 3; i += 1) {
      var x = Math.sin(effect.seed + i * 2.1) * 16;
      var y = -i * 10;
      var size = 7 - i * 1.2;
      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fill();
      ctx.stroke();
      if (i === 0) {
        ctx.fillStyle = '#ecf5df';
        ctx.beginPath();
        ctx.arc(x - 2.2, y - 0.5, 1, 0, TAU);
        ctx.arc(x + 2.2, y - 0.5, 1, 0, TAU);
        ctx.fill();
        ctx.fillStyle = '#253334';
      }
    }
    ctx.restore();
  };

  VFX.prototype.drawWorld = function (ctx) {
    if (!ctx) {
      return;
    }
    var bounds = this._viewBounds(150);
    ctx.save();
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    var i;
    var effect;
    for (i = 0; i < this.effects.length; i += 1) {
      effect = this.effects[i];
      var reach = effect.kind === 'metal' ? Math.max(Math.abs(effect.x2 - effect.x), Math.abs(effect.y2 - effect.y)) + effect.radius : effect.radius * 1.5;
      if (!this._visible(effect.x, effect.y, reach, bounds)) {
        continue;
      }
      var progress = clamp(1 - effect.life / effect.maxLife, 0, 1);
      var alpha = clamp(effect.life / Math.min(0.28, effect.maxLife), 0, 1) * effect.intensity;
      if (effect.kind === 'teleport') {
        this._drawTeleport(ctx, effect, progress, alpha);
      } else if (effect.kind === 'ripple') {
        this._drawRipple(ctx, effect, progress, alpha);
      } else if (effect.kind === 'metal') {
        this._drawMetal(ctx, effect, progress, alpha);
      } else if (effect.kind === 'hit') {
        this._drawHit(ctx, effect, progress, alpha);
      } else if (effect.kind === 'heal') {
        this._drawHeal(ctx, effect, progress, alpha);
      } else if (effect.kind === 'dash') {
        this._drawDash(ctx, effect, progress, alpha);
      } else if (effect.kind === 'heixiu') {
        this._drawHeixiu(ctx, effect, progress, alpha);
      }
    }
    ctx.globalCompositeOperation = 'source-over';
    for (i = 0; i < this.particles.length; i += 1) {
      var particle = this.particles[i];
      if (this._visible(particle.x, particle.y, particle.size * 6 + 20, bounds)) {
        this._drawParticle(ctx, particle);
      }
    }
    ctx.restore();
  };

  VFX.prototype.addLight = function (x, y, options) {
    if (typeof x === 'object') {
      options = x;
      x = options.x;
      y = options.y;
    }
    options = options || {};
    var light = {
      id: options.id || 'light-' + this._nextId++,
      x: finite(x, 0),
      y: finite(y, 0),
      radius: Math.max(8, finite(options.radius, 180)),
      color: options.color || '#ffdca0',
      intensity: clamp(finite(options.intensity, 0.8), 0, 2),
      shadow: options.shadow !== false,
      enabled: options.enabled !== false,
      nightOnly: options.nightOnly === true,
      priority: finite(options.priority, 1),
      life: isFinite(options.life) ? Math.max(0.05, options.life) : Infinity
    };
    this.lights.push(light);
    return light;
  };

  VFX.prototype.removeLight = function (lightOrId) {
    var id = typeof lightOrId === 'object' ? lightOrId.id : lightOrId;
    for (var i = this.lights.length - 1; i >= 0; i -= 1) {
      if (this.lights[i] === lightOrId || this.lights[i].id === id) {
        this.lights.splice(i, 1);
        this._visibility.delete(id);
      }
    }
  };

  VFX.prototype.clear = function () {
    this.particles.length = 0;
    this.effects.length = 0;
    this.lights.length = 0;
    this._visibility.clear();
  };

  VFX.prototype._normalizeLight = function (source, key, night) {
    if (!source || source.enabled === false) {
      return null;
    }
    var definition = typeof source.light === 'object' ? source.light : {};
    var type = String(source.type || source.kind || '').toLowerCase();
    var isLamp = /lamp|lantern|torch|fire|candle|light|灯|火/.test(type);
    var intensity = finite(definition.intensity, finite(source.intensity, typeof source.light === 'number' ? source.light : isLamp ? 0.85 : 0.55));
    return {
      key: key,
      x: finite(definition.x, finite(source.x, 0)),
      y: finite(definition.y, finite(source.y, 0)),
      radius: Math.max(8, finite(definition.radius, finite(source.radius, finite(source.lightRadius, isLamp ? 190 : 150)))),
      color: definition.color || source.color || (isLamp ? '#ffd39a' : '#b9ead7'),
      intensity: clamp(intensity * (source.nightOnly === false ? 1 : 0.25 + night * 0.75), 0, 2),
      shadow: definition.shadow !== false && source.shadow !== false,
      priority: finite(definition.priority, finite(source.priority, isLamp ? 1.2 : 0.8)),
      rays: definition.rays || source.rays
    };
  };

  VFX.prototype._collectLights = function (night) {
    var game = this.game || {};
    var world = game.world || {};
    var candidates = [];
    var i;
    var light;
    for (i = 0; i < this.lights.length; i += 1) {
      light = this.lights[i];
      if (light.enabled && (!light.nightOnly || night > 0.2)) {
        candidates.push({
          key: light.id,
          x: light.x,
          y: light.y,
          radius: light.radius,
          color: light.color,
          intensity: light.intensity,
          shadow: light.shadow,
          priority: light.priority + 1,
          rays: light.rays
        });
      }
    }
    var worldLights = Array.isArray(world.lights) ? world.lights : Array.isArray(game.lights) ? game.lights : [];
    for (i = 0; i < worldLights.length; i += 1) {
      light = this._normalizeLight(worldLights[i], 'world-light-' + (worldLights[i].id || i), night);
      if (light) {
        candidates.push(light);
      }
    }
    var props = Array.isArray(world.props) ? world.props : [];
    for (i = 0; i < props.length; i += 1) {
      if (props[i].light || props[i].emissive || props[i].glow || /lamp|lantern|torch|fire|candle|灯|火/.test(String(props[i].type || props[i].kind || '').toLowerCase())) {
        light = this._normalizeLight(props[i], 'prop-light-' + (props[i].id || i), night);
        if (light) {
          candidates.push(light);
        }
      }
    }
    for (i = 0; i < this.effects.length; i += 1) {
      var effect = this.effects[i];
      if (!effect.light || effect.kind === 'dash' || effect.kind === 'heixiu') {
        continue;
      }
      var lifeRatio = clamp(effect.life / effect.maxLife, 0, 1);
      candidates.push({
        key: effect.id,
        x: effect.kind === 'metal' ? lerp(effect.x, effect.x2, clamp((1 - lifeRatio) * 1.7, 0, 1)) : effect.x,
        y: effect.kind === 'metal' ? lerp(effect.y, effect.y2, clamp((1 - lifeRatio) * 1.7, 0, 1)) : effect.y,
        radius: effect.radius * (effect.kind === 'teleport' ? 2.5 : 1.7),
        color: effect.color,
        intensity: lifeRatio * effect.intensity * (effect.kind === 'hit' ? 0.65 : 0.48) * (0.5 + night * 0.5),
        shadow: effect.shadow !== false,
        priority: effect.priority + 1,
        rays: null
      });
    }
    if (game.player && this._settings().playerLight !== false && night > 0.12) {
      candidates.push({
        key: 'player-spirit-light',
        x: finite(game.player.x, 0),
        y: finite(game.player.y, 0) - 12,
        radius: game.player.form === 'cat' ? 105 : 145,
        color: '#a9ddd1',
        intensity: night * 0.24,
        shadow: false,
        priority: 0.25,
        rays: null
      });
    }
    var size = this._screenSize();
    var visible = [];
    for (i = 0; i < candidates.length; i += 1) {
      light = candidates[i];
      var screen = this.worldToScreen(light.x, light.y);
      var radius = light.radius * clamp(finite((game.camera || {}).zoom, 1), 0.1, 5);
      light._screen = screen;
      light._distance = Math.pow(screen.x - size.width / 2, 2) + Math.pow(screen.y - size.height / 2, 2);
      if (light.intensity > 0.005 && screen.x + radius >= 0 && screen.x - radius <= size.width && screen.y + radius >= 0 && screen.y - radius <= size.height) {
        visible.push(light);
      }
    }
    visible.sort(function (a, b) {
      return b.priority - a.priority || a._distance - b._distance;
    });
    return visible.slice(0, this._quality().lights);
  };

  VFX.prototype._shouldBlockLight = function (obstacle) {
    if (!obstacle || obstacle.blocksLight === false || obstacle.opaque === false || obstacle.lightBlocker === false || obstacle.hidden === true) {
      return false;
    }
    var type = String(obstacle.type || obstacle.kind || obstacle.material || '').toLowerCase();
    return !/water|river|lake|sea|ocean|pond|水面|河流|海洋/.test(type);
  };

  VFX.prototype._pushSegment = function (segments, x1, y1, x2, y2) {
    if (Math.abs(x2 - x1) + Math.abs(y2 - y1) < 0.001) {
      return;
    }
    segments.push({
      x1: x1, y1: y1, x2: x2, y2: y2,
      minX: Math.min(x1, x2), maxX: Math.max(x1, x2),
      minY: Math.min(y1, y2), maxY: Math.max(y1, y2)
    });
  };

  VFX.prototype._readObstacles = function () {
    var world = this.game && this.game.world ? this.game.world : {};
    var source = Array.isArray(world.lightBlockers) && world.lightBlockers.length ? world.lightBlockers : Array.isArray(world.obstacles) ? world.obstacles : [];
    var cache = this._occluders;
    if (cache.source === source && cache.length === source.length && this.time - cache.time < 0.8) {
      return cache.segments;
    }
    var segments = [];
    for (var i = 0; i < source.length; i += 1) {
      var obstacle = source[i];
      if (!this._shouldBlockLight(obstacle)) {
        continue;
      }
      var points = obstacle.points || obstacle.vertices;
      if (Array.isArray(points) && points.length >= 2) {
        for (var p = 0; p < points.length; p += 1) {
          var a = points[p];
          var b = points[(p + 1) % points.length];
          var relative = obstacle.pointsRelative === true || obstacle.relative === true;
          var ax = finite(a.x, a[0]) + (relative ? finite(obstacle.x, 0) : 0);
          var ay = finite(a.y, a[1]) + (relative ? finite(obstacle.y, 0) : 0);
          var bx = finite(b.x, b[0]) + (relative ? finite(obstacle.x, 0) : 0);
          var by = finite(b.y, b[1]) + (relative ? finite(obstacle.y, 0) : 0);
          if (p < points.length - 1 || obstacle.closed !== false) {
            this._pushSegment(segments, ax, ay, bx, by);
          }
        }
        continue;
      }
      if (isFinite(obstacle.x1) && isFinite(obstacle.y1) && isFinite(obstacle.x2) && isFinite(obstacle.y2)) {
        this._pushSegment(segments, obstacle.x1, obstacle.y1, obstacle.x2, obstacle.y2);
        continue;
      }
      var radius = finite(obstacle.radius, finite(obstacle.r, NaN));
      var shape = String(obstacle.shape || obstacle.type || '').toLowerCase();
      if (isFinite(radius) && (shape.indexOf('circle') >= 0 || shape.indexOf('round') >= 0 || !isFinite(obstacle.width) && !isFinite(obstacle.w))) {
        var sides = radius > 60 ? 12 : 8;
        var cx = finite(obstacle.cx, finite(obstacle.x, 0));
        var cy = finite(obstacle.cy, finite(obstacle.y, 0));
        for (var s = 0; s < sides; s += 1) {
          var angleA = s / sides * TAU;
          var angleB = (s + 1) / sides * TAU;
          this._pushSegment(segments, cx + Math.cos(angleA) * radius, cy + Math.sin(angleA) * radius, cx + Math.cos(angleB) * radius, cy + Math.sin(angleB) * radius);
        }
        continue;
      }
      var left = finite(obstacle.left, finite(obstacle.minX, NaN));
      var top = finite(obstacle.top, finite(obstacle.minY, NaN));
      var right = finite(obstacle.right, finite(obstacle.maxX, NaN));
      var bottom = finite(obstacle.bottom, finite(obstacle.maxY, NaN));
      if (!isFinite(left) || !isFinite(top) || !isFinite(right) || !isFinite(bottom)) {
        var width = finite(obstacle.width, finite(obstacle.w, NaN));
        var height = finite(obstacle.height, finite(obstacle.h, NaN));
        if (!isFinite(width) || !isFinite(height)) {
          continue;
        }
        if (isFinite(obstacle.cx) && isFinite(obstacle.cy)) {
          left = obstacle.cx - width / 2;
          top = obstacle.cy - height / 2;
        } else if (shape === 'rect' || shape === 'rectangle' || obstacle.centered === true || obstacle.anchor === 'center') {
          left = finite(obstacle.x, 0) - width / 2;
          top = finite(obstacle.y, 0) - height / 2;
        } else {
          left = finite(obstacle.x, 0);
          top = finite(obstacle.y, 0);
        }
        right = left + width;
        bottom = top + height;
      }
      this._pushSegment(segments, left, top, right, top);
      this._pushSegment(segments, right, top, right, bottom);
      this._pushSegment(segments, right, bottom, left, bottom);
      this._pushSegment(segments, left, bottom, left, top);
    }
    cache.source = source;
    cache.length = source.length;
    cache.time = this.time;
    cache.revision += 1;
    cache.segments = segments;
    this._visibility.clear();
    return segments;
  };

  VFX.prototype._segmentsNearLight = function (light) {
    var all = this._readObstacles();
    var quality = this._quality();
    var nearby = [];
    var radius = light.radius;
    for (var i = 0; i < all.length; i += 1) {
      var segment = all[i];
      if (segment.maxX < light.x - radius || segment.minX > light.x + radius || segment.maxY < light.y - radius || segment.minY > light.y + radius) {
        continue;
      }
      var mx = (segment.minX + segment.maxX) / 2 - light.x;
      var my = (segment.minY + segment.maxY) / 2 - light.y;
      nearby.push({ segment: segment, distance: mx * mx + my * my });
    }
    nearby.sort(function (a, b) { return a.distance - b.distance; });
    var result = [];
    for (i = 0; i < Math.min(quality.segments, nearby.length); i += 1) {
      result.push(nearby[i].segment);
    }
    return result;
  };

  VFX.prototype._raycastEnabled = function () {
    var settings = this._settings();
    return this.shadowsEnabled && settings.shadows !== false && settings.raycast !== false && settings.lightShadows !== false && settings.lighting !== 'simple';
  };

  VFX.prototype._visibilityPolygon = function (light) {
    if (!this._raycastEnabled() || light.shadow === false) {
      return null;
    }
    var quality = this._quality();
    var rays = clamp(Math.round(finite(light.rays, quality.rays)), 8, 72);
    var revision = this._occluders.revision;
    var cached = this._visibility.get(light.key);
    if (cached && cached.x === light.x && cached.y === light.y && cached.radius === light.radius && cached.rays === rays && cached.revision === revision && this.time - cached.time < quality.refresh) {
      return cached.points;
    }
    var segments = this._segmentsNearLight(light);
    revision = this._occluders.revision;
    cached = this._visibility.get(light.key);
    if (cached && cached.x === light.x && cached.y === light.y && cached.radius === light.radius && cached.rays === rays && cached.revision === revision && this.time - cached.time < quality.refresh) {
      return cached.points;
    }
    var points = [];
    for (var i = 0; i < rays; i += 1) {
      var angle = i / rays * TAU;
      var dx = Math.cos(angle);
      var dy = Math.sin(angle);
      var nearest = light.radius;
      for (var j = 0; j < segments.length; j += 1) {
        var segment = segments[j];
        var sx = segment.x2 - segment.x1;
        var sy = segment.y2 - segment.y1;
        var denominator = dx * sy - dy * sx;
        if (Math.abs(denominator) < 0.000001) {
          continue;
        }
        var qx = segment.x1 - light.x;
        var qy = segment.y1 - light.y;
        var distance = (qx * sy - qy * sx) / denominator;
        var along = (qx * dy - qy * dx) / denominator;
        if (distance > 0.01 && distance < nearest && along >= 0 && along <= 1) {
          nearest = distance;
        }
      }
      points.push(light.x + dx * nearest, light.y + dy * nearest);
    }
    this._visibility.set(light.key, { x: light.x, y: light.y, radius: light.radius, rays: rays, revision: revision, time: this.time, points: points });
    if (this._visibility.size > 48) {
      var oldestKey = this._visibility.keys().next().value;
      this._visibility.delete(oldestKey);
    }
    return points;
  };

  VFX.prototype._traceVisibility = function (ctx, light, points) {
    var screen = light._screen || this.worldToScreen(light.x, light.y);
    ctx.beginPath();
    if (!points || points.length < 6) {
      ctx.arc(screen.x, screen.y, light.radius * clamp(finite((this.game.camera || {}).zoom, 1), 0.1, 5), 0, TAU);
      return;
    }
    for (var i = 0; i < points.length; i += 2) {
      var point = this.worldToScreen(points[i], points[i + 1]);
      if (i === 0) {
        ctx.moveTo(point.x, point.y);
      } else {
        ctx.lineTo(point.x, point.y);
      }
    }
    ctx.closePath();
  };

  VFX.prototype._ensureLightCanvas = function (width, height, scale) {
    if (!this._lightCanvas && root.document && root.document.createElement) {
      this._lightCanvas = root.document.createElement('canvas');
      this._lightContext = this._lightCanvas.getContext('2d');
    }
    if (!this._lightCanvas || !this._lightContext) {
      return null;
    }
    var pixelWidth = Math.max(1, Math.round(width * scale));
    var pixelHeight = Math.max(1, Math.round(height * scale));
    if (this._lightCanvas.width !== pixelWidth || this._lightCanvas.height !== pixelHeight) {
      this._lightCanvas.width = pixelWidth;
      this._lightCanvas.height = pixelHeight;
    }
    this._lightScale = pixelWidth / width;
    var ctx = this._lightContext;
    ctx.setTransform(this._lightScale, 0, 0, this._lightScale, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.clearRect(0, 0, width, height);
    return ctx;
  };

  VFX.prototype._drawStars = function (ctx, width, height, night) {
    if (night < 0.2) {
      return;
    }
    var quality = this._quality();
    var reduced = this._reduced();
    ctx.save();
    ctx.globalCompositeOperation = 'screen';
    for (var i = 0; i < Math.min(quality.stars, this.stars.length); i += 1) {
      var star = this.stars[i];
      var twinkle = reduced ? 0.65 : 0.55 + Math.sin(this.time * 1.25 + star.phase) * 0.25;
      var alpha = night * twinkle * (1 - star.y / 0.8);
      var x = star.x * width;
      var y = star.y * height;
      ctx.globalAlpha = clamp(alpha, 0, 0.75);
      ctx.fillStyle = star.color;
      ctx.beginPath();
      ctx.arc(x, y, star.size, 0, TAU);
      ctx.fill();
      if (star.size > 1.35) {
        ctx.strokeStyle = star.color;
        ctx.lineWidth = 0.55;
        ctx.beginPath();
        ctx.moveTo(x - star.size * 2.2, y);
        ctx.lineTo(x + star.size * 2.2, y);
        ctx.moveTo(x, y - star.size * 2.2);
        ctx.lineTo(x, y + star.size * 2.2);
        ctx.stroke();
      }
    }
    ctx.restore();
  };

  VFX.prototype.drawLighting = function (ctx) {
    if (!ctx || this._settings().lighting === false) {
      return;
    }
    var size = this._screenSize();
    var width = size.width;
    var height = size.height;
    var daylight = this._daylight();
    var night = daylight.night;
    var quality = this._quality();
    var lights = this._collectLights(night);
    var polygons = [];
    var i;
    for (i = 0; i < lights.length; i += 1) {
      polygons.push(this._visibilityPolygon(lights[i]));
    }
    ctx.save();
    if (daylight.twilight > 0.01) {
      ctx.globalCompositeOperation = 'source-over';
      ctx.fillStyle = 'rgba(242,145,112,' + (daylight.twilight * 0.12).toFixed(3) + ')';
      ctx.fillRect(0, 0, width, height);
    }
    if (daylight.day > 0.05) {
      ctx.fillStyle = 'rgba(255,246,213,' + (daylight.day * 0.025).toFixed(3) + ')';
      ctx.fillRect(0, 0, width, height);
    }
    if (night > 0.015) {
      var mask = this._ensureLightCanvas(width, height, quality.lightScale);
      if (mask) {
        mask.fillStyle = 'rgba(16,24,52,' + (night * 0.61).toFixed(3) + ')';
        mask.fillRect(0, 0, width, height);
        mask.globalCompositeOperation = 'destination-out';
        for (i = 0; i < lights.length; i += 1) {
          var light = lights[i];
          var screen = light._screen;
          var radius = light.radius * clamp(finite((this.game.camera || {}).zoom, 1), 0.1, 5);
          mask.save();
          this._traceVisibility(mask, light, polygons[i]);
          mask.clip();
          var cutout = mask.createRadialGradient(screen.x, screen.y, 0, screen.x, screen.y, radius);
          cutout.addColorStop(0, 'rgba(0,0,0,' + clamp(light.intensity * 1.2, 0, 0.94) + ')');
          cutout.addColorStop(0.38, 'rgba(0,0,0,' + clamp(light.intensity * 0.75, 0, 0.75) + ')');
          cutout.addColorStop(1, 'rgba(0,0,0,0)');
          mask.fillStyle = cutout;
          mask.fillRect(screen.x - radius, screen.y - radius, radius * 2, radius * 2);
          mask.restore();
        }
        mask.globalCompositeOperation = 'source-over';
        ctx.globalCompositeOperation = 'source-over';
        ctx.globalAlpha = 1;
        ctx.drawImage(this._lightCanvas, 0, 0, this._lightCanvas.width, this._lightCanvas.height, 0, 0, width, height);
      } else {
        ctx.fillStyle = 'rgba(16,24,52,' + (night * 0.55).toFixed(3) + ')';
        ctx.fillRect(0, 0, width, height);
      }
    }
    this._drawStars(ctx, width, height, night);
    ctx.globalCompositeOperation = 'screen';
    for (i = 0; i < lights.length; i += 1) {
      var item = lights[i];
      var center = item._screen;
      var glowRadius = item.radius * clamp(finite((this.game.camera || {}).zoom, 1), 0.1, 5);
      ctx.save();
      this._traceVisibility(ctx, item, polygons[i]);
      ctx.clip();
      var glow = ctx.createRadialGradient(center.x, center.y, 0, center.x, center.y, glowRadius);
      glow.addColorStop(0, colorAlpha(item.color, clamp(item.intensity * 0.24, 0, 0.34)));
      glow.addColorStop(0.45, colorAlpha(item.color, clamp(item.intensity * 0.08, 0, 0.14)));
      glow.addColorStop(1, colorAlpha(item.color, 0));
      ctx.globalAlpha = 1;
      ctx.fillStyle = glow;
      ctx.fillRect(center.x - glowRadius, center.y - glowRadius, glowRadius * 2, glowRadius * 2);
      ctx.restore();
    }
    ctx.restore();
  };

  LXH.VFX = VFX;
})(typeof window !== 'undefined' ? window : globalThis);
