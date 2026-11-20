import {
  lazy,
  Suspense,
  useEffect,
  useRef,
  useState,
  type FormEvent,
} from 'react'
import {
  BookOpen,
  Folder,
  Home,
  LifeBuoy,
  Search,
} from 'lucide-react'
import {
  Link,
  Navigate,
  NavLink,
  Outlet,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom'
import { tools, tutorials, type Tool } from './catalog'
import { drafts, newId, type Draft } from './store'
import { clearRecovery, editableFile, importEditable } from './draft-transfer'
import { download, filename, type VisualPreset } from './workflow'
import { FileDrop } from './editor-ui'
import { clearSchoolProfile, loadSchoolProfile, saveSchoolProfile, type SchoolProfile } from './school-profile'
import {
  ClassroomLibrary,
  ClassroomTabs,
  CollectionShowcase,
  draftLink,
} from './classroom'
import { classroom } from './classroom-catalog'
import { assetUrl } from './classroom-layout'

const ClassroomRoute = lazy(() => import('./classroom-editor'))
const Visual = lazy(() => import('./visual'))
const DocumentResponse = lazy(() => import('./document-response-view'))
const WordEditor = lazy(() => import('./word-edit-view'))

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
        width="38"
        height="38"
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
          <Link className="button nav-cta" to="/app">
            Abrir painel
          </Link>
        </nav>
      </header>
      <main id="conteudo" className="public-main">
        <Outlet />
      </main>
      <footer className="public-footer">
        <Brand />
        <nav aria-label="Informações">
          {[
            ['/como-funciona', 'Como funciona'],
            ['/sobre', 'Sobre'],
            ['/ajuda', 'Ajuda'],
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
  ['/app', 'Início', Home],
  ['/app/colecao', 'Modelos', BookOpen],
  ['/app/materiais', 'Materiais', Folder],
  ['/app/ajuda', 'Ajuda', LifeBuoy],
] as const

function InternalLayout() {
  return (
    <div className="shell">
      <aside className="sidebar">
        <Brand />
        <nav aria-label="Área de trabalho">
          {destinations.map(([p, n, Icon]) => (
            <NavLink key={p} end={p === '/app'} to={p}>
              <Icon size={20} strokeWidth={2.1} aria-hidden="true" />
              <span>{n}</span>
            </NavLink>
          ))}
        </nav>
      </aside>
      <div className="workspace">
        <header className="workspace-header">
          <span className="mobile-brand">
            <Brand />
          </span>
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
        <span className="step-badge" aria-hidden="true">1</span>
        <div>
          <strong>Escolha um modelo ou comece do zero</strong>
          <p>Encontre atividades, tarefas numeradas, planos, recados ou painéis sem poluição.</p>
        </div>
      </li>
      <li>
        <span className="step-badge" aria-hidden="true">2</span>
        <div>
          <strong>Personalize com prévia ao vivo</strong>
          <p>Ajuste textos, questões, letras em Caixa Alta ou Andika, e veja a folha A4 na hora.</p>
        </div>
      </li>
      <li>
        <span className="step-badge" aria-hidden="true">3</span>
        <div>
          <strong>Baixe em PDF, Word ou imprima</strong>
          <p>Imprima com margens limpas em A4, use Econômico P&B ou envie às famílias.</p>
        </div>
      </li>
    </ol>
  )
}

const faqs = [
  [
    'Preciso criar conta ou pagar?',
    'Não. Todo o site funciona diretamente no seu navegador, sem cadastro e sem custos.',
  ],
  [
    'Posso montar uma tarefa ou prova com cabeçalho e questões numeradas?',
    'Sim. Use a opção Montar tarefa ou prova para inserir escola, data, nome, matéria e combinar questões com linhas, caligrafia, múltipla escolha, V/F ou espaço de desenho.',
  ],
  [
    'Onde ficam meus materiais salvos?',
    'Os rascunhos e os dados da sua escola ficam guardados localmente neste navegador. Você pode exportar uma cópia em Materiais para levar a outro aparelho.',
  ],
  [
    'Consigo imprimir sem gastar tinta colorida?',
    'Sim. Todos os materiais A4 trazem a opção Econômico P&B no seletor de estilo de impressão.',
  ],
  [
    'Como funciona editar Word ou escrever em PDF?',
    'Você abre arquivos do seu aparelho, preenche ou edita textos direto na tela e baixa uma cópia limpa sem enviar nada para servidores.',
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

function Landing() {
  return (
    <div className="school-home">
      <section className="school-hero">
        <div className="school-hero-copy">
          <h1>Materiais para usar com a sua turma.</h1>
          <p>
            Tarefas e provas do zero, atividades ilustradas, planos com BNCC,
            recados em até 4 vias, álbuns de fotos e murais em folhas A4.
          </p>
          <div className="school-hero-actions">
            <Link className="button" to="/app">
              Criar um material
            </Link>
            <Link to="/app/colecao/criar-tarefa">Montar tarefa ou prova</Link>
            <Link to="/app/colecao">Explorar coleção</Link>
          </div>
        </div>
        <img
          src={assetUrl('mesa-professora.webp')}
          width="1080"
          height="750"
          alt="Folha de atividade, lápis, envelope e um sol de papel sobre a mesa"
          fetchPriority="high"
        />
      </section>

      <section className="school-home-section" aria-label="Ferramentas disponíveis">
        <ClassroomTabs />
      </section>

      <section className="school-home-section">
        <div className="school-section-head">
          <div>
            <h2>Abra, personalize e imprima</h2>
            <p>
              Modelos práticos da Educação Infantil ao Fundamental I, com edição
              simples e prévia em tempo real.
            </p>
          </div>
          <div className="actions">
            <Link to="/app/colecao">Ver toda a coleção</Link>
            <Link to="/app/colecao?acervo=pt-br">Acervo em português</Link>
          </div>
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
    <div className="school-dashboard">
      <h1>Como podemos ajudar?</h1>
      <Steps />
      <section className="band">
        <div className="card quick-help-card">
          <h2>Novidade: Montar tarefa ou prova completa</h2>
          <p>
            Crie uma folha organizada com escola, professora, data, nome e matéria,
            e adicione questões numeradas (linhas simples, pauta de caligrafia,
            múltipla escolha, V ou F, ligue ou desenho) em A4.
          </p>
          <Link className="button" to="/app/colecao/criar-tarefa">
            Montar minha tarefa agora
          </Link>
        </div>
      </section>
      <section className="band">
        <h2>Guia rápido por ferramenta</h2>
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
    </div>
  )
}

function StaticPage({ kind }: { kind: string }) {
  if (kind === 'como')
    return (
      <>
        <h1>Como funciona</h1>
        <Steps />
        <p>
          <Link className="button" to="/app">
            Experimentar gratuitamente
          </Link>
        </p>
      </>
    )
  if (kind === 'sobre')
    return (
      <>
        <h1>Sobre o Professora Fácil</h1>
        <p>
          O Professora Fácil nasceu para simplificar o dia a dia de professoras da
          creche à pré-escola, reunindo atividades imprimíveis, planejamentos,
          relatórios, recados, álbuns, postagens e murais em um só lugar.
        </p>
        <Link className="button" to="/app">
          Conhecer as ferramentas
        </Link>
      </>
    )
  if (kind === 'privacidade')
    return (
      <>
        <h1>Privacidade</h1>
        <p>
          O aplicativo processa arquivos inteiramente no seu navegador. Nenhum
          documento, foto ou rascunho é enviado a servidores externos.
        </p>
        <p>
          Os rascunhos salvos ficam no armazenamento local deste dispositivo. Use
          nomes fictícios quando estiver testando e gerencie suas cópias em Meus
          materiais.
        </p>
        <Link to="/app/materiais">Gerenciar dados locais</Link>
      </>
    )
  return (
    <>
      <h1>Termos de uso</h1>
      <p>
        O Professora Fácil é uma ferramenta gratuita para preparação de materiais
        pedagógicos locais. Revise sempre os documentos antes de imprimir ou
        compartilhar com as famílias.
      </p>
      <p>
        Guarde uma cópia dos materiais que deseja conservar. A limpeza dos dados
        do navegador pode remover rascunhos armazenados localmente.
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
      {selection.map((tool) => {
        const info = tools[tool]
        return (
          <Link
            className="tool card school-tool-card"
            to={toolEntry(tool)}
            key={tool}
          >
            <img
              src={assetUrl(info.image)}
              height="68"
              width="68"
              alt=""
            />
            <div className="tool-copy">
              <h3>{info.name}</h3>
              <p>{info.description}</p>
              <div className="tool-badges" aria-hidden="true">
                {info.outputs.map((badge) => (
                  <span key={badge}>{badge}</span>
                ))}
              </div>
            </div>
          </Link>
        )
      })}
    </div>
  )
}

const toolGroups: [string, Tool[]][] = [
  ['Planejar e registrar', ['atividade', 'plano-de-aula', 'relatorio']],
  ['Comunicar e montar', ['documento', 'fotos-em-pdf', 'postagem', 'painel']],
]

function Dashboard() {
  const [recent, setRecent] = useState<Draft[]>([])
  const [search, setSearch] = useState('')
  const [profile, setProfile] = useState<SchoolProfile>(() => loadSchoolProfile())
  const [profileNotice, setProfileNotice] = useState('')
  const navigate = useNavigate()

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

  function handleSearch(event: FormEvent) {
    event.preventDefault()
    const term = search.trim()
    navigate(term ? '/app/colecao?q=' + encodeURIComponent(term) : '/app/colecao')
  }

  return (
    <div className="school-dashboard-page">
      <section className="welcome">
        <div className="welcome-copy">
          <h1>Olá! O que vamos preparar hoje?</h1>
          <p>
            Monte uma tarefa do zero, escolha um dos {classroom.length} modelos da
            coleção ou personalize PDFs prontos.
          </p>
        </div>
        <form className="welcome-search" onSubmit={handleSearch} role="search">
          <label className="sr-only" htmlFor="busca-inicio">
            Buscar modelo
          </label>
          <span>
            <Search size={18} aria-hidden="true" />
            <input
              id="busca-inicio"
              type="search"
              placeholder="Buscar tarefa, atividade, recado ou turma..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </span>
          <button type="submit">Buscar</button>
        </form>
      </section>

      <section className="quick-starts" aria-label="Atalhos principais">
        <Link className="card quick-start-card" to="/app/colecao/criar-tarefa">
          <strong>Montar tarefa ou prova</strong>
          <p>Cabeçalho escolar + questões numeradas 1, 2, 3 em folha A4 e Word.</p>
        </Link>
        <Link className="card quick-start-card" to="/app/criar/fotos-em-pdf">
          <strong>Organizar fotos em PDF</strong>
          <p>Distribua 1 a 4 fotos por página A4 ou use molduras Polaroid com legenda.</p>
        </Link>
        <Link className="card quick-start-card" to="/app/colecao?acervo=pt-br">
          <strong>Atividades prontas em PDF (200)</strong>
          <p>Folhas ilustradas para baixar ou estampar com seu cabeçalho escolar.</p>
        </Link>
      </section>

      <details className="card school-profile-card">
        <summary>
          Meus dados da escola{profile.school ? ' · ' + profile.school : ''}
        </summary>
        <p>
          Preencha uma vez para aplicar em 1 clique nas suas tarefas, planos e PDFs.
        </p>
        <div className="school-form-grid">
          <label>
            Nome da escola
            <input
              type="text"
              maxLength={70}
              placeholder="Ex.: E.M. Paulo Freire"
              value={profile.school}
              onChange={(e) => setProfile({ ...profile, school: e.target.value })}
            />
          </label>
          <label>
            Seu nome (Professora)
            <input
              type="text"
              maxLength={60}
              placeholder="Ex.: Profa. Ana"
              value={profile.teacher}
              onChange={(e) => setProfile({ ...profile, teacher: e.target.value })}
            />
          </label>
          <label>
            Turma padrão
            <input
              type="text"
              maxLength={40}
              placeholder="Ex.: Pré II ou 3º ano B"
              value={profile.classroom}
              onChange={(e) => setProfile({ ...profile, classroom: e.target.value })}
            />
          </label>
        </div>
        <div className="actions">
          <button
            type="button"
            onClick={() => {
              const saved = saveSchoolProfile(profile)
              setProfile(saved)
              setProfileNotice('Dados da escola salvos neste dispositivo.')
            }}
          >
            Salvar dados da escola
          </button>
          <button
            type="button"
            className="secondary"
            onClick={() => {
              clearSchoolProfile()
              setProfile(loadSchoolProfile())
              setProfileNotice('Dados da escola removidos.')
            }}
          >
            Limpar
          </button>
        </div>
        {profileNotice && <p role="status">{profileNotice}</p>}
      </details>

      {recent.length > 0 && (
        <section className="recent-materials">
          <h2>Continuar um material</h2>
          <ul>
            {recent.map((item) => (
              <li key={item.id}>
                <Link className="recent-pill" to={draftLink(item)}>
                  <span>{item.name}</span>
                  <small>{tools[item.tool].shortName}</small>
                </Link>
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
    </div>
  )
}

function Materials() {
  const [list, setList] = useState<Draft[] | null>(null)
  const [filterTool, setFilterTool] = useState('')
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

  const visible =
    list?.filter((item) => !filterTool || item.tool === filterTool) ?? null

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

      {list && list.length > 0 && (
        <div className="materials-filter">
          <label>
            Filtrar por ferramenta
            <select
              value={filterTool}
              onChange={(e) => setFilterTool(e.target.value)}
            >
              <option value="">Todas ({list.length})</option>
              {(Object.keys(tools) as Tool[]).map((key) => (
                <option key={key} value={key}>
                  {tools[key].shortName}
                </option>
              ))}
            </select>
          </label>
        </div>
      )}

      <p role="status">{message}</p>
      {visible?.length === 0 ? (
        <div className="card">
          <h2>Seu primeiro material começa aqui</h2>
          <p>
            Escolha um modelo, personalize e toque em Salvar rascunho para
            encontrar aqui depois.
          </p>
          <Link className="button" to="/app/colecao">
            Explorar modelos
          </Link>
        </div>
      ) : (
        visible?.map((d) => (
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
                <div className="actions">
                  <button type="submit">Salvar nome</button>
                  <button
                    type="button"
                    className="secondary"
                    onClick={() => setEditing('')}
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div className="actions">
                <Link className="button" to={draftLink(d)}>
                  Editar
                </Link>
                <button
                  type="button"
                  className="secondary"
                  onClick={() => {
                    setEditing(d.id)
                    setName(d.name)
                  }}
                >
                  Renomear
                </button>
                <button
                  type="button"
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
                  type="button"
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
                  type="button"
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
        type="button"
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
              type="button"
              onClick={() =>
                void mutate(
                  async () => {
                    if (confirmation === 'all') {
                      await drafts.clear()
                      clearRecovery()
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
            <button
              type="button"
              className="secondary"
              onClick={() => setConfirmation(null)}
            >
              Cancelar
            </button>
          </div>
        </section>
      )}
    </>
  )
}

function CreateRoute() {
  const { tool } = useParams()
  const [params] = useSearchParams()
  if (!tool || !Object.hasOwn(tools, tool)) return <Missing />
  if (!['postagem', 'painel', 'fotos-em-pdf'].includes(tool)) {
    return <Navigate replace to={'/app/colecao?ferramenta=' + tool} />
  }
  const selected = classroom.find(
    (item) =>
      item.id === params.get('colecao') && item.tool === tool && item.visual,
  )
  const visualPreset: VisualPreset | undefined = selected?.visual
    ? {
        id: 'sala-' + selected.id,
        title: selected.title,
        values: { ...selected.visual, collectionId: selected.id },
      }
    : undefined

  return (
    <Suspense fallback={<p role="status">Abrindo ferramenta…</p>}>
      <Visual
        key={tool + params.toString()}
        tool={tool as Tool}
        model={0}
        preset={visualPreset}
        draftId={params.get('rascunho')}
      />
    </Suspense>
  )
}

function Missing() {
  return (
    <>
      <h1>Página não encontrada</h1>
      <Link className="button" to="/app">
        Voltar ao início
      </Link>
    </>
  )
}

export function App() {
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
    <>
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
          <Route path="criar" element={<Navigate replace to="/app" />} />
          <Route path="criar/:tool" element={<CreateRoute />} />
          <Route
            path="modelos"
            element={<Navigate replace to="/app/colecao" />}
          />
          <Route
            path="responder"
            element={
              <Suspense fallback={<p role="status">Abrindo editor…</p>}>
                <DocumentResponse />
              </Suspense>
            }
          />
          <Route
            path="editar-word"
            element={
              <Suspense fallback={<p role="status">Abrindo editor…</p>}>
                <WordEditor />
              </Suspense>
            }
          />
          <Route path="colecao" element={<ClassroomLibrary />} />
          <Route
            path="colecao/:id"
            element={
              <Suspense fallback={<p role="status">Abrindo material…</p>}>
                <ClassroomRoute />
              </Suspense>
            }
          />
          <Route path="materiais" element={<Materials />} />
          <Route path="ajuda" element={<Help />} />
          <Route path="*" element={<Missing />} />
        </Route>
        <Route path="*" element={<Missing />} />
      </Routes>
    </>
  )
}
