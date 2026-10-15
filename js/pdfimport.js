(function (root) {
  "use strict";

  function lib() {
    if (!root.pdfjsLib) throw new Error("pdf.js não carregado (js/vendor/pdf.min.js).");
    return root.pdfjsLib;
  }

  function configureWorker() {
    var pdfjs = lib();
    var isHttp = /^https?:$/.test(root.location.protocol);
    if (isHttp) {
      pdfjs.GlobalWorkerOptions.workerSrc = "js/vendor/pdf.worker.min.js";
    }
    return pdfjs;
  }

  function readAsArrayBuffer(file) {
    return new Promise(function (resolve, reject) {
      var reader = new FileReader();
      reader.onload = function () { resolve(reader.result); };
      reader.onerror = function () { reject(reader.error || new Error("Falha ao ler o arquivo.")); };
      reader.readAsArrayBuffer(file);
    });
  }

  function extractFields(buffer) {
    var pdfjs = configureWorker();
    return pdfjs
      .getDocument({ data: buffer, isEvalSupported: false, useWorkerFetch: false })
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
                  var value;
                  if (a.fieldType === "Btn") {
                    value = a.fieldValue || (a.checkBox && a.checked ? "Yes" : null);
                  } else {
                    value = a.fieldValue != null ? a.fieldValue : null;
                  }
                  if (!(name in fields) || (fields[name] == null && value != null)) {
                    fields[name] = value;
                  }
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

  function fromFile(file) {
    return readAsArrayBuffer(file).then(function (buf) {
      return extractFields(buf);
    });
  }

  function fromFileFull(file) {
    return readAsArrayBuffer(file).then(function (buf) {
      return extractFields(buf.slice(0)).then(function (fields) {
        return { fields: fields, bytes: buf };
      });
    });
  }

  root.PdfImport = {
    fromFile: fromFile,
    fromFileFull: fromFileFull,
    extractFields: extractFields
  };
})(window);
