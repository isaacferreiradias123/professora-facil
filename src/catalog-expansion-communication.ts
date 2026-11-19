import type { ClassroomItem, Field } from './classroom-catalog'

type Content = [title: string, body: string, details: string]
const noticeRows: Content[] = [
  [
    'Agenda de acolhimento',
    'Nos primeiros dias, a entrada da turma seguirá o período informado. Entregue o material identificado à equipe na chegada.',
    'Data inicial|Horário de entrada|Portão',
  ],
  [
    'Convite para o varal literário',
    'Visite o varal de histórias e ouça as crianças contando como escolheram as ilustrações.',
    'Data|Horário|Local',
  ],
  [
    'Envio de caixa de papelão',
    'Para a oficina de construção, envie uma caixa limpa e sem grampos. A escola oferece material a quem precisar.',
    'Data limite|Ponto de entrega',
  ],
  [
    'Autorização para visita à biblioteca',
    'A turma visitará a biblioteca com a equipe escolar. Envie o canhoto assinado pela agenda.',
    'Data da saída|Horário|Local de encontro',
  ],
  [
    'Devolução dos cartões de leitura',
    'Envie os cartões usados no projeto para montarmos o arquivo coletivo.',
    'Data limite|Ponto de entrega',
  ],
  [
    'Chegada pelo pátio interno',
    'Durante a organização do corredor, a equipe receberá a turma pelo acesso do pátio.',
    'Data de início|Horário|Acesso',
  ],
  [
    'Encontro para empréstimo de livros',
    'As famílias podem conhecer o acervo e escolher o primeiro empréstimo junto da criança.',
    'Data|Horário|Local',
  ],
  [
    'Pedido de foto de um objeto',
    'Envie uma foto de um objeto familiar para a roda de observação. Objetos pessoais permanecem em casa.',
    'Data limite|Canal indicado',
  ],
  [
    'Roupas para atividade com tinta',
    'A turma vai explorar tintas laváveis. Se possível, envie uma camiseta extra identificada.',
    'Data da oficina|Local de entrega',
  ],
  [
    'Organização da volta do passeio',
    'A saída ao fim do passeio será pelo local indicado. Procure a equipe antes de deixar o espaço com a criança.',
    'Data|Horário de retorno|Local',
  ],
  [
    'Convite para a roda de cantigas',
    'Participe da roda musical e, se quiser, compartilhe uma cantiga conhecida pela família.',
    'Data|Horário|Local',
  ],
  [
    'Confirmação de presença na mostra',
    'Informe pela agenda quantas pessoas da família pretendem visitar a mostra da turma.',
    'Data limite|Canal de resposta',
  ],
  [
    'Retirada do portfólio',
    'O portfólio da criança ficará disponível com a equipe. Confirme seu nome ao retirar.',
    'Data|Período|Local',
  ],
  [
    'Troca da data de entrega',
    'O prazo da proposta enviada para casa mudou. Registre a nova data na agenda.',
    'Novo prazo|Canal de contato',
  ],
  [
    'Conversa sobre o empréstimo',
    'Houve troca de etiquetas na sacola de leitura. Confira se o nome indicado corresponde ao da criança e avise pela agenda.',
    'Data de conferência|Canal de retorno',
  ],
  [
    'Aviso de oficina ao ar livre',
    'A oficina irá para o pátio. Envie roupa confortável e uma garrafa de água identificada.',
    'Data|Horário|Ponto de encontro',
  ],
  [
    'Bilhete para a roda da memória',
    'Converse em casa sobre uma brincadeira de infância. A criança poderá contar ou desenhar o que ouviu na roda.',
    'Data da roda|Forma de enviar',
  ],
  [
    'Confirmação de horário individual',
    'Confirme o horário da conversa com a professora para organizarmos a recepção das famílias.',
    'Data|Horário|Sala',
  ],
  [
    'Bilhete do cantinho de trocas',
    'Se quiser participar da troca, envie um brinquedo limpo, completo e em boas condições.',
    'Data|Prazo de entrega|Local',
  ],
  [
    'Entrega das produções da turma',
    'As produções serão levadas para casa em envelope identificado. Abra junto com a criança e conversem sobre o percurso.',
    'Data de envio|Canal para dúvidas',
  ],
]
const formRows: [string, string, string, ClassroomItem['form']][] = [
  [
    'Ata de reunião sobre o período de adaptação',
    'Equipe participante',
    'Situações observadas|Ações acordadas|Data da retomada',
    'ata',
  ],
  [
    'Ata de organização do acervo',
    'Participantes',
    'Diagnóstico do acervo|Divisão de tarefas|Próxima conferência',
    'ata',
  ],
  [
    'Ata de preparação da saída de campo',
    'Equipe responsável',
    'Roteiro proposto|Encaminhamentos combinados|Responsáveis por etapa',
    'ata',
  ],
  [
    'Ata de planejamento do uso do pátio',
    'Turmas representadas',
    'Disponibilidade dos espaços|Horários definidos|Como revisar o acordo',
    'ata',
  ],
  [
    'Ficha de conferência de materiais de leitura',
    'Responsável pela conferência',
    'Títulos ou quantidades|Condição dos materiais|Providências',
    'ficha',
  ],
  [
    'Ficha de observação de ambiente',
    'Ambiente visitado',
    'Condições observadas|O que precisa ser ajustado|Encaminhamento',
    'ficha',
  ],
  [
    'Controle da pasta de comunicados',
    'Turma ou setor',
    'Comunicados emitidos|Pendências de retorno|Conferência final',
    'ficha',
  ],
  [
    'Mapa de responsabilidades da mostra',
    'Nome do evento',
    'Funções necessárias|Pessoas responsáveis|Horários de troca',
    'ficha',
  ],
  [
    'Registro de manutenção de materiais',
    'Material ou sala',
    'Problema observado|Providência solicitada|Confirmação do retorno',
    'ficha',
  ],
  [
    'Lista de conferência antes de um passeio',
    'Turma participante',
    'Itens conferidos|Pontos de encontro|Responsabilidade da equipe',
    'ficha',
  ],
  [
    'Declaração de visita à biblioteca',
    'Nome da pessoa',
    'Finalidade da visita|Dia e período|Identificação do responsável',
    'declaracao',
  ],
  [
    'Declaração de participação na oficina',
    'Nome da pessoa participante',
    'Nome da oficina|Período da atividade|Responsável da escola',
    'declaracao',
  ],
  [
    'Declaração de devolução de item',
    'Nome da pessoa',
    'Item devolvido|Condição na devolução|Local e data',
    'declaracao',
  ],
  [
    'Declaração de recebimento de orientação',
    'Nome da pessoa',
    'Orientação recebida|Data de entrega|Identificação de quem entregou',
    'declaracao',
  ],
  [
    'Controle de entrega de envelopes',
    'Quem entregou',
    'Turmas ou pessoas destinatárias|Quantidade entregue|Itens a entregar',
    'entrega',
  ],
  [
    'Registro de envio de fichas à coordenação',
    'Quem enviou',
    'Fichas encaminhadas|Setor de destino|Pendências',
    'entrega',
  ],
  [
    'Termo de recebimento de acervo itinerante',
    'Quem recebeu',
    'Descrição do acervo|Quantidade e condição|Data prevista de devolução',
    'entrega',
  ],
  [
    'Registro de entrega das produções da mostra',
    'Equipe responsável',
    'Destino das produções|Itens retirados|Retiradas a confirmar',
    'entrega',
  ],
  [
    'Ficha de planejamento do cantinho da leitura',
    'Pessoa responsável',
    'Temas a incluir|Organização do espaço|Como acompanhar o uso',
    'ficha',
  ],
  [
    'Registro de encaminhamentos de atendimento',
    'Pessoas presentes',
    'Situação trazida|Providência combinada|Quando retomar',
    'ficha',
  ],
]
const albumRows: [
  title: string,
  purpose: string,
  composition: 'dupla' | 'sequencia' | 'destaque' | 'legendas',
][] = [
  [
    'Antes e depois da pintura',
    'Compare o suporte limpo e as marcas produzidas.',
    'dupla',
  ],
  [
    'Etapas de um barco de papel',
    'Use as imagens para mostrar as decisões da montagem.',
    'sequencia',
  ],
  [
    'Uma página de observação da horta',
    'Destaque uma mudança e descreva como foi observada.',
    'destaque',
  ],
  [
    'Lugares do percurso no bairro',
    'Identifique as paradas e a descoberta de cada dupla.',
    'legendas',
  ],
  [
    'Primeiro e último ensaio',
    'Compare o que o grupo mudou na brincadeira musical.',
    'dupla',
  ],
  [
    'Três tempos de um desenho coletivo',
    'Mostre o começo, a entrada de outras crianças e o resultado.',
    'sequencia',
  ],
  [
    'A foto escolhida pela turma',
    'Anexe a imagem votada e registre as razões da escolha.',
    'destaque',
  ],
  [
    'Detalhes do livro escolhido',
    'Anexe registros autorizados do espaço e das produções da leitura.',
    'legendas',
  ],
  [
    'Do planejamento ao palco',
    'Compare a ideia desenhada com o cenário montado.',
    'dupla',
  ],
  [
    'O caminho de uma notícia',
    'Mostre o acontecimento, o registro e o mural final.',
    'sequencia',
  ],
  [
    'A conquista de uma dupla',
    'Destaque uma foto e anote a estratégia que funcionou.',
    'destaque',
  ],
  [
    'Exploração dos cantos',
    'Descreva em cada legenda o uso de um espaço.',
    'legendas',
  ],
  [
    'A torre antes e após o teste',
    'Compare a primeira base com a solução final.',
    'dupla',
  ],
  [
    'Rotina da sacola de leitura',
    'Registre a escolha, a entrega e a devolução.',
    'sequencia',
  ],
  [
    'A pista mais surpreendente',
    'Destaque um elemento e acrescente uma pergunta da turma.',
    'destaque',
  ],
  [
    'Inventário das formas encontradas',
    'Indique o local e o nome das formas nas legendas.',
    'legendas',
  ],
  [
    'A janela em dias diferentes',
    'Compare as duas imagens com a data na legenda.',
    'dupla',
  ],
  [
    'Percurso de chegada à biblioteca',
    'Ordene as fotos para recontar o caminho.',
    'sequencia',
  ],
  [
    'Memória de um encontro musical',
    'Use uma imagem representativa e descreva o momento.',
    'destaque',
  ],
  [
    'Coleção de misturas da oficina',
    'Legende ingredientes e resultado de cada mistura.',
    'legendas',
  ],
]
const postRows: [string, string, string, 'convite' | 'aviso' | 'memoria'][] = [
  [
    'Visita às estações da turma',
    'Conheça as mesas de observação e veja como as crianças registraram suas descobertas.',
    'Passe pela recepção.',
    'convite',
  ],
  [
    'Entrada para a sessão de histórias',
    'A turma vai ouvir histórias escolhidas pelos grupos e conversar sobre as ilustrações.',
    'Consulte o local na agenda.',
    'aviso',
  ],
  [
    'Uma ponte testada pela turma',
    'As crianças mudaram a base da ponte depois de observar o primeiro teste.',
    'Pergunte o que mudou.',
    'memoria',
  ],
  [
    'Encontro para montar brinquedos',
    'Traga uma ideia de brinquedo feito com papel e ajude a turma a testar.',
    'Confirme a participação.',
    'convite',
  ],
  [
    'Atenção ao envelope de produções',
    'As produções da turma serão entregues no horário combinado com a escola.',
    'Confira o horário na agenda.',
    'aviso',
  ],
  [
    'Do som à partitura desenhada',
    'A turma inventou sinais para as pausas e registrou as batidas no papel.',
    'Peça para a criança mostrar um sinal.',
    'memoria',
  ],
  [
    'Roda de histórias em família',
    'Compartilhe uma história curta ou uma lembrança de infância.',
    'Informações na agenda.',
    'convite',
  ],
  [
    'Devolução da sacola da turma',
    'Conferimos as peças da sacola para que outra família possa brincar.',
    'Verifique a data de devolução.',
    'aviso',
  ],
  [
    'O que vimos na janela',
    'Observamos o céu em dois dias e comparamos os desenhos feitos pela turma.',
    'Converse sobre o que apareceu.',
    'memoria',
  ],
  [
    'Mostra do jornal de parede',
    'Veja as notícias que a turma escolheu, escreveu e ilustrou.',
    'Visite o mural da sala.',
    'convite',
  ],
  [
    'A oficina vai para o pátio',
    'A turma fará a proposta ao ar livre no período combinado.',
    'Envie roupa confortável.',
    'aviso',
  ],
  [
    'As perguntas da horta',
    'A turma escolheu três perguntas para investigar e registrou as primeiras previsões.',
    'Conheça os registros no mural.',
    'memoria',
  ],
  [
    'Recepção do acervo itinerante',
    'Venha acompanhar a abertura das caixas e a escolha de livros.',
    'Confirme na agenda.',
    'convite',
  ],
  [
    'Mudança no horário da recepção',
    'A equipe escolar receberá as famílias no novo período combinado.',
    'Consulte a atualização na agenda.',
    'aviso',
  ],
  [
    'Mapas que outra dupla conseguiu seguir',
    'As crianças compararam desenhos e ajustaram as pistas após o percurso.',
    'Pergunte como fizeram a revisão.',
    'memoria',
  ],
  [
    'Oficina de colagem no fim da tarde',
    'Conheça as formas reunidas pela turma e monte uma pequena colagem com a criança.',
    'Confira onde será a oficina.',
    'convite',
  ],
  [
    'Lembrete para a roda de empréstimo',
    'Separe o livro com a etiqueta da criança e coloque na sacola de leitura.',
    'Confira o prazo.',
    'aviso',
  ],
  [
    'Varal de marcas e texturas',
    'A turma comparou superfícies e organizou os desenhos no varal.',
    'Veja as escolhas de cada grupo.',
    'memoria',
  ],
  [
    'Conversa sobre as brincadeiras do pátio',
    'Vamos compartilhar as brincadeiras que a turma pesquisou e experimentar uma delas.',
    'Veja o convite na agenda.',
    'convite',
  ],
  [
    'Encontro de encerramento da oficina',
    'Nosso espaço de trabalho será reorganizado para receber as famílias.',
    'Confirme entrada e horário.',
    'aviso',
  ],
]
const formField = (
  label: string,
  key: string,
  type?: Field['type'],
): Field => ({ key, label, type })
const organization = { category: 'Organização da turma' } as const
export const expansionCommunication: ClassroomItem[] = [
  ...noticeRows.map(([title, body, labels], i): ClassroomItem => ({
    id: 'recado-oficina-' + (i + 1),
    title,
    body,
    description: body,
    category: 'Recados',
    tool: 'documento',
    detachable: i === 3,
    fields: labels
      .split('|')
      .map((label, j) =>
        formField(
          label,
          'info' + j,
          label.startsWith('Data') || label === 'Novo prazo'
            ? 'date'
            : label === 'Horário'
              ? 'time'
              : undefined,
        ),
      ),
  })),
  ...formRows.map(([title, person, labels, form], i): ClassroomItem => ({
    ...organization,
    id: 'documento-oficina-' + (i + 1),
    title,
    form,
    description: labels.split('|').join(', ') + '.',
    tool: 'documento',
    fields: [
      formField(person, 'participants'),
      formField('Local e data', 'place'),
      ...labels
        .split('|')
        .map((label, j) => formField(label, 'field' + j, 'long')),
    ],
  })),
  ...albumRows.map(([title, description, layout], i): ClassroomItem => ({
    ...organization,
    id: 'album-oficina-' + (i + 1),
    title,
    description,
    tool: 'fotos-em-pdf',
    visual: {
      title,
      albumSubtitle: description,
      orientation: layout === 'dupla' ? 'horizontal' : 'vertical',
      perPage:
        layout === 'destaque'
          ? '1'
          : layout === 'dupla'
            ? '2'
            : layout === 'sequencia'
              ? '3'
              : '4',
      margin: '10',
      crop: 'no',
      quality: 'high',
      printedHeader: 'yes',
      printedNumbering: 'yes',
      albumLayout: layout,
    },
  })),
  ...postRows.map(([title, body, callout, composition], i): ClassroomItem => ({
    ...organization,
    id: 'arte-oficina-' + (i + 1),
    title,
    description: body,
    tool: 'postagem',
    visual: {
      title,
      body,
      callout,
      composition,
      background:
        composition === 'convite'
          ? '#fbefc1'
          : composition === 'aviso'
            ? '#deebf5'
            : '#e4f0e8',
      foreground: '#224438',
      font: composition === 'aviso' ? 'sans-serif' : 'Georgia',
      format: composition === 'aviso' ? 'Vertical 4:5' : 'Quadrado 1:1',
      model: String(i % 3),
    },
  })),
]
