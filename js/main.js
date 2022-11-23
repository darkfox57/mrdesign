const filterContainer = document.querySelector(".portafolio-filter"),
galleryItems = document.querySelectorAll(".portafolio-item");

filterContainer.addEventListener("click", (event) =>{
    if(event.target.classList.contains("filter-item")){
   	 // deactivate existing active 'filter-item'
        filterContainer.querySelector(".active").classList.remove("active");
   	 // activate new 'filter-item'
        event.target.classList.add("active");
        const filterValue = event.target.getAttribute("data-filter");
        galleryItems.forEach((item) =>{
            if(item.classList.contains(filterValue) || filterValue === 'all'){
                item.classList.remove("hide");
                item.classList.add("show");
            } else{
                item.classList.remove("show");
                item.classList.add("hide");
            }
        });
    }
});

// -----------------------------------------------------------------------



( function( window ) {

  'use strict';
  
  function classReg( className ) {
    return new RegExp("(^|\\s+)" + className + "(\\s+|$)");
  }
  

let hasClass, addClass, removeClass;
  
  if ( 'classList' in document.documentElement ) {
    hasClass = function( elem, c ) {
      return elem.classList.contains( c );
    };
    addClass = function( elem, c ) {
      elem.classList.add( c );
    };
    removeClass = function( elem, c ) {
      elem.classList.remove( c );
    };
  }
  else {
    hasClass = function( elem, c ) {
      return classReg( c ).test( elem.className );
    };
    addClass = function( elem, c ) {
      if ( !hasClass( elem, c ) ) {
        elem.className = elem.className + ' ' + c;
      }
    };
    removeClass = function( elem, c ) {
      elem.className = elem.className.replace( classReg( c ), ' ' );
    };
  }
  
  function toggleClass( elem, c ) {
    let fn = hasClass( elem, c ) ? removeClass : addClass;
    fn( elem, c );
  }
  
  let classie = {

    hasClass: hasClass,
    addClass: addClass,
    removeClass: removeClass,
    toggleClass: toggleClass,

    has: hasClass,
    add: addClass,
    remove: removeClass,
    toggle: toggleClass
  };
  

  if ( typeof define === 'function' && define.amd ) {

    define( classie );
  } else {

    window.classie = classie;
  }
  
  })( window );

  (function() {
    [].slice.call(document.querySelectorAll('.menu')).forEach(function(menu) {
      let menuItems = menu.querySelectorAll('.link'),
        setCurrent = function(ev) {
          ev.preventDefault();

          let item = ev.target.parentNode; // li

          // return if already current
          if (classie.has(item, 'current')) {
            return false;
          }
          // remove current
          classie.remove(menu.querySelector('.current'), 'current');
          // set current
          classie.add(item, 'current');
        };

      [].slice.call(menuItems).forEach(function(el) {
        el.addEventListener('click', setCurrent);
      });
    });

  })(window);
