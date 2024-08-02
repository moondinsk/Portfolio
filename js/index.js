import * as THREE from 'three';
import { WEBGL } from './webgl';

const mainTotal = document.querySelectorAll('#ui-header_nav li').length;
let cateIdx = 0;
let mainIdx = 0;

// 장면
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a414a);

// 카메라
const camera = new THREE.PerspectiveCamera(
  35,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.z = 2;

// 렌더러
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.shadowMap.enabled = true; // 그림자 ok
renderer.toneMapping = THREE.ACESFilmicToneMapping; // 톤매핑
renderer.toneMappingExposure = 1; // 톤매핑 값 설정
renderer.setSize(window.innerWidth, window.innerHeight);
const main_canvas = document.getElementById('main_canvas');
main_canvas.appendChild(renderer.domElement);

// 도형 추가
function createShapes(count) {
  const spacing = 1;
  for (let i = 0; i < count; i++) {
    const geometry = new THREE.BoxGeometry(0.8, 0.6, 0.05, 10, 10);
    const material = new THREE.MeshStandardMaterial({ color: 0xFF7F00 });
    const shape = new THREE.Mesh(geometry, material);
    shape.position.x = i * spacing;
    scene.add(shape);
  }
}
createShapes(mainTotal);

// 빛
const ambientLight = new THREE.AmbientLight(0xffffff, 0.2);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 0.6);
directionalLight.position.set(0, 0, 0.5);
scene.add(directionalLight);
directionalLight.castShadow = true;

// Clock for animation
const clock = new THREE.Clock();
let targetX = camera.position.x;
let startX = camera.position.x;
let animationStartTime = 0;
const animationDuration = 600;

function animate() {
  requestAnimationFrame(animate);
  const elapsedTime = clock.getElapsedTime() * 1000 - animationStartTime;
  if (elapsedTime < animationDuration) {
    const t = elapsedTime / animationDuration;
    camera.position.x = THREE.MathUtils.lerp(startX, targetX, t);
  } else {
    camera.position.x = targetX;
  }
  renderer.render(scene, camera);
}
animate();

function handleSlideChange() {
  const distance = 1;
  let newXPosition = 1 + (mainIdx - 1) * distance;
  targetX = newXPosition;
  startX = camera.position.x;
  animationStartTime = clock.getElapsedTime() * 1000; // Reset clock
}

// 반응형 처리
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix(); // 종횡비 세팅
  renderer.setSize(window.innerWidth, window.innerHeight); // 렌더러 세팅
}
window.addEventListener('resize', onWindowResize);

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
      handleSlideChange();
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

console.log("test")
console.log("중요한코드어쩌구")



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
