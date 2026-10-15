(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.SheetMapper = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function str(v) {
    if (v === null || v === undefined) return "";
    return String(v).trim();
  }

  function intOrNull(v) {
    var s = str(v);
    if (!s) return null;
    var m = s.match(/-?\d+/);
    if (!m) return null;
    var n = parseInt(m[0], 10);
    return isNaN(n) ? null : n;
  }

  function num(v, fallback) {
    var n = intOrNull(v);
    return n === null ? fallback : n;
  }

  function isChecked(v) {
    var s = str(v).toLowerCase();
    return s === "yes" || s === "on" || s === "true" || s === "1" || s === "/yes";
  }

  function normalizeRaw(raw) {
    var out = {};
    if (!raw) return out;
    Object.keys(raw).forEach(function (k) {
      out[str(k)] = raw[k];
    });
    return out;
  }

  var DND_ABILITIES = [
    { key: "FOR", scoreField: "STR", modField: "STRmod", name: "Força", abbr: "FOR" },
    { key: "DES", scoreField: "DEX", modField: "DEXmod", name: "Destreza", abbr: "DES" },
    { key: "CON", scoreField: "CON", modField: "CONmod", name: "Constituição", abbr: "CON" },
    { key: "INT", scoreField: "INT", modField: "INTmod", name: "Inteligência", abbr: "INT" },
    { key: "SAB", scoreField: "WIS", modField: "WISmod", name: "Sabedoria", abbr: "SAB" },
    { key: "CAR", scoreField: "CHA", modField: "CHamod", name: "Carisma", abbr: "CAR" }
  ];

  var DND_SAVES = [
    { field: "ST Strength", name: "Força", ability: "FOR" },
    { field: "ST Dexterity", name: "Destreza", ability: "DES" },
    { field: "ST Constitution", name: "Constituição", ability: "CON" },
    { field: "ST Intelligence", name: "Inteligência", ability: "INT" },
    { field: "ST Wisdom", name: "Sabedoria", ability: "SAB" },
    { field: "ST Charisma", name: "Carisma", ability: "CAR" }
  ];

  var DND_SKILLS = [
    { field: "Acrobatics", name: "Acrobacia", ability: "DES" },
    { field: "Arcana", name: "Arcanismo", ability: "INT" },
    { field: "Athletics", name: "Atletismo", ability: "FOR" },
    { field: "Performance", name: "Atuação", ability: "CAR" },
    { field: "Deception", name: "Blefar", ability: "CAR" },
    { field: "Stealth", name: "Furtividade", ability: "DES" },
    { field: "History", name: "História", ability: "INT" },
    { field: "Intimidation", name: "Intimidação", ability: "CAR" },
    { field: "Insight", name: "Intuição", ability: "SAB" },
    { field: "Investigation", name: "Investigação", ability: "INT" },
    { field: "Animal", name: "Lidar com Animais", ability: "SAB" },
    { field: "Medicine", name: "Medicina", ability: "SAB" },
    { field: "Nature", name: "Natureza", ability: "INT" },
    { field: "Perception", name: "Percepção", ability: "SAB" },
    { field: "Persuasion", name: "Persuasão", ability: "CAR" },
    { field: "SleightofHand", name: "Prestidigitação", ability: "DES" },
    { field: "Religion", name: "Religião", ability: "INT" },
    { field: "Survival", name: "Sobrevivência", ability: "SAB" }
  ];

  function mapDnd(raw) {
    var r = normalizeRaw(raw);
    var abilities = DND_ABILITIES.map(function (a) {
      var score = num(r[a.scoreField], null);
      var mod = intOrNull(r[a.modField]);
      if (mod === null && score !== null) mod = Math.floor((score - 10) / 2);
      return { key: a.key, name: a.name, abbr: a.abbr, score: score, mod: mod === null ? 0 : mod };
    });

    var saves = DND_SAVES.map(function (s) {
      return { field: s.field, name: s.name, ability: s.ability, bonus: intOrNull(r[s.field]) };
    });

    var skills = DND_SKILLS.map(function (s) {
      return { field: s.field, name: s.name, ability: s.ability, bonus: intOrNull(r[s.field]) };
    });

    var weapons = [];
    [
      { name: "Wpn Name", atk: "Wpn1 AtkBonus", dmg: "Wpn1 Damage" },
      { name: "Wpn Name 2", atk: "Wpn2 AtkBonus", dmg: "Wpn2 Damage" },
      { name: "Wpn Name 3", atk: "Wpn3 AtkBonus", dmg: "Wpn3 Damage" }
    ].forEach(function (w) {
      var nm = str(r[w.name]);
      if (!nm) return;
      weapons.push({ name: nm, atk: str(r[w.atk]), damage: str(r[w.dmg]) });
    });

    var slots = [];
    Object.keys(r).forEach(function (k) {
      var m = k.match(/^SlotsTotal (\d+)$/);
      if (!m) return;
      var lvl = m[1];
      slots.push({
        level: lvl,
        total: intOrNull(r["SlotsTotal " + lvl]),
        used: intOrNull(r["SlotsRemaining " + lvl])
      });
    });
    slots.sort(function (a, b) { return parseInt(a.level, 10) - parseInt(b.level, 10); });

    var spells = [];
    Object.keys(r).forEach(function (k) {
      var m = k.match(/^Spells 10(\d+)$/);
      if (!m) return;
      var v = str(r[k]);
      if (v) spells.push(v);
    });

    var spell = null;
    if (str(r["Spellcasting Class 2"]) || str(r["SpellcastingAbility 2"]) || spells.length) {
      spell = {
        "class": str(r["Spellcasting Class 2"]),
        ability: str(r["SpellcastingAbility 2"]),
        saveDC: intOrNull(r["SpellSaveDC  2"]),
        atkBonus: intOrNull(r["SpellAtkBonus 2"]),
        slots: slots,
        spells: spells
      };
    }

    var name = str(r["CharacterName"]) || str(r["CharacterName 2"]);

    return {
      system: "dnd",
      name: name,
      abilities: abilities,
      profBonus: num(r["ProfBonus"], 0),
      ac: intOrNull(r["AC"]),
      initiative: intOrNull(r["Initiative"]),
      speed: str(r["Speed"]),
      hp: { max: intOrNull(r["HPMax"]), current: intOrNull(r["HPCurrent"]), temp: intOrNull(r["HPTemp"]) },
      hitDice: str(r["HD"]),
      passive: intOrNull(r["Passive"]),
      saves: saves,
      skills: skills,
      weapons: weapons,
      spell: spell,
      details: {
        classLevel: str(r["ClassLevel"]),
        race: str(r["Race"]),
        background: str(r["Background"]),
        alignment: str(r["Alignment"]),
        player: str(r["PlayerName"]),
        xp: str(r["XP"]),
        inspiration: str(r["Inspiration"]),
        personalityTraits: str(r["PersonalityTraits"]),
        ideals: str(r["Ideals"]),
        bonds: str(r["Bonds"]),
        flaws: str(r["Flaws"]),
        features: str(r["Features and Traits"]),
        proficiencies: str(r["ProficienciesLang"]),
        equipment: str(r["Equipment"]),
        gp: str(r["GP"])
      }
    };
  }

  function splitLines(v) {
    return str(v)
      .split(/\r\n|\r|\n/)
      .map(function (s) { return s.trim(); })
      .filter(Boolean);
  }

  var COC_CHARS = [
    { key: "str", field: "strength", name: "Força", abbr: "FOR" },
    { key: "con", field: "constitution", name: "Constituição", abbr: "CON" },
    { key: "siz", field: "size", name: "Tamanho", abbr: "TAM" },
    { key: "dex", field: "dexterity", name: "Destreza", abbr: "DES" },
    { key: "app", field: "appeal", name: "Aparência", abbr: "APA" },
    { key: "int", field: "intelligence", name: "Inteligência", abbr: "INT" },
    { key: "pow", field: "power", name: "Poder", abbr: "POD" },
    { key: "edu", field: "education", name: "Educação", abbr: "EDU" }
  ];

  var COC_SKILLS = [
    { field: "accounting", name: "Contabilidade" },
    { field: "anthropology", name: "Antropologia" },
    { field: "appraise", name: "Avaliação" },
    { field: "archaeology", name: "Arqueologia" },
    { field: "art_craft_1", name: "Arte/Ofício", nameField: "art_craft_1_name" },
    { field: "art_craft_2", name: "Arte/Ofício", nameField: "art_craft_2_name" },
    { field: "charm", name: "Charme" },
    { field: "climb", name: "Escalar" },
    { field: "credit_rating", name: "Crédito" },
    { field: "cthulhu_mythos", name: "Mito de Cthulhu" },
    { field: "disguise", name: "Disfarce" },
    { field: "dodge", name: "Esquiva" },
    { field: "drive_auto", name: "Dirigir Automóvel" },
    { field: "electrical_repair", name: "Reparo Elétrico" },
    { field: "fast_talk", name: "Conversa Rápida" },
    { field: "fighting_brawl", name: "Luta (Briga)" },
    { field: "fighting_1", name: "Luta", nameField: "fighting_1_name" },
    { field: "fighting_2", name: "Luta", nameField: "fighting_2_name" },
    { field: "firearms_handgun", name: "Armas de Fogo (Pistola)" },
    { field: "firearms_rifle_shotgun", name: "Armas de Fogo (Rifle/Espingarda)" },
    { field: "firearms_1", name: "Armas de Fogo", nameField: "firearms_1_name" },
    { field: "first_aid", name: "Primeiros Socorros" },
    { field: "history", name: "História" },
    { field: "intimidate", name: "Intimidar" },
    { field: "jump", name: "Saltar" },
    { field: "language_other_1", name: "Idioma (Outro)", nameField: "language_other_1_name" },
    { field: "language_other_2", name: "Idioma (Outro)", nameField: "language_other_2_name" },
    { field: "language_other_3", name: "Idioma (Outro)", nameField: "language_other_3_name" },
    { field: "language_own", name: "Idioma (Nativo)", nameField: "language_own_name" },
    { field: "law", name: "Direito" },
    { field: "library_use", name: "Uso de Biblioteca" },
    { field: "listen", name: "Escutar" },
    { field: "locksmith", name: "Chaveiro" },
    { field: "mechanical_repair", name: "Reparo Mecânico" },
    { field: "medicine", name: "Medicina" },
    { field: "natural_world", name: "Mundo Natural" },
    { field: "navigate", name: "Navegação" },
    { field: "occult", name: "Ocultismo" },
    { field: "persuade", name: "Persuadir" },
    { field: "pilot", name: "Pilotagem", nameField: "pilot_name" },
    { field: "psychoanalysis", name: "Psicanálise" },
    { field: "psychology", name: "Psicologia" },
    { field: "ride", name: "Cavalgar" },
    { field: "science_1", name: "Ciência", nameField: "science_1_name" },
    { field: "science_2", name: "Ciência", nameField: "science_2_name" },
    { field: "science_3", name: "Ciência", nameField: "science_3_name" },
    { field: "sleight_of_hand", name: "Prestidigitação" },
    { field: "spot_hidden", name: "Observar" },
    { field: "stealth", name: "Furtividade" },
    { field: "survival", name: "Sobrevivência", nameField: "survival_name" },
    { field: "swim", name: "Nadar" },
    { field: "throw", name: "Arremessar" },
    { field: "track", name: "Rastrear" },
    { field: "custom_1", name: "Personalizada", nameField: "custom_1_name" },
    { field: "custom_2", name: "Personalizada", nameField: "custom_2_name" },
    { field: "custom_3", name: "Personalizada", nameField: "custom_3_name" },
    { field: "custom_4", name: "Personalizada", nameField: "custom_4_name" }
  ];

  function mapCoc(raw) {
    var r = normalizeRaw(raw);

    var characteristics = COC_CHARS.map(function (c) {
      var base = "characteristic_" + c.key + "_";
      return {
        key: c.key,
        name: c.name,
        abbr: c.abbr,
        value: intOrNull(r["characteristic_" + c.key]),
        half: intOrNull(r[base + "half"]),
        fifth: intOrNull(r[base + "fifth"])
      };
    });

    var skills = [];
    COC_SKILLS.forEach(function (s) {
      var v = intOrNull(r["skill_" + s.field]);
      var nm = s.nameField ? str(r["skill_" + s.nameField]) : "";
      var hasValue = v !== null;
      if (!hasValue && !nm) return;
      skills.push({
        field: s.field,
        name: nm || s.name,
        base: s.name,
        value: v === null ? 0 : v,
        half: intOrNull(r["skill_" + s.field + "_half"]),
        fifth: intOrNull(r["skill_" + s.field + "_fifth"]),
        checked: isChecked(r["skill_" + s.field + "_check"])
      });
    });

    var weapons = [];
    for (var i = 1; i <= 6; i++) {
      var p = "weapon_" + i;
      var wname = str(r[p + "_name"]);
      var wskill = intOrNull(r[p]);
      if (!wname && wskill === null) continue;
      weapons.push({
        name: wname || ("Arma " + i),
        skill: wskill,
        damage: str(r[p + "_damage"]),
        attacks: str(r[p + "_number_of_attacks"]),
        range: str(r[p + "_range"]),
        ammo: str(r[p + "_ammo"]),
        malfunction: str(r[p + "_malfunction"])
      });
    }

    return {
      system: "coc",
      name: str(r["investigator_name"]) || str(r["investigator_occupation"]) || "Investigador",
      characteristics: characteristics,
      attributes: {
        hpMax: intOrNull(r["attribute_hit_point_max"]),
        hpCurrent: intOrNull(r["attribute_hit_point_current"]),
        mpMax: intOrNull(r["attribute_magic_points_max"]),
        mpCurrent: intOrNull(r["attribute_magic_points_current"]),
        luckStart: intOrNull(r["attribute_luck_starting"]),
        luck: intOrNull(r["attribute_luck_current"]),
        sanityStart: intOrNull(r["attribute_sanity_starting"]),
        sanity: intOrNull(r["attribute_sanity_current"]),
        sanityMax: intOrNull(r["attribute_sanity_max"]),
        move: intOrNull(r["attribute_move"]),
        build: intOrNull(r["attribute_build"]),
        damageBonus: str(r["attribute_damage_bonus"]),
        flags: {
          temporaryInsanity: isChecked(r["attribute_sanity_temporary_insanity_check"]),
          indefiniteInsanity: isChecked(r["attribute_sanity_indefinite_insanity_check"]),
          majorWound: isChecked(r["attribute_major_wound_check"]),
          unconscious: isChecked(r["attribute_unconsious_check"]),
          dying: isChecked(r["attribute_dying_check"])
        }
      },
      skills: skills,
      weapons: weapons,
      details: {
        occupation: str(r["investigator_occupation"]),
        age: str(r["investigator_age"]),
        birthplace: str(r["investigator_birthplace"]),
        residence: str(r["investigator_residence"]),
        gender: str(r["investigator_gender"])
      }
    };
  }

  function detectSystem(raw) {
    var r = normalizeRaw(raw);
    var keys = Object.keys(r);
    var hasCoc = keys.some(function (k) {
      return k.indexOf("characteristic_") === 0 || k.indexOf("skill_") === 0 || k === "investigator_name";
    });
    var hasDnd = keys.some(function (k) {
      return k === "CharacterName" || k === "ClassLevel" || k === "STR" || k.indexOf("ST ") === 0;
    });
    if (hasCoc && !hasDnd) return "coc";
    if (hasDnd && !hasCoc) return "dnd";
    if (hasCoc && hasDnd) return keys.filter(function (k) { return k.indexOf("skill_") === 0; }).length > 20 ? "coc" : "dnd";
    return null;
  }

  function mapSheet(system, raw) {
    if (system === "coc") return mapCoc(raw);
    if (system === "dnd") return mapDnd(raw);
    throw new Error("Sistema desconhecido: " + system);
  }

  function slug(s) {
    return str(s)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "") || "ficha";
  }

  function uid() {
    return "s_" + Date.now().toString(36) + "_" + Math.random().toString(36).slice(2, 8);
  }

  var DND_WEAPON_FIELDS = [
    { name: "Wpn Name", atk: "Wpn1 AtkBonus", dmg: "Wpn1 Damage" },
    { name: "Wpn Name 2", atk: "Wpn2 AtkBonus", dmg: "Wpn2 Damage" },
    { name: "Wpn Name 3", atk: "Wpn3 AtkBonus", dmg: "Wpn3 Damage" }
  ];

  function dndToRaw(data) {
    var out = {};
    (data.abilities || []).forEach(function (ab, i) {
      var def = DND_ABILITIES[i];
      if (!def) return;
      if (ab.score != null) out[def.scoreField] = String(ab.score);
      if (ab.mod != null) out[def.modField] = String(ab.mod);
    });
    var hp = data.hp || {};
    if (hp.current != null) out["HPCurrent"] = String(hp.current);
    if (hp.max != null) out["HPMax"] = String(hp.max);
    if (hp.temp != null) out["HPTemp"] = String(hp.temp);
    if (data.ac != null) out["AC"] = String(data.ac);
    if (data.profBonus != null) out["ProfBonus"] = String(data.profBonus);
    if (data.speed) out["Speed"] = String(data.speed);
    if (data.passive != null) out["Passive"] = String(data.passive);
    if (data.hitDice) out["HD"] = String(data.hitDice);
    (data.saves || []).forEach(function (s, i) {
      if (s.bonus != null && DND_SAVES[i]) out[DND_SAVES[i].field] = String(s.bonus);
    });
    (data.skills || []).forEach(function (s, i) {
      if (s.bonus != null && DND_SKILLS[i]) out[DND_SKILLS[i].field] = String(s.bonus);
    });
    (data.weapons || []).forEach(function (w, i) {
      var f = DND_WEAPON_FIELDS[i];
      if (!f) return;
      if (w.name != null) out[f.name] = String(w.name);
      if (w.atk != null) out[f.atk] = String(w.atk);
      if (w.damage != null) out[f.dmg] = String(w.damage);
    });
    var d = data.details || {};
    if (d.classLevel != null) out["ClassLevel"] = String(d.classLevel);
    if (d.race != null) out["Race"] = String(d.race);
    if (d.background != null) out["Background"] = String(d.background);
    if (d.alignment != null) out["Alignment"] = String(d.alignment);
    if (d.player != null) out["PlayerName"] = String(d.player);
    return out;
  }

  function cocToRaw(data) {
    var out = {};
    (data.characteristics || []).forEach(function (c, i) {
      var def = COC_CHARS[i];
      if (!def) return;
      if (c.value != null) out["characteristic_" + def.key] = String(c.value);
      if (c.half != null) out["characteristic_" + def.key + "_half"] = String(c.half);
      if (c.fifth != null) out["characteristic_" + def.key + "_fifth"] = String(c.fifth);
    });
    var a = data.attributes || {};
    if (a.hpMax != null) out["attribute_hit_point_max"] = String(a.hpMax);
    if (a.hpCurrent != null) out["attribute_hit_point_current"] = String(a.hpCurrent);
    if (a.mpMax != null) out["attribute_magic_points_max"] = String(a.mpMax);
    if (a.mpCurrent != null) out["attribute_magic_points_current"] = String(a.mpCurrent);
    if (a.luck != null) out["attribute_luck_current"] = String(a.luck);
    if (a.sanity != null) out["attribute_sanity_current"] = String(a.sanity);
    if (a.sanityMax != null) out["attribute_sanity_max"] = String(a.sanityMax);
    if (a.move != null) out["attribute_move"] = String(a.move);
    if (a.build != null) out["attribute_build"] = String(a.build);
    if (a.damageBonus != null) out["attribute_damage_bonus"] = String(a.damageBonus);
    if (a.flags) {
      out["attribute_sanity_temporary_insanity_check"] = !!a.flags.temporaryInsanity;
      out["attribute_sanity_indefinite_insanity_check"] = !!a.flags.indefiniteInsanity;
      out["attribute_major_wound_check"] = !!a.flags.majorWound;
      out["attribute_unconsious_check"] = !!a.flags.unconscious;
      out["attribute_dying_check"] = !!a.flags.dying;
    }
    (data.skills || []).forEach(function (s) {
      if (!s.field) return;
      out["skill_" + s.field] = String(s.value == null ? 0 : s.value);
      if (s.half != null) out["skill_" + s.field + "_half"] = String(s.half);
      if (s.fifth != null) out["skill_" + s.field + "_fifth"] = String(s.fifth);
    });
    (data.weapons || []).forEach(function (w, i) {
      var p = "weapon_" + (i + 1);
      if (w.name != null) out[p + "_name"] = String(w.name);
      if (w.skill != null) out[p] = String(w.skill);
      if (w.damage != null) out[p + "_damage"] = String(w.damage);
    });
    var d = data.details || {};
    if (d.occupation != null) out["investigator_occupation"] = String(d.occupation);
    if (d.age != null) out["investigator_age"] = String(d.age);
    if (d.birthplace != null) out["investigator_birthplace"] = String(d.birthplace);
    if (d.residence != null) out["investigator_residence"] = String(d.residence);
    if (d.gender != null) out["investigator_gender"] = String(d.gender);
    return out;
  }

  function toRaw(sheet) {
    if (!sheet || !sheet.data) return {};
    return sheet.system === "coc" ? cocToRaw(sheet.data) : dndToRaw(sheet.data);
  }

  function buildSheet(system, raw, meta) {
    meta = meta || {};
    var data = mapSheet(system, raw);
    var now = new Date().toISOString();
    return {
      id: meta.id || uid(),
      system: system,
      name: meta.name || data.name || "Ficha sem nome",
      source: meta.source || null,
      createdAt: meta.createdAt || now,
      updatedAt: now,
      data: data,
      raw: raw || {}
    };
  }

  return {
    detectSystem: detectSystem,
    mapSheet: mapSheet,
    mapDnd: mapDnd,
    mapCoc: mapCoc,
    buildSheet: buildSheet,
    toRaw: toRaw,
    slug: slug,
    uid: uid,
    abbrFor: function (system, key) {
      if (system === "dnd") {
        var a = DND_ABILITIES.filter(function (x) { return x.key === key; })[0];
        return a ? a.abbr : key;
      }
      var c = COC_CHARS.filter(function (x) { return x.key === key; })[0];
      return c ? c.abbr : key;
    }
  };
});
