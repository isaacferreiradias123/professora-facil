export type PanelSpec = {
  layout: 'gallery' | 'timeline' | 'banner' | 'chart'
  landscape: boolean
  strip?: boolean
  art: string
}

export function panelLabelLimit(spec: PanelSpec) {
  return spec.layout === 'banner' ? 3 : spec.layout === 'timeline' ? 4 : 6
}

export function panelGeometry(spec?: PanelSpec) {
  const width = spec?.landscape && !spec.strip ? 297 : 210
  const height = width === 297 ? 210 : 297
  const columns = spec?.strip ? 3 : 2
  const rows = spec?.strip ? 1 : 2
  const overlap = 5
  const margin = 10
  const tileWidth = width - margin * 2
  const tileHeight = height - margin * 2
  const stepX = tileWidth - overlap
  const stepY = tileHeight - overlap
  const tiles = Array.from({ length: columns * rows }, (_, index) => {
    const column = index % columns
    const row = Math.floor(index / columns)
    return { row, column, originX: column * stepX, originY: row * stepY }
  })
  return {
    paper: { width, height },
    assembled: {
      width: tileWidth + (columns - 1) * stepX,
      height: tileHeight + (rows - 1) * stepY,
    },
    columns,
    rows,
    margin,
    overlap,
    tileWidth,
    tileHeight,
    stepX,
    stepY,
    tiles,
  }
}
