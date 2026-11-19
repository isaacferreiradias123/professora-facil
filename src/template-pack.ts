import { groups, fields, themes, type Tool } from './catalog'
import type { Values } from './store'

export interface PackTemplate {
  id: string
  tool: Tool
  title: string
  topic: string
  age: string
  subtype: string
  description: string
  keywords: string[]
  values: Values
}

const loaders = {
  atividade: () => import('./pack/atividade.json'),
  'plano-de-aula': () => import('./pack/plano-de-aula.json'),
  relatorio: () => import('./pack/relatorio.json'),
  documento: () => import('./pack/documento.json'),
  postagem: () => import('./pack/postagem.json'),
  painel: () => import('./pack/painel.json'),
  'fotos-em-pdf': () => import('./pack/fotos-em-pdf.json'),
} satisfies Record<Tool, () => Promise<{ default: unknown }>>

export const packTools = Object.keys(loaders) as Tool[]
const counts: Record<Tool, number> = {
  atividade: 90,
  'plano-de-aula': 54,
  relatorio: 36,
  documento: 48,
  postagem: 45,
  painel: 30,
  'fotos-em-pdf': 24,
}
const required: Record<Tool, string[]> = {
  atividade: [
    'title',
    'group',
    'theme',
    'field',
    'instructions',
    'goal',
    'materials',
    'steps',
    'adaptation',
    'assessment',
  ],
  'plano-de-aula': [
    'title',
    'group',
    'fields',
    'rights',
    'duration',
    'objectives',
    'moments',
  ],
  relatorio: ['title', 'scope', 'context', 'observation', 'next'],
  documento: ['title', 'recipient', 'body'],
  postagem: ['title', 'body', 'background', 'foreground', 'format', 'model'],
  painel: ['title', 'body', 'background', 'foreground', 'grid', 'model'],
  'fotos-em-pdf': [
    'title',
    'orientation',
    'perPage',
    'margin',
    'crop',
    'quality',
  ],
}

export function worksheetUrl(asset?: string) {
  return asset && /^folha_(0[1-9]|1[0-8])\.svg$/.test(asset)
    ? import.meta.env.BASE_URL + 'modelos/folhas/' + asset
    : undefined
}

export function validatePack(tool: Tool, data: unknown): PackTemplate[] {
  if (!Array.isArray(data) || data.length !== counts[tool])
    throw new Error('Catálogo incompleto')
  const ids = new Set<string>()
  for (const item of data) {
    if (
      !item ||
      item.tool !== tool ||
      typeof item.id !== 'string' ||
      !new RegExp('^pf327-' + tool + '-[0-9]{3}$').test(item.id) ||
      ids.has(item.id) ||
      !['title', 'topic', 'age', 'subtype', 'description'].every(
        (key) => typeof item[key] === 'string' && item[key].trim(),
      ) ||
      !Array.isArray(item.keywords) ||
      !item.keywords.every((key: unknown) => typeof key === 'string') ||
      !item.values ||
      Object.values(item.values).some((value) => typeof value !== 'string') ||
      !required[tool].every((key) => item.values[key]?.trim())
    )
      throw new Error('Modelo inválido em ' + tool)
    const value = item.values
    if (
      tool === 'atividade' &&
      (!groups.includes(value.group) ||
        !themes.includes(value.theme) ||
        !fields.includes(value.field) ||
        (value.asset &&
          (!worksheetUrl(value.asset) || value.group !== groups[2])))
    )
      throw new Error('Atividade inválida')
    if (
      tool === 'fotos-em-pdf' &&
      (!['vertical', 'horizontal'].includes(value.orientation) ||
        !['1', '2', '4'].includes(value.perPage) ||
        !['5', '10', '15', '20'].includes(value.margin) ||
        !['yes', 'no'].includes(value.crop) ||
        !['standard', 'high'].includes(value.quality))
    )
      throw new Error('Diagramação inválida')
    ids.add(item.id)
  }
  return data
}

const pending = new Map<Tool, Promise<PackTemplate[]>>()
export function loadPack(tool: Tool) {
  let request = pending.get(tool)
  if (!request) {
    request = loaders[tool]()
      .then((data) => validatePack(tool, data.default))
      .catch((error) => {
        pending.delete(tool)
        throw error
      })
    pending.set(tool, request)
  }
  return request
}

export function presetValues(base: Values, template: PackTemplate): Values {
  const values: Values = { ...base, ...template.values, templateId: template.id }
  if (template.tool === 'atividade' && values.asset) {
    values.instructions = values.instructions.replace(
      /\s*Utilize a ficha vetorial homônima da pasta biblioteca-vetorial\/folhas-imprimiveis\./g,
      '',
    )
  }
  return values
}
