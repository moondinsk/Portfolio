import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { DRACOLoader } from 'three/examples/jsm/loaders/DRACOLoader.js'
import { TWEEN } from 'three/examples/jsm/libs/tween.module.min.js'
import { WEBGL } from './webgl.js'

if (WEBGL.isWebGLAvailable()) {
  const scene = new THREE.Scene()
  scene.background = new THREE.Color(0x000000)

  const camera = new THREE.PerspectiveCamera(
    47,
    window.innerWidth / window.innerHeight,
    0.1,
    100
  )

  // 렌더러 추가
  const renderer = new THREE.WebGLRenderer({
    alpha: true,    // 배경을 투명하게
    antialias: true, // 계단현상 억제
  })

  // 사이즈 세팅해서 렌더러 DOM에 넣기
  renderer.setSize(window.innerWidth, window.innerHeight)
  const container = document.getElementById('main_canvas');
  container.appendChild(renderer.domElement);
  // renderer.shadowMap.enabled = true  // 그림자 ok
  // renderer.toneMapping = THREE.ACESFilmicToneMapping // 톤매핑
  // renderer.toneMappingExposure = 1 // 톤매핑 값 설정

  // GLTF Load
  const dracoLoader = new DRACOLoader()
  const gltfLoader = new GLTFLoader()
  dracoLoader.setDecoderPath('https://www.gstatic.com/draco/v1/decoders/')
  dracoLoader.setDecoderConfig({ type: 'js' })
  gltfLoader.setDRACOLoader(dracoLoader)
  const GLTFObjGroup = new THREE.Object3D(); 
  // .Object3D 여러 도형을 하나의 3d로 묶어 줄수 있는 기능. 밖(ex. gsap rotate등 ..)에서도 조정가능할수 있도록 변수로 만들어주기 
  // Load a glTF resource
  gltfLoader.load(
    '../models/earth.glb',
    function ( gltf ) {
      scene.add( gltf.scene )
      const GLTFObj = gltf.scene
      GLTFObj.scale.set(4, 4, 4) // 블랜더에서 저장한 그대로를 가져옴 1:1:1 비율로
      GLTFObjGroup.add(GLTFObj) // 생성된 GLTFObj를 GLTFObjGroup에 추가
      scene.add(GLTFObjGroup) // GLTFObjGroup를 scene에 추가
      introAnimation();
      animate();
      setTimeout(() => {
        $("#ui").find(".animate-div").addClass("animate-start");
      }, 1200);
      setTimeout(() => {
        $("#main").addClass("show");
      }, 2400);
      setTimeout(() => {
        $(".__main-sec").first().addClass("show");
      }, 3000);
    },
  );
  
  // 빛
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1)
  scene.add(directionalLight)
  
  const spotLight = new THREE.SpotLight(0xffffff, 1);
  spotLight.position.set(10, 20, 10);
  scene.add(spotLight)

  // 인트로
  const controls = new OrbitControls(camera, container)
  controls.rotateSpeed = 0.2; 
  function introAnimation() {
    controls.enabled = false 
    new TWEEN.Tween(camera.position.set(0,-1, 0 )).to({ 
      x: 1, y: 1, z: 50 
    }, 4500)
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start() 
    .onComplete(function () {
      controls.enabled = true 
      TWEEN.remove(this) 
    })
  }

  function animate() {
    requestAnimationFrame(animate) //인자로 받은 함수 animate를 반복 실행
    TWEEN.update();
    GLTFObjGroup.rotation.y += 0.0001
    renderer.render(scene, camera)
  }

  function zoomInCamera() {
    new TWEEN.Tween(camera.position.set( 1, 1, 50)).to({ 
      x: 1, y: 5, z: 30
     }, 800) // time take to animate
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start()
    .onUpdate(() => {
      camera.lookAt(0,5,0);
    })
    .onComplete(function () {
      TWEEN.remove(this)
    })
  }

  function zoomOutCamera() {
    new TWEEN.Tween(camera.position.set( 1, 5, 30)).to({ 
      x: 1, y: 1, z: 50
      }, 800) // time take to animate
    .easing(TWEEN.Easing.Quadratic.InOut)
    .start() 
    .onComplete(function () {
      TWEEN.remove(this) 
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



  /**********************************************/
  // About
  /**********************************************/
  const about_sw = new Swiper('#sw_about', {
    autoplay:true,
    loop: true,
    breakpoints: {
      0: {
        slidesPerView: 2,
        spaceBetween: 10,
      },
      640:{
        slidesPerView: 3,
        spaceBetween: 30,
      }
    },
  });
  
  
  
  /**********************************************/
  // Window 시작
  /**********************************************/
  $(function (){
    
    /* Click Events */
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
    $(".works__area, .about__area").on("scroll", function() {
      let wks_top = $(this).scrollTop();
      if (wks_top === 0) {
        $(".works__scroll").addClass("active");
        $(".__works-top").removeClass("active");

      }else{
        $(".works__scroll").removeClass("active");
        $(".__works-top").addClass("active");
      }
    });
    $(".__works-top").on("click", function(){
      $(".works__area").animate({ scrollTop: 0 });
      $(".about__area").animate({ scrollTop: 0 });
    });
  
    // Works 신규사이트 ALL 불러오기
    const site_new = [
      { title: "코스모비", url: "https://www.cosmobee.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_34.JPG", category: "우주/항공", role: "100%" },
      { title: "코드비전", url: "https://codevision.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_33.JPG", category: "IT", role: "100%" },
      { title: "포스코 청암재단", url: "https://postf.org/", src:"http://moondinsk.dothome.co.kr/img/works/pro_01.JPG", category: "기관", role: "80% (서브)" },
      { title: "연세대학교 이과대학", url: "http://scienceyonsei.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_02.JPG", category: "교육", role: "70% (서브)" },
      { title: "섬유수출입협회", url: "https://textra.or.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_03.JPG", category: "기관", role: "100%" },
      { title: "한솔로지스틱스", url: "https://www.hansollogistics.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_04.JPG", category: "물류", role: "70% (서브)" },
      { title: "일동제약몰", url: "https://ildongmall.co.kr/?brandName=biovita", src:"http://moondinsk.dothome.co.kr/img/works/pro_05.JPG", category: "바이오", role: "100%" },
      { title: "ESR켄달스퀘어", url: "https://www.esrks-reit.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_06.JPG", category: "물류", role: "70% (서브)" },
      { title: "JETTE", url: "https://jette.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_07.JPG", category: "물류", role: "100%" },
      { title: "서울대 의료양성사업단", url: "http://snuaimed.org/", src:"http://moondinsk.dothome.co.kr/img/works/pro_08.JPG", category: "교육", role: "100% (서브)" },
      { title: "한솔로지스유", url: "https://hansollogisyou.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_09.JPG", category: "물류", role: "100% (서브)" },
      { title: "귀뚜라미환경테크", url: "https://kituramiet.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_10.JPG", category: "기관", role: "100%" },
      { title: "한국노바티스", url: "http://cusleep.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_11.JPG", category: "바이오", role: "100%" },
      { title: "이노큐브", url: "https://www.innocuve.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_12.JPG", category: "바이오", role: "100% (서브)" },
      { title: "팬스타", url: "https://www.panstar.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_13.JPG", category: "물류", role: "80% (서브)" },
      { title: "NOW건축사무소", url: "http://www.nowarch.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_14.JPG", category: "건축", role: "100% (서브)" },
      { title: "NOW CM", url: "http://www.nowcm.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_32.JPG", category: "건축", role: "100%" },
      { title: "SY탱크터미널", url: "http://www.sytankterminal.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_15.JPG", category: "물류", role: "100%" },
      { title: "도시락통", url: "https://dosiraktong.com/Main/Index", src:"http://moondinsk.dothome.co.kr/img/works/pro_16.JPG", category: "서비스", role: "100" },
      { title: "서울대 MBRC", url: "https://www.healthbigdata.org/", src:"http://moondinsk.dothome.co.kr/img/works/pro_17.JPG", category: "교육", role: "80% (서브)" },
      { title: "Merlotlab", url: "https://merlotlab.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_18.JPG", category: "IT", role: "100% (서브)" },
      { title: "위더스애드", url: "https://withusad.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_19.JPG", category: "광고", role: "80% (서브)" },
      { title: "에너지컨설팅", url: "http://energyconsulting.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_20.JPG", category: "기술", role: "100% (서브)" },
      { title: "호현애프엔씨", url: "http://www.hohyun.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_21.JPG", category: "기술", role: "100%" },
      { title: "심플랫폼", url: "https://www.simplatform.com/ko/index.html", src:"http://moondinsk.dothome.co.kr/img/works/pro_22.JPG", category: "IT", role: "100% (서브)" },
      { title: "연세대 화학과", url: "https://chemyonsei.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_23.JPG", category: "교육", role: "100% (서브)" },
      { title: "케이디건축사무소", url: "http://kdeng.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_24.JPG", category: "건축", role: "100%" },
      { title: "특허법인 시공", url: "https://sigong-ip.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_25.JPG", category: "법률", role: "100%" },
      { title: "AGMG", url: "https://agmg.cafe24.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_26.JPG", category: "기업", role: "100%" },
      { title: "법무법인 제승", url: "https://revivelaw.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_27.JPG", category: "법률", role: "80% (서브)" },
      { title: "대웅제약 idsTrust", url: "https://www.idstrust.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_28.JPG", category: "바이오", role: "100% (서브)" },
      { title: "Lipac", url: "https://lipac.co.kr/", src:"http://moondinsk.dothome.co.kr/img/works/pro_29.JPG", category: "기술", role: "80% (서브)" },
      { title: "Lamp7", url: "https://www.swrobot.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_30.JPG", category: "IT", role: "100%" },
      { title: "아이앤테라퓨틱스", url: "http://www.intherapeutics.com/", src:"http://moondinsk.dothome.co.kr/img/works/pro_31.JPG", category: "바이오", role: "100%" },
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
          <div class="video-wrap"><video src="${pg.video_src}" autoplay muted loop playinline></video></div>
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