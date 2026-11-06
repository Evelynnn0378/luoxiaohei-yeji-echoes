(function (root) {
  "use strict";

  var LXH = root.LXH = root.LXH || {};
  var TAU = Math.PI * 2;

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distanceSquared(ax, ay, bx, by) {
    var dx = ax - bx;
    var dy = ay - by;
    return dx * dx + dy * dy;
  }

  function segmentDistanceSquared(px, py, ax, ay, bx, by) {
    var dx = bx - ax;
    var dy = by - ay;
    var lengthSquared = dx * dx + dy * dy;
    if (!lengthSquared) return distanceSquared(px, py, ax, ay);
    var t = clamp(((px - ax) * dx + (py - ay) * dy) / lengthSquared, 0, 1);
    return distanceSquared(px, py, ax + dx * t, ay + dy * t);
  }

  function pointInPolygon(x, y, points) {
    var inside = false;
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
      var a = points[i];
      var b = points[j];
      var crosses = (a.y > y) !== (b.y > y);
      if (crosses && x < (b.x - a.x) * (y - a.y) / (b.y - a.y) + a.x) {
        inside = !inside;
      }
    }
    return inside;
  }

  function circleHitsPolygon(x, y, radius, points) {
    if (pointInPolygon(x, y, points)) return true;
    var radiusSquared = radius * radius;
    for (var i = 0; i < points.length; i += 1) {
      var a = points[i];
      var b = points[(i + 1) % points.length];
      if (segmentDistanceSquared(x, y, a.x, a.y, b.x, b.y) <= radiusSquared) {
        return true;
      }
    }
    return false;
  }

  function circleHitsRect(x, y, radius, rect) {
    var nearestX = clamp(x, rect.x - rect.w / 2, rect.x + rect.w / 2);
    var nearestY = clamp(y, rect.y - rect.h / 2, rect.y + rect.h / 2);
    return distanceSquared(x, y, nearestX, nearestY) <= radius * radius;
  }

  function rectContainsCircle(x, y, radius, rect) {
    return x - radius >= rect.x - rect.w / 2 &&
      x + radius <= rect.x + rect.w / 2 &&
      y - radius >= rect.y - rect.h / 2 &&
      y + radius <= rect.y + rect.h / 2;
  }

  function polygonBounds(points) {
    var minX = Infinity;
    var minY = Infinity;
    var maxX = -Infinity;
    var maxY = -Infinity;
    for (var i = 0; i < points.length; i += 1) {
      minX = Math.min(minX, points[i].x);
      minY = Math.min(minY, points[i].y);
      maxX = Math.max(maxX, points[i].x);
      maxY = Math.max(maxY, points[i].y);
    }
    return { minX: minX, minY: minY, maxX: maxX, maxY: maxY };
  }

  function seedFrom(text) {
    var hash = 2166136261;
    for (var i = 0; i < text.length; i += 1) {
      hash ^= text.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return hash >>> 0;
  }

  function Random(seed) {
    this.state = seed >>> 0;
  }

  Random.prototype.next = function () {
    var value = this.state += 0x6D2B79F5;
    value = Math.imul(value ^ value >>> 15, value | 1);
    value ^= value + Math.imul(value ^ value >>> 7, value | 61);
    return ((value ^ value >>> 14) >>> 0) / 4294967296;
  };

  Random.prototype.range = function (min, max) {
    return min + (max - min) * this.next();
  };

  Random.prototype.int = function (min, max) {
    return Math.floor(this.range(min, max + 1));
  };

  Random.prototype.pick = function (items) {
    return items[Math.floor(this.next() * items.length)];
  };

  function makeEllipse(x, y, rx, ry, count, roughness, random) {
    var points = [];
    for (var i = 0; i < count; i += 1) {
      var angle = i / count * TAU;
      var scale = 1 + random.range(-roughness, roughness);
      points.push({
        x: x + Math.cos(angle) * rx * scale,
        y: y + Math.sin(angle) * ry * scale
      });
    }
    return points;
  }

  function tracePolygon(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
    ctx.closePath();
  }

  function traceLine(ctx, points) {
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (var i = 1; i < points.length; i += 1) ctx.lineTo(points[i].x, points[i].y);
  }

  function roundedRect(ctx, x, y, width, height, radius) {
    var r = Math.min(radius, width / 2, height / 2);
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

  function World(game) {
    this.game = game || {};
    this.width = 4800;
    this.height = 3600;
    this.bounds = { left: 64, top: 64, right: 4736, bottom: 3536 };
    this.time = 0;
    this.cellSize = 240;
    this.zones = [
      { id: "forest", name: "叶隙森林", color: "#6f9167", mapColor: "#789d6d", center: { x: 720, y: 1430 }, description: "枝叶筛下碎光，旧路与河声在此交汇。" },
      { id: "guild", name: "龙游会馆", color: "#87a276", mapColor: "#9cac80", center: { x: 2150, y: 1110 }, description: "人与妖精往来的庭院，保留着交涉与相助的日常。" },
      { id: "city", name: "城市街角", color: "#969f91", mapColor: "#a7aa98", center: { x: 3740, y: 1110 }, description: "旧城骑楼与新街相邻，金属与生活的痕迹随处可见。" },
      { id: "coast", name: "离岛海岸", color: "#c8bb88", mapColor: "#d5c68f", center: { x: 3940, y: 2670 }, description: "潮线绕过离岛，风把远方的消息送到岸边。" },
      { id: "lanxi", name: "蓝溪镇", color: "#91a577", mapColor: "#a6b783", center: { x: 1880, y: 2920 }, description: "星夜湖映着君阁与屋檐，镇中仍有从容灯火。" }
    ];
    this.paths = [];
    this.water = [];
    this.bridges = [];
    this.obstacles = [];
    this.trees = [];
    this.props = [];
    this.groundDecor = [];
    this.interactables = [];
    this.npcSpawns = [];
    this.npcSpawnPoints = this.npcSpawns;
    this.patrolPoints = [];
    this.spawnPoints = {};
    this._reserved = [];
    this._scene = [];
    this._spatial = new Map();
    this._spatialReady = false;
    this._queryId = 0;
    this._view = null;

    this._buildTerrain();
    this._buildStructures();
    this._buildInteractables();
    this._buildSpawnSuggestions();
    this._buildDecorations();
    this.rebuildCollisionIndex();
    this._scene = this.trees.concat(this.props).sort(function (a, b) {
      return (a.y + (a.sortOffset || 0)) - (b.y + (b.sortOffset || 0));
    });
  }

  World.prototype._buildTerrain = function () {
    var random = new Random(seedFrom("叶隙回响-地形-2026"));
    this.groundPatches = [
      { points: makeEllipse(720, 1370, 910, 1370, 28, 0.045, random), color: "#6f9167" },
      { points: makeEllipse(2050, 1120, 860, 1010, 24, 0.04, random), color: "#87a276" },
      { points: makeEllipse(1700, 2950, 1420, 760, 26, 0.035, random), color: "#91a577" },
      { points: makeEllipse(3840, 2680, 1080, 1010, 26, 0.03, random), color: "#c8bb88" }
    ];

    this.paths = [
      { id: "forest-road", kind: "earth", width: 104, points: [{ x: 480, y: 2050 }, { x: 620, y: 1880 }, { x: 850, y: 1760 }, { x: 1100, y: 1740 }, { x: 1390, y: 1580 }, { x: 1640, y: 1430 }, { x: 1930, y: 1320 }, { x: 2250, y: 1280 }] },
      { id: "guild-door", kind: "stone", width: 88, points: [{ x: 2250, y: 1320 }, { x: 2250, y: 1110 }, { x: 2250, y: 1010 }] },
      { id: "north-bridge-road", kind: "stone", width: 96, points: [{ x: 2250, y: 1280 }, { x: 2500, y: 1230 }, { x: 2780, y: 1230 }, { x: 3060, y: 1230 }, { x: 3330, y: 1160 }, { x: 3600, y: 1110 }, { x: 3850, y: 1080 }] },
      { id: "middle-bridge-road", kind: "earth", width: 88, points: [{ x: 1390, y: 1580 }, { x: 1510, y: 1850 }, { x: 1830, y: 1980 }, { x: 2200, y: 2070 }, { x: 2500, y: 2070 }, { x: 2800, y: 2070 }, { x: 3120, y: 2070 }, { x: 3440, y: 2070 }, { x: 3680, y: 2210 }, { x: 3920, y: 2400 }, { x: 4160, y: 2600 }] },
      { id: "east-street", kind: "city", width: 126, points: [{ x: 3850, y: 1080 }, { x: 3900, y: 1430 }, { x: 3900, y: 1780 }, { x: 4020, y: 2140 }, { x: 4160, y: 2600 }] },
      { id: "lanxi-road", kind: "earth", width: 94, points: [{ x: 1510, y: 1850 }, { x: 1530, y: 2140 }, { x: 1550, y: 2320 }, { x: 1560, y: 2570 }, { x: 1750, y: 2700 }, { x: 1950, y: 2780 }, { x: 2010, y: 2940 }] },
      { id: "lanxi-square", kind: "stone", width: 82, points: [{ x: 1560, y: 2920 }, { x: 1780, y: 2940 }, { x: 2010, y: 2940 }, { x: 2290, y: 2990 }, { x: 2440, y: 3090 }] },
      { id: "south-bridge-road", kind: "earth", width: 92, points: [{ x: 2010, y: 2940 }, { x: 2250, y: 3050 }, { x: 2500, y: 3090 }, { x: 2800, y: 3090 }, { x: 3100, y: 3090 }, { x: 3370, y: 3000 }, { x: 3610, y: 2860 }, { x: 3880, y: 2700 }, { x: 4160, y: 2600 }] },
      { id: "lake-walk", kind: "earth", width: 70, points: [{ x: 1780, y: 2940 }, { x: 1530, y: 2910 }, { x: 1350, y: 2910 }] },
      { id: "forest-lookout", kind: "earth", width: 66, points: [{ x: 850, y: 1760 }, { x: 790, y: 1610 }, { x: 790, y: 1400 }, { x: 960, y: 1300 }] },
      { id: "city-cross-street", kind: "city", width: 112, points: [{ x: 3160, y: 1450 }, { x: 3430, y: 1430 }, { x: 3660, y: 1430 }, { x: 3900, y: 1430 }, { x: 4230, y: 1430 }, { x: 4520, y: 1370 }] },
      { id: "coast-lookout", kind: "boardwalk", width: 72, points: [{ x: 3880, y: 2700 }, { x: 4070, y: 2770 }, { x: 4270, y: 2820 }] }
    ];

    for (var i = 0; i < this.paths.length; i += 1) this._preparePath(this.paths[i], random);

    var riverPoints = [
      { x: 2670, y: 0 }, { x: 2650, y: 400 }, { x: 2730, y: 790 }, { x: 2700, y: 1100 },
      { x: 2760, y: 1460 }, { x: 2700, y: 1800 }, { x: 2770, y: 2160 }, { x: 2720, y: 2500 },
      { x: 2800, y: 2900 }, { x: 2760, y: 3300 }, { x: 2810, y: 3600 }, { x: 2970, y: 3600 },
      { x: 2910, y: 3280 }, { x: 2960, y: 2880 }, { x: 2890, y: 2480 }, { x: 2940, y: 2160 },
      { x: 2880, y: 1790 }, { x: 2940, y: 1450 }, { x: 2890, y: 1100 }, { x: 2920, y: 790 },
      { x: 2830, y: 400 }, { x: 2850, y: 0 }
    ];
    var oceanPoints = [
      { x: 4490, y: 1770 }, { x: 4800, y: 1770 }, { x: 4800, y: 3600 }, { x: 3230, y: 3600 },
      { x: 3320, y: 3460 }, { x: 3560, y: 3380 }, { x: 3800, y: 3440 }, { x: 4050, y: 3300 },
      { x: 4240, y: 3090 }, { x: 4340, y: 2840 }, { x: 4420, y: 2540 }, { x: 4450, y: 2220 }
    ];
    var lakePoints = makeEllipse(790, 2920, 430, 280, 30, 0.035, random);
    this.water = [
      { id: "river", name: "叶隙河", kind: "river", points: riverPoints, bounds: polygonBounds(riverPoints), surfaces: [] },
      { id: "ocean", name: "离岛海域", kind: "ocean", points: oceanPoints, bounds: polygonBounds(oceanPoints), surfaces: [] },
      { id: "star-lake", name: "星夜湖", kind: "lake", points: lakePoints, bounds: polygonBounds(lakePoints), surfaces: [] }
    ];

    this._addBridge("north-bridge", "叶隙石桥", 2820, 1230, 520, 142, "stone", "river");
    this._addBridge("middle-bridge", "风里木桥", 2820, 2070, 540, 136, "wood", "river");
    this._addBridge("south-bridge", "南渡桥", 2820, 3090, 540, 142, "stone", "river");
    this._addBridge("lake-dock", "星夜湖栈台", 1260, 2910, 270, 86, "dock", "star-lake");

    for (var w = 0; w < this.water.length; w += 1) {
      var body = this.water[w];
      body.lines = [];
      var lineCount = body.kind === "ocean" ? 74 : body.kind === "river" ? 48 : 30;
      var attempts = 0;
      while (body.lines.length < lineCount && attempts < lineCount * 20) {
        attempts += 1;
        var x = random.range(body.bounds.minX + 12, body.bounds.maxX - 12);
        var y = random.range(body.bounds.minY + 12, body.bounds.maxY - 12);
        if (pointInPolygon(x, y, body.points)) {
          body.lines.push({ x: x, y: y, length: random.range(18, body.kind === "ocean" ? 74 : 48), phase: random.range(0, TAU) });
        }
      }
    }
  };

  World.prototype._preparePath = function (path, random) {
    path.edgeA = [];
    path.edgeB = [];
    path.texture = [];
    for (var i = 0; i < path.points.length; i += 1) {
      var previous = path.points[Math.max(0, i - 1)];
      var next = path.points[Math.min(path.points.length - 1, i + 1)];
      var dx = next.x - previous.x;
      var dy = next.y - previous.y;
      var length = Math.sqrt(dx * dx + dy * dy) || 1;
      var nx = -dy / length;
      var ny = dx / length;
      var jitterA = random.range(-4, 4);
      var jitterB = random.range(-4, 4);
      path.edgeA.push({ x: path.points[i].x + nx * (path.width / 2 + jitterA), y: path.points[i].y + ny * (path.width / 2 + jitterA) });
      path.edgeB.push({ x: path.points[i].x - nx * (path.width / 2 + jitterB), y: path.points[i].y - ny * (path.width / 2 + jitterB) });
      if (i < path.points.length - 1) {
        var end = path.points[i + 1];
        var segmentLength = Math.sqrt(distanceSquared(path.points[i].x, path.points[i].y, end.x, end.y));
        var marks = Math.max(1, Math.floor(segmentLength / 75));
        for (var m = 0; m < marks; m += 1) {
          var t = random.next();
          var side = random.range(-0.38, 0.38) * path.width;
          path.texture.push({
            x: path.points[i].x + (end.x - path.points[i].x) * t + nx * side,
            y: path.points[i].y + (end.y - path.points[i].y) * t + ny * side,
            angle: random.range(0, TAU),
            size: random.range(2, 6)
          });
        }
      }
    }
  };

  World.prototype._addBridge = function (id, name, x, y, width, height, kind, waterId) {
    var bridge = { id: id, name: name, kind: kind, shape: "rect", x: x, y: y, w: width, h: height };
    this.bridges.push(bridge);
    var body = this.water.find(function (item) { return item.id === waterId; });
    if (body) body.surfaces.push(bridge);
  };

  World.prototype._addObstacle = function (obstacle) {
    if (obstacle.shape === "rect") {
      obstacle.minX = obstacle.x - obstacle.w / 2;
      obstacle.maxX = obstacle.x + obstacle.w / 2;
      obstacle.minY = obstacle.y - obstacle.h / 2;
      obstacle.maxY = obstacle.y + obstacle.h / 2;
    } else if (obstacle.shape === "circle") {
      obstacle.minX = obstacle.x - obstacle.r;
      obstacle.maxX = obstacle.x + obstacle.r;
      obstacle.minY = obstacle.y - obstacle.r;
      obstacle.maxY = obstacle.y + obstacle.r;
    } else {
      var bounds = polygonBounds(obstacle.points);
      obstacle.minX = bounds.minX;
      obstacle.maxX = bounds.maxX;
      obstacle.minY = bounds.minY;
      obstacle.maxY = bounds.maxY;
    }
    obstacle.solid = obstacle.solid !== false;
    this.obstacles.push(obstacle);
    if (this._spatialReady) this._indexObstacle(obstacle);
    return obstacle;
  };

  World.prototype._addBuilding = function (id, name, style, x, baseY, width, depth, height) {
    var building = { id: id, name: name, kind: "building", style: style, x: x, y: baseY, w: width, d: depth, h: height };
    this.props.push(building);
    this._addObstacle({ id: id + "-wall", kind: "building", shape: "rect", x: x, y: baseY - depth / 2, w: width, h: depth, ref: building });
    this._reserved.push({ x: x, y: baseY, radius: Math.max(width, depth) * 0.65 });
    return building;
  };

  World.prototype._addTree = function (x, y, scale, biome, variant, ancient) {
    var tree = {
      id: "tree-" + this.trees.length,
      kind: "tree",
      x: x,
      y: y,
      scale: scale,
      size: (ancient ? 178 : 104) * scale,
      radius: (ancient ? 36 : 18) * scale,
      biome: biome,
      variant: variant || 0,
      ancient: !!ancient,
      phase: (this.trees.length * 2.399963) % TAU
    };
    this.trees.push(tree);
    this._addObstacle({ id: tree.id + "-trunk", kind: "tree", shape: "circle", x: x, y: y - 3, r: tree.radius, ref: tree });
    return tree;
  };

  World.prototype._addRock = function (x, y, radius, biome, random) {
    var points = [];
    var count = random ? random.int(6, 9) : 7;
    for (var i = 0; i < count; i += 1) {
      var angle = i / count * TAU;
      var r = radius * (random ? random.range(0.78, 1.12) : 1);
      points.push({ x: Math.cos(angle) * r, y: Math.sin(angle) * r * 0.72 });
    }
    var rock = { id: "rock-" + this.props.length, kind: "rock", x: x, y: y, radius: radius, points: points, biome: biome, rotation: random ? random.range(-0.3, 0.3) : 0 };
    this.props.push(rock);
    this._addObstacle({ id: rock.id + "-body", kind: "rock", shape: "circle", x: x, y: y, r: radius * 0.82, ref: rock });
    return rock;
  };

  World.prototype._buildStructures = function () {
    this._addBuilding("guild-main", "龙游会馆", "guild", 2250, 930, 620, 250, 238);
    this._addBuilding("guild-west", "会馆西厢", "guild", 1730, 1030, 250, 180, 142);
    this._addBuilding("guild-east", "会馆东厢", "guild", 2530, 850, 210, 170, 136);

    this._addBuilding("city-bookstore", "街角书屋", "city", 3370, 850, 350, 240, 205);
    this._addBuilding("city-apartment", "旧城居民楼", "city", 4180, 850, 420, 260, 250);
    this._addBuilding("city-store", "杂货铺", "city", 3330, 1690, 310, 190, 150);
    this._addBuilding("city-cafe", "街角咖啡", "city", 4260, 1690, 360, 190, 156);

    this._addBuilding("jun-pavilion", "君阁", "lanxi", 1950, 2530, 360, 200, 232);
    this._addBuilding("lanxi-house-west", "湖畔医舍", "lanxi", 1510, 3220, 270, 180, 145);
    this._addBuilding("lanxi-house-east", "蓝溪民居", "lanxi", 2350, 2850, 280, 180, 150);
    this._addBuilding("lanxi-house-south", "南巷人家", "lanxi", 2040, 3340, 340, 180, 148);
    this._addBuilding("coast-hut", "听潮小屋", "coast", 3590, 2640, 270, 170, 132);

    this._addTree(830, 1150, 1.45, "forest", 2, true);
    this._reserved.push({ x: 830, y: 1150, radius: 160 });

    var signs = [
      ["sign-forest", "叶隙森林", 550, 1780, "forest"],
      ["sign-guild", "龙游会馆", 2040, 1370, "guild"],
      ["sign-city", "城市街角", 3500, 1260, "city"],
      ["sign-coast", "离岛海岸", 3900, 2530, "coast"],
      ["sign-lanxi", "蓝溪镇", 2180, 3120, "lanxi"]
    ];
    for (var i = 0; i < signs.length; i += 1) {
      var data = signs[i];
      this.props.push({ id: data[0], kind: "sign", name: data[1], x: data[2], y: data[3], biome: data[4] });
      this._addObstacle({ id: data[0] + "-post", kind: "sign", shape: "circle", x: data[2], y: data[3], r: 10 });
      this._reserved.push({ x: data[2], y: data[3], radius: 54 });
    }

    var lampPositions = [
      [3470, 1330], [3740, 1330], [4050, 1330], [4040, 1530], [3740, 1530],
      [3790, 960], [3990, 1110], [3820, 1850], [4110, 2020]
    ];
    for (var l = 0; l < lampPositions.length; l += 1) {
      var lamp = { id: "street-lamp-" + l, kind: "lamp", x: lampPositions[l][0], y: lampPositions[l][1], phase: l * 0.7 };
      this.props.push(lamp);
      this._addObstacle({ id: lamp.id + "-base", kind: "lamp", shape: "circle", x: lamp.x, y: lamp.y, r: 9 });
      this._reserved.push({ x: lamp.x, y: lamp.y, radius: 38 });
    }

    var stalls = [
      { id: "guild-tea", kind: "stall", name: "茶摊", x: 1900, y: 1170, color: "#a7684e" },
      { id: "lanxi-herbs", kind: "stall", name: "草药摊", x: 2240, y: 3210, color: "#728e68" },
      { id: "coast-net", kind: "stall", name: "补网架", x: 3820, y: 2860, color: "#6d8991" }
    ];
    for (var s = 0; s < stalls.length; s += 1) {
      var stall = stalls[s];
      this.props.push(stall);
      this._addObstacle({ id: stall.id + "-counter", kind: "stall", shape: "rect", x: stall.x, y: stall.y - 12, w: 94, h: 46 });
      this._reserved.push({ x: stall.x, y: stall.y, radius: 80 });
    }
  };

  World.prototype._buildInteractables = function () {
    var quests = [
      { id: "quest-forest-echo", type: "quest", name: "倾听叶隙回响", x: 760, y: 1590, data: { quest: "main", stage: 0, zone: "叶隙森林", clue: "leaf" } },
      { id: "quest-guild-archive", type: "quest", name: "查看会馆留档", x: 2250, y: 1020, data: { quest: "main", stage: 1, zone: "龙游会馆", clue: "archive" } },
      { id: "quest-city-resonance", type: "quest", name: "辨认金属余振", x: 3650, y: 1190, data: { quest: "main", stage: 2, zone: "城市街角", clue: "metal" } },
      { id: "quest-coast-memory", type: "quest", name: "拾起潮汐记忆", x: 4170, y: 2610, data: { quest: "main", stage: 3, zone: "离岛海岸", clue: "tide" } },
      { id: "quest-lanxi-confluence", type: "quest", name: "安抚星夜湖回响", x: 1260, y: 2910, data: { quest: "main", stage: 4, zone: "蓝溪镇", clue: "confluence" } }
    ];
    var teleports = [
      { id: "tp-forest", type: "teleport", name: "叶隙传送点", x: 480, y: 2050, data: { teleportId: "forest", zone: "叶隙森林" } },
      { id: "tp-guild", type: "teleport", name: "会馆传送点", x: 2040, y: 1280, data: { teleportId: "guild", zone: "龙游会馆" } },
      { id: "tp-city", type: "teleport", name: "街角传送点", x: 3530, y: 1110, data: { teleportId: "city", zone: "城市街角" } },
      { id: "tp-coast", type: "teleport", name: "听潮传送点", x: 3990, y: 2790, data: { teleportId: "coast", zone: "离岛海岸" } },
      { id: "tp-lanxi", type: "teleport", name: "蓝溪传送点", x: 2040, y: 3090, data: { teleportId: "lanxi", zone: "蓝溪镇" } }
    ];
    var extras = [
      { id: "lore-ancient-tree", type: "lore", name: "古树的年轮", x: 930, y: 1210, data: { topic: "森林与栖息" } },
      { id: "lore-star-lake", type: "lore", name: "星夜湖石刻", x: 1390, y: 2820, data: { topic: "蓝溪镇旧闻" } },
      { id: "rest-guild", type: "rest", name: "在茶摊稍作休息", x: 1900, y: 1240, data: { recovery: "gentle" } },
      { id: "view-coast", type: "lore", name: "眺望离岛潮线", x: 4270, y: 2820, data: { topic: "离岛与故乡" } }
    ];
    this.interactables = quests.concat(teleports, extras);
    for (var i = 0; i < this.interactables.length; i += 1) {
      var target = this.interactables[i];
      target.interactionRadius = target.type === "quest" ? 24 : 12;
      this._reserved.push({ x: target.x, y: target.y, radius: target.type === "quest" ? 100 : 74 });
      this.spawnPoints[target.id] = { x: target.x, y: target.y };
      if (target.type === "quest") {
        this.props.push({ id: target.id + "-visual", kind: "echo", x: target.x, y: target.y, refId: target.id, stage: target.data.stage, phase: i * 0.9 });
      } else if (target.type === "teleport") {
        this.props.push({ id: target.id + "-visual", kind: "waypoint", x: target.x, y: target.y, refId: target.id, flat: true, phase: i * 0.6 });
      }
    }
    this.questTargets = quests;
    this.teleportPoints = teleports;
  };

  World.prototype._buildSpawnSuggestions = function () {
    this.npcSpawns = [
      { id: "wuxian", name: "无限", x: 2110, y: 1100, zone: "龙游会馆", facing: "down" },
      { id: "panjing", name: "潘靖", x: 2370, y: 1090, zone: "龙游会馆", facing: "down" },
      { id: "xiaobai", name: "罗小白", x: 690, y: 1950, zone: "叶隙森林", facing: "right" },
      { id: "agen", name: "阿根", x: 1810, y: 2830, zone: "蓝溪镇", facing: "down" },
      { id: "laojun", name: "老君", x: 1950, y: 2620, zone: "蓝溪镇", facing: "down" },
      { id: "luozhu", name: "洛竹", x: 3740, y: 2360, zone: "离岛海岸", facing: "right" }
    ];
    this.npcSpawnPoints = this.npcSpawns;
    this.patrolPoints = [
      { id: "patrol-forest", zone: "叶隙森林", kind: "游离灵团", x: 1110, y: 1420, waypoints: [{ x: 1110, y: 1420 }, { x: 1220, y: 1260 }, { x: 1070, y: 1110 }, { x: 970, y: 1390 }] },
      { id: "patrol-guild", zone: "龙游会馆", kind: "失控纸灵", x: 1810, y: 1540, waypoints: [{ x: 1810, y: 1540 }, { x: 2040, y: 1510 }, { x: 2130, y: 1690 }, { x: 1880, y: 1790 }] },
      { id: "patrol-city", zone: "城市街角", kind: "金属残响", x: 3550, y: 1580, waypoints: [{ x: 3550, y: 1580 }, { x: 3660, y: 1550 }, { x: 3650, y: 1240 }, { x: 3570, y: 1280 }] },
      { id: "patrol-coast", zone: "离岛海岸", kind: "潮生幻形", x: 3830, y: 2490, waypoints: [{ x: 3830, y: 2490 }, { x: 4050, y: 2500 }, { x: 4120, y: 2900 }, { x: 3980, y: 3010 }] },
      { id: "patrol-lanxi", zone: "蓝溪镇", kind: "湖畔影灵", x: 1450, y: 2700, waypoints: [{ x: 1450, y: 2700 }, { x: 1370, y: 2520 }, { x: 1230, y: 2550 }, { x: 1300, y: 2740 }] }
    ];
    for (var i = 0; i < this.npcSpawns.length; i += 1) {
      this._reserved.push({ x: this.npcSpawns[i].x, y: this.npcSpawns[i].y, radius: 76 });
    }
    for (var p = 0; p < this.patrolPoints.length; p += 1) {
      var patrol = this.patrolPoints[p];
      for (var w = 0; w < patrol.waypoints.length; w += 1) {
        this._reserved.push({ x: patrol.waypoints[w].x, y: patrol.waypoints[w].y, radius: 70 });
      }
    }
    this._reserved.push({ x: 620, y: 1880, radius: 150 });
  };

  World.prototype._isReserved = function (x, y, extra) {
    for (var i = 0; i < this._reserved.length; i += 1) {
      var reserved = this._reserved[i];
      var radius = reserved.radius + (extra || 0);
      if (distanceSquared(x, y, reserved.x, reserved.y) < radius * radius) return true;
    }
    return false;
  };

  World.prototype._nearPath = function (x, y, clearance) {
    for (var i = 0; i < this.paths.length; i += 1) {
      var path = this.paths[i];
      var limit = path.width / 2 + clearance;
      var limitSquared = limit * limit;
      for (var p = 0; p < path.points.length - 1; p += 1) {
        var a = path.points[p];
        var b = path.points[p + 1];
        if (segmentDistanceSquared(x, y, a.x, a.y, b.x, b.y) < limitSquared) return true;
      }
    }
    return false;
  };

  World.prototype._canPlace = function (x, y, radius, pathClearance) {
    if (this._isReserved(x, y, radius)) return false;
    if (pathClearance > 0 && this._nearPath(x, y, pathClearance + radius)) return false;
    return this.isWalkable(x, y, radius);
  };

  World.prototype._scatterTrees = function (options) {
    var random = new Random(seedFrom(options.seed));
    var placed = 0;
    var attempts = 0;
    while (placed < options.count && attempts < options.count * 35) {
      attempts += 1;
      var x = random.range(options.minX, options.maxX);
      var y = random.range(options.minY, options.maxY);
      var scale = random.range(options.minScale || 0.72, options.maxScale || 1.25);
      var radius = 19 * scale;
      if (!this._canPlace(x, y, radius + 18, 30)) continue;
      if (this.zoneAt(x, y).id !== options.zone) continue;
      this._addTree(x, y, scale, options.zone, random.int(0, 3), false);
      placed += 1;
    }
  };

  World.prototype._buildDecorations = function () {
    this._scatterTrees({ seed: "森林乔木", zone: "forest", count: 205, minX: 110, maxX: 1450, minY: 100, maxY: 2410, minScale: 0.72, maxScale: 1.28 });
    this._scatterTrees({ seed: "会馆庭院树", zone: "guild", count: 34, minX: 1450, maxX: 2650, minY: 130, maxY: 2320, minScale: 0.7, maxScale: 1.08 });
    this._scatterTrees({ seed: "蓝溪绿树", zone: "lanxi", count: 43, minX: 1080, maxX: 2630, minY: 2400, maxY: 3480, minScale: 0.68, maxScale: 1.12 });
    this._scatterTrees({ seed: "海岸风树", zone: "coast", count: 32, minX: 3020, maxX: 4300, minY: 1900, maxY: 3340, minScale: 0.62, maxScale: 1.0 });
    this._scatterTrees({ seed: "街角行道树", zone: "city", count: 15, minX: 3040, maxX: 4530, minY: 250, maxY: 1800, minScale: 0.64, maxScale: 0.92 });

    var random = new Random(seedFrom("岩石草丛与花"));
    var rockRegions = [
      { zone: "forest", count: 30, minX: 150, maxX: 1450, minY: 180, maxY: 2380, biome: "forest" },
      { zone: "coast", count: 25, minX: 3050, maxX: 4440, minY: 1910, maxY: 3420, biome: "coast" },
      { zone: "lanxi", count: 14, minX: 1200, maxX: 2580, minY: 2440, maxY: 3440, biome: "lanxi" }
    ];
    for (var r = 0; r < rockRegions.length; r += 1) {
      var region = rockRegions[r];
      var placed = 0;
      var attempts = 0;
      while (placed < region.count && attempts < region.count * 30) {
        attempts += 1;
        var x = random.range(region.minX, region.maxX);
        var y = random.range(region.minY, region.maxY);
        var radius = random.range(14, 34);
        if (this.zoneAt(x, y).id !== region.zone || !this._canPlace(x, y, radius + 12, 26)) continue;
        this._addRock(x, y, radius, region.biome, random);
        placed += 1;
      }
    }

    var decorRegions = [
      { zone: "forest", count: 240, minX: 100, maxX: 1450, minY: 100, maxY: 2420 },
      { zone: "guild", count: 90, minX: 1420, maxX: 2660, minY: 100, maxY: 2340 },
      { zone: "lanxi", count: 130, minX: 1000, maxX: 2660, minY: 2390, maxY: 3490 },
      { zone: "coast", count: 95, minX: 3000, maxX: 4470, minY: 1870, maxY: 3450 },
      { zone: "city", count: 40, minX: 3000, maxX: 4550, minY: 180, maxY: 1820 }
    ];
    for (var d = 0; d < decorRegions.length; d += 1) {
      var decor = decorRegions[d];
      var made = 0;
      var tries = 0;
      while (made < decor.count && tries < decor.count * 15) {
        tries += 1;
        var dx = random.range(decor.minX, decor.maxX);
        var dy = random.range(decor.minY, decor.maxY);
        if (this.zoneAt(dx, dy).id !== decor.zone || !this.isWalkable(dx, dy, 4) || this._nearPath(dx, dy, 5)) continue;
        var typeRoll = random.next();
        var type = typeRoll < 0.64 ? "grass" : typeRoll < 0.88 ? "flower" : "leaf";
        if (decor.zone === "coast") type = typeRoll < 0.62 ? "grass" : typeRoll < 0.86 ? "shell" : "leaf";
        if (decor.zone === "city") type = typeRoll < 0.7 ? "grass" : "leaf";
        this.groundDecor.push({ x: dx, y: dy, type: type, zone: decor.zone, size: random.range(3, 8), angle: random.range(0, TAU), tint: random.int(0, 3) });
        made += 1;
      }
    }
  };

  World.prototype._indexObstacle = function (obstacle) {
    var minCellX = Math.floor(obstacle.minX / this.cellSize);
    var maxCellX = Math.floor(obstacle.maxX / this.cellSize);
    var minCellY = Math.floor(obstacle.minY / this.cellSize);
    var maxCellY = Math.floor(obstacle.maxY / this.cellSize);
    for (var y = minCellY; y <= maxCellY; y += 1) {
      for (var x = minCellX; x <= maxCellX; x += 1) {
        var key = x + "," + y;
        var cell = this._spatial.get(key);
        if (!cell) {
          cell = [];
          this._spatial.set(key, cell);
        }
        cell.push(obstacle);
      }
    }
  };

  World.prototype.rebuildCollisionIndex = function () {
    this._spatial = new Map();
    this._spatialReady = false;
    for (var i = 0; i < this.obstacles.length; i += 1) this._indexObstacle(this.obstacles[i]);
    this._spatialReady = true;
  };

  World.prototype._queryObstacles = function (x, y, radius) {
    if (!this._spatialReady) return this.obstacles;
    var results = [];
    var minCellX = Math.floor((x - radius) / this.cellSize);
    var maxCellX = Math.floor((x + radius) / this.cellSize);
    var minCellY = Math.floor((y - radius) / this.cellSize);
    var maxCellY = Math.floor((y + radius) / this.cellSize);
    this._queryId += 1;
    for (var cy = minCellY; cy <= maxCellY; cy += 1) {
      for (var cx = minCellX; cx <= maxCellX; cx += 1) {
        var cell = this._spatial.get(cx + "," + cy);
        if (!cell) continue;
        for (var i = 0; i < cell.length; i += 1) {
          var obstacle = cell[i];
          if (obstacle._queryId === this._queryId) continue;
          obstacle._queryId = this._queryId;
          results.push(obstacle);
        }
      }
    }
    return results;
  };

  World.prototype._obstacleIntersects = function (obstacle, x, y, radius) {
    if (!obstacle.solid || obstacle.enabled === false) return false;
    if (x + radius < obstacle.minX || x - radius > obstacle.maxX || y + radius < obstacle.minY || y - radius > obstacle.maxY) return false;
    if (obstacle.shape === "circle") {
      var combined = radius + obstacle.r;
      return distanceSquared(x, y, obstacle.x, obstacle.y) <= combined * combined;
    }
    if (obstacle.shape === "rect") return circleHitsRect(x, y, radius, obstacle);
    return circleHitsPolygon(x, y, radius, obstacle.points);
  };

  World.prototype._waterBlocked = function (x, y, radius) {
    for (var i = 0; i < this.water.length; i += 1) {
      var body = this.water[i];
      var bounds = body.bounds;
      if (x + radius < bounds.minX || x - radius > bounds.maxX || y + radius < bounds.minY || y - radius > bounds.maxY) continue;
      if (!circleHitsPolygon(x, y, radius, body.points)) continue;
      var onSurface = false;
      for (var s = 0; s < body.surfaces.length; s += 1) {
        var surface = body.surfaces[s];
        if (surface.enabled !== false && rectContainsCircle(x, y, radius, surface)) {
          onSurface = true;
          break;
        }
      }
      if (!onSurface) return true;
    }
    return false;
  };

  World.prototype.isWalkable = function (x, y, radius) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return false;
    var r = Number.isFinite(radius) ? Math.max(0, radius) : 16;
    if (x - r < this.bounds.left || x + r > this.bounds.right || y - r < this.bounds.top || y + r > this.bounds.bottom) return false;
    if (this._waterBlocked(x, y, r)) return false;
    var obstacles = this._queryObstacles(x, y, r);
    for (var i = 0; i < obstacles.length; i += 1) {
      if (this._obstacleIntersects(obstacles[i], x, y, r)) return false;
    }
    return true;
  };

  World.prototype.resolveMovement = function (actor, dx, dy) {
    if (!actor) return { x: 0, y: 0 };
    var startX = Number.isFinite(actor.x) ? actor.x : 0;
    var startY = Number.isFinite(actor.y) ? actor.y : 0;
    var moveX = Number.isFinite(dx) ? dx : 0;
    var moveY = Number.isFinite(dy) ? dy : 0;
    var radius = Number.isFinite(actor.radius) ? Math.max(1, actor.radius) : 18;
    var maxDistance = Math.max(Math.abs(moveX), Math.abs(moveY));
    if (!maxDistance) return { x: startX, y: startY };
    var stepSize = Math.max(4, Math.min(12, radius * 0.45));
    var steps = Math.max(1, Math.ceil(maxDistance / stepSize));
    steps = Math.min(steps, 2048);
    var stepX = moveX / steps;
    var stepY = moveY / steps;
    var x = startX;
    var y = startY;
    for (var i = 0; i < steps; i += 1) {
      var nextX = x + stepX;
      var nextY = y + stepY;
      if (this.isWalkable(nextX, nextY, radius)) {
        x = nextX;
        y = nextY;
        continue;
      }
      if (Math.abs(stepX) > 1e-8 && this.isWalkable(nextX, y, radius)) x = nextX;
      if (Math.abs(stepY) > 1e-8 && this.isWalkable(x, nextY, radius)) y = nextY;
    }
    return { x: x, y: y };
  };

  World.prototype.zoneAt = function (x, y) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    if (x >= 2860) {
      return y >= 1860 ? this.zones[3] : this.zones[2];
    }
    if (y >= 2380) return this.zones[4];
    if (x >= 1420) return this.zones[1];
    return this.zones[0];
  };

  World.prototype.nearestInteraction = function (x, y, radius) {
    if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
    var reach = Number.isFinite(radius) ? Math.max(0, radius) : 88;
    var nearest = null;
    var nearestDistance = Infinity;
    var sources = this.interactables;
    var npcCount = this.game && Array.isArray(this.game.npcs) ? this.game.npcs.length : 0;
    var total = sources.length + npcCount;
    for (var i = 0; i < total; i += 1) {
      var target = i < sources.length ? sources[i] : this.game.npcs[i - sources.length];
      if (!target || target.enabled === false || target.hidden || target.interactable === false) continue;
      if (!Number.isFinite(target.x) || !Number.isFinite(target.y)) continue;
      var targetReach = reach + (target.interactionRadius || 0);
      var d2 = distanceSquared(x, y, target.x, target.y);
      if (d2 <= targetReach * targetReach && d2 < nearestDistance) {
        nearest = target;
        nearestDistance = d2;
      }
    }
    return nearest;
  };

  World.prototype.update = function (dt) {
    if (Number.isFinite(dt)) this.time += Math.max(0, Math.min(dt, 0.1));
  };

  World.prototype._setView = function (ctx, margin) {
    var game = this.game || {};
    var camera = game.camera || {};
    var player = game.player || {};
    var dpr = game.dpr || 1;
    var canvas = game.canvas || ctx.canvas || {};
    var width = game.width || (canvas.width ? canvas.width / dpr : 1280);
    var height = game.height || (canvas.height ? canvas.height / dpr : 720);
    var zoom = camera.zoom || 1;
    var centerX = Number.isFinite(camera.x) ? camera.x : Number.isFinite(player.x) ? player.x : this.width / 2;
    var centerY = Number.isFinite(camera.y) ? camera.y : Number.isFinite(player.y) ? player.y : this.height / 2;
    this._view = {
      left: centerX - width / (2 * zoom) - margin,
      right: centerX + width / (2 * zoom) + margin,
      top: centerY - height / (2 * zoom) - margin,
      bottom: centerY + height / (2 * zoom) + margin
    };
  };

  World.prototype._visible = function (x, y, margin) {
    var view = this._view;
    if (!view) return true;
    var pad = margin || 0;
    return x >= view.left - pad && x <= view.right + pad && y >= view.top - pad && y <= view.bottom + pad;
  };

  World.prototype.drawGround = function (ctx) {
    if (!ctx) return;
    this._setView(ctx, 120);
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.fillStyle = "#7f9b72";
    ctx.fillRect(0, 0, this.width, this.height);

    for (var p = 0; p < this.groundPatches.length; p += 1) {
      var patch = this.groundPatches[p];
      tracePolygon(ctx, patch.points);
      ctx.fillStyle = patch.color;
      ctx.fill();
    }

    ctx.fillStyle = "#969f91";
    roundedRect(ctx, 3000, 150, 1570, 1690, 160);
    ctx.fill();
    ctx.strokeStyle = "rgba(70,82,70,0.24)";
    ctx.lineWidth = 3;
    for (var streetY = 360; streetY < 1760; streetY += 210) {
      ctx.beginPath();
      ctx.moveTo(3060, streetY);
      ctx.lineTo(4500, streetY + 20);
      ctx.stroke();
    }

    this._drawGroundDecor(ctx);
    for (var i = 0; i < this.paths.length; i += 1) this._drawPath(ctx, this.paths[i]);
    for (var w = 0; w < this.water.length; w += 1) this._drawWater(ctx, this.water[w]);
    for (var b = 0; b < this.bridges.length; b += 1) this._drawBridge(ctx, this.bridges[b]);

    ctx.strokeStyle = "#4c6653";
    ctx.lineWidth = 20;
    ctx.strokeRect(42, 42, this.width - 84, this.height - 84);
    ctx.strokeStyle = "rgba(218,221,172,0.6)";
    ctx.lineWidth = 3;
    ctx.strokeRect(58, 58, this.width - 116, this.height - 116);
    ctx.restore();
  };

  World.prototype._drawGroundDecor = function (ctx) {
    var flowerColors = ["#eee2a6", "#d8b5bd", "#b9d6c0", "#d6c3e1"];
    for (var i = 0; i < this.groundDecor.length; i += 1) {
      var item = this.groundDecor[i];
      if (!this._visible(item.x, item.y, 12)) continue;
      ctx.save();
      ctx.translate(item.x, item.y);
      ctx.rotate(item.angle);
      if (item.type === "grass") {
        ctx.strokeStyle = item.zone === "coast" ? "#8e9867" : item.zone === "city" ? "#647b65" : "#4f7956";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        ctx.moveTo(-item.size, 3);
        ctx.quadraticCurveTo(-item.size * 0.5, -item.size, 0, 2);
        ctx.quadraticCurveTo(item.size * 0.3, -item.size * 1.4, item.size, 3);
        ctx.stroke();
      } else if (item.type === "flower") {
        ctx.fillStyle = flowerColors[item.tint];
        for (var petal = 0; petal < 4; petal += 1) {
          ctx.beginPath();
          ctx.ellipse(Math.cos(petal * Math.PI / 2) * 3, Math.sin(petal * Math.PI / 2) * 3, 2.6, 1.8, petal, 0, TAU);
          ctx.fill();
        }
        ctx.fillStyle = "#a88b51";
        ctx.beginPath();
        ctx.arc(0, 0, 1.5, 0, TAU);
        ctx.fill();
      } else if (item.type === "shell") {
        ctx.fillStyle = "#e2d4b4";
        ctx.strokeStyle = "#9d9179";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(0, 0, item.size * 0.65, Math.PI, TAU);
        ctx.closePath();
        ctx.fill();
        ctx.stroke();
      } else {
        ctx.fillStyle = item.zone === "coast" ? "#ab9464" : "#a58755";
        ctx.beginPath();
        ctx.ellipse(0, 0, item.size, item.size * 0.35, 0, 0, TAU);
        ctx.fill();
      }
      ctx.restore();
    }
  };

  World.prototype._drawPath = function (ctx, path) {
    var colors = path.kind === "city" ? ["#606d68", "#b5b6a5", "#cdccb8"] : path.kind === "stone" ? ["#697663", "#b6b397", "#d4cfb0"] : path.kind === "boardwalk" ? ["#655d4c", "#aa936e", "#c7ad80"] : ["#677653", "#bdad7f", "#d6c794"];
    ctx.strokeStyle = colors[0];
    ctx.lineWidth = path.width + 12;
    traceLine(ctx, path.points);
    ctx.stroke();
    ctx.strokeStyle = colors[1];
    ctx.lineWidth = path.width;
    ctx.stroke();
    ctx.strokeStyle = colors[2];
    ctx.globalAlpha = 0.66;
    ctx.lineWidth = Math.max(10, path.width - 18);
    ctx.stroke();
    ctx.globalAlpha = 1;
    ctx.strokeStyle = "rgba(74,76,54,0.42)";
    ctx.lineWidth = 2;
    traceLine(ctx, path.edgeA);
    ctx.stroke();
    traceLine(ctx, path.edgeB);
    ctx.stroke();
    ctx.fillStyle = path.kind === "city" ? "rgba(72,80,75,0.3)" : "rgba(104,88,58,0.3)";
    for (var i = 0; i < path.texture.length; i += 1) {
      var mark = path.texture[i];
      if (!this._visible(mark.x, mark.y, 8)) continue;
      ctx.beginPath();
      ctx.ellipse(mark.x, mark.y, mark.size, mark.size * 0.45, mark.angle, 0, TAU);
      ctx.fill();
    }
    if (path.kind === "city") {
      ctx.strokeStyle = "rgba(240,229,174,0.66)";
      ctx.lineWidth = 3;
      ctx.setLineDash([24, 26]);
      traceLine(ctx, path.points);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  };

  World.prototype._drawWater = function (ctx, body) {
    var reduced = this.game.settings && this.game.settings.reducedMotion;
    var time = reduced ? 0 : this.time;
    tracePolygon(ctx, body.points);
    ctx.strokeStyle = body.kind === "ocean" ? "#dfd09e" : "#b8b88c";
    ctx.lineWidth = body.kind === "ocean" ? 28 : 20;
    ctx.stroke();
    ctx.fillStyle = body.kind === "lake" ? "#568b94" : body.kind === "ocean" ? "#548e9e" : "#5a96a0";
    ctx.fill();
    ctx.strokeStyle = "#386c79";
    ctx.lineWidth = 3;
    ctx.stroke();
    ctx.strokeStyle = "rgba(220,241,224,0.58)";
    ctx.lineWidth = 2.2;
    for (var i = 0; i < body.lines.length; i += 1) {
      var line = body.lines[i];
      if (!this._visible(line.x, line.y, 70)) continue;
      var drift = Math.sin(time * 1.2 + line.phase) * 7;
      ctx.beginPath();
      ctx.moveTo(line.x - line.length / 2 + drift, line.y);
      ctx.quadraticCurveTo(line.x + drift, line.y - 4 - Math.sin(time + line.phase) * 2, line.x + line.length / 2 + drift, line.y);
      ctx.stroke();
    }
  };

  World.prototype._drawBridge = function (ctx, bridge) {
    ctx.save();
    ctx.translate(bridge.x, bridge.y);
    ctx.fillStyle = "rgba(42,55,51,0.25)";
    ctx.fillRect(-bridge.w / 2 + 5, -bridge.h / 2 + 10, bridge.w, bridge.h);
    ctx.fillStyle = bridge.kind === "stone" ? "#aaa991" : "#9b805a";
    ctx.strokeStyle = "#525e53";
    ctx.lineWidth = 4;
    ctx.fillRect(-bridge.w / 2, -bridge.h / 2, bridge.w, bridge.h);
    ctx.strokeRect(-bridge.w / 2, -bridge.h / 2, bridge.w, bridge.h);
    ctx.fillStyle = bridge.kind === "stone" ? "#c9c6a9" : "#bea174";
    ctx.fillRect(-bridge.w / 2 + 5, -bridge.h / 2 + 9, bridge.w - 10, bridge.h - 18);
    ctx.strokeStyle = bridge.kind === "stone" ? "rgba(85,91,77,0.42)" : "rgba(88,65,42,0.5)";
    ctx.lineWidth = 2;
    for (var x = -bridge.w / 2 + 18; x < bridge.w / 2; x += bridge.kind === "stone" ? 48 : 25) {
      ctx.beginPath();
      ctx.moveTo(x, -bridge.h / 2 + 9);
      ctx.lineTo(x + 3, bridge.h / 2 - 9);
      ctx.stroke();
    }
    ctx.strokeStyle = "#596557";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-bridge.w / 2, -bridge.h / 2 + 5);
    ctx.lineTo(bridge.w / 2, -bridge.h / 2 + 5);
    ctx.moveTo(-bridge.w / 2, bridge.h / 2 - 5);
    ctx.lineTo(bridge.w / 2, bridge.h / 2 - 5);
    ctx.stroke();
    ctx.restore();
  };

  World.prototype.drawScenery = function (ctx, layer) {
    if (!ctx) return;
    this._setView(ctx, 360);
    var mode = layer || "all";
    var focusY = this.game.player && Number.isFinite(this.game.player.y) ? this.game.player.y : Infinity;
    ctx.save();
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (var i = 0; i < this._scene.length; i += 1) {
      var item = this._scene[i];
      if (item.flat) continue;
      if (mode === "back" && item.y > focusY) continue;
      if ((mode === "front" || mode === "foreground") && item.y <= focusY) continue;
      if (!this._visible(item.x, item.y, item.kind === "building" ? Math.max(item.w, item.h) : item.size || 120)) continue;
      if (item.kind === "tree") this._drawTree(ctx, item);
      else this._drawProp(ctx, item);
    }
    ctx.restore();
  };

  World.prototype._drawTree = function (ctx, tree) {
    var reduced = this.game.settings && this.game.settings.reducedMotion;
    var sway = reduced ? 0 : Math.sin(this.time * 0.8 + tree.phase) * 2.2;
    var size = tree.size;
    var palettes = {
      forest: ["#345f4b", "#47785a", "#5f8b63", "#789b6a"],
      guild: ["#446c50", "#5d8559", "#769764", "#91aa72"],
      lanxi: ["#3d6b59", "#57836a", "#73977a", "#91ad83"],
      coast: ["#48715e", "#678c6b", "#8a9f71", "#a3ad79"],
      city: ["#456a54", "#5e8261", "#76976b", "#8fa777"]
    };
    var palette = palettes[tree.biome] || palettes.forest;
    ctx.save();
    ctx.translate(tree.x, tree.y);
    ctx.fillStyle = "rgba(40,57,43,0.2)";
    ctx.beginPath();
    ctx.ellipse(8, 3, size * 0.35, size * 0.11, 0, 0, TAU);
    ctx.fill();
    ctx.strokeStyle = "#4b4937";
    ctx.lineWidth = Math.max(7, size * 0.1);
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.quadraticCurveTo(-size * 0.04, -size * 0.34, sway * 0.3, -size * 0.62);
    ctx.stroke();
    ctx.strokeStyle = "#776348";
    ctx.lineWidth = Math.max(3, size * 0.045);
    ctx.beginPath();
    ctx.moveTo(-2, -3);
    ctx.quadraticCurveTo(-size * 0.03, -size * 0.35, sway * 0.3 - 2, -size * 0.62);
    ctx.stroke();
    ctx.translate(sway, -size * 0.68);
    var clusters = [
      [-0.28, 0.02, 0.34, 0.27], [0.25, 0.03, 0.36, 0.28],
      [-0.1, -0.23, 0.39, 0.3], [0.13, -0.31, 0.31, 0.25], [0, 0.12, 0.43, 0.25]
    ];
    for (var i = 0; i < clusters.length; i += 1) {
      var c = clusters[(i + tree.variant) % clusters.length];
      ctx.fillStyle = palette[i % palette.length];
      ctx.strokeStyle = palette[0];
      ctx.lineWidth = tree.ancient ? 4 : 2.5;
      ctx.beginPath();
      ctx.ellipse(c[0] * size, c[1] * size, c[2] * size, c[3] * size, (i - 2) * 0.08, 0, TAU);
      ctx.fill();
      ctx.stroke();
    }
    ctx.strokeStyle = "rgba(205,218,151,0.36)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(-size * 0.1, -size * 0.2, size * 0.27, Math.PI * 1.08, Math.PI * 1.75);
    ctx.stroke();
    if (tree.ancient) {
      ctx.fillStyle = "#d7d69a";
      for (var leaf = 0; leaf < 7; leaf += 1) {
        var angle = leaf / 7 * TAU + tree.phase;
        ctx.beginPath();
        ctx.ellipse(Math.cos(angle) * size * 0.37, Math.sin(angle) * size * 0.2, 4, 2, angle, 0, TAU);
        ctx.fill();
      }
    }
    ctx.restore();
  };

  World.prototype._drawProp = function (ctx, prop) {
    if (prop.kind === "building") this._drawBuilding(ctx, prop);
    else if (prop.kind === "rock") this._drawRock(ctx, prop);
    else if (prop.kind === "sign") this._drawSign(ctx, prop);
    else if (prop.kind === "lamp") this._drawLamp(ctx, prop);
    else if (prop.kind === "stall") this._drawStall(ctx, prop);
    else if (prop.kind === "echo") this._drawEcho(ctx, prop);
  };

  World.prototype._drawBuilding = function (ctx, building) {
    var x = building.x;
    var base = building.y;
    var w = building.w;
    var d = building.d;
    var h = building.h;
    var city = building.style === "city";
    var wall = city ? "#c7bfa7" : building.style === "guild" ? "#d3c5a2" : "#d8cba9";
    var roof = city ? "#66736c" : building.style === "guild" ? "#49665b" : "#587064";
    ctx.save();
    ctx.fillStyle = "rgba(43,53,43,0.22)";
    ctx.beginPath();
    ctx.ellipse(x + 18, base + 5, w * 0.55, d * 0.22, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = wall;
    ctx.strokeStyle = "#4d584b";
    ctx.lineWidth = 4;
    ctx.fillRect(x - w / 2, base - h, w, h);
    ctx.strokeRect(x - w / 2, base - h, w, h);
    ctx.fillStyle = "rgba(103,83,56,0.14)";
    ctx.fillRect(x + w * 0.31, base - h, w * 0.19, h);

    if (city) {
      ctx.fillStyle = roof;
      ctx.fillRect(x - w / 2 - 8, base - h - 24, w + 16, 34);
      ctx.strokeRect(x - w / 2 - 8, base - h - 24, w + 16, 34);
      ctx.fillStyle = "#889087";
      ctx.fillRect(x - w * 0.28, base - h - 42, w * 0.2, 18);
      ctx.strokeRect(x - w * 0.28, base - h - 42, w * 0.2, 18);
    } else {
      ctx.fillStyle = roof;
      ctx.beginPath();
      ctx.moveTo(x - w / 2 - 34, base - h + 4);
      ctx.quadraticCurveTo(x - w * 0.42, base - h - 26, x - w * 0.28, base - h - 56);
      ctx.quadraticCurveTo(x, base - h - 94, x + w * 0.28, base - h - 56);
      ctx.quadraticCurveTo(x + w * 0.42, base - h - 26, x + w / 2 + 34, base - h + 4);
      ctx.quadraticCurveTo(x + w / 2 + 17, base - h + 17, x + w / 2 - 2, base - h + 8);
      ctx.lineTo(x - w / 2 + 2, base - h + 8);
      ctx.quadraticCurveTo(x - w / 2 - 17, base - h + 17, x - w / 2 - 34, base - h + 4);
      ctx.fill();
      ctx.stroke();
      ctx.strokeStyle = "rgba(203,211,166,0.42)";
      ctx.lineWidth = 2;
      for (var tile = -w / 2 + 18; tile < w / 2; tile += 28) {
        ctx.beginPath();
        ctx.moveTo(x + tile, base - h - 53 + Math.abs(tile) * 0.08);
        ctx.lineTo(x + tile * 1.05, base - h + 3);
        ctx.stroke();
      }
    }

    var columns = Math.max(2, Math.floor(w / 150));
    for (var i = 0; i < columns; i += 1) {
      var windowX = x - w * 0.36 + i * (w * 0.72 / Math.max(1, columns - 1));
      ctx.fillStyle = city ? "#7c9b9a" : "#e2c987";
      ctx.strokeStyle = "#586052";
      ctx.lineWidth = 3;
      ctx.fillRect(windowX - 22, base - h * 0.64, 44, 48);
      ctx.strokeRect(windowX - 22, base - h * 0.64, 44, 48);
      ctx.beginPath();
      ctx.moveTo(windowX, base - h * 0.64);
      ctx.lineTo(windowX, base - h * 0.64 + 48);
      ctx.moveTo(windowX - 22, base - h * 0.64 + 24);
      ctx.lineTo(windowX + 22, base - h * 0.64 + 24);
      ctx.stroke();
    }
    ctx.fillStyle = "#69543d";
    ctx.fillRect(x - 28, base - 78, 56, 78);
    ctx.strokeStyle = "#463f33";
    ctx.strokeRect(x - 28, base - 78, 56, 78);
    ctx.fillStyle = "#c5ae6c";
    ctx.beginPath();
    ctx.arc(x + 16, base - 37, 3, 0, TAU);
    ctx.fill();

    ctx.font = "18px KaiTi, STKaiti, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var plaqueWidth = Math.max(92, building.name.length * 23);
    ctx.fillStyle = "#42564a";
    roundedRect(ctx, x - plaqueWidth / 2, base - h - (city ? 9 : 28), plaqueWidth, 30, 4);
    ctx.fill();
    ctx.fillStyle = "#eee3b9";
    ctx.fillText(building.name, x, base - h - (city ? 9 : 28) + 15);
    ctx.restore();
  };

  World.prototype._drawRock = function (ctx, rock) {
    ctx.save();
    ctx.translate(rock.x, rock.y);
    ctx.rotate(rock.rotation);
    ctx.fillStyle = "rgba(48,61,52,0.2)";
    ctx.beginPath();
    ctx.ellipse(5, rock.radius * 0.3, rock.radius, rock.radius * 0.35, 0, 0, TAU);
    ctx.fill();
    tracePolygon(ctx, rock.points);
    ctx.fillStyle = rock.biome === "coast" ? "#aaa58d" : "#899482";
    ctx.strokeStyle = "#56675c";
    ctx.lineWidth = 3;
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "rgba(224,222,183,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-rock.radius * 0.55, -rock.radius * 0.2);
    ctx.quadraticCurveTo(0, -rock.radius * 0.7, rock.radius * 0.42, -rock.radius * 0.3);
    ctx.stroke();
    ctx.restore();
  };

  World.prototype._drawSign = function (ctx, sign) {
    ctx.save();
    ctx.translate(sign.x, sign.y);
    ctx.strokeStyle = "#554d39";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -68);
    ctx.stroke();
    ctx.fillStyle = "#a68a5d";
    ctx.strokeStyle = "#544f3c";
    ctx.lineWidth = 3;
    roundedRect(ctx, -58, -91, 116, 38, 5);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = "#f0e4bd";
    ctx.font = "17px KaiTi, STKaiti, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(sign.name, 0, -72);
    ctx.restore();
  };

  World.prototype._drawLamp = function (ctx, lamp) {
    ctx.save();
    ctx.translate(lamp.x, lamp.y);
    ctx.strokeStyle = "#46534f";
    ctx.lineWidth = 6;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(0, -104);
    ctx.stroke();
    ctx.fillStyle = "#52615a";
    ctx.beginPath();
    ctx.ellipse(0, 0, 13, 5, 0, 0, TAU);
    ctx.fill();
    ctx.fillStyle = "#ead79a";
    ctx.strokeStyle = "#4c5852";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(-13, -105);
    ctx.lineTo(-9, -130);
    ctx.lineTo(9, -130);
    ctx.lineTo(13, -105);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.restore();
  };

  World.prototype._drawStall = function (ctx, stall) {
    ctx.save();
    ctx.translate(stall.x, stall.y);
    ctx.fillStyle = "#806545";
    ctx.fillRect(-47, -35, 94, 38);
    ctx.strokeStyle = "#514c3a";
    ctx.lineWidth = 3;
    ctx.strokeRect(-47, -35, 94, 38);
    ctx.fillStyle = stall.color;
    ctx.beginPath();
    ctx.moveTo(-60, -52);
    ctx.lineTo(-44, -92);
    ctx.lineTo(44, -92);
    ctx.lineTo(60, -52);
    ctx.closePath();
    ctx.fill();
    ctx.stroke();
    ctx.strokeStyle = "#5c513b";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.moveTo(-43, -50);
    ctx.lineTo(-43, 0);
    ctx.moveTo(43, -50);
    ctx.lineTo(43, 0);
    ctx.stroke();
    ctx.fillStyle = "#e8ddb4";
    ctx.font = "15px KaiTi, STKaiti, serif";
    ctx.textAlign = "center";
    ctx.fillText(stall.name, 0, -66);
    ctx.restore();
  };

  World.prototype._targetForVisual = function (prop) {
    for (var i = 0; i < this.interactables.length; i += 1) {
      if (this.interactables[i].id === prop.refId) return this.interactables[i];
    }
    return null;
  };

  World.prototype._drawEcho = function (ctx, echo) {
    var target = this._targetForVisual(echo);
    if (target && (target.enabled === false || target.hidden)) return;
    var reduced = this.game.settings && this.game.settings.reducedMotion;
    var time = reduced ? 0 : this.time;
    var bob = Math.sin(time * 2 + echo.phase) * 6;
    var colors = ["#d9e8a5", "#b8dfc8", "#d7c5e8", "#b8dce3", "#efe0ad"];
    var color = colors[echo.stage % colors.length];
    ctx.save();
    ctx.translate(echo.x, echo.y);
    ctx.strokeStyle = "rgba(55,94,82,0.65)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 27 + Math.sin(time * 1.6 + echo.phase) * 3, 11, 0, 0, TAU);
    ctx.stroke();
    ctx.translate(0, -27 + bob);
    ctx.fillStyle = color;
    ctx.strokeStyle = "#456c62";
    ctx.lineWidth = 2.5;
    for (var i = 0; i < 3; i += 1) {
      ctx.save();
      ctx.rotate(i / 3 * TAU + time * 0.25);
      ctx.beginPath();
      ctx.moveTo(0, -4);
      ctx.quadraticCurveTo(18, -19, 8, -31);
      ctx.quadraticCurveTo(-8, -23, 0, -4);
      ctx.fill();
      ctx.stroke();
      ctx.restore();
    }
    ctx.fillStyle = "#f4edc8";
    ctx.beginPath();
    ctx.arc(0, 0, 6, 0, TAU);
    ctx.fill();
    ctx.restore();
  };

  World.prototype._drawWaypoint = function (ctx, waypoint) {
    var target = this._targetForVisual(waypoint);
    if (target && (target.enabled === false || target.hidden)) return;
    var reduced = this.game.settings && this.game.settings.reducedMotion;
    var time = reduced ? 0 : this.time;
    ctx.save();
    ctx.translate(waypoint.x, waypoint.y);
    ctx.strokeStyle = "rgba(70,104,100,0.7)";
    ctx.fillStyle = "rgba(191,222,199,0.16)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.ellipse(0, 0, 37, 17, 0, 0, TAU);
    ctx.fill();
    ctx.stroke();
    ctx.save();
    ctx.scale(1, 0.46);
    ctx.rotate(time * 0.18 + waypoint.phase);
    ctx.strokeStyle = "rgba(211,231,192,0.82)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    for (var i = 0; i < 6; i += 1) {
      var angle = i / 6 * TAU;
      var x = Math.cos(angle) * 24;
      var y = Math.sin(angle) * 24;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.stroke();
    ctx.restore();
    ctx.restore();
  };

  World.prototype.drawForeground = function (ctx) {
    if (!ctx) return;
    this._setView(ctx, 280);
    ctx.save();
    for (var i = 0; i < this.props.length; i += 1) {
      var prop = this.props[i];
      if (prop.flat && this._visible(prop.x, prop.y, 50)) this._drawWaypoint(ctx, prop);
    }
    var player = this.game.player;
    if (player && Number.isFinite(player.x) && Number.isFinite(player.y)) {
      for (var t = 0; t < this.trees.length; t += 1) {
        var tree = this.trees[t];
        if (tree.y <= player.y || player.y < tree.y - tree.size * 1.12) continue;
        if (Math.abs(player.x - tree.x) > tree.size * 0.55 || !this._visible(tree.x, tree.y, tree.size)) continue;
        ctx.save();
        ctx.globalAlpha = 0.32;
        ctx.translate(tree.x, tree.y - tree.size * 0.68);
        ctx.fillStyle = tree.biome === "coast" ? "#a4b482" : "#83a475";
        ctx.beginPath();
        ctx.ellipse(0, 0, tree.size * 0.52, tree.size * 0.37, 0, 0, TAU);
        ctx.fill();
        ctx.restore();
      }
    }
    ctx.restore();
  };

  LXH.World = World;
})(window);
