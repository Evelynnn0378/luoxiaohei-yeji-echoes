(function (global) {
  "use strict";

  var LXH = global.LXH = global.LXH || {};
  var QUEST_ID = "leaf-echo";
  var SAVE_VERSION = 1;
  var STAGES = [
    "wake", "forest_inspect", "forest_attune",
    "dragon_npc", "dragon_archive", "dragon_attune", "dragon_combat",
    "city_xiaobai", "city_agen", "city_attune", "city_combat",
    "coast_npc", "coast_attune", "coast_combat",
    "lanxi_npc", "lanxi_attune", "return_tree",
    "climax_attune", "climax_combat", "climax_seal", "epilogue", "complete"
  ];
  var DRAGON_PINS = ["dragon_pin_leaf", "dragon_pin_bridge", "dragon_pin_roof"];
  var CITY_ECHOES = ["city_echo_roof", "city_echo_alley", "city_echo_bridge"];
  var CLIMAX_PINS = ["climax_pin_root", "climax_pin_lamp", "climax_pin_roof"];
  var WORLD_ALIASES = {
    "quest-forest-echo": "forest_rift",
    "quest-guild-archive": "dragon_archive",
    "quest-city-resonance": "city_resonator",
    "quest-coast-memory": "coast_memory",
    "quest-lanxi-confluence": "lanxi_metal",
    "lore-ancient-tree": "ancient_tree"
  };
  var NPC_ALIASES = {
    wuxian: ["wuxian", "无限", "npc_wuxian", "npc-wuxian"],
    panjing: ["panjing", "潘靖", "npc_panjing", "npc-panjing"],
    xiaobai: ["xiaobai", "xb", "小白", "罗小白", "npc_xiaobai", "npc-xiaobai"],
    agen: ["agen", "a-gen", "阿根", "npc_agen", "npc-agen"],
    cenpo: ["cenpo", "岑阿婆", "守潮人"],
    qinghe: ["qinghe", "青禾", "守镇人"],
    lanxi_human: ["lanxi_human", "许舟", "茶摊老板"],
    lanxi_spirit: ["lanxi_spirit", "米芽", "茸角住客"]
  };
  var COMBAT = {
    dragon_combat: { key: "dragon_echo", name: "失控灵体·残简", at: "dragon_rift", health: 46, next: "city_xiaobai" },
    city_combat: { key: "city_echo", name: "失控灵体·喧街", at: "city_rift", health: 58, next: "coast_npc" },
    coast_combat: { key: "coast_echo", name: "失控灵体·归潮", at: "coast_rift", health: 68, next: "lanxi_npc" },
    climax_combat: { key: "rift_heart", name: "失控灵体·叶隙之心", at: "climax_rift", health: 96, next: "climax_seal" }
  };

  function finite(value, fallback) {
    return typeof value === "number" && isFinite(value) ? value : fallback;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function distance(a, b) {
    if (!a || !b) return Infinity;
    var dx = finite(a.x, 0) - finite(b.x, 0);
    var dy = finite(a.y, 0) - finite(b.y, 0);
    return Math.sqrt(dx * dx + dy * dy);
  }

  function normalizeId(value) {
    return String(value == null ? "" : value).toLowerCase().replace(/^story[:_.-]/, "").replace(/\s+/g, "");
  }

  function initialFlags() {
    return {
      forestTeleport: false,
      forestMetal: false,
      dragonTeleport: false,
      dragonPins: 0,
      cityEchoes: {},
      cityMetal: false,
      coastTeleport: false,
      coastMetal: false,
      coastMemory: false,
      lanxiTeleport: false,
      lanxiMetal: false,
      lanxiHuman: false,
      lanxiSpirit: false,
      climaxTeleport: false,
      climaxPins: 0,
      sealTeleport: false,
      sealMetal: false,
      defeated: {},
      clues: {}
    };
  }

  function initialStats() {
    return { teleport: 0, metal: 0, interactions: 0, enemiesCalmed: 0, playTime: 0, zones: {} };
  }

  function Story(game) {
    this.game = game;
    this.id = QUEST_ID;
    this.title = "叶隙回响";
    this.unofficial = true;
    this.stage = "wake";
    this.stageIndex = 0;
    this.completed = false;
    this.complete = false;
    this.endingShown = false;
    this.flags = initialFlags();
    this.stats = initialStats();
    this.started = false;
    this.targets = {};
    this.targetList = [];
    this.npcRefs = {};
    this.enemyRefs = {};
    this.zoneCenters = {};
    this.dialogueQueue = [];
    this.dialogueCallbacks = [];
    this.dialogueActive = false;
    this.dialogueSerial = 0;
    this.currentDialogue = null;
    this._objectiveSignature = "";
    this._hookedAbilities = null;
    this._time = 0;
    this._lastToast = "";
  }

  Story.prototype.start = function () {
    if (this.started) {
      this._registerTargets();
      this._hookAbilities();
      this._syncObjective(true);
      return this;
    }
    this.started = true;
    this._buildTargets();
    this._registerTargets();
    this._syncNPCs();
    this._hookAbilities();
    this._enterStage(this.stage);
    this._syncObjective(true);
    if (this.stage === "wake") {
      this._toast("非官方原创支线《叶隙回响》");
      this.say([
        ["旁白", "narrator", "叶隙森林的清晨，小黑在一阵不属于自己的叶响中醒来。古树另一端，空间像被折起了一角。"],
        ["小黑", "xiaohei", "……树叶在说话？师父，你也听见了吗？"]
      ]);
    }
    return this;
  };

  Story.prototype._resetForLoad = function () {
    this.flags = initialFlags();
    this.stats = initialStats();
    this.completed = false;
    this.complete = false;
    this.endingShown = false;
    this.dialogueQueue = [];
    this.dialogueCallbacks = [];
    this.dialogueActive = false;
    this.currentDialogue = null;
    this.dialogueSerial += 1;
    this.enemyRefs = {};
  };

  Story.prototype._world = function () {
    return this.game && this.game.world ? this.game.world : null;
  };

  Story.prototype._player = function () {
    return this.game && this.game.player ? this.game.player : { x: 620, y: 1880 };
  };

  Story.prototype._zoneName = function (zone) {
    if (!zone) return "";
    if (typeof zone === "string") return zone;
    return zone.name || zone.title || zone.id || "";
  };

  Story.prototype._zones = function () {
    var world = this._world();
    if (!world || !world.zones) return [];
    if (Array.isArray(world.zones)) return world.zones;
    var result = [];
    for (var key in world.zones) {
      if (Object.prototype.hasOwnProperty.call(world.zones, key)) result.push(world.zones[key]);
    }
    return result;
  };

  Story.prototype._findZone = function (name) {
    var zones = this._zones();
    for (var i = 0; i < zones.length; i += 1) {
      if (this._zoneName(zones[i]) === name) return zones[i];
    }
    for (var j = 0; j < zones.length; j += 1) {
      if (this._zoneName(zones[j]).indexOf(name) !== -1 || name.indexOf(this._zoneName(zones[j])) !== -1) return zones[j];
    }
    return null;
  };

  Story.prototype._zoneCenter = function (name, fallback) {
    if (this.zoneCenters[name]) return this.zoneCenters[name];
    var zone = this._findZone(name);
    if (!zone) return { x: fallback.x, y: fallback.y };
    var center = zone.center || zone.centre || null;
    var x = finite(zone.cx, center ? finite(center.x, NaN) : NaN);
    var y = finite(zone.cy, center ? finite(center.y, NaN) : NaN);
    var rect = zone.bounds || zone.rect || zone;
    var width = finite(rect.width, finite(rect.w, NaN));
    var height = finite(rect.height, finite(rect.h, NaN));
    if (!isFinite(x)) x = finite(rect.x, NaN);
    if (!isFinite(y)) y = finite(rect.y, NaN);
    if (isFinite(width) && isFinite(x) && zone.centered !== true && zone.center !== true) x += width / 2;
    if (isFinite(height) && isFinite(y) && zone.centered !== true && zone.center !== true) y += height / 2;
    if (Array.isArray(zone.points) && zone.points.length) {
      x = 0;
      y = 0;
      for (var i = 0; i < zone.points.length; i += 1) {
        x += finite(zone.points[i].x, 0);
        y += finite(zone.points[i].y, 0);
      }
      x /= zone.points.length;
      y /= zone.points.length;
    }
    var result = { x: finite(x, fallback.x), y: finite(y, fallback.y) };
    this.zoneCenters[name] = result;
    return result;
  };

  Story.prototype._safePoint = function (desired, zoneName, alternate) {
    var world = this._world();
    var width = finite(world && world.width, 4800);
    var height = finite(world && world.height, 3600);
    var firstWalkable = null;
    var centers = [desired];
    if (alternate) centers.push(alternate);
    for (var c = 0; c < centers.length; c += 1) {
      for (var ring = 0; ring <= 8; ring += 1) {
        var steps = ring === 0 ? 1 : ring * 8;
        for (var i = 0; i < steps; i += 1) {
          var angle = steps === 1 ? 0 : Math.PI * 2 * i / steps;
          var radius = ring * 58;
          var point = {
            x: clamp(centers[c].x + Math.cos(angle) * radius, 36, width - 36),
            y: clamp(centers[c].y + Math.sin(angle) * radius, 36, height - 36)
          };
          var walkable = true;
          if (world && typeof world.isWalkable === "function") {
            try { walkable = world.isWalkable(point.x, point.y, 24) !== false; } catch (ignore) { walkable = true; }
          }
          if (!walkable) continue;
          if (!firstWalkable) firstWalkable = point;
          if (zoneName && world && typeof world.zoneAt === "function") {
            var actual = "";
            try { actual = this._zoneName(world.zoneAt(point.x, point.y)); } catch (ignoreZone) { actual = ""; }
            if (actual && actual !== zoneName && actual.indexOf(zoneName) === -1 && zoneName.indexOf(actual) === -1) continue;
          }
          return point;
        }
      }
    }
    return firstWalkable || {
      x: clamp(desired.x, 36, width - 36),
      y: clamp(desired.y, 36, height - 36)
    };
  };

  Story.prototype._zonePoint = function (zoneName, fallback, dx, dy) {
    var center = this._zoneCenter(zoneName, fallback);
    return this._safePoint(
      { x: center.x + (dx || 0), y: center.y + (dy || 0) },
      zoneName,
      { x: fallback.x + (dx || 0), y: fallback.y + (dy || 0) }
    );
  };

  Story.prototype._forestPoint = function (x, y) {
    return this._safePoint({ x: x, y: y }, "叶隙森林", null);
  };

  Story.prototype._addTarget = function (key, name, point, kind, extra) {
    extra = extra || {};
    var target = {
      id: extra.id || "story_" + key,
      type: kind || extra.type || "story",
      name: name,
      x: point.x,
      y: point.y,
      radius: extra.radius || 28,
      interactionRadius: extra.interactionRadius || 108,
      data: {
        storyId: key,
        questId: QUEST_ID,
        unofficial: true,
        action: extra.action || "inspect",
        ability: extra.ability || null,
        order: finite(extra.order, null)
      }
    };
    this.targets[key] = target;
    this.targetList.push(target);
    return target;
  };

  Story.prototype._buildTargets = function () {
    if (this.targetList.length) return;
    var self = this;
    function npc(key, name, point) {
      var target = self._addTarget(key, name, point, "npc", { action: "talk", radius: 22, interactionRadius: 120 });
      self.npcRefs[key] = {
        target: target,
        entity: null,
        actor: {
          id: key,
          name: name,
          x: point.x,
          y: point.y,
          vx: 0,
          vy: 0,
          radius: 20,
          health: 100,
          maxHealth: 100,
          energy: 100,
          maxEnergy: 100,
          facing: 1,
          form: "human",
          state: "idle",
          bones: {},
          animationPhase: 0
        }
      };
    }
    function object(key, name, point, extra) {
      return self._addTarget(key, name, point, "story", extra);
    }

    npc("wuxian", "无限", this._forestPoint(704, 1824));
    object("ancient_tree", "叶隙古树", this._forestPoint(930, 1245), { action: "tree" });
    object("forest_rift", "折叶裂隙", this._forestPoint(900, 1630), { action: "inspect" });
    object("forest_space", "裂隙背侧·传送落点", this._forestPoint(1080, 1550), { ability: "teleport" });
    object("forest_metal", "松动的金属叶扣·御金", this._forestPoint(1040, 1800), { ability: "metal" });

    npc("panjing", "潘靖", this._zonePoint("龙游会馆", { x: 2300, y: 700 }, -80, 70));
    object("dragon_archive", "会馆残简", this._zonePoint("龙游会馆", { x: 2300, y: 700 }, 100, 20), { action: "read" });
    object("dragon_space", "回廊折角·传送", this._zonePoint("龙游会馆", { x: 2300, y: 700 }, 280, -100), { ability: "teleport" });
    object("dragon_pin_leaf", "叶纹共振钉·壹", this._zonePoint("龙游会馆", { x: 2300, y: 700 }, -250, -130), { ability: "metal", order: 0 });
    object("dragon_pin_bridge", "桥纹共振钉·贰", this._zonePoint("龙游会馆", { x: 2300, y: 700 }, 20, -230), { ability: "metal", order: 1 });
    object("dragon_pin_roof", "檐纹共振钉·叁", this._zonePoint("龙游会馆", { x: 2300, y: 700 }, 260, 150), { ability: "metal", order: 2 });
    object("dragon_rift", "残简回响", this._zonePoint("龙游会馆", { x: 2300, y: 700 }, 170, 230), { action: "rift" });

    npc("xiaobai", "罗小白", this._zonePoint("城市街角", { x: 3700, y: 1450 }, -150, 20));
    npc("agen", "阿根", this._zonePoint("城市街角", { x: 3700, y: 1450 }, -30, 110));
    object("city_echo_roof", "屋顶回声·传送", this._zonePoint("城市街角", { x: 3700, y: 1450 }, 190, -250), { ability: "teleport" });
    object("city_echo_alley", "巷口回声·传送", this._zonePoint("城市街角", { x: 3700, y: 1450 }, 350, 20), { ability: "teleport" });
    object("city_echo_bridge", "桥洞回声·传送", this._zonePoint("城市街角", { x: 3700, y: 1450 }, 20, 300), { ability: "teleport" });
    object("city_resonator", "旧站牌共鸣器·御金", this._zonePoint("城市街角", { x: 3700, y: 1450 }, 210, 170), { ability: "metal" });
    object("city_rift", "街角回响", this._zonePoint("城市街角", { x: 3700, y: 1450 }, 280, 230), { action: "rift" });

    npc("cenpo", "守潮人·岑阿婆", this._zonePoint("离岛海岸", { x: 3650, y: 2800 }, -170, -20));
    object("coast_space", "远礁引灯·传送", this._zonePoint("离岛海岸", { x: 3650, y: 2800 }, 220, -170), { ability: "teleport" });
    object("coast_metal", "沉船铜环·御金", this._zonePoint("离岛海岸", { x: 3650, y: 2800 }, 360, 90), { ability: "metal" });
    object("coast_memory", "潮声碑", this._zonePoint("离岛海岸", { x: 3650, y: 2800 }, 30, 190), { action: "read" });
    object("coast_rift", "潮汐回响", this._zonePoint("离岛海岸", { x: 3650, y: 2800 }, 100, 250), { action: "rift" });

    npc("qinghe", "守镇人·青禾", this._zonePoint("蓝溪镇", { x: 1400, y: 650 }, 0, 110));
    npc("lanxi_human", "茶摊老板·许舟", this._zonePoint("蓝溪镇", { x: 1400, y: 650 }, -190, 30));
    npc("lanxi_spirit", "茸角住客·米芽", this._zonePoint("蓝溪镇", { x: 1400, y: 650 }, 190, 30));
    object("lanxi_space", "镇门旧阶·传送", this._zonePoint("蓝溪镇", { x: 1400, y: 650 }, -180, -190), { ability: "teleport" });
    object("lanxi_metal", "医馆药碾·御金", this._zonePoint("蓝溪镇", { x: 1400, y: 650 }, 190, -170), { ability: "metal" });

    object("climax_rift", "古树外缘·叶隙之心", this._forestPoint(790, 1320), { action: "rift" });
    object("climax_space", "裂隙外环·传送", this._forestPoint(980, 1270), { ability: "teleport" });
    object("climax_pin_root", "根之镇钉·壹", this._forestPoint(610, 1250), { ability: "metal", order: 0 });
    object("climax_pin_lamp", "灯之镇钉·贰", this._forestPoint(920, 1090), { ability: "metal", order: 1 });
    object("climax_pin_roof", "檐之镇钉·叁", this._forestPoint(1120, 1430), { ability: "metal", order: 2 });
  };

  Story.prototype._registerTargets = function () {
    var world = this._world();
    if (!world || !Array.isArray(world.interactables)) return;
    for (var i = 0; i < this.targetList.length; i += 1) {
      var target = this.targetList[i];
      var found = false;
      for (var j = 0; j < world.interactables.length; j += 1) {
        var existing = world.interactables[j];
        if (existing === target || (existing && existing.id === target.id)) {
          found = true;
          if (existing !== target && existing.data && existing.data.storyId) this.targets[existing.data.storyId] = existing;
          break;
        }
      }
      if (!found) world.interactables.push(target);
    }
  };

  Story.prototype._hookAbilities = function () {
    var abilities = this.game && this.game.abilities;
    if (!abilities || typeof abilities.use !== "function" || this._hookedAbilities === abilities) return;
    var story = this;
    if (typeof abilities.enterActivePhase === "function") {
      var originalActive = abilities.enterActivePhase;
      abilities.enterActivePhase = function (action) {
        var result = originalActive.apply(this, arguments);
        if (action && this.action === action && action.phase === "active" && (action.name === "teleport" || action.name === "metal")) {
          var context = action.context || {};
          var player = story._player();
          var point = context.target && isFinite(context.target.x) && isFinite(context.target.y)
            ? { x: context.target.x, y: context.target.y }
            : { x: finite(player.x, 0), y: finite(player.y, 0) };
          story.onAbilityUsed(action.name, point.x, point.y, { source: "abilities-active", action: action });
        }
        return result;
      };
    } else {
      var originalUse = abilities.use;
      abilities.use = function (name, screenX, screenY) {
        var result = originalUse.apply(this, arguments);
        if (result) {
          var point = story._screenToWorld(screenX, screenY);
          story.onAbilityUsed(name, point.x, point.y, { source: "abilities", result: result });
        }
        return result;
      };
    }
    this._hookedAbilities = abilities;
  };

  Story.prototype._screenToWorld = function (screenX, screenY) {
    var player = this._player();
    if (!isFinite(screenX) || !isFinite(screenY)) return { x: finite(player.x, 0), y: finite(player.y, 0) };
    var abilities = this.game && this.game.abilities;
    if (abilities && typeof abilities.screenToWorld === "function") {
      try {
        var converted = abilities.screenToWorld(screenX, screenY);
        if (converted && isFinite(converted.x) && isFinite(converted.y)) return converted;
      } catch (ignore) {}
    }
    if (this.game && typeof this.game.screenToWorld === "function") {
      try {
        var gamePoint = this.game.screenToWorld(screenX, screenY);
        if (gamePoint && isFinite(gamePoint.x) && isFinite(gamePoint.y)) return gamePoint;
      } catch (ignoreGame) {}
    }
    var camera = this.game.camera || { x: player.x, y: player.y, zoom: 1 };
    var zoom = finite(camera.zoom, 1) || 1;
    var width = finite(this.game.width, this.game.canvas ? this.game.canvas.width : 0);
    var height = finite(this.game.height, this.game.canvas ? this.game.canvas.height : 0);
    return {
      x: finite(camera.x, player.x) + (screenX - width / 2) / zoom,
      y: finite(camera.y, player.y) + (screenY - height / 2) / zoom
    };
  };

  Story.prototype.say = function (lines, onComplete) {
    if (!lines || !lines.length) {
      if (typeof onComplete === "function") onComplete();
      return true;
    }
    for (var i = 0; i < lines.length; i += 1) this.dialogueQueue.push(lines[i]);
    if (typeof onComplete === "function") this.dialogueCallbacks.push(onComplete);
    if (!this.dialogueActive) {
      this.dialogueActive = true;
      this._showNextDialogue();
    }
    return true;
  };

  Story.prototype._showNextDialogue = function () {
    var ui = this.game && this.game.ui;
    if (!this.dialogueQueue.length) {
      this.dialogueActive = false;
      this.currentDialogue = null;
      var callbacks = this.dialogueCallbacks.splice(0);
      for (var i = 0; i < callbacks.length; i += 1) {
        try { callbacks[i](); } catch (error) { this._toast("剧情回调未能完成，可继续探索"); }
      }
      return;
    }
    if (!ui || typeof ui.showDialogue !== "function") {
      while (this.dialogueQueue.length) {
        var fallback = this.dialogueQueue.shift();
        this._toast(fallback[0] + "：" + fallback[2]);
      }
      this._showNextDialogue();
      return;
    }
    var line = this.dialogueQueue.shift();
    var story = this;
    var serial = ++this.dialogueSerial;
    var closed = false;
    var dialogue = {
      speaker: line[0],
      id: line[1],
      text: line[2],
      onClose: function () {
        if (closed || serial !== story.dialogueSerial) return;
        closed = true;
        story.currentDialogue = null;
        story._showNextDialogue();
      }
    };
    this.currentDialogue = dialogue;
    try {
      ui.showDialogue(dialogue);
    } catch (error) {
      this.dialogueQueue.unshift(line);
      this.currentDialogue = null;
      this.dialogueSerial += 1;
      while (this.dialogueQueue.length) {
        var item = this.dialogueQueue.shift();
        this._toast(item[0] + "：" + item[2]);
      }
      this._showNextDialogue();
    }
  };

  Story.prototype._toast = function (text) {
    this._lastToast = String(text || "");
    var ui = this.game && this.game.ui;
    if (ui && typeof ui.toast === "function") {
      try { ui.toast(String(text || "")); } catch (ignore) {}
    }
  };

  Story.prototype._emit = function (type, target) {
    var vfx = this.game && this.game.vfx;
    if (!vfx || typeof vfx.emit !== "function" || !target) return;
    try { vfx.emit(type, target.x, target.y, { quest: QUEST_ID, count: 18 }); } catch (ignore) {}
  };

  Story.prototype._sound = function (name) {
    var audio = this.game && this.game.audio;
    if (audio && typeof audio.play === "function") {
      try { audio.play(name || "quest"); } catch (ignore) {}
    }
  };

  Story.prototype.setStage = function (stage) {
    if (STAGES.indexOf(stage) === -1) return false;
    this.stage = stage;
    this.stageIndex = STAGES.indexOf(stage);
    this.completed = stage === "complete";
    this.complete = this.completed;
    if (this.game) this.game.storyStage = stage;
    this._enterStage(stage);
    this._syncObjective(true);
    return true;
  };

  Story.prototype._enterStage = function (stage) {
    var encounter = COMBAT[stage];
    if (encounter && !this.flags.defeated[encounter.key]) this._spawnEncounter(encounter);
  };

  Story.prototype._spawnEncounter = function (encounter) {
    if (this.enemyRefs[encounter.key] || this.flags.defeated[encounter.key]) return this.enemyRefs[encounter.key];
    var enemies = this.game && this.game.enemies;
    if (Array.isArray(enemies)) {
      for (var i = 0; i < enemies.length; i += 1) {
        if (enemies[i] && (enemies[i].storyId === encounter.key || enemies[i].id === "story_" + encounter.key)) {
          this.enemyRefs[encounter.key] = enemies[i];
          return enemies[i];
        }
      }
    }
    if (typeof LXH.Enemy !== "function" || !Array.isArray(enemies)) return null;
    var at = this.targets[encounter.at] || this._player();
    var definition = {
      id: "story_" + encounter.key,
      storyId: encounter.key,
      questId: QUEST_ID,
      name: encounter.name,
      type: "spirit",
      form: "spirit",
      x: at.x,
      y: at.y,
      radius: encounter.key === "rift_heart" ? 34 : 25,
      health: encounter.health,
      maxHealth: encounter.health,
      energy: 100,
      maxEnergy: 100,
      speed: encounter.key === "rift_heart" ? 104 : 88,
      damage: encounter.key === "rift_heart" ? 8 : 5,
      aggroRange: 420,
      nonlethal: true,
      state: "idle",
      facing: 1,
      bones: {}
    };
    var enemy;
    try {
      enemy = new LXH.Enemy(this.game, definition);
      enemy.id = definition.id;
      enemy.storyId = encounter.key;
      enemy.questId = QUEST_ID;
      enemy.nonlethal = true;
      if (typeof enemy.maxHealth !== "number" || enemy.maxHealth < encounter.health) enemy.maxHealth = encounter.health;
      if (typeof enemy.health !== "number" || enemy.health <= 0) enemy.health = enemy.maxHealth;
      enemies.push(enemy);
      this.enemyRefs[encounter.key] = enemy;
      this._emit("rift", at);
      return enemy;
    } catch (error) {
      this._toast("裂隙灵体正在凝聚，请稍候再试");
      return null;
    }
  };

  Story.prototype._findExistingNPC = function (key, target) {
    var npcs = this.game && this.game.npcs;
    if (!Array.isArray(npcs)) return null;
    var i;
    for (i = 0; i < npcs.length; i += 1) {
      var owned = npcs[i];
      if (owned && (owned.storyId === key || (owned.data && owned.data.storyId === key))) return owned;
    }
    var aliases = NPC_ALIASES[key] || [key];
    for (i = 0; i < npcs.length; i += 1) {
      var npc = npcs[i];
      if (!npc || (target && distance(npc, target) > 180)) continue;
      var id = normalizeId(npc.id);
      var name = normalizeId(npc.name);
      for (var j = 0; j < aliases.length; j += 1) {
        var alias = normalizeId(aliases[j]);
        if (id === alias || name === alias) return npc;
      }
    }
    return null;
  };

  Story.prototype._syncNPCs = function () {
    var npcs = this.game && this.game.npcs;
    for (var key in this.npcRefs) {
      if (!Object.prototype.hasOwnProperty.call(this.npcRefs, key)) continue;
      var ref = this.npcRefs[key];
      if (!ref.entity) ref.entity = this._findExistingNPC(key, ref.target);
      if (!ref.entity && !ref.spawnFailed && typeof LXH.NPC === "function" && Array.isArray(npcs)) {
        try {
          var definition = {
            id: "story_npc_" + key,
            storyId: key,
            questId: QUEST_ID,
            characterId: key,
            name: ref.target.name,
            x: ref.target.x,
            y: ref.target.y,
            radius: 20,
            stationary: true,
            speed: 0,
            interactionRadius: 92,
            interactable: true,
            form: "human"
          };
          var entity = new LXH.NPC(this.game, definition);
          entity.storyId = key;
          entity.questId = QUEST_ID;
          entity.characterId = key;
          entity.data.storyId = key;
          entity.data.questId = QUEST_ID;
          entity.data.characterId = key;
          npcs.push(entity);
          ref.entity = entity;
          ref.ownsEntity = true;
        } catch (error) {
          ref.spawnFailed = true;
        }
      }
      if (ref.entity) {
        ref.target.x = finite(ref.entity.x, ref.target.x);
        ref.target.y = finite(ref.entity.y, ref.target.y);
      } else {
        ref.actor.animationPhase = this._time;
        ref.actor.x = ref.target.x;
        ref.actor.y = ref.target.y;
      }
    }
  };

  Story.prototype._targetKey = function (target) {
    if (!target) return "";
    if (typeof target === "string") {
      if (this.targets[target]) return target;
      var stringId = normalizeId(target);
      if (WORLD_ALIASES[stringId]) return WORLD_ALIASES[stringId];
      for (var npcKey in NPC_ALIASES) {
        var aliases = NPC_ALIASES[npcKey];
        for (var a = 0; a < aliases.length; a += 1) {
          if (stringId === normalizeId(aliases[a])) return npcKey;
        }
      }
      return target;
    }
    var data = target.data || {};
    var direct = data.storyId || data.questTarget || target.storyId;
    if (direct && this.targets[direct]) return direct;
    if (direct) return direct;
    var id = normalizeId(target.id);
    if (WORLD_ALIASES[id]) return WORLD_ALIASES[id];
    if (this.targets[id]) return id;
    if (id.indexOf("story_") === 0) {
      var stripped = id.slice(6);
      if (this.targets[stripped]) return stripped;
    }
    var name = normalizeId(target.name);
    for (var key in NPC_ALIASES) {
      if (!Object.prototype.hasOwnProperty.call(NPC_ALIASES, key)) continue;
      var list = NPC_ALIASES[key];
      for (var i = 0; i < list.length; i += 1) {
        var alias = normalizeId(list[i]);
        if (id === alias || name === alias) return key;
      }
    }
    for (var j = 0; j < this.targetList.length; j += 1) {
      if (this.targetList[j] === target || id === normalizeId(this.targetList[j].id)) return this.targetList[j].data.storyId;
    }
    return "";
  };

  Story.prototype._handleWaypoint = function (target) {
    var world = this._world();
    var player = this._player();
    if (!world || !player) return false;
    var points = Array.isArray(world.teleportPoints) ? world.teleportPoints : [];
    if (!points.length && Array.isArray(world.interactables)) {
      for (var i = 0; i < world.interactables.length; i += 1) {
        if (world.interactables[i] && world.interactables[i].type === "teleport") points.push(world.interactables[i]);
      }
    }
    if (!points.length) {
      this._toast("空间路标尚未连通");
      return true;
    }
    var objectiveTarget = this.getObjective().target;
    var objectiveZone = "";
    if (objectiveTarget && typeof world.zoneAt === "function") {
      objectiveZone = this._zoneName(world.zoneAt(objectiveTarget.x, objectiveTarget.y));
    }
    var currentZone = target.data && target.data.zone ? target.data.zone : this._zoneName(world.zoneAt(target.x, target.y));
    if (objectiveZone && currentZone === objectiveZone) {
      this._toast("当前目标也在" + currentZone + "，请跟随发光世界标记前进");
      return true;
    }
    var destination = null;
    if (objectiveZone) {
      for (var j = 0; j < points.length; j += 1) {
        var candidate = points[j];
        var candidateZone = candidate.data && candidate.data.zone ? candidate.data.zone : this._zoneName(world.zoneAt(candidate.x, candidate.y));
        if (candidate !== target && candidateZone === objectiveZone) { destination = candidate; break; }
      }
    }
    if (!destination) {
      var currentIndex = points.indexOf(target);
      destination = points[(currentIndex + 1 + points.length) % points.length];
    }
    if (!destination || destination === target) {
      this._toast("这道路标已连通，继续跟随目标标记即可");
      return true;
    }
    var zoneName = destination.data && destination.data.zone ? destination.data.zone : "新的区域";
    var arrival = this._safePoint({ x: destination.x + 42, y: destination.y + 28 }, zoneName, null);
    var origin = { x: player.x, y: player.y };
    player.x = arrival.x;
    player.y = arrival.y;
    player.vx = 0;
    player.vy = 0;
    if (this.game.camera) {
      this.game.camera.x = arrival.x;
      this.game.camera.y = arrival.y;
    }
    this._emit("teleport", origin);
    this._emit("teleport", arrival);
    this._sound("teleport");
    this._toast("空间路标：抵达" + zoneName + "；主线技能进度仍需亲自完成");
    return true;
  };

  Story.prototype._handleRest = function () {
    var player = this._player();
    if (typeof player.heal === "function") player.heal(finite(player.maxHealth, 100));
    else if (typeof player.health === "number") player.health = finite(player.maxHealth, player.health);
    player.energy = finite(player.maxEnergy, finite(player.energy, 100));
    this._toast("在茶摊休息片刻：体力与灵力已恢复");
    this._sound("heal");
    return true;
  };

  Story.prototype._handleLore = function (target) {
    var topic = target.data && target.data.topic ? target.data.topic : target.name;
    var text = "这里保留着人与妖精共同生活的痕迹。";
    if (topic === "蓝溪镇旧闻") text = "石刻记着：有人被收留，也有人告别。庇护不是替谁决定去处，而是让去留都能被尊重。";
    if (topic === "离岛与故乡") text = "潮线隔开两岸，却没有隔开灯火。守灯的人换了许多次，愿意等候回航者的心意留了下来。";
    this.say([[target.name || "旧记录", "narrator", text]]);
    return true;
  };

  Story.prototype.interact = function (target) {
    if (!target) return false;
    if (this.dialogueActive) return true;
    var rawId = normalizeId(target.id);
    var data = target.data || {};
    if (target.type === "teleport" && data.teleportId) {
      this.stats.interactions += 1;
      return this._handleWaypoint(target);
    }
    if (target.type === "rest") {
      this.stats.interactions += 1;
      return this._handleRest();
    }
    if (target.type === "lore" && !WORLD_ALIASES[rawId]) {
      this.stats.interactions += 1;
      return this._handleLore(target);
    }
    var key = this._targetKey(target);
    if (!key) return false;
    if (NPC_ALIASES[key]) {
      this.stats.interactions += 1;
      var npcRef = this.npcRefs[key];
      var data = target.data || {};
      var storyOwned = npcRef && (target === npcRef.target || target === npcRef.entity || target.storyId === key || data.storyId === key);
      if (this.stage !== "complete" && npcRef && !storyOwned && distance(target, npcRef.target) > 260) {
        this._toast((target.name || "同行者") + "：主线目标在另一处——" + this.getObjective().detail);
        return true;
      }
      this._handleNPC(key);
      return true;
    }
    if (!this.targets[key]) return false;
    this.stats.interactions += 1;
    this._handleObject(key);
    return true;
  };

  Story.prototype._handleNPC = function (key) {
    if (this.stage === "wake" && key === "wuxian") {
      this.setStage("forest_inspect");
      this.say([
        ["无限", "wuxian", "醒了。先慢点呼吸。刚才那阵叶响，不是风。"],
        ["小黑", "xiaohei", "像有人隔着很远叫我，可我听不清。"],
        ["无限", "wuxian", "会馆把这次委托交给我们。裂隙在重复几段没有说完的话，已经影响附近灵体。"],
        ["小黑", "xiaohei", "那就去把它补好！用我的传送，还有那些铁环。"],
        ["无限", "wuxian", "先调查，别急着封。去看看森林里的折叶裂隙。记住，力量要给人留退路。"],
        ["旁白", "narrator", "原创委托正式开启：穿过森林、会馆、城市、海岸与蓝溪镇，找回四段失落的回声。"]
      ]);
      return;
    }
    if (this.stage === "dragon_npc" && key === "panjing") {
      this.setStage("dragon_archive");
      this.say([
        ["潘靖", "panjing", "小黑，无限。会馆廊柱今天一直在震，却没有一处榫卯真的松动。"],
        ["无限", "wuxian", "震的是留在物件里的记忆。"],
        ["潘靖", "panjing", "残简在回廊里。人类工人修过这座会馆，妖精也改过这里的桥。旧记录或许能解释回声。"],
        ["小黑", "xiaohei", "我会看完再动手。嗯，先看清楚。"]
      ]);
      return;
    }
    if (this.stage === "city_xiaobai" && key === "xiaobai") {
      this.setStage("city_agen");
      this.say([
        ["罗小白", "xiaobai", "小黑！你头发上都是叶子。先别急着飞下来，慢慢说，发生什么了？"],
        ["小黑", "xiaohei", "城市里有段回声，一直学人吵架。可我觉得，它好像只是害怕。"],
        ["罗小白", "xiaobai", "那就先听听它为什么害怕呀。帮助别人以前，也要问问他想要什么。"],
        ["罗小白", "xiaobai", "阿根在桥边看那个旧站牌。你去吧，回来要跟我说结果！"]
      ]);
      return;
    }
    if (this.stage === "city_agen" && key === "agen") {
      this.setStage("city_attune");
      this.say([
        ["阿根", "agen", "站牌的铜片被人修过很多次，最新的一次还压着旧刻痕。不是谁把谁抹掉，痕迹都还在。"],
        ["小黑", "xiaohei", "屋顶、巷口、桥洞，都有一样的声音。"],
        ["阿根", "agen", "用传送靠近三处回声，再用御金把共鸣器接回去。别硬掰，不然它会像被你抢走逗猫棒一样生气。"],
        ["小黑", "xiaohei", "……我没有抢。是它自己松口的。"],
        ["阿根", "agen", "好，那就对灵体也温柔一点。"]
      ]);
      return;
    }
    if (this.stage === "coast_npc" && key === "cenpo") {
      this.setStage("coast_attune");
      this.say([
        ["岑阿婆", "cenpo", "岛上的灯，是给回航的人看的，也是告诉海上那些小家伙：这里不赶你们走。"],
        ["小黑", "xiaohei", "可潮声碑一直在哭。"],
        ["岑阿婆", "cenpo", "从前岛民搬走，妖精住下；后来妖精也搬走，人类又来修灯。谁都怕自己的脚印被潮水抹掉。"],
        ["岑阿婆", "cenpo", "点亮远礁的引灯，捞起沉船铜环，再来读碑。路要用传送，铜环要用御金。"]
      ]);
      return;
    }
    if (this.stage === "lanxi_npc" && key === "qinghe") {
      this.setStage("lanxi_attune");
      this.say([
        ["青禾", "qinghe", "蓝溪镇收过无家可归的人，也送过想离开的人。门不是只为关上而存在的。"],
        ["小黑", "xiaohei", "留下可以，离开也可以？"],
        ["青禾", "qinghe", "当然。去问问镇口的许舟和米芽，再把旧阶与药碾里的回声接回来。答案不在我一个人的嘴里。"]
      ]);
      return;
    }
    if (this.stage === "lanxi_attune" && (key === "lanxi_human" || key === "lanxi_spirit")) {
      var isHuman = key === "lanxi_human";
      if (this.flags[isHuman ? "lanxiHuman" : "lanxiSpirit"]) {
        this._toast(isHuman ? "许舟：茶还温着，想走时再来拿。" : "米芽：下次换我给你讲镇外的故事。");
        return;
      }
      if (isHuman) this.flags.lanxiHuman = true;
      else this.flags.lanxiSpirit = true;
      this._emit("echo", this.targets[key]);
      this.say(isHuman ? [
        ["许舟", "lanxi_human", "我祖上被收留时，连一句妖精的话都听不懂。现在呢，我听得懂米芽嫌茶苦。"],
        ["小黑", "xiaohei", "那你一直留在这里吗？"],
        ["许舟", "lanxi_human", "出去走过，又回来了。自己选的，才算家。"]
      ] : [
        ["米芽", "lanxi_spirit", "我曾怕人类会把镇子占走，可许舟生病时，是我给他磨的药。他也替我挡过雨。"],
        ["小黑", "xiaohei", "你们也会吵架吗？"],
        ["米芽", "lanxi_spirit", "会呀。吵完还是得来喝茶。共存又不是永远不闹别扭。"]
      ]);
      this._checkLanxi();
      return;
    }
    if (this.stage === "return_tree" && key === "wuxian") {
      this.setStage("climax_attune");
      this.say([
        ["无限", "wuxian", "四段回声指向同一处：古树外缘。裂隙不是有人恶意撕开，而是许多害怕被遗忘的执念挤在一起。"],
        ["小黑", "xiaohei", "那就不能直接把口堵上。得让它们知道，可以留下，也可以走。"],
        ["无限", "wuxian", "对。先用传送到外环，给它打开一条通路；再按根、灯、檐的顺序，用御金校准三枚镇钉。"],
        ["无限", "wuxian", "失控灵体出现后，不用消灭它。让它停下来，听我们说完。"]
      ]);
      return;
    }
    if (this.stage === "epilogue" && key === "wuxian") {
      this._finishStory();
      return;
    }
    if (this.stage === "complete") {
      var completedLines = {
        wuxian: "今天想先休息，还是去练习？任务做完了，不必一直赶路。",
        xiaobai: "你回来啦！后来呢？那棵树有没有再说话？",
        agen: "裂隙稳定了就好。别把冒险总结写成只有四个字。",
        panjing: "会馆会保留两边的新记录，不再只记录谁修好了什么。",
        cenpo: "灯还亮着。人和妖精回航时，都能看见。",
        qinghe: "镇门开着。想回来就回来，想去别处就去别处。"
      };
      this.say([[this.targets[key] ? this.targets[key].name : "同行者", key, completedLines[key] || "叶隙已经安静，你还可以继续探索。"]]);
      return;
    }
    this._showNPCHint(key);
  };

  Story.prototype._showNPCHint = function (key) {
    var objective = this.getObjective();
    var name = this.targets[key] ? this.targets[key].name : "同行者";
    var text = "当前委托：" + objective.detail;
    if (key === "wuxian") text = "别急。" + objective.detail;
    if (key === "xiaobai") text = "小黑，慢慢来！现在要去：" + objective.detail;
    if (key === "agen") text = "先看目标，再动手。" + objective.detail;
    this.say([[name, key, text]]);
  };

  Story.prototype._handleObject = function (key) {
    if (this.stage === "forest_inspect" && key === "forest_rift") {
      this.setStage("forest_attune");
      this.say([
        ["小黑", "xiaohei", "叶子后面还有一层……不，是地方被叠起来了。里面有人在说‘别赶我走’。"],
        ["无限", "wuxian", "先做一次小校准。传送到裂隙背侧，再用御金扣紧金属叶扣。两种力量都要用上。"],
        ["小黑", "xiaohei", "知道了。手别比脑子快……这次会记住的。"]
      ]);
      return;
    }
    if (this.stage === "dragon_archive" && key === "dragon_archive") {
      this.flags.clues.dragon = true;
      this.setStage("dragon_attune");
      this.say([
        ["残简记录", "narrator", "『人修梁，妖固廊。有人怕树根顶坏石阶，也有人怕石阶挤死树根。后来双方各退半步，在桥边留下了树洞。』"],
        ["小黑", "xiaohei", "不是谁赢了，是他们把桥改成了都能走的样子。"],
        ["潘靖", "panjing", "残简还有三枚共振钉。先传送取得回廊折角的页码，再按叶、桥、檐的顺序用御金调准。"]
      ]);
      return;
    }
    if (this.stage === "coast_attune" && key === "coast_memory") {
      if (!this.flags.coastTeleport || !this.flags.coastMetal) {
        this._toast("碑声仍不清楚：先传送点亮远礁引灯，再用御金捞起沉船铜环");
        return;
      }
      this.flags.coastMemory = true;
      this.flags.clues.coast = true;
      this.setStage("coast_combat");
      this.say([
        ["潮声碑", "narrator", "『我们把灯留下。后来的人可以点，后来的妖精也可以点。若你找到新的家，不必替旧家守门一辈子。』"],
        ["小黑", "xiaohei", "想留下的人没有被赶走，想走的人也能回来……这才是灯要照的路吧。"],
        ["岑阿婆", "cenpo", "潮里的灵体听见了。它憋了太久，先陪它把劲缓下来，别伤着它。"]
      ]);
      return;
    }
    if (this.stage === "epilogue" && key === "ancient_tree") {
      this._finishStory();
      return;
    }
    if (this.stage === "complete" && key === "ancient_tree") {
      this.say([["旁白", "narrator", "古树把四段回声收成年轮。叶隙已经稳定，《叶隙回响》主线通关，世界仍向你敞开。"]]);
      this._showEnding();
      return;
    }
    var target = this.targets[key];
    if (target && target.data.ability === "teleport") {
      this._toast(target.name + "：需要在标记附近成功使用【传送】");
      return;
    }
    if (target && target.data.ability === "metal") {
      this._toast(target.name + "：需要在标记附近成功使用【御金】");
      return;
    }
    if (COMBAT[this.stage] && key === COMBAT[this.stage].at) {
      var enemy = this.enemyRefs[COMBAT[this.stage].key];
      if (!enemy) {
        this._toast("灵体尚未凝聚，请稍候；若已出现，请通过非致命交手使其平静");
      } else {
        this._toast("灵体正在失控，普通对话无法让它平静；先进行非致命交手");
      }
      return;
    }
    this._toast(this.getObjective().detail);
  };

  Story.prototype._abilityTarget = function (keys, point, radius) {
    var player = this._player();
    var best = null;
    var bestDistance = radius;
    for (var i = 0; i < keys.length; i += 1) {
      var target = this.targets[keys[i]];
      if (!target) continue;
      var d = Math.min(distance(point, target), distance(player, target));
      if (d <= bestDistance) {
        bestDistance = d;
        best = target;
      }
    }
    return best;
  };

  Story.prototype.onAbilityUsed = function (name, worldX, worldY) {
    if (!this.started) return false;
    var ability = normalizeId(name);
    if (ability === "space" || ability === "传送" || ability === "transfer") ability = "teleport";
    if (ability === "御金" || ability === "金属" || ability === "metalcontrol") ability = "metal";
    if (ability !== "teleport" && ability !== "metal") return false;
    var player = this._player();
    var point = { x: finite(worldX, finite(player.x, 0)), y: finite(worldY, finite(player.y, 0)) };
    this.stats[ability] += 1;
    return ability === "teleport" ? this._handleTeleport(point) : this._handleMetal(point);
  };

  Story.prototype._handleTeleport = function (point) {
    var target;
    if (this.stage === "forest_attune" && !this.flags.forestTeleport) {
      target = this._abilityTarget(["forest_space"], point, 220);
      if (!target) return false;
      this.flags.forestTeleport = true;
      this._abilityFeedback("teleport", target, "空间接通了：裂隙背侧留下稳定落点");
      this._checkForest();
      return true;
    }
    if (this.stage === "dragon_attune" && !this.flags.dragonTeleport) {
      target = this._abilityTarget(["dragon_space"], point, 220);
      if (!target) return false;
      this.flags.dragonTeleport = true;
      this._abilityFeedback("teleport", target, "取得折角页码：共振顺序为叶→桥→檐");
      this._checkDragon();
      return true;
    }
    if (this.stage === "city_attune") {
      var remaining = [];
      for (var i = 0; i < CITY_ECHOES.length; i += 1) {
        if (!this.flags.cityEchoes[CITY_ECHOES[i]]) remaining.push(CITY_ECHOES[i]);
      }
      target = this._abilityTarget(remaining, point, 220);
      if (!target) return false;
      var echoKey = target.data.storyId;
      this.flags.cityEchoes[echoKey] = true;
      this._abilityFeedback("teleport", target, "收集城市回声（" + this._cityEchoCount() + "/3）");
      var memories = {
        city_echo_roof: "屋顶回声：人类修伞的人，也曾替陌生妖精留过一晚屋檐。",
        city_echo_alley: "巷口回声：妖精清理堵塞的水沟，第二天店主悄悄多放了一碗豆浆。",
        city_echo_bridge: "桥洞回声：争吵的双方都在说‘这里是我的家’，却没有谁先问对方怕什么。"
      };
      this.say([[target.name, "narrator", memories[echoKey]]]);
      return true;
    }
    if (this.stage === "coast_attune" && !this.flags.coastTeleport) {
      target = this._abilityTarget(["coast_space"], point, 230);
      if (!target) return false;
      this.flags.coastTeleport = true;
      this._abilityFeedback("teleport", target, "远礁引灯亮了，潮声碑显现下一道刻痕");
      return true;
    }
    if (this.stage === "lanxi_attune" && !this.flags.lanxiTeleport) {
      target = this._abilityTarget(["lanxi_space"], point, 220);
      if (!target) return false;
      this.flags.lanxiTeleport = true;
      this._abilityFeedback("teleport", target, "旧阶两侧连通，镇门不再把回声困住");
      this._checkLanxi();
      return true;
    }
    if (this.stage === "climax_attune" && !this.flags.climaxTeleport) {
      target = this._abilityTarget(["climax_space"], point, 230);
      if (!target) return false;
      this.flags.climaxTeleport = true;
      this._abilityFeedback("teleport", target, "外环通路已打开：现在按根→灯→檐使用御金");
      return true;
    }
    if (this.stage === "climax_seal" && !this.flags.sealTeleport) {
      target = this._abilityTarget(["climax_rift"], point, 240);
      if (!target) return false;
      this.flags.sealTeleport = true;
      this._abilityFeedback("teleport", target, "回声已被送至各自选择的去处，立即用御金收拢裂隙");
      return true;
    }
    return false;
  };

  Story.prototype._handleMetal = function (point) {
    var target;
    if (this.stage === "forest_attune" && !this.flags.forestMetal) {
      target = this._abilityTarget(["forest_metal"], point, 205);
      if (!target) return false;
      this.flags.forestMetal = true;
      this._abilityFeedback("metal", target, "金属叶扣已校准，森林回声变得清晰");
      this._checkForest();
      return true;
    }
    if (this.stage === "dragon_attune" && this.flags.dragonPins < 3) {
      var nearDragonPin = this._abilityTarget(DRAGON_PINS, point, 205);
      if (!nearDragonPin) return false;
      var expected = DRAGON_PINS[this.flags.dragonPins];
      if (nearDragonPin.data.storyId !== expected) {
        this._toast("共振顺序不对：残简记载为叶→桥→檐");
        return false;
      }
      this.flags.dragonPins += 1;
      this._abilityFeedback("metal", nearDragonPin, "共振钉归位（" + this.flags.dragonPins + "/3）");
      this._checkDragon();
      return true;
    }
    if (this.stage === "city_attune" && !this.flags.cityMetal) {
      target = this._abilityTarget(["city_resonator"], point, 205);
      if (!target) return false;
      if (this._cityEchoCount() < 3) {
        this._toast("共鸣器还缺少三段回声，先用传送收集屋顶、巷口与桥洞的声音");
        return false;
      }
      this.flags.cityMetal = true;
      this._abilityFeedback("metal", target, "旧站牌重新响起：不同年代的刻痕被同时保留");
      this.setStage("city_combat");
      this.say([
        ["阿根", "agen", "回声实体化了。先让它的攻击慢下来，别打散那几段记忆。"],
        ["小黑", "xiaohei", "明白。我要让它停下来，不是让它消失。"]
      ]);
      return true;
    }
    if (this.stage === "coast_attune" && !this.flags.coastMetal) {
      target = this._abilityTarget(["coast_metal"], point, 210);
      if (!target) return false;
      this.flags.coastMetal = true;
      this._abilityFeedback("metal", target, "沉船铜环出水，碑上的旧航路重新发亮");
      return true;
    }
    if (this.stage === "lanxi_attune" && !this.flags.lanxiMetal) {
      target = this._abilityTarget(["lanxi_metal"], point, 205);
      if (!target) return false;
      this.flags.lanxiMetal = true;
      this._abilityFeedback("metal", target, "药碾轻响，医馆里人与妖精的共同生活被重新记起");
      this._checkLanxi();
      return true;
    }
    if (this.stage === "climax_attune" && this.flags.climaxPins < 3) {
      var nearClimaxPin = this._abilityTarget(CLIMAX_PINS, point, 210);
      if (!nearClimaxPin) return false;
      if (!this.flags.climaxTeleport) {
        this._toast("先用传送打开外环通路，再校准镇钉");
        return false;
      }
      var expectedClimax = CLIMAX_PINS[this.flags.climaxPins];
      if (nearClimaxPin.data.storyId !== expectedClimax) {
        this._toast("镇钉需要按根→灯→檐的顺序校准");
        return false;
      }
      this.flags.climaxPins += 1;
      this._abilityFeedback("metal", nearClimaxPin, "镇钉校准（" + this.flags.climaxPins + "/3）");
      if (this.flags.climaxPins >= 3) {
        this.setStage("climax_combat");
        this.say([
          ["失控灵体", "spirit", "别替我关门……我不知道该回哪里……"],
          ["小黑", "xiaohei", "那就不先关门。你看着我，我陪你把路一条条找出来。"],
          ["无限", "wuxian", "稳住它的节奏。等它平静，再把回声送回去。"]
        ]);
      }
      return true;
    }
    if (this.stage === "climax_seal" && !this.flags.sealMetal) {
      target = this._abilityTarget(["climax_rift"], point, 230);
      if (!target) return false;
      if (!this.flags.sealTeleport) {
        this._toast("先用传送为回声打开通路，再用御金收拢裂隙");
        return false;
      }
      this.flags.sealMetal = true;
      this._abilityFeedback("metal", target, "三枚镇钉形成闭环，叶隙裂隙已经稳定");
      this.setStage("epilogue");
      this.say([
        ["旁白", "narrator", "喧响渐渐变成普通的风声。失控灵体缩成一团微弱的叶光，自主选择留在古树的树洞里。"],
        ["小黑", "xiaohei", "……安静了。师父，我们回古树吧。我想看看它现在的样子。"]
      ]);
      return true;
    }
    return false;
  };

  Story.prototype._abilityFeedback = function (type, target, message) {
    this._emit(type, target);
    this._sound(type === "metal" ? "metal" : "teleport");
    this._toast(message);
    this._syncObjective(true);
  };

  Story.prototype._checkForest = function () {
    if (this.stage !== "forest_attune" || !this.flags.forestTeleport || !this.flags.forestMetal) return;
    this.flags.clues.forest = true;
    this.setStage("dragon_npc");
    this.say([
      ["裂隙回声", "spirit", "『龙游……回廊……第一段没有说完的话……』"],
      ["小黑", "xiaohei", "原来它不是让我留下别动，是让我听完再走。师父，我们去龙游会馆。"],
      ["无限", "wuxian", "嗯。你刚才先看了落点再传送，也没把叶扣硬拽下来。很好。"]
    ]);
  };

  Story.prototype._checkDragon = function () {
    if (this.stage !== "dragon_attune" || !this.flags.dragonTeleport || this.flags.dragonPins < 3) return;
    this.flags.clues.dragonComplete = true;
    this.setStage("dragon_combat");
    this.say([
      ["潘靖", "panjing", "残简里的灵体失控了！它一直在重复拆桥那一夜，先让它平静下来。"],
      ["小黑", "xiaohei", "我会守住桥，也会守住它留下的那段记忆。"]
    ]);
  };

  Story.prototype._cityEchoCount = function () {
    var count = 0;
    for (var i = 0; i < CITY_ECHOES.length; i += 1) {
      if (this.flags.cityEchoes[CITY_ECHOES[i]]) count += 1;
    }
    return count;
  };

  Story.prototype._checkLanxi = function () {
    if (this.stage !== "lanxi_attune") return;
    if (!this.flags.lanxiTeleport || !this.flags.lanxiMetal || !this.flags.lanxiHuman || !this.flags.lanxiSpirit) return;
    this.flags.clues.lanxi = true;
    this.setStage("return_tree");
    this.say([
      ["青禾", "qinghe", "四段回声已经齐了。它们不是在争谁配拥有家，而是在问：我能不能自己选，又会不会被记住。"],
      ["小黑", "xiaohei", "我不知道怎么让所有人都满意。可我可以先听，再把路留出来。"],
      ["青禾", "qinghe", "那就回古树吧。带着你的答案，不用把它说成唯一答案。"]
    ]);
  };

  Story.prototype.onEnemyDefeated = function (enemy) {
    var encounter = COMBAT[this.stage];
    if (!encounter || !enemy) return false;
    var enemyId = normalizeId(enemy.storyId || enemy.id || enemy.name);
    var accepted = enemyId === normalizeId(encounter.key) || enemyId === normalizeId("story_" + encounter.key) || enemyId === normalizeId(encounter.name);
    if (!accepted) return false;
    if (this.flags.defeated[encounter.key]) return true;
    this.flags.defeated[encounter.key] = true;
    this.stats.enemiesCalmed += 1;
    this._emit("heal", enemy);
    this._sound("quest");
    this.setStage(encounter.next);
    if (encounter.key === "dragon_echo") {
      this.say([
        ["残简灵体", "spirit", "桥……没有消失。树洞也还在……"],
        ["小黑", "xiaohei", "嗯。修过它的人、改过它的人，都被记下来了。你可以不用再拆一次。"],
        ["无限", "wuxian", "下一段回声在城市。那里人多，先听，再判断。"]
      ]);
    } else if (encounter.key === "city_echo") {
      this.say([
        ["罗小白", "xiaobai", "它安静下来了？太好了！你看，它刚才不是故意要吓人的吧。"],
        ["小黑", "xiaohei", "它怕被忘掉。小白，你刚才让我先问，真的有用。"],
        ["阿根", "agen", "离岛潮声碑出现了同样的频率。路上可以把这次的总结想好，四个字以上。"],
        ["小黑", "xiaohei", "……阿根！"]
      ]);
    } else if (encounter.key === "coast_echo") {
      this.say([
        ["岑阿婆", "cenpo", "它想起灯为什么亮了，就不会再追着每一艘船不放。"],
        ["小黑", "xiaohei", "家不是把谁绑住。可有人记得你，走远一点也不会害怕。"],
        ["无限", "wuxian", "最后一段旧记录在蓝溪镇。那里的门，会给我们另一半答案。"]
      ]);
    } else if (encounter.key === "rift_heart") {
      this.say([
        ["小黑", "xiaohei", "你不用马上选。想留下，树洞会留着；想走，外环的路也开着。"],
        ["叶隙灵体", "spirit", "……那我想先留在树洞里。以后，再去看看城里的灯。"],
        ["无限", "wuxian", "小黑，传送送回四段回声，然后用御金收拢外环。顺序不能反。"]
      ]);
    }
    return true;
  };

  Story.prototype._showEnding = function () {
    var ui = this.game && this.game.ui;
    if (!ui || typeof ui.showEnding !== "function") return;
    try {
      ui.showEnding({
        title: "叶隙重新有了回声",
        text: "非官方原创支线《叶隙回响》主线已通关。裂隙稳定，古树重归宁静；你仍可继续自由探索。",
        stats: {
          "有效传送": this.stats.teleport,
          "御金校准": this.stats.metal,
          "安抚灵体": this.stats.enemiesCalmed,
          "到访区域": Object.keys(this.stats.zones).length
        }
      });
    } catch (ignore) {}
  };

  Story.prototype._finishStory = function () {
    if (this.stage !== "epilogue") return;
    var story = this;
    this.say([
      ["旁白", "narrator", "回到古树时，散落的叶光正沿根系缓缓升起。裂隙不再扩张，森林、会馆、城市、海岸与蓝溪镇的回声都找到了安放之处。"],
      ["小黑", "xiaohei", "它不是想把谁赶走，只是一直找不到能回去的地方。"],
      ["无限", "wuxian", "你没有替它选住处。你给它留了选择，也给后来的人留了路。"],
      ["小黑", "xiaohei", "我还是不知道所有事怎么做才对。不过，以后我会先听。愿意留下的、想离开的，都该有自己的家。"],
      ["无限", "wuxian", "这就够了。答案可以继续长。"],
      ["小黑", "xiaohei", "师父，小白和阿根还在等吧？这次我来讲。你不能只说‘嗯’。"],
      ["无限", "wuxian", "……好。我补充。"],
      ["旁白", "narrator", "非官方原创支线《叶隙回响》完。主线已通关，古树恢复宁静；你仍可继续探索开放区域，与同行者交谈。"]
    ], function () {
      story.setStage("complete");
      story.endingShown = true;
      story._sound("ending");
      story._showEnding();
      story._syncObjective(true);
    });
  };

  Story.prototype._objectiveTarget = function (key) {
    if (!key) return null;
    var encounter = COMBAT[key];
    if (encounter) {
      var enemy = this.enemyRefs[encounter.key];
      if (enemy) return enemy;
      return this.targets[encounter.at] || null;
    }
    return this.targets[key] || null;
  };

  Story.prototype._objective = function (title, detail, current, total, targetKey) {
    total = Math.max(0, total);
    current = clamp(current, 0, total || 1);
    return {
      title: "叶隙回响 · " + title,
      detail: detail,
      progress: total ? current / total : 1,
      current: current,
      total: total,
      target: this._objectiveTarget(targetKey)
    };
  };

  Story.prototype.getObjective = function () {
    var f = this.flags;
    switch (this.stage) {
      case "wake":
        return this._objective("序章·森林苏醒", "与古树旁的无限交谈，接受原创委托", 0, 1, "wuxian");
      case "forest_inspect":
        return this._objective("序章·折叶之声", "调查叶隙森林中的折叶裂隙", 0, 1, "forest_rift");
      case "forest_attune": {
        var forestCurrent = (f.forestTeleport ? 1 : 0) + (f.forestMetal ? 1 : 0);
        var forestTarget = !f.forestTeleport ? "forest_space" : "forest_metal";
        return this._objective("序章·双系校准", "在标记处使用【传送】抵达裂隙背侧，并使用【御金】扣紧金属叶扣", forestCurrent, 2, forestTarget);
      }
      case "dragon_npc":
        return this._objective("第一调查·龙游会馆", "前往龙游会馆，与负责交涉的潘靖交谈", 0, 1, "panjing");
      case "dragon_archive":
        return this._objective("第一调查·人修梁，妖固廊", "阅读会馆回廊中的残简，寻找共振顺序", 0, 1, "dragon_archive");
      case "dragon_attune":
        return this._objective("第一调查·回廊共鸣", "【传送】取得折角页码；按叶→桥→檐顺序对共振钉使用【御金】", (f.dragonTeleport ? 1 : 0) + f.dragonPins, 4, !f.dragonTeleport ? "dragon_space" : DRAGON_PINS[f.dragonPins]);
      case "dragon_combat":
        return this._objective("第一调查·残简失控", "以非致命交手安抚失控灵体·残简，保留桥与树洞的记忆", f.defeated.dragon_echo ? 1 : 0, 1, "dragon_combat");
      case "city_xiaobai":
        return this._objective("第二调查·城市街角", "在城市街角找到罗小白，听听她的看法", 0, 1, "xiaobai");
      case "city_agen":
        return this._objective("第二调查·旧站牌", "与桥边的阿根交谈，了解城市回声", 0, 1, "agen");
      case "city_attune": {
        var cityCount = this._cityEchoCount() + (f.cityMetal ? 1 : 0);
        var cityTarget = null;
        for (var i = 0; i < CITY_ECHOES.length; i += 1) {
          if (!f.cityEchoes[CITY_ECHOES[i]]) { cityTarget = CITY_ECHOES[i]; break; }
        }
        if (!cityTarget) cityTarget = "city_resonator";
        return this._objective("第二调查·屋檐与水沟", "【传送】收集屋顶、巷口、桥洞三段回声，再对旧站牌共鸣器使用【御金】", cityCount, 4, cityTarget);
      }
      case "city_combat":
        return this._objective("第二调查·喧街失控", "安抚失控灵体·喧街，不要打散城市记忆", f.defeated.city_echo ? 1 : 0, 1, "city_combat");
      case "coast_npc":
        return this._objective("第三调查·离岛海岸", "前往离岛海岸，与守潮人岑阿婆交谈", 0, 1, "cenpo");
      case "coast_attune": {
        var coastCurrent = (f.coastTeleport ? 1 : 0) + (f.coastMetal ? 1 : 0) + (f.coastMemory ? 1 : 0);
        var coastTarget = !f.coastTeleport ? "coast_space" : (!f.coastMetal ? "coast_metal" : "coast_memory");
        return this._objective("第三调查·为谁留灯", "【传送】点亮远礁引灯，【御金】捞起沉船铜环，再调查潮声碑", coastCurrent, 3, coastTarget);
      }
      case "coast_combat":
        return this._objective("第三调查·归潮失控", "安抚失控灵体·归潮，让它重新听见引灯的意义", f.defeated.coast_echo ? 1 : 0, 1, "coast_combat");
      case "lanxi_npc":
        return this._objective("第四调查·蓝溪镇", "进入蓝溪镇，与守镇人青禾交谈", 0, 1, "qinghe");
      case "lanxi_attune": {
        var lanxiCurrent = (f.lanxiTeleport ? 1 : 0) + (f.lanxiMetal ? 1 : 0) + (f.lanxiHuman ? 1 : 0) + (f.lanxiSpirit ? 1 : 0);
        var lanxiTarget = !f.lanxiHuman ? "lanxi_human" : (!f.lanxiSpirit ? "lanxi_spirit" : (!f.lanxiTeleport ? "lanxi_space" : "lanxi_metal"));
        return this._objective("第四调查·门的方向", "与许舟、米芽交谈；【传送】连通镇门旧阶，【御金】校准医馆药碾", lanxiCurrent, 4, lanxiTarget);
      }
      case "return_tree":
        return this._objective("终章·带着答案回来", "返回叶隙森林，与古树旁的无限会合", 0, 1, "wuxian");
      case "climax_attune":
        return this._objective("终章·留一条退路", "先【传送】到裂隙外环，再按根→灯→檐对三枚镇钉使用【御金】", (f.climaxTeleport ? 1 : 0) + f.climaxPins, 4, !f.climaxTeleport ? "climax_space" : CLIMAX_PINS[f.climaxPins]);
      case "climax_combat":
        return this._objective("终章·叶隙之心", "安抚最终失控灵体，不消灭它，让它重新听见选择", f.defeated.rift_heart ? 1 : 0, 1, "climax_combat");
      case "climax_seal":
        return this._objective("终章·稳定裂隙", "在叶隙之心先【传送】送回四段回声，再【御金】收拢外环；顺序不能反", (f.sealTeleport ? 1 : 0) + (f.sealMetal ? 1 : 0), 2, "climax_rift");
      case "epilogue":
        return this._objective("尾声·叶隙回响", "裂隙已稳定。回到叶隙古树，与无限完成这次委托", 0, 1, "ancient_tree");
      case "complete":
        return {
          title: "叶隙回响 · 主线已通关",
          detail: "裂隙稳定，古树重归宁静。通关状态已保存，可继续自由探索或与伙伴交谈",
          progress: 1,
          current: 1,
          total: 1,
          target: null
        };
      default:
        return this._objective("森林苏醒", "与无限交谈", 0, 1, "wuxian");
    }
  };

  Story.prototype._syncObjective = function (force) {
    var objective = this.getObjective();
    var signature = [objective.title, objective.detail, objective.current, objective.total, objective.target ? objective.target.id : ""].join("|");
    if (!force && signature === this._objectiveSignature) return;
    this._objectiveSignature = signature;
    var ui = this.game && this.game.ui;
    if (ui && typeof ui.setObjective === "function") {
      try { ui.setObjective(objective); } catch (ignore) {}
    }
  };

  Story.prototype.update = function (dt) {
    if (!this.started) return;
    this._time += finite(dt, 0);
    this.stats.playTime += finite(dt, 0);
    this._hookAbilities();
    this._registerTargets();
    this._syncNPCs();
    var encounter = COMBAT[this.stage];
    if (encounter && !this.flags.defeated[encounter.key]) {
      var enemy = this.enemyRefs[encounter.key];
      if (!enemy) enemy = this._spawnEncounter(encounter);
      if (enemy && (enemy.defeated === true || enemy.dead === true || (typeof enemy.health === "number" && enemy.health <= 0))) {
        this.onEnemyDefeated(enemy);
      }
    }
    var player = this._player();
    var world = this._world();
    if (world && typeof world.zoneAt === "function") {
      try {
        var zone = world.zoneAt(player.x, player.y);
        var name = this._zoneName(zone);
        if (name) this.stats.zones[name] = true;
      } catch (ignore) {}
    }
    this._syncObjective(false);
  };

  Story.prototype._isTargetRelevant = function (key, objectiveTarget) {
    if (objectiveTarget && this.targets[key] === objectiveTarget) return true;
    if (key === "ancient_tree" || key === "forest_rift" || key === "climax_rift") return this.stage !== "wake";
    if (key === "dragon_rift") return this.stage === "dragon_combat";
    if (key === "city_rift") return this.stage === "city_combat";
    if (key === "coast_rift") return this.stage === "coast_combat";
    return false;
  };

  Story.prototype.drawWorld = function (ctx) {
    if (!ctx || !this.started) return;
    this._syncNPCs();
    var objective = this.getObjective();
    var objectiveTarget = objective.target;
    var reduced = !!(this.game.settings && this.game.settings.reducedMotion);
    var pulse = reduced ? 0.5 : 0.5 + Math.sin(this._time * 3) * 0.16;
    for (var key in this.npcRefs) {
      if (!Object.prototype.hasOwnProperty.call(this.npcRefs, key)) continue;
      var ref = this.npcRefs[key];
      if (!ref.entity && LXH.Art && typeof LXH.Art.drawActor === "function") {
        try { LXH.Art.drawActor(ctx, ref.actor, this._time); } catch (ignore) {}
      }
    }
    for (var i = 0; i < this.targetList.length; i += 1) {
      var target = this.targetList[i];
      var targetKey = target.data.storyId;
      if (!this._isTargetRelevant(targetKey, objectiveTarget)) continue;
      var active = target === objectiveTarget || (objectiveTarget && target.id === objectiveTarget.id);
      var color = target.data.ability === "metal" ? "#f4c86a" : (target.data.ability === "teleport" ? "#8ee8dc" : "#b8e69a");
      ctx.save();
      ctx.globalAlpha = active ? 0.9 : 0.38;
      ctx.strokeStyle = color;
      ctx.fillStyle = color;
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.beginPath();
      ctx.arc(target.x, target.y - 8, (active ? 29 : 22) + pulse * 8, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(target.x, target.y - 48 - pulse * 8);
      ctx.lineTo(target.x - 8, target.y - 60 - pulse * 8);
      ctx.lineTo(target.x + 8, target.y - 60 - pulse * 8);
      ctx.closePath();
      ctx.fill();
      if (targetKey === "forest_rift" || targetKey === "climax_rift" || /_rift$/.test(targetKey)) {
        ctx.globalAlpha = active ? 0.68 : 0.28;
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.ellipse(target.x, target.y - 30, 18 + pulse * 6, 45 + pulse * 10, -0.2, 0, Math.PI * 2);
        ctx.stroke();
      }
      if (active) {
        ctx.globalAlpha = 0.96;
        ctx.font = "14px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "bottom";
        ctx.lineWidth = 4;
        ctx.strokeStyle = "rgba(20,35,30,0.82)";
        ctx.strokeText(target.name, target.x, target.y - 72);
        ctx.fillStyle = "#f4f4dc";
        ctx.fillText(target.name, target.x, target.y - 72);
      }
      ctx.restore();
    }
    if (objectiveTarget && COMBAT[this.stage] && objectiveTarget.x != null) {
      ctx.save();
      ctx.globalAlpha = 0.65;
      ctx.strokeStyle = "#d8a7ef";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(objectiveTarget.x, objectiveTarget.y, 42 + pulse * 10, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();
    }
  };

  Story.prototype.serialize = function () {
    return {
      version: SAVE_VERSION,
      id: QUEST_ID,
      title: this.title,
      unofficial: true,
      stage: this.stage,
      stageIndex: this.stageIndex,
      completed: this.completed,
      complete: this.complete,
      endingShown: this.endingShown,
      flags: JSON.parse(JSON.stringify(this.flags)),
      stats: JSON.parse(JSON.stringify(this.stats))
    };
  };

  Story.prototype.load = function (data) {
    if (typeof data === "string") {
      try { data = JSON.parse(data); } catch (error) { return false; }
    }
    if (!data || typeof data !== "object") return false;
    if (data.id && data.id !== QUEST_ID) return false;
    this._resetForLoad();
    var stage = STAGES.indexOf(data.stage) !== -1 ? data.stage : STAGES[clamp(Math.floor(finite(data.stageIndex, 0)), 0, STAGES.length - 1)];
    var sourceFlags = data.flags && typeof data.flags === "object" ? data.flags : {};
    var booleanFlags = [
      "forestTeleport", "forestMetal", "dragonTeleport", "cityMetal", "coastTeleport", "coastMetal", "coastMemory",
      "lanxiTeleport", "lanxiMetal", "lanxiHuman", "lanxiSpirit", "climaxTeleport", "sealTeleport", "sealMetal"
    ];
    for (var i = 0; i < booleanFlags.length; i += 1) {
      var flag = booleanFlags[i];
      this.flags[flag] = sourceFlags[flag] === true;
    }
    this.flags.dragonPins = clamp(Math.floor(finite(sourceFlags.dragonPins, 0)), 0, 3);
    this.flags.climaxPins = clamp(Math.floor(finite(sourceFlags.climaxPins, 0)), 0, 3);
    var echoSource = sourceFlags.cityEchoes && typeof sourceFlags.cityEchoes === "object" ? sourceFlags.cityEchoes : {};
    for (var e = 0; e < CITY_ECHOES.length; e += 1) this.flags.cityEchoes[CITY_ECHOES[e]] = echoSource[CITY_ECHOES[e]] === true;
    var defeatedSource = sourceFlags.defeated && typeof sourceFlags.defeated === "object" ? sourceFlags.defeated : {};
    for (var combatStage in COMBAT) {
      if (Object.prototype.hasOwnProperty.call(COMBAT, combatStage)) this.flags.defeated[COMBAT[combatStage].key] = defeatedSource[COMBAT[combatStage].key] === true;
    }
    var clueSource = sourceFlags.clues && typeof sourceFlags.clues === "object" ? sourceFlags.clues : {};
    var clueKeys = ["forest", "dragon", "dragonComplete", "coast", "lanxi"];
    for (var c = 0; c < clueKeys.length; c += 1) this.flags.clues[clueKeys[c]] = clueSource[clueKeys[c]] === true;
    var sourceStats = data.stats && typeof data.stats === "object" ? data.stats : {};
    var numericStats = ["teleport", "metal", "interactions", "enemiesCalmed", "playTime"];
    for (var s = 0; s < numericStats.length; s += 1) {
      var stat = numericStats[s];
      this.stats[stat] = Math.max(0, finite(sourceStats[stat], 0));
    }
    if (sourceStats.zones && typeof sourceStats.zones === "object") {
      for (var zoneName in sourceStats.zones) {
        if (Object.prototype.hasOwnProperty.call(sourceStats.zones, zoneName) && sourceStats.zones[zoneName] === true) this.stats.zones[zoneName] = true;
      }
    }
    this.stage = stage;
    this.stageIndex = STAGES.indexOf(stage);
    this.completed = stage === "complete" || data.completed === true || data.complete === true;
    if (this.completed) {
      this.stage = "complete";
      this.stageIndex = STAGES.indexOf("complete");
    }
    this.complete = this.completed;
    this.endingShown = data.endingShown === true;
    this.started = true;
    this._buildTargets();
    this._registerTargets();
    this._syncNPCs();
    this._hookAbilities();
    this._enterStage(this.stage);
    if (this.game) this.game.storyStage = this.stage;
    this._syncObjective(true);
    return true;
  };

  LXH.Story = Story;
})(typeof window !== "undefined" ? window : globalThis);
