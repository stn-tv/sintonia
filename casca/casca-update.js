/* Roda dentro do app já aberto. Confirma a abertura e procura versão nova em segundo plano,
 * sempre com o player fechado: nada aqui acontece durante a reprodução. Qualquer falha só mantém a cópia atual. */
(function () {
  'use strict';
  var C = window.CASCA || {}, ESPERA = 60000, CICLO = 6 * 3600000, TENTA_DE_NOVO = 120000;

  function assistindo() { var p = document.getElementById('player'); return !!p && !p.classList.contains('hidden'); }
  function conferir(t) { var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }
  function baixar(url, feito, falhou) {
    var x = new XMLHttpRequest();
    x.open('GET', url + '?t=' + Date.now()); x.timeout = 60000;
    x.onload = function () { if (x.status === 200) feito(x.responseText); else falhou(); };
    x.onerror = x.ontimeout = falhou;
    x.send();
  }
  function guardar(nova, feito) {
    var req = indexedDB.open('casca', 1);
    req.onupgradeneeded = function () { req.result.createObjectStore('copias'); };
    req.onerror = feito;
    req.onsuccess = function () {
      var tx = req.result.transaction('copias', 'readwrite'), loja = tx.objectStore('copias'), r = loja.get('atual');
      r.onsuccess = function () { if (r.result) loja.put(r.result, 'anterior'); loja.put(nova, 'atual'); };
      tx.oncomplete = tx.onerror = tx.onabort = function () { req.result.close(); feito(); };
    };
  }
  function procurar() {
    if (assistindo()) { setTimeout(procurar, TENTA_DE_NOVO); return; }
    if (!C.pages || !C.canal) return;
    var prox = function () { setTimeout(procurar, CICLO); };
    baixar(C.pages + 'versao.json', function (txt) {
      var v; try { v = JSON.parse(txt).canais[C.canal]; } catch (e) { prox(); return; }
      var ruim; try { ruim = localStorage.getItem('casca.ruim'); } catch (e) {}
      if (!v || v.id === (window.CASCA_ATUAL || C.baseId) || v.id === ruim) { prox(); return; }
      baixar(C.pages + v.arq, function (html) {
        if (html.length !== v.tam || conferir(html) !== v.confere) { prox(); return; } // download incompleto: fica a cópia atual
        guardar({ id: v.id, html: html, em: Date.now() }, prox);
      }, prox);
    }, prox);
  }

  // renova o Developer Mode a cada abertura; a resposta não importa, o agendamento no GitHub também renova
  function renovar() {
    if (!C.lgToken) return;
    new Image().src = 'https://developer.lge.com/secure/ResetDevModeSession.dev?sessionToken=' + encodeURIComponent(C.lgToken);
  }

  // __atl é a última linha de app.js: se existe, o app carregou inteiro e esta cópia está aprovada
  if (window.__atl) try { localStorage.removeItem('casca.abrindo'); } catch (e) {}
  setTimeout(renovar, 5000);
  setTimeout(procurar, ESPERA);
})();
