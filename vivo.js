// O que dá vida às páginas que rolam: o pavio, as seções que acendem e o menu
// que marca onde você está.
//
// Arquivo compartilhado de propósito. Duplicar isto em cada página criaria dois
// lugares para consertar, e cada função aqui já sai calada quando o elemento
// dela não existe, então a mesma cópia serve a páginas diferentes.
//
// REGRA QUE TUDO AQUI SEGUE: nada esconde conteúdo. Se este arquivo não
// carregar, sobra um pavio por acender e um menu comum. Nenhum texto some.

// O pavio queima conforme a rolagem.
//
// O script só informa ONDE estamos, numa variável de 0 a 1; quem posiciona a
// chama e mede o trecho queimado é o CSS. Assim não há geometria em dois
// lugares para dessincronizar, a lição das ilustrações.
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

// Cada seção acende ao chegar. Só decoração, se isto nunca rodar, os rótulos
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
// quando a seção cruza o MEIO da tela, e não a borda, pela borda ela piscaria
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
// dela, imitação envelheceria em separado, e a prévia passaria a mentir.
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
 * formato não suportado deixam a capa exatamente como ela é hoje, em vez de um
 * retângulo preto no lugar da primeira coisa que a pessoa vê.
 *
 * PARA PUBLICAR UM VÍDEO: ponha `capa.mp4` na raiz do site (e, se quiser,
 * `capa.jpg` com o primeiro quadro). Nada mais precisa mudar.
 *
 *   formato   MP4, H.264, sem áudio (o laço toca mudo de qualquer jeito)
 *   tamanho   1920×1080 ou 1600×900, deitado
 *   duração   6 a 12 segundos, em laço, sem corte brusco no fim
 *   peso      até ~4 MB, ele baixa para TODO visitante da página inicial
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
  // o cabeçalho, e `canplay` exige dados suficientes para tocar, vários
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

// A vela de espera, para quando algo está carregando.
//
// Devolve a marcação pronta, porque ela precisa nascer de UM lugar: são cinco
// pontos de carregamento em duas páginas, e cinco cópias de HTML divergem na
// primeira vez que a peça mudar, foi a lição das ilustrações do site.
//
// `role="status"` com `aria-live="polite"` faz o leitor de tela anunciar o
// texto quando ele aparece. A vela em si é `aria-hidden`: ela não informa
// nada que a frase já não diga, e um desenho anunciado é ruído.
//
// Quem chama tem de ter um plano B (ver o uso na loja e no perfil): este
// arquivo é `defer`, e se por qualquer motivo não carregar, o texto sozinho
// continua sendo uma espera honesta.
window.velaDeEspera = function (texto) {
  return '<div class="espera" role="status" aria-live="polite">'
    + '<div class="pavio" aria-hidden="true">'
    + '<span class="queimado"></span>'
    + '<span class="cera"><i></i><i></i><i></i><i></i></span>'
    + '<span class="poca"></span>'
    + '<span class="chama"></span>'
    + '<span class="cinzas"><i></i><i></i><i></i></span>'
    + '</div><p>' + String(texto == null ? '' : texto) + '</p></div>';
};

/**
 * A peça girando, na seção "como a peça nasce".
 *
 * SÓ CARREGA QUANDO CHEGA PERTO, e é a diferença que importa: a home já baixa o
 * vídeo da capa para todo visitante, e um segundo laço baixado na abertura
 * dobraria o gasto de quem está no 4G para ver algo que ainda nem apareceu na
 * tela. Por isso o `preload="none"` no HTML e o `src` posto aqui.
 *
 * As mesmas duas recusas da capa, pelas mesmas razões: quem pediu menos
 * movimento não recebe vídeo, e quem está economizando dados também não. Nos
 * dois casos sobra o pôster, que é um quadro da peça, e aqui ele BASTA, ao
 * contrário da capa, onde um quadro escuro parado não diria nada.
 *
 * `IntersectionObserver` e não evento de rolagem: rolagem dispara dezenas de
 * vezes por segundo e obriga a medir posição na mão, que é justamente o tipo de
 * medida que erra quando a aba está escondida.
 */
