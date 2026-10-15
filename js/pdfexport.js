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

  root.PdfExport = {
    isAvailable: isAvailable,
    setField: setField,
    build: build
  };
})(typeof window !== "undefined" ? window : this);
