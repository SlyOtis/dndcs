import * as THREE from 'three'
import * as CANNON from 'cannon-es'
import { get } from 'svelte/store'
import { userProfile } from './stores/auth.store'

type Point = [number, number, number]

export type DieShape = {
  sides: number
  vertices: Point[]
  faces: number[][]
  read: 'face' | 'vertex'
  labels: string[]
  radius: number
}

export type Frame = { position: Point; quaternion: [number, number, number, number] }

export type Throw = { shape: DieShape; value: number; labels: string[]; frames: Frame[] }

const STEP = 1 / 60
const STEPS_MAX = 60 * 6
const TRAY_HALF = 7.5
const CAMERA_HEIGHT = 28
const HOLD_MS = 1400
const FADE_MS = 450

const sub = (a: Point, b: Point): Point => [a[0] - b[0], a[1] - b[1], a[2] - b[2]]
const cross = (a: Point, b: Point): Point => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]]
const dot = (a: Point, b: Point) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const scale = (a: Point, s: number): Point => [a[0] * s, a[1] * s, a[2] * s]
const unit = (a: Point): Point => scale(a, 1 / Math.hypot(...a))

function getCentroid(points: Point[]): Point {
  const sum = points.reduce<Point>((all, one) => [all[0] + one[0], all[1] + one[1], all[2] + one[2]], [0, 0, 0])
  return scale(sum, 1 / points.length)
}

function getNormal(vertices: Point[], face: number[]): Point {
  const [a, b, c] = face.map((index) => vertices[index])
  const normal = unit(cross(sub(b, a), sub(c, a)))
  return dot(normal, getCentroid(face.map((index) => vertices[index]))) < 0 ? scale(normal, -1) : normal
}

function getWound(vertices: Point[], face: number[]): number[] {
  const centre = getCentroid(face.map((index) => vertices[index]))
  const normal = getNormal(vertices, face)
  const u = unit(sub(vertices[face[0]], centre))
  const v = cross(normal, u)
  const angle = (index: number) => {
    const offset = sub(vertices[index], centre)
    return Math.atan2(dot(offset, v), dot(offset, u))
  }
  return [...face].sort((a, b) => angle(a) - angle(b))
}

function getPolyhedron(geometry: THREE.BufferGeometry): { vertices: Point[]; faces: number[][] } {
  const position = (geometry.index ? geometry.toNonIndexed() : geometry).getAttribute('position')
  const vertices: Point[] = []
  const indexOf = (point: Point) => {
    const found = vertices.findIndex((one) => Math.hypot(...sub(one, point)) < 1e-4)
    if (found >= 0) return found
    vertices.push(point)
    return vertices.length - 1
  }
  const groups: { normal: Point; members: Set<number> }[] = []
  for (let i = 0; i < position.count; i += 3) {
    const triangle = [0, 1, 2].map((k) => indexOf([position.getX(i + k), position.getY(i + k), position.getZ(i + k)]))
    const normal = getNormal(vertices, triangle)
    const group = groups.find((one) => dot(one.normal, normal) > 0.999)
    if (group) triangle.forEach((index) => group.members.add(index))
    else groups.push({ normal, members: new Set(triangle) })
  }
  return { vertices, faces: groups.map((group) => [...group.members]) }
}

function getTrapezohedron(): { vertices: Point[]; faces: number[][] } {
  const ring = 0.1
  const apex = 0.9472135954999579
  const vertices: Point[] = [[0, apex, 0], [0, -apex, 0]]
  for (let k = 0; k < 10; k++) {
    const angle = (k * Math.PI) / 5
    vertices.push([Math.cos(angle), k % 2 ? -ring : ring, Math.sin(angle)])
  }
  const at = (k: number) => 2 + (k % 10)
  const faces: number[][] = []
  for (let k = 0; k < 10; k += 2) faces.push([0, at(k), at(k + 1), at(k + 2)])
  for (let k = 1; k < 10; k += 2) faces.push([1, at(k), at(k + 1), at(k + 2)])
  return { vertices, faces }
}

