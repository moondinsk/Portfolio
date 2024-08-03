import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { MeshSurfaceSampler } from 'three/examples/jsm/math/MeshSurfaceSampler.js'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { ShaderPass } from 'three/examples/jsm/postprocessing/ShaderPass.js'
import { LensDistortionShader } from '../static/shaders/LensDistortionShader.js'

let mainTotal = 4;
let cateIdx = 0;
let mainIdx = 0;

//// DRACO LOADER TO LOAD DRACO COMPRESSED MODELS FROM BLENDER
const dracoLoader = new DRACOLoader()
const loader = new GLTFLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
dracoLoader.setDecoderConfig({ type: 'js' })
loader.setDRACOLoader(dracoLoader)

// 장면
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333f4d);

// 카메라
const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100)
camera.position.set(45,16,-20)
scene.add(camera)

// 렌더러
const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" }) // turn on antialias
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //set pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight) // make it full screen
renderer.outputEncoding = THREE.sRGBEncoding // set color encoding
const container = document.getElementById('main_canvas');
container.appendChild(renderer.domElement);

///// CREATE ORBIT CONTROLS
const controls = new OrbitControls(camera, renderer.domElement)

///// LOADING GLB/GLTF MODEL FROM BLENDER
loader.load('models/gltf/Skull.glb', function (gltf) {
    gltf.scene.traverse((obj) => {
        if (obj.isMesh) {
            sampler = new MeshSurfaceSampler(obj).build()
        }
    })
    transformMesh()
})

///// 매쉬를 포인터로
let sampler
let uniforms = { mousePos: {value: new THREE.Vector3()}}
let pointsGeometry = new THREE.BufferGeometry()
const cursor = {x:0, y:0}
const vertices = []
const tempPosition = new THREE.Vector3()

function transformMesh(){
    // Loop to sample a coordinate for each points
    for (let i = 0; i < 5000; i ++) {
        // Sample a random position in the model
        sampler.sample(tempPosition)
        // Push the coordinates of the sampled coordinates into the array
        vertices.push(tempPosition.x, tempPosition.y, tempPosition.z)
    }
    
    // Define all points positions from the previously created array
    pointsGeometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3))

    // Define the matrial of the points
    const pointsMaterial = new THREE.PointsMaterial({
        color: 0x18ffff,
        size: 0.1,
        blending: THREE.AdditiveBlending,
        transparent: true,
        opacity: 0.8,
        depthWrite: false,
        sizeAttenuation: true,
        alphaMap: new THREE.TextureLoader().load('particle-texture.jpg')
    })

    // Create the custom vertex shader injection
    pointsMaterial.onBeforeCompile = function(shader) {
        shader.uniforms.mousePos = uniforms.mousePos
        
        shader.vertexShader = `
          uniform vec3 mousePos;
          varying float vNormal;
          
          ${shader.vertexShader}`.replace(
          `#include <begin_vertex>`,
          `#include <begin_vertex>   
            vec3 seg = position - mousePos;
            vec3 dir = normalize(seg);
            float dist = length(seg);
            if (dist < 1.5){
              float force = clamp(1.0 / (dist * dist), -0., .5);
              transformed += dir * force;
              vNormal = force /0.5;
            }
          `
        )
    }

    // Create an instance of points based on the geometry & material
    const points = new THREE.Points(pointsGeometry, pointsMaterial)

    // Add them into the main group
    scene.add(points)

}

//// 인트로 - 카메라 무빙, tween
function introAnimation() {
  controls.enabled = false //disable orbit controls to animate the camera
  
  new TWEEN.Tween(camera.position.set(0,-1,0 )).to({ x: 2, y: -0.4, z: 6.1 }, 6500) // time take to animate
  .easing(TWEEN.Easing.Quadratic.InOut).start() 
  .onComplete(function () { //on finish animation
    controls.enabled = true //enable orbit controls
    setOrbitControlsLimits() //enable controls limits
    TWEEN.remove(this) // remove the animation from memory
  })
}
// introAnimation()

//// DEFINE ORBIT CONTROLS LIMITS
function setOrbitControlsLimits(){
  controls.enableDamping = true
  controls.dampingFactor = 0.04
  controls.minDistance = 0.5
  controls.maxDistance = 9
  controls.enableRotate = true
  controls.enableZoom = true
  controls.zoomSpeed = 0.5
  controls.autoRotate = true
}

///// POST PROCESSING EFFECTS
let width = window.innerWidth
let height = window.innerHeight
const renderPass = new RenderPass( scene, camera )
const renderTarget = new THREE.WebGLRenderTarget( width, height,
  {
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    format: THREE.RGBAFormat
  }
)

const composer = new EffectComposer(renderer, renderTarget)
composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

/////DISTORT PASS //////////////////////////////////////////////////////////////
const distortPass = new ShaderPass( LensDistortionShader )
distortPass.material.defines.CHROMA_SAMPLES = 4
distortPass.enabled = true
distortPass.material.uniforms.baseIor.value = 0.910
distortPass.material.uniforms.bandOffset.value = 0.0019
distortPass.material.uniforms.jitterIntensity.value = 20.7
distortPass.material.defines.BAND_MODE = 2
composer.addPass( renderPass )
composer.addPass( distortPass )

