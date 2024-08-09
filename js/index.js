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

const dracoLoader = new DRACOLoader()
const loader = new GLTFLoader()
dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
dracoLoader.setDecoderConfig({ type: 'js' })
loader.setDRACOLoader(dracoLoader)

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x333f4d);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 1, 100)
camera.position.set(45,16,-20)
scene.add(camera)

const renderer = new THREE.WebGLRenderer({ antialias: false, powerPreference: "high-performance" }) // turn on antialias
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2)) //set pixel ratio
renderer.setSize(window.innerWidth, window.innerHeight) // make it full screen
renderer.outputEncoding = THREE.sRGBEncoding // set color encoding
const container = document.getElementById('main_canvas');
container.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement)

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
  for (let i = 0; i < 2000; i ++) {
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
  const points = new THREE.Points(pointsGeometry, pointsMaterial)
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


let cateIdx = 0;
let mainIdx = 0;

/**********************************************/
// Ui
/**********************************************/
// 메인 열고닫기
function toggleMain(){
  $("#main").toggleClass("show");
  $("#ui_header_right").toggleClass("active");
  $("#works > section").find(".animate-div").removeClass("animate-start");
  $("#works > section").find(".start-animate").removeClass("start-animate");
  $("#works > section").find(".animated").removeClass("animated");
}

// 섹션 idx 찾아 열고닫기
function toggleWorks(mainIdx){
  $("#works").toggleClass("show");
  $("#works > section").eq(mainIdx).toggleClass("show");
  start_animate();
  $("#works > section").eq(mainIdx).find(".animate-div").toggleClass("animate-start");
  $("#works > section").eq(mainIdx).find(".works__area").on("scroll", start_animate);
  setTimeout(() => {
    $("#works > section").eq(mainIdx).find(".works__area").scrollTop(0);
  }, 400);
}

function updateUI(cateIdx, mainIdx) {
  if (cateIdx !== cateIdx) {
    if (cateIdx === 0) {
      $("body").removeClass("st1");
      $("#ui_header_right").addClass("active");
      $("#main").addClass("show");
      $(".about__area").scrollTop(0);
    } else if (cateIdx === 1) {
      $("body").addClass("st1");
      $("#ui_header_right").removeClass("active");
      $("#works").removeClass("show");
      $(".works__wrap").removeClass("show");
    }
  }
}

// Ui
$("#ui-page button").on("click", function (mainIdx){
  $(this).parent(".ui-page__item").addClass("active").siblings().removeClass("active");
  cateIdx = $(this).parent(".ui-page__item").index();
  $("#page > *").eq(cateIdx).addClass("show").siblings().removeClass("show");
  updateUI(cateIdx,mainIdx);

});

// Nav
$("#ui_header_nav li").on("click", function (){
  mainIdx = $(this).index();
  main_sw.slideTo(mainIdx, 500)
});



/**********************************************/
// Projects
/**********************************************/
/****** Main ******/
// 세팅
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
      $("#ui_header_nav li").eq(mainIdx).addClass("active").siblings().removeClass("active");
      slideAnimation();
    }
  }
});


$(function (){
  // 메인 - view-more 
  $(".view-more").on("click",function (){
    toggleMain();
    toggleWorks(mainIdx);
  });

  // Works 섹션 - close 
  $(".__works-close").on("click", function (){
    toggleWorks(mainIdx);
    toggleMain();
  });

  // Works 상세 개발 환경 View more
  $(".__works_more").on("click", function (){
    $(".__works_more").removeClass("active");
    $(this).addClass("active");
  });
  $(document).mouseup(function (e) {
    if ($(".__works_more").has(e.target).length === 0) {
      $(".__works_more").removeClass("active");
    }
  });

  // 스크롤다운
  $(".works__area").on("scroll", function() {
    let wks_top = $(this).scrollTop();
    if (wks_top === 0) {
      $(".works__scroll").addClass("active");
    }else{
      $(".works__scroll").removeClass("active");
    }
  });
})



/**********************************************/
// About
/**********************************************/
const about_sw = new Swiper('#sw_about', {
  autoplay:true,
  slidesPerView: 3,
  spaceBetween: 30,
  loop: true,
  on: {
    slideChange: function () {
    }
  }
});



