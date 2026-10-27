/**
 * Unpacks the supplied golf ball (Draco-compressed GLB) into a plain GLB that browsers can read
 * without a decoder, and scales it to a radius of 1.
 *
 *   node scripts/unpack-golf-ball.ts
 *
 * Reads  src/marketing/intro/assets/golf-ball.source.glb (the file Dan supplied, unchanged)
 * Writes src/marketing/intro/assets/golf-ball.glb
 *
 * Uses the Draco decoder that ships with three. Run it again only if the source file changes.
 */
import { readFileSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { resolve } from 'node:path'
import { runInNewContext } from 'node:vm'

const root = resolve(import.meta.dirname, '..')
const SOURCE = resolve(root, 'src/marketing/intro/assets/golf-ball.source.glb')
const TARGET = resolve(root, 'src/marketing/intro/assets/golf-ball.glb')

type Gltf = {
  accessors: { count: number }[]
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
    ) => {
      ok: () => boolean
      error_msg: () => string
    }
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

const pad4 = (buffer: Buffer, fill = 0) => {
  const extra = (4 - (buffer.length % 4)) % 4
  return extra ? Buffer.concat([buffer, Buffer.alloc(extra, fill)]) : buffer
}

const main = async () => {
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

  const readFloats = (uniqueId: number) => {
    const attribute = decoder.GetAttributeByUniqueId(mesh, uniqueId)
    const length = mesh.num_points() * attribute.num_components()
    const ptr = m._malloc(length * 4)
    decoder.GetAttributeDataArrayForAllPoints(mesh, attribute, m.DT_FLOAT32, length * 4, ptr)
    const values = new Float32Array(m.HEAPF32.buffer, ptr, length).slice()
    m._free(ptr)
    return values
  }
  const positions = readFloats(draco.attributes.POSITION!)
  const normals = readFloats(draco.attributes.NORMAL!)
  const indexCount = mesh.num_faces() * 3
  const ptr = m._malloc(indexCount * 4)
  decoder.GetTrianglesUInt32Array(mesh, indexCount * 4, ptr)
  const indices32 = new Uint32Array(m.HEAPU32.buffer, ptr, indexCount).slice()
  m._free(ptr)
  const vertexCount = positions.length / 3

  // Scale to a radius of 1 (the source is in millimetres), and note how deep the dimples go.
  let maxRadius = 0
  let minRadius = Infinity
  for (let i = 0; i < positions.length; i += 3) {
    const r = Math.hypot(positions[i]!, positions[i + 1]!, positions[i + 2]!)
    maxRadius = Math.max(maxRadius, r)
    minRadius = Math.min(minRadius, r)
  }
  for (let i = 0; i < positions.length; i++) positions[i]! /= maxRadius
  const min = [Infinity, Infinity, Infinity]
  const max = [-Infinity, -Infinity, -Infinity]
  for (let i = 0; i < positions.length; i++) {
    min[i % 3] = Math.min(min[i % 3]!, positions[i]!)
    max[i % 3] = Math.max(max[i % 3]!, positions[i]!)
  }

  const indices =
    vertexCount <= 0xffff ? Uint16Array.from(indices32) : (indices32 as Uint32Array<ArrayBuffer>)
  const positionBytes = Buffer.from(positions.buffer)
  const normalBytes = Buffer.from(normals.buffer)
  const indexBytes = pad4(Buffer.from(indices.buffer))
  const binary = Buffer.concat([positionBytes, normalBytes, indexBytes])

  const gltf = {
    asset: { version: '2.0', generator: 'golf-platform scripts/unpack-golf-ball.ts' },
    scene: 0,
    scenes: [{ nodes: [0] }],
    nodes: [{ name: 'GolfBall', mesh: 0 }],
    meshes: [
      {
        name: 'GolfBall',
        primitives: [{ attributes: { POSITION: 0, NORMAL: 1 }, indices: 2, mode: 4 }],
      },
    ],
    accessors: [
      { bufferView: 0, componentType: 5126, count: vertexCount, type: 'VEC3', min, max },
      { bufferView: 1, componentType: 5126, count: vertexCount, type: 'VEC3' },
      {
        bufferView: 2,
        componentType: indices instanceof Uint16Array ? 5123 : 5125,
        count: indexCount,
        type: 'SCALAR',
      },
    ],
    bufferViews: [
      { buffer: 0, byteOffset: 0, byteLength: positionBytes.length, target: 34962 },
      {
        buffer: 0,
        byteOffset: positionBytes.length,
        byteLength: normalBytes.length,
        target: 34962,
      },
      {
        buffer: 0,
        byteOffset: positionBytes.length + normalBytes.length,
        byteLength: indices.byteLength,
        target: 34963,
      },
    ],
    buffers: [{ byteLength: binary.length }],
  }

  const jsonChunk = pad4(Buffer.from(JSON.stringify(gltf), 'utf8'), 0x20)
  const header = Buffer.alloc(12)
  header.write('glTF', 0, 'ascii')
  header.writeUInt32LE(2, 4)
  header.writeUInt32LE(12 + 8 + jsonChunk.length + 8 + binary.length, 8)
  const chunkHeader = (length: number, type: number) => {
    const b = Buffer.alloc(8)
    b.writeUInt32LE(length, 0)
    b.writeUInt32LE(type, 4)
    return b
  }
  writeFileSync(
    TARGET,
    Buffer.concat([
      header,
      chunkHeader(jsonChunk.length, 0x4e4f534a),
      jsonChunk,
      chunkHeader(binary.length, 0x004e4942),
      binary,
    ]),
  )

  console.log(
    `Wrote ${TARGET}\n  ${vertexCount} points, ${indexCount / 3} triangles` +
      `\n  dimple depth ${(((maxRadius - minRadius) / maxRadius) * 100).toFixed(2)}% of the radius`,
  )
}

await main()
