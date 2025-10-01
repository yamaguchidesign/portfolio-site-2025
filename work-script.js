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

// Tag translations
const tagTranslations = {
    'ロゴ': 'Logo',
    'UI/UX': 'UI/UX',
    'ブランディング': 'Branding',
    'Web': 'Web',
    'キャラクターデザイン': 'Character Design',
    'パッケージ': 'Package',
    'イラストレーション': 'Illustration'
};

// Role tooltips
function getRoleWithTooltip(role) {
    const currentLang = window.languageManager ? window.languageManager.getCurrentLanguage() : 'ja';

    const tooltips = {
        'Art Director': {
            ja: 'クライアントと直接やり取りをしながら、案件の進行に関わりつつ、デザインのクオリティを保証する役割。多くの案件で自身も手を動かす。',
            en: 'Responsible for ensuring design quality while managing project progress and communicating directly with clients. Often hands-on in many projects.'
        },
        'Designer': {
            ja: 'アートディレクターの示す方向性をもとに、手を動かしてアウトプットを制作する役割。',
            en: 'Creates outputs hands-on based on the direction provided by the Art Director.'
        },
        'Illustrator': {
            ja: 'キャラクターやイラスト表現を制作する役割。',
            en: 'Creates characters and illustration expressions.'
        },
        'Engineer': {
            ja: 'デザインや要件を受けて、実装を担当する役割。',
            en: 'Responsible for implementation based on designs and requirements.'
        }
    };

    const tooltipText = tooltips[role] ? tooltips[role][currentLang] : tooltips['Art Director'][currentLang];
    return `<span class="tooltip">${role}<span class="tooltiptext">${tooltipText}</span></span>`;
}

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
        roleElement.innerHTML = `role: ${getRoleWithTooltip(roleText)}`;
    }

    // Update work tags
    const tagsElement = document.querySelector('.work-tags');
    if (tagsElement) {
        const currentLang = window.languageManager ? window.languageManager.getCurrentLanguage() : 'ja';
        const tags = Array.isArray(work.tags) ? work.tags : [work.tags];
        tagsElement.innerHTML = tags.map(tag => {
            const count = getTagCount(tag);
            const displayTag = currentLang === 'en' && tagTranslations[tag] ? tagTranslations[tag] : tag;
            return `<span class="work-tag">${displayTag}(${count})</span>`;
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
