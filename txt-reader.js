// txtファイル読み込み機能
class TxtWorkReader {
    constructor() {
        this.workData = null;
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
            } else if (line.startsWith('クライアント:')) {
                workInfo.client = line.replace('クライアント:', '').trim();
            } else if (line.startsWith('作品名:')) {
                workInfo.title = line.replace('作品名:', '').trim();
            } else if (line.startsWith('タグ:')) {
                const tagsString = line.replace('タグ:', '').trim();
                workInfo.tags = tagsString.split(',').map(tag => tag.trim());
            } else if (line.startsWith('役割:')) {
                workInfo.role = line.replace('役割:', '').trim();
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
            'works-hix',
            'works-joy-planet',
            'works-lakole-keyvisual',
            'works-mirza-logo',
            'works-natural-water-salmon',
            'works-otomo',
            'works-peace-lily',
            'works-relic-square',
            'works-ririkuri-kun',
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
                    console.log(`Successfully loaded work: ${workId}`); // デバッグ用
                } else {
                    console.warn(`Failed to load 0.txt for ${folderName}: ${response.status}`); // デバッグ用
                }
            } catch (error) {
                console.error(`Error loading 0.txt for ${folderName}:`, error); // デバッグ用
            }
        }

        console.log(`Total works loaded: ${workIds.length}`); // デバッグ用
        return workIds;
    }
}

// グローバルに利用可能にする
window.TxtWorkReader = TxtWorkReader;
