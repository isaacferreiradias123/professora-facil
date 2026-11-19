# Professora Fácil

Ferramentas locais para professoras da Educação Infantil. Abra a página inicial e clique em **Experimentar gratuitamente**. A área de trabalho já abre com o Modo Fácil ligado.

[Abrir a versão de teste](https://isaacferreiradias123.github.io/professora-facil/)

## Iniciar

Na raiz do projeto, com Node.js 24:

```sh
npm ci
npm run dev
```

Abra `http://localhost:5173/` ou o endereço exibido pelo Vite.

<details>
<summary>Comandos para o workspace portátil no Windows</summary>

No PowerShell, a partir da raiz de `CODEX PROJETO`:

```powershell
Set-Location '.\03_Projetos\Websites\Professora-Facil'
..\..\..\00_Central\Scripts\run_tool.cmd node ../../../02_Ferramentas/_runtime/node/node-v24.22.1-win-x64/node_modules/npm/bin/npm-cli.js ci --cache ../../../08_Temporarios/professora-npm
..\..\..\00_Central\Scripts\run_tool.cmd bun run dev
```

</details>

### Testar em um celular na mesma rede

Na pasta do projeto, execute `npm run build` e depois `npm run preview -- --host 0.0.0.0`. Abra no telefone o endereço `Network` que o Vite mostrar, normalmente na porta 4173. Use a mesma rede local. O navegador pode exigir HTTPS para a área de transferência automática. Nessa situação, abra a legenda e use a seleção de texto.

## O que você pode fazer

| Ferramenta | Resultado |
| --- | --- |
| Atividades, planos e relatórios | Modelos editáveis, prévia, Word, PDF A4 e impressão |
| Documentos | Modelos editáveis, leitura de texto de DOCX e PDF, resposta manual em um novo Word ou PDF |
| Fotos em PDF | Até 24 imagens JPG, PNG ou WebP, com rotação, recorte, legendas, quebras manuais e 1, 2 ou 4 fotos por folha A4 |
| Postagens | Cinco formatos, modelos, foto opcional, personalização de cores e fontes, download PNG e legenda |
| Painéis | Sete temas, grades A4 de até 4 × 4, tamanho final, mapa, sobreposição e marcas de corte |
| Meus materiais | Rascunhos locais, recuperação após recarregar, cópia editável em JSON, duplicação e limpeza |
| Modelos prontos | Busca e filtros por ferramenta, faixa etária, tema e campo de experiências |

Experimente pareamento, sequência ilustrada e traçado no catálogo de atividades. No plano, adicione e ordene os momentos da aula e confira o tempo total. A prévia aparece durante a edição e também antes de baixar.

Os rascunhos ficam no IndexedDB do navegador. O navegador também guarda temporariamente os campos da edição para recuperar o trabalho após recarregar. Para transferir o conteúdo de um rascunho entre dispositivos, use **Baixar cópia editável** e **Importar cópia editável** em **Meus materiais**. Fotos e texto extraído são temporários. Se mudar de dispositivo, navegador, porta ou endereço, abra novamente a origem anterior para encontrar seus rascunhos. Use dados fictícios nos testes.

A primeira versão não inclui OCR, edição do arquivo original, geração de vídeo, IA, voz, contas, sincronização, colaboração ou cobrança. Os planos são ilustrativos. A impressão depende do suporte do navegador a PDF. Se necessário, baixe o arquivo e imprima pelo leitor de PDF do aparelho.

Limites de importação: 12 MB por documento, até 60 páginas por PDF e 100 mil caracteres extraídos. São aceitas imagens de até 14 MB; imagens de alta resolução são redimensionadas para uso no navegador e imagens com mais de 48 megapixels são recusadas. O recorte central é opcional e deve ser revisado na prévia. Os PDFs textuais usam Noto Sans Latin, com cobertura dos acentos em português. Caracteres fora do conjunto da fonte podem aparecer como ponto de interrogação no PDF.

## Verificações

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium webkit
npm run e2e
```

O Playwright serve o build de produção e gera um relatório HTML em `playwright-report/`. A suíte cobre os editores, a recuperação e importação de rascunhos, o gabarito em folha separada, as grades de painel e um lote de 18 fotos. A checagem móvel usou emulação. A impressão em papel ficou sem verificação.

## Manutenção

- Edite os nomes, temas e modelos em `src/catalog.ts`. Altere campos e conteúdo inicial dos documentos em `src/model.ts`. A referência oficial usada para grupos, direitos e campos é a [BNCC do MEC](https://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf). Os objetivos dos modelos são propostas editáveis. Códigos identificados como oficiais exigem fonte e conferência.
- Ajuste as cores e estilos da aplicação no início de `src/styles.css`. A composição das artes fica em `src/media.ts` e as paletas dos modelos em `src/visual.tsx`.
- React, React Router, Vite, Tailwind e Lucide compõem a interface. `docx` escreve Word, Mammoth lê seu texto, PDF.js lê PDFs em worker local, `pdf-lib` gera PDFs, JSZip valida a estrutura DOCX e Canvas desenha as artes.
- Para integrar serviços no futuro, preserve o catálogo e os tipos de materiais. Introduza uma implementação de serviço atrás de uma interface por capacidade, com uma ação de envio explícita, permissões reais, consentimento adequado e chaves no servidor. Mantenha os geradores locais disponíveis. A disponibilidade atual de ferramentas é definida pelas rotas locais em `src/pages.tsx` e pela lista de recursos futuros em `src/catalog.ts`.
## Coleção de sala de aula

A [vitrine nova](https://isaacferreiradias123.github.io/professora-facil/#/app/colecao) tem 46 materiais. Inclui 16 atividades próprias, seis recados, quatro painéis, oito planos, dois registros, três documentos escolares, três artes, três álbuns e uma folha pronta de origem externa. Filtros por nome de turma usam os grupos etários da BNCC como referência, conforme as práticas de cada rede.

- Em **Criar atividade**, escolha a turma ou monte uma ficha de contagem com frutas, animais ou materiais escolares. O PDF da pré-escola inclui só a folha da criança por padrão. O roteiro pode ser incluído separadamente no mesmo arquivo. Os planos têm objetivo, preparação, três momentos editáveis, duração total e observação.
- Os recados podem sair em uma folha inteira ou em duas vias recortáveis. O passeio inclui canhoto. A prévia e o PDF A4 compartilham a composição de página. O Word mantém títulos, tabelas e campos editáveis e pode variar conforme a fonte e a versão do editor.
- O painel de boas-vindas é um mosaico de quatro folhas, mais um guia com mapa. Imprima a 100%, com sobreposição de 5 mm. Os outros painéis têm cabeçalho e cartões individuais para recortar.
- Os dados estão em `src/classroom-catalog.ts`. A geometria de prévia e PDF está em `src/classroom-layout.ts`. As ilustrações locais estão em `public/colecao/`. As artes editoriais e do mural foram produzidas para este projeto com geração de imagem durante o desenvolvimento. As figuras PNG foram desenhadas para o projeto ou recortadas dessas artes. O aplicativo funciona localmente.

A folha [Fruits Lineart](https://openclipart.org/detail/244989/fruits-lineart), de **frankes**, é distribuída sob [CC0 segundo a política do Openclipart](https://openclipart.org/share). O PDF original e a imagem de prévia são redistribuídos sem mudanças no arquivo. As orientações de uso em português são do projeto. O [caderno de uma turma Pré II do eduCAPES](https://educapes.capes.gov.br/handle/capes/722502), os [Percursos Curriculares de Belo Horizonte](https://wiki.pbh.gov.br/educacao/percursos-curriculares/doku.php/5_acoes_mediacoes_e_estimulacoes_para_o_desenvolvimento_e_a_aquisicao_de_aprendizagens_das_criancas_de_0_a_3_anos) e a [proposta curricular de Marília](https://educacao.marilia.sp.gov.br/arquivos/proposta_curricular_para_a_educacao_infantil_-_marilia_15110632_17125235.pdf) orientaram conteúdos e formatos próprios.

## Ferramentas e formatos escolares

- **Atividades e planos.** A área Criar oferece fichas de contagem e pareamento com grupos de figuras. O plano aceita um momento opcional de extensão ou adaptação.
- **Relatórios e documentos.** Registros individuais e coletivos separam identificação, contexto, observações, evidências e próximos passos. Ata, declaração de comparecimento e registro de entrega têm campos e assinaturas próprios. O Word mantém títulos e tabelas editáveis. Os recados têm ilustrações originais de reunião, passeio, materiais e evento.
- **Fotos, postagens e painéis.** O álbum aceita título, subtítulo e numeração. A postagem tem composições de mensagem, convite, aviso e registro com foto. O painel divide uma imagem inteira em folhas A4 e pode incluir um mapa no PDF. Os kits recortáveis aceitam os textos dos cartões.

Os materiais e as ilustrações da atualização foram produzidos para o projeto. As referências orientaram a estrutura dos arquivos.

- [Orientações para o registro da avaliação na Educação Infantil da Prefeitura do Rio](https://www.rio.rj.gov.br/dlstatic/10112/15272703/4381706/OrientacoesparaoregistrodaavaliacaonaEducacaoInfantil.pdf)
- [Proposta curricular para a Educação Infantil de Marília](https://educacao.marilia.sp.gov.br/arquivos/proposta_curricular_para_a_educacao_infantil_-_marilia_15110632_17125235.pdf)
- [Títulos e tabelas acessíveis no Microsoft Word](https://support.microsoft.com/en-us/accessibility/word/make-your-word-documents-accessible-to-people-with-disabilities)
- [Legendas e numeração de folhas no Lightroom Classic](https://helpx.adobe.com/lightroom-classic/desktop/print-photos/print-module-layouts-templates.html)
- [Sobreposição, identificação e marcas de corte no Adobe Acrobat](https://helpx.adobe.com/au/acrobat/desktop/print-documents/booklets-posters-banners/posters-banners.html)

## Modelos anteriores

A coleção local acrescenta 327 modelos à biblioteca anterior. Os modelos de cada ferramenta são carregados sob demanda. A licença do material recebido está em `src/pack/LICENCA.txt`. Fichas têm download vetorial independente e uma página ilustrada em Word e PDF. A ilustração editorial da Home foi produzida para o projeto e é servida como WebP local. A galeria combina os 24 elementos licenciados do pacote com cinco SVGs próprios.

A [biblioteca Openclipart](https://openclipart.org/faq) foi pesquisada como fonte opcional. O [MEC](https://alfabetizacao.mec.gov.br/images/conta-pra-mim/livros/versao_digital/atividades_dia_a_dia_versao_digital.pdf) e o [eduCAPES](https://educapes.capes.gov.br/handle/capes/983985?mode=simple) servem como referências pedagógicas. Os exemplos desses acervos não foram copiados para o app. Adapte as propostas à turma antes de usar.
