/*
 * CONTADOR DE VISITAS, sem rastreador (nov/2026).
 *
 * Responde duas perguntas que o dono não tinha como responder antes do Natal:
 * quais páginas são abertas, e de onde as pessoas chegam. E responde sem
 * quebrar a promessa da página de privacidade, porque não há o que rastrear:
 *
 *   - nenhum cookie, nenhum identificador, nenhum IP guardado;
 *   - o que sobe é só "a página X foi aberta mais uma vez hoje", e, na PRIMEIRA
 *     página de cada visita, "esta visita veio do Instagram";
 *   - cada contagem é um documento com um inteiro só, e a regra do Firestore
 *     recusa qualquer campo a mais (`visitas/{id}` em docs/firestore.rules).
 *
 * Fala com a API do Firestore direto, e não pelo SDK: a home, os aromas e o
 * livro não carregam o Firebase, e trazer 100 KB de biblioteca para somar 1
 * seria pagar caro pela pergunta.
 *
 * Fica calado em três casos: fora do domínio de verdade (o desenvolvimento não
 * conta), em navegador automatizado (o Lighthouse e os testes não contam), e
 * em qualquer erro. Contador que quebra a página não é contador.
 */
(function () {
  try {
    if (navigator.webdriver) return;
    if (location.hostname !== 'cinerea.com.br') return;

    var dia = new Date().toISOString().slice(0, 10);
    var trecho = location.pathname.replace(/^\/+|\/+$/g, '').split('/')[0];
    var pagina = trecho || 'home';
    if (!/^[a-z]{1,20}$/.test(pagina)) return;

    var chaves = [pagina];

    // A ORIGEM só conta na primeira página da visita. Contada em toda página,
    // quem chegou pelo Instagram e abriu cinco páginas valeria por cinco, e o
    // número mais útil de todos ficaria inflado justo no canal que mais vende.
    var memoria = null;
    try { memoria = window.sessionStorage; } catch (e) {}
    var jaEntrou = false;
    try { jaEntrou = !!(memoria && memoria.getItem('cinerea-entrou')); } catch (e) {}
    if (!jaEntrou) {
      try { if (memoria) memoria.setItem('cinerea-entrou', '1'); } catch (e) {}
      chaves.push('o-' + origem(pagina));
    }

    var raiz = 'projects/cinerea1/databases/(default)/documents/visitas/';
    var writes = chaves.map(function (k) {
      // `update` com máscara VAZIA e só a soma: cria o documento se ele não
      // existir, e não escreve campo nenhum além de `n`. É o mesmo pedido que
      // os testes de regra fazem contra o emulador.
      return {
        update: { name: raiz + dia + '_' + k, fields: {} },
        updateMask: { fieldPaths: [] },
        updateTransforms: [{ fieldPath: 'n', increment: { integerValue: '1' } }]
      };
    });

    fetch('https://firestore.googleapis.com/v1/projects/cinerea1/databases/(default)/documents:commit', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ writes: writes }),
      keepalive: true
    }).catch(function () {});
  } catch (e) {}

  /* De onde a visita chegou, em poucas palavras fixas. Nunca o endereço
     inteiro: ele pode trazer o que a pessoa buscou, e isso é dela. */
  function origem(pagina) {
    // Quem abre a página de uma peça quase sempre encostou o celular nela.
    if (pagina === 'p') return 'nfc';
    // Um link marcado vence o resto: `?utm_source=bio` no link do Instagram
    // separa quem veio da bio de quem veio de um story.
    var marcado = '';
    try {
      marcado = (new URLSearchParams(location.search).get('utm_source') || '')
        .toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 15);
    } catch (e) {}
    if (marcado) return marcado;

    var r = document.referrer;
    if (!r) return 'direto';
    var h = '';
    try { h = new URL(r).hostname; } catch (e) { return 'outro'; }
    if (h === location.hostname) return 'interno';
    if (/instagram/.test(h)) return 'instagram';
    if (/facebook|(^|\.)fb\.com$/.test(h)) return 'facebook';
    if (/(^|\.)google\./.test(h)) return 'google';
    if (/whatsapp|wa\.me/.test(h)) return 'whatsapp';
    if (/tiktok/.test(h)) return 'tiktok';
    if (/bing|duckduckgo|yahoo|ecosia/.test(h)) return 'busca';
    return 'outro';
  }
})();
