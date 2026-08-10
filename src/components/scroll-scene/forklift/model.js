import { InstancedMesh, Matrix4, Object3D, Vector3 } from 'three'
import { forkHeights } from '../../../data/heroStages'
import { boxProp, forkLift, joints, palletProp } from './rig.generated'

/**
 * 포크에 정확히 물렸을 때 팔레트가 놓이는 자리 (차량 좌표).
 * 포크가 차체 중앙에서 좌측으로 치우쳐 있어 팔레트도 같은 만큼 비켜 앉는다.
 */
export const dockOffset = {
  x: forkLift.backrestX + palletProp.size[0] / 2,
  y: forkLift.tineCenterY,
}

/** 포크가 최저점에서 얼마나 올라왔는지 = 실린 팔레트가 뜬 높이 */
export const palletRise = (fork) => Math.max(0, fork - forkHeights.entry)

export function buildLibrary(gltfScene) {
  const source = gltfScene.clone(true)
  const robot = source.getObjectByName('base_link')
  const pallet = source.getObjectByName('prop_pallet')
  const box = source.getObjectByName('prop_box')
  if (!robot || !pallet || !box) {
    throw new Error('forklift.glb 구조가 예상과 다릅니다 (base_link / prop_pallet / prop_box)')
  }
  robot.removeFromParent()
  pallet.removeFromParent()
  box.removeFromParent()

  const boxMesh = findMesh(box)
  return { robot, pallet, boxGeometry: boxMesh.geometry, boxMaterial: boxMesh.material }
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
export const BOX_COUNT = LAYOUT.columns * LAYOUT.rows * LAYOUT.layers
export const STACK_HEIGHT = palletProp.size[2] + boxProp.size[2] * LAYOUT.layers

export function createLoadedPallet(library, { levels = 1 } = {}) {
  const group = new Object3D()
  const matrix = new Matrix4()
  const position = new Vector3()

  const boxes = new InstancedMesh(library.boxGeometry, library.boxMaterial.clone(), BOX_COUNT * levels)
  boxes.castShadow = true
  boxes.receiveShadow = true

  let i = 0
  for (let level = 0; level < levels; level++) {
    const base = level * STACK_HEIGHT

    const deck = library.pallet.clone(true)
    deck.position.z = base
    deck.traverse((o) => {
      if (!o.isMesh) return
      o.material = o.material.clone()
      o.castShadow = true
      o.receiveShadow = true
    })
    group.add(deck)

    for (let layer = 0; layer < LAYOUT.layers; layer++) {
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
    // 원래 투명했는지를 기억한다. 불투명도로 짐작하면 알파 텍스처를 쓰면서
    // opacity 가 1 인 재질(라벨 스프라이트)이 다 드러난 순간 불투명해진다
    data.baseTransparent = material.transparent
  }
  material.transparent = !solid || data.baseTransparent
  material.opacity = data.baseOpacity * opacity
  material.depthWrite = data.baseDepthWrite
}
