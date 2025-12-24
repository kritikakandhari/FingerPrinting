document.addEventListener('DOMContentLoaded', () => {
    // Intersection Observer for scroll animations
    const observerOptions = {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
    };

    const observer = new IntersectionObserver((entries, observer) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active');
                observer.unobserve(entry.target); // Only animate once
            }
        });
    }, observerOptions);

    // Observe elements with animation classes
    const animatedElements = document.querySelectorAll('.process-step, .reveal, .animate-fade-in-up, .reveal-left, .reveal-right');
    animatedElements.forEach((el, index) => {
        // Add staggered delay for process steps if they are siblings
        if (el.classList.contains('process-step')) {
            el.style.transitionDelay = `${index * 0.1}s`; // Simple staggered delay based on DOM order found
        }
        observer.observe(el);
    });

    // Accordion Logic
    const accordionCards = document.querySelectorAll('.accordion-card');
    accordionCards.forEach(card => {
        card.addEventListener('mouseenter', () => {
            accordionCards.forEach(c => c.classList.remove('active'));
            card.classList.add('active');
        });
    });

    // Remove preloader if it exists
    const preloader = document.getElementById('preloader');
    if (preloader) {
        window.addEventListener('load', () => {
            setTimeout(() => {
                preloader.classList.add('hidden');
                setTimeout(() => {
                    preloader.remove();
                }, 500);
            }, 500);
        });
    }
});

