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

    async init() {
        await this.loadWorks();
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.renderWorks();
        this.setupEmailProtection();
        this.setupFormHandling();
    }

    async loadWorks() {
        // Load works from the embedded data.js file
        this.works = portfolioData.works || [];

        // txtファイルの情報も読み込んで統合
        await this.loadTxtWorks();

        this.filteredWorks = [...this.works];
        console.log('Loaded works:', this.works.length);
    }

    async loadTxtWorks() {
        console.log('loadTxtWorks開始 - 現在の言語:', window.languageManager ? window.languageManager.getCurrentLanguage() : '未設定');

        // TxtWorkReaderを使用してtxtファイルから作品情報を読み込み
        const txtReader = new TxtWorkReader();
        const availableWorkIds = await txtReader.getAvailableWorkIds();

        console.log('利用可能な作品ID:', availableWorkIds);

        // 空の配列から開始して、txtファイルのデータのみを追加
        this.works = [];

        for (let workId of availableWorkIds) {
            try {
                console.log(`作品 ${workId} のtxtファイルを読み込み中...`);
                const txtWorkData = await txtReader.loadWorkFromTxt(workId);
                console.log(`作品 ${workId} の読み込み結果:`, txtWorkData);

                if (txtWorkData) {
                    // txtファイルから新しい作品データを作成
                    console.log(`作品 ${workId} の読み込みデータ:`, txtWorkData);
                    console.log(`作品 ${workId} のタイトル:`, txtWorkData.title);

                    // workIdは既にフォルダ名の一部なので、そのまま使用
                    const folderName = `works-${workId}`;

                    const newWork = {
                        id: txtWorkData.id || workId, // 0.txtのIDフィールドを優先
                        title: txtWorkData.title,
                        client: txtWorkData.client,
                        description: txtWorkData.description,
                        role: 'designer',
                        tags: txtWorkData.tags && txtWorkData.tags.length > 0 ? txtWorkData.tags : ['グラフィックデザイン'], // txtファイルからタグを読み込み
                        images: [`images/${folderName}/`],
                        featured: true,
                        folderName: folderName // フォルダ名を保存
                    };
                    this.works.push(newWork);
                    console.log(`作品 ${workId} をtxtファイルから追加しました:`, newWork);
                } else {
                    console.warn(`作品 ${workId} のtxtファイルデータが空です`);
                }
            } catch (error) {
                console.error(`作品 ${workId} のtxtファイル読み込みに失敗:`, error);
            }
        }

        console.log('最終的な作品データ:', this.works);
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
        const imageExtensions = ['jpg', 'jpeg', 'png', 'webp', 'gif', 'svg'];
        const foundImages = [];

        // 連続する404エラーを避けるため、最初の数個のファイルが見つからない場合は早期終了
        let consecutiveNotFound = 0;
        const maxConsecutiveNotFound = 3;

        // 1桁のパターン: 1.jpg, 2.jpg, 3.jpg など
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
                        consecutiveNotFound = 0; // リセット
                        break; // 1つの番号で見つかったら次の番号に進む
                    }
                } catch (error) {
                    // ファイルが存在しない場合は次の拡張子を試す
                }
            }

            if (!foundForThisNumber) {
                consecutiveNotFound++;
                // 連続してファイルが見つからない場合、早期終了
                if (consecutiveNotFound >= maxConsecutiveNotFound) {
                    console.log(`フォルダ ${folderPath}: 連続${consecutiveNotFound}回ファイルが見つからないため、検索を終了`);
                    break;
                }
            }
        }

        // 1桁でファイルが見つからない場合、2桁のパターンも試す: 01.png, 02.png など
        if (foundImages.length === 0) {
            consecutiveNotFound = 0;
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
                            consecutiveNotFound = 0; // リセット
                            break; // 1つの番号で見つかったら次の番号に進む
                        }
                    } catch (error) {
                        // ファイルが存在しない場合は次の拡張子を試す
                    }
                }

                if (!foundForThisNumber) {
                    consecutiveNotFound++;
                    // 連続してファイルが見つからない場合、早期終了
                    if (consecutiveNotFound >= maxConsecutiveNotFound) {
                        console.log(`フォルダ ${folderPath}: 連続${consecutiveNotFound}回ファイルが見つからないため、検索を終了`);
                        break;
                    }
                }
            }
        }

        console.log(`フォルダ ${folderPath}: ${foundImages.length}個の画像ファイルを発見:`, foundImages);
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
        // 役割に応じたツールチップ文言を設定
        let tooltipText = '';
        switch (role) {
            case 'Art Director':
                tooltipText = 'クライアントと直接やり取りをしながら、案件の進行に関わりつつ、デザインのクオリティを保証する役割。多くの案件で自身も手を動かす。';
                break;
            case 'Designer':
                tooltipText = 'アートディレクターの示す方向性をもとに、手を動かしてアウトプットを制作する役割。';
                break;
            case 'Illustrator':
                tooltipText = 'キャラクターやイラスト表現を制作する役割。';
                break;
            case 'Engineer':
                tooltipText = 'デザインや要件を受けて、実装を担当する役割。';
                break;
            default:
                tooltipText = 'クライアントと直接やり取りをしながら、案件の進行に関わりつつ、デザインのクオリティを保証する役割。多くの案件で自身も手を動かす。';
        }

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
        console.log('Rendering works:', this.works.length, 'works');
        console.log('Works data:', this.works);

        if (this.works.length === 0) {
            worksVertical.innerHTML = '<p class="no-works">No works found.</p>';
            return;
        }

        // 各作品の画像を非同期で読み込み
        const worksWithImages = await Promise.all(
            this.works.map(async (work) => {
                console.log('Processing work:', work);
                const images = await this.loadWorkImages(work);
                return { ...work, loadedImages: images };
            })
        );

        worksVertical.innerHTML = worksWithImages.map((work, index) => {
            console.log(`Rendering work ${index}:`, work.title, work.client, work.description);
            return `
            <div class="work-item-vertical" style="animation-delay: ${index * 0.2}s">
                <div class="work-header-vertical">
                    <h2 class="work-title-vertical">${work.title || 'タイトルなし'}</h2>
                    <div class="work-meta-vertical">
                        <p class="work-client-vertical">${work.client || 'クライアント名なし'}</p>
                        <p class="work-role-vertical">role: ${this.getRoleWithTooltip(this.roles[work.role] || work.role || 'designer')}</p>
                        <div class="work-tags-vertical">${Array.isArray(work.tags) ? work.tags.map(tag => `<span class="tag-btn clickable-tag" data-tag="${tag}">${tag}(${this.getTagCount(tag)})</span>`).join('') : `<span class="tag-btn clickable-tag" data-tag="${work.tags || 'デザイン'}">${work.tags || 'デザイン'}(${this.getTagCount(work.tags || 'デザイン')})</span>`}</div>
                    </div>
                </div>
                
                <div class="work-images-vertical">
                    ${work.loadedImages.length > 0 ? work.loadedImages.map(img => `
                        <img src="${img}" alt="${work.title || '作品画像'}" class="work-image-vertical" loading="lazy">
                    `).join('') : '<p class="no-images">画像が見つかりませんでした。</p>'}
                </div>
                
                <div class="work-description-vertical">
                    <p>${work.description || '説明がありません。'}</p>
                    <a href="work.html?id=${work.id}" class="work-link">View Individual Page →</a>
                </div>
            </div>
            `;
        }).join('');
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
        console.log('言語が変更されました。ホームページを再読み込みします。');
        portfolio.init(); // ポートフォリオを再初期化
        updateAboutSection(); // Aboutセクションも更新
    });

    // 初期表示時にもAboutセクションを更新
    updateAboutSection();
});


// Add loading state
window.addEventListener('load', () => {
    document.body.classList.add('loaded');

    // ページ完全読み込み後にもスクロール位置をリセット
    setTimeout(() => {
        window.scrollTo(0, 0);
    }, 100);
});

