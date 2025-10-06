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

        // Tag translations
        this.tagTranslations = {
            'ロゴ': 'Logo',
            'UI/UX': 'UI/UX',
            'ブランディング': 'Branding',
            'Web': 'Web',
            'キャラクターデザイン': 'Character Design',
            'パッケージ': 'Package',
            'イラストレーション': 'Illustration'
        };

        this.init();
    }

    async init() {
        await this.loadWorks();
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.renderWorks();
        this.setupEmailProtection();
        this.setupFormHandling();
    }

    async loadWorks() {
        // txtファイルの情報のみを使用（data.jsは空なので無視）
        await this.loadTxtWorks();

        this.filteredWorks = [...this.works];
    }

    async loadTxtWorks() {
        // TxtWorkReaderを使用してtxtファイルから作品情報を読み込み
        const txtReader = new TxtWorkReader();
        const availableWorkIds = await txtReader.getAvailableWorkIds();

        // 空の配列から開始して、Priorityが設定された作品のみを読み込み
        this.works = [];

        for (let workId of availableWorkIds) {
            try {
                const txtWorkData = await txtReader.loadWorkFromTxt(workId);

                if (txtWorkData && txtWorkData.priority && txtWorkData.priority > 0) {
                    // Priorityが設定された作品のみを処理
                    const folderName = `works-${workId}`;

                    const newWork = {
                        id: txtWorkData.id || workId, // 0.txtのIDフィールドを優先
                        title: txtWorkData.title,
                        client: txtWorkData.client,
                        description: txtWorkData.description,
                        role: 'designer',
                        tags: txtWorkData.tags && txtWorkData.tags.length > 0 ? txtWorkData.tags : ['グラフィックデザイン'], // txtファイルからタグを読み込み
                        images: [`images/${folderName}/`],
                        priority: txtWorkData.priority, // 優先度を追加
                        featured: true,
                        folderName: folderName // フォルダ名を保存
                    };
                    this.works.push(newWork);
                }
            } catch (error) {
                console.error(`作品 ${workId} のtxtファイル読み込みに失敗:`, error);
            }
        }

        // Priority順でソート
        this.works.sort((a, b) => a.priority - b.priority);
    }



    // 作品タイトルからタグを生成（キーワードマッピング機能を削除）
    generateTagsFromTitle(title) {
        // キーワードマッピング機能を削除
        // txtファイルで直接タグを指定する方式に変更
        return [];
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
            if (e.target.classList.contains('clickable-tag') || e.target.classList.contains('tag-btn')) {
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


    async findImagesInFolder(folderPath) {
        const imageExtensions = ['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg'];
        const foundImages = [];

        // 2桁のゼロパディングパターンを最初に試す: 01.webp, 02.webp など（WebPを最優先）
        const twoDigitNumbers = ['01', '02', '03', '04', '05', '06', '07', '08', '09', '10'];

        for (const number of twoDigitNumbers) {
            let foundForThisNumber = false;

            for (const ext of imageExtensions) {
                const imagePath = `${folderPath}${number}.${ext}`;
                try {
                    const response = await fetch(imagePath, { method: 'HEAD' });
                    if (response.ok) {
                        foundImages.push(imagePath);
                        foundForThisNumber = true;
                        break; // この番号でファイルが見つかったら、同じ番号の他の拡張子は探さず次の番号に進む
                    }
                } catch (error) {
                    // ファイルが存在しない場合は次の拡張子を試す（コンソールエラーは出力しない）
                    // 最初の拡張子（webp）で見つからない場合は、その番号での検索を即座に停止
                    if (ext === 'webp') {
                        break;
                    }
                }
            }

            // この番号でファイルが見つからなかった場合、検索を完全に停止
            if (!foundForThisNumber) {
                break;
            }
        }

        // 2桁でファイルが見つからない場合、1桁のパターンも試す: 1.jpg, 2.jpg など
        if (foundImages.length === 0) {
            const imageNumbers = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];

            for (const number of imageNumbers) {
                let foundForThisNumber = false;

                for (const ext of imageExtensions) {
                    const imagePath = `${folderPath}${number}.${ext}`;
                    try {
                        const response = await fetch(imagePath, { method: 'HEAD' });
                        if (response.ok) {
                            foundImages.push(imagePath);
                            foundForThisNumber = true;
                            break; // この番号でファイルが見つかったら、同じ番号の他の拡張子は探さず次の番号に進む
                        }
                    } catch (error) {
                        // ファイルが存在しない場合は次の拡張子を試す（コンソールエラーは出力しない）
                        // 最初の拡張子（webp）で見つからない場合は、その番号での検索を即座に停止
                        if (ext === 'webp') {
                            break;
                        }
                    }
                }

                // この番号でファイルが見つからなかった場合、検索を完全に停止
                if (!foundForThisNumber) {
                    break;
                }
            }
        }

        return foundImages;
    }





    async loadWorkImages(work) {
        // 直接ファイルパスを使用する場合
        if (work.images && work.images.length > 0) {
            // ファイルパスが直接指定されている場合
            if (work.images[0].includes('.')) {
                return work.images; // 直接ファイルパスを返す
            }
            // フォルダパスが指定されている場合
            else {
                const imagePromises = work.images.map(folderPath =>
                    this.findImagesInFolder(folderPath)
                );
                const imageResults = await Promise.all(imagePromises);
                return imageResults.flat(); // 2次元配列を1次元に変換
            }
        }
        return [];
    }

    getRoleWithTooltip(role) {
        // 現在の言語を取得
        const currentLang = window.languageManager ? window.languageManager.getCurrentLanguage() : 'ja';

        // 役割に応じたツールチップ文言を設定（日本語/英語）
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

    getTagCount(tag) {
        return this.works.filter(work => {
            if (Array.isArray(work.tags)) {
                return work.tags.includes(tag);
            } else {
                return work.tags === tag;
            }
        }).length;
    }

    async renderWorks() {
        const worksVertical = document.getElementById('worksVertical');

        if (this.works.length === 0) {
            worksVertical.innerHTML = '<p class="no-works">No works found.</p>';
            return;
        }

        // まず画像なしで作品を表示（高速表示）
        this.renderWorksWithoutImages();

        // 画像を並列で読み込み（バックグラウンド処理）
        this.loadImagesInBackground();
    }

    renderWorksWithoutImages() {
        const worksVertical = document.getElementById('worksVertical');

        // 現在の言語を取得
        const currentLang = window.languageManager ? window.languageManager.getCurrentLanguage() : 'ja';

        worksVertical.innerHTML = this.works.map((work, index) => {
            // タグの翻訳処理
            const renderTags = (tags) => {
                if (Array.isArray(tags)) {
                    return tags.map(tag => {
                        const displayTag = currentLang === 'en' && this.tagTranslations[tag] ? this.tagTranslations[tag] : tag;
                        return `<span class="tag-btn clickable-tag" data-tag="${tag}">${displayTag}(${this.getTagCount(tag)})</span>`;
                    }).join('');
                } else {
                    const tag = tags || 'デザイン';
                    const displayTag = currentLang === 'en' && this.tagTranslations[tag] ? this.tagTranslations[tag] : tag;
                    return `<span class="tag-btn clickable-tag" data-tag="${tag}">${displayTag}(${this.getTagCount(tag)})</span>`;
                }
            };

            return `
            <div class="work-item-vertical" style="animation-delay: ${index * 0.2}s" data-work-id="${work.id}">
                <div class="work-header-vertical">
                    <h2 class="work-title-vertical">${work.title || 'タイトルなし'}</h2>
                    <div class="work-meta-vertical">
                        <p class="work-client-vertical">${work.client || 'クライアント名なし'}</p>
                        <p class="work-role-vertical">role: ${this.getRoleWithTooltip(this.roles[work.role] || work.role || 'designer')}</p>
                        <div class="work-tags-vertical">${renderTags(work.tags)}</div>
                    </div>
                </div>
                
                <div class="work-images-vertical" id="images-${work.id}">
                    <div class="image-loading">画像を読み込み中...</div>
                </div>
                
                <div class="work-description-vertical">
                    <p>${work.description || '説明がありません。'}</p>
                    <a href="work.html?id=${work.id}" class="work-link">View Individual Page →</a>
                </div>
            </div>
            `;
        }).join('');
    }

    async loadImagesInBackground() {
        // 各作品の画像を並列で読み込み
        this.works.forEach(async (work) => {
            try {
                const images = await this.loadWorkImages(work);
                this.updateWorkImages(work.id, images);
            } catch (error) {
                console.error(`画像読み込みエラー (${work.id}):`, error);
                this.updateWorkImages(work.id, []);
            }
        });
    }

    updateWorkImages(workId, images) {
        const imageContainer = document.getElementById(`images-${workId}`);
        if (!imageContainer) return;

        if (images.length > 0) {
            imageContainer.innerHTML = images.map(img => `
                <img src="${img}" alt="作品画像" class="work-image-vertical" loading="lazy">
            `).join('');
        } else {
            imageContainer.innerHTML = '<p class="no-images">画像が見つかりませんでした。</p>';
        }
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
        return;
    }

    // Show/hide button based on scroll position
    window.addEventListener('scroll', () => {
        const scrollY = window.pageYOffset;
        const threshold = window.innerHeight * 2; // 200vh

        if (scrollY > threshold) {
            backToTopBtn.classList.add('visible');
        } else {
            backToTopBtn.classList.remove('visible');
        }
    });

    // Smooth scroll to top when clicked
    backToTopBtn.addEventListener('click', () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    });
}

// Aboutセクションの言語切り替え
function updateAboutSection() {
    const currentLang = window.languageManager ? window.languageManager.getCurrentLanguage() : 'ja';
    const jaContent = document.querySelector('.about-text .lang-ja');
    const enContent = document.querySelector('.about-text .lang-en');

    if (jaContent && enContent) {
        if (currentLang === 'ja') {
            jaContent.style.display = 'block';
            enContent.style.display = 'none';
        } else {
            jaContent.style.display = 'none';
            enContent.style.display = 'block';
        }
    }
}

// Initialize portfolio when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    // ページ読み込み時にスクロール位置を最上部にリセット
    window.scrollTo(0, 0);

    const portfolio = new Portfolio();
    initBackToTop();

    // 言語変更イベントをリッスン
    document.addEventListener('languageChanged', () => {
        setTimeout(() => {
            portfolio.init(); // ポートフォリオを再初期化
            updateAboutSection(); // Aboutセクションも更新
        }, 50);
    });

    // 初期表示時にもAboutセクションを更新（languageManagerの初期化後に実行）
    setTimeout(() => {
        updateAboutSection();
    }, 100);
});


// Add loading state
window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    // ページ完全読み込み後にもスクロール位置をリセット
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});

