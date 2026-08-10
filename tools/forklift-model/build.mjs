/**
 * aik-forklift-urdf(OBJ + MTL + URDF) -> 웹 히어로용 단일 GLB.
 *
 *   node build.mjs
 *
 * 왜 필요한가: 전달 패키지는 base_link.obj 하나가 19MB, 전체 52MB 다.
 * 첫 화면에 얹을 수 있는 크기가 아니라 링크별 OBJ 를 합쳐 압축한다.
 *
 * 하는 일
 *  1. MTL 정리 — `-clamp on` 플래그 제거, map_Bump 제거(전부 회색 노이즈 4MB)
 *  2. 링크별 OBJ -> glTF (obj2gltf)
 *  3. 링크별 최적화 — 재질 dedup -> palette -> join(드로우콜 축소) -> simplify
 *  4. URDF 조인트 계층으로 노드를 엮어 하나의 문서로 병합
 *  5. 텍스처 webp 축소 + Draco 압축 -> public/models/forklift.glb
 *  6. 런타임이 쓸 조인트/치수표를 rig.generated.js 로 뽑는다
 *
 * 좌표계는 URDF 그대로(Z-up) 둔다. Y-up 변환은 씬에서 루트 그룹 한 번의
 * 회전으로 처리한다 — 여기서 굽는 것보다 조인트 축을 URDF 값 그대로 읽을 수 있어
 * 대조하기 쉽다.
 */
import { Document, NodeIO } from '@gltf-transform/core'
import { ALL_EXTENSIONS } from '@gltf-transform/extensions'
import {
  dedup,
  draco,
  flatten,
  join,
  mergeDocuments,
  palette,
  prune,
  simplify,
  textureCompress,
  unpartition,
  weld,
} from '@gltf-transform/functions'
import draco3d from 'draco3dgltf'
import { MeshoptSimplifier } from 'meshoptimizer'
import obj2gltf from 'obj2gltf'
import fs from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import sharp from 'sharp'

const HERE = path.dirname(fileURLToPath(import.meta.url))
const UI = path.resolve(HERE, '../..')
const DELIVERY = path.resolve(UI, '../aik-forklift-urdf')
const WORK = path.join(HERE, '.work')
const OUT_GLB = path.join(UI, 'public/models/forklift.glb')
const OUT_RIG = path.join(UI, 'src/components/scroll-scene/forklift/rig.generated.js')

/** 링크별 감면율. 바퀴는 원통이라 많이 깎으면 각져 보인다. */
const LINKS = [
  { name: 'base_link', ratio: 0.3, error: 0.004 },
  { name: 'fork_lift_link', ratio: 0.4, error: 0.003 },
  { name: 'front_left_wheel_link', ratio: 0.5, error: 0.0015 },
  { name: 'front_right_wheel_link', ratio: 0.5, error: 0.0015 },
  { name: 'rear_left_wheel_link', ratio: 0.5, error: 0.0015 },
  { name: 'rear_right_wheel_link', ratio: 0.5, error: 0.0015 },
  { name: 'steering_handle_link', ratio: 0.5, error: 0.002 },
]

/** 화물 소품. 런타임이 복제해서 팔레트를 만든다. */
const PROPS = [
  { name: 'prop_pallet', file: 'props/pallet.obj', ratio: 1 },
  { name: 'prop_box', file: 'props/box.obj', ratio: 1 },
]

const log = (...args) => console.log('[forklift]', ...args)

/* ------------------------------------------------------------------ */
/* URDF                                                                */
/* ------------------------------------------------------------------ */

/**
 * URDF 를 읽어 조인트 표를 만든다.
 * 정규식 파서인 이유는 이 파일이 고정된 한 개이고 스키마가 얕아서다 —
 * XML 파서를 하나 더 들이는 것보다 여기서 끝내는 편이 읽기 쉽다.
 */