function getShape(sides: number, labels: string[]): DieShape {
  const solid =
    sides === 4 ? getPolyhedron(new THREE.TetrahedronGeometry(1)) :
    sides === 6 ? getPolyhedron(new THREE.BoxGeometry(1, 1, 1)) :
    sides === 8 ? getPolyhedron(new THREE.OctahedronGeometry(1)) :
    sides === 10 ? getTrapezohedron() :
    sides === 12 ? getPolyhedron(new THREE.DodecahedronGeometry(1)) :
    getPolyhedron(new THREE.IcosahedronGeometry(1))
  const reach = Math.max(...solid.vertices.map((point) => Math.hypot(...point)))
  const radius = sides === 4 ? 1.35 : sides === 6 ? 1.05 : sides === 20 ? 1.2 : 1.1
  const vertices = solid.vertices.map((point) => scale(point, radius / reach))
  return {
    sides,
    vertices,
    faces: solid.faces.map((face) => getWound(vertices, face)),
    read: sides === 4 ? 'vertex' : 'face',
    labels,
    radius
  }
}

const marked = (label: string) => (label === '6' || label === '9' ? `${label}.` : label)

export function getShapes(die: number, value: number): { shape: DieShape; value: number }[] {
  const count = (n: number) => Array.from({ length: n }, (_, i) => String(i + 1))
  if (die === 100) {
    const digits = Array.from({ length: 10 }, (_, i) => String(i))
    const tens = Math.floor((value % 100) / 10)
    return [
      { shape: getShape(10, digits.map((digit) => `${digit}0`)), value: tens },
      { shape: getShape(10, digits.map(marked)), value: value % 10 }
    ]
  }
  if (die === 10) {
    return [{ shape: getShape(10, Array.from({ length: 10 }, (_, i) => marked(String(i)))), value: value % 10 }]
  }
  const labels = die === 4 || die === 6 ? count(die) : count(die).map(marked)
  return [{ shape: getShape(die, labels), value: value - 1 }]
}

export function getDirections(shape: DieShape): Point[] {
  return shape.read === 'vertex'
    ? shape.vertices.map(unit)
    : shape.faces.map((face) => getNormal(shape.vertices, face))
}

export function getTop(shape: DieShape, quaternion: Frame['quaternion']): number {
  const turn = new THREE.Quaternion(...quaternion)
  let best = 0
  let height = -Infinity
  getDirections(shape).forEach((direction, index) => {
    const up = new THREE.Vector3(...direction).applyQuaternion(turn).y
    if (up > height) {
      height = up
      best = index
    }
  })
  return best
}

export function getLabels(shape: DieShape, top: number, value: number): string[] {
  const labels = [...shape.labels]
  ;[labels[top], labels[value]] = [labels[value], labels[top]]
  return labels
}

export function getThrows(dice: { shape: DieShape; value: number }[], aspect: number, random = Math.random): Throw[] {
  const world = new CANNON.World({ gravity: new CANNON.Vec3(0, -60, 0), allowSleep: true })
  const felt = new CANNON.Material('felt')
  const bone = new CANNON.Material('bone')
  world.addContactMaterial(new CANNON.ContactMaterial(felt, bone, { friction: 0.35, restitution: 0.35 }))
  world.addContactMaterial(new CANNON.ContactMaterial(bone, bone, { friction: 0.2, restitution: 0.4 }))

  const halfZ = TRAY_HALF - 1
  const halfX = TRAY_HALF * aspect - 1
  const walls: [CANNON.Vec3, number, number][] = [
    [new CANNON.Vec3(0, 0, 0), -Math.PI / 2, 0],
    [new CANNON.Vec3(-halfX, 0, 0), 0, Math.PI / 2],
    [new CANNON.Vec3(halfX, 0, 0), 0, -Math.PI / 2],
    [new CANNON.Vec3(0, 0, -halfZ), 0, 0],
    [new CANNON.Vec3(0, 0, halfZ), 0, Math.PI]
  ]
  walls.forEach(([position, tilt, turn], index) => {
    const wall = new CANNON.Body({ mass: 0, material: felt, shape: new CANNON.Plane(), position })
    if (index === 0) wall.quaternion.setFromEuler(tilt, 0, 0)
    else wall.quaternion.setFromEuler(0, turn, 0)
    world.addBody(wall)
  })

  const side = random() < 0.5 ? -1 : 1
  const bodies = dice.map(({ shape }, index) => {
    const body = new CANNON.Body({
      mass: 1,
      material: bone,
      shape: new CANNON.ConvexPolyhedron({
        vertices: shape.vertices.map((point) => new CANNON.Vec3(...point)),
        faces: shape.faces
      }),
      position: new CANNON.Vec3(side * (halfX - 1.5), 4 + index * 0.6, (random() - 0.5) * halfZ * (index % 2 ? -0.8 : 0.8)),
      angularDamping: 0.1,
      linearDamping: 0.1
    })
    body.sleepSpeedLimit = 0.2
    body.sleepTimeLimit = 0.25
    body.quaternion.setFromEuler(random() * Math.PI * 2, random() * Math.PI * 2, random() * Math.PI * 2)
    body.velocity.set(-side * (9 + random() * 7), -2, (random() - 0.5) * 8)
    body.angularVelocity.set((random() - 0.5) * 30, (random() - 0.5) * 30, (random() - 0.5) * 30)
    world.addBody(body)
    return body
  })

  const frames: Frame[][] = dice.map(() => [])
  for (let step = 0; step < STEPS_MAX; step++) {
    world.step(STEP)
    bodies.forEach((body, index) => {
      frames[index].push({
        position: [body.position.x, body.position.y, body.position.z],
        quaternion: [body.quaternion.x, body.quaternion.y, body.quaternion.z, body.quaternion.w]
      })
    })
    if (step > 30 && bodies.every((body) => body.sleepState === CANNON.Body.SLEEPING)) break
  }

  return dice.map(({ shape, value }, index) => {
    const last = frames[index][frames[index].length - 1]
    return { shape, value, frames: frames[index], labels: getLabels(shape, getTop(shape, last.quaternion), value) }
  })
}

