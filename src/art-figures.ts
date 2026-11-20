export interface ArtFigure {
  id: string
  asset: string
  label: string
  group: 'Frutas' | 'Animais' | 'Escola e arte' | 'Natureza' | 'Rotina e escola'
}

export const figures: readonly ArtFigure[] = [
  { id: 'acervo-entusiasmo', asset: 'acervo/015-figura.png', label: 'Entusiasmo', group: 'Rotina e escola' },
  { id: 'acervo-raiva', asset: 'acervo/017-figura.png', label: 'Raiva', group: 'Rotina e escola' },
  { id: 'il-fruit-apple', asset: 'il-fruit-apple.png', label: 'Maçã', group: 'Frutas' },
  { id: 'il-fruit-banana', asset: 'il-fruit-banana.png', label: 'Banana', group: 'Frutas' },
  { id: 'il-fruit-pear', asset: 'il-fruit-pear.png', label: 'Pera', group: 'Frutas' },
  { id: 'il-fruit-berry', asset: 'il-fruit-berry.png', label: 'Morango', group: 'Frutas' },

  { id: 'il-cat', asset: 'il-cat.png', label: 'Gato', group: 'Animais' },
  { id: 'il-dog', asset: 'il-dog.png', label: 'Cão', group: 'Animais' },
  { id: 'il-duck', asset: 'il-duck.png', label: 'Pato', group: 'Animais' },
  { id: 'il-bird', asset: 'il-bird.png', label: 'Pássaro', group: 'Animais' },
  { id: 'oficina-borboleta', asset: 'oficina-borboleta.png', label: 'Borboleta', group: 'Animais' },

  { id: 'il-book', asset: 'il-book.png', label: 'Livro', group: 'Escola e arte' },
  { id: 'il-pencil', asset: 'il-pencil.png', label: 'Lápis', group: 'Escola e arte' },
  { id: 'il-brush', asset: 'il-brush.png', label: 'Pincel', group: 'Escola e arte' },
  { id: 'il-blocks', asset: 'il-blocks.png', label: 'Blocos', group: 'Escola e arte' },
  { id: 'il-ball', asset: 'il-ball.png', label: 'Bola', group: 'Escola e arte' },
  { id: 'il-story', asset: 'il-story.png', label: 'História', group: 'Escola e arte' },

  { id: 'oficina-sol', asset: 'oficina-sol.png', label: 'Sol', group: 'Natureza' },
  { id: 'il-flower', asset: 'il-flower.png', label: 'Flor', group: 'Natureza' },
  { id: 'il-moon', asset: 'il-moon.png', label: 'Lua', group: 'Natureza' },
  { id: 'il-sprout', asset: 'il-sprout.png', label: 'Broto', group: 'Natureza' },
  { id: 'il-seed', asset: 'il-seed.png', label: 'Semente', group: 'Natureza' },
  { id: 'il-watering', asset: 'il-watering.png', label: 'Regador', group: 'Natureza' },

  { id: 'bilhete-reuniao', asset: 'bilhete-reuniao.webp', label: 'Reunião', group: 'Rotina e escola' },
  { id: 'bilhete-passeio', asset: 'bilhete-passeio.webp', label: 'Passeio', group: 'Rotina e escola' },
  { id: 'bilhete-evento', asset: 'bilhete-evento.webp', label: 'Mostra e festa', group: 'Rotina e escola' },
]

export function figureUrl(id?: string): string | undefined {
  const match = figures.find((figure) => figure.id === id)
  return match ? import.meta.env.BASE_URL + 'colecao/' + match.asset : undefined
}
