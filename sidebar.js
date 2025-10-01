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
            <button class="hamburger-btn" id="hamburgerBtn" aria-label="メニュー">
                <span></span>
                <span></span>
                <span></span>
            </button>
            <div class="side-menu-content" id="sideMenuContent">
                <div class="language-switcher">
                    <button id="langJP" class="lang-btn" data-lang="ja">JP</button>
                    <span class="lang-separator">|</span>
                    <button id="langEN" class="lang-btn" data-lang="en">EN</button>
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
            this.initHamburgerMenu();
            // 言語トグルは最後に初期化（DOMが完全に準備された後）
            setTimeout(() => {
                this.initLanguageToggle();
            }, 0);
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
        const langJPBtn = document.getElementById('langJP');
        const langENBtn = document.getElementById('langEN');

        if (langJPBtn && langENBtn) {
            // JPボタンのクリックイベント
            langJPBtn.addEventListener('click', () => {
                this.setLanguage('ja');
            });

            // ENボタンのクリックイベント
            langENBtn.addEventListener('click', () => {
                this.setLanguage('en');
            });

            // 初期化時に現在の言語に応じてボタンの表示を更新
            const currentLang = localStorage.getItem('language') || 'ja';
            this.updateLanguageButtons(currentLang);
        }
    }

    setLanguage(lang) {
        const currentLang = localStorage.getItem('language') || 'ja';

        // 既に選択されている言語の場合は何もしない
        if (currentLang === lang) {
            return;
        }

        // 言語設定を保存
        localStorage.setItem('language', lang);

        // ボタンの表示を更新
        this.updateLanguageButtons(lang);

        // 言語変更イベントを発火
        document.dispatchEvent(new CustomEvent('languageChanged', {
            detail: { language: lang }
        }));
    }

    updateLanguageButtons(lang) {
        const langJPBtn = document.getElementById('langJP');
        const langENBtn = document.getElementById('langEN');

        if (langJPBtn && langENBtn) {
            if (lang === 'ja') {
                // JP選択中
                langJPBtn.classList.add('active');
                langJPBtn.disabled = true;
                langENBtn.classList.remove('active');
                langENBtn.disabled = false;
            } else {
                // EN選択中
                langJPBtn.classList.remove('active');
                langJPBtn.disabled = false;
                langENBtn.classList.add('active');
                langENBtn.disabled = true;
            }
        }
    }

    initHamburgerMenu() {
        const hamburgerBtn = document.getElementById('hamburgerBtn');
        const sideMenuContent = document.getElementById('sideMenuContent');
        const sidebar = document.querySelector('.side-menu');

        if (hamburgerBtn && sideMenuContent) {
            hamburgerBtn.addEventListener('click', () => {
                sidebar.classList.toggle('menu-open');
                hamburgerBtn.classList.toggle('active');
            });

            // メニュー外をクリックしたら閉じる
            document.addEventListener('click', (e) => {
                if (!sidebar.contains(e.target)) {
                    sidebar.classList.remove('menu-open');
                    hamburgerBtn.classList.remove('active');
                }
            });

            // メニュー内のリンクをクリックしたら閉じる
            const navLinks = sideMenuContent.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    sidebar.classList.remove('menu-open');
                    hamburgerBtn.classList.remove('active');
                });
            });
        }
    }
}

// ページ読み込み時にサイドバーを初期化
document.addEventListener('DOMContentLoaded', () => {
    new Sidebar();
});
