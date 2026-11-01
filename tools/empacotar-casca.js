// Gera a casca de cada TV em pacotes/casca-<tv>. Uso: node tools/empacotar-casca.js mae   (ou tv)
// Cada .ipk leva uma cópia do app (base.html), as chaves (local-config.js) e tv-config.js. Nada disso vai para o GitHub.
var fs = require('fs'), path = require('path'), cp = require('child_process');
var raiz = path.join(__dirname, '..'), saida = path.join(raiz, 'pacotes');
var TVS = { mae: 'compat', tv: 'moderno' };
var PAGES = 'https://stn-tv.github.io/sintonia/';

var tv = process.argv[2];
if (!TVS[tv]) { console.error('Uso: node tools/empacotar-casca.js ' + Object.keys(TVS).join('|')); process.exit(1); }

cp.execFileSync(process.execPath, [path.join(__dirname, 'gerar-config.js')], { stdio: 'inherit' });
var dist = path.join(saida, '.dist'), obra = path.join(saida, '.casca-' + tv), fim = path.join(saida, 'casca-' + tv);
fs.rmSync(dist, { recursive: true, force: true }); fs.rmSync(obra, { recursive: true, force: true }); fs.rmSync(fim, { recursive: true, force: true });
fs.mkdirSync(fim, { recursive: true });
cp.execFileSync(process.execPath, [path.join(__dirname, 'publicar.js'), dist], { stdio: 'inherit' });
var versao = JSON.parse(fs.readFileSync(path.join(dist, 'versao.json'), 'utf8')), canal = TVS[tv], v = versao.canais[canal];

fs.mkdirSync(path.join(obra, 'js'), { recursive: true });
fs.copyFileSync(path.join(dist, v.arq), path.join(obra, 'base.html'));
fs.appendFileSync(path.join(obra, 'base.html'), '<script src="tv-config.js"></script><script src="casca-update.js"></script>');
['index.html', 'casca.js', 'casca-update.js'].forEach(function (f) { fs.copyFileSync(path.join(raiz, 'casca', f), path.join(obra, f)); });
['appinfo.json', 'sintonia-icon.png', 'sintonia-large.png'].forEach(function (f) { fs.copyFileSync(path.join(raiz, 'app', f), path.join(obra, f)); });
fs.copyFileSync(path.join(raiz, 'app', 'js', 'local-config.js'), path.join(obra, 'js', 'local-config.js'));
var info = JSON.parse(fs.readFileSync(path.join(raiz, 'casca', 'versao-casca.json'), 'utf8'));
var app = JSON.parse(fs.readFileSync(path.join(obra, 'appinfo.json'), 'utf8')); app.version = info.versao;
fs.writeFileSync(path.join(obra, 'appinfo.json'), JSON.stringify(app, null, 2));

var token = ''; var arqToken = path.join(raiz, 'tv-' + tv + '.token');
if (fs.existsSync(arqToken)) token = fs.readFileSync(arqToken, 'utf8').trim();
fs.writeFileSync(path.join(obra, 'tv-config.js'), 'window.CASCA = ' + JSON.stringify({ pages: PAGES, canal: canal, baseId: v.id, lgToken: token }) + ';\n');

cp.execSync('ares-package "' + obra + '" "' + path.join(raiz, 'svc') + '" -o "' + fim + '"', { stdio: 'inherit', shell: true });
fs.rmSync(obra, { recursive: true, force: true }); fs.rmSync(dist, { recursive: true, force: true });
console.log('Casca de ' + tv + ' em ' + fim + (token ? '' : ' (sem token LG)'));
