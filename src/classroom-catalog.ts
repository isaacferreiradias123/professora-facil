import type { Tool } from './catalog'
import type { Values } from './store'

export const ageBands = ['Berçário', 'Maternal', 'Pré I', 'Pré II'] as const
export type AgeBand = (typeof ageBands)[number]
export const ageGuides: Record<AgeBand, string> = {
  Berçário: 'Bebês · zero a 1 ano e 6 meses',
  Maternal: 'Crianças bem pequenas · 1 ano e 7 meses a 3 anos e 11 meses',
  'Pré I': 'Crianças pequenas · referência de 4 anos',
  'Pré II': 'Crianças pequenas · referência de 5 anos',
}
export const categories = [
  'Atividades',
  'Recados',
  'Painéis',
  'Organização da turma',
] as const
export type Category = (typeof categories)[number]
export const categoryArt: Record<Category, string> = {
  Atividades: 'atividades.webp',
  Recados: 'recados.webp',
  Painéis: 'paineis.webp',
  'Organização da turma': 'organizacao.webp',
}
export type Field = {
  key: string
  label: string
  value?: string
  type?: 'long' | 'date' | 'time'
}
export type Task = {
  mode:
    | 'experience'
    | 'cards'
    | 'match'
    | 'sort'
    | 'story'
    | 'count'
    | 'names'
    | 'table'
    | 'pattern'
  supplies: string
  steps: string[]
  adaptation: string
  prompts?: string[]
  guide?: string
}
export type ClassroomItem = {
  id: string
  title: string
  tool: Tool
  category: Category
  description: string
  age?: AgeBand
  task?: Task
  fields?: Field[]
  body?: string
  poster?: string[]
  style?: 'meadow' | 'night' | 'peach'
  ready?: { file: string; image: string; author: string; source: string }
  visual?: Values
}

const activity = (
  id: string,
  age: AgeBand,
  title: string,
  description: string,
  task: Task,
): ClassroomItem => ({
  id,
  title,
  age,
  description,
  task,
  category: 'Atividades',
  tool: 'atividade',
})

const notice = (
  id: string,
  title: string,
  description: string,
  body: string,
  fields: Field[],
): ClassroomItem => ({
  id,
  title,
  description,
  body,
  fields,
  category: 'Recados',
  tool: 'documento',
})
const date: Field = { key: 'date', label: 'Data', type: 'date' }
const time: Field = { key: 'time', label: 'Horário', type: 'time' }
const place: Field = { key: 'place', label: 'Local' }
const returnDate: Field = {
  key: 'returnDate',
  label: 'Prazo de retorno',
  type: 'date',
}

