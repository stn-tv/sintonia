// Página local: só existe enquanto a tela do QR Code está aberta e só aceita quem veio pelo QR (token).
var http = require("http");
var os = require("os");
var crypto = require("crypto");
var urls = require("url");
var PORTA = 8090, LIMITE = 8192;
var srv = null, token = "";

var PAGINA = '<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Sintonia</title><style>' +
  'body{margin:0;background:#000;color:#f2f2f7;font:18px/1.4 system-ui,Arial,sans-serif;padding:24px 16px;max-width:560px;margin:auto}h1{font-size:28px;margin:0 0 8px}p{color:#aeaeb2;margin:0 0 20px}' +
  'label{display:block;margin:16px 0 6px;font-weight:600}textarea,input{width:100%;box-sizing:border-box;padding:14px;border-radius:12px;border:1px solid #3a3a40;background:#16161b;color:#fff;font-size:16px}' +
  'button{width:100%;margin-top:24px;padding:16px;border:0;border-radius:14px;background:#0a84ff;color:#fff;font-size:18px;font-weight:700}hr{border:0;border-top:1px solid #2a2a30;margin:24px 0}#ok{margin-top:16px;font-weight:700}' +
  '</style></head><body><h1>Sintonia</h1><p>Cole o link completo da lista. Se preferir, preencha o login do provedor.</p>' +
  '<form id="f"><label for="link">Link M3U</label><textarea id="link" rows="4" autocomplete="off"></textarea><hr>' +
  '<label for="server">Servidor</label><input id="server" autocomplete="off" inputmode="url"><label for="user">Usuário</label><input id="user" autocomplete="off"><label for="pass">Senha</label><input id="pass" autocomplete="off">' +
  '<button>Enviar para a TV</button></form><div id="ok" role="status"></div><script>' +
  'var v=function(i){return document.getElementById(i).value.trim()};document.getElementById("f").onsubmit=function(e){e.preventDefault();' +
  'var b={link:v("link"),server:v("server"),user:v("user"),pass:v("pass")},o=document.getElementById("ok"),t=document.querySelector("button");if(!b.link&&!b.server){o.textContent="Preencha o link ou o login.";return}' +
  't.disabled=true;o.textContent="Enviando…";' +
  'fetch("/enviar"+location.search,{method:"POST",body:JSON.stringify(b)}).then(function(r){if(r.ok){o.textContent="Enviado! Pode olhar para a TV.";t.textContent="Enviado"}else{t.disabled=false;o.textContent="A TV recusou. Leia o QR Code de novo."}},function(){t.disabled=false;o.textContent="Não tive resposta. Confira a TV: se ela estiver carregando a lista, deu certo."})};' +
  '</script></body></html>';

function ipDaTV() {
  var ifs = os.networkInterfaces(), achou = "";
  Object.keys(ifs).forEach(function (n) {
    ifs[n].forEach(function (a) { if (!achou && a.family === "IPv4" && !a.internal) achou = a.address; });
  });
  return achou;
}

function iniciar(aoReceber, pronto) {
  parar();
  var ip = ipDaTV();
  if (!ip) return pronto("a TV está sem rede");
  token = crypto.randomBytes(8).toString("hex");
  srv = http.createServer(function (req, res) {
    var u = urls.parse(req.url, true);
    if (u.query.t !== token) { res.writeHead(403); return res.end("Leia o QR Code de novo."); }
    if (req.method === "GET" && u.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      return res.end(PAGINA);
    }
    if (req.method === "POST" && u.pathname === "/enviar") {
      var corpo = "";
      req.on("data", function (c) { corpo += c; if (corpo.length > LIMITE) req.destroy(); });
      req.on("end", function () {
        try { var b = JSON.parse(corpo); } catch (e) { res.writeHead(400); return res.end(); }
        // a TV fecha esta página ao receber a lista: primeiro o celular precisa ler a resposta
        res.writeHead(200, { Connection: "close" });
        res.end("ok", function () {
          setTimeout(function () {
            aoReceber({ link: String(b.link || ""), server: String(b.server || ""), user: String(b.user || ""), pass: String(b.pass || "") });
          }, 500);
        });
      });
      return;
    }
    res.writeHead(404); res.end();
  });
  srv.on("error", function (e) { pronto(e.message); });
  srv.listen(PORTA, "0.0.0.0", function () { pronto(null, "http://" + ip + ":" + PORTA + "/?t=" + token); });
}
function parar() { if (srv) { srv.close(); srv = null; } token = ""; }

module.exports = { iniciar: iniciar, parar: parar };
