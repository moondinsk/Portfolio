let cateIdx = 0;
let mainIdx = 0;

/****** Main Setting ******/
const main_sw = new Swiper('#sw-main', {
  loop: true,
  pagination: {
    el: '.swiper-pagination',
  },
  navigation: {
    nextEl: '.swiper-button-next',
    prevEl: '.swiper-button-prev',
  },
  scrollbar: {
    el: '.swiper-scrollbar',
  },
});

// 슬라이드 변경 
main_sw.on('slideChange', function () {
  mainIdx = main_sw.realIndex;
});



/****** Click Events ******/
// 메인 - view-more 
$('.view-more').on("click",function (){
  toggleMain();
  toggleWorks(mainIdx);
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



/****** About Setting ******/
/****** Click Events ******/
$(".__ui-page").on("click", function (){
  $(this).parent(".ui-page__item").addClass("active").siblings().removeClass("active");
  cateIdx = $(this).parent(".ui-page__item").index();
  $("#page > *").eq(cateIdx).addClass("show").siblings().removeClass("show");
});