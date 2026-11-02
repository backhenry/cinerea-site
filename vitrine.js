/*
 * A VITRINE DA HOME (nov/2026): três peças com foto e preço logo abaixo da capa.
 *
 * Lê o MESMO `catalogo/` que a loja e o app leem, publicado pela gestão. Uma
 * lista própria aqui seria a terceira, e preço divergente é o defeito que mais
 * custa caro, porque aparece na cara de quem ia comprar.
 *
 * Fala com a API do Firestore direto, como o contador: a home não carrega o
 * Firebase, e 100 KB de biblioteca para ler três nomes seria pagar caro. A
 * máscara pede só `itens`, que é o que se usa.
 *
 * Cada peça abre a ficha dela na loja (`/loja/?peca=`), e não a loja inteira:
 * quem tocou no David quer ver o David.
 */
(function () {
  var caixa = document.getElementById('vitrine');
  if (!caixa) return;

  var url = 'https://firestore.googleapis.com/v1/projects/cinerea1/databases/(default)/documents/catalogo' +
            '?pageSize=1&mask.fieldPaths=itens';

  /* O formato da API REST embrulha cada valor no tipo dele. */
  function valor(v) {
    if (!v) return null;
    if ('stringValue' in v) return v.stringValue;
    if ('integerValue' in v) return Number(v.integerValue);
    if ('doubleValue' in v) return v.doubleValue;
    if ('booleanValue' in v) return v.booleanValue;
    return null;
  }

  function esc(s) {
    return String(s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }

  /* Só foto do nosso Storage, a mesma trava do logo e do banner: o catálogo
     é escrito pela gestão, e nenhum endereço de fora entra na home. */
  function fotoNossa(u) {
    return typeof u === 'string' &&
      u.indexOf('https://firebasestorage.googleapis.com/v0/b/cinerea1.') === 0;
  }

  var brl = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });

  function pinta(itens) {
    // Destaques primeiro, na ordem em que a gestão publicou; "em breve" e peça
    // sem foto ficam de fora, porque a vitrine é do que se leva hoje.
    var aVenda = itens.filter(function (p) {
      return p.situacao !== 'embreve' && fotoNossa(p.foto) && p.preco > 0;
    });
    var escolhidas = aVenda.filter(function (p) { return p.destaque; })
      .concat(aVenda.filter(function (p) { return !p.destaque; }))
      .slice(0, 3);
    if (!escolhidas.length) return falha();
    caixa.innerHTML = escolhidas.map(function (p) {
      return '<a class="vit-peca" href="/loja/?peca=' + encodeURIComponent(p.id) + '">' +
        '<span class="vit-foto"><img src="' + esc(p.foto) + '" alt="' + esc(p.nome) +
        '" loading="lazy" decoding="async" width="400" height="400"></span>' +
        '<span class="vit-nome">' + esc(p.nome) + '</span>' +
        '<span class="vit-preco">' + esc(brl.format(p.preco)) + '</span></a>';
    }).join('');
  }

  /* Sem catálogo, as caixas vazias somem e o link para a loja fica sozinho.
     Melhor que três quadrados cinzas para sempre. */
  function falha() {
    caixa.parentNode.removeChild(caixa);
  }

  fetch(url).then(function (r) {
    if (!r.ok) throw new Error(r.status);
    return r.json();
  }).then(function (d) {
    var doc = d.documents && d.documents[0];
    var lista = doc && doc.fields && doc.fields.itens && doc.fields.itens.arrayValue &&
                doc.fields.itens.arrayValue.values || [];
    pinta(lista.map(function (v) {
      var m = (v.mapValue && v.mapValue.fields) || {};
      return {
        id: String(valor(m.id) || ''),
        nome: valor(m.nome) || 'Peça',
        preco: Number(valor(m.preco)) || 0,
        foto: valor(m.foto) || '',
        situacao: valor(m.situacao),
        destaque: !!valor(m.destaque)
      };
    }).filter(function (p) { return p.id; }));
  }).catch(falha);
})();
