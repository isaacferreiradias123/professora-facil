import {
  createContext,
  lazy,
  Suspense,
  useContext,
  useEffect,
  useRef,
  useState,
} from 'react'
import {
  Link,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { Plus, Folder, LifeBuoy, Settings2 } from 'lucide-react'
import {
  activity,
  catalog,
  fields,
  groups,
  themes,
  tools,
  tutorials,
  upcoming,
  type Tool,
} from './catalog'
import { drafts, newId, type Draft } from './store'

import { clearRecovery, editableFile, importEditable } from './draft-transfer'
import { download, filename } from './workflow'

import { loadPack, worksheetUrl, type PackTemplate } from './template-pack'
import { FileDrop } from './editor-ui'
import {
  ClassroomLibrary,
  ClassroomRoute,
  ClassroomTabs,
  CollectionShowcase,
  draftLink,
} from './classroom'
import { classroom } from './classroom-catalog'
import { assetUrl } from './classroom-layout'

const Editor = lazy(() => import('./editor'))
const Visual = lazy(() => import('./visual'))
const Preference = createContext({ easy: true, toggle: () => {} })
export const useEasy = () => useContext(Preference).easy
const toolCards: Record<Tool, { image: string; output: string }> = {
  atividade: {
    image: 'atividades.webp',
    output: 'Monte uma ficha da criança ou organize uma vivência.',
  },
  'plano-de-aula': {
    image: 'organizacao.webp',
    output: 'Planeje o objetivo, os momentos e o tempo da aula.',
  },
  relatorio: {
    image: 'bilhete-materiais.webp',
    output: 'Registre observações individuais ou da turma.',
  },
  documento: {
    image: 'bilhete-reuniao.webp',
    output: 'Crie um recado, ata ou declaração em Word e PDF.',
  },
  'fotos-em-pdf': {
    image: 'bilhete-passeio.webp',
    output: 'Organize fotos e legendas em folhas A4.',
  },
  postagem: {
    image: 'bilhete-evento.webp',
    output: 'Prepare um convite, aviso ou registro em PNG.',
  },
  painel: {
    image: 'paineis.webp',
    output: 'Imprima um kit recortável ou divida uma imagem em A4.',
  },
}
const mainLinks = [
  ['/como-funciona', 'Como funciona'],
  ['/ajuda', 'Ajuda'],
]
function Brand() {
  return (
    <Link to="/" className="brand">
      <img
        src={import.meta.env.BASE_URL + 'marca.svg'}
        alt=""
        width="42"
        height="42"
      />
      Professora Fácil
    </Link>
  )
}
function PublicLayout() {
  return (
    <>
      <header className="public-header">
        <Brand />
        <nav aria-label="Principal">
          {mainLinks.map(([p, n]) => (
            <NavLink key={p} to={p}>
              {n}
            </NavLink>
          ))}
        </nav>
      </header>
      <main id="conteudo" className="public-main">
        <Outlet />
      </main>
      <footer className="public-footer">
        <Brand />
        <nav aria-label="Informações">
          {[
            ['/sobre', 'Sobre'],
            ['/planos', 'Planos'],
            ['/privacidade', 'Privacidade'],
            ['/termos', 'Termos'],
          ].map(([p, n]) => (
            <Link key={p} to={p}>
              {n}
            </Link>
          ))}
        </nav>
      </footer>
    </>
  )
}
const destinations = [
  ['/app/criar', 'Criar', Plus],
  ['/app/materiais', 'Meus materiais', Folder],
  ['/app/ajuda', 'Ajuda', LifeBuoy],
] as const
function InternalLayout() {
  const { easy, toggle } = useContext(Preference)
  return (
    <div className={easy ? 'shell easy' : 'shell'}>
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Área de trabalho">
          {destinations.map(([p, n, Icon]) => (
            <NavLink key={p} end={p === '/app/criar'} to={p} aria-label={n}>
              <Icon className="sr-only" size={21} aria-hidden="true" />
              <img
                className="school-nav-image"
                src={assetUrl(
                  p === '/app/criar'
                    ? 'atividades.webp'
                    : p === '/app/materiais'
                      ? 'organizacao.webp'
                      : 'recados.webp',
                )}
                width="28"
                height="22"
                alt=""
              />
              <span>{p === '/app/materiais' ? 'Materiais' : n}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="workspace-header">
          <span className="mobile-brand">
            <Brand />
          </span>
          <button
            className="mode"
            type="button"
            aria-pressed={easy}
            title="O Modo Fácil recolhe as opções avançadas"
            onClick={toggle}
          >
            <Settings2 size={18} aria-hidden="true" /> Modo Fácil{' '}
            <span>{easy ? 'ligado' : 'desligado'}</span>
          </button>
        </header>
        <main id="conteudo">
          <Outlet />
        </main>
      </div>
    </div>
  )
}
function Steps() {
  return (
    <ol className="steps-public">
      <li>
        <strong>Escolha o material</strong>
        <p>Comece por um modelo ou escolha a ferramenta de que precisa.</p>
      </li>
      <li>
        <strong>Preencha algumas informações</strong>
        <p>Personalize com o tema e os detalhes da sua turma.</p>
      </li>
      <li>
        <strong>Confira, baixe ou imprima</strong>
        <p>Veja como o material vai ficar antes de usá-lo.</p>
      </li>
    </ol>
  )
}
function Plans() {
  return (
    <>
      <div className="grid plans">
        {[
          ['Gratuito', 'R$ 0', 'Ferramentas demonstrativas e modelos locais.'],
          [
            'Essencial',
            'R$ 19,90/mês',
            'Proposta de acesso ampliado a modelos e documentos.',
          ],
          [
            'Completo',
            'R$ 39,90/mês',
            'Proposta de criação assistida e maior capacidade de processamento.',
          ],
        ].map(([name, price, description], i) => (
          <article className="card" key={name}>
            <h3>{name}</h3>
            <p className="price">{price}</p>
            <p>{description}</p>
            {i === 0 ? (
              <Link className="button" to="/app">
                Experimentar gratuitamente
              </Link>
            ) : (
              <Link className="button secondary" to="/app/em-breve/assinaturas">
                Em breve
              </Link>
            )}
          </article>
        ))}
      </div>
      <p>
        Planos ilustrativos. Assinaturas ainda não disponíveis. Os preços são
        hipóteses comerciais.
      </p>
    </>
  )
}
const faqs = [
  [
    'Preciso criar conta?',
    'Abra a área de trabalho pelo botão Experimentar gratuitamente.',
  ],
  [
    'Onde ficam meus materiais?',
    'Rascunhos ficam neste navegador e neste dispositivo. Eles podem ser removidos ao limpar os dados do site.',
  ],
  [
    'Como faço para imprimir?',
    'Confira a prévia e escolha Imprimir. No celular, também é possível abrir o PDF baixado e usar a opção de impressão do aparelho.',
  ],
  [
    'Posso abrir qualquer PDF?',
    'A leitura funciona em PDFs com texto selecionável e acesso liberado. PDFs digitalizados precisam de reconhecimento de texto.',
  ],
]
function Faq() {
  return (
    <div className="faq">
      {faqs.map(([q, a]) => (
        <details key={q}>
          <summary>{q}</summary>
          <p>{a}</p>
        </details>
      ))}
    </div>
  )
}
const samples = [
  {
    name: 'Atividade de cores',
    category: 'Atividade',
    path: '/app/criar/atividade',
    shape: 'activity',
  },
  {
    name: 'Convite para a mostra',
    category: 'Comunicado',
    path: '/app/criar/postagem',
    shape: 'invite',
  },
  {
    name: 'Bem-vindos à turma',
    category: 'Painel',
    path: '/app/criar/painel',
    shape: 'panel',
  },
] as const

function Examples() {
  return (
    <div className="material-samples" aria-label="Exemplos de materiais">
      {samples.map(({ name, category, path, shape }) => (
        <Link className={'sample-tile sample-' + shape} key={shape} to={path}>
          <svg viewBox="0 0 140 100" aria-hidden="true" focusable="false">
            {shape === 'activity' && (
              <>
                <circle cx="35" cy="35" r="17" fill="#d28365" />
                <rect
                  x="57"
                  y="54"
                  width="28"
                  height="28"
                  rx="4"
                  fill="#668572"
                />
                <path d="M105 19l21 35H84z" fill="#d9ab49" />
                <path
                  d="M20 80h25m53 0h25"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeDasharray="4 4"
                />
              </>
            )}
            {shape === 'invite' && (
              <>
                <path d="M22 24h96v58H22z" fill="#fff8ef" />
                <path
                  d="m23 25 47 35 47-35"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                />
                <circle cx="70" cy="59" r="10" fill="#c46d58" />
                <path
                  d="M10 14v16m-8-8h16m111 49v16m-8-8h16"
                  stroke="currentColor"
                  strokeWidth="2"
                />
              </>
            )}
            {shape === 'panel' && (
              <>
                <path d="M18 75V46a52 34 0 0 1 104 0v29" fill="#e9ae72" />
                <path d="M36 75V50a34 24 0 0 1 68 0v25" fill="#f8ecd9" />
                <path d="M58 75V53a12 10 0 0 1 24 0v22" fill="#6d8e78" />
                <path
                  d="M70 9v78M12 48h116"
                  stroke="currentColor"
                  strokeDasharray="4 4"
                  opacity=".55"
                />
              </>
            )}
          </svg>
          <span>{category}</span>
          <strong>{name}</strong>
        </Link>
      ))}
    </div>
  )
}
function Landing() {
  return (
    <div className="school-home">
      <section className="school-hero">
        <div className="school-hero-copy">
          <h1>Sua rotina escolar, muito mais simples.</h1>
          <p>
            Atividades por turma, recados para imprimir e painéis ilustrados em
            folhas A4.
          </p>
          <div className="school-hero-actions">
            <Link className="button" to="/app">
              Criar um material
            </Link>
            <Link to="/app/colecao">Explorar coleção</Link>
          </div>
        </div>
        <img
          src={assetUrl('paineis.webp')}
          width="768"
          height="512"
          alt="Materiais ilustrados para a sala de aula"
          fetchPriority="high"
        />
      </section>
      <section className="school-home-section" aria-label="Escolher categoria">
        <ClassroomTabs />
      </section>
      <section className="school-home-section">
        <div className="school-section-head">
          <div>
            <h2>Abra, personalize e imprima</h2>
            <p>Confira as folhas que você pode preparar para sua turma.</p>
          </div>
          <Link to="/app/colecao">Ver toda a coleção</Link>
        </div>
        <CollectionShowcase />
      </section>
      <section className="school-home-section school-help">
        <article>
          <h2>Como funciona</h2>
          <Steps />
        </article>
        <article>
          <h2>Perguntas frequentes</h2>
          <Faq />
        </article>
      </section>
    </div>
  )
}
function Help() {
  return (
    <>
      <h1>Como podemos ajudar?</h1>
      <Steps />
      <section className="band">
        <h2>Tutoriais</h2>
        <div className="grid">
          {(Object.keys(tools) as Tool[]).map((k) => (
            <article className="card" key={k}>
              <h3>{tools[k].name}</h3>
              <ol className="tutorial-steps">
                {tutorials[k].map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <Link to={toolEntry(k)}>Abrir ferramenta</Link>
            </article>
          ))}
        </div>
      </section>
      <h2>Perguntas frequentes</h2>
      <Faq />
    </>
  )
}
function StaticPage({ kind }: { kind: string }) {
  if (kind === 'como')
    return (
      <>
        <h1>Como funciona</h1>
        <Steps />
        <Examples />
        <Link className="button" to="/app">
          Experimentar gratuitamente
        </Link>
      </>
    )
  if (kind === 'planos')
    return (
      <>
        <h1>Planos</h1>
        <Plans />
      </>
    )
  if (kind === 'sobre')
    return (
      <>
        <h1>Sobre o Professora Fácil</h1>
        <p>
          O Professora Fácil nasceu para simplificar tarefas digitais de
          professoras da creche à pré-escola. Seus modelos apoiam o trabalho
          pedagógico cotidiano com espaço para adaptar cada proposta à turma.
        </p>
        <Link to="/app">Conhecer as ferramentas</Link>
      </>
    )
  if (kind === 'privacidade')
    return (
      <>
        <h1>Privacidade</h1>
        <p>
          Documento preliminar, sujeito a revisão antes do lançamento comercial.
        </p>
        <p>
          O protótipo processa arquivos no navegador. Os rascunhos salvos e as
          preferências ficam no dispositivo. Fotos e arquivos importados ficam
          na sessão. Os arquivos que você baixa continuam no dispositivo até
          serem excluídos por você.
        </p>
        <p>
          Use nomes fictícios durante os testes. Para remover os rascunhos e
          preferências, acesse Meus materiais e escolha Limpar dados locais.
        </p>
        <Link to="/app/materiais">Gerenciar dados locais</Link>
      </>
    )
  return (
    <>
      <h1>Termos de uso</h1>
      <p>
        Documento preliminar, sujeito a revisão antes do lançamento comercial.
      </p>
      <p>
        O Professora Fácil é um protótipo gratuito para testes locais. Revise os
        materiais antes de usar ou distribuir e utilize arquivos que você tenha
        permissão para tratar.
      </p>
      <p>
        Guarde uma cópia dos materiais que deseja conservar. A limpeza dos dados
        do navegador pode remover rascunhos.
      </p>
    </>
  )
}
function toolEntry(tool: Tool) {
  return '/app/colecao?ferramenta=' + tool
}
function ToolGrid({ selection }: { selection: Tool[] }) {
  return (
    <div className="grid tools">
      {selection.map((tool) => (
        <Link
          className="tool card school-tool-card"
          to={toolEntry(tool)}
          key={tool}
          aria-label={tools[tool].name}
        >
          <img
            src={assetUrl(toolCards[tool].image)}
            height="62"
            width="74"
            alt=""
            loading="lazy"
          />
          <div>
            <h3>{tools[tool].name}</h3>
            <p>{toolCards[tool].output}</p>
          </div>
        </Link>
      ))}
    </div>
  )
}
const normalize = (value: string) =>
  value
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
const toolGroups: [string, Tool[]][] = [
  ['Planejar e registrar', ['atividade', 'plano-de-aula', 'relatorio']],
  [
    'Preparar arquivos e imprimir',
    ['documento', 'fotos-em-pdf', 'postagem', 'painel'],
  ],
]

function Dashboard({ create = false }: { create?: boolean }) {
  const [recent, setRecent] = useState<Draft[]>([])
  useEffect(() => {
    let active = true
    void drafts
      .list()
      .then((items) => {
        if (active) setRecent(items.slice(0, 3))
      })
      .catch(() => {})
    return () => {
      active = false
    }
  }, [])
  return (
    <>
      <section className="welcome">
        <h1>
          {create ? 'Criar um material' : 'Olá! O que vamos preparar hoje?'}
        </h1>
        <p>Escolha uma tarefa ou comece por um modelo pronto.</p>
      </section>
      {recent.length > 0 && (
        <section className="recent-materials">
          <h2>Continuar um material</h2>
          <ul>
            {recent.map((item) => (
              <li key={item.id}>
                <Link to={draftLink(item)}>{item.name}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      {toolGroups.map(([heading, keys]) => (
        <section
          className={'catalog-group catalog-group-' + keys.length}
          key={heading}
        >
          <h2>{heading}</h2>
          <ToolGrid selection={keys} />
        </section>
      ))}
      <section className="school-dashboard">
        <div className="school-section-head">
          <div>
            <h2>Coleção de sala de aula</h2>
            <p>Escolha pela tarefa e veja o material antes de imprimir.</p>
          </div>
          <Link to="/app/colecao">Abrir coleção</Link>
        </div>
        <ClassroomTabs />
      </section>
      <Link className="button secondary" to="/app/modelos">
        Modelos anteriores
      </Link>
      <nav className="extra-links" aria-label="Mais recursos">
        <Link to="/app/em-breve">Recursos em breve</Link>
      </nav>
    </>
  )
}

function Library() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const [age, setAge] = useState('')
  const [theme, setTheme] = useState('')
  const [field, setField] = useState('')
  const term = normalize(q.trim())
  const [loaded, setLoaded] = useState<Partial<Record<Tool, PackTemplate[]>>>(
    {},
  )
  const [loadError, setLoadError] = useState('')
  const [retry, setRetry] = useState(0)
  const [limit, setLimit] = useState(24)
  const requested = category || (term || age || theme || field ? 'all' : '')
  useEffect(() => {
    if (!requested) return
    let current = true
    const keys =
      requested === 'all' ? (Object.keys(tools) as Tool[]) : [requested as Tool]
    for (const key of keys)
      void loadPack(key)
        .then((models) => {
          if (current) setLoaded((old) => ({ ...old, [key]: models }))
        })
        .catch(() => {
          if (current)
            setLoadError('Alguns modelos não puderam ser carregados.')
        })
    return () => {
      current = false
    }
  }, [requested, retry])
  useEffect(() => {
    setLimit(24)
  }, [q, category, age, theme, field])
  const extra = requested
    ? Object.values(loaded)
        .flat()
        .filter((item) => {
          const value = item.values
          if (category && item.tool !== category) return false
          if (age && ![age, 'Todas as faixas'].includes(item.age)) return false
          if (theme && value.theme !== theme) return false
          if (
            field &&
            value.field !== field &&
            !value.fields?.split('|').includes(field)
          )
            return false
          return normalize(
            [item.title, item.topic, ...item.keywords].join(' '),
          ).includes(term)
        })
    : []
  const found = (Object.keys(catalog) as Tool[])
    .filter((key) => !category || category === key)
    .flatMap((key) => catalog[key].map((name, i) => ({ key, name, i })))
    .filter(({ key, i, name }) => {
      if (!normalize(name + ' ' + tools[key].name).includes(term)) return false
      if (age && key !== 'atividade' && key !== 'plano-de-aula') return false
      if (age && age !== groups[2] && key === 'atividade' && i >= 10)
        return false
      if ((theme || field) && key !== 'atividade') return false
      return (
        (!theme || themes[activity[i]?.[1]] === theme) &&
        (!field || fields[activity[i]?.[2]] === field)
      )
    })
  const filtered = Boolean(term || category || age || theme || field)
  return (
    <section aria-label="Catálogo">
      <h1>Modelos anteriores</h1>
      <div className="catalog-search">
        <label>
          Pesquisar modelos
          <input
            type="search"
            placeholder="Ex.: atividade, convite ou plano"
            value={q}
            onChange={(event) => setQ(event.target.value)}
          />
        </label>
        <details>
          <summary>Filtrar por categoria, faixa ou tema</summary>
          <div className="controls">
            <label>
              Categoria
              <select
                value={category}
                onChange={(event) => setCategory(event.target.value)}
              >
                <option value="">Todas</option>
                {(Object.keys(tools) as Tool[]).map((key) => (
                  <option value={key} key={key}>
                    {tools[key].name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Faixa etária
              <select
                value={age}
                onChange={(event) => setAge(event.target.value)}
              >
                <option value="">Todas</option>
                {groups.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Tema de atividade
              <select
                value={theme}
                onChange={(event) => setTheme(event.target.value)}
              >
                <option value="">Todos</option>
                {themes.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
            <label>
              Campo de experiências
              <select
                value={field}
                onChange={(event) => setField(event.target.value)}
              >
                <option value="">Todos</option>
                {fields.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
            </label>
          </div>
        </details>
      </div>
      {!requested && (
        <div className="filter-rail" aria-label="Escolher categoria da coleção">
          {(Object.keys(tools) as Tool[]).map((key) => (
            <button
              className="secondary"
              type="button"
              key={key}
              onClick={() => setCategory(key)}
            >
              {tools[key].name}
            </button>
          ))}
        </div>
      )}
      <div className="filter-rail" aria-label="Filtros aplicados">
        {[category && tools[category as Tool].name, age, theme, field]
          .filter(Boolean)
          .map((item) => (
            <span className="filter-chip" key={item}>
              {item}
            </span>
          ))}
        {filtered && (
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setQ('')
              setCategory('')
              setAge('')
              setTheme('')
              setField('')
            }}
          >
            Limpar filtros
          </button>
        )}
      </div>
      <p>{found.length + extra.length} modelos encontrados</p>
      {loadError && (
        <p role="alert">
          {loadError}{' '}
          <button
            type="button"
            className="secondary"
            onClick={() => {
              setLoadError('')
              setRetry(retry + 1)
            }}
          >
            Tentar novamente
          </button>
        </p>
      )}
      <div className="grid model-grid">
        {[
          ...found.map(({ key, i, name }) => ({
            key,
            name,
            id: String(i),
            values: undefined,
          })),
          ...extra.map((item) => ({
            key: item.tool,
            name: item.title,
            id: item.id,
            values: item.values,
          })),
        ]
          .slice(0, limit)
          .map(({ key, name, id, values }) => (
            <Link
              className="card library-link model-card"
              key={key + id}
              to={
                '/app/criar/' +
                key +
                '?modelo=' +
                id +
                (age ? '&faixa=' + groups.indexOf(age) : '')
              }
            >
              <span
                aria-hidden="true"
                className={'model-thumb model-thumb-' + key}
                style={
                  values && /^#[a-f0-9]{6}$/i.test(values.background)
                    ? { backgroundColor: values.background }
                    : undefined
                }
              >
                {worksheetUrl(values?.asset) ? (
                  <img
                    src={worksheetUrl(values?.asset)}
                    alt=""
                    loading="lazy"
                  />
                ) : (
                  <>
                    <b>{values?.title ?? name}</b>
                    <i />
                    <i />
                    <em>
                      <i />
                      <i />
                    </em>
                  </>
                )}
              </span>
              <span>
                <strong>{name}</strong>
                <small>{tools[key].name}</small>
              </span>
            </Link>
          ))}
      </div>
      {found.length + extra.length > limit && (
        <button
          type="button"
          className="secondary"
          onClick={() => setLimit(limit + 24)}
        >
          Mostrar mais 24
        </button>
      )}
      {!found.length && !extra.length && (
        <p>Nenhum modelo encontrado. Experimente outro nome ou categoria.</p>
      )}
    </section>
  )
}
function Materials() {
  const [list, setList] = useState<Draft[] | null>(null)
  const [message, setMessage] = useState('')
  const [confirmation, setConfirmation] = useState<string | null>(null)
  const [editing, setEditing] = useState('')
  const [name, setName] = useState('')
  const refresh = () =>
    drafts
      .list()
      .then(setList)
      .catch(() =>
        setMessage('Não foi possível abrir os materiais deste navegador.'),
      )
  useEffect(() => {
    void drafts
      .list()
      .then(setList)
      .catch(() =>
        setMessage('Não foi possível abrir os materiais deste navegador.'),
      )
  }, [])
  async function mutate(action: () => Promise<void>, success: string) {
    try {
      await action()
      await refresh()
      setMessage(success)
    } catch {
      setMessage('Não foi possível alterar os dados locais. Tente novamente.')
    } finally {
      setConfirmation(null)
      setEditing('')
    }
  }
  const { easy, toggle } = useContext(Preference)
  return (
    <>
      <h1>Meus materiais</h1>
      <p>Os rascunhos ficam neste navegador, neste dispositivo.</p>
      <FileDrop
        label="Importar cópia editável"
        instructions="Escolha ou arraste um arquivo JSON de até 250 KB."
        accept=".json,application/json"
        onFiles={([file]) => {
          if (file)
            void mutate(async () => {
              await drafts.put(await importEditable(file))
            }, 'Cópia importada.')
        }}
      />

      <p role="status">{message}</p>
      {list?.length === 0 ? (
        <div className="card">
          <h2>Seu primeiro material começa aqui</h2>
          <p>Crie algo e escolha Salvar rascunho para encontrar aqui depois.</p>
          <Link className="button" to="/app/criar">
            Criar material
          </Link>
        </div>
      ) : (
        list?.map((d) => (
          <article className="card draft" key={d.id}>
            <h2>{d.name}</h2>
            <p>
              {tools[d.tool].name} ·{' '}
              {new Date(d.updated).toLocaleDateString('pt-BR')}
              {d.needsFiles ? ' · Selecione os anexos novamente' : ''}
            </p>
            {editing === d.id ? (
              <form
                onSubmit={(e) => {
                  e.preventDefault()
                  if (name.trim())
                    void mutate(
                      () =>
                        drafts.put({
                          ...d,
                          name: name.trim(),
                          updated: Date.now(),
                        }),
                      'Material renomeado.',
                    )
                }}
              >
                <label>
                  Novo nome
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    maxLength={120}
                  />
                </label>
                <button>Salvar nome</button>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => setEditing('')}
                >
                  Cancelar
                </button>
              </form>
            ) : (
              <div className="actions">
                <Link className="button" to={draftLink(d)}>
                  Editar
                </Link>
                <button
                  className="secondary"
                  onClick={() => {
                    setEditing(d.id)
                    setName(d.name)
                  }}
                >
                  Renomear
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    void mutate(
                      () =>
                        drafts.put({
                          ...d,
                          id: newId(),
                          name: ('Cópia de ' + d.name).slice(0, 120),
                          updated: Date.now(),
                        }),
                      'Cópia criada.',
                    )
                  }
                >
                  Duplicar
                </button>
                <button
                  className="secondary"
                  onClick={() =>
                    download(
                      editableFile(d),
                      filename(d.name) + '.professora-facil.json',
                    )
                  }
                >
                  Baixar cópia editável
                </button>
                <button
                  className="secondary"
                  onClick={() => setConfirmation(d.id)}
                >
                  Excluir
                </button>
              </div>
            )}
          </article>
        ))
      )}
      <button
        className="secondary clear-data"
        onClick={() => setConfirmation('all')}
      >
        Limpar dados locais
      </button>
      {confirmation && (
        <section className="card confirm" role="alert">
          <h2>
            {confirmation === 'all'
              ? 'Limpar todos os dados locais?'
              : 'Excluir este material?'}
          </h2>
          <p>Esta ação é permanente.</p>
          <div className="actions">
            <button
              onClick={() =>
                void mutate(
                  async () => {
                    if (confirmation === 'all') {
                      await drafts.clear()
                      clearRecovery()
                      if (!easy) toggle()
                      localStorage.removeItem('pf-easy')
                    } else await drafts.remove(confirmation)
                  },
                  confirmation === 'all'
                    ? 'Dados locais limpos.'
                    : 'Material excluído.',
                )
              }
            >
              Confirmar
            </button>
            <button className="secondary" onClick={() => setConfirmation(null)}>
              Cancelar
            </button>
          </div>
        </section>
      )}
    </>
  )
}
function Future() {
  const { feature } = useParams()
  const info = upcoming[feature as keyof typeof upcoming]
  return (
    <>
      <h1>{info?.[0] ?? 'Recursos futuros'}</h1>
      {info ? (
        <div className="card">
          <strong>Em breve</strong>
          <p>{info[1]}</p>
        </div>
      ) : (
        <div className="grid">
          {Object.entries(upcoming).map(([key, [name, description]]) => (
            <Link
              className="card library-link"
              key={key}
              to={'/app/em-breve/' + key}
            >
              <strong>{name} · Em breve</strong>
              <span>{description}</span>
            </Link>
          ))}
        </div>
      )}
      <p>
        <Link to="/app">Voltar ao início</Link>
      </p>
    </>
  )
}
function CreateRoute() {
  const { tool } = useParams()
  const [params] = useSearchParams()
  if (!tool || !Object.hasOwn(tools, tool)) return <Missing />
  return (
    <OpenEditor
      key={tool + params.toString()}
      tool={tool as Tool}
      params={params}
    />
  )
}

function OpenEditor({ tool, params }: { tool: Tool; params: URLSearchParams }) {
  const group = params.get('faixa')
  const model = params.get('modelo') ?? '0'
  const packId = model.startsWith('pf327-') ? model : undefined
  const [preset, setPreset] = useState<PackTemplate | null>()
  useEffect(() => {
    if (!packId) return
    let active = true
    void loadPack(tool)
      .then((models) => {
        if (active) setPreset(models.find((item) => item.id === packId) ?? null)
      })
      .catch(() => {
        if (active) setPreset(null)
      })
    return () => {
      active = false
    }
  }, [tool, packId])
  if (packId && preset === undefined)
    return <p role="status">Carregando modelo…</p>
  if (packId && !preset)
    return (
      <>
        <p role="alert">Modelo indisponível.</p>
        <Link to="/app/modelos">Voltar ao catálogo</Link>
      </>
    )
  const selected = classroom.find(
    (item) =>
      item.id === params.get('colecao') && item.tool === tool && item.visual,
  )
  const visualPreset: PackTemplate | undefined = selected?.visual
    ? {
        id: 'sala-' + selected.id,
        tool,
        title: selected.title,
        topic: selected.category,
        age: 'Todas as faixas',
        subtype: 'Coleção de sala de aula',
        description: selected.description,
        keywords: [],
        values: { ...selected.visual, collectionId: selected.id },
      }
    : undefined
  const props = {
    tool,
    model: packId ? 0 : Number(model),
    preset: preset ?? visualPreset,
    draftId: params.get('rascunho'),
    age:
      !packId && group !== null && groups[Number(group)]
        ? Number(group)
        : undefined,
  }
  return (
    <Suspense fallback={<p role="status">Abrindo ferramenta…</p>}>
      {['postagem', 'painel', 'fotos-em-pdf'].includes(tool) ? (
        <Visual {...props} />
      ) : (
        <Editor {...props} />
      )}
    </Suspense>
  )
}
function Missing() {
  return (
    <>
      <h1>Página não encontrada</h1>
      <Link to="/app">Voltar ao início</Link>
    </>
  )
}
export function App() {
  const [easy, setEasy] = useState(() => {
    try {
      return localStorage.getItem('pf-easy') !== 'off'
    } catch {
      return true
    }
  })
  const { pathname } = useLocation()
  const previousPath = useRef(pathname)
  useEffect(() => {
    const main = document.getElementById('conteudo')
    main?.setAttribute('tabindex', '-1')
    if (previousPath.current !== pathname) {
      window.scrollTo(0, 0)
      main?.focus({ preventScroll: true })
      previousPath.current = pathname
    }
  }, [pathname])
  return (
    <Preference.Provider
      value={{
        easy,
        toggle: () => {
          const next = !easy
          setEasy(next)
          try {
            localStorage.setItem('pf-easy', next ? 'on' : 'off')
          } catch {
            /* preference stays in memory */
          }
        },
      }}
    >
      <a
        className="skip"
        href="#conteudo"
        onClick={(event) => {
          event.preventDefault()
          document.getElementById('conteudo')?.focus()
        }}
      >
        Pular para o conteúdo
      </a>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route index element={<Landing />} />
          <Route path="como-funciona" element={<StaticPage kind="como" />} />
          <Route path="planos" element={<StaticPage kind="planos" />} />
          <Route path="sobre" element={<StaticPage kind="sobre" />} />
          <Route
            path="privacidade"
            element={<StaticPage kind="privacidade" />}
          />
          <Route path="termos" element={<StaticPage kind="termos" />} />
          <Route path="ajuda" element={<Help />} />
        </Route>
        <Route path="app" element={<InternalLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="criar" element={<Dashboard create />} />
          <Route path="criar/:tool" element={<CreateRoute />} />
          <Route path="modelos" element={<Library />} />
          <Route path="colecao" element={<ClassroomLibrary />} />
          <Route path="colecao/:id" element={<ClassroomRoute />} />
          <Route path="materiais" element={<Materials />} />
          <Route path="ajuda" element={<Help />} />
          <Route path="em-breve/:feature?" element={<Future />} />
          <Route path="*" element={<Missing />} />
        </Route>
        <Route path="*" element={<Missing />} />
      </Routes>
    </Preference.Provider>
  )
}
