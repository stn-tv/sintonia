// Gera em dist/ o que vai para o GitHub Pages: um .html único por canal (moderno e compat) e o versao.json.
// A versão é o hash do conteúdo: qualquer mudança em app/ ou compat/ chega às TVs, sem depender de subir número.
// local-config.js continua só uma referência: as chaves existem no .ipk de cada TV, nunca aqui.
var fs = require('fs'), path = require('path'), crypto = require('crypto');
var raiz = path.join(__dirname, '..'), app = path.join(raiz, 'app'), compat = path.join(raiz, 'compat');
var saida = process.argv[2] || path.join(raiz, 'dist');

function ler(p) { return fs.readFileSync(p, 'utf8'); }
function juntar(comCompat) {
  var html = ler(path.join(app, 'index.html'));
  if (comCompat) html = html
    .replace('<link rel="stylesheet" href="css/app.css">', '<link rel="stylesheet" href="css/app.css">\n<link rel="stylesheet" href="css/compat.css">')
    .replace('<script src="js/hls.min.js">', '<script src="js/compat.js"></script>\n<script src="js/hls.min.js">');
  function local(arq) { return /compat\./.test(arq) ? path.join(compat, path.basename(arq)) : path.join(app, arq); }
  html = html.replace(/<link rel="stylesheet" href="([^"]+)">/g, function (t, arq) { return '<style>\n' + ler(local(arq)) + '\n</style>'; });
  html = html.replace(/<script src="([^"]+)"><\/script>/g, function (t, arq) {
    if (/local-config/.test(arq)) return t;
    var js = ler(local(arq));
    if (/<\/script/i.test(js)) throw new Error(arq + ' tem </script>: quebraria o .html único');
    return '<script>\n' + js + '\n</script>';
  });
  return html;
}
// o mesmo cálculo roda na TV (casca/casca-update.js), que confere o download antes de guardar
function conferir(t) { var h = 2166136261; for (var i = 0; i < t.length; i++) { h ^= t.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0).toString(16); }

fs.mkdirSync(saida, { recursive: true });
var canais = {}, app_ver = JSON.parse(ler(path.join(app, 'appinfo.json'))).version;
[['moderno', false], ['compat', true]].forEach(function (c) {
  var t = juntar(c[1]), arq = c[0] + '.html';
  fs.writeFileSync(path.join(saida, arq), t);
  canais[c[0]] = { arq: arq, id: crypto.createHash('sha256').update(t).digest('hex').slice(0, 12), tam: t.length, confere: conferir(t) };
});
fs.writeFileSync(path.join(saida, 'versao.json'), JSON.stringify({ versao: app_ver, canais: canais }, null, 1));
fs.writeFileSync(path.join(saida, '.nojekyll'), '');
fs.writeFileSync(path.join(saida, 'index.html'), '<!DOCTYPE html><meta charset="utf-8"><title>Sintonia</title><p>Arquivos de atualização do Sintonia.</p>');
module.exports = { juntar: juntar };
console.log('dist: moderno ' + canais.moderno.id + ', compat ' + canais.compat.id);
