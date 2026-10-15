(function (root) {
  "use strict";

  var KEY = "dice2.sheets.v1";
  var SEEDED = "dice2.seeded.v1";

  function hasStorage() {
    try {
      var t = "__dice2__";
      root.localStorage.setItem(t, "1");
      root.localStorage.removeItem(t);
      return true;
    } catch (e) {
      return false;
    }
  }

  var memory = null;

  function readRaw() {
    if (hasStorage()) {
      try {
        return JSON.parse(root.localStorage.getItem(KEY) || "[]");
      } catch (e) {
        return [];
      }
    }
    return memory || [];
  }

  function writeRaw(list) {
    if (hasStorage()) {
      root.localStorage.setItem(KEY, JSON.stringify(list));
    } else {
      memory = list;
    }
  }

  function list() {
    return readRaw();
  }

  function get(id) {
    return readRaw().filter(function (s) { return s.id === id; })[0] || null;
  }

  function add(sheet) {
    var all = readRaw();
    all.push(sheet);
    writeRaw(all);
    return sheet;
  }

  function addMany(sheets) {
    var all = readRaw();
    sheets.forEach(function (s) { all.push(s); });
    writeRaw(all);
    return sheets;
  }

  function update(id, patch) {
    var all = readRaw();
    for (var i = 0; i < all.length; i++) {
      if (all[i].id === id) {
        patch.updatedAt = new Date().toISOString();
        all[i] = Object.assign({}, all[i], patch);
        writeRaw(all);
        return all[i];
      }
    }
    return null;
  }

  function remove(id) {
    writeRaw(readRaw().filter(function (s) { return s.id !== id; }));
    delPdf(id);
  }

  function idbOpen() {
    return new Promise(function (resolve, reject) {
      if (!root.indexedDB) { reject(new Error("no-indexeddb")); return; }
      var req = root.indexedDB.open("dice2.pdfs", 1);
      req.onupgradeneeded = function () {
        var db = req.result;
        if (!db.objectStoreNames.contains("pdfs")) db.createObjectStore("pdfs");
      };
      req.onsuccess = function () { resolve(req.result); };
      req.onerror = function () { reject(req.error); };
    });
  }

  function idbWrite(mode, key, val) {
    return idbOpen().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction("pdfs", mode);
        var store = tx.objectStore("pdfs");
        var out;
        if (mode === "readwrite") { store.put(val, key); } else { out = store.get(key); }
        tx.oncomplete = function () {
          db.close();
          resolve(mode === "readwrite" ? true : (out ? out.result : null));
        };
        tx.onerror = function () { db.close(); reject(tx.error); };
      });
    });
  }

  function putPdf(id, bytes) {
    return idbWrite("readwrite", id, bytes);
  }

  function getPdf(id) {
    return idbWrite("readonly", id).catch(function () { return null; });
  }

  function delPdf(id) {
    return new Promise(function (resolve) {
      idbOpen().then(function (db) {
        var tx = db.transaction("pdfs", "readwrite");
        tx.objectStore("pdfs").delete(id);
        tx.oncomplete = function () { db.close(); resolve(true); };
        tx.onerror = function () { db.close(); resolve(false); };
      }).catch(function () { resolve(false); });
    });
  }

  function clear() {
    writeRaw([]);
    idbOpen().then(function (db) {
      var tx = db.transaction("pdfs", "readwrite");
      tx.objectStore("pdfs").clear();
      tx.oncomplete = function () { db.close(); };
    }).catch(function () {});
  }

  function seed(examples) {
    if (hasStorage() && root.localStorage.getItem(SEEDED)) return false;
    if (readRaw().length) return false;
    if (!examples || !examples.length) return false;
    var copies = JSON.parse(JSON.stringify(examples));
    copies.forEach(function (s) {
      if (!s.id) s.id = "seed_" + Math.random().toString(36).slice(2, 8);
    });
    writeRaw(copies);
    if (hasStorage()) root.localStorage.setItem(SEEDED, "1");
    return true;
  }

  function downloadBlob(filename, blob) {
    var url = URL.createObjectURL(blob);
    var a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(function () { URL.revokeObjectURL(url); }, 1000);
  }

  function download(filename, text) {
    downloadBlob(filename, new Blob([text], { type: "application/json;charset=utf-8" }));
  }

  function downloadSheet(sheet) {
    var slug = SheetMapper.slug(sheet.name);
    download(slug + "." + sheet.system + ".ficha.json", JSON.stringify(sheet, null, 2));
  }

  function downloadAll() {
    download("fichas.dice2.json", JSON.stringify(readRaw(), null, 2));
  }

  function parseImport(text) {
    var data = JSON.parse(text);
    var arr = Array.isArray(data) ? data : [data];
    var valid = arr.filter(function (s) {
      return s && s.system && s.data && (s.system === "dnd" || s.system === "coc");
    });
    valid.forEach(function (s) {
      if (!s.id) s.id = SheetMapper.uid();
    });
    return valid;
  }

  root.Store = {
    list: list,
    get: get,
    add: add,
    addMany: addMany,
    update: update,
    remove: remove,
    clear: clear,
    seed: seed,
    download: download,
    downloadBlob: downloadBlob,
    downloadSheet: downloadSheet,
    downloadAll: downloadAll,
    parseImport: parseImport,
    putPdf: putPdf,
    getPdf: getPdf,
    delPdf: delPdf,
    hasStorage: hasStorage
  };
})(window);
