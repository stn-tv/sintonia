// Serviço do Atl Player: enquanto a tela do QR Code está aberta, serve a página onde o celular cola a lista.
var Service = require("webos-service");
var servidor = require("./servidor.js");
var jogos = require("./jogos.js");
var imagens = require("./imagens.js");
var service = new Service("com.atl.player.service");
var assinante = null;

service.register("jogos", function (msg) {
  jogos.jogosDeHoje(function (erro, lista) {
    if (erro) msg.respond({ returnValue: false, errorText: erro });
    else msg.respond({ returnValue: true, jogos: lista });
  });
});

service.register("escudo", function (msg) {
  jogos.escudo(String(msg.payload.nome || ""), function (erro, url) {
    if (erro) msg.respond({ returnValue: false, errorText: erro });
    else msg.respond({ returnValue: true, url: url });
  });
});

service.register("times", function (msg) {
  jogos.timesDaLiga(String(msg.payload.liga || ""), function (erro, times) {
    if (erro) msg.respond({ returnValue: false, errorText: erro });
    else msg.respond({ returnValue: true, times: times });
  });
});

var fotos = service.register("imagens");
fotos.on("request", function (msg) {
  if (!msg.isSubscription) return msg.respond({ returnValue: false, errorText: "precisa de subscribe" });
  imagens.iniciar(function (erro) {
    if (erro) msg.respond({ returnValue: false, errorText: erro });
    else msg.respond({ returnValue: true, subscribed: true, base: imagens.base });
  });
});
fotos.on("cancel", function () { imagens.parar(); });

var metodo = service.register("servidor");
metodo.on("request", function (msg) {
  if (!msg.isSubscription) return msg.respond({ returnValue: false, errorText: "precisa de subscribe" });
  assinante = msg;
  servidor.iniciar(function (lista) {
    if (assinante) assinante.respond({ returnValue: true, lista: lista });
  }, function (erro, url) {
    if (erro) msg.respond({ returnValue: false, errorText: erro });
    else msg.respond({ returnValue: true, subscribed: true, url: url });
  });
});
metodo.on("cancel", function () { assinante = null; servidor.parar(); });
