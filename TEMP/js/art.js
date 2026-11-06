(function (window) {
  "use strict";

  var LXH = window.LXH = window.LXH || {};
  var TAU = Math.PI * 2;
  var DEFAULT_INK = "#29383b";

  function finite(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function hash(value) {
    var n = typeof value === "number" ? value : seed(value);
    var x = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
    return x - Math.floor(x);
  }

  function seed(value) {
    var text = String(value == null ? "leaf" : value);
    var result = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      result ^= text.charCodeAt(i);
      result = Math.imul(result, 16777619);
    }
    return (result >>> 0) / 4294967296;
  }

  function canonical(value) {
    var text = String(value == null ? "" : value).toLowerCase().replace(/[\s_\-]+/g, "");
    var table = [
      ["heixiu", ["heixiu", "heixiu", "嘿咻", "黑咻"]],
      ["xiaohei", ["xiaohei", "luoxiaohei", "罗小黑", "小黑", "player"]],
      ["wuxian", ["wuxian", "无限"]],
      ["xiaobai", ["xiaobai", "luoxiaobai", "罗小白", "小白"]],
      ["agen", ["agen", "阿根", "罗根"]],
      ["fengxi", ["fengxi", "风息"]],
      ["luozhu", ["luozhu", "洛竹"]],
      ["xuhuai", ["xuhuai", "虚淮"]],
      ["tianhu", ["tianhu", "天虎"]],
      ["laojun", ["laojun", "老君"]]
    ];
    for (var i = 0; i < table.length; i += 1) {
      for (var j = 0; j < table[i][1].length; j += 1) {
        var alias = table[i][1][j].toLowerCase().replace(/[\s_\-]+/g, "");
        if (text === alias || (alias.length > 2 && text.indexOf(alias) !== -1)) {
          return table[i][0];
        }
      }
    }
    return text || "villager";
  }

  function actorId(actor) {
    if (typeof actor === "string") {
      return canonical(actor);
    }
    actor = actor || {};
    return canonical(actor.characterId || actor.character || (actor.definition && actor.definition.id) || actor.id || actor.name);
  }

  var PALETTES = {
    villager: {
      outline: "#314044", skin: "#edc5a2", skinShade: "#d99d7d", hair: "#51423b",
      hairShade: "#332f31", eye: "#33454a", primary: "#829c87", secondary: "#e8dfbf",
      accent: "#c77c62", pants: "#4c5b58", shoes: "#443f3a", fur: "#354248", inner: "#b8d7b2"
    },
    xiaohei: {
      outline: "#26363a", skin: "#f0c8a7", skinShade: "#dba184", hair: "#f1eee2",
      hairShade: "#cbd7cf", eye: "#4b9d91", primary: "#334c50", secondary: "#e8e3cc",
      accent: "#d5ae55", pants: "#e5ddc5", shoes: "#344348", fur: "#202c32", inner: "#b9d9ae"
    },
    wuxian: {
      outline: "#293a43", skin: "#eac3a5", skinShade: "#cb957d", hair: "#243b4b",
      hairShade: "#162c3b", eye: "#416b7b", primary: "#446f82", secondary: "#e5e9df",
      accent: "#9ebfc0", pants: "#344d5c", shoes: "#293b43", fur: "#243b4b", inner: "#b8d6d1"
    },
    xiaobai: {
      outline: "#483b38", skin: "#f2c6a6", skinShade: "#dfa088", hair: "#9b5f43",
      hairShade: "#754333", eye: "#684b3d", primary: "#d97972", secondary: "#f4ead8",
      accent: "#6ba8ad", pants: "#b56b5c", shoes: "#775447", fur: "#9b5f43", inner: "#f1c2a4"
    },
    agen: {
      outline: "#3e3b38", skin: "#edc19d", skinShade: "#d4997c", hair: "#343536",
      hairShade: "#24282a", eye: "#4a4c46", primary: "#eee8d7", secondary: "#f5efdf",
      accent: "#82b4c1", pants: "#9a7654", shoes: "#65513f", fur: "#343536", inner: "#c4d7c4"
    },
    fengxi: {
      outline: "#302d3c", skin: "#d4b39f", skinShade: "#b88c82", hair: "#40334f",
      hairShade: "#281f38", eye: "#8c6b9d", primary: "#494252", secondary: "#67616b",
      accent: "#819b68", pants: "#35333e", shoes: "#302e37", fur: "#302b3c", inner: "#a5839c"
    },
    luozhu: {
      outline: "#3d3b36", skin: "#e6b995", skinShade: "#c88e73", hair: "#72503b",
      hairShade: "#4d382e", eye: "#58704c", primary: "#858982", secondary: "#a7aaa0",
      accent: "#b9574d", pants: "#353c3b", shoes: "#4a443b", fur: "#72503b", inner: "#c5d5a8"
    },
    xuhuai: {
      outline: "#344850", skin: "#d6ded7", skinShade: "#a9c5c4", hair: "#a8d1d5",
      hairShade: "#6f9fae", eye: "#537f91", primary: "#558a99", secondary: "#8eb7bd",
      accent: "#d3c68f", pants: "#416875", shoes: "#3a5963", fur: "#a8d1d5", inner: "#d0e6df"
    },
    tianhu: {
      outline: "#443a30", skin: "#d9a759", skinShade: "#b77d43", hair: "#4a3b2e",
      hairShade: "#322d29", eye: "#493c31", primary: "#d5a24e", secondary: "#edcf8d",
      accent: "#8b6545", pants: "#464642", shoes: "#3c3a34", fur: "#d6a14d", inner: "#f0d49b"
    },
    laojun: {
      outline: "#2c4149", skin: "#e8c3a5", skinShade: "#c99780", hair: "#477f96",
      hairShade: "#2c5c72", eye: "#355d6d", primary: "#356273", secondary: "#527f8b",
      accent: "#77b8c6", pants: "#304f5d", shoes: "#2e4650", fur: "#477f96", inner: "#b9d9d6"
    }
  };

  function palette(actor, id) {
    actor = actor || {};
    var result = Object.assign({}, PALETTES[id] || PALETTES.villager);
    if (actor.npcColor || actor.color) {
      result.primary = actor.npcColor || actor.color;
    }
    if (actor.secondaryColor) {
      result.secondary = actor.secondaryColor;
    }
    if (actor.hairColor) {
      result.hair = actor.hairColor;
    }
    if (actor.skinColor) {
      result.skin = actor.skinColor;
    }
    if (actor.colors && typeof actor.colors === "object") {
      Object.assign(result, actor.colors);
    }
    if (actor.palette && typeof actor.palette === "object") {
      Object.assign(result, actor.palette);
    }
    if (id === "xiaohei" && (actor.blackHair || /black|黑发/i.test(String(actor.variant || actor.hair || "")))) {
      result.hair = "#29353a";
      result.hairShade = "#18272d";
    }
    return result;
  }

  function samples(points, closed, steps) {
    var output = [];
    var count = points.length;
    if (count < 2) {
      return points.slice();
    }
    steps = steps || 2;
    var segments = closed ? count : count - 1;
    for (var i = 0; i < segments; i += 1) {
      var p0 = points[closed ? (i - 1 + count) % count : Math.max(0, i - 1)];
      var p1 = points[i];
      var p2 = points[(i + 1) % count];
      var p3 = points[closed ? (i + 2) % count : Math.min(count - 1, i + 2)];
      for (var j = 0; j < steps; j += 1) {
        var t = j / steps;
        var t2 = t * t;
        var t3 = t2 * t;
        output.push([
          0.5 * ((2 * p1[0]) + (-p0[0] + p2[0]) * t + (2 * p0[0] - 5 * p1[0] + 4 * p2[0] - p3[0]) * t2 + (-p0[0] + 3 * p1[0] - 3 * p2[0] + p3[0]) * t3),
          0.5 * ((2 * p1[1]) + (-p0[1] + p2[1]) * t + (2 * p0[1] - 5 * p1[1] + 4 * p2[1] - p3[1]) * t2 + (-p0[1] + 3 * p1[1] - 3 * p2[1] + p3[1]) * t3)
        ]);
      }
    }
    if (!closed) {
      output.push(points[count - 1].slice());
    } else {
      output.push(output[0].slice());
    }
    return output;
  }

  function trace(ctx, points) {
    if (!points.length) {
      return;
    }
    ctx.beginPath();
    ctx.moveTo(points[0][0], points[0][1]);
    for (var i = 1; i < points.length; i += 1) {
      ctx.lineTo(points[i][0], points[i][1]);
    }
  }

  function inkSamples(ctx, points, color, width, salt) {
    if (points.length < 2 || width <= 0) {
      return;
    }
    ctx.save();
    ctx.strokeStyle = color || DEFAULT_INK;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (var i = 0; i < points.length - 1; i += 1) {
      var pressure = 0.76 + hash(salt + i * 0.73) * 0.42 + Math.sin((i + salt) * 0.61) * 0.08;
      ctx.lineWidth = Math.max(0.2, width * pressure);
      ctx.globalAlpha = 0.76 + hash(salt * 2.1 + i) * 0.2;
      ctx.beginPath();
      ctx.moveTo(points[i][0], points[i][1]);
      ctx.lineTo(points[i + 1][0], points[i + 1][1]);
      ctx.stroke();
    }
    ctx.restore();
  }

  function paint(ctx, points, options) {
    options = options || {};
    var closed = options.closed !== false;
    var curve = samples(points, closed, options.steps || 2);
    ctx.save();
    if (options.alpha != null) {
      ctx.globalAlpha *= options.alpha;
    }
    if (options.fill) {
      trace(ctx, curve);
      if (closed) {
        ctx.closePath();
      }
      ctx.fillStyle = options.fill;
      ctx.globalAlpha *= options.fillAlpha == null ? 0.9 : options.fillAlpha;
      ctx.fill();
      if (options.wash) {
        ctx.save();
        ctx.translate(hash(options.seed + 4) * 1.4 - 0.7, hash(options.seed + 8) * 1.4 - 0.7);
        trace(ctx, curve);
        if (closed) {
          ctx.closePath();
        }
        ctx.fillStyle = options.wash;
        ctx.globalAlpha = 0.16;
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
    if (options.stroke !== false) {
      inkSamples(ctx, curve, options.stroke || DEFAULT_INK, finite(options.width, 1.25), finite(options.seed, 1));
    }
  }

  function stroke(ctx, points, color, width, salt) {
    inkSamples(ctx, samples(points, false, 3), color || DEFAULT_INK, finite(width, 1), finite(salt, 1));
  }

  function ellipsePoints(cx, cy, rx, ry, count, wobble, salt) {
    var points = [];
    count = count || 12;
    wobble = wobble == null ? 0.045 : wobble;
    for (var i = 0; i < count; i += 1) {
      var angle = i / count * TAU;
      var w = 1 + (hash(salt + i * 1.31) - 0.5) * wobble * 2;
      points.push([cx + Math.cos(angle) * rx * w, cy + Math.sin(angle) * ry * w]);
    }
    return points;
  }

  function blob(ctx, cx, cy, rx, ry, options) {
    options = options || {};
    paint(ctx, ellipsePoints(cx, cy, rx, ry, options.vertices || 12, finite(options.wobble, 0.045), finite(options.seed, 1)), options);
  }

  function dot(ctx, x, y, radius, color, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha == null ? 1 : alpha;
    blob(ctx, x, y, radius, radius, {fill: color, stroke: false, vertices: 8, wobble: 0.08, seed: x + y});
    ctx.restore();
  }

  function shadow(ctx, x, y, rx, ry, alpha) {
    ctx.save();
    ctx.globalAlpha *= alpha == null ? 0.18 : alpha;
    blob(ctx, x, y, rx, ry, {fill: "#203b38", stroke: false, vertices: 16, wobble: 0.04, seed: rx + ry});
    ctx.restore();
  }

  function leaf(ctx, x, y, length, width, angle, color, salt) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    paint(ctx, [[0, 0], [width, -length * 0.38], [0, -length], [-width, -length * 0.38]], {
      fill: color, wash: "#e8e4a9", stroke: "#3d5d4d", width: 0.65, seed: salt, vertices: 8
    });
    stroke(ctx, [[0, -1], [0, -length * 0.78]], "#60765b", 0.45, salt + 3);
    ctx.restore();
  }

  function stateOf(actor) {
    var state = String(actor.state || actor.action || "").toLowerCase();
    if (actor.flying || /fly|flying|flight|飞行|悬浮/.test(state)) {
      return "fly";
    }
    if (/hit|hurt|damage|injur|受击|受伤/.test(state)) {
      return "hit";
    }
    if (/cast|spell|metal|teleport|attack|skill|施法|御金|传送/.test(state)) {
      return "cast";
    }
    if (/run|running|dash|sprint|奔|跑/.test(state)) {
      return "run";
    }
    if (/walk|move|walking|走/.test(state)) {
      return "walk";
    }
    var speed = Math.hypot(finite(actor.vx, 0), finite(actor.vy, 0));
    if (speed > 170) {
      return "run";
    }
    if (speed > 4) {
      return "walk";
    }
    return "idle";
  }

  function basePose() {
    return {
      rootX: 0, rootY: 0, body: 0, head: 0,
      upperArmL: 0.08, forearmL: -0.12, upperArmR: -0.08, forearmR: 0.12,
      thighL: 0.02, shinL: 0, thighR: -0.02, shinR: 0,
      tail1: -1.92, tail2: 0.25, tail3: 0.22, earL: -0.08, earR: 0.08,
      expression: "calm"
    };
  }

  function boneNumber(bones, names, fallback) {
    if (!bones) {
      return fallback;
    }
    for (var i = 0; i < names.length; i += 1) {
      var value = bones[names[i]];
      if (typeof value === "number" && isFinite(value)) {
        return value;
      }
      if (value && typeof value.angle === "number") {
        return value.angle;
      }
      if (value && typeof value.rotation === "number") {
        return value.rotation;
      }
    }
    return fallback;
  }

  function applyBones(pose, bones) {
    if (!bones || typeof bones !== "object") {
      return pose;
    }
    var names = {
      rootX: ["rootX", "x"], rootY: ["rootY", "y", "lift"], body: ["body", "torso", "spine"], head: ["head", "neck"],
      upperArmL: ["upperArmL", "armL", "leftUpperArm"], forearmL: ["forearmL", "elbowL", "leftForearm"],
      upperArmR: ["upperArmR", "armR", "rightUpperArm"], forearmR: ["forearmR", "elbowR", "rightForearm"],
      thighL: ["thighL", "legL", "leftThigh"], shinL: ["shinL", "kneeL", "leftShin"],
      thighR: ["thighR", "legR", "rightThigh"], shinR: ["shinR", "kneeR", "rightShin"],
      tail1: ["tail1", "tail"], tail2: ["tail2"], tail3: ["tail3"], earL: ["earL", "leftEar"], earR: ["earR", "rightEar"]
    };
    Object.keys(names).forEach(function (key) {
      pose[key] = boneNumber(bones, names[key], pose[key]);
    });
    var nested = [
      ["leftArm", "upper", "upperArmL"], ["leftArm", "lower", "forearmL"],
      ["rightArm", "upper", "upperArmR"], ["rightArm", "lower", "forearmR"],
      ["leftLeg", "upper", "thighL"], ["leftLeg", "lower", "shinL"],
      ["rightLeg", "upper", "thighR"], ["rightLeg", "lower", "shinR"],
      ["tail", "base", "tail1"], ["tail", "middle", "tail2"], ["tail", "tip", "tail3"]
    ];
    nested.forEach(function (entry) {
      if (bones[entry[0]]) {
        pose[entry[2]] = boneNumber(bones[entry[0]], [entry[1], "angle", "rotation"], pose[entry[2]]);
      }
    });
    return pose;
  }

  function poseFor(actor, time, id) {
    var pose = basePose();
    var state = stateOf(actor);
    var salt = seed(actorId(actor) + String(actor.id || actor.name || ""));
    var phase = finite(actor.animationPhase, time * (state === "run" ? 11 : state === "walk" ? 7 : 2.1));
    var stride = Math.sin(phase);
    var opposite = Math.sin(phase + Math.PI);
    var breath = Math.sin(time * 2.15 + salt * TAU);
    pose.tail1 += Math.sin(time * 2.4 + salt * 5) * 0.18 + stride * 0.06;
    pose.tail2 += Math.sin(time * 2.9 + salt * 7 + 0.8) * 0.22;
    pose.tail3 += Math.sin(time * 3.4 + salt * 9 + 1.6) * 0.25;
    pose.earL += Math.sin(time * 3.1 + salt * 8) * 0.055;
    pose.earR += Math.sin(time * 2.7 + salt * 6 + 1) * 0.055;
    if (state === "walk" || state === "run") {
      var amount = state === "run" ? 0.88 : 0.5;
      pose.rootY = -Math.abs(Math.sin(phase)) * (state === "run" ? 2.8 : 1.25);
      pose.body = state === "run" ? 0.16 : 0.055;
      pose.head = -pose.body * 0.5 + opposite * 0.035;
      pose.thighL = stride * amount;
      pose.thighR = opposite * amount;
      pose.shinL = Math.max(0, -stride) * (state === "run" ? 1.15 : 0.68);
      pose.shinR = Math.max(0, stride) * (state === "run" ? 1.15 : 0.68);
      pose.upperArmL = opposite * amount * 0.82 + 0.08;
      pose.upperArmR = stride * amount * 0.82 - 0.08;
      pose.forearmL = state === "run" ? -0.72 : -0.18;
      pose.forearmR = state === "run" ? 0.72 : 0.18;
      pose.tail1 -= pose.body * 1.8;
    } else if (state === "cast") {
      var cast = 0.5 + 0.5 * Math.sin(phase * 0.7);
      pose.rootY = -0.7;
      pose.body = -0.075;
      pose.head = 0.12;
      pose.upperArmR = -1.38 + cast * 0.09;
      pose.forearmR = -0.22;
      pose.upperArmL = -0.86 + cast * 0.08;
      pose.forearmL = -0.68;
      pose.thighL = 0.2;
      pose.thighR = -0.24;
      pose.shinL = 0.12;
      pose.shinR = 0.18;
      pose.tail1 -= 0.22;
      pose.expression = "focus";
    } else if (state === "hit") {
      pose.rootX = -2.6;
      pose.rootY = 1.4;
      pose.body = -0.27;
      pose.head = 0.38;
      pose.upperArmL = 0.95;
      pose.forearmL = 0.48;
      pose.upperArmR = -1.02;
      pose.forearmR = -0.35;
      pose.thighL = -0.34;
      pose.shinL = 0.62;
      pose.thighR = 0.27;
      pose.shinR = 0.35;
      pose.tail1 += 0.65;
      pose.earL -= 0.32;
      pose.earR += 0.32;
      pose.expression = "hurt";
    } else if (state === "fly") {
      pose.rootY = -8 + breath * 1.3;
      pose.body = 0.12 + breath * 0.025;
      pose.head = -0.12;
      pose.upperArmL = 1.15 + breath * 0.1;
      pose.upperArmR = -1.15 - breath * 0.1;
      pose.forearmL = 0.18;
      pose.forearmR = -0.18;
      pose.thighL = 0.24 + stride * 0.08;
      pose.thighR = -0.18 - stride * 0.08;
      pose.shinL = 0.5;
      pose.shinR = 0.38;
      pose.tail1 -= 0.38 + breath * 0.08;
      pose.tail2 -= 0.18;
      pose.expression = "calm";
    } else {
      pose.rootY = breath * 0.45;
      pose.body = breath * 0.018;
      pose.head = -breath * 0.035;
      pose.upperArmL += breath * 0.035;
      pose.upperArmR -= breath * 0.035;
      if (id === "laojun") {
        pose.rootY = -5 + breath * 1.25;
        pose.upperArmL = 0.32 + breath * 0.05;
        pose.upperArmR = -0.32 - breath * 0.05;
        pose.expression = "smile";
      }
    }
    return applyBones(pose, actor.bones);
  }

  function facing(actor) {
    var value = actor.facing;
    var sign = 1;
    if (typeof value === "number") {
      sign = value < 0 ? -1 : 1;
    } else if (/left|west|左/i.test(String(value))) {
      sign = -1;
    }
    if (actor.flipX) {
      sign *= -1;
    }
    return sign;
  }

  function capsule(ctx, length, width, color, options) {
    options = options || {};
    var w = width * 0.5;
    var points = [
      [-w * 0.72, 0], [w * 0.72, 0], [w, length * 0.18], [w * 0.88, length * 0.75],
      [w * 0.55, length], [-w * 0.55, length], [-w * 0.88, length * 0.75], [-w, length * 0.18]
    ];
    paint(ctx, points, {
      fill: color, wash: options.wash || "#f1e6ce", stroke: options.stroke || DEFAULT_INK,
      width: finite(options.lineWidth, 1.05), seed: finite(options.seed, 1), alpha: options.alpha
    });
  }

  function tail(ctx, pose, color, scale, salt) {
    var lengths = [12 * scale, 11 * scale, 9 * scale];
    var angles = [pose.tail1, pose.tail2, pose.tail3];
    var widths = [5.6 * scale, 4.5 * scale, 3.1 * scale];
    ctx.save();
    for (var i = 0; i < 3; i += 1) {
      ctx.rotate(angles[i]);
      capsule(ctx, lengths[i], widths[i], color, {stroke: DEFAULT_INK, lineWidth: 1.1, seed: salt + i, wash: "#728082"});
      ctx.translate(0, lengths[i] - 0.5);
    }
    ctx.restore();
  }

  function hand(ctx, color, cast, accent, salt) {
    blob(ctx, 0, 0.8, 3.2, 3.7, {fill: color, wash: "#f8dfbd", stroke: DEFAULT_INK, width: 0.9, seed: salt, vertices: 9});
    if (cast) {
      stroke(ctx, [[-2.2, 0], [-3.8, -2.8]], DEFAULT_INK, 0.65, salt + 1);
      stroke(ctx, [[0, -1], [0, -4.1]], DEFAULT_INK, 0.65, salt + 2);
      ctx.save();
      ctx.globalAlpha = 0.72;
      ctx.strokeStyle = accent;
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.ellipse(0, -4, 5.2, 2.1, -0.2, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
  }

  function arm(ctx, x, y, upper, lower, colors, id, side, cast, salt) {
    var robe = id === "wuxian" || id === "fengxi" || id === "xuhuai" || id === "laojun";
    var longSleeve = robe || id === "luozhu";
    var upperLength = id === "tianhu" ? 11 : 12;
    var lowerLength = id === "tianhu" ? 10 : 11;
    var width = id === "tianhu" ? 9 : robe ? 8.5 : 6.4;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(upper);
    capsule(ctx, upperLength, width, colors.primary, {seed: salt, wash: colors.secondary, stroke: colors.outline});
    if (robe) {
      paint(ctx, [[-width * 0.55, 4], [width * 0.55, 4], [width * 0.78, upperLength + 2], [-width * 0.78, upperLength + 2]], {
        fill: colors.primary, wash: colors.secondary, stroke: colors.outline, width: 0.9, seed: salt + 30
      });
    }
    ctx.translate(0, upperLength - 0.3);
    ctx.rotate(lower);
    capsule(ctx, lowerLength, longSleeve ? width * 0.8 : 4.7, longSleeve ? colors.secondary : colors.skin, {
      seed: salt + 1, wash: longSleeve ? colors.primary : "#f5d5b3", stroke: colors.outline, lineWidth: 0.9
    });
    if (id === "luozhu") {
      stroke(ctx, [[-2.8, 3], [2.8, 3]], colors.accent, 1.5, salt + 8);
      stroke(ctx, [[-2.8, 6], [2.8, 6]], colors.accent, 1.2, salt + 9);
    }
    if (id === "xiaohei" && side === "R") {
      stroke(ctx, [[-2.5, 3.3], [2.5, 3.3]], colors.accent, 1.4, salt + 7);
    }
    ctx.translate(0, lowerLength - 0.2);
    hand(ctx, colors.skin, cast, colors.accent, salt + 2);
    ctx.restore();
  }

  function leg(ctx, x, y, upper, lower, colors, id, side, salt) {
    var upperLength = id === "tianhu" ? 11 : 13;
    var lowerLength = id === "tianhu" ? 10 : 12;
    var width = id === "tianhu" ? 11 : id === "laojun" ? 8 : 7.2;
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(upper);
    capsule(ctx, upperLength, width, colors.pants, {seed: salt, wash: colors.secondary, stroke: colors.outline});
    ctx.translate(0, upperLength - 0.25);
    ctx.rotate(lower);
    capsule(ctx, lowerLength, width * 0.82, colors.pants, {seed: salt + 1, wash: colors.secondary, stroke: colors.outline, lineWidth: 0.9});
    ctx.translate(0, lowerLength - 0.2);
    ctx.rotate(-(upper + lower) * 0.78);
    blob(ctx, 1.7, 0.2, id === "tianhu" ? 6.5 : 5.1, id === "tianhu" ? 3.4 : 2.8, {
      fill: colors.shoes, wash: colors.secondary, stroke: colors.outline, width: 0.9, seed: salt + 2, vertices: 10
    });
    if (id === "agen") {
      stroke(ctx, [[-2.8, -0.2], [4.8, -0.2]], "#b89a71", 0.8, salt + 4);
    }
    ctx.restore();
  }

  function costume(ctx, colors, id, pose, salt) {
    var broad = id === "tianhu";
    var robe = id === "wuxian" || id === "fengxi" || id === "xuhuai" || id === "laojun";
    var rx = broad ? 15 : robe ? 10.5 : 9;
    var bottom = robe ? 10 : 1;
    paint(ctx, [[-rx * 0.72, -25], [rx * 0.72, -25], [rx, -17], [rx * 0.9, bottom], [0, bottom + 2], [-rx * 0.9, bottom], [-rx, -17]], {
      fill: colors.primary, wash: colors.secondary, stroke: colors.outline, width: 1.35, seed: salt
    });
    if (id === "xiaohei") {
      paint(ctx, [[-5.8, -23], [1, -21], [4.5, -3], [-3.8, -1]], {fill: "#405c5e", stroke: false, seed: salt + 2, alpha: 0.7});
      stroke(ctx, [[-7.5, -3], [7.5, -3]], colors.accent, 1.1, salt + 3);
    } else if (id === "wuxian") {
      paint(ctx, [[-6, -24], [0, -17], [6, -24], [4, 5], [-4, 5]], {fill: colors.secondary, wash: "#b8d0d0", stroke: colors.outline, width: 0.75, seed: salt + 1});
      stroke(ctx, [[-7, -22], [0, -14], [7, -22]], colors.accent, 1.5, salt + 2);
      stroke(ctx, [[-9, -1], [9, -1]], colors.accent, 2.1, salt + 3);
      stroke(ctx, [[4, 0], [6, 13]], colors.accent, 1.5, salt + 4);
    } else if (id === "xiaobai") {
      paint(ctx, [[-6, -22], [6, -22], [8, 5], [-8, 5]], {fill: colors.primary, wash: "#edaaa0", stroke: colors.outline, width: 0.9, seed: salt + 1});
      stroke(ctx, [[-4, -22], [-4, -15]], colors.secondary, 1.2, salt + 2);
      stroke(ctx, [[4, -22], [4, -15]], colors.secondary, 1.2, salt + 3);
      blob(ctx, 7.6, -1, 2.2, 2.6, {fill: colors.accent, stroke: colors.outline, width: 0.7, seed: salt + 4, vertices: 10});
      blob(ctx, 7.6, -1, 0.8, 1, {fill: "#d9ede0", stroke: false, seed: salt + 5, vertices: 8});
    } else if (id === "agen") {
      stroke(ctx, [[-5, -23], [-4, -14]], colors.skinShade, 0.8, salt + 2);
      stroke(ctx, [[5, -23], [4, -14]], colors.skinShade, 0.8, salt + 3);
    } else if (id === "fengxi") {
      stroke(ctx, [[-8, -20], [0, -11], [8, -20]], colors.secondary, 1.3, salt + 2);
      leaf(ctx, 0, -11, 5, 2.4, Math.PI, colors.accent, salt + 4);
    } else if (id === "luozhu") {
      stroke(ctx, [[-9, -2], [9, -2]], colors.accent, 3.2, salt + 2);
      paint(ctx, [[4, -1], [8, 0], [11, 13], [7, 12]], {fill: colors.accent, wash: "#e49b77", stroke: colors.outline, width: 0.8, seed: salt + 3});
    } else if (id === "xuhuai") {
      paint(ctx, [[-8, -21], [0, -14], [8, -21], [6, 6], [-6, 6]], {fill: colors.secondary, wash: colors.primary, stroke: colors.outline, width: 0.75, seed: salt + 1, alpha: 0.8});
      for (var i = 0; i < 5; i += 1) {
        blob(ctx, -5 + i * 2.7, -1 + Math.abs(2 - i) * 0.35, 1.45, 1.55, {fill: i === 2 ? colors.accent : "#b9d3cd", stroke: colors.outline, width: 0.5, seed: salt + i + 4, vertices: 8});
      }
    } else if (id === "tianhu") {
      blob(ctx, 0, -10, 12.2, 12, {fill: colors.primary, wash: colors.secondary, stroke: colors.outline, width: 1.1, seed: salt + 2});
      for (var b = 0; b < 7; b += 1) {
        var angle = Math.PI * 0.12 + b / 6 * Math.PI * 0.76;
        blob(ctx, Math.cos(angle) * 10, -20 + Math.sin(angle) * 8, 2, 2.2, {fill: b % 2 ? "#76563c" : colors.accent, stroke: colors.outline, width: 0.65, seed: salt + b + 6, vertices: 8});
      }
    } else if (id === "laojun") {
      paint(ctx, [[-10, -18], [-14, 8], [0, 14], [14, 8], [10, -18], [0, -11]], {fill: colors.primary, wash: colors.secondary, stroke: colors.outline, width: 0.9, seed: salt + 2, alpha: 0.72});
      stroke(ctx, [[-9, -1], [9, -1]], colors.accent, 1.1, salt + 4);
    } else {
      stroke(ctx, [[-7, -3], [7, -3]], colors.accent, 1.3, salt + 2);
    }
  }

  function ear(ctx, x, y, angle, colors, id, side, salt) {
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    if (id === "xuhuai") {
      paint(ctx, [[-2.8, 1], [-1.2, -10], [2.8, -13], [2.1, -3], [3, 1]], {
        fill: colors.hairShade, wash: colors.inner, stroke: colors.outline, width: 1, seed: salt
      });
    } else if (id === "fengxi") {
      var direction = side === "L" ? -1 : 1;
      paint(ctx, [[0, 2], [direction * 10, -3], [direction * 8, 4], [0, 6]], {
        fill: colors.skin, wash: colors.inner, stroke: colors.outline, width: 0.9, seed: salt
      });
    } else {
      var pointed = id === "xiaohei" || id === "tianhu";
      paint(ctx, pointed ? [[-5, 2], [-3.5, -10], [0, -14], [4.5, -7], [5, 2]] : [[-4, 1], [-3, -7], [0, -9], [4, -5], [4, 1]], {
        fill: id === "xiaohei" ? colors.fur : colors.hair, wash: colors.hairShade, stroke: colors.outline, width: 1.15, seed: salt
      });
      paint(ctx, [[-2.7, 0], [-1.8, -7], [0, -10], [2.5, -5], [2.8, 0]], {
        fill: colors.inner, stroke: false, seed: salt + 1, alpha: 0.86
      });
    }
    ctx.restore();
  }

  function eyes(ctx, colors, id, expression, time, salt) {
    var blink = Math.sin(time * 0.77 + salt * 9) > 0.985;
    var smile = expression === "smile" || id === "laojun";
    var hurt = expression === "hurt";
    var focus = expression === "focus" || id === "fengxi" || id === "wuxian";
    if (blink || smile || hurt) {
      stroke(ctx, [[-6.5, -13], [-4.3, -12.2], [-2.4, -13]], colors.outline, 1, salt + 1);
      stroke(ctx, [[2.4, -13], [4.3, -12.2], [6.5, -13]], colors.outline, 1, salt + 2);
      return;
    }
    var ry = focus ? 2.1 : 3.1;
    blob(ctx, -4.6, -13, 3.25, ry, {fill: "#f4f0df", stroke: colors.outline, width: 0.65, seed: salt + 2, vertices: 10, wobble: 0.02});
    blob(ctx, 4.6, -13, 3.25, ry, {fill: "#f4f0df", stroke: colors.outline, width: 0.65, seed: salt + 3, vertices: 10, wobble: 0.02});
    blob(ctx, -4.1, -12.8, 1.4, Math.min(2.25, ry), {fill: colors.eye, stroke: false, seed: salt + 4, vertices: 9, wobble: 0.01});
    blob(ctx, 4.1, -12.8, 1.4, Math.min(2.25, ry), {fill: colors.eye, stroke: false, seed: salt + 5, vertices: 9, wobble: 0.01});
    dot(ctx, -3.8, -13.5, 0.48, "#f7f4df");
    dot(ctx, 4.4, -13.5, 0.48, "#f7f4df");
    if (focus) {
      stroke(ctx, [[-7.4, -17], [-2.5, -15.8]], colors.outline, 1, salt + 6);
      stroke(ctx, [[2.5, -15.8], [7.4, -17]], colors.outline, 1, salt + 7);
    }
  }

  function hairBack(ctx, colors, id, salt) {
    if (id === "wuxian" || id === "fengxi" || id === "xuhuai" || id === "laojun") {
      var length = id === "laojun" ? 37 : id === "wuxian" ? 43 : 35;
      blob(ctx, 0, -7 + length * 0.25, 14, length * 0.65, {fill: colors.hairShade, wash: colors.hair, stroke: colors.outline, width: 1.2, seed: salt, vertices: 16, wobble: 0.07});
      for (var i = 0; i < 4; i += 1) {
        stroke(ctx, [[-9 + i * 6, -14], [-11 + i * 6, 5], [-9 + i * 5, length * 0.64]], colors.hair, 0.8, salt + i + 2);
      }
    }
    if (id === "xiaobai") {
      for (var side = -1; side <= 1; side += 2) {
        ctx.save();
        ctx.translate(side * 12, -13);
        ctx.rotate(side * 0.32);
        blob(ctx, 0, 3, 5.2, 9, {fill: colors.hair, wash: colors.hairShade, stroke: colors.outline, width: 1, seed: salt + side + 4, vertices: 11});
        stroke(ctx, [[-3, -2], [3, -2]], "#c86159", 1.8, salt + side + 7);
        ctx.restore();
      }
    }
    if (id === "luozhu") {
      ctx.save();
      ctx.translate(0, -24);
      ctx.rotate(0.45);
      blob(ctx, 0, -7, 5, 9, {fill: colors.hair, wash: colors.hairShade, stroke: colors.outline, width: 1, seed: salt + 4, vertices: 11});
      ctx.restore();
    }
  }

  function hairFront(ctx, colors, id, salt) {
    if (id === "tianhu") {
      return;
    }
    var spiky = id === "fengxi";
    var fluffy = id === "xiaohei" || id === "agen" || id === "villager";
    var points = spiky ? [[-13, -15], [-17, -23], [-10, -22], [-11, -31], [-4, -27], [0, -35], [5, -28], [12, -32], [11, -23], [17, -22], [12, -13], [7, -19], [2, -16], [-4, -21], [-8, -15]] :
      fluffy ? [[-13, -14], [-14, -23], [-10, -28], [-5, -29], [-1, -32], [4, -29], [9, -30], [14, -24], [13, -15], [8, -20], [5, -17], [1, -23], [-3, -17], [-8, -21]] :
      [[-13, -13], [-13, -24], [-8, -30], [0, -32], [9, -29], [14, -22], [12, -13], [8, -19], [4, -17], [0, -23], [-4, -18], [-9, -20]];
    paint(ctx, points, {fill: colors.hair, wash: colors.hairShade, stroke: colors.outline, width: 1.25, seed: salt});
    if (id === "wuxian") {
      paint(ctx, [[-1, -29], [5, -27], [10, -17], [6, -8], [3, -18], [-2, -21]], {fill: colors.hairShade, wash: colors.hair, stroke: colors.outline, width: 0.75, seed: salt + 2});
      blob(ctx, 1, -33, 5, 4, {fill: colors.hair, wash: colors.hairShade, stroke: colors.outline, width: 1, seed: salt + 3, vertices: 10});
    }
    if (id === "laojun") {
      stroke(ctx, [[-11, -24], [0, -26], [11, -24]], colors.accent, 1.2, salt + 4);
      blob(ctx, 0, -25.5, 1.8, 2, {fill: colors.accent, stroke: colors.outline, width: 0.55, seed: salt + 5, vertices: 8});
    }
  }

  function tigerHead(ctx, colors, pose, time, salt) {
    blob(ctx, 0, -14, 16, 14.2, {fill: colors.fur, wash: colors.secondary, stroke: colors.outline, width: 1.5, seed: salt, vertices: 14});
    for (var side = -1; side <= 1; side += 2) {
      stroke(ctx, [[side * 4, -25], [side * 2, -20]], colors.hairShade, 2.1, salt + side + 2);
      stroke(ctx, [[side * 13, -17], [side * 8, -15]], colors.hairShade, 2, salt + side + 4);
      stroke(ctx, [[side * 14, -11], [side * 9, -10]], colors.hairShade, 1.8, salt + side + 6);
    }
    stroke(ctx, [[0, -27], [0, -21]], colors.hairShade, 2.2, salt + 8);
    eyes(ctx, colors, "tianhu", pose.expression, time, salt + 10);
    blob(ctx, 0, -6.5, 8, 5, {fill: colors.inner, wash: "#f5e2b5", stroke: colors.outline, width: 0.8, seed: salt + 20, vertices: 12});
    blob(ctx, 0, -9.2, 2.1, 1.5, {fill: colors.outline, stroke: false, seed: salt + 21, vertices: 8});
    stroke(ctx, [[-3.5, -4.5], [0, -3.4], [3.5, -4.5]], colors.outline, 0.9, salt + 22);
    paint(ctx, [[-20, -23], [0, -39], [20, -23], [15, -18], [-15, -18]], {fill: "#b99b67", wash: "#dfc58c", stroke: colors.outline, width: 1.3, seed: salt + 23});
    for (var i = 0; i < 5; i += 1) {
      stroke(ctx, [[0, -36], [-16 + i * 8, -22]], "#8f7956", 0.55, salt + 25 + i);
    }
  }

  function head(ctx, colors, id, pose, time, salt) {
    hairBack(ctx, colors, id, salt);
    if (id === "xiaohei" || id === "tianhu") {
      ear(ctx, -9, -23, pose.earL - 0.08, colors, id, "L", salt + 1);
      ear(ctx, 9, -23, pose.earR + 0.08, colors, id, "R", salt + 2);
    }
    if (id === "xuhuai") {
      ear(ctx, -8, -24, pose.earL - 0.18, colors, id, "L", salt + 1);
      ear(ctx, 8, -24, pose.earR + 0.18, colors, id, "R", salt + 2);
    }
    if (id === "tianhu") {
      tigerHead(ctx, colors, pose, time, salt + 4);
      return;
    }
    capsule(ctx, 5, 5.5, colors.skin, {seed: salt + 3, stroke: colors.outline, lineWidth: 0.7});
    ctx.translate(0, -1);
    if (id === "fengxi") {
      ear(ctx, -12, -14, pose.earL, colors, id, "L", salt + 4);
      ear(ctx, 12, -14, pose.earR, colors, id, "R", salt + 5);
    }
    blob(ctx, 0, -14, id === "xiaobai" ? 12.8 : 13.2, id === "laojun" ? 12.8 : 13.5, {
      fill: colors.skin, wash: "#f6d6b6", stroke: colors.outline, width: 1.25, seed: salt + 6, vertices: 14, wobble: 0.035
    });
    hairFront(ctx, colors, id, salt + 7);
    eyes(ctx, colors, id, pose.expression, time, salt + 8);
    if (id === "agen") {
      ctx.save();
      ctx.strokeStyle = "#3e4441";
      ctx.lineWidth = 1.25;
      ctx.beginPath();
      ctx.ellipse(-4.8, -13, 4.8, 4.5, 0.05, 0, TAU);
      ctx.ellipse(4.8, -13, 4.8, 4.5, -0.05, 0, TAU);
      ctx.moveTo(-0.2, -13);
      ctx.lineTo(0.2, -13);
      ctx.stroke();
      ctx.restore();
      dot(ctx, -5.7, -14.6, 0.8, "#ffffff", 0.75);
      dot(ctx, 3.9, -14.6, 0.8, "#ffffff", 0.75);
    }
    if (id === "laojun") {
      stroke(ctx, [[-3.4, -7], [0, -5.7], [3.4, -7]], colors.outline, 0.9, salt + 20);
      for (var side = -1; side <= 1; side += 2) {
        blob(ctx, side * 14.2, -10, 3.2, 4.1, {fill: colors.accent, wash: "#c3e2d9", stroke: colors.outline, width: 0.9, seed: salt + 21 + side, vertices: 12});
        blob(ctx, side * 14.2, -10, 1.2, 1.7, {fill: "#d7e8d9", stroke: false, seed: salt + 24 + side, vertices: 9});
      }
    } else if (pose.expression === "hurt") {
      stroke(ctx, [[-2.8, -6], [0, -7.2], [2.8, -6]], colors.outline, 0.85, salt + 20);
    } else if (id === "xiaohei") {
      stroke(ctx, [[-2.2, -7], [0, -5.8], [2.5, -7.2]], colors.outline, 0.8, salt + 20);
      if (pose.expression === "focus") {
        paint(ctx, [[1.5, -6.8], [3.5, -6.4], [2.2, -4.8]], {fill: "#f2ead8", stroke: colors.outline, width: 0.45, seed: salt + 21});
      }
    } else {
      stroke(ctx, [[-2, -6.5], [0, -6], [2, -6.5]], colors.outline, 0.7, salt + 20);
    }
  }

  function drawHuman(ctx, actor, time, id, colors) {
    var pose = poseFor(actor, time, id);
    var state = stateOf(actor);
    var salt = seed(String(actor.id || id) + "human") * 100;
    var cast = state === "cast";
    ctx.save();
    ctx.translate(pose.rootX, pose.rootY);
    if (id === "xiaohei" || id === "fengxi") {
      ctx.save();
      ctx.translate(0, -24);
      tail(ctx, pose, id === "xiaohei" ? colors.fur : colors.hairShade, id === "fengxi" ? 1.15 : 0.9, salt + 1);
      ctx.restore();
    }
    leg(ctx, -4.8, -24, pose.thighL, pose.shinL, colors, id, "L", salt + 10);
    leg(ctx, 4.8, -24, pose.thighR, pose.shinR, colors, id, "R", salt + 20);
    ctx.save();
    ctx.translate(0, -24);
    ctx.rotate(pose.body);
    arm(ctx, -8.5, -20, pose.upperArmL, pose.forearmL, colors, id, "L", cast, salt + 30);
    costume(ctx, colors, id, pose, salt + 40);
    ctx.save();
    ctx.translate(0, -24);
    ctx.rotate(pose.head);
    head(ctx, colors, id, pose, time, salt + 50);
    ctx.restore();
    arm(ctx, 8.5, -20, pose.upperArmR, pose.forearmR, colors, id, "R", cast && (id === "xiaohei" || id === "wuxian" || id === "agen" || id === "fengxi" || id === "luozhu" || id === "xuhuai" || id === "tianhu"), salt + 60);
    ctx.restore();
    ctx.restore();
  }

  function catLeg(ctx, x, y, upper, lower, colors, salt, far) {
    ctx.save();
    ctx.translate(x, y);
    ctx.globalAlpha *= far ? 0.78 : 1;
    ctx.rotate(upper);
    capsule(ctx, 7.2, 5, colors.fur, {seed: salt, stroke: colors.outline, lineWidth: 0.85, wash: "#617075"});
    ctx.translate(0, 6.8);
    ctx.rotate(lower);
    capsule(ctx, 6.5, 4.2, colors.fur, {seed: salt + 1, stroke: colors.outline, lineWidth: 0.8, wash: "#617075"});
    ctx.translate(0, 6.2);
    ctx.rotate(-(upper + lower) * 0.7);
    blob(ctx, 1.2, 0, 3.7, 2.1, {fill: colors.fur, wash: "#617075", stroke: colors.outline, width: 0.75, seed: salt + 2, vertices: 9});
    ctx.restore();
  }

  function catHead(ctx, colors, id, pose, time, salt) {
    ear(ctx, -9.5, -8.5, pose.earL - 0.12, colors, "xiaohei", "L", salt + 1);
    ear(ctx, 9.5, -8.5, pose.earR + 0.12, colors, "xiaohei", "R", salt + 2);
    if (id === "fengxi") {
      for (var m = 0; m < 9; m += 1) {
        var a = m / 9 * TAU;
        blob(ctx, Math.cos(a) * 13, Math.sin(a) * 11 - 1, 7, 8, {fill: colors.hairShade, wash: colors.hair, stroke: colors.outline, width: 0.8, seed: salt + m + 20, vertices: 9});
      }
    }
    blob(ctx, 0, 0, 17, 15, {fill: colors.fur, wash: id === "fengxi" ? colors.hair : "#52636a", stroke: colors.outline, width: 1.5, seed: salt + 3, vertices: 14, wobble: 0.045});
    var hurt = pose.expression === "hurt";
    var focus = pose.expression === "focus";
    for (var side = -1; side <= 1; side += 2) {
      blob(ctx, side * 6.4, -1.5, 5.5, hurt ? 3.2 : focus ? 4.1 : 6.2, {fill: "#e9e9d8", stroke: colors.outline, width: 0.75, seed: salt + 5 + side, vertices: 12, wobble: 0.025});
      blob(ctx, side * 6.1, -1, 2.25, hurt ? 1.5 : 3.5, {fill: colors.eye, stroke: false, seed: salt + 7 + side, vertices: 10, wobble: 0.02});
      blob(ctx, side * 6, -1, 0.9, hurt ? 1.2 : 2.8, {fill: "#17282c", stroke: false, seed: salt + 9 + side, vertices: 9, wobble: 0});
      dot(ctx, side * 5.4, -3, 0.7, "#faf7e7");
    }
    blob(ctx, 0, 5, 1.4, 1, {fill: colors.inner, stroke: colors.outline, width: 0.45, seed: salt + 12, vertices: 8});
    if (hurt) {
      stroke(ctx, [[-3, 8], [0, 6.8], [3, 8]], colors.outline, 0.85, salt + 13);
    } else {
      stroke(ctx, [[-2.5, 7.2], [0, 8.5], [2.5, 7.2]], colors.outline, 0.8, salt + 13);
    }
    if (id === "fengxi") {
      stroke(ctx, [[-13, -7], [-7, -5]], colors.outline, 1.3, salt + 14);
      stroke(ctx, [[7, -5], [13, -7]], colors.outline, 1.3, salt + 15);
    }
  }

  function drawCat(ctx, actor, time, id, colors) {
    var pose = poseFor(actor, time, id);
    var state = stateOf(actor);
    var salt = seed(String(actor.id || id) + "cat") * 100;
    var stride = Math.sin(finite(actor.animationPhase, time * 7));
    ctx.save();
    ctx.translate(pose.rootX, pose.rootY);
    ctx.save();
    ctx.translate(-12, -21);
    tail(ctx, pose, colors.fur, id === "fengxi" ? 1.5 : 1.12, salt + 1);
    ctx.restore();
    catLeg(ctx, -10, -15, -stride * 0.45 + pose.thighL * 0.45, pose.shinL * 0.65, colors, salt + 10, true);
    catLeg(ctx, 8, -15, stride * 0.45 + pose.thighR * 0.45, pose.shinR * 0.65, colors, salt + 20, true);
    ctx.save();
    ctx.translate(-1, -21);
    ctx.rotate(pose.body * 0.55);
    blob(ctx, 0, 0, id === "fengxi" ? 20 : 17, id === "fengxi" ? 12.5 : 10.5, {
      fill: colors.fur, wash: id === "fengxi" ? colors.hair : "#52636a", stroke: colors.outline, width: 1.35, seed: salt + 30, vertices: 14
    });
    stroke(ctx, [[-9, -6], [-2, -8], [6, -6]], id === "fengxi" ? colors.hair : "#46575e", 0.75, salt + 31);
    ctx.save();
    ctx.translate(11, -9);
    ctx.rotate(pose.head);
    catHead(ctx, colors, id, pose, time, salt + 40);
    ctx.restore();
    ctx.restore();
    catLeg(ctx, -10, -13, stride * 0.55 + pose.thighR * 0.55, pose.shinR * 0.75, colors, salt + 50, false);
    var frontUpper = state === "cast" ? pose.upperArmR : -stride * 0.55 + pose.thighL * 0.55;
    var frontLower = state === "cast" ? pose.forearmR : pose.shinL * 0.75;
    catLeg(ctx, 10, -13, frontUpper, frontLower, colors, salt + 60, false);
    if (state === "hit") {
      stroke(ctx, [[18, -39], [23, -43]], "#b66c5d", 1.4, salt + 70);
      stroke(ctx, [[20, -34], [26, -35]], "#b66c5d", 1.1, salt + 71);
    }
    ctx.restore();
  }

  function actorScale(actor, id, cat) {
    var base = cat ? 0.94 : 1;
    if (!cat) {
      base = id === "xiaohei" ? 0.9 : id === "xiaobai" ? 0.92 : id === "laojun" ? 0.9 : id === "wuxian" ? 1.14 : id === "fengxi" ? 1.12 : id === "xuhuai" ? 1.1 : id === "tianhu" ? 1.3 : 1;
    } else if (id === "fengxi") {
      base = 1.4;
    }
    return base * finite(actor.artScale, finite(actor.scale, 1));
  }

  function isCat(actor, id) {
    var form = String(actor.form || actor.shape || "").toLowerCase();
    if (/cat|beast|animal|panther|猫|豹|兽/.test(form)) {
      return true;
    }
    if (id === "xiaohei" && !form) {
      return true;
    }
    return false;
  }

  function drawActor(ctx, actor, time) {
    if (!ctx || !actor) {
      return;
    }
    time = finite(time, 0);
    var id = actorId(actor);
    if (id === "heixiu") {
      drawHeixiu(ctx, actor, time);
      return;
    }
    var cat = isCat(actor, id);
    var colors = palette(actor, id);
    var scale = actorScale(actor, id, cat);
    var pose = poseFor(actor, time, id);
    var lift = stateOf(actor) === "fly" || id === "laojun" ? 1.45 : 1;
    ctx.save();
    if (actor.alpha != null) {
      ctx.globalAlpha *= clamp(actor.alpha, 0, 1);
    }
    shadow(ctx, finite(actor.x, 0), finite(actor.y, 0) + 1.5, (cat ? 20 : 14) * scale * lift, (cat ? 5 : 4) * scale, stateOf(actor) === "fly" ? 0.1 : 0.18);
    ctx.translate(finite(actor.x, 0), finite(actor.y, 0));
    ctx.scale(facing(actor) * scale, scale);
    if (cat) {
      drawCat(ctx, actor, time, id, colors);
    } else {
      drawHuman(ctx, actor, time, id, colors);
    }
    ctx.restore();
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width * 0.5, height * 0.5);
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + width - r, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + r);
    ctx.lineTo(x + width, y + height - r);
    ctx.quadraticCurveTo(x + width, y + height, x + width - r, y + height);
    ctx.lineTo(x + r, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }

  function portraitPaper(ctx, x, y, size, salt) {
    ctx.save();
    roundedRect(ctx, x, y, size, size, size * 0.08);
    ctx.fillStyle = "#eee8d6";
    ctx.fill();
    ctx.clip();
    blob(ctx, x + size * 0.52, y + size * 0.44, size * 0.39, size * 0.34, {fill: "#b9cbb0", wash: "#d8c88f", stroke: false, seed: salt, vertices: 16, wobble: 0.09, alpha: 0.55});
    blob(ctx, x + size * 0.16, y + size * 0.82, size * 0.38, size * 0.22, {fill: "#d8cda9", stroke: false, seed: salt + 1, vertices: 14, wobble: 0.12, alpha: 0.4});
    for (var i = 0; i < 34; i += 1) {
      var px = x + hash(salt + i * 3.1) * size;
      var py = y + hash(salt + i * 4.7 + 9) * size;
      var length = size * (0.015 + hash(salt + i * 7.3) * 0.055);
      stroke(ctx, [[px, py], [px + length, py + (hash(i + salt) - 0.5) * 1.5]], i % 3 ? "#aa9e80" : "#f8f3e4", size * 0.0025, salt + i + 20);
    }
    ctx.restore();
    ctx.save();
    roundedRect(ctx, x + 0.7, y + 0.7, size - 1.4, size - 1.4, size * 0.08);
    ctx.strokeStyle = "#756f5e";
    ctx.lineWidth = Math.max(0.7, size * 0.009);
    ctx.globalAlpha = 0.65;
    ctx.stroke();
    ctx.restore();
  }

  function drawPortrait(ctx, id, x, y, size) {
    if (!ctx) {
      return;
    }
    var actor = typeof id === "object" && id ? Object.assign({}, id) : {id: id};
    size = Math.max(24, finite(size, 128));
    x = finite(x, 0);
    y = finite(y, 0);
    var resolved = actorId(actor);
    var cat = isCat(actor, resolved);
    if (resolved === "heixiu") {
      portraitPaper(ctx, x, y, size, seed(resolved) * 100);
      drawHeixiu(ctx, {x: x + size * 0.5, y: y + size * 0.66, scale: size / 90, animationPhase: 0.4}, 0.6);
      return;
    }
    if (resolved === "xiaohei" && !actor.form && !actor.shape) {
      cat = false;
    }
    actor.state = actor.state || "idle";
    actor.animationPhase = finite(actor.animationPhase, 0.4);
    actor.x = 0;
    actor.y = 0;
    actor.facing = 1;
    actor.scale = 1;
    actor.artScale = 1;
    var colors = palette(actor, resolved);
    var salt = seed(resolved) * 100;
    portraitPaper(ctx, x, y, size, salt);
    ctx.save();
    roundedRect(ctx, x + 1, y + 1, size - 2, size - 2, size * 0.075);
    ctx.clip();
    shadow(ctx, x + size * 0.5, y + size * 0.88, size * (cat ? 0.25 : 0.17), size * 0.035, 0.15);
    ctx.translate(x + size * (cat ? 0.46 : 0.5), y + size * 0.88);
    var factor = size / (cat ? 66 : 83);
    ctx.scale(factor, factor);
    if (cat) {
      drawCat(ctx, actor, 0.6, resolved, colors);
    } else {
      drawHuman(ctx, actor, 0.6, resolved, colors);
    }
    ctx.restore();
    ctx.save();
    ctx.globalAlpha = 0.32;
    stroke(ctx, [[x + size * 0.12, y + size * 0.93], [x + size * 0.43, y + size * 0.925], [x + size * 0.86, y + size * 0.94]], "#786f5c", size * 0.004, salt + 90);
    ctx.restore();
  }

  function treeScale(tree) {
    if (typeof tree.scale === "number") {
      return tree.scale;
    }
    if (typeof tree.s === "number") {
      return tree.s;
    }
    if (typeof tree.size === "number") {
      return tree.size / 90;
    }
    return 1;
  }

  function trunk(ctx, height, width, colors, salt) {
    paint(ctx, [[-width * 0.58, 1], [-width * 0.42, -height * 0.4], [-width * 0.3, -height * 0.83], [-width * 0.12, -height], [width * 0.24, -height * 0.94], [width * 0.38, -height * 0.45], [width * 0.62, 1], [width * 0.12, -2]], {
      fill: colors[0], wash: colors[1], stroke: "#4c4b3c", width: 1.5, seed: salt
    });
    for (var i = 0; i < 4; i += 1) {
      var x = -width * 0.3 + i * width * 0.2;
      stroke(ctx, [[x, -4], [x + (hash(salt + i) - 0.5) * 4, -height * 0.38], [x * 0.6, -height * 0.76]], colors[1], 0.7, salt + i + 2);
    }
    stroke(ctx, [[-width * 0.2, 0], [-width * 1.2, 3]], "#4c4b3c", 1.4, salt + 8);
    stroke(ctx, [[width * 0.2, 0], [width * 1.25, 3]], "#4c4b3c", 1.4, salt + 9);
  }

  function broadleafTree(ctx, tree, time, salt) {
    var height = finite(tree.height, 88);
    var radius = finite(tree.radius, 35);
    var colors = tree.autumn || tree.variant === "autumn" ? ["#a9a758", "#c58c54", "#72834e"] : ["#6f9b67", "#88ad73", "#4f7e60"];
    if (tree.color) {
      colors[0] = tree.color;
    }
    if (tree.palette && tree.palette.length) {
      colors = tree.palette;
    }
    trunk(ctx, height * 0.72, Math.max(9, radius * 0.32), ["#796348", "#a0855c"], salt);
    ctx.save();
    ctx.translate(0, -height * 0.56);
    ctx.rotate(Math.sin(time * 0.72 + salt) * 0.018);
    stroke(ctx, [[0, 5], [-radius * 0.48, -height * 0.18], [-radius * 0.7, -height * 0.28]], "#675840", 3.5, salt + 10);
    stroke(ctx, [[0, 3], [radius * 0.42, -height * 0.16], [radius * 0.65, -height * 0.24]], "#675840", 3, salt + 11);
    var blobs = [
      [-0.55, -0.18, 0.72], [0.48, -0.2, 0.76], [0, -0.52, 0.82],
      [-0.2, 0.12, 0.8], [0.62, 0.12, 0.58], [-0.7, 0.18, 0.54], [0.08, -0.12, 0.88]
    ];
    for (var i = 0; i < blobs.length; i += 1) {
      var b = blobs[i];
      var sway = Math.sin(time * 0.9 + salt + i * 0.7) * 0.7;
      blob(ctx, b[0] * radius + sway, b[1] * radius, radius * b[2], radius * b[2] * 0.72, {
        fill: colors[i % colors.length], wash: i % 2 ? "#d1cf8b" : "#b5c58a", stroke: "#42634f", width: 1.05, seed: salt + i + 20, vertices: 13, wobble: 0.12, alpha: 0.9
      });
    }
    for (var j = 0; j < 9; j += 1) {
      var px = (hash(salt + j * 3) - 0.5) * radius * 1.65;
      var py = (hash(salt + j * 5 + 2) - 0.62) * radius * 0.85;
      leaf(ctx, px, py, 6 + hash(j + salt) * 4, 2.3, hash(j * 7 + salt) * TAU, colors[(j + 1) % colors.length], salt + j + 40);
    }
    ctx.restore();
  }

  function bambooTree(ctx, tree, time, salt) {
    var height = finite(tree.height, 105);
    for (var i = 0; i < 4; i += 1) {
      var x = (i - 1.5) * 7;
      var bend = Math.sin(time * 0.7 + salt + i) * 1.2;
      ctx.save();
      ctx.translate(x, 0);
      ctx.rotate((i - 1.5) * 0.025 + bend * 0.003);
      stroke(ctx, [[0, 0], [bend * 0.3, -height * 0.5], [bend, -height * (0.82 + i * 0.04)]], "#527b55", 3.4 - i * 0.35, salt + i);
      for (var j = 1; j < 6; j += 1) {
        var yy = -height * j / 7;
        stroke(ctx, [[-2, yy], [2, yy]], "#b0b780", 0.8, salt + i * 10 + j);
        if (j > 2) {
          leaf(ctx, 0, yy, 12, 3, (i + j) % 2 ? -1.15 : 1.15, j % 2 ? "#6f9862" : "#88a96d", salt + i * 20 + j);
        }
      }
      ctx.restore();
    }
  }

  function palmTree(ctx, tree, time, salt) {
    var height = finite(tree.height, 105);
    stroke(ctx, [[0, 0], [-5, -height * 0.45], [3, -height]], "#8a704c", 8, salt);
    for (var i = 0; i < 7; i += 1) {
      stroke(ctx, [[-4 + i * 0.8, -height * (0.18 + i * 0.1)], [1 + i * 0.5, -height * (0.18 + i * 0.1)]], "#b09564", 0.9, salt + i + 2);
    }
    ctx.save();
    ctx.translate(3, -height);
    for (var j = 0; j < 9; j += 1) {
      var angle = j / 9 * TAU + Math.sin(time * 0.65 + salt) * 0.025;
      leaf(ctx, 0, 0, finite(tree.radius, 42), 7, angle + Math.PI * 0.5, j % 2 ? "#5e9270" : "#75a579", salt + j + 20);
    }
    blob(ctx, 0, 0, 6, 4, {fill: "#72845a", stroke: "#47634c", width: 1, seed: salt + 40, vertices: 10});
    ctx.restore();
  }

  function deadTree(ctx, tree, time, salt) {
    var height = finite(tree.height, 82);
    trunk(ctx, height * 0.72, 13, ["#75634e", "#9a8263"], salt);
    stroke(ctx, [[0, -height * 0.5], [-18, -height * 0.72], [-27, -height * 0.86]], "#6a5947", 4, salt + 1);
    stroke(ctx, [[-17, -height * 0.71], [-12, -height * 0.92]], "#6a5947", 2.1, salt + 2);
    stroke(ctx, [[0, -height * 0.6], [19, -height * 0.8], [25, -height * 0.96]], "#6a5947", 3.2, salt + 3);
    stroke(ctx, [[17, -height * 0.78], [29, -height * 0.75]], "#6a5947", 1.8, salt + 4);
  }

  function drawTree(ctx, tree, time) {
    if (!ctx || !tree) {
      return;
    }
    time = finite(time, 0);
    var scale = treeScale(tree);
    var salt = finite(tree.seed, seed(String(tree.id || tree.type || "tree") + finite(tree.x, 0) + ":" + finite(tree.y, 0))) * 100;
    ctx.save();
    shadow(ctx, finite(tree.x, 0), finite(tree.y, 0) + 3, 30 * scale, 7 * scale, finite(tree.alpha, 1) * 0.16);
    ctx.translate(finite(tree.x, 0), finite(tree.y, 0));
    ctx.scale(scale, scale);
    if (tree.alpha != null) {
      ctx.globalAlpha *= clamp(tree.alpha, 0, 1);
    }
    var type = String(tree.type || tree.variant || "broadleaf").toLowerCase();
    if (/bamboo|竹/.test(type)) {
      bambooTree(ctx, tree, time, salt);
    } else if (/palm|椰子|棕榈/.test(type)) {
      palmTree(ctx, tree, time, salt);
    } else if (/dead|dry|枯/.test(type)) {
      deadTree(ctx, tree, time, salt);
    } else {
      broadleafTree(ctx, tree, time, salt);
    }
    ctx.restore();
  }

  function propScale(prop) {
    return finite(prop.scale, finite(prop.s, 1));
  }

  function rock(ctx, prop, colors, salt) {
    var width = finite(prop.width, finite(prop.radius, 15) * 2);
    var height = finite(prop.height, width * 0.58);
    paint(ctx, [[-width * 0.55, 0], [-width * 0.45, -height * 0.65], [-width * 0.12, -height], [width * 0.35, -height * 0.84], [width * 0.55, -height * 0.25], [width * 0.43, 0]], {
      fill: colors[0], wash: colors[1], stroke: "#4c5550", width: 1.3, seed: salt
    });
    stroke(ctx, [[-width * 0.24, -height * 0.65], [-width * 0.04, -height * 0.35], [width * 0.19, -height * 0.48]], colors[1], 0.75, salt + 1);
    blob(ctx, -width * 0.13, -height * 0.72, width * 0.16, height * 0.12, {fill: "#d9d3b8", stroke: false, seed: salt + 2, alpha: 0.32, vertices: 9});
  }

  function flower(ctx, prop, time, colors, salt) {
    var count = Math.floor(finite(prop.count, 4));
    for (var i = 0; i < count; i += 1) {
      var x = (hash(salt + i) - 0.5) * 20;
      var h = 7 + hash(salt + i + 4) * 10;
      var sway = Math.sin(time * 1.2 + salt + i) * 1.2;
      stroke(ctx, [[x, 0], [x + sway, -h]], "#64825b", 0.85, salt + i);
      for (var p = 0; p < 5; p += 1) {
        var a = p / 5 * TAU;
        blob(ctx, x + sway + Math.cos(a) * 2.1, -h + Math.sin(a) * 2.1, 1.8, 1.5, {fill: colors[i % colors.length], stroke: false, seed: salt + i * 8 + p, vertices: 8, alpha: 0.85});
      }
      dot(ctx, x + sway, -h, 1.2, "#d7b75e");
    }
  }

  function lantern(ctx, prop, time, colors, salt) {
    var swing = Math.sin(time * 1.1 + salt) * 0.055;
    ctx.save();
    ctx.rotate(swing);
    stroke(ctx, [[0, -28], [0, -16]], "#514a3b", 1.1, salt);
    ctx.save();
    ctx.globalAlpha = 0.09 + Math.sin(time * 2 + salt) * 0.015;
    blob(ctx, 0, -7, 18, 19, {fill: "#f4c76d", stroke: false, seed: salt + 1, vertices: 16, wobble: 0});
    ctx.restore();
    blob(ctx, 0, -7, 8, 10, {fill: colors[0], wash: "#f5cf83", stroke: "#69513e", width: 1.15, seed: salt + 2, vertices: 14, wobble: 0.035});
    for (var i = -1; i <= 1; i += 1) {
      stroke(ctx, [[i * 3, -16], [i * 3.6, -7], [i * 3, 2]], "#a45f45", 0.65, salt + i + 4);
    }
    stroke(ctx, [[-5, -16], [5, -16]], "#594a3a", 1.8, salt + 7);
    stroke(ctx, [[-5, 2], [5, 2]], "#594a3a", 1.8, salt + 8);
    stroke(ctx, [[0, 3], [0, 9]], "#b55543", 1.2, salt + 9);
    ctx.restore();
  }

  function woodenBox(ctx, prop, colors, salt, barrel) {
    var width = finite(prop.width, 24);
    var height = finite(prop.height, 20);
    if (barrel) {
      blob(ctx, 0, -height * 0.5, width * 0.5, height * 0.58, {fill: colors[0], wash: colors[1], stroke: "#504a3d", width: 1.25, seed: salt, vertices: 14, wobble: 0.025});
      stroke(ctx, [[-width * 0.47, -height * 0.65], [width * 0.47, -height * 0.65]], "#5c5b4e", 2, salt + 1);
      stroke(ctx, [[-width * 0.48, -height * 0.27], [width * 0.48, -height * 0.27]], "#5c5b4e", 2, salt + 2);
      blob(ctx, 0, -height + 1, width * 0.43, 3.2, {fill: colors[1], stroke: "#504a3d", width: 0.9, seed: salt + 3, vertices: 12});
    } else {
      paint(ctx, [[-width * 0.5, 0], [-width * 0.48, -height], [width * 0.48, -height], [width * 0.5, 0]], {fill: colors[0], wash: colors[1], stroke: "#504a3d", width: 1.25, seed: salt});
      stroke(ctx, [[-width * 0.42, -height * 0.9], [width * 0.42, -height * 0.1]], colors[1], 2, salt + 1);
      stroke(ctx, [[width * 0.42, -height * 0.9], [-width * 0.42, -height * 0.1]], colors[1], 2, salt + 2);
      stroke(ctx, [[-width * 0.48, -height * 0.65], [width * 0.48, -height * 0.65]], "#62513d", 0.8, salt + 3);
    }
  }

  function signpost(ctx, prop, colors, salt) {
    stroke(ctx, [[0, 1], [0, -35]], "#67553f", 4, salt);
    paint(ctx, [[-18, -36], [18, -36], [17, -24], [-18, -24]], {fill: colors[0], wash: colors[1], stroke: "#514b3d", width: 1.15, seed: salt + 1});
    var direction = /left|左/.test(String(prop.direction)) ? -1 : 1;
    stroke(ctx, [[-9 * direction, -30], [8 * direction, -30]], "#ede1bb", 1.5, salt + 2);
    stroke(ctx, [[5 * direction, -33], [10 * direction, -30], [5 * direction, -27]], "#ede1bb", 1.2, salt + 3);
  }

  function bench(ctx, prop, colors, salt) {
    var width = finite(prop.width, 42);
    stroke(ctx, [[-width * 0.35, 0], [-width * 0.3, -17]], "#554b3d", 3, salt);
    stroke(ctx, [[width * 0.35, 0], [width * 0.3, -17]], "#554b3d", 3, salt + 1);
    paint(ctx, [[-width * 0.55, -13], [width * 0.55, -13], [width * 0.5, -7], [-width * 0.5, -7]], {fill: colors[0], wash: colors[1], stroke: "#51483b", width: 1.1, seed: salt + 2});
    paint(ctx, [[-width * 0.5, -27], [width * 0.5, -27], [width * 0.48, -20], [-width * 0.48, -20]], {fill: colors[0], wash: colors[1], stroke: "#51483b", width: 1, seed: salt + 3});
  }

  function well(ctx, prop, colors, salt) {
    paint(ctx, [[-20, 0], [-18, -19], [18, -19], [20, 0]], {fill: "#85877a", wash: "#b3b09a", stroke: "#4f5751", width: 1.3, seed: salt});
    blob(ctx, 0, -18, 18, 5.5, {fill: "#9b9b88", stroke: "#4f5751", width: 1.1, seed: salt + 1, vertices: 14});
    blob(ctx, 0, -18, 13, 3.5, {fill: "#456b70", stroke: "#4f5751", width: 0.8, seed: salt + 2, vertices: 12});
    stroke(ctx, [[-16, -18], [-16, -45]], "#67513d", 3, salt + 3);
    stroke(ctx, [[16, -18], [16, -45]], "#67513d", 3, salt + 4);
    paint(ctx, [[-24, -41], [0, -55], [24, -41], [20, -36], [-20, -36]], {fill: colors[0], wash: colors[1], stroke: "#514b3f", width: 1.2, seed: salt + 5});
    stroke(ctx, [[-14, -33], [14, -33]], "#796345", 2.2, salt + 6);
    stroke(ctx, [[0, -33], [0, -20]], "#b7a47b", 0.9, salt + 7);
  }

  function portal(ctx, prop, time, colors, salt) {
    var radius = finite(prop.radius, 22);
    ctx.save();
    ctx.translate(0, -radius * 0.65);
    for (var i = 0; i < 4; i += 1) {
      ctx.save();
      ctx.rotate(time * (i % 2 ? -0.22 : 0.17) + i * 0.8);
      ctx.globalAlpha = 0.3 + i * 0.12;
      ctx.strokeStyle = colors[i % colors.length];
      ctx.lineWidth = 1.2 + i * 0.45;
      ctx.beginPath();
      ctx.ellipse(0, 0, radius * (0.45 + i * 0.15), radius * (0.72 + i * 0.08), 0.2, 0.25 + i * 0.3, TAU - 0.45 + i * 0.2);
      ctx.stroke();
      ctx.restore();
    }
    blob(ctx, 0, 0, radius * 0.38, radius * 0.55, {fill: "#d6eee0", stroke: false, seed: salt, vertices: 14, wobble: 0.03, alpha: 0.28 + Math.sin(time * 2 + salt) * 0.05});
    for (var j = 0; j < 6; j += 1) {
      var angle = time * 0.35 + j / 6 * TAU + salt;
      dot(ctx, Math.cos(angle) * radius * 0.8, Math.sin(angle) * radius, 1.1, colors[j % colors.length], 0.75);
    }
    ctx.restore();
  }

  function house(ctx, prop, colors, salt) {
    var width = finite(prop.width, 72);
    var height = finite(prop.height, 48);
    paint(ctx, [[-width * 0.45, 0], [-width * 0.43, -height], [width * 0.43, -height], [width * 0.45, 0]], {fill: "#d8c9a8", wash: "#eee0bd", stroke: "#554f43", width: 1.4, seed: salt});
    paint(ctx, [[-width * 0.58, -height + 2], [0, -height - 29], [width * 0.58, -height + 2], [width * 0.48, -height + 9], [-width * 0.48, -height + 9]], {fill: colors[0], wash: colors[1], stroke: "#514b41", width: 1.5, seed: salt + 1});
    for (var i = 0; i < 5; i += 1) {
      stroke(ctx, [[-width * 0.45 + i * width * 0.2, -height + 2], [0, -height - 25]], colors[1], 0.65, salt + i + 3);
    }
    paint(ctx, [[-8, 0], [-8, -27], [8, -27], [8, 0]], {fill: "#766049", wash: "#a3855e", stroke: "#4e493f", width: 1, seed: salt + 9});
    blob(ctx, 4.5, -13, 1, 1, {fill: "#d2b568", stroke: false, seed: salt + 10, vertices: 8});
    paint(ctx, [[-width * 0.34, -height * 0.62], [-width * 0.15, -height * 0.62], [-width * 0.15, -height * 0.38], [-width * 0.34, -height * 0.38]], {fill: "#82a7a0", wash: "#c8d5b9", stroke: "#514f45", width: 0.9, seed: salt + 11});
  }

  function mushroom(ctx, prop, colors, salt) {
    var size = finite(prop.size, 13);
    paint(ctx, [[-size * 0.18, 0], [-size * 0.13, -size * 0.75], [size * 0.13, -size * 0.75], [size * 0.18, 0]], {fill: "#e1d2ae", wash: "#f1e3c2", stroke: "#5b5445", width: 0.9, seed: salt});
    paint(ctx, [[-size, -size * 0.62], [-size * 0.58, -size * 1.25], [0, -size * 1.45], [size * 0.62, -size * 1.18], [size, -size * 0.62]], {fill: colors[0], wash: colors[1], stroke: "#5b5445", width: 1, seed: salt + 1});
    dot(ctx, -size * 0.35, -size, size * 0.11, "#eee1bd", 0.85);
    dot(ctx, size * 0.28, -size * 1.16, size * 0.09, "#eee1bd", 0.85);
  }

  function shell(ctx, prop, colors, salt) {
    paint(ctx, [[-10, 0], [-8, -7], [0, -12], [8, -7], [10, 0], [0, -3]], {fill: colors[0], wash: colors[1], stroke: "#655b50", width: 0.9, seed: salt});
    for (var i = -2; i <= 2; i += 1) {
      stroke(ctx, [[0, -3], [i * 3.7, -7 - (2 - Math.abs(i)) * 1.7]], colors[1], 0.55, salt + i + 3);
    }
  }

  function drawProp(ctx, prop, time) {
    if (!ctx || !prop) {
      return;
    }
    time = finite(time, 0);
    var type = String(prop.type || prop.kind || prop.id || "rock").toLowerCase();
    var salt = finite(prop.seed, seed(type + finite(prop.x, 0) + ":" + finite(prop.y, 0))) * 100;
    var colors = prop.palette && prop.palette.length ? prop.palette : [prop.color || "#879386", prop.secondaryColor || "#b4b49a"];
    var scale = propScale(prop);
    ctx.save();
    if (!/grass|flower|portal|lantern|花|草|传送/.test(type)) {
      shadow(ctx, finite(prop.x, 0), finite(prop.y, 0) + 1, finite(prop.shadowRadius, 15) * scale, 4 * scale, 0.14);
    }
    ctx.translate(finite(prop.x, 0), finite(prop.y, 0));
    ctx.scale(facing(prop) * scale, scale);
    if (prop.alpha != null) {
      ctx.globalAlpha *= clamp(prop.alpha, 0, 1);
    }
    if (/flower|grass|花|草/.test(type)) {
      flower(ctx, prop, time, prop.color ? [prop.color] : ["#d8a08c", "#e2c777", "#b9b0ce"], salt);
    } else if (/lantern|灯/.test(type)) {
      lantern(ctx, prop, time, [prop.color || "#d9855d", "#efbd75"], salt);
    } else if (/sign|路牌|告示/.test(type)) {
      signpost(ctx, prop, colors, salt);
    } else if (/barrel|桶/.test(type)) {
      woodenBox(ctx, prop, ["#96734d", "#c09b69"], salt, true);
    } else if (/crate|box|箱/.test(type)) {
      woodenBox(ctx, prop, ["#9b7a51", "#c09c6b"], salt, false);
    } else if (/bench|chair|长椅/.test(type)) {
      bench(ctx, prop, ["#8b6b48", "#b18e5f"], salt);
    } else if (/well|井/.test(type)) {
      well(ctx, prop, [prop.color || "#806b53", "#ad8b62"], salt);
    } else if (/portal|waypoint|传送|裂隙/.test(type)) {
      portal(ctx, prop, time, prop.palette || ["#80b8ac", "#a28db6", "#d2c378"], salt);
    } else if (/house|hut|home|房|屋/.test(type)) {
      house(ctx, prop, [prop.color || "#786c58", "#a18b67"], salt);
    } else if (/mushroom|蘑菇/.test(type)) {
      mushroom(ctx, prop, [prop.color || "#bd7863", "#dc9b75"], salt);
    } else if (/shell|贝壳/.test(type)) {
      shell(ctx, prop, [prop.color || "#d4aa9b", "#ead0b4"], salt);
    } else if (/stump|树桩/.test(type)) {
      woodenBox(ctx, Object.assign({width: 27, height: 15}, prop), ["#7d6548", "#ae9164"], salt, true);
      stroke(ctx, [[-7, -13], [0, -16], [7, -13]], "#68553f", 0.8, salt + 20);
    } else if (/fence|栅栏/.test(type)) {
      for (var f = -1; f <= 1; f += 1) {
        stroke(ctx, [[f * 14, 1], [f * 14, -27]], "#806649", 4, salt + f + 2);
        paint(ctx, [[f * 14 - 3, -26], [f * 14, -32], [f * 14 + 3, -26]], {fill: "#a38258", stroke: "#5b503f", width: 0.8, seed: salt + f + 5});
      }
      stroke(ctx, [[-19, -18], [19, -18]], "#9b7a52", 3, salt + 8);
      stroke(ctx, [[-19, -8], [19, -8]], "#9b7a52", 3, salt + 9);
    } else if (/bridge|dock|桥|码头/.test(type)) {
      var width = finite(prop.width, 68);
      for (var b = 0; b < 6; b += 1) {
        paint(ctx, [[-width * 0.5 + b * width / 6, 0], [-width * 0.5 + b * width / 6 + 1, -15], [-width * 0.5 + (b + 1) * width / 6 - 1, -15], [-width * 0.5 + (b + 1) * width / 6, 0]], {fill: b % 2 ? "#96754f" : "#a38258", wash: "#c1a475", stroke: "#594d3d", width: 0.75, seed: salt + b});
      }
    } else if (/metal|ring|金属|圆环/.test(type)) {
      ctx.save();
      ctx.translate(0, -10 + Math.sin(time * 2 + salt) * 1.5);
      ctx.rotate(time * 0.25 + salt);
      ctx.strokeStyle = prop.color || "#c5a458";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.ellipse(0, 0, finite(prop.radius, 12), finite(prop.radius, 12) * 0.42, 0.3, 0, TAU);
      ctx.stroke();
      stroke(ctx, [[-8, -5], [6, -7]], "#eee0a6", 0.85, salt + 1);
      ctx.restore();
    } else if (/chest|宝盒/.test(type)) {
      woodenBox(ctx, Object.assign({width: 29, height: 17}, prop), ["#876542", "#bd9860"], salt, false);
      paint(ctx, [[-3, -12], [3, -12], [3, -5], [-3, -5]], {fill: "#d0b566", stroke: "#5b503e", width: 0.65, seed: salt + 20});
    } else {
      rock(ctx, prop, colors, salt);
    }
    ctx.restore();
  }

  function drawHeixiu(ctx, spirit, time) {
    if (!ctx || !spirit) {
      return;
    }
    time = finite(time, 0);
    spirit = spirit || {};
    var salt = finite(spirit.seed, seed(spirit.id || "heixiu")) * 100;
    var phase = finite(spirit.animationPhase, time * 3 + salt);
    var scale = finite(spirit.scale, finite(spirit.size, 18) / 18);
    var state = stateOf(spirit);
    var float = state === "fly" ? 6 : 2.2;
    var bob = Math.sin(phase) * float - (state === "fly" ? 5 : 1.5);
    var squash = 1 + Math.sin(phase * 1.35) * 0.055;
    var x = finite(spirit.x, 0);
    var y = finite(spirit.y, 0);
    ctx.save();
    if (spirit.alpha != null) {
      ctx.globalAlpha *= clamp(spirit.alpha, 0, 1);
    }
    shadow(ctx, x, y + 1, 11 * scale, 3.3 * scale, state === "fly" ? 0.09 : 0.16);
    ctx.translate(x, y + bob * scale);
    ctx.scale(facing(spirit) * scale / squash, scale * squash);
    var colors = Object.assign({}, PALETTES.xiaohei, spirit.palette || {});
    var earTwitch = Math.sin(phase * 1.7) * 0.11;
    ear(ctx, -6.5, -8, -0.18 + earTwitch, colors, "xiaohei", "L", salt + 1);
    ear(ctx, 6.5, -8, 0.18 - earTwitch, colors, "xiaohei", "R", salt + 2);
    blob(ctx, 0, 0, 12.5, 10.2, {fill: colors.fur, wash: "#52636a", stroke: colors.outline, width: 1.2, seed: salt + 3, vertices: 13, wobble: 0.07});
    var blink = Math.sin(time * 0.9 + salt) > 0.975 || state === "hit";
    for (var side = -1; side <= 1; side += 2) {
      blob(ctx, side * 4.6, -1, 3.7, blink ? 0.9 : 4.5, {fill: "#e9ead9", stroke: colors.outline, width: 0.55, seed: salt + 4 + side, vertices: 10, wobble: 0.02});
      if (!blink) {
        blob(ctx, side * 4.5, -0.7, 1.35, 2.6, {fill: "#24373a", stroke: false, seed: salt + 7 + side, vertices: 9, wobble: 0});
        dot(ctx, side * 4.1, -1.8, 0.48, "#f8f5e3");
      }
    }
    stroke(ctx, [[-1.6, 5], [0, 5.8], [1.6, 5]], colors.inner, 0.65, salt + 10);
    if (state === "cast") {
      ctx.save();
      ctx.globalAlpha = 0.45;
      ctx.strokeStyle = colors.accent;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.ellipse(0, 0, 16 + Math.sin(phase) * 2, 13 + Math.sin(phase) * 1.5, 0, 0, TAU);
      ctx.stroke();
      ctx.restore();
    }
    ctx.restore();
  }

  LXH.Art = {
    drawActor: drawActor,
    drawPortrait: drawPortrait,
    drawTree: drawTree,
    drawProp: drawProp,
    drawHeixiu: drawHeixiu
  };
})(typeof window !== "undefined" ? window : globalThis);
