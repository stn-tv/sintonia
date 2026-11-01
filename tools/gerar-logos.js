// Gera app/js/logos.js: índice nome do canal -> logo, a partir de bancos públicos.
// Só guarda os endereços; as imagens continuam nos bancos. Rodar de vez em quando: node tools/gerar-logos.js
var fs = require('fs'), path = require('path');
var RAW = 'https://raw.githubusercontent.com/tv-logo/tv-logos/main/';
var PASTAS = ['countries/brazil', 'countries/international', 'countries/united-states'];

function compact(s) { return String(s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, ''); }
function json(u, h) { return fetch(u, { headers: h || {} }).then(function (r) { if (!r.ok) throw new Error(u + ' HTTP ' + r.status); return r.json(); }); }

(async function () {
  var mapa = {}, gh = { 'User-Agent': 'atl-player', Accept: 'application/vnd.github+json' };
  function poe(nome, url) { var k = compact(nome); if (k.length > 1 && !mapa[k]) mapa[k] = url; }
  for (var i = 0; i < PASTAS.length; i++) {
    var lista = await json('https://api.github.com/repos/tv-logo/tv-logos/contents/' + PASTAS[i] + '?per_page=1000', gh);
    lista.forEach(function (f) { if (/\.png$/.test(f.name)) poe(f.name.replace(/\.png$/, '').replace(/-(br|int|us)$/, ''), RAW + PASTAS[i] + '/' + f.name); });
  }
  var logos = await json('https://iptv-org.github.io/api/logos.json'), canais = await json('https://iptv-org.github.io/api/channels.json'), porCanal = {};
  logos.forEach(function (l) { if (!l.feed && l.url && !porCanal[l.channel]) porCanal[l.channel] = l.url; });
  canais.filter(function (c) { return c.country === 'BR' && !c.is_nsfw && porCanal[c.id]; }).forEach(function (c) {
    [c.name].concat(c.alt_names || []).forEach(function (n) { poe(n, porCanal[c.id]); });
  });
  var saida = path.join(__dirname, '..', 'app', 'js', 'logos.js');
  fs.writeFileSync(saida, 'window.ATL_LOGOS = ' + JSON.stringify(mapa) + ';\n');
  console.log(Object.keys(mapa).length + ' nomes, ' + Math.round(fs.statSync(saida).size / 1024) + ' KB');
})().catch(function (e) { console.log('ERRO', e.message); process.exit(1); });