/**********************************************/
// Window 시작
/**********************************************/
$(function (){

  // Works 신규사이트 ALL 불러오기
  const site_new = [
    { title: "코스모비", url: "https://www.cosmobee.co.kr/", src:"/img/works/pro_34.jpg", category: "우주/항공", role: "100%" },
    { title: "코드비전", url: "https://codevision.kr/", src:"/img/works/pro_33.jpg", category: "IT", role: "100%" },
    { title: "포스코 청암재단", url: "https://postf.org/", src:"/img/works/pro_01.jpg", category: "기관", role: "80% (서브)" },
    { title: "연세대학교 이과대학", url: "http://scienceyonsei.kr/", src:"/img/works/pro_02.jpg", category: "교육", role: "70% (서브)" },
    { title: "섬유수출입협회", url: "https://textra.or.kr/", src:"/img/works/pro_03.jpg", category: "기관", role: "100%" },
    { title: "한솔로지스틱스", url: "https://www.hansollogistics.com/", src:"/img/works/pro_04.jpg", category: "물류", role: "70% (서브)" },
    { title: "일동제약몰", url: "https://ildongmall.co.kr/?brandName=biovita", src:"/img/works/pro_05.jpg", category: "바이오", role: "100%" },
    { title: "ESR켄달스퀘어", url: "https://www.esrks-reit.com/", src:"/img/works/pro_06.jpg", category: "물류", role: "70% (서브)" },
    { title: "JETTE", url: "https://jette.co.kr/", src:"/img/works/pro_07.jpg", category: "물류", role: "100%" },
    { title: "서울대 의료양성사업단", url: "http://snuaimed.org/", src:"/img/works/pro_08.jpg", category: "교육", role: "100% (서브)" },
    { title: "한솔로지스유", url: "https://hansollogisyou.com/", src:"/img/works/pro_09.jpg", category: "물류", role: "100% (서브)" },
    { title: "귀뚜라미환경테크", url: "https://kituramiet.com/", src:"/img/works/pro_10.jpg", category: "기관", role: "100%" },
    { title: "한국노바티스", url: "http://cusleep.co.kr/", src:"/img/works/pro_11.jpg", category: "바이오", role: "100%" },
    { title: "이노큐브", url: "https://www.innocuve.com/", src:"/img/works/pro_12.jpg", category: "바이오", role: "100% (서브)" },
    { title: "팬스타", url: "https://www.panstar.co.kr/", src:"/img/works/pro_13.jpg", category: "물류", role: "80% (서브)" },
    { title: "NOW건축사무소", url: "http://www.nowarch.com/", src:"/img/works/pro_14.jpg", category: "건축", role: "100% (서브)" },
    { title: "NOW CM", url: "http://www.nowcm.co.kr/", src:"/img/works/pro_32.jpg", category: "건축", role: "100%" },
    { title: "SY탱크터미널", url: "http://www.sytankterminal.co.kr/", src:"/img/works/pro_15.jpg", category: "물류", role: "100%" },
    { title: "도시락통", url: "https://dosiraktong.com/Main/Index", src:"/img/works/pro_16.jpg", category: "서비스", role: "100" },
    { title: "서울대 MBRC", url: "https://www.healthbigdata.org/", src:"/img/works/pro_17.jpg", category: "교육", role: "80% (서브)" },
    { title: "Merlotlab", url: "https://merlotlab.com/", src:"/img/works/pro_18.jpg", category: "IT", role: "100% (서브)" },
    { title: "위더스애드", url: "https://withusad.co.kr/", src:"/img/works/pro_19.jpg", category: "광고", role: "80% (서브)" },
    { title: "에너지컨설팅", url: "http://energyconsulting.co.kr/", src:"/img/works/pro_20.jpg", category: "기술", role: "100% (서브)" },
    { title: "호현애프엔씨", url: "http://www.hohyun.co.kr/", src:"/img/works/pro_21.jpg", category: "기술", role: "100%" },
    { title: "심플랫폼", url: "https://www.simplatform.com/ko/index.html", src:"/img/works/pro_22.jpg", category: "IT", role: "100% (서브)" },
    { title: "연세대 화학과", url: "https://chemyonsei.kr/", src:"/img/works/pro_23.jpg", category: "교육", role: "100% (서브)" },
    { title: "케이디건축사무소", url: "http://kdeng.co.kr/", src:"/img/works/pro_24.jpg", category: "건축", role: "100%" },
    { title: "특허법인 시공", url: "https://sigong-ip.com/", src:"/img/works/pro_25.jpg", category: "법률", role: "100%" },
    { title: "AGMG", url: "https://agmg.cafe24.com/", src:"/img/works/pro_26.jpg", category: "기업", role: "100%" },
    { title: "법무법인 제승", url: "https://revivelaw.co.kr/", src:"/img/works/pro_27.jpg", category: "법률", role: "80% (서브)" },
    { title: "대웅제약 idsTrust", url: "https://www.idstrust.com/", src:"/img/works/pro_28.jpg", category: "바이오", role: "100% (서브)" },
    { title: "Lipac", url: "https://lipac.co.kr/", src:"/img/works/pro_29.jpg", category: "기술", role: "80% (서브)" },
    { title: "Lamp7", url: "https://www.swrobot.com/", src:"/img/works/pro_30.jpg", category: "IT", role: "100%" },
    { title: "아이앤테라퓨틱스", url: "http://www.intherapeutics.com/", src:"/img/works/pro_31.jpg", category: "바이오", role: "100%" },
  ];
  const siteListDiv = document.getElementById('works_new_list');
  const siteListHTML = site_new.map(site => `
    <li class="works__grid-item animate-element fadeInUp">
      <a href="${site.url}" class="works__grid-link" target="_blank">
        <div class="img-wrap"><img src="${site.src}"></div>
        <div class="works__grid-inner">
          <span>${site.category}</span>
          <h4>${site.title}<i class="xi-external-link"></i></h4>
          <p>기여도 ${site.role}</p>
        </div>
      </a>
    </li>
  `).join(''); 
  siteListDiv.innerHTML = siteListHTML;

  // Playground 불러오기
  const pg_item = [
    { category: "GSAP", event: "scrollTrigger",  video_src:"/demo/src/preview/gsap_scr_01.mp4", codepen_url:"https://codepen.io/moondinsk/pen/bGPrqrj", demo_url:"/demo/gsap/scrollTrigger_01.html"  },
    { category: "GSAP", event: "scrollTrigger",  video_src:"/demo/src/preview/gsap_scr_02.mp4", codepen_url:"https://codepen.io/moondinsk/pen/rNEzXLR", demo_url:"/demo/gsap/scrollTrigger_02.html"  },
  ];
  const pgListDiv = document.getElementById('pg_list');
  const pgListHTML = pg_item.map(pg => `
    <li class="works__grid-item animate-element fadeInUp">
      <div class="works__grid-link" target="_blank">
        <div class="video-wrap"><video src="${pg.video_src}" autoplay muted loop></video></div>
        <div class="works__grid-inner">
          <h4>${pg.category}</h4>
          <span>${pg.event}</span>
          <div class="works__grid-icons">
            <a href="${pg.codepen_url}" target="_blank"><i class="xi-codepen"></i></a>
            <a href="${pg.demo_url}" target="_blank"><i class="xi-external-link"></i></a>
          </div>
        </div>
      </div>
    </li>
  `).join(''); 
  pgListDiv.innerHTML = pgListHTML;



  setTimeout(() => {
    $("#ui").find(".animate-div").addClass("animate-start");
  }, 3000);
  setTimeout(() => {
    $("#main").addClass("show");
  }, 3800);
});