async function readUrdf() {
  const xml = await fs.readFile(path.join(DELIVERY, 'urdf/forklift.urdf'), 'utf8')
  const num = (s, fallback) => {
    if (s == null) return fallback
    const v = s.trim().split(/\s+/).map(Number)
    return v.every(Number.isFinite) ? v : fallback
  }
  const attr = (block, tag, name) =>
    new RegExp(`<${tag}[^>]*\\b${name}="([^"]*)"`).exec(block)?.[1] ?? null

  const joints = []
  for (const [, block] of xml.matchAll(/<joint\b([\s\S]*?)<\/joint>/g)) {
    const head = /^[^>]*/.exec(block)[0]
    joints.push({
      name: /\bname="([^"]*)"/.exec(head)[1],
      type: /\btype="([^"]*)"/.exec(head)[1],
      parent: attr(block, 'parent', 'link'),
      child: attr(block, 'child', 'link'),
      xyz: num(attr(block, 'origin', 'xyz'), [0, 0, 0]),
      rpy: num(attr(block, 'origin', 'rpy'), [0, 0, 0]),
      axis: num(attr(block, 'axis', 'xyz'), [1, 0, 0]),
      lower: num(attr(block, 'limit', 'lower'), null)?.[0] ?? null,
      upper: num(attr(block, 'limit', 'upper'), null)?.[0] ?? null,
      mimic: attr(block, 'mimic', 'joint')
        ? {
            joint: attr(block, 'mimic', 'joint'),
            multiplier: Number(attr(block, 'mimic', 'multiplier') ?? 1),
            offset: Number(attr(block, 'mimic', 'offset') ?? 0),
          }
        : null,
    })
  }
  const links = [...xml.matchAll(/<link\b[^>]*\bname="([^"]*)"/g)].map((m) => m[1])
  return { links, joints }
}

/** URDF rpy(고정축 XYZ) -> 쿼터니언 [x,y,z,w]. app.js 의 applyOrigin 과 같은 순서다. */
function quatFromRpy([r, p, y]) {
  const [cr, sr] = [Math.cos(r / 2), Math.sin(r / 2)]
  const [cp, sp] = [Math.cos(p / 2), Math.sin(p / 2)]
  const [cy, sy] = [Math.cos(y / 2), Math.sin(y / 2)]
  return [
    sr * cp * cy - cr * sp * sy,
    cr * sp * cy + sr * cp * sy,
    cr * cp * sy - sr * sp * cy,
    cr * cp * cy + sr * sp * sy,
  ]
}

/* ------------------------------------------------------------------ */
/* 소스 준비                                                            */
/* ------------------------------------------------------------------ */

async function prepareSources() {
  await fs.rm(WORK, { recursive: true, force: true })
  await fs.cp(path.join(DELIVERY, 'meshes'), WORK, { recursive: true })

  for (const dir of [WORK, path.join(WORK, 'props')]) {
    for (const file of await fs.readdir(dir)) {
      if (!file.endsWith('.mtl')) continue
      const p = path.join(dir, file)
      const text = (await fs.readFile(p, 'utf8'))
        // `-clamp on` 은 파서가 파일명의 일부로 읽어 텍스처를 놓친다
        .replace(/^(\s*map_Kd\s+)-clamp\s+on\s+/gim, '$1')
        // 범프맵은 전부 회색 노이즈다. 4MB 를 먹고 실루엣에는 기여하지 않는다.
        .replace(/^\s*(?:map_Bump|bump|norm)\s+.*$/gim, '')
      await fs.writeFile(p, text)
    }
  }
}

/** OBJ 의 축정렬 바운딩박스 (치수표를 소스에서 직접 뽑기 위해) */
async function objBounds(file) {
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (const line of (await fs.readFile(path.join(WORK, file), 'utf8')).split('\n')) {
    if (!line.startsWith('v ')) continue
    const p = line.split(/\s+/).slice(1, 4).map(Number)
    for (let i = 0; i < 3; i++) {
      if (p[i] < min[i]) min[i] = p[i]
      if (p[i] > max[i]) max[i] = p[i]
    }
  }
  return { min, max }
}

/* ------------------------------------------------------------------ */
/* 링크별 변환                                                          */
/* ------------------------------------------------------------------ */

const io = new NodeIO()
  .registerExtensions(ALL_EXTENSIONS)
  .registerDependencies({
    'draco3d.encoder': await draco3d.createEncoderModule(),
    'draco3d.decoder': await draco3d.createDecoderModule(),
  })

const countTris = (doc) =>
  doc
    .getRoot()
    .listMeshes()
    .flatMap((m) => m.listPrimitives())
    .reduce((n, p) => n + (p.getIndices()?.getCount() ?? p.getAttribute('POSITION').getCount()) / 3, 0)

async function convertPart({ name, file, ratio, error = 0.002 }) {
  const src = file ?? `${name.replace(/_link$/, '_link')}.obj`
  const glb = await obj2gltf(path.join(WORK, src), { binary: true, metallicRoughness: true })
  const doc = await io.readBinary(new Uint8Array(glb))
  const before = countTris(doc)
  const meshesBefore = doc.getRoot().listMeshes().length

  await doc.transform(
    dedup(),
    // 단색 재질을 팔레트 텍스처 한 장으로 묶는다 — 이게 있어야 join 이 실제로 합쳐진다
    palette({ min: 3, blockSize: 4 }),
    flatten(),
    join(),
    dedup(),
    prune({ keepLeaves: false }),
  )

  if (ratio < 1) {
    await doc.transform(
      weld(),
      simplify({ simplifier: MeshoptSimplifier, ratio, error, lockBorder: false }),
      prune({ keepLeaves: false }),
    )
  }

  const after = countTris(doc)
  const prims = doc
    .getRoot()
    .listMeshes()
    .reduce((n, m) => n + m.listPrimitives().length, 0)
  log(
    `${name}: ${before.toLocaleString()} -> ${after.toLocaleString()} tris,`,
    `mesh ${meshesBefore} -> ${doc.getRoot().listMeshes().length} (prim ${prims})`,
  )
  return doc
}

