// O que dá vida às páginas que rolam: o pavio, as seções que acendem e o menu
// que marca onde você está.
//
// Arquivo compartilhado de propósito. Duplicar isto em cada página criaria dois
// lugares para consertar — e cada função aqui já sai calada quando o elemento
// dela não existe, então a mesma cópia serve a páginas diferentes.
//
// REGRA QUE TUDO AQUI SEGUE: nada esconde conteúdo. Se este arquivo não
// carregar, sobra um pavio por acender e um menu comum. Nenhum texto some.

// O pavio queima conforme a rolagem.
//
// O script só informa ONDE estamos, numa variável de 0 a 1; quem posiciona a
// chama e mede o trecho queimado é o CSS. Assim não há geometria em dois
// lugares para dessincronizar — a lição das ilustrações.
//
// `requestAnimationFrame` com trava: o evento de rolagem dispara dezenas de
// vezes por segundo e escrever no estilo em todas elas força recálculo à toa.
// `passive:true` avisa ao navegador que não vamos barrar a rolagem, o que
// mantém o gesto fluido no celular.
(function () {
  var pavio = document.querySelector('.pavio');
  if (!pavio) return;
  var pedido = false;

  function medir() {
    pedido = false;
    var alcance = document.documentElement.scrollHeight - window.innerHeight;
    // Página curta demais para rolar: a vela fica inteira, por acender.
    var p = alcance > 0 ? window.scrollY / alcance : 0;
    pavio.style.setProperty('--p', Math.min(1, Math.max(0, p)).toFixed(4));
  }

  function agendar() {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(medir);
  }

  medir();
  addEventListener('scroll', agendar, { passive: true });
  addEventListener('resize', agendar);
})();

// Cada seção acende ao chegar. Só decoração — se isto nunca rodar, os rótulos
// ficam exatamente como sempre foram. É o que permite usar `IntersectionObserver`
// aqui sem o risco que ele traria se escondesse texto.
(function () {
  var secoes = document.querySelectorAll('.ideia');
  if (!('IntersectionObserver' in window)) return;
  var olho = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add('acesa');
      olho.unobserve(e.target); // acende uma vez: reacender a cada rolagem cansa
    });
  }, { rootMargin: '0px 0px -18% 0px' });
  secoes.forEach(function (e) { olho.observe(e); });
})();

// O menu marca a seção que está sendo lida.
//
// Decoração, como o resto: se nada disto rodar, o menu fica exatamente como
// sempre foi. A faixa central (-45% em cima e embaixo) faz a marcação trocar
// quando a seção cruza o MEIO da tela, e não a borda — pela borda ela piscaria
// entre duas seções na transição.
(function () {
  if (!('IntersectionObserver' in window)) return;
  var links = {};
  document.querySelectorAll('.topo nav a[href^="#"]').forEach(function (a) {
    links[a.getAttribute('href').slice(1)] = a;
  });
  if (!Object.keys(links).length) return;

  var olho = new IntersectionObserver(function (entradas) {
    entradas.forEach(function (e) {
      var a = links[e.target.id];
      if (!a) return;
      if (e.isIntersecting) {
        Object.keys(links).forEach(function (k) { links[k].classList.remove('lendo'); });
        a.classList.add('lendo');
      }
    });
  }, { rootMargin: '-45% 0px -45% 0px' });

  Object.keys(links).forEach(function (id) {
    var sec = document.getElementById(id);
    if (sec) olho.observe(sec);
  });
})();


