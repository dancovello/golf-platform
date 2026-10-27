/**
 * The golf ball intro's 3D scene: a ball lit only from behind and above, on a see-through
 * canvas so the page's own background shows around it.
 *
 * The dimples follow the layout in Dan's ball file (scripts/extract-dimples.ts writes it to
 * ./dimples.ts) but are drawn as true round bowls, pixel by pixel, so they stay round at any
 * size. The file's own mesh is too coarse for that: its dimples read as hexagons.
 *
 * How: once, at start-up, every direction from the middle of the ball is labelled with its
 * nearest dimple (a small cube-shaped lookup image). Each pixel then finds its dimple there and
 * works out the exact bowl shape from that dimple's centre and size.
 *
 * The ball's body is painted in the page background colour, so only the light on its top edge
 * and dimples shows. Everything below the light's reach dissolves into the page.
 *
 * Loaded on demand (import('./ballScene')), so three never reaches a page's first download.
 */
import {
  BackSide,
  Color,
  CubeCamera,
  DataTexture,
  FloatType,
  Mesh,
  NearestFilter,
  OrthographicCamera,
  Quaternion,
  RGBAFormat,
  Scene,
  ShaderMaterial,
  SphereGeometry,
  UnsignedByteType,
  Vector3,
  WebGLCubeRenderTarget,
  WebGLRenderer,
} from 'three'

import { DIMPLE_DEPTH, DIMPLES } from './dimples'
import { PHONE_MAX_WIDTH, type BallLook } from './look'

const DIMPLE_COUNT = DIMPLES.length / 4
// Size of each side of the nearest-dimple lookup. It only has to tell dimples apart (about 20
// pixels across each), not draw them, so it can be small.
const LOOKUP_SIZE = 256

// ---- The one-off lookup: which dimple is nearest to each direction ----

const lookupVertexShader = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const lookupFragmentShader = /* glsl */ `
  uniform highp sampler2D uDimples;
  varying vec3 vDirection;
  void main() {
    vec3 d = normalize(vDirection);
    float best = -2.0;
    int nearest = 0;
    for (int i = 0; i < DIMPLE_COUNT; i++) {
      float closeness = dot(d, texelFetch(uDimples, ivec2(i, 0), 0).xyz);
      if (closeness > best) {
        best = closeness;
        nearest = i;
      }
    }
    // The dimple's number, split across two colour channels.
    gl_FragColor = vec4(float(nearest % 256) / 255.0, float(nearest / 256) / 255.0, 0.0, 1.0);
  }
`

// ---- The ball ----

