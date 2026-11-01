// Alguns sites de imagem recusam o navegador da TV (o imgur responde 429).
// Este servidor, só para a própria TV, busca a imagem pública e entrega ao app.
var http = require("http");
var https = require("https");
var urls = require("url");
var PORTA = 8091, LIMITE = 5 * 1024 * 1024;
var srv = null;

function baixar(url, voltas, res) {
  var lib = /^https:/.test(url) ? https : http, alvo = urls.parse(url);
  alvo.headers = { "User-Agent": "Mozilla/5.0", Accept: "image/*" };
  var pedido = lib.get(alvo, function (r) {
    if (r.statusCode >= 300 && r.statusCode < 400 && r.headers.location && voltas > 0) {
      r.resume();
      return baixar(urls.resolve(url, r.headers.location), voltas - 1, res);
    }
    var tipo = String(r.headers["content-type"] || "");
    if (r.statusCode !== 200 || tipo.indexOf("image/") !== 0 || +r.headers["content-length"] > LIMITE) {
      r.resume(); res.writeHead(404); return res.end();
    }
    res.writeHead(200, { "Content-Type": tipo, "Cache-Control": "public, max-age=604800", "Access-Control-Allow-Origin": "*" });
    r.pipe(res);
  });
  pedido.on("error", function () { if (!res.headersSent) res.writeHead(404); res.end(); });
  pedido.setTimeout(10000, function () { pedido.destroy(new Error("demorou demais")); });
}

function tratar(req, res) {
  var u = String(urls.parse(req.url, true).query.u || "");
  if (!/^https?:\/\//i.test(u)) { res.writeHead(400); return res.end(); }
  baixar(u, 3, res);
}

function iniciar(cb) {
  if (srv) return cb(null);
  srv = http.createServer(tratar);
  srv.on("error", function (e) { srv = null; cb(e.message); });
  srv.listen(PORTA, "127.0.0.1", function () { cb(null); });
}
function parar() { if (srv) { srv.close(); srv = null; } }

module.exports = { iniciar: iniciar, parar: parar, tratar: tratar, base: "http://127.0.0.1:" + PORTA };
