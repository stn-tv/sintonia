// Gera app/js/local-config.js sem deixar chaves no código-fonte do player:
// a do TMDB vem do launcher e as outras de chaves-locais.json (fora de app/).
var fs = require('fs'), path = require('path');
var raiz = path.join(__dirname, '..'), launcher = path.join(raiz, '..', 'meu-launcher-lg', 'index.html'), locais = path.join(raiz, 'chaves-locais.json');
var m = fs.existsSync(launcher) && fs.readFileSync(launcher, 'utf8').match(/TMDB_KEY\s*=\s*"([^"]+)"/);
var extra = fs.existsSync(locais) ? JSON.parse(fs.readFileSync(locais, 'utf8')) : {};
var cfg = Object.assign({ tmdbKey: m ? m[1] : '' }, extra);
fs.writeFileSync(path.join(raiz, 'app', 'js', 'local-config.js'), 'window.ATL_LOCAL = ' + JSON.stringify(cfg) + ';\n');
console.log(m ? 'Chave TMDB copiada do launcher.' : 'Launcher sem chave TMDB: informe em Ajustes.');
console.log(cfg.osKey ? 'Chave OpenSubtitles incluída.' : 'Sem chave OpenSubtitles: informe em Ajustes.');
