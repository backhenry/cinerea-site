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
 * quem tocou no David quer ver o David. A sacola laranja vai para
 * `/loja/?sacola=`, que põe a peça na sacola e abre a gaveta: a sacola da loja
 * vive na memória da página, e o endereço é o jeito de levar o pedido até lá.
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

  var SACOLA = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true">' +
    '<path d="M4.5 8.5h15l-1.2 11a1.6 1.6 0 0 1-1.6 1.5H7.3a1.6 1.6 0 0 1-1.6-1.5Z" stroke="currentColor" stroke-width="1.7" stroke-linejoin="round"/>' +
    '<path d="M9 8.5V7a3 3 0 0 1 6 0v1.5" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"/></svg>';

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
    // Como na loja: a segunda foto vem por cima e só aparece com o mouse
    // (quem decide é o CSS, por `hover`), e a sacola laranja leva a peça para
    // a sacola DA LOJA. Ela não pode ficar dentro do link da ficha, porque link
    // dentro de link não existe: vai numa camada própria por cima da foto.
    caixa.innerHTML = escolhidas.map(function (p) {
      var id = encodeURIComponent(p.id);
      var segunda = fotoNossa(p.foto2)
        ? '<img class="segunda" src="' + esc(p.foto2) + '" alt="" aria-hidden="true" loading="lazy" decoding="async" width="400" height="400">'
        : '';
      return '<div class="vit-peca">' +
        '<a class="vit-link" href="/loja/?peca=' + id + '">' +
        '<span class="vit-foto"><img src="' + esc(p.foto) + '" alt="' + esc(p.nome) +
        '" loading="lazy" decoding="async" width="400" height="400">' + segunda + '</span>' +
        '<span class="vit-nome">' + esc(p.nome) + '</span>' +
        '<span class="vit-preco">' + esc(brl.format(p.preco)) + '</span></a>' +
        '<span class="vit-sobre"><a class="vit-sacola" href="/loja/?sacola=' + id + '" title="Colocar na sacola"' +
        ' aria-label="Colocar ' + esc(p.nome) + ' na sacola">' + SACOLA + '</a></span></div>';
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
        foto2: valor(m.foto2) || '',
        situacao: valor(m.situacao),
        destaque: !!valor(m.destaque)
      };
    }).filter(function (p) { return p.id; }));
  }).catch(falha);
})();