/**********************************************/
// Animate element 
/**********************************************/
$.belowthefold = function(element, settings){
  let fold = $(window).height() + $(window).scrollTop();
  return fold <= $(element).offset().top - settings.threshold;
};
$.abovethetop = function(element, settings){
  let top = $(window).scrollTop();
  return top >= $(element).offset().top + $(element).height() - settings.threshold;
};
$.rightofscreen = function(element, settings){
  let fold = $(window).width() + $(window).scrollLeft();
  return fold <= $(element).offset().left - settings.threshold;
};
$.leftofscreen = function(element, settings){
  let left = $(window).scrollLeft();
  return left >= $(element).offset().left + $(element).width() - settings.threshold;
};
$.inviewport = function(element, settings){
  return !$.rightofscreen(element, settings) && !$.leftofscreen(element, settings) && !$.belowthefold(element, settings) && !$.abovethetop(element, settings);
};
$.extend($.expr[':'], {
  "below-the-fold": function(a, i, m) {
    return $.belowthefold(a, {threshold : 0});
  },"above-the-top": function(a, i, m) {
    return $.abovethetop(a, {threshold : 0});
  },"left-of-screen": function(a, i, m) {
    return $.leftofscreen(a, {threshold : 0});
  },"right-of-screen": function(a, i, m) {
    return $.rightofscreen(a, {threshold : 0});
  },"in-viewport": function(a, i, m) {
    return $.inviewport(a, {threshold : -250});
  }
});

function start_animate(){
  let j = 0;
  $(".animate-element:in-viewport").each(function(){
    let $this = $(this);
    if(!$this.hasClass("start-animate") && !$this.hasClass("animated")){
      $this.addClass("start-animate");
      setTimeout(function(){
        $this.addClass("animated");
      }, 250 * j);
      j++;
    };
  });
}