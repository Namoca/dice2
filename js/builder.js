(function (root) {
  "use strict";

  var R = root.DiceRules;

  function t(key, vars) { return root.I18n ? root.I18n.t(key, vars) : key; }
  function lang() { return root.I18n && root.I18n.lang === "en" ? "en" : "pt"; }
  function nameOf(o) { return !o ? "" : (lang() === "en" ? o.en : o.pt); }

  function esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function intOrNull(v) {
    if (v === "" || v === null || v === undefined) return null;
    var n = parseInt(v, 10);
    return isNaN(n) ? null : n;
  }

  function classByKey(key) { return R.classByKey(key); }

  function csb(field, chars) {
    if (field === "dodge") return Math.floor((Number(chars.dex) || 0) / 2);
    if (field === "language_own") return Number(chars.edu) || 0;
    return (root.SheetMapper && root.SheetMapper.cocSkillBase ? root.SheetMapper.cocSkillBase[field] : 0) || 0;
  }

  /* ---------------- icons ---------------- */

  var ICONS = {
    setup: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>',
    user: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    dice: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="15.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="15.5" cy="8.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="8.5" cy="15.5" r="1.1" fill="currentColor" stroke="none"/></svg>',
    list: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/><line x1="8" y1="18" x2="21" y2="18"/><line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/><line x1="3" y1="18" x2="3.01" y2="18"/></svg>',
    chart: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="20" x2="12" y2="10"/><line x1="18" y1="20" x2="18" y2="4"/><line x1="6" y1="20" x2="6" y2="16"/></svg>',
    heart: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.7-7.5 1.1-1.1a5.5 5.5 0 0 0 0-7.8z"/></svg>',
    brain: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.5 2A2.5 2.5 0 0 0 7 4.5v.5A3 3 0 0 0 6 10v1a3 3 0 0 0 3 3v6a2 2 0 0 0 4 0V8a3 3 0 0 1 3-3V4a2 2 0 0 0-2-2z"/></svg>',
    shield: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    bolt: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>',
    eye: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>',
    foot: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 16c0-4 2-7 5-8 1-3 4-5 7-4 3 1 4 4 3 8-1 5-4 8-8 8-3 0-5-2-7-4z"/></svg>',
    star: '<svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15 9 22 9.5 17 14.5 18.5 22 12 18 5.5 22 7 14.5 2 9.5 9 9 12 2"/></svg>',
    spark: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M18.4 5.6l-2.1 2.1M7.7 16.3l-2.1 2.1"/><circle cx="12" cy="12" r="3.2"/></svg>'
  };

  function ico(name) { return '<span class="bld-ico" aria-hidden="true">' + (ICONS[name] || "") + "</span>"; }

  /* ---------------- state ---------------- */

  function freshState() {
    return {
      system: "dnd",
      mode: "rules",
      name: "",
      dnd: {
        level: 1, classKey: "fighter", race: "",
        method: "pointbuy",
        scores: { FOR: 8, DES: 8, CON: 8, INT: 8, SAB: 8, CAR: 8 },
        skillProfs: [],
        speed: 30, ac: "", hp: ""
      },
      coc: {
        age: "", occupationKey: "journalist", secondAbility: "",
        customName: "", customMin: 0, customMax: 0,
        chars: { str: null, con: null, siz: null, dex: null, app: null, int: null, pow: null, edu: null },
        luck: null,
        occSpend: {}, interestSpend: {}, free: {},
        extraSkills: [], filter: ""
      }
    };
  }

  var bs = freshState();

  function activeOccupation() {
    if (bs.coc.occupationKey === "custom") {
      return {
        key: "custom",
        pt: bs.coc.customName || t("build.customOcc"),
        en: bs.coc.customName || "Custom",
        credit: [intOrNull(bs.coc.customMin) || 0, intOrNull(bs.coc.customMax) || 0],
        points: { terms: [{ key: "edu", mul: 4 }] },
        skills: bs.coc.extraSkills.slice(),
        custom: true
      };
    }
    return R.cocOccupationByKey(bs.coc.occupationKey);
  }

  function cocOccSkillSet() {
    var occ = activeOccupation();
    var set = {};
    (occ && occ.skills ? occ.skills : []).forEach(function (f) { set[f] = true; });
    return set;
  }

  function cocSkillItems() {
    return root.SheetMapper.blankSheet("coc").data.skills;
  }

  function cocBase(field, chars) { return csb(field, chars); }

  /* ---------------- small markup helpers ---------------- */

  function lbl(text) { return '<span class="bld-label">' + esc(text) + "</span>"; }

  function numInput(bi, value, min, max, extra) {
    return '<input class="input bld-num" type="number" data-bi="' + esc(bi) + '" data-kind="int"' +
      (min !== null ? ' min="' + min + '"' : "") + (max !== null ? ' max="' + max + '"' : "") +
      ' value="' + esc(value === null || value === undefined ? "" : value) + '"' +
      (extra || "") + ">";
  }

  function textInput(bi, value, extra) {
    return '<input class="input" type="text" data-bi="' + esc(bi) + '" data-kind="text" value="' + esc(value) + '"' + (extra || "") + ">";
  }

  function signed(n) { return (n >= 0 ? "+" : "") + n; }

  function segBtn(seg, val, label, active) {
    return '<button class="seg-btn' + (active ? " active" : "") + '" data-act="seg" data-seg="' + esc(seg) +
      '" data-val="' + esc(val) + '" type="button">' + esc(label) + "</button>";
  }

  function stepBtn(key, delta, label, disabled) {
    return '<button class="step-btn" data-act="pb-step" data-key="' + esc(key) + '" data-delta="' + delta +
      '" type="button"' + (disabled ? " disabled" : "") + ">" + label + "</button>";
  }

  function modBadge(mod) {
    var cls = mod > 0 ? "pos" : (mod < 0 ? "neg" : "zero");
    return '<span class="mod-badge ' + cls + '">' + signed(mod) + "</span>";
  }

  function statCard(icon, label, value, tone) {
    return '<div class="stat-card' + (tone ? " " + tone : "") + '">' + ico(icon) +
      '<div class="stat-body"><span class="stat-k">' + esc(label) + '</span><span class="stat-v">' + esc(value) + "</span></div></div>";
  }

  function bar(used, total) {
    var over = total > 0 && used > total;
    var pct = total > 0 ? Math.max(0, Math.min(100, Math.round((used / total) * 100))) : 0;
    return '<div class="pb-bar' + (over ? " over" : "") + '"><div class="pb-fill" style="width:' + pct + '%"></div></div>';
  }

  function cardHead(icon, title, extra) {
    return '<div class="bld-card-head">' + ico(icon) + "<h3>" + esc(title) + "</h3>" + (extra || "") + "</div>";
  }

  /* ---------------- hero + setup ---------------- */

  function hero() {
    return '<div class="bld-hero"><div class="bld-hero-ico">' + ico("spark") + "</div>" +
      '<div class="bld-hero-txt"><h2>' + esc(t("build.title")) + "</h2>" +
      "<p>" + esc(bs.mode === "rules" ? t("build.descRules") : t("build.descFree")) + "</p></div></div>";
  }

  function setupCard() {
    var h = ['<div class="bld-card">' + cardHead("setup", t("build.setup"),
      '<button class="btn small ghost bld-reset" data-act="reset" type="button">' + esc(t("build.reset")) + "</button>")];
    h.push('<div class="bld-grid">');
    h.push('<div class="bld-field">' + lbl(t("build.system")) + '<div class="seg seg-lg">' +
      segBtn("system", "dnd", "D&D 5e", bs.system === "dnd") +
      segBtn("system", "coc", "CoC 7e", bs.system === "coc") + "</div></div>");
    h.push('<div class="bld-field">' + lbl(t("build.mode")) + '<div class="seg seg-lg">' +
      segBtn("mode", "rules", t("build.modeRules"), bs.mode === "rules") +
      segBtn("mode", "free", t("build.modeFree"), bs.mode === "free") + "</div></div>");
    h.push('<label class="bld-field grow">' + lbl(t("word.name")) + textInput("name", bs.name) + "</label>");
    h.push("</div></div>");
    return h.join("");
  }

  /* ---------------- D&D ---------------- */

  function dndDerivedNow() {
    var c = classByKey(bs.dnd.classKey);
    return R.dndDerived({
      level: bs.dnd.level,
      classKey: bs.dnd.classKey,
      scores: bs.dnd.scores,
      saveProfs: c ? c.saves : [],
      skillProfs: bs.mode === "rules" ? bs.dnd.skillProfs : [],
      hitDie: c ? c.hitDie : 8,
      speed: bs.dnd.speed,
      acOverride: bs.dnd.ac,
      hpOverride: bs.dnd.hp
    });
  }

  function dndStats(d) {
    var h = ['<div class="stat-grid">'];
    h.push(statCard("star", t("vital.prof"), signed(d.profBonus), "accent"));
    h.push(statCard("heart", t("vital.hpMax"), d.hpMax));
    h.push(statCard("shield", t("vital.ac"), d.ac));
    h.push(statCard("bolt", t("roll.initiative"), signed(d.initiative)));
    h.push(statCard("eye", t("vital.passive"), d.passive));
    h.push(statCard("foot", t("vital.speed"), d.speed));
    if (d.spell) {
      h.push(statCard("spark", t("vital.spellDC"), d.spell.saveDC));
      h.push(statCard("spark", t("vital.spellAtk"), signed(d.spell.atkBonus)));
    }
    h.push("</div>");
    return h.join("");
  }

  function arrayAvailability() {
    var used = {};
    R.ABILITY_KEYS.forEach(function (k) {
      var v = bs.dnd.scores[k];
      if (v !== null && v !== undefined) used[v] = (used[v] || 0) + 1;
    });
    return used;
  }

  function scoreRow(d, k, inputHtml, rightHtml) {
    var ab = R.ABILITY_NAMES[k];
    return '<div class="score-row"><span class="score-abbr">' + esc(k) + "</span>" +
      '<span class="score-name">' + esc(lang() === "en" ? ab.en : ab.pt) + "</span>" +
      inputHtml + modBadge(d.mods[k]) + (rightHtml || "") + "</div>";
  }

  function pbRow(d, k) {
    var v = intOrNull(bs.dnd.scores[k]);
    if (v === null) v = 8;
    var spent = R.pointBuySpent(bs.dnd.scores);
    var canUp = v < 15 && (spent - (R.pointBuyCost(v) || 0) + (R.pointBuyCost(v + 1) || 0)) <= R.POINT_BUY_TOTAL;
    var input = '<div class="stepper">' +
      stepBtn(k, -1, "&minus;", v <= 8) +
      numInput("dnd.score." + k, bs.dnd.scores[k], 8, 15) +
      stepBtn(k, 1, "+", !canUp) + "</div>";
    var cost = '<span class="score-cost">' + esc(t("build.cost")) + " " + (R.pointBuyCost(v) || 0) + "</span>";
    return scoreRow(d, k, input, cost);
  }

  function arrayRow(d, k) {
    var used = arrayAvailability();
    var cv = intOrNull(bs.dnd.scores[k]);
    var opts = R.STANDARD_ARRAY.map(function (val) {
      var elsewhere = (used[val] || 0) - (cv === val ? 1 : 0);
      var disabled = elsewhere > 0 ? " disabled" : "";
      var sel = cv === val ? " selected" : "";
      return '<option value="' + val + '"' + sel + disabled + ">" + val + "</option>";
    }).join("");
    var input = '<select class="input bld-num" data-bi="dnd.array.' + k + '" data-kind="text"><option value="">—</option>' + opts + "</select>";
    return scoreRow(d, k, input, "");
  }

  function rollRow(d, k) {
    return scoreRow(d, k, numInput("dnd.score." + k, bs.dnd.scores[k], 3, 30), "");
  }

  function dndScores(d) {
    var h = [];
    if (bs.mode === "free") {
      R.ABILITY_KEYS.forEach(function (k) { h.push(rollRow(d, k)); });
      return h.join("");
    }

    h.push('<div class="method-row">' + lbl(t("build.method")) + '<div class="seg">' +
      segBtn("method", "pointbuy", t("build.pointBuy"), bs.dnd.method === "pointbuy") +
      segBtn("method", "array", t("build.array"), bs.dnd.method === "array") +
      segBtn("method", "roll", t("build.roll"), bs.dnd.method === "roll") + "</div></div>");

    if (bs.dnd.method === "array") {
      var used = arrayAvailability();
      h.push('<div class="value-chips">' + R.STANDARD_ARRAY.map(function (val) {
        return '<span class="value-chip' + ((used[val] || 0) > 0 ? " used" : "") + '">' + val + "</span>";
      }).join("") + "</div>");
      R.ABILITY_KEYS.forEach(function (k) { h.push(arrayRow(d, k)); });
    } else if (bs.dnd.method === "roll") {
      h.push('<div class="method-tools"><button class="btn small" data-act="dnd-roll4d6" type="button">' +
        ico("dice") + esc(t("build.roll4d6")) + "</button></div>");
      R.ABILITY_KEYS.forEach(function (k) { h.push(rollRow(d, k)); });
    } else {
      R.ABILITY_KEYS.forEach(function (k) { h.push(pbRow(d, k)); });
      var spent = R.pointBuySpent(bs.dnd.scores);
      var left = R.POINT_BUY_TOTAL - spent;
      h.push('<div class="pb-meter' + (left < 0 ? " over" : "") + '"><div class="pb-meter-top"><span>' +
        esc(t("build.pointsLeft")) + ": <strong>" + left + "</strong> / " + R.POINT_BUY_TOTAL + "</span><span>" +
        esc(t("build.pointsSpent")) + ": " + spent + "</span></div>" + bar(spent, R.POINT_BUY_TOTAL) + "</div>");
    }
    return h.join("");
  }

  function dndSkillPicker() {
    var c = classByKey(bs.dnd.classKey);
    if (!c) return "";
    var atMax = bs.dnd.skillProfs.length >= c.skillCount;
    var h = ['<div class="bld-count-row"><span class="bld-count"><strong>' + bs.dnd.skillProfs.length +
      "</strong> / " + c.skillCount + "</span><span class=\"muted\">" + esc(t("build.skillHint")) + "</span></div>"];
    h.push('<div class="chk-grid">');
    c.skills.forEach(function (field) {
      var checked = bs.dnd.skillProfs.indexOf(field) >= 0;
      var nm = root.I18n ? root.I18n.skillName("dnd", { field: field }) : field;
      var ab = R.DND_SKILL_ABILITIES[field];
      var disabled = (!checked && atMax) ? " disabled" : "";
      h.push('<label class="chk' + (checked ? " on" : "") + '"><input type="checkbox" data-bi="dnd.skill.' + field +
        '" data-kind="bool"' + (checked ? " checked" : "") + disabled + '><span>' + esc(nm) +
        ' <em>(' + esc(ab) + ")</em></span></label>");
    });
    h.push("</div>");
    h.push('<div class="save-row">' + c.saves.map(function (k) {
      return '<span class="pill pill-accent">' + esc(R.ABILITY_NAMES[k][lang() === "en" ? "en" : "pt"]) + "</span>";
    }).join("") + "</div>");
    return h.join("");
  }

  function renderDnd() {
    var d = dndDerivedNow();
    var h = [];

    h.push('<div class="bld-card">' + cardHead("user", t("build.identity")));
    h.push('<div class="bld-grid">');
    var classOpts = '<option value=""' + (!bs.dnd.classKey ? " selected" : "") + ">—</option>" +
      R.DND_CLASSES.map(function (c) {
        return '<option value="' + esc(c.key) + '"' + (c.key === bs.dnd.classKey ? " selected" : "") + ">" + esc(nameOf(c)) + "</option>";
      }).join("");
    h.push('<label class="bld-field grow">' + lbl(t("build.class")) + '<select class="input" data-bi="dnd.classKey" data-kind="text">' + classOpts + "</select></label>");
    h.push('<label class="bld-field">' + lbl(t("build.level")) + numInput("dnd.level", bs.dnd.level, 1, 20) + "</label>");
    h.push('<label class="bld-field grow">' + lbl(t("detail.race")) + textInput("dnd.race", bs.dnd.race) + "</label>");
    h.push("</div></div>");

    h.push('<div class="bld-card">' + cardHead("dice", t("build.scores")));
    h.push(dndScores(d));
    h.push('<div class="divider"></div>');
    h.push('<div class="bld-grid bld-grid-tight">');
    h.push('<label class="bld-field">' + lbl(t("vital.speed")) + numInput("dnd.speed", bs.dnd.speed, 0, 200) + "</label>");
    h.push('<label class="bld-field">' + lbl(t("build.acOptional")) + numInput("dnd.ac", bs.dnd.ac, 0, 40) + "</label>");
    h.push('<label class="bld-field">' + lbl(t("build.hpOptional")) + numInput("dnd.hp", bs.dnd.hp, 1, 999) + "</label>");
    h.push("</div>");
    h.push('<div class="sub-title">' + ico("chart") + esc(t("build.derived")) + "</div>");
    h.push(dndStats(d));
    h.push("</div>");

    if (bs.mode === "rules") {
      h.push('<div class="bld-card">' + cardHead("list", t("build.skills"), '<span class="bld-count"><strong>' +
        bs.dnd.skillProfs.length + "</strong> / " + (classByKey(bs.dnd.classKey) ? classByKey(bs.dnd.classKey).skillCount : 0) + "</span>"));
      h.push(dndSkillPicker());
      h.push("</div>");
    }
    return h.join("");
  }

  /* ---------------- Call of Cthulhu ---------------- */

  function cocDerivedNow() { return R.cocDerived(bs.coc.chars); }

  function cocPoints() {
    var occ = activeOccupation();
    var occPoints = R.cocOccupationPoints(occ, bs.coc.chars, bs.coc.secondAbility);
    var interestPoints = (Number(bs.coc.chars.int) || 0) * 2;
    return { occ: occ, occPoints: occPoints, interestPoints: interestPoints };
  }

  function cocSpent() {
    var occSet = cocOccSkillSet();
    var occSpent = 0, intSpent = 0;
    Object.keys(bs.coc.occSpend).forEach(function (f) {
      if (f === "credit_rating" || occSet[f]) occSpent += Number(bs.coc.occSpend[f]) || 0;
    });
    Object.keys(bs.coc.interestSpend).forEach(function (f) {
      if (f !== "cthulhu_mythos") intSpent += Number(bs.coc.interestSpend[f]) || 0;
    });
    return { occSpent: occSpent, intSpent: intSpent };
  }

  function cocStats(d) {
    var h = ['<div class="stat-grid">'];
    h.push(statCard("heart", t("vital.hpMax"), d.hpMax, "accent"));
    h.push(statCard("bolt", t("vital.mpCurrent"), d.mpMax));
    h.push(statCard("foot", t("vital.move"), d.move));
    h.push(statCard("shield", t("vital.build"), d.build));
    h.push(statCard("spark", t("vital.db"), d.damageBonus));
    h.push(statCard("brain", t("vital.sanity"), d.sanity));
    h.push("</div>");
    return h.join("");
  }

  function cocCharCard(d, k) {
    var nm = root.I18n ? root.I18n.abilityName("coc", { key: k }) : k;
    var abbr = root.SheetMapper ? root.SheetMapper.abbrFor("coc", k) : k.toUpperCase();
    var rollBtn = bs.mode === "rules"
      ? '<button class="btn tiny roll-mini" data-act="coc-roll" data-key="' + esc(k) + '" type="button">' + ico("dice") + "</button>"
      : "";
    return '<div class="char-cell"><div class="cc-head"><span class="cc-abbr">' + esc(abbr) + '</span>' +
      '<span class="cc-name">' + esc(nm) + "</span>" + rollBtn + "</div>" +
      numInput("coc.char." + k, bs.coc.chars[k], 0, 99) +
      '<div class="cc-derived"><span><i>' + esc(t("roll.half")) + "</i> " + (d.half[k] == null ? "—" : d.half[k]) +
      "</span><span><i>" + esc(t("roll.fifth")) + "</i> " + (d.fifth[k] == null ? "—" : d.fifth[k]) + "</span></div></div>";
  }

  function cocCharGrid(d) {
    var h = [];
    if (bs.mode === "rules") {
      h.push('<div class="method-tools"><button class="btn small" data-act="coc-roll-all" type="button">' +
        ico("dice") + esc(t("build.rollAll")) + "</button></div>");
    }
    h.push('<div class="char-grid">');
    R.COC_CHAR_KEYS.forEach(function (k) { h.push(cocCharCard(d, k)); });
    h.push("</div>");
    h.push('<div class="bld-grid bld-grid-tight">');
    h.push('<label class="bld-field">' + lbl(t("vital.luck")) + numInput("coc.luck", bs.coc.luck, 0, 99) + "</label>");
    h.push('<label class="bld-field">' + lbl(t("detail.age")) + textInput("coc.age", bs.coc.age) + "</label>");
    if (bs.mode === "rules") {
      h.push('<div class="bld-field"><span class="bld-label">&nbsp;</span><button class="btn small" data-act="coc-roll-luck" type="button">' +
        esc(t("build.roll")) + "</button></div>");
    }
    h.push("</div>");
    return h.join("");
  }

  function cocSkillRow(item, occSet, occAllowed) {
    var field = item.field;
    var base = cocBase(field, bs.coc.chars);
    var nm = root.I18n ? root.I18n.skillName("coc", item) : field;
    var occVal = bs.coc.occSpend[field] || 0;
    var intVal = bs.coc.interestSpend[field] || 0;
    var freeVal = bs.coc.free[field];
    var total, inputs;
    if (bs.mode === "free") {
      total = freeVal == null ? base : (Number(freeVal) || 0);
      inputs = '<input class="input bld-num" type="number" min="0" max="99" data-bi="coc.free.' + esc(field) +
        '" data-kind="int" value="' + esc(freeVal == null ? "" : freeVal) + '" placeholder="' + base + '">';
    } else {
      total = base + occVal + intVal;
      var occDisabled = (field === "credit_rating" || occAllowed) ? "" : ' disabled';
      var intDisabled = field === "cthulhu_mythos" ? ' disabled' : "";
      inputs = '<input class="input bld-num' + (occVal ? " has-val" : "") + '" type="number" min="0" max="99" data-bi="coc.occ.' + esc(field) +
        '" data-kind="int" value="' + (occVal || "") + '"' + occDisabled + ">" +
        '<input class="input bld-num' + (intVal ? " has-val" : "") + '" type="number" min="0" max="99" data-bi="coc.int.' + esc(field) +
        '" data-kind="int" value="' + (intVal || "") + '"' + intDisabled + ">";
    }
    var half = Math.floor(total / 2), fifth = Math.floor(total / 5);
    return '<tr class="' + (occAllowed && field !== "credit_rating" ? "occ-row" : "") + '">' +
      '<td class="sk-name">' + esc(nm) + "</td>" +
      '<td class="sk-base"><span class="sk-base-val">' + base + "</span></td>" +
      '<td class="sk-in">' + inputs + "</td>" +
      '<td class="sk-total"><strong>' + total + "</strong></td>" +
      '<td class="sk-half">' + half + "<span>/</span>" + fifth + "</td></tr>";
  }

  function cocSkillsTable() {
    var occSet = cocOccSkillSet();
    var items = cocSkillItems();
    var filter = (bs.coc.filter || "").trim().toLowerCase();
    if (filter) {
      items = items.filter(function (it) {
        var nm = (root.I18n ? root.I18n.skillName("coc", it) : it.field) || "";
        return nm.toLowerCase().indexOf(filter) >= 0 || String(it.field).toLowerCase().indexOf(filter) >= 0;
      });
    }
    var h = [];
    h.push('<div class="filter-wrap"><span class="search-ico"><svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"></circle><path d="M20 20l-3.2-3.2"></path></svg></span>' +
      textInput("coc.filter", bs.coc.filter, ' placeholder="' + esc(t("build.filter")) + '" autocomplete="off" spellcheck="false"') + "</div>");
    h.push('<div class="skill-table-wrap"><table class="skill-table"><thead><tr>' +
      "<th>" + esc(t("section.skills")) + "</th><th>" + esc(t("build.base")) + "</th>" +
      "<th>" + esc(bs.mode === "free" ? t("build.value") : t("build.occShort")) + "</th>" +
      (bs.mode === "free" ? "" : "<th>" + esc(t("build.intShort")) + "</th>") +
      "<th>" + esc(t("build.total")) + "</th><th>" + esc(t("roll.half")) + "/" + esc(t("roll.fifth")) + "</th>" +
      "</tr></thead><tbody>");
    if (!items.length) {
      h.push('<tr><td colspan="6" class="sk-none">' + esc(t("build.noMatch")) + "</td></tr>");
    } else {
      items.forEach(function (item) {
        var occAllowed = item.field === "credit_rating" || !!occSet[item.field];
        h.push(cocSkillRow(item, occSet, occAllowed));
      });
    }
    h.push("</tbody></table></div>");
    h.push('<p class="legend muted">' + esc(t("build.legend")) + "</p>");
    return h.join("");
  }

  function cocOccupationPanel() {
    var p = cocPoints();
    var sp = cocSpent();
    var occ = p.occ;
    var h = [];
    h.push('<div class="bld-grid">');
    var opts = R.COC_OCCUPATIONS.map(function (o) {
      return '<option value="' + esc(o.key) + '"' + (o.key === bs.coc.occupationKey ? " selected" : "") + ">" +
        esc(nameOf(o)) + " (" + o.credit[0] + "–" + o.credit[1] + "%)</option>";
    }).join("");
    opts += '<option value="custom"' + (bs.coc.occupationKey === "custom" ? " selected" : "") + ">" + esc(t("build.customOcc")) + "</option>";
    h.push('<label class="bld-field grow">' + lbl(t("detail.occupation")) + '<select class="input" data-bi="coc.occ" data-kind="text">' + opts + "</select></label>");
    if (occ && occ.points && occ.points.pick) {
      var sopts = occ.points.pick.keys.map(function (k) {
        var nm = root.I18n ? root.I18n.abilityName("coc", { key: k }) : k;
        return '<option value="' + esc(k) + '"' + (k === bs.coc.secondAbility ? " selected" : "") + ">" + esc(nm) + "</option>";
      }).join("");
      h.push('<label class="bld-field">' + lbl(t("build.secondAbility")) + '<select class="input" data-bi="coc.second" data-kind="text"><option value="">' + esc(t("build.auto")) + "</option>" + sopts + "</select></label>");
    }
    h.push("</div>");

    if (bs.coc.occupationKey === "custom") {
      h.push('<div class="bld-grid bld-grid-tight">');
      h.push('<label class="bld-field grow">' + lbl(t("build.customName")) + textInput("coc.customName", bs.coc.customName) + "</label>");
      h.push('<label class="bld-field">' + lbl(t("build.creditMin")) + numInput("coc.customMin", bs.coc.customMin, 0, 99) + "</label>");
      h.push('<label class="bld-field">' + lbl(t("build.creditMax")) + numInput("coc.customMax", bs.coc.customMax, 0, 99) + "</label>");
      h.push("</div>");
      h.push('<div class="bld-grid bld-grid-tight"><label class="bld-field grow">' + lbl(t("build.addSkill")) +
        '<select class="input" id="coc-custom-pick">' + cocSkillItems().map(function (it) {
          return '<option value="' + esc(it.field) + '">' + esc(root.I18n ? root.I18n.skillName("coc", it) : it.field) + "</option>";
        }).join("") + "</select></label>" +
        '<div class="bld-field"><span class="bld-label">&nbsp;</span><button class="btn small" data-act="coc-add-skill" type="button">' +
        esc(t("build.add")) + "</button></div></div>");
      if (bs.coc.extraSkills.length) {
        h.push('<div class="save-row">' + bs.coc.extraSkills.map(function (f) {
          var nm = root.I18n ? root.I18n.skillName("coc", { field: f }) : f;
          return '<span class="pill">' + esc(nm) + ' <button class="pill-x" data-act="coc-del-skill" data-field="' + esc(f) + '" type="button">&times;</button></span>';
        }).join("") + "</div>");
      }
    }

    var occLeft = p.occPoints - sp.occSpent;
    var intLeft = p.interestPoints - sp.intSpent;
    var crMin = occ ? occ.credit[0] : 0, crMax = occ ? occ.credit[1] : 99;
    var crVal = (bs.coc.occSpend.credit_rating || 0) + cocBase("credit_rating", bs.coc.chars);
    var crBad = crVal < crMin || crVal > crMax;

    h.push('<div class="pool-grid">');
    h.push('<div class="pool' + (occLeft < 0 ? " over" : "") + '"><div class="pool-top"><span>' + esc(t("build.occPoints")) +
      "</span><strong>" + sp.occSpent + " / " + p.occPoints + "</strong></div>" + bar(sp.occSpent, p.occPoints) +
      '<div class="pool-foot">' + esc(t("build.occLeft")) + ": " + occLeft + "</div></div>");
    h.push('<div class="pool' + (intLeft < 0 ? " over" : "") + '"><div class="pool-top"><span>' + esc(t("build.interestPoints")) +
      "</span><strong>" + sp.intSpent + " / " + p.interestPoints + "</strong></div>" + bar(sp.intSpent, p.interestPoints) +
      '<div class="pool-foot">' + esc(t("build.interestLeft")) + ": " + intLeft + "</div></div>");
    h.push('<div class="pool' + (crBad ? " over" : "") + '"><div class="pool-top"><span>' + esc(t("build.credit")) +
      "</span><strong>" + crVal + "</strong></div><div class=\"pool-foot\">" + crMin + "–" + crMax + "</div></div>");
    h.push("</div>");
    return h.join("");
  }

  function renderCoc() {
    var d = cocDerivedNow();
    var h = [];
    h.push('<div class="bld-card">' + cardHead("user", t("section.characteristics")));
    h.push(cocCharGrid(d));
    h.push('<div class="sub-title">' + ico("chart") + esc(t("build.derived")) + "</div>");
    h.push(cocStats(d));
    h.push("</div>");

    if (bs.mode === "rules") {
      h.push('<div class="bld-card">' + cardHead("spark", t("detail.occupation")) + cocOccupationPanel() + "</div>");
    }
    h.push('<div class="bld-card">' + cardHead("list", t("build.skills")) + cocSkillsTable() + "</div>");
    return h.join("");
  }

  /* ---------------- render root ---------------- */

  function render() {
    var h = [hero(), setupCard()];
    h.push(bs.system === "dnd" ? renderDnd() : renderCoc());
    h.push('<div class="bld-actions"><button class="btn primary bld-create" data-act="create" type="button">' +
      ico("spark") + esc(t("build.create")) + '</button><div class="status" id="build-status"></div></div>');
    return h.join("");
  }

  function rerender() {
    var view = document.getElementById("view-create");
    if (!view) return;
    var active = document.activeElement;
    var key = active && active.getAttribute ? active.getAttribute("data-bi") : null;
    var selStart = null, selEnd = null;
    if (key && active && typeof active.selectionStart === "number") {
      try { selStart = active.selectionStart; selEnd = active.selectionEnd; } catch (e) {}
    }
    view.innerHTML = render();
    if (key) {
      var esc2 = key.replace(/["\\]/g, "\\$&");
      var el = view.querySelector('[data-bi="' + esc2 + '"]');
      if (el && el.focus) {
        el.focus();
        if (selStart !== null && el.setSelectionRange) { try { el.setSelectionRange(selStart, selEnd); } catch (e) {} }
      }
    }
  }

  function setBi(bi, val) {
    if (bi === "name") { bs.name = val; return; }
    var p = bi.split(".");
    if (p[0] === "dnd") {
      if (p.length === 3 && p[1] === "score") { bs.dnd.scores[p[2]] = val; return; }
      if (p.length === 3 && p[1] === "array") { bs.dnd.scores[p[2]] = val; return; }
      if (p.length === 3 && p[1] === "skill") {
        var f = p[2], i = bs.dnd.skillProfs.indexOf(f);
        if (val) { if (i < 0) bs.dnd.skillProfs.push(f); }
        else if (i >= 0) bs.dnd.skillProfs.splice(i, 1);
        return;
      }
      if (p.length === 2) {
        if (p[1] === "classKey") { bs.dnd.classKey = val; bs.dnd.skillProfs = []; return; }
        bs.dnd[p[1]] = val; return;
      }
      return;
    }
    if (p[0] === "coc") {
      if (p.length === 3 && p[1] === "char") { bs.coc.chars[p[2]] = val; return; }
      if (p.length === 3 && p[1] === "occ") { bs.coc.occSpend[p[2]] = val === null ? 0 : val; return; }
      if (p.length === 3 && p[1] === "int") { bs.coc.interestSpend[p[2]] = val === null ? 0 : val; return; }
      if (p.length === 3 && p[1] === "free") { bs.coc.free[p[2]] = val; return; }
      if (p.length === 2) {
        if (p[1] === "occ") { bs.coc.occupationKey = val; bs.coc.secondAbility = ""; bs.coc.occSpend = {}; return; }
        bs.coc[p[1]] = val; return;
      }
      return;
    }
  }

  function pbStep(key, delta) {
    var v = intOrNull(bs.dnd.scores[key]);
    if (v === null) v = 8;
    var nv = v + delta;
    if (nv < 8 || nv > 15) return;
    if (delta > 0) {
      var spent = R.pointBuySpent(bs.dnd.scores);
      var next = spent - (R.pointBuyCost(v) || 0) + (R.pointBuyCost(nv) || 0);
      if (next > R.POINT_BUY_TOTAL) return;
    }
    bs.dnd.scores[key] = nv;
  }

  /* ---------------- events ---------------- */

  function onInput(e) {
    var el = e.target.closest("[data-bi]");
    if (!el) return;
    var bi = el.getAttribute("data-bi");
    var kind = el.getAttribute("data-kind");
    var val;
    if (kind === "bool") val = el.checked;
    else if (kind === "int") val = el.value === "" ? null : intOrNull(el.value);
    else val = el.value;
    setBi(bi, val);
    rerender();
  }

  function rollDnd() {
    var vals = [];
    for (var i = 0; i < 6; i++) vals.push(R.roll4d6DropLowest());
    vals.sort(function (a, b) { return b - a; });
    R.ABILITY_KEYS.forEach(function (k, i) { bs.dnd.scores[k] = vals[i]; });
  }

  function rollCocAll() {
    R.COC_CHAR_KEYS.forEach(function (k) { bs.coc.chars[k] = R.rollCocCharacteristic(k); });
    if (bs.coc.luck == null) bs.coc.luck = R.roll3d6x5();
  }

  function onClick(e) {
    var el = e.target.closest("[data-act]");
    if (!el) return;
    var act = el.getAttribute("data-act");
    if (act === "seg") {
      var seg = el.getAttribute("data-seg"), val = el.getAttribute("data-val");
      if (seg === "system") bs.system = val;
      else if (seg === "mode") bs.mode = val;
      else if (seg === "method") bs.dnd.method = val;
      rerender();
      return;
    }
    if (act === "reset") { bs = freshState(); rerender(); return; }
    if (act === "create") { create(); return; }
    if (act === "dnd-roll4d6") { rollDnd(); rerender(); return; }
    if (act === "pb-step") { pbStep(el.getAttribute("data-key"), parseInt(el.getAttribute("data-delta"), 10) || 0); rerender(); return; }
    if (act === "coc-roll-all") { rollCocAll(); rerender(); return; }
    if (act === "coc-roll") { bs.coc.chars[el.getAttribute("data-key")] = R.rollCocCharacteristic(el.getAttribute("data-key")); rerender(); return; }
    if (act === "coc-roll-luck") { bs.coc.luck = R.roll3d6x5(); rerender(); return; }
    if (act === "coc-add-skill") {
      var pick = document.getElementById("coc-custom-pick");
      if (pick && pick.value && bs.coc.extraSkills.indexOf(pick.value) < 0) bs.coc.extraSkills.push(pick.value);
      rerender();
      return;
    }
    if (act === "coc-del-skill") {
      var f = el.getAttribute("data-field");
      bs.coc.extraSkills = bs.coc.extraSkills.filter(function (x) { return x !== f; });
      delete bs.coc.occSpend[f];
      rerender();
      return;
    }
  }

  /* ---------------- creation ---------------- */

  function setStatus(msg, kind) {
    var el = document.getElementById("build-status");
    if (!el) return;
    el.textContent = msg || "";
    el.className = "status " + (kind || "");
  }

  function buildDndSheet() {
    var c = classByKey(bs.dnd.classKey);
    if (!c && bs.mode === "rules") return { error: t("build.errNoClass") };
    var spent = R.pointBuySpent(bs.dnd.scores);
    if (bs.mode === "rules" && bs.dnd.method === "pointbuy") {
      var bad = R.ABILITY_KEYS.some(function (k) {
        var n = intOrNull(bs.dnd.scores[k]);
        return n === null || n < 8 || n > 15;
      });
      if (bad) return { error: t("build.errRange") };
      if (spent > R.POINT_BUY_TOTAL) return { error: t("build.errPoints", { n: spent, max: R.POINT_BUY_TOTAL }) };
    } else if (bs.mode === "rules" && bs.dnd.method === "array") {
      if (!R.classifyArray(bs.dnd.scores)) return { error: t("build.errArray") };
    }
    if (bs.mode === "rules" && c && bs.dnd.skillProfs.length > c.skillCount) return { error: t("build.errSkillCount", { n: c.skillCount }) };

    var d = R.dndDerived({
      level: bs.dnd.level, classKey: bs.dnd.classKey, scores: bs.dnd.scores,
      saveProfs: c ? c.saves : [], skillProfs: bs.mode === "rules" ? bs.dnd.skillProfs : [],
      hitDie: c ? c.hitDie : 8,
      speed: bs.dnd.speed, acOverride: bs.dnd.ac, hpOverride: bs.dnd.hp
    });
    var data = root.SheetMapper.blankSheet("dnd").data;
    data.abilities.forEach(function (a) { a.score = intOrNull(bs.dnd.scores[a.key]); a.mod = d.mods[a.key]; });
    data.saves.forEach(function (s) { s.bonus = d.saveBonus[s.ability]; });
    data.skills.forEach(function (s) { s.bonus = d.skillBonus[s.field]; });
    data.profBonus = d.profBonus;
    data.ac = d.ac;
    data.initiative = d.initiative;
    data.speed = String(d.speed);
    data.hp = { max: d.hpMax, current: d.hpMax, temp: null };
    data.hitDice = d.hitDice;
    data.passive = d.passive;
    data.spell = d.spell;
    data.details.classLevel = c ? (nameOf(c) + " " + d.level) : (d.level ? ("Lv " + d.level) : "");
    data.details.race = bs.dnd.race || "";
    data.name = bs.name;
    return { data: data };
  }

  function buildCocSheet() {
    var occ = activeOccupation();
    var missing = R.COC_CHAR_KEYS.some(function (k) { return intOrNull(bs.coc.chars[k]) === null; });
    if (missing) return { error: t("build.errChars") };

    var d = R.cocDerived(bs.coc.chars);
    var data = root.SheetMapper.blankSheet("coc").data;
    data.characteristics.forEach(function (ch) {
      ch.value = intOrNull(bs.coc.chars[ch.key]);
      ch.half = d.half[ch.key];
      ch.fifth = d.fifth[ch.key];
    });

    var occSet = cocOccSkillSet();
    data.skills.forEach(function (s) {
      var base = cocBase(s.field, bs.coc.chars);
      var val;
      if (bs.mode === "free") {
        var fv = bs.coc.free[s.field];
        val = fv == null ? base : (Number(fv) || 0);
      } else {
        var allowed = s.field === "credit_rating" || occSet[s.field];
        var occVal = allowed ? (Number(bs.coc.occSpend[s.field]) || 0) : 0;
        var intVal = s.field === "cthulhu_mythos" ? 0 : (Number(bs.coc.interestSpend[s.field]) || 0);
        val = base + occVal + intVal;
      }
      s.value = val;
      s.half = Math.floor(val / 2);
      s.fifth = Math.floor(val / 5);
    });

    if (bs.mode === "rules") {
      var p = cocPoints();
      var sp = cocSpent();
      if (sp.occSpent > p.occPoints) return { error: t("build.errOccPoints", { n: sp.occSpent - p.occPoints }) };
      if (sp.intSpent > p.interestPoints) return { error: t("build.errIntPoints", { n: sp.intSpent - p.interestPoints }) };
      var crMin = occ ? occ.credit[0] : 0, crMax = occ ? occ.credit[1] : 99;
      var crVal = cocBase("credit_rating", bs.coc.chars) + (Number(bs.coc.occSpend.credit_rating) || 0);
      if (crVal < crMin || crVal > crMax) return { error: t("build.errCredit", { val: crVal, min: crMin, max: crMax }) };
    }

    var a = data.attributes;
    a.hpMax = d.hpMax; a.hpCurrent = d.hpMax;
    a.mpMax = d.mpMax; a.mpCurrent = d.mpMax;
    var luck = intOrNull(bs.coc.luck);
    a.luckStart = luck; a.luck = luck;
    a.sanityStart = d.sanity; a.sanity = d.sanity; a.sanityMax = d.sanityMax;
    a.move = d.move; a.build = d.build; a.damageBonus = d.damageBonus;
    data.details.occupation = nameOf(occ);
    data.details.age = bs.coc.age || "";
    data.name = bs.name;
    return { data: data };
  }

  function create() {
    var name = String(bs.name || "").trim();
    if (!name) { setStatus(t("build.errName"), "err"); return; }
    var res = bs.system === "dnd" ? buildDndSheet() : buildCocSheet();
    if (res.error) { setStatus(res.error, "err"); return; }

    var sheet = root.SheetMapper.blankSheet(bs.system, { name: name });
    sheet.data = res.data;
    sheet.name = name;
    sheet.data.name = name;
    root.Store.add(sheet);

    setStatus(t("build.created"), "ok");
    if (root.Dice2App) {
      root.Dice2App.refresh();
      root.Dice2App.selectSheet(sheet.id);
      root.Dice2App.showView("roll");
    }
  }

  /* ---------------- bootstrap ---------------- */

  function init() {
    var view = document.getElementById("view-create");
    if (!view || !R) return;
    view.addEventListener("input", onInput);
    view.addEventListener("change", onInput);
    view.addEventListener("click", onClick);
    if (root.I18n && root.I18n.onChange) root.I18n.onChange(rerender);
    rerender();
  }

  root.Builder = { render: rerender, state: function () { return bs; } };

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})(window);
