/* Só entra no pacote de TVs antigas (webOS 4.x, Chromium 53): o que falta nesse navegador. */
(function () {
  'use strict';
  window.ATL_CHUNK = 28; // menos itens de uma vez: a TV tem pouca memória
  if (!Object.values) Object.values = function (o) { return Object.keys(o).map(function (k) { return o[k]; }); };
  if (!Object.entries) Object.entries = function (o) { return Object.keys(o).map(function (k) { return [k, o[k]]; }); };
  if (!String.prototype.padStart) String.prototype.padStart = function (n, c) { var s = String(this); c = c || ' '; while (s.length < n) s = c + s; return s; };
  if (!window.globalThis) window.globalThis = window;
  if (!Promise.prototype.finally) Promise.prototype.finally = function (f) {
    return this.then(function (v) { return Promise.resolve(f()).then(function () { return v; }); }, function (e) { return Promise.resolve(f()).then(function () { throw e; }); });
  };
  // Chromium 53 entende scrollIntoView(objeto) como "alinhar no topo": aqui o item fica no centro, como nas TVs novas
  var nativo = Element.prototype.scrollIntoView;
  Element.prototype.scrollIntoView = function (o) {
    if (!o || typeof o !== 'object') return nativo.call(this, o);
    var box = this.parentNode;
    while (box && box !== document.body && !(box.scrollHeight > box.clientHeight && /auto|scroll/.test(getComputedStyle(box).overflowY))) box = box.parentNode;
    if (!box || box === document.body) return;
    var a = this.getBoundingClientRect(), b = box.getBoundingClientRect();
    if (o.block === 'center') box.scrollTop += a.top - b.top - (b.height - a.height) / 2;
    else if (a.top < b.top) box.scrollTop -= b.top - a.top;
    else if (a.bottom > b.bottom) box.scrollTop += a.bottom - b.bottom;
  };
})();
