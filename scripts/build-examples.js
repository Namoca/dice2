/* Build-time helper: extracts the AcroForm fields from the example PDFs and
 * writes data/examples.js using the same mapper the browser app uses.
 * Usage (from project root): node scripts/build-examples.js
 */
"use strict";

var path = require("path");
var fs = require("fs");

var ROOT = path.resolve(__dirname, "..");
var pdfjsLib = require(path.join(ROOT, "js", "vendor", "pdf.min.js"));
var SheetMapper = require(path.join(ROOT, "js", "mapper.js"));

pdfjsLib.GlobalWorkerOptions.workerSrc = path.join(ROOT, "js", "vendor", "pdf.worker.min.js");

var SOURCES = [
  { file: "Example d&d.pdf", id: "example-dnd" },
  { file: "Example cthulhu.pdf", id: "example-coc" }
];

function extractFields(filePath) {
  return pdfjsLib
    .getDocument({ url: filePath, useWorkerFetch: false, isEvalSupported: false })
    .promise.then(function (doc) {
      var fields = {};
      var chain = Promise.resolve();
      var pages = [];
      for (var p = 1; p <= doc.numPages; p++) pages.push(p);

      pages.forEach(function (p) {
        chain = chain.then(function () {
          return doc.getPage(p).then(function (page) {
            return page.getAnnotations().then(function (anns) {
              anns.forEach(function (a) {
                if (a.fieldName == null) return;
                var name = String(a.fieldName).trim();
                var value = a.fieldType === "Btn"
                  ? (a.fieldValue || (a.checkBox && a.checked ? "Yes" : null))
                  : (a.fieldValue != null ? a.fieldValue : null);
                if (!(name in fields) || (fields[name] == null && value != null)) fields[name] = value;
              });
            });
          });
        });
      });

      return chain.then(function () {
        return doc.destroy().then(function () { return fields; });
      });
    });
}

(function main() {
  var out = [];
  var chain = Promise.resolve();
  SOURCES.forEach(function (src) {
    chain = chain.then(function () {
      var filePath = path.join(ROOT, src.file);
      if (!fs.existsSync(filePath)) {
        console.warn("! não encontrado, ignorando:", src.file);
        return;
      }
      return extractFields(filePath).then(function (raw) {
        var sys = SheetMapper.detectSystem(raw);
        if (!sys) throw new Error("sistema não detectado em " + src.file);
        var sheet = SheetMapper.buildSheet(sys, raw, {
          id: src.id,
          source: src.file,
          createdAt: "2026-01-01T00:00:00.000Z"
        });
        sheet.updatedAt = "2026-01-01T00:00:00.000Z";
        out.push(sheet);
        console.log("+ " + src.file + " -> " + sys + " (" + sheet.name + ")");
      });
    });
  });

  chain
    .then(function () {
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
    })
    .catch(function (err) {
      console.error("ERRO:", err);
      process.exit(1);
    });
})();
