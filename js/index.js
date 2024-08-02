import * as THREE from 'three';
import { WEBGL } from './webgl';

const mainTotal = document.querySelectorAll('#ui-header_nav li').length;
let cateIdx = 0;
let mainIdx = 0;

// Scene setup
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x3a414a);

// Camera setup
const camera = new THREE.PerspectiveCamera(35, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 2;

// Renderer setup
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.shadowMap.enabled = true;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1;
renderer.setSize(window.innerWidth, window.innerHeight);
document.getElementById('main_canvas').appendChild(renderer.domElement);

// Function to create shapes
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

// Lighting setup
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

// Animation loop
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

// Handle slide change
function handleSlideChange() {
  const distance = 1;
  let newXPosition = 1 + (mainIdx - 1) * distance;
  targetX = newXPosition;
  startX = camera.position.x;
  animationStartTime = clock.getElapsedTime() * 1000; // Reset clock
}

// Swiper instance
const main_sw = new Swiper('#sw_main', {
  effect: 'fade',
  loop: true,
  pagination: {
    el: '.swiper-pagination',
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
    onlyInViewport: true,
  },
  on: {
    slideChange: function () {
      mainIdx = this.realIndex;
      document.querySelectorAll("#ui-header_nav li").forEach((el, index) => {
        if (index === mainIdx) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      });
      handleSlideChange();
    }
  }
});

// Responsive handling
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}
window.addEventListener('resize', onWindowResize);

// Click Events
document.querySelector("#ui-page button").addEventListener("click", function () {
  this.parentElement.classList.add("active");
  this.parentElement.siblings().classList.remove("active");
  cateIdx = Array.from(this.parentElement.parentElement.children).indexOf(this.parentElement);
  document.querySelector("#page > *").classList.remove("show");
  document.querySelectorAll("#page > *")[cateIdx].classList.add("show");
});

document.querySelector('.view-more').addEventListener("click", function () {
  toggleMain();
  toggleWorks(mainIdx);
});

document.querySelectorAll("#ui-header_nav li").forEach((item, index) => {
  item.addEventListener("click", function () {
    mainIdx = index;
    main_sw.slideTo(mainIdx, 500);
  });
});

document.querySelector('.__works-close').addEventListener("click", function () {
  toggleMain();
  toggleWorks(mainIdx);
});

function toggleMain() {
  document.getElementById("main").classList.toggle("show");
  document.getElementById("header_right").classList.toggle("active");
}

function toggleWorks(mainIdx) {
  document.getElementById("works").classList.toggle("show");
  document.querySelectorAll("#works > section")[mainIdx].classList.toggle("show");
}