const vertexShader = /* glsl */ `
  varying vec3 vDirection;
  varying vec3 vSphere;

  void main() {
    // The direction on the unturned ball (for the dimples) and on the screen (for the light).
    vDirection = position;
    vSphere = normalize(normalMatrix * position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform mat3 normalMatrix;
  uniform samplerCube uNearest;
  uniform highp sampler2D uDimples;
  uniform float uDepth;
  uniform float uSize;
  uniform vec3 uBackground;
  uniform vec3 uLightColor;
  uniform vec3 uLightDir;
  uniform float uRim;
  uniform float uRimTightness;
  uniform float uDimple;
  uniform float uDimpleSharpness;
  uniform float uShadow;
  uniform float uReach;

  varying vec3 vDirection;
  varying vec3 vSphere;

  vec3 linearToSrgb(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }

  // The surface direction at d, on the unturned ball: tilted towards the dimple's centre
  // inside a dimple (a round bowl), straight out on the flat ring between dimples.
  vec3 surfaceNormal(vec3 d) {
    vec4 label = texture(uNearest, d);
    int nearest = int(label.r * 255.0 + 0.5) + 256 * int(label.g * 255.0 + 0.5);
    vec4 dimple = texelFetch(uDimples, ivec2(nearest, 0), 0);
    vec3 centre = dimple.xyz;
    float size = dimple.w * uSize;
    // How far from the centre, as a share of the dimple's size (1 = its edge).
    float along = atan(length(cross(d, centre)), dot(d, centre)) / size;
    // A bowl's slope grows steadily from its middle, then rolls over a rounded rim to meet the
    // surface smoothly. A sharp rim would catch the light as a thin, broken outline. The rim
    // is never narrower than a pixel or two, so small dimples don't shimmer either.
    float rim = max(EDGE_ROUNDING, 2.0 * fwidth(along));
    float slope = 2.0 * uDepth * along / size * (1.0 - smoothstep(1.0 - rim, 1.0, along));
    vec3 towardCentre = centre - d * dot(d, centre);
    float distance = length(towardCentre);
    if (distance > 1e-6) towardCentre /= distance;
    return normalize(d + slope * towardCentre);
  }

  void main() {
    vec3 n = normalize(normalMatrix * surfaceNormal(normalize(vDirection)));
    vec3 s = normalize(vSphere);
    vec3 v = vec3(0.0, 0.0, 1.0);
    vec3 l = normalize(uLightDir);

    // How much light reaches this height of the ball: full at the top, none below the reach.
    float reachMask = smoothstep(mix(0.88, -1.0, uReach), 1.0, s.y);
    reachMask *= reachMask;

    // The thin line of light around the edge, strongest where the edge faces the light.
    vec3 rimNormal = normalize(mix(s, n, 0.6));
    float fresnel = pow(1.0 - clamp(dot(rimNormal, v), 0.0, 1.0), uRimTightness);
    float rim = uRim * fresnel * smoothstep(-0.15, 0.7, dot(s, l));

    // Glints on the dimple edges. Sharpness eases off where the surface changes quickly
    // across a pixel, so small dimples don't sparkle while the ball spins.
    vec3 h = normalize(l + v);
    float variance = length(fwidth(n));
    float sharpness = uDimpleSharpness / (1.0 + uDimpleSharpness * variance * variance * 4.0);
    float glint = pow(max(dot(n, h), 0.0), sharpness);
    float dimple = uDimple * (glint + 0.2 * max(dot(n, l), 0.0));

    // The dimples' sides that face away from the light are a touch darker than the page.
    vec3 towardLight = normalize(l - s * dot(l, s) + vec3(0.0, 1e-4, 0.0));
    float away = clamp(-dot(n - s, towardLight) * 14.0, 0.0, 1.0);
    float shadow = uShadow * away * smoothstep(-0.6, 0.9, s.y);

    vec3 light = uLightColor * (rim + dimple) * reachMask;
    light = light / (1.0 + 0.5 * light);

    vec3 colour = uBackground * (1.0 - shadow) + light;
    gl_FragColor = vec4(linearToSrgb(colour), 1.0);
  }
`

const NEUTRAL = new Color(1, 1, 1)
const COOL = new Color(0.78, 0.88, 1.0)

export type BallScene = {
  setLook: (look: BallLook) => void
  /** Multiplies the idle spin (1 = idle). */
  setSpeedMultiplier: (multiplier: number) => void
  dispose: () => void
}

/**
 * Starts the scene on the canvas. `background` is the page background colour as CSS gives it
 * (e.g. "#091a13"). Throws if the device has no WebGL.
 */