// O experimentador: o texto de quem visita aparece dentro do celular desenhado.
//
// O quadro é um iframe da PÁGINA DO CONVIDADO de verdade, e não uma imitação
// dela — imitação envelheceria em separado, e a prévia passaria a mentir.
//
// Sai calado se o bloco não existir: a loja carrega o mesmo arquivo.
(function () {
  var campo = document.getElementById('expTexto');
  var quadro = document.getElementById('expQuadro');
  if (!campo || !quadro) return;

  var botoes = [].slice.call(document.querySelectorAll('.exp-tipo'));
  var tipo = 'recado';
  var relogio = null;

  // Cada tipo pede uma coisa diferente. O rótulo e o exemplo mudam junto, senão
  // "Seu recado" ficaria pedindo uma senha de wi-fi.
  var MOLDES = {
    recado: { rot: 'Seu recado',        exemplo: 'Que esta chama acompanhe vocês dois.' },
    wifi:   { rot: 'Nome da sua rede',  exemplo: 'Casa da Ana' },
    link:   { rot: 'Seu endereço',      exemplo: 'https://open.spotify.com/playlist/…' },
  };

  function pintar() {
    var texto = campo.value.trim() || MOLDES[tipo].exemplo;
    // `encodeURIComponent` porque isto vai numa URL: sem ele, um `&` no texto
    // do visitante viraria outro parâmetro.
    quadro.src = '/p/?demo=' + tipo + '&sem=cert&pv=1&t=' + encodeURIComponent(texto);
  }

  // Espera a digitação parar. Sem isto, cada tecla recarregaria o iframe.
  function agendar() {
    clearTimeout(relogio);
    relogio = setTimeout(pintar, 420);
  }

  campo.addEventListener('input', agendar);

  botoes.forEach(function (b) {
    b.addEventListener('click', function () {
      tipo = b.dataset.tipo;
      botoes.forEach(function (o) { o.classList.toggle('on', o === b); });
      var molde = MOLDES[tipo];
      document.querySelector('.exp-rot').textContent = molde.rot;
      campo.placeholder = molde.exemplo;
      pintar();
    });
  });
})();


/**
 * O vídeo da capa, quando existir.
 *
 * Ele NÃO vem no HTML com `src`: quem põe o endereço é este script, e só depois
 * de o navegador dizer que consegue tocar. Assim, arquivo ausente, rede ruim ou
 * formato não suportado deixam a capa exatamente como ela é hoje — em vez de um
 * retângulo preto no lugar da primeira coisa que a pessoa vê.
 *
 * PARA PUBLICAR UM VÍDEO: ponha `capa.mp4` na raiz do site (e, se quiser,
 * `capa.jpg` com o primeiro quadro). Nada mais precisa mudar.
 *
 *   formato   MP4, H.264, sem áudio (o laço toca mudo de qualquer jeito)
 *   tamanho   1920×1080 ou 1600×900, deitado
 *   duração   6 a 12 segundos, em laço, sem corte brusco no fim
 *   peso      até ~4 MB — ele baixa para TODO visitante da página inicial
 *   conteúdo  o texto fica no meio e por cima; deixe o centro calmo, e conte
 *             que as bordas somem no celular
 *
 * Ele fica no repositório, servido pelo GitHub Pages, e não no Cloud Storage:
 * aqui a banda é de graça, lá seria conta no fim do mês.
 */
(function () {
  var v = document.getElementById('capaVideo');
  var capa = document.getElementById('capa');
  if (!v || !capa) return;

  // Quem pediu menos movimento não recebe vídeo nenhum. O pôster também não
  // entra: sem o vídeo tocando, ele seria só uma foto escura sem propósito.
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (quieto) return;

  // `saveData` é a pessoa dizendo ao navegador que está economizando dados.
  // Um laço de vídeo na capa é exatamente o que ela não quer baixar.
  var con = navigator.connection;
  if (con && (con.saveData || /2g/.test(con.effectiveType || ''))) return;

  // NÃO ESPERAR SÓ POR `canplay`. Com `preload="metadata"` o navegador baixa só
  // o cabeçalho, e `canplay` exige dados suficientes para tocar — vários
  // navegadores não bufferizam isso sem uma tentativa de reprodução, e o evento
  // simplesmente nunca chega. O vídeo ficava invisível sem erro nenhum.
  //
  // Agora: pede para tocar assim que houver o primeiro quadro, e revela no
  // primeiro dos três eventos que chegar. Mudo + `playsinline` é o que os
  // navegadores permitem tocar sozinho.
  var revelado = false;
  function revelar() {
    if (revelado) return;
    revelado = true;
    capa.classList.add('com-video');
  }

  ['loadeddata', 'canplay', 'playing'].forEach(function (ev) {
    v.addEventListener(ev, function () {
      revelar();
      var p = v.play();
      if (p && p.catch) p.catch(function () {
        // Autoplay recusado de verdade: tira o vídeo de cena em vez de deixar
        // um quadro congelado passando por decisão de design.
        capa.classList.remove('com-video');
        revelado = false;
      });
    });
  });

  v.addEventListener('error', function () {
    capa.classList.remove('com-video');
  });

  v.src = '/capa.mp4';
  // `load()` explícito: sem ele, mudar o `src` depois do parse não recomeça o
  // carregamento em todos os navegadores.
  v.load();
})();
