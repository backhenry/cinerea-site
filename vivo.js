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
 * formato não suportado deixam a capa com o primeiro quadro do giro, que é o
 * fundo dela desde a primeira pintura (ver o CSS da capa), em vez de um
 * retângulo preto no lugar da primeira coisa que a pessoa vê.
 *
 * PARA TROCAR O VÍDEO: substitua `capa.mp4` na raiz do site e, JUNTO, o
 * `capa.jpg` pelo primeiro quadro do novo. O jpg é o fundo da capa enquanto o
 * vídeo não chega; fora de par, a capa troca de imagem quando ele começa.
 *
 *   formato   MP4, H.264, sem áudio (o laço toca mudo de qualquer jeito)
 *   tamanho   1920×864, deitado (o de hoje)
 *   duração   em laço, sem corte brusco no fim; o giro do David fecha sozinho
 *   peso      ~600 KB hoje; ele baixa para TODO visitante da página inicial
 *   conteúdo  no computador o texto fica à ESQUERDA e a peça no terço direito;
 *             no celular o recorte centra a peça atrás do texto (ver o CSS
 *             da capa em index.html, que tem a conta do enquadramento)
 *
 * Ele fica no repositório, servido pelo GitHub Pages, e não no Cloud Storage:
 * aqui a banda é de graça, lá seria conta no fim do mês.
 */
