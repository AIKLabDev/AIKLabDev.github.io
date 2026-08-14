import {
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Points,
  ShaderMaterial,
  UniformsLib,
  UniformsUtils,
  Vector2,
  Vector4,
} from 'three'
import { clamp, lerp } from '../../../lib/math'

const vertexShader = /* glsl */ `
  uniform float uTravel;
  uniform float uSpan;
  uniform vec4 uBuilding;
  uniform vec4 uBuilt;
  uniform float uCurve;
  uniform float uDot;
  uniform float uViewport;
  uniform float uOpacity;

  attribute float aSize;
  attribute float aAlpha;

  varying float vAlpha;

  #include <fog_pars_vertex>

  void main() {
    float halfSpan = uSpan * 0.5;
    float x = mod(mod(position.x - uTravel + halfSpan, uSpan) + uSpan, uSpan) - halfSpan;

    vec4 c = mix(uBuilding, uBuilt, uCurve);
    float grown = (1.0 - smoothstep(c.x - c.y, c.x, x)) * smoothstep(c.z - c.w, c.z, x);
    float edge = (1.0 - uCurve) * exp(-pow((x - c.x) / 2.4, 2.0));

    vAlpha = aAlpha * uOpacity * grown * (1.0 + edge * 1.8);

    vec4 mvPosition = modelViewMatrix * vec4(x, position.y, position.z, 1.0);
    gl_Position = projectionMatrix * mvPosition;

    float px = uDot * aSize * projectionMatrix[1][1] * uViewport * 0.5 / max(0.001, -mvPosition.z);
    gl_PointSize = clamp(px, 1.7, 46.0) * step(0.004, vAlpha);

    #include <fog_vertex>
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  varying float vAlpha;

  #include <fog_pars_fragment>

  void main() {
    vec2 d = gl_PointCoord - 0.5;
    float r2 = dot(d, d);
    if (r2 > 0.25) discard;

    float a = vAlpha * (1.0 - smoothstep(0.08, 0.25, r2));
    if (a < 0.004) discard;

    gl_FragColor = vec4(uColor, a);
    #include <fog_fragment>
  }
`

/** 접기·드러남을 정점 셰이더에서 위치만의 함수로 계산한다 — 시간을 쓰면 접히는 자리에서 상태가 튄다 */
export function createPointField(W, { compact = false } = {}) {
  const layout = buildLayout(W, compact)

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(layout.position, 3))
  geometry.setAttribute('aSize', new Float32BufferAttribute(layout.size, 1))
  geometry.setAttribute('aAlpha', new Float32BufferAttribute(layout.alpha, 1))

  const material = new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: UniformsUtils.merge([
      UniformsLib.fog,
      {
        uTravel: { value: 0 },
        uSpan: { value: W.span },
        uBuilding: { value: new Vector4(...W.building) },
        uBuilt: { value: new Vector4(...W.built) },
        uCurve: { value: 0 },
        uDot: { value: W.dot },
        uViewport: { value: 1080 },
        uOpacity: { value: 1 },
        uColor: { value: new Color(W.color) },
      },
    ]),
    transparent: true,
    depthWrite: false,
    fog: true,
  })

  const points = new Points(geometry, material)
  points.frustumCulled = false
  points.renderOrder = 1

  // ShaderMaterial 은 opacity 를 자동 적용하지 않아 유니폼으로 직접 옮긴다
  points.onBeforeRender = (renderer) => {
    material.uniforms.uOpacity.value = material.opacity
    material.uniforms.uViewport.value = renderer.getDrawingBufferSize(viewport).y
  }

  return {
    points,
    count: layout.size.length,
    update(travelled, curve) {
      material.uniforms.uTravel.value = travelled
      material.uniforms.uCurve.value = curve
    },
  }
}

const viewport = new Vector2(1920, 1080)