/* ------------------------------------------------------------------ */
/* 조립                                                                 */
/* ------------------------------------------------------------------ */

/**
 * 링크 문서를 본 문서로 병합하고, 그 씬의 자식들을 담은 노드 하나를 돌려준다.
 * merge() 는 씬까지 같이 들여오므로 자식을 옮긴 뒤 빈 씬은 버린다.
 */
function mergeAsNode(main, part, nodeName) {
  const map = mergeDocuments(main, part)
  const holder = main.createNode(nodeName)
  for (const srcScene of part.getRoot().listScenes()) {
    const scene = map.get(srcScene)
    if (!scene) continue
    for (const child of scene.listChildren()) {
      scene.removeChild(child)
      holder.addChild(child)
    }
    scene.dispose()
  }
  return holder
}

async function build() {
  await prepareSources()
  const urdf = await readUrdf()

  const main = new Document()
  main.createBuffer()
  const scene = main.createScene('forklift')

  /* --- 링크 --- */
  const linkNodes = new Map()
  for (const link of urdf.links) {
    const node = main.createNode(link)
    linkNodes.set(link, node)
  }
  for (const spec of LINKS) {
    const part = await convertPart({ ...spec, file: `${spec.name}.obj` })
    const visual = mergeAsNode(main, part, `${spec.name}_visual`)
    linkNodes.get(spec.name).addChild(visual)
  }

  /* --- 조인트 계층 --- */
  // 각 조인트는 origin 노드(URDF 의 고정 오프셋) + motion 노드(런타임이 움직이는 곳)
  // 두 겹으로 만든다. 런타임은 motion 노드만 건드리므로 원점이 오염되지 않는다.
  const childLinks = new Set()
  for (const joint of urdf.joints) {
    const origin = main.createNode(`${joint.name}__origin`)
    origin.setTranslation(joint.xyz)
    origin.setRotation(quatFromRpy(joint.rpy))
    const motion = main.createNode(joint.name)
    origin.addChild(motion)
    motion.addChild(linkNodes.get(joint.child))
    linkNodes.get(joint.parent).addChild(origin)
    childLinks.add(joint.child)
  }
  const rootLink = urdf.links.find((l) => !childLinks.has(l))
  scene.addChild(linkNodes.get(rootLink))

  /* --- 소품 --- */
  for (const spec of PROPS) {
    const part = await convertPart(spec)
    scene.addChild(mergeAsNode(main, part, spec.name))
  }

  /* --- 마무리 --- */
  await main.transform(
    // 병합할 때마다 버퍼가 하나씩 딸려 온다 — GLB 는 버퍼 하나만 허용한다
    unpartition(),
    dedup(),
    textureCompress({ encoder: sharp, targetFormat: 'webp', resize: [1024, 1024], quality: 82 }),
  )
  // Draco 는 마지막에. 앞 단계들이 인덱스/속성을 다시 만들면 압축이 풀린다.
  await main.transform(draco({ method: 'edgebreaker' }))

  await fs.mkdir(path.dirname(OUT_GLB), { recursive: true })
  await io.write(OUT_GLB, main)
  const bytes = (await fs.stat(OUT_GLB)).size
  log(`wrote ${path.relative(UI, OUT_GLB)} — ${(bytes / 1e6).toFixed(2)} MB`)

  await writeRig(urdf)
  await fs.rm(WORK, { recursive: true, force: true })
}

/* ------------------------------------------------------------------ */
/* 런타임용 치수표                                                       */
/* ------------------------------------------------------------------ */

