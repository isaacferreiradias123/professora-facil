import type { ClassroomItem } from './classroom-catalog'
import type { Tool } from './catalog'

export const collectionSections = [
  { id: 'student', tool: 'atividade', label: 'Folhas para os alunos' },
  { id: 'guided', tool: 'atividade', label: 'Para fazer com os alunos' },
  { id: 'lessons', tool: 'plano-de-aula', label: 'Planos de aula' },
  { id: 'reports', tool: 'relatorio', label: 'Relatórios e registros' },
  { id: 'notices', tool: 'documento', label: 'Recados às famílias' },
  { id: 'school', tool: 'documento', label: 'Documentos escolares' },
  { id: 'albums', tool: 'fotos-em-pdf', label: 'Álbuns de fotos' },
  { id: 'posts', tool: 'postagem', label: 'Artes e avisos' },
  { id: 'mosaics', tool: 'painel', label: 'Murais em mosaico A4' },
  { id: 'kits', tool: 'painel', label: 'Kits recortáveis' },
] as const satisfies ReadonlyArray<{ id: string; tool: Tool; label: string }>

export function sectionFor(
  item: ClassroomItem,
): (typeof collectionSections)[number]['id'] {
  switch (item.tool) {
    case 'atividade':
      return item.task?.mode === 'experience' || item.task?.mode === 'cards'
        ? 'guided'
        : 'student'
    case 'plano-de-aula':
      return 'lessons'
    case 'relatorio':
      return 'reports'
    case 'documento':
      return item.category === 'Recados' ? 'notices' : 'school'
    case 'fotos-em-pdf':
      return 'albums'
    case 'postagem':
      return 'posts'
    case 'painel':
      return item.poster ? 'kits' : 'mosaics'
  }
}
