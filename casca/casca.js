/* Abertura da casca: usa a cópia baixada (IndexedDB) ou, sem ela, a cópia que veio no .ipk (base.html).
 * Nunca toca na rede. Uma cópia que não confirmou a abertura duas vezes é trocada pela anterior. */
(function () {
  'use strict';
  function base() { location.replace('base.html'); }
  function escrever(c) {
    var tag = '</' + 'script>';
    var fim = '<script>window.CASCA_ATUAL=' + JSON.stringify(c.id) + ';' + tag + '<script src="tv-config.js">' + tag + '<script src="casca-update.js">' + tag;
    document.open(); document.write(c.html + fim); document.close();
  }
  function tentativas(id) { try { return JSON.parse(localStorage.getItem('casca.abrindo') || 'null'); } catch (e) { return null; } }
  function marcar(id, n) { try { localStorage.setItem('casca.abrindo', JSON.stringify({ id: id, n: n })); } catch (e) {} }

  var req;
  try { req = indexedDB.open('casca', 1); } catch (e) { base(); return; }
  req.onerror = base;
  req.onupgradeneeded = function () { req.result.createObjectStore('copias'); };
  req.onsuccess = function () {
    var loja = req.result.transaction('copias', 'readwrite').objectStore('copias'), lidas = {};
    function ler(k, depois) { var r = loja.get(k); r.onsuccess = function () { lidas[k] = r.result; depois(); }; r.onerror = base; }
    ler('atual', function () { ler('anterior', function () {
      var c = lidas.atual, t = c && tentativas();
      if (c && t && t.id === c.id && t.n >= 2) {
        // esta versão não abriu duas vezes: fica marcada para não ser baixada de novo
        try { localStorage.setItem('casca.ruim', c.id); } catch (e) {}
        c = lidas.anterior;
        if (c) { loja.put(c, 'atual'); loja.delete('anterior'); } else loja.delete('atual');
        t = null;
      }
      if (!c) { base(); return; }
      marcar(c.id, t && t.id === c.id ? t.n + 1 : 1);
      escrever(c);
    }); });
  };
})();
