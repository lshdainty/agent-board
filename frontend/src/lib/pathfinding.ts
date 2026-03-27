interface GridNode {
  x: number
  z: number
  g: number
  h: number
  f: number
  parent: GridNode | null
  walkable: boolean
}

/** World coordinates → grid indices */
export function worldToGrid(
  worldX: number,
  worldZ: number,
  cellSize: number,
  gridOrigin: [number, number],
): [number, number] {
  const gx = Math.round((worldX - gridOrigin[0]) / cellSize)
  const gz = Math.round((worldZ - gridOrigin[1]) / cellSize)
  return [gx, gz]
}

/** Grid indices → world coordinates (y = 0) */
export function gridToWorld(
  gridX: number,
  gridZ: number,
  cellSize: number,
  gridOrigin: [number, number],
): [number, number, number] {
  const wx = gridOrigin[0] + gridX * cellSize
  const wz = gridOrigin[1] + gridZ * cellSize
  return [wx, 0, wz]
}

/** Build a 2D walkability grid. true = walkable. */
export function buildOccupancyGrid(
  roomWidth: number,
  roomDepth: number,
  cellSize: number,
  obstacles: { center: [number, number]; halfSize: [number, number] }[],
): boolean[][] {
  const cols = Math.ceil(roomWidth / cellSize)
  const rows = Math.ceil(roomDepth / cellSize)
  const originX = -roomWidth / 2
  const originZ = -roomDepth / 2

  // Initialize all cells as walkable
  const grid: boolean[][] = Array.from({ length: cols }, () =>
    Array.from({ length: rows }, () => true),
  )

  // Mark obstacle cells
  for (const obs of obstacles) {
    const minX = obs.center[0] - obs.halfSize[0]
    const maxX = obs.center[0] + obs.halfSize[0]
    const minZ = obs.center[1] - obs.halfSize[1]
    const maxZ = obs.center[1] + obs.halfSize[1]

    for (let gx = 0; gx < cols; gx++) {
      const wx = originX + gx * cellSize
      for (let gz = 0; gz < rows; gz++) {
        const wz = originZ + gz * cellSize
        if (wx >= minX && wx <= maxX && wz >= minZ && wz <= maxZ) {
          grid[gx][gz] = false
        }
      }
    }
  }

  return grid
}

// 8-directional neighbors (dx, dz, cost)
const DIRS: [number, number, number][] = [
  [1, 0, 1],
  [-1, 0, 1],
  [0, 1, 1],
  [0, -1, 1],
  [1, 1, Math.SQRT2],
  [1, -1, Math.SQRT2],
  [-1, 1, Math.SQRT2],
  [-1, -1, Math.SQRT2],
]

function heuristic(ax: number, az: number, bx: number, bz: number): number {
  return Math.abs(ax - bx) + Math.abs(az - bz)
}

/**
 * A* pathfinding. Returns waypoints in world coordinates.
 * Returns [] if no path exists.
 */
