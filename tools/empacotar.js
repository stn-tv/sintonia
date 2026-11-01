// Gera os dois pacotes em pacotes/: minha-tv (webOS 26) e tv-mae (webOS 4.5, com compat/).
// O código é um só; a versão da mãe só acrescenta os arquivos de compat.
var fs = require('fs'), path = require('path'), cp = require('child_process');
var raiz = path.join(__dirname, '..'), saida = path.join(raiz, 'pacotes'), obra = path.join(saida, '.tv-mae-app');

function ares(args) { cp.execSync('ares-package ' + args, { stdio: 'inherit', shell: true }); }
function limpar(p) { fs.rmSync(p, { recursive: true, force: true }); fs.mkdirSync(p, { recursive: true }); }

cp.execFileSync(process.execPath, [path.join(__dirname, 'gerar-config.js')], { stdio: 'inherit' });

var minha = path.join(saida, 'minha-tv'), mae = path.join(saida, 'tv-mae');
limpar(minha); limpar(mae); limpar(obra);
ares('"' + path.join(raiz, 'app') + '" "' + path.join(raiz, 'svc') + '" -o "' + minha + '"');

fs.cpSync(path.join(raiz, 'app'), obra, { recursive: true });
fs.copyFileSync(path.join(raiz, 'compat', 'compat.css'), path.join(obra, 'css', 'compat.css'));
fs.copyFileSync(path.join(raiz, 'compat', 'compat.js'), path.join(obra, 'js', 'compat.js'));
var html = path.join(obra, 'index.html'), t = fs.readFileSync(html, 'utf8');
t = t.replace('<link rel="stylesheet" href="css/app.css">', '<link rel="stylesheet" href="css/app.css">\n<link rel="stylesheet" href="css/compat.css">')
  .replace('<script src="js/hls.min.js">', '<script src="js/compat.js"></script>\n<script src="js/hls.min.js">');
fs.writeFileSync(html, t);
ares('"' + obra + '" "' + path.join(raiz, 'svc') + '" -o "' + mae + '"');
fs.rmSync(obra, { recursive: true, force: true });
console.log('Pacotes em ' + saida);
