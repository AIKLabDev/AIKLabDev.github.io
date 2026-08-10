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
    // 먼 점도 한 픽셀 아래로 내려가지 않아야 점 구름이 거리에서 성겨지지 않는다
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

/**
 * 주행하며 드러나는 공간 전체 — 랙 격자·외벽·기둥·천장 트러스·부유 입자가
 * 점 하나짜리 지오메트리 한 덩이다.
 *
 * 접기(wrap)와 드러남(reveal)을 CPU 가 아니라 정점 셰이더에서 계산한다. 매 프레임
 * 수만 개의 행렬을 다시 쓰지 않아도 되므로 화면을 가득 채울 만큼 점을 깔 수 있고,
 * **화면이 점으로 가득 찬다는 사실 자체가 "넓은 공간"이라는 인상을 만든다.**
 *
 * 드러나는 정도가 위치만의 함수인 것이 조건이다. 지나온 시간을 기억하면 접히는
 * 자리에서 상태가 튄다.
 */
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

  // 무대 디졸브는 material.opacity 에 실려 온다. 셰이더가 읽도록 옮겨 준다
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

/**
 * 주행 방향의 간격은 전부 `span` 의 약수여야 한다. 나누어떨어지지 않으면 접히는
 * 자리에서 반 칸짜리 기둥이나 잘린 출입구가 드러난다.
 */
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

  // 랙 열의 격자. 통로를 비워 두고 좌우로 계속 이어지는 이 배열이
  // 화면을 채우는 몫의 대부분이다
  const R = W.rack
  const rows = R.rows.slice(0, compact ? C.rackRows : R.rows.length)
  const blocks = Math.round(span / W.block.period)
  const B = W.block
  for (let r = 0; r < rows.length; r++) {
    const f = k * (1 + r * R.falloff)
    const step = R.step.map((v) => v * f)
    const a = R.alpha * (1 - r * 0.1)
    // 열마다 기본 높이가 다르고, 칸마다 그 높이에서 또 흔들린다. 칸마다 독립으로
    // 뽑으면 한 줄 안에서 들쭉날쭉해 랙이 아니라 잡동사니로 보인다
    const base = lerp(R.height[0], R.height[1], rnd())
    for (const side of [1, -1]) {
      for (let b = 0; b < blocks; b++) {
        if (rnd() < R.empty) continue
        const length = lerp(B.length[0], B.length[1], rnd())
        const depth = lerp(R.depth[0], R.depth[1], rnd())
        const height = clamp(base * vary(1, R.spread), R.height[0], R.height[1])
        // 칸 안에서만 민다. 칸을 통째로 밀면 마지막 칸이 span 을 넘어 접히는 자리에서
        // 랙이 두 동강 난다 — 길이가 칸마다 달라 이것만으로도 양쪽이 어긋난다
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

  // 천장 트러스·바닥 통로선·부유 입자는 두지 않는다. 구조물에 붙지 않은 점은
  // 아무리 규칙적으로 깔아도 화면에서는 떠도는 특이점으로만 읽힌다

  return { position, size, alpha }
}

/**
 * 겉면을 촘촘히 표본한 상자. 모서리만 찍으면 비스듬히 볼 때 사선 점열이 되어
 * 형태가 사라지고, 성기게 찍으면 면이 만들어지지 않는다 — 점은 **적은 수의
 * 덩어리에 몰아줘야** 읽힌다.
 *
 * 통로 쪽 면과 지붕·양 끝만 찍는다. 반대쪽 면은 어차피 상자 뒤라 형태에 보태는
 * 것 없이 점만 두 배가 된다.
 */
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
