(function (window) {
    'use strict';

    var LXH = window.LXH = window.LXH || {};
    var TAU = Math.PI * 2;
    var entitySerial = 0;

    var PLAYER_FORMS = {
        human: { radius: 18, walk: 184, run: 282, fly: 326, acceleration: 1320, deceleration: 1640, hover: 34, flightDrain: 9, energyRegen: 13 },
        cat: { radius: 13, walk: 204, run: 324, fly: 296, acceleration: 1740, deceleration: 2020, hover: 25, flightDrain: 7, energyRegen: 15 }
    };

    function finite(value, fallback) {
        var number = Number(value);
        return Number.isFinite(number) ? number : fallback;
    }

    function clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    function approach(value, target, amount) {
        if (value < target) return Math.min(value + amount, target);
        if (value > target) return Math.max(value - amount, target);
        return target;
    }

    function deltaTime(dt) {
        return clamp(finite(dt, 0), 0, 0.05);
    }

    function distance(x1, y1, x2, y2) {
        return Math.hypot(x2 - x1, y2 - y1);
    }

    function hash(text) {
        var result = 2166136261;
        var string = String(text || 'entity');
        for (var i = 0; i < string.length; i += 1) {
            result ^= string.charCodeAt(i);
            result = Math.imul(result, 16777619);
        }
        return result >>> 0;
    }

    function random(actor) {
        actor._seed = (Math.imul(actor._seed, 1664525) + 1013904223) >>> 0;
        return actor._seed / 4294967296;
    }

    function normalizedForm(form) {
        if (form === 'human' || form === 'humanoid' || form === '人形') return 'human';
        if (form === 'cat' || form === '猫形' || form === '猫') return 'cat';
        return form || 'human';
    }

    function keyDown(game, names) {
        if (!game || !game.keys || typeof game.keys.has !== 'function') return false;
        for (var i = 0; i < names.length; i += 1) {
            if (game.keys.has(names[i])) return true;
        }
        return false;
    }

    function readPlayerInput(game) {
        var input = game && game.input ? game.input : {};
        var left = keyDown(game, ['KeyA', 'ArrowLeft', 'a', 'A', 'Left']);
        var right = keyDown(game, ['KeyD', 'ArrowRight', 'd', 'D', 'Right']);
        var up = keyDown(game, ['KeyW', 'ArrowUp', 'w', 'W', 'Up']);
        var down = keyDown(game, ['KeyS', 'ArrowDown', 's', 'S', 'Down']);
        var keyboardX = (right ? 1 : 0) - (left ? 1 : 0);
        var keyboardY = (down ? 1 : 0) - (up ? 1 : 0);
        var x = keyboardX || keyboardY ? keyboardX : finite(input.x, 0);
        var y = keyboardX || keyboardY ? keyboardY : finite(input.y, 0);
        var length = Math.hypot(x, y);
        if (!keyboardX && !keyboardY && length < 0.08) {
            x = 0;
            y = 0;
            length = 0;
        }
        if (length > 1) {
            x /= length;
            y /= length;
        }
        return {
            x: x,
            y: y,
            run: !!input.run || keyDown(game, ['ShiftLeft', 'ShiftRight', 'Shift']),
            fly: !!input.fly || keyDown(game, ['KeyF', 'f', 'F'])
        };
    }

    function worldSize(actor) {
        var world = actor.game && actor.game.world;
        return {
            width: Math.max(1, finite(world && world.width, 4800)),
            height: Math.max(1, finite(world && world.height, 3600))
        };
    }

    function confine(actor) {
        var size = worldSize(actor);
        var radius = Math.max(0, finite(actor.radius, 0));
        actor.x = clamp(finite(actor.x, radius), radius, Math.max(radius, size.width - radius));
        actor.y = clamp(finite(actor.y, radius), radius, Math.max(radius, size.height - radius));
    }

    function moveActor(actor, dx, dy) {
        var oldX = actor.x;
        var oldY = actor.y;
        var world = actor.game && actor.game.world;
        var next = null;
        dx = finite(dx, 0);
        dy = finite(dy, 0);

        if (world && typeof world.resolveMovement === 'function') {
            next = world.resolveMovement(actor, dx, dy);
            if (next && Number.isFinite(Number(next.x)) && Number.isFinite(Number(next.y))) {
                actor.x = Number(next.x);
                actor.y = Number(next.y);
            }
        } else if (world && typeof world.isWalkable === 'function') {
            var targetX = actor.x + dx;
            var targetY = actor.y + dy;
            if (world.isWalkable(targetX, targetY, actor.radius)) {
                actor.x = targetX;
                actor.y = targetY;
            } else {
                if (world.isWalkable(targetX, actor.y, actor.radius)) actor.x = targetX;
                if (world.isWalkable(actor.x, targetY, actor.radius)) actor.y = targetY;
            }
        } else {
            actor.x += dx;
            actor.y += dy;
        }

        confine(actor);
        var movedX = actor.x - oldX;
        var movedY = actor.y - oldY;
        return {
            x: actor.x,
            y: actor.y,
            dx: movedX,
            dy: movedY,
            blockedX: Math.abs(dx) > 0.0001 && Math.abs(movedX) < Math.abs(dx) * 0.08,
            blockedY: Math.abs(dy) > 0.0001 && Math.abs(movedY) < Math.abs(dy) * 0.08
        };
    }

    function setFacing(actor, x, y) {
        var length = Math.hypot(x, y);
        if (length < 0.001) return;
        var nx = x / length;
        var ny = y / length;
        actor.facingAngle = Math.atan2(ny, nx);
        actor.lookX = nx;
        actor.lookY = ny;
        if (Math.abs(nx) > 0.08) actor.facing = nx < 0 ? -1 : 1;
        var vertical = ny < -0.3827 ? 'north' : ny > 0.3827 ? 'south' : '';
        var horizontal = nx < -0.3827 ? 'west' : nx > 0.3827 ? 'east' : '';
        if (!horizontal && vertical) actor.direction = vertical;
        else if (!vertical && horizontal) actor.direction = horizontal;
        else actor.direction = vertical + horizontal;
    }

    function createBones() {
        return {
            body: 0,
            spine: 0,
            bodyLean: 0,
            bodyBob: 0,
            head: 0,
            headTilt: 0,
            neck: 0,
            armL: 0,
            armR: 0,
            leftArm: 0,
            rightArm: 0,
            elbowL: 0,
            elbowR: 0,
            leftElbow: 0,
            rightElbow: 0,
            legL: 0,
            legR: 0,
            leftLeg: 0,
            rightLeg: 0,
            kneeL: 0,
            kneeR: 0,
            leftKnee: 0,
            rightKnee: 0,
            frontL: 0,
            frontR: 0,
            backL: 0,
            backR: 0,
            tail: 0,
            tailCurl: 0,
            earL: 0,
            earR: 0,
            lift: 0,
            rootX: 0,
            rootY: 0,
            blink: 0
        };
    }

    function createJoints() {
        var names = ['root', 'hip', 'chest', 'head', 'handL', 'handR', 'footL', 'footR', 'frontPawL', 'frontPawR', 'backPawL', 'backPawR', 'tailTip'];
        var joints = {};
        for (var i = 0; i < names.length; i += 1) joints[names[i]] = { x: 0, y: 0 };
        return joints;
    }

    function updateBones(actor, dt, moving) {
        actor.animationTime += dt;
        var state = actor.state;
        var locomotion = state === 'walk' || state === 'run' || state === 'chase' || state === 'return';
        var phaseRate = locomotion && moving ? Math.max(4, actor.speed * (actor.form === 'cat' ? 0.052 : 0.044)) : 2.1;
        if (state === 'fly') phaseRate = 5.2;
        if (state === 'attack') phaseRate = 11;
        if (state === 'dissipating') phaseRate = 7;
        actor.animationPhase += dt * phaseRate;
        if (actor.animationPhase > 10000) actor.animationPhase %= TAU;

        var phase = actor.animationPhase;
        var stride = state === 'run' || state === 'chase' ? 0.82 : 0.52;
        if (!moving || !locomotion) stride = 0;
        var swing = Math.sin(phase) * stride;
        var bones = actor.bones;
        var breathe = Math.sin(actor.animationTime * 2.05 + actor._seed % 17) * 0.7;
        var armL = -swing * 0.82;
        var armR = swing * 0.82;
        var legL = swing;
        var legR = -swing;
        var bodyLean = moving && locomotion ? clamp(actor.speed / 900, 0, 0.28) : 0;
        var bodyBob = breathe + (moving && locomotion ? Math.abs(Math.sin(phase)) * 1.8 : 0);
        var head = -bodyLean * 0.3;
        var elbowL = 0.12 + Math.max(0, swing) * 0.35;
        var elbowR = 0.12 + Math.max(0, -swing) * 0.35;
        var kneeL = Math.max(0, -swing) * 0.75;
        var kneeR = Math.max(0, swing) * 0.75;
        var tail = Math.sin(actor.animationTime * 3 + actor._seed % 11) * 0.22 - bodyLean * 0.7;

        if (state === 'fly') {
            armL = -0.48 + Math.sin(phase) * 0.1;
            armR = 0.48 - Math.sin(phase) * 0.1;
            legL = 0.18 + Math.sin(phase * 0.7) * 0.1;
            legR = -0.08 - Math.sin(phase * 0.7) * 0.1;
            bodyLean = 0.2;
            bodyBob = Math.sin(phase) * 1.6;
            tail = Math.sin(phase * 0.8) * 0.42;
        } else if (state === 'telegraph') {
            var charge = actor.telegraph ? actor.telegraph.progress : 0.5;
            armL = -0.65 - charge * 0.55;
            armR = 0.65 + charge * 0.55;
            bodyLean = -0.13;
            elbowL = 0.8;
            elbowR = 0.8;
        } else if (state === 'attack') {
            armL = -1.15;
            armR = 1.15;
            bodyLean = 0.36;
            elbowL = 0.1;
            elbowR = 0.1;
            legL = -0.35;
            legR = 0.45;
        } else if (state === 'cast' || state === 'metal' || state === 'teleport' || state === 'heixiu') {
            armL = -0.85 + Math.sin(phase) * 0.08;
            armR = 0.85 - Math.sin(phase) * 0.08;
            elbowL = 0.65;
            elbowR = 0.65;
            bodyLean = -0.06;
            tail = Math.sin(phase * 0.7) * 0.45;
        } else if (state === 'dash') {
            armL = 0.7;
            armR = -0.55;
            legL = -0.55;
            legR = 0.65;
            bodyLean = 0.48;
            tail = -0.5;
        } else if (state === 'recover') {
            armL = -0.2;
            armR = 0.2;
            bodyLean = 0.08;
        } else if (state === 'hurt') {
            bodyLean = -0.22;
            head = 0.18;
            armL = 0.5;
            armR = -0.5;
            bodyBob = 2;
        } else if (state === 'exhausted') {
            bodyLean = 0.42;
            head = -0.25;
            armL = 0.72;
            armR = -0.72;
            legL = 0.85;
            legR = -0.7;
            kneeL = 1.1;
            kneeR = 1.1;
            bodyBob = -7;
        } else if (state === 'talk') {
            armR = 0.18 + Math.sin(actor.animationTime * 3.2) * 0.16;
            head = Math.sin(actor.animationTime * 1.7) * 0.06;
        } else if (state === 'transform') {
            bodyBob = Math.sin(clamp(actor.stateTime / 0.28, 0, 1) * Math.PI) * 5;
            armL = -0.35;
            armR = 0.35;
            tail = Math.sin(actor.stateTime * 20) * 0.6;
        } else if (state === 'dissipating') {
            armL = -0.3;
            armR = 0.3;
            bodyBob = actor.dissolveProgress * 8;
            tail = Math.sin(phase) * 0.7;
        }

        bones.body = bodyLean;
        bones.spine = bodyLean;
        bones.bodyLean = bodyLean;
        bones.bodyBob = bodyBob;
        bones.head = head;
        bones.headTilt = head;
        bones.neck = head * 0.5;
        bones.armL = armL;
        bones.armR = armR;
        bones.leftArm = armL;
        bones.rightArm = armR;
        bones.elbowL = elbowL;
        bones.elbowR = elbowR;
        bones.leftElbow = elbowL;
        bones.rightElbow = elbowR;
        bones.legL = legL;
        bones.legR = legR;
        bones.leftLeg = legL;
        bones.rightLeg = legR;
        bones.kneeL = kneeL;
        bones.kneeR = kneeR;
        bones.leftKnee = kneeL;
        bones.rightKnee = kneeR;
        bones.frontL = swing;
        bones.frontR = -swing;
        bones.backL = -swing * 0.9;
        bones.backR = swing * 0.9;
        bones.tail = -1.92 + tail;
        bones.tailCurl = tail * 0.65 + (actor.form === 'cat' ? 0.2 : 0);
        bones.earL = Math.sin(actor.animationTime * 2.7) * 0.035 - bodyLean * 0.15;
        bones.earR = -bones.earL;
        bones.lift = actor.altitude;
        bones.rootX = 0;
        bones.rootY = -actor.altitude - bodyBob;
        bones.blink = Math.sin(actor.animationTime * 0.73 + actor._seed % 31) > 0.996 ? 1 : 0;

        var joints = actor.joints;
        var lift = actor.altitude + bodyBob;
        if (actor.form === 'cat') {
            joints.root.x = 0;
            joints.root.y = -lift;
            joints.hip.x = -6;
            joints.hip.y = -13 - lift;
            joints.chest.x = 5;
            joints.chest.y = -14 - lift;
            joints.head.x = 10;
            joints.head.y = -23 - lift;
            joints.frontPawL.x = 8 + swing * 7;
            joints.frontPawL.y = -lift;
            joints.frontPawR.x = 8 - swing * 7;
            joints.frontPawR.y = -lift;
            joints.backPawL.x = -8 - swing * 6;
            joints.backPawL.y = -lift;
            joints.backPawR.x = -8 + swing * 6;
            joints.backPawR.y = -lift;
            joints.tailTip.x = -24;
            joints.tailTip.y = -19 - lift + tail * 9;
        } else {
            joints.root.x = 0;
            joints.root.y = -lift;
            joints.hip.x = 0;
            joints.hip.y = -20 - lift;
            joints.chest.x = bodyLean * 9;
            joints.chest.y = -35 - lift;
            joints.head.x = bodyLean * 13;
            joints.head.y = -51 - lift;
            joints.handL.x = -16 - armL * 7;
            joints.handL.y = -23 - lift + Math.abs(armL) * 3;
            joints.handR.x = 16 + armR * 7;
            joints.handR.y = -23 - lift + Math.abs(armR) * 3;
            joints.footL.x = -6 + legL * 9;
            joints.footL.y = -lift - Math.max(0, legL) * 3;
            joints.footR.x = 6 + legR * 9;
            joints.footR.y = -lift - Math.max(0, legR) * 3;
            joints.tailTip.x = -22;
            joints.tailTip.y = -16 - lift + tail * 10;
        }
    }

    function applyKnockback(actor, source, defaultForce) {
        if (!source || typeof source !== 'object') return;
        var origin = source.source && typeof source.source === 'object' ? source.source : source;
        var sx = finite(origin.x, NaN);
        var sy = finite(origin.y, NaN);
        if (!Number.isFinite(sx) || !Number.isFinite(sy)) return;
        var dx = actor.x - sx;
        var dy = actor.y - sy;
        var length = Math.hypot(dx, dy);
        if (length < 0.001) {
            dx = -actor.lookX || -actor.facing;
            dy = -actor.lookY || 0;
            length = Math.hypot(dx, dy) || 1;
        }
        var force = Math.max(0, finite(source.knockback, defaultForce));
        actor.knockbackX += dx / length * force;
        actor.knockbackY += dy / length * force;
    }

    function decayKnockback(actor, dt) {
        actor.knockbackX = approach(actor.knockbackX, 0, 880 * dt);
        actor.knockbackY = approach(actor.knockbackY, 0, 880 * dt);
    }

    function Actor(game, x, y, definition) {
        definition = definition || {};
        this.game = game;
        this.id = definition.id || 'actor-' + (++entitySerial);
        this.name = definition.name || '同行者';
        this.type = definition.type || 'actor';
        this.data = definition;
        this.x = finite(x, 0);
        this.y = finite(y, 0);
        this.vx = 0;
        this.vy = 0;
        this.radius = Math.max(4, finite(definition.radius, 17));
        this.maxHealth = Math.max(1, finite(definition.maxHealth, finite(definition.health, 100)));
        this.health = clamp(finite(definition.health, this.maxHealth), 0, this.maxHealth);
        this.maxEnergy = Math.max(0, finite(definition.maxEnergy, finite(definition.energy, 100)));
        this.energy = clamp(finite(definition.energy, this.maxEnergy), 0, this.maxEnergy);
        this.facing = definition.facing === -1 || definition.facing === 'left' || definition.facing === 'west' ? -1 : 1;
        this.facingAngle = Math.PI / 2;
        this.lookX = this.facing;
        this.lookY = 0;
        this.direction = 'south';
        this.form = normalizedForm(definition.form || 'human');
        this.state = 'idle';
        this.previousState = 'idle';
        this.stateTime = 0;
        this.stateTimer = 0;
        this.stateLock = 0;
        this.bones = createBones();
        this.joints = createJoints();
        this.bonePoints = this.joints;
        this.animationPhase = (hash(this.id) % 1000) / 1000 * TAU;
        this.animationTime = 0;
        this.speed = 0;
        this.actualSpeed = 0;
        this.moving = false;
        this.running = false;
        this.flying = false;
        this.flight = false;
        this.altitude = 0;
        this.z = 0;
        this.alpha = 1;
        this.opacity = 1;
        this.visible = true;
        this.dead = false;
        this.defeated = false;
        this.solid = false;
        this.invulnerable = !!definition.invulnerable;
        this.invulnerableTimer = 0;
        this.invulnTimer = 0;
        this.hitFlash = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.energyRegenDelay = 0;
        this._seed = hash(this.id) || 1;
        confine(this);
    }

    Actor.prototype.setState = function (next, duration) {
        if (!next) return;
        if (this.state !== next) {
            this.previousState = this.state;
            this.state = next;
            this.stateTime = 0;
        }
        if (duration !== undefined) {
            this.stateTimer = Math.max(0, finite(duration, 0));
            this.stateLock = Math.max(this.stateLock, this.stateTimer);
        }
    };

    Actor.prototype.setAction = function (name, duration) {
        this.setState(name, Math.max(0.05, finite(duration, 0.3)));
    };

    Actor.prototype.tick = function (dt) {
        this.stateTime += dt;
        this.hitFlash = Math.max(0, this.hitFlash - dt);
        this.invulnerableTimer = Math.max(0, this.invulnerableTimer - dt);
        this.invulnTimer = this.invulnerableTimer;
        this.energyRegenDelay = Math.max(0, this.energyRegenDelay - dt);
        if (this.stateLock > 0) this.stateLock = Math.max(0, this.stateLock - dt);
        if (this.stateTimer > 0) {
            this.stateTimer = Math.max(0, this.stateTimer - dt);
            if (this.stateTimer === 0 && this.stateLock === 0 && !this.defeated && !this.exhausted) this.setState('idle');
        }
    };

    Actor.prototype.takeDamage = function (amount) {
        if (this.defeated || this.invulnerable || this.invulnerableTimer > 0) return 0;
        var damage = Math.max(0, finite(amount, 0));
        if (damage <= 0) return 0;
        var actual = Math.min(damage, Math.max(0, this.health - 1));
        if (actual <= 0) return 0;
        this.health -= actual;
        this.hitFlash = 0.16;
        this.invulnerableTimer = 0.3;
        this.setState('hurt', 0.24);
        return actual;
    };

    Actor.prototype.heal = function (amount) {
        if (this.defeated) return 0;
        var healing = Math.max(0, finite(amount, 0));
        var actual = Math.min(healing, this.maxHealth - this.health);
        if (actual <= 0) return 0;
        this.health += actual;
        this.hitFlash = 0;
        if (this.exhausted) {
            this.exhausted = false;
            this.exhaustionTimer = 0;
            this.invulnerableTimer = Math.max(this.invulnerableTimer, 1);
            this.setState('idle');
        }
        return actual;
    };

    Actor.prototype.restoreEnergy = function (amount) {
        var restoration = Math.max(0, finite(amount, 0));
        var actual = Math.min(restoration, this.maxEnergy - this.energy);
        this.energy += actual;
        return actual;
    };

    Actor.prototype.updateAnimation = function (dt, moved) {
        this.moving = !!moved;
        updateBones(this, dt, this.moving);
    };

    Actor.prototype.draw = function (ctx) {
        if (!ctx || !this.visible || !LXH.Art || typeof LXH.Art.drawActor !== 'function') return;
        var time = this.game && Number.isFinite(this.game.time) ? this.game.time : this.animationTime;
        ctx.save();
        LXH.Art.drawActor(ctx, this, time);
        ctx.restore();
    };

    function Player(game, x, y) {
        Actor.call(this, game, x, y, {
            id: 'xiaohei',
            name: '罗小黑',
            type: 'player',
            form: 'cat',
            radius: PLAYER_FORMS.cat.radius,
            maxHealth: 100,
            maxEnergy: 100
        });
        this.solid = true;
        this.form = 'cat';
        this._formSeen = 'cat';
        this.flightExhausted = false;
        this.exhausted = false;
        this.exhaustionTimer = 0;
        this.lastSafeX = this.x;
        this.lastSafeY = this.y;
        this.safeTimer = 0;
        this.interactionRadius = 68;
        this.updateAnimation(0, false);
    }

    Player.prototype = Object.create(Actor.prototype);
    Player.prototype.constructor = Player;

    Player.prototype.setForm = function (form) {
        var next = form === 'human' || form === 'humanoid' || form === '人形' ? 'human' : 'cat';
        var changed = this.form !== next;
        var world = this.game && this.game.world;
        var nextRadius = PLAYER_FORMS[next].radius;
        this.form = next;
        this._formSeen = next;
        if (world && typeof world.isWalkable === 'function' &&
            !world.isWalkable(this.x, this.y, nextRadius) &&
            world.isWalkable(this.x, this.y, this.radius)) {
            nextRadius = this.radius;
        }
        this.radius = nextRadius;
        if (changed && !this.abilityPhase) this.setState('transform', 0.28);
        confine(this);
        return this.form;
    };

    Player.prototype.update = function (dt) {
        dt = deltaTime(dt);
        if (dt <= 0) return;
        this.tick(dt);
        if (this.form !== this._formSeen) this.setForm(this.form);
        var controls = readPlayerInput(this.game);
        var stats = PLAYER_FORMS[this.form] || PLAYER_FORMS.cat;
        var settings = this.game && this.game.settings ? this.game.settings : {};
        var moveScale = clamp(finite(settings.moveSpeed, 1), 0.2, 3);
        var flightScale = clamp(finite(settings.flightSpeed, 1), 0.2, 3);

        if (this.exhausted) {
            this.flying = false;
            this.flight = false;
            this.running = false;
            this.setState('exhausted');
            this.vx = approach(this.vx, 0, stats.deceleration * dt);
            this.vy = approach(this.vy, 0, stats.deceleration * dt);
            decayKnockback(this, dt);
            var restingMove = moveActor(this, (this.vx + this.knockbackX) * dt, (this.vy + this.knockbackY) * dt);
            this.altitude = approach(this.altitude, 0, 60 * dt);
            this.z = this.altitude;
            this.exhaustionTimer = Math.max(0, this.exhaustionTimer - dt);
            this.restoreEnergy(stats.energyRegen * 0.65 * dt);
            if (this.exhaustionTimer === 0) {
                this.health = Math.max(this.health, this.maxHealth * 0.45);
                this.energy = Math.max(this.energy, this.maxEnergy * 0.35);
                this.exhausted = false;
                this.invulnerableTimer = Math.max(this.invulnerableTimer, 1.8);
                this.setState('idle');
            }
            this.speed = dt > 0 ? Math.hypot(restingMove.dx, restingMove.dy) / dt : 0;
            this.updateAnimation(dt, this.speed > 3);
            return;
        }

        if (this.abilityLock) {
            this.running = false;
            this.speed = Math.hypot(this.vx, this.vy);
            this.actualSpeed = this.speed;
            this.z = this.altitude;
            this.updateAnimation(dt, this.speed > 3);
            return;
        }

        if (!controls.fly) this.flightExhausted = false;
        var wantsFlight = controls.fly && !this.flightExhausted && this.energy > 0.5;
        this.flying = wantsFlight;
        this.flight = wantsFlight;
        if (this.flying) {
            var movingDrain = Math.hypot(controls.x, controls.y) > 0.1 ? 2.2 : 0;
            this.energy = Math.max(0, this.energy - (stats.flightDrain + movingDrain) * dt);
            this.energyRegenDelay = 0.8;
            if (this.energy <= 0) {
                this.flying = false;
                this.flight = false;
                this.flightExhausted = true;
            }
        } else if (this.energyRegenDelay <= 0) {
            var regenScale = controls.run && Math.hypot(controls.x, controls.y) > 0.1 ? 0.72 : 1;
            this.restoreEnergy(stats.energyRegen * regenScale * dt);
        }

        var inputLength = Math.hypot(controls.x, controls.y);
        this.running = !this.flying && controls.run && inputLength > 0.08;
        var maxSpeed = this.flying ? stats.fly * flightScale : (this.running ? stats.run : stats.walk) * moveScale;
        var acceleration = this.flying ? stats.acceleration * 0.82 : stats.acceleration;
        var inputScale = this.stateLock > 0 && this.state === 'hurt' ? 0.35 : 1;
        var targetVX = controls.x * maxSpeed * inputScale;
        var targetVY = controls.y * maxSpeed * inputScale;
        var rate = inputLength > 0.001 ? acceleration : stats.deceleration;
        this.vx = approach(this.vx, targetVX, rate * dt);
        this.vy = approach(this.vy, targetVY, rate * dt);
        decayKnockback(this, dt);

        this.altitude = approach(this.altitude, this.flying ? stats.hover : 0, 86 * dt);
        this.z = this.altitude;
        var movement = moveActor(this, (this.vx + this.knockbackX) * dt, (this.vy + this.knockbackY) * dt);
        if (movement.blockedX) {
            this.vx = 0;
            this.knockbackX = 0;
        }
        if (movement.blockedY) {
            this.vy = 0;
            this.knockbackY = 0;
        }
        this.speed = Math.hypot(movement.dx, movement.dy) / dt;
        this.actualSpeed = this.speed;
        if (inputLength > 0.08) setFacing(this, controls.x, controls.y);
        else if (this.speed > 12) setFacing(this, movement.dx, movement.dy);

        if (this.stateLock <= 0 && !this.abilityPhase) {
            if (this.flying) this.setState('fly');
            else if (this.speed < 5) this.setState('idle');
            else if (this.running && this.speed > stats.walk * moveScale * 0.82) this.setState('run');
            else this.setState('walk');
        }

        this.safeTimer -= dt;
        if (this.safeTimer <= 0 && !this.flying && this.health > 0) {
            var world = this.game && this.game.world;
            if (!world || typeof world.isWalkable !== 'function' || world.isWalkable(this.x, this.y, this.radius)) {
                this.lastSafeX = this.x;
                this.lastSafeY = this.y;
            }
            this.safeTimer = 0.5;
        }
        this.updateAnimation(dt, this.speed > 3);
    };

    Player.prototype.takeDamage = function (amount, source) {
        if (this.exhausted || this.invulnerable || this.invulnerableTimer > 0) return 0;
        var damage = Math.max(0, finite(amount, 0));
        if (damage <= 0 || this.health <= 0) return 0;
        var actual = Math.min(damage, this.health);
        this.health = Math.max(0, this.health - actual);
        this.hitFlash = 0.18;
        this.invulnerableTimer = 0.68;
        this.invulnTimer = this.invulnerableTimer;
        this.energyRegenDelay = 0.9;
        applyKnockback(this, source, 125);
        if (this.health <= 0) {
            this.exhausted = true;
            this.exhaustionTimer = 2.8;
            this.flying = false;
            this.flight = false;
            this.setState('exhausted');
            var ui = this.game && this.game.ui;
            if (ui && typeof ui.toast === 'function') ui.toast('小黑累了，歇一会儿再继续……');
        } else {
            this.setState('hurt', 0.24);
        }
        return actual;
    };

    function routeFrom(definition) {
        var source = definition.schedule;
        if (source && !Array.isArray(source) && Array.isArray(source.points)) source = source.points;
        if (!Array.isArray(source)) source = definition.waypoints || definition.route;
        if (!Array.isArray(source)) return [];
        var points = [];
        for (var i = 0; i < source.length; i += 1) {
            var point = source[i];
            if (Array.isArray(point)) points.push({ x: finite(point[0], 0), y: finite(point[1], 0), wait: finite(point[2], 1.5) });
            else if (point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y))) {
                points.push({ x: Number(point.x), y: Number(point.y), wait: Math.max(0, finite(point.wait, finite(point.pause, 1.5))) });
            }
        }
        return points;
    }

    function NPC(game, definition) {
        definition = definition || {};
        Actor.call(this, game, definition.x, definition.y, definition);
        this.id = definition.id || 'npc-' + (++entitySerial);
        this.name = definition.name || '会馆同伴';
        this.type = 'npc';
        this.form = normalizedForm(definition.form || 'human');
        this.homeX = finite(definition.homeX, this.x);
        this.homeY = finite(definition.homeY, this.y);
        this.homeRadius = Math.max(0, finite(definition.wanderRadius, finite(definition.homeRadius, 36)));
        this.waypoints = routeFrom(definition);
        this.routeIndex = 0;
        this.targetX = this.homeX;
        this.targetY = this.homeY;
        this.hasTarget = false;
        this.waitTimer = 0.8 + random(this) * 2.2;
        this.moveSpeed = Math.max(4, finite(definition.speed, 29));
        this.stationary = definition.stationary === true || definition.schedule === 'stationary' || definition.schedule === false;
        this.facePlayer = definition.facePlayer !== false;
        this.pauseNearPlayer = definition.pauseNearPlayer !== false;
        this.talkTimer = 0;
        this.interactable = definition.interactable !== false;
        this.interactionRadius = Math.max(24, finite(definition.interactionRadius, 72));
        this.solid = false;
        this._seed = hash(this.id) || 1;
        this.updateAnimation(0, false);
    }

    NPC.prototype = Object.create(Actor.prototype);
    NPC.prototype.constructor = NPC;

    NPC.prototype.chooseTarget = function () {
        if (this.waypoints.length) {
            var point = this.waypoints[this.routeIndex % this.waypoints.length];
            this.targetX = point.x;
            this.targetY = point.y;
            this.routeWait = point.wait;
            this.routeIndex = (this.routeIndex + 1) % this.waypoints.length;
        } else {
            var angle = random(this) * TAU;
            var radius = (0.2 + random(this) * 0.8) * this.homeRadius;
            this.targetX = this.homeX + Math.cos(angle) * radius;
            this.targetY = this.homeY + Math.sin(angle) * radius;
            this.routeWait = 1.4 + random(this) * 2.8;
        }
        this.hasTarget = true;
    };

    NPC.prototype.update = function (dt) {
        dt = deltaTime(dt);
        if (dt <= 0) return;
        this.tick(dt);
        this.restoreEnergy(8 * dt);
        this.talkTimer = Math.max(0, this.talkTimer - dt);
        decayKnockback(this, dt);
        var player = this.game && this.game.player;
        var playerDistance = player ? distance(this.x, this.y, player.x, player.y) : Infinity;

        if (this.stateLock > 0) {
            var hurtMove = moveActor(this, this.knockbackX * dt, this.knockbackY * dt);
            this.speed = Math.hypot(hurtMove.dx, hurtMove.dy) / dt;
            this.updateAnimation(dt, this.speed > 3);
            return;
        }

        if (this.talkTimer > 0) {
            this.vx = approach(this.vx, 0, 240 * dt);
            this.vy = approach(this.vy, 0, 240 * dt);
            this.speed = 0;
            this.setState('talk');
            if (player) setFacing(this, player.x - this.x, player.y - this.y);
            this.updateAnimation(dt, false);
            return;
        }

        if (player && this.facePlayer && playerDistance < 76) setFacing(this, player.x - this.x, player.y - this.y);
        if (this.stationary || (player && this.pauseNearPlayer && playerDistance < 43)) {
            this.vx = approach(this.vx, 0, 250 * dt);
            this.vy = approach(this.vy, 0, 250 * dt);
            this.speed = 0;
            this.setState('idle');
            this.updateAnimation(dt, false);
            return;
        }

        var movement = { dx: 0, dy: 0 };
        if (this.waitTimer > 0) {
            this.waitTimer = Math.max(0, this.waitTimer - dt);
            this.vx = approach(this.vx, 0, 220 * dt);
            this.vy = approach(this.vy, 0, 220 * dt);
            this.setState('idle');
        } else {
            if (!this.hasTarget) this.chooseTarget();
            var dx = this.targetX - this.x;
            var dy = this.targetY - this.y;
            var length = Math.hypot(dx, dy);
            if (length < 4) {
                this.hasTarget = false;
                this.waitTimer = this.routeWait || 1.5;
                this.vx = 0;
                this.vy = 0;
                this.setState('idle');
            } else {
                var desiredSpeed = Math.min(this.moveSpeed, length * 1.8);
                this.vx = approach(this.vx, dx / length * desiredSpeed, 130 * dt);
                this.vy = approach(this.vy, dy / length * desiredSpeed, 130 * dt);
                movement = moveActor(this, this.vx * dt, this.vy * dt);
                if ((movement.blockedX || movement.blockedY) && Math.hypot(movement.dx, movement.dy) < 0.1) {
                    this.hasTarget = false;
                    this.waitTimer = 0.45;
                }
                setFacing(this, this.vx, this.vy);
                this.setState('walk');
            }
        }
        this.speed = Math.hypot(movement.dx, movement.dy) / dt;
        this.updateAnimation(dt, this.speed > 2);
    };

    NPC.prototype.interact = function () {
        if (!this.interactable) return false;
        this.talkTimer = 3;
        this.hasTarget = false;
        this.waitTimer = Math.max(this.waitTimer, 1.2);
        var player = this.game && this.game.player;
        if (player) setFacing(this, player.x - this.x, player.y - this.y);
        this.setState('talk');
        var story = this.game && this.game.story;
        if (story && typeof story.interact === 'function' && story.interact(this) === true) return true;
        var ui = this.game && this.game.ui;
        var dialogue = this.data.dialogue || this.data.greeting || this.data.text;
        if (!ui || typeof ui.showDialogue !== 'function' || !dialogue) return false;
        if (typeof dialogue === 'string') {
            ui.showDialogue({ speaker: this.name, id: this.id, text: dialogue });
        } else if (Array.isArray(dialogue)) {
            var queue = [];
            for (var i = 0; i < dialogue.length; i += 1) {
                var line = dialogue[i];
                queue.push(typeof line === 'string' ? { speaker: this.name, id: this.id, text: line } : line);
            }
            ui.showDialogue(queue);
        } else {
            ui.showDialogue(dialogue);
        }
        return true;
    };

    NPC.prototype.takeDamage = function (amount, source) {
        var actual = Actor.prototype.takeDamage.call(this, amount);
        if (actual > 0) applyKnockback(this, source, 55);
        return actual;
    };

    function Enemy(game, definition) {
        definition = definition || {};
        var kind = definition.kind || definition.behavior || definition.type || 'spirit';
        var sparring = kind === 'sparring' || kind === 'spar' || kind === '切磋' || definition.sparring === true;
        Actor.call(this, game, definition.x, definition.y, {
            id: definition.id,
            name: definition.name || (sparring ? '切磋伙伴' : '失控灵体'),
            type: 'enemy',
            form: definition.form || (sparring ? 'human' : 'spirit'),
            radius: finite(definition.radius, sparring ? 18 : 20),
            maxHealth: finite(definition.maxHealth, finite(definition.health, sparring ? 90 : 70)),
            health: definition.health,
            maxEnergy: finite(definition.maxEnergy, 60),
            energy: definition.energy
        });
        this.id = definition.id || 'enemy-' + (++entitySerial);
        this.kind = sparring ? 'sparring' : kind;
        this.name = definition.name || (sparring ? '切磋伙伴' : '失控灵体');
        this.sparring = sparring;
        this.nonlethal = true;
        this.homeX = finite(definition.homeX, this.x);
        this.homeY = finite(definition.homeY, this.y);
        this.moveSpeed = Math.max(20, finite(definition.speed, sparring ? 126 : 108));
        this.detectionRange = Math.max(60, finite(definition.detectionRange, finite(definition.aggroRange, 310)));
        this.loseRange = Math.max(this.detectionRange, finite(definition.loseRange, 470));
        this.leashRange = Math.max(100, finite(definition.leashRange, 560));
        this.attackRange = Math.max(28, finite(definition.attackRange, sparring ? 68 : 62));
        this.attackDamage = Math.max(0.1, finite(definition.attackDamage, finite(definition.damage, sparring ? 10 : 12)));
        this.attackCooldownDuration = Math.max(0.35, finite(definition.attackCooldown, sparring ? 1.25 : 1.5));
        this.attackCooldown = 0.4 + random(this) * 0.5;
        this.telegraphDuration = Math.max(0.25, finite(definition.telegraphDuration, sparring ? 0.72 : 0.82));
        this.telegraphTimer = 0;
        this.telegraph = { active: false, progress: 0, x: this.x, y: this.y, radius: this.attackRange };
        this.attackDuration = 0.22;
        this.attackTimer = 0;
        this.attackDidHit = false;
        this.attackDirX = 0;
        this.attackDirY = 1;
        this.attackTargetX = this.x;
        this.attackTargetY = this.y;
        this.recoverTimer = 0;
        this.hurtTimer = 0;
        this.aggro = definition.aggro !== undefined ? !!definition.aggro : !sparring && definition.passive !== true;
        this.provoked = false;
        this.passive = definition.passive === true;
        this.wanderRadius = Math.max(0, finite(definition.wanderRadius, 58));
        this.waypoints = routeFrom(definition);
        this.routeIndex = 0;
        this.routeWait = 1.5;
        this.targetX = this.homeX;
        this.targetY = this.homeY;
        this.hasTarget = false;
        this.waitTimer = random(this) * 2;
        this.dissipateDuration = Math.max(0.35, finite(definition.dissipateDuration, 1.05));
        this.dissipateTimer = 0;
        this.dissolve = 0;
        this.dissolveProgress = 0;
        this.removed = false;
        this.solid = true;
        this._defeatNotified = false;
        this._seed = hash(this.id) || 1;
        this.updateAnimation(0, false);
    }

    Enemy.prototype = Object.create(Actor.prototype);
    Enemy.prototype.constructor = Enemy;

    Enemy.prototype.beginTelegraph = function (player) {
        var dx = player.x - this.x;
        var dy = player.y - this.y;
        var length = Math.hypot(dx, dy) || 1;
        this.attackDirX = dx / length;
        this.attackDirY = dy / length;
        this.attackTargetX = player.x;
        this.attackTargetY = player.y;
        this.telegraphTimer = this.telegraphDuration;
        this.telegraph.active = true;
        this.telegraph.progress = 0;
        this.telegraph.x = player.x;
        this.telegraph.y = player.y;
        this.telegraph.radius = this.attackRange;
        this.setState('telegraph');
        setFacing(this, dx, dy);
    };

    Enemy.prototype.beginAttack = function () {
        this.telegraph.active = false;
        this.telegraph.progress = 1;
        this.attackTimer = this.attackDuration;
        this.attackDidHit = false;
        this.setState('attack');
    };

    Enemy.prototype.attackHit = function (player) {
        this.attackDidHit = true;
        if (!player || player.exhausted || typeof player.takeDamage !== 'function') return;
        var hitDistance = distance(this.x, this.y, player.x, player.y);
        var verticalAllowance = Math.abs(finite(player.altitude, 0) - this.altitude);
        if (hitDistance <= this.attackRange + finite(player.radius, 16) && verticalAllowance < 30) {
            player.takeDamage(this.attackDamage, {
                type: this.sparring ? 'sparring' : 'dispel',
                nonlethal: true,
                enemy: this,
                x: this.x,
                y: this.y,
                knockback: this.sparring ? 115 : 145
            });
        }
    };

    Enemy.prototype.chooseWanderTarget = function () {
        if (this.waypoints.length) {
            var point = this.waypoints[this.routeIndex % this.waypoints.length];
            this.targetX = point.x;
            this.targetY = point.y;
            this.routeWait = point.wait;
            this.routeIndex = (this.routeIndex + 1) % this.waypoints.length;
        } else {
            var angle = random(this) * TAU;
            var radius = (0.25 + random(this) * 0.75) * this.wanderRadius;
            this.targetX = this.homeX + Math.cos(angle) * radius;
            this.targetY = this.homeY + Math.sin(angle) * radius;
            this.routeWait = 1.2 + random(this) * 2.6;
        }
        this.hasTarget = true;
    };

    Enemy.prototype.drive = function (targetX, targetY, speed, dt) {
        var dx = targetX - this.x;
        var dy = targetY - this.y;
        var length = Math.hypot(dx, dy);
        if (length < 0.001) {
            this.vx = approach(this.vx, 0, 600 * dt);
            this.vy = approach(this.vy, 0, 600 * dt);
            return moveActor(this, (this.vx + this.knockbackX) * dt, (this.vy + this.knockbackY) * dt);
        }
        var desired = Math.min(speed, Math.max(25, length * 2.4));
        this.vx = approach(this.vx, dx / length * desired, 620 * dt);
        this.vy = approach(this.vy, dy / length * desired, 620 * dt);
        setFacing(this, dx, dy);
        var movement = moveActor(this, (this.vx + this.knockbackX) * dt, (this.vy + this.knockbackY) * dt);
        if (movement.blockedX) this.vx = 0;
        if (movement.blockedY) this.vy = 0;
        return movement;
    };

    Enemy.prototype.update = function (dt) {
        dt = deltaTime(dt);
        if (dt <= 0 || this.removed) return;
        this.tick(dt);
        decayKnockback(this, dt);
        this.restoreEnergy(9 * dt);

        if (this.defeated) {
            this.dissipateTimer = Math.max(0, this.dissipateTimer - dt);
            this.dissolveProgress = clamp(1 - this.dissipateTimer / this.dissipateDuration, 0, 1);
            this.dissolve = this.dissolveProgress;
            this.alpha = 1 - this.dissolveProgress;
            this.opacity = this.alpha;
            this.altitude += 18 * dt;
            this.z = this.altitude;
            this.speed = 0;
            this.setState('dissipating');
            this.updateAnimation(dt, false);
            if (this.dissipateTimer === 0) {
                this.dead = true;
                this.removed = true;
                this.visible = false;
            }
            return;
        }

        this.attackCooldown = Math.max(0, this.attackCooldown - dt);
        var player = this.game && this.game.player;
        var playerDistance = player ? distance(this.x, this.y, player.x, player.y) : Infinity;
        var homeDistance = distance(this.x, this.y, this.homeX, this.homeY);
        var movement = { dx: 0, dy: 0 };

        if (this.hurtTimer > 0) {
            this.hurtTimer = Math.max(0, this.hurtTimer - dt);
            movement = moveActor(this, (this.vx + this.knockbackX) * dt, (this.vy + this.knockbackY) * dt);
            this.vx = approach(this.vx, 0, 760 * dt);
            this.vy = approach(this.vy, 0, 760 * dt);
            this.setState('hurt');
            if (this.hurtTimer === 0) this.recoverTimer = Math.max(this.recoverTimer, 0.18);
        } else if (this.state === 'telegraph') {
            this.telegraphTimer = Math.max(0, this.telegraphTimer - dt);
            this.telegraph.progress = clamp(1 - this.telegraphTimer / this.telegraphDuration, 0, 1);
            this.vx = approach(this.vx, 0, 900 * dt);
            this.vy = approach(this.vy, 0, 900 * dt);
            movement = moveActor(this, this.knockbackX * dt, this.knockbackY * dt);
            if (this.telegraphTimer === 0) this.beginAttack();
        } else if (this.state === 'attack') {
            this.attackTimer = Math.max(0, this.attackTimer - dt);
            if (!this.attackDidHit && this.attackTimer <= this.attackDuration * 0.68) this.attackHit(player);
            this.vx = this.attackDirX * (this.sparring ? 260 : 235);
            this.vy = this.attackDirY * (this.sparring ? 260 : 235);
            movement = moveActor(this, this.vx * dt, this.vy * dt);
            if (this.attackTimer === 0) {
                this.attackCooldown = this.attackCooldownDuration;
                this.recoverTimer = 0.34;
                this.setState('cooldown');
            }
        } else if (this.recoverTimer > 0) {
            this.recoverTimer = Math.max(0, this.recoverTimer - dt);
            this.vx = approach(this.vx, 0, 650 * dt);
            this.vy = approach(this.vy, 0, 650 * dt);
            movement = moveActor(this, (this.vx + this.knockbackX) * dt, (this.vy + this.knockbackY) * dt);
            this.setState('cooldown');
        } else {
            var canEngage = player && !player.exhausted && (this.aggro || this.provoked);
            if (canEngage && playerDistance > this.loseRange && !this.provoked) canEngage = false;
            if (canEngage && homeDistance > this.leashRange && playerDistance > this.detectionRange * 0.7) canEngage = false;

            if (canEngage && playerDistance <= this.loseRange) {
                if (playerDistance <= this.attackRange + finite(player.radius, 16) && this.attackCooldown <= 0) {
                    this.beginTelegraph(player);
                } else if (playerDistance > this.attackRange * 0.78) {
                    this.setState('chase');
                    movement = this.drive(player.x, player.y, this.moveSpeed, dt);
                } else {
                    this.setState('chase');
                    this.vx = approach(this.vx, 0, 500 * dt);
                    this.vy = approach(this.vy, 0, 500 * dt);
                    setFacing(this, player.x - this.x, player.y - this.y);
                }
            } else if (homeDistance > 12 && (this.provoked || (!this.waypoints.length && !this.hasTarget && homeDistance > this.wanderRadius))) {
                this.provoked = false;
                this.setState('return');
                movement = this.drive(this.homeX, this.homeY, this.moveSpeed * 0.72, dt);
            } else if (this.waitTimer > 0) {
                this.waitTimer = Math.max(0, this.waitTimer - dt);
                this.vx = approach(this.vx, 0, 500 * dt);
                this.vy = approach(this.vy, 0, 500 * dt);
                this.setState('idle');
            } else {
                if (!this.hasTarget) this.chooseWanderTarget();
                var targetDistance = distance(this.x, this.y, this.targetX, this.targetY);
                if (targetDistance < 5) {
                    this.hasTarget = false;
                    this.waitTimer = this.routeWait || 1.5;
                    this.setState('idle');
                } else {
                    this.setState('walk');
                    movement = this.drive(this.targetX, this.targetY, this.moveSpeed * 0.34, dt);
                    if (movement.blockedX || movement.blockedY) this.hasTarget = false;
                }
            }
        }

        this.speed = Math.hypot(movement.dx, movement.dy) / dt;
        this.actualSpeed = this.speed;
        this.z = this.altitude;
        this.updateAnimation(dt, this.speed > 3);
    };

    Enemy.prototype.takeDamage = function (amount, source) {
        if (this.defeated || this.invulnerable || this.invulnerableTimer > 0) return 0;
        var damage = Math.max(0, finite(amount, 0));
        if (damage <= 0 || this.health <= 0) return 0;
        var actual = Math.min(damage, this.health);
        this.health = Math.max(0, this.health - actual);
        this.hitFlash = 0.16;
        this.invulnerableTimer = 0.14;
        this.invulnTimer = this.invulnerableTimer;
        this.provoked = true;
        this.telegraph.active = false;
        this.telegraphTimer = 0;
        this.attackCooldown = Math.max(this.attackCooldown, 0.45);
        applyKnockback(this, source, 110);
        if (this.health <= 0) this.disperse(source);
        else {
            this.hurtTimer = 0.23;
            this.setState('hurt', 0.23);
        }
        return actual;
    };

    Enemy.prototype.disperse = function () {
        if (this.defeated) return;
        this.defeated = true;
        this.health = 0;
        this.vx = 0;
        this.vy = 0;
        this.knockbackX = 0;
        this.knockbackY = 0;
        this.telegraph.active = false;
        this.dissipateTimer = this.dissipateDuration;
        this.dissolveProgress = 0;
        this.dissolve = 0;
        this.setState('dissipating');
        var story = this.game && this.game.story;
        if (!this._defeatNotified && story && typeof story.onEnemyDefeated === 'function') {
            this._defeatNotified = true;
            story.onEnemyDefeated(this);
        }
        var vfx = this.game && this.game.vfx;
        if (vfx && typeof vfx.emit === 'function') vfx.emit('dispel', this.x, this.y, { actor: this, nonlethal: true });
    };

    Enemy.prototype.draw = function (ctx) {
        if (!ctx || !this.visible) return;
        if (this.telegraph.active && !this.defeated) {
            var progress = this.telegraph.progress;
            ctx.save();
            ctx.globalAlpha *= 0.45 + progress * 0.45;
            ctx.strokeStyle = this.sparring ? '#8fd8c2' : '#f2c879';
            ctx.fillStyle = this.sparring ? 'rgba(104, 196, 169, 0.09)' : 'rgba(239, 176, 90, 0.11)';
            ctx.lineWidth = 2 + progress * 1.5;
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.attackRange * (1.08 - progress * 0.18), 0, TAU);
            ctx.fill();
            ctx.stroke();
            ctx.setLineDash([5, 7]);
            ctx.beginPath();
            ctx.moveTo(this.x, this.y);
            ctx.lineTo(this.attackTargetX, this.attackTargetY);
            ctx.stroke();
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(this.attackTargetX, this.attackTargetY, 9 + (1 - progress) * 12, 0, TAU);
            ctx.stroke();
            ctx.restore();
        }
        Actor.prototype.draw.call(this, ctx);
        if (!this.defeated && (this.health < this.maxHealth || this.state === 'chase' || this.state === 'telegraph')) {
            var width = 46;
            var ratio = clamp(this.health / this.maxHealth, 0, 1);
            ctx.save();
            ctx.globalAlpha *= 0.82;
            ctx.fillStyle = 'rgba(24, 39, 37, 0.58)';
            ctx.fillRect(this.x - width / 2, this.y - 66 - this.altitude, width, 5);
            ctx.fillStyle = this.sparring ? '#9fe0c4' : '#eed49a';
            ctx.fillRect(this.x - width / 2 + 1, this.y - 65 - this.altitude, (width - 2) * ratio, 3);
            ctx.restore();
        }
    };

    LXH.Player = Player;
    LXH.NPC = NPC;
    LXH.Enemy = Enemy;
})(window);
