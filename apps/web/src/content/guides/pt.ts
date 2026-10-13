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
};
