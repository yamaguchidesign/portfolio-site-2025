// Portfolio JavaScript
class Portfolio {
    constructor() {
        this.works = [];
        this.filteredWorks = [];
        this.currentFilter = 'all';

        // Role mapping - manage all roles in one place
        this.roles = {
            'designer': 'Designer',
            'art-director': 'Art Director',
            'illustrator': 'Illustrator',
            'engineer': 'Engineer'
        };

        this.init();
    }

    init() {
        this.loadWorks();
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.renderWorks();
        this.setupEmailProtection();
        this.setupFormHandling();
    }

    loadWorks() {
        // Load works from the embedded data.js file
        this.works = portfolioData.works || [];
        this.filteredWorks = [...this.works];
        console.log('Loaded works:', this.works.length);
    }

    setupEventListeners() {
        // Smooth scrolling for navigation links (only for internal anchors)
        const navLinks = document.querySelectorAll('.nav-link');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                const href = link.getAttribute('href');

                // Allow normal navigation for external links (like all-works.html)
                if (href && !href.startsWith('#')) {
                    return; // Let the browser handle the navigation
                }

                // Prevent default only for internal anchor links
                e.preventDefault();
                const targetElement = document.querySelector(href);
                if (targetElement) {
                    targetElement.scrollIntoView({
                        behavior: 'smooth',
                        block: 'start'
                    });
                }
            });
        });

        // Tag click listeners for navigation to all-works page
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('clickable-tag')) {
                const tag = e.target.dataset.tag;
                window.location.href = `all-works.html?tag=${encodeURIComponent(tag)}`;
            }
        });
    }

    setupScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.style.animationDelay = `${Array.from(entry.target.parentNode.children).indexOf(entry.target) * 0.1}s`;
                    entry.target.classList.add('animate');
                }
            });
        }, observerOptions);

        // Observe work items after they're rendered
        setTimeout(() => {
            const workItems = document.querySelectorAll('.work-item-vertical');
            workItems.forEach(item => observer.observe(item));
        }, 100);
    }


    renderWorks() {
        const worksVertical = document.getElementById('worksVertical');
        console.log('Rendering works:', this.works.length, 'works');

        if (this.works.length === 0) {
            worksVertical.innerHTML = '<p class="no-works">No works found.</p>';
            return;
        }

        worksVertical.innerHTML = this.works.map((work, index) => `
            <div class="work-item-vertical" style="animation-delay: ${index * 0.2}s">
                <div class="work-header-vertical">
                    <h2 class="work-title-vertical">${work.title}</h2>
                    <div class="work-meta-vertical">
                        <p class="work-client-vertical">${work.client}</p>
                        <p class="work-role-vertical">role: ${this.roles[work.role] || work.role}</p>
                        <div class="work-tags-vertical">${Array.isArray(work.tags) ? work.tags.map(tag => `<span class="work-tag clickable-tag" data-tag="${tag}">${tag}</span>`).join('') : `<span class="work-tag clickable-tag" data-tag="${work.tags}">${work.tags}</span>`}</div>
                    </div>
                </div>
                
                <div class="work-images-vertical">
                    ${work.images.map(img => `
                        <img src="${img}" alt="${work.title}" class="work-image-vertical" loading="lazy">
                    `).join('')}
                </div>
                
                <div class="work-description-vertical">
                    <p>${work.description}</p>
                    <a href="work${work.id}.html" class="work-link">View Individual Page →</a>
                </div>
            </div>
        `).join('');
    }

    setupEmailProtection() {
        // メールアドレスを難読化して表示
        const emailLink = document.getElementById('email-link');
        if (emailLink) {
            // より高度な難読化：文字列を分割して組み立て
            const parts = [
                'yamaguchishohei93',
                '@',
                'gmail',
                '.',
                'com'
            ];

            // 遅延表示でボット対策
            setTimeout(() => {
                const fullEmail = parts.join('');
                emailLink.textContent = fullEmail;
                emailLink.href = 'mailto:' + fullEmail;

                // ローディング表示を削除
                emailLink.classList.remove('loading');
            }, 500);

            // クリック時の追加保護
            emailLink.addEventListener('click', (e) => {
                // 人間のクリックかどうかを確認（簡単な検証）
                if (e.detail === 1) { // シングルクリック
                    console.log('Email clicked by human user');
                }
            });
        }
    }

    setupFormHandling() {
        // Netlify Formsの標準的な動作に任せる
        // JavaScriptでの処理は削除
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

// Initialize portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Portfolio();
    initBackToTop();
});


// Add loading state
window.addEventListener('load', () => {
    document.body.classList.add('loaded');
});