(function () {
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var con = navigator.connection;
  var economizando = con && (con.saveData || /2g/.test(con.effectiveType || ''));

  /**
   * O MESMO TRATAMENTO PARA CADA VÍDEO DA PÁGINA, e não uma cópia por vídeo.
   *
   * Eram dois laços iguais quando o segundo entrou (o do NFC), e a segunda
   * cópia é onde a regra de quem pediu menos movimento se perde: ela não
   * estoura nada, só deixa de valer para o vídeo novo.
   */
  function aoAparecer(id, arquivo) {
    var v = document.getElementById(id);
    if (!v) return;

    // O pôster já está no HTML, então não fazer nada aqui deixa a imagem parada
    // na tela. É a degradação certa: perde o movimento, não perde a figura.
    if (quieto || economizando) return;

    if (!('IntersectionObserver' in window)) { v.src = arquivo; v.load(); return; }

    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          if (!v.src) { v.src = arquivo; v.load(); }
          var p = v.play();
          if (p && p.catch) p.catch(function () {});
        } else if (!v.paused) {
          // Pausar ao sair da tela: um laço tocando fora de vista gasta bateria
          // para ninguém. O pôster não volta, e nem deveria, a peça fica onde
          // parou, e retoma dali quando a pessoa sobe de novo.
          v.pause();
        }
      });
    }, { rootMargin: '200px 0px' });

    olho.observe(v);
  }

  aoAparecer('giroVideo', '/giro.mp4');
  aoAparecer('nfcVideo', '/nfc.mp4');
})();


/* ===========================================================================
   O MEDALHÃO POR DENTRO

   A foto responde "como o objeto é". Esta vista responde a outra pergunta, a
   que ninguém faz em voz alta: "onde fica o chip?". Num disco fechado e sem
   furo, a resposta honesta é abrir a peça.

   Entra SOB DEMANDA e no lugar da foto, por duas razões. A biblioteca do
   visualizador tem ~300 KB e o modelo mais 48, e ninguém deve pagar isso para
   ler um parágrafo sobre um chaveiro. E a seção já tinha crescido demais uma
   vez: dois estados do mesmo slot não engordam a página.

   O botão vira "abrindo…" e não some: se a rede falhar, sobra a foto e uma
   segunda chance, em vez de um buraco.
   =========================================================================== */
(function () {
  var bt = document.getElementById('btDentro');
  var vista = document.getElementById('medalhaoVista');
  if (!bt || !vista) return;

  var MV = 'https://unpkg.com/@google/model-viewer@4.0.0/dist/model-viewer.min.js';
  var promessa = null;
  function carregar() {
    if (promessa) return promessa;
    promessa = new Promise(function (ok, falha) {
      var s = document.createElement('script');
      s.type = 'module'; s.src = MV;
      s.onload = ok; s.onerror = falha;
      document.head.appendChild(s);
    });
    return promessa;
  }

  // As posições vêm do próprio arquivo: as peças ficam a ±0,0741 m e ±0,0247 m
  // no eixo X, e o glTF é Y para cima. Escrever isto a olho erraria de um
  // centímetro, que numa peça de 3,8 cm é a legenda apontando para a vizinha.
  // A ALTURA DE CADA LEGENDA foi medida na tela, não escolhida no escuro: a
  // 0,004 m elas pousavam EM CIMA das peças e "base" encostava em "antena". Um
  // pouco acima do plano, cada uma fica no ar, com a peça inteira à vista.
  var LEGENDAS = [
    ['base',   '-0.0894 0.016 0'],
    ['antena', '-0.0298 0.020 0'],
    ['chip',   '0.0298 0.016 0'],
    ['tampa',  '0.0894 0.016 0']
  ];

  bt.addEventListener('click', function () {
    if (bt.disabled) return;
    bt.disabled = true;
    bt.textContent = 'abrindo…';
    carregar().then(function () {
      var zaps = LEGENDAS.map(function (l, i) {
        return '<button class="zap" slot="hotspot-' + i + '" data-position="' + l[1] +
               '" data-normal="0 1 0" data-visibility-attribute="visible">' + l[0] + '</button>';
      }).join('');
      vista.innerHTML =
        '<model-viewer src="/3d/medalhao.glb" alt="O medalhão aberto: base, antena, chip e tampa."' +
        ' camera-controls touch-action="pan-y" shadow-intensity="0.6" exposure="1.15"' +
        // `field-of-view` estreito é escolha de desenho técnico: menos perspectiva,
        // as quatro peças na mesma escala aparente, e a fila ocupando mais do
        // cartão. Com a lente padrão a peça da ponta ficava visivelmente menor
        // que a do meio, o que numa vista explodida lê como tamanho diferente.
        ' environment-image="neutral" loading="eager" field-of-view="26deg"' +
        ' camera-orbit="0deg 58deg auto">' +
        zaps + '</model-viewer>';
      bt.textContent = 'Arraste para girar a peça';
    }).catch(function (e) {
      console.error('model-viewer não carregou', e);
      bt.disabled = false;
      bt.textContent = 'não consegui abrir agora, tentar de novo';
    });
  });
})();
