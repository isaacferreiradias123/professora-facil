import { tools, type Tool } from './catalog'
import { newId, type Draft, type Values } from './store'

export const recoveryPrefix = 'pf-recovery:'
const maxValue = 20000
const maxFileSize = 250000

export function readValues(value: unknown): Values {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error()
  const entries = Object.entries(value)
  if (
    entries.length > 80 ||
    entries.some(
      ([key, item]) =>
        !/^[A-Za-z][A-Za-z0-9]{0,40}$/.test(key) ||
        key === 'constructor' ||
        typeof item !== 'string' ||
        item.length >
          (key === 'moments' ? maxValue : key === 'title' ? 240 : 8000),
    )
  )
    throw new Error()
  return Object.fromEntries(entries)
}

export function editableFile(draft: Draft) {
  const { tool, name, values, needsFiles } = draft
  return new Blob(
    [
      JSON.stringify(
        {
          format: 'professora-facil',
          version: 1,
          tool,
          name,
          values,
          needsFiles,
        },
        null,
        2,
      ),
    ],
    {
      type: 'application/json',
    },
  )
}

export async function importEditable(file: File): Promise<Draft> {
  if (file.size > maxFileSize || !file.name.toLowerCase().endsWith('.json'))
    throw new Error()
  const item = JSON.parse(await file.text())
  if (
    !item ||
    item.format !== 'professora-facil' ||
    item.version !== 1 ||
    typeof item.tool !== 'string' ||
    !Object.hasOwn(tools, item.tool) ||
    typeof item.name !== 'string' ||
    !item.name.trim() ||
    item.name.length > 240 ||
    typeof item.needsFiles !== 'boolean'
  )
    throw new Error()
  return {
    id: newId(),
    version: 1,
    tool: item.tool as Tool,
    name: item.name,
    values: readValues(item.values),
    updated: Date.now(),
    needsFiles: item.needsFiles,
  }
}

export function recover(key: string): Values | null {
  try {
    const saved = localStorage.getItem(key)
    return saved ? readValues(JSON.parse(saved)) : null
  } catch {
    return null
  }
}

export function clearRecovery(key?: string) {
  try {
    if (key) localStorage.removeItem(key)
    else
      Object.keys(localStorage)
        .filter((item) => item.startsWith(recoveryPrefix))
        .forEach((item) => localStorage.removeItem(item))
  } catch {
    // Storage may be disabled by the browser.
  }
}
