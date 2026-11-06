/* Servidor de desenvolvimento do Atl Player (não entra no .ipk).
 * Serve a pasta app/ e simula uma API Xtream com dados fictícios em /mock.
 * Uso: node tools/dev-server.js [porta]
 */
var http = require('http'), fs = require('fs'), path = require('path');
var PORT = +process.argv[2] || 5180, ROOT = path.join(__dirname, '..', 'app');
var TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.css': 'text/css; charset=utf-8', '.png': 'image/png', '.json': 'application/json' };

// vídeos públicos de teste
var HLS = 'https://test-streams.mux.dev/x36xhzz/x36xhzz.m3u8';
var MP4 = 'https://media.w3.org/2010/05/sintel/trailer.mp4';

var cats = {
  live: [['1', 'Esportes FHD H265'], ['2', 'Esportes HD'], ['3', 'Notícias'], ['4', 'Canais 4K']],
  vod: [['10', 'Ação'], ['11', 'Comédia'], ['12', 'Terror'], ['13', 'Filmes Nacionais']],
  series: [['20', 'Drama'], ['21', 'Comédia']]
};
function poster(i) { return i % 3 ? '' : '/mock/capa.png?' + i; }
var live = [], vod = [], series = [], n = 100;
['Premiere 1', 'SporTV', 'ESPN', 'Globo SP'].forEach(function (c) {
  live.push({ stream_id: n++, name: c + ' FHD H265', stream_icon: '', category_id: '1', epg_channel_id: '' });
  live.push({ stream_id: n++, name: c + ' FHD', stream_icon: '', category_id: '2', epg_channel_id: '' });
  live.push({ stream_id: n++, name: c + ' HD', stream_icon: '', category_id: '2', epg_channel_id: '' });
  live.push({ stream_id: n++, name: c + ' SD', stream_icon: '', category_id: '2', epg_channel_id: '' });
});
live.push({ stream_id: n++, name: 'Band News', stream_icon: '', category_id: '3', epg_channel_id: '' });
['Premiere 1 4K', 'SporTV UHD'].forEach(function (c) { live.push({ stream_id: n++, name: c, stream_icon: '', category_id: '4', epg_channel_id: '' }); });
['HBO Premium', 'Telecine Premium', 'Warner Premium'].forEach(function (c) { live.push({ stream_id: n++, name: c + ' HD', stream_icon: '', category_id: '3', epg_channel_id: '' }); });
for (var i = 0; i < 400; i++) vod.push({ stream_id: 1000 + i, name: 'Filme de Teste ' + (i + 1) + ' (' + (1990 + i % 36) + ')', stream_icon: poster(i), category_id: String(10 + i % 4),
  rating: ((i * 37) % 90 / 10).toFixed(1), container_extension: 'mp4', added: String(1700000000 + i * 1000) });
for (i = 0; i < 40; i++) series.push({ series_id: 5000 + i, name: 'Série de Teste ' + (i + 1), cover: poster(i), category_id: String(20 + i % 2), rating: ((i * 53) % 90 / 10).toFixed(1),
  releaseDate: (2000 + i % 26) + '-01-01', genre: ['Comedy, Drama', 'Comédia', 'Action & Adventure', 'Crime / Suspense', 'Animação, Comédia', ''][i % 6], plot: 'Sinopse fictícia usada apenas em testes.', last_modified: String(1700000000 + i) });
function seriesInfo(id) {
  var eps = {}, base = (id - 5000) * 100 + 20000;
  [1, 2].forEach(function (s) {
    eps[s] = [];
    for (var e = 1; e <= 3; e++) eps[s].push({ id: String(base + s * 10 + e), title: 'Episódio ' + e, episode_num: e, container_extension: 'mp4', info: { plot: 'Episódio fictício.', movie_image: e === 2 ? '/mock/capa.png?ep' : '' } });
  });
  return { info: { plot: 'Sinopse fictícia usada apenas em testes.' }, episodes: eps };
}
function api(q) {
  switch (q.get('action')) {
    case 'get_live_categories': return cats.live.map(toCat);
    case 'get_vod_categories': return cats.vod.map(toCat);
    case 'get_series_categories': return cats.series.map(toCat);
    case 'get_live_streams': return live;
    case 'get_vod_streams': return vod;
    case 'get_series': return series;
    case 'get_series_info': return seriesInfo(+q.get('series_id'));
    case 'get_vod_info': return { info: { plot: 'Sinopse fictícia.', duration: '00:52:00', genre: 'Teste' } };
    case 'get_short_epg':
      var ini = Math.floor(Date.now() / 1000);
      return { epg_listings: ['Programa de teste A', 'Programa de teste B', 'Programa de teste C'].map(function (t, i) {
        return { title: Buffer.from(t).toString('base64'), start_timestamp: String(ini + i * 3600), stop_timestamp: String(ini + (i + 1) * 3600) };
      }) };
    default: return { user_info: { auth: 1, status: 'Active', exp_date: '1893456000' }, server_info: {} };
  }
}
function toCat(c) { return { category_id: c[0], category_name: c[1] }; }
var PNG = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPj/HwADBwIAMCbHYQAAAABJRU5ErkJggg==', 'base64');

