
// SWIPER — CARRUSEL D'IMATGES


import Swiper from 'swiper';

const swiperElement = document.querySelector('.swiper');

if (swiperElement) {
  new Swiper('.swiper', {
    loop: true,
    pagination: {
      el: '.swiper-pagination',
      clickable: true,
    },
    navigation: {
      nextEl: '.swiper-button-next',
      prevEl: '.swiper-button-prev',
    },
    a11y: {
      prevSlideMessage: 'Diapositiva anterior',
      nextSlideMessage: 'Diapositiva següent',
    },
  });
}


// FILTRE DE RECEPTES


const botonsFiltres = document.querySelectorAll('.filtre');
//const botonsFiltres = document.getElementsByClassName('filtre');
const targetes = document.querySelectorAll('.llista-receptes .targeta');

if (botonsFiltres.length > 0) {

  botonsFiltres.forEach(function(boto) {
    boto.addEventListener('click', function() {

      // 1. Treure la classe actiu
      botonsFiltres.forEach(function(b) {
        b.classList.remove('actiu');
        b.removeAttribute('aria-pressed');
      });

      // 2. Afegir la classe actiu
      boto.classList.add('actiu');
      boto.setAttribute('aria-pressed', 'true');

      // 3. Obtenir el valor del filtre
      const filtre = boto.getAttribute('data-filtre');

      // 4. Mostrar o amagar targetes
      targetes.forEach(function(targeta) {
        const categoria = targeta.getAttribute('data-categoria');

        if (filtre === 'tot' || categoria === filtre) {
          targeta.classList.remove('amagat');
          targeta.removeAttribute('aria-hidden');
        } else {
          targeta.classList.add('amagat');
          targeta.setAttribute('aria-hidden', 'true');
        }
      });

    });
  });

}
// ============================================
// MENÚ HAMBURGUESA
// ============================================

const btnHamburguesa = document.querySelector('.nav__hamburguesa');
const navLinks = document.querySelector('.nav__links');

if (btnHamburguesa) {
  btnHamburguesa.addEventListener('click', function() {

    const estaObert = btnHamburguesa.classList.contains('obert');

    if (estaObert) {
      btnHamburguesa.classList.remove('obert');
      btnHamburguesa.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('obert');
    } else {
      btnHamburguesa.classList.add('obert');
      btnHamburguesa.setAttribute('aria-expanded', 'true');
      navLinks.classList.add('obert');
    }

  });

  // Tanca el menú si es clica fora
  document.addEventListener('click', function(event) {
    const clicFora = !btnHamburguesa.contains(event.target) && 
                     !navLinks.contains(event.target);
    if (clicFora) {
      btnHamburguesa.classList.remove('obert');
      btnHamburguesa.setAttribute('aria-expanded', 'false');
      navLinks.classList.remove('obert');
    }
  });
}

// ============================================
// BUSCADOR DE RECEPTES
// ============================================

const inputCerca = document.querySelector('.buscador__input');

if (inputCerca) {
  inputCerca.addEventListener('input', function() {

    const textCerca = inputCerca.value.toLowerCase().trim();

    targetes.forEach(function(targeta) {
      const titol = targeta.querySelector('h3').textContent.toLowerCase();
      const descripcio = targeta.querySelector('p').textContent.toLowerCase();

      const coincideix = titol.includes(textCerca) || 
                         descripcio.includes(textCerca);

      if (coincideix) {
        targeta.classList.remove('amagat');
        targeta.removeAttribute('aria-hidden');
      } else {
        targeta.classList.add('amagat');
        targeta.setAttribute('aria-hidden', 'true');
      }
    });

    // Reseteja els botons de filtre
    botonsFiltres.forEach(function(b) {
      b.classList.remove('actiu');
      b.removeAttribute('aria-pressed');
    });
    document.querySelector('[data-filtre="tot"]').classList.add('actiu');

  });
}


