// 共通サイドバー管理
class Sidebar {
    constructor() {
        this.currentPage = this.getCurrentPage();
        this.init();
    }

    getCurrentPage() {
        const path = window.location.pathname;
        const filename = path.split('/').pop();

        if (filename === 'index.html' || filename === '') {
            return 'home';
        } else if (filename === 'all-works.html') {
            return 'all-works';
        } else if (filename.startsWith('work') && filename.endsWith('.html')) {
            return 'work';
        } else if (filename === 'thank-you.html') {
            return 'thank-you';
        }
        return 'home';
    }

    getSidebarHTML() {
        const navLinks = this.getNavLinks();

        return `
            <div class="side-menu-content">
                <div class="profile-info">
                    <h1 class="logo">Shohei Yamaguchi</h1>
                    <p class="profile-title">Art Director</p>
                    <p class="profile-subtitle">Logo • Graphic • Web • UI • Illustration</p>
                </div>
                <nav class="nav">
                    ${navLinks}
                </nav>
                <button id="backToTop" class="back-to-top">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                        <path d="M12 19V5M5 12l7-7 7 7" />
                    </svg>
                    Top
                </button>
            </div>
        `;
    }

    getNavLinks() {
        const links = [
            { href: 'index.html', text: 'Home', page: 'home' },
            { href: 'all-works.html', text: 'All Works', page: 'all-works' },
            { href: 'index.html#about', text: 'About', page: 'about' },
            { href: 'index.html#contact', text: 'Contact', page: 'contact' }
        ];

        return links.map(link => {
            const isActive = this.isLinkActive(link.page);
            return `<a href="${link.href}" class="nav-link${isActive ? ' active' : ''}">${link.text}</a>`;
        }).join('');
    }

    isLinkActive(page) {
        if (page === 'about' || page === 'contact') {
            return this.currentPage === 'home';
        }
        return this.currentPage === page;
    }

    init() {
        const sidebar = document.querySelector('.side-menu');
        if (sidebar) {
            sidebar.innerHTML = this.getSidebarHTML();
            this.initBackToTop();
        }
    }

    initBackToTop() {
        const backToTopBtn = document.getElementById('backToTop');
        if (backToTopBtn) {
            backToTopBtn.addEventListener('click', () => {
                window.scrollTo({
                    top: 0,
                    behavior: 'smooth'
                });
            });
        }
    }
}

// ページ読み込み時にサイドバーを初期化
document.addEventListener('DOMContentLoaded', () => {
    new Sidebar();
});
