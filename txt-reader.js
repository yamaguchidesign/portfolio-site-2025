// txtファイル読み込み機能
class TxtWorkReader {
    constructor() {
        this.workData = null;
    }

    // 共通パーサー関数：0.txtファイルの内容を解析
    static parseWorkTextCommon(text, options = {}) {
        const {
            includeRawText = false,
            includeFolderName = false,
            folderName = null
        } = options;

        const lines = text.trim().split('\n');
        const workInfo = {
            id: '',
            client: '',
            title: '',
            description: '',
            tags: [],
            role: '',
            priority: null
        };

        // オプションで追加情報を含める
        if (includeRawText) {
            workInfo.rawText = text;
        }
        if (includeFolderName && folderName) {
            workInfo.folderName = folderName;
        }

        let currentSection = '';

        // 各行を解析
        for (let line of lines) {
            line = line.trim();

            // セクション検出
            if (line.startsWith('--- 共通 ---')) {
                currentSection = 'common';
            } else if (line.startsWith('--- 日本語 ---')) {
                currentSection = 'ja';
            } else if (line.startsWith('--- English ---')) {
                currentSection = 'en';
            } else if (line.startsWith('---')) {
                currentSection = ''; // セクション終了
            }

            // 各セクションのデータを解析
            if (currentSection === 'common') {
                if (line.startsWith('ID:')) {
                    workInfo.id = line.replace('ID:', '').trim();
                } else if (line.startsWith('Priority:')) {
                    const priorityStr = line.replace('Priority:', '').trim();
                    workInfo.priority = parseInt(priorityStr, 10);
                } else if (line.startsWith('Role:')) {
                    // 共通セクションからROLEを読み込み
                    workInfo.role = line.replace('Role:', '').trim();
                } else if (line.startsWith('タグ:')) {
                    const tagsString = line.replace('タグ:', '').trim();
                    workInfo.tags = tagsString.split(',').map(tag => tag.trim());
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
            } else if (currentSection === 'en') {
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

        // 紹介文が複数行にわたる場合の処理
        if (!workInfo.description && workInfo.rawText) {
            const descriptionLines = lines.filter(line =>
                !line.startsWith('---') &&
                !line.startsWith('ID:') &&
                !line.startsWith('Priority:') &&
                !line.startsWith('Role:') &&
                !line.startsWith('タグ:') &&
                !line.startsWith('クライアント:') &&
                !line.startsWith('作品名:') &&
                !line.startsWith('役割:') &&
                !line.startsWith('Client:') &&
                !line.startsWith('Title:') &&
                !line.startsWith('Description:') &&
                line.trim() !== '' &&
                !line.startsWith('タグ一覧') &&
                !line.startsWith('・')
            );
            if (descriptionLines.length > 0) {
                workInfo.description = descriptionLines.join(' ').trim();
            }
        }

        return workInfo;
    }

    // txtファイルを読み込んで作品情報を解析
    async loadWorkFromTxt(workId) {
        // 複数のtxtファイル名を試行
        const possibleFileNames = ['0.txt', '名称未設定.txt', 'info.txt', 'work.txt'];

        for (let fileName of possibleFileNames) {
            try {
                const response = await fetch(`images/works-${workId}/${fileName}`);
                if (response.ok) {
                    const text = await response.text();
                    this.workData = this.parseWorkText(text);
                    return this.workData;
                }
            } catch (error) {
                // 次のファイル名を試行
                continue;
            }
        }

        return null;
    }

    // txtファイルの内容を解析して作品情報を抽出
    parseWorkText(text) {
        // 言語管理システムが利用可能な場合は、新しいパーサーを使用
        if (window.languageManager) {
            const workInfo = window.languageManager.parseWorkTextWithLanguage(text);
            return window.languageManager.getWorkInfoForCurrentLanguage(workInfo);
        }

        // フォールバック: 従来のパーサー
        const lines = text.trim().split('\n');
        const workInfo = {
            id: '', // IDフィールドを追加
            client: '',
            title: '',
            description: '',
            tags: [],
            role: '', // 役割フィールドを追加
            priority: null, // 優先度フィールドを追加
            rawText: text
        };

        // 各行を解析
        for (let line of lines) {
            line = line.trim();

            if (line.startsWith('ID:')) {
                // 固定IDを優先
                workInfo.id = line.replace('ID:', '').trim();
            } else if (line.startsWith('Priority:')) {
                const priorityStr = line.replace('Priority:', '').trim();
                workInfo.priority = parseInt(priorityStr, 10);
            } else if (line.startsWith('Role:')) {
                // 共通セクションからROLEを読み込み
                workInfo.role = line.replace('Role:', '').trim();
            } else if (line.startsWith('クライアント:')) {
                workInfo.client = line.replace('クライアント:', '').trim();
            } else if (line.startsWith('作品名:')) {
                workInfo.title = line.replace('作品名:', '').trim();
            } else if (line.startsWith('タグ:')) {
                const tagsString = line.replace('タグ:', '').trim();
                workInfo.tags = tagsString.split(',').map(tag => tag.trim());
            } else if (line.startsWith('役割:')) {
                // 日本語セクションの「役割:」は無視（共通のRole:を優先）
                // 後方互換性のため読み込みは残す
                if (!workInfo.role) {
                    workInfo.role = line.replace('役割:', '').trim();
                }
            } else if (line.startsWith('紹介文:')) {
                workInfo.description = line.replace('紹介文:', '').trim();
            }
        }

        // 紹介文が複数行にわたる場合の処理
        if (!workInfo.description && workInfo.rawText) {
            // クライアント、作品名、タグの行を除いた残りを紹介文として扱う
            const clientLine = lines.find(line => line.trim().startsWith('クライアント:'));
            const titleLine = lines.find(line => line.trim().startsWith('作品名:'));
            const tagLine = lines.find(line => line.trim().startsWith('タグ:'));

            const otherLines = lines.filter(line =>
                line.trim() !== clientLine &&
                line.trim() !== titleLine &&
                line.trim() !== tagLine &&
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

    // 作品情報をHTMLに表示
    displayWorkInfo(containerSelector) {
        if (!this.workData) {
            console.error('作品データが読み込まれていません');
            return;
        }

        const container = document.querySelector(containerSelector);
        if (!container) {
            console.error('表示先のコンテナが見つかりません:', containerSelector);
            return;
        }

        // クライアント名を表示
        const clientElement = container.querySelector('.work-client');
        if (clientElement) {
            clientElement.textContent = this.workData.client;
        }

        // 作品名を表示
        const titleElement = container.querySelector('.work-title');
        if (titleElement) {
            titleElement.textContent = this.workData.title;
        }

        // 紹介文を表示
        const descriptionElement = container.querySelector('.work-description p');
        if (descriptionElement) {
            descriptionElement.textContent = this.workData.description;
        }

        // ページタイトルも更新
        document.title = `${this.workData.title} - Shohei Yamaguchi`;
    }

    // 特定の作品IDで作品情報を読み込んで表示
    async loadAndDisplayWork(workId, containerSelector = '.work-detail .container') {
        try {
            await this.loadWorkFromTxt(workId);
            this.displayWorkInfo(containerSelector);
            return this.workData;
        } catch (error) {
            console.error('作品の読み込み・表示エラー:', error);
            return null;
        }
    }

    // 利用可能な作品IDを取得（画像フォルダから自動検出）
    async getAvailableWorkIds() {
        // 新しいIDベースのフォルダ名のリスト（Netlifyでの読み込み問題を回避するため、固定リストを使用）
        const folderNames = [
            'works-al-medical-assist',
            'works-aru-yoi-sake',
            'works-cornpotter-sake',
            'works-count-ai',
            'works-hix',
            'works-highway',
            'works-hokuto',
            'works-joy-planet',
            'works-lakole-keyvisual',
            'works-mirza-logo',
            'works-minchalle',
            'works-natural-water-salmon',
            'works-otomo',
            'works-peace-lily',
            'works-relic-square',
            'works-ririkuri-kun',
            'works-tamago',
            'works-team-building-ui',
            'works-team-skip-share',
            'works-yozakura-noh'
        ];

        const workIds = [];

        // 各フォルダの0.txtファイルをチェック
        for (const folderName of folderNames) {
            try {
                const response = await fetch(`images/${folderName}/0.txt`);
                if (response.ok) {
                    // フォルダ名からIDを生成（実際のIDは0.txtから読み込まれる）
                    const workId = folderName.replace('works-', '');
                    workIds.push(workId);
                }
            } catch (error) {
                console.error(`Error loading 0.txt for ${folderName}:`, error); // デバッグ用
            }
        }

        return workIds;
    }
}

// グローバルに利用可能にする
window.TxtWorkReader = TxtWorkReader;