// só no PC: encaixa a tela de 1920x1080 na janela e simula o controle (R G Y B = botões coloridos, Esc = Voltar, PageUp/PageDown = CH)
var DEV_HELP = '<script>(function () {' +
  'window.close = function () { console.log("Voltar na Início fecharia o app na TV"); };' +
  'function fit() { document.documentElement.style.zoom = Math.min(innerWidth / 1920, innerHeight / 1080); }' +
  'addEventListener("resize", fit); fit();' +
  'var cores = { r: 403, g: 404, y: 405, b: 406 };' +
  'document.addEventListener("keydown", function (e) {' +
  '  var c = cores[String(e.key).toLowerCase()], a = document.activeElement;' +
  '  if (!c || !e.isTrusted || (a && a.tagName === "INPUT")) return;' +
  '  e.stopPropagation(); (a || document).dispatchEvent(new KeyboardEvent("keydown", { keyCode: c, which: c, bubbles: true }));' +
  '}, true);' +
  '})();</script>\n';

http.createServer(function (req, res) {
  var u = new URL(req.url, 'http://localhost'), p = decodeURIComponent(u.pathname);
  res.setHeader('Access-Control-Allow-Origin', '*');
  // no PC faz o papel do serviço da TV
  if (p === '/dev/jogos') {
    return require('../svc/jogos.js').jogosDeHoje(function (e, l) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(e ? { returnValue: false, errorText: e } : { returnValue: true, jogos: l })); });
  }
  if (p === '/dev/img') return require('../svc/imagens.js').tratar(req, res);
  if (p === '/dev/times') {
    return require('../svc/jogos.js').timesDaLiga(u.searchParams.get('liga') || '', function (e, t) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(e ? { returnValue: false, errorText: e } : { returnValue: true, times: t })); });
  }
  if (p === '/dev/escudo') {
    return require('../svc/jogos.js').escudo(u.searchParams.get('nome') || '', function (e, url) { res.setHeader('Content-Type', 'application/json'); res.end(JSON.stringify(e ? { returnValue: false, errorText: e } : { returnValue: true, url: url })); });
  }
  if (p === '/mock/player_api.php') { res.setHeader('Content-Type', 'application/json'); return res.end(JSON.stringify(api(u.searchParams))); }
  if (p === '/mock/capa.png') { res.setHeader('Content-Type', 'image/png'); return res.end(PNG); }
  if (p.indexOf('/mock/live/') === 0) { res.writeHead(302, { Location: /H265/.test((live.filter(function (l) { return String(l.stream_id) === path.basename(p).split('.')[0]; })[0] || {}).name) ? '/mock/quebrado.m3u8' : HLS }); return res.end(); }
  if (p.indexOf('/mock/movie/') === 0 || p.indexOf('/mock/series/') === 0) { res.writeHead(302, { Location: MP4 }); return res.end(); }
  if (p.indexOf('/mock/') === 0) { res.writeHead(404); return res.end(); }
  var file = path.normalize(path.join(ROOT, p === '/' ? 'index.html' : p));
  if (file.indexOf(ROOT) !== 0) { res.writeHead(403); return res.end(); }
  fs.readFile(file, function (e, d) {
    if (e) { res.writeHead(404); return res.end('não encontrado'); }
    res.setHeader('Content-Type', TYPES[path.extname(file)] || 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-store');
    if (path.basename(file) === 'index.html') d = String(d).replace('</body>', DEV_HELP + '</body>');
    res.end(d);
  });
}).listen(PORT, function () { console.log('Atl Player em http://localhost:' + PORT); });
