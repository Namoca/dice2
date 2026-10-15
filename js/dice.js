(function (root, factory) {
  if (typeof module === "object" && module.exports) {
    module.exports = factory();
  } else {
    root.Dice = factory();
  }
})(typeof self !== "undefined" ? self : this, function () {
  "use strict";

  function parseExpr(expr) {
    var s = String(expr || "").replace(/\s+/g, "").toUpperCase();
    if (!s) throw new Error("Expressão vazia");
    if (s.charAt(0) !== "+" && s.charAt(0) !== "-") s = "+" + s;
    var terms = [];
    var i = 0;
    while (i < s.length) {
      var sign = s.charAt(i) === "-" ? -1 : 1;
      i++;
      var digits = "";
      while (i < s.length && s.charAt(i) >= "0" && s.charAt(i) <= "9") {
        digits += s.charAt(i);
        i++;
      }
      if (s.charAt(i) === "D") {
        i++;
        var sidesStr = "";
        if (s.charAt(i) === "%") {
          sidesStr = "100";
          i++;
        } else {
          while (i < s.length && s.charAt(i) >= "0" && s.charAt(i) <= "9") {
            sidesStr += s.charAt(i);
            i++;
          }
        }
        if (!sidesStr) throw new Error("Dado sem lados: " + expr);
        terms.push({
          type: "dice",
          sign: sign,
          count: digits ? parseInt(digits, 10) : 1,
          sides: parseInt(sidesStr, 10)
        });
      } else {
        if (!digits) throw new Error("Expressão inválida: " + expr);
        terms.push({ type: "const", sign: sign, value: parseInt(digits, 10) });
      }
    }
    return terms;
  }

  function roll(expr, opts) {
    opts = opts || {};
    var rnd = opts.random || Math.random;
    var terms = parseExpr(expr);
    var total = 0;
    var parts = [];
    var values = [];
    terms.forEach(function (t) {
      var signStr = parts.length ? (t.sign < 0 ? " - " : " + ") : (t.sign < 0 ? "-" : "");
      if (t.type === "const") {
        total += t.sign * t.value;
        parts.push(signStr + t.value);
      } else {
        var results = [];
        for (var k = 0; k < t.count; k++) {
          var v = Math.floor(rnd() * t.sides) + 1;
          results.push(v);
          values.push(v);
        }
        var sub = results.reduce(function (a, b) { return a + b; }, 0);
        total += t.sign * sub;
        parts.push(signStr + t.count + "d" + t.sides + " [" + results.join(", ") + "]");
      }
    });
    return {
      expr: String(expr),
      total: total,
      values: values,
      detail: parts.join(""),
      text: parts.join("") + " = " + total
    };
  }

  function cocSuccess(value, target) {
    target = Number(target) || 0;
    if (value === 1) return "critical";
    if (value === 100) return "fumble";
    if (target < 50 && value >= 96) return "fumble";
    if (value <= Math.floor(target / 5)) return "extreme";
    if (value <= Math.floor(target / 2)) return "hard";
    if (value <= target) return "regular";
    return "failure";
  }

  var COC_LABELS = {
    critical: "Crítico",
    extreme: "Extremo",
    hard: "Difícil",
    regular: "Regular",
    failure: "Falha",
    fumble: "Desastre"
  };

  function test(expr, random) {
    var r = roll(expr, { random: random });
    return r.total;
  }

  return {
    parseExpr: parseExpr,
    roll: roll,
    cocSuccess: cocSuccess,
    cocLabels: COC_LABELS,
    d: function (sides, random) {
      return Math.floor((random || Math.random)() * sides) + 1;
    }
  };
});
