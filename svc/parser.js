// Lê a página do Futebol na TV e devolve a lista de jogos com placar, situação e canais.
function limpar(s) {
  return (s || "").replace(/<[^>]+>/g, " ").replace(/&amp;/g, "&").replace(/&#0?39;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
}
function todos(re, s) { var out = [], m; while ((m = re.exec(s))) out.push(m[1]); return out; }

function lerJogos(html) {
  var jogos = [];
  html.split('<article class="match"').slice(1).forEach(function (p) {
    var fim = p.indexOf("</article>"); if (fim > 0) p = p.slice(0, fim);
    var nomes = todos(/class="m-name">([\s\S]*?)<\/span>/g, p).map(limpar);
    if (nomes.length !== 2) return;
    var placar = todos(/class="m-score">([\s\S]*?)<\/span>/g, p).map(limpar);
    var bloco = p.split('class="m-channels"')[1] || "";
    var canais = [];
    todos(/<b>([\s\S]*?)<\/b>/g, bloco).map(limpar).forEach(function (c) { if (c && canais.indexOf(c) < 0) canais.push(c); });
    jogos.push({
      id: (p.match(/data-slot="([^"]*)"/) || [])[1] || nomes.join("-"),
      liga: limpar((p.match(/class="m-head">[\s\S]*?<b>([\s\S]*?)<\/b>/) || [])[1]) || "Outros jogos",
      situacao: (p.match(/data-status="([^"]*)"/) || [])[1] || "",
      inicio: +(p.match(/data-ts="(\d+)"/) || [])[1] || 0,
      tempo: limpar((p.match(/class="m-time">\s*<strong>([\s\S]*?)<\/strong>/) || [])[1]),
      casa: nomes[0], fora: nomes[1], pc: placar[0] || "", pf: placar[1] || "",
      canais: canais
    });
  });
  return jogos;
}
if (typeof module !== "undefined") module.exports = { lerJogos: lerJogos };
