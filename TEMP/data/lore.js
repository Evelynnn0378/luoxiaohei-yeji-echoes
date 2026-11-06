(function () {
  "use strict";

  window.LXH = window.LXH || {};

  window.LXH.DATA = {
    characters: {
      xiaohei: {
        id: "xiaohei",
        name: "罗小黑",
        aliases: ["小黑"],
        identity: "由自然之灵聚集诞生的黑猫妖精；本作玩家主角",
        appearance: {
          shared: "猫形以大头、短小四肢、黑色轮廓、浅绿耳内与浅色大眼圈为识别点；人形保留猫耳与青色大眼。眼睑、蜷缩和伸展比固定萌脸更能表达状态。",
          stages: [
            {
              id: "film-2019-early",
              label: "2019电影前段",
              text: "电影阶段资料标为六岁。早期人形为蓬松黑发、浅绿猫耳、青绿眼睛与尖牙，流浪时穿简朴斜肩浅色布衣，后来旅途中出现蓝绿色外衣等变化。",
              sourceIds: ["A16-001", "A10-007", "A10-008", "A10-009"]
            },
            {
              id: "film-2019-later",
              label: "2019电影后段物料",
              text: "上映后官方剧照已出现白发人形，猫耳与儿童体态仍保留；该视觉事实不单独解释发色变化机制，也不证明领域恢复。",
              sourceIds: ["A06-014"]
            },
            {
              id: "tv",
              label: "TV网络动画",
              text: "基础猫形延续圆头、大眼、浅绿耳内。第28集屋顶夜谈使用白发人形；众生之门篇章也有黑发冒险服造型，第39集则在情绪爆发时由黑发恢复白发。不能只用发色判断篇章。",
              sourceIds: ["A10-001", "A13-014", "A10-013", "A10-010"]
            },
            {
              id: "film-2025",
              label: "2025续作",
              text: "官方角色页标为八岁，立绘延续黑绿配色与猫耳儿童形象；公开海报为黑发、深色无袖上衣与浅色下装，动作更干练。",
              sourceIds: ["A08-005", "A10-014"]
            }
          ]
        },
        personality: [
          { text: "续作官方角色页明确为直率、精力旺盛，并喜欢人类食物。", sourceIds: ["A08-005"] },
          { text: "流浪经历使初期警戒合理；信任是在同行、训练、被保护和普通人的善意中逐步建立的。", sourceIds: ["A06-006", "A06-009", "A06-010", "A06-012"] },
          { text: "重视伙伴与归属，成长不只是战力提升，也包括安抚、学习、识字与选择想成为怎样的人。", sourceIds: ["A10-011", "A10-012"] }
        ],
        abilities: [
          { name: "猫形与人形转换", status: "official_confirmed", text: "可在黑猫与人形之间转换；两种形态共享猫耳、眼色等识别特征。", sourceIds: ["A08-005", "A16-001"] },
          { name: "御灵系·金", status: "official_confirmed", text: "操控金属。游戏中的牵引、举起和回收应围绕金属物体，不扩张为任意物质操控。", sourceIds: ["A16-001", "A16-010", "A08-005"] },
          { name: "空间系·转送", status: "official_confirmed", text: "续作官方角色页使用的名称；可支撑空间传送玩法，但距离、冷却与消耗属于游戏原创数值。", sourceIds: ["A08-005"] },
          { name: "尾巴分裂为嘿咻", status: "official_confirmed", text: "尾巴能分裂为多个名为黑咻的生命体；具体数量不采用二创统计当统一设定。", sourceIds: ["A08-005", "A10-016", "A10-017"] },
          { name: "领域", status: "unresolved", text: "小黑具有领域相关能力，首部电影中风息以豪夺夺取其领域。被夺不等于全部空间能力消失；电影后是否恢复没有官方定论。", sourceIds: ["A16-005", "A16-006", "A16-007"] }
        ],
        relationships: [
          { target: "wuxian", type: "师徒／共同生活", status: "official_confirmed", text: "从强制同行到主动跟随；续作明确两人在村庄共同生活。", sourceIds: ["A06-006", "A06-018", "A08-002"] },
          { target: "xiaobai", type: "收养者与命名者", status: "official_confirmed", text: "雨夜被小白捡回家并得到“罗小黑”这个名字。", sourceIds: ["A02-001", "A10-001"] },
          { target: "fengxi", type: "救助、信任与破裂", status: "official_and_secondary", text: "风息曾救助并带往离岛，后夺取其领域；不应只写成单薄的陌生反派。", sourceIds: ["A16-002", "A12-005", "A16-007"] },
          { target: "luye", type: "师姐／共同调查", status: "official_confirmed", text: "鹿野是无限的弟子、小黑的师姐，两人共同寻找真相。", sourceIds: ["A08-004", "A08-007"] },
          { target: "agen", type: "朋友／共同任务伙伴", status: "official_confirmed", text: "在乡村相处并共同进入任务和众生之门。", sourceIds: ["A02-006", "A16-018"] }
        ],
        sourceIds: ["A16-001", "A08-005", "A10-001", "A10-007", "A10-008", "A10-009", "A10-010", "A10-011", "A10-012", "A10-013", "A10-014", "A13-014", "A06-006", "A06-009", "A06-010", "A06-012", "A06-014", "A06-018", "A02-001", "A02-006", "A12-005", "A16-002", "A16-005", "A16-006", "A16-007", "A16-010", "A16-018"],
        boundaries: [
          "六岁与八岁分别属于特定电影阶段，不混写成全时期固定年龄。",
          "黑发与白发都不是唯一的时间线标签；不得由发色反推领域已经恢复。",
          "不得把无限的己界（吞噬）给小黑；转送、领域与吞噬不可互换。",
          "双灵质空间的完整机制及领域恢复均为未决内容。"
        ],
        gameUse: "玩家可同时使用猫形、人形、御金、转送与嘿咻协作；主线只处理原创回声苔事件，不解答官方未决领域问题。"
      },
      wuxian: {
        id: "wuxian",
        name: "无限",
        aliases: ["师父", "无限师父"],
        identity: "人类；妖灵会馆执行者；小黑与鹿野之师",
        appearance: {
          shared: "蓝黑长发、锐利眼线与低饱和蓝白或灰青长袍构成主要识别；也有束发、小髻和日常便服。长袍衣摆、袖口与发尾服务动作表现。",
          stages: [
            { id: "film-2019", label: "2019电影", text: "冷面、披发、蓝白衣领与简洁长袍突出克制强者；束发造型则更利落。", sourceIds: ["A11-001", "A11-003"] },
            { id: "film-2025", label: "2025续作", text: "续作官方立绘以长袍、长发和收敛表情强化沉静气质；另有灰青角色海报和现代便装，不把一套服装当唯一形态。", sourceIds: ["A08-006", "A11-017", "A11-018"] }
          ]
        },
        personality: [
          { text: "沉静、克制，强者感主要来自精确动作与危险中的稳定，而非夸张表情。", sourceIds: ["A11-001"] },
          { text: "照顾落在同行、共同劳动、训练和保护的细节里；并非只会下命令的冷面执行者。", sourceIds: ["A11-004", "A06-009", "A06-012"] }
        ],
        abilities: [
          { name: "御灵系·金", status: "official_confirmed", text: "与小黑共享金属性语言，可操控金属与实体兵器。", sourceIds: ["A16-010", "A08-006"] },
          { name: "空间系·己界（吞噬）", status: "official_confirmed", text: "续作官方角色页明确为己界（吞噬），能把周围物体迅速纳入自己的灵域；被吞物去向和上限未明确。", sourceIds: ["A08-006", "A16-008"] },
          { name: "执行者行动", status: "official_confirmed", text: "被公认为最强执行人；这一身份不代表可以无视空间规则或替小黑完成所有选择。", sourceIds: ["A08-003", "A08-006"] }
        ],
        relationships: [
          { target: "xiaohei", type: "师父／保护者", status: "official_confirmed", text: "师徒关系由约束逐渐转为主动信任与共同生活。", sourceIds: ["A06-006", "A06-018", "A08-002"] },
          { target: "luye", type: "师父与弟子", status: "official_confirmed", text: "官方角色页明确鹿野为无限弟子。", sourceIds: ["A08-007"] },
          { target: "guild", type: "人类执行者", status: "official_confirmed", text: "人类身份与会馆职责并存，处在人妖关系的交叉点。", sourceIds: ["A16-010", "A08-006"] }
        ],
        sourceIds: ["A11-001", "A11-003", "A11-004", "A11-017", "A11-018", "A16-010", "A16-008", "A08-002", "A08-003", "A08-006", "A08-007", "A06-006", "A06-009", "A06-012", "A06-018"],
        boundaries: [
          "己界（吞噬）属于无限，不是小黑的技能。",
          "吞噬的具体去向、范围和上限不得自行补全。",
          "续作年龄资料为439岁，只对应其公开角色页语境，不用于反推其他角色年龄。"
        ],
        gameUse: "适合作为任务引导、训练提醒与结尾评价者；避免让他直接解决全部关卡。"
      },
      xiaobai: {
        id: "xiaobai",
        name: "罗小白",
        aliases: ["小白"],
        identity: "人类女孩；小黑的收养者与命名者；阿根的堂妹",
        appearance: {
          shared: "TV官方封面可见粉发与儿童比例；具体服装随家居、漫展、游戏等场景变化，不用单张封面固定全部造型。",
          stages: [
            { id: "tv-daily", label: "TV日常", text: "第3集官方封面为粉发小白俯看小黑；家庭与屋顶场景突出自然、平等的相处。", sourceIds: ["A02-003", "A13-014"] },
            { id: "game", label: "众生之门", text: "游戏形象随队伍采用简化和便于行动的服装；第34集选择火系后的造型体现团队分工。", sourceIds: ["A13-020"] }
          ]
        },
        personality: [
          { text: "直率、好奇，面对异常会不断刷新认识，而不是因形态变化否定熟悉的小黑。", sourceIds: ["A13-012", "A13-014"] },
          { text: "愿意照顾、命名和陪伴，也会主动教小黑认字；选火系的理由只是“因为帅”，保留直观的孩子气。", sourceIds: ["A02-001", "A13-020"] }
        ],
        abilities: [
          { name: "蓝玉盘", status: "secondary_summary", text: "老君送给她一只空间定点传送法宝，并特别调为一个月可使用一次；这是特定道具与赠予关系，不是小白自身空间系。", sourceIds: ["A03-012"] },
          { name: "众生之门中的火", status: "official_confirmed", text: "在游戏中升至25级后选择御灵系中的火，后续能发出火焰；不能直接写成现实里已完整掌握火系。", sourceIds: ["A13-020", "A16-019"] }
        ],
        relationships: [
          { target: "xiaohei", type: "收养、命名与接纳", status: "official_confirmed", text: "从雨夜收养到知道妖精身份后仍选择信任与照顾。", sourceIds: ["A02-001", "A13-014"] },
          { target: "agen", type: "堂哥与堂妹", status: "official_confirmed", text: "小白带小黑到乡下探望堂哥阿根和爷爷。", sourceIds: ["A02-006"] },
          { target: "shanxin", type: "同学与好友", status: "secondary_summary", text: "共同逛漫展、玩游戏并组成任务队伍。", sourceIds: ["A13-003", "A13-020"] },
          { target: "bidiu", type: "收养与照料", status: "secondary_summary", text: "比丢由阿根找到，后由小白收养。", sourceIds: ["A02-007"] }
        ],
        sourceIds: ["A02-001", "A02-003", "A02-006", "A02-007", "A03-012", "A13-003", "A13-012", "A13-014", "A13-020", "A16-019"],
        boundaries: [
          "手账没有提供可覆盖所有篇章的统一年龄与服装表，不自行补写。",
          "游戏里的选火不等于现实中无条件使用火焰；现实能力外溢机制仍未完全解释。",
          "蓝玉盘一个月间隔是该次赠予的调整，不推广为所有空间法宝统一冷却。"
        ],
        gameUse: "适合担任地图记录、生活化提问和队伍情感支点；对话保持直率好奇，不写成全知规则讲解员。"
      },
      agen: {
        id: "agen",
        name: "阿根",
        aliases: ["罗根", "堂哥"],
        identity: "小白的堂哥；乡村少年外形下的冰系能力者",
        appearance: {
          shared: "深色蓬松短发、夸张圆框眼镜、白色背心与棕色短裤，常见拖鞋和乡村生活动作；摘掉眼镜会显露较少见的一面。",
          stages: [
            { id: "tv", label: "TV乡村与游戏", text: "日常是邻家堂哥，游戏篇则换成初始或团队冒险服；圆眼镜与黑发要避免与小黑人形混淆。", sourceIds: ["A13-002", "A13-016", "A10-013"] }
          ]
        },
        personality: [
          { text: "平日善良亲切，偶尔显露腹黑一面；会处理家务、修房并向伙伴解释规则。", sourceIds: ["A13-002", "A13-009"] },
          { text: "谨慎、重协作，在战斗中也会为保护同伴和履行承诺而行动。", sourceIds: ["A03-005", "A13-017"] }
        ],
        abilities: [
          { name: "御水成冰／冰系", status: "secondary_and_episode", text: "TV第6集及角色资料可确认冰系表现；不额外创造完整招式表。", sourceIds: ["A02-006", "A13-002", "A03-013"] },
          { name: "与玄离相关的冰火线索", status: "unresolved", text: "百科整理保留灵体寄存、阿根本人说法与旧识辨认之间的矛盾；不得直接写成“阿根就是玄离”。", sourceIds: ["A14-007"] }
        ],
        relationships: [
          { target: "xiaobai", type: "堂哥", status: "official_confirmed", text: "乡村亲属与日常保护者。", sourceIds: ["A02-006"] },
          { target: "xiaohei", type: "朋友与共同任务伙伴", status: "official_confirmed", text: "共同经历乡村事件、蓝溪镇与众生之门。", sourceIds: ["A02-006", "A16-018"] },
          { target: "xuanli", type: "紧密但未简单等同", status: "unresolved", text: "灵体寄存等说法只按百科来源保留，不替作品揭谜。", sourceIds: ["A14-007"] },
          { target: "bidiu", type: "发现者与救助者", status: "secondary_summary", text: "找到比丢，并在误食灵体羽毛球后帮助恢复。", sourceIds: ["A02-007"] }
        ],
        sourceIds: ["A02-006", "A02-007", "A03-005", "A03-013", "A10-013", "A13-002", "A13-009", "A13-016", "A13-017", "A14-007", "A16-018"],
        boundaries: [
          "阿根与玄离的关系仍是谜团；游戏不得用台词直接确认同一人、前世或完全无关。",
          "冰系能力的范围、消耗与玄离旧史不由本游戏补写。"
        ],
        gameUse: "适合解释操作、提示风险和做记录；科普口吻要短，保留亲切与偶尔腹黑。"
      },
      fengxi: {
        id: "fengxi",
        name: "风息",
        aliases: ["长鬃黑豹"],
        identity: "龙游山林诞生的妖精；离岛伙伴的领导者",
        appearance: {
          shared: "人形为深紫长发、紫色眼睛、尖长耳朵与偏深色服装，本体是长鬃黑豹；人形长发延续鬃毛轮廓。",
          stages: [
            { id: "film-2019", label: "2019电影", text: "温和近景与紧皱眉峰的战斗近景并存，不能只保留冷酷一种表情。早期更兽化的草图属于设计探索，不替代最终造型。", sourceIds: ["A12-001", "A12-003", "A12-004", "A15-007"] }
          ]
        },
        personality: [
          { text: "百科整理为外表冷酷、内心细腻；对家园与同伴的在意真实存在，但把目标推向伤害他人的极端。", sourceIds: ["A12-001", "A15-007"] },
          { text: "能提供同类接纳与归属想象，也会因真实目的破坏信任；不应写成单纯欺诈或单纯被迫者。", sourceIds: ["A06-005", "A12-005"] }
        ],
        abilities: [
          { name: "御灵系·木", status: "official_confirmed", text: "操纵植物、促使植物生长；森林居所与能力相互支撑。", sourceIds: ["A16-011", "A12-006"] },
          { name: "生灵系·豪夺", status: "secondary_summary", text: "夺取其他妖精的灵质力，电影中用于夺取小黑领域；发动条件、持续时间和全部限制未公开。", sourceIds: ["A12-002", "A15-007", "A16-007"] }
        ],
        relationships: [
          { target: "xiaohei", type: "救助者与后来的夺取者", status: "official_and_secondary", text: "带小黑前往离岛，后以豪夺夺取领域，信任因此破裂。", sourceIds: ["A16-002", "A16-007"] },
          { target: "luozhu", type: "离岛同伴", status: "secondary_summary", text: "核心团队关系主要来自百科与设定稿整理，不升级为官方关系图新增结论。", sourceIds: ["A12-008", "A12-009"] },
          { target: "xuhuai", type: "同伴／被照料与扶持", status: "secondary_summary", text: "资料称风息由虚淮从小带大，也有风息扶助虚淮的画面。", sourceIds: ["A12-007"] },
          { target: "tianhu", type: "离岛同伴", status: "secondary_summary", text: "天虎从小跟随风息等伙伴，是乖巧的小弟弟。", sourceIds: ["A12-015"] }
        ],
        sourceIds: ["A12-001", "A12-002", "A12-003", "A12-004", "A12-005", "A12-006", "A12-007", "A12-008", "A12-009", "A12-015", "A15-007", "A16-002", "A16-007", "A16-011", "A06-005"],
        boundaries: [
          "A15-007为百科整理，记载其最终自裁、身体化为巨树；引用时必须保留来源层级。",
          "不得续写复活、意识尚存、转世、被救回、领域归还或其他后续命运。",
          "本游戏不提供现世风息NPC；若使用其文字或影像，只能是明确标注的原创往昔片段，不主张改变原作结局。"
        ],
        gameUse: "只用于离岛旧日生活片段与主题对照，不担任现世任务发布者、敌人或复活线主角。"
      },
      luozhu: {
        id: "luozhu",
        name: "洛竹",
        aliases: [],
        identity: "风息身边的离岛同伴；木系妖精",
        appearance: { shared: "棕色束发、灰上衣、红色腰巾与宽松黑裤，造型轻便，表情明快。", stages: [{ id: "film-2019", label: "2019电影", text: "正侧背设定表突出耳部、护具、腰封和鞋履；森林行动强调跳跃与身体协调。", sourceIds: ["A12-009", "A12-010"] }] },
        personality: [
          { text: "阳光可爱，喜欢小黑，希望与他成为真正的朋友。", sourceIds: ["A12-009"] },
          { text: "参与团队行动，也倾向先与小黑沟通，保留独立判断而非单纯服从。", sourceIds: ["A12-011"] }
        ],
        abilities: [{ name: "御灵系·木", status: "secondary_summary", text: "设定稿列木系；具体招式名与规则未公开，不把森林中的每个动作都命名为法术。", sourceIds: ["A12-009", "A12-010"] }],
        relationships: [
          { target: "fengxi", type: "离岛同伴", status: "secondary_summary", text: "围绕风息计划共同行动，但沟通意愿显示团队内部有伦理差异。", sourceIds: ["A12-008", "A12-011"] },
          { target: "xiaohei", type: "主动亲近／希望成为朋友", status: "secondary_summary", text: "友好不能只写成团队计划的工具。", sourceIds: ["A12-009", "A12-014"] }
        ],
        sourceIds: ["A12-008", "A12-009", "A12-010", "A12-011", "A12-014"],
        boundaries: ["不补写电影后的去向、任职或与小黑重逢为正史。", "团队关系证据主要为二手设定整理，引用时保留层级。"],
        gameUse: "可选用于无明确后续时间的友好支线；台词先沟通、后行动。"
      },
      xuhuai: {
        id: "xuhuai",
        name: "虚淮",
        aliases: [],
        identity: "离岛同伴；御灵系冰能力者",
        appearance: { shared: "浅蓝或青蓝长发、双角状头部轮廓、层叠宽袖与腰间珠串，整体冷色，站姿克制。", stages: [{ id: "film-2019", label: "2019电影", text: "最终设定为青蓝服饰与冰系；早期温暖木系概念稿仅作创作过程资料。", sourceIds: ["A12-012", "A12-013", "A12-014"] }] },
        personality: [
          { text: "最终资料为高冷沉静，行动和站姿都偏克制。", sourceIds: ["A12-012", "A12-013"] },
          { text: "与风息存在双向照料，不应只写成没有感情的执行者。", sourceIds: ["A12-007"] }
        ],
        abilities: [{ name: "御灵系·冰", status: "official_confirmed", text: "官方角色页明确冰能力；身体由冰构成，受伤后能自行修复，并能放出精灵鱼。", sourceIds: ["A16-012"] }],
        relationships: [
          { target: "fengxi", type: "伙伴／从小照料", status: "secondary_summary", text: "资料称风息由虚淮带大，也能看到风息承托虚淮的反向扶持。", sourceIds: ["A12-007"] },
          { target: "luozhu", type: "离岛同伴", status: "secondary_summary", text: "冷色沉静与洛竹的暖色活力形成团队分工。", sourceIds: ["A12-008", "A12-012"] }
        ],
        sourceIds: ["A12-007", "A12-008", "A12-012", "A12-013", "A12-014", "A16-012"],
        boundaries: ["最终能力是冰，不得因早期草案改回木系。", "自我修复不等于无限恢复或不死，官方未给出的上限不补。"],
        gameUse: "适合短句、观察与冰面提示；不要把早期草案中的花朵能力做进正式技能。"
      },
      tianhu: {
        id: "tianhu",
        name: "天虎",
        aliases: [],
        identity: "离岛团队里体型很大、乖巧的小弟弟",
        appearance: { shared: "圆滚虎形身体、黄黑条纹、宽檐斗笠、颈间大珠串和深色宽松下装；巨大手掌与小黑形成保护性的尺度差。", stages: [{ id: "film-2019", label: "2019电影", text: "斗笠、圆腹和短肢构成醒目轮廓，虎纹与巨口保留虎形特征。", sourceIds: ["A12-015", "A12-017"] }] },
        personality: [
          { text: "乖巧、温和、不大会讲话，巨大体量不对应凶恶性格。", sourceIds: ["A12-015", "A12-016"] },
          { text: "能承担保护、照料和轻喜剧段落，动作比长台词更重要。", sourceIds: ["A12-017"] }
        ],
        abilities: [{ name: "御灵系·火", status: "secondary_summary", text: "设定表列火系；不把暖灯或红色场景直接当施法证据。", sourceIds: ["A12-015"] }],
        relationships: [
          { target: "fengxi", type: "从小跟随的伙伴", status: "secondary_summary", text: "从小跟着风息等伙伴，是团队里的小弟弟。", sourceIds: ["A12-015"] },
          { target: "xiaohei", type: "照料与保护", status: "secondary_summary", text: "早期概念稿以巨大手掌环抱小黑，只用于理解设计方向，不复写为正片新情节。", sourceIds: ["A12-017"] }
        ],
        sourceIds: ["A12-015", "A12-016", "A12-017"],
        boundaries: ["“肉、酒、嗯”是专栏对全片台词的整理，不意味着原创支线只能重复这三字，但应保持极短句。", "不补写电影后的经历。"],
        gameUse: "以点头、护送、分食物等动作配合一两字台词，避免长篇解说。"
      },
      bidiu: {
        id: "bidiu",
        name: "比丢",
        aliases: ["团鼠"],
        identity: "阿根发现、后由小白收养的团鼠",
        appearance: { shared: "橘黄色小团鼠，叫声近似“Biu”；体色会随食物改变，圆润体量适合突出森林群落中的小动物尺度。", stages: [{ id: "tv", label: "TV", text: "第7集以橘黄色团鼠为中心，森林群像则让它与多种生灵共同出现。", sourceIds: ["A02-007", "A13-005"] }] },
        personality: [{ text: "爱吃、好动，尤其爱啃木头；饲养笑料同时要求角色理解习性并承担责任。", sourceIds: ["A02-007", "A13-005"] }],
        abilities: [
          { name: "随食物变色", status: "secondary_and_episode", text: "吃下的东西会影响体色；原创支线只可做安全的颜色反馈，不新增战斗属性。", sourceIds: ["A02-007", "A13-005"] },
          { name: "误食灵体后的暴走", status: "episode_confirmed", text: "第7集误吞具有灵体的羽毛球后暴走变大，后由阿根帮助恢复；不是可随意复用的增益形态。", sourceIds: ["A02-007"] }
        ],
        relationships: [
          { target: "agen", type: "发现者与救助者", status: "secondary_summary", text: "阿根找到比丢并处理误食危机。", sourceIds: ["A02-007"] },
          { target: "xiaobai", type: "收养者", status: "secondary_summary", text: "由小白收养，曾被放归深山、后来又被接回家。", sourceIds: ["A02-007", "A13-005"] },
          { target: "heixiu", type: "日常伙伴", status: "episode_confirmed", text: "溜走时由小黑用黑咻抓回。", sourceIds: ["A02-007"] }
        ],
        sourceIds: ["A02-007", "A13-005"],
        boundaries: ["金属和动物不能喂，尤其不可把金属能力道具当食物。", "不把误食灵体暴走设计成可主动复制的技能。"],
        gameUse: "支线只安排木头类安全食物与寻找物品，用颜色和动作反馈，不安排喂食战斗。"
      },
      heixiu: {
        id: "heixiu",
        name: "嘿咻",
        aliases: ["黑咻"],
        identity: "小黑尾巴分裂出的生命体，不是普通宠物",
        appearance: { shared: "扁圆小团、黑色身体、浅色大眼圈与小耳尖；删去完整四肢以区别猫形小黑。多体同框仍共享核心识别。", stages: [{ id: "shared", label: "跨篇章", text: "电影、TV与续作均有出现；看到长尾不能立即断定已分裂，需看独立小团与行动。", sourceIds: ["A10-016", "A06-004", "A08-005"] }] },
        personality: [{ text: "具有独立意识，机灵、顽皮，会偷吃后封回保鲜膜，也能寻找、协作和参与轻松段落。", sourceIds: ["A02-003", "A02-015", "A03-005"] }],
        abilities: [{ name: "分体独立行动", status: "official_and_episode", text: "能离开小黑独立活动、寻找目标和做出夸张形变；数量、距离和持续时间的完整规则未公开。", sourceIds: ["A08-005", "A02-004", "A03-005"] }],
        relationships: [{ target: "xiaohei", type: "尾巴分体／协作伙伴", status: "official_confirmed", text: "共享视觉特征又具独立意识，不应只当装饰或召唤物。", sourceIds: ["A08-005", "A10-016"] }],
        sourceIds: ["A02-003", "A02-004", "A02-015", "A03-005", "A06-004", "A08-005", "A10-016", "A10-017"],
        boundaries: ["不把二创视频统计的叫声或数量当官方固定值。", "游戏关卡中的嘿咻数量是原创编排，不反推统一设定。"],
        gameUse: "用于指路、藏匿、协同踩点与轻量反馈；用动作和“嘿咻”叫声，不写成人长篇对白。"
      },
      laojun: {
        id: "laojun",
        name: "老君",
        aliases: [],
        identity: "蓝溪镇灵域主人；清凝之师；古老而自我约束的神灵",
        appearance: {
          shared: "TV常见无眉、儿童般的节能形态，长发、宽松深青衣袍、漂浮移动与蓝玉盘耳饰形成反差；《蓝溪镇》封面则突出蓝色长发、额带和大型蓝耳环。",
          stages: [
            { id: "tv", label: "TV节能形态", text: "眯眼大笑、儿童体型与苍老声音并存，古老神力藏在日常喜剧中。", sourceIds: ["A14-002", "A14-004"] },
            { id: "lanxi-history", label: "《蓝溪镇》旧史", text: "竖版封面为蓝色长发、额带与大型蓝耳环的侧脸形象，气质更接近守望者。", sourceIds: ["A17-001"] }
          ]
        },
        personality: [
          { text: "幽默、生活化，公开整理称近三十年沉迷动画、漫画与游戏；大事受誓言约束，小事鲜活。", sourceIds: ["A14-004"] },
          { text: "重视庇护、修行与自由去留，面对生命危险并非机械守誓见死不救。", sourceIds: ["A14-004", "A17-012", "A17-013"] }
        ],
        abilities: [
          { name: "蓝溪镇灵域", status: "official_confirmed", text: "官方分集页把蓝溪镇称作老君的灵域；有主人、有边界，也可被闯入。", sourceIds: ["A16-004"] },
          { name: "蓝玉盘", status: "secondary_summary", text: "空间定点传送法宝，原左右耳各佩一枚，后来一只送给小白并调整使用间隔。", sourceIds: ["A14-002", "A03-012"] },
          { name: "誓言与委托", status: "secondary_and_episode", text: "百年内不得离开老君阁等约束使老君不能随意出手，誓言录任务又推动他人行动；完整条文不可补写。", sourceIds: ["A03-011", "A14-004"] }
        ],
        relationships: [
          { target: "qingning", type: "师父与爱徒", status: "official_confirmed", text: "清凝随老君、玄离修行与行医，公开书简介明确爱徒关系。", sourceIds: ["A17-013", "A17-016"] },
          { target: "xuanli", type: "旧史同行者", status: "official_confirmed", text: "《蓝溪镇》以老君、玄离与清凝为中心，三人共同经历旅行和日常。", sourceIds: ["A17-001", "A17-003"] },
          { target: "xiaobai", type: "赠予蓝玉盘", status: "secondary_and_episode", text: "允许她常来并赠予一只蓝玉盘，建立继续往来的入口。", sourceIds: ["A03-012"] },
          { target: "diting", type: "助手与旧识", status: "secondary_summary", text: "谛听在老君山承担守门、联络等职责。", sourceIds: ["A15-014"] }
        ],
        sourceIds: ["A03-011", "A03-012", "A14-002", "A14-004", "A15-014", "A16-004", "A17-001", "A17-003", "A17-012", "A17-013", "A17-016"],
        boundaries: [
          "誓言录和百年闭关的完整条文、期限起止及例外不补写。",
          "蓝溪镇灵域不自动等于所有灵质空间或领域。",
          "旧史精确间隔未完全明确，不把不同卷压成同一时间点。"
        ],
        gameUse: "蓝溪镇向导与规则辨别者；台词可幽默，但不能替官方宣布领域恢复或风息后续。"
      },
      shanxin: {
        id: "shanxin",
        name: "山新",
        aliases: [],
        identity: "小白的同学与好友；游戏高手",
        appearance: { shared: "橙色长发或长马尾、平直刘海、绿色发箍，日常与漫展、游戏服装变化明显，平静表情是识别点。", stages: [{ id: "tv", label: "TV与游戏篇", text: "居家黑衣、漫展兔耳装和游戏服装并存，不靠单一套装定义。", sourceIds: ["A13-003", "A13-011", "A13-018"] }] },
        personality: [{ text: "平时表情不多，进入游戏则显露经验、胜负欲和指挥能力。", sourceIds: ["A13-003", "A13-013", "A13-017"] }],
        abilities: [
          { name: "游戏经验", status: "episode_confirmed", text: "格斗游戏与团队任务中的策略来自长期兴趣，不是灵力招式。", sourceIds: ["A13-013", "A13-019"] },
          { name: "电话出现", status: "secondary_summary", text: "角色资料把打电话便出现在对方附近视为夸张主动技能，不与小黑转送混成同一规则。", sourceIds: ["A13-003", "A13-018"] }
        ],
        relationships: [{ target: "xiaobai", type: "同学与好友", status: "secondary_summary", text: "共同参展、组队并分享游戏设备。", sourceIds: ["A13-003", "A13-020"] }, { target: "xiaohei", type: "共同任务伙伴", status: "official_confirmed", text: "四人共同登录众生之门并执行任务。", sourceIds: ["A16-018"] }],
        sourceIds: ["A13-003", "A13-011", "A13-013", "A13-017", "A13-018", "A13-019", "A13-020", "A16-018"],
        boundaries: ["电话传送是喜剧化角色设定，机制不与空间系统一。", "不把她写成只会替小黑解谜的工具人。"],
        gameUse: "城市与队伍协作提示，语言可用地图、路线和刷新点等玩家术语。"
      },
      luye: {
        id: "luye",
        name: "鹿野",
        aliases: ["师姐"],
        identity: "无限弟子、小黑师姐；会馆感知组组长",
        appearance: { shared: "灰白短发或后束发、浅蓝领口与便于行动的服装，神情冷静；设定稿包含背心、夹克和短靴。", stages: [{ id: "film-2025", label: "2025续作", text: "干练轮廓与小黑圆润儿童造型形成对照。", sourceIds: ["A08-007", "A11-012", "A15-011"] }] },
        personality: [{ text: "极度冷静、专注任务，但绝非只有冷酷；人物层次靠极少情绪流露表现。", sourceIds: ["A08-008"] }],
        abilities: [{ name: "御灵系·金／生灵系·追毫", status: "official_confirmed", text: "既会操控金属，也擅长追踪灵；追毫的完整条件与范围不自行补写。", sourceIds: ["A08-007"] }],
        relationships: [{ target: "wuxian", type: "师父与弟子", status: "official_confirmed", text: "官方角色页明确师承。", sourceIds: ["A08-007"] }, { target: "xiaohei", type: "师姐／共同寻找真相", status: "official_confirmed", text: "经验不同的同门在调查中磨合。", sourceIds: ["A08-004", "A08-007"] }],
        sourceIds: ["A08-004", "A08-007", "A08-008", "A11-012", "A15-011"],
        boundaries: ["“关门弟子”等语境不扩写未解释的括号含义。", "不把冷酷简化成没有情感，也不网络口号化其立场。"],
        gameUse: "负责痕迹调查与分工提示，语气短、具体、少安慰但不刻薄。"
      },
      xuanli: {
        id: "xuanli",
        name: "玄离",
        aliases: ["狗哥"],
        identity: "《蓝溪镇》主要人物；与阿根存在未简单揭晓联系的封神妖精",
        appearance: { shared: "黑色中长发、尖耳、紫瞳、耳环与颈间红绳，古代长袍造型不能直接当阿根近照。", stages: [{ id: "lanxi-history", label: "《蓝溪镇》旧史", text: "尖耳与红绳建立非人识别，饭食与笑容保留亲近感。", sourceIds: ["A14-006", "A17-004"] }] },
        personality: [{ text: "开朗急躁、热爱饭食，与清凝、老君共同旅行时既有轻喜剧也有承担。", sourceIds: ["A14-009", "A17-004"] }],
        abilities: [{ name: "冰火与双灵质空间", status: "secondary_summary", text: "百科资料称能控制冰与火并拥有罕见双灵质空间；不把该套规则直接套给阿根或小黑。", sourceIds: ["A14-006"] }],
        relationships: [{ target: "qingning", type: "共同修行与行医", status: "official_confirmed", text: "公开书简介明确同行；不虚构血缘兄妹。", sourceIds: ["A17-013", "A14-009"] }, { target: "laojun", type: "旧史同行者", status: "official_confirmed", text: "君清玄三人构成《蓝溪镇》核心。", sourceIds: ["A17-001"] }, { target: "agen", type: "未简单等同的联系", status: "unresolved", text: "保留灵体寄存、本人说法与旧识辨认的矛盾。", sourceIds: ["A14-007"] }],
        sourceIds: ["A14-006", "A14-007", "A14-009", "A17-001", "A17-004", "A17-013"],
        boundaries: ["不直接宣布“玄离就是阿根”或否定两人联系。", "冰火双空间资料与角色技能不得随意移植。"],
        gameUse: "仅用于明确标注的旧史片段，或在阿根相关对话中保留谜团。"
      },
      qingning: {
        id: "qingning",
        name: "李清凝",
        aliases: ["清凝", "清凝仙子"],
        identity: "《蓝溪镇》主角之一；老君爱徒；医师",
        appearance: { shared: "十五岁资料图中扎双鬟、蓝绿色眼睛、青白衣裳，神态明亮；年龄随分册与事件变化。", stages: [{ id: "lanxi-history", label: "《蓝溪镇》成长阶段", text: "初登场十岁、十二岁拜师的百科整理只对应相应阶段，不能全篇固定为十五岁。", sourceIds: ["A14-014"] }] },
        personality: [{ text: "懂事坚强、活泼勇敢，行医与修行都强调主动选择。", sourceIds: ["A14-014", "A17-005"] }],
        abilities: [{ name: "生灵系·治愈", status: "secondary_summary", text: "角色资料列为治愈系并成为蓝溪镇医师；不把治愈写成无条件复活或解决所有伤势。", sourceIds: ["A14-014", "A14-015"] }],
        relationships: [{ target: "laojun", type: "师父与爱徒", status: "official_confirmed", text: "随老君修行、行医并共同经历乱世。", sourceIds: ["A17-013", "A17-016"] }, { target: "xuanli", type: "共同修行与行医", status: "official_confirmed", text: "与玄离、老君同行，称玄离为狗哥。", sourceIds: ["A17-013", "A14-009"] }],
        sourceIds: ["A14-014", "A14-015", "A17-005", "A17-013", "A17-016"],
        boundaries: ["北域与那伽事件的完整过程以漫画为准，不用二创封面补写。", "不替旧史标虚构公元年份或精确间隔。"],
        gameUse: "仅在蓝溪镇旧史或生活片段中使用，突出医者倾听与实际照料。"
      },
      diting: {
        id: "diting",
        name: "谛听",
        aliases: [],
        identity: "老君山上的神兽与助手；天明珠事件中的追捕者",
        appearance: { shared: "人形尖耳、额前圆纹、绿色古装与半睁眼，妖化为独角青兽；青发与额部特征保证识别。", stages: [{ id: "tv", label: "TV", text: "冷面、疲惫感与喂鹰犬等日常动作并存。", sourceIds: ["A14-010", "A14-012", "A15-014"] }] },
        personality: [{ text: "面冷心热，执行任务时强硬，日常又能停坐、协助和照料鹰犬。", sourceIds: ["A14-012", "A15-014"] }],
        abilities: [{ name: "听嗅觉与火系", status: "secondary_summary", text: "公开整理记载听嗅觉灵敏、使用紫云焰等；传统神话的听心能力不直接搬入。", sourceIds: ["A14-010", "A15-014"] }],
        relationships: [{ target: "laojun", type: "助手", status: "secondary_summary", text: "承担联络、守门等职责。", sourceIds: ["A15-014"] }, { target: "xiaohei", type: "追捕者到日常同处", status: "secondary_and_episode", text: "天明珠追捕之后，也能在漫展停坐并帮助山新。", sourceIds: ["A13-012", "A15-014"] }],
        sourceIds: ["A13-012", "A14-010", "A14-012", "A15-014"],
        boundaries: ["不把传统神话全部能力当本动画官方设定。", "不凭冷面造型推断其始终敌对。"],
        gameUse: "适合声音线索与方位提示，回复简短，偶尔带点无奈。"
      },
      kali: {
        id: "kali",
        name: "卡里",
        aliases: [],
        identity: "灵溪会馆馆长，不是龙游会馆馆长",
        appearance: { shared: "戴墨镜、神情轻松，绿色背景与日常接待场景突出亲和力。", stages: [{ id: "tv", label: "TV灵溪会馆", text: "以接待、说明和信息发布为主，不塑造成单纯战斗首领。", sourceIds: ["A15-005"] }] },
        personality: [{ text: "愿意接待新人并介绍会馆，表达方式日常直接。", sourceIds: ["A15-005"] }],
        abilities: [{ name: "御灵系·木", status: "secondary_summary", text: "曾让种子发芽，是温和的入门展示。", sourceIds: ["A15-005"] }],
        relationships: [{ target: "guild", type: "灵溪会馆馆长", status: "secondary_summary", text: "与龙游馆长潘靖严格区分。", sourceIds: ["A15-004", "A15-005"] }],
        sourceIds: ["A15-004", "A15-005"],
        boundaries: ["不把灵溪会馆职务搬到龙游。", "不补写完整入会流程或组织章程。"],
        gameUse: "若需要灵溪相关彩蛋可作接待员；龙游主线应使用潘靖或原创记录员。"
      },
      panjing: {
        id: "panjing",
        name: "潘靖",
        aliases: ["龙游会馆馆长"],
        identity: "龙游会馆现任馆长，负责与人类一方交涉",
        appearance: { shared: "眼镜、灰发与严肃神情，符合管理者与应急协调者身份。", stages: [{ id: "film-and-tv", label: "电影与TV资料", text: "封闭龙游结界、指挥救援与疏散的公开整理突出其组织职责。", sourceIds: ["A15-004", "A08-015"] }] },
        personality: [{ text: "重视秩序、救援和交涉，行动以协调为主而非个人战力展示。", sourceIds: ["A15-004"] }],
        abilities: [{ name: "培元、化生、传音", status: "secondary_summary", text: "公开条目列生灵系培元、化生及心灵系传音；具体效果和限制不补。", sourceIds: ["A15-004"] }],
        relationships: [{ target: "guild", type: "龙游会馆馆长", status: "official_confirmed", text: "续作官方角色页确认其馆长及对外交涉职责。", sourceIds: ["A08-015"] }],
        sourceIds: ["A08-015", "A15-004"],
        boundaries: ["不与灵溪馆长卡里混为一人。", "不把龙游结界扩展成所有会馆统一规则。"],
        gameUse: "龙游会馆内的任务登记、疏散与安全提示者。"
      }
    },

    places: {
      yexiForest: {
        id: "yexi-forest",
        name: "叶隙森林",
        origin: "game_original",
        canonStatus: "游戏原创地点，不是手账或原作已确认地名",
        description: "以阔叶林、苔石、溪流和林间小路组成的开放区域；回声苔、测风片、叶音篱与本地巡护设施均为原创。",
        canonBasis: "仅借用系列森林、溪流、栖息地与共同生活的主题，不宣称对应某片官方森林。",
        gameAdaptation: "作为出生点和主线终点，支持嘿咻寻路、御金移动测风片、短距转送与非致命安抚。",
        sourceIds: ["ORIGINAL_SIDE_STORY", "A06-003", "A16-002"],
        boundaries: ["不得把原创异常称为小黑领域恢复、风息遗留意志或官方新空间规则。"]
      },
      longyouGuild: {
        id: "longyou-guild",
        name: "龙游会馆",
        origin: "canon_place_game_layout",
        canonStatus: "原作地点；游戏建筑、房间与常驻原创NPC为改编",
        description: "龙游地方会馆，兼具居所、协调、救援和对外交涉功能；游戏设置登记处、休息区与资料桌。",
        canonBasis: "潘靖为龙游会馆馆长；会馆中生活着与人类共存的妖精。卡里则是灵溪会馆馆长，不能混用。",
        gameAdaptation: "原创见习记录员小满提供任务记录，潘靖负责安全提示；不画未经证实的完整机构层级。",
        sourceIds: ["A16-002", "A06-011", "A08-015", "A15-004", "A15-005", "ORIGINAL_SIDE_STORY"],
        boundaries: ["不补写会馆数量、完整法律权力、晋级流程或统一结界规则。"]
      },
      cityCorner: {
        id: "city-corner",
        name: "城市街角",
        origin: "game_original_composite",
        canonStatus: "原创组合街区，不对应官方唯一地图",
        description: "由巷道、修理铺、饮品店、列车与街灯组成的生活区域，强调普通人善意和妖精进入现代空间的日常尺度。",
        canonBasis: "电影的城市巷道、列车赠果和城市绿荫提供氛围依据，但具体店铺与人物为本作原创。",
        gameAdaptation: "回收散落金属、询问路人、绘制地图；御金只作用于明确标出的金属物件。",
        sourceIds: ["A06-004", "A06-010", "A06-017", "ORIGINAL_SIDE_STORY"],
        boundaries: ["不把某个路人、店铺或事件写成原作未公开角色与官方地点。"]
      },
      lidaoCoast: {
        id: "lidao-coast",
        name: "离岛海岸",
        origin: "canon_place_game_layout",
        canonStatus: "原作离岛主题的游戏改编海岸；地理与当前居住状态不预设",
        description: "以远离人烟的岛、森林、溪流和海岸为视觉基础，保留庇护与归属主题。",
        canonBasis: "官方故事页确认风息带小黑到远离人烟的岛；具体海岸线、道路和房屋布局未由资料给出。",
        gameAdaptation: "采集潮间带叶片、阅读原创往昔片段、寻找测风片；不设置现世风息NPC。",
        sourceIds: ["A16-002", "A16-011", "A12-008", "ORIGINAL_SIDE_STORY"],
        boundaries: ["不宣称风息或离岛伙伴在电影后的确切命运与居住状态。", "往昔片段不等于复活、重逢或官方后日谈。"]
      },
      lanxiTown: {
        id: "lanxi-town",
        name: "蓝溪镇",
        origin: "canon_place_game_layout",
        canonStatus: "原作灵域与庇护社区；游戏街巷、时段和原创镇民为改编",
        description: "老君的灵域，兼具居所、知识存放、行医、修行与自由去留的社区意义。",
        canonBasis: "官方分集页确认灵域归属；《蓝溪镇》公开连载与书简介确认战争年代、老君玄离清凝及庇护所功能。",
        gameAdaptation: "设置书房、药架、庭院和渡口，允许查阅原创记录；旧史片段必须标明时代，不与当代混场。",
        sourceIds: ["A16-004", "A17-001", "A17-012", "A17-013", "A17-017", "A03-012", "ORIGINAL_SIDE_STORY"],
        boundaries: ["不把灵域、灵质空间、领域画成已确认的统一层级。", "不替旧史指定公元年份或精确时间间隔。"]
      }
    },

    terms: {
      lingAndSpirits: {
        id: "ling-and-spirits",
        name: "灵与妖精",
        confirmed: ["官方角色页把小黑定义为由灵诞生的黑猫妖精，续作进一步写自然之灵聚集诞生。", "小黑不是单纯会说话的猫，还具有人形、金属性与空间系。"],
        unknown: ["不能由小黑的诞生方式概括所有妖精完整起源、寿命或分类规则。"],
        sourceIds: ["A16-001", "A08-005"],
        gameRule: "以具体角色资料为准，不使用一套种族模板推导所有NPC能力。"
      },
      lingzhiPower: {
        id: "lingzhi-power",
        name: "灵质力",
        confirmed: ["TV第13集由阿根向小白解释能力分类，御灵、生灵、造物、空间、心灵、锁御构成六系框架。", "同一角色可以拥有不止一种能力，能力也可影响身体构成。"],
        unknown: ["完整子项、修炼门槛、能力上限与相生相克没有公开统一表。", "二手角色条目中的“强化系”等称呼不擅自另建第七系或替换六系。"],
        sourceIds: ["A03-013", "A16-009", "A16-012"],
        gameRule: "战斗数值和冷却属于原创平衡，不冒充官方修炼体系。"
      },
      sixSystems: {
        id: "six-systems",
        name: "六系",
        confirmed: ["本资料可核对的六项为御灵、生灵、造物、空间、心灵、锁御；第13集是剧情内讲解入口。", "御灵与空间等分类可由官方角色资料逐项交叉验证。"],
        unknown: ["A16-009是UP主ACG中二君的体系化整理，不是官方六系规则图。", "不能据二创总表断定所有角色归类、子项和强弱。"],
        sourceIds: ["A03-013", "A16-009", "A16-010", "A08-005"],
        gameRule: "图鉴可展示六系名称，但不提供官方战力排行。"
      },
      fiveElements: {
        id: "five-elements",
        name: "御灵五行与“无五系总表”",
        confirmed: ["A03-013整理御灵系为控制物质灵，可再分金、木、水、火、土等分支。", "小黑与无限为金，风息与洛竹为木，虚淮为冰；具体角色须逐项核对。"],
        unknown: ["手账没有确认一套与六系并列的“五系总体系”。", "“等”不是封闭穷举；冰等细分归属、克制关系及修炼路径不自行补齐。"],
        sourceIds: ["A03-013", "A16-010", "A16-011", "A16-012", "A12-009"],
        gameRule: "五行只作御灵分支提示，不设计官方克制环，不将“六系”误写为“五系”。"
      },
      spiritSpace: {
        id: "spirit-space",
        name: "灵质空间",
        confirmed: ["导演专访解释其默认纯白，放入无限的小房子、老君的蓝溪镇等内容后才呈现相应景物。", "空间内容与拥有者存在可见联系，也能承担居所、收纳或收押等剧情功能。"],
        unknown: ["没有所有空间统一尺寸、边界、消耗、建造方式或层级。", "衍生品与单张画面不能反推完整机制。"],
        sourceIds: ["A01-009", "A11-020", "A16-004"],
        gameRule: "可借用留白与主人景物关联做视觉，不制作通用空间尺寸或无限仓库规则。"
      },
      spiritRealm: {
        id: "spirit-realm",
        name: "灵域",
        confirmed: ["日本官方分集页把蓝溪镇称作老君的灵域；无限续作能力说明也使用灵域相关表述。"],
        unknown: ["灵域、灵质空间、领域没有公开完整层级定义，不无条件互称或画上下位。"],
        sourceIds: ["A16-004", "A08-006"],
        gameRule: "蓝溪镇按有主人、有边界的居所表现；不把它直接改名为领域。"
      },
      domain: {
        id: "domain",
        name: "领域",
        confirmed: ["小黑具有领域相关能力；电影剧情可确认风息以豪夺夺取小黑领域。", "“空间主人在自身灵质空间内取得规则与控制优势”属于公开解析常用解释，不是官方完整定义。"],
        unknown: ["统一半径、持续时间、消耗和发动条件未明确。", "领域被夺不等于全部空间能力消失；电影后是否恢复没有官方定论。"],
        sourceIds: ["A16-005", "A16-006", "A16-007"],
        gameRule: "主线禁止以任务、道具、台词或结局宣布领域恢复；原创回声苔不得包装成新领域。"
      },
      dualSpaces: {
        id: "dual-spaces",
        name: "双灵质空间",
        confirmed: ["A16-005所引百科摘要与署名考据把领域、传送对应的双灵质空间并列讨论，可作为资料线索。"],
        unknown: ["该条目本身为二创考据，完整机制不是官方定论。", "不能以“还能传送”证明领域已恢复，也不能把玄离的双空间机制套给小黑。"],
        sourceIds: ["A16-005", "A14-006"],
        gameRule: "只保留转送玩法，不在UI宣称双空间机制已被本作解答。"
      },
      transfer: {
        id: "transfer",
        name: "空间系·转送",
        confirmed: ["2025续作官方角色页明确小黑具有御灵系·金与空间系·转送。"],
        unknown: ["统一传送距离、锚点要求、冷却和消耗未由该页给出。"],
        sourceIds: ["A08-005"],
        gameRule: "玩家短距传送是原创玩法实现，落点需碰撞检测；数值不宣称官方。"
      },
      devour: {
        id: "devour",
        name: "空间系·己界（吞噬）",
        confirmed: ["续作官方角色页明确无限具有己界（吞噬），能把周围物体迅速纳入自己的灵域。"],
        unknown: ["被吞物去向、上限和全部限制未明确；吞噬不等于转送或领域。"],
        sourceIds: ["A08-006", "A16-008"],
        gameRule: "小黑不能使用此能力；如无限作为NPC提及，也不补写官方未说明的去向。"
      },
      metal: {
        id: "metal",
        name: "御灵系·金",
        confirmed: ["小黑与无限都具有金属性，说明人类也可拥有该灵属性；金属可形成武器、束缚或防御等表现。"],
        unknown: ["同系不代表招式、强度与修炼路径完全一致，具体上限未明确。"],
        sourceIds: ["A16-010", "A16-001", "A08-005", "A08-006"],
        gameRule: "仅操纵带金属标记的游戏物件，不控制比丢、植物、灵体或所有物品。"
      },
      wood: {
        id: "wood",
        name: "御灵系·木",
        confirmed: ["官方角色页确认风息操纵植物、灵属性为木；洛竹设定稿也列木系。"],
        unknown: ["不能据同属性推定两人招式、身体构成和强度相同。"],
        sourceIds: ["A16-011", "A12-009"],
        gameRule: "可用于藤蔓、种子与森林反馈；回声苔是原创生物，不反推所有木系规则。"
      },
      ice: {
        id: "ice",
        name: "御灵系·冰",
        confirmed: ["虚淮官方资料明确冰能力、冰构成身体、自我修复与精灵鱼；阿根也有御水成冰的表现。"],
        unknown: ["虚淮早期木系草案不是最终设定；阿根与玄离关系不能靠同能力简单证明。", "自我修复的上限未公开。"],
        sourceIds: ["A16-012", "A12-014", "A02-006", "A14-007"],
        gameRule: "冰可用于提示、路径与视觉区分，不设置无限回血。"
      },
      seize: {
        id: "seize",
        name: "生灵系·豪夺",
        confirmed: ["风息的设定稿与百科资料列豪夺；电影中用于夺取小黑领域。"],
        unknown: ["发动条件、持续时间、能否归还及全部限制没有公开完整说明。"],
        sourceIds: ["A12-002", "A15-007", "A16-007"],
        gameRule: "不作为玩家技能，不用原创道具实现“夺取／归还领域”的结局。"
      },
      heixiuTerm: {
        id: "heixiu",
        name: "嘿咻／黑咻",
        confirmed: ["续作官方角色页确认小黑尾巴可分裂为多个名为黑咻的生命体。", "剧集表现其独立意识、机灵行为、搜索和协作。"],
        unknown: ["固定数量、最大距离和全部形变规则未明确；二创统计不是官方数值。"],
        sourceIds: ["A08-005", "A02-003", "A02-004", "A10-016", "A10-017"],
        gameRule: "可作为协作伙伴，关卡生成数量只代表原创关卡编排。"
      },
      guild: {
        id: "guild",
        name: "妖灵会馆",
        confirmed: ["官方故事资料确认会馆中生活着与人类共存的妖精，并提供住所、帮助与秩序。", "总馆长、地方馆长、执行人等职务显示组织协调功能；潘靖是龙游馆长，卡里是灵溪馆长。"],
        unknown: ["不能把会馆只当一座建筑，也不能补写完整等级、地域数量、法律权力或入会流程。"],
        sourceIds: ["A16-002", "A06-011", "A08-010", "A08-015", "A15-004", "A15-005"],
        gameRule: "龙游区只呈现登记、休息、救援协调与原创记录桌，不生成官方组织总章。"
      },
      executor: {
        id: "executor",
        name: "执行者",
        confirmed: ["无限是人类执行者，哪吒、若水、鸠老等妖精也承担执行者职责。", "小黑在成为执行者前有取得“妖王佛岚的赞赏”的最后一项任务。"],
        unknown: ["没有完整晋级等级、全部考核或统一任务流程；取得赞赏不能推广为所有执行者唯一认证方式。"],
        sourceIds: ["A16-010", "A16-015", "A16-016"],
        gameRule: "本作原创委托不等于官方执行者考核，不颁发正式职级。"
      },
      blueJadeDisk: {
        id: "blue-jade-disk",
        name: "蓝玉盘",
        confirmed: ["老君的空间定点传送法宝，一只送给小白并特别调为一个月可使用一次，可通往老君的灵质空间。"],
        unknown: ["该间隔是特定赠予情境，不能推广为所有空间法宝或小黑转送的统一冷却。"],
        sourceIds: ["A03-012", "A14-002"],
        gameRule: "作为图鉴与世界观物件，不替代玩家转送按键，不提供无限传送。"
      },
      oathBook: {
        id: "oath-book",
        name: "誓言录与老君的约束",
        confirmed: ["TV蓝溪镇段落以誓言录任务推动闯入、驱逐与报酬；老君受自身誓言约束，委托阿根和小黑处理。"],
        unknown: ["誓言完整条文、所有任务、期限与例外未公开，不能为了关卡随意创造官方条款。"],
        sourceIds: ["A03-011", "A14-004"],
        gameRule: "原创委托不写成誓言录官方新条目，只称本作支线记录。"
      },
      allBeingsGate: {
        id: "all-beings-gate",
        name: "众生之门",
        confirmed: ["官方分集页说明小黑与人类朋友共同执行任务并登录游戏。", "小白逐渐能在游戏中发出火焰，现实中也开始出现能够使用能力的人。"],
        unknown: ["选择玩家、能力现实化与运营原理未集中解释，不能写成完全无关的番外或已破解机制。"],
        sourceIds: ["A16-018", "A16-019"],
        gameRule: "本游戏不是众生之门官方版本，不借用其名义解释原创系统。"
      },
      heavenPearl: {
        id: "heaven-pearl",
        name: "天明珠",
        confirmed: ["小黑盗取天明珠、谛听追回与多方争夺连接了老君、会馆及其他妖精，是系列开端的叙事启动器。"],
        unknown: ["全部功效、限制与最终归属未集中说明，不采用“包治百病”等未经官方证据确认的概括。"],
        sourceIds: ["A02-001", "A16-017"],
        gameRule: "不作为恢复领域或复活角色的万能任务道具。"
      }
    },

    questText: {
      id: "yexi-echoes",
      title: "叶隙回响",
      label: "非官方原创支线",
      original: true,
      disclaimer: "以下主线、支线、回声苔、测风片、叶音篱、原创人物及全部台词均为本游戏原创，不是原作引文或官方后日谈；不改动原作事件，不宣布领域恢复，不续写风息命运。",
      timeline: "采用不锚定具体电影或TV集数的独立支线时间框。往昔内容单独标注，不表示电影后角色状态；不同篇章造型只作图鉴资料，不强行排成官方总年表。",
      mainQuest: {
        id: "yexi-echoes-main",
        title: "叶隙回响",
        premise: "叶隙森林的原创植物“回声苔”会把沿叶脉留下的声音重新播放。散落的金属测风片被风雨移动后，与苔面形成异常共鸣，使声音在错误地点出现。叶片靠风和水传播，异常不是空间裂缝，更不是领域恢复。",
        canonSafety: [
          "解决方案只涉及移开金属、保护苔面与恢复栖息地，不夺取或恢复任何领域。",
          "风息不作为现世角色出现；可选往昔文字只是独立创作的情境片段，不解释其后续命运。",
          "会馆、蓝溪镇与离岛提供调查场景，不发表官方新章程、新空间层级或新能力体系。",
          "高潮采用非致命的环境安抚，不设置必须击败原作角色的战斗。"
        ],
        stages: [
          {
            id: "opening",
            kind: "beginning",
            title: "叶声不在叶上",
            objective: { title: "查看异常叶片", detail: "在叶隙森林与青禾会合，听一段从空叶传来的声音。", progress: 0, current: 0, total: 1, target: "叶隙森林·青禾" },
            dialogue: [
              { speaker: "青禾", id: "qinghe", text: "你听见了吗？声音在这片叶子上，说话的人却在溪对面。别急着撕，它还会疼。" },
              { speaker: "罗小黑", id: "xiaohei", text: "嘿咻，你去那边。我留在这里听，看看声音是不是会跟着金属走。" },
              { speaker: "无限", id: "wuxian", text: "先确认现象，再决定怎么做。别把它当成你熟悉的那种空间。" }
            ]
          },
          {
            id: "investigation-forest",
            kind: "investigation",
            title: "调查一·跟着金属声走",
            objective: { title: "收集回声样本", detail: "找到三枚带金属粉的叶片，让嘿咻标记对应的测风片。", progress: 0, current: 0, total: 3, target: "叶隙森林·回声叶片" },
            dialogue: [
              { speaker: "阿根", id: "agen", text: "叶脉没有空间断口，金属粉倒是排得很整齐。先记录，别急着给它起个大会员级别的名字。" },
              { speaker: "嘿咻", id: "heixiu", text: "嘿咻！" },
              { speaker: "罗小黑", id: "xiaohei", text: "找到了。声音不是从远处穿过来，是被这些小铁片带偏了。" }
            ]
          },
          {
            id: "investigation-city-guild",
            kind: "investigation",
            title: "调查二·修理铺与会馆记录",
            objective: { title: "核对测风片来源", detail: "在城市找回两枚散落零件，再到龙游会馆比对小满的巡护记录。", progress: 0, current: 0, total: 2, target: "城市街角·石叔／龙游会馆·小满" },
            dialogue: [
              { speaker: "石叔", id: "shishu", text: "这些铁片是我替巡护队做的测风片，不是法器。前阵子箱扣坏了，少了几枚，我正找呢。" },
              { speaker: "小满", id: "xiaoman", text: "记录里只有风向和维修日期，没有“领域异变”这一项。新出现的问题先按现有记录查，别给它乱盖章。" },
              { speaker: "潘靖", id: "panjing", text: "把受惊的森林居民列入疏散提示。先清出安全路，再调查，不用扩大结界。" }
            ]
          },
          {
            id: "investigation-island-lanxi",
            kind: "investigation",
            title: "调查三·潮声与旧镇的经验",
            objective: { title: "确认声音传播方式", detail: "在离岛海岸观察潮水搬运叶片，再到蓝溪镇查阅植物照料记录。", progress: 0, current: 0, total: 2, target: "离岛海岸·阿汀／蓝溪镇·老君" },
            dialogue: [
              { speaker: "阿汀", id: "ating", text: "潮水把叶子送进湾里，声音当然也从湾里出来。不是海在叫人，是叶子搭了船。" },
              { speaker: "老君", id: "laojun", text: "不是领域，也不是谁回来传话。苔怕铁锈，给它一条干净的排水沟，比念一百句咒有用。" },
              { speaker: "罗小黑", id: "xiaohei", text: "那就把铁片收好，再把苔留下。不是把会响的东西都拔掉。" }
            ]
          },
          {
            id: "climax",
            kind: "climax",
            title: "高潮·暴雨里的同声",
            objective: { title: "重新安置测风片", detail: "在暴雨中把三枚测风片移到石架，保持回声苔区域无金属，并引导受惊的小生灵离开。", progress: 0, current: 0, total: 3, target: "叶隙森林·三座石架" },
            dialogue: [
              { speaker: "无限", id: "wuxian", text: "转送先看落点。叶片下面还有生命，别把速度当成唯一答案。" },
              { speaker: "罗小黑", id: "xiaohei", text: "我抬铁片，嘿咻带大家走。最后一枚……就放在没有苔的石头上面！" },
              { speaker: "青禾", id: "qinghe", text: "水沟通了，声音正在回到自己的地方。再坚持一下，不需要伤害它。" }
            ]
          },
          {
            id: "ending",
            kind: "ending",
            title: "结局·叶隙仍有回响",
            objective: { title: "完成叶音篱", detail: "与伙伴装好木质叶音篱，听回声苔恢复自然播放，再向青禾复命。", progress: 0, current: 0, total: 1, target: "叶隙森林·叶音篱" },
            dialogue: [
              { speaker: "罗小白", id: "xiaobai", text: "这次声音和地图对上了！小黑，你听，叶子记得的是刚才那条回家的路。" },
              { speaker: "青禾", id: "qinghe", text: "测风片留在石架上，苔也留在这里。以后听见陌生的声音，我们会先学会听，再决定要不要碰。" },
              { speaker: "无限", id: "wuxian", text: "任务完成了。你没有改变谁的空间，只是让一片森林重新能住。" }
            ]
          }
        ]
      },
      originalNPCs: [
        {
          id: "qinghe",
          name: "青禾",
          role: "叶隙森林巡护者",
          origin: "game_original",
          appearance: "苔绿短斗篷、叶片形记录夹，原创程序化形象。",
          personality: "细致、护林，着急时说话会变快。",
          dialogue: ["测风片能拆，苔不能铲。先帮我守住那条水沟。", "你是第一次来？那就从一片叶子开始认路，森林不靠门牌。"],
          sourceIds: ["ORIGINAL_SIDE_STORY"]
        },
        {
          id: "xiaoman",
          name: "小满",
          role: "龙游会馆见习记录员",
          origin: "game_original",
          appearance: "抱着特大号记录夹的原创妖精，不设定具体物种与官方职务等级。",
          personality: "认真、怕写错，遇到未确认事项会专门留白。",
          dialogue: ["未确认的地方我会写“未确认”，空着也比编一个完整答案好。", "潘靖馆长管龙游，卡里馆长在灵溪。登记错地方，我才真的要重写十遍。"],
          sourceIds: ["ORIGINAL_SIDE_STORY", "A08-015", "A15-005"]
        },
        {
          id: "shishu",
          name: "石叔",
          role: "城市街角修理铺店主",
          origin: "game_original",
          appearance: "围裙、螺丝盒和旧木柜台，原创人类角色。",
          personality: "爽利、爱惜旧物，不把普通零件说成法器。",
          dialogue: ["铁片能用就用，别看见会响就喊法宝。螺丝也有螺丝的脾气。", "这枚扣子弹不起来了。你用御金托一下，我来拧，别把整个柜台掀走。"],
          sourceIds: ["ORIGINAL_SIDE_STORY"]
        },
        {
          id: "ating",
          name: "阿汀",
          role: "离岛海岸拾贝者",
          origin: "game_original",
          appearance: "靛青头巾、贝壳袋，原创角色，不指认官方离岛居民谱系。",
          personality: "安静、熟悉潮汐，说话常借海作比。",
          dialogue: ["涨潮时别只盯着远处，脚边的叶子也会告诉你水往哪走。", "海图没画全的地方，就别装成每条水沟都认得。留些空白，反倒可靠。"],
          sourceIds: ["ORIGINAL_SIDE_STORY"]
        },
        {
          id: "xiaoshu",
          name: "小菽",
          role: "蓝溪镇晒药镇民",
          origin: "game_original",
          appearance: "浅青围裙、竹筛与药草篮，原创角色，不指认具体漫画时代。",
          personality: "温和、务实，喜欢把复杂问题先变成能做完的小事。",
          dialogue: ["药筛要翻面，苔面也要透气。你先帮我扶住这只竹架。", "镇里留下的规矩是愿意留下就把这里当家；想走的人，也该认得出去的路。"],
          sourceIds: ["ORIGINAL_SIDE_STORY", "A17-012", "A17-013"]
        }
      ],
      dialogues: {
        xiaohei: [
          { context: "原创支线·探索", text: "叶子在响。嘿咻，先别跑，我们去看看。" },
          { context: "原创支线·能力提示", text: "传送能到那边，但落点有没有东西，还是得自己看过。" }
        ],
        wuxian: [
          { context: "原创支线·训练", text: "别只顾着快。先听清叶隙的回声，再决定落点。" },
          { context: "原创支线·任务", text: "金属是工具，不是答案。把人和小生灵都带回来。" }
        ],
        xiaobai: [
          { context: "原创支线·地图", text: "哇，叶子也会传话吗？等等，我先给它画张地图！" },
          { context: "原创支线·休息", text: "累了就回来吃饭。任务要是会跑，那我们一起追。" }
        ],
        agen: [
          { context: "原创支线·调查", text: "先别碰那枚碎片。规则没弄明白前，好奇也得排在记录后面。" },
          { context: "原创支线·提示", text: "我只说资料里有的，剩下的……你可以问，但别逼我现场编。" }
        ],
        fengxi: [
          { context: "原创往昔片段·非现世登场", text: "岛外的路未必只有一条。你若要走，就记住为什么出发。" },
          { context: "原创往昔片段·不续写命运", text: "先让小家伙吃饱。其他的话，等它愿意听的时候再说。" }
        ],
        luozhu: [
          { context: "原创支线·友好交流", text: "别紧张，我先听你说。风要是把路藏起来了，我们就一起找。" },
          { context: "原创支线·森林", text: "这棵苗先放这里。你看，不用谁命令，它也在努力长。" }
        ],
        xuhuai: [
          { context: "原创支线·调查", text: "冰会留下水走过的痕迹。碎片给我，别碰裂口。" },
          { context: "原创支线·短提示", text: "慢一点。来得及。" }
        ],
        tianhu: [
          { context: "原创支线·分享", text: "嗯。肉，分你。" },
          { context: "原创支线·护送", text: "慢点。我，陪你。" }
        ],
        bidiu: [
          { context: "原创支线·安全喂食", text: "比丢！比丢——" },
          { context: "原创支线·禁止喂金属", text: "比、比丢？！" }
        ],
        heixiu: [
          { context: "原创支线·发现目标", text: "嘿咻！" },
          { context: "原创支线·催促", text: "嘿咻、嘿咻！" }
        ],
        laojun: [
          { context: "原创支线·蓝溪镇", text: "蓝玉盘有间隔，串门可没有。坐吧，茶凉之前，把发现说来听听。" },
          { context: "原创支线·规则边界", text: "不是领域。别把会发光、会出声的东西都推给空间，我这茶还冒热气呢，难道也算？" }
        ],
        shanxin: [
          { context: "原创支线·路线", text: "这条路线不合理。跟我走，先卡住刷新点——别问，经验。" },
          { context: "原创支线·队伍", text: "你们负责搬，我负责看地图。分工明确，胜率比较高。" }
        ],
        luye: [
          { context: "原创支线·追踪", text: "痕迹不会自己开口。你查叶片背面，我查前面的路。" },
          { context: "原创支线·分工", text: "别追错。真的测风片有锈，假的只有亮。" }
        ],
        xuanli: [
          { context: "原创旧史片段·蓝溪镇", text: "饭先吃好，路再找。饿着肚子可听不清别人说什么。" },
          { context: "原创旧史片段·身份边界", text: "别忙着替我决定我是谁。你先说说，你看见的是哪一段？" }
        ],
        qingning: [
          { context: "原创旧史片段·行医", text: "伤口要先清理，害怕也一样，得有人听你说完。坐吧。" },
          { context: "原创旧史片段·照料", text: "药架第三格是干净的苔布。轻轻垫着，别折伤叶尖。" }
        ],
        diting: [
          { context: "原创支线·声音线索", text: "不是风声。东南边的空罐在滚。你去，我守着。" },
          { context: "原创支线·休息", text: "听见了。不用喊第二遍……给鹰犬留的那份也别动。" }
        ],
        kali: [
          { context: "原创支线·灵溪彩蛋", text: "来会馆先说要帮谁，再谈谁比较强。顺序别反了。" },
          { context: "原创支线·木系展示", text: "种子发芽不赶时间。你也一样，先把路看清。" }
        ],
        panjing: [
          { context: "原创支线·龙游安全", text: "疏散路线照旧。新出现的叶隙只列调查对象，不列为已确认空间。" },
          { context: "原创支线·会馆", text: "记录和救援都先做实的。名词，等核实以后再补。" }
        ]
      },
      sideQuests: [
        {
          id: "side-bidiu-safe-snack",
          label: "原创支线",
          original: true,
          title: "比丢的安全点心",
          giver: "罗小白",
          objective: "收集三份干燥木屑，交回食盆；明确不拾取金属、动物制品或来历不明的灵体。",
          completion: "比丢开心变色，小白把禁忌写在食盆旁。颜色仅为原创视觉反馈，不新增设定。",
          canonSafety: "不复制误食灵体暴走，不奖励喂金属。"
        },
        {
          id: "side-heixiu-hide-seek",
          label: "原创支线",
          original: true,
          title: "嘿咻躲进叶隙",
          giver: "罗小黑",
          objective: "按叫声寻找三只藏起的嘿咻；三只为本关编排，不是官方数量上限。",
          completion: "嘿咻在地图上留下爪印提示，解锁一条便于回头的林间小路。",
          canonSafety: "不宣称嘿咻只能分裂三只。"
        },
        {
          id: "side-xiaobai-map",
          label: "原创支线",
          original: true,
          title: "小白的叶脉地图",
          giver: "罗小白",
          objective: "在三处地标做叶脉拓片，标出真实道路与回声位置的区别。",
          completion: "获得手绘区域图，图边写着“未确认的地方先留白”。",
          canonSafety: "地图为原创街区和路线，不冒充官方地图。"
        },
        {
          id: "side-shishu-recycle",
          label: "原创支线",
          original: true,
          title: "石叔的零件回收",
          giver: "石叔",
          objective: "用御金回收四枚带蓝色标记的废零件，避开比丢食盆和植物根系。",
          completion: "修理铺修好测风片收纳箱，城市不再继续漏出同源零件。",
          canonSafety: "只操纵明确金属物件，不扩大御金范围。"
        },
        {
          id: "side-lanxi-herbs",
          label: "原创支线",
          original: true,
          title: "小菽的晒药架",
          giver: "小菽",
          objective: "扶正两座竹制药架，将湿苔布移到通风处。",
          completion: "蓝溪镇获得一处休息点，可查看原创植物照料便签。",
          canonSafety: "不新增灵丹、官方医术或治愈领域的效果。"
        }
      ],
      zoneLines: {
        "叶隙森林": ["先听，再碰。回声苔只是原创植物，不是空间异常的证明。", "蓝色金属标记可御金；木质区域请绕行。"],
        "龙游会馆": ["登记、救援、查记录，按这个顺序来。", "未确认的项目可以留白，不必替它编完整。"],
        "城市街角": ["修理铺收蓝色金属零件，比丢食盆附近禁止使用能力。", "路人的善意很小，也值得记住。"],
        "离岛海岸": ["潮水会搬运叶片，海岸布局为原创。", "往昔片段不表示电影后角色状态。"],
        "蓝溪镇": ["书房查规则，药架学照料，别把不同年代混成一幕。", "灵域、灵质空间与领域仍按各自来源阅读。"]
      }
    },

    sources: {
      HANDBOOK: {
        title: "《罗小黑｜森林设定手账》用户提供HTML",
        level: "非官方公开资料整理手账",
        url: null,
        credit: "用户提供附件；不是《罗小黑战记》大电影官方设定集",
        note: "本数据以TEMP/research/source-text.txt和source-index.json回查；官方、转载、百科、评论考据和二创分级保留。"
      },
      ORIGINAL_SIDE_STORY: {
        title: "《罗小黑：叶隙回响》原创支线",
        level: "游戏原创",
        url: null,
        credit: "本游戏原创，不是官方资料或原作引文",
        note: "用于叶隙森林、原创人物、现象、道具、任务与台词；不得反向当作官方证据。"
      },
      "A01-009": { title: "电影前传定位与灵质空间专访", level: "媒体专访", url: "https://www.thepaper.cn/newsDetail_forward_4395830", credit: "澎湃新闻／导演木头专访" },
      "A29-005": { title: "前传而非平行剧场版", level: "媒体专访", url: "https://www.jiemian.com/article/3493997.html", credit: "界面新闻／导演木头专访" },
      "A02-001": { title: "第1集《喵》：盗珠、受伤与雨夜收养", level: "官方剧集页／手账引用", url: "https://www.bilibili.com/bangumi/play/ep32374", credit: "寒木春华／哔哩哔哩番剧", note: "手账关系图和分集导读引用；原A02-001图片档案未收入目录，不作独立图片条目冒充。" },
      "A02-003": { title: "第3话《嘿》：嘿咻、小皇与山新的日常", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep32372", credit: "寒木春华／哔哩哔哩番剧" },
      "A02-004": { title: "第4话《飘》：黑咻游玩与城市跑酷", level: "官方资料与署名细节整理", url: "https://www.bilibili.com/bangumi/play/ep32371", credit: "寒木春华／哔哩哔哩番剧；困_2580细节文章" },
      "A02-006": { title: "第6话《阿根》：乡村亲属线与冰系", level: "官方剧集页与角色资料", url: "https://www.bilibili.com/bangumi/play/ep32369", credit: "寒木春华／哔哩哔哩番剧" },
      "A02-007": { title: "第7话《比丢》：变色团鼠与饲养规则", level: "官方剧集页与角色资料", url: "https://www.bilibili.com/bangumi/play/ep32368", credit: "寒木春华／哔哩哔哩番剧" },
      "A02-015": { title: "第3话冰箱剧照：嘿咻离开后封回保鲜膜", level: "同人二创细节整理", url: "https://www.bilibili.com/read/cv3403735/", credit: "困_2580；原作寒木春华" },
      "A03-005": { title: "灵风山：黑咻搜索与阿根的木系灵石承诺", level: "官方剧集资料与手账整理", url: "https://www.bilibili.com/bangumi/play/ep32359", credit: "寒木春华／哔哩哔哩番剧" },
      "A03-011": { title: "誓言录如何驱动蓝溪镇冲突", level: "资料整理", url: "https://zh.moegirl.org.cn/File:LXHZJ11.png", credit: "MTJJ／萌娘百科共享资源；第11集官方页交叉核对" },
      "A03-012": { title: "蓝玉盘与第12集的空间传送", level: "资料整理", url: "https://zh.moegirl.org.cn/File:LXHZJ12.png", credit: "MTJJ／萌娘百科共享资源；第12集官方页交叉核对" },
      "A03-013": { title: "灵质力六系与御灵系分支", level: "资料整理", url: "https://zh.moegirl.org.cn/File:LXHZJ13.png", credit: "MTJJ／萌娘百科共享资源；第13集官方页交叉核对" },
      "A06-003": { title: "森林水边：巨岩下的小黑", level: "官方素材转载", url: "https://www.1905.com/newgallery/hdpic/1383954.shtml", credit: "片方公开物料／1905电影网" },
      "A06-004": { title: "城市流浪：巷道里的陌生世界", level: "官方素材转载", url: "https://www.1905.com/newgallery/hdpic/1383954.shtml", credit: "片方公开物料／1905电影网" },
      "A06-005": { title: "风息的接纳：花海中的同类温情", level: "官方素材转载", url: "https://www.1905.com/newgallery/hdpic/1383954.shtml", credit: "片方公开物料／1905电影网" },
      "A06-006": { title: "无限介入：从强制同行开始", level: "官方素材转载", url: "https://www.1905.com/newgallery/hdpic/1383954.shtml", credit: "片方公开物料／1905电影网" },
      "A06-009": { title: "竹林持竹：师徒并排练习", level: "官方素材转载", url: "https://www.1905.com/newgallery/hdpic/1383954.shtml", credit: "片方公开物料／1905电影网" },
      "A06-010": { title: "列车赠果：普通人的善意证据", level: "媒体评论与片方剧照", url: "https://www.thepaper.cn/newsDetail_forward_4393229", credit: "重木／澎湃新闻；片方剧照" },
      "A06-011": { title: "妖灵会馆：共存秩序的目的地", level: "官方素材转载", url: "http://fun.youth.cn/gnzx/201909/t20190918_12071396.htm", credit: "片方公开物料／网易娱乐／中国青年网" },
      "A06-012": { title: "怀中守护：师徒信任的身体语言", level: "官方素材转载", url: "http://fun.youth.cn/gnzx/201909/t20190918_12071396.htm", credit: "片方公开物料／网易娱乐／中国青年网" },
      "A06-014": { title: "蓝天下的哪吒与白发小黑", level: "官方素材转载", url: "https://www.1905.com/newgallery/hdpic/1383954.shtml", credit: "片方公开物料／1905电影网" },
      "A06-017": { title: "城市绿荫：小黑坐在无限头顶", level: "官方素材转载", url: "https://www.1905.com/newgallery/hdpic/1383954.shtml", credit: "片方公开物料／1905电影网" },
      "A06-018": { title: "师徒海报：从被迫同行到主动跟随", level: "官方素材转载", url: "https://www.1905.com/newgallery/hdpic/1383952.shtml", credit: "片方公开物料／1905电影网" },
      "A08-002": { title: "两年后的村庄日常与会馆遇袭", level: "官方资料", url: "https://luoxiaohei-movie.com/2nd/#story", credit: "北京寒木春华／日本电影官方网站" },
      "A08-003": { title: "新任务造成师徒分离与无限处境转变", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep2243434", credit: "北京寒木春华／哔哩哔哩电影页" },
      "A08-004": { title: "小黑与鹿野组队寻找真相", level: "官方资料", url: "https://luoxiaohei-movie.com/2nd/movie/", credit: "北京寒木春华／日本电影官方网站" },
      "A08-005": { title: "小黑：两种形态与双系能力", level: "官方资料", url: "https://luoxiaohei-movie.com/2nd/character/#01", credit: "北京寒木春华／日本电影官方网站" },
      "A08-006": { title: "无限：人类执行人与空间己界", level: "官方资料", url: "https://luoxiaohei-movie.com/2nd/character/#02", credit: "北京寒木春华／日本电影官方网站" },
      "A08-007": { title: "鹿野：无限弟子与生灵系追毫", level: "官方资料", url: "https://luoxiaohei-movie.com/2nd/character/#03", credit: "北京寒木春华／日本电影官方网站" },
      "A08-008": { title: "鹿野的冷静外壳与表演层次", level: "官方公开访谈", url: "https://luoxiaohei-movie.com/2nd/report/", credit: "日本电影官方网站／公开纪念舞台问候" },
      "A08-010": { title: "雨笛：总馆长与组织位阶", level: "官方资料", url: "https://luoxiaohei-movie.com/2nd/character/#05", credit: "北京寒木春华／日本电影官方网站" },
      "A08-015": { title: "潘靖：龙游会馆与人类交涉", level: "官方资料", url: "https://luoxiaohei-movie.com/2nd/character/#10", credit: "北京寒木春华／日本电影官方网站" },
      "A10-001": { title: "家庭场景中的基础猫形", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep32374", credit: "寒木春华／MTJJ／哔哩哔哩公开封面" },
      "A10-007": { title: "先导海报中的早期黑发人形", level: "百科收录官方海报", url: "https://mzh.moegirl.org.cn/%E7%BD%97%E5%B0%8F%E9%BB%91", credit: "MTJJ／寒木春华；萌娘百科收录" },
      "A10-008": { title: "黑发人形的猫耳与斜肩布衣", level: "官方资料", url: "https://www.youtube.com/watch?v=wkmD3lLIjq4", credit: "MTJJ动画官方YouTube频道" },
      "A10-009": { title: "黑发人形的蜷坐姿态与旅途服装", level: "官方资料", url: "https://www.youtube.com/watch?v=Yf9r32qxOYQ", credit: "MTJJ动画官方YouTube频道" },
      "A10-010": { title: "白发战斗形态与情绪爆发", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep407878", credit: "寒木春华／MTJJ／第39集公开封面" },
      "A10-011": { title: "白发形态下的师徒安抚", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep407879", credit: "寒木春华／MTJJ／第40集公开封面" },
      "A10-012": { title: "求学日常中的白发群体造型", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep6762150", credit: "寒木春华／MTJJ／第41集公开封面" },
      "A10-013": { title: "众生之门的黑发冒险服装", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep407615", credit: "寒木春华／MTJJ／第38集公开封面" },
      "A10-014": { title: "第二部海报的金系圆环与战斗服", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep2243434", credit: "寒木春华／MTJJ／电影2公开海报" },
      "A10-016": { title: "嘿咻与猫形的体量对照", level: "同人二创封面", url: "https://www.bilibili.com/video/BV1CG4y1A7sZ/", credit: "XT-墨尘；画面原作寒木春华" },
      "A10-017": { title: "多只嘿咻的并列与协作表现", level: "同人二创封面", url: "https://www.bilibili.com/video/BV1wVUoBDEXu/", credit: "YZ影视屋；画面原作寒木春华" },
      "A11-001": { title: "冷面与长发：2019战斗特辑的无限", level: "官方资料", url: "https://www.bilibili.com/video/BV1hJ411K7hg", credit: "罗小黑战记官方账号／寒木春华" },
      "A11-003": { title: "无限束发近景与官方剪辑", level: "官方资料", url: "https://www.bilibili.com/video/BV1f44y1Q7Ck", credit: "哔哩哔哩放映员／寒木春华" },
      "A11-004": { title: "竹林并肩：师徒关系的日常化", level: "官方资料", url: "https://www.bilibili.com/video/BV1f8411W7uP", credit: "哔哩哔哩放映员／寒木春华" },
      "A11-012": { title: "鹿野与小黑的师门关系", level: "官方资料", url: "https://www.bilibili.com/video/BV1uTsHzsE99", credit: "哔哩哔哩放映员／寒木春华" },
      "A11-017": { title: "无限灰青角色海报与色卡", level: "官方素材转载", url: "https://www.bilibili.com/video/BV1kt3EzKEpm", credit: "幽湳浔转载／寒木春华海报" },
      "A11-018": { title: "无限棕色便装与群像动作", level: "官方资料", url: "https://www.bilibili.com/video/BV1jshpzWEt9", credit: "罗小黑战记官方账号／寒木春华" },
      "A11-020": { title: "无限的家：灵质空间的积木转译", level: "官方衍生品", url: "https://www.bilibili.com/video/BV1Ns2gY8Eks", credit: "奇妙积木KEEPPLEY" },
      "A12-001": { title: "风息角色档案：紫发人形与黑豹身份", level: "百科整理", url: "https://bkso.baidu.com/item/%E9%A3%8E%E6%81%AF/23748484?fromModule=lemma_inlink", credit: "百度百科" },
      "A12-002": { title: "风息人形设定表与木系、豪夺", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-003": { title: "风息早期兽形草图", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-004": { title: "风息黑豹本体：长鬃与紫色眼睛", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-005": { title: "风息与小黑：暖灯下的亲近宣传画", level: "百科整理", url: "https://bkso.baidu.com/item/%E9%A3%8E%E6%81%AF/23748484?fromModule=lemma_inlink", credit: "百度百科" },
      "A12-006": { title: "风息木系能力与终局大战分镜", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-007": { title: "风息扶助虚淮：同伴关系", level: "百科整理", url: "https://bkso.baidu.com/item/%E9%A3%8E%E6%81%AF/23748484?fromModule=lemma_inlink", credit: "百度百科" },
      "A12-008": { title: "离岛四人组歇息概念稿", level: "百科整理", url: "https://bkso.baidu.com/item/%E9%A3%8E%E6%81%AF/23748484?fromModule=lemma_inlink", credit: "百度百科" },
      "A12-009": { title: "洛竹人形设定表：红腰巾与木系", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-010": { title: "洛竹在森林中穿行", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-011": { title: "洛竹的行动场面与沟通意愿", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-012": { title: "虚淮人形设定表：青蓝服饰与冰系", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-013": { title: "虚淮夜林静立：冷色与克制表演", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-014": { title: "早期概念稿：虚淮木系方案与洛竹亲近小黑", level: "早期官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx", note: "仅作创作过程证据，不替代最终冰系设定。" },
      "A12-015": { title: "天虎设定表：斗笠、虎纹与火系", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-016": { title: "天虎夜街画面与少台词设计", level: "官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A12-017": { title: "风息背影与天虎照料小黑的早期概念", level: "早期官方素材转载与专栏整理", url: "https://www.bilibili.com/read/cv3584470/", credit: "动画酱Ani-Jam／Rubyx" },
      "A13-002": { title: "阿根：圆眼镜与乡村少年外形", level: "百科整理", url: "https://zh.moegirl.org.cn/%E9%98%BF%E6%A0%B9", credit: "萌娘百科" },
      "A13-003": { title: "山新：橙色长发、少表情与游戏高手", level: "百科整理", url: "https://zh.moegirl.org.cn/%E5%B1%B1%E6%96%B0(%E7%BD%97%E5%B0%8F%E9%BB%91%E6%88%98%E8%AE%B0)", credit: "萌娘百科" },
      "A13-005": { title: "比丢与森林群落：团鼠设定", level: "百科整理与署名图", url: "https://zh.moegirl.org.cn/%E6%AF%94%E4%B8%A2", credit: "木头（MTJJ）／萌娘百科" },
      "A13-009": { title: "阿根与木柴堆：乡村劳动里的能力话题", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep113903", credit: "寒木春华／哔哩哔哩国创" },
      "A13-011": { title: "山新的漫展装扮", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep86841", credit: "寒木春华／哔哩哔哩国创" },
      "A13-012": { title: "漫展途中的停坐：小白、小黑与谛听", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep90655", credit: "寒木春华／哔哩哔哩国创" },
      "A13-013": { title: "山新的格斗游戏胜利", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep95650", credit: "寒木春华／哔哩哔哩国创" },
      "A13-014": { title: "屋顶夜谈：小白对白发人形小黑的接纳", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep281875", credit: "寒木春华／哔哩哔哩国创" },
      "A13-016": { title: "游戏初始状态：兄妹共同阅读界面", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep400672", credit: "寒木春华／哔哩哔哩国创" },
      "A13-017": { title: "寸步难行四人组：失败中的团队互补", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep400673", credit: "寒木春华／哔哩哔哩国创" },
      "A13-018": { title: "山新的电话与瞬移式喜剧设定", level: "官方资料与角色整理", url: "https://www.bilibili.com/bangumi/play/ep402350", credit: "寒木春华／哔哩哔哩国创" },
      "A13-019": { title: "四人共读地图：共同理解规则", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep405184", credit: "寒木春华／哔哩哔哩国创" },
      "A13-020": { title: "小白选择火系：升级线保留直率性格", level: "官方资料", url: "https://www.bilibili.com/bangumi/play/ep403489", credit: "寒木春华／哔哩哔哩国创" },
      "A14-002": { title: "老君：节能形态、蓝玉盘与神仙反差", level: "百科整理", url: "https://baike.so.com/doc/5701751-24860098.html", credit: "360百科／动画画面" },
      "A14-004": { title: "老君的誓言、百年闭关与ACG日常", level: "二创封面与360百科整理", url: "https://www.bilibili.com/video/BV1xe4y1P7Ge/", credit: "想养只大大大金毛／原作寒木春华" },
      "A14-006": { title: "玄离：尖耳紫瞳与冰火双灵质空间", level: "百科整理", url: "https://bkso.baidu.com/item/%E8%93%9D%E6%BA%AA%E9%95%87/23752996", credit: "MTJJ、孙呱原作／百度百科" },
      "A14-007": { title: "玄离与阿根：共存谜团和现代限制", level: "百科整理", url: "https://baike.so.com/doc/24237771-32369348.html", credit: "360百科" },
      "A14-009": { title: "玄离与清凝：饭桌与旅途默契", level: "二创封面与资料整理", url: "https://www.bilibili.com/video/BV1ac411R7vZ/", credit: "Sunsnowaa／MTJJ、孙呱原作" },
      "A14-010": { title: "谛听：绿色人形、额前圆纹与炎系", level: "二创封面与360百科整理", url: "https://www.bilibili.com/video/BV1PM4y127xF/", credit: "航天太空信／原作寒木春华" },
      "A14-012": { title: "谛听与三匹鹰犬：侦察搭档的照料日常", level: "二创封面与360百科整理", url: "https://www.bilibili.com/video/BV1Zf4y1h7na/", credit: "凌冰丶／原作寒木春华" },
      "A14-014": { title: "李清凝：从学医少女到蓝溪镇医师", level: "百科整理", url: "https://bkso.baidu.com/item/%E6%9D%8E%E6%B8%85%E5%87%9D/23814708", credit: "MTJJ、孙呱原作／百度百科" },
      "A14-015": { title: "清凝北域转折与治愈能力边界", level: "二创封面与百科整理", url: "https://www.bilibili.com/video/BV19z421a7p9/", credit: "长画精品剧场／MTJJ、孙呱原作" },
      "A15-004": { title: "潘靖：龙游会馆馆长", level: "百科整理", url: "https://zh.moegirl.org.cn/%E6%BD%98%E9%9D%96", credit: "萌娘百科／官方动画截图" },
      "A15-005": { title: "卡里：灵溪会馆馆长", level: "百科整理", url: "https://zh.moegirl.org.cn/%E5%8D%A1%E9%87%8C", credit: "萌娘百科／官方动画截图" },
      "A15-007": { title: "风息：离岛同伴的领导者与电影结局整理", level: "百科整理", url: "https://zh.moegirl.org.cn/%E9%A3%8E%E6%81%AF", credit: "萌娘百科／官方电影截图", note: "条目记载自裁并化为巨树；不得延伸为复活、意识尚存或其他后续命运。" },
      "A15-011": { title: "鹿野：无限弟子与感知组组长", level: "百科整理与官方设定稿", url: "https://zh.moegirl.org.cn/%E9%B9%BF%E9%87%8E", credit: "罗小黑官方设定稿／萌娘百科" },
      "A15-014": { title: "谛听：从天明珠追捕者到老君助手", level: "百科整理", url: "https://zh.moegirl.org.cn/%E8%B0%9B%E5%90%AC%28%E7%BD%97%E5%B0%8F%E9%BB%91%E6%88%98%E8%AE%B0%29", credit: "MTJJ、孙呱／萌娘百科" },
      "A16-001": { title: "妖精：由灵诞生的小黑与双重属性", level: "官方资料", url: "https://luoxiaohei-movie.com/1st/character/?page=chara01", credit: "北京寒木春华／首部电影日本官方网站" },
      "A16-002": { title: "人类与妖精：栖息地丧失及共存道路", level: "官方资料", url: "https://luoxiaohei-movie.com/1st/", credit: "北京寒木春华／首部电影日本官方网站" },
      "A16-004": { title: "蓝溪镇：有主人、有边界的灵域", level: "官方资料", url: "https://luoxiaohei-movie.com/tv/episode/?id=4", credit: "北京寒木春华／日本TV官方网站" },
      "A16-005": { title: "双灵质空间：领域与传送，以及未决恢复问题", level: "二创考据", url: "https://www.bilibili.com/video/BV1pwtnzSEaB", credit: "哔哩哔哩UP主秋野浚良", note: "只作考据入口，领域恢复不是官方定论。" },
      "A16-006": { title: "领域：把战斗转入空间主人的规则", level: "二创解析", url: "https://www.bilibili.com/video/BV11b4y1f7rS", credit: "画面寒木春华；UP主自主决定到家" },
      "A16-007": { title: "豪夺与领域易主：风息对小黑能力的剥夺", level: "二创标题与电影情节交叉整理", url: "https://www.bilibili.com/video/BV1xMXTYKE1s", credit: "哔哩哔哩UP主木木说漫lbl" },
      "A16-008": { title: "吞噬：无限的空间系能力与环形视觉", level: "二创解析与官方资料交叉整理", url: "https://www.bilibili.com/video/BV1FP411C7Me", credit: "哔哩哔哩UP主两毛一个" },
      "A16-009": { title: "六大能力体系：有署名的分类导览", level: "二创体系整理", url: "https://www.bilibili.com/video/BV1gg41157Hj", credit: "ACG中二君；封面画师史比邦-DBT" },
      "A16-010": { title: "御灵系金：小黑与无限共享的属性语言", level: "官方资料", url: "https://luoxiaohei-movie.com/1st/character/?page=chara02", credit: "北京寒木春华／首部电影日本官方网站" },
      "A16-011": { title: "御灵系木：风息的植物操控与森林庇护", level: "官方资料", url: "https://luoxiaohei-movie.com/1st/character/?page=chara03", credit: "北京寒木春华／首部电影日本官方网站" },
      "A16-012": { title: "御灵系冰：虚淮的元素身体与自我修复", level: "官方资料", url: "https://luoxiaohei-movie.com/1st/character/?page=chara04", credit: "北京寒木春华／首部电影日本官方网站" },
      "A16-015": { title: "执行者构成：人类、妖精与总本部派遣", level: "官方资料", url: "https://luoxiaohei-movie.com/1st/character/?page=chara08", credit: "北京寒木春华／首部电影日本官方网站" },
      "A16-016": { title: "执行者最终任务：取得妖王佛岚的赞赏", level: "官方资料", url: "https://luoxiaohei-movie.com/tv/episode/?id=11", credit: "北京寒木春华／日本TV官方网站" },
      "A16-017": { title: "天明珠：连接盗取、追回与多方争夺", level: "官方资料", url: "https://luoxiaohei-movie.com/tv/episode/?id=3", credit: "北京寒木春华／日本TV官方网站" },
      "A16-018": { title: "众生之门：朋友共同任务与游戏入口", level: "官方资料", url: "https://luoxiaohei-movie.com/tv/episode/?id=10", credit: "北京寒木春华／日本TV官方网站" },
      "A16-019": { title: "游戏与现实：灵能力开始外溢", level: "官方资料", url: "https://luoxiaohei-movie.com/tv/episode/?id=12", credit: "北京寒木春华／日本TV官方网站" },
      "A17-001": { title: "老君与《蓝溪镇》官方连载定位", level: "官方资料", url: "https://manga.bilibili.com/m/detail/mc26551", credit: "MTJJ、孙呱／哔哩哔哩漫画" },
      "A17-003": { title: "星空下的清凝与君清玄三人同行", level: "官方资料", url: "https://manga.bilibili.com/m/detail/mc26551", credit: "MTJJ、孙呱／哔哩哔哩漫画" },
      "A17-004": { title: "玄离与前传的轻喜剧表达", level: "官方资料", url: "https://manga.bilibili.com/m/detail/mc26551", credit: "MTJJ、孙呱／哔哩哔哩漫画" },
      "A17-005": { title: "清凝向前、老君殿后的旅途", level: "官方资料", url: "https://manga.bilibili.com/m/detail/mc26551", credit: "MTJJ、孙呱／哔哩哔哩漫画" },
      "A17-012": { title: "《蓝溪镇》庇护所与自由去留的书简介引用", level: "出版物公开简介／手账引用", url: null, credit: "手账术语导读与关系文字版引用", note: "source-index未找到该ID独立链接；定位source-text.txt第555、597行及卷十三导言，正式使用应回查原书简介。" },
      "A17-013": { title: "《蓝溪镇》第二册：修行、行医与去留", level: "出版物公开简介／手账引用", url: null, credit: "手账关系文字版引用", note: "source-index未找到该ID独立链接；定位source-text.txt第648、652行及卷十三导言。" },
      "A17-016": { title: "《蓝溪镇》第五册：老君爱徒关系", level: "出版物公开简介／手账引用", url: null, credit: "手账关系文字版引用", note: "source-index未找到该ID独立链接；定位source-text.txt第648行。" },
      "A17-017": { title: "《蓝溪镇》完结篇与时间跳跃边界", level: "出版物公开简介／手账引用", url: null, credit: "手账时间线与卷十三导言引用", note: "source-index未找到该ID独立链接；定位source-text.txt第189、5563行，不补写精确间隔。" }
    }
  };
}());
