// Work page JavaScript - Dynamic content loading from data.js
document.addEventListener('DOMContentLoaded', () => {
    // Check if portfolioData is available
    if (typeof portfolioData === 'undefined') {
        console.error('portfolioData not found');
        return;
    }

    // Get work ID from URL parameter
    const urlParams = new URLSearchParams(window.location.search);
    const workId = urlParams.get('id') || getWorkIdFromPath();

    if (!workId) {
        console.error('Work ID not found');
        return;
    }

    // Find work data
    const work = portfolioData.works.find(w => w.id == workId);
    if (!work) {
        console.error('Work not found for ID:', workId);
        return;
    }

    // Render the work page
    renderWorkPage(work);

    // Initialize Back to Top functionality
    initBackToTop();
});

// Get work ID from URL path (e.g., work1.html -> 1)
function getWorkIdFromPath() {
    const path = window.location.pathname;
    const match = path.match(/work(\d+)\.html/);
    return match ? match[1] : null;
}

// Role mapping
const roles = {
    'designer': 'Designer',
    'art-director': 'Art Director',
    'illustrator': 'Illustrator',
    'engineer': 'Engineer'
};

// Get tag count from portfolio data
function getTagCount(tag) {
    if (typeof portfolioData === 'undefined' || !portfolioData.works) {
        return 0;
    }
    return portfolioData.works.filter(work => {
        if (Array.isArray(work.tags)) {
            return work.tags.includes(tag);
        } else {
            return work.tags === tag;
        }
    }).length;
}

// Render work page content
function renderWorkPage(work) {
    // Update page title
    document.title = `${work.title} - Shohei Yamaguchi`;

    // Update work title
    const titleElement = document.querySelector('.work-title');
    if (titleElement) {
        titleElement.textContent = work.title;
    }

    // Update work client
    const clientElement = document.querySelector('.work-client');
    if (clientElement) {
        clientElement.textContent = work.client;
    }

    // Update work role
    const roleElement = document.querySelector('.work-role');
    if (roleElement) {
        const roleText = roles[work.role] || work.role;
        roleElement.textContent = `role: ${roleText}`;
    }

    // Update work tags
    const tagsElement = document.querySelector('.work-tags');
    if (tagsElement) {
        const tags = Array.isArray(work.tags) ? work.tags : [work.tags];
        tagsElement.innerHTML = tags.map(tag => {
            const count = getTagCount(tag);
            return `<span class="work-tag">${tag}(${count})</span>`;
        }).join('');
    }

    // Update work images
    const imagesElement = document.querySelector('.work-images');
    if (imagesElement && work.images) {
        imagesElement.innerHTML = work.images.map(img =>
            `<img src="${img}" alt="${work.title}" class="work-image">`
        ).join('');
    }

    // Update work description
    const descriptionElement = document.querySelector('.work-description');
    if (descriptionElement) {
        descriptionElement.innerHTML = `<p>${work.description}</p>`;
    }
}

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
