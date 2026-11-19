import type { AgeBand, ClassroomItem, Field } from './classroom-catalog'

const section = 'Organização da turma'
const long = (key: string, label: string, value?: string): Field => ({
  key,
  label,
  type: 'long',
  value,
})
const short = (key: string, label: string): Field => ({ key, label })
type Exercise = [string, string, string, string, string, string]
const exercises: Exercise[] = [
  [
    'observar-passaros',
    'Pré I',
    'O pássaro e seu caminho',
    'Observe o pássaro. Desenhe onde ele pode pousar e conte o caminho.',
    'Pássaro',
    'Lugar de pouso|Caminho no céu',
  ],
  [
    'comparar-frutas',
    'Pré I',
    'Qual fruta é diferente?',
    'Compare a maçã com a banana. Desenhe um detalhe de cada fruta.',
    'Maçã|Banana',
    'Detalhe da maçã|Detalhe da banana',
  ],
  [
    'pintar-objeto',
    'Pré I',
    'Uma marca com o pincel',
    'Imagine marcas feitas com um pincel. Faça duas que sejam diferentes.',
    'Pincel',
    'Marca longa|Marca curta',
  ],
  [
    'observar-bola',
    'Pré I',
    'Por onde a bola passou?',
    'Desenhe uma marca de onde a bola começa e uma de onde ela para.',
    'Bola',
    'Saída da bola|Chegada da bola',
  ],
  [
    'livro-personagem',
    'Pré I',
    'Quem saiu do livro?',
    'Desenhe alguém que apareceu na história que ouvimos e o lugar em que estava.',
    'Livro',
    'Personagem|Lugar',
  ],
  [
    'copo-cheio-vazio',
    'Pré I',
    'Dois copos, duas ideias',
    'Desenhe água até a metade do primeiro copo e até perto da borda do segundo.',
    'Copo',
    'Até a metade|Perto da borda',
  ],
  [
    'cuidar-da-flor',
    'Pré II',
    'O que ajuda a flor a crescer?',
    'Desenhe duas coisas de que uma planta precisa. Escreva ou dite o nome de cada uma.',
    'Flor do dia',
    'Primeiro cuidado|Segundo cuidado',
  ],
  [
    'blocos-alturas',
    'Pré II',
    'Duas torres de blocos',
    'Desenhe uma torre de 3 blocos e outra de 5. Registre a diferença.',
    'Blocos',
    'Torre de 3|Torre de 5|Quantos blocos a mais?',
  ],
  [
    'recado-livro',
    'Pré II',
    'Um recado sobre o livro',
    'Escolha alguém para recomendar o livro. Escreva ou dite por que gostou dele.',
    'Livro',
    'Para quem|Minha recomendação',
  ],
  [
    'planejar-percurso',
    'Pré II',
    'Um mapa até a porta',
    'Marque um ponto de partida. Desenhe um caminho com duas curvas até a porta.',
    'Chegada',
    'Mapa do caminho|O que encontrei pelo caminho',
  ],
  [
    'medir-macas',
    'Pré II',
    'Medição com maçãs desenhadas',
    'Imagine uma régua de maçãs. Desenhe um objeto que mede 3 maçãs e outro que mede 5.',
    'Maçã',
    'Comprimento de 3|Comprimento de 5',
  ],
]
const activitySheets: ClassroomItem[] = exercises.map(
  ([id, age, title, description, art, spaces]) => ({
    id,
    age: age as AgeBand,
    title,
    description,
    tool: 'atividade',
    category: 'Atividades',
    task: {
      mode: 'answer',
      supplies:
        'Lápis, folha impressa e as figuras em tamanho ampliado quando necessário.',
      steps: [
        'Converse sobre o que a figura mostra.',
        description,
        'Convide a criança a explicar seu registro.',
      ],
      adaptation:
        'Aceite registro oral, desenho, letras móveis ou registro escrito pela professora.',
      prompts: spaces.split('|'),
      illustrations: art.split('|'),
    },
  }),
)
type Experience = [
  string,
  AgeBand,
  string,
  string,
  string,
  string,
  string,
  string,
]
const experiences: Experience[] = [
  [
    'roda-livros-capistas',
    'Pré I',
    'Caça às pistas da capa',
    'Quatro livros ilustrados.',
    'Espalhe as capas e note o que chama a atenção.',
    'Convide cada dupla a levantar uma hipótese pela imagem.',
    'Leia uma história e volte às hipóteses da turma.',
    'Aceite apontar figuras ou escolher entre duas capas.',
  ],
  [
    'percurso-bolas-parceiras',
    'Pré I',
    'Bolas em dupla',
    'Bolas leves e tiras largas de papel para marcar o chão.',
    'Marquem dois pontos de encontro.',
    'Rolam a bola em duplas e mudam a distância após cada tentativa.',
    'Conversem sobre quais gestos funcionaram.',
    'Permita rolar sentado ou trabalhar com uma rampa curta.',
  ],
  [
    'oficina-marcas-pinceis',
    'Pré I',
    'Pincéis, papel e descobertas',
    'Pincéis largos, água e papel escuro próprio para pintura.',
    'Mostre o traço de um pincel com água.',
    'Convidem as crianças a experimentar pressão e direção.',
    'Compare traços e guarde as descobertas por foto ou fala.',
    'Disponibilize cabo engrossado e bandeja firme.',
  ],
  [
    'sombras-animais-roda',
    'Pré I',
    'Sombras que contam histórias',
    'Cartões de animais e luz indireta numa parede.',
    'Olhem as silhuetas e escolham um personagem.',
    'Crie um pequeno percurso narrado com as sombras.',
    'Recontem os acontecimentos em três momentos.',
    'Use os cartões à luz natural para quem prefere evitar contrastes fortes.',
  ],
  [
    'colecao-folhas-cores',
    'Pré I',
    'Uma coleção de folhas',
    'Folhas caídas limpas e bandejas rasas.',
    'Observem forma e textura antes de separar.',
    'Experimentem critérios de agrupamento e perguntem por que uma folha entra no grupo.',
    'Montem uma coleção com os critérios escolhidos.',
    'Ofereça lupas e deixe as crianças descreverem por gestos.',
  ],
  [
    'assembleia-de-combinados',
    'Pré II',
    'Assembleia dos combinados',
    'Cartões em branco e canetas grossas.',
    'Escolham uma situação que merece um combinado.',
    'Em duplas, proponham maneiras de cuidar da turma.',
    'Registrem um acordo e decidam quando retomá-lo.',
    'Aceite propostas por desenho e leia os registros em voz alta.',
  ],
  [
    'trilha-de-mapas',
    'Pré II',
    'Mapas para outra dupla',
    'Fita de papel, folhas e lápis.',
    'Façam um percurso com três pontos conhecidos.',
    'Cada dupla desenha um mapa para outra dupla tentar seguir.',
    'Revisem qual indicação ajudou e qual ficou faltando.',
    'Ofereça posições de referência fixas e percurso acessível.',
  ],
  [
    'horta-observacao-rega',
    'Pré II',
    'Diário de rega da horta',
    'Regador pequeno e tabela impressa com dias.',
    'Observem a terra e comparem um ponto úmido a um seco.',
    'Decidam onde regar e registrem a decisão com a data.',
    'Combinem quando observar a mudança novamente.',
    'Organize funções de observação e anotação sem exigir que todos manipulem água.',
  ],
  [
    'construir-ponte',
    'Pré II',
    'Ponte para a bola',
    'Blocos grandes, tiras de papelão e uma bola leve.',
    'Apresente uma distância curta para atravessar.',
    'Testem bases, largura e altura até que a bola passe.',
    'Desenhem uma solução e expliquem uma alteração.',
    'Faça os testes sobre uma mesa firme e ofereça blocos leves.',
  ],
  [
    'noticias-da-turma-roda',
    'Pré II',
    'Notícias da turma',
    'Papel grande, três fotos autorizadas ou desenhos e canetas.',
    'Escolham um acontecimento recente da turma.',
    'Organizem o que, quando e onde aconteceu.',
    'Ditem um texto e escolham uma imagem para acompanhá-lo.',
    'Leia o texto em voz alta e aceite participação por gestos e seleção de imagens.',
  ],
]
const guided: ClassroomItem[] = experiences.map(
  ([id, age, title, supplies, first, next, last, adaptation]) => ({
    id,
    age,
    title,
    description: next,
    tool: 'atividade',
    category: 'Atividades',
    task: {
      mode: 'experience',
      supplies,
      steps: [first, next, last],
      adaptation,
      guide:
        'Registre uma ação ou fala, o contexto em que ocorreu e uma proposta para retomada.',
    },
  }),
)
const extras: Experience[] = [
  [
    'cantos-voz-familiar',
    'Berçário',
    'Voz conhecida e pausas',
    'Cantos curtos conhecidos pelas famílias.',
    'Aproxime-se e espere contato visual.',
    'Cante por alguns instantes e faça pausas para perceber respostas.',
    'Retome um trecho se a criança sinalizar interesse.',
    'Use volume baixo e permita afastamento.',
  ],
  [
    'cestos-tecidos-tato',
    'Berçário',
    'Cesto de texturas macias',
    'Retalhos grandes, lavados e sem partes soltas.',
    'Mostre uma textura com a mão aberta.',
    'Coloque dois tecidos ao alcance e observe qual recebe atenção.',
    'Registre um gesto e guarde o material de forma segura.',
    'Mantenha o rosto livre e supervisione de perto.',
  ],
  [
    'marcas-dagua',
    'Maternal',
    'Marcas de água no papel',
    'Pincéis largos, água em recipiente estável e papel escuro.',
    'Mostre a marca que a água deixa.',
    'Testem traços grossos e finos em duplas.',
    'Observem mudanças conforme o papel seca.',
    'Ofereça cabos mais grossos e recipiente raso.',
  ],
  [
    'escolher-recontar-cartoes',
    'Maternal',
    'História em dois cartões',
    'Livro curto e dois cartões com cenas.',
    'Escolham um cartão para antecipar um acontecimento.',
    'Leiam o livro e recontem uma parte com os cartões.',
    'Troquem as cenas e repitam o reconto por gestos.',
    'Aceite apontar e escolher sem exigir fala.',
  ],
  [
    'balanco-blocos-grandes',
    'Maternal',
    'Torres de blocos grandes',
    'Blocos leves de encaixe e base ampla.',
    'Observem qual bloco fica firme na base.',
    'Tentem construir uma torre em duplas.',
    'Conversem sobre o que mudou quando a torre caiu.',
    'Ofereça blocos leves ao alcance e uma base firme.',
  ],
]
const planSeeds = [
  ...extras,
  ...experiences.filter((row) =>
    [
      'roda-livros-capistas',
      'oficina-marcas-pinceis',
      'trilha-de-mapas',
      'construir-ponte',
    ].includes(row[0]),
  ),
]
const plans: ClassroomItem[] = planSeeds.map(
  ([id, age, title, supplies, first, next, last, adaptation]) => ({
    id: 'plano-' + id,
    age,
    title,
    description: next,
    tool: 'plano-de-aula',
    category: section,
    fields: [
      long('objective', 'Objetivo da aula', next),
      long('preparation', 'Preparação e materiais', supplies),
      long(
        'conduct',
        'Etapas e duração',
        '4 min · ' +
          first +
          '\n' +
          (age === 'Berçário' ? 6 : 12) +
          ' min · ' +
          next +
          '\n4 min · ' +
          last,
      ),
      long(
        'observation',
        'O que observar',
        adaptation +
          ' Registre as escolhas e estratégias observadas na proposta.',
      ),
    ],
  }),
)
const contexts: Record<AgeBand, [string, string, string][]> = {
  Berçário: [
    [
      'Chegada e vínculo',
      'Registre quem acolheu e como o bebê respondeu à aproximação.',
      'Observe gestos de busca por segurança.',
    ],
    [
      'Tato e texturas',
      'Descreva o tecido oferecido e a duração da exploração.',
      'Anote gestos de aproximação e pausa.',
    ],
    [
      'Escuta de vozes',
      'Identifique os sons presentes e a distância.',
      'Descreva olhares, vocalizações e pausas.',
    ],
    [
      'Deslocamento no tapete',
      'Descreva posição e recursos disponíveis.',
      'Registre a sequência de movimentos.',
    ],
    [
      'Encontro diante do espelho',
      'Registre como o espelho foi apresentado.',
      'Descreva expressões e iniciativas.',
    ],
  ],
  Maternal: [
    [
      'Escolhas na roda',
      'Descreva as opções que a turma recebeu.',
      'Anote como as escolhas foram comunicadas.',
    ],
    [
      'Brincadeira com blocos',
      'Descreva os materiais e o espaço.',
      'Registre tentativas de empilhar e reorganizar.',
    ],
    [
      'Ritmos da fala',
      'Identifique a música ou brincadeira de repetição.',
      'Anote respostas por fala, gesto ou movimento.',
    ],
    [
      'Percurso no pátio',
      'Registre pontos do percurso e apoios disponíveis.',
      'Descreva estratégias de deslocamento.',
    ],
    [
      'Parceria no faz de conta',
      'Descreva a cena e os objetos disponíveis.',
      'Anote trocas de papéis, gestos ou falas.',
    ],
  ],
  'Pré I': [
    [
      'Reconto de história',
      'Identifique o livro e as cenas exploradas.',
      'Registre conexões entre as cenas.',
    ],
    [
      'Traços no papel',
      'Identifique suportes e instrumentos de desenho.',
      'Anote como pressão e direção mudaram os traços.',
    ],
    [
      'Escolhas no jogo de pares',
      'Registre as imagens e a organização das duplas.',
      'Descreva estratégias para encontrar pares.',
    ],
    [
      'Coleção de folhas',
      'Descreva quais folhas estavam disponíveis.',
      'Registre o critério escolhido para agrupá-las.',
    ],
    [
      'Contagem de figuras',
      'Registre os grupos de figuras apresentados.',
      'Descreva como cada quantidade foi registrada.',
    ],
  ],
  'Pré II': [
    [
      'Mapa de um percurso',
      'Registre os pontos de referência do caminho.',
      'Descreva as indicações incluídas no mapa.',
    ],
    [
      'Diário da horta',
      'Registre data, planta e condição da terra.',
      'Anote as pistas usadas para decidir sobre a rega.',
    ],
    [
      'Combinados da turma',
      'Identifique qual situação iniciou a conversa.',
      'Registre propostas, justificativas e retomadas.',
    ],
    [
      'Escrita de um bilhete',
      'Descreva o destinatário e a finalidade escolhida.',
      'Anote como o texto foi ditado, lido e revisado.',
    ],
    [
      'Experimento com torres',
      'Descreva a base e a quantidade inicial de blocos.',
      'Registre as mudanças entre os testes.',
    ],
  ],
}
const reports: ClassroomItem[] = Object.entries(contexts).flatMap(
  ([age, items], a) =>
    items.flatMap(([label, context, evidence], i) =>
      [false, true].map((group) => ({
        id:
          'registro-referencia-' +
          a +
          '-' +
          i +
          (group ? '-turma' : '-crianca'),
        age: age as AgeBand,
        title:
          (group ? 'Registro coletivo: ' : 'Registro individual: ') + label,
        description: context,
        category: section,
        tool: 'relatorio' as const,
        scope: group ? ('collective' as const) : ('individual' as const),
        fields: [
          short(
            'observationSubject',
            group ? 'Turma observada' : 'Identificação no registro',
          ),
          short('period', 'Período observado'),
          long('context', 'Contexto da observação'),
          long(
            'observation',
            group
              ? 'Estratégias e interações da turma'
              : 'Ações, falas e gestos da criança',
          ),
          long('evidence', 'Evidência a registrar', evidence),
          long(
            'next',
            group
              ? 'Retomada da proposta com a turma'
              : 'Próximo apoio à criança',
          ),
        ],
      })),
    ),
)
export const practiceModels = [
  ...activitySheets,
  ...guided,
  ...plans,
  ...reports,
]