export const classroom: ClassroomItem[] = [
  activity(
    'tecidos',
    'Berçário',
    'Entre tecidos e texturas',
    'Vivência para observar o toque, o olhar e a escolha.',
    {
      mode: 'experience',
      supplies:
        'Duas peças grandes de tecido lavável, sem fios soltos, e um tapete.',
      steps: [
        'Estenda um tecido liso e outro rugoso em área firme e limpa.',
        'Toque o tecido e espere que o bebê se aproxime ou indique interesse.',
        'Nomeie a sensação com frases curtas e faça pausas para as respostas.',
      ],
      adaptation:
        'Aproxime um tecido de cada vez. Respeite quando a criança preferir observar.',
      guide:
        'Registre qual material a criança procurou e como pediu para repetir.',
    },
  ),
  activity(
    'sons',
    'Berçário',
    'De onde vem o som?',
    'Uma brincadeira breve de escuta e localização.',
    {
      mode: 'experience',
      supplies: 'Voz da professora, papel grande amassado e almofadas.',
      steps: [
        'Sente perto das crianças e produza um som suave com a voz.',
        'Repita do outro lado, com a fonte visível, e espere um olhar ou movimento.',
        'Amasse um papel fora do alcance da boca e convide a escutar a diferença.',
      ],
      adaptation:
        'Mantenha o volume confortável e ofereça pausas. Para quem observa pelo olhar, aproxime a fonte visual.',
    },
  ),
  activity(
    'imagens-familiares',
    'Berçário',
    'Imagens que contam a rotina',
    'Cartões grandes para conversar sobre o que acontece na creche.',
    {
      mode: 'cards',
      supplies: 'Folha de cartões, papel firme e tapete.',
      steps: [
        'Mostre o cartão da bola e procure uma bola no ambiente.',
        'Apresente outro cartão se houver interesse e fale sobre seu uso.',
        'Deixe a criança escolher qual imagem revisitar pelo olhar ou gesto.',
      ],
      adaptation:
        'Use um cartão por vez e retire os cartões quando houver intenção de levá-los à boca.',
      prompts: [
        'Bola · brincar',
        'Livro · ouvir',
        'Copo · beber',
        'Pano · limpar',
      ],
    },
  ),
  activity(
    'esconder',
    'Berçário',
    'Cadê a bola?',
    'Brincadeira de esconder e reencontrar um objeto conhecido.',
    {
      mode: 'experience',
      supplies: 'Uma bola grande e um pano leve.',
      steps: [
        'Apresente a bola, role-a devagar e faça uma pausa.',
        'Cubra apenas parte da bola sobre o tapete. Pergunte onde ela está.',
        'Descubra o objeto junto com o bebê e repita se houver interesse.',
      ],
      adaptation:
        'Nunca cubra o rosto da criança. Deixe uma parte maior visível quando precisar facilitar a descoberta.',
    },
  ),
  activity(
    'cartoes-animais',
    'Maternal',
    'Quem fez esse som?',
    'Cartões de animais para imitar, escutar e conversar.',
    {
      mode: 'cards',
      supplies: 'Cartões impressos, um envelope grande e espaço para roda.',
      steps: [
        'Tire um cartão do envelope e mostre a figura para o grupo.',
        'Convide a imitar um som ou movimento do animal.',
        'Troque de cartão e deixe as crianças apontarem o próximo animal.',
      ],
      adaptation:
        'Aceite respostas por apontar, gesto, movimento ou comunicação alternativa.',
      prompts: ['Gato · mia', 'Pato · grasna', 'Cão · late', 'Pássaro · canta'],
    },
  ),
  activity(
    'objetos-e-usos',
    'Maternal',
    'O que usamos para quê?',
    'Relacione objetos conhecidos com ações da rotina.',
    {
      mode: 'cards',
      supplies: 'Cartões e objetos grandes correspondentes, limpos e seguros.',
      steps: [
        'Mostre um copo e conversem sobre quando ele é usado.',
        'Coloque dois cartões no chão e convide a buscar o objeto correspondente.',
        'Brinquem de representar a ação em pequenos grupos.',
      ],
      adaptation:
        'Use objetos reais antes dos cartões e reduza as opções para duas.',
      prompts: ['Copo · beber', 'Pano · limpar', 'Livro · ler', 'Bola · rolar'],
    },
  ),
  activity(
    'percurso',
    'Maternal',
    'Trilha de passos e pausas',
    'Percurso curto com possibilidades de movimento.',
    {
      mode: 'experience',
      supplies: 'Fita de papel, uma almofada firme e um tapete antiderrapante.',
      steps: [
        'Marque uma linha no chão longe de quinas e demonstre o caminho.',
        'Convide a seguir a linha, contornar a almofada e fazer uma pausa no tapete.',
        'Deixe as crianças escolherem outro jeito de percorrer a trilha.',
      ],
      adaptation:
        'Ofereça percurso acessível com movimentos de braços, apoio de um adulto ou deslocamento sentado.',
    },
  ),
  activity(
    'rotina-cartoes',
    'Maternal',
    'O que acontece agora?',
    'Cartões para antecipar momentos do dia, com apoio de imagens.',
    {
      mode: 'cards',
      supplies: 'Quatro cartões e um espaço de apresentação fixo e acessível.',
      steps: [
        'Mostre os cartões apenas dos momentos seguintes.',
        'Peça ao grupo que escolha a imagem do momento que acabou de ocorrer.',
        'Troque os cartões juntos quando houver mudança.',
      ],
      adaptation:
        'Se a rotina mudar, mostre a mudança antes e dê tempo para a criança reagir.',
      prompts: ['Chegada', 'Roda', 'Lanche', 'Brincadeira'],
    },
  ),
  activity(
    'pares-ilustrados',
    'Pré I',
    'Encontre os pares de frutas',
    'Ligue figuras iguais com linhas ou use os cartões para formar pares.',
    {
      mode: 'match',
      supplies: 'Folha A4, lápis ou cartões de frutas.',
      steps: [
        'Observe as duas colunas e diga o nome das frutas que reconhece.',
        'Ligue cada fruta à sua correspondente.',
        'Conte para um colega como você encontrou um par.',
      ],
      adaptation: 'Recorte os pares para deslocar as figuras, se preferir.',
      prompts: ['Maçã', 'Banana', 'Pera', 'Morango'],
      guide:
        'Há um par de cada fruta. Confira pelo desenho, sem depender apenas da cor.',
    },
  ),
  activity(
    'classificar',
    'Pré I',
    'Guarde cada coisa no seu lugar',
    'Separe imagens de brinquedos e materiais de desenho.',
    {
      mode: 'sort',
      supplies: 'Cartões, tesoura usada pela professora e duas caixas.',
      steps: [
        'Nomeie os objetos dos cartões.',
        'Escolha em qual caixa cada objeto pode ficar.',
        'Explique uma escolha e escute a ideia de um colega.',
      ],
      adaptation:
        'Permita colocar os cartões fisicamente em caixas em vez de desenhar.',
      prompts: ['Bola', 'Lápis', 'Blocos', 'Pincel'],
    },
  ),
  activity(
    'reconto',
    'Pré I',
    'Reconte a história da semente',
    'Três cenas para ordenar, comentar e recontar.',
    {
      mode: 'story',
      supplies: 'Folha ilustrada, lápis e um vaso com terra para demonstração.',
      steps: [
        'Observe as três cenas e conte o que percebe.',
        'Indique o que aconteceu primeiro, depois e no final.',
        'Recontem a história em roda, com ajuda das figuras.',
      ],
      adaptation:
        'Mostre duas cenas de cada vez e aceite apontar ou dramatizar.',
      prompts: ['Broto apareceu', 'Semente na terra', 'Regamos a terra'],
      guide: 'Uma ordem possível é semente na terra, rega e broto.',
    },
  ),
  activity(
    'contagem-visual',
    'Pré I',
    'Quantas frutas na cesta?',
    'Conte um grupo por vez e registre com marcas ou números.',
    {
      mode: 'count',
      supplies: 'Folha A4 e lápis. Tampinhas grandes podem apoiar a contagem.',
      steps: [
        'Aponte cada figura uma vez enquanto conta.',
        'Registre no quadro com marcas, desenho ou número.',
        'Compare duas linhas e diga onde há mais figuras.',
      ],
      adaptation: 'Cubra as outras linhas com uma folha durante a contagem.',
      prompts: ['Maçãs', 'Bananas', 'Peras'],
      guide: 'Os grupos têm 3, 5 e 4 figuras.',
    },
  ),
  activity(
    'jogo-dos-nomes',
    'Pré II',
    'Meu nome na roda',
    'Compare seu nome com dois cartões e registre suas descobertas.',
    {
      mode: 'names',
      supplies: 'Cartões com nomes usados pela turma e lápis.',
      steps: [
        'Escolha seu cartão e procure a letra inicial.',
        'Compare com dois nomes da roda. Qual começa com letra igual ou diferente?',
        'Registre seu nome com letras móveis, desenho ou escrita.',
      ],
      adaptation:
        'Ofereça cartão em letra ampliada e permita ditar a descoberta à professora.',
      prompts: [
        'Meu nome',
        'Um nome que começa igual',
        'Um nome que começa diferente',
      ],
    },
  ),
  activity(
    'tabela-de-frutas',
    'Pré II',
    'A feira da turma',
    'Conte as frutas e complete uma tabela de quantidades.',
    {
      mode: 'table',
      supplies: 'Folha A4, lápis e cartões de frutas opcionais.',
      steps: [
        'Conte cada grupo de frutas. Marque as figuras já contadas se precisar.',
        'Registre a quantidade numérica ou com traços na tabela.',
        'Circule a linha com mais frutas e explique sua escolha.',
      ],
      adaptation:
        'Use cartões móveis ou pequenas porções da folha e permita registro oral.',
      prompts: ['Maçãs', 'Bananas', 'Peras'],
      guide: 'Maçãs: 3. Bananas: 5. Peras: 4. O maior grupo é o de bananas.',
    },
  ),
  activity(
    'sequencias',
    'Pré II',
    'Continue o varal de frutas',
    'Descubra o padrão e complete o que falta.',
    {
      mode: 'pattern',
      supplies: 'Folha A4 e cartões de frutas recortáveis, se desejado.',
      steps: [
        'Diga em voz alta os nomes das frutas da primeira fileira.',
        'Identifique o trecho que se repete e complete a casa vazia.',
        'Na última linha, invente um padrão e desafie um colega.',
      ],
      adaptation:
        'Mostre a sequência com cartões móveis antes de usar a folha.',
      prompts: ['Maçã e banana', 'Pera, pera e maçã'],
      guide: 'Na primeira fileira falta banana. Na segunda falta maçã.',
    },
  ),
  activity(
    'organizar-cenas',
    'Pré II',
    'Da horta para a mesa',
    'Organize quatro cenas e conte como os alimentos chegam à mesa.',
    {
      mode: 'story',
      supplies: 'Cartões da folha e tesoura usada com supervisão.',
      steps: [
        'Comente o que aparece em cada cena.',
        'Ordene as cenas e conte a história usando primeiro, depois e por último.',
        'Compare sua sequência com a de um colega e discutam as escolhas.',
      ],
      adaptation: 'Faça a ordenação oral ou use cartões maiores sem recorte.',
      prompts: [
        'Colher a fruta',
        'Plantar a semente',
        'Servir à mesa',
        'Lavar a fruta',
      ],
      guide: 'Sequência esperada: plantar, colher, lavar e servir.',
    },
  ),
  notice(
    'reuniao',
    'Convite para reunião de famílias',
    'Data, horário, local e confirmação em duas vias.',
    'Queridas famílias, convidamos vocês para conversar sobre a rotina e os próximos projetos da turma. Contamos com a presença de um responsável. Por favor, confirmem pela agenda.',
    [date, time, place],
  ),
  notice(
    'passeio',
    'Autorização de passeio',
    'Comunicado com prazo e canhoto de autorização.',
    'A turma participará de uma saída pedagógica acompanhada pela equipe da escola. Envie o canhoto assinado até o prazo indicado. As crianças devem levar água e usar calçados confortáveis.',
    [date, time, place, returnDate],
  ),
  notice(
    'materiais',
    'Solicitação de materiais',
    'Recado editável com lista e data de entrega.',
    'Para nossa próxima experiência de criação, pedimos que enviem uma caixa de papel pequena e algumas folhas de revista. Caso não possam enviar, avisem nossa equipe para organizarmos as alternativas.',
    [{ ...date, label: 'Prazo de entrega' }],
  ),
  notice(
    'mudanca-rotina',
    'Mudança na rotina',
    'Avise a data e os horários alterados com antecedência.',
    'Nesta data, a turma terá uma alteração na rotina. Pedimos que observem o novo horário e informem à equipe se precisarem combinar a retirada da criança.',
    [date, { ...time, label: 'Novo horário' }],
  ),
  notice(
    'evento',
    'Convite para evento da turma',
    'Comunicado com data, local e ação para as famílias.',
    'Convidamos as famílias para a nossa mostra de experiências. As crianças compartilharão trabalhos e histórias produzidos nas últimas semanas. Cheguem com alguns minutos de antecedência.',
    [date, time, place],
  ),
  notice(
    'lembrete',
    'Lembrete de agenda',
    'Recado curto para imprimir e colar na agenda.',
    'Lembramos que é importante identificar os pertences da criança. Por gentileza, verifiquem se a garrafa de água e o casaco estão com o nome legível.',
    [date],
  ),
  {
    id: 'boas-vindas',
    title: 'Boas-vindas à turma',
    tool: 'painel',
    category: 'Painéis',
    description: 'Arte inteira em mosaico de 2 colunas × 2 linhas.',
  },
  {
    id: 'chamadinha',
    title: 'Chamadinha da turma',
    tool: 'painel',
    category: 'Painéis',
    description: 'Cabeçalho, áreas de presença e 24 cartões recortáveis.',
    poster: [
      'Presentes',
      'Hoje faltaram',
      ...Array.from({ length: 24 }, () => 'Nome: __________________'),
    ],
  },
  {
    id: 'aniversariantes',
    title: 'Aniversariantes do ano',
    tool: 'painel',
    category: 'Painéis',
    description: 'Cabeçalho e 12 cartões mensais para preencher.',
    poster: [
      'Janeiro',
      'Fevereiro',
      'Março',
      'Abril',
      'Maio',
      'Junho',
      'Julho',
      'Agosto',
      'Setembro',
      'Outubro',
      'Novembro',
      'Dezembro',
    ],
  },
  {
    id: 'painel-rotina',
    title: 'Nossa rotina',
    tool: 'painel',
    category: 'Painéis',
    description: 'Título e oito cartões de momentos para ordenar.',
    poster: [
      'Chegada',
      'Roda',
      'Lanche',
      'Brincadeira',
      'História',
      'Higiene',
      'Descanso',
      'Despedida',
    ],
  },
  {
    id: 'frutas-prontas',
    title: 'Prancha de frutas para colorir',
    tool: 'atividade',
    category: 'Atividades',
    description:
      'Prancha original do Openclipart. Imprima em A4 usando Ajustar à página.',
    ready: {
      file: 'frutas-cc0.pdf',
      image: 'frutas-cc0.png',
      author: 'frankes · CC0',
      source: 'https://openclipart.org/detail/244989/fruits-lineart',
    },
  },
]
const plan = (
  id: string,
  age: AgeBand,
  title: string,
  objective: string,
  preparation: string,
  conduct: string,
  observation: string,
): ClassroomItem => ({
  id,
  age,
  title,
  category: 'Organização da turma',
  tool: 'plano-de-aula',
  description: 'Planejamento editável com preparação, condução e observação.',
  fields: [
    {
      key: 'objective',
      label: 'Objetivo da aula',
      type: 'long',
      value: objective,
    },
    {
      key: 'preparation',
      label: 'Preparação e materiais',
      type: 'long',
      value: preparation,
    },
    { key: 'conduct', label: 'Etapas e duração', type: 'long', value: conduct },
    {
      key: 'observation',
      label: 'O que observar',
      type: 'long',
      value: observation,
    },
  ],
})
const record = (
  id: string,
  title: string,
  description: string,
  subject: string,
): ClassroomItem => ({
  id,
  title,
  description,
  category: 'Organização da turma',
  tool: 'relatorio',
  fields: [
    { key: 'observationSubject', label: subject },
    { key: 'context', label: 'Situação observada', type: 'long' },
    { key: 'observation', label: 'O que aconteceu', type: 'long' },
    { key: 'next', label: 'Próximos encaminhamentos', type: 'long' },
  ],
})
const visual = (
  id: string,
  title: string,
  tool: 'postagem' | 'fotos-em-pdf',
  description: string,
  values: Values,
): ClassroomItem => ({
  id,
  title,
  tool,
  category: 'Organização da turma',
  description,
  visual: { ...values, title },
})

