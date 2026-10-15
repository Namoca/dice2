(function () {
  "use strict";

  var HISTORY_KEY = "dice2.history.v1";
  var SELECTED_KEY = "dice2.selected.v1";
  var THEME_KEY = "dice2.theme.v1";

  var state = {
    sheets: [],
    selectedId: null,
    difficulty: "regular",
    advantage: "normal",
    editMode: false,
    history: [],
    lastDescriptor: null,
    lastActions: [],
    lastContext: null
  };

  /* ---------------- helpers ---------------- */

  function t(key, vars) { return I18n.t(key, vars); }

  function esc(s) {
    return String(s === null || s === undefined ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }

  function multiline(s) {
    return esc(s).replace(/(\r\n|\r|\n)/g, "<br>");
  }

  function signed(n) {
    return (n >= 0 ? "+" : "") + n;
  }

  function systemLabel(sys) {
    return sys === "dnd" ? "D&D 5e" : sys === "coc" ? "Call of Cthulhu 7e" : sys;
  }

  function setPath(obj, path, value) {
    var parts = path.split(".");
    var o = obj;
    for (var i = 0; i < parts.length - 1; i++) o = o[parts[i]];
    o[parts[parts.length - 1]] = value;
  }

  function currentSheet() {
    return state.sheets.filter(function (s) { return s.id === state.selectedId; })[0] || null;
  }

  function norm(s) {
    return String(s == null ? "" : s).toLowerCase()
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
  }

  /* ---------------- searchable roll index ---------------- */

  function groupTone(g) { return I18n.toneFor(g); }

  function dndIndex(sheet) {
    var d = sheet.data;
    var items = [];
    d.abilities.forEach(function (a) {
      var nm = I18n.abilityName("dnd", a);
      items.push({
        name: nm, alt: a.name, group: "attr", act: "dnd-check", system: "dnd",
        label: t("roll.testOf", { name: nm }), bonus: a.mod || 0,
        sub: "d20 " + signed(a.mod || 0) + " · " + t("roll.subValue") + " " + (a.score == null ? "—" : a.score)
      });
    });
    var dexMod = (d.abilities.filter(function (a) { return a.key === "DES"; })[0] || {}).mod || 0;
    items.push({
      name: t("roll.initiative"), group: "init", act: "dnd-check", system: "dnd",
      label: t("roll.initiative"), bonus: dexMod, sub: "d20 " + signed(dexMod)
    });
    d.saves.forEach(function (s) {
      var savNm = I18n.abilityName("dnd", { key: s.ability, name: s.name });
      items.push({
        name: savNm, alt: s.name, group: "save", act: "dnd-check", system: "dnd",
        label: t("roll.saveOf", { name: savNm }), bonus: s.bonus || 0,
        sub: "d20 " + signed(s.bonus || 0)
      });
    });
    d.skills.forEach(function (s) {
      var nm = I18n.skillName("dnd", s);
      items.push({
        name: nm, alt: s.name, group: "skill", act: "dnd-check", system: "dnd",
        label: t("roll.skillOf", { name: nm }), bonus: s.bonus || 0,
        sub: "d20 " + signed(s.bonus || 0) + (s.ability ? " · " + s.ability : "")
      });
    });
    d.weapons.forEach(function (w) {
      var atk = parseInt(String(w.atk).replace(/[^\-0-9]/g, ""), 10);
      atk = isNaN(atk) ? 0 : atk;
      items.push({
        name: w.name, group: "attack", act: "dnd-attack", system: "dnd",
        label: t("roll.attackOf", { name: w.name }), bonus: atk, damage: w.damage,
        sub: t("roll.subAttack") + " d20 " + signed(atk)
      });
      var expr = damageExpr(w.damage);
      if (expr) {
        items.push({
          name: w.name + " (" + t("roll.subDamage") + ")", group: "damage", act: "expr", system: "dnd",
          label: t("roll.damageOf", { name: w.name }), expr: expr,
          sub: t("roll.subDamage") + " " + expr
        });
      }
    });
    if (d.spell && d.spell.atkBonus != null) {
      items.push({
        name: t("roll.magicAttack"), group: "magic", act: "dnd-check", system: "dnd",
        label: t("roll.magicAttack"), bonus: d.spell.atkBonus, sub: "d20 " + signed(d.spell.atkBonus)
      });
    }
    return items;
  }

  function cocIndex(sheet) {
    var d = sheet.data;
    var items = [];
    d.characteristics.forEach(function (c) {
      var nm = I18n.abilityName("coc", c);
      items.push({
        name: nm, alt: c.name, group: "char", act: "coc-check", system: "coc",
        label: nm, target: c.value || 0,
        sub: "d100" + t("coc.vs") + (c.value == null ? "—" : c.value) +
          " · " + t("roll.half") + " " + (c.half == null ? "—" : c.half)
      });
    });
    d.skills.forEach(function (s) {
      var nm = I18n.skillName("coc", s);
      items.push({
        name: nm, alt: s.name, group: "skill", act: "coc-check", system: "coc",
        label: nm, target: s.value || 0,
        sub: s.value + "% · " + t("roll.half") + " " + (s.half == null ? "—" : s.half)
      });
    });
    items.push({
      name: t("vital.sanity"), group: "quick", act: "coc-sanity", system: "coc",
      label: t("vital.sanity"), target: d.attributes.sanity || 0,
      sub: "d100" + t("coc.vs") + (d.attributes.sanity == null ? "—" : d.attributes.sanity)
    });
    items.push({
      name: t("vital.luck"), group: "quick", act: "coc-luck", system: "coc",
      label: t("vital.luck"), target: d.attributes.luck || 0,
      sub: "d100" + t("coc.vs") + (d.attributes.luck == null ? "—" : d.attributes.luck)
    });
    items.push({
      name: t("vital.db"), group: "damageBonus", act: "coc-db", system: "coc",
      label: t("vital.db"), sub: "DB " + (d.attributes.damageBonus || "—")
    });
    d.weapons.forEach(function (w) {
      if (w.skill != null) {
        items.push({
          name: w.name, group: "combat", act: "coc-check", system: "coc",
          label: t("roll.attackOf", { name: w.name }), target: w.skill,
          damage: w.damage, db: d.attributes.damageBonus,
          sub: "d100" + t("coc.vs") + w.skill
        });
      }
      if (w.damage) {
        items.push({
          name: w.name + " (" + t("roll.subDamage") + ")", group: "damage", act: "coc-damage", system: "coc",
          label: t("roll.damageOf", { name: w.name }), damage: w.damage, db: d.attributes.damageBonus || "",
          sub: t("roll.subDamage") + " " + w.damage
        });
      }
    });
    return items;
  }

  function buildIndex(sheet) {
    if (!sheet) return [];
    return sheet.system === "dnd" ? dndIndex(sheet) : cocIndex(sheet);
  }

  function looksLikeExpr(s) {
    return /^[\d\s+\-*()%dD]+$/.test(s) && /[dD]/.test(s);
  }

  /* ---------------- roll presentation ---------------- */

  function presentResult(res, descriptor) {
    var el = document.getElementById("last-roll");
    var tagHtml = res.tagLabel
      ? '<span class="tag ' + (res.tag || "neutral") + '">' + esc(res.tagLabel) + "</span>"
      : "";
    var actions = res.actions || [];
    var actionsHtml = actions.map(function (a) {
      return '<button class="btn small act-btn" data-action="' + esc(a.id) + '" type="button"' +
        (a.disabled ? " disabled" : "") + ">" + esc(a.label) + "</button>";
    }).join("");
    var rerollHtml = descriptor
      ? '<button class="btn small ghost" id="reroll-btn" type="button">' + esc(t("common.rollAgain")) + "</button>"
      : "";
    var cta = (actionsHtml || rerollHtml)
      ? '<div class="roll-cta">' + actionsHtml + rerollHtml + "</div>"
      : "";
    el.innerHTML =
      '<div class="lbl-wrap"><div class="lbl">' + esc(res.label) + '</div>' +
      '<div class="det">' + esc(res.detail) + "</div></div>" +
      '<div class="big">' + res.total + "</div>" +
      tagHtml + cta;
    state.lastDescriptor = descriptor || null;
    state.lastActions = actions;
    state.lastContext = { res: res, descriptor: descriptor || null };
    el.setAttribute("data-tag", res.tag || "neutral");
    el.classList.remove("pop");
    void el.offsetWidth;
    el.classList.add("pop");
    if (typeof DiceAnim !== "undefined") {
      DiceAnim.play(document.getElementById("dice-tray"), res.dice || []);
    }
    pushHistory(res);
  }

  function describeDice(expr, values) {
    var out = [];
    try {
      var terms = Dice.parseExpr(expr);
      var vi = 0;
      terms.forEach(function (term) {
        if (term.type === "dice") {
          for (var k = 0; k < term.count; k++) out.push({ sides: term.sides, value: values[vi++] });
        }
      });
    } catch (e) {}
    return out;
  }

  function critExpr(damage) {
    var ex = damageExpr(damage);
    if (!ex) return null;
    var terms;
    try { terms = Dice.parseExpr(ex); } catch (e) { return null; }
    var parts = terms.map(function (tm) {
      var sign = tm.sign < 0 ? "-" : "+";
      return sign + (tm.type === "const" ? tm.value : (tm.count * 2) + "d" + tm.sides);
    });
    return parts.join("");
  }

  function maxOfExpr(expr) {
    var s = 0;
    Dice.parseExpr(expr).forEach(function (tm) {
      s += tm.sign * (tm.type === "const" ? tm.value : tm.count * tm.sides);
    });
    return s;
  }

  function impaleInfo(damage, db) {
    var ex = damageExpr(damage);
    if (!ex) return null;
    var max, dbMax = 0;
    try {
      max = maxOfExpr(ex);
      var dbs = String(db || "").trim();
      if (/[dD]/.test(dbs)) {
        var m = dbs.match(/[+-]?\d*[dD]\d+/);
        if (m) dbMax = maxOfExpr(m[0]);
      } else {
        var n = dbs.match(/[+-]?\d+/);
        if (n) dbMax = parseInt(n[0], 10);
      }
    } catch (e) { return null; }
    var total = max + dbMax;
    return { total: total, detail: t("coc.impaleDetail", { expr: ex, max: max, db: signed(dbMax), total: total }) };
  }

  function dndCheck(label, bonus, damage) {
    var mode = state.advantage || "normal";
    var nat, total, detail, dice;
    if (mode === "normal") {
      var r = Dice.roll("1d20");
      nat = r.total;
      total = nat + bonus;
      detail = "1d20 [" + nat + "] " + signed(bonus) + " = " + total;
      dice = [{ sides: 20, value: nat }];
    } else {
      var r2 = Dice.roll("2d20");
      var a = r2.values[0], b = r2.values[1];
      nat = mode === "adv" ? Math.max(a, b) : Math.min(a, b);
      total = nat + bonus;
      detail = "2d20 [" + a + ", " + b + "] \u2192 " + nat + " " + signed(bonus) + " = " + total;
      dice = [{ sides: 20, value: a }, { sides: 20, value: b }];
    }
    var tag = "neutral", tagLabel = null;
    if (nat === 20) { tag = "good"; tagLabel = t("dnd.crit"); }
    else if (nat === 1) { tag = "bad"; tagLabel = t("dnd.fumble"); }
    var res = {
      label: label, total: total, detail: detail,
      system: "dnd", tag: tag, tagLabel: tagLabel, dice: dice
    };
    if (nat === 20 && damage) {
      var ce = critExpr(damage);
      if (ce) res.actions = [{ id: "crit", kind: "expr", label: t("roll.critDamage"), expr: ce, system: "dnd" }];
    }
    return res;
  }

  function rollExpr(label, expr, system) {
    var r = Dice.roll(expr);
    return {
      label: label, total: r.total, detail: r.text, system: system,
      tag: "neutral", tagLabel: null,
      dice: describeDice(expr, r.values)
    };
  }

  var LEVEL_ORDER = { critical: 5, extreme: 4, hard: 3, regular: 2, failure: 1, fumble: 0 };
  var DIFF_MIN = { regular: 2, hard: 3, extreme: 4 };

  function diffLabel(k) { return t("diff." + k); }
  function cocLevelLabel(level) { return t("coc." + level); }

  function cocCheck(label, target, difficulty, damage, db, pushed) {
    var r = Dice.roll("1d100");
    var roll = r.total;
    var level = Dice.cocSuccess(roll, target);
    var pass = LEVEL_ORDER[level] >= DIFF_MIN[difficulty];
    if (pushed && !pass) level = "fumble";
    var lvlLabel = cocLevelLabel(level);
    var res = {
      label: label + " (" + diffLabel(difficulty) + ")",
      total: roll,
      detail: t("coc.detail", { roll: roll, target: target, level: lvlLabel }),
      system: "coc",
      tag: pass ? "good" : "bad",
      tagLabel: (pass ? t("coc.success") : t("coc.failurePrefix")) + lvlLabel,
      dice: [{ sides: 100, value: roll }]
    };
    var actions = [];
    if ((level === "extreme" || level === "critical") && damage) {
      var imp = impaleInfo(damage, db);
      if (imp) {
        actions.push({
          id: "impale", kind: "fixed", label: t("roll.impale"),
          total: imp.total, detail: imp.detail, system: "coc",
          tag: "good", tagLabel: t("coc.success") + lvlLabel
        });
      }
    }
    if (!pushed && !pass && level !== "fumble") {
      var cost = roll - target;
      if (cost > 0) {
        var luck = (currentSheet() && currentSheet().data.attributes ? currentSheet().data.attributes.luck : 0) || 0;
        actions.push({
          id: "luck", kind: "luck", label: t("roll.spendLuck", { cost: cost }),
          cost: cost, disabled: luck < cost, target: target, roll: roll, baseLabel: label,
          dice: [{ sides: 100, value: roll }]
        });
      }
      actions.push({
        id: "push", kind: "push", label: t("roll.push"),
        baseLabel: label, target: target, difficulty: difficulty, damage: damage, db: db
      });
    }
    if (actions.length) res.actions = actions;
    return res;
  }

  function damageExpr(damage) {
    var m = String(damage || "").match(/(\d*d\d+(?:\s*[+-]\s*\d+)?)/i);
    return m ? m[1].replace(/\s+/g, "") : null;
  }

  function rollDbTotal(db) {
    var s = String(db || "").trim();
    var m = s.match(/[+-]?\d*[dD]\d+/);
    if (m) return Dice.roll(m[0]).total;
    var n = s.match(/[+-]?\d+/);
    return n ? parseInt(n[0], 10) : 0;
  }

  function cocDamage(label, damage, db, system) {
    var expr = damageExpr(damage);
    var dbTotal = rollDbTotal(db);
    if (!expr) {
      return {
        label: label, total: dbTotal,
        detail: t("coc.dmgDetail", { damage: (db || "-"), db: signed(dbTotal) }),
        system: system, tag: "neutral", tagLabel: null
      };
    }
    var r = Dice.roll(expr);
    var total = r.total + dbTotal;
    return {
      label: label, total: total,
      detail: t("coc.dmgDetailRoll", { expr: expr, rolled: r.total, db: signed(dbTotal), total: total }),
      system: system, tag: "neutral", tagLabel: null,
      dice: describeDice(expr, r.values)
    };
  }

  /* ---------------- history ---------------- */

  function loadHistory() {
    try {
      state.history = JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch (e) { state.history = []; }
  }

  function saveHistory() {
    try { localStorage.setItem(HISTORY_KEY, JSON.stringify(state.history.slice(0, 100))); } catch (e) {}
  }

  function pushHistory(res) {
    var t = new Date();
    state.history.unshift({
      t: t.toISOString(),
      label: res.label,
      total: res.total,
      detail: res.detail,
      system: res.system,
      systemLabel: systemLabel(res.system)
    });
    state.history = state.history.slice(0, 100);
    saveHistory();
    renderHistory();
  }

  function renderHistory() {
    var list = document.getElementById("history-list");
    var empty = document.getElementById("history-empty");
    if (!state.history.length) {
      list.innerHTML = "";
      empty.hidden = false;
      return;
    }
    empty.hidden = true;
    var locale = I18n.lang === "en" ? "en-US" : "pt-BR";
    list.innerHTML = state.history.map(function (h) {
      var d = new Date(h.t);
      var time = d.toLocaleString(locale);
      return '<li><span class="t">' + esc(time) + "</span>" +
        (h.systemLabel && h.system ? '<span class="sys">' +
          (h.system === "dnd" ? "D&D" : "CoC") + "</span>" : "") +
        '<span class="r">' + esc(h.label) + " = " + h.total + "</span>" +
        '<span class="d">' + esc(h.detail) + "</span></li>";
    }).join("");
  }

  /* ---------------- sheets view ---------------- */

  function renderSheets() {
    var list = document.getElementById("sheet-list");
    document.getElementById("sheet-count").textContent = state.sheets.length;
    document.getElementById("sheet-empty").hidden = state.sheets.length > 0;

    list.innerHTML = state.sheets.map(function (s) {
      var d = s.data;
      var meta;
      if (s.system === "dnd") {
        meta = [d.details.classLevel, d.details.race,
          t("short.hp") + " " + (d.hp.max == null ? "?" : d.hp.max),
          t("short.ac") + " " + (d.ac == null ? "?" : d.ac)].filter(Boolean);
      } else {
        meta = [d.details.occupation,
          t("short.san") + " " + (d.attributes.sanity == null ? "?" : d.attributes.sanity),
          t("short.hp") + " " + (d.attributes.hpMax == null ? "?" : d.attributes.hpMax),
          t("vital.luck") + " " + (d.attributes.luck == null ? "?" : d.attributes.luck)].filter(Boolean);
      }
      return '<div class="sheet-card' + (s.id === state.selectedId ? " selected" : "") + '" data-id="' + esc(s.id) + '">' +
        '<div class="head"><h3>' + esc(s.name) + '</h3>' +
        '<span class="badge ' + s.system + '">' + (s.system === "dnd" ? "D&D 5e" : "CoC 7e") + "</span></div>" +
        '<div class="meta">' + meta.map(function (m) { return "<span>" + esc(m) + "</span>"; }).join("") + "</div>" +
        (s.source ? '<div class="meta"><span>' + esc(t("sheets.source")) + esc(s.source) + "</span></div>" : "") +
        '<div class="actions">' +
        '<button class="btn small primary" data-act="select">' + esc(t("common.roll")) + "</button>" +
        '<button class="btn small" data-act="export">' + esc(t("common.exportJson")) + "</button>" +
        (s.hasPdf ? '<button class="btn small" data-act="export-pdf">' + esc(t("common.exportPdf")) + "</button>" : "") +
        '<button class="btn small danger" data-act="remove">' + esc(t("common.remove")) + "</button>" +
        "</div></div>";
    }).join("");
  }

  function renderSheetSelect() {
    var sel = document.getElementById("sheet-select");
    if (!state.sheets.length) {
      sel.innerHTML = '<option value="">Nenhuma ficha</option>';
      sel.disabled = true;
      return;
    }
    sel.disabled = false;
    sel.innerHTML = state.sheets.map(function (s) {
      return '<option value="' + esc(s.id) + '"' + (s.id === state.selectedId ? " selected" : "") + ">" +
        esc(s.name) + " — " + (s.system === "dnd" ? "D&D 5e" : "CoC 7e") + "</option>";
    }).join("");
  }

  /* ---------------- roll panel ---------------- */

  function renderRollPanel() {
    var panel = document.getElementById("sheet-panel");
    var toggle = document.getElementById("edit-toggle");
    var sheet = currentSheet();
    if (!sheet) {
      panel.innerHTML = '<p class="empty">' + esc(t("roll.noSheet")) + "</p>";
      if (toggle) toggle.hidden = true;
      return;
    }
    if (toggle) {
      toggle.hidden = false;
      toggle.textContent = t(state.editMode ? "editor.done" : "editor.toggle");
    }
    if (state.editMode) {
      panel.innerHTML = sheet.system === "dnd" ? dndEditor(sheet) : cocEditor(sheet);
      return;
    }
    panel.innerHTML = sheet.system === "dnd" ? dndPanel(sheet) : cocPanel(sheet);
  }

  /* ---------------- attribute search ---------------- */

  var search = { items: [], results: [], active: -1, group: "all", focused: false };

  function computeResults() {
    var input = document.getElementById("roll-search");
    var q = norm(input ? input.value : "");
    var items = search.items.filter(function (it) {
      return search.group === "all" || it.group === search.group;
    });
    if (!q) {
      search.results = items;
      return;
    }
    var scored = [];
    items.forEach(function (it, idx) {
      var name = norm(it.name);
      var hay = name + " " + norm(it.alt) + " " + norm(I18n.groupName(it.group)) + " " + norm(it.sub);
      var pos = hay.indexOf(q);
      if (pos < 0) return;
      var score = name === q ? 0 : (name.indexOf(q) === 0 ? 1 : (pos < name.length ? 2 : 3));
      scored.push({ it: it, score: score, idx: idx });
    });
    scored.sort(function (a, b) { return a.score - b.score || a.idx - b.idx; });
    search.results = scored.map(function (s) { return s.it; });
  }

  function renderSearch() {
    var input = document.getElementById("roll-search");
    var box = document.getElementById("search-results");
    var chips = document.getElementById("search-chips");
    var sheet = currentSheet();
    var hasQuery = !!(input.value && input.value.trim());
    var show = !!sheet && (search.focused || hasQuery);
    input.disabled = !sheet;

    var groups = [];
    search.items.forEach(function (it) { if (groups.indexOf(it.group) < 0) groups.push(it.group); });
    chips.hidden = !show || !groups.length;
    chips.innerHTML = (show && groups.length)
      ? '<button class="chip' + (search.group === "all" ? " active" : "") +
        '" data-group="all" type="button">' + esc(t("group.all")) + "</button>" +
        groups.map(function (g) {
          return '<button class="chip' + (search.group === g ? " active" : "") +
            '" data-group="' + esc(g) + '" type="button">' + esc(I18n.groupName(g)) + "</button>";
        }).join("")
      : "";

    if (!show) {
      box.hidden = true;
      box.innerHTML = "";
      return;
    }
    if (search.results.length > 80) search.results = search.results.slice(0, 80);
    if (search.active >= search.results.length) search.active = -1;
    box.innerHTML = search.results.length
      ? search.results.map(function (it, i) {
          return '<button class="search-item' + (i === search.active ? " active" : "") +
            '" data-idx="' + i + '" data-tone="' + groupTone(it.group) + '" type="button">' +
            '<span class="si-main"><span class="si-name">' + esc(it.name) + "</span>" +
            '<span class="si-sub">' + esc(it.sub || "") + "</span></span>" +
            '<span class="si-group">' + esc(I18n.groupName(it.group)) + "</span></button>";
        }).join("")
      : '<p class="search-none">' + esc(t("roll.searchNone", { q: input.value })) + "</p>";
    box.hidden = false;
  }

  function refreshSearch() {
    var input = document.getElementById("roll-search");
    search.items = buildIndex(currentSheet());
    search.group = "all";
    search.active = -1;
    if (input) input.value = "";
    computeResults();
    renderSearch();
  }

  function runSearchItem(i) {
    var it = search.results[i];
    if (!it) return;
    var res = rollDescriptor(it);
    if (res) presentResult(res, it);
  }

  function onSearchInput() {
    search.active = -1;
    computeResults();
    renderSearch();
  }

  function onSearchKey(e) {
    var n = search.results.length;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      search.active = Math.min(search.active + 1, n - 1);
      renderSearch();
      scrollActive();
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      search.active = Math.max(search.active - 1, -1);
      renderSearch();
      scrollActive();
    } else if (e.key === "Enter") {
      e.preventDefault();
      var v = e.target.value.trim();
      if (search.active >= 0) runSearchItem(search.active);
      else if (looksLikeExpr(v)) freeRollExpr(v);
      else if (v && n) runSearchItem(0);
    } else if (e.key === "Escape") {
      e.target.value = "";
      search.active = -1;
      computeResults();
      renderSearch();
    }
  }

  function scrollActive() {
    var el = document.querySelector("#search-results .search-item.active");
    if (el && el.scrollIntoView) el.scrollIntoView({ block: "nearest" });
  }

  function focusSearch() {
    showView("roll");
    var input = document.getElementById("roll-search");
    if (input && !input.disabled) { input.focus(); input.select(); }
  }

  function dndPanel(sheet) {
    var d = sheet.data;
    var h = [];

    h.push('<div class="section-title">' + esc(t("section.abilities")) + '</div><div class="grid-abilities">');
    d.abilities.forEach(function (a) {
      var nm = I18n.abilityName("dnd", a);
      h.push('<button class="roll-btn" data-act="dnd-check" data-label="' + esc(t("roll.testOf", { name: nm })) +
        '" data-bonus="' + (a.mod || 0) + '"><span class="k">' + esc(a.abbr) +
        '</span><span class="v">' + (a.score == null ? "—" : a.score) +
        '</span><span class="n">' + signed(a.mod || 0) + "</span></button>");
    });
    h.push("</div>");

    h.push('<div class="controls"><span class="section-title" style="margin:0">' + esc(t("section.rollMode")) + '</span>' +
      '<div class="seg" id="roll-mode">' +
      ["normal", "adv", "dis"].map(function (k) {
        return '<button class="seg-btn' + (state.advantage === k ? " active" : "") +
          '" data-mode="' + k + '" type="button">' + esc(t("mode." + k)) + "</button>";
      }).join("") + "</div></div>");

    h.push('<div class="section-title">' + esc(t("section.vitality")) + '</div><div class="vitals">');
    h.push(vitalInput(t("vital.hpCurrent"), "hp.current", d.hp.current, d.hp.max == null ? "" : "/ " + d.hp.max));
    h.push(vitalStatic(t("vital.hpMax"), d.hp.max));
    h.push(vitalStatic(t("vital.ac"), d.ac));
    h.push(vitalStatic(t("vital.prof"), signed(d.profBonus || 0)));
    h.push(vitalStatic(t("vital.speed"), d.speed || "—"));
    h.push(vitalStatic(t("vital.passive"), d.passive == null ? "—" : d.passive));
    h.push(vitalStatic(t("vital.hitDice"), d.hitDice || "—"));
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.quick")) + '</div><div class="row">');
    var dexMod = (d.abilities.filter(function (a) { return a.key === "DES"; })[0] || {}).mod || 0;
    h.push('<button class="btn" data-act="dnd-check" data-label="' + esc(t("roll.initiative")) + '" data-bonus="' + dexMod + '">' +
      esc(t("roll.initiative")) + " (1d20 " + signed(dexMod) + ")</button>");
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.saves")) + '</div><div class="roll-list">');
    d.saves.forEach(function (s) {
      var nm = I18n.abilityName("dnd", { key: s.ability, name: s.name });
      h.push(rollRow(nm, null, s.bonus, "dnd-check", t("roll.saveOf", { name: nm })));
    });
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.skills")) + '</div><div class="roll-list">');
    d.skills.forEach(function (s) {
      var nm = I18n.skillName("dnd", s);
      h.push(rollRow(nm, s.ability, s.bonus, "dnd-check", t("roll.skillOf", { name: nm })));
    });
    h.push("</div>");

    if (d.weapons.length) {
      h.push('<div class="section-title">' + esc(t("section.attacks")) + '</div><div class="roll-list">');
      d.weapons.forEach(function (w) {
        var atk = parseInt(String(w.atk).replace(/[^\-0-9]/g, ""), 10);
        atk = isNaN(atk) ? 0 : atk;
        var expr = damageExpr(w.damage);
        h.push('<div class="roll-row"><div><div class="name">' + esc(w.name) +
          '</div><div class="sub">' + esc(t("word.attack")) + " " + esc(w.atk || "—") + " · " +
          esc(t("word.damage")) + " " + esc(w.damage || "—") + "</div></div><div>" +
          '<button class="btn small primary" data-act="dnd-attack" data-label="' + esc(t("roll.attackOf", { name: w.name })) + '" data-bonus="' + atk + '" data-damage="' + esc(w.damage || "") + '">' + esc(t("word.attack")) + "</button>" +
          (expr ? '<button class="btn small" data-act="expr" data-label="' + esc(t("roll.damageOf", { name: w.name })) + '" data-expr="' + esc(expr) + '">' + esc(t("word.damage")) + "</button>" : "") +
          "</div></div>");
      });
      h.push("</div>");
    }

    if (d.spell) {
      h.push('<div class="section-title">' + esc(t("section.spells")) + '</div>');
      h.push('<div class="vitals"><div class="vital"><label>' + esc(t("vital.spellClass")) + '</label><span class="val">' + esc(d.spell["class"] || "—") +
        '</span></div><div class="vital"><label>' + esc(t("vital.spellDC")) + '</label><span class="val">' + (d.spell.saveDC == null ? "—" : d.spell.saveDC) +
        '</span></div><div class="vital"><label>' + esc(t("vital.spellAtk")) + '</label><span class="val">' + (d.spell.atkBonus == null ? "—" : signed(d.spell.atkBonus)) +
        "</span></div></div>");
      if (d.spell.slots && d.spell.slots.length) {
        h.push('<div class="roll-list" style="margin-top:10px">');
        d.spell.slots.forEach(function (sl) {
          h.push('<div class="roll-row"><div><div class="name">' + esc(t("vital.level")) + " " + esc(sl.level) +
            "</div></div><div class=\"bonus\">" + (sl.used == null ? "?" : sl.used) + " / " + (sl.total == null ? "?" : sl.total) + "</div></div>");
        });
        h.push("</div>");
      }
      if (d.spell.spells && d.spell.spells.length) {
        h.push('<div class="roll-list" style="margin-top:10px">');
        d.spell.spells.forEach(function (sp) {
          h.push('<div class="roll-row"><div class="name">' + esc(sp) + "</div></div>");
        });
        h.push("</div>");
      }
    }

    var det = d.details;
    var detRows = [
      [t("detail.classLevel"), det.classLevel], [t("detail.race"), det.race], [t("detail.background"), det.background],
      [t("detail.alignment"), det.alignment], [t("detail.player"), det.player]
    ].filter(function (r) { return r[1]; });
    if (detRows.length) {
      h.push('<div class="section-title">' + esc(t("section.details")) + '</div><div class="vitals">');
      detRows.forEach(function (r) {
        h.push('<div class="vital"><label>' + esc(r[0]) + '</label><span class="val">' + esc(r[1]) + "</span></div>");
      });
      h.push("</div>");
    }

    ["personalityTraits", "ideals", "bonds", "flaws", "features", "proficiencies", "equipment"].forEach(function (k) {
      if (det[k]) {
        h.push('<div class="section-title">' + esc(t("detail." + k)) + '</div><p class="muted" style="white-space:pre-line">' + multiline(det[k]) + "</p>");
      }
    });

    return h.join("");
  }

  function cocPanel(sheet) {
    var d = sheet.data;
    var h = [];

    h.push('<div class="section-title">' + esc(t("section.characteristics")) + '</div><div class="grid-abilities">');
    d.characteristics.forEach(function (c) {
      var nm = I18n.abilityName("coc", c);
      h.push('<button class="roll-btn" data-act="coc-check" data-label="' + esc(nm) +
        '" data-target="' + (c.value || 0) + '"><span class="k">' + esc(c.abbr) +
        '</span><span class="v">' + (c.value == null ? "—" : c.value) +
        '</span><span class="n">' + esc(t("roll.half")) + " " + (c.half == null ? "—" : c.half) + "</span></button>");
    });
    h.push("</div>");

    h.push('<div class="controls"><span class="section-title" style="margin:0">' + esc(t("section.difficulty")) + '</span>' +
      '<select id="difficulty" class="select" style="min-width:150px">' +
      ["regular", "hard", "extreme"].map(function (k) {
        return '<option value="' + k + '"' + (state.difficulty === k ? " selected" : "") + ">" + esc(diffLabel(k)) + "</option>";
      }).join("") + "</select></div>");

    h.push('<div class="section-title">' + esc(t("section.vitality")) + '</div><div class="vitals">');
    h.push(vitalInput(t("vital.hpCurrent"), "attributes.hpCurrent", d.attributes.hpCurrent, "/ " + (d.attributes.hpMax == null ? "?" : d.attributes.hpMax)));
    h.push(vitalInput(t("vital.mpCurrent"), "attributes.mpCurrent", d.attributes.mpCurrent, "/ " + (d.attributes.mpMax == null ? "?" : d.attributes.mpMax)));
    h.push(vitalInput(t("vital.luck"), "attributes.luck", d.attributes.luck, ""));
    h.push(vitalInput(t("vital.sanity"), "attributes.sanity", d.attributes.sanity, "/ " + (d.attributes.sanityMax == null ? "?" : d.attributes.sanityMax)));
    h.push(vitalStatic(t("vital.move"), d.attributes.move));
    h.push(vitalStatic(t("vital.build"), d.attributes.build));
    h.push(vitalStatic(t("vital.db"), d.attributes.damageBonus || "—"));
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.quickRolls")) + '</div><div class="row">');
    h.push('<button class="btn" data-act="coc-sanity" data-label="' + esc(t("vital.sanity")) + '" data-target="' + (d.attributes.sanity || 0) + '">' + esc(t("vital.sanity")) + "</button>");
    h.push('<button class="btn" data-act="coc-luck" data-label="' + esc(t("vital.luck")) + '" data-target="' + (d.attributes.luck || 0) + '">' + esc(t("vital.luck")) + "</button>");
    h.push('<button class="btn" data-act="coc-db" data-label="' + esc(t("vital.db")) + '">' + esc(t("vital.db")) + "</button>");
    h.push("</div>");

    if (d.weapons.length) {
      h.push('<div class="section-title">' + esc(t("section.combat")) + '</div><div class="roll-list">');
      d.weapons.forEach(function (w) {
        h.push('<div class="roll-row"><div><div class="name">' + esc(w.name) +
          '</div><div class="sub">' + esc(t("word.ability")) + " " + (w.skill == null ? "—" : w.skill) + " · " +
          esc(t("word.damage")) + " " + esc(w.damage || "—") + "</div></div><div>" +
          (w.skill != null ? '<button class="btn small primary" data-act="coc-check" data-label="' + esc(t("roll.attackOf", { name: w.name })) + '" data-target="' + w.skill + '" data-damage="' + esc(w.damage || "") + '" data-db="' + esc(d.attributes.damageBonus || "") + '">' + esc(t("word.attack")) + "</button>" : "") +
          '<button class="btn small" data-act="coc-damage" data-label="' + esc(t("roll.damageOf", { name: w.name })) + '" data-damage="' + esc(w.damage || "") + '" data-db="' + esc(d.attributes.damageBonus || "") + '">' + esc(t("word.damage")) + "</button>" +
          "</div></div>");
      });
      h.push("</div>");
    }

    h.push('<div class="section-title">' + esc(t("section.skills")) + '</div><div class="roll-list">');
    d.skills.forEach(function (s) {
      var chk = s.checked ? "✔ " : "";
      var nm = I18n.skillName("coc", s);
      h.push('<div class="roll-row"><div><div class="name">' + chk + esc(nm) +
        '</div><div class="sub">' + esc(t("roll.half")) + " " + (s.half == null ? "—" : s.half) + " · " + esc(t("roll.fifth")) + " " + (s.fifth == null ? "—" : s.fifth) + "</div></div>" +
        '<div><span class="bonus">' + s.value + '%</span>' +
        '<button class="rbtn" data-act="coc-check" data-label="' + esc(nm) + '" data-target="' + s.value + '">' + esc(t("common.roll")) + "</button></div></div>");
    });
    h.push("</div>");

    var det = d.details;
    var detRows = [
      [t("detail.occupation"), det.occupation], [t("detail.age"), det.age], [t("detail.birthplace"), det.birthplace],
      [t("detail.residence"), det.residence], [t("detail.gender"), det.gender]
    ].filter(function (r) { return r[1]; });
    if (detRows.length) {
      h.push('<div class="section-title">' + esc(t("section.details")) + '</div><div class="vitals">');
      detRows.forEach(function (r) {
        h.push('<div class="vital"><label>' + esc(r[0]) + '</label><span class="val">' + esc(r[1]) + "</span></div>");
      });
      h.push("</div>");
    }

    return h.join("");
  }

  function editField(label, path, value, derived) {
    return '<label class="edit-row"><span class="edit-label">' + esc(label) + "</span>" +
      '<input class="input edit-input" type="number" data-field="' + esc(path) + '" value="' +
      esc(value == null ? "" : value) + '">' +
      (derived != null ? '<span class="edit-derived">' + esc(derived) + "</span>" : "") + "</label>";
  }

  function editText(label, path, value) {
    return '<label class="edit-row"><span class="edit-label">' + esc(label) + "</span>" +
      '<input class="input edit-input" type="text" data-type="text" data-field="' + esc(path) + '" value="' +
      esc(value == null ? "" : value) + '"></label>';
  }

  function dndEditor(sheet) {
    var d = sheet.data;
    var h = [];
    h.push('<p class="muted editor-hint">' + esc(t("editor.hint")) + "</p>");

    h.push('<div class="section-title">' + esc(t("section.abilities")) + '</div><div class="edit-grid">');
    d.abilities.forEach(function (a, i) {
      h.push(editField(a.abbr + " · " + I18n.abilityName("dnd", a), "abilities." + i + ".score", a.score,
        t("editor.mod") + " " + signed(a.mod || 0)));
    });
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.vitality")) + '</div><div class="edit-grid">');
    h.push(editField(t("vital.hpCurrent"), "hp.current", d.hp.current));
    h.push(editField(t("vital.hpMax"), "hp.max", d.hp.max));
    h.push(editField(t("vital.ac"), "ac", d.ac));
    h.push(editField(t("vital.prof"), "profBonus", d.profBonus));
    h.push(editText(t("vital.speed"), "speed", d.speed));
    h.push(editField(t("vital.passive"), "passive", d.passive));
    h.push(editText(t("vital.hitDice"), "hitDice", d.hitDice));
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.saves")) + '</div><div class="edit-grid">');
    d.saves.forEach(function (s, i) {
      h.push(editField(I18n.abilityName("dnd", { key: s.ability, name: s.name }), "saves." + i + ".bonus", s.bonus));
    });
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.skills")) + '</div><div class="edit-grid">');
    d.skills.forEach(function (s, i) {
      h.push(editField(I18n.skillName("dnd", s), "skills." + i + ".bonus", s.bonus));
    });
    h.push("</div>");

    if (d.weapons.length) {
      h.push('<div class="section-title">' + esc(t("section.attacks")) + '</div><div class="edit-grid">');
      d.weapons.forEach(function (w, i) {
        h.push(editText(t("word.name") + " " + (i + 1), "weapons." + i + ".name", w.name));
        h.push(editText("ATK " + (i + 1), "weapons." + i + ".atk", w.atk));
        h.push(editText(t("word.damage") + " " + (i + 1), "weapons." + i + ".damage", w.damage));
      });
      h.push("</div>");
    }

    h.push('<div class="section-title">' + esc(t("section.details")) + '</div><div class="edit-grid">');
    h.push(editText(t("detail.classLevel"), "details.classLevel", d.details.classLevel));
    h.push(editText(t("detail.race"), "details.race", d.details.race));
    h.push(editText(t("detail.background"), "details.background", d.details.background));
    h.push(editText(t("detail.alignment"), "details.alignment", d.details.alignment));
    h.push(editText(t("detail.player"), "details.player", d.details.player));
    h.push("</div>");

    return h.join("");
  }

  function cocEditor(sheet) {
    var d = sheet.data;
    var h = [];
    h.push('<p class="muted editor-hint">' + esc(t("editor.hint")) + "</p>");

    h.push('<div class="section-title">' + esc(t("section.characteristics")) + '</div><div class="edit-grid">');
    d.characteristics.forEach(function (c, i) {
      h.push(editField(c.abbr + " · " + I18n.abilityName("coc", c), "characteristics." + i + ".value", c.value,
        t("editor.half") + " " + (c.half == null ? "—" : c.half)));
    });
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.vitality")) + '</div><div class="edit-grid">');
    h.push(editField(t("vital.hpCurrent"), "attributes.hpCurrent", d.attributes.hpCurrent));
    h.push(editField(t("vital.hpMax"), "attributes.hpMax", d.attributes.hpMax));
    h.push(editField(t("vital.mpCurrent"), "attributes.mpCurrent", d.attributes.mpCurrent));
    h.push(editField(t("vital.mpMax"), "attributes.mpMax", d.attributes.mpMax));
    h.push(editField(t("vital.luck"), "attributes.luck", d.attributes.luck));
    h.push(editField(t("vital.sanity"), "attributes.sanity", d.attributes.sanity));
    h.push(editField(t("vital.sanityMax"), "attributes.sanityMax", d.attributes.sanityMax));
    h.push(editField(t("vital.move"), "attributes.move", d.attributes.move));
    h.push(editField(t("vital.build"), "attributes.build", d.attributes.build));
    h.push(editText(t("vital.db"), "attributes.damageBonus", d.attributes.damageBonus));
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.combat")) + '</div><div class="edit-grid">');
    if (d.weapons.length) {
      d.weapons.forEach(function (w, i) {
        h.push(editText(t("word.name") + " " + (i + 1), "weapons." + i + ".name", w.name));
        h.push(editField(t("word.ability") + " " + (i + 1), "weapons." + i + ".skill", w.skill));
        h.push(editText(t("word.damage") + " " + (i + 1), "weapons." + i + ".damage", w.damage));
      });
    } else {
      h.push('<p class="empty">—</p>');
    }
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.skills")) + '</div><div class="edit-grid">');
    d.skills.forEach(function (s, i) {
      h.push(editField(I18n.skillName("coc", s), "skills." + i + ".value", s.value,
        t("editor.half") + " " + (s.half == null ? "—" : s.half)));
    });
    h.push("</div>");

    h.push('<div class="section-title">' + esc(t("section.details")) + '</div><div class="edit-grid">');
    h.push(editText(t("detail.occupation"), "details.occupation", d.details.occupation));
    h.push(editText(t("detail.age"), "details.age", d.details.age));
    h.push(editText(t("detail.birthplace"), "details.birthplace", d.details.birthplace));
    h.push(editText(t("detail.residence"), "details.residence", d.details.residence));
    h.push(editText(t("detail.gender"), "details.gender", d.details.gender));
    h.push("</div>");

    return h.join("");
  }

  function rollRow(name, sub, bonus, act, label) {
    return '<div class="roll-row"><div><div class="name">' + esc(name) +
      (sub ? ' <span class="sub">(' + esc(sub) + ")</span>" : "") + "</div></div>" +
      '<div><span class="bonus">' + signed(bonus == null ? 0 : bonus) + "</span>" +
      '<button class="rbtn" data-act="' + act + '" data-label="' + esc(label) + '" data-bonus="' + (bonus || 0) + '">' + esc(t("common.roll")) + "</button></div></div>";
  }

  function vitalStatic(label, val) {
    return '<div class="vital"><label>' + esc(label) + '</label><span class="val">' +
      (val == null || val === "" ? "—" : esc(val)) + "</span></div>";
  }

  function vitalInput(label, field, val, suffix) {
    return '<div class="vital"><label>' + esc(label) + (suffix ? " <span class='sub'>" + esc(suffix) + "</span>" : "") +
      '</label><input class="input stat-inline" data-field="' + esc(field) + '" type="number" value="' +
      (val == null ? "" : esc(val)) + '"></div>';
  }

  /* ---------------- events ---------------- */

  function rollDescriptor(d) {
    if (!d) return null;
    var act = d.act;
    var difficulty = state.difficulty;
    if (act === "dnd-check" || act === "dnd-attack") {
      return dndCheck(d.label, Number(d.bonus) || 0, d.damage);
    }
    if (act === "expr") {
      return rollExpr(d.label, d.expr, d.system || "dnd");
    }
    if (act === "coc-check") {
      return cocCheck(d.label, Number(d.target) || 0, difficulty, d.damage, d.db);
    }
    if (act === "coc-sanity") {
      return cocCheck(d.label || t("vital.sanity"), Number(d.target) || 0, difficulty, null, null);
    }
    if (act === "coc-luck") {
      return cocCheck(d.label || t("vital.luck"), Number(d.target) || 0, difficulty, null, null);
    }
    if (act === "coc-db") {
      var data = (currentSheet() || {}).data;
      var db = data && data.attributes ? data.attributes.damageBonus : "0";
      return rollExpr(t("roll.dbLabel", { db: db || "0" }), db || "0", "coc");
    }
    if (act === "coc-damage") {
      return cocDamage(d.label, d.damage, d.db, "coc");
    }
    return null;
  }

  function runAction(id) {
    var a = (state.lastActions || []).filter(function (x) { return x.id === id; })[0];
    if (!a || a.disabled) return;
    if (a.kind === "expr") {
      presentResult(rollExpr(a.label, a.expr, a.system || "dnd"),
        { act: "expr", label: a.label, expr: a.expr, system: a.system || "dnd" });
    } else if (a.kind === "fixed") {
      presentResult({
        label: a.label, total: a.total, detail: a.detail, system: a.system,
        tag: a.tag || "good", tagLabel: a.tagLabel || null, dice: []
      }, null);
    } else if (a.kind === "luck") {
      spendLuck(a);
    } else if (a.kind === "push") {
      var pr = cocCheck(a.baseLabel, a.target, a.difficulty, a.damage, a.db, true);
      if (pr) pr.detail = t("coc.pushNote") + pr.detail;
      presentResult(pr, { act: "coc-check", label: a.baseLabel, target: a.target, damage: a.damage, db: a.db });
    }
  }

  function spendLuck(a) {
    var sheet = currentSheet();
    if (!sheet || !sheet.data.attributes) return;
    var luck = sheet.data.attributes.luck || 0;
    if (luck < a.cost) return;
    sheet.data.attributes.luck = luck - a.cost;
    Store.update(sheet.id, { data: sheet.data });
    renderRollPanel();
    presentResult({
      label: a.baseLabel + " (" + diffLabel(state.difficulty) + ")",
      total: a.roll,
      detail: t("coc.luckSpent", { cost: a.cost, roll: a.roll, target: a.target }),
      system: "coc", tag: "good", tagLabel: t("coc.success") + cocLevelLabel("regular"),
      dice: a.dice
    }, { act: "coc-check", label: a.baseLabel, target: a.target });
  }

  function handlePanelClick(e) {
    if (e.target.closest && e.target.closest("input,select,textarea")) return;
    var seg = e.target.closest("[data-mode]");
    if (seg) { state.advantage = seg.getAttribute("data-mode"); renderRollPanel(); return; }
    var btn = e.target.closest("[data-act]");
    if (!btn) return;
    var descriptor = {
      act: btn.getAttribute("data-act"),
      label: btn.getAttribute("data-label") || "",
      bonus: btn.getAttribute("data-bonus"),
      target: btn.getAttribute("data-target"),
      expr: btn.getAttribute("data-expr"),
      damage: btn.getAttribute("data-damage"),
      db: btn.getAttribute("data-db"),
      system: btn.getAttribute("data-system")
    };
    var res = rollDescriptor(descriptor);
    if (res) presentResult(res, descriptor);
  }

  function recomputeDerived(sheet, field) {
    var m;
    if ((m = field.match(/^abilities\.(\d+)\.score$/))) {
      var a = sheet.data.abilities[Number(m[1])];
      if (a) a.mod = a.score == null ? 0 : Math.floor((a.score - 10) / 2);
    } else if ((m = field.match(/^characteristics\.(\d+)\.value$/))) {
      var c = sheet.data.characteristics[Number(m[1])];
      if (c) {
        c.half = c.value == null ? null : Math.floor(c.value / 2);
        c.fifth = c.value == null ? null : Math.floor(c.value / 5);
      }
    } else if ((m = field.match(/^skills\.(\d+)\.value$/))) {
      var s = sheet.data.skills[Number(m[1])];
      if (s) {
        s.half = s.value == null ? null : Math.floor(s.value / 2);
        s.fifth = s.value == null ? null : Math.floor(s.value / 5);
      }
    }
  }

  function handlePanelChange(e) {
    var input = e.target.closest("input[data-field]");
    if (!input) return;
    if (input.id === "difficulty") return;
    var sheet = currentSheet();
    if (!sheet) return;
    var field = input.getAttribute("data-field");
    var isText = input.getAttribute("data-type") === "text";
    var v;
    if (isText) {
      v = input.value;
    } else {
      v = input.value === "" ? null : parseInt(input.value, 10);
      if (isNaN(v)) v = null;
    }
    setPath(sheet.data, field, v);
    if (!isText) recomputeDerived(sheet, field);
    Store.update(sheet.id, { data: sheet.data });
    if (state.editMode) renderRollPanel();
  }

  function handlePanelInput(e) {
    if (e.target && e.target.id === "difficulty") {
      state.difficulty = e.target.value;
    }
  }

  function selectSheet(id) {
    state.selectedId = id;
    try { localStorage.setItem(SELECTED_KEY, id); } catch (e) {}
    renderSheets();
    renderSheetSelect();
    renderRollPanel();
    refreshSearch();
  }

  function refresh() {
    state.sheets = Store.list();
    if (!state.sheets.some(function (s) { return s.id === state.selectedId; })) {
      state.selectedId = state.sheets.length ? state.sheets[0].id : null;
    }
    renderSheets();
    renderSheetSelect();
    renderRollPanel();
    refreshSearch();
  }

  function setStatus(msg, kind) {
    var el = document.getElementById("import-status");
    el.textContent = msg;
    el.className = "status " + (kind || "");
  }

  function exportSheetPdf(sheet) {
    if (!window.PdfExport || !PdfExport.isAvailable()) {
      setStatus(t("status.pdfUnavailable"), "err");
      return;
    }
    setStatus(t("status.pdfWorking"));
    Store.getPdf(sheet.id).then(function (bytes) {
      if (!bytes) { setStatus(t("status.pdfMissing"), "err"); return; }
      return PdfExport.build(sheet, bytes).then(function (out) {
        Store.downloadBlob(SheetMapper.slug(sheet.name) + ".pdf", new Blob([out], { type: "application/pdf" }));
        setStatus(t("status.pdfExported"), "ok");
      });
    }).catch(function (err) {
      setStatus(t("status.pdfError", { err: err.message }), "err");
    });
  }

  function importFiles(files) {
    var arr = Array.prototype.slice.call(files);
    if (!arr.length) return;
    setStatus(t("status.processing", { n: arr.length }));
    var added = 0, errors = [];

    var chain = Promise.resolve();
    arr.forEach(function (file) {
      chain = chain.then(function () {
        if (/\.json$/i.test(file.name)) {
          return file.text().then(function (txt) {
            var sheets = Store.parseImport(txt);
            if (!sheets.length) throw new Error(t("status.jsonInvalid"));
            sheets.forEach(function (s) { if (!s.source) s.source = file.name; });
            Store.addMany(sheets);
            added += sheets.length;
          });
        }
        return PdfImport.fromFileFull(file).then(function (r) {
          var sys = SheetMapper.detectSystem(r.fields);
          if (!sys) throw new Error(t("status.notRecognized"));
          var sheet = SheetMapper.buildSheet(sys, r.fields, { source: file.name });
          sheet.hasPdf = true;
          Store.add(sheet);
          added++;
          return Store.putPdf(sheet.id, r.bytes).catch(function () {
            Store.update(sheet.id, { hasPdf: false });
          });
        });
      }).catch(function (err) {
        errors.push(file.name + ": " + err.message);
      });
    });

    chain.then(function () {
      refresh();
      if (added && !errors.length) {
        setStatus(t("status.importedOk", { n: added }), "ok");
        showView("roll");
      } else if (added && errors.length) {
        setStatus(t("status.importedPartial", { n: added, errs: errors.join("; ") }), "err");
        showView("roll");
      } else {
        setStatus(t("status.failed", { errs: errors.join("; ") }), "err");
      }
    });
  }

  function updateTopbarHeight() {
    var tb = document.querySelector(".topbar");
    var de = document.documentElement;
    if (tb && de && de.style && de.style.setProperty) {
      de.style.setProperty("--topbar-h", tb.offsetHeight + "px");
    }
  }

  function showView(name) {
    document.querySelectorAll(".tab").forEach(function (t) {
      t.classList.toggle("active", t.getAttribute("data-view") === name);
    });
    document.querySelectorAll(".view").forEach(function (v) {
      v.classList.toggle("active", v.id === "view-" + name);
    });
  }

  function init() {
    Store.seed(window.DICE2_EXAMPLES || []);
    loadHistory();
    try { state.selectedId = localStorage.getItem(SELECTED_KEY) || null; } catch (e) {}
    var storedTheme = "dark";
    try { storedTheme = localStorage.getItem(THEME_KEY) || "dark"; } catch (e) {}
    applyTheme(storedTheme);

    document.getElementById("tabs").addEventListener("click", function (e) {
      var t = e.target.closest(".tab");
      if (t) showView(t.getAttribute("data-view"));
    });

    document.getElementById("file-pdf").addEventListener("change", function (e) {
      importFiles(e.target.files);
      e.target.value = "";
    });
    document.getElementById("file-json").addEventListener("change", function (e) {
      importFiles(e.target.files);
      e.target.value = "";
    });

    var dz = document.getElementById("dropzone");
    ["dragenter", "dragover"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.add("hover"); });
    });
    ["dragleave", "drop"].forEach(function (ev) {
      dz.addEventListener(ev, function (e) { e.preventDefault(); dz.classList.remove("hover"); });
    });
    dz.addEventListener("drop", function (e) {
      if (e.dataTransfer && e.dataTransfer.files) importFiles(e.dataTransfer.files);
    });

    document.getElementById("export-all").addEventListener("click", function () {
      if (!state.sheets.length) return setStatus(t("status.nothingExport"), "err");
      Store.downloadAll();
      setStatus(t("status.exportStarted"), "ok");
    });

    document.getElementById("sheet-list").addEventListener("click", function (e) {
      var card = e.target.closest(".sheet-card");
      if (!card) return;
      var id = card.getAttribute("data-id");
      var act = e.target.getAttribute("data-act");
      if (act === "select") { selectSheet(id); showView("roll"); }
      else if (act === "export") { var s = state.sheets.filter(function (x) { return x.id === id; })[0]; if (s) Store.downloadSheet(s); }
      else if (act === "export-pdf") { var sp = state.sheets.filter(function (x) { return x.id === id; })[0]; if (sp) exportSheetPdf(sp); }
      else if (act === "remove") {
        if (confirm(t("sheets.confirmRemove"))) { Store.remove(id); refresh(); }
      }
    });

    document.getElementById("sheet-select").addEventListener("change", function (e) {
      selectSheet(e.target.value);
    });

    var panel = document.getElementById("sheet-panel");
    panel.addEventListener("click", handlePanelClick);
    panel.addEventListener("input", handlePanelInput);
    panel.addEventListener("change", function (e) {
      if (e.target.id === "difficulty") return;
      handlePanelChange(e);
    });

    document.getElementById("free-roll-btn").addEventListener("click", doFreeRoll);
    document.getElementById("free-expr").addEventListener("keydown", function (e) {
      if (e.key === "Enter") doFreeRoll();
    });

    var searchInput = document.getElementById("roll-search");
    searchInput.addEventListener("input", onSearchInput);
    searchInput.addEventListener("keydown", onSearchKey);
    searchInput.addEventListener("focus", function () { search.focused = true; renderSearch(); });
    searchInput.addEventListener("blur", function () { search.focused = false; setTimeout(renderSearch, 0); });

    document.getElementById("search-chips").addEventListener("mousedown", function (e) {
      if (e.target.closest(".chip")) e.preventDefault();
    });
    document.getElementById("search-results").addEventListener("mousedown", function (e) {
      if (e.target.closest(".search-item")) e.preventDefault();
    });

    document.getElementById("search-chips").addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (!chip) return;
      search.group = chip.getAttribute("data-group");
      search.active = -1;
      computeResults();
      if (searchInput.focus) searchInput.focus();
      renderSearch();
    });

    document.getElementById("search-results").addEventListener("click", function (e) {
      var item = e.target.closest(".search-item");
      if (item) runSearchItem(Number(item.getAttribute("data-idx")));
    });

    document.getElementById("last-roll").addEventListener("click", function (e) {
      var actBtn = e.target.closest("[data-action]");
      if (actBtn) { runAction(actBtn.getAttribute("data-action")); return; }
      if (e.target.closest("#reroll-btn") && state.lastDescriptor) {
        var res = rollDescriptor(state.lastDescriptor);
        if (res) presentResult(res, state.lastDescriptor);
      }
    });

    document.addEventListener("keydown", function (e) {
      var tag = (e.target && e.target.tagName || "").toLowerCase();
      var typing = tag === "input" || tag === "textarea" || tag === "select";
      if (e.key === "/" && !typing) {
        e.preventDefault();
        focusSearch();
      } else if ((e.ctrlKey || e.metaKey) && String(e.key).toLowerCase() === "k") {
        e.preventDefault();
        focusSearch();
      }
    });

    document.getElementById("clear-history").addEventListener("click", function () {
      state.history = [];
      saveHistory();
      renderHistory();
    });

    document.getElementById("lang-switch").addEventListener("click", function (e) {
      var b = e.target.closest("[data-lang]");
      if (b) I18n.set(b.getAttribute("data-lang"));
    });

    document.getElementById("theme-toggle").addEventListener("click", function () {
      var cur = document.documentElement.getAttribute("data-theme") === "light" ? "light" : "dark";
      setTheme(cur === "light" ? "dark" : "light");
    });

    document.getElementById("edit-toggle").addEventListener("click", function () {
      state.editMode = !state.editMode;
      renderRollPanel();
    });

    var qd = document.getElementById("qd-buttons");
    if (qd) qd.addEventListener("click", function (e) {
      var b = e.target.closest("[data-die]");
      if (b) rollQuick(Number(b.getAttribute("data-die")));
    });

    I18n.onChange(function () {
      I18n.apply();
      refresh();
      renderHistory();
      updateTopbarHeight();
      var w = document.getElementById("storage-warn");
      if (w && /warn/.test(w.className)) w.textContent = t("status.storageWarn");
    });

    if (!Store.hasStorage()) {
      var w = document.getElementById("storage-warn");
      w.className = "warn";
      w.textContent = t("status.storageWarn");
    }

    I18n.apply();
    refresh();
    renderHistory();
    updateTopbarHeight();
    if (window.addEventListener) window.addEventListener("resize", updateTopbarHeight);
    if (window.addEventListener) window.addEventListener("orientationchange", updateTopbarHeight);
  }

  function rollQuick(sides) {
    var qtyEl = document.getElementById("qd-qty");
    var modEl = document.getElementById("qd-mod");
    var qty = parseInt(qtyEl && qtyEl.value, 10);
    if (isNaN(qty) || qty < 1) qty = 1;
    if (qty > 50) qty = 50;
    var mod = 0;
    var ms = modEl ? String(modEl.value).trim() : "";
    if (/^[+-]?\d+$/.test(ms)) mod = parseInt(ms, 10);
    var expr = qty + "d" + sides + (mod ? signed(mod) : "");
    var label = t("roll.quick", { expr: expr });
    presentResult(rollExpr(label, expr, null), { act: "expr", label: label, expr: expr, system: null });
  }

  function applyTheme(name) {
    var de = document.documentElement;
    if (name === "light") {
      if (de.setAttribute) de.setAttribute("data-theme", "light");
    } else if (de.removeAttribute) {
      de.removeAttribute("data-theme");
    }
  }

  function setTheme(name) {
    name = name === "light" ? "light" : "dark";
    applyTheme(name);
    try { localStorage.setItem(THEME_KEY, name); } catch (e) {}
  }

  function freeRollExpr(expr) {
    try {
      var label = t("roll.free", { expr: expr });
      presentResult(rollExpr(label, expr, null), { act: "expr", label: label, expr: expr, system: null });
    } catch (err) {
      document.getElementById("last-roll").innerHTML =
        '<span class="tag bad">' + esc(t("status.invalidExpr")) + "</span> " + esc(err.message);
    }
  }

  function doFreeRoll() {
    var input = document.getElementById("free-expr");
    var expr = input.value.trim();
    if (!expr) return;
    freeRollExpr(expr);
  }

  document.addEventListener("DOMContentLoaded", init);
})();
