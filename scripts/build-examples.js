/* Build-time helper: writes data/examples.js with blank starter templates
 * (one D&D 5e, one Call of Cthulhu 7e) using the same mapper the browser app uses.
 * Usage (from project root): node scripts/build-examples.js
 */
"use strict";

var path = require("path");
var fs = require("fs");

var ROOT = path.resolve(__dirname, "..");
var SheetMapper = require(path.join(ROOT, "js", "mapper.js"));

var STAMP = "2026-01-01T00:00:00.000Z";

var SOURCES = [
  { system: "dnd", id: "template-dnd", name: "Ficha em Branco — D&D 5e" },
  { system: "coc", id: "template-coc", name: "Ficha em Branco — CoC 7e" }
];

var out = SOURCES.map(function (src) {
  var sheet = SheetMapper.blankSheet(src.system, {
    id: src.id,
    name: src.name,
    createdAt: STAMP,
    updatedAt: STAMP
  });
  console.log("+ " + src.system + " -> " + sheet.name + " (" + sheet.data.skills.length + " perícias)");
  return sheet;
});

var body =
  '(function (root, factory) {\n' +
  '  if (typeof module === "object" && module.exports) { module.exports = factory(); }\n' +
  '  else { root.DICE2_EXAMPLES = factory(); }\n' +
  '})(typeof self !== "undefined" ? self : this, function () {\n' +
  '  "use strict";\n' +
  "  return " + JSON.stringify(out, null, 2) + ";\n" +
  "});\n";

var dest = path.join(ROOT, "data", "examples.js");
fs.writeFileSync(dest, body, "utf8");
console.log("escrito:", path.relative(ROOT, dest), "(" + out.length + " fichas)");
