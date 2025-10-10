// All Works Page JavaScript
class AllWorks {
    constructor() {
        this.works = [];
        this.filteredWorks = [];
        this.currentFilter = 'all';
        this.allTags = new Set();

        // タグの日英マッピング
        this.tagTranslations = {
            'ロゴ': 'Logo',
            'UI/UX': 'UI/UX',
            'ブランディング': 'Branding',
            'Web': 'Web',
            'キャラクターデザイン': 'Character Design',
            'パッケージ': 'Package',
            'イラストレーション': 'Illustration'
        };

        this.init().catch(error => {
            console.error('Error initializing AllWorks:', error);
        });
    }

    async init() {
        await this.loadWorks();
        this.extractAllTags();
        this.setupEventListeners();
        this.setupScrollAnimations();
        this.renderTagButtons();
        await this.handleUrlParams();
    }

    async loadWorks() {
        console.log('portfolioData available:', typeof portfolioData !== 'undefined');

        // まずdata.jsから作品を読み込み
        let dataWorks = [];
        if (typeof portfolioData !== 'undefined') {
            console.log('portfolioData:', portfolioData);
            dataWorks = portfolioData.works || [];
        }

        // 動的にworksフォルダを検出して作品を追加
        const allWorks = [...dataWorks];

        // 動的フォルダ検出: works-で始まるフォルダを全て検出
        const detectedWorks = await this.detectWorksFolders();

        // 検出された作品を追加
        for (const workData of detectedWorks) {
            // 既存の作品と重複しないかチェック
            const existingWork = allWorks.find(work => work.id === workData.id);
            if (!existingWork) {
                allWorks.push(workData);
                console.log(`動的に追加された作品 ${workData.id}:`, workData);
            }
        }

        this.works = allWorks;
        this.filteredWorks = [...this.works];
        console.log('Loaded works:', this.works.length);
        console.log('Works data:', this.works);
    }

    async detectWorksFolders() {
        const detectedWorks = [];

        // 既知のworksフォルダをチェック（数字のみ）
        for (let i = 1; i <= 20; i++) {
            try {
                const response = await fetch(`images/works-${i}/0.txt`);
                if (response.ok) {
                    const txtContent = await response.text();
                    const workData = this.parseWorkTextWithLanguage(txtContent, i);
                    if (workData) {
                        detectedWorks.push(workData);
                    }
                }
            } catch (error) {
                // ファイルが存在しない場合は無視
            }
        }

        // 動的フォルダ検出: サーバーサイドでフォルダ一覧を取得
        try {
            const response = await fetch('images/');
            if (response.ok) {
                const html = await response.text();
                const worksFolders = this.extractWorksFoldersFromHTML(html);

                for (const folderName of worksFolders) {
                    try {
                        const response = await fetch(`images/${folderName}/0.txt`);
                        if (response.ok) {
                            const txtContent = await response.text();
                            const workData = this.parseWorkTextWithLanguage(txtContent, folderName);
                            if (workData) {
                                // 既に追加済みでないかチェック
                                const existingWork = detectedWorks.find(work => work.id === workData.id);
                                if (!existingWork) {
                                    detectedWorks.push(workData);
                                    console.log(`動的フォルダから検出された作品 ${folderName}:`, workData);
                                }
                            }
                        }
                    } catch (error) {
                        // ファイルが存在しない場合は無視
                    }
                }
            }
        } catch (error) {
            console.log('動的フォルダ検出に失敗しました:', error);
        }

        return detectedWorks;
    }

    extractWorksFoldersFromHTML(html) {
        // HTMLからworks-で始まるフォルダを抽出
        const worksFolders = [];
        const regex = /href="([^"]*works-[^"]*)\/"/g;
        let match;

        while ((match = regex.exec(html)) !== null) {
            const folderName = match[1];
            // works-で始まり、数字のみでないフォルダを抽出
            if (folderName.startsWith('works-') && !folderName.match(/works-\d+$/)) {
                worksFolders.push(folderName);
            }
        }

        return worksFolders;
    }

    generateWorkId(folderName) {
        // フォルダ名から一意のIDを生成
        // 実際のIDは0.txtファイルのIDフィールドから取得される
        // この関数はフォルダ名ベースのデフォルトIDを提供

        const match = folderName.match(/works-(\d+)$/);
        if (match) {
            return parseInt(match[1]);
        } else {
            // 数字でない場合は文字列として扱う
            return folderName;
        }
    }

    parseWorkTextWithLanguage(text, folderName) {
        // languageManagerを使って言語別にパース
        if (window.languageManager) {
            const parsedData = window.languageManager.parseWorkTextWithLanguage(text);
            const workData = window.languageManager.getWorkInfoForCurrentLanguage(parsedData);
            workData.folderName = folderName;
            workData.rawText = text;
            return workData;
        }

        // フォールバック: languageManagerがない場合は日本語のみパース
        return this.parseWorkText(text, folderName);
    }

    parseWorkText(text, folderName) {
        const lines = text.trim().split('\n');
        const workInfo = {
            id: '', // IDフィールドから取得するまで空文字
            client: '',
            title: '',
            description: '',
            tags: [],
            role: '', // 役割フィールドを追加
            rawText: text,
            folderName: folderName // フォルダ名を保存
        };

        let currentSection = '';

        // 各行を解析
        for (let line of lines) {
            line = line.trim();

            if (line.startsWith('--- 共通 ---')) {
                currentSection = 'common';
            } else if (line.startsWith('--- 日本語 ---')) {
                currentSection = 'ja';
            } else if (line.startsWith('--- English ---')) {
                currentSection = 'en';
            } else if (line.startsWith('---')) {
                currentSection = ''; // セクション終了
            }

            if (currentSection === 'common') {
                if (line.startsWith('ID:')) {
                    // 固定IDを優先
                    workInfo.id = line.replace('ID:', '').trim();
                    console.log('固定IDを発見:', workInfo.id);
                } else if (line.startsWith('Priority:')) {
                    const priorityStr = line.replace('Priority:', '').trim();
                    workInfo.priority = parseInt(priorityStr, 10);
                } else if (line.startsWith('Role:')) {
                    // 共通セクションからROLEを読み込み
                    workInfo.role = line.replace('Role:', '').trim();
                } else if (line.startsWith('タグ:')) {
                    const tagsString = line.replace('タグ:', '').trim();
                    workInfo.tags = tagsString.split(',').map(tag => tag.trim());
                    console.log('タグを解析しました:', tagsString, '→', workInfo.tags);
                }
            } else if (currentSection === 'ja') {
                if (line.startsWith('クライアント:')) {
                    workInfo.client = line.replace('クライアント:', '').trim();
                } else if (line.startsWith('作品名:')) {
                    workInfo.title = line.replace('作品名:', '').trim();
                } else if (line.startsWith('紹介文:')) {
                    workInfo.description = line.replace('紹介文:', '').trim();
                }
                // 日本語セクションの「役割:」は無視（共通のRole:を優先）
                // 後方互換性のため読み込みは残す
                if (line.startsWith('役割:') && !workInfo.role) {
                    workInfo.role = line.replace('役割:', '').trim();
                }
            } else if (currentSection === 'en') { // English section for English language
                if (line.startsWith('Client:')) {
                    workInfo.client = line.replace('Client:', '').trim();
                } else if (line.startsWith('Title:')) {
                    workInfo.title = line.replace('Title:', '').trim();
                } else if (line.startsWith('Description:')) {
                    workInfo.description = line.replace('Description:', '').trim();
                }
                // English section's "Role:" is ignored (common Role: is prioritized)
                // Keep for backward compatibility
                if (line.startsWith('Role:') && !workInfo.role) {
                    workInfo.role = line.replace('Role:', '').trim();
                }
            }
        }

        // IDフィールドが見つからない場合は、フォルダ名から生成
        if (!workInfo.id) {
            workInfo.id = this.generateWorkId(folderName);
            console.log('IDフィールドが見つからないため、フォルダ名から生成:', workInfo.id);
        }

        // 紹介文が複数行にわたる場合の処理
        if (!workInfo.description && workInfo.rawText) {
            // クライアント、作品名、タグ、IDの行を除いた残りを紹介文として扱う
            const clientLine = lines.find(line => line.trim().startsWith('クライアント:'));
            const titleLine = lines.find(line => line.trim().startsWith('作品名:'));
            const tagLine = lines.find(line => line.trim().startsWith('タグ:'));
            const idLine = lines.find(line => line.trim().startsWith('ID:'));

            const otherLines = lines.filter(line =>
                line.trim() !== clientLine &&
                line.trim() !== titleLine &&
                line.trim() !== tagLine &&
                line.trim() !== idLine &&
                line.trim() !== '' &&
                !line.startsWith('---') &&
                !line.startsWith('タグ一覧') &&
                !line.startsWith('・')
            );

            if (otherLines.length > 0) {
                workInfo.description = otherLines.join(' ');
            }
        }

        return workInfo;
    }

