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
| Fotos em PDF | Até 24 imagens JPG, PNG ou WebP, ordem e legendas, 1, 2 ou 4 fotos por folha A4 vertical ou horizontal |
| Postagens | Cinco formatos, modelos, foto opcional, personalização de cores e fontes, download PNG e legenda |
| Painéis | Sete temas e PDFs A4 em grades de 4 ou 9 folhas com sobreposição e marcas de corte |
| Meus materiais | Rascunhos locais, reabertura, renomeação, duplicação, exclusão e limpeza |
| Modelos prontos | Busca por nome e filtro por ferramenta |

Os rascunhos ficam no IndexedDB do navegador. Fotos e texto extraído são temporários. Se mudar de dispositivo, navegador, porta ou endereço, abra novamente a origem anterior para encontrar seus rascunhos. Use dados fictícios nos testes.

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

O Playwright serve o build de produção e gera um relatório HTML em `playwright-report/`. A verificação inicial cobriu 5 testes unitários e 14 testes de navegador, incluindo um lote de 18 imagens. A checagem móvel usou emulação. A impressão em papel ficou sem verificação.

## Manutenção

- Edite os nomes, temas e modelos em `src/catalog.ts`. Altere campos e conteúdo inicial dos documentos em `src/model.ts`. A referência oficial usada para grupos, direitos e campos é a [BNCC do MEC](https://basenacionalcomum.mec.gov.br/images/BNCC_EI_EF_110518_versaofinal_site.pdf). Os objetivos dos modelos são propostas editáveis. Códigos identificados como oficiais exigem fonte e conferência.
- Ajuste as cores e estilos da aplicação no início de `src/styles.css`. A composição das artes fica em `src/media.ts` e as paletas dos modelos em `src/visual.tsx`.
- React, React Router, Vite, Tailwind e Lucide compõem a interface. `docx` escreve Word, Mammoth lê seu texto, PDF.js lê PDFs em worker local, `pdf-lib` gera PDFs, JSZip valida a estrutura DOCX e Canvas desenha as artes.
- Para integrar serviços no futuro, preserve o catálogo e os tipos de materiais. Introduza uma implementação de serviço atrás de uma interface por capacidade, com uma ação de envio explícita, permissões reais, consentimento adequado e chaves no servidor. Mantenha os geradores locais disponíveis. A disponibilidade atual de ferramentas é definida pelas rotas locais em `src/pages.tsx` e pela lista de recursos futuros em `src/catalog.ts`.
