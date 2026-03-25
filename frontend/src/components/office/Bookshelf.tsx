import { memo, useMemo } from 'react'

interface BookshelfProps {
  position: [number, number, number]
  rotation: number
  theme: 'light' | 'dark'
}

const BOOK_COLORS = ['#c0392b', '#2980b9', '#27ae60', '#f39c12', '#8e44ad', '#e74c3c', '#1abc9c', '#d35400']
const SHELF_HEIGHTS = [0.2, 0.64, 1.08, 1.52]

export const Bookshelf = memo(function Bookshelf({ position, rotation, theme }: BookshelfProps) {
  const isDark = theme === 'dark'
  const frameColor = isDark ? '#2a2f45' : '#8b7355'

  const books = useMemo(() => {
    const result: { shelfIndex: number; x: number; color: string; height: number; width: number }[] = []
    for (let s = 0; s < 4; s++) {
      const count = 2 + (s % 2) // 2 or 3 books per shelf
      let xOffset = -0.25
      for (let b = 0; b < count; b++) {
        const width = 0.06 + (((s * 3 + b * 7) % 5) / 100)
        result.push({
          shelfIndex: s,
          x: xOffset + width / 2,
          color: BOOK_COLORS[(s * 3 + b * 5) % BOOK_COLORS.length],
          height: 0.28 + (((s + b) * 13) % 10) / 100,
          width,
        })
        xOffset += width + 0.04
      }
    }
    return result
  }, [])

  return (
    <group position={position} rotation={[0, rotation, 0]}>
      {/* Frame */}
      <mesh position={[0, 0.9, 0]} castShadow>
        <boxGeometry args={[0.8, 1.8, 0.3]} />
        <meshStandardMaterial color={frameColor} />
      </mesh>

      {/* Shelves */}
      {SHELF_HEIGHTS.map((y, i) => (
        <mesh key={i} position={[0, y, 0]}>
          <boxGeometry args={[0.74, 0.02, 0.28]} />
          <meshStandardMaterial color={frameColor} />
        </mesh>
      ))}

      {/* Books */}
      {books.map((book, i) => (
        <mesh key={i} position={[book.x, SHELF_HEIGHTS[book.shelfIndex] + 0.01 + book.height / 2, 0]}>
          <boxGeometry args={[book.width, book.height, 0.2]} />
          <meshStandardMaterial color={book.color} />
        </mesh>
      ))}
    </group>
  )
})
