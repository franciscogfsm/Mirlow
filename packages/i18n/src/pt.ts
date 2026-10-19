import type { Dictionary } from "./en";

/** European Portuguese (pt-PT). */
export const pt: Dictionary = {
  brand: {
    name: "Mirlow",
    tagline: "O seu telemóvel. No seu PC. Sem mais nada.",
  },

  app: {
    status: {
      starting: "A preparar…",
      ready: "Pronto",
      connecting: "A ligar…",
      mirroring: "A projetar",
      paused: "Em pausa",
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
      hint: "O iPhone tem de estar na mesma rede Wi‑Fi deste PC.",
      iphone: "iPhone",
      android: "Android",
      androidStep1: "Deslize duas vezes a partir do topo do ecrã",
      androidStep2: "Toque em Smart View, Transmitir ou Ecrã sem fios",
      androidHint: "Não é preciso estar na mesma rede: o telemóvel liga‑se diretamente a este PC. Os Google Pixel não têm esta função.",
    },
    fix: {
      title: "Antes de começar",
      action: "Resolver",
      working: "A resolver…",
      installing: "A instalar o suporte para Android a partir do Windows Update. Pode demorar alguns minutos.",
      declined: "Não foi possível resolver tudo. Tente novamente e escolha Sim se o Windows perguntar.",
      wifi: "Ligar o Wi‑Fi deste PC",
      wirelessDisplay: "Adicionar suporte para Android ao Windows",
      firewall: "Permitir o Mirlow na firewall",
      network: "Definir esta rede como Privada",
      unsupported: "O Wi‑Fi deste PC não consegue receber telemóveis Android. Um adaptador Wi‑Fi USB com Miracast resolve. O iPhone funciona normalmente.",
      disabled: "A projeção para este PC está desligada no Windows.",
      disabledAction: "Abrir definições",
    },
    starting: {
      headline: "A preparar",
      body: "A iniciar o recetor. É só um instante.",
    },
    connecting: {
      headline: "A ligar a {device}",
      headlineUnknown: "A ligar",
      body: "O seu ecrã aparece dentro de momentos.",
      pin: "Escreva {pin} no telemóvel para ligar.",
    },
    mirroring: {
      from: "A projetar {device}",
      fromUnknown: "A projetar",
      fullscreen: "Ecrã inteiro",
      exitFullscreen: "Sair do ecrã inteiro",
      disconnect: "Desligar",
    },
    paused: {
      label: "{device} · em pausa",
      labelSound: "{device} · só som",
      soundOnly: "Só som",
      locked: "Ecrã bloqueado",
      stopped: "Imagem em pausa",
      unlock: "Desbloqueie o {device} para continuar.",
      unlockUnknown: "Desbloqueie o telemóvel para continuar.",
      waiting: "A imagem volta assim que o {device} a enviar de novo.",
      waitingUnknown: "A imagem volta assim que o telemóvel a enviar de novo.",
      sound: "O som continua a tocar",
    },
    control: {
      hint: "{device} · clique para controlar",
      hintUnknown: "Clique na imagem para controlar",
      active: "A controlar {device} · Esc para parar",
      activeUnknown: "A controlar · Esc para parar",
      activeShort: "Esc para parar",
      pair: "{device} · emparelhe por Bluetooth para controlar",
      pairUnknown: "Emparelhe por Bluetooth para controlar",
      release: "devolve-lhe o rato",
    },
    wifi: {
      ready: "Pronto por Wi‑Fi",
      mirror: "Projetar {device}",
      setUp: "Sem atraso, com rato e teclado: configure a projeção por Wi‑Fi",
      hint: "{device} · clique e escreva na imagem",
      hintUnknown: "Clique e escreva na imagem",
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
      toggle: "Não vê este PC no telemóvel?",
      title: "Se este PC não aparecer",
      sameNetwork: {
        title: "Use a mesma rede Wi‑Fi",
        body: "O iPhone e este PC têm de estar na mesma rede. As redes de convidados costumam manter os dispositivos separados.",
      },
      firewall: {
        title: "Permitir o Mirlow na firewall",
        body: "O Windows pode estar a impedir que o telemóvel encontre este PC.",
        action: "Permitir o Mirlow",
        done: "O Mirlow está permitido",
        working: "A aguardar o Windows…",
        failed: "O Windows não aplicou a alteração. Pode tentar novamente.",
      },
      android: {
        ready: "Pronto para Android",
        readyBody: "No telemóvel, abra Smart View, Transmitir ou Ecrã sem fios e escolha este PC.",
        needsFeature: {
          title: "Ativar o espelhamento de Android",
          body: "Os telemóveis Android precisam da funcionalidade Ecrã sem fios do Windows, que não está instalada. O Windows vai pedir permissão e transferi‑la, o que pode demorar alguns minutos.",
          action: "Instalar Ecrã sem fios",
          working: "A instalar… pode demorar alguns minutos",
          failed: "O Windows não a instalou. Abra Funcionalidades opcionais, escolha Adicionar uma funcionalidade e adicione Ecrã sem fios.",
          settings: "Abrir Funcionalidades opcionais",
        },
        wifiOff: {
          title: "Ligue o Wi‑Fi deste PC",
          body: "O Wi‑Fi está desligado, por isso nenhum telemóvel encontra este PC. O iPhone precisa da mesma rede; os Android ligam‑se diretamente por Wi‑Fi, mesmo que o PC use Ethernet.",
        },
        unsupported: {
          title: "Este PC não consegue receber Android",
          body: "O adaptador Wi‑Fi não suporta Miracast, que é o que os telemóveis Android usam. O iPhone continua a funcionar.",
        },
        disabled: {
          title: "A projeção para este PC está desligada",
          body: "O Windows está definido para não aceitar ecrãs de outros dispositivos. Ative‑a em Projetar para este PC.",
          action: "Abrir definições de projeção",
        },
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
        body: "Uma VPN no telemóvel ou no PC pode impedir que se vejam um ao outro.",
      },
      restart: {
        title: "Continua sem aparecer?",
        body: "Reinicie o recetor e volte a procurar no telemóvel.",
        action: "Reiniciar o recetor",
      },
      network: "Rede: {name}",
      copyDetails: "Copiar detalhes para suporte",
      copied: "Copiado. Cole numa mensagem.",
    },
    settings: {
      title: "Definições",
      open: "Definições",
      close: "Fechar",
      name: {
        label: "Nome",
        description: "Como este PC aparece no telemóvel.",
        placeholder: "Mirlow",
        save: "Guardar",
      },
      sound: {
        label: "Reproduzir som",
        description: "Ouça o áudio do telemóvel neste PC.",
      },
      compatibility: {
        label: "Modo de compatibilidade",
        description:
          "Ative se a imagem ficar preta ou bloquear. Consome um pouco mais de energia.",
      },
      control: {
        label: "Rato e teclado",
        description:
          "Use o telemóvel a partir deste PC. Liga-se por Bluetooth, como um teclado sem fios. A imagem é mostrada em direto para o menor atraso possível, por isso os vídeos podem ficar com o som ligeiramente dessincronizado.",
        checking: "A verificar o Bluetooth deste PC…",
        supported: "Funciona neste PC.",
        starting: "A iniciar o Bluetooth…",
        waitingTitle: "À espera do telemóvel",
        connectedTitle: "Ligado a {device}",
        connectedTitleUnknown: "Telemóvel ligado",
        steps: {
          pair: "No telemóvel, abra Definições › Bluetooth e toque em “{pc}”.",
          pairUnknown: "No telemóvel, abra Definições › Bluetooth e toque neste PC.",
          confirm:
            "O Windows mostra então uma notificação de emparelhamento com um código, normalmente no fundo do ecrã. Clique nela e aceite. Só da primeira vez.",
          pointer: "Ative o AssistiveTouch, senão não vê o cursor. No iPhone, toque em:",
          pointerPath: ["Definições", "Acessibilidade", "Toque", "AssistiveTouch", "Ativar"],
          pointerSiri: "Mais rápido: mantenha o botão lateral premido e diga “Ativa o AssistiveTouch”.",
          use: "Durante a projeção, clique na imagem para controlar o telemóvel. Mantenha Ctrl premido e role para fazer zoom nas apps que o permitem, como o Safari. Prima Esc para recuperar o rato.",
        },
        stuck: "Ligado mas nada acontece? No telemóvel, toque em ⓘ ao lado deste PC, escolha Esquecer este dispositivo e emparelhe de novo.",
        phone: "Telemóvel",
        iphone: "iPhone",
        android: {
          name: "Android",
          pair: "No telemóvel, abra Definições › Bluetooth (nalguns telemóveis, Dispositivos ligados › Emparelhar novo dispositivo) e toque em “{pc}”.",
          pairUnknown:
            "No telemóvel, abra Definições › Bluetooth (nalguns telemóveis, Dispositivos ligados › Emparelhar novo dispositivo) e toque neste PC.",
          confirm:
            "Toque em Emparelhar no telemóvel. O Windows mostra então uma notificação de emparelhamento, normalmente no fundo do ecrã: clique nela e aceite. Só da primeira vez.",
          use: "Durante a projeção, clique na imagem para controlar o telemóvel. O cursor aparece sozinho. O botão direito volta atrás, e Esc devolve-lhe o rato.",
          stuck: "Ligado mas nada acontece? No telemóvel, toque em ⚙ ao lado deste PC, escolha Desemparelhar ou Esquecer, e emparelhe de novo.",
        },
        bluetoothOff: "O Bluetooth está desligado neste PC. Ligue-o nas definições do Windows.",
        noBluetooth: "Este PC não tem Bluetooth.",
        unsupported:
          "O Bluetooth deste PC não consegue funcionar como rato e teclado. A maioria dos adaptadores USB Bluetooth 5 consegue.",
        openBluetooth: "Abrir definições de Bluetooth",
        speed: "Velocidade do cursor",
        slower: "Mais lento",
        faster: "Mais rápido",
        speedHint: "No meio, o cursor do telemóvel acompanha o cursor do PC.",
      },
      wifi: {
        label: "Android por Wi‑Fi",
        description:
          "Projete um telemóvel Android quase sem atraso, com som, e use-o com o rato e o teclado. Android 11 ou mais recente, Pixel incluído.",
        unavailable: "Esta cópia do Mirlow foi criada sem esta funcionalidade.",
        none: "Nenhum telemóvel ligado. No telemóvel, ative a Depuração sem fios. O telemóvel e este PC têm de estar na mesma rede Wi‑Fi.",
        mirror: "Projetar",
        mirroring: "A projetar",
        setUp: "Configurar um telemóvel",
        setUpAnother: "Configurar outro telemóvel",
        tutorial: {
          step: "Passo {n} de 3",
          next: "Seguinte",
          back: "Voltar",
          skip: "Já fez isto antes? Passe para o código",
          developer: {
            title: "Ative as Opções de programador",
            body: "No telemóvel, abra Definições › Acerca do telemóvel e toque 7 vezes em Número de compilação, até dizer que é programador. Num Samsung, o Número de compilação está em Informações do software.",
          },
          wireless: {
            title: "Ative a Depuração sem fios",
            body: "Volte às Definições e abra as Opções de programador, em Sistema ou mesmo no fim. Ative a Depuração sem fios e toque em Permitir. O telemóvel e este PC têm de estar na mesma rede Wi‑Fi.",
          },
          scan: {
            title: "Leia o código",
            body: "Toque nas palavras Depuração sem fios para a abrir, depois em Sincronizar dispositivo com código QR, e aponte a câmara para este código.",
          },
          phone: {
            aboutPhone: "Acerca do telemóvel",
            deviceName: "Nome do dispositivo",
            model: "Modelo",
            androidVersion: "Versão do Android",
            buildNumber: "Número de compilação",
            developerOptions: "Opções de programador",
            usbDebugging: "Depuração USB",
            wirelessDebugging: "Depuração sem fios",
            stayAwake: "Manter ativo",
            useWireless: "Utilizar depuração sem fios",
            pairQr: "Sincronizar com código QR",
            pairCode: "Sincronizar com código",
          },
        },
        codeLabel:
          "Não consegue ler? Toque em Sincronizar dispositivo com código de sincronização e escreva aqui os seis algarismos.",
        codePlaceholder: "Código",
        pair: "Sincronizar",
        waiting: "À espera de que o telemóvel leia o código…",
        searching: "À procura do telemóvel…",
        pairing: "A sincronizar…",
        paired: "Sincronizado. O telemóvel aparece aqui dentro de momentos.",
        refused: "Não resultou. Verifique o código e tente de novo.",
        notFound: "O telemóvel não apareceu. Confirme que ele e este PC estão na mesma rede Wi‑Fi.",
        retry: "Tentar de novo",
        cancel: "Cancelar",
        tip: "Da próxima vez, ative a Depuração sem fios e clique em Projetar. Mais rápido ainda: adicione o mosaico às Definições rápidas, em Opções de programador › Mosaicos de programador para definições rápidas.",
        shortcuts: "Na imagem, o botão direito volta atrás e o botão do meio vai para o ecrã principal.",
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
        free: "Gratuito e de código aberto. O seu ecrã vai diretamente para este PC e para mais lado nenhum.",
        disclaimer:
          "O Mirlow é um projeto independente, sem qualquer afiliação ou aprovação da Apple Inc. nem da Google LLC.",
      },
    },
    shortcuts: {
      fullscreen: "Ecrã inteiro",
      settings: "Definições",
    },
    update: {
      available: "Já saiu o Mirlow {version}",
      required: "A atualizar para a versão mais recente. O Mirlow volta a abrir sozinho daqui a pouco.",
      downloading: "A atualizar… {percent}%",
      installing: "A instalar…",
      failed: "A atualização não terminou",
      retry: "Tentar novamente",
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
      title: "Espelhar o iPhone ou o Android no PC com Windows, grátis | Mirlow",
      description:
        "Projeção do ecrã gratuita para Windows 10 e 11. Espelhe o iPhone, o iPad ou um telemóvel Android no PC por Wi‑Fi: recetor AirPlay e Miracast num só. Sem aplicação no telemóvel, sem conta, sem cabos.",
      ogAlt: "O ecrã de um telemóvel a aparecer num PC com Windows através do Mirlow",
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
      eyebrow: "Grátis · iPhone e Android · Código aberto",
      titleLine1: "Qualquer telemóvel",
      titleLine2: "no Windows.",
      titleAccent: "Grátis.",
      badge: "Recetor AirPlay para Windows",
      body: "Toque em Projeção do ecrã no iPhone, ou em Smart View no Android, e o ecrã aparece no PC.",
      cta: "Transferir para Windows — Grátis",
      ctaShort: "Transferir — Grátis",
      promises: ["100% grátis", "Sem app no telemóvel", "Sem cabos", "Sem conta"],
      worksWith: "Funciona com",
      devices: ["iPhone", "iPad", "Mac", "Android"],
      requires: "Windows 10 e 11 · Download de 12 MB",
      sceneLabel:
        "Animação: um telemóvel envia o seu ecrã, sem fios, para um PC com Windows, onde aparece na janela do Mirlow.",
      sceneReady: "Pronto para projetar",
      sceneMirroring: "A projetar",
      sceneSheet: "Projeção do ecrã",
      pause: "Pausar a animação",
      play: "Reproduzir a animação",
      scroll: "Deslize",
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
          body: "No iPhone ou iPad está na Central de controlo. No Android chama‑se Smart View, Transmitir ou Projeção sem fios. Escolha o seu PC na lista.",
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
          body: "AirPlay no iPhone, iPad e Mac, Miracast no Android: a projeção do ecrã que o telemóvel já tem. Sem aplicação, sem cabo.",
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
    trust: {
      eyebrow: "Seguro de instalar",
      title: "Não acredite só na nossa palavra.",
      body: "O Mirlow é gratuito por ser aberto, não por estar a vender alguma coisa. Tudo o que se segue pode ser verificado por si, ou por alguém em quem confie.",
      items: [
        {
          title: "Código aberto",
          body: "Todas as linhas do Mirlow são públicas. Qualquer pessoa pode lê‑las, compilá‑las e confirmar que o download corresponde.",
          action: "Como obter o código",
        },
        {
          title: "Analise‑o você mesmo",
          body: "Procure este instalador exato no VirusTotal, onde dezenas de motores antivírus independentes o examinam.",
          action: "Abrir o relatório do VirusTotal",
        },
        {
          title: "Nada sai da sua rede",
          body: "O Mirlow não faz ligações à internet. Sem conta, sem estatísticas, sem atualizações descarregadas às escondidas.",
          action: "Ler a nota de privacidade",
        },
      ],
      checksumLabel: "SHA-256 do Mirlow {version} para Windows",
      checksumHint: "Compare‑o com o ficheiro que descarregou: no PowerShell, execute Get-FileHash sobre o instalador.",
      copy: "Copiar",
      copied: "Copiado",
    },
    faq: {
      eyebrow: "Perguntas",
      title: "Convém saber",
      items: [
        {
          q: "Como funciona sem aplicação no iPhone?",
          a: "O iPhone já traz o AirPlay de origem: é o que o botão Projeção do ecrã, na Central de controlo, usa para enviar o ecrã para uma Apple TV. O Mirlow transforma o PC num recetor AirPlay, por isso o PC aparece nessa mesma lista. Os telemóveis Android funcionam da mesma forma com o Miracast, a norma por trás do Smart View.",
        },
        {
          q: "De que preciso?",
          a: "De um PC com Windows 10 ou 11 (64 bits) e de um iPhone, iPad ou telemóvel Android. O iPhone ou iPad tem de estar na mesma rede do PC, por Wi‑Fi ou por cabo. O telemóvel Android liga‑se diretamente ao PC, por isso o PC precisa de Wi‑Fi.",
        },
        {
          q: "Funciona com Android?",
          a: "Sim, com telemóveis Android que projetam o ecrã por Miracast: Samsung (Smart View), Xiaomi, Huawei, Oppo, OnePlus e muitos outros. Os Google Pixel não têm Miracast, por isso não conseguem ligar‑se. A placa Wi‑Fi do PC também tem de suportar Miracast, o que acontece na maioria dos portáteis dos últimos anos.",
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
          a: "Não. O telemóvel envia o ecrã diretamente para o PC, pela sua rede local ou por uma ligação Wi‑Fi direta. O Mirlow não tem servidores e não recolhe nada.",
        },
        {
          q: "Funciona com um Mac? E em Mac ou Linux?",
          a: "Um Mac pode projetar para o Mirlow tal como um iPhone. A aplicação Mirlow em si existe apenas para Windows.",
        },
        {
          q: "O Mirlow é da Apple ou da Google?",
          a: "Não. O Mirlow é um projeto independente de código aberto, construído sobre o UxPlay. Não tem afiliação, aprovação nem certificação da Apple nem da Google.",
        },
      ],
    },
    finalCta: {
      title: "O seu telemóvel. No seu PC.",
      accent: "Sem mais nada.",
      body: "Gratuito, privado e pronto em menos de um minuto.",
      cta: "Transferir para Windows — Grátis",
      note: "Windows 10 e 11 · 64 bits",
    },
    guides: {
      title: "Guias",
      metaTitle: "Guias: espelhar o iPhone, o iPad ou o Android no PC com Windows | Mirlow",
      intro: "Respostas curtas e práticas sobre como pôr o ecrã de um iPhone, iPad ou Android num PC com Windows.",
      steps: "Passo a passo",
      questions: "Perguntas frequentes",
      more: "Mais guias",
      all: "Todos os guias",
      ctaTitle: "Experimente no seu PC",
      ctaBody: "O Mirlow é gratuito e de código aberto, e não precisa de conta.",
    },
    contact: {
      label: "Fale connosco",
      hint: "Um problema, ou uma ideia para uma nova funcionalidade? Envie-nos um email.",
      subject: "Mirlow",
    },
    footer: {
      guides: "Guias",
      privacy: "Privacidade",
      licenses: "Licenças",
      codeSigning: "Política de assinatura de código",
      source: "Código‑fonte",
      releases: "Todas as transferências",
      rights: "Software livre, distribuído sob a licença GPL‑3.0.",
      disclaimer:
        "O Mirlow é um projeto independente. Não tem afiliação, aprovação nem certificação da Apple Inc. nem da Google LLC. iPhone, iPad, Mac e AirPlay são marcas comerciais da Apple Inc. Android é uma marca comercial da Google LLC. Windows é uma marca comercial do grupo de empresas Microsoft.",
    },
    privacy: {
      title: "Privacidade",
      updated: "Última atualização: outubro de 2026",
      intro: "Em resumo: o Mirlow não recolhe nada sobre si.",
      sections: [
        {
          title: "A aplicação",
          body: "O Mirlow recebe o ecrã e o som do telemóvel diretamente, pela sua rede local ou por uma ligação Wi‑Fi direta, e mostra‑os no PC. Nada é gravado, guardado ou enviado para outro sítio. A aplicação não tem contas, análises de utilização nem publicidade, e não precisa de internet para funcionar.",
        },
        {
          title: "Atualizações",
          body: "Enquanto está aberto, o Mirlow pergunta ao GitHub, onde as versões são publicadas, se existe uma versão mais recente: pouco depois de abrir e depois de poucas em poucas horas. O pedido não diz nada sobre si nem sobre o seu PC além do que qualquer ligação revela, como o seu endereço IP, que o GitHub pode registar de acordo com a sua própria política de privacidade. Quando sai uma versão mais recente, o Mirlow transfere-a e instala-a de imediato, e só se tiver a nossa assinatura.",
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
    codeSigning: {
      title: "Política de assinatura de código",
      intro:
        "Assinatura de código gratuita fornecida pela SignPath.io, com certificado emitido pela SignPath Foundation.",
      sections: [
        {
          title: "O que é assinado",
          body: "O instalador do Mirlow anexado a cada versão no GitHub. A assinatura através da SignPath Foundation está a ser configurada; até lá, os instaladores não são assinados e o Windows mostra o editor como desconhecido. Pode verificar qualquer transferência com as somas SHA‑256 publicadas em cada versão.",
        },
        {
          title: "Funções da equipa",
          body: "Autores e revisores: Francisco Martins (franciscogfsm no GitHub). Aprovadores: Francisco Martins. As alterações de qualquer outra pessoa são revistas antes de serem integradas.",
        },
        {
          title: "Privacidade",
          body: "O Mirlow não transfere informação para outros sistemas em rede, a não ser que o utilizador, ou quem o instala ou opera, o peça expressamente. A única exceção é a verificação de novas versões no GitHub, descrita na política de privacidade.",
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
          body: "O instalador inclui o GStreamer, o OpenSSL, a libplist, a GLib e as respetivas dependências, sem modificações, tal como empacotadas pelo projeto MSYS2, e o FFmpeg, que compilamos a partir do código‑fonte oficial apenas com os descodificadores que o Mirlow usa. A lista completa, com versões e licenças, é instalada com a aplicação e publicada com cada versão.",
        },
        {
          title: "Obter o código‑fonte",
          body: "O código‑fonte completo do Mirlow, a revisão do UxPlay utilizada, os patches e os scripts de compilação estão no repositório do Mirlow. O código‑fonte das bibliotecas incluídas está disponível no projeto MSYS2 e, no caso do FFmpeg, em ffmpeg.org, e fornecemo‑lo a pedido para qualquer versão que tenhamos distribuído.",
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