function getTheme() {
  const style = getComputedStyle(document.documentElement)
  const read = (name: string, fallback: string) => style.getPropertyValue(name).trim() || fallback
  return {
    body: read('--stone', '#4a4034'),
    shade: read('--stone-dark', '#1f1a14'),
    ink: read('--metal-bright', '#ffe39a'),
    trim: read('--metal', '#d4a445'),
    font: read('--font-figures', 'Georgia, serif')
  }
}

function getFaceTexture(labels: { text: string; at: [number, number]; turn: number }[], outline: [number, number][], theme: ReturnType<typeof getTheme>, size: number) {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  const ground = context.createRadialGradient(128, 110, 20, 128, 128, 190)
  ground.addColorStop(0, theme.body)
  ground.addColorStop(1, theme.shade)
  context.fillStyle = ground
  context.fillRect(0, 0, 256, 256)
  for (let grit = 0; grit < 900; grit++) {
    context.fillStyle = grit % 2 ? 'rgba(255, 240, 210, 0.07)' : 'rgba(0, 0, 0, 0.18)'
    context.fillRect(Math.random() * 256, Math.random() * 256, 1 + Math.random() * 2, 1 + Math.random() * 2)
  }
  context.strokeStyle = theme.trim
  context.globalAlpha = 0.85
  context.lineWidth = 5
  context.beginPath()
  outline.forEach(([x, y], index) => {
    const at: [number, number] = [(0.5 + (x - 0.5) * 0.9) * 256, (1 - (0.5 + (y - 0.5) * 0.9)) * 256]
    if (index === 0) context.moveTo(...at)
    else context.lineTo(...at)
  })
  context.closePath()
  context.stroke()
  context.globalAlpha = 1
  context.fillStyle = theme.ink
  context.textAlign = 'center'
  context.textBaseline = 'middle'
  context.font = `600 ${size}px ${theme.font}`
  for (const label of labels) {
    context.save()
    context.translate(label.at[0] * 256, (1 - label.at[1]) * 256)
    context.rotate(label.turn)
    context.lineWidth = size * 0.1
    context.strokeStyle = 'rgba(0, 0, 0, 0.85)'
    context.strokeText(label.text, 0, 0)
    context.fillText(label.text, 0, 0)
    context.restore()
  }
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  return texture
}

function getMesh(shape: DieShape, labels: string[], theme: ReturnType<typeof getTheme>): THREE.Mesh {
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const geometry = new THREE.BufferGeometry()
  const materials: THREE.Material[] = []

  shape.faces.forEach((face, faceIndex) => {
    const points = face.map((index) => shape.vertices[index])
    const centre = getCentroid(points)
    const normal = getNormal(shape.vertices, face)
    const u = unit(sub(points[0], centre))
    const v = cross(normal, u)
    const reach = Math.max(...points.map((point) => Math.hypot(...sub(point, centre)))) * 1.05
    const uv = (point: Point): [number, number] => {
      const offset = sub(point, centre)
      return [0.5 + (0.5 * dot(offset, u)) / reach, 0.5 + (0.5 * dot(offset, v)) / reach]
    }
    const start = positions.length / 3
    for (let k = 1; k < face.length - 1; k++) {
      for (const point of [points[0], points[k], points[k + 1]]) {
        positions.push(...point)
        normals.push(...normal)
        uvs.push(...uv(point))
      }
    }
    geometry.addGroup(start, positions.length / 3 - start, faceIndex)

    const drawn =
      shape.read === 'vertex'
        ? face.map((vertex) => {
            const [x, y] = uv(shape.vertices[vertex])
            const at: [number, number] = [0.5 + (x - 0.5) * 0.58, 0.5 + (y - 0.5) * 0.58]
            return { text: labels[vertex], at, turn: Math.atan2(x - 0.5, y - 0.5) }
          })
        : [{ text: labels[faceIndex], at: [0.5, 0.5] as [number, number], turn: 0 }]
    const size = shape.read === 'vertex' ? 58 : shape.sides === 20 ? 78 : shape.sides >= 10 ? 88 : 110
    materials.push(
      new THREE.MeshStandardMaterial({ map: getFaceTexture(drawn, points.map(uv), theme, size), roughness: 0.62, metalness: 0.18, flatShading: true })
    )
  })

  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2))
  const mesh = new THREE.Mesh(geometry, materials)
  mesh.castShadow = true
  return mesh
}

