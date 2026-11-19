import {
  activity,
  documents,
  fields,
  groups,
  lesson,
  reports,
  rights,
  themes,
  type Tool,
} from './catalog'
import type { Values } from './store'
import { firstIllustratedActivity, worksheet } from './activities'
import { parseMoments } from './lesson-moments'

export type Block =
  | { kind: 'text'; text: string }
  | { kind: 'list'; items: string[]; numbered?: boolean }
  | { kind: 'table'; rows: string[][] }
  | {
      kind: 'image'
      bytes: Uint8Array
      mime: 'image/png' | 'image/jpeg'
      width: number
      height: number
      alt: string
    }
export interface Material {
  title: string
  metadata: string[]
  sections: { title: string; blocks: Block[]; newPage?: boolean }[]
  accent: 'green' | 'peach' | 'mono'
}
export interface Field {
  key: string
  label: string
  kind?: 'text' | 'long' | 'date' | 'number' | 'select' | 'checks'
  options?: readonly string[]
  optional?: boolean
}
const school: Field = { key: 'school', label: 'Escola', optional: true }
const teacher: Field = { key: 'teacher', label: 'Professora', optional: true }
const date: Field = { key: 'date', label: 'Data', kind: 'date' }
const group: Field = {
  key: 'group',
  label: 'Faixa etária',
  kind: 'select',
  options: groups,
}
const title: Field = { key: 'title', label: 'Título' }
const className: Field = { key: 'class', label: 'Turma', optional: true }
export const chooseFields: Partial<Record<Tool, Field[]>> = {
  atividade: [
    group,
    { key: 'theme', label: 'Tema', kind: 'select', options: themes },
    {
      key: 'field',
      label: 'Campo de experiências',
      kind: 'select',
      options: fields,
    },
  ],
  'plano-de-aula': [group],
  relatorio: [
    {
      key: 'scope',
      label: 'Tipo de relatório',
      kind: 'select',
      options: ['Individual', 'Coletivo'],
    },
  ],
}
export const details: Partial<Record<Tool, Field[]>> = {
  atividade: [
    title,
    { key: 'instructions', label: 'Instruções', kind: 'long' },
    {
      key: 'count',
      label: 'Quantidade de propostas ou exercícios',
      kind: 'number',
    },
    {
      key: 'style',
      label: 'Modelo visual',
      kind: 'select',
      options: ['Verde-sálvia', 'Pêssego', 'Preto e branco'],
    },
    school,
    teacher,
    date,
  ],
  'plano-de-aula': [
    title,
    { key: 'theme', label: 'Tema' },
    { key: 'duration', label: 'Duração' },
    school,
    teacher,
    className,
    date,
    {
      key: 'fields',
      label: 'Campos de experiências',
      kind: 'checks',
      options: fields,
    },
    {
      key: 'rights',
      label: 'Direitos de aprendizagem',
      kind: 'checks',
      options: rights,
    },
    { key: 'objectives', label: 'Objetivos de aprendizagem', kind: 'long' },
    { key: 'materials', label: 'Materiais necessários', kind: 'long' },
    { key: 'development', label: 'Desenvolvimento da proposta', kind: 'long' },
    { key: 'play', label: 'Interações e brincadeiras', kind: 'long' },
    { key: 'inclusion', label: 'Estratégias de inclusão', kind: 'long' },
    { key: 'assessment', label: 'Observação e avaliação', kind: 'long' },
  ],
  relatorio: [
    title,
    school,
    teacher,
    className,
    date,
    {
      key: 'subject',
      label: 'Identificação com nome fictício',
      optional: true,
    },
    { key: 'context', label: 'Contexto', kind: 'long' },
    { key: 'observation', label: 'Observações', kind: 'long' },
    { key: 'next', label: 'Próximas propostas', kind: 'long' },
  ],
  documento: [
    title,
    school,
    teacher,
    date,
    { key: 'recipient', label: 'Destinatário', optional: true },
    { key: 'body', label: 'Texto do documento', kind: 'long' },
  ],
}
export function dateLabel(date: string) {
  return /^\d{4}-\d\d-\d\d$/.test(date)
    ? date.split('-').reverse().join('/')
    : ''
}
function today() {
  const date = new Date()
  return [date.getFullYear(), date.getMonth() + 1, date.getDate()]
    .map((v, i) => String(v).padStart(i ? 2 : 4, '0'))
    .join('-')
}
export function seed(tool: Tool, index: number): Values {
  const base = { model: String(index), date: today() }
  if (tool === 'atividade') {
    const m = activity[index] ?? activity[0]
    return {
      ...base,
      title: m[0],
      group: groups[index >= firstIllustratedActivity ? 2 : 0],
      theme: themes[m[1]],
      field: fields[m[2]],
      instructions:
        'Acompanhe as iniciativas das crianças e acolha diferentes formas de participação.',
      count: '3',
      style: 'Verde-sálvia',
    }
  }
  if (tool === 'plano-de-aula') {
    const m = lesson[index] ?? lesson[0]
    return {
      ...base,
      title: m[0],
      theme: m[0],
      group: groups[2],
      duration: '30 minutos',
      fields: fields[m[1]],
      rights: 'Participar|Brincar',
      objectives:
        'Participar da proposta, explorando materiais e compartilhando descobertas.',
      materials: m[2],
      development: m[3],
      play: 'Reserve um momento para escolhas e iniciativas das crianças.',
      inclusion:
        'Disponibilize os materiais ao alcance do grupo e aceite diferentes formas de expressão.',
      assessment:
        'Registre iniciativas, interações e descobertas durante a experiência.',
    }
  }
  if (tool === 'relatorio')
    return {
      ...base,
      title: reports[index] ?? reports[0],
      scope: index === 2 ? 'Coletivo' : 'Individual',
      context:
        'Durante a roda de histórias, o grupo teve contato com livros ilustrados.',
      observation:
        'Registre o que foi observado, incluindo as iniciativas e as formas de participação.',
      next: 'Oferecer novas oportunidades de exploração e registrar as escolhas.',
    }
  const doc = documents[index] ?? documents[0]
  return { ...base, title: doc[0], body: doc[1] }
}
export function material(tool: Tool, v: Values): Material {
  const sections: Material['sections'] = []
  const add = (title: string, text?: string) => {
    if (text?.trim())
      sections.push({ title, blocks: [{ kind: 'text', text: text.trim() }] })
  }
  if (tool === 'atividade') {
    const m = activity[Number(v.model)] ?? activity[0]
    const babies = v.group === groups[0]
    const older = v.group === groups[2]
    const count = Math.min(12, Math.max(1, Math.trunc(Number(v.count) || 1)))
    const extensions = babies
      ? [
          'Retome a proposta com um material maior e de textura diferente, mantendo a supervisão.',
          'Ofereça tempo para repetir ações e acolha as respostas por olhares, gestos ou sons.',
          'Observe a interação com um adulto de referência e registre uma iniciativa.',
        ]
      : older
        ? [
            'Experimente a proposta em dupla e compare as escolhas.',
            'Registre a descoberta por desenho, marcas ou relato oral.',
            'Mostre o registro ao grupo e conte como você fez.',
          ]
        : [
            'Convide as crianças a experimentar em pequenos grupos e escolher entre dois materiais.',
            'Repita a proposta em outro espaço e observe o que muda.',
            'Convide a criança a mostrar sua descoberta por gestos, fala ou movimento.',
          ]
    add('Tema', v.theme)
    add('Campo de experiências', v.field)
    add('Orientações', v.instructions)
    const illustrated = Number(v.model) - firstIllustratedActivity
    if (older && illustrated >= 0 && illustrated < 3) {
      const drawing = worksheet(illustrated, v.style === 'Preto e branco')
      sections.push({
        title: 'Folha de atividade',
        blocks: [{ kind: 'text', text: m[4] }, ...(drawing ? [drawing] : [])],
      })
      if (illustrated < 2)
        sections.push({
          title: 'Gabarito para a professora',
          newPage: true,
          blocks: [
            {
              kind: 'text',
              text:
                illustrated === 0
                  ? 'Círculo com círculo, quadrado com quadrado e triângulo com triângulo.'
                  : 'O espaço em branco deve receber um quadrado.',
            },
          ],
        })
    } else
      sections.push({
        title: older ? 'Propostas para a turma' : 'Experiências e interações',
        blocks: [
          {
            kind: 'list',
            numbered: true,
            items: [
              older ? m[4] : m[3],
              ...Array.from({ length: count - 1 }, (_, i) =>
                i < 3
                  ? extensions[i]
                  : [
                      'Com outros materiais: ',
                      'Em outro momento da rotina: ',
                      'Com novas parcerias: ',
                    ][Math.floor((i - 3) / 3)] + extensions[(i - 3) % 3],
              ),
            ],
          },
        ],
      })
  } else if (tool === 'plano-de-aula') {
    add('Tema e duração', [v.theme, v.duration].filter(Boolean).join(' · '))
    add('Campos de experiências', v.fields?.replaceAll('|', '\n'))
    add('Direitos de aprendizagem', v.rights?.replaceAll('|', '\n'))
    const moments = parseMoments(v.moments).filter((item) => item.title.trim())
    if (moments.length)
      sections.push({
        title: 'Momentos da aula',
        blocks: [
          {
            kind: 'list',
            numbered: true,
            items: moments.map(
              (item) => item.title.trim() + ' · ' + item.minutes + ' min',
            ),
          },
        ],
      })
    for (const item of details[tool]!.slice(9)) add(item.label, v[item.key])
  } else if (tool === 'relatorio') {
    add('Identificação', [v.scope, v.subject].filter(Boolean).join(' · '))
    for (const item of details[tool]!.slice(6)) add(item.label, v[item.key])
  } else {
    add('Destinatário', v.recipient)
    add('', v.body)
  }
  return {
    title: v.title?.trim() || 'Material sem título',
    metadata: [v.school, v.teacher, v.class, v.group, dateLabel(v.date)].filter(
      Boolean,
    ),
    sections,
    accent:
      v.style === 'Pêssego'
        ? 'peach'
        : v.style === 'Preto e branco'
          ? 'mono'
          : 'green',
  }
}
