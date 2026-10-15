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

  function clampScore(v, min, max) {
    var n = intOrNull(v);
    if (n === null) return null;
    return Math.max(min, Math.min(max, n));
  }

  function classByKey(key) { return R.classByKey(key); }

  function csb(field, chars) {
    if (field === "dodge") return Math.floor((Number(chars.dex) || 0) / 2);
    if (field === "language_own") return Number(chars.edu) || 0;
    return (root.SheetMapper && root.SheetMapper.cocSkillBase ? root.SheetMapper.cocSkillBase[field] : 0) || 0;
  }

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
        extraSkills: []
      }
    };
  }

  var bs = freshState();

  function activeOccupation() {
    if (bs.coc.occupationKey === "custom") {
      return {
        key: "custom",
        pt: bs.coc.customName || "Personalizada",
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
    var tpl = root.SheetMapper.blankSheet("coc").data.skills;
    return tpl;
  }

  function cocBase(field, chars) { return csb(field, chars); }

  /* ---------------- helpers for markup ---------------- */

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

  function derivedCell(label, value) {
    return '<div class="derived-cell"><span class="dk">' + esc(label) + "</span><span class=\"dv\">" + esc(value) + "</span></div>";
  }

  /* ---------------- render: shared header ---------------- */

  function segBtn(seg, val, label, active) {
    return '<button class="seg-btn' + (active ? " active" : "") + '" data-act="seg" data-seg="' + esc(seg) +
      '" data-val="' + esc(val) + '" type="button">' + esc(label) + "</button>";
  }

  function header() {
    var h = [];
    h.push('<div class="panel">');
    h.push('<div class="panel-head"><h2>' + esc(t("build.title")) + "</h2>");
    h.push('<button class="btn small ghost" data-act="reset" type="button">' + esc(t("build.reset")) + "</button></div>");
    h.push('<p class="muted">' + esc(bs.mode === "rules" ? t("build.descRules") : t("build.descFree")) + "</p>");
    h.push('<div class="builder-controls">');
    h.push('<div class="bld-field">' + lbl(t("build.system")) + '<div class="seg">' +
      segBtn("system", "dnd", "D&D 5e", bs.system === "dnd") +
      segBtn("system", "coc", "CoC 7e", bs.system === "coc") + "</div></div>");
    h.push('<div class="bld-field">' + lbl(t("build.mode")) + '<div class="seg">' +
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

  function dndDerivedBox(d) {
    var h = ['<div class="section-title">' + esc(t("build.derived")) + '</div><div class="derived-grid">'];
    h.push(derivedCell(t("vital.prof"), signed(d.profBonus)));
    h.push(derivedCell(t("vital.hpMax"), d.hpMax));
    h.push(derivedCell(t("vital.ac"), d.ac));
    h.push(derivedCell(t("roll.initiative"), signed(d.initiative)));
    h.push(derivedCell(t("vital.passive"), d.passive));
    h.push(derivedCell(t("vital.speed"), d.speed));
    if (d.spell) {
      h.push(derivedCell(t("vital.spellDC"), d.spell.saveDC));
      h.push(derivedCell(t("vital.spellAtk"), signed(d.spell.atkBonus)));
    }
    h.push("</div>");
    return h.join("");
  }

  function dndScoreRow(d, k, input) {
    var ab = R.ABILITY_NAMES[k];
    var mod = d.mods[k];
    return '<div class="score-row"><span class="score-abbr">' + esc(k) + '</span>' +
      '<span class="score-name">' + esc(lang() === "en" ? ab.en : ab.pt) + "</span>" +
      input +
      '<span class="score-mod">' + signed(mod) + "</span>" +
      '<span class="score-hint">' + esc(t("build.mod")) + "</span></div>";
  }

  function dndScores(d) {
    var h = [];
    if (bs.mode === "free") {
      h.push('<div class="section-title">' + esc(t("build.scores")) + "</div>");
      R.ABILITY_KEYS.forEach(function (k) {
        h.push(dndScoreRow(d, k, numInput("dnd.score." + k, bs.dnd.scores[k], 3, 30)));
      });
      return h.join("");
    }
    h.push('<div class="bld-field" style="margin-bottom:8px">' + lbl(t("build.method")) + '<div class="seg">' +
      segBtn("method", "pointbuy", t("build.pointBuy"), bs.dnd.method === "pointbuy") +
      segBtn("method", "array", t("build.array"), bs.dnd.method === "array") +
      segBtn("method", "roll", t("build.roll"), bs.dnd.method === "roll") + "</div></div>");

    if (bs.dnd.method === "array") {
      R.ABILITY_KEYS.forEach(function (k) {
        var opts = R.STANDARD_ARRAY.map(function (v) {
          return '<option value="' + v + '"' + (Number(bs.dnd.scores[k]) === v ? " selected" : "") + ">" + v + "</option>";
        }).join("");
        var input = '<select class="input bld-num" data-bi="dnd.array.' + k + '" data-kind="text"><option value="">—</option>' + opts + "</select>";
        h.push(dndScoreRow(d, k, input));
      });
    } else if (bs.dnd.method === "roll") {
      h.push('<div class="row"><button class="btn small" data-act="dnd-roll4d6" type="button">' + esc(t("build.roll4d6")) + "</button></div>");
      R.ABILITY_KEYS.forEach(function (k) {
        h.push(dndScoreRow(d, k, numInput("dnd.score." + k, bs.dnd.scores[k], 3, 30)));
      });
    } else {
      R.ABILITY_KEYS.forEach(function (k) {
        var input = numInput("dnd.score." + k, bs.dnd.scores[k], 8, 15);
        h.push(dndScoreRow(d, k, input));
      });
      var spent = R.pointBuySpent(bs.dnd.scores);
      var left = R.POINT_BUY_TOTAL - spent;
      h.push('<div class="pb-summary ' + (left < 0 ? "over" : "") + '">' +
        esc(t("build.pointsLeft")) + ": <strong>" + left + "</strong> / " + R.POINT_BUY_TOTAL +
        " &middot; " + esc(t("build.pointsSpent")) + ": " + spent + "</div>");
    }
    return h.join("");
  }

  function dndSkillPicker() {
    var c = classByKey(bs.dnd.classKey);
    if (!c) return "";
    var h = ['<div class="section-title">' + esc(t("build.skillProfs", { n: c.skillCount })) +
      ' <span class="muted">(' + bs.dnd.skillProfs.length + "/" + c.skillCount + ")</span></div>"];
    h.push('<div class="chk-grid">');
    c.skills.forEach(function (field) {
      var checked = bs.dnd.skillProfs.indexOf(field) >= 0;
      var nm = root.I18n ? root.I18n.skillName("dnd", { field: field }) : field;
      var ab = R.DND_SKILL_ABILITIES[field];
      h.push('<label class="chk"><input type="checkbox" data-bi="dnd.skill.' + field + '" data-kind="bool"' +
        (checked ? " checked" : "") + '><span>' + esc(nm) + ' <em>(' + esc(ab) + ")</em></span></label>");
    });
    h.push("</div>");
    h.push('<div class="section-title">' + esc(t("build.saves")) + '</div><div class="row">' +
      c.saves.map(function (k) { return '<span class="pill">' + esc(k) + "</span>"; }).join("") + "</div>");
    return h.join("");
  }

  function renderDnd() {
    var d = dndDerivedNow();
    var h = [];
    h.push('<div class="panel">');
    h.push('<div class="section-title">' + esc(t("build.identity")) + '</div><div class="builder-controls">');
    var classOpts = '<option value=""' + (!bs.dnd.classKey ? " selected" : "") + ">—</option>" +
      R.DND_CLASSES.map(function (c) {
        return '<option value="' + esc(c.key) + '"' + (c.key === bs.dnd.classKey ? " selected" : "") + ">" + esc(nameOf(c)) + "</option>";
      }).join("");
    h.push('<label class="bld-field">' + lbl(t("build.class")) + '<select class="input" data-bi="dnd.classKey" data-kind="text">' + classOpts + "</select></label>");
    h.push('<label class="bld-field">' + lbl(t("build.level")) + numInput("dnd.level", bs.dnd.level, 1, 20) + "</label>");
    h.push('<label class="bld-field grow">' + lbl(t("detail.race")) + textInput("dnd.race", bs.dnd.race) + "</label>");
    h.push("</div></div>");

    h.push('<div class="panel">');
    h.push(dndScores(d));
    h.push('<div class="section-title">' + esc(t("build.overrides")) + '</div><div class="builder-controls">');
    h.push('<label class="bld-field">' + lbl(t("vital.speed")) + numInput("dnd.speed", bs.dnd.speed, 0, 200) + "</label>");
    h.push('<label class="bld-field">' + lbl(t("build.acOptional")) + numInput("dnd.ac", bs.dnd.ac, 0, 40) + "</label>");
    h.push('<label class="bld-field">' + lbl(t("build.hpOptional")) + numInput("dnd.hp", bs.dnd.hp, 1, 999) + "</label>");
    h.push("</div>");
    h.push(dndDerivedBox(d));
    h.push("</div>");

    if (bs.mode === "rules") {
      h.push('<div class="panel">' + dndSkillPicker() + "</div>");
    }
    return h.join("");
  }

  /* ---------------- Call of Cthulhu ---------------- */

  function cocChars() { return bs.coc.chars; }

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

  function cocDerivedBox(d) {
    var h = ['<div class="section-title">' + esc(t("build.derived")) + '</div><div class="derived-grid">'];
    h.push(derivedCell(t("vital.hpMax"), d.hpMax));
    h.push(derivedCell(t("vital.mpCurrent"), d.mpMax));
    h.push(derivedCell(t("vital.move"), d.move));
    h.push(derivedCell(t("vital.build"), d.build));
    h.push(derivedCell(t("vital.db"), d.damageBonus));
    h.push(derivedCell(t("vital.sanity"), d.sanity));
    h.push("</div>");
    return h.join("");
  }

  function cocCharGrid(d) {
    var h = ['<div class="section-title">' + esc(t("section.characteristics")) + "</div>"];
    if (bs.mode === "rules") {
      h.push('<div class="row"><button class="btn small" data-act="coc-roll-all" type="button">' + esc(t("build.rollAll")) + "</button></div>");
    }
    h.push('<div class="char-grid">');
    R.COC_CHAR_KEYS.forEach(function (k) {
      var nm = root.I18n ? root.I18n.abilityName("coc", { key: k }) : k;
      var abbr = root.SheetMapper ? root.SheetMapper.abbrFor("coc", k) : k.toUpperCase();
      var rollBtn = bs.mode === "rules"
        ? '<button class="btn tiny" data-act="coc-roll" data-key="' + esc(k) + '" type="button">' + esc(t("build.roll")) + "</button>"
        : "";
      h.push('<div class="char-cell"><div class="cc-head"><span class="cc-abbr">' + esc(abbr) + '</span><span class="cc-name">' + esc(nm) + "</span></div>" +
        numInput("coc.char." + k, bs.coc.chars[k], 0, 99) +
        '<div class="cc-derived"><span>' + esc(t("roll.half")) + " " + (d.half[k] == null ? "—" : d.half[k]) + "</span>" +
        "<span>" + esc(t("roll.fifth")) + " " + (d.fifth[k] == null ? "—" : d.fifth[k]) + "</span></div>" +
        rollBtn + "</div>");
    });
    h.push("</div>");
    var luckRoll = bs.mode === "rules"
      ? '<button class="btn small" data-act="coc-roll-luck" type="button">' + esc(t("build.roll")) + "</button>" : "";
    h.push('<div class="builder-controls"><label class="bld-field">' + lbl(t("vital.luck")) + numInput("coc.luck", bs.coc.luck, 0, 99) + "</label>" +
      '<label class="bld-field">' + lbl(t("detail.age")) + textInput("coc.age", bs.coc.age) + "</label>" + luckRoll + "</div>");
    return h.join("");
  }

  function cocSkillRow(item, d, occSet, occAllowed) {
    var field = item.field;
    var base = cocBase(field, bs.coc.chars);
    var nm = root.I18n ? root.I18n.skillName("coc", item) : field;
    var occVal = bs.coc.occSpend[field] || 0;
    var intVal = bs.coc.interestSpend[field] || 0;
    var total;
    var inputs;
    if (bs.mode === "free") {
      var fv = bs.coc.free[field];
      total = fv == null ? base : Number(fv) || 0;
      inputs = '<input class="input bld-num" type="number" min="0" max="99" data-bi="coc.free.' + esc(field) + '" data-kind="int" value="' + esc(fv == null ? "" : fv) + '" placeholder="' + base + '">';
    } else {
      total = base + occVal + intVal;
      var occDisabled = (field === "credit_rating" || occAllowed) ? "" : ' disabled';
      var intDisabled = field === "cthulhu_mythos" ? ' disabled' : "";
      inputs = '<input class="input bld-num" type="number" min="0" max="99" data-bi="coc.occ.' + esc(field) + '" data-kind="int" value="' + (occVal || "") + '"' + occDisabled + ">" +
        '<input class="input bld-num" type="number" min="0" max="99" data-bi="coc.int.' + esc(field) + '" data-kind="int" value="' + (intVal || "") + '"' + intDisabled + ">";
    }
    var half = Math.floor(total / 2), fifth = Math.floor(total / 5);
    return '<tr class="' + (occAllowed && field !== "credit_rating" ? "occ-row" : "") + '">' +
      '<td class="sk-name">' + esc(nm) + "</td>" +
      '<td class="sk-base">' + base + "</td>" +
      '<td class="sk-in">' + inputs + "</td>" +
      '<td class="sk-total"><strong>' + total + '</strong></td>' +
      '<td class="sk-half">' + half + " / " + fifth + "</td></tr>";
  }

  function cocSkillsTable(d) {
    var occSet = cocOccSkillSet();
    var items = cocSkillItems();
    var h = [];
    h.push('<div class="section-title">' + esc(t("build.skills")) + '</div>');
    h.push('<div class="skill-table-wrap"><table class="skill-table"><thead><tr>' +
      "<th>" + esc(t("section.skills")) + "</th><th>" + esc(t("build.base")) + "</th>" +
      "<th>" + esc(bs.mode === "free" ? t("build.value") : t("build.occShort")) + "</th>" +
      (bs.mode === "free" ? "" : "<th>" + esc(t("build.intShort")) + "</th>") +
      "<th>" + esc(t("build.total")) + "</th><th>" + esc(t("roll.half")) + " / " + esc(t("roll.fifth")) + "</th>" +
      "</tr></thead><tbody>");
    items.forEach(function (item) {
      var occAllowed = item.field === "credit_rating" || !!occSet[item.field];
      h.push(cocSkillRow(item, d, occSet, occAllowed));
    });
    h.push("</tbody></table></div>");
    return h.join("");
  }

  function cocOccupationPanel() {
    var p = cocPoints();
    var sp = cocSpent();
    var occ = p.occ;
    var h = [];
    h.push('<div class="section-title">' + esc(t("detail.occupation")) + '</div><div class="builder-controls">');
    var opts = R.COC_OCCUPATIONS.map(function (o) {
      return '<option value="' + esc(o.key) + '"' + (o.key === bs.coc.occupationKey ? " selected" : "") + ">" +
        esc(nameOf(o)) + " (" + o.credit[0] + "–" + o.credit[1] + "%)</option>";
    }).join("");
    opts += '<option value="custom"' + (bs.coc.occupationKey === "custom" ? " selected" : "") + ">" + esc(t("build.customOcc")) + "</option>";
    h.push('<label class="bld-field grow">' + lbl(t("detail.occupation")) + '<select class="input" data-bi="coc.occ" data-kind="text">' + opts + "</select></label>");
    if (occ && occ.points && occ.points.pick) {
      var psc = occ.points.pick;
      var sopts = psc.keys.map(function (k) {
        var nm = root.I18n ? root.I18n.abilityName("coc", { key: k }) : k;
        return '<option value="' + esc(k) + '"' + (k === bs.coc.secondAbility ? " selected" : "") + ">" + esc(nm) + "</option>";
      }).join("");
      h.push('<label class="bld-field">' + lbl(t("build.secondAbility")) + '<select class="input" data-bi="coc.second" data-kind="text"><option value="">' + esc(t("build.auto")) + "</option>" + sopts + "</select></label>");
    }
    h.push("</div>");

    if (bs.coc.occupationKey === "custom") {
      h.push('<div class="builder-controls">');
      h.push('<label class="bld-field grow">' + lbl(t("build.customName")) + textInput("coc.customName", bs.coc.customName) + "</label>");
      h.push('<label class="bld-field">' + lbl(t("build.creditMin")) + numInput("coc.customMin", bs.coc.customMin, 0, 99) + "</label>");
      h.push('<label class="bld-field">' + lbl(t("build.creditMax")) + numInput("coc.customMax", bs.coc.customMax, 0, 99) + "</label>");
      h.push("</div>");
      h.push('<div class="builder-controls"><label class="bld-field grow">' + lbl(t("build.addSkill")) +
        '<select class="input" id="coc-custom-pick">' + cocSkillItems().map(function (it) {
          return '<option value="' + esc(it.field) + '">' + esc(root.I18n ? root.I18n.skillName("coc", it) : it.field) + "</option>";
        }).join("") + "</select></label>" +
        '<button class="btn small" data-act="coc-add-skill" type="button">' + esc(t("build.add")) + "</button></div>");
      if (bs.coc.extraSkills.length) {
        h.push('<div class="row">' + bs.coc.extraSkills.map(function (f) {
          var nm = root.I18n ? root.I18n.skillName("coc", { field: f }) : f;
          return '<span class="pill">' + esc(nm) + ' <button class="pill-x" data-act="coc-del-skill" data-field="' + esc(f) + '" type="button">×</button></span>';
        }).join("") + "</div>");
      }
    }

    var occLeft = p.occPoints - sp.occSpent;
    var intLeft = p.interestPoints - sp.intSpent;
    var crMin = occ ? occ.credit[0] : 0, crMax = occ ? occ.credit[1] : 99;
    var crVal = (bs.coc.occSpend.credit_rating || 0) + cocBase("credit_rating", bs.coc.chars);
    h.push('<div class="derived-grid">');
    h.push(derivedCell(t("build.occPoints"), p.occPoints));
    h.push(derivedCell(t("build.occLeft"), occLeft));
    h.push(derivedCell(t("build.interestPoints"), p.interestPoints));
    h.push(derivedCell(t("build.interestLeft"), intLeft));
    h.push(derivedCell(t("vital.db") + " " + t("build.credit"), crVal + " (" + crMin + "–" + crMax + ")"));
    h.push("</div>");
    return h.join("");
  }

  function renderCoc() {
    var d = cocDerivedNow();
    var h = [];
    h.push('<div class="panel">');
    h.push(cocCharGrid(d));
    h.push(cocDerivedBox(d));
    h.push("</div>");
    h.push('<div class="panel">');
    if (bs.mode === "rules") h.push(cocOccupationPanel());
    h.push(cocSkillsTable(d));
    h.push("</div>");
    return h.join("");
  }

  /* ---------------- render root ---------------- */

  function render() {
    var h = [header()];
    h.push(bs.system === "dnd" ? renderDnd() : renderCoc());
    h.push('<div class="panel"><div class="row"><button class="btn primary" data-act="create" type="button">' +
      esc(t("build.create")) + '</button></div><div class="status" id="build-status"></div></div>');
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