const mulberry = (seed) => () => {
  seed = (seed + 0x6d2b79f5) >>> 0
  let t = Math.imul(seed ^ (seed >>> 15), seed | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/** 간격은 전부 `span` 의 약수여야 한다 — 아니면 접히는 자리에서 어긋난다 */
function buildLayout(W, compact) {
  const C = W.compact
  const k = compact ? C.step : 1
  const rnd = mulberry(W.seed)
  const span = W.span

  const position = []
  const size = []
  const alpha = []
  const put = (x, y, z, s, a) => {
    position.push(x, y, z)
    size.push(s)
    alpha.push(a)
  }
  const vary = (base, amount) => base * (1 - amount + rnd() * amount * 2)

  const R = W.rack
  const rows = R.rows.slice(0, compact ? C.rackRows : R.rows.length)
  const blocks = Math.round(span / W.block.period)
  const B = W.block
  for (let r = 0; r < rows.length; r++) {
    const f = k * (1 + r * R.falloff)
    const step = R.step.map((v) => v * f)
    const a = R.alpha * (1 - r * 0.1)
    const base = lerp(R.height[0], R.height[1], rnd())
    for (const side of [1, -1]) {
      for (let b = 0; b < blocks; b++) {
        if (rnd() < R.empty) continue
        const length = lerp(B.length[0], B.length[1], rnd())
        const depth = lerp(R.depth[0], R.depth[1], rnd())
        const height = clamp(base * vary(1, R.spread), R.height[0], R.height[1])
        // 칸 안에서만 밀어야 한다 — 넘기면 접히는 자리에서 랙이 어긋난다
        putBlock(put, vary, {
          x0: b * B.period + rnd() * (B.period - B.gap - length),
          y0: side * rows[r] - (side > 0 ? 0 : depth),
          length,
          depth,
          height,
          facing: side,
          step,
          alpha: a,
        })
      }
    }
  }

  const wall = W.wall
  const wallRows = compact ? C.wallRows : wall.rows
  for (const side of [1, -1]) {
    const doorShift = side > 0 ? 0 : wall.door.every / 2
    for (let x = 0; x < span - 1e-6; x += wall.step * k) {
      if ((x + doorShift) % wall.door.every < wall.door.width) continue
      for (let r = 0; r < wallRows; r++) {
        put(
          x + (rnd() - 0.5) * wall.jitter * 3,
          side * (wall.y + (rnd() - 0.5) * wall.jitter * 8),
          wall.z0 + r * wall.zStep + (rnd() - 0.5) * wall.jitter,
          vary(1, 0.25),
          vary(wall.alpha, 0.3),
        )
      }
    }
  }

  const column = W.column
  const half = column.size / 2
  const corners = [
    [-half, -half],
    [half, -half],
    [-half, half],
    [half, half],
  ]
  for (let x = 0; x < span - 1e-6; x += column.spacing) {
    for (const side of [1, -1]) {
      for (const [dx, dy] of corners) {
        for (let z = 0; z < column.height; z += column.step * k) {
          put(x + dx, side * column.y + dy, z, 1.05, vary(column.alpha, 0.2))
        }
      }
    }
  }

  return { position, size, alpha }
}

/** 상자의 겉면을 표본한다 (통로 쪽 면·지붕·양 끝만) */
function putBlock(put, vary, { x0, y0, depth, length, height, step, alpha, facing }) {
  const [sx, sy, sz] = step
  const x1 = x0 + length
  const y1 = y0 + depth
  const face = facing > 0 ? y0 : y1

  for (let x = x0; x <= x1 + 1e-6; x += sx) {
    for (let y = y0; y <= y1 + 1e-6; y += sy) {
      put(x, y, height, 0.95, vary(alpha, 0.3))
    }
    for (let z = 0.1; z < height - 1e-6; z += sz) {
      put(x, face, z, 1, vary(alpha, 0.26))
    }
  }

  for (let y = y0; y <= y1 + 1e-6; y += sy) {
    for (let z = 0.1; z < height - 1e-6; z += sz) {
      put(x0, y, z, 1, vary(alpha * 0.8, 0.26))
      put(x1, y, z, 1, vary(alpha * 0.8, 0.26))
    }
  }
}
