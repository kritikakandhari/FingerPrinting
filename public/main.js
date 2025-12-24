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

    const accordionCards = document.querySelectorAll('.accordion-card');
    accordionCards.forEach(card => {
        card.addEventListener('click', () => {
            // Remove active from all other cards
            accordionCards.forEach(c => c.classList.remove('active'));
            // Add active to clicked card
            card.classList.add('active');
        });
    });

    // Text Reveal on Scroll Logic
    const revealText = document.querySelector('.reveal-text');
    if (revealText) {
        window.addEventListener('scroll', () => {
            const windowHeight = window.innerHeight;
            const elementTop = revealText.getBoundingClientRect().top;
            const elementVisible = 100; // Buffer

            // Start animation when element enters bottom of screen
            if (elementTop < windowHeight - elementVisible) {
                // Calculate percentage: 0% when at bottom, 100% when nearing top/center
                // Adjustable multiplier '2' speeds up the fill so it completes while text is comfortably in view
                let percentage = (1 - (elementTop / (windowHeight - 200))) * 100 * 1.5;

                // Clamp between 0 and 100
                percentage = Math.max(0, Math.min(100, percentage));

                revealText.style.setProperty('--scroll', percentage + '%');
            }
        });
    }

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

