import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { WEBGL } from './webgl'

if (WEBGL.isWebGLAvailable()) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  const camera = new THREE.PerspectiveCamera(
    47,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  )
  camera.position.y = 1.8
  camera.position.z = 300
  camera.lookAt(0, 0, 0)

  // 렌더러 추가
  const renderer = new THREE.WebGLRenderer({
    alpha: true,    // 배경을 투명하게
    antialias: true, // 계단현상 억제
  })

  // 사이즈 세팅해서 렌더러 DOM에 넣기
  renderer.setSize(window.innerWidth, window.innerHeight)
  const container = document.getElementById('main_canvas');
  container.appendChild(renderer.domElement);
  renderer.shadowMap.enabled = true  // 그림자 ok
  renderer.toneMapping = THREE.ACESFilmicToneMapping // 톤매핑
  renderer.toneMappingExposure = 1 // 톤매핑 값 설정

  // GLTF Load
  const gltfLoader = new GLTFLoader();
  const GLTFObjGroup = new THREE.Object3D(); 
  // .Object3D 여러 도형을 하나의 3d로 묶어 줄수 있는 기능. 밖(ex. gsap rotate등 ..)에서도 조정가능할수 있도록 변수로 만들어주기 
  // Load a glTF resource
  gltfLoader.load(
    '../models/earth/scene.gltf',
    function ( gltf ) {
      scene.add( gltf.scene )
      const GLTFObj = gltf.scene
      GLTFObj.scale.set(1, 1, 1) // 블랜더에서 저장한 그대로를 가져옴 1:1:1 비율로
      GLTFObjGroup.add(GLTFObj) // 생성된 GLTFObj를 GLTFObjGroup에 추가
      scene.add(GLTFObjGroup) // GLTFObjGroup를 scene에 추가
    },
  );
  
  // 빛
  const directionalLight = new THREE.DirectionalLight(0xffffff, 0.5)
  directionalLight.position.set(-1, 1, 0.5)
  scene.add(directionalLight)

  // 인트로
  const controls = new OrbitControls(camera, container)
  controls.rotateSpeed = 0.2; 
  function introAnimation() {
    controls.enabled = false //disable orbit controls to animate the camera
    new TWEEN.Tween(camera.position.set(0,-1, 0 )).to({ x: 2, y: -0.4, z: 300 }, 6500) // time take to animate
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start() 
    .onComplete(function () { //on finish animation
      controls.enabled = true //enable orbit controls
      TWEEN.remove(this) // remove the animation from memory
    })
  }
  introAnimation()

  function animate() {
    requestAnimationFrame(animate) //인자로 받은 함수 animate를 반복 실행
    TWEEN.update();
    GLTFObjGroup.rotation.y += 0.0001
    renderer.render(scene, camera)
  }
  animate()

  function zoomInCamera() {
    new TWEEN.Tween(camera.position.set( 2, -0.4, 300)).to({ 
      x: 2, y: 1, z: 150
     }, 800) // time take to animate
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start()
    .onUpdate(() => {
      // 카메라 위치가 변경될 때마다 바라보는 지점을 업데이트
      camera.lookAt(0,0,0);
    })
    .onComplete(function () { //on finish animation
      TWEEN.remove(this) // remove the animation from memory
    })
  }

  function zoomOutCamera() {
    new TWEEN.Tween(camera.position.set( 2, 1, 150)).to({ 
      x: 2, y: -0.4, z: 300
      }, 800) // time take to animate
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start() 
    .onComplete(function () { //on finish animation
      TWEEN.remove(this) // remove the animation from memory
    })
  }

  // 반응형 처리
  function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
  }
  window.addEventListener('resize', onWindowResize);



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
  }
  
  // 섹션 idx 찾아 열고닫기
  function toggleWorks(mainIdx){
    $("#works").toggleClass("show");
    $("#works > section").eq(mainIdx).toggleClass("show");
    $("#works > section").eq(mainIdx).find(".animate-div").toggleClass("animate-start");
    // $(".works__wrap.show").find(".works__area").on("scroll", start_animate);
    setTimeout(() => {
      $("#works > section").eq(mainIdx).find(".works__area").scrollTop(0);
    }, 100);
  }
  
  // Ui
  $("#ui-page button").on("click", function (){
    mainIdx = 0;
    $(this).parent(".ui-page__item").addClass("active").siblings().removeClass("active");
    let currentCateIdx = $(this).parent(".ui-page__item").index();
    if(currentCateIdx === cateIdx){
      return;
    }
    cateIdx = currentCateIdx;
    $("#page > *").eq(cateIdx).addClass("show").siblings().removeClass("show");
    if (cateIdx === 0) {
      // project
      $("#ui_header_right").addClass("active");
      $("#main").addClass("show");
      $(".__main-sec").eq(0).addClass("show").siblings().removeClass("show");
      $("#ui_header_nav li").eq(0).addClass("active").siblings().removeClass("active");
      $("#main_pagination > button").eq(0).addClass("active").siblings().removeClass("active");
      zoomOutCamera();
    } else if (cateIdx === 1) {
      // about me
      $("#ui_header_right").removeClass("active");
      $("#works").removeClass("show");
      $(".works__wrap").removeClass("show");
      zoomInCamera();
      $(".about__area").scrollTop(0);
    }
  });
  
  // Nav
  $("#ui_header_nav li").on("click", function (){
    mainIdx = $(this).index();
    $(this).addClass("active").siblings().removeClass("active");
    $("#main_pagination > button").eq(mainIdx).addClass("active").siblings().removeClass("active");
    $(".__main-sec").eq(mainIdx).addClass("show").siblings().removeClass("show");
  });
  $("#main_pagination > button").on("click", function (){
    mainIdx = $(this).index();
    $(this).addClass("active").siblings().removeClass("active");
    $("#ui_header_nav li").eq(mainIdx).addClass("active").siblings().removeClass("active");
    $(".__main-sec").eq(mainIdx).addClass("show").siblings().removeClass("show");
  });
  
  
  
  /**********************************************/
  // About
  /**********************************************/
  const about_sw = new Swiper('#sw_about', {
    autoplay:true,
    slidesPerView: 3,
    spaceBetween: 30,
    loop: true,
  });
  
  
  
  /**********************************************/
  // Window 시작
  /**********************************************/
  $(function (){
    setTimeout(() => {
      $("#ui").find(".animate-div").addClass("animate-start");
    }, 3000);
    setTimeout(() => {
      $("#main").addClass("show");
    }, 3800);
    setTimeout(() => {
      $(".__main-sec").first().addClass("show");
    }, 4500);
    
    /* Click Events */
    // 메인 - view-more 
    $(".__works-more").on("click",function (){
      toggleMain();
      $(".__main-sec").removeClass("show");
      toggleWorks(mainIdx);
      zoomInCamera();
    });
  
    // Works 섹션 - close 
    $(".__works-close").on("click", function (){
      toggleWorks(mainIdx);
      $(".__main-sec").eq(mainIdx).addClass("show");
      toggleMain();
      zoomOutCamera();
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
      <li class="works__grid-item">
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
      <li class="works__grid-item">
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
  });


} else {
  var warning = WEBGL.getWebGLErrorMessage()
  document.body.appendChild(warning)
}