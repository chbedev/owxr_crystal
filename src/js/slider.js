// src/js/slider.js

let slideIndex = 0;
let sliderInterval;
// Note: We select these *after* DOM content is loaded, so we use a function closure.

/**
 * Controls the display and rotation of the hero slider.
 */
function initializeSlider() {
    const slides = document.querySelectorAll('.hero-slide');
    const dots = document.querySelectorAll('.indicator');

    if (slides.length === 0) return; // Exit if no slides loaded

    function showSlide(n) {
        // Normalize index
        if (n >= slides.length) slideIndex = 0;
        if (n < 0) slideIndex = slides.length - 1;

        // Remove active class from all
        slides.forEach(slide => slide.classList.remove('active'));
        dots.forEach(dot => dot.classList.remove('active'));

        // Add active to current
        slides[slideIndex].classList.add('active');
        dots[slideIndex].classList.add('active');
    }

    window.nextSlide = function() { // Make global for onclick handlers
        slideIndex++;
        showSlide(slideIndex);
        resetTimer(); 
    }

    window.prevSlide = function() { // Make global for onclick handlers
        slideIndex--;
        showSlide(slideIndex);
        resetTimer();
    }

    window.goToSlide = function(n) { // Make global for onclick handlers
        slideIndex = n;
        showSlide(slideIndex);
        resetTimer();
    }

    function resetTimer() {
        clearInterval(sliderInterval);
        sliderInterval = setInterval(() => {
            slideIndex++;
            showSlide(slideIndex);
        }, 6000); // 6 seconds per slide
    }

    // Initial call
    showSlide(0);
    resetTimer();
}

// Call initialization after contentLoader has finished injecting dynamic slides
// For now, we call it on DOMContentLoaded, assuming static slides are still there.
document.addEventListener('DOMContentLoaded', initializeSlider);