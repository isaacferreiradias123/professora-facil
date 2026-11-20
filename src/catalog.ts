export const groups = [
  'Bebês · zero a 1 ano e 6 meses',
  'Crianças bem pequenas · 1 ano e 7 meses a 3 anos e 11 meses',
  'Crianças pequenas · 4 anos a 5 anos e 11 meses',
  'Ensino Fundamental I · 1º ao 5º ano',
] as const

export const fields = [
  'O eu, o outro e o nós',
  'Corpo, gestos e movimentos',
  'Traços, sons, cores e formas',
  'Escuta, fala, pensamento e imaginação',
  'Espaços, tempos, quantidades, relações e transformações',
] as const

export const rights = [
  'Conviver',
  'Brincar',
  'Participar',
  'Explorar',
  'Expressar',
  'Conhecer-se',
] as const

export const bncc =
  'https://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf'

export const tools = {
  atividade: {
    name: 'Atividades e tarefas',
    shortName: 'Atividades',
    description:
      'Tarefas com questões e linhas, provas, traçado motor, contagem, pareamento e roteiros.',
    outputs: ['PDF A4', 'Word'],
    image: 'editorial-atividade.webp',
  },
  'plano-de-aula': {
    name: 'Planos de aula',
    shortName: 'Planos',
    description:
      'Planejamentos diários, grade semanal, sequências didáticas e campos da BNCC.',
    outputs: ['PDF A4', 'Word'],
    image: 'editorial-plano.webp',
  },
  relatorio: {
    name: 'Relatórios e registros',
    shortName: 'Relatórios',
    description:
      'Registros individuais, diário de bordo, adaptação e sínteses para famílias.',
    outputs: ['PDF A4', 'Word'],
    image: 'editorial-relatorio.webp',
  },
  documento: {
    name: 'Documentos e recados',
    shortName: 'Documentos',
    description:
      'Bilhetes em 1, 2 ou 4 vias, atas, listas e edição de arquivos Word ou PDF.',
    outputs: ['PDF A4', 'Word', 'Responder PDF'],
    image: 'editorial-documento.webp',
  },
  'fotos-em-pdf': {
    name: 'Fotos em PDF',
    shortName: 'Fotos em PDF',
    description:
      'Monte álbuns com até 24 fotos, estilo Polaroid, legendas e impressão A4.',
    outputs: ['PDF A4', 'Impressão'],
    image: 'editorial-fotos.webp',
  },
  postagem: {
    name: 'Postagens e avisos',
    shortName: 'Postagens',
    description:
      'Artes ilustradas para WhatsApp e redes com foto opcional e legenda pronta.',
    outputs: ['PNG', 'Legenda'],
    image: 'editorial-postagem.webp',
  },
  painel: {
    name: 'Painéis e kits A4',
    shortName: 'Painéis',
    description:
      'Murais em mosaico A4, placas para recortar e fatiador de imagem grande.',
    outputs: ['PDF A4', 'Guia'],
    image: 'editorial-painel.webp',
  },
} as const

export type Tool = keyof typeof tools

export const tutorials: Record<Tool, readonly string[]> = {
  atividade: [
    'Escolha uma folha pronta ou abra o Criador de Tarefas e Provas com questões numeradas.',
    'Edite o cabeçalho escolar, todas as figuras, pistas ou alternativas e o estilo de impressão.',
    'Confira a folha A4 na hora e baixe em PDF ou Word editável.',
  ],
  'plano-de-aula': [
    'Escolha entre plano diário, planejamento semanal, sequência ou vivência de creche.',
    'Marque os Campos de Experiências e Direitos da BNCC e organize os momentos com duração.',
    'Confira as folhas e baixe em PDF ou Word editável.',
  ],
  relatorio: [
    'Selecione a estrutura ideal para o momento (BNCC, Diário de bordo, Coletivo ou Famílias).',
    'Use as ideias do que observar como ponto de partida e personalize com exemplos reais da turma.',
    'Baixe o registro em PDF ou Word com espaço de assinatura.',
  ],
  documento: [
    'Escolha um recado (1, 2 ou 4 vias na mesma folha), um documento escolar ou abra seu Word ou PDF.',
    'Personalize os campos, a arte do bilhete e o canhoto destacável.',
    'Baixe o novo arquivo pronto para imprimir ou enviar.',
  ],
  'fotos-em-pdf': [
    'Arraste até 24 fotos JPG, PNG ou WebP e reordene ou gire cada imagem.',
    'Escolha entre 5 diagramações (incluindo estilo Polaroid com legenda) e veja a prévia A4.',
    'Baixe o álbum em PDF ou imprima diretamente.',
  ],
  postagem: [
    'Escolha um modelo ou comece do zero com 6 composições e 6 paletas com leitura nítida.',
    'Adicione título, texto, foto opcional ou uma ilustração da galeria.',
    'Baixe a imagem PNG em alta resolução e copie a legenda pronta.',
  ],
  painel: [
    'Escolha um mural em mosaico A4, placas ilustradas para recortar ou envie sua própria imagem.',
    'Personalize títulos e textos dos cartões na prévia montada.',
    'Imprima em escala de 100% usando o guia com sobreposição de 5 mm.',
  ],
}

export const observationHints = {
  Berçário: [
    'Buscou contato visual ou virou o rosto em direção aos sons suaves da roda.',
    'Explorou diferentes texturas com as mãos e os pés, demonstrando preferência por materiais macios.',
    'Respondeu com sorrisos, balbucios ou gestos durante cantigas e momentos de vínculo.',
    'Deslocou-se pelo tapete para alcançar objetos próximos com apoio seguro.',
    'Sinalizou quando quis repetir a brincadeira ou fazer uma pausa tranquila.',
  ],
  Maternal: [
    'Participou da roda imitando sons e gestos propostos com entusiasmo.',
    'Escolheu materiais e objetos conhecidos, associando-os a ações da rotina.',
    'Experimentou encaixar, empilhar e derrubar blocos em pequenos grupos.',
    'Comunicou suas preferências por meio de falas curtas, apontar ou expressões.',
    'Acompanhou o percurso motor alternando ritmo, equilíbrio e pausas.',
  ],
  'Pré I': [
    'Observou detalhes das ilustrações e formulou hipóteses sobre a história.',
    'Classificou objetos e figuras explicando com suas palavras o critério escolhido.',
    'Realizou contagem um a um apontando cada elemento antes de registrar.',
    'Experimentou traços variados com diferentes pressões e direções no papel.',
    'Escutou ideias dos colegas e compartilhou materiais durante a proposta.',
  ],
  'Pré II': [
    'Reconheceu a letra inicial do próprio nome e comparou com os cartões da turma.',
    'Ordenou acontecimentos usando noções temporais como antes, depois e no final.',
    'Registrou quantidades e comparou grupos justificando onde havia mais elementos.',
    'Elaborou combinações com os pares e propôs ajustes após testar uma ideia.',
    'Ditou frases para registro coletivo revisando informações importantes.',
  ],
  'Fundamental I': [
    'Leu enunciados curtos com crescente autonomia e pediu esclarecimento quando necessário.',
    'Registrou respostas completas utilizando as linhas e respeitando margens e espaçamento.',
    'Utilizou estratégias pessoais de contagem, cálculo mental ou esquema para resolver problemas.',
    'Revisou a própria produção corrigindo pontuação, segmentação e informações principais.',
    'Participou das trocas em grupo ouvindo colegas e argumentando com exemplos.',
  ],
} as const