async function writeRig(urdf) {
  const bounds = Object.fromEntries(
    await Promise.all(
      [...LINKS.map((l) => `${l.name}.obj`), 'props/pallet.obj', 'props/box.obj'].map(async (f) => [
        f,
        await objBounds(f),
      ]),
    ),
  )
  const joint = (name) => urdf.joints.find((j) => j.name === name)

  const frontAxleX = joint('front_left_wheel_joint').xyz[0]
  const rearAxleX = (joint('rear_left_steering_joint').xyz[0] + joint('rear_right_steering_joint').xyz[0]) / 2
  const frontRadius = (bounds['front_left_wheel_link.obj'].max[1] - bounds['front_left_wheel_link.obj'].min[1]) / 2
  const rearRadius = (bounds['rear_left_wheel_link.obj'].max[1] - bounds['rear_left_wheel_link.obj'].min[1]) / 2

  // 바퀴가 바닥에 닿도록 base_link 를 띄우는 높이. 앞뒤 중 더 큰 값을 쓴다
  // (작은 쪽을 쓰면 한쪽 바퀴가 바닥을 파고든다).
  const rideHeight = Math.max(
    frontRadius - joint('front_left_wheel_joint').xyz[2],
    rearRadius - joint('rear_left_steering_joint').xyz[2],
  )

  const fork = joint('fork_lift_joint')
  // 포크 백레스트(캐리지 앞면) — 팔레트가 여기에 닿을 때까지 들어간다
  const backrestX = fork.xyz[0] + bounds['fork_lift_link.obj'].min[0]
  const tineTipX = fork.xyz[0] + bounds['fork_lift_link.obj'].max[0]
  const pallet = bounds['props/pallet.obj']
  const palletSize = [0, 1, 2].map((i) => pallet.max[i] - pallet.min[i])

  const rig = `/**
 * 자동 생성 파일 — tools/forklift-model/build.mjs 가 URDF 와 OBJ 에서 뽑는다.
 * 손으로 고치지 말 것. 값을 바꾸려면 원본 URDF 를 고치고 다시 빌드한다.
 *
 * 단위 m / rad, 좌표계는 URDF 그대로 Z-up. 차량 전방은 +X, 좌측이 +Y 다.
 */

/** motion 노드 이름 = URDF 조인트 이름. 런타임이 이 이름으로 노드를 찾는다. */
export const joints = ${JSON.stringify(
    Object.fromEntries(
      urdf.joints.map((j) => [
        j.name,
        { type: j.type, axis: j.axis, lower: j.lower, upper: j.upper, mimic: j.mimic },
      ]),
    ),
    null,
    2,
  )}

export const vehicle = {
  /** 앞축(비조향축) - 뒷축(조향축) 거리. 후륜 조향이라 경로를 따라가는 점은 앞축이다. */
  wheelbase: ${(frontAxleX - rearAxleX).toFixed(6)},
  frontAxleX: ${frontAxleX.toFixed(6)},
  rearAxleX: ${rearAxleX.toFixed(6)},
  frontWheelRadius: ${frontRadius.toFixed(6)},
  rearWheelRadius: ${rearRadius.toFixed(6)},
  /** 바퀴가 바닥(z=0)에 닿는 base_link 높이 */
  rideHeight: ${rideHeight.toFixed(6)},
  /** 차량 외곽 (base_link + 포크). 카메라 프레이밍과 그림자 범위의 기준. */
  extent: {
    min: [${Math.min(bounds['base_link.obj'].min[0], backrestX).toFixed(3)}, ${bounds['base_link.obj'].min[1].toFixed(3)}, ${bounds['base_link.obj'].min[2].toFixed(3)}],
    max: [${tineTipX.toFixed(3)}, ${bounds['base_link.obj'].max[1].toFixed(3)}, ${bounds['base_link.obj'].max[2].toFixed(3)}],
  },
}

export const forkLift = {
  /** fork_lift_joint 의 이동 한계 (URDF limit 그대로) */
  lower: ${fork.lower},
  upper: ${fork.upper},
  /** 캐리지 앞면 / 포크 끝 (차량 좌표 X). 팔레트 진입 깊이가 여기서 나온다. */
  backrestX: ${backrestX.toFixed(6)},
  tineTipX: ${tineTipX.toFixed(6)},
  /**
   * 포크 두 갈래의 Y 중심. 포크가 차체 중앙에 있지 않아서(좌측으로 치우쳐 있다)
   * 팔레트도 같은 만큼 옆으로 놓여야 갈래가 슬롯에 들어간다.
   * 값은 전달 패키지 데모(threejs_demo/app.js 의 FORK_TINES)에서 가져왔다.
   */
  tineCenterY: -0.092357,
}

export const palletProp = {
  size: [${palletSize.map((v) => v.toFixed(4)).join(', ')}],
  /** 메시 원점이 바닥면에 있다 (z=0 이 접지면) */
  originAtBottom: ${pallet.min[2] === 0},
}

export const boxProp = {
  size: [${[0, 1, 2].map((i) => (bounds['props/box.obj'].max[i] - bounds['props/box.obj'].min[i]).toFixed(4)).join(', ')}],
}
`
  await fs.mkdir(path.dirname(OUT_RIG), { recursive: true })
  await fs.writeFile(OUT_RIG, rig)
  log(`wrote ${path.relative(UI, OUT_RIG)}`)
}

await MeshoptSimplifier.ready
await build()
