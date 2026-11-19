import type { PanelSpec } from './panel-geometry'
import type { Tool } from './catalog'
import type { Values } from './store'

export const ageBands = ['Berçário', 'Maternal', 'Pré I', 'Pré II'] as const
export type AgeBand = (typeof ageBands)[number]

export const ageGuides: Record<AgeBand, string> = {
  Berçário: 'Bebês · 0 a 1 ano e 6 meses',
  Maternal: 'Crianças bem pequenas · 1 ano e 7 meses a 3 anos e 11 meses',
  'Pré I': 'Crianças pequenas · 4 anos',
  'Pré II': 'Crianças pequenas · 5 anos',
}

export const categories = [
  'Atividades',
  'Recados',
  'Painéis',
  'Organização da turma',
] as const
export type Category = (typeof categories)[number]

export type PrintTheme = 'jardim' | 'sol' | 'pessego' | 'economico'
export type NoticeArt = 'reuniao' | 'passeio' | 'materiais' | 'evento'

export type Field = {
  key: string
  label: string
  value?: string
  type?: 'long' | 'date' | 'time'
}

export type TraceTrack = {
  from: string
  to: string
  kind: 'straight' | 'wave' | 'zigzag' | 'arc'
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
    | 'draw-frame'
    | 'table'
    | 'pattern'
    | 'trace'
  supplies: string
  steps: string[]
  adaptation: string
  prompts?: string[]
  illustrations?: string[]
  tracks?: TraceTrack[]
  sortLabels?: [string, string]
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
  detachable?: boolean
  noticeArt?: NoticeArt
  defaultTheme?: PrintTheme
  planLayout?: 'daily' | 'weekly' | 'sequence' | 'infant'
  reportLayout?:
    | 'bncc'
    | 'logbook'
    | 'collective'
    | 'adaptation'
    | 'project'
    | 'family-card'
  poster?: string[]
  kit?: 'tiras' | 'placas'
  mosaicLabels?: string[]
  panel?: PanelSpec
  scope?: 'individual' | 'collective'
  form?: 'ata' | 'declaracao' | 'entrega' | 'ficha' | 'checklist' | 'authorization'
  ready?: { file: string; image: string; author: string; source: string }
  visual?: Values
}

const activity = (
  id: string,
  age: AgeBand,
  title: string,
  description: string,
  task: Task,
  defaultTheme: PrintTheme = 'jardim',
): ClassroomItem => ({
  id,
  title,
  age,
  description,
  task,
  defaultTheme,
  category: 'Atividades',
  tool: 'atividade',
})

const notice = (
  id: string,
  noticeArt: NoticeArt,
  title: string,
  description: string,
  body: string,
  fields: Field[],
  detachable = false,
): ClassroomItem => ({
  id,
  noticeArt,
  title,
  description,
  body,
  fields,
  detachable,
  category: 'Recados',
  tool: 'documento',
})

const dateField: Field = { key: 'date', label: 'Data', type: 'date' }
const timeField: Field = { key: 'time', label: 'Horário', type: 'time' }
const placeField: Field = { key: 'place', label: 'Local' }
const returnDateField: Field = {
  key: 'returnDate',
  label: 'Prazo de retorno',
  type: 'date',
}

const plan = (
  id: string,
  age: AgeBand,
  planLayout: NonNullable<ClassroomItem['planLayout']>,
  title: string,
  description: string,
  fields: Field[],
  defaultTheme: PrintTheme = 'jardim',
): ClassroomItem => ({
  id,
  age,
  planLayout,
  title,
  description,
  fields,
  defaultTheme,
  category: 'Organização da turma',
  tool: 'plano-de-aula',
})

const schoolDocument = (
  id: string,
  form: NonNullable<ClassroomItem['form']>,
  title: string,
  description: string,
  fields: Field[],
): ClassroomItem => ({
  id,
  form,
  title,
  description,
  fields,
  category: 'Organização da turma',
  tool: 'documento',
})