classroom.push(
  plan(
    'plano-texturas',
    'Berçário',
    'Encontro com tecidos',
    'Explorar texturas com as mãos e manifestar preferências por gestos ou olhares.',
    'Organize um tapete firme com dois tecidos grandes de diferentes texturas. Higienize o material antes e depois.',
    '3 min · acolhida no tapete.\n7 min · exploração livre de um tecido por vez.\n3 min · retomada de sons e gestos observados.',
    'Observe olhar, alcance e escolha. Ajuste a intensidade do estímulo e respeite sinais de recusa.',
  ),
  plan(
    'plano-escuta',
    'Berçário',
    'Escuta perto e longe',
    'Investigar sons suaves e responder a pausas, ritmos e vozes conhecidas.',
    'Escolha um local sem barulho externo. Separe dois objetos grandes de som suave para uso da professora.',
    '4 min · voz e pausa.\n5 min · som suave de um lado e do outro, com a fonte visível.\n3 min · presença tranquila e fechamento.',
    'Registre como a criança indica interesse e se procura novamente pela fonte sonora.',
  ),
  plan(
    'plano-animais',
    'Maternal',
    'Roda dos animais',
    'Associar figuras de animais a movimentos e sons que as crianças reconhecem.',
    'Imprima cartões de quatro animais e organize espaço para a roda e para movimentos livres.',
    '5 min · descobrir a figura do envelope.\n10 min · imitar som e movimento.\n5 min · escolher a figura que a turma quer repetir.',
    'Observe como cada criança participa. Aceite movimentos, olhar, fala ou apontar.',
  ),
  plan(
    'plano-percurso',
    'Maternal',
    'Percurso com pausas',
    'Experimentar formas de deslocamento num percurso com opções de participação.',
    'Delimite um caminho seguro no chão. Separe fita, tapete fixo e uma almofada sem quinas.',
    '5 min · apresentação do caminho.\n10 min · exploração em pequenos grupos.\n5 min · roda curta sobre os movimentos escolhidos.',
    'Registre quais apoios foram pedidos. Prepare alternativas de trajeto e exploração com as mãos.',
  ),
  plan(
    'plano-reconto',
    'Pré I',
    'História da semente',
    'Organizar cenas em uma sequência e recontar o que aconteceu com apoio das imagens.',
    'Organize um vaso, uma semente grande para demonstração e cartões das três cenas.',
    '7 min · observar e antecipar.\n10 min · ordenar cartões do plantio.\n8 min · recontar em pares ou dramatizar.',
    'Escute os conectivos que surgem. Ofereça duas imagens por vez quando fizer sentido.',
  ),
  plan(
    'plano-pares',
    'Pré I',
    'Pares na feira',
    'Comparar figuras e explicar como dois elementos formam um par.',
    'Imprima os pares de frutas e tenha uma mesa grande sem excesso de elementos.',
    '5 min · nomear frutas.\n12 min · parear as figuras em dupla.\n8 min · comparar as estratégias e organizar os cartões.',
    'Observe se a criança usa forma, textura ou tamanho. Evite usar apenas cor como pista.',
  ),
  plan(
    'plano-nomes',
    'Pré II',
    'Os nomes da nossa roda',
    'Reconhecer o próprio nome e comparar letras iniciais com os nomes do grupo.',
    'Prepare cartões com os nomes do grupo, letras móveis grandes e folhas de registro.',
    '5 min · encontrar o próprio cartão.\n12 min · comparar as letras iniciais em trios.\n10 min · registrar uma descoberta do grupo.',
    'Registre justificativas e interações. Considere a escrita espontânea sem exigir convenção.',
  ),
  plan(
    'plano-feira',
    'Pré II',
    'Contar, registrar e comparar',
    'Contar coleções, registrar quantidades e comparar os resultados.',
    'Separe as fichas da feira, cartões móveis e lápis. Organize mesas para pequenos grupos.',
    '6 min · observar os grupos de frutas.\n12 min · contar e registrar na tabela.\n10 min · comparar os grupos e explicar os procedimentos.',
    'Observe correspondência um a um e estratégias de registro. Apoie com cartões móveis ou registro oral.',
  ),
  record(
    'registro-individual',
    'Registro de observação individual',
    'Descreva situação, participação e próximos apoios.',
    'Identificação no registro',
  ),
  record(
    'registro-coletivo',
    'Registro de experiência coletiva',
    'Organize evidências da turma e encaminhamentos.',
    'Turma ou grupo observado',
  ),
  visual(
    'arte-reuniao',
    'Lembrete de reunião',
    'postagem',
    'Composição quadrada para compartilhar na agenda digital.',
    {
      body: 'Vamos conversar sobre as descobertas da nossa turma. Confira o horário e confirme presença pela agenda.',
      background: '#f4dfd0',
      foreground: '#254c40',
      font: 'Georgia',
      format: 'Quadrado 1:1',
      model: '1',
      figure: '01_livro',
    },
  ),
  visual(
    'arte-mostra',
    'Mostra de experiências',
    'postagem',
    'Convite vertical para a mostra de trabalhos.',
    {
      body: 'Venha ver o que as crianças criaram, pesquisaram e quiseram compartilhar com as famílias.',
      background: '#dcebdd',
      foreground: '#20483a',
      font: 'Georgia',
      format: 'Vertical 4:5',
      model: '2',
      figure: '02_estrela',
    },
  ),
  visual(
    'arte-boas-vindas',
    'Bem-vindas, famílias!',
    'postagem',
    'Arte horizontal para a abertura do ano letivo.',
    {
      body: 'Uma nova etapa começa com acolhimento, brincadeira e muitas descobertas.',
      background: '#eadff4',
      foreground: '#372849',
      font: 'Verdana',
      format: 'Horizontal 16:9',
      model: '0',
      figure: '06_arco-iris',
    },
  ),
  visual(
    'album-portifolio',
    'Álbum de portfólio',
    'fotos-em-pdf',
    'Uma fotografia por folha vertical, com espaço para legenda.',
    {
      orientation: 'vertical',
      perPage: '1',
      margin: '15',
      crop: 'no',
      quality: 'high',
    },
  ),
  visual(
    'album-passeio',
    'Álbum do passeio',
    'fotos-em-pdf',
    'Duas imagens lado a lado em A4 horizontal.',
    {
      orientation: 'horizontal',
      perPage: '2',
      margin: '10',
      crop: 'no',
      quality: 'high',
    },
  ),
  visual(
    'album-rotina',
    'Álbum da rotina',
    'fotos-em-pdf',
    'Quatro imagens por folha vertical para um registro compacto.',
    {
      orientation: 'vertical',
      perPage: '4',
      margin: '5',
      crop: 'no',
      quality: 'standard',
    },
  ),
)
const fruitWorksheet = classroom.find((item) => item.id === 'tabela-de-frutas')!
const customWorksheet: ClassroomItem = {
  ...fruitWorksheet,
  id: 'criar-contagem',
  title: 'Minha ficha de contagem',
  description:
    'Escolha as figuras e as quantidades. A folha sai pronta para a criança responder.',
  task: {
    ...fruitWorksheet.task!,
    supplies:
      'Ficha impressa e lápis. Separe objetos ou cartões para apoiar a contagem.',
    steps: [
      'Peça que a criança conte um grupo por vez.',
      'Convide a registrar com traços ou números.',
      'Compare os grupos e converse sobre como a criança descobriu a quantidade.',
    ],
  },
}

export function findClassroomItem(id: string | undefined) {
  return id === customWorksheet.id
    ? customWorksheet
    : classroom.find((item) => item.id === id)
}
