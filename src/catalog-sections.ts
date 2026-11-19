import type { ClassroomItem } from './classroom-catalog'
import type { Tool } from './catalog'
export const collectionSections = [
  { id: 'student', tool: 'atividade', label: 'Folhas para os alunos' },
  { id: 'guided', tool: 'atividade', label: 'Para fazer com os alunos' },
  { id: 'lessons', tool: 'plano-de-aula', label: 'Planos de aula' },
  { id: 'individual', tool: 'relatorio', label: 'Registros individuais' },
  { id: 'collective', tool: 'relatorio', label: 'Registros coletivos' },
  { id: 'notices', tool: 'documento', label: 'Recados às famílias' },
  { id: 'school', tool: 'documento', label: 'Documentos escolares' },
  {
    id: 'albums',
    tool: 'fotos-em-pdf',
    label: 'Álbuns e registros fotográficos',
  },
  { id: 'posts', tool: 'postagem', label: 'Artes e avisos para famílias' },
  { id: 'kits', tool: 'painel', label: 'Kits recortáveis' },
  { id: 'mosaics', tool: 'painel', label: 'Painéis em mosaico A4' },
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
      return (
        item.scope ??
        (['registro-coletivo', 'registro-projeto-coletivo'].includes(item.id)
          ? 'collective'
          : 'individual')
      )
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
