(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.DiceRules = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  /* ============================================================
   * D&D 5e
   * ============================================================ */

  var ABILITY_KEYS = ["FOR", "DES", "CON", "INT", "SAB", "CAR"];

  var ABILITY_NAMES = {
    FOR: { pt: "Força", en: "Strength" },
    DES: { pt: "Destreza", en: "Dexterity" },
    CON: { pt: "Constituição", en: "Constitution" },
    INT: { pt: "Inteligência", en: "Intelligence" },
    SAB: { pt: "Sabedoria", en: "Wisdom" },
    CAR: { pt: "Carisma", en: "Charisma" }
  };

  var STANDARD_ARRAY = [15, 14, 13, 12, 10, 8];

  // Official 5e point-buy cost table (8-15, 27 points).
  var POINT_BUY_COST = { 8: 0, 9: 1, 10: 2, 11: 3, 12: 4, 13: 5, 14: 7, 15: 9 };
  var POINT_BUY_TOTAL = 27;

  // skill field -> governing ability (mirrors js/mapper.js DND_SKILLS)
  var DND_SKILL_ABILITIES = {
    Acrobatics: "DES", Arcana: "INT", Athletics: "FOR", Performance: "CAR",
    Deception: "CAR", Stealth: "DES", History: "INT", Intimidation: "CAR",
    Insight: "SAB", Investigation: "INT", Animal: "SAB", Medicine: "SAB",
    Nature: "INT", Perception: "SAB", Persuasion: "CAR", SleightofHand: "DES",
    Religion: "INT", Survival: "SAB"
  };

  var DND_SKILL_FIELDS = Object.keys(DND_SKILL_ABILITIES);

  // 12 PHB classes: hit die, saving-throw proficiencies, skill choices, spellcasting ability.
  var DND_CLASSES = [
    { key: "barbarian", pt: "Bárbaro", en: "Barbarian", hitDie: 12, saves: ["FOR", "CON"], skillCount: 2, spell: null,
      skills: ["Animal", "Athletics", "Intimidation", "Nature", "Perception", "Survival"] },
    { key: "bard", pt: "Bardo", en: "Bard", hitDie: 8, saves: ["DES", "CAR"], skillCount: 3, spell: "CAR",
      skills: DND_SKILL_FIELDS },
    { key: "cleric", pt: "Clérigo", en: "Cleric", hitDie: 8, saves: ["SAB", "CAR"], skillCount: 2, spell: "SAB",
      skills: ["History", "Insight", "Medicine", "Persuasion", "Religion"] },
    { key: "druid", pt: "Druida", en: "Druid", hitDie: 8, saves: ["INT", "SAB"], skillCount: 2, spell: "SAB",
      skills: ["Arcana", "Animal", "Insight", "Medicine", "Nature", "Perception", "Religion", "Survival"] },
    { key: "fighter", pt: "Guerreiro", en: "Fighter", hitDie: 10, saves: ["FOR", "CON"], skillCount: 2, spell: null,
      skills: ["Acrobatics", "Animal", "Athletics", "History", "Insight", "Intimidation", "Perception", "Survival"] },
    { key: "monk", pt: "Monge", en: "Monk", hitDie: 8, saves: ["FOR", "DES"], skillCount: 2, spell: null,
      skills: ["Acrobatics", "Athletics", "History", "Insight", "Religion", "Stealth"] },
    { key: "paladin", pt: "Paladino", en: "Paladin", hitDie: 10, saves: ["SAB", "CAR"], skillCount: 2, spell: "CAR",
      skills: ["Athletics", "Insight", "Intimidation", "Medicine", "Persuasion", "Religion"] },
    { key: "ranger", pt: "Patrulheiro", en: "Ranger", hitDie: 10, saves: ["FOR", "DES"], skillCount: 3, spell: "SAB",
      skills: ["Animal", "Athletics", "Insight", "Investigation", "Nature", "Perception", "Stealth", "Survival"] },
    { key: "rogue", pt: "Ladino", en: "Rogue", hitDie: 8, saves: ["DES", "INT"], skillCount: 4, spell: null,
      skills: ["Acrobatics", "Athletics", "Deception", "Insight", "Intimidation", "Investigation", "Perception", "Performance", "Persuasion", "SleightofHand", "Stealth"] },
    { key: "sorcerer", pt: "Feiticeiro", en: "Sorcerer", hitDie: 6, saves: ["CON", "CAR"], skillCount: 2, spell: "CAR",
      skills: ["Arcana", "Deception", "Insight", "Intimidation", "Persuasion", "Religion"] },
    { key: "warlock", pt: "Bruxo", en: "Warlock", hitDie: 8, saves: ["SAB", "CAR"], skillCount: 2, spell: "CAR",
      skills: ["Arcana", "Deception", "History", "Intimidation", "Investigation", "Nature", "Religion"] },
    { key: "wizard", pt: "Mago", en: "Wizard", hitDie: 6, saves: ["INT", "SAB"], skillCount: 2, spell: "INT",
      skills: ["Arcana", "History", "Insight", "Investigation", "Medicine", "Religion"] }
  ];

  function abilityMod(score) {
    if (score === null || score === undefined || score === "") return 0;
    var n = parseInt(score, 10);
    if (isNaN(n)) return 0;
    return Math.floor((n - 10) / 2);
  }

  function profBonus(level) {
    var lv = Math.max(1, Math.min(20, parseInt(level, 10) || 1));
    return 2 + Math.floor((lv - 1) / 4);
  }

  function pointBuyCost(score) {
    return POINT_BUY_COST[score] === undefined ? null : POINT_BUY_COST[score];
  }

  function pointBuySpent(scores) {
    var total = 0;
    ABILITY_KEYS.forEach(function (k) {
      var c = pointBuyCost(scores[k]);
      if (c !== null) total += c;
    });
    return total;
  }

  function classByKey(key) {
    return DND_CLASSES.filter(function (c) { return c.key === key; })[0] || null;
  }

  function classifyArray(scores) {
    // Returns true when the six scores are exactly the standard array multiset.
    var want = STANDARD_ARRAY.slice().sort(function (a, b) { return a - b; }).join(",");
    var got = ABILITY_KEYS.map(function (k) { return Number(scores[k]); })
      .sort(function (a, b) { return a - b; }).join(",");
    return want === got;
  }

  function dndDerived(cfg) {
    cfg = cfg || {};
    var level = Math.max(1, Math.min(20, parseInt(cfg.level, 10) || 1));
    var scores = cfg.scores || {};
    var classDef = classByKey(cfg.classKey);
    var mods = {};
    ABILITY_KEYS.forEach(function (k) { mods[k] = abilityMod(scores[k]); });

    var pb = profBonus(level);
    var hitDie = cfg.hitDie || (classDef ? classDef.hitDie : 8);
    var conMod = mods.CON;

    var saveProfs = cfg.saveProfs || (classDef ? classDef.saves : []);
    var saveBonus = {};
    ABILITY_KEYS.forEach(function (k) {
      saveBonus[k] = mods[k] + (saveProfs.indexOf(k) >= 0 ? pb : 0);
    });

    var skillProfs = cfg.skillProfs || [];
    var skillBonus = {};
    DND_SKILL_FIELDS.forEach(function (f) {
      var ab = DND_SKILL_ABILITIES[f];
      skillBonus[f] = mods[ab] + (skillProfs.indexOf(f) >= 0 ? pb : 0);
    });

    var hpMax;
    if (cfg.hpOverride !== null && cfg.hpOverride !== undefined && cfg.hpOverride !== "") {
      hpMax = parseInt(cfg.hpOverride, 10);
    } else {
      var perLevel = Math.floor(hitDie / 2) + 1 + conMod;
      hpMax = (hitDie + conMod) + (level - 1) * perLevel;
    }
    if (hpMax < 1) hpMax = 1;

    var ac;
    if (cfg.acOverride !== null && cfg.acOverride !== undefined && cfg.acOverride !== "") {
      ac = parseInt(cfg.acOverride, 10);
    } else {
      ac = 10 + mods.DES;
    }

    var perceProf = skillProfs.indexOf("Perception") >= 0;
    var passive = 10 + mods.SAB + (perceProf ? pb : 0);

    var spell = null;
    if (classDef && classDef.spell) {
      var smod = mods[classDef.spell];
      spell = {
        "class": classDef.en,
        ability: classDef.spell,
        saveDC: 8 + pb + smod,
        atkBonus: pb + smod,
        slots: [],
        spells: []
      };
    }

    return {
      level: level,
      mods: mods,
      profBonus: pb,
      saveProfs: saveProfs,
      saveBonus: saveBonus,
      skillProfs: skillProfs,
      skillBonus: skillBonus,
      initiative: mods.DES,
      passive: passive,
      hpMax: hpMax,
      ac: ac,
      speed: cfg.speed === undefined || cfg.speed === null || cfg.speed === "" ? 30 : cfg.speed,
      hitDice: level + "d" + hitDie,
      hitDie: hitDie,
      spell: spell
    };
  }

  /* ---------------- dice helpers ---------------- */

  function d(rng, sides) { return Math.floor((rng || Math.random)() * sides) + 1; }

  function roll4d6DropLowest(rng) {
    var rolls = [d(rng, 6), d(rng, 6), d(rng, 6), d(rng, 6)];
    rolls.sort(function (a, b) { return a - b; });
    return rolls[1] + rolls[2] + rolls[3];
  }

  function roll3d6x5(rng) { return (d(rng, 6) + d(rng, 6) + d(rng, 6)) * 5; }

  function roll2d6p6x5(rng) { return (d(rng, 6) + d(rng, 6) + 6) * 5; }

  /* ============================================================
   * Call of Cthulhu 7e
   * ============================================================ */

  var COC_CHAR_KEYS = ["str", "con", "siz", "dex", "app", "int", "pow", "edu"];
  // STR/CON/DEX/APP/POW = 3D6x5 ; SIZ/INT/EDU = (2D6+6)x5
  var COC_CHAR_FORMULA = {
    str: "3d6", con: "3d6", dex: "3d6", app: "3d6", pow: "3d6",
    siz: "2d6p6", int: "2d6p6", edu: "2d6p6"
  };

  function rollCocCharacteristic(key, rng) {
    return COC_CHAR_FORMULA[key] === "2d6p6" ? roll2d6p6x5(rng) : roll3d6x5(rng);
  }

  function cocMove(str, dex, siz) {
    str = Number(str) || 0; dex = Number(dex) || 0; siz = Number(siz) || 0;
    if (dex < siz && str < siz) return 7;
    if (dex > siz && str > siz) return 9;
    return 8;
  }

  function cocBuildDB(str, siz) {
    var s = (Number(str) || 0) + (Number(siz) || 0);
    if (s <= 64) return { build: -2, damageBonus: "-2" };
    if (s <= 84) return { build: -1, damageBonus: "-1" };
    if (s <= 124) return { build: 0, damageBonus: "0" };
    if (s <= 164) return { build: 1, damageBonus: "+1D4" };
    if (s <= 204) return { build: 2, damageBonus: "+1D6" };
    if (s <= 284) return { build: 3, damageBonus: "+2D6" };
    if (s <= 364) return { build: 4, damageBonus: "+3D6" };
    if (s <= 444) return { build: 5, damageBonus: "+4D6" };
    var extra = Math.floor((s - 365) / 80);
    return { build: 5 + extra, damageBonus: "+" + (4 + extra) + "D6" };
  }

  function cocDerived(chars) {
    chars = chars || {};
    var half = {}, fifth = {};
    COC_CHAR_KEYS.forEach(function (k) {
      var v = chars[k] === null || chars[k] === undefined ? null : parseInt(chars[k], 10);
      if (isNaN(v)) v = null;
      half[k] = v === null ? null : Math.floor(v / 2);
      fifth[k] = v === null ? null : Math.floor(v / 5);
    });
    var con = Number(chars.con) || 0, siz = Number(chars.siz) || 0, pow = Number(chars.pow) || 0;
    var str = Number(chars.str) || 0, dex = Number(chars.dex) || 0;
    var buildDb = cocBuildDB(str, siz);
    return {
      half: half,
      fifth: fifth,
      hpMax: Math.floor((con + siz) / 10),
      mpMax: Math.floor(pow / 5),
      move: cocMove(str, dex, siz),
      build: buildDb.build,
      damageBonus: buildDb.damageBonus,
      sanity: pow,
      sanityMax: 99
    };
  }

  // 22 core 7e occupations. `points` describes the occupational skill-point pool:
  // terms = fixed ability multipliers; pick = "EDU x2 + (X x2 or Y x2)" choice.
  var COC_OCCUPATIONS = [
    { key: "antiquarian", pt: "Antiquário", en: "Antiquarian", credit: [30, 70],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["appraise", "art_craft_1", "history", "library_use", "language_other_1", "spot_hidden", "charm", "fast_talk", "intimidate", "persuade"] },
    { key: "artist", pt: "Artista", en: "Artist", credit: [9, 50],
      points: { terms: [{ key: "edu", mul: 2 }], pick: { keys: ["dex", "pow"], mul: 2 } },
      skills: ["art_craft_1", "art_craft_2", "history", "persuade", "psychology", "charm", "spot_hidden", "natural_world"] },
    { key: "author", pt: "Escritor", en: "Author", credit: [9, 30],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["art_craft_1", "history", "library_use", "natural_world", "occult", "language_other_1", "language_own", "psychology"] },
    { key: "clergyman", pt: "Clérigo", en: "Clergyman", credit: [9, 60],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["accounting", "history", "library_use", "listen", "charm", "fast_talk", "persuade", "psychology"] },
    { key: "criminal", pt: "Criminoso", en: "Criminal", credit: [5, 65],
      points: { terms: [{ key: "edu", mul: 2 }], pick: { keys: ["dex", "str"], mul: 2 } },
      skills: ["disguise", "fighting_brawl", "firearms_handgun", "locksmith", "sleight_of_hand", "stealth", "fast_talk", "spot_hidden"] },
    { key: "dilettante", pt: "Diletante", en: "Dilettante", credit: [50, 99],
      points: { terms: [{ key: "app", mul: 2 }, { key: "edu", mul: 2 }] },
      skills: ["art_craft_1", "firearms_handgun", "language_other_1", "ride", "charm", "fast_talk", "intimidate", "persuade"] },
    { key: "doctor_of_medicine", pt: "Médico", en: "Doctor of Medicine", credit: [30, 80],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["first_aid", "language_other_1", "medicine", "psychology", "science_1", "science_2", "psychoanalysis", "persuade"] },
    { key: "drifter", pt: "Andarilho", en: "Drifter", credit: [0, 5],
      points: { terms: [{ key: "edu", mul: 2 }], pick: { keys: ["app", "dex", "str"], mul: 2 } },
      skills: ["climb", "jump", "listen", "navigate", "stealth", "spot_hidden", "swim", "survival"] },
    { key: "engineer", pt: "Engenheiro", en: "Engineer", credit: [30, 60],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["art_craft_1", "electrical_repair", "library_use", "mechanical_repair", "science_1", "science_2", "spot_hidden", "climb"] },
    { key: "entertainer", pt: "Artista de Palco", en: "Entertainer", credit: [9, 70],
      points: { terms: [{ key: "app", mul: 2 }, { key: "edu", mul: 2 }] },
      skills: ["art_craft_1", "disguise", "psychology", "listen", "charm", "fast_talk", "sleight_of_hand", "intimidate"] },
    { key: "journalist", pt: "Jornalista", en: "Journalist", credit: [9, 30],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["art_craft_1", "history", "library_use", "language_own", "psychology", "charm", "fast_talk", "persuade"] },
    { key: "lawyer", pt: "Advogado", en: "Lawyer", credit: [30, 80],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["accounting", "law", "library_use", "persuade", "fast_talk", "intimidate", "psychology", "history"] },
    { key: "librarian", pt: "Bibliotecário", en: "Librarian", credit: [9, 35],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["accounting", "language_other_1", "library_use", "occult", "history", "listen", "spot_hidden", "science_1"] },
    { key: "occultist", pt: "Ocultista", en: "Occultist", credit: [9, 65],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["anthropology", "history", "library_use", "occult", "psychology", "appraise", "language_other_1", "spot_hidden"] },
    { key: "officer", pt: "Policial", en: "Police Officer", credit: [9, 30],
      points: { terms: [{ key: "edu", mul: 2 }], pick: { keys: ["dex", "str"], mul: 2 } },
      skills: ["firearms_handgun", "first_aid", "law", "persuade", "fighting_brawl", "intimidate", "drive_auto", "spot_hidden"] },
    { key: "parapsychologist", pt: "Parapsicólogo", en: "Parapsychologist", credit: [9, 30],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["anthropology", "history", "library_use", "occult", "psychology", "art_craft_1", "science_1", "spot_hidden"] },
    { key: "photographer", pt: "Fotógrafo", en: "Photographer", credit: [9, 30],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["art_craft_1", "persuade", "psychology", "science_1", "spot_hidden", "stealth", "fast_talk", "listen"] },
    { key: "private_investigator", pt: "Detetive Particular", en: "Private Investigator", credit: [9, 30],
      points: { terms: [{ key: "edu", mul: 2 }], pick: { keys: ["dex", "str"], mul: 2 } },
      skills: ["art_craft_1", "disguise", "law", "library_use", "psychology", "spot_hidden", "persuade", "locksmith"] },
    { key: "professor", pt: "Professor", en: "Professor", credit: [20, 70],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["language_other_1", "library_use", "language_own", "psychology", "history", "science_1", "occult", "anthropology"] },
    { key: "psychiatrist", pt: "Psiquiatra", en: "Psychiatrist", credit: [30, 80],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["language_other_1", "medicine", "persuade", "psychoanalysis", "psychology", "first_aid", "science_1", "listen"] },
    { key: "scientist", pt: "Cientista", en: "Scientist", credit: [9, 50],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["language_other_1", "library_use", "spot_hidden", "science_1", "science_2", "art_craft_1", "medicine", "anthropology"] },
    { key: "student", pt: "Estudante", en: "Student", credit: [5, 10],
      points: { terms: [{ key: "edu", mul: 4 }] },
      skills: ["language_other_1", "library_use", "listen", "persuade", "science_1", "history", "occult", "spot_hidden"] }
  ];

  function cocOccupationByKey(key) {
    return COC_OCCUPATIONS.filter(function (o) { return o.key === key; })[0] || null;
  }

  function cocOccupationPoints(occ, chars, secondAbility) {
    if (!occ) return 0;
    chars = chars || {};
    var pts = occ.points || { terms: [{ key: "edu", mul: 4 }] };
    var total = 0;
    (pts.terms || []).forEach(function (tm) {
      total += (Number(chars[tm.key]) || 0) * tm.mul;
    });
    if (pts.pick && pts.pick.keys && pts.pick.keys.length) {
      var key = secondAbility && pts.pick.keys.indexOf(secondAbility) >= 0 ? secondAbility : pts.pick.keys[0];
      total += (Number(chars[key]) || 0) * (pts.pick.mul || 2);
    }
    return total;
  }

  return {
    // D&D
    ABILITY_KEYS: ABILITY_KEYS,
    ABILITY_NAMES: ABILITY_NAMES,
    STANDARD_ARRAY: STANDARD_ARRAY,
    POINT_BUY_TOTAL: POINT_BUY_TOTAL,
    DND_SKILL_ABILITIES: DND_SKILL_ABILITIES,
    DND_SKILL_FIELDS: DND_SKILL_FIELDS,
    DND_CLASSES: DND_CLASSES,
    abilityMod: abilityMod,
    profBonus: profBonus,
    pointBuyCost: pointBuyCost,
    pointBuySpent: pointBuySpent,
    classByKey: classByKey,
    classifyArray: classifyArray,
    dndDerived: dndDerived,
    // dice
    roll4d6DropLowest: roll4d6DropLowest,
    roll3d6x5: roll3d6x5,
    roll2d6p6x5: roll2d6p6x5,
    // CoC
    COC_CHAR_KEYS: COC_CHAR_KEYS,
    COC_CHAR_FORMULA: COC_CHAR_FORMULA,
    COC_OCCUPATIONS: COC_OCCUPATIONS,
    rollCocCharacteristic: rollCocCharacteristic,
    cocMove: cocMove,
    cocBuildDB: cocBuildDB,
    cocDerived: cocDerived,
    cocOccupationByKey: cocOccupationByKey,
    cocOccupationPoints: cocOccupationPoints
  };
});