//// CUSTOM SHADER ANIMATED BACKGROUND
let g = new THREE.PlaneBufferGeometry(2, 2)
let m = new THREE.ShaderMaterial({
  side: THREE.DoubleSide,
  depthTest: false,
  uniforms: {
    iTime: { value: 0 },
    iResolution:  { value: new THREE.Vector2() },
    mousePos: {value: new THREE.Vector2()}
  },
  vertexShader: `
      varying vec2 vUv;
      void main(){
          vUv = uv;
          gl_Position = vec4( position, 1.0 );
      }`,
  fragmentShader: `
    varying vec2 vUv;
    uniform float iTime;
    uniform vec2 iResolution;
    uniform vec2 mousePos;

    #define N 16
    #define PI 3.14159265
    #define depth 1.0
    #define rate 0.3
    #define huecenter 0.5

    vec3 hsv2rgb( in vec3 c )
    {
        vec3 rgb = clamp( abs(mod(c.y*6.0+vec3(0.0,4.0,2.0),6.0)-3.0)-1.0, 0.0, .3 );
        return c.x * mix( vec3(.1), rgb, 1.0);
    }

    void main(){
        vec2 v = gl_FragCoord.xy/iResolution.xy;
        float t = iTime * 0.08;
        float r = 1.8;
        float d = 0.0;
        for (int i = 1; i < N; i++) {
            d = (PI / float(N)) * (float(i) * 14.0);
            r += length(vec2(rate*v.y, rate*v.x)) + 1.21;
            v = vec2(v.x+cos(v.y+cos(r)+d)+cos(t),v.y-sin(v.x+cos(r)+d)+sin(t));
        }
        r = (sin(r*0.09)*0.5)+0.5;            
        // Set the hue value to represent blue color
        vec3 hsv = vec3(
            0.3, // Hue for blue (adjust as needed)
            1.0-0.5*pow(max(r,0.0)*1.2,0.5), 
            1.0-0.2*pow(max(r,0.4)*2.2,6.0)
        );
        gl_FragColor = vec4(hsv2rgb(hsv), 1.0);
    }`
  })
const p = new THREE.Mesh(g, m)
scene.add(p)
m.uniforms.iResolution.value.set(width, height)

//// RENDER LOOP FUNCTION
const clock = new THREE.Clock()
function rendeLoop() {
  TWEEN.update() // update animations
  controls.update() // update orbit controls
  composer.render() //render the scene with the composer
  distortPass.material.uniforms.jitterOffset.value += 0.01
  const time = clock.getElapsedTime() 
  m.uniforms.iTime.value = time
  requestAnimationFrame(rendeLoop) //loop the render function    
}
rendeLoop() //start rendering

//// Mouse Event
document.addEventListener('mousemove', (event) => {
  event.preventDefault()
  cursor.x = event.clientX / window.innerWidth -0.5
  cursor.y = event.clientY / window.innerHeight -0.5
  uniforms.mousePos.value.set(cursor.x, cursor.y, 0)
  m.uniforms.mousePos.value.set(cursor.x, cursor.y)
}, false)

window.addEventListener('resize', () => {
  const width = window.innerWidth
  const height = window.innerHeight
  camera.aspect = width / height
  camera.updateProjectionMatrix()
  renderer.setSize(width, height)
  composer.setSize(width, height)
  renderer.setPixelRatio(2)
  m.uniforms.iResolution.value.set(width, height)
})

function slideAnimation() {
  controls.enabled = false; // Disable orbit controls to animate the camera
  // Define the first tween animation (A -> B)
  const tweenToB = new TWEEN.Tween(camera.position)
    .to({ x: 0, y: -1, z: 0 }, 800) // Move to position B
    .easing(TWEEN.Easing.Quadratic.InOut)
    .onComplete(() => {
      // Define the second tween animation (B -> A)
      new TWEEN.Tween(camera.position)
        .to({ x: 2, y: -0.4, z: 6.1 }, 1600) // Move back to position A
        .easing(TWEEN.Easing.Quadratic.InOut)
        .onComplete(() => {
          controls.enabled = true; // Enable orbit controls after animation
          setOrbitControlsLimits(); // Enable controls limits
        })
        .start(); // Start the second animation
      })
    .start(); // Start the first animation
}

// Main Settings
const main_sw = new Swiper('#sw_main', {
  effect: 'fade',
  loop: true,
  pagination: {
    el: '.swiper-pagination',
    clickable: true,
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  mousewheel: {
    enabled: true,
  },
  keyboard: {
    enabled: true,
    onlyInViewport: true, // Only enable when swiper is in the viewport
  },
  on: {
    slideChange: function () {
      mainIdx = this.realIndex;
      $("#ui-header_nav li").eq(mainIdx).addClass("active").siblings().removeClass("active");
      // handleSlideChange();
      slideAnimation();
    }
  }
});


/****** Ui settings ******/
/****** Click Events ******/
$("#ui-page button").on("click", function (){
  $(this).parent(".ui-page__item").addClass("active").siblings().removeClass("active");
  cateIdx = $(this).parent(".ui-page__item").index();
  $("#page > *").eq(cateIdx).addClass("show").siblings().removeClass("show");
});


/****** Click Events ******/
// 메인 - view-more 
$('.view-more').on("click",function (){
  toggleMain();
  toggleWorks(mainIdx);
});

// 메인 - nav
$("#ui-header_nav li").on("click", function (){
  mainIdx = $(this).index();
  main_sw.slideTo(mainIdx, 500)
});

// 섹션 - close 
$('.__works-close').on("click", function (){
  toggleMain();
  toggleWorks(mainIdx);
});

// 메인 열고닫기
function toggleMain(){
  $("#main").toggleClass("show");
  $("#header_right").toggleClass("active")
}

// 섹션 idx 찾아 열고닫기
function toggleWorks(mainIdx){
  $("#works").toggleClass("show");
  $("#works > section").eq(mainIdx).toggleClass("show");
}



/****** About Settings ******/
/****** Click Events ******/
