// Office room dimensions
export const ROOM_WIDTH = 20
export const ROOM_DEPTH = 14
export const WALL_HEIGHT = 4
export const WALL_THICKNESS = 0.15

// Desk layout: 3 rows x 4 desks = 12 slots
export const DESK_SLOTS: { position: [number, number, number]; rotation: number }[] = [
  // Row 1 (back) - 4 desks
  { position: [-6, 0, -4.5], rotation: 0 },
  { position: [-3, 0, -4.5], rotation: 0 },
  { position: [0, 0, -4.5], rotation: 0 },
  { position: [3, 0, -4.5], rotation: 0 },
  // Row 2 (middle) - 4 desks
  { position: [-6, 0, -1.5], rotation: 0 },
  { position: [-3, 0, -1.5], rotation: 0 },
  { position: [0, 0, -1.5], rotation: 0 },
  { position: [3, 0, -1.5], rotation: 0 },
  // Row 3 (front) - 4 desks
  { position: [-6, 0, 1.5], rotation: 0 },
  { position: [-3, 0, 1.5], rotation: 0 },
  { position: [0, 0, 1.5], rotation: 0 },
  { position: [3, 0, 1.5], rotation: 0 },
]

// Meeting area
export const MEETING_CENTER: [number, number, number] = [7, 0, -2]

// Coffee area
export const COFFEE_AREA: [number, number, number] = [7, 0, 4]

// Pathfinding grid
export const GRID_CELL_SIZE = 0.5
export const GRID_ORIGIN: [number, number] = [-ROOM_WIDTH / 2, -ROOM_DEPTH / 2]

// Coffee area seating positions (around the small round table near coffee counter)
export const COFFEE_SEATS: [number, number, number][] = [
  [COFFEE_AREA[0] + 0.7, 0, COFFEE_AREA[2] + 1.2],   // chair 1
  [COFFEE_AREA[0] - 0.7, 0, COFFEE_AREA[2] + 1.2],   // chair 2
  [COFFEE_AREA[0] + 0.4, 0, COFFEE_AREA[2] + 1.8],   // standing near table
  [COFFEE_AREA[0] - 0.4, 0, COFFEE_AREA[2] + 1.8],   // standing near table
]

// Bookshelf browsing positions
export const BOOKSHELF_POSITIONS: [number, number, number][] = [
  [-8.5, 0, -5.5],  // in front of left bookshelf
  [-8.0, 0, -5.5],
  [8.5, 0, -5.5],   // in front of right bookshelf
  [8.0, 0, -5.5],
]

// Agent appearance presets (deterministic by agent ID)
export const AGENT_APPEARANCES = [
  { shirtColor: '#3b82f6', pantsColor: '#1e3a5f', hairStyle: 'short' as const, hairColor: '#2c1810' },
  { shirtColor: '#ef4444', pantsColor: '#374151', hairStyle: 'long' as const, hairColor: '#1a1a1a' },
  { shirtColor: '#22c55e', pantsColor: '#1e3a5f', hairStyle: 'buzz' as const, hairColor: '#8b4513' },
  { shirtColor: '#f59e0b', pantsColor: '#4b5563', hairStyle: 'hat' as const, hairColor: '#d4a574' },
  { shirtColor: '#8b5cf6', pantsColor: '#1f2937', hairStyle: 'short' as const, hairColor: '#654321' },
  { shirtColor: '#ec4899', pantsColor: '#374151', hairStyle: 'ponytail' as const, hairColor: '#1a1a1a' },
  { shirtColor: '#06b6d4', pantsColor: '#1e293b', hairStyle: 'mohawk' as const, hairColor: '#d2691e' },
  { shirtColor: '#f97316', pantsColor: '#4b5563', hairStyle: 'afro' as const, hairColor: '#2c1810' },
  { shirtColor: '#14b8a6', pantsColor: '#1e293b', hairStyle: 'short' as const, hairColor: '#4a2c17' },
  { shirtColor: '#a855f7', pantsColor: '#374151', hairStyle: 'long' as const, hairColor: '#8b4513' },
  { shirtColor: '#e11d48', pantsColor: '#1f2937', hairStyle: 'buzz' as const, hairColor: '#1a1a1a' },
  { shirtColor: '#0ea5e9', pantsColor: '#4b5563', hairStyle: 'hat' as const, hairColor: '#654321' },
]
