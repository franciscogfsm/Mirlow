import type { Guides } from "./index";

export const pt: Guides = {
  iphone: {
    title: "Como espelhar o ecrã do iPhone no PC com Windows",
    short: "Espelhar o iPhone no PC",
    metaTitle: "Como espelhar o iPhone no PC com Windows, grátis e sem fios",
    description:
      "Passo a passo: veja o ecrã do iPhone num PC com Windows 10 ou 11 por Wi-Fi, com som, sem cabo e sem instalar nada no telemóvel. Grátis.",
    lead: "O Windows não consegue receber sozinho o ecrã de um iPhone, mas uma pequena aplicação gratuita resolve isso. Com o Mirlow no PC, o botão Projeção do ecrã que já existe no iPhone faz o resto: sem cabo, sem aplicação no telemóvel, sem conta.",
    steps: [
      {
        title: "Instale o Mirlow no PC",
        body: "Transfira o Mirlow para Windows 10 ou 11 e execute o instalador. É gratuito e não há nenhum registo a fazer.",
      },
      {
        title: "Ligue os dois dispositivos à mesma rede",
        body: "Ligue o iPhone à mesma rede Wi-Fi do PC. Um PC ligado por cabo ao mesmo router também serve.",
      },
      {
        title: "Abra o Mirlow",
        body: "A janela indica Pronto para projetar e mostra o nome com que o PC vai aparecer no iPhone.",
      },
      {
        title: "Abra a Central de controlo no iPhone",
        body: "Deslize para baixo a partir do canto superior direito do ecrã. Num iPhone com botão principal, deslize para cima a partir da margem inferior.",
      },
      {
        title: "Toque em Projeção do ecrã e escolha o PC",
        body: "É o botão com dois retângulos sobrepostos. Escolha o nome que o Mirlow lhe mostrou.",
      },
      {
        title: "O iPhone está no PC",
        body: "A imagem e o som aparecem na janela do Mirlow, e a imagem acompanha quando roda o telemóvel. Use o botão de ecrã inteiro para ocupar o monitor todo.",
      },
    ],
    sections: [
      {
        title: "O que é preciso",
        body: [
          "Um PC com Windows 10 ou Windows 11 (64 bits), um iPhone e uma rede a que ambos estejam ligados. A lista é só esta: sem cabo, sem adaptador, sem Apple TV e sem aplicações da App Store.",
        ],
      },
      {
        title: "Como parar a projeção",
        body: [
          "Volte a abrir a Central de controlo, toque em Projeção do ecrã e escolha Parar projeção. Também pode carregar em Desligar na janela do Mirlow. Fechar a janela mantém o Mirlow na área de notificação, pronto para a próxima vez.",
        ],
      },
      {
        title: "Para que serve",
        body: [
          "Mostrar fotografias a toda a gente na sala, explicar a alguém como se usa uma aplicação, seguir uma receita ou um treino num ecrã maior, ou simplesmente ler o telemóvel sem o ter na mão.",
          "O Mirlow mostra o que o telemóvel mostra. Não controla o iPhone a partir do PC: continua a tocar e a escrever no próprio telemóvel.",
        ],
      },
    ],
    faq: [
      {
        q: "Dá para espelhar o iPhone no PC sem cabo?",
        a: "Sim. A projeção passa pela rede Wi-Fi, por isso não há cabo USB nem HDMI. Os dois dispositivos só têm de estar na mesma rede.",
      },
      {
        q: "Tenho de instalar alguma aplicação no iPhone?",
        a: "Não. A Projeção do ecrã faz parte do iOS. A única coisa que se instala é o Mirlow, no PC.",
      },
      {
        q: "Espelhar, projetar, duplicar o ecrã, AirPlay: é tudo o mesmo?",
        a: "No dia a dia, sim. AirPlay é o nome da tecnologia sem fios da Apple, Projeção do ecrã é o botão da Central de controlo que a usa para enviar o ecrã inteiro, e espelhar ou duplicar o ecrã são as palavras correntes para o mesmo. No Brasil diz-se espelhar a tela do iPhone no PC ou no notebook. O Mirlow é quem recebe a imagem do lado do Windows.",
      },
      {
        q: "Funciona no Windows 10 e no Windows 11?",
        a: "Sim, nas versões de 64 bits de ambos, em computadores de secretária e portáteis.",
      },
      {
        q: "O Windows mostrou um aviso ao abrir o instalador. É normal?",
        a: "Pode acontecer. O Windows avisa quando um instalador ainda não tem assinatura digital, e o do Mirlow não tem. Antes de o executar, pode comparar o código SHA-256 do ficheiro com o que está publicado na página inicial do Mirlow e ler o código-fonte.",
      },
    ],
  },

  airplay: {
    title: "Um recetor AirPlay gratuito para Windows",
    short: "Recetor AirPlay para Windows",
    metaTitle: "Recetor AirPlay gratuito para Windows 10 e 11 (código aberto)",
    description:
      "Transforme um PC com Windows num recetor AirPlay para projetar o ecrã. Gratuito e de código aberto, com som, sem conta e sem aplicação no iPhone, iPad ou Mac.",
    lead: "Um recetor AirPlay é aquilo para onde o iPhone envia o ecrã. O Windows não traz nenhum, por isso a lista da Projeção do ecrã no telemóvel fica vazia até instalar um. O Mirlow é um recetor gratuito e de código aberto que faz o seu PC aparecer nessa lista.",
    sections: [
      {
        title: "O que faz um recetor AirPlay",
        body: [
          "Quando toca em Projeção do ecrã, o iPhone procura recetores na rede local e envia a imagem e o som para o que escolher. Uma Apple TV é um desses recetores. Com o Mirlow aberto, o seu PC com Windows é outro.",
          "No telemóvel não muda nada. O recetor anuncia-se na rede, o telemóvel encontra-o e os dois comunicam diretamente.",
        ],
      },
      {
        title: "Como configurar",
        body: [
          "Instale o Mirlow num PC com Windows 10 ou 11 e abra-o. O PC fica visível a partir desse momento. No iPhone ou iPad, abra a Central de controlo, toque em Projeção do ecrã e escolha o PC. No Mac, a Projeção do ecrã está na Central de controlo da barra de menus.",
          "Pode mudar o nome do PC nas definições do Mirlow, o que dá jeito quando há vários recetores na mesma casa ou no mesmo escritório.",
        ],
      },
      {
        title: "O que funciona e o que não funciona",
        body: [
          "A projeção do ecrã com som funciona, na vertical e na horizontal, em janela ou em ecrã inteiro.",
          "As aplicações que protegem o vídeo, como a maioria dos serviços de filmes e séries, mostram uma imagem preta enquanto são projetadas. A decisão é dessas aplicações e o Mirlow não tenta contorná-la.",
          "O Mirlow recebe. Não envia o ecrã do Windows para uma Apple TV nem para outro dispositivo.",
        ],
      },
      {
        title: "Porque é gratuito",
        body: [
          "O Mirlow é construído sobre o UxPlay, um recetor AirPlay de código aberto, e é ele próprio publicado com a licença GPL-3.0. Não há versão paga, período experimental, marca de água nem publicidade, e a aplicação não faz ligações à internet.",
        ],
      },
    ],
    faq: [
      {
        q: "O Windows traz AirPlay de origem?",
        a: "Não. O Windows tem a sua própria função de ecrã sem fios, baseada em Miracast, que os iPhones não usam. Para receber AirPlay é preciso uma aplicação recetora, como o Mirlow.",
      },
      {
        q: "É seguro ter um recetor AirPlay a funcionar?",
        a: "O Mirlow só escuta na sua rede local, não tem conta e não envia nada para a internet. O código-fonte é público e o código de verificação do instalador está publicado, por isso ambos podem ser confirmados.",
      },
      {
        q: "O iPhone e o PC têm de estar na mesma rede Wi-Fi?",
        a: "Têm de estar na mesma rede local. O PC pode estar ligado por cabo, desde que seja ao mesmo router. As redes de convidados costumam manter os dispositivos separados, por isso evite-as.",
      },
      {
        q: "O Mirlow é feito ou aprovado pela Apple?",
        a: "Não. O Mirlow é um projeto independente de código aberto. Não tem afiliação, aprovação nem certificação da Apple. AirPlay é uma marca comercial da Apple Inc.",
      },
    ],
  },

  ipad: {
    title: "Como espelhar o ecrã do iPad no PC com Windows",
    short: "Espelhar o iPad no PC",
    metaTitle: "Como espelhar o iPad no PC ou portátil com Windows, grátis",
    description:
      "Veja o ecrã do iPad num PC com Windows 10 ou 11 por Wi-Fi, com o botão Projeção do ecrã que o iPadOS já tem. Grátis, com som, sem cabo e sem aplicação no iPad.",
    lead: "Um iPad projeta para um PC com Windows da mesma forma que um iPhone: com o botão Projeção do ecrã da Central de controlo e um recetor no PC. O Mirlow é esse recetor, e é gratuito.",
    steps: [
      {
        title: "Instale e abra o Mirlow no PC",
        body: "Transfira o Mirlow para Windows 10 ou 11, execute o instalador e abra a aplicação. Ela mostra o nome com que o PC vai aparecer no iPad.",
      },
      {
        title: "Ligue o iPad à mesma rede",
        body: "O iPad e o PC têm de estar na mesma rede Wi-Fi, ou o PC ligado por cabo ao mesmo router.",
      },
      {
        title: "Abra a Central de controlo no iPad",
        body: "Deslize para baixo a partir do canto superior direito do ecrã.",
      },
      {
        title: "Toque em Projeção do ecrã e escolha o PC",
        body: "O ecrã do iPad aparece na janela do Mirlow, com o som.",
      },
    ],
    sections: [
      {
        title: "Na horizontal fica melhor num monitor",
        body: [
          "Rode o iPad para a horizontal e a imagem ocupa quase todo o monitor; o Mirlow acompanha a rotação. Em ecrã inteiro, a imagem do iPad é ajustada ao monitor sem ficar esticada.",
        ],
      },
      {
        title: "Para que se costuma usar",
        body: [
          "Pôr apontamentos manuscritos ou um desenho num ecrã maior enquanto trabalha no iPad, mostrar diapositivos ou um documento a uma sala, ou deixar uma turma ou a família ver o que está no tablet.",
          "A projeção é num só sentido. O PC mostra o ecrã do iPad e continua a usar o iPad com os dedos ou com a caneta; o rato e o teclado do PC não o controlam.",
        ],
      },
    ],
    faq: [
      {
        q: "Funciona com qualquer iPad?",
        a: "Funciona com os iPads que têm Projeção do ecrã na Central de controlo, o que abrange os modelos iPad, iPad mini, iPad Air e iPad Pro com versões atuais do iPadOS.",
      },
      {
        q: "Posso usar o monitor do PC como segundo ecrã do iPad?",
        a: "O Mirlow mostra uma cópia do ecrã do iPad. Não estende o ambiente de trabalho do iPad para o monitor como um ecrã separado.",
      },
      {
        q: "Preciso de cabo ou adaptador?",
        a: "Não. A projeção passa pela rede local. Não precisa de cabo USB-C ou Lightning, nem de adaptador HDMI.",
      },
      {
        q: "O som também é projetado?",
        a: "Sim. O áudio do iPad ouve-se nas colunas do PC. Pode desligá-lo nas definições do Mirlow se preferir manter o som no iPad.",
      },
    ],
  },

  "not-showing": {
    title: "O PC não aparece na Projeção do ecrã: como resolver",
    short: "O PC não aparece na Projeção do ecrã",
    metaTitle: "O PC não aparece na Projeção do ecrã do iPhone? Como resolver",
    description:
      "Se o PC com Windows não aparece na lista da Projeção do ecrã do iPhone ou iPad, verifique estas causas por ordem: rede, firewall, tipo de rede e VPN.",
    lead: "Quando a lista da Projeção do ecrã no iPhone está vazia, ou o seu PC não está lá, é porque o telemóvel e o PC não se conseguem ver na rede. É quase sempre uma de quatro coisas, e cada uma verifica-se num instante.",
    steps: [
      {
        title: "Confirme que estão os dois na mesma rede",
        body: "O iPhone e o PC têm de usar o mesmo router. Um telemóvel em dados móveis, ou numa rede de convidados, não encontra o PC. As redes de convidados existem precisamente para manter os dispositivos separados.",
      },
      {
        title: "Permita o Mirlow na firewall do Windows",
        body: "No Mirlow, abra a ligação «Não vê este PC no iPhone?» e carregue em Permitir o Mirlow. O Windows pede-lhe para confirmar. A firewall bloqueada é a causa mais habitual.",
      },
      {
        title: "Defina a rede como Privada",
        body: "O Windows esconde o PC nas redes marcadas como Públicas. Se estiver em casa ou no trabalho, numa rede em que confia, o mesmo painel de ajuda do Mirlow abre as definições de rede do Windows, onde a pode mudar para Privada.",
      },
      {
        title: "Desligue qualquer VPN",
        body: "Uma VPN no iPhone ou no PC costuma desviar o tráfego da rede local. Ponha-a em pausa e procure outra vez.",
      },
      {
        title: "Reinicie o recetor e volte a procurar",
        body: "Carregue em Reiniciar o recetor no painel de ajuda do Mirlow e depois feche e volte a abrir a Central de controlo no iPhone, para que ele procure de novo.",
      },
    ],
    sections: [
      {
        title: "Se continuar sem aparecer",
        body: [
          "Desligue e volte a ligar o Wi-Fi no iPhone e, se puder, reinicie o router. Alguns routers, sobretudo em redes partilhadas ou de escritório, têm uma opção chamada isolamento de clientes ou isolamento de AP que impede os dispositivos de comunicarem entre si; tem de estar desligada para qualquer tipo de projeção de ecrã funcionar.",
          "Numa rede de empresa ou de escola pode não conseguir alterar estas opções. Nesse caso é a rede que está a bloquear a projeção de propósito, e não o telemóvel ou o PC.",
        ],
      },
      {
        title: "O PC aparece, mas não liga",
        body: [
          "Se o PC está na lista e escolhê-lo não faz nada, reinicie o recetor no Mirlow e tente de novo. Se a imagem ficar preta depois de ligar, ative o Modo de compatibilidade nas definições do Mirlow.",
        ],
      },
    ],
    faq: [
      {
        q: "Porque é que a lista da Projeção do ecrã está vazia no iPhone?",
        a: "A lista só mostra os recetores que o iPhone encontra na rede em que está. Uma lista vazia significa que não há nenhum recetor a funcionar, ou que algo entre os dois dispositivos, normalmente uma firewall ou uma rede de convidados, impede o telemóvel de o encontrar.",
      },
      {
        q: "O PC tem de estar ligado por Wi-Fi?",
        a: "Não. Um PC ligado por cabo Ethernet funciona, desde que esteja no mesmo router que o Wi-Fi do iPhone.",
      },
      {
        q: "O Bluetooth tem de estar ligado?",
        a: "A projeção em si passa pela rede, não pelo Bluetooth. O que importa é os dois dispositivos estarem na mesma rede.",
      },
      {
        q: "Ontem funcionava e hoje não. O que mudou?",
        a: "Normalmente a rede: o telemóvel ligou-se a outro Wi-Fi, uma VPN foi ativada, ou o Windows marcou uma rede nova como Pública. Siga os passos acima por ordem.",
      },
    ],
  },

  "black-screen": {
    title: "Ecrã preto ao espelhar o iPhone no PC",
    short: "Ecrã preto ao espelhar",
    metaTitle: "Ecrã preto ao espelhar o iPhone no PC: porquê e o que fazer",
    description:
      "Uma imagem preta ao projetar o ecrã tem duas causas habituais: a aplicação protege o vídeo, ou o PC não está a descodificar bem a imagem. Veja como distinguir.",
    lead: "Uma imagem preta durante a projeção quer dizer uma de duas coisas. Ou a aplicação no iPhone recusa ser projetada, e nenhum recetor consegue mudar isso, ou o PC está com dificuldade em descodificar o vídeo, e uma definição resolve. Distinguir as duas demora dez segundos.",
    sections: [
      {
        title: "Primeiro, descubra qual das duas é",
        body: [
          "Durante a projeção, vá ao ecrã principal do iPhone. Se o ecrã principal aparece no PC e só uma aplicação fica preta, essa aplicação está a proteger o vídeo. Se fica tudo preto, incluindo o ecrã principal, o problema está no PC.",
        ],
      },
      {
        title: "Só uma aplicação fica preta: vídeo protegido",
        body: [
          "A maioria das aplicações de filmes, séries e desporto em direto marca o vídeo como protegido. O iOS envia então uma imagem preta para tudo o que projete ou grave o ecrã, muitas vezes com o som e as legendas a continuar. É pela mesma razão que uma gravação de ecrã dessas aplicações sai a preto.",
          "É uma decisão dessas aplicações, aplicada pelo próprio iPhone. O Mirlow não tenta contorná-la, e nenhum outro recetor de projeção o consegue. Os menus, as fotografias, os seus vídeos, os navegadores, os jogos e a maior parte das outras aplicações projetam-se normalmente.",
        ],
      },
      {
        title: "Fica tudo preto: ative o Modo de compatibilidade",
        body: [
          "Normalmente o Mirlow pede à placa gráfica do PC para descodificar o vídeo. Com alguns controladores gráficos isso corre mal, e o resultado é uma imagem preta ou parada. Abra as definições do Mirlow e ative o Modo de compatibilidade, que descodifica o vídeo por software. Consome um pouco mais de energia e funciona em praticamente qualquer PC.",
          "Atualizar o controlador da placa gráfica costuma resolver o problema de origem, e depois disso pode voltar a desligar o Modo de compatibilidade.",
        ],
      },
      {
        title: "A imagem pára ou fica aos quadrados",
        body: [
          "Costuma ser o Wi-Fi e não o PC. Aproxime-se do router, ou ligue o PC por cabo, e evite transferências pesadas na mesma rede enquanto projeta.",
        ],
      },
    ],
    faq: [
      {
        q: "Porque é que uma aplicação de streaming fica preta ao espelhar, mas o resto funciona?",
        a: "A aplicação protege o vídeo contra cópia, por isso o iOS apaga-o na projeção e na gravação de ecrã. Não é uma avaria do telemóvel, do PC nem do Mirlow.",
      },
      {
        q: "Há alguma definição que desbloqueie as aplicações protegidas?",
        a: "Não. O Mirlow não contorna a proteção contra cópia e não tem nenhuma definição para isso.",
      },
      {
        q: "Ouço o som mas não vejo imagem. O que é?",
        a: "Se acontece só numa aplicação, é vídeo protegido. Se acontece em todo o lado, ative o Modo de compatibilidade nas definições do Mirlow.",
      },
      {
        q: "O Modo de compatibilidade piora a qualidade?",
        a: "Não. A imagem é a mesma; o PC passa apenas a fazer a descodificação no processador em vez de na placa gráfica, o que consome um pouco mais de energia.",
      },
    ],
  },

  "built-in": {
    title: "O Windows tem AirPlay?",
    short: "O Windows tem AirPlay?",
    metaTitle: "O Windows 11 tem AirPlay? Miracast, Ligação ao Telemóvel e o que funciona",
    description:
      "O Windows não recebe sozinho o ecrã de um iPhone. Porque é que o Miracast, a Ligação ao Telemóvel e o cabo USB não o espelham, e a forma gratuita que funciona.",
    lead: "Sozinho, não. O Windows 10 e o 11 conseguem receber um ecrã sem fios, mas falam uma língua diferente da do iPhone. Veja o que cada opção de origem faz realmente, e a forma simples de pôr o ecrã de um iPhone num PC.",
    sections: [
      {
        title: "O ecrã sem fios do Windows é Miracast",
        body: [
          "O Windows tem uma função para projetar para um PC, nas definições de projeção neste PC. Assenta no Miracast, a norma usada por muitos telemóveis Android e portáteis com Windows. Os iPhones e os iPads não suportam Miracast, por isso nunca veem um PC com Windows como destino para projetar.",
        ],
      },
      {
        title: "A Ligação ao Telemóvel não espelha o iPhone",
        body: [
          "A Ligação ao Telemóvel (Phone Link), a aplicação da Microsoft para ligar um telemóvel ao Windows, consegue mostrar as chamadas, as mensagens e as notificações de um iPhone no Windows 11. À data em que escrevemos, não mostra o ecrã do iPhone. A função de ecrã existe apenas para alguns telemóveis Android.",
        ],
      },
      {
        title: "Um cabo USB dá-lhe ficheiros, não o ecrã",
        body: [
          "Ligue um iPhone a um PC e o Windows mostra as fotografias e os vídeos como ficheiros. O software da Apple para Windows faz cópias de segurança e sincroniza o telemóvel. Nenhum dos dois põe o ecrã em direto no PC.",
        ],
      },
      {
        title: "O que funciona: um recetor AirPlay",
        body: [
          "O botão Projeção do ecrã do iPhone envia o ecrã por AirPlay, por isso o PC precisa de algo que receba AirPlay. O Mirlow é um recetor gratuito e de código aberto para Windows 10 e 11: abra-o e o PC aparece na lista da Projeção do ecrã do iPhone, iPad ou Mac.",
          "Funciona pela rede local, com som e sem instalar nada no telemóvel.",
        ],
      },
    ],
    faq: [
      {
        q: "Dá para fazer AirPlay do iPhone para o Windows 11?",
        a: "Sim, desde que o PC tenha um recetor AirPlay a funcionar, como o Mirlow. O Windows 11 não traz nenhum.",
      },
      {
        q: "O iPhone consegue usar Miracast?",
        a: "Não. Os iPhones e os iPads usam AirPlay para projetar sem fios e não suportam Miracast.",
      },
      {
        q: "Preciso de uma Apple TV?",
        a: "Não. A Apple TV é um tipo de recetor AirPlay; um PC com o Mirlow é outro.",
      },
      {
        q: "Posso enviar o ecrã do Windows para um iPhone ou uma Apple TV com o Mirlow?",
        a: "Não. O Mirlow recebe o ecrã de um dispositivo Apple. Não envia o ecrã do PC para lado nenhum.",
      },
    ],
  },

  audio: {
    title: "Como ouvir o som do iPhone nas colunas do PC",
    short: "Ouvir o som do iPhone no PC",
    metaTitle: "Ouvir o som do iPhone nas colunas do PC por AirPlay, grátis",
    description:
      "Envie música, podcasts ou qualquer som do iPhone ou iPad para as colunas de um PC com Windows por Wi-Fi, com AirPlay. Grátis, sem cabo e sem emparelhar Bluetooth.",
    lead: "Um PC com boas colunas dá uma ótima coluna AirPlay. Com o Mirlow aberto no Windows, o iPhone pode enviar só o som para o PC, sem mostrar o ecrã, tal como faria para uma coluna sem fios.",
    steps: [
      {
        title: "Abra o Mirlow no PC",
        body: "Instale o Mirlow para Windows 10 ou 11 e abra-o. Confirme que Reproduzir som está ativado nas definições; vem ativado de origem.",
      },
      {
        title: "Ponha alguma coisa a tocar no iPhone",
        body: "Música, um podcast, um vídeo: qualquer coisa com som. O iPhone tem de estar na mesma rede que o PC.",
      },
      {
        title: "Abra a Central de controlo e toque no ícone AirPlay",
        body: "É o pequeno ícone de círculos com um triângulo, no canto dos controlos de reprodução. Muitas aplicações mostram o mesmo ícone no seu próprio leitor.",
      },
      {
        title: "Escolha o seu PC",
        body: "O som passa para as colunas do PC e o Mirlow indica que está a reproduzir o som do iPhone. Para o trazer de volta, abra a mesma lista e escolha iPhone.",
      },
    ],
    sections: [
      {
        title: "Som com o ecrã, ou só o som",
        body: [
          "Quando projeta o ecrã, o som vai junto automaticamente. Os passos acima servem para quando quer apenas o som e prefere guardar o ecrã do telemóvel para si.",
          "Se preferir o contrário, a imagem projetada com o som a ficar no telemóvel, desative Reproduzir som nas definições do Mirlow.",
        ],
      },
      {
        title: "Porque não Bluetooth?",
        body: [
          "O Bluetooth funciona quando o PC consegue receber áudio, o que muitos não fazem sem configuração adicional. O AirPlay passa pela rede Wi-Fi, por isso não há emparelhamento e o telemóvel pode estar em qualquer ponto da casa a que a rede chegue.",
        ],
      },
    ],
    faq: [
      {
        q: "Posso usar o PC como coluna AirPlay?",
        a: "Sim. Enquanto o Mirlow estiver aberto, o PC aparece entre as colunas AirPlay no iPhone, iPad ou Mac.",
      },
      {
        q: "Que som sai pelo PC?",
        a: "O que o iPhone iria reproduzir: música, vídeos, jogos. As chamadas telefónicas ficam no telemóvel.",
      },
      {
        q: "Não há som quando projeto o ecrã. O que devo verificar?",
        a: "Que Reproduzir som está ativado nas definições do Mirlow, que o volume do PC está alto e a saída certa está escolhida no Windows, e que o volume do iPhone não está a zero.",
      },
      {
        q: "Custa alguma coisa?",
        a: "Não. O Mirlow é gratuito e de código aberto, sem conta e sem publicidade.",
      },
    ],
  },

  lag: {
    title: "A projeção do ecrã está lenta ou aos soluços: como a tornar fluida",
    short: "Projeção lenta ou com atraso",
    metaTitle: "Espelhar o iPhone no PC com atraso ou aos soluços? Como resolver",
    description:
      "Soluços, atraso ou imagem aos quadrados ao espelhar o iPhone ou o iPad num PC com Windows são quase sempre da rede. Seis coisas a verificar, da mais eficaz à menos.",
    lead: "A projeção envia vídeo em direto pela rede muitas vezes por segundo, por isso tudo o que atrasa a rede nota-se logo em soluços, quadrados ou atraso. As soluções são simples, e as duas primeiras resolvem a maior parte dos casos.",
    steps: [
      {
        title: "Ligue o PC ao router por cabo",
        body: "É a melhoria mais importante. Com o PC por Ethernet, só a metade do percurso que cabe ao telemóvel é sem fios.",
      },
      {
        title: "Aproxime-se do router e use a banda de 5 GHz",
        body: "As paredes e a distância reduzem muito a velocidade do Wi-Fi. Se o router tiver redes separadas de 2,4 GHz e 5 GHz, ligue o iPhone, e o PC se estiver sem fios, à de 5 GHz.",
      },
      {
        title: "Suspenda o uso pesado da rede",
        body: "Transferências grandes, cópias de segurança na nuvem e streaming de vídeo noutros dispositivos competem com a imagem projetada.",
      },
      {
        title: "Desligue qualquer VPN",
        body: "Uma VPN no telemóvel ou no PC pode enviar o tráfego local pelo caminho mais longo, ou bloqueá-lo.",
      },
      {
        title: "Verifique o Modo de compatibilidade",
        body: "Se o Modo de compatibilidade estiver ativado nas definições do Mirlow e não precisar dele, desative-o, para que seja a placa gráfica a descodificar. Se a imagem bloquear com ele desativado, ative-o.",
      },
      {
        title: "Dê folga ao PC",
        body: "Num portátil, ligue o carregador e deixe a poupança de bateria desligada. Feche os programas que ocupam o processador ou a placa gráfica.",
      },
    ],
    sections: [
      {
        title: "Um pequeno atraso é normal",
        body: [
          "O telemóvel tem de capturar, comprimir e enviar cada imagem, e o PC tem de a descodificar e mostrar. Numa boa rede o atraso é suficientemente pequeno para navegar, ver fotografias e vídeo e fazer apresentações. Os jogos que dependem de reações muito rápidas jogam-se melhor a olhar para o telemóvel.",
        ],
      },
      {
        title: "Quadrados e arrastamento são dados perdidos",
        body: [
          "Quando a imagem se desfaz em quadrados por um instante e depois recupera, parte do vídeo não chegou a tempo. Isso aponta para o sinal de Wi-Fi e não para o PC, por isso os dois primeiros passos são os que deve experimentar.",
        ],
      },
    ],
    faq: [
      {
        q: "Uma internet mais rápida ajuda?",
        a: "Não. A projeção nunca sai da rede de casa, por isso a velocidade da internet não conta. O que conta é o Wi-Fi entre o telemóvel, o router e o PC.",
      },
      {
        q: "Uma rede mesh ou um repetidor de Wi-Fi atrapalham?",
        a: "Podem atrapalhar, quando o telemóvel e o PC estão ligados a unidades diferentes e a ligação entre elas é fraca. Experimente com os dois dispositivos perto do router principal.",
      },
      {
        q: "O som e a imagem estão dessincronizados. O que faço?",
        a: "Pare a projeção e volte a iniciá-la, para que se alinhem de novo. Se continuarem a afastar-se, a rede está a perder dados, por isso siga os passos acima.",
      },
      {
        q: "A qualidade da imagem depende do meu monitor?",
        a: "O Mirlow pede ao iPhone uma imagem à medida do seu ecrã, e o iPhone decide o que envia. Uma imagem mais nítida também exige mais da rede, o que é mais uma razão para preferir o cabo no PC.",
      },
    ],
  },

  "no-wifi": {
    title: "Espelhar o iPhone no PC sem Wi-Fi, ou com cabo USB",
    short: "Espelhar sem Wi-Fi ou por USB",
    metaTitle: "Espelhar o iPhone no PC sem Wi-Fi ou por USB: o que é possível",
    description:
      "A projeção do ecrã precisa de uma rede local, não de internet. O que funciona sem Wi-Fi ou sem ligação à internet, e porque é que o cabo USB e o Bluetooth não servem.",
    lead: "A projeção do ecrã precisa de que o iPhone e o PC estejam na mesma rede local. Não precisa de internet. Essa diferença responde à maior parte das dúvidas sobre espelhar sem Wi-Fi e sobre cabos.",
    sections: [
      {
        title: "Sem internet: sim",
        body: [
          "A imagem vai diretamente do telemóvel para o PC através do router e nunca passa pela internet. Um router sem qualquer ligação à internet, como um antigo que tenha numa gaveta ou um pequeno router de viagem, é suficiente. Ligue os dois dispositivos a ele e projete como de costume.",
        ],
      },
      {
        title: "Sem Wi-Fi no PC: sim",
        body: [
          "O PC não precisa de Wi-Fi. Ligado ao router por cabo Ethernet, está na mesma rede que o Wi-Fi do telemóvel, e a projeção costuma até ficar mais fluida.",
        ],
      },
      {
        title: "Sem rede nenhuma: não",
        body: [
          "O iPhone encontra os recetores procurando na rede a que está ligado. Sem uma rede entre os dois dispositivos, o PC não pode aparecer na lista da Projeção do ecrã.",
          "Há quem ligue o PC ao Hotspot pessoal do iPhone para criar uma rede só dos dois. Se o telemóvel mostra então o PC na lista depende do telemóvel e da versão do iOS; não garantimos que funcione, e um router é a escolha fiável.",
        ],
      },
      {
        title: "Com cabo USB: não com o Mirlow",
        body: [
          "O Mirlow recebe o ecrã sem fios, como uma Apple TV, e não projeta por USB. Ligar o iPhone ao PC dá ao Windows acesso às fotografias e carrega o telemóvel, nada mais.",
        ],
      },
      {
        title: "Com Bluetooth: não",
        body: [
          "O Bluetooth é demasiado lento para vídeo em direto. A projeção do ecrã não o usa para transportar a imagem.",
        ],
      },
    ],
    faq: [
      {
        q: "A projeção do ecrã gasta dados móveis?",
        a: "Não. Projetar para um PC na mesma rede fica nessa rede. As aplicações que usar enquanto projeta gastam os dados que normalmente gastariam.",
      },
      {
        q: "Posso projetar num hotel ou num Wi-Fi público?",
        a: "Muitas vezes não. As redes de hotéis e as públicas costumam impedir que os dispositivos se vejam. Um pequeno router de viagem seu contorna isso.",
      },
      {
        q: "O telemóvel e o PC têm de estar no Wi-Fi com o mesmo nome?",
        a: "Têm de estar na mesma rede, o que normalmente quer dizer o mesmo router. Os nomes de 2,4 GHz e 5 GHz desse router são a mesma rede; a rede de convidados não é.",
      },
      {
        q: "Há alguma forma com fios de mostrar o iPhone num ecrã?",
        a: "A Apple vende adaptadores que ligam o iPhone a um monitor ou televisor por HDMI. Isso liga à entrada HDMI de um ecrã, não ao Windows.",
      },
    ],
  },

  safe: {
    title: "Espelhar o ecrã é seguro?",
    short: "Espelhar o ecrã é seguro?",
    metaTitle: "Espelhar o ecrã do iPhone no PC é seguro e privado?",
    description:
      "O que a projeção do ecrã partilha e o que não partilha, quem se pode ligar ao seu PC, e cinco hábitos para espelhar o iPhone num PC com Windows em privado.",
    lead: "Projetar mostra o seu ecrã. Não entrega o seu telemóvel. Saber exatamente o que é partilhado, e com quem, permite usá-lo sem surpresas.",
    sections: [
      {
        title: "O que o PC recebe",
        body: [
          "A imagem que está no ecrã do iPhone e o som, e mais nada. O PC não tem acesso às suas fotografias, mensagens, palavras-passe ou ficheiros, e não consegue controlar o telemóvel. Quando pára a projeção, deixa de receber o que quer que seja.",
          "Mas tudo o que está no ecrã é mostrado, incluindo as notificações que aparecem e o que escrever à vista. Ative um modo de Concentração, como Não incomodar, antes de projetar à frente de outras pessoas.",
        ],
      },
      {
        title: "Por onde passa a imagem",
        body: [
          "Do telemóvel para o PC pela sua rede local. Não passa pela internet nem por nenhum servidor. O Mirlow não tem servidores, conta nem estatísticas, e não grava nem guarda o que mostra.",
        ],
      },
      {
        title: "Quem se pode ligar ao seu PC",
        body: [
          "Enquanto o Mirlow está aberto, o seu PC aparece como recetor para os dispositivos da mesma rede, e alguém nessa rede pode enviar o seu ecrã para ele. Estaria a mostrar-lhe o ecrã dele; não ficaria com acesso ao seu PC.",
          "Numa rede doméstica, isso são as pessoas com quem vive. Numa rede partilhada ou pública, saia do Mirlow pelo ícone na área de notificação quando não o estiver a usar.",
        ],
      },
      {
        title: "Cinco bons hábitos",
        body: [
          "Projete em redes em que confia. Ative primeiro o Não incomodar. Pare a projeção antes de abrir a aplicação do banco ou as palavras-passe. Saia do Mirlow quando terminar numa rede partilhada. Transfira o Mirlow apenas do seu site ou da página no GitHub, e compare o código de verificação se tiver dúvidas.",
        ],
      },
    ],
    faq: [
      {
        q: "Alguém pode ver o ecrã do meu iPhone sem eu saber?",
        a: "A projeção só começa quando escolhe um recetor na Central de controlo do seu próprio telemóvel, e o iOS mostra um indicador no topo do ecrã enquanto durar.",
      },
      {
        q: "O próprio Mirlow é seguro de instalar?",
        a: "O código-fonte é público, a aplicação não faz ligações à internet, e o código de verificação de cada instalador é publicado para poder confirmar que o ficheiro é o genuíno. O instalador ainda não tem assinatura digital, por isso o Windows pode mostrar um aviso ao abri-lo.",
      },
      {
        q: "Porque é que o Mirlow precisa de uma permissão na firewall?",
        a: "Para que o iPhone consiga encontrar o PC e chegar até ele na rede local. A permissão abrange apenas o recetor.",
      },
      {
        q: "O Mirlow recolhe algum dado?",
        a: "Não. Não há para onde os enviar: sem conta, sem telemetria, sem publicidade.",
      },
    ],
  },
};
