/**
 * Reads the dimple layout from Dan's golf ball file and writes it as a small list the intro
 * draws from: each dimple's centre (a direction from the middle of the ball) and its size.
 *
 *   node scripts/extract-dimples.ts
 *
 * Reads  src/marketing/intro/assets/golf-ball.source.glb (the file Dan supplied, unchanged)
 * Writes src/marketing/intro/dimples.ts
 *
 * Why: the file's mesh is too coarse to draw round dimples (each is only a few points across,
 * stretched until it touches its neighbours, so they read as hexagons). Its layout is exact,
 * though: every dimple is a dip to the same depth. The intro keeps that layout and draws each
 * dimple as a true round bowl. Run again only if the source file changes.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

const root = resolve(import.meta.dirname, '..')
const SOURCE = resolve(root, 'src/marketing/intro/assets/golf-ball.source.glb')
const TARGET = resolve(root, 'src/marketing/intro/dimples.ts')

type Gltf = {
  bufferViews: { byteOffset?: number; byteLength: number }[]
  meshes: {
    primitives: {
      extensions?: {
        KHR_draco_mesh_compression?: { bufferView: number; attributes: Record<string, number> }
      }
    }[]
  }[]
}

/** The parts of the Draco decoder this script uses. */
type DracoMesh = { num_points: () => number; num_faces: () => number }
type DracoAttribute = { num_components: () => number }
type DracoModule = {
  Decoder: new () => {
    DecodeArrayToMesh: (
      data: Int8Array,
      length: number,
      mesh: DracoMesh,
    ) => { ok: () => boolean; error_msg: () => string }
    GetAttributeByUniqueId: (mesh: DracoMesh, id: number) => DracoAttribute
    GetAttributeDataArrayForAllPoints: (
      mesh: DracoMesh,
      attribute: DracoAttribute,
      type: number,
      byteLength: number,
      ptr: number,
    ) => boolean
    GetTrianglesUInt32Array: (mesh: DracoMesh, byteLength: number, ptr: number) => boolean
  }
  Mesh: new () => DracoMesh
  DT_FLOAT32: number
  HEAPF32: Float32Array
  HEAPU32: Uint32Array
  _malloc: (bytes: number) => number
  _free: (ptr: number) => void
}

type Vec3 = [number, number, number]
const dot = (a: Vec3, b: Vec3) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2]
const normalise = (v: Vec3): Vec3 => {
  const length = Math.hypot(...v)
  return [v[0] / length, v[1] / length, v[2] / length]
}
const angle = (a: Vec3, b: Vec3) => Math.acos(Math.min(1, Math.max(-1, dot(a, b))))

const readGlb = (file: Buffer) => {
  if (file.toString('ascii', 0, 4) !== 'glTF') throw new Error('Not a GLB file')
  let offset = 12
  let json: Gltf | null = null
  let bin: Buffer | null = null
  while (offset < file.length) {
    const length = file.readUInt32LE(offset)
    const type = file.readUInt32LE(offset + 4)
    const chunk = file.subarray(offset + 8, offset + 8 + length)
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8')) as Gltf
    if (type === 0x004e4942) bin = chunk
    offset += 8 + length
  }
  if (!json || !bin) throw new Error('GLB is missing its JSON or binary chunk')
  return { json, bin }
}

/** The ball's points and triangles, decoded with the Draco decoder that ships with three. */
const decodeBall = async () => {
  const { json, bin } = readGlb(readFileSync(SOURCE))
  const draco = json.meshes[0]?.primitives[0]?.extensions?.KHR_draco_mesh_compression
  if (!draco) throw new Error('Expected a Draco-compressed mesh')
  const view = json.bufferViews[draco.bufferView]!
  const compressed = new Int8Array(
    bin.buffer,
    bin.byteOffset + (view.byteOffset ?? 0),
    view.byteLength,
  )

  // three marks its files as ES modules, but this decoder is an old-style script: run it in a
  // sandbox and pick up what it exports.
  const require = createRequire(import.meta.url)
  const decoderPath = require.resolve('three/examples/jsm/libs/draco/gltf/draco_decoder.js')
  const sandbox = { module: { exports: {} as unknown }, exports: {}, console }
  runInNewContext(readFileSync(decoderPath, 'utf8'), sandbox)
  const createDecoderModule = sandbox.module.exports as (options: object) => Promise<DracoModule>
  const m = await createDecoderModule({})
  const decoder = new m.Decoder()
  const mesh = new m.Mesh()
  const status = decoder.DecodeArrayToMesh(compressed, compressed.byteLength, mesh)
  if (!status.ok()) throw new Error(`Draco decoding failed: ${status.error_msg()}`)

  const attribute = decoder.GetAttributeByUniqueId(mesh, draco.attributes.POSITION!)
  const length = mesh.num_points() * attribute.num_components()
  let ptr = m._malloc(length * 4)
  decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, m.DT_FLOAT32, length * 4, ptr)
  const positions = new Float32Array(m.HEAPF32.buffer, ptr, length).slice()
  m._free(ptr)
  const indexCount = mesh.num_faces() * 3
  ptr = m._malloc(indexCount * 4)
  decoder.GetTrianglesUInt32Array(mesh, indexCount * 4, ptr)
  const indices = new Uint32Array(m.HEAPU32.buffer, ptr, indexCount).slice()
  m._free(ptr)
  return { positions, indices }
}

