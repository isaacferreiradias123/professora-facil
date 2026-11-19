# Professora Fácil

## Acervo de Educação Infantil

Os PDFs do primeiro lote ficam no catálogo como **Pronto para imprimir**. As adaptações dos cartazes, formas e fichas de contagem usam materiais da [Abby the Pup](https://www.abbythepup.com/about-us), sob [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/deed.pt-br), e preservam os créditos nos arquivos. As fichas de pareamento foram reconstruídas em português com ilustrações do ateliê. A galeria inclui duas figuras adaptadas de *Feelings*, com crédito à Abby the Pup.

Ateliê digital local para professoras da Educação Infantil criarem atividades, planos de aula, relatórios, recados, documentos, álbuns de fotos, postagens e painéis em folhas A4 — sem cadastro e 100% no navegador.

[Abrir a versão publicada](https://isaacferreiradias123.github.io/professora-facil/)

## Iniciar

Com Node.js 24 ou Bun no workspace:

```sh
npm ci
npm run dev
```

<details>
<summary>Comandos para o workspace portátil no Windows</summary>

```powershell
.\00_Central\Scripts\run_tool.cmd bun run --cwd '03_Projetos\Websites\Professora-Facil' dev
```

</details>

## O que o projeto oferece

| Ferramenta | Recursos principais |
| --- | --- |
| **Atividades e vivências** | 16 modelos únicos + 3 montadores livres (Contagem 1–6, Pareamento com embaralhamento e Traçado motor), Jogo da Memória, pauta infantil e 4 temas de impressão (incl. Econômico P&B) |
| **Planos de aula** | 4 estruturas reais (Diário, Semanal Segunda–Sexta em A4 paisagem, Sequência Didática e Plano de Creche) com selos clicáveis da BNCC |
| **Relatórios e registros** | 6 estruturas distintas (BNCC, Diário de bordo, Coletivo, Adaptação, Projeto e Síntese ilustrada para famílias) + ideias do que observar por faixa etária |
| **Documentos e recados** | 8 recados em 1, 2 ou 4 bilhetes por folha A4, escolha de arte e canhoto + 6 documentos escolares (incl. Checklist e Autorização) + Editar Word (`.docx`) + Responder PDF |
| **Fotos em PDF** | Montador direto com 5 estilos (incl. Polaroid com moldura e legenda), rotação, recorte ajustável e prévia em tempo real |
| **Postagens e avisos** | 6 composições gráficas em Canvas (Convite festivo, Caderno, Aviso, Polaroid, Ilustrado e Editorial), 6 paletas, 26 ilustrações na galeria e exportação PNG + legenda |
| **Painéis e kits A4** | 6 murais em mosaico A4 (incl. Aniversariantes 12 meses e Ciclo da Borboleta) + 6 kits recortáveis ilustrados + fatiador de imagem própria em grade até 4 × 4 |
| **Meus materiais** | Rascunhos locais no IndexedDB, recuperação automática após recarregar, filtro por ferramenta e exportação/importação JSON |

## Verificações

```sh
npm run lint
npm run typecheck
npm test
npm run build
npm run e2e
```
