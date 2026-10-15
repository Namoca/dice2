(function (root) {
  "use strict";

  function prefersReducedMotion() {
    try {
      return !!(root.matchMedia && root.matchMedia("(prefers-reduced-motion: reduce)").matches);
    } catch (e) { return false; }
  }

  var PIP_SETS = {
    1: [4],
    2: [0, 8],
    3: [0, 4, 8],
    4: [0, 2, 6, 8],
    5: [0, 2, 4, 6, 8],
    6: [0, 2, 3, 5, 6, 8]
  };

  function pad2(n) { return (n < 10 ? "0" : "") + n; }

  function pipGrid(value) {
    var set = PIP_SETS[value] || [];
    var cells = "";
    for (var i = 0; i < 9; i++) {
      cells += '<span class="cell">' + (set.indexOf(i) >= 0 ? '<span class="pip"></span>' : "") + "</span>";
    }
    return cells;
  }

  function faceText(desc, dv) {
    if (desc.mode === "tens") return pad2(dv * 10);
    return String(dv);
  }

  function randomFace(desc) {
    if (desc.mode === "tens" || desc.mode === "units") return Math.floor(Math.random() * 10);
    return Math.floor(Math.random() * desc.max) + 1;
  }

  function faceInner(desc, dv) {
    if (desc.mode === "pip") return '<div class="pips">' + pipGrid(dv) + "</div>";
    return '<span class="num">' + faceText(desc, dv) + "</span>";
  }

  function dieHTML(desc) {
    var tag = desc.tag ? '<span class="die-tag">' + desc.tag + "</span>" : "";
    return '<div class="die die-' + desc.mode + '"><div class="face">' +
      faceInner(desc, desc.value) + "</div>" + tag + "</div>";
  }

  function expand(dice) {
    var out = [];
    (dice || []).forEach(function (d) {
      var sides = Number(d.sides) || 20;
      var value = Number(d.value) || 1;
      if (sides === 100) {
        var tens = value >= 100 ? 0 : Math.floor(value / 10);
        var units = value >= 100 ? 0 : value % 10;
        out.push({ mode: "tens", max: 9, value: tens, final: tens });
        out.push({ mode: "units", max: 9, value: units, final: units });
      } else if (sides === 6) {
        out.push({ mode: "pip", max: 6, sides: sides, value: value, final: value, tag: "d6" });
      } else {
        out.push({ mode: "num", max: sides, sides: sides, value: value, final: value, tag: "d" + sides });
      }
    });
    return out.slice(0, 16);
  }

  function setFace(el, desc, dv) {
    var face = el.querySelector(".face");
    if (face) face.innerHTML = faceInner(desc, dv);
  }

  var timers = { iv: null, to: null };

  function stop() {
    if (timers.iv) { clearInterval(timers.iv); timers.iv = null; }
    if (timers.to) { clearTimeout(timers.to); timers.to = null; }
  }

  function play(tray, dice) {
    if (!tray) return;
    stop();
    var visuals = expand(dice);
    if (!visuals.length) {
      tray.hidden = true;
      tray.innerHTML = "";
      return;
    }
    tray.hidden = false;
    tray.innerHTML = visuals.map(dieHTML).join("");
    var els = [].slice.call(tray.querySelectorAll(".die"));

    if (prefersReducedMotion()) {
      els.forEach(function (el) { el.classList.add("settle"); });
      return;
    }

    els.forEach(function (el) { el.classList.add("rolling"); });

    timers.iv = setInterval(function () {
      for (var i = 0; i < els.length; i++) setFace(els[i], visuals[i], randomFace(visuals[i]));
    }, 70);

    var dur = 620 + Math.min(visuals.length, 8) * 30;
    timers.to = setTimeout(function () {
      clearInterval(timers.iv); timers.iv = null; timers.to = null;
      for (var i = 0; i < els.length; i++) {
        var el = els[i];
        el.classList.remove("rolling");
        setFace(el, visuals[i], visuals[i].final);
        void el.offsetWidth;
        el.classList.add("settle");
      }
    }, dur);
  }

  root.DiceAnim = {
    play: play,
    stop: stop,
    prefersReducedMotion: prefersReducedMotion,
    _expand: expand
  };
})(typeof window !== "undefined" ? window : this);
