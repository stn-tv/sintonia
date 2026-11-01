// Busca no Futebol na TV os jogos de hoje com os canais que transmitem cada um.
// Escrito para rodar também em Node antigo: TVs de 2019 têm Node 0.12 (sem URL global e sem get(url, opções, cb)).
var https = require("https");
var urls = require("url");
var lerJogos = require("./parser.js").lerJogos;

function baixar(url, voltas, cb) {
  var pedido = urls.parse(url);
  pedido.headers = { "User-Agent": "Mozilla/5.0 (Web0S; SmartTV) AtlPlayer", "Accept-Language": "pt-BR" };
  // o Node 0.12 não conhece as autoridades atuais; aqui só se leem placares públicos, sem nenhum dado do usuário
  if (/^v0\./.test(process.version)) pedido.rejectUnauthorized = false;
  https.get(pedido, function (res) {
    if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location && voltas > 0) {
      res.resume();
      return baixar(urls.resolve(url, res.headers.location), voltas - 1, cb);
    }
    if (res.statusCode !== 200) { res.resume(); return cb("HTTP " + res.statusCode); }
    var dados = "";
    res.setEncoding("utf8");
    res.on("data", function (c) { dados += c; });
    res.on("end", function () { cb(null, dados); });
  }).on("error", function (e) { cb(e.message || String(e)); }).setTimeout(15000, function () { this.destroy(new Error("demorou demais")); });
}

function jogosDeHoje(cb) {
  baixar("https://www.futebolnatv.com.br/jogos-hoje/", 3, function (erro, html) {
    if (erro) return cb(erro);
    try { cb(null, lerJogos(html)); } catch (e) { cb(e.message); }
  });
}

// Escudo que a ESPN não tem: procura no TheSportsDB (chave pública de teste, com limite de buscas por minuto).
function escudo(nome, cb) {
  baixar("https://www.thesportsdb.com/api/v1/json/123/searchteams.php?t=" + encodeURIComponent(nome), 1, function (erro, txt) {
    if (erro) return cb(erro);
    try {
      var t = (JSON.parse(txt).teams || []).filter(function (x) { return x.strSport === "Soccer" && x.strBadge; })[0];
      cb(null, t ? t.strBadge + "/tiny" : "");
    } catch (e) { cb(e.message); }
  });
}

// A lista de times da ESPN não aceita chamadas direto do app (CORS): só nomes e escudo seguem para a TV.
function timesDaLiga(liga, cb) {
  baixar("https://site.api.espn.com/apis/site/v2/sports/soccer/" + encodeURIComponent(liga) + "/teams?limit=200", 1, function (erro, txt) {
    if (erro) return cb(erro);
    try {
      var d = JSON.parse(txt), times = (((((d.sports || [])[0] || {}).leagues || [])[0] || {}).teams) || [];
      cb(null, times.map(function (x) {
        var t = x.team || {};
        return { nomes: [t.displayName, t.shortDisplayName, t.name, t.location, t.nickname].filter(Boolean), logo: t.logos && t.logos[0] && t.logos[0].href };
      }).filter(function (t) { return t.logo; }));
    } catch (e) { cb(e.message); }
  });
}

module.exports = { jogosDeHoje: jogosDeHoje, escudo: escudo, timesDaLiga: timesDaLiga };