const main = async () => {
  const { positions, indices } = await decodeBall()
  const count = positions.length / 3
  const radius = new Float64Array(count)
  const direction: Vec3[] = []
  for (let i = 0; i < count; i++) {
    const p: Vec3 = [positions[3 * i]!, positions[3 * i + 1]!, positions[3 * i + 2]!]
    radius[i] = Math.hypot(...p)
    direction.push(normalise(p))
  }
  const outer = Math.max(...radius)
  const inner = Math.min(...radius)
  const depth = (outer - inner) / outer

  // Each dimple's deepest point: lower than every point it shares a triangle with.
  const neighbours = Array.from({ length: count }, () => new Set<number>())
  for (let t = 0; t < indices.length; t += 3) {
    const [a, b, c] = [indices[t]!, indices[t + 1]!, indices[t + 2]!]
    neighbours[a]!.add(b).add(c)
    neighbours[b]!.add(a).add(c)
    neighbours[c]!.add(a).add(b)
  }
  // Only full-depth dips count: the ridges between dimples have small dips of their own.
  const lowest = [...Array(count).keys()].filter(
    (i) =>
      (outer - radius[i]!) / (outer - inner) > 0.9 &&
      [...neighbours[i]!].every((k) => radius[k]! >= radius[i]!),
  )

  // A single point is only as precise as the mesh (about a degree). Refine each centre to the
  // middle of the dimple's deeper half, which is round in the source.
  const refined = lowest.map((i) => {
    const seed = direction[i]!
    const sum: Vec3 = [0, 0, 0]
    for (let k = 0; k < count; k++) {
      const below = (outer - radius[k]!) / (outer - inner)
      if (below < 0.5 || angle(direction[k]!, seed) > 0.06) continue
      const weight = below - 0.5
      sum[0] += direction[k]![0] * weight
      sum[1] += direction[k]![1] * weight
      sum[2] += direction[k]![2] * weight
    }
    return normalise(sum)
  })
  // A flat-bottomed dimple can have two equally deep points: keep one centre per dimple.
  const centres: Vec3[] = []
  for (const c of refined) if (centres.every((kept) => angle(kept, c) > 0.02)) centres.push(c)

  // A dimple's size: half the distance to its nearest neighbour (so neighbours just touch).
  // The intro shrinks them a little from there, leaving a flat ring between them.
  const halfGaps = centres.map((c, i) =>
    centres.reduce((best, other, k) => (k === i ? best : Math.min(best, angle(c, other) / 2)), 9),
  )

  const rows = centres
    .map((c, i) => `  ${[...c, halfGaps[i]!].map((v) => v.toFixed(5)).join(', ')},`)
    .join('\n')
  writeFileSync(
    TARGET,
    `// Written by scripts/extract-dimples.ts from golf-ball.source.glb. Don't edit by hand.

/** How deep the dimples are, as a share of the ball's radius. */
export const DIMPLE_DEPTH = ${depth.toFixed(5)}

/**
 * ${centres.length} dimples, four numbers each: the centre (x, y, z, a direction from the middle of the
 * ball) and the size (the angle, in radians, to halfway towards the nearest neighbour).
 */
export const DIMPLES = new Float32Array([
${rows}
])
`,
  )
  const degrees = (r: number) => ((r * 180) / Math.PI).toFixed(2)
  console.log(
    `Wrote ${TARGET}\n  ${centres.length} dimples, depth ${(depth * 100).toFixed(2)}% of the radius` +
      `\n  half-gaps ${degrees(Math.min(...halfGaps))}° to ${degrees(Math.max(...halfGaps))}°`,
  )
}

await main()
