/* Build-time helper: creates blank fillable PDF templates used by the app to
 * generate PDFs for sheets that have no imported original (e.g. the blank
 * starter templates). It loads a filled AcroForm PDF and clears every field,
 * keeping only the empty form structure.
 *
 * The blank templates are already committed under assets/templates/. Re-run
 * this only if you want to rebuild them from a filled form (e.g. an updated
 * official sheet). The original filled D&D/CoC forms are not part of the repo.
 *
 * Usage (from project root):
 *   node scripts/build-templates.js "path/to/filled.pdf" assets/templates/name.pdf
 */
"use strict";

var path = require("path");
var fs = require("fs");

var ROOT = path.resolve(__dirname, "..");
var PDFLib = require(path.join(ROOT, "js", "vendor", "pdf-lib.min.js"));

var DEFAULT_SOURCES = [
  { src: "Example d&d.pdf", out: "assets/templates/dnd-5e.pdf" },
  { src: "Example cthulhu.pdf", out: "assets/templates/coc-7e.pdf" }
];

function clearField(field) {
  if (field instanceof PDFLib.PDFTextField) { field.setText(""); return true; }
  if (field instanceof PDFLib.PDFCheckBox) { field.uncheck(); return true; }
  if (field instanceof PDFLib.PDFRadioGroup) { field.clear(); return true; }
  if (field instanceof PDFLib.PDFDropdown) { field.clear(); return true; }
  if (field instanceof PDFLib.PDFOptionList) { field.clear(); return true; }
  return false;
}

function blankPdf(srcPath, destPath) {
  return fs.promises.readFile(srcPath).then(function (bytes) {
    return PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false });
  }).then(function (doc) {
    var form = doc.getForm();
    var fields = form.getFields();
    var cleared = 0;
    fields.forEach(function (field) {
      try { if (clearField(field)) cleared++; } catch (e) {}
    });
    try { form.updateFieldAppearances(); } catch (e) {}
    return doc.save({ updateFieldAppearances: false, useObjectStreams: true }).then(function (out) {
      fs.mkdirSync(path.dirname(destPath), { recursive: true });
      fs.writeFileSync(destPath, out);
      console.log("+ " + path.relative(ROOT, srcPath) + " -> " + path.relative(ROOT, destPath) +
        " (" + cleared + "/" + fields.length + " campos limpos)");
    });
  });
}

(function main() {
  var args = process.argv.slice(2);
  var sources = args.length >= 2
    ? [{ src: args[0], out: args[1] }]
    : DEFAULT_SOURCES;

  var chain = Promise.resolve();
  sources.forEach(function (s) {
    chain = chain.then(function () {
      var srcPath = path.resolve(ROOT, s.src);
      if (!fs.existsSync(srcPath)) {
        console.warn("! não encontrado, ignorando:", s.src);
        return;
      }
      return blankPdf(srcPath, path.resolve(ROOT, s.out));
    });
  });
  chain.catch(function (err) {
    console.error("ERRO:", err);
    process.exit(1);
  });
})();