export function findPath(
  grid: boolean[][],
  startWorld: [number, number, number],
  endWorld: [number, number, number],
  cellSize: number,
  gridOrigin: [number, number],
): [number, number, number][] {
  const gridCopy = grid.map(row => [...row])
  const cols = gridCopy.length
  if (cols === 0) return []
  const rows = gridCopy[0].length

  const [sx, sz] = worldToGrid(startWorld[0], startWorld[2], cellSize, gridOrigin)
  const [ex, ez] = worldToGrid(endWorld[0], endWorld[2], cellSize, gridOrigin)

  // Clamp to grid bounds
  const clamp = (v: number, max: number) => Math.max(0, Math.min(max - 1, v))
  const startX = clamp(sx, cols)
  const startZ = clamp(sz, rows)
  const endX = clamp(ex, cols)
  const endZ = clamp(ez, rows)

  // If start or end is not walkable, temporarily make them AND neighbors walkable
  // (agent needs to leave/enter obstacle areas like desk chairs)
  const forceWalkable = (cx: number, cz: number) => {
    for (let dx = -1; dx <= 1; dx++) {
      for (let dz = -1; dz <= 1; dz++) {
        const nx = cx + dx
        const nz = cz + dz
        if (nx >= 0 && nx < cols && nz >= 0 && nz < rows && !gridCopy[nx][nz]) {
          gridCopy[nx][nz] = true
        }
      }
    }
  }
  if (!gridCopy[startX]?.[startZ]) forceWalkable(startX, startZ)
  if (!gridCopy[endX]?.[endZ]) forceWalkable(endX, endZ)

  // Already at destination
  if (startX === endX && startZ === endZ) return [endWorld]

  const startNode: GridNode = {
    x: startX,
    z: startZ,
    g: 0,
    h: heuristic(startX, startZ, endX, endZ),
    f: heuristic(startX, startZ, endX, endZ),
    parent: null,
    walkable: true,
  }

  const open: GridNode[] = [startNode]
  const closed = new Set<string>()
  const key = (x: number, z: number) => `${x},${z}`
  const gScores = new Map<string, number>()
  gScores.set(key(startX, startZ), 0)

  while (open.length > 0) {
    // Pick node with lowest f
    let bestIdx = 0
    for (let i = 1; i < open.length; i++) {
      if (open[i].f < open[bestIdx].f) bestIdx = i
    }
    const current = open[bestIdx]
    open.splice(bestIdx, 1)

    if (current.x === endX && current.z === endZ) {
      // Reconstruct path
      const gridPath: [number, number][] = []
      let node: GridNode | null = current
      while (node) {
        gridPath.push([node.x, node.z])
        node = node.parent
      }
      gridPath.reverse()

      // Convert to world coords
      const worldPath = gridPath.map(
        ([gx, gz]) => gridToWorld(gx, gz, cellSize, gridOrigin),
      )

      // Smooth: remove redundant collinear waypoints
      return smoothPath(worldPath)
    }

    const ck = key(current.x, current.z)
    if (closed.has(ck)) continue
    closed.add(ck)

    for (const [dx, dz, cost] of DIRS) {
      const nx = current.x + dx
      const nz = current.z + dz

      if (nx < 0 || nx >= cols || nz < 0 || nz >= rows) continue
      if (!gridCopy[nx][nz]) continue

      const nk = key(nx, nz)
      if (closed.has(nk)) continue

      // For diagonal movement, ensure both adjacent cells are walkable
      if (dx !== 0 && dz !== 0) {
        if (!gridCopy[current.x + dx][current.z] || !gridCopy[current.x][current.z + dz]) {
          continue
        }
      }

      const tentativeG = current.g + cost
      const prevG = gScores.get(nk)
      if (prevG !== undefined && tentativeG >= prevG) continue

      gScores.set(nk, tentativeG)
      const h = heuristic(nx, nz, endX, endZ)
      open.push({
        x: nx,
        z: nz,
        g: tentativeG,
        h,
        f: tentativeG + h,
        parent: current,
        walkable: true,
      })
    }
  }

  // No path found
  return []
}

/** Remove collinear intermediate waypoints */
function smoothPath(
  path: [number, number, number][],
): [number, number, number][] {
  if (path.length <= 2) return path

  const result: [number, number, number][] = [path[0]]
  for (let i = 1; i < path.length - 1; i++) {
    const prev = result[result.length - 1]
    const next = path[i + 1]
    const curr = path[i]

    // Check if prev→curr→next are collinear
    const dx1 = curr[0] - prev[0]
    const dz1 = curr[2] - prev[2]
    const dx2 = next[0] - curr[0]
    const dz2 = next[2] - curr[2]

    // Cross product ≠ 0 means direction change → keep point
    if (Math.abs(dx1 * dz2 - dz1 * dx2) > 1e-6) {
      result.push(curr)
    }
  }
  result.push(path[path.length - 1])
  return result
}