    extractAllTags() {
        this.works.forEach(work => {
            if (Array.isArray(work.tags)) {
                work.tags.forEach(tag => this.allTags.add(tag));
            }
        });
    }

    getTagCount(tag) {
        return this.works.filter(work => {
            return Array.isArray(work.tags) && work.tags.includes(tag);
        }).length;
    }

    async handleUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const tagParam = urlParams.get('tag');

        if (tagParam && this.allTags.has(tagParam)) {
            await this.filterWorks(tagParam);
            // Update the active button
            setTimeout(() => {
                const activeButton = document.querySelector(`[data-tag="${tagParam}"]`);
                if (activeButton) {
                    this.updateFilterButtons(activeButton);
                }
            }, 100);
        } else {
            // No tag parameter, show all works
            await this.filterWorks('all');
        }
    }

    setupEventListeners() {
        // Tag filter buttons and card tags
        document.addEventListener('click', async (e) => {
            console.log('Click event detected on:', e.target);
            if (e.target.classList.contains('tag-btn') || e.target.classList.contains('filter-btn')) {
                const tag = e.target.dataset.tag;
                console.log('Tag button clicked, tag:', tag);
                await this.filterWorks(tag);
                this.updateFilterButtons(e.target);
            } else if (e.target.classList.contains('clickable-tag')) {
                const tag = e.target.dataset.tag;
                console.log('Card tag clicked, tag:', tag);
                await this.filterWorks(tag);
                // Update the corresponding filter button
                const filterButton = document.querySelector(`[data-tag="${tag}"]`);
                if (filterButton) {
                    this.updateFilterButtons(filterButton);
                }
            }
        });
    }

    async filterWorks(tag) {
        this.currentFilter = tag;
        console.log('Filtering by tag:', tag);
        console.log('Total works:', this.works.length);

        if (tag === 'all') {
            this.filteredWorks = [...this.works];
        } else {
            this.filteredWorks = this.works.filter(work => {
                return Array.isArray(work.tags) && work.tags.includes(tag);
            });
        }

        console.log('Filtered works:', this.filteredWorks.length);
        await this.renderWorks();
    }

    updateFilterButtons(activeButton) {
        // Remove active class from all buttons
        document.querySelectorAll('.tag-btn, .filter-btn').forEach(btn => {
            btn.classList.remove('active');
        });

        // Add active class to clicked button
        activeButton.classList.add('active');
    }

    renderTagButtons() {
        const tagButtonsContainer = document.getElementById('tagButtons');
        const totalWorks = this.works.length;
        const currentLang = window.languageManager ? window.languageManager.getCurrentLanguage() : 'ja';

        // 指定された順番でタグを並べる
        const tagOrder = ['ロゴ', 'UI/UX', 'ブランディング', 'Web', 'キャラクターデザイン', 'パッケージ', 'イラストレーション'];
        const sortedTags = tagOrder.filter(tag => this.allTags.has(tag));

        // All button + tag buttons in one block
        tagButtonsContainer.innerHTML = [
            `<button class="tag-btn active" data-tag="all">All(${totalWorks})</button>`,
            ...sortedTags.map(tag => {
                const count = this.getTagCount(tag);
                const displayTag = currentLang === 'en' && this.tagTranslations[tag] ? this.tagTranslations[tag] : tag;
                return `<button class="tag-btn" data-tag="${tag}">${displayTag}(${count})</button>`;
            })
        ].join('');
    }

    async renderWorks() {
        const worksGrid = document.getElementById('worksGrid');
        console.log('Rendering works, filtered count:', this.filteredWorks.length);
        console.log('Works grid element:', worksGrid);

        if (!worksGrid) {
            console.error('worksGrid element not found!');
            return;
        }

        if (this.filteredWorks.length === 0) {
            console.log('No works to display, showing no-works message');
            worksGrid.innerHTML = '<p class="no-works">No works found for this tag.</p>';
            return;
        }

        console.log('Rendering work cards...');

        // 各作品のサムネイル画像を取得
        const worksWithThumbnails = await Promise.all(
            this.filteredWorks.map(async (work, index) => {
                const thumbnail = await this.getThumbnailImage(work.id);
                return { ...work, thumbnail, index };
            })
        );

        const html = worksWithThumbnails.map((work) => `
            <a href="work.html?id=${work.id}" class="work-card" style="animation-delay: ${work.index * 0.1}s">
                <div class="work-image-container">
                    <img src="${work.thumbnail}" alt="${work.title}" class="work-card-image" loading="lazy">
                </div>
                <div class="work-card-content">
                    <h3 class="work-card-title">${work.title}</h3>
                    <p class="work-card-client">${work.client}</p>
                    <p class="work-card-role">role: ${this.getRoleDisplay(work.role)}</p>
                    <div class="work-card-tags">${this.renderWorkTags(work.tags)}</div>
                </div>
            </a>
        `).join('');

        console.log('Generated HTML length:', html.length);
        worksGrid.innerHTML = html;
        console.log('HTML inserted into worksGrid');
    }

    async getThumbnailImage(workId) {
        const imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif', 'svg'];

        // 作品データからフォルダ名を取得
        const work = this.works.find(w => w.id === workId);
        const folderName = work ? work.folderName : (typeof workId === 'string' ? workId : `works-${workId}`);

        console.log(`サムネイル検索: ID=${workId}, フォルダ名=${folderName}`);

        // 1桁のパターン: 1.png, 1.jpg など
        for (const ext of imageExtensions) {
            const imagePath = `images/${folderName}/1.${ext}`;
            try {
                const response = await fetch(imagePath, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`サムネイル画像を発見: ${imagePath}`);
                    return imagePath;
                }
            } catch (error) {
                // ファイルが存在しない場合は次の拡張子を試す
            }
        }

        // 2桁のパターン: 01.png, 01.jpg など
        for (const ext of imageExtensions) {
            const imagePath = `images/${folderName}/01.${ext}`;
            try {
                const response = await fetch(imagePath, { method: 'HEAD' });
                if (response.ok) {
                    console.log(`サムネイル画像を発見: ${imagePath}`);
                    return imagePath;
                }
            } catch (error) {
                // ファイルが存在しない場合は次の拡張子を試す
            }
        }

        // 画像が見つからない場合はプレースホルダーを返す
        console.warn(`作品 ${workId} のサムネイル画像が見つかりません (フォルダ: ${folderName})`);
        return 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzAwIiBoZWlnaHQ9IjIwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjhmOGY4Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxNCIgZmlsbD0iIzk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii4zZW0iPk5vIEltYWdlPC90ZXh0Pjwvc3ZnPg==';
    }

    getRoleDisplay(role) {
        const roles = {
            'designer': 'Designer',
            'art-director': 'Art Director',
            'illustrator': 'Illustrator',
            'engineer': 'Engineer'
        };
        const displayRole = roles[role] || role;
        return this.getRoleWithTooltip(displayRole);
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

    renderWorkTags(tags) {
        if (!Array.isArray(tags)) return '';

        const currentLang = window.languageManager ? window.languageManager.getCurrentLanguage() : 'ja';

        return tags.map(tag => {
            const count = this.getTagCount(tag);
            const displayTag = currentLang === 'en' && this.tagTranslations[tag] ? this.tagTranslations[tag] : tag;
            return `<span class="tag-btn clickable-tag" data-tag="${tag}">${displayTag}(${count})</span>`;
        }).join('');
    }

    setupScrollAnimations() {
        // Disable scroll animations for now to ensure cards are visible
        console.log('Scroll animations disabled for debugging');

        // Just ensure all cards are visible immediately
        setTimeout(() => {
            const workCards = document.querySelectorAll('.work-card');
            console.log('Found work cards:', workCards.length);
            workCards.forEach(card => {
                card.classList.add('animate');
                console.log('Card made visible:', card);
            });
        }, 100);
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

// Initialize when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM loaded, initializing AllWorks...');
    try {
        const allWorks = new AllWorks();
        initBackToTop();
        console.log('AllWorks initialized successfully');

        // 言語変更イベントをリッスン
        document.addEventListener('languageChanged', () => {
            setTimeout(() => {
                allWorks.init(); // AllWorksを再初期化
            }, 50);
        });
    } catch (error) {
        console.error('Error initializing AllWorks:', error);
    }
});
