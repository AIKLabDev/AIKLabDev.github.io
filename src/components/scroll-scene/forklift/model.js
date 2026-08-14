import { InstancedMesh, Matrix4, Object3D, Vector3 } from 'three'
import { forkHeights } from '../../../data/heroStages'
import { boxProp, forkLift, joints, palletProp } from './rig.generated'

/**
 * 포크에 정확히 물렸을 때 팔레트가 놓이는 자리 (차량 좌표).
 * 포크 끝 기준 — 포크(1.31m)가 팔레트(1.02m)보다 길어 백레스트 기준이면 마스트를 뚫는다.
 */
export const dockOffset = {
  x: forkLift.tineTipX - palletProp.size[0] / 2,
  y: forkLift.tineCenterY,
}

/** 포크가 최저점에서 얼마나 올라왔는지 = 실린 팔레트가 뜬 높이 */
export const palletRise = (fork) => Math.max(0, fork - forkHeights.entry)

const PARTS = ['base_link', 'prop_pallet', 'prop_box', 'prop_truck', 'prop_rack']

export function buildLibrary(gltfScene) {
  const source = gltfScene.clone(true)
  const found = {}
  for (const name of PARTS) {
    const node = source.getObjectByName(name)
    if (!node) throw new Error(`forklift.glb 구조가 예상과 다릅니다 (${name})`)
    node.removeFromParent()
    found[name] = node
  }

  // obj2gltf 가 Ks 를 metallic 으로 옮겨 금속 1.0/거칠기 1.0 이 되어 검게 렌더된다
  finish(found.prop_truck, 0.2, 0.52)
  finish(found.prop_rack, 0.55, 0.45)

  const box = findMesh(found.prop_box)
  const rack = findMesh(found.prop_rack)
  return {
    robot: found.base_link,
    pallet: found.prop_pallet,
    truck: found.prop_truck,
    boxGeometry: box.geometry,
    boxMaterial: box.material,
    rackGeometry: rack.geometry,
    rackMaterial: rack.material,
  }
}

export function cloneProp(source) {
  const prop = source.clone(true)
  prop.traverse((o) => {
    if (!o.isMesh) return
    o.castShadow = true
    o.receiveShadow = true
    o.material = o.material.clone()
  })
  return prop
}

function finish(node, metalness, roughness) {
  node.traverse((o) => {
    if (!o.isMesh) return
    for (const m of Array.isArray(o.material) ? o.material : [o.material]) {
      m.metalness = metalness
      m.roughness = roughness
    }
  })
}

function findMesh(object) {
  let found = null
  object.traverse((o) => {
    if (!found && o.isMesh) found = o
  })
  return found
}

export function createForklift(library, { tint } = {}) {
  const robot = library.robot.clone(true)
  robot.traverse((o) => {
    if (!o.isMesh) return
    o.castShadow = true
    o.receiveShadow = true
    o.material = o.material.clone()
    tint?.(o.material)
  })
  return { root: robot, setJoints: createJointDriver(robot) }
}

function createJointDriver(robot) {
  const nodes = {}
  for (const name of Object.keys(joints)) nodes[name] = robot.getObjectByName(name)

  const order = []
  const visit = (name, guard = new Set()) => {
    if (order.includes(name)) return
    if (guard.has(name)) throw new Error(`mimic 순환: ${name}`)
    guard.add(name)
    const mimic = joints[name].mimic
    if (mimic) visit(mimic.joint, guard)
    order.push(name)
  }
  for (const name of Object.keys(joints)) visit(name)

  const axis = new Vector3()
  const resolved = {}

  return (values) => {
    for (const name of order) {
      const joint = joints[name]
      let value = joint.mimic
        ? resolved[joint.mimic.joint] * joint.mimic.multiplier + joint.mimic.offset
        : (values[name] ?? 0)
      if (joint.lower != null && value < joint.lower) value = joint.lower
      if (joint.upper != null && value > joint.upper) value = joint.upper
      resolved[name] = value

      const node = nodes[name]
      if (!node) continue
      axis.fromArray(joint.axis)
      if (joint.type === 'prismatic') node.position.copy(axis).multiplyScalar(value)
      else node.quaternion.setFromAxisAngle(axis, value)
    }
  }
}

export const STEERING_MIMIC = joints.rear_left_steering_joint.mimic.multiplier

const LAYOUT = { columns: 2, rows: 3, layers: 3 }

/** `layers` = 한 장에 쌓는 켜 수, `levels` = 겹쳐 놓는 팔레트 장수 */
export function createLoadedPallet(library, { levels = 1, layers = LAYOUT.layers } = {}) {
  const group = new Object3D()
  const matrix = new Matrix4()
  const position = new Vector3()
  const stackHeight = palletProp.size[2] + boxProp.size[2] * layers

  const count = LAYOUT.columns * LAYOUT.rows * layers * levels
  const boxes = new InstancedMesh(library.boxGeometry, library.boxMaterial.clone(), count)
  boxes.castShadow = true
  boxes.receiveShadow = true

  let i = 0
  for (let level = 0; level < levels; level++) {
    const base = level * stackHeight

    const deck = library.pallet.clone(true)
    deck.position.z = base
    deck.traverse((o) => {
      if (!o.isMesh) return
      o.material = o.material.clone()
      o.castShadow = true
      o.receiveShadow = true
    })
    group.add(deck)

    for (let layer = 0; layer < layers; layer++) {
      for (let row = 0; row < LAYOUT.rows; row++) {
        for (let column = 0; column < LAYOUT.columns; column++) {
          position.set(
            (column - (LAYOUT.columns - 1) / 2) * boxProp.size[0],
            (row - (LAYOUT.rows - 1) / 2) * boxProp.size[1],
            base + palletProp.size[2] + boxProp.size[2] * layer,
          )
          boxes.setMatrixAt(i++, matrix.makeTranslation(position.x, position.y, position.z))
        }
      }
    }
  }
  boxes.instanceMatrix.needsUpdate = true
  group.add(boxes)
  return group
}

export function setStageOpacity(group, opacity) {
  applyFade(group, opacity)
}

function applyFade(object, factor) {
  const f = factor * (object.userData.fade ?? 1)
  object.visible = f > 0.003
  if (!object.visible) return

  const material = object.material
  if (material) {
    const solid = f > 0.997
    if (Array.isArray(material)) for (const m of material) applyOpacity(m, f, solid)
    else applyOpacity(material, f, solid)
  }
  for (const child of object.children) applyFade(child, f)
}

function applyOpacity(material, opacity, solid) {
  const data = material.userData
  if (data.baseOpacity === undefined) {
    data.baseOpacity = material.opacity
    data.baseDepthWrite = material.depthWrite
    // opacity 로 짐작하면 알파 텍스처 재질이 다 드러날 때 불투명해진다
    data.baseTransparent = material.transparent
  }
  material.transparent = !solid || data.baseTransparent
  material.opacity = data.baseOpacity * opacity
  material.depthWrite = data.baseDepthWrite
}
