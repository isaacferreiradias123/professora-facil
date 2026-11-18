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
import {
  BookOpen,
  CalendarDays,
  ClipboardList,
  Images,
  Image,
  LayoutGrid,
  Files,
  Home,
  Plus,
  Folder,
  LifeBuoy,
  ArrowUpRight,
  Settings2,
} from 'lucide-react'
import { catalog, tools, tutorials, upcoming, type Tool } from './catalog'
import { drafts, newId, type Draft } from './store'

const Editor = lazy(() => import('./editor'))
const Visual = lazy(() => import('./visual'))
const Preference = createContext({ easy: true, toggle: () => {} })
export const useEasy = () => useContext(Preference).easy
const icons = {
  atividade: BookOpen,
  'plano-de-aula': CalendarDays,
  relatorio: ClipboardList,
  'fotos-em-pdf': Images,
  postagem: Image,
  painel: LayoutGrid,
  documento: Files,
}
const mainLinks = [
  ['/como-funciona', 'Como funciona'],
  ['/planos', 'Planos'],
  ['/ajuda', 'Ajuda'],
]
function Brand() {
  return (
    <Link to="/" className="brand">
      <img src={import.meta.env.BASE_URL + 'marca.svg'} alt="" width="42" height="42" />
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
            <NavLink key={p} end={p === '/app'} to={p}>
              <Icon size={21} aria-hidden="true" />
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
          <button
            className="mode"
            type="button"
            aria-pressed={easy}
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
function Examples() {
  return (
    <div
      className="example-composition"
      aria-label="Exemplo de plano de aula e arte escolar"
    >
      <div className="sample-art">
        <span>
          Mostra de
          <br />
          experiências
        </span>
        <div className="sample-sun" />
        <small>Turma Ipê · 21 de novembro</small>
      </div>
      <div className="sample-paper">
        <span>Plano de aula</span>
        <strong>
          Histórias que
          <br />a gente conta
        </strong>
        <div className="sample-lines" />
        <small>Educação Infantil</small>
      </div>
    </div>
  )
}
function Landing() {
  return (
    <>
      <section className="hero">
        <div>
          <h1>Sua rotina escolar, muito mais simples.</h1>
          <p>
            Prepare atividades, planos e materiais para a Educação Infantil.
            Escolha um modelo, personalize e use na sua turma.
          </p>
          <Link className="button" to="/app">
            Experimentar gratuitamente
          </Link>
        </div>
        <Examples />
      </section>
      <section className="band">
        <h2>Do planejamento à impressão</h2>
        <ToolGrid limit={6} />
      </section>
      <section className="band">
        <h2>Como funciona</h2>
        <Steps />
      </section>
      <section className="privacy-band">
        <h2>Seu trabalho fica no seu dispositivo</h2>
        <p>
          Fotos e documentos são processados no navegador. Você decide o que
          baixar e quais rascunhos guardar.
        </p>
        <Link to="/privacidade">Entenda a privacidade</Link>
      </section>
      <section className="band">
        <h2>Planos</h2>
        <Plans />
      </section>
      <section className="band">
        <h2>Perguntas frequentes</h2>
        <Faq />
      </section>
    </>
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
              <Link to={'/app/criar/' + k}>Abrir ferramenta</Link>
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
function ToolGrid({ limit }: { limit?: number }) {
  return (
    <div className="grid tools">
      {(Object.keys(tools) as Tool[]).slice(0, limit).map((k, i) => {
        const Icon = icons[k]
        return (
          <Link className="tool card" to={'/app/criar/' + k} key={k}>
            <span className={'tool-icon tone-' + i}>
              <Icon size={25} aria-hidden="true" />
            </span>
            <div>
              <h3>{tools[k].name}</h3>
              <p>{tools[k].description}</p>
            </div>
            <ArrowUpRight className="tool-arrow" size={19} aria-hidden="true" />
          </Link>
        )
      })}
    </div>
  )
}
function Dashboard({ create = false }: { create?: boolean }) {
  return (
    <>
      <section className="welcome">
        <h1>
          {create
            ? 'Qual material você deseja preparar?'
            : 'Olá! O que vamos preparar hoje?'}
        </h1>
        <p>Escolha o que deseja criar.</p>
      </section>
      <ToolGrid limit={create ? undefined : 6} />
      <nav className="extra-links" aria-label="Mais recursos">
        {!create && (
          <Link to="/app/criar/documento">Documentos Word e PDF</Link>
        )}
        <Link to="/app/modelos">Modelos prontos</Link>
        <Link to="/app/em-breve/videos">Vídeos escolares</Link>
        <Link to="/app/em-breve">Recursos em breve</Link>
      </nav>
    </>
  )
}
function Library() {
  const [q, setQ] = useState('')
  const [category, setCategory] = useState('')
  const found = (Object.keys(catalog) as Tool[])
    .filter((k) => !category || category === k)
    .flatMap((k) => catalog[k].map((name, i) => ({ k, name, i })))
    .filter((x) =>
      x.name
        .toLocaleLowerCase('pt-BR')
        .includes(q.trim().toLocaleLowerCase('pt-BR')),
    )
  return (
    <>
      <h1>Modelos prontos</h1>
      <div className="controls">
        <label>
          Pesquisar modelos
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </label>
        <label>
          Categoria
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          >
            <option value="">Todas</option>
            {Object.keys(catalog)
              .filter((k) => catalog[k as Tool].length)
              .map((k) => (
                <option key={k} value={k}>
                  {tools[k as Tool].name}
                </option>
              ))}
          </select>
        </label>
      </div>
      <div className="grid">
        {found.map(({ k, name, i }) => (
          <Link
            className="card library-link"
            key={k + i}
            to={'/app/criar/' + k + '?modelo=' + i}
          >
            <strong>{name}</strong>
            <span>{tools[k].name}</span>
          </Link>
        ))}
      </div>
      {!found.length && (
        <p>Nenhum modelo encontrado. Experimente outro nome ou categoria.</p>
      )}
    </>
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
                <Link
                  className="button"
                  to={'/app/criar/' + d.tool + '?rascunho=' + d.id}
                >
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
                  onClick={() => setConfirmation(d.id)}
                >
                  Excluir
                </button>
              </div>
            )}
          </article>
        ))
      )}
      <button className="secondary" onClick={() => setConfirmation('all')}>
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
  const key = tool as Tool
  const props = {
    tool: key,
    model: Number(params.get('modelo') ?? 0),
    draftId: params.get('rascunho'),
  }
  return (
    <Suspense fallback={<p role="status">Abrindo ferramenta…</p>}>
      {['postagem', 'painel', 'fotos-em-pdf'].includes(key) ? (
        <Visual key={key + params.toString()} {...props} />
      ) : (
        <Editor key={key + params.toString()} {...props} />
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
      <a className="skip" href="#conteudo" onClick={(event) => {
        event.preventDefault()
        document.getElementById('conteudo')?.focus()
      }}>
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
