// Work page JavaScript
document.addEventListener('DOMContentLoaded', () => {
    // Role mapping - same as main script
    const roles = {
        'designer': 'Designer',
        'art-director': 'Art Director',
        'illustrator': 'Illustrator',
        'engineer': 'Engineer'
    };

    // Apply role mapping to all work-role elements
    const roleElements = document.querySelectorAll('.work-role');
    roleElements.forEach(element => {
        const roleKey = element.textContent.trim();
        if (roles[roleKey]) {
            element.textContent = `role: ${roles[roleKey]}`;
        } else {
            element.textContent = `role: ${roleKey}`;
        }
    });

    // Handle tags display - no processing needed as HTML already has # format
    const tagElements = document.querySelectorAll('.work-tags');
    tagElements.forEach(element => {
        // Tags are already in # format in HTML, no processing needed
        console.log('Tags found:', element.textContent);
    });

    // Initialize Back to Top functionality
    initBackToTop();
});

// Back to Top functionality
function initBackToTop() {
    const backToTopBtn = document.getElementById('backToTop');

    if (!backToTopBtn) {
        console.log('Back to top button not found');
        return;
    }

    console.log('Back to top button found, initializing...');

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        const threshold = window.innerHeight * 2; // 200vh
        console.log('Scroll position:', scrollY, 'Threshold:', threshold);

        if (scrollY > threshold) {
            backToTopBtn.classList.add('visible');
            console.log('Button should be visible');
        } else {
            backToTopBtn.classList.remove('visible');
            console.log('Button should be hidden');
        }
    });

    // Smooth scroll to top when clicked
    backToTopBtn.addEventListener('click', () => {
        console.log('Back to top clicked');
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}
