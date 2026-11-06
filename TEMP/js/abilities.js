(function (root) {
    'use strict';

    var LXH = root.LXH = root.LXH || {};
    var TAU = Math.PI * 2;
    var PHASE_NAMES = { prepare: '预备', active: '发生', recover: '恢复' };
    var DEFINITIONS = {
        teleport: { label: '空间转送', energy: 26, cooldown: 2.4, prepare: 0.22, active: 0.06, recover: 0.3, range: 440 },
        metal: { label: '御金', energy: 20, cooldown: 1.35, prepare: 0.42, active: 0.1, recover: 0.26, range: 620 },
        dash: { label: '短距冲刺', energy: 12, cooldown: 0.9, prepare: 0.07, active: 0.17, recover: 0.18, range: 154 },
        heixiu: { label: '嘿咻分体', energy: 8, cooldown: 0.75, prepare: 0.12, active: 0.08, recover: 0.2, range: 560 },
        form: { label: '形态切换', energy: 4, cooldown: 0.7, prepare: 0.16, active: 0.08, recover: 0.22, range: 0 }
    };

    function isFiniteNumber(value) {
        return typeof value === 'number' && isFinite(value);
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function distance(x1, y1, x2, y2) {
        var dx = x2 - x1;
        var dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    function normalized(x, y, fallback) {
        var length = Math.sqrt(x * x + y * y);
        if (length < 0.0001) {
            return fallback || { x: 1, y: 0 };
        }
        return { x: x / length, y: y / length };
    }

    function roundedRect(ctx, x, y, width, height, radius) {
        var r = Math.min(radius, width * 0.5, height * 0.5);
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + width - r, y);
        ctx.arcTo(x + width, y, x + width, y + r, r);
        ctx.lineTo(x + width, y + height - r);
        ctx.arcTo(x + width, y + height, x + width - r, y + height, r);
        ctx.lineTo(x + r, y + height);
        ctx.arcTo(x, y + height, x, y + height - r, r);
        ctx.lineTo(x, y + r);
        ctx.arcTo(x, y, x + r, y, r);
        ctx.closePath();
    }

    class Abilities {
        constructor(game) {
            this.game = game;
            this.definitions = DEFINITIONS;
            this.cooldowns = { teleport: 0, metal: 0, dash: 0, heixiu: 0, form: 0 };
            this.action = null;
            this.target = null;
            this.fragments = [];
            this.spirits = [];
            this.effects = [];
            this.feedback = { text: '', time: 0, duration: 0 };
            this.aim = { x: 1, y: 0 };
            this.time = 0;
            this.baseRadius = 0;
            this.fragmentSerial = 0;
            this.spiritSerial = 0;
            this.volleySerial = 0;
            this.volleyHits = Object.create(null);
            this.randomSeed = 0x4c584831;
            this.dashTrailClock = 0;
        }

        use(name, screenX, screenY) {
            if (name === 'form') {
                return this.toggleForm();
            }
            if (!DEFINITIONS[name] || name === 'form') {
                return this.fail('没有这项技能');
            }
            return this.start(name, screenX, screenY);
        }

        toggleForm() {
            return this.start('form');
        }

        start(name, screenX, screenY) {
            var player = this.game && this.game.player;
            var definition = DEFINITIONS[name];
            if (!player || !definition) {
                return false;
            }
            if (this.game.paused) {
                return this.fail('暂停时无法使用技能');
            }
            if (isFiniteNumber(player.health) && player.health <= 0) {
                return this.fail('现在无法使用技能');
            }
            if (this.action) {
                return this.fail(PHASE_NAMES[this.action.phase] + '尚未结束');
            }
            var remaining = Math.max(0, this.cooldowns[name] || 0);
            if (remaining > 0) {
                return this.fail(definition.label + '还需 ' + remaining.toFixed(1) + ' 秒');
            }
            var context = this.makeContext(name, screenX, screenY);
            if (!context) {
                return false;
            }
            var maxEnergy = isFiniteNumber(player.maxEnergy) ? player.maxEnergy : 100;
            if (!isFiniteNumber(player.energy)) {
                player.energy = maxEnergy;
            }
            var cost = isFiniteNumber(context.cost) ? context.cost : definition.energy;
            if (player.energy < cost) {
                return this.fail('灵力不足，需要 ' + cost + ' 点');
            }
            player.energy = clamp(player.energy - cost, 0, maxEnergy);
            this.cooldowns[name] = definition.cooldown;
            this.action = {
                name: name,
                phase: 'prepare',
                phaseTime: 0,
                totalTime: 0,
                cost: cost,
                context: context,
                anchorX: player.x,
                anchorY: player.y
            };
            this.target = name === 'teleport' ? {
                x: context.target.x,
                y: context.target.y,
                valid: true
            } : null;
            if (name === 'metal') {
                this.prepareMetal(this.action);
            }
            player.vx = 0;
            player.vy = 0;
            player.abilityLock = true;
            this.syncActor();
            this.play(name);
            if (name === 'teleport') {
                this.emit('teleportPrepare', player.x, player.y, { radius: 28 });
            } else if (name === 'form') {
                this.emit('form', player.x, player.y, { form: context.nextForm });
            }
            return true;
        }

        makeContext(name, screenX, screenY) {
            var player = this.game.player;
            var hasPoint = isFiniteNumber(screenX) && isFiniteNumber(screenY);
            var point = hasPoint ? this.screenToWorld(screenX, screenY) : null;
            var direction;
            if (name === 'teleport') {
                direction = point ? normalized(point.x - player.x, point.y - player.y, this.facingDirection()) : this.facingDirection();
                var target = point || {
                    x: player.x + direction.x * Math.min(240, DEFINITIONS.teleport.range),
                    y: player.y + direction.y * Math.min(240, DEFINITIONS.teleport.range)
                };
                var length = distance(player.x, player.y, target.x, target.y);
                if (length < 28) {
                    return this.fail('请选择更远一些的落点');
                }
                if (length > DEFINITIONS.teleport.range) {
                    return this.fail('落点超出转送范围（最多 ' + DEFINITIONS.teleport.range + '）');
                }
                if (!this.canOccupy(target.x, target.y, this.playerRadius())) {
                    return this.fail('落点被地形挡住了');
                }
                if (!this.hasClearPath(player.x, player.y, target.x, target.y, this.playerRadius())) {
                    return this.fail('转送路径被墙壁或水域阻断');
                }
                this.setFacing(direction);
                return { target: { x: target.x, y: target.y }, direction: direction };
            }
            if (name === 'metal' || name === 'dash') {
                direction = point ? normalized(point.x - player.x, point.y - player.y, this.facingDirection()) : this.facingDirection();
                this.setFacing(direction);
                return { direction: direction, target: point };
            }
            if (name === 'heixiu') {
                if (!this.spirits.length) {
                    return { intent: 'summon', cost: DEFINITIONS.heixiu.energy };
                }
                var spiritTarget = this.findSpiritTarget(point, hasPoint);
                if (spiritTarget) {
                    return { intent: 'command', target: spiritTarget, cost: 4 };
                }
                if (hasPoint) {
                    return this.fail('这里没有嘿咻能互动的目标');
                }
                return { intent: 'recall', cost: 0 };
            }
            if (name === 'form') {
                var nextForm = player.form === 'human' ? 'cat' : 'human';
                var nextRadius = this.formRadius(nextForm);
                if (!this.canOccupy(player.x, player.y, nextRadius)) {
                    return this.fail('这里空间不足，无法切换形态');
                }
                return { nextForm: nextForm, nextRadius: nextRadius };
            }
            return null;
        }

        update(dt) {
            if (!isFiniteNumber(dt) || dt <= 0) {
                return;
            }
            var remaining = Math.min(dt, 1);
            while (remaining > 0.000001) {
                var step = Math.min(remaining, 1 / 30);
                this.step(step);
                remaining -= step;
            }
        }

        step(dt) {
            this.time += dt;
            var name;
            for (name in this.cooldowns) {
                if (Object.prototype.hasOwnProperty.call(this.cooldowns, name)) {
                    this.cooldowns[name] = Math.max(0, this.cooldowns[name] - dt);
                }
            }
            this.feedback.time = Math.max(0, this.feedback.time - dt);
            for (var i = this.effects.length - 1; i >= 0; i--) {
                this.effects[i].life -= dt;
                if (this.effects[i].life <= 0) {
                    this.effects.splice(i, 1);
                }
            }
            if (this.action) {
                this.updateAction(dt);
            }
            this.updateFragments(dt);
            this.updateSpirits(dt);
        }

        updateAction(dt) {
            var action = this.action;
            var player = this.game.player;
            var definition = DEFINITIONS[action.name];
            action.phaseTime += dt;
            action.totalTime += dt;
            if (this.isMovementLocked() && (action.name !== 'dash' || action.phase === 'prepare')) {
                player.x = action.anchorX;
                player.y = action.anchorY;
                player.vx = 0;
                player.vy = 0;
            }
            if (action.phase === 'prepare' && action.phaseTime >= definition.prepare) {
                action.phaseTime -= definition.prepare;
                action.phase = 'active';
                this.enterActivePhase(action);
                if (this.action !== action) {
                    return;
                }
            } else if (action.phase === 'active' && action.name === 'dash') {
                this.moveDash(action, dt);
            }
            if (action.phase === 'active' && action.phaseTime >= definition.active) {
                action.phaseTime -= definition.active;
                action.phase = 'recover';
                player.vx = 0;
                player.vy = 0;
                player.abilityLock = false;
                this.syncActor();
            } else if (action.phase === 'recover' && action.phaseTime >= definition.recover) {
                this.finishAction();
                return;
            }
            this.syncActor();
        }

        enterActivePhase(action) {
            var player = this.game.player;
            var context = action.context;
            if (action.name === 'teleport') {
                if (!this.canOccupy(context.target.x, context.target.y, this.playerRadius()) ||
                    !this.hasClearPath(player.x, player.y, context.target.x, context.target.y, this.playerRadius())) {
                    this.cancelAction('落点发生变化，转送已取消', true);
                    return;
                }
                this.addEffect('teleport', player.x, player.y, 0.48, context.direction);
                player.x = context.target.x;
                player.y = context.target.y;
                action.anchorX = player.x;
                action.anchorY = player.y;
                this.addEffect('teleport', player.x, player.y, 0.55, context.direction);
                this.emit('teleport', player.x, player.y, { radius: 60 });
                this.play('teleport');
            } else if (action.name === 'metal') {
                this.releaseMetal(action);
            } else if (action.name === 'dash') {
                this.dashTrailClock = 0;
                this.addEffect('dash', player.x, player.y, 0.24, context.direction);
                this.play('dash');
            } else if (action.name === 'heixiu') {
                this.activateHeixiu(action);
                if (this.action !== action) {
                    return;
                }
            } else if (action.name === 'form') {
                player.form = context.nextForm;
                player.radius = context.nextRadius;
                this.addEffect('form', player.x, player.y, 0.5, this.aim);
                this.emit('form', player.x, player.y, { form: player.form });
                this.notify(player.form === 'cat' ? '已切换为猫形态' : '已切换为人形态');
                this.play('form');
            }
            this.syncActor();
        }

        finishAction() {
            var player = this.game && this.game.player;
            if (player) {
                player.abilityLock = false;
                player.abilityPhase = '';
                if (player.state === 'cast' || player.state === 'recover' || DEFINITIONS[player.state]) {
                    player.state = 'idle';
                }
            }
            this.action = null;
            this.target = null;
        }

        cancelAction(message, refund) {
            var action = this.action;
            var player = this.game.player;
            if (action && action.name === 'metal') {
                for (var i = 0; i < this.fragments.length; i++) {
                    if (this.fragments[i].mode === 'orbit') {
                        this.fragments[i].mode = 'loose';
                        this.fragments[i].life = 14;
                    }
                }
            }
            if (action && refund) {
                player.energy = clamp(player.energy + action.cost, 0, isFiniteNumber(player.maxEnergy) ? player.maxEnergy : 100);
                this.cooldowns[action.name] = 0;
            }
            this.finishAction();
            return this.fail(message);
        }

        isMovementLocked() {
            return !!(this.action && this.action.name !== 'heixiu' && this.action.phase !== 'recover');
        }

        syncActor() {
            var action = this.action;
            var player = this.game && this.game.player;
            if (!action || !player) {
                return;
            }
            player.abilityPhase = action.name + '.' + action.phase;
            player.abilityLock = this.isMovementLocked();
            if (!isFiniteNumber(player.health) || player.health > 0) {
                player.state = action.phase === 'prepare' ? 'cast' : action.phase === 'active' ? action.name : 'recover';
            }
        }

        moveDash(action, dt) {
            var player = this.game.player;
            var definition = DEFINITIONS.dash;
            var direction = action.context.direction;
            var speed = definition.range / definition.active;
            var remaining = speed * dt;
            while (remaining > 0.0001) {
                var amount = Math.min(7, remaining);
                var dx = direction.x * amount;
                var dy = direction.y * amount;
                var oldX = player.x;
                var oldY = player.y;
                this.resolveMovement(player, dx, dy);
                var moved = distance(oldX, oldY, player.x, player.y);
                if (moved < amount * 0.15) {
                    action.phaseTime = definition.active;
                    this.addEffect('impact', player.x, player.y, 0.2, direction);
                    break;
                }
                remaining -= amount;
            }
            player.vx = direction.x * speed;
            player.vy = direction.y * speed;
            this.dashTrailClock -= dt;
            if (this.dashTrailClock <= 0) {
                this.dashTrailClock = this.game.settings && this.game.settings.reducedMotion ? 0.09 : 0.045;
                this.addEffect('dash', player.x, player.y, 0.22, direction);
            }
        }

        prepareMetal(action) {
            var player = this.game.player;
            var available = [];
            var i;
            for (i = 0; i < this.fragments.length; i++) {
                var fragment = this.fragments[i];
                if (fragment.mode === 'loose' && distance(player.x, player.y, fragment.x, fragment.y) <= 290) {
                    available.push(fragment);
                }
            }
            available.sort(function (a, b) {
                return distance(player.x, player.y, a.x, a.y) - distance(player.x, player.y, b.x, b.y);
            });
            action.context.fragmentIds = [];
            for (i = 0; i < 7; i++) {
                var piece = available[i];
                if (!piece) {
                    var angle = this.random() * TAU;
                    var radius = 85 + this.random() * 125;
                    piece = this.createFragment(player.x + Math.cos(angle) * radius, player.y + Math.sin(angle) * radius, 'orbit');
                }
                piece.mode = 'orbit';
                piece.life = Infinity;
                piece.orbitIndex = i;
                piece.volley = this.volleySerial + 1;
                action.context.fragmentIds.push(piece.id);
            }
        }

        releaseMetal(action) {
            var player = this.game.player;
            var ids = action.context.fragmentIds || [];
            var direction = action.context.direction;
            this.volleySerial += 1;
            this.volleyHits = Object.create(null);
            var released = 0;
            for (var i = 0; i < ids.length; i++) {
                var fragment = this.fragmentById(ids[i]);
                if (!fragment) {
                    continue;
                }
                var spread = (i - (ids.length - 1) * 0.5) * 0.035;
                var cos = Math.cos(spread);
                var sin = Math.sin(spread);
                var dx = direction.x * cos - direction.y * sin;
                var dy = direction.x * sin + direction.y * cos;
                var speed = 735 + this.random() * 75;
                fragment.mode = 'flying';
                fragment.x = player.x + dx * (28 + i * 2);
                fragment.y = player.y + dy * (28 + i * 2);
                fragment.vx = dx * speed;
                fragment.vy = dy * speed;
                fragment.life = 0.86;
                fragment.volley = this.volleySerial;
                fragment.damage = 22;
                released += 1;
            }
            if (released) {
                this.emit('metal', player.x, player.y, { direction: direction, count: released });
                this.play('metalRelease');
            }
        }

        createFragment(x, y, mode) {
            var fragment = {
                id: 'metal-' + (++this.fragmentSerial),
                x: x,
                y: y,
                vx: 0,
                vy: 0,
                radius: 5,
                mode: mode,
                life: mode === 'loose' ? 16 : Infinity,
                angle: this.random() * TAU,
                spin: (this.random() - 0.5) * 8,
                orbitIndex: 0,
                volley: 0,
                damage: 22
            };
            this.fragments.push(fragment);
            return fragment;
        }

        fragmentById(id) {
            for (var i = 0; i < this.fragments.length; i++) {
                if (this.fragments[i].id === id) {
                    return this.fragments[i];
                }
            }
            return null;
        }

        updateFragments(dt) {
            var player = this.game.player;
            for (var i = this.fragments.length - 1; i >= 0; i--) {
                var fragment = this.fragments[i];
                fragment.angle += fragment.spin * dt;
                if (fragment.mode === 'orbit') {
                    if (!this.action || this.action.name !== 'metal' || this.action.phase !== 'prepare') {
                        fragment.mode = 'loose';
                        fragment.life = 14;
                    } else {
                        var orbitAngle = this.time * 3.6 + fragment.orbitIndex * TAU / 7;
                        var orbitRadius = 38 + (fragment.orbitIndex % 3) * 7;
                        var targetX = player.x + Math.cos(orbitAngle) * orbitRadius;
                        var targetY = player.y + Math.sin(orbitAngle) * orbitRadius - 12;
                        var blend = 1 - Math.exp(-dt * 13);
                        fragment.x += (targetX - fragment.x) * blend;
                        fragment.y += (targetY - fragment.y) * blend;
                    }
                }
                if (fragment.mode === 'flying') {
                    this.updateFlyingFragment(fragment, dt);
                } else if (fragment.mode === 'loose') {
                    fragment.life -= dt;
                }
                if (fragment.life <= 0) {
                    this.fragments.splice(i, 1);
                }
            }
            if (this.fragments.length > 48) {
                this.fragments.sort(function (a, b) {
                    var aPriority = a.mode === 'loose' ? 0 : 1;
                    var bPriority = b.mode === 'loose' ? 0 : 1;
                    return aPriority - bPriority || a.life - b.life;
                });
                this.fragments = this.fragments.slice(Math.max(0, this.fragments.length - 48));
            }
        }

        updateFlyingFragment(fragment, dt) {
            var speed = Math.sqrt(fragment.vx * fragment.vx + fragment.vy * fragment.vy);
            var steps = Math.max(1, Math.ceil(speed * dt / 10));
            var step = dt / steps;
            fragment.life -= dt;
            for (var i = 0; i < steps; i++) {
                var oldX = fragment.x;
                var oldY = fragment.y;
                fragment.x += fragment.vx * step;
                fragment.y += fragment.vy * step;
                if (!this.canOccupy(fragment.x, fragment.y, 2)) {
                    fragment.x = oldX;
                    fragment.y = oldY;
                    this.settleFragment(fragment);
                    return;
                }
                var enemies = Array.isArray(this.game.enemies) ? this.game.enemies : [];
                for (var j = 0; j < enemies.length; j++) {
                    var enemy = enemies[j];
                    if (!enemy || enemy.active === false || enemy.defeated || (isFiniteNumber(enemy.health) && enemy.health <= 0)) {
                        continue;
                    }
                    var key = fragment.volley + ':' + (enemy.id != null ? enemy.id : j);
                    if (this.volleyHits[key]) {
                        continue;
                    }
                    var radius = (isFiniteNumber(enemy.radius) ? enemy.radius : 18) + fragment.radius;
                    if (distance(fragment.x, fragment.y, enemy.x, enemy.y) <= radius) {
                        this.volleyHits[key] = true;
                        this.hitEnemyWithMetal(enemy, fragment);
                        this.settleFragment(fragment);
                        return;
                    }
                }
            }
            if (fragment.life <= 0) {
                this.settleFragment(fragment);
            }
        }

        settleFragment(fragment) {
            fragment.mode = 'loose';
            fragment.life = 16;
            fragment.vx = 0;
            fragment.vy = 0;
        }

        hitEnemyWithMetal(enemy, fragment) {
            var player = this.game.player;
            var direction = normalized(fragment.vx, fragment.vy, this.aim);
            var source = {
                type: 'metal',
                ability: 'metal',
                player: player,
                direction: direction,
                fragmentId: fragment.id
            };
            if (typeof enemy.takeDamage === 'function') {
                enemy.takeDamage(fragment.damage, source);
            }
            if (typeof enemy.calm === 'function') {
                enemy.calm(0.25, source);
            }
            if (typeof enemy.stun === 'function') {
                enemy.stun(0.65, source);
            } else {
                if (isFiniteNumber(enemy.stun)) {
                    enemy.stun = Math.max(enemy.stun, 0.65);
                }
                enemy.stunTime = Math.max(isFiniteNumber(enemy.stunTime) ? enemy.stunTime : 0, 0.65);
                if (isFiniteNumber(enemy.stunned)) {
                    enemy.stunned = Math.max(enemy.stunned, 0.65);
                }
            }
            if (isFiniteNumber(enemy.vx)) {
                enemy.vx += direction.x * 120;
            }
            if (isFiniteNumber(enemy.vy)) {
                enemy.vy += direction.y * 120;
            }
            this.addEffect('metalHit', enemy.x, enemy.y, 0.3, direction);
            this.emit('metalHit', enemy.x, enemy.y, { target: enemy, direction: direction });
            this.play('metalHit');
        }

        activateHeixiu(action) {
            var context = action.context;
            if (context.intent === 'summon') {
                this.summonSpirits();
                this.notify('嘿咻分体出发，会跟随小黑');
            } else if (context.intent === 'recall') {
                for (var i = 0; i < this.spirits.length; i++) {
                    this.spirits[i].state = 'return';
                    this.spirits[i].target = null;
                }
                this.notify('嘿咻回到小黑身边');
            } else if (context.intent === 'command') {
                var spirit = null;
                for (var j = 0; j < this.spirits.length; j++) {
                    if (this.spirits[j].state === 'follow') {
                        spirit = this.spirits[j];
                        break;
                    }
                }
                if (!spirit) {
                    this.cancelAction('嘿咻都在忙，请稍等', true);
                    return;
                }
                spirit.state = 'seek';
                spirit.target = context.target;
                spirit.timer = 0;
                this.notify('嘿咻去查看' + (context.target.name || '目标'));
            }
            this.addEffect('heixiu', this.game.player.x, this.game.player.y, 0.35, this.aim);
            this.emit('heixiu', this.game.player.x, this.game.player.y, { intent: context.intent });
            this.play('heixiu');
        }

        summonSpirits() {
            var player = this.game.player;
            for (var i = 0; i < 3; i++) {
                var angle = (i - 1) * 0.8 + Math.PI;
                this.spirits.push({
                    id: 'heixiu-' + (++this.spiritSerial),
                    name: '嘿咻',
                    x: player.x + Math.cos(angle) * 24,
                    y: player.y + Math.sin(angle) * 24,
                    vx: 0,
                    vy: 0,
                    radius: 8,
                    form: 'heixiu',
                    state: 'follow',
                    target: null,
                    timer: 0,
                    index: i,
                    animationPhase: this.random() * TAU,
                    bones: {}
                });
            }
        }

        updateSpirits(dt) {
            var player = this.game.player;
            if (!player) {
                this.spirits.length = 0;
                return;
            }
            for (var i = this.spirits.length - 1; i >= 0; i--) {
                var spirit = this.spirits[i];
                spirit.animationPhase += dt * 4;
                var point = this.spiritDestination(spirit);
                if (spirit.state === 'seek' && point && distance(spirit.x, spirit.y, point.x, point.y) < 25) {
                    spirit.state = 'interact';
                    spirit.timer = 0.72;
                    this.spiritInteract(spirit);
                } else if (spirit.state === 'interact') {
                    spirit.timer -= dt;
                    spirit.vx = 0;
                    spirit.vy = 0;
                    if (spirit.timer <= 0 || !point) {
                        spirit.state = 'follow';
                        spirit.target = null;
                    }
                    continue;
                } else if (spirit.state === 'return' && distance(spirit.x, spirit.y, player.x, player.y) < 25) {
                    this.addEffect('heixiu', spirit.x, spirit.y, 0.25, this.aim);
                    this.spirits.splice(i, 1);
                    continue;
                }
                point = this.spiritDestination(spirit);
                if (!point) {
                    spirit.state = 'follow';
                    spirit.target = null;
                    continue;
                }
                var dist = distance(spirit.x, spirit.y, point.x, point.y);
                if (spirit.state === 'follow' && dist > 360) {
                    spirit.x = point.x;
                    spirit.y = point.y;
                    continue;
                }
                if (dist > 3) {
                    var speed = spirit.state === 'follow' ? clamp(dist * 5, 55, 320) : spirit.state === 'return' ? 390 : 270;
                    var amount = Math.min(dist, speed * dt);
                    var dx = (point.x - spirit.x) / dist * amount;
                    var dy = (point.y - spirit.y) / dist * amount;
                    this.resolveMovement(spirit, dx, dy);
                    spirit.vx = dx / Math.max(dt, 0.0001);
                    spirit.vy = dy / Math.max(dt, 0.0001);
                }
            }
        }

        spiritDestination(spirit) {
            var player = this.game.player;
            if (spirit.state === 'return') {
                return { x: player.x, y: player.y };
            }
            if ((spirit.state === 'seek' || spirit.state === 'interact') && spirit.target) {
                var ref = spirit.target.ref;
                if (!ref || ref.active === false || ref.defeated || (isFiniteNumber(ref.health) && ref.health <= 0)) {
                    return null;
                }
                return { x: ref.x, y: ref.y };
            }
            var direction = this.facingDirection();
            var baseAngle = Math.atan2(direction.y, direction.x) + Math.PI;
            var angle = baseAngle + (spirit.index - 1) * 0.66;
            var radius = 45 + (spirit.index % 2) * 10;
            return {
                x: player.x + Math.cos(angle) * radius,
                y: player.y + Math.sin(angle) * radius + Math.sin(this.time * 4 + spirit.index) * 4
            };
        }

        findSpiritTarget(point, hasPoint) {
            var player = this.game.player;
            var origin = point || player;
            var interaction = null;
            if (this.game.world && typeof this.game.world.nearestInteraction === 'function') {
                interaction = this.game.world.nearestInteraction(origin.x, origin.y, hasPoint ? 92 : 145);
            }
            var best = null;
            var bestDistance = Infinity;
            if (interaction && isFiniteNumber(interaction.x) && isFiniteNumber(interaction.y)) {
                var interactionRange = distance(player.x, player.y, interaction.x, interaction.y);
                if (interactionRange <= DEFINITIONS.heixiu.range) {
                    best = { kind: 'interaction', ref: interaction, name: interaction.name || '线索' };
                    bestDistance = distance(origin.x, origin.y, interaction.x, interaction.y);
                }
            }
            var enemies = Array.isArray(this.game.enemies) ? this.game.enemies : [];
            for (var i = 0; i < enemies.length; i++) {
                var enemy = enemies[i];
                if (!enemy || enemy.active === false || enemy.defeated || (isFiniteNumber(enemy.health) && enemy.health <= 0)) {
                    continue;
                }
                var targetDistance = distance(origin.x, origin.y, enemy.x, enemy.y);
                if (targetDistance < bestDistance && targetDistance <= (hasPoint ? 76 : 125) &&
                    distance(player.x, player.y, enemy.x, enemy.y) <= DEFINITIONS.heixiu.range) {
                    best = { kind: 'enemy', ref: enemy, name: enemy.name || '失控灵体' };
                    bestDistance = targetDistance;
                }
            }
            return best;
        }

        spiritInteract(spirit) {
            var target = spirit.target;
            if (!target || !target.ref) {
                return;
            }
            var ref = target.ref;
            var source = { type: 'heixiu', ability: 'heixiu', spirit: spirit, player: this.game.player };
            if (target.kind === 'enemy') {
                if (typeof ref.distract === 'function') {
                    ref.distract(1.4, source);
                } else {
                    ref.distracted = Math.max(isFiniteNumber(ref.distracted) ? ref.distracted : 0, 1.4);
                    ref.stunTime = Math.max(isFiniteNumber(ref.stunTime) ? ref.stunTime : 0, 0.45);
                }
                this.notify('嘿咻吸引了' + (ref.name || '失控灵体') + '的注意');
            } else {
                var handled = false;
                if (this.game.story && typeof this.game.story.interact === 'function') {
                    handled = this.game.story.interact(ref) === true;
                }
                if (!handled && typeof ref.onInteract === 'function') {
                    ref.onInteract(this.game, source);
                    handled = true;
                }
                if (!handled && typeof ref.interact === 'function') {
                    ref.interact(this.game, source);
                    handled = true;
                }
                this.notify(handled ? '嘿咻完成了互动' : '嘿咻好奇地看了看' + (ref.name || '这里'));
            }
            this.addEffect('heixiu', ref.x, ref.y, 0.4, this.aim);
            this.emit('heixiuInteract', ref.x, ref.y, { target: ref });
            this.play('heixiuInteract');
        }

        screenToWorld(screenX, screenY) {
            var game = this.game;
            var player = game.player || { x: 0, y: 0 };
            var camera = game.camera || {};
            var canvas = game.canvas || {};
            var dpr = isFiniteNumber(game.dpr) && game.dpr > 0 ? game.dpr : 1;
            var width = isFiniteNumber(game.width) ? game.width : isFiniteNumber(canvas.clientWidth) && canvas.clientWidth > 0 ? canvas.clientWidth : (canvas.width || 0) / dpr;
            var height = isFiniteNumber(game.height) ? game.height : isFiniteNumber(canvas.clientHeight) && canvas.clientHeight > 0 ? canvas.clientHeight : (canvas.height || 0) / dpr;
            var zoom = isFiniteNumber(camera.zoom) && camera.zoom > 0 ? camera.zoom : 1;
            var cameraX = isFiniteNumber(camera.x) ? camera.x : player.x;
            var cameraY = isFiniteNumber(camera.y) ? camera.y : player.y;
            return {
                x: cameraX + (screenX - width * 0.5) / zoom,
                y: cameraY + (screenY - height * 0.5) / zoom
            };
        }

        facingDirection() {
            var game = this.game;
            var player = game.player || {};
            var input = game.input;
            if (input && (Math.abs(input.x) > 0.15 || Math.abs(input.y) > 0.15)) {
                return normalized(Number(input.x) || 0, Number(input.y) || 0, this.aim);
            }
            if (isFiniteNumber(player.facingAngle)) {
                return { x: Math.cos(player.facingAngle), y: Math.sin(player.facingAngle) };
            }
            if (typeof player.facing === 'string') {
                var facing = player.facing.toLowerCase();
                var directions = {
                    left: { x: -1, y: 0 }, right: { x: 1, y: 0 }, up: { x: 0, y: -1 }, down: { x: 0, y: 1 },
                    upleft: { x: -Math.SQRT1_2, y: -Math.SQRT1_2 }, upright: { x: Math.SQRT1_2, y: -Math.SQRT1_2 },
                    downleft: { x: -Math.SQRT1_2, y: Math.SQRT1_2 }, downright: { x: Math.SQRT1_2, y: Math.SQRT1_2 }
                };
                if (directions[facing]) {
                    return directions[facing];
                }
            }
            if (isFiniteNumber(player.facing)) {
                if (player.facing === 1 || player.facing === -1) {
                    return { x: player.facing, y: 0 };
                }
                return { x: Math.cos(player.facing), y: Math.sin(player.facing) };
            }
            return this.aim;
        }

        setFacing(direction) {
            var player = this.game.player;
            this.aim = { x: direction.x, y: direction.y };
            if (typeof player.facing === 'string') {
                player.facing = direction.x < 0 ? 'left' : 'right';
            } else if (isFiniteNumber(player.facing) && (player.facing === 1 || player.facing === -1)) {
                player.facing = direction.x < 0 ? -1 : 1;
            } else {
                player.facing = Math.atan2(direction.y, direction.x);
            }
            if (isFiniteNumber(player.facingAngle)) {
                player.facingAngle = Math.atan2(direction.y, direction.x);
            }
        }

        playerRadius() {
            var player = this.game.player;
            var radius = isFiniteNumber(player.radius) ? player.radius : 16;
            if (!this.baseRadius) {
                this.baseRadius = radius;
            }
            return Math.max(6, radius);
        }

        formRadius(form) {
            var base = this.playerRadius();
            return form === 'cat' ? Math.max(8, base * 0.78) : Math.max(base, this.baseRadius);
        }

        canOccupy(x, y, radius) {
            if (!isFiniteNumber(x) || !isFiniteNumber(y)) {
                return false;
            }
            var world = this.game.world;
            var width = world && isFiniteNumber(world.width) ? world.width : 4800;
            var height = world && isFiniteNumber(world.height) ? world.height : 3600;
            var r = Math.max(1, radius || 1);
            if (x < r || y < r || x > width - r || y > height - r) {
                return false;
            }
            if (world && typeof world.isWalkable === 'function') {
                return world.isWalkable(x, y, r) !== false;
            }
            return true;
        }

        hasClearPath(x1, y1, x2, y2, radius) {
            var length = distance(x1, y1, x2, y2);
            var steps = Math.max(1, Math.ceil(length / Math.max(7, radius * 0.55)));
            for (var i = 1; i <= steps; i++) {
                var t = i / steps;
                if (!this.canOccupy(x1 + (x2 - x1) * t, y1 + (y2 - y1) * t, radius)) {
                    return false;
                }
            }
            return true;
        }

        resolveMovement(actor, dx, dy) {
            var world = this.game.world;
            if (world && typeof world.resolveMovement === 'function') {
                var result = world.resolveMovement(actor, dx, dy);
                if (result && isFiniteNumber(result.x) && isFiniteNumber(result.y)) {
                    actor.x = result.x;
                    actor.y = result.y;
                    return;
                }
            }
            if (this.canOccupy(actor.x + dx, actor.y + dy, actor.radius || 8)) {
                actor.x += dx;
                actor.y += dy;
            }
        }

        getCooldown(name) {
            var definition = DEFINITIONS[name];
            var remaining = definition ? Math.max(0, this.cooldowns[name] || 0) : 0;
            return {
                remaining: remaining,
                duration: definition ? definition.cooldown : 0,
                ready: !!definition && remaining <= 0
            };
        }

        addEffect(type, x, y, duration, direction) {
            this.effects.push({
                type: type,
                x: x,
                y: y,
                life: duration,
                duration: duration,
                direction: direction || { x: 1, y: 0 }
            });
            if (this.effects.length > 48) {
                this.effects.splice(0, this.effects.length - 48);
            }
        }

        emit(type, x, y, options) {
            if (this.game.vfx && typeof this.game.vfx.emit === 'function') {
                this.game.vfx.emit(type, x, y, options || {});
            }
        }

        play(name) {
            if (this.game.audio && typeof this.game.audio.play === 'function') {
                this.game.audio.play(name);
            }
        }

        notify(text) {
            if (this.game.ui && typeof this.game.ui.toast === 'function') {
                this.game.ui.toast(text);
            }
        }

        fail(message) {
            this.feedback.text = message;
            this.feedback.time = 1.45;
            this.feedback.duration = 1.45;
            this.notify(message);
            this.play('abilityFail');
            return false;
        }

        drawWorld(ctx) {
            if (!ctx) {
                return;
            }
            ctx.save();
            this.drawTarget(ctx);
            this.drawEffects(ctx);
            this.drawFragments(ctx);
            this.drawSpirits(ctx);
            ctx.restore();
        }

        drawTarget(ctx) {
            if (!this.target || !this.action || this.action.name !== 'teleport') {
                return;
            }
            var player = this.game.player;
            var target = this.target;
            var progress = this.action.phase === 'prepare' ? clamp(this.action.phaseTime / DEFINITIONS.teleport.prepare, 0, 1) : 1;
            ctx.save();
            ctx.strokeStyle = 'rgba(156, 240, 224, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.setLineDash([6, 8]);
            ctx.beginPath();
            ctx.moveTo(player.x, player.y);
            ctx.lineTo(target.x, target.y);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.strokeStyle = '#b8fff0';
            ctx.lineWidth = 2;
            ctx.beginPath();
            ctx.arc(target.x, target.y, 22 + Math.sin(this.time * 8) * 3, -Math.PI / 2, -Math.PI / 2 + TAU * progress);
            ctx.stroke();
            ctx.strokeStyle = 'rgba(112, 215, 205, 0.65)';
            ctx.beginPath();
            ctx.arc(target.x, target.y, 12, 0, TAU);
            ctx.moveTo(target.x - 28, target.y);
            ctx.lineTo(target.x - 16, target.y);
            ctx.moveTo(target.x + 16, target.y);
            ctx.lineTo(target.x + 28, target.y);
            ctx.stroke();
            ctx.restore();
        }

        drawEffects(ctx) {
            for (var i = 0; i < this.effects.length; i++) {
                var effect = this.effects[i];
                var t = 1 - effect.life / effect.duration;
                var alpha = clamp(effect.life / effect.duration, 0, 1);
                var color = effect.type === 'metalHit' ? '210, 231, 244' : effect.type === 'dash' ? '119, 205, 211' : effect.type === 'heixiu' ? '191, 237, 157' : '143, 238, 221';
                ctx.save();
                ctx.translate(effect.x, effect.y);
                if (effect.type === 'dash') {
                    ctx.rotate(Math.atan2(effect.direction.y, effect.direction.x));
                    ctx.fillStyle = 'rgba(' + color + ',' + (alpha * 0.22) + ')';
                    ctx.beginPath();
                    ctx.ellipse(-t * 18, 0, 28 * (1 - t * 0.4), 12 * (1 - t * 0.4), 0, 0, TAU);
                    ctx.fill();
                } else {
                    var radius = 10 + t * (effect.type === 'teleport' ? 62 : 38);
                    ctx.strokeStyle = 'rgba(' + color + ',' + (alpha * 0.8) + ')';
                    ctx.lineWidth = 2.5 * alpha + 0.5;
                    ctx.beginPath();
                    ctx.arc(0, 0, radius, 0, TAU);
                    ctx.stroke();
                    if (effect.type === 'teleport' || effect.type === 'form') {
                        ctx.rotate(t * 2);
                        for (var j = 0; j < 4; j++) {
                            ctx.rotate(Math.PI / 2);
                            ctx.beginPath();
                            ctx.moveTo(radius + 4, 0);
                            ctx.lineTo(radius + 12, 0);
                            ctx.stroke();
                        }
                    }
                }
                ctx.restore();
            }
        }

        drawFragments(ctx) {
            for (var i = 0; i < this.fragments.length; i++) {
                var fragment = this.fragments[i];
                ctx.save();
                ctx.translate(fragment.x, fragment.y);
                ctx.rotate(fragment.angle);
                if (fragment.mode === 'flying') {
                    ctx.strokeStyle = 'rgba(189, 225, 237, 0.38)';
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.moveTo(-fragment.vx * 0.035, -fragment.vy * 0.035);
                    ctx.lineTo(0, 0);
                    ctx.stroke();
                }
                ctx.fillStyle = fragment.mode === 'loose' ? '#71828a' : '#b9d3db';
                ctx.strokeStyle = '#40545f';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(-8, -2);
                ctx.lineTo(-2, -5);
                ctx.lineTo(9, -1);
                ctx.lineTo(3, 2);
                ctx.lineTo(6, 5);
                ctx.lineTo(-5, 4);
                ctx.closePath();
                ctx.fill();
                ctx.stroke();
                ctx.strokeStyle = 'rgba(255,255,255,0.75)';
                ctx.beginPath();
                ctx.moveTo(-3, -3);
                ctx.lineTo(5, -1);
                ctx.stroke();
                ctx.restore();
            }
        }

        drawSpirits(ctx) {
            var art = LXH.Art;
            for (var i = 0; i < this.spirits.length; i++) {
                var spirit = this.spirits[i];
                if (art && typeof art.drawHeixiu === 'function') {
                    art.drawHeixiu(ctx, spirit, this.time);
                    continue;
                }
                var bob = Math.sin(spirit.animationPhase) * 3;
                ctx.save();
                ctx.translate(spirit.x, spirit.y + bob);
                ctx.fillStyle = 'rgba(21, 35, 31, 0.18)';
                ctx.beginPath();
                ctx.ellipse(0, 12 - bob, 12, 4, 0, 0, TAU);
                ctx.fill();
                ctx.fillStyle = '#17211f';
                ctx.strokeStyle = '#52665b';
                ctx.lineWidth = 1.2;
                ctx.beginPath();
                ctx.moveTo(-10, -5);
                ctx.lineTo(-8, -15);
                ctx.lineTo(-2, -10);
                ctx.lineTo(5, -14);
                ctx.lineTo(9, -5);
                ctx.ellipse(0, 0, 11, 12, 0, 0, TAU);
                ctx.fill();
                ctx.stroke();
                ctx.fillStyle = '#eef7df';
                ctx.beginPath();
                ctx.ellipse(-4, -2, 2.3, 3.2, 0, 0, TAU);
                ctx.ellipse(4, -2, 2.3, 3.2, 0, 0, TAU);
                ctx.fill();
                ctx.fillStyle = '#24332c';
                ctx.beginPath();
                ctx.arc(-4, -2, 1, 0, TAU);
                ctx.arc(4, -2, 1, 0, TAU);
                ctx.fill();
                if (spirit.state === 'interact') {
                    ctx.strokeStyle = '#c7f3ac';
                    ctx.beginPath();
                    ctx.arc(0, -17, 5 + Math.sin(this.time * 9) * 2, 0, TAU);
                    ctx.stroke();
                }
                ctx.restore();
            }
        }

        drawScreen(ctx) {
            if (!ctx) {
                return;
            }
            var game = this.game;
            var canvas = game.canvas || {};
            var dpr = isFiniteNumber(game.dpr) && game.dpr > 0 ? game.dpr : 1;
            var width = isFiniteNumber(game.width) ? game.width : (canvas.width || 0) / dpr;
            var height = isFiniteNumber(game.height) ? game.height : (canvas.height || 0) / dpr;
            ctx.save();
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            if (this.action) {
                var definition = DEFINITIONS[this.action.name];
                var text = definition.label + ' · ' + PHASE_NAMES[this.action.phase];
                var y = Math.max(76, height - 158);
                ctx.font = '600 14px sans-serif';
                var boxWidth = Math.max(156, ctx.measureText(text).width + 38);
                roundedRect(ctx, width * 0.5 - boxWidth * 0.5, y - 18, boxWidth, 44, 12);
                ctx.fillStyle = 'rgba(19, 35, 34, 0.76)';
                ctx.fill();
                ctx.fillStyle = '#e5f5e9';
                ctx.fillText(text, width * 0.5, y - 4);
                var phaseDuration = definition[this.action.phase];
                var progress = clamp(this.action.phaseTime / phaseDuration, 0, 1);
                roundedRect(ctx, width * 0.5 - boxWidth * 0.5 + 14, y + 12, boxWidth - 28, 4, 2);
                ctx.fillStyle = 'rgba(255,255,255,0.18)';
                ctx.fill();
                roundedRect(ctx, width * 0.5 - boxWidth * 0.5 + 14, y + 12, (boxWidth - 28) * progress, 4, 2);
                ctx.fillStyle = '#9de2ca';
                ctx.fill();
            }
            if (this.feedback.time > 0 && this.feedback.text) {
                var alpha = clamp(this.feedback.time / 0.25, 0, 1);
                var feedbackY = height * 0.68;
                ctx.font = '600 15px sans-serif';
                var feedbackWidth = ctx.measureText(this.feedback.text).width + 34;
                roundedRect(ctx, width * 0.5 - feedbackWidth * 0.5, feedbackY - 18, feedbackWidth, 36, 18);
                ctx.fillStyle = 'rgba(54, 40, 37,' + (0.82 * alpha) + ')';
                ctx.fill();
                ctx.fillStyle = 'rgba(255, 232, 210,' + alpha + ')';
                ctx.fillText(this.feedback.text, width * 0.5, feedbackY);
            }
            ctx.restore();
        }

        random() {
            this.randomSeed = (Math.imul(this.randomSeed, 1664525) + 1013904223) >>> 0;
            return this.randomSeed / 4294967296;
        }
    }

    LXH.Abilities = Abilities;
})(typeof window !== 'undefined' ? window : globalThis);
