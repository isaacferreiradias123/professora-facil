import type { AgeBand, ClassroomItem, Field, Task } from './classroom-catalog'

type Worksheet = [
  title: string,
  instruction: string,
  figures: string,
  answers: string,
  mode?: Task['mode'],
]
const worksheets: Worksheet[] = [
  [
    'Pegadas do pátio',
    'Desenhe por onde você entrou no pátio e faça uma marca no lugar em que parou.',
    'Chegada',
    'Caminho|Lugar da parada',
  ],
  [
    'Pares da caixa de pintura',
    'Ligue cada figura da esquerda à figura correspondente da direita.',
    'Pincel|Lápis|Pano|Copo',
    'Pincel|Lápis|Pano|Copo',
    'match',
  ],
  [
    'O que a cor conta?',
    'Use duas cores para inventar marcas diferentes. Aponte sua preferida.',
    'Pincel',
    'Marca com a primeira cor|Marca com a segunda cor',
  ],
  [
    'Três cestos de bichos',
    'Conte cada grupo e registre a quantidade com marcas ou números.',
    'Gato|Cão|Pato',
    'Gato|Cão|Pato',
    'count',
  ],
  [
    'Onde moram os livros?',
    'Desenhe um lugar de guardar os livros e outro em que você gosta de ler.',
    'Livro',
    'Lugar de guardar|Lugar de ler',
  ],
  [
    'Bola perto e bola longe',
    'Desenhe uma bola perto da porta e outra longe dela.',
    'Bola|Chegada',
    'Perto da porta|Longe da porta',
  ],
  [
    'O caminho da fruta até a mesa',
    'Olhe as cenas. Numere os espaços na ordem em que os acontecimentos podem ocorrer.',
    'Lavar a fruta|Servir à mesa|Colher a fruta',
    'Lavar a fruta|Servir à mesa|Colher a fruta',
    'story',
  ],
  [
    'Uma peça que faz falta',
    'Observe círculo e triângulo. Desenhe um objeto que você conhece com cada forma.',
    'Círculo|Triângulo',
    'Objeto circular|Objeto triangular',
  ],
  [
    'Arrume as mesas depois da oficina',
    'Observe as quatro figuras. Desenhe cada objeto no quadro da mesa em que ele vai ficar.',
    'Pincel|Lápis|Copo|Maçã',
    'Pincel|Lápis|Copo|Maçã',
    'sort',
  ],
  [
    'Ninho e chão',
    'Imagine um local seguro para um pássaro pousar e outro para procurar comida.',
    'Pássaro',
    'Lugar de pouso|Lugar de procurar alimento',
  ],
  [
    'Quantidade no pomar',
    'Conte as três fileiras e registre quantas frutas aparecem em cada uma.',
    'Maçã|Pera|Morango',
    'Maçã|Pera|Morango',
    'count',
  ],
  [
    'Bilhete para guardar a bola',
    'Escreva ou dite um lembrete. Indique a quem se destina e onde guardar a bola.',
    'Bola',
    'Para quem|Onde guardar|Meu lembrete',
  ],
  [
    'Pares para arrumar as mesas',
    'Ligue os pares e diga qual objeto precisa ficar na mesa de pintura.',
    'Bola|Blocos|Pincel|Copo',
    'Bola|Blocos|Pincel|Copo',
    'match',
  ],
  [
    'A borboleta em quatro cenas',
    'Escreva nos quadrinhos os números das figuras, do ovo até a borboleta.',
    'Lagarta|Borboleta|Ovo|Crisálida',
    'Lagarta|Borboleta|Ovo|Crisálida',
    'story',
  ],
  [
    'Duas maneiras de chegar',
    'Desenhe um caminho direto e outro que passe por um lugar de sua escolha.',
    'Chegada',
    'Caminho direto|Caminho com parada',
  ],
  [
    'Cartão de observação do céu',
    'Desenhe o céu como está agora. Marque um detalhe que deseja comparar amanhã.',
    'Sol',
    'Céu observado|Detalhe para comparar',
  ],
  [
    'Mais perto de dez',
    'Conte as figuras, desenhe o que falta em um dos grupos para chegar a dez e explique como pensou.',
    'Pássaro|Cão|Pato',
    'Pássaro|Cão|Pato',
    'count',
  ],
  [
    'Inventar etiquetas',
    'Desenhe ou escreva duas etiquetas para separar objetos diferentes em caixas.',
    'Blocos|Livro',
    'Etiqueta da primeira caixa|Etiqueta da segunda caixa',
  ],
  [
    'Mapa de ruídos e silêncio',
    'Desenhe onde ouviu um som e onde encontrou um lugar silencioso.',
    'Pássaro',
    'Onde ouvi|Lugar silencioso|Como comparei',
  ],
  [
    'História com outra chegada',
    'Desenhe um personagem, invente um lugar de chegada e escreva ou dite a última frase.',
    'Livro|Chegada',
    'Personagem|Lugar de chegada|Frase final',
  ],
]
const bands: AgeBand[] = ['Berçário', 'Maternal', 'Pré I', 'Pré II']
type Experience = [
  title: string,
  objective: string,
  supplies: string,
  steps: string,
  adaptation: string,
  evidence: string,
]
const groups: Experience[][] = [
  [
    [
      'Voz que vai e volta',
      'Perceber alternância entre voz e pausa',
      'Tapete firme e adulto de referência',
      'Sente próximo|Cante uma frase curta|Espere um gesto antes de retomar',
      'Use um ritmo conhecido e ofereça silêncio',
      'Olhar, gesto ou vocalização durante a pausa',
    ],
    [
      'Som à esquerda e à direita',
      'Acompanhar a origem de um som suave',
      'Um chocalho grande fechado e higienizado',
      'Mostre o objeto|Produza som suave de um lado|Repita do outro após a pausa',
      'Mantenha a fonte sonora visível se preferir',
      'Movimento da cabeça ou mudança de expressão',
    ],
    [
      'Espelho de expressões',
      'Compartilhar atenção pelo rosto',
      'Espelho inquebrável fixado em altura segura',
      'Aproxime o bebê com apoio|Sorria e espere|Nomeie a expressão que apareceu',
      'Afaste o espelho se houver desconforto',
      'Olhares alternados entre o rosto e o reflexo',
    ],
    [
      'Mudança de cor no tecido',
      'Acompanhar o deslocamento de cores',
      'Tecidos grandes, limpos e sem fios soltos',
      'Mostre um tecido|Mova devagar no campo de visão|Pare quando o bebê sinalizar',
      'Mantenha o tecido afastado do rosto',
      'Tempo de atenção e gesto de alcance',
    ],
    [
      'Superfícies para tocar',
      'Explorar texturas com as mãos',
      'Tapete firme, tecido liso e tecido rugoso bem presos',
      'Apresente uma textura|Espere o toque|Ofereça a segunda sem forçar a mão',
      'Aproxime do lado que o bebê usa com mais conforto',
      'Superfície escolhida e maneira de tocar',
    ],
  ],
  [
    [
      'Marcha e pausa',
      'Relacionar sinais e movimento',
      'Espaço livre, pandeiro',
      'Combine um som para caminhar|Pare de tocar|Convide outra criança a fazer o sinal',
      'Permita acompanhar com mãos ou sentado',
      'Resposta às pausas e novas sugestões',
    ],
    [
      'Pontes para brinquedos grandes',
      'Explorar apoio e vão',
      'Blocos grandes, tábuas leves próprias para brincar',
      'Demonstre um vão|Teste com um brinquedo|Compare com uma ponte de base maior',
      'Ofereça blocos leves de fácil pega',
      'Mudança feita depois da primeira tentativa',
    ],
    [
      'Sacola de objetos úteis',
      'Associar objetos a ações cotidianas',
      'Sacola de tecido, escova grande, copo e pano',
      'Convide a retirar um item|Mostre uma ação|Peça outra forma de usar ou representar',
      'Posicione tudo à vista antes de escolher',
      'Gesto escolhido para representar o objeto',
    ],
    [
      'Passeio das sombras',
      'Investigar a mudança de sombra',
      'Lanterna de baixa potência e parede livre',
      'Ilumine uma figura grande|Aproxime a figura da luz|Compare as duas sombras',
      'Permita observar de longe e evite apontar a luz ao rosto',
      'Reações às mudanças de tamanho',
    ],
    [
      'Tour pelo cantinho de leitura',
      'Escolher e devolver livros do acervo',
      'Cestos baixos e livros de imagem',
      'Escolha um livro|Observe uma página em dupla|Devolva no cesto indicado',
      'Marque os cestos com imagens',
      'Como a criança escolheu e voltou ao cesto',
    ],
  ],
  [
    [
      'Oficina de sinais para grupos',
      'Criar combinados visuais para agir em grupo',
      'Papel, lápis grossos, cartões',
      'Elabore um sinal de pausa|Combine um sinal de troca|Teste com uma brincadeira',
      'Aceite apontar ou desenhar o sinal',
      'Como o grupo interpretou os sinais',
    ],
    [
      'Jogo dos sons do ambiente',
      'Comparar sons e locais',
      'Papel, pranchetas, giz',
      'Escute em dois lugares|Desenhe a fonte do som|Conte onde havia menos ruído',
      'Ofereça um local confortável para escutar',
      'Comparação entre os dois lugares',
    ],
    [
      'Leitura de uma imagem sem texto',
      'Construir sentidos a partir de detalhes visuais',
      'Livro de imagem ou reprodução autorizada',
      'Mostre um detalhe|Convide a observar o todo|Peça que cada dupla explique sua interpretação',
      'Mostre a imagem perto da criança se necessário',
      'Detalhes usados para explicar uma hipótese',
    ],
    [
      'Barcos que levam objetos',
      'Observar se formas carregam pesos diferentes',
      'Bacia rasa, bandejas e objetos grandes, usados com supervisão',
      'Monte dois barcos|Teste com o mesmo peso|Compare quando cada um afunda',
      'Permita observar ou registrar sem tocar na água',
      'Hipótese e mudanças após observar',
    ],
    [
      'Caixas de cheiros conhecidos',
      'Descrever e comparar aromas suaves',
      'Recipientes fecháveis e materiais permitidos pela escola',
      'Apresente um aroma|Peça uma associação|Agrupe os aromas por semelhança',
      'Permita recusar e ofereça pista visual',
      'Palavras ou referências escolhidas',
    ],
  ],
  [
    [
      'Cartógrafos da sala',
      'Desenhar referências para orientar outra pessoa',
      'Prancheta, papel, marcadores',
      'Escolha três pontos|Desenhe um caminho entre eles|Troque o mapa e siga as pistas',
      'Use percurso acessível e pistas em imagens',
      'Indicações compreendidas pela outra dupla',
    ],
    [
      'Roda de decisões sobre o jardim',
      'Justificar escolhas e registrar acordos',
      'Cartões, papel grande, lápis',
      'Liste cuidados possíveis|Escolha prioridades|Registre responsáveis no mural',
      'Registre contribuições ditadas ou por imagens',
      'Razões dadas para escolher uma prioridade',
    ],
    [
      'Mercado de trocas com fichas',
      'Contar e comparar coleções durante uma troca',
      'Fichas grandes e cestos com figuras',
      'Distribua fichas|Troque por quantidades combinadas|Compare duas compras',
      'Ofereça cartelas com pontos para apoiar a contagem',
      'Estratégias para conferir a quantidade',
    ],
    [
      'Oficina de notícias da escola',
      'Organizar informações necessárias para um aviso',
      'Fotos fictícias ou desenhos, papel e lápis',
      'Escolha um fato|Decida quem precisa saber|Dite e revise um aviso',
      'Permita sugerir por desenho ou em dupla',
      'Informações acrescentadas durante a revisão',
    ],
    [
      'Relógio de atividades da turma',
      'Colocar acontecimentos em uma ordem combinada',
      'Cartões de momentos, cartolina, adesivos',
      'Organize o que aconteceu primeiro|Compare com a sequência de ontem|Registre o que mudou',
      'Use pistas visuais para retomar a ordem',
      'Justificativas para uma mudança na sequência',
    ],
  ],
]
const field = (key: string, label: string, value?: string): Field => ({
  key,
  label,
  value,
  type: 'long',
})
const activity = { tool: 'atividade', category: 'Atividades' } as const
const school = { category: 'Organização da turma' } as const
const sheetModels: ClassroomItem[] = worksheets.map(
  ([title, description, figures, answers, mode = 'answer'], index) => ({
    ...activity,
    id: 'ficha-oficina-' + (index + 1),
    title,
    description,
    age: index < 10 ? 'Pré I' : 'Pré II',
    task: {
      mode,
      sortLabels: mode === 'sort' ? ['Pintura e desenho', 'Lanche'] : undefined,
      supplies: 'Folha impressa e lápis ou giz de cera.',
      steps: [
        'Leia a instrução junto com a criança.',
        description,
        'Convide a criança a explicar sua resposta.',
      ],
      adaptation: 'Aceite resposta falada ou marcada com adesivos.',
      prompts: answers.split('|'),
      illustrations: figures ? figures.split('|') : [],
      guide:
        index === 13
          ? 'Ordem esperada: 3, 1, 4, 2. Peça à criança que explique o que muda em cada fase.'
          : index === 6
            ? 'Uma ordem possível: 3, 1, 2. Converse sobre como a fruta chega à mesa.'
            : 'Registre como a criança fez a proposta e o apoio que utilizou.',
    },
  }),
)
const practice: ClassroomItem[] = groups.flatMap((group, band) =>
  group.flatMap(
    ([title, objective, supplies, actions, adaptation, evidence], index) => {
      const id = band + 1 + '-' + (index + 1)
      const age = bands[band]
      const steps = actions.split('|')
      const individual = title + ' · observação individual'
      const collective = title + ' · observação coletiva'
      const reportFields = (isGroup: boolean): Field[] => [
        {
          key: 'observationSubject',
          label: isGroup ? 'Turma e participantes' : 'Identificação da criança',
        },
        { key: 'period', label: 'Data e contexto' },
        field('evidence', evidence),
        field(
          'observation',
          isGroup
            ? 'Interações e estratégias do grupo'
            : 'Ações, gestos ou falas da criança',
        ),
        field(
          'next',
          isGroup
            ? 'O que retomar com a turma'
            : 'Apoio a experimentar na próxima proposta',
        ),
      ]
      return [
        {
          ...activity,
          id: 'vivencia-oficina-' + id,
          title,
          description: objective,
          age,
          task: {
            mode: 'experience',
            supplies,
            steps,
            adaptation,
            guide: evidence,
          },
        },
        {
          ...school,
          id: 'plano-oficina-' + id,
          tool: 'plano-de-aula',
          title,
          description: objective,
          age,
          fields: [
            field('objective', 'Objetivo da aula', objective),
            field('materials', 'Preparação e materiais', supplies),
            field(
              'conduct',
              'Momentos',
              steps
                .map(
                  (step, i) =>
                    [4, band === 0 ? 5 : 12, 4][i] + ' min · ' + step,
                )
                .join('\n'),
            ),
            field(
              'observe',
              'O que observar',
              evidence + '. ' + adaptation + '.',
            ),
          ],
        },
        {
          ...school,
          id: 'individual-oficina-' + id,
          tool: 'relatorio',
          scope: 'individual',
          title: individual,
          description: evidence,
          age,
          fields: reportFields(false),
        },
        {
          ...school,
          id: 'coletivo-oficina-' + id,
          tool: 'relatorio',
          scope: 'collective',
          title: collective,
          description: objective + '. Observe ' + evidence.toLowerCase() + '.',
          age,
          fields: reportFields(true),
        },
      ] satisfies ClassroomItem[]
    },
  ),
)
export const expansionPractice = [...sheetModels, ...practice]
