import { BufferAttribute, BufferGeometry, Group, Mesh, MeshBasicMaterial } from 'three'

function fillRibbon(points, width, positions, taper = 0) {
  const n = points.length
  let w = 0
  let nx = 0
  let ny = 1

  for (let i = 0; i < n; i++) {
    const prev = points[Math.max(0, i - 1)]
    const next = points[Math.min(n - 1, i + 1)]
    const dx = next[0] - prev[0]
    const dy = next[1] - prev[1]
    const len = Math.hypot(dx, dy)
    if (len > 1e-5) {
      nx = -dy / len
      ny = dx / len
    }

    const half = (width / 2) * (1 - taper * (i / Math.max(1, n - 1)))
    const [x, y] = points[i]
    positions[w++] = x + nx * half
    positions[w++] = y + ny * half
    positions[w++] = 0
    positions[w++] = x - nx * half
    positions[w++] = y - ny * half
    positions[w++] = 0
  }
  return positions
}

function ribbonIndex(n) {
  const index = new Uint16Array(Math.max(0, n - 1) * 6)
  for (let i = 0; i < n - 1; i++) {
    const a = i * 2
    index.set([a, a + 1, a + 2, a + 2, a + 1, a + 3], i * 6)
  }
  return index
}

function ribbonMaterial({ color, opacity }) {
  return new MeshBasicMaterial({
    color,
    transparent: true,
    opacity,
    depthWrite: false,
    toneMapped: false,
  })
}

function ribbonMesh(count, style, z) {
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3))
  geometry.setIndex(new BufferAttribute(ribbonIndex(count), 1))
  const mesh = new Mesh(geometry, ribbonMaterial(style))
  mesh.position.z = z
  mesh.renderOrder = 1
  return mesh
}

/**
 * 매 프레임 다시 그리는 띠. 경로가 주행 중에 휘므로 모양을 미리 구울 수 없다.
 * 호출부가 `points` 를 직접 채운 뒤 `commit()` 을 부른다.
 */
export function createFlowRibbon(count, style, z = 0.012) {
  const points = Array.from({ length: count }, () => [0, 0])
  const mesh = ribbonMesh(count, style, z)
  // 정점이 매 프레임 움직인다 — 경계구를 다시 재는 값보다 그냥 켜두는 쪽이 싸다
  mesh.frustumCulled = false

  mesh.userData.points = points
  mesh.userData.commit = () => {
    fillRibbon(points, style.width, mesh.geometry.attributes.position.array)
    mesh.geometry.attributes.position.needsUpdate = true
  }
  return mesh
}

export function createOutline({ width, height, thickness, color, opacity }, z = 0.008) {
  const group = new Group()
  const material = ribbonMaterial({ color, opacity })
  const bars = [
    [0, height / 2, width, thickness],
    [0, -height / 2, width, thickness],
    [-width / 2, 0, thickness, height],
    [width / 2, 0, thickness, height],
  ]
  for (const [x, y, w, h] of bars) {
    const geometry = new BufferGeometry()
    const hw = w / 2
    const hh = h / 2
    geometry.setAttribute(
      'position',
      new BufferAttribute(
        new Float32Array([x - hw, y - hh, 0, x + hw, y - hh, 0, x + hw, y + hh, 0, x - hw, y + hh, 0]),
        3,
      ),
    )
    geometry.setIndex(new BufferAttribute(new Uint16Array([0, 1, 2, 0, 2, 3]), 1))
    const mesh = new Mesh(geometry, material)
    mesh.renderOrder = 1
    group.add(mesh)
  }
  group.position.z = z
  return group
}