export const createBallScene = async (
  canvas: HTMLCanvasElement,
  initialLook: BallLook,
  background: string,
): Promise<BallScene> => {
  // Without the page colour the ball's body would be drawn white: better no intro at all.
  if (!background) throw new Error('Golf ball intro: no background colour given')
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Each dimple's centre and size, one per pixel of a one-row image the shaders read.
  const dimples = new DataTexture(DIMPLES, DIMPLE_COUNT, 1, RGBAFormat, FloatType)
  dimples.minFilter = NearestFilter
  dimples.magFilter = NearestFilter
  dimples.needsUpdate = true

  // The nearest-dimple lookup, drawn once from the middle of an inside-out sphere.
  const nearest = new WebGLCubeRenderTarget(LOOKUP_SIZE, {
    type: UnsignedByteType,
    minFilter: NearestFilter,
    magFilter: NearestFilter,
    generateMipmaps: false,
    depthBuffer: false,
  })
  const lookupGeometry = new SphereGeometry(1, 32, 16)
  const lookupMaterial = new ShaderMaterial({
    side: BackSide,
    defines: { DIMPLE_COUNT },
    uniforms: { uDimples: { value: dimples } },
    vertexShader: lookupVertexShader,
    fragmentShader: lookupFragmentShader,
  })
  const lookupScene = new Scene()
  lookupScene.add(new Mesh(lookupGeometry, lookupMaterial))
  new CubeCamera(0.1, 10, nearest).update(renderer, lookupScene)
  lookupGeometry.dispose()
  lookupMaterial.dispose()

  const uniforms = {
    uNearest: { value: nearest.texture },
    uDimples: { value: dimples },
    uDepth: { value: DIMPLE_DEPTH },
    uSize: { value: 1 },
    // Color converts the CSS colour (sRGB) into the linear values the shader works in.
    uBackground: { value: new Color(background) },
    uLightColor: { value: new Color() },
    uLightDir: { value: new Vector3() },
    uRim: { value: 0 },
    uRimTightness: { value: 1 },
    uDimple: { value: 0 },
    uDimpleSharpness: { value: 1 },
    uShadow: { value: 0 },
    uReach: { value: 0 },
  }
  // A smooth sphere: the dimples are drawn per pixel, so the shape only needs a round outline.
  const geometry = new SphereGeometry(1, 192, 128)
  const material = new ShaderMaterial({
    // How much of each dimple's radius its rounded rim takes.
    defines: { EDGE_ROUNDING: '0.22' },
    uniforms,
    vertexShader,
    fragmentShader,
  })
  const ball = new Mesh(geometry, material)
  const scene = new Scene()
  scene.add(ball)
  const camera = new OrthographicCamera()

  let look = initialLook
  let speedMultiplier = 1
  let angle = 0
  const axis = new Vector3()
  const spin = new Quaternion()

  const applyLook = () => {
    const elevation = (look.lightElevation * Math.PI) / 180
    // Behind the ball (away from the viewer) and above it.
    uniforms.uLightDir.value.set(0, Math.sin(elevation), -Math.cos(elevation))
    uniforms.uLightColor.value.copy(NEUTRAL).lerp(COOL, look.coolness)
    uniforms.uRim.value = look.rimIntensity
    uniforms.uRimTightness.value = look.rimTightness
    uniforms.uDimple.value = look.dimpleIntensity
    uniforms.uDimpleSharpness.value = look.dimpleSharpness
    uniforms.uShadow.value = look.dimpleShadow
    uniforms.uSize.value = look.dimpleSize
    uniforms.uDepth.value = DIMPLE_DEPTH * look.dimpleDepth
    uniforms.uReach.value = look.reach
    const tilt = (look.tilt * Math.PI) / 180
    axis.set(Math.cos(tilt), Math.sin(tilt), 0).normalize()
  }

  // Lays the ball out in screen pixels: diameter as a share of the width, top edge as a share
  // of the height, cropped by the bottom of the screen.
  const layout = () => {
    const width = canvas.clientWidth
    const height = canvas.clientHeight
    if (!width || !height) return
    renderer.setSize(width, height, false)
    const phone = width <= PHONE_MAX_WIDTH
    const radius = ((phone ? look.sizeMobile : look.sizeDesktop) * width) / 2
    const top = phone ? look.topMobile : look.top
    camera.left = -width / 2
    camera.right = width / 2
    camera.top = height / 2
    camera.bottom = -height / 2
    camera.near = 0.1
    camera.far = radius * 8
    camera.position.set(0, 0, radius * 4)
    camera.updateProjectionMatrix()
    ball.scale.setScalar(radius)
    ball.position.set(0, height / 2 - top * height - radius, 0)
  }

  applyLook()
  layout()
  const resizeObserver = new ResizeObserver(layout)
  resizeObserver.observe(canvas)

  let frame = 0
  let last = performance.now()
  const tick = (now: number) => {
    // Cap the step so a background tab doesn't make the ball jump when it comes back.
    const dt = Math.min((now - last) / 1000, 0.1)
    last = now
    // Negative turns move the front of the ball upward.
    angle -= ((look.idleSpeed * speedMultiplier * Math.PI) / 180) * dt
    spin.setFromAxisAngle(axis, angle)
    ball.quaternion.copy(spin)
    renderer.render(scene, camera)
    frame = requestAnimationFrame(tick)
  }
  frame = requestAnimationFrame(tick)

  return {
    setLook: (next) => {
      look = next
      applyLook()
      layout()
    },
    setSpeedMultiplier: (multiplier) => {
      speedMultiplier = multiplier
    },
    dispose: () => {
      cancelAnimationFrame(frame)
      resizeObserver.disconnect()
      geometry.dispose()
      material.dispose()
      nearest.dispose()
      dimples.dispose()
      renderer.dispose()
    },
  }
}
