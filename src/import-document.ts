export const documentLimit = 12 * 1024 * 1024

export function validateZip(bytes: Uint8Array) {
  const invalid = () =>
    new Error(
      'Este Word não pôde ser aberto dentro dos limites de processamento.',
    )
  if (bytes.length < 22) throw invalid()
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength)
  let end = bytes.length - 22
  while (
    end >= Math.max(0, bytes.length - 65557) &&
    view.getUint32(end, true) !== 0x06054b50
  )
    end--
  if (
    end < Math.max(0, bytes.length - 65557) ||
    view.getUint16(end + 4, true) !== 0 ||
    view.getUint16(end + 6, true) !== 0
  )
    throw invalid()
  const count = view.getUint16(end + 10, true)
  let offset = view.getUint32(end + 16, true)
  if (count > 1000 || offset + view.getUint32(end + 12, true) > end)
    throw invalid()
  let size = 0
  for (let i = 0; i < count; i++) {
    if (
      offset + 46 > end ||
      view.getUint32(offset, true) !== 0x02014b50 ||
      (view.getUint16(offset + 8, true) & 1) !== 0
    )
      throw invalid()
    size += view.getUint32(offset + 24, true)
    if (size > 40 * 1024 * 1024) throw invalid()
    offset +=
      46 +
      view.getUint16(offset + 28, true) +
      view.getUint16(offset + 30, true) +
      view.getUint16(offset + 32, true)
    if (offset > end) throw invalid()
  }
}
