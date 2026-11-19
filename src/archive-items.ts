import type { ClassroomItem } from './classroom-catalog'
import { archiveAdditions } from './archive-additions'

export const archiveItems: ClassroomItem[] = [
  {
    id: 'acervo-015',
    archiveType: 'Painel de emoções',
    title: 'Entusiasmo',
    age: 'Berçário',
    tool: 'painel',
    category: 'Painéis',
    description: 'Cartaz para conversar sobre entusiasmo com os bebês.',
    ready: {
      file: 'acervo/015.pdf',
      figure: 'acervo/015-figura.png',
      image: 'acervo/015.webp',
      author: 'Abby the Pup · CC0 1.0 · adaptação em PT-BR',
      source:
        'https://drive.google.com/file/d/1dTOP9epZl1JDvcDioIkJmhg-Mh5DmZoO/view',
      originalPage: 'Feelings.pdf, p. 2',
    },
  },
  {
    id: 'acervo-017',
    archiveType: 'Painel de emoções',
    title: 'Raiva',
    age: 'Berçário',
    tool: 'painel',
    category: 'Painéis',
    description: 'Cartaz de apoio à professora para nomear a raiva.',
    ready: {
      file: 'acervo/017.pdf',
      figure: 'acervo/017-figura.png',
      image: 'acervo/017.webp',
      author: 'Abby the Pup · CC0 1.0 · adaptação em PT-BR',
      source:
        'https://drive.google.com/file/d/1dTOP9epZl1JDvcDioIkJmhg-Mh5DmZoO/view',
      originalPage: 'Feelings.pdf, p. 4',
    },
  },
  {
    id: 'acervo-077',
    archiveType: 'Formas',
    title: 'Descobrindo o círculo',
    age: 'Maternal',
    tool: 'atividade',
    category: 'Atividades',
    description: 'Procure objetos redondos a partir de exemplos ilustrados.',
    ready: {
      file: 'acervo/077.pdf',
      image: 'acervo/077.webp',
      author: 'Abby the Pup · CC0 1.0 · adaptação em PT-BR',
      source:
        'https://drive.google.com/file/d/161N4WyWLExy8c-129MVL6XCqQk2UqsWF/view',
      originalPage: 'Shapes.pdf, p. 1',
    },
  },
  {
    id: 'acervo-078',
    archiveType: 'Formas',
    title: 'Descobrindo o triângulo',
    age: 'Maternal',
    tool: 'atividade',
    category: 'Atividades',
    description: 'Reconheça três lados em figuras e objetos.',
    ready: {
      file: 'acervo/078.pdf',
      image: 'acervo/078.webp',
      author: 'Abby the Pup · CC0 1.0 · adaptação em PT-BR',
      source:
        'https://drive.google.com/file/d/161N4WyWLExy8c-129MVL6XCqQk2UqsWF/view',
      originalPage: 'Shapes.pdf, p. 2',
    },
  },
  {
    id: 'acervo-138',
    archiveType: 'Relação figura e sombra',
    title: 'Animais e suas sombras',
    age: 'Pré I',
    tool: 'atividade',
    category: 'Atividades',
    description: 'Ligue gato, pato, cão e pássaro aos seus contornos.',
    ready: {
      file: 'acervo/138.pdf',
      image: 'acervo/138.webp',
      author: 'Abby the Pup · CC0 1.0 · adaptação em PT-BR',
      source:
        'https://drive.google.com/file/d/1dbPc7B_uT5qiJuvva8AJWKiBlzpb-84l/view',
      originalPage: 'Shadow Matching.pdf, p. 3',
    },
  },
  {
    id: 'acervo-139',
    archiveType: 'Relação figura e sombra',
    title: 'Objetos e suas sombras',
    age: 'Pré I',
    tool: 'atividade',
    category: 'Atividades',
    description: 'Compare os contornos de quatro objetos conhecidos.',
    ready: {
      file: 'acervo/139.pdf',
      image: 'acervo/139.webp',
      author: 'Abby the Pup · CC0 1.0 · adaptação em PT-BR',
      source:
        'https://drive.google.com/file/d/1dbPc7B_uT5qiJuvva8AJWKiBlzpb-84l/view',
      originalPage: 'Shadow Matching.pdf, p. 4',
    },
  },
  {
    id: 'acervo-156',
    archiveType: 'Números até 5',
    title: 'Um animal para colorir',
    age: 'Pré II',
    tool: 'atividade',
    category: 'Atividades',
    description: 'Conte um animal e pinte o numeral correspondente.',
    ready: {
      file: 'acervo/156.pdf',
      image: 'acervo/156.webp',
      author: 'Abby the Pup · CC0 1.0 · adaptação em PT-BR',
      source:
        'https://drive.google.com/file/d/1BBNFlk3SCT4QUCpXtSJXbYmqUtUZ7-vA/view',
      originalPage: 'Numbers 1-5.pdf, p. 12',
    },
  },
  {
    id: 'acervo-157',
    archiveType: 'Números até 5',
    title: 'Dois animais para colorir',
    age: 'Pré II',
    tool: 'atividade',
    category: 'Atividades',
    description: 'Conte dois animais e pinte o numeral correspondente.',
    ready: {
      file: 'acervo/157.pdf',
      image: 'acervo/157.webp',
      author: 'Abby the Pup · CC0 1.0 · adaptação em PT-BR',
      source:
        'https://drive.google.com/file/d/1BBNFlk3SCT4QUCpXtSJXbYmqUtUZ7-vA/view',
      originalPage: 'Numbers 1-5.pdf, p. 13',
    },
  },
  ...archiveAdditions,
]
