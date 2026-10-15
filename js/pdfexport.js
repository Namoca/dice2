(function (root) {
  "use strict";

  function isAvailable() {
    return !!(root.PDFLib && root.PDFLib.PDFDocument);
  }

  function setField(form, name, value) {
    var field;
    try {
      field = form.getField(name);
    } catch (e) {
      return false;
    }
    if (!field) return false;
    try {
      if (typeof field.check === "function" && typeof field.uncheck === "function") {
        if (value) field.check(); else field.uncheck();
      } else if (typeof field.setText === "function") {
        field.setText(value == null ? "" : String(value));
      } else if (typeof field.select === "function") {
        field.select(String(value));
      } else {
        return false;
      }
      return true;
    } catch (e) {
      return false;
    }
  }

  function build(sheet, bytes) {
    return new Promise(function (resolve, reject) {
      if (!isAvailable()) { reject(new Error("pdf-lib-missing")); return; }
      if (!root.SheetMapper || !root.SheetMapper.toRaw) { reject(new Error("mapper-missing")); return; }
      var map = root.SheetMapper.toRaw(sheet);
      root.PDFLib.PDFDocument.load(bytes, { ignoreEncryption: true, updateMetadata: false })
        .then(function (doc) {
          var form = doc.getForm();
          Object.keys(map).forEach(function (name) {
            setField(form, name, map[name]);
          });
          try { form.updateFieldAppearances(); } catch (e) {}
          return doc.save({ updateFieldAppearances: true });
        })
        .then(resolve, reject);
    });
  }

  // Blank fillable templates bundled with the app, used to create a PDF for
  // sheets that have no imported original (e.g. the blank starter templates).
  var TEMPLATES = {
    dnd: "assets/templates/dnd-5e.pdf",
    coc: "assets/templates/coc-7e.pdf"
  };
  var templateCache = {};

  function hasTemplate(system) {
    return !!TEMPLATES[system];
  }

  function loadTemplate(system) {
    return new Promise(function (resolve, reject) {
      if (!hasTemplate(system)) { reject(new Error("template-missing")); return; }
      if (templateCache[system]) { resolve(templateCache[system]); return; }
      if (typeof root.fetch !== "function") { reject(new Error("fetch-unavailable")); return; }
      root.fetch(TEMPLATES[system]).then(function (res) {
        if (!res.ok) throw new Error("template-http-" + res.status);
        return res.arrayBuffer();
      }).then(function (buf) {
        templateCache[system] = buf;
        resolve(buf);
      }, reject);
    });
  }

  function buildFromTemplate(sheet) {
    return loadTemplate(sheet.system).then(function (bytes) {
      return build(sheet, bytes);
    });
  }

  // Uses the sheet's stored PDF when available, otherwise falls back to the
  // bundled blank template for its system.
  function resolveBytes(sheet) {
    var stored = (root.Store && root.Store.getPdf)
      ? root.Store.getPdf(sheet.id)
      : Promise.resolve(null);
    return Promise.resolve(stored).then(function (bytes) {
      if (bytes) return bytes;
      return loadTemplate(sheet.system);
    });
  }

  root.PdfExport = {
    isAvailable: isAvailable,
    setField: setField,
    build: build,
    hasTemplate: hasTemplate,
    loadTemplate: loadTemplate,
    buildFromTemplate: buildFromTemplate,
    resolveBytes: resolveBytes
  };
})(typeof window !== "undefined" ? window : this);