(function () {
  var v = document.getElementById('capaVideo');
  var capa = document.getElementById('capa');
  if (!v || !capa) return;

  // Quem pediu menos movimento não recebe vídeo nenhum, e fica com o David
  // parado, que é o fundo da capa.
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
    capa.classList.add('tocando');
  }

  ['loadeddata', 'canplay', 'playing'].forEach(function (ev) {
    v.addEventListener(ev, function () {
      revelar();
      var p = v.play();
      if (p && p.catch) p.catch(function () {
        // Autoplay recusado de verdade: tira o vídeo de cena em vez de deixar
        // um quadro congelado passando por decisão de design.
        capa.classList.remove('tocando');
        revelado = false;
      });
    });
  });

  v.addEventListener('error', function () {
    capa.classList.remove('tocando');
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
  // TOCAR SOZINHO PODE SER RECUSADO, e no celular é comum (nov/2026, o dono
  // via só a imagem parada no iPhone e no Android). O iPhone em Modo Pouco
  // Energia recusa todo vídeo que toca sem toque, e o `play()` rejeitado era
  // engolido em silêncio. Agora o vídeo recusado fica na fila e começa no
  // primeiro toque da pessoa em qualquer lugar da página, que é um gesto que
  // o navegador sempre aceita.
  var recusados = [];
  function tocarRecusados() {
    recusados.splice(0).forEach(function (v) {
      var p = v.play();
      if (p && p.catch) p.catch(function () {});
    });
  }
  ['touchend', 'click', 'keydown'].forEach(function (ev) {
    document.addEventListener(ev, tocarRecusados, { passive: true });
  });

  // `?diag` no endereço escreve na página por que cada vídeo não tocou. Serve
  // para conferir no aparelho de verdade, onde não há console.
  var diag = /[?&]diag\b/.test(location.search);
  function anotar(texto) {
    if (!diag) return;
    var c = document.getElementById('diagVideo');
    if (!c) {
      c = document.createElement('pre');
      c.id = 'diagVideo';
      c.style.cssText = 'position:fixed;left:8px;right:8px;bottom:8px;z-index:9999;margin:0;padding:10px;' +
        'background:#161412;color:#F4F1EC;font:12px/1.4 monospace;white-space:pre-wrap;max-height:40vh;overflow:auto';
      document.body.appendChild(c);
    }
    c.textContent += texto + '\n';
  }
  anotar('movimento reduzido: ' + (quieto ? 'SIM (vídeo desligado)' : 'não') +
    ' | economia de dados: ' + (economizando ? 'SIM (vídeo desligado)' : 'não') +
    (con ? ' | rede: ' + con.effectiveType : ''));

  function aoAparecer(id, arquivo) {
    var v = document.getElementById(id);
    if (!v) return;
    anotar(id + ': na página');

    // O pôster já está no HTML, então não fazer nada aqui deixa a imagem parada
    // na tela. É a degradação certa: perde o movimento, não perde a figura.
    if (quieto || economizando) return;

    if (!('IntersectionObserver' in window)) { v.src = arquivo; v.load(); return; }

    var olho = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (e) {
        if (e.isIntersecting) {
          if (!v.src) { v.src = arquivo; v.load(); }
          var p = v.play();
          if (p && p.then) p.then(function () { anotar(id + ': tocando'); });
          if (p && p.catch) p.catch(function (erro) {
            anotar(id + ': recusado (' + (erro && erro.name) + '), toca no primeiro toque');
            if (recusados.indexOf(v) < 0) recusados.push(v);
          });
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

  aoAparecer('giroVideo', '/desenho.mp4');
  aoAparecer('nfcVideo', '/nfc.mp4');
  aoAparecer('giroAromas', '/giro.mp4');
  // A home na identidade nova (nov/2026): a areia escorrendo na faixa do
  // refil e a fumaça do pavio no bloco do livro.
  aoAparecer('refilVideo', '/areia.mp4');
  aoAparecer('livroVideo', '/fumaca.mp4');
  // Aromas (nov/2026): o giro dos vidrinhos, na capa, e o da estação.
  aoAparecer('giroVidrinhos', '/aromas/frascos/giro-trio.mp4');
  aoAparecer('giroEstacao', '/aromas/frascos/giro-estacao.mp4');
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

// O CABEÇALHO SAI DA FRENTE AO LER, e volta ao rolar para cima (nov/2026).
//
// No celular ele tem duas linhas e ocupa 127 dos 812 px, 16% da tela, em toda
// página e o tempo todo. Rolar para baixo é ler; rolar para cima é procurar
// alguma coisa, e é nessa hora que ele volta.
//
// Ele DESLIZA inteiro, e não encolhe. Esconder só a linha do menu mudaria a
// altura de um elemento que está no fluxo da página, e o texto embaixo pularia
// a cada mudança de direção: o deslocamento que a loja levou duas rodadas para
// zerar. `transform` não mexe em layout nenhum.
//
// Só no celular (o mesmo corte de 780 px em que o menu vira segunda linha), só
// depois de passar a altura dele, e volta sempre que algo dentro dele recebe
// foco, senão quem navega por teclado tabularia para um link fora da tela.
(function () {
  var topo = document.querySelector('.topo');
  if (!topo) return;
  var celular = window.matchMedia('(max-width:780px)');
  var ancora = window.scrollY, pedido = false;

  function mostrar() { topo.classList.remove('recolhido'); }

  function medir() {
    pedido = false;
    var y = window.scrollY, d = y - ancora;
    if (!celular.matches || y < topo.offsetHeight) { mostrar(); ancora = y; return; }
    // A âncora só anda quando a direção é decidida: rolagem lenta soma vários
    // quadros pequenos até passar do limiar, em vez de nunca chegar nele.
    if (d > 8) { topo.classList.add('recolhido'); ancora = y; }
    else if (d < -8) { mostrar(); ancora = y; }
  }

  window.addEventListener('scroll', function () {
    if (pedido) return;
    pedido = true;
    requestAnimationFrame(medir);
  }, { passive: true });
  topo.addEventListener('focusin', mostrar);
  // A loja chama isto ao pôr uma peça na sacola: o retorno é o contador que
  // pisca no cabeçalho, e ele não pode piscar fora da tela.
  window.addEventListener('cinerea:topo', mostrar);
})();

// O PAVIO DAS FAIXAS DE PEÇAS (nov/2026). As peças ficam enfiadas
// num pavio, que cai em barriga entre uma e outra e termina aceso depois da
// última. Desenhado por script, e não por SVG fixo, porque as peças são
// desalinhadas de propósito e a vitrine rola de lado no celular: o fio tem
// de passar pelo centro de cada foto ONDE ela estiver. Passa por TRÁS das
// fotos (fica à vista só no vão), e se redesenha quando o /vitrine.js troca
// as caixas ou a largura muda. A classe não é `.pavio`, que é a vela da margem.
// Vale para a vitrine (#vitrine, fotos .vit-foto) e para a trilha dos pratos e
// potes (.novas-trilha, fotos .novas-foto): é a mesma função, chamada duas vezes.
//
// `vertical` é a trilha (nov/2026): as peças descem a página em zigue-zague, e
// o fio não cai em barriga, ele SERPENTEIA. Cada trecho sai de uma foto e chega
// na outra na vertical (os pontos de controle ficam acima e abaixo, e não ao
// lado), o que dá um S em cada vão; um desvio alternado para um lado e para o
// outro tira a cara de régua. Depois da última o fio desce, faz a volta por
// baixo e sobe até a chama, que acende abaixo da peça.
//
// O PAVIO QUEIMA COM A ROLAGEM nas trilhas verticais (nov/2026): o fio se
// desenha conforme a pessoa desce, com uma brasa correndo na ponta, e a
// chama só acende quando ele chega ao fim, ao lado da última peça. Quem pediu
// menos movimento vê o pavio inteiro e a chama acesa, parados. O fio e a
// trama ficam atrás de uma máscara (um traço branco largo com o mesmo
// desenho), e é a máscara que avança: a trama já usa tracejado próprio, e
// tracejar o fio por cima dela apagaria a textura de algodão.
var pavioCalmo = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
var pavioConta = 0;
function ligarPorPavio(caixa, seletor, modoVertical) {
  if (!caixa || !window.ResizeObserver) return;
  var NS = 'http://www.w3.org/2000/svg';
  var svg = document.createElementNS(NS, 'svg');
  svg.setAttribute('class', 'vit-fio');
  svg.setAttribute('aria-hidden', 'true');
  var pedido = false;
  var revela = null, frente = null, comprimento = 0, inicio = 0, fim = 0;

  // de 0 (o fio nem começou) a 1 (chegou à chama): a ponta acompanha um ponto
  // a 65% da altura da janela, então o pavio queima um pouco abaixo de onde
  // a pessoa está olhando, e não atrás dela
  function queimar() {
    if (!revela) return;
    var topo = caixa.getBoundingClientRect().top;
    var p = (window.innerHeight * 0.65 - (topo + inicio)) / Math.max(1, fim - inicio);
    p = Math.max(0, Math.min(1, p));
    revela.style.strokeDashoffset = comprimento * (1 - p);
    var acesa = p >= 0.985;
    svg.classList.toggle('acesa', acesa);
    if (frente) {
      var q = revela.getPointAtLength(comprimento * p);
      frente.setAttribute('cx', n(q.x)); frente.setAttribute('cy', n(q.y));
      frente.style.opacity = p > 0.005 && !acesa ? 1 : 0;
    }
  }
  var pedidoQ = false;
  window.addEventListener('scroll', function rolou() {
    // a loja refaz a grade a cada filtro: o fio da grade antiga para de ouvir
    if (!caixa.isConnected) { window.removeEventListener('scroll', rolou); return; }
    if (!revela || pedidoQ) return;
    pedidoQ = true;
    requestAnimationFrame(function () { pedidoQ = false; queimar(); });
  }, { passive: true });

  function n(v) { return Math.round(v * 10) / 10; }

  function desenhar() {
    pedido = false;
    // `vertical` pode ser uma pergunta e não um sim: a vitrine é trilha só no
    // celular, e quem gira o aparelho troca de modo sem recarregar
    var vertical = typeof modoVertical === 'function' ? modoVertical() : modoVertical;
    var serpente = vertical === 'serpente';
    // por ÚLTIMO, e não primeiro: o desalinhamento usa :nth-child nas peças
    if (svg.parentNode !== caixa || svg.nextSibling) caixa.appendChild(svg);
    var fotos = caixa.querySelectorAll(seletor);
    if (fotos.length < 2) { svg.innerHTML = ''; return; }
    if (serpente) fotos = desalinhar(fotos);
    // zera antes de medir: o próprio fio conta na largura rolável, e um fio
    // largo de antes (girou o celular, encolheu a janela) mediria a si mesmo
    svg.setAttribute('width', 0); svg.setAttribute('height', 0);
    var base = caixa.getBoundingClientRect();
    var pts = [].map.call(fotos, function (f) {
      var r = f.getBoundingClientRect();
      return { x: r.left - base.left + caixa.scrollLeft + r.width / 2,
               y: r.top - base.top + r.height * (vertical ? 0.5 : 0.6), w: r.width,
               dir: r.right - base.left + caixa.scrollLeft, fundo: r.bottom - base.top, fila: f.dataset.fila };
    });
    var W = Math.max(caixa.scrollWidth, caixa.clientWidth), H = caixa.scrollHeight;
    svg.setAttribute('width', W); svg.setAttribute('height', H);
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var d = 'M' + n(pts[0].x) + ' ' + n(pts[0].y), u = pts[pts.length - 1], fx, fy, i, a, b;
    if (serpente) {
      // A LOJA (nov/2026): fila a fila, em serpente. Na mesma fila o fio
      // pesa no meio do vão; para descer de fila, ele faz a volta POR FORA da
      // foto, do lado em que a fila terminou, e nunca além da tela.
      var noViewport = base.left;
      var folga = function (p, lado) {
        var livre = lado > 0 ? window.innerWidth - (noViewport + p.x + p.w / 2) : noViewport + p.x - p.w / 2;
        return Math.max(10, Math.min(32, livre - 8));
      };
      for (i = 1; i < pts.length; i++) {
        a = pts[i - 1]; b = pts[i];
        if (a.fila === b.fila) {
          var vao = b.x - a.x, peso = Math.abs(vao) * .18;
          d += ' C' + n(a.x + vao * .35) + ' ' + n(a.y + peso) + ' ' + n(b.x - vao * .35) + ' ' + n(b.y + peso) + ' ' + n(b.x) + ' ' + n(b.y);
        } else {
          // A DESCIDA DE FILA corre AO LADO da coluna, a uma distância fixa da
          // borda: sai da foto de lado, desce reto e entra na foto de baixo,
          // com as quinas arredondadas. Uma curva só passava rente à legenda
          // e riscava o nome da peça.
          var ld = a.x > W / 2 ? 1 : -1, f = folga(a, ld),
              xa = a.x + ld * (a.w / 2 + f), xb = b.x + ld * (b.w / 2 + f), r = Math.min(26, (b.y - a.y) / 4, f);
          d += ' L' + n(xa - ld * r) + ' ' + n(a.y) + ' Q' + n(xa) + ' ' + n(a.y) + ' ' + n(xa) + ' ' + n(a.y + r) +
               ' L' + n(xb) + ' ' + n(b.y - r) + ' Q' + n(xb) + ' ' + n(b.y) + ' ' + n(xb - ld * r) + ' ' + n(b.y) +
               ' L' + n(b.x) + ' ' + n(b.y);
        }
      }
      // depois da última, o fio sai pelo lado de fora, sobe e acende
      var lf = u.x > W / 2 ? 1 : -1;
      fx = u.x + lf * (u.w / 2 + folga(u, lf) * .8); fy = u.y - Math.min(50, u.w * .25);
      d += ' C' + n(u.x + lf * u.w * .3) + ' ' + n(u.y + 30) + ' ' + n(fx) + ' ' + n(fy + 40) + ' ' + n(fx) + ' ' + n(fy);
    } else if (vertical) {
      // de centro a centro, um S por vão, desviando ora para um lado, ora para o outro
      // O trecho que aparece é o do VÃO, entre as duas fotos, e um S simples
      // atravessa o vão quase reto. Por isso cada trecho passa por um ponto do
      // meio, fora da linha reta (ora acima, ora abaixo), e chega nele já
      // ondulando: é essa ondulação, no vão, que lê como fio solto.
      for (i = 1; i < pts.length; i++) {
        a = pts[i - 1]; b = pts[i];
        var desce = b.y - a.y, meio = (b.x - a.x) / 2, onda = (i % 2 ? 1 : -1) * Math.min(56, desce * .22),
            mx = a.x + meio + onda * .6, my = a.y + desce / 2 + onda;
        // sai pela LATERAL da foto, do lado da próxima, e não por baixo:
        // embaixo da foto fica a legenda, e o fio passando ali riscava o texto
        // e vai ALÉM da borda antes de descer: no celular as colunas quase se
        // tocam, e meio vão para o lado ainda deixava o fio rente ao texto
        var sai = a.x + (b.x > a.x ? 1 : -1) * (a.w / 2 + 56);
        d += ' C' + n(sai) + ' ' + n(a.y + desce * .04) + ' ' + n(mx - meio * .55) + ' ' + n(my + onda * 1.1) + ' ' + n(mx) + ' ' + n(my) +
             ' S' + n(b.x) + ' ' + n(b.y - desce * .55) + ' ' + n(b.x) + ' ' + n(b.y);
      }
      // A chama acende AO LADO da última, no vão da outra coluna, e não
      // embaixo: embaixo da foto fica a legenda, e o fio descendo por ela
      // riscava o nome e o preço. Sai pelo lado de dentro e sobe até a chama.
      var lado = u.x > W / 2 ? -1 : 1, alto = u.fundo - u.y;
      fx = u.x + lado * (u.w / 2 + Math.min(70, W * .06)); fy = u.y + alto * .15;
      d += ' C' + n(u.x + lado * u.w * .4) + ' ' + n(u.y + alto * .55) + ' ' + n(fx) + ' ' + n(fy + alto * .5) + ' ' + n(fx) + ' ' + n(fy);
    } else {
      // de centro a centro, cada vão uma barriga: o fio pesa no meio
      for (i = 1; i < pts.length; i++) {
        a = pts[i - 1]; b = pts[i]; var vao = b.x - a.x;
        d += ' C' + n(a.x + vao * .35) + ' ' + n(a.y + vao * .2) + ' ' + n(b.x - vao * .35) + ' ' + n(b.y + vao * .2) + ' ' + n(b.x) + ' ' + n(b.y);
      }
      // depois da última, o fio sai, sobe e acende
      fx = u.dir + 34; fy = u.y - 46;
      d += ' C' + n(u.x + u.w * .45) + ' ' + n(u.y + 26) + ' ' + n(fx - 6) + ' ' + n(fy + 34) + ' ' + n(fx) + ' ' + n(fy);
    }
    var ponta =
      '<g class="ponta" transform="translate(' + n(fx) + ' ' + n(fy) + ')">' +
        '<circle class="brilho" r="13"/>' +
        '<path class="chama" d="M0 -3 C-4.2 -8 -3.6 -14 0 -21 C3.6 -14 4.2 -8 0 -3Z"/>' +
        '<circle class="brasa" r="2.6"/>' +
      '</g>';
    var fios = '<path class="fio" d="' + d + '"/><path class="trama" d="' + d + '"/>';
    if ((vertical || serpente) && !pavioCalmo) {
      var id = 'pavio-' + (++pavioConta);
      svg.innerHTML =
        '<defs><mask id="' + id + '" maskUnits="userSpaceOnUse" x="0" y="0" width="' + W + '" height="' + H + '">' +
          '<path class="revela" d="' + d + '" fill="none" stroke="#fff" stroke-width="14" stroke-linecap="round"/>' +
        '</mask></defs>' +
        '<g mask="url(#' + id + ')">' + fios + '</g>' + ponta +
        '<circle class="frente" r="2.6"/>';
      revela = svg.querySelector('.revela');
      frente = svg.querySelector('.frente');
      comprimento = revela.getTotalLength();
      revela.style.strokeDasharray = comprimento + ' ' + comprimento;
      inicio = Math.min.apply(null, pts.map(function (p) { return p.y; })); fim = Math.max(fy, u.y);
      svg.classList.add('queima');
      queimar();
    } else {
      revela = frente = null;
      svg.classList.remove('queima', 'acesa');
      svg.innerHTML = fios + ponta;
    }
  }

  /* As colunas descem em alturas diferentes, como peças pousadas numa mesa, e
     as fotos voltam na ordem da serpente: fila 1 da esquerda para a direita,
     fila 2 da direita para a esquerda. A fila sai do `offsetTop` do cartão
     MENOS o desalinhamento, que é margem e mudaria a conta. */
  function desalinhar(fotos) {
    var DESCE = window.innerWidth < 600 ? [0, 30] : [0, 54, 18, 70];
    var cartoes = [].map.call(fotos, function (f) { return f.closest('.peca') || f.parentNode; });
    cartoes.forEach(function (c) { c.style.marginTop = ''; });
    var colunas = [], filas = [];
    cartoes.forEach(function (c) {
      if (colunas.indexOf(c.offsetLeft) < 0) colunas.push(c.offsetLeft);
      if (filas.indexOf(c.offsetTop) < 0) filas.push(c.offsetTop);
    });
    colunas.sort(function (a, b) { return a - b; });
    filas.sort(function (a, b) { return a - b; });
    var itens = [].map.call(fotos, function (f, k) {
      var c = cartoes[k], col = colunas.indexOf(c.offsetLeft), fila = filas.indexOf(c.offsetTop);
      return { f: f, c: c, col: col, fila: fila };
    });
    if (colunas.length > 1) itens.forEach(function (it) { it.c.style.marginTop = DESCE[it.col % DESCE.length] + 'px'; });
    itens.sort(function (a, b) { return a.fila - b.fila || (a.fila % 2 ? b.col - a.col : a.col - b.col); });
    itens.forEach(function (it) { it.f.dataset.fila = it.fila; });
    return itens.map(function (it) { return it.f; });
  }

  function pedir() { if (!pedido) { pedido = true; requestAnimationFrame(desenhar); } }
  new ResizeObserver(pedir).observe(caixa);
  // o /vitrine.js troca o conteúdo inteiro, e leva o fio junto: põe de volta
  new MutationObserver(function () { if (svg.parentNode !== caixa || svg.nextSibling) pedir(); }).observe(caixa, { childList: true });
  window.addEventListener('load', pedir);
  pedir();
}
ligarPorPavio(document.getElementById('vitrine'), '.vit-foto', function () {
  return window.matchMedia && matchMedia('(max-width:560px)').matches;
});
ligarPorPavio(document.querySelector('.novas-trilha'), '.novas-foto', true);

// A segunda foto dos pratos e potes, a vista de cima, só onde há mouse. Ela
// existe para a troca no hover, e no toque seria peso baixado para nunca
// aparecer: por isso o endereço mora em data-segunda e quem cria a imagem é
// este trecho. Leva a mesma classe da primeira, que é a máscara de borda.
if (window.matchMedia && matchMedia('(hover:hover)').matches) {
  [].forEach.call(document.querySelectorAll('.novas-foto img[data-segunda]'), function (img) {
    var s = new Image();
    s.className = img.className + ' segunda';
    s.alt = ''; s.setAttribute('aria-hidden', 'true');
    s.loading = 'lazy'; s.decoding = 'async';
    s.setAttribute('width', img.getAttribute('width'));
    s.setAttribute('height', img.getAttribute('height'));
    s.src = img.getAttribute('data-segunda');
    img.parentNode.appendChild(s);
  });
}