function isStill(): boolean {
  return typeof window === 'undefined' || typeof document === 'undefined' || window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
    || get(userProfile)?.preferences?.animations_enabled === false
}

export async function postThrow(groups: { die: number; rolls: number[] }[]): Promise<void> {
  if (isStill() || groups.every((group) => group.rolls.length === 0)) return
  let renderer: THREE.WebGLRenderer
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true })
  } catch {
    return
  }

  const width = window.innerWidth
  const height = window.innerHeight
  const aspect = width / height
  const theme = getTheme()
  const throws = getThrows(groups.flatMap(({ die, rolls }) => rolls.flatMap((value) => getShapes(die, value))), aspect)

  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.setSize(width, height)
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFShadowMap
  const canvas = renderer.domElement
  canvas.className = 'dnd-dice'
  canvas.setAttribute('aria-hidden', 'true')
  canvas.style.cssText = `position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:9000;transition:opacity ${FADE_MS}ms ease`
  document.body.append(canvas)

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera((2 * Math.atan(TRAY_HALF / CAMERA_HEIGHT) * 180) / Math.PI, aspect, 1, 100)
  camera.position.set(0, CAMERA_HEIGHT, 0.001)
  camera.lookAt(0, 0, 0)

  scene.add(new THREE.HemisphereLight(0xfff4dc, 0x1a1208, 1.4))
  const sun = new THREE.DirectionalLight(0xffe6b0, 2.2)
  sun.position.set(-6, 20, 8)
  sun.castShadow = true
  sun.shadow.mapSize.set(1024, 1024)
  Object.assign(sun.shadow.camera, { left: -TRAY_HALF * aspect, right: TRAY_HALF * aspect, top: TRAY_HALF, bottom: -TRAY_HALF })
  scene.add(sun)
  const floor = new THREE.Mesh(new THREE.PlaneGeometry(TRAY_HALF * aspect * 2, TRAY_HALF * 2), new THREE.ShadowMaterial({ opacity: 0.35 }))
  floor.rotation.x = -Math.PI / 2
  floor.receiveShadow = true
  scene.add(floor)

  const meshes = throws.map((one) => {
    const mesh = getMesh(one.shape, one.labels, theme)
    scene.add(mesh)
    return mesh
  })

  const length = Math.max(...throws.map((one) => one.frames.length))
  const draw = (index: number) => {
    throws.forEach((one, k) => {
      const frame = one.frames[Math.min(index, one.frames.length - 1)]
      meshes[k].position.set(...frame.position)
      meshes[k].quaternion.set(...frame.quaternion)
    })
    renderer.render(scene, camera)
  }

  await new Promise<void>((resolve) => {
    const began = performance.now()
    const tick = (now: number) => {
      const index = Math.max(0, Math.floor((now - began) / (STEP * 1000)))
      try {
        draw(index)
      } catch {
        resolve()
        return
      }
      if (index < length - 1) requestAnimationFrame(tick)
      else resolve()
    }
    requestAnimationFrame(tick)
  })

  window.setTimeout(() => {
    canvas.style.opacity = '0'
    window.setTimeout(() => {
      scene.traverse((node) => {
        if (!(node instanceof THREE.Mesh)) return
        node.geometry.dispose()
        for (const material of [node.material].flat()) {
          ;(material as THREE.MeshStandardMaterial).map?.dispose()
          material.dispose()
        }
      })
      renderer.dispose()
      canvas.remove()
    }, FADE_MS)
  }, HOLD_MS)
}
