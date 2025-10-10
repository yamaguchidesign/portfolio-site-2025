// 言語管理システム
class LanguageManager {
    constructor() {
        this.currentLanguage = this.getStoredLanguage();
        this.listeners = [];
        this.init();
    }

    getStoredLanguage() {
        // すでにlocalStorageに保存されている場合はそれを使用
        const stored = localStorage.getItem('language');
        if (stored) {
            return stored;
        }

        // 初回訪問時：ブラウザの言語設定を検出
        const browserLang = navigator.language || navigator.userLanguage;

        // 英語圏（en, en-US, en-GB等）の場合は英語、それ以外は日本語
        if (browserLang.startsWith('en')) {
            return 'en';
        }

        return 'ja'; // デフォルトは日本語
    }

    setLanguage(lang) {
        if (lang !== this.currentLanguage) {
            this.currentLanguage = lang;
            localStorage.setItem('language', lang);
            this.notifyListeners();
        }
    }

    getCurrentLanguage() {
        return this.currentLanguage;
    }

    isJapanese() {
        return this.currentLanguage === 'ja';
    }

    isEnglish() {
        return this.currentLanguage === 'en';
    }

    addListener(callback) {
        this.listeners.push(callback);
    }

    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }

    notifyListeners() {
        this.listeners.forEach(callback => {
            try {
                callback(this.currentLanguage);
            } catch (error) {
                console.error('Language listener error:', error);
            }
        });
    }

    init() {
        // 言語変更イベントをリッスン
        document.addEventListener('languageChanged', (event) => {
            this.setLanguage(event.detail.language);
        });
    }

    // 0.txtのセクション分けパーサー
    parseWorkTextWithLanguage(text) {
        const lines = text.trim().split('\n');
        const workInfo = {
            id: '',
            priority: null,
            tags: [], // 共通セクションのタグ（日本語）
            japanese: {
                client: '',
                title: '',
                role: '',
                description: ''
            },
            english: {
                client: '',
                title: '',
                role: '',
                description: ''
            }
        };

        let currentSection = '';

        for (let line of lines) {
            line = line.trim();

            // セクション検出
            if (line.startsWith('--- 共通 ---')) {
                currentSection = 'common';
                continue;
            } else if (line.startsWith('--- 日本語 ---')) {
                currentSection = 'japanese';
                continue;
            } else if (line.startsWith('--- English ---')) {
                currentSection = 'english';
                continue;
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
                    workInfo.japanese.role = line.replace('Role:', '').trim();
                    workInfo.english.role = line.replace('Role:', '').trim();
                } else if (line.startsWith('タグ:')) {
                    const tagsString = line.replace('タグ:', '').trim();
                    workInfo.tags = tagsString.split(',').map(tag => tag.trim());
                }
            } else if (currentSection === 'japanese') {
                if (line.startsWith('クライアント:')) {
                    workInfo.japanese.client = line.replace('クライアント:', '').trim();
                } else if (line.startsWith('作品名:')) {
                    workInfo.japanese.title = line.replace('作品名:', '').trim();
                } else if (line.startsWith('役割:')) {
                    workInfo.japanese.role = line.replace('役割:', '').trim();
                } else if (line.startsWith('紹介文:')) {
                    workInfo.japanese.description = line.replace('紹介文:', '').trim();
                }
            } else if (currentSection === 'english') {
                if (line.startsWith('Client:')) {
                    workInfo.english.client = line.replace('Client:', '').trim();
                } else if (line.startsWith('Title:')) {
                    workInfo.english.title = line.replace('Title:', '').trim();
                } else if (line.startsWith('Role:')) {
                    workInfo.english.role = line.replace('Role:', '').trim();
                } else if (line.startsWith('Description:')) {
                    workInfo.english.description = line.replace('Description:', '').trim();
                }
            }
        }

        return workInfo;
    }

    // 現在の言語に応じた作品情報を取得
    getWorkInfoForCurrentLanguage(workInfo) {
        const lang = this.currentLanguage;
        const source = lang === 'ja' ? workInfo.japanese : workInfo.english;

        return {
            id: workInfo.id,
            priority: workInfo.priority,
            client: source.client,
            title: source.title,
            role: source.role,
            tags: workInfo.tags, // タグは共通セクションから（日本語で統一）
            description: source.description
        };
    }
}

// グローバルインスタンス
window.languageManager = new LanguageManager();
