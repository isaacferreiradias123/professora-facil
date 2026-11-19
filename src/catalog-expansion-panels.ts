import type { ClassroomItem } from './classroom-catalog'
import type { PanelSpec } from './panel-geometry'

const mosaics: [string, string, PanelSpec['layout'], string][] = [
  [
    'A semana das descobertas',
    'Use a faixa para colocar um desenho em cada momento da semana.',
    'banner',
    'Começo|Investigação|Partilha',
  ],
  [
    'Da lagarta à borboleta',
    'Monte imagens da transformação na ordem em que ocorre.',
    'timeline',
    'Ovo|Lagarta|Crisálida|Borboleta',
  ],
  [
    'Chegada das famílias',
    'Sinalize as estações abertas na recepção da mostra.',
    'banner',
    'Recepção|Trabalhos|Conversa',
  ],
  [
    'Pistas do tesouro',
    'Exponha desenhos das pistas e retome o caminho seguido.',
    'timeline',
    'Partida|Primeira pista|Segunda pista|Chegada',
  ],
  [
    'Caminho de um bilhete',
    'Acompanhe a correspondência da turma até a resposta.',
    'timeline',
    'Destinatário|Escrita|Entrega|Resposta',
  ],
  [
    'Pequenos inventores',
    'Reserve espaços para apresentar protótipos e desenhos.',
    'gallery',
    'Ideia inicial|Protótipo|Novo teste|Resultado',
  ],
  [
    'Visita à biblioteca',
    'Monte um painel com o que as crianças observaram em cada etapa.',
    'timeline',
    'Preparação|Chegada|Escolhas|Retorno',
  ],
  [
    'Brincadeiras do mundo',
    'Exponha registros de quatro brincadeiras contadas pelas famílias.',
    'gallery',
    'Regras da roda|Com quem brincar|O que usar|Desenho da brincadeira',
  ],
  [
    'Feira de trocas',
    'Oriente as crianças pelas etapas da troca de livros e brinquedos.',
    'banner',
    'Escolha|Troca|Novo dono',
  ],
  [
    'Jornal de parede da turma',
    'Organize notícias, desenhos e perguntas da semana.',
    'gallery',
    'Aconteceu|Entrevista|Ilustração|Próxima pauta',
  ],
  [
    'Nossa árvore de histórias',
    'Registre personagens, lugares e mudanças em uma leitura coletiva.',
    'chart',
    'Personagens|Cenários|Problema|Final inventado',
  ],
  [
    'Germinação em quatro tempos',
    'Exponha a sequência de desenhos de observação da mesma semente.',
    'gallery',
    'Semente seca|Primeira raiz|Haste|Folhas',
  ],
  [
    'Museu de texturas',
    'Monte o mural com amostras ou desenhos de superfícies.',
    'gallery',
    'Lisa|Áspera|Macia|Ondulada',
  ],
  [
    'Como convivemos na roda',
    'Revise combinados observáveis durante a conversa.',
    'chart',
    'Escutar|Pedir a palavra|Perguntar|Retomar',
  ],
  [
    'Vizinhos do jardim',
    'Mostre desenhos dos animais encontrados durante a exploração.',
    'gallery',
    'Na terra|Nas folhas|No ar|Perto da água',
  ],
  [
    'Mapa das escolhas de leitura',
    'Registre as preferências da turma e compare os votos.',
    'chart',
    'Poemas|Contos|Livros de imagem|Informativos',
  ],
  [
    'Oficina de autorretratos',
    'Exponha produções feitas com técnicas diferentes.',
    'gallery',
    'Espelho|Lápis|Colagem|Pintura',
  ],
  [
    'Investigação da luz',
    'Registre previsões e descobertas feitas com lanternas.',
    'chart',
    'Hipótese|Materiais|Observação|Nova pergunta',
  ],
  [
    'O que guardamos da visita',
    'Monte uma mostra vertical com vestígios de uma saída.',
    'gallery',
    'Ir até lá|Objeto observado|Conversa|Memória',
  ],
  [
    'Proteção do pátio',
    'Combine ações de cuidado e acompanhe as responsabilidades.',
    'chart',
    'Plantas|Brinquedos|Água|Organização',
  ],
]
const kits: [string, string, string][] = [
  [
    'Fichas de empréstimo de brinquedos',
    'Monte etiquetas com o fluxo do empréstimo.',
    'Disponível|Com a turma|Em limpeza|Devolver',
  ],
  [
    'Varal de palavras da semana',
    'Pendure palavras ditadas pelas crianças com as categorias.',
    'Nome|Lugar|Objeto|Ação',
  ],
  [
    'Peças da oficina de histórias',
    'Sorteie peças para montar um enredo novo.',
    'Personagem|Lugar|O que aconteceu|Solução',
  ],
  [
    'Pistas para o passeio no entorno',
    'Entregue uma pista por dupla para localizar um lugar.',
    'Árvore|Banco|Portão|Placa|Campo',
  ],
  [
    'Estações para misturar tintas',
    'Identifique etapas do ateliê e a mesa de secagem.',
    'Escolher|Misturar|Testar|Secar|Limpar',
  ],
  [
    'Mesa de classificação de sementes',
    'Separe as bandejas por característica observada.',
    'Grande|Pequena|Lisa|Rugosa',
  ],
  [
    'Combinações de ritmos',
    'Ordene cartões da esquerda para a direita e execute a sequência.',
    'Palma|Pausa|Batida leve|Batida forte',
  ],
  [
    'Cartões de uso da água',
    'Posicione lembretes próximos aos locais observados.',
    'Encher|Fechar a torneira|Regar|Reutilizar',
  ],
  [
    'Etiquetas para materiais de reuso',
    'Organize caixas para reaproveitamento de materiais limpos.',
    'Papel|Papelão|Rolinho|Tecido',
  ],
  [
    'Marcadores de leitura compartilhada',
    'Distribua funções nas duplas durante a leitura.',
    'Escolher a página|Observar a imagem|Contar|Escutar',
  ],
  [
    'Trilha de movimentos no pátio',
    'Espalhe sinais de movimento em estações separadas.',
    'Pisar devagar|Fazer curva|Equilibrar|Voltar',
  ],
  [
    'Cartões de inclusão nas brincadeiras',
    'Use as peças para combinar formas de participação.',
    'Observar|Entrar na dupla|Pedir ajuda|Sugerir uma ideia',
  ],
  [
    'Chaves para observar o céu',
    'Combine sinais de céu, vento e chuva no registro diário.',
    'Céu aberto|Nuvens baixas|Vento|Garoa|Chuva forte',
  ],
  [
    'Peças para o cantinho do descanso',
    'Sinalize a transição para uma atividade tranquila.',
    'Guardar|Respirar|Escolher livro|Descansar',
  ],
  [
    'Placas de parada da horta',
    'Distribua sinalização por pontos de trabalho.',
    'Terra|Sementes|Ferramentas|Composteira',
  ],
  [
    'Mapa desmontável dos ambientes',
    'Monte o mapa coletivamente e mova placas de lugar.',
    'Corredor|Pátio|Biblioteca|Sala|Entrada',
  ],
  [
    'Painel de combinados da mostra',
    'Organize funções durante a recepção das famílias.',
    'Receber|Guiar|Contar|Guardar',
  ],
  [
    'Cartões de separação de formas',
    'Crie recipientes de classificação visível para as crianças.',
    'Círculo|Quadrado|Triângulo|Retângulo',
  ],
  [
    'Peças da roda de perguntas',
    'Separe perguntas antes de escolher o que investigar.',
    'Quem?|Onde?|Quando?|Como?|Por quê?',
  ],
  [
    'Painel de trajetos dos personagens',
    'Reposicione os cartões para lembrar caminhos do reconto.',
    'Início|Encontro|Desvio|Chegada',
  ],
]
const panel = { tool: 'painel', category: 'Painéis' } as const
export const expansionPanels: ClassroomItem[] = [
  ...mosaics.map(([title, description, layout, labels], index) => ({
    ...panel,
    id: 'mural-oficina-' + (index + 1),
    title,
    description,
    panel: {
      layout,
      landscape: index < 10,
      strip: layout === 'banner',
      art:
        layout === 'banner'
          ? 'oficina-ilustrada.png'
          : index === 1
            ? 'oficina-borboleta.png'
            : [
                'paineis.webp',
                'atividades.webp',
                'organizacao.webp',
                'recados.webp',
              ][index % 4],
    },
    mosaicLabels: labels.split('|'),
  })),
  ...kits.map<ClassroomItem>(([title, description, labels], index) => ({
    ...panel,
    id: 'kit-oficina-' + (index + 1),
    title,
    description,
    poster: labels.split('|'),
    kit: [1, 4, 6, 7, 8, 11, 14, 17, 18].includes(index) ? 'tiras' : 'placas',
  })),
]
