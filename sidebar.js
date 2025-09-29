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
                <div class="language-switcher">
                    <button id="languageToggle" class="language-toggle">
                        <span class="other-lang">JP</span><span>|</span><span class="current-lang">EN</span>
                    </button>
                </div>
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
            this.initLanguageToggle();
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

    initLanguageToggle() {
        const languageToggle = document.getElementById('languageToggle');
        console.log('Language toggle button found:', languageToggle);
        if (languageToggle) {
            languageToggle.addEventListener('click', () => {
                console.log('Language toggle clicked');
                this.toggleLanguage();
            });

            // 初期化時に現在の言語に応じてボタンの表示を更新
            const currentLang = localStorage.getItem('language') || 'ja';
            this.updateLanguageButton(currentLang);
        } else {
            console.error('Language toggle button not found');
        }
    }

    toggleLanguage() {
        // 現在の言語を取得（デフォルトは日本語）
        const currentLang = localStorage.getItem('language') || 'ja';
        const newLang = currentLang === 'ja' ? 'en' : 'ja';

        console.log('Toggling language from', currentLang, 'to', newLang);

        // 言語設定を保存
        localStorage.setItem('language', newLang);

        // ボタンの表示を更新
        this.updateLanguageButton(newLang);

        // 言語変更イベントを発火
        console.log('Dispatching languageChanged event');
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: newLang }
        }));
    }

    updateLanguageButton(lang) {
        const languageToggle = document.querySelector('.language-toggle');
        if (languageToggle) {
            if (lang === 'ja') {
                languageToggle.innerHTML = '<span class="current-lang">JP</span><span>|</span><span class="other-lang">EN</span>';
            } else {
                languageToggle.innerHTML = '<span class="other-lang">JP</span><span>|</span><span class="current-lang">EN</span>';
            }
        }
    }
}

// ページ読み込み時にサイドバーを初期化
document.addEventListener('DOMContentLoaded', () => {
    new Sidebar();
});
