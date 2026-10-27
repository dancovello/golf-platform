/**
 * The golf ball intro's 3D scene: the supplied ball, lit only from behind and above, on a
 * see-through canvas so the page's own background shows around it.
 *
 * The ball's body is painted in the page background colour, so only the light on its top edge
 * and dimples shows. Everything below the light's reach dissolves into the page.
 *
 * Loaded on demand (import('./ballScene')), so three never reaches a page's first download.
 */
import {
  Color,
  Mesh,
  OrthographicCamera,
  Quaternion,
  Scene,
  ShaderMaterial,
  Vector3,
  WebGLRenderer,
  type BufferGeometry,
} from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'

import { PHONE_MAX_WIDTH, type BallLook } from './look'

const BALL_URL = new URL('./assets/golf-ball.glb', import.meta.url).href

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vSphere;

  void main() {
    // The modelled surface, dimples included.
    vNormal = normalize(normalMatrix * normal);
    // The smooth sphere underneath (the ball is centred, so its position is its direction).
    vSphere = normalize(normalMatrix * position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uBackground;
  uniform vec3 uLightColor;
  uniform vec3 uLightDir;
  uniform float uRim;
  uniform float uRimTightness;
  uniform float uDimple;
  uniform float uDimpleSharpness;
  uniform float uShadow;
  uniform float uReach;

  varying vec3 vNormal;
  varying vec3 vSphere;

  vec3 linearToSrgb(vec3 c) {
    return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c));
  }

  void main() {
    vec3 n = normalize(vNormal);
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
 * (e.g. "#091a13"). Rejects if the device has no WebGL or the ball can't be loaded.
 */
export const createBallScene = async (
  canvas: HTMLCanvasElement,
  initialLook: BallLook,
  background: string,
): Promise<BallScene> => {
  const renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true })
  renderer.setClearColor(0x000000, 0)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  const geometry = await new GLTFLoader().loadAsync(BALL_URL).then((gltf) => {
    let found: BufferGeometry | null = null
    gltf.scene.traverse((node) => {
      if (!found && node instanceof Mesh) found = node.geometry as BufferGeometry
    })
    if (!found) throw new Error('The ball file has no mesh')
    return found as BufferGeometry
  })

  const uniforms = {
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
  const material = new ShaderMaterial({ uniforms, vertexShader, fragmentShader })
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
      renderer.dispose()
    },
  }
}
