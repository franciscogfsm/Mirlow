import type { Dictionary } from "./en";

/** European Portuguese (pt-PT). */
export const pt: Dictionary = {
  brand: {
    name: "Mirlow",
    tagline: "O seu iPhone. No seu PC. Sem mais nada.",
  },

  app: {
    status: {
      starting: "A preparar…",
      ready: "Pronto",
      connecting: "A ligar…",
      mirroring: "A projetar",
      audio: "A reproduzir som",
      recovering: "A restabelecer a ligação…",
      error: "Há algo que precisa de atenção",
    },
    waiting: {
      headline: "Pronto para projetar",
      nameLabel: "Este PC aparece como",
      step1: "Abra a Central de controlo no iPhone",
      step2: "Toque em Projeção do ecrã",
      step3: "Escolha {name}",
      hint: "O iPhone e este PC têm de estar na mesma rede Wi‑Fi.",
    },
    starting: {
      headline: "A preparar",
      body: "A iniciar o recetor. É só um instante.",
    },
    connecting: {
      headline: "A ligar a {device}",
      headlineUnknown: "A ligar",
      body: "O seu ecrã aparece dentro de momentos.",
    },
    mirroring: {
      from: "A projetar {device}",
      fromUnknown: "A projetar",
      fullscreen: "Ecrã inteiro",
      exitFullscreen: "Sair do ecrã inteiro",
      disconnect: "Desligar",
    },
    audio: {
      headline: "A reproduzir o som de {device}",
      headlineUnknown: "A reproduzir som",
      body: "Para mostrar o ecrã, toque em Projeção do ecrã no iPhone.",
    },
    recovering: {
      headline: "Um momento",
      body: "O recetor parou inesperadamente. O Mirlow está a reiniciá‑lo.",
    },
    ended: "A projeção terminou",
    error: {
      headline: "O Mirlow não conseguiu iniciar o recetor",
      engineMissing: "Falta uma parte do Mirlow. Reinstalar o Mirlow resolve o problema.",
      discovery:
        "O Mirlow não conseguiu anunciar este PC na rede. Confirme que está ligado por Wi‑Fi ou Ethernet.",
      crashed:
        "O recetor está sempre a parar. Experimentar o modo de compatibilidade nas Definições costuma ajudar.",
      unknown: "Aconteceu algo inesperado.",
      retry: "Tentar novamente",
      details: "Mostrar detalhes",
      hideDetails: "Ocultar detalhes",
      copy: "Copiar detalhes",
      copied: "Copiado",
    },
    help: {
      toggle: "Não vê este PC no iPhone?",
      title: "Se este PC não aparecer",
      sameNetwork: {
        title: "Use a mesma rede Wi‑Fi",
        body: "O iPhone e este PC têm de estar na mesma rede. As redes de convidados costumam manter os dispositivos separados.",
      },
      firewall: {
        title: "Permitir o Mirlow na firewall",
        body: "O Windows pode estar a impedir que o iPhone encontre este PC.",
        action: "Permitir o Mirlow",
        done: "O Mirlow está permitido",
        working: "A aguardar o Windows…",
        failed: "O Windows não aplicou a alteração. Pode tentar novamente.",
      },
      publicNetwork: {
        title: "Esta rede está definida como Pública",
        body: "O Windows esconde o PC nas redes públicas. Se estiver em casa, mude esta rede para Privada nas definições do Windows.",
        action: "Abrir definições de rede",
      },
      noNetwork: {
        title: "Este PC não está ligado",
        body: "Ligue‑se por Wi‑Fi ou Ethernet e tente novamente.",
      },
      vpn: {
        title: "Desligue qualquer VPN",
        body: "Uma VPN no iPhone ou no PC pode impedir que se vejam um ao outro.",
      },
      restart: {
        title: "Continua sem aparecer?",
        body: "Reinicie o recetor e volte a procurar no iPhone.",
        action: "Reiniciar o recetor",
      },
      network: "Rede: {name}",
    },
    settings: {
      title: "Definições",
      open: "Definições",
      close: "Fechar",
      name: {
        label: "Nome",
        description: "Como este PC aparece no iPhone.",
        placeholder: "Mirlow",
        save: "Guardar",
      },
      sound: {
        label: "Reproduzir som",
        description: "Ouça o áudio do iPhone neste PC.",
      },
      compatibility: {
        label: "Modo de compatibilidade",
        description:
          "Ative se a imagem ficar preta ou bloquear. Consome um pouco mais de energia.",
      },
      theme: {
        label: "Aspeto",
        system: "Automático",
        light: "Claro",
        dark: "Escuro",
      },
      language: {
        label: "Idioma",
        system: "Automático",
      },
      about: {
        version: "Versão {version}",
        licenses: "Licenças de código aberto",
        source: "Código‑fonte",
        website: "Website",
        free: "Gratuito e de código aberto. O seu ecrã nunca sai da sua rede.",
        disclaimer:
          "O Mirlow é um projeto independente, sem qualquer afiliação ou aprovação da Apple Inc.",
      },
    },
    shortcuts: {
      fullscreen: "Ecrã inteiro",
      settings: "Definições",
    },
    tray: {
      open: "Abrir o Mirlow",
      quit: "Sair do Mirlow",
      ready: "Pronto como {name}",
    },
    window: {
      minimize: "Minimizar",
      maximize: "Maximizar",
      restore: "Restaurar",
      close: "Fechar",
    },
  },

  site: {
    meta: {
      title: "Mirlow — Projete o iPhone no Windows. Grátis.",
      description:
        "O Mirlow transforma o seu PC com Windows num ecrã sem fios para o iPhone ou iPad. Sem aplicação no telemóvel, sem conta, sem cabos. Gratuito e de código aberto.",
      ogAlt: "O ecrã de um iPhone a aparecer num PC com Windows através do Mirlow",
    },
    nav: {
      how: "Como funciona",
      features: "Funcionalidades",
      faq: "Perguntas",
      download: "Transferir",
      github: "GitHub",
      language: "Idioma",
      skip: "Saltar para o conteúdo",
    },
    hero: {
      eyebrow: "Grátis · Windows · Código aberto",
      titleLine1: "Projete o iPhone",
      titleLine2: "no Windows.",
      titleAccent: "Grátis.",
      body: "Abra o Mirlow, toque em Projeção do ecrã no iPhone e o seu ecrã aparece no PC. Não precisa de instalar nada no telemóvel.",
      cta: "Transferir para Windows — Grátis",
      ctaShort: "Transferir — Grátis",
      note: "Windows 10 e 11 · Sem conta · Sem registo",
      sceneLabel:
        "Animação: um iPhone envia o seu ecrã, sem fios, para um PC com Windows, onde aparece na janela do Mirlow.",
      sceneReady: "Pronto para projetar",
      sceneMirroring: "A projetar",
      sceneSheet: "Projeção do ecrã",
    },
    how: {
      eyebrow: "Como funciona",
      title: "Três toques. Só isso.",
      steps: [
        {
          title: "Abra o Mirlow",
          body: "O PC fica visível assim que a aplicação abre. Não há nada para configurar.",
        },
        {
          title: "Toque em Projeção do ecrã",
          body: "Deslize para abrir a Central de controlo no iPhone ou iPad e escolha o seu PC na lista.",
        },
        {
          title: "Veja no PC",
          body: "O ecrã aparece com som e acompanha quando roda o telemóvel.",
        },
      ],
    },
    showcase: {
      eyebrow: "A aplicação",
      title: "Tão simples que quase não tem ecrãs.",
      body: "Uma janela. Espera, projeta e sai da frente.",
      tabs: {
        waiting: "À espera",
        mirroring: "A projetar",
        settings: "Definições",
      },
      captions: {
        waiting: "O Mirlow diz‑lhe o que fazer numa frase.",
        mirroring:
          "O seu ecrã ocupa a janela toda. Os controlos desaparecem até precisar deles.",
        settings: "Um nome, o som e o aspeto. A lista é só esta.",
      },
    },
    features: {
      eyebrow: "O que recebe",
      title: "Tudo o que precisa. Nada do que não precisa.",
      items: [
        {
          title: "Projeção sem fios",
          body: "Usa a Projeção do ecrã que já vem no iPhone e no iPad. Sem aplicação, sem cabo.",
        },
        {
          title: "Com som",
          body: "Ouça o áudio do telemóvel nas colunas do PC, em sintonia com a imagem.",
        },
        {
          title: "Ecrã inteiro",
          body: "Uma tecla leva o telemóvel de ponta a ponta. Funciona na vertical e na horizontal.",
        },
        {
          title: "Privado de raiz",
          body: "Tudo fica na sua rede. Sem servidores, sem conta, sem rastreio.",
        },
        {
          title: "Grátis a sério",
          body: "Sem período experimental, sem marca de água, sem subscrição. O código está aberto a quem o quiser ler.",
        },
      ],
    },
    faq: {
      eyebrow: "Perguntas",
      title: "Convém saber",
      items: [
        {
          q: "De que preciso?",
          a: "De um PC com Windows 10 ou 11 (64 bits) e de um iPhone ou iPad. Os dois têm de estar na mesma rede, por Wi‑Fi ou por cabo.",
        },
        {
          q: "Tenho de instalar alguma coisa no iPhone?",
          a: "Não. O Mirlow funciona com o botão Projeção do ecrã que já existe na Central de controlo.",
        },
        {
          q: "É mesmo grátis?",
          a: "Sim. Não há versão paga, nem conta, nem anúncios. O Mirlow é de código aberto, com licença GPL‑3.0.",
        },
        {
          q: "O PC não aparece no iPhone. E agora?",
          a: "Confirme que os dois dispositivos estão na mesma rede e use a ligação «Não vê este PC?» dentro do Mirlow. A aplicação pode pedir ao Windows para a permitir na firewall, que é a causa mais habitual.",
        },
        {
          q: "Dá para ver filmes das aplicações de streaming?",
          a: "O Mirlow projeta o seu ecrã. As aplicações que protegem o vídeo, como a maioria dos serviços de filmes e séries, mostram uma imagem preta quando projetadas. Essa decisão é dessas aplicações, não do Mirlow.",
        },
        {
          q: "O meu ecrã passa pela internet?",
          a: "Não. O iPhone envia o ecrã diretamente para o PC através da sua rede local. O Mirlow não tem servidores e não recolhe nada.",
        },
        {
          q: "Funciona com um Mac? E em Mac ou Linux?",
          a: "Um Mac pode projetar para o Mirlow tal como um iPhone. A aplicação Mirlow em si existe apenas para Windows.",
        },
        {
          q: "O Mirlow é da Apple?",
          a: "Não. O Mirlow é um projeto independente de código aberto, construído sobre o UxPlay. Não tem afiliação, aprovação nem certificação da Apple.",
        },
      ],
    },
    finalCta: {
      title: "O seu iPhone. No seu PC.",
      accent: "Sem mais nada.",
      body: "Gratuito, privado e pronto em menos de um minuto.",
      cta: "Transferir para Windows — Grátis",
      note: "Windows 10 e 11 · 64 bits",
    },
    footer: {
      privacy: "Privacidade",
      licenses: "Licenças",
      source: "Código‑fonte",
      releases: "Todas as transferências",
      rights: "Software livre, distribuído sob a licença GPL‑3.0.",
      disclaimer:
        "O Mirlow é um projeto independente. Não tem afiliação, aprovação nem certificação da Apple Inc. iPhone, iPad, Mac e AirPlay são marcas comerciais da Apple Inc. Windows é uma marca comercial do grupo de empresas Microsoft.",
    },
    privacy: {
      title: "Privacidade",
      updated: "Última atualização: outubro de 2026",
      intro: "Em resumo: o Mirlow não recolhe nada sobre si.",
      sections: [
        {
          title: "A aplicação",
          body: "O Mirlow recebe o ecrã e o som do iPhone diretamente pela sua rede local e mostra‑os no PC. Nada é gravado, guardado ou enviado para outro sítio. A aplicação não tem contas, análises de utilização nem publicidade, e não precisa de internet para funcionar.",
        },
        {
          title: "O que fica no seu PC",
          body: "O Mirlow guarda as suas definições (o nome do PC, o som, o aspeto e o idioma) e uma chave de emparelhamento que permite aos seus dispositivos reconhecer este PC. Estes ficheiros ficam na sua pasta de utilizador do Windows e são removidos ao desinstalar.",
        },
        {
          title: "Este website",
          body: "Este site é um conjunto de páginas estáticas. Não usa cookies nem scripts de rastreio. Guarda a sua escolha de idioma apenas no seu navegador. As transferências são servidas pelo GitHub, que pode registar os pedidos de acordo com a sua própria política de privacidade.",
        },
        {
          title: "Dúvidas",
          body: "O Mirlow é de código aberto, por isso pode verificar tudo isto por si. Se algo não estiver claro, abra um pedido no GitHub.",
        },
      ],
    },
    licenses: {
      title: "Licenças de código aberto",
      intro:
        "O Mirlow é software livre. Pode usá‑lo, estudá‑lo, partilhá‑lo e alterá‑lo nos termos da GNU General Public License, versão 3 ou posterior.",
      sections: [
        {
          title: "Mirlow",
          body: "Copyright © os contribuidores do Mirlow. Licenciado sob GPL‑3.0‑or‑later. É disponibilizado sem qualquer garantia, na medida permitida por lei.",
        },
        {
          title: "UxPlay",
          body: "A projeção é assegurada pelo UxPlay, um recetor AirPlay de código aberto com licença GPL‑3.0. O Mirlow inclui uma versão ligeiramente modificada; as alterações exatas estão publicadas como ficheiros de patch no repositório do Mirlow.",
        },
        {
          title: "Bibliotecas incluídas",
          body: "O instalador inclui o GStreamer, o FFmpeg, o OpenSSL, a libplist, a GLib e as respetivas dependências, sem modificações, tal como empacotadas pelo projeto MSYS2. A lista completa, com versões e licenças, é instalada com a aplicação e publicada com cada versão.",
        },
        {
          title: "Obter o código‑fonte",
          body: "O código‑fonte completo do Mirlow, a revisão do UxPlay utilizada, os patches e os scripts de compilação estão no repositório do Mirlow. O código‑fonte de todas as bibliotecas incluídas está disponível no projeto MSYS2, e fornecemo‑lo a pedido para qualquer versão que tenhamos distribuído.",
        },
      ],
      viewSource: "Ver o código‑fonte no GitHub",
      back: "Voltar ao início",
    },
    notFound: {
      title: "Esta página não existe",
      back: "Voltar ao início",
    },
  },
};