export const classroom: ClassroomItem[] = [
  // =========================================================
  // 1. ATIVIDADES (16 modelos únicos + 3 montadores livres)
  // =========================================================
  activity(
    'tabela-de-frutas',
    'Pré II',
    'A feira da turma',
    'Conte os grupos de frutas, anote as quantidades na tabela e compare resultados.',
    {
      mode: 'table',
      supplies: 'Folha A4, lápis e cartões móveis opcionais para apoio na contagem.',
      steps: [
        'Conte cada grupo de frutas apontando uma figura de cada vez.',
        'Registre a quantidade na tabela com números, bolinhas ou traços.',
        'Circule a linha com mais frutas e conte como descobriu.',
      ],
      adaptation: 'Cubra as linhas seguintes com outra folha para manter o foco.',
      prompts: ['Maçãs', 'Bananas', 'Peras'],
      guide: 'Maçãs: 3. Bananas: 5. Peras: 4. O maior grupo é o de bananas.',
    },
    'jardim',
  ),
  activity(
    'pares-ilustrados',
    'Pré I',
    'Encontre os pares de frutas',
    'Ligue as figuras iguais entre as duas colunas observando forma e detalhes.',
    {
      mode: 'match',
      supplies: 'Folha A4 e lápis ou giz de cera.',
      steps: [
        'Nomeie as frutas que aparecem nas duas colunas.',
        'Ligue cada fruta à sua figura correspondente.',
        'Converse com um colega sobre o que observou em cada par.',
      ],
      adaptation: 'Permita recortar os cartões para formar pares sobre a mesa.',
      prompts: ['Maçã', 'Banana', 'Pera', 'Morango'],
      guide: 'Cada fruta possui um par correspondente na coluna oposta.',
    },
    'sol',
  ),
  activity(
    'tracado-borboleta',
    'Pré I',
    'Caminhos da borboleta',
    'Treine coordenação motora fina cobrindo caminhos retos, ondulados, em arco e zigue-zague.',
    {
      mode: 'trace',
      supplies: 'Folha impressa e giz de cera grosso, lápis ou canetinha.',
      steps: [
        'Passe primeiro o dedo indicador sobre cada caminho pontilhado.',
        'Cubra o traçado ligando cada elemento do jardim ao seu destino.',
        'Converse sobre qual caminho foi mais curto ou cheio de curvas.',
      ],
      adaptation: 'Amplie a folha ou ofereça giz triangular para facilitar a preensão.',
      tracks: [
        { from: 'Borboleta', to: 'Flor', kind: 'wave' },
        { from: 'Pássaro', to: 'Broto', kind: 'arc' },
        { from: 'Regador', to: 'Semente', kind: 'straight' },
        { from: 'Bola', to: 'Livro', kind: 'zigzag' },
      ],
      guide: 'Observe o controle do traço, a pressão e o sentido esquerda-direita.',
    },
    'pessego',
  ),
  activity(
    'tracado-animais',
    'Maternal',
    'Trilhas dos bichinhos',
    'Pistas largas para crianças bem pequenas guiarem os animais até seus objetos.',
    {
      mode: 'trace',
      supplies: 'Folha impressa e giz de cera grosso ou barbante colado.',
      steps: [
        'Imite o som de cada bichinho com a turma antes de começar.',
        'Acompanhe a trilha com o dedinho e depois com o giz de cera.',
        'Comemore a chegada de cada animal ao seu destino.',
      ],
      adaptation: 'Disponibilize giz de cera grosso ou cola colorida em relevo.',
      tracks: [
        { from: 'Gato', to: 'Bola', kind: 'straight' },
        { from: 'Pato', to: 'Regador', kind: 'wave' },
        { from: 'Cão', to: 'Prato', kind: 'arc' },
      ],
      guide: 'Valorize a intenção do percurso sem exigir precisão no contorno.',
    },
    'sol',
  ),
  activity(
    'sequencias',
    'Pré II',
    'Continue o varal de frutas',
    'Descubra a regra de repetição em cada fileira, complete o que falta e invente um padrão.',
    {
      mode: 'pattern',
      supplies: 'Folha A4 e lápis de cor ou figuras recortadas.',
      steps: [
        'Leia em voz alta o nome das frutas da primeira fileira.',
        'Descubra qual fruta completa a casa vazia no final do varal.',
        'Na última fileira, invente sua própria sequência ilustrada.',
      ],
      adaptation: 'Monte a sequência primeiro com objetos concretos sobre a mesa.',
      prompts: ['Maçã e banana', 'Pera, pera e maçã'],
      guide: 'Na 1ª fileira falta banana; na 2ª fileira falta maçã.',
    },
    'jardim',
  ),
  activity(
    'reconto',
    'Pré I',
    'Reconte a história da semente',
    'Três cenas ilustradas para ordenar acontecimentos e narrar em sequência temporal.',
    {
      mode: 'story',
      supplies: 'Folha ilustrada e lápis de cor.',
      steps: [
        'Observe cada cena e conte o que está acontecendo.',
        'Numere nos quadrinhos o que veio primeiro, depois e por último.',
        'Reconte a história da semente para um colega ou para a roda.',
      ],
      adaptation: 'Aceite o reconto por apontamento ou dramatização em pequenos grupos.',
      prompts: ['Broto apareceu', 'Semente na terra', 'Regamos a terra'],
      guide: 'Ordem sugerida: 2 (semente na terra), 3 (rega), 1 (broto).',
    },
    'jardim',
  ),
  activity(
    'ciclo-borboleta',
    'Pré II',
    'A borboleta em quatro cenas',
    'Observe as etapas da metamorfose, numere a sequência correta e desenhe uma continuação.',
    {
      mode: 'story',
      supplies: 'Folha impressa e lápis de cor.',
      steps: [
        'Converse sobre as transformações observadas nas quatro ilustrações.',
        'Escreva nos quadros a ordem do ovo até a borboleta.',
        'Desenhe onde a borboleta pode voar depois.',
      ],
      adaptation: 'Ofereça as quatro cenas recortadas para manipulação antes do registro.',
      prompts: ['Lagarta', 'Borboleta', 'Ovo', 'Crisálida'],
      guide: 'Ordem esperada: 3 (Ovo), 1 (Lagarta), 4 (Crisálida), 2 (Borboleta).',
    },
    'pessego',
  ),
  activity(
    'classificar',
    'Pré I',
    'Guarde cada coisa no seu lugar',
    'Observe quatro figuras da rotina e separe entre Brinquedos e Materiais de desenho.',
    {
      mode: 'sort',
      supplies: 'Folha impressa, lápis ou tesoura sem ponta com supervisão.',
      steps: [
        'Nomeie os quatro objetos mostrados nos cartões.',
        'Decida em qual caixa cada objeto costuma ficar guardado.',
        'Desenhe ou cole os exemplos nos quadros correspondentes.',
      ],
      adaptation: 'Realize a classificação primeiro com objetos reais da sala em dois cestos.',
      prompts: ['Bola', 'Lápis', 'Blocos', 'Pincel'],
      sortLabels: ['Brinquedos', 'Materiais de desenho'],
      guide: 'Brinquedos: Bola e Blocos. Materiais de desenho: Lápis e Pincel.',
    },
    'sol',
  ),
  activity(
    'jogo-dos-nomes',
    'Pré II',
    'Meu nome na roda',
    'Compare a letra inicial do próprio nome com o de colegas usando pauta caligráfica infantil.',
    {
      mode: 'names',
      supplies: 'Crachás com os nomes da turma, letras móveis e lápis.',
      steps: [
        'Encontre seu crachá e destaque a primeira letra no quadro.',
        'Compare com os colegas para achar quem começa igual e diferente.',
        'Registre os nomes na pauta com letras móveis ou escrita espontânea.',
      ],
      adaptation: 'Disponibilize crachá em fonte ampliada ou alfabeto móvel.',
      prompts: [
        'Meu nome',
        'Um nome que começa igual ao meu',
        'Um nome que começa diferente',
      ],
      guide: 'Acolha a escrita espontânea e observe o reconhecimento da letra inicial.',
    },
    'jardim',
  ),
  activity(
    'moldura-desenho',
    'Pré I',
    'Diário ilustrado da turma',
    'Folha com moldura generosa para desenho livre ou dirigido e linhas para relato ditado.',
    {
      mode: 'draw-frame',
      supplies: 'Folha A4, giz de cera, lápis de cor ou colagem com folhas.',
      steps: [
        'Converse sobre a vivência escolhida e o que mais chamou atenção.',
        'Convide a criança a desenhar dentro da moldura com calma.',
        'Anote nas linhas abaixo a fala ou título que a criança ditar.',
      ],
      adaptation: 'Permita colagem de elementos naturais ou uso de canetinha grossa.',
      illustrations: ['Flor do dia'],
      prompts: ['O que eu desenhei'],
      guide: 'Preserve a fala original da criança ao registrar como escriba.',
    },
    'pessego',
  ),
  {
    id: 'frutas-prontas',
    title: 'Prancha de frutas para colorir',
    tool: 'atividade',
    category: 'Atividades',
    age: 'Pré I',
    description:
      'Prancha vetorial clássica do Openclipart pronta para imprimir em A4 e colorir.',
    ready: {
      file: 'frutas-cc0.pdf',
      image: 'frutas-cc0.png',
      author: 'frankes · CC0',
      source: 'https://openclipart.org/detail/244989/fruits-lineart',
    },
  },
  {
    id: 'prancha-regador-cc0',
    title: 'Prancha do regador para colorir',
    tool: 'atividade',
    category: 'Atividades',
    age: 'Pré I',
    description:
      'Desenho original em traço limpo do Openclipart para projetos de horta e natureza.',
    ready: {
      file: 'openclipart-regador.pdf',
      image: 'openclipart-regador.png',
      author: 'Viscious-Speed · CC0 1.0',
      source: 'https://openclipart.org/detail/196248/watering-can',
    },
  },
  activity(
    'rotina-cartoes',
    'Maternal',
    'Cartões da rotina do dia',
    'Cartões ilustrados para antecipar momentos da rotina ou duplicar como Jogo da Memória.',
    {
      mode: 'cards',
      supplies: 'Folha impressa em papel firme (120g ou cartolina) e tesoura.',
      steps: [
        'Recorte os cartões nas linhas tracejadas.',
        'Mostre ao grupo o momento atual e o que acontecerá em seguida.',
        'No modo Jogo da Memória, vire os pares para baixo e jogue em duplas.',
      ],
      adaptation: 'Fixe velcro atrás dos cartões para montar um quadro na altura das crianças.',
      prompts: ['Chegada', 'Roda', 'Lanche', 'Brincadeira'],
      guide: 'Antecipar transições traz segurança e autonomia ao grupo.',
    },
    'jardim',
  ),
  activity(
    'cartoes-animais',
    'Maternal',
    'Quem fez esse som?',
    'Cartões grandes de animais para imitar sons, movimentos e jogar em roda ou em pares.',
    {
      mode: 'cards',
      supplies: 'Cartões recortados, um saquinho de tecido ou envelope.',
      steps: [
        'Retire um cartão surpresa e mostre à roda.',
        'Convide as crianças a imitar o som e o jeito do animal andar.',
        'Use duas cópias para brincar de encontrar os pares.',
      ],
      adaptation: 'Valorize apontar, olhar ou gestos corporais como forma de resposta.',
      prompts: ['Gato · mia', 'Pato · grasna', 'Cão · late', 'Pássaro · canta'],
    },
    'sol',
  ),
  activity(
    'tecidos',
    'Berçário',
    'Entre tecidos e texturas',
    'Vivência sensorial editável para bebês explorarem tecidos variados em segurança.',
    {
      mode: 'experience',
      supplies: 'Duas peças grandes de tecido lavável sem fios soltos e tapete firme.',
      steps: [
        'Estenda um tecido liso e outro rugoso em área limpa.',
        'Toque o tecido e aguarde que o bebê se aproxime ou alcance com a mão.',
        'Nomeie as sensações com voz calma e faça pausas para as reações.',
      ],
      adaptation: 'Aproxime um tecido por vez e mantenha sempre o rosto livre.',
      guide: 'Registre qual textura o bebê procurou e como pediu para repetir.',
    },
    'pessego',
  ),
  activity(
    'percurso',
    'Maternal',
    'Trilha de passos e pausas',
    'Vivência corporal editável com percurso seguro de contorno, equilíbrio e pausas.',
    {
      mode: 'experience',
      supplies: 'Fita crepe larga, almofada firme e tapete antiderrapante.',
      steps: [
        'Marque um caminho simples no chão longe de quinas.',
        'Demonstre como seguir a fita, contornar a almofada e parar no tapete.',
        'Convide as crianças a inventar outro jeito de atravessar a trilha.',
      ],
      adaptation: 'Ofereça apoio de adulto ou percurso acessível sentado.',
      guide: 'Observe equilíbrio, ritmo e trocas entre os colegas.',
    },
    'jardim',
  ),

  // =========================================================
  // 2. PLANOS DE AULA (8 modelos em 4 formatos distintos + BNCC)
  // =========================================================
  plan(
    'plano-acolhimento-bercario',
    'Berçário',
    'infant',
    'Cesto de texturas e vínculo',
    'Formato específico de creche com foco em vínculo, segurança e sinais dos bebês.',
    [
      {
        key: 'objective',
        label: 'Intenção pedagógica',
        type: 'long',
        value:
          'Favorecer a exploração tátil de superfícies seguras em clima de escuta e vínculo afetivo.',
      },
      {
        key: 'preparation',
        label: 'Organização do ambiente e cuidados',
        type: 'long',
        value:
          'Tapete higiênico em local silencioso com tecidos grandes lavados de algodão, tule firme e malha.',
      },
      {
        key: 'conduct',
        label: 'Etapas da proposta',
        type: 'long',
        value:
          '3 min · Aproximação tranquila com contato visual e voz suave.\n7 min · Exploração livre de um tecido por vez ao alcance das mãos.\n4 min · Acolhida dos sinais de cansaço e transição calma.',
      },
      {
        key: 'observation',
        label: 'Sinais e respostas para observar',
        type: 'long',
        value:
          'Observe olhares, movimentos de alcance, preferências de textura e gestos de recusa.',
      },
    ],
    'pessego',
  ),
  plan(
    'plano-escuta',
    'Berçário',
    'daily',
    'Escuta perto e longe',
    'Plano diário estruturado com momentos cronometrados para percepção sonora.',
    [
      {
        key: 'objective',
        label: 'Objetivo da aula',
        type: 'long',
        value:
          'Investigar sons suaves no espaço e responder a pausas, ritmos e vozes conhecidas.',
      },
      {
        key: 'preparation',
        label: 'Preparação e materiais',
        type: 'long',
        value:
          'Ambiente sem ruído externo, chocalho grande fechado e voz da professora.',
      },
      {
        key: 'conduct',
        label: 'Etapas da proposta',
        type: 'long',
        value:
          '4 min · Cantiga curta com pausas de espera.\n6 min · Som suave com fonte visível de um lado e do outro.\n3 min · Fechamento sereno.',
      },
      {
        key: 'observation',
        label: 'O que observar',
        type: 'long',
        value:
          'Anote como cada bebê direciona o olhar e reage às alternâncias de som e silêncio.',
      },
    ],
    'jardim',
  ),
  plan(
    'plano-animais',
    'Maternal',
    'daily',
    'Roda dos animais e movimentos',
    'Plano diário por momentos editáveis com tempo total calculado automaticamente.',
    [
      {
        key: 'objective',
        label: 'Objetivo da aula',
        type: 'long',
        value:
          'Associar figuras de animais a sons e deslocamentos corporais em pequenos grupos.',
      },
      {
        key: 'preparation',
        label: 'Preparação e materiais',
        type: 'long',
        value: 'Cartões de animais recortados, envelope surpresa e espaço livre.',
      },
      {
        key: 'conduct',
        label: 'Etapas da proposta',
        type: 'long',
        value:
          '5 min · Retirar uma figura do envelope na roda.\n10 min · Imitar sons e jeitos de andar pelo pátio.\n5 min · Escolher qual animal repetir no fechamento.',
      },
      {
        key: 'observation',
        label: 'O que observar',
        type: 'long',
        value:
          'Valorize participações por movimento, olhar, fala ou apontamento.',
      },
    ],
    'sol',
  ),
  plan(
    'plano-semanal-maternal',
    'Maternal',
    'weekly',
    'Planejamento semanal · Maternal',
    'Grade semanal em A4 paisagem (Segunda a Sexta) com roda, proposta principal e registro.',
    [
      {
        key: 'objective',
        label: 'Foco pedagógico da semana',
        type: 'long',
        value:
          'Explorar objetos do cotidiano, cantigas com gestos e organização dos espaços da sala.',
      },
      {
        key: 'mon',
        label: 'Segunda-feira',
        type: 'long',
        value: 'Roda de chegada com sacola de objetos e cantiga conhecida.',
      },
      {
        key: 'tue',
        label: 'Terça-feira',
        type: 'long',
        value: 'Exploração de sombras e lanternas com animais na parede.',
      },
      {
        key: 'wed',
        label: 'Quarta-feira',
        type: 'long',
        value: 'Percurso motor no pátio com fita no chão e almofadas.',
      },
      {
        key: 'thu',
        label: 'Quinta-feira',
        type: 'long',
        value: 'Pintura com água em papel escuro usando pincéis largos.',
      },
      {
        key: 'fri',
        label: 'Sexta-feira',
        type: 'long',
        value: 'Leitura em duplas no cantinho de almofadas e roda de partilha.',
      },
    ],
    'jardim',
  ),
  plan(
    'plano-reconto',
    'Pré I',
    'daily',
    'História da semente em três cenas',
    'Plano diário articulando literatura infantil, ordenação temporal e oralidade.',
    [
      {
        key: 'objective',
        label: 'Objetivo da aula',
        type: 'long',
        value:
          'Organizar cenas em sequência temporal e recontar acontecimentos com apoio visual.',
      },
      {
        key: 'preparation',
        label: 'Preparação e materiais',
        type: 'long',
        value: 'Vaso com terra, sementes grandes e ficha ilustrada das três cenas.',
      },
      {
        key: 'conduct',
        label: 'Etapas da proposta',
        type: 'long',
        value:
          '7 min · Observar a semente e levantar hipóteses.\n12 min · Ordenar as três cenas em duplas.\n8 min · Reconto coletivo na roda.',
      },
      {
        key: 'observation',
        label: 'O que observar',
        type: 'long',
        value:
          'Escute conectivos temporais (primeiro, depois, por último) usados pelas crianças.',
      },
    ],
    'jardim',
  ),
  plan(
    'plano-sequencia-horta',
    'Pré I',
    'sequence',
    'Sequência didática · Descobertas da horta',
    'Plano encadeado em 4 encontros progressivos para investigar plantas e cuidados.',
    [
      {
        key: 'objective',
        label: 'Objetivo da sequência',
        type: 'long',
        value:
          'Acompanhar o crescimento de sementes ao longo dos dias por meio de observação e registro.',
      },
      {
        key: 'preparation',
        label: 'Materiais dos encontros',
        type: 'long',
        value: 'Lupas, regador, potes transparentes, terra, sementes e folhas A4.',
      },
      {
        key: 'conduct',
        label: 'Encadeamento dos encontros',
        type: 'long',
        value:
          '15 min · Encontro 1: Levantamento de hipóteses sobre o que a planta precisa.\n20 min · Encontro 2: Plantio coletivo e combinado da rega.\n15 min · Encontro 3: Observação com lupa e desenho do primeiro broto.\n20 min · Encontro 4: Montagem do painel da horta para as famílias.',
      },
      {
        key: 'observation',
        label: 'Avaliação de processo',
        type: 'long',
        value:
          'Compare os desenhos iniciais com os registros feitos após a germinação.',
      },
    ],
    'sol',
  ),
  plan(
    'plano-semanal-pre',
    'Pré II',
    'weekly',
    'Planejamento semanal · Pré II',
    'Visão completa da semana em tabela paisagem (Segunda a Sexta) pronta para coordenação.',
    [
      {
        key: 'objective',
        label: 'Eixo da semana',
        type: 'long',
        value:
          'Leitura de nomes próprios, contagem em situações reais e construção de mapas da sala.',
      },
      {
        key: 'mon',
        label: 'Segunda-feira',
        type: 'long',
        value: 'Jogo dos nomes na roda e escrita espontânea na pauta infantil.',
      },
      {
        key: 'tue',
        label: 'Terça-feira',
        type: 'long',
        value: 'Feira da turma: contagem, tabela e comparação de quantidades.',
      },
      {
        key: 'wed',
        label: 'Quarta-feira',
        type: 'long',
        value: 'Cartógrafos da sala: criação de mapas de percurso em duplas.',
      },
      {
        key: 'thu',
        label: 'Quinta-feira',
        type: 'long',
        value: 'Ciclo da borboleta: leitura de imagens e sequenciação em 4 cenas.',
      },
      {
        key: 'fri',
        label: 'Sexta-feira',
        type: 'long',
        value: 'Assembleia semanal de combinados e revisão dos aprendizados.',
      },
    ],
    'jardim',
  ),
  plan(
    'plano-projeto-feira',
    'Pré II',
    'sequence',
    'Mini-projeto · A feira da turma',
    'Sequência investigativa conectando pesquisa matemática, oralidade e registro em tabela.',
    [
      {
        key: 'objective',
        label: 'Problema investigado',
        type: 'long',
        value:
          'Resolver problemas reais de contagem, agrupamento e comparação de coleções de frutas.',
      },
      {
        key: 'preparation',
        label: 'Recursos e espaços',
        type: 'long',
        value: 'Cestos de frutas, fichas de contagem, cartões de números e pranchetas.',
      },
      {
        key: 'conduct',
        label: 'Etapas do mini-projeto',
        type: 'long',
        value:
          '10 min · Pesquisa das frutas preferidas da turma.\n15 min · Organização dos grupos e correspondência um a um.\n15 min · Registro na tabela e debate das comparações.',
      },
      {
        key: 'observation',
        label: 'O que documentar',
        type: 'long',
        value:
          'Registre diferentes estratégias usadas pelas crianças para conferir quantidades.',
      },
    ],
    'pessego',
  ),

  // =========================================================
  // 3. RELATÓRIOS E REGISTROS (6 estruturas distintas)
  // =========================================================
  {
    id: 'registro-individual',
    title: 'Relatório individual · BNCC',
    description:
      'Estrutura semestral organizada em dimensões: convivência, corpo, linguagens e próximas propostas.',
    category: 'Organização da turma',
    tool: 'relatorio',
    reportLayout: 'bncc',
    scope: 'individual',
    fields: [
      { key: 'observationSubject', label: 'Nome fictício da criança' },
      { key: 'period', label: 'Semestre / Período' },
      { key: 'teacher', label: 'Professora responsável' },
      {
        key: 'social',
        label: 'Convivência, vínculos e autonomia (O eu, o outro e o nós)',
        type: 'long',
      },
      {
        key: 'languages',
        label: 'Brincadeiras, corpo, escuta e expressões',
        type: 'long',
      },
      {
        key: 'evidence',
        label: 'Explorações, descobertas e falas marcantes',
        type: 'long',
      },
      {
        key: 'next',
        label: 'Próximos apoios e caminhos pedagógicos',
        type: 'long',
      },
    ],
  },
  {
    id: 'diario-de-bordo',
    title: 'Diário de bordo (observação rápida)',
    description:
      'Tabela prática para anotar episódios breves de brincadeiras, falas e interações da semana.',
    category: 'Organização da turma',
    tool: 'relatorio',
    reportLayout: 'logbook',
    scope: 'collective',
    defaultTheme: 'sol',
    fields: [
      { key: 'observationSubject', label: 'Turma ou pequeno grupo' },
      { key: 'period', label: 'Semana de referência' },
      { key: 'teacher', label: 'Professora responsável' },
      {
        key: 'entry1',
        label: 'Episódio 1 · Contexto e fala/ação observada',
        type: 'long',
      },
      {
        key: 'entry2',
        label: 'Episódio 2 · Contexto e fala/ação observada',
        type: 'long',
      },
      {
        key: 'entry3',
        label: 'Episódio 3 · Contexto e fala/ação observada',
        type: 'long',
      },
      {
        key: 'next',
        label: 'O que retomar na próxima semana',
        type: 'long',
      },
    ],
  },
  {
    id: 'registro-coletivo',
    title: 'Registro coletivo da turma',
    description:
      'Documenta o percurso do grupo, estratégias compartilhadas e ajustes de ambiente.',
    category: 'Organização da turma',
    tool: 'relatorio',
    reportLayout: 'collective',
    scope: 'collective',
    fields: [
      { key: 'observationSubject', label: 'Turma observada' },
      { key: 'period', label: 'Período observado' },
      { key: 'teacher', label: 'Equipe da turma' },
      { key: 'context', label: 'Proposta e organização do espaço', type: 'long' },
      {
        key: 'observation',
        label: 'Interações, escolhas e estratégias do grupo',
        type: 'long',
      },
      { key: 'next', label: 'Reorganizações e novas propostas', type: 'long' },
    ],
  },
  {
    id: 'ficha-adaptacao',
    title: 'Acompanhamento de adaptação',
    description:
      'Registro acolhedor dos primeiros dias: chegada, referências afetivas, alimentação e descanso.',
    category: 'Organização da turma',
    tool: 'relatorio',
    reportLayout: 'adaptation',
    scope: 'individual',
    defaultTheme: 'pessego',
    fields: [
      { key: 'observationSubject', label: 'Nome fictício da criança' },
      { key: 'period', label: 'Período de acolhimento' },
      { key: 'teacher', label: 'Adulto de referência' },
      {
        key: 'arrival',
        label: 'Chegada, despedida da família e objetos de consolo',
        type: 'long',
      },
      {
        key: 'routine',
        label: 'Brincadeiras, alimentação, sono e vínculo na sala',
        type: 'long',
      },
      {
        key: 'next',
        label: 'Combinados com a família para os próximos dias',
        type: 'long',
      },
    ],
  },
  {
    id: 'registro-projeto-coletivo',
    title: 'Acompanhamento de projeto',
    description:
      'Organiza a pergunta disparadora da turma, investigações em curso e descobertas.',
    category: 'Organização da turma',
    tool: 'relatorio',
    reportLayout: 'project',
    scope: 'collective',
    fields: [
      { key: 'observationSubject', label: 'Nome do projeto e turma' },
      { key: 'period', label: 'Etapa / Mês' },
      { key: 'teacher', label: 'Professora responsável' },
      { key: 'question', label: 'Pergunta ou curiosidade inicial', type: 'long' },
      {
        key: 'evidence',
        label: 'Experimentações, hipóteses e produções da turma',
        type: 'long',
      },
      {
        key: 'next',
        label: 'Desdobramentos e partilha com as famílias',
        type: 'long',
      },
    ],
  },
  {
    id: 'sintese-para-familias',
    title: 'Síntese ilustrada para famílias',
    description:
      'Carta pedagógica ilustrada com linguagem afetiva e direta para enviar ao final do ciclo.',
    category: 'Organização da turma',
    tool: 'relatorio',
    reportLayout: 'family-card',
    scope: 'individual',
    defaultTheme: 'pessego',
    fields: [
      { key: 'observationSubject', label: 'Para a família de' },
      { key: 'period', label: 'Período celebrado' },
      { key: 'teacher', label: 'Com carinho, equipe' },
      {
        key: 'context',
        label: 'O que vivemos juntos neste período',
        type: 'long',
      },
      {
        key: 'evidence',
        label: 'Brincadeiras e descobertas que marcaram este tempo',
        type: 'long',
      },
      {
        key: 'next',
        label: 'Convite para continuar explorando em casa',
        type: 'long',
      },
    ],
  },

  // =========================================================
  // 4. RECADOS ÀS FAMÍLIAS (8 modelos em 1, 2 ou 4 vias)
  // =========================================================
  notice(
    'reuniao',
    'reuniao',
    'Convite para reunião de famílias',
    'Data, horário, local e opção de 1, 2 ou 4 vias na mesma folha A4.',
    'Queridas famílias, convidamos vocês para conversar sobre a rotina, os projetos e as descobertas da turma. Contamos com a presença de um responsável.',
    [dateField, timeField, placeField],
  ),
  notice(
    'passeio',
    'passeio',
    'Autorização de passeio escolar',
    'Comunicado com prazo de entrega e canhoto destacável de autorização.',
    'A turma participará de uma saída pedagógica acompanhada pela equipe da escola. Envie o canhoto assinado até o prazo combinado, com garrafa de água e calçado confortável.',
    [dateField, timeField, placeField, returnDateField],
    true,
  ),
  notice(
    'materiais',
    'materiais',
    'Solicitação de materiais para oficina',
    'Bilhete prático com prazo para envio de materiais reutilizáveis ou escolares.',
    'Para nossa próxima oficina de criação, pedimos que enviem uma caixa pequena limpa e folhas para recorte. Caso não consigam enviar, avisem pela agenda para providenciarmos na escola.',
    [{ ...dateField, label: 'Prazo de entrega' }],
  ),
  notice(
    'evento',
    'evento',
    'Convite para mostra da turma',
    'Convite ilustrado para exposição de trabalhos e vivências com as famílias.',
    'Convidamos toda a família para visitar a nossa mostra de experiências. As crianças terão alegria em mostrar suas descobertas e produções pela sala.',
    [dateField, timeField, placeField],
  ),
  notice(
    'lembrete',
    'materiais',
    'Lembrete rápido de agenda',
    'Bilhete compacto (ideal para 4 vias por folha A4) para colar na agenda.',
    'Lembramos a importância de identificar com nome a garrafa de água, a mochila e as roupas extras da criança para facilitar a rotina diária.',
    [dateField],
  ),
  notice(
    'mudanca-rotina',
    'reuniao',
    'Aviso de mudança na rotina',
    'Informe com clareza alterações de horário, portão ou atividade especial.',
    'Nesta data, nossa turma terá uma alteração pontual na rotina. Pedimos atenção ao novo horário informado abaixo e à orientação da equipe na chegada.',
    [dateField, { ...timeField, label: 'Novo horário' }, placeField],
  ),
  notice(
    'sacola-leitura',
    'evento',
    'Sacola de leitura viajante',
    'Acompanha o empréstimo de livros para leitura em família e data de devolução.',
    'Hoje a sacola de leitura vai para casa! Reservem um momento tranquilo para ler juntos e devolvam o livro no prazo combinado para circular com outra família.',
    [dateField, returnDateField],
  ),
  notice(
    'encontro-portfolio',
    'reuniao',
    'Conversa individual e portfólio',
    'Agendamento rápido de horário individual para entrega ou leitura de portfólio.',
    'Reservamos um momento individual para conversar sobre o percurso da criança e compartilhar seus registros. Confirme sua presença pelo canal da escola.',
    [dateField, timeField, placeField],
  ),

  // =========================================================
  // 5. DOCUMENTOS ESCOLARES (6 formatos distintos)
  // =========================================================
  schoolDocument(
    'ata-de-reuniao',
    'ata',
    'Ata de reunião escolar',
    'Registro formal de participantes, pauta, síntese e encaminhamentos com assinaturas.',
    [
      { key: 'participants', label: 'Participantes' },
      { key: 'place', label: 'Local' },
      { key: 'agenda', label: 'Pauta do encontro', type: 'long' },
      { key: 'discussion', label: 'Síntese das conversas', type: 'long' },
      {
        key: 'commitments',
        label: 'Encaminhamentos, responsáveis e prazos',
        type: 'long',
      },
    ],
  ),
  schoolDocument(
    'declaracao-comparecimento',
    'declaracao',
    'Declaração de comparecimento',
    'Comprovante objetivo de presença em reunião ou atendimento com assinatura escolar.',
    [
      { key: 'person', label: 'Nome da pessoa' },
      { key: 'period', label: 'Horário ou período' },
      {
        key: 'statement',
        label: 'Finalidade do comparecimento',
        type: 'long',
        value:
          'Compareceu a esta unidade escolar para reunião pedagógica e acompanhamento da criança.',
      },
    ],
  ),
  schoolDocument(
    'termo-entrega',
    'entrega',
    'Termo de entrega de materiais',
    'Controle com quem entregou, quem recebeu, itens e assinaturas duplas.',
    [
      { key: 'person', label: 'Quem recebeu' },
      { key: 'sender', label: 'Quem entregou' },
      { key: 'items', label: 'Materiais e quantidades', type: 'long' },
      { key: 'conditions', label: 'Observações sobre o estado', type: 'long' },
    ],
  ),
  schoolDocument(
    'ficha-atendimento-familia',
    'ficha',
    'Ficha de atendimento à família',
    'Registro organizado de conversa individual com pontos tratados e combinados.',
    [
      { key: 'participants', label: 'Familiares e equipe presentes' },
      { key: 'place', label: 'Local do atendimento' },
      { key: 'context', label: 'Motivo do atendimento', type: 'long' },
      { key: 'discussion', label: 'Pontos conversados', type: 'long' },
      {
        key: 'commitments',
        label: 'Combinados e data de retorno',
        type: 'long',
      },
    ],
  ),
  schoolDocument(
    'lista-materiais-turma',
    'checklist',
    'Lista de conferência em checklist',
    'Cada linha vira automaticamente uma caixinha ☐ para conferir itens de passeio ou sala.',
    [
      { key: 'participants', label: 'Responsável pela conferência' },
      { key: 'place', label: 'Atividade ou espaço' },
      {
        key: 'items',
        label: 'Itens da lista (um por linha)',
        type: 'long',
        value:
          'Lista nominal da turma atualizada\nKit de higiene e troca de roupas\nGarrafas de água identificadas\nAutorizações assinadas pelas famílias\nCâmera ou caderno de registro',
      },
      { key: 'conditions', label: 'Observações gerais', type: 'long' },
    ],
  ),
  schoolDocument(
    'autorizacao-imagem-saida',
    'authorization',
    'Autorização formal de atividade',
    'Termo formal para participação em evento, projeto ou registro pedagógico.',
    [
      { key: 'child', label: 'Nome da criança' },
      { key: 'guardian', label: 'Responsável legal' },
      { key: 'phone', label: 'Telefone para contato' },
      {
        key: 'statement',
        label: 'Texto da autorização',
        type: 'long',
        value:
          'Autorizo a participação da criança na atividade pedagógica descrita acima, organizada pela equipe escolar, ciente dos horários e orientações informadas.',
      },
    ],
  ),

  // =========================================================
  // 6. FOTOS EM PDF (5 estilos reais diretos no montador)
  // =========================================================
  {
    id: 'album-portifolio',
    title: 'Portfólio destaque (1 foto/folha)',
    tool: 'fotos-em-pdf',
    category: 'Organização da turma',
    description: 'Uma fotografia grande por folha A4 vertical com espaço generoso para legenda.',
    visual: {
      title: 'Portfólio da turma',
      albumSubtitle: 'Registro de experiências',
      orientation: 'vertical',
      perPage: '1',
      margin: '15',
      crop: 'no',
      quality: 'high',
      printedHeader: 'yes',
      printedNumbering: 'yes',
      polaroid: 'no',
    },
  },
  {
    id: 'album-passeio',
    title: 'Antes e depois (2 fotos/folha)',
    tool: 'fotos-em-pdf',
    category: 'Organização da turma',
    description: 'Duas imagens lado a lado em A4 paisagem para comparar etapas ou passeios.',
    visual: {
      title: 'Registros do dia',
      albumSubtitle: 'Antes e depois da vivência',
      orientation: 'horizontal',
      perPage: '2',
      margin: '10',
      crop: 'no',
      quality: 'high',
      printedHeader: 'yes',
      printedNumbering: 'yes',
      polaroid: 'no',
    },
  },
  {
    id: 'album-sequencia',
    title: 'Sequência em 3 etapas',
    tool: 'fotos-em-pdf',
    category: 'Organização da turma',
    description: 'Três fotografias em faixa vertical mostrando início, desenvolvimento e resultado.',
    visual: {
      title: 'Sequência da atividade',
      albumSubtitle: 'Passo a passo em imagens',
      orientation: 'vertical',
      perPage: '3',
      margin: '10',
      crop: 'no',
      quality: 'high',
      printedHeader: 'yes',
      printedNumbering: 'yes',
      polaroid: 'no',
    },
  },
  {
    id: 'album-rotina',
    title: 'Mural compacto (4 fotos/folha)',
    tool: 'fotos-em-pdf',
    category: 'Organização da turma',
    description: 'Quatro fotos por folha A4 para documentar eventos, mostras e a rotina da semana.',
    visual: {
      title: 'Mural de fotos da turma',
      albumSubtitle: 'Acontecimentos da semana',
      orientation: 'vertical',
      perPage: '4',
      margin: '10',
      crop: 'no',
      quality: 'standard',
      printedHeader: 'yes',
      printedNumbering: 'yes',
      polaroid: 'no',
    },
  },
  {
    id: 'album-polaroid',
    title: 'Álbum Polaroid com molduras',
    tool: 'fotos-em-pdf',
    category: 'Organização da turma',
    description: 'Estilo retrato com moldura branca de fotografia e legenda centralizada abaixo.',
    visual: {
      title: 'Memórias da nossa turma',
      albumSubtitle: 'Álbum ilustrado',
      orientation: 'vertical',
      perPage: '4',
      margin: '10',
      crop: 'yes',
      quality: 'high',
      printedHeader: 'yes',
      printedNumbering: 'yes',
      polaroid: 'yes',
    },
  },

  // =========================================================
  // 7. POSTAGENS (8 modelos nas 6 novas composições + ilustrações reais)
  // =========================================================
  {
    id: 'arte-mostra',
    title: 'Convite festivo para mostra',
    tool: 'postagem',
    category: 'Organização da turma',
    description: 'Composição festiva com bandeirinhas no topo, data em destaque e sol ilustrado.',
    visual: {
      title: 'Mostra de experiências',
      body: 'Venha conhecer o que as crianças pesquisaram, criaram e prepararam para compartilhar com as famílias.',
      callout: 'Esperamos sua família!',
      background: '#FFF7DF',
      foreground: '#5C3C0A',
      font: 'Bricolage Grotesque',
      format: 'Vertical 4:5',
      composition: 'convite',
      figure: 'oficina-sol',
    },
  },
  {
    id: 'arte-reuniao',
    title: 'Aviso destacado de reunião',
    tool: 'postagem',
    category: 'Organização da turma',
    description: 'Cartaz limpo com faixa superior em destaque para envio rápido no WhatsApp.',
    visual: {
      title: 'Reunião de famílias',
      body: 'Vamos conversar sobre a rotina, os avanços e os próximos projetos da nossa turma.',
      callout: 'Confirme presença pela agenda',
      background: '#E8F2EC',
      foreground: '#1E5643',
      font: 'Noto Sans',
      format: 'Quadrado 1:1',
      composition: 'aviso',
      figure: 'bilhete-reuniao',
    },
  },
  {
    id: 'arte-boas-vindas',
    title: 'Boas-vindas · Caderno artesanal',
    tool: 'postagem',
    category: 'Organização da turma',
    description: 'Cartão papel creme com borda dupla delicada para abertura do semestre.',
    visual: {
      title: 'Sejam bem-vindos!',
      body: 'Uma nova etapa começa com acolhimento, brincadeiras e muitas descobertas na escola.',
      callout: 'Com carinho, equipe da turma',
      background: '#FCECE5',
      foreground: '#743628',
      font: 'Georgia',
      format: 'Horizontal 16:9',
      composition: 'caderno',
      figure: 'il-flower',
    },
  },
  {
    id: 'arte-agenda-semana',
    title: 'Agenda da semana · Editorial',
    tool: 'postagem',
    category: 'Organização da turma',
    description: 'Layout vertical organizado com barra lateral para resumir os momentos da semana.',
    visual: {
      title: 'Agenda da semana',
      body: 'Segunda: roda de histórias\nQuarta: oficina no jardim\nSexta: troca de livros da turma',
      callout: 'Confira os recados na mochila',
      background: '#F4F1E6',
      foreground: '#1E5643',
      font: 'Bricolage Grotesque',
      format: 'Vertical 4:5',
      composition: 'editorial',
      figure: 'il-book',
    },
  },
  {
    id: 'arte-registro-foto',
    title: 'Registro com foto Polaroid',
    tool: 'postagem',
    category: 'Organização da turma',
    description: 'Moldura estilo Polaroid com fita adesiva no topo para destacar uma foto da turma.',
    visual: {
      title: 'Nossas descobertas',
      body: 'Hoje exploramos cores, tintas e diferentes traços na oficina ao ar livre.',
      callout: 'Pergunte como foi em casa!',
      background: '#EFE8F8',
      foreground: '#3F2D59',
      font: 'Georgia',
      format: 'Quadrado 1:1',
      composition: 'memoria',
      figure: 'il-brush',
    },
  },
  {
    id: 'arte-passeio',
    title: 'Comunicado ilustrado de passeio',
    tool: 'postagem',
    category: 'Organização da turma',
    description: 'Selo circular central com ilustração em destaque para avisos de saídas.',
    visual: {
      title: 'Dia de passeio!',
      body: 'Faremos uma visita pedagógica especial. Envie a autorização assinada e garrafa de água.',
      callout: 'Chegada no horário combinado',
      background: '#E5F0F6',
      foreground: '#1B435E',
      font: 'Bricolage Grotesque',
      format: 'Quadrado 1:1',
      composition: 'ilustrado',
      figure: 'bilhete-passeio',
    },
  },
  {
    id: 'arte-agradecimento',
    title: 'Agradecimento às famílias',
    tool: 'postagem',
    category: 'Organização da turma',
    description: 'Mensagem acolhedora com borboleta ilustrada para encerramento de projetos.',
    visual: {
      title: 'Obrigada, famílias!',
      body: 'Agradecemos por acompanhar cada passo, conversa e descoberta da nossa turma neste projeto.',
      callout: 'Até o próximo encontro!',
      background: '#FBF3EC',
      foreground: '#6F3B27',
      font: 'Georgia',
      format: 'Horizontal 16:9',
      composition: 'caderno',
      figure: 'oficina-borboleta',
    },
  },
  {
    id: 'arte-troca-livros',
    title: 'Dia da troca de livros',
    tool: 'postagem',
    category: 'Organização da turma',
    description: 'Convite alegre com bandeirinhas para estimular a leitura compartilhada.',
    visual: {
      title: 'Roda de troca de livros',
      body: 'Traga um livro identificado para compartilhar com um colega e leve uma nova história para casa.',
      callout: 'Participação livre da turma',
      background: '#E8F2EC',
      foreground: '#1E5643',
      font: 'Bricolage Grotesque',
      format: 'Stories 9:16',
      composition: 'convite',
      figure: 'il-story',
    },
  },

  // =========================================================
  // 8. PAINÉIS A4 (6 Murais em mosaico + 6 Kits ilustrados)
  // =========================================================
  {
    id: 'boas-vindas',
    title: 'Boas-vindas à turma',
    tool: 'painel',
    category: 'Painéis',
    description: 'Mural ilustrado de arco-íris e flores em mosaico A4 (2 × 2 retrato + guia).',
  },
  {
    id: 'mural-semana-descobertas',
    title: 'Faixa semana das descobertas',
    tool: 'painel',
    category: 'Painéis',
    description: 'Faixa horizontal em 3 folhas A4 (3 × 1) com bandeirinhas, sol e passarinho.',
    panel: {
      layout: 'banner',
      landscape: true,
      strip: true,
      art: 'oficina-ilustrada.png',
    },
    mosaicLabels: ['Começo', 'Investigação', 'Partilha'],
  },
  {
    id: 'mural-ciclo-borboleta',
    title: 'Mural da lagarta à borboleta',
    tool: 'painel',
    category: 'Painéis',
    description: 'Linha do tempo em 4 folhas A4 paisagem ilustrada com ovo, lagarta, crisálida e borboleta.',
    panel: {
      layout: 'timeline',
      landscape: true,
      art: 'oficina-borboleta.png',
    },
    mosaicLabels: ['Ovo', 'Lagarta', 'Crisálida', 'Borboleta'],
  },
  {
    id: 'mural-investigacoes',
    title: 'Mural de investigações da turma',
    tool: 'painel',
    category: 'Painéis',
    description: 'Galeria em mosaico A4 (2 × 2 paisagem) para expor perguntas, desenhos e descobertas.',
    panel: {
      layout: 'gallery',
      landscape: true,
      art: 'paineis.webp',
    },
    mosaicLabels: [
      'O que queremos saber?',
      'Como investigamos',
      'O que descobrimos',
      'Próxima pergunta',
    ],
  },
  {
    id: 'mural-aniversariantes',
    title: 'Mural de aniversariantes (12 meses)',
    tool: 'painel',
    category: 'Painéis',
    description: 'Mosaico 2 × 2 paisagem com os 12 meses do ano coloridos e linhas para os nomes.',
    panel: {
      layout: 'birthday',
      landscape: true,
      art: 'bilhete-evento.webp',
    },
    mosaicLabels: [
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
    id: 'mural-tempo',
    title: 'Observatório do tempo e natureza',
    tool: 'painel',
    category: 'Painéis',
    description: 'Mural vertical (2 × 2 retrato) para acompanhar sol, chuva, lua e flores com a turma.',
    panel: {
      layout: 'chart',
      landscape: false,
      art: 'atividades.webp',
    },
    mosaicLabels: ['Sol', 'Regador', 'Lua', 'Flor'],
  },
  {
    id: 'chamadinha',
    title: 'Chamadinha da turma',
    tool: 'painel',
    category: 'Painéis',
    description: 'Cabeçalho recortável, quadros de presença e 24 cartões editáveis para os nomes.',
    poster: [
      'Presentes',
      'Hoje faltaram',
      ...Array.from({ length: 24 }, () => 'Nome: __________________'),
    ],
  },
  {
    id: 'painel-rotina',
    title: 'Nossa rotina ilustrada',
    tool: 'painel',
    category: 'Painéis',
    description: 'Cabeçalho + 8 cartões ilustrados com todos os momentos do dia para ordenar na parede.',
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
    id: 'aniversariantes',
    title: 'Kit cartões de aniversariantes',
    tool: 'painel',
    category: 'Painéis',
    description: 'Cabeçalho + 12 cartões individuais dos meses em tiras recortáveis.',
    kit: 'tiras',
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
    id: 'painel-ajudantes',
    title: 'Ajudantes do dia',
    tool: 'painel',
    category: 'Painéis',
    description: '6 placas ilustradas com funções da turma para fazer rodízio semanal.',
    kit: 'placas',
    poster: ['Livros', 'Roda', 'Brinquedos', 'Jardim', 'Pintura', 'Lanche'],
  },
  {
    id: 'kit-cantinhos',
    title: 'Placas dos cantinhos da sala',
    tool: 'painel',
    category: 'Painéis',
    description: '6 placas ilustradas para identificar estações de leitura, arte, construção e jogos.',
    kit: 'placas',
    poster: ['Leitura', 'Arte', 'Construção', 'Jogos', 'Histórias', 'Natureza'],
  },
  {
    id: 'kit-etiquetas',
    title: 'Etiquetas ilustradas de materiais',
    tool: 'painel',
    category: 'Painéis',
    description: '8 cartões ilustrados para colar em cestos, caixas e armários compartilhados.',
    poster: ['Lápis', 'Pincel', 'Blocos', 'Livros', 'Bola', 'Pano', 'Copo', 'Maçã'],
  },
]

const fruitWorksheet = classroom.find((item) => item.id === 'tabela-de-frutas')!
const customWorksheet: ClassroomItem = {
  ...fruitWorksheet,
  id: 'criar-contagem',
  title: 'Minha ficha de contagem',
  description:
    'Escolha o conjunto de figuras, defina quantidades de 1 a 6 e personalize a pergunta final.',
  task: {
    ...fruitWorksheet.task!,
    supplies: 'Ficha impressa e lápis. Tampinhas podem apoiar a contagem um a um.',
    steps: [
      'Conte um grupo de figuras por vez.',
      'Anote a quantidade na coluna da direita.',
      'Responda à pergunta comparativa no final da folha.',
    ],
  },
}

const pairTemplate = classroom.find((item) => item.id === 'pares-ilustrados')!
const customPairs: ClassroomItem = {
  ...pairTemplate,
  id: 'criar-pares',
  title: 'Minha ficha de pareamento',
  description:
    'Escolha o tema das figuras e embaralhe a segunda coluna com um clique.',
  task: {
    ...pairTemplate.task!,
    supplies: 'Ficha impressa e lápis.',
    steps: [
      'Observe as figuras das duas colunas.',
      'Ligue cada figura à sua correspondente.',
      'Explique como encontrou cada par.',
    ],
  },
}

const traceTemplate = classroom.find((item) => item.id === 'tracado-borboleta')!
const customTrace: ClassroomItem = {
  ...traceTemplate,
  id: 'criar-tracado',
  title: 'Minha ficha de traçado motor',
  description:
    'Escolha o tema das pistas e a quantidade de caminhos (3 ou 4) para cobrir com o lápis.',
  task: {
    ...traceTemplate.task!,
    supplies: 'Folha A4 impressa e giz de cera grosso ou lápis.',
    steps: [
      'Passe o dedo indicador sobre cada caminho pontilhado.',
      'Cubra os traçados ligando o começo ao destino.',
    ],
  },
}

export function findClassroomItem(id: string | undefined) {
  if (id === customWorksheet.id) return customWorksheet
  if (id === customPairs.id) return customPairs
  if (id === customTrace.id) return customTrace
  return classroom.find((item) => item.id === id)
}

export function fallbackClassroomId(tool: Tool): string {
  switch (tool) {
    case 'atividade':
      return 'tabela-de-frutas'
    case 'plano-de-aula':
      return 'plano-animais'
    case 'relatorio':
      return 'registro-individual'
    case 'documento':
      return 'reuniao'
    case 'fotos-em-pdf':
      return 'album-portifolio'
    case 'postagem':
      return 'arte-mostra'
    case 'painel':
      return 'boas-vindas'
  }
}
