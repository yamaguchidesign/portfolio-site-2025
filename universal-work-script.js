// 汎用的な作品ページ用スクリプト
// URLパラメータから作品IDを取得して動的に読み込み

document.addEventListener('DOMContentLoaded', async function () {
    // 作品IDを取得
    const workId = getWorkIdFromPage();

    if (!workId) {
        console.error('作品IDを特定できませんでした');
        displayErrorMessage();
        return;
    }

    try {
        // 作品データを動的に読み込んで表示
        const workData = await loadWorkData(workId);

        if (workData) {
            console.log('作品データが正常に読み込まれました:', workData);
            renderWorkPage(workData);
            // 画像も動的に読み込み
            await loadWorkImages(workId, workData.folderName);
        } else {
            console.error('作品データの読み込みに失敗しました');
            displayErrorMessage();
        }

    } catch (error) {
        console.error('初期化エラー:', error);
        displayErrorMessage();
    }

    // 言語変更イベントをリッスン
    document.addEventListener('languageChanged', async (event) => {
        console.log('言語が変更されました。作品ページを再読み込みします。', event.detail);
        try {
            const workData = await loadWorkData(workId);
            if (workData) {
                // 言語マネージャーが利用可能な場合は、言語別データを取得
                if (window.languageManager) {
                    const folderName = await getFolderNameFromWorkId(workId);
                    if (folderName) {
                        const response = await fetch(`images/${folderName}/0.txt`);
                        if (response.ok) {
                            const txtContent = await response.text();
                            const parsedData = window.languageManager.parseWorkTextWithLanguage(txtContent);
                            const languageData = window.languageManager.getWorkInfoForCurrentLanguage(parsedData);

                            // 言語別データで作品情報を更新
                            workData.title = languageData.title || workData.title;
                            workData.client = languageData.client || workData.client;
                            workData.description = languageData.description || workData.description;
                            workData.tags = languageData.tags || workData.tags;
                        }
                    }
                }
                renderWorkPage(workData);
            }
        } catch (error) {
            console.error('言語変更後の再読み込みエラー:', error);
        }
    });
});

// URLパラメータから作品IDを取得
function getWorkIdFromPage() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// 作品データを動的に読み込み
async function loadWorkData(workId) {
    try {
        // フォルダ名を取得
        const folderName = await getFolderNameFromWorkId(workId);
        if (!folderName) {
            console.error('フォルダ名が見つかりません:', workId);
            return null;
        }

        // 0.txtファイルを読み込み
        const response = await fetch(`images/${folderName}/0.txt`);
        if (!response.ok) {
            console.error('0.txtファイルの読み込みに失敗:', response.status);
            return null;
        }

        const text = await response.text();
        const workData = parseWorkText(text);
        workData.id = workId;
        workData.folderName = folderName;

        return workData;
    } catch (error) {
        console.error('作品データの読み込みエラー:', error);
        return null;
    }
}

// 作品IDからフォルダ名を取得
async function getFolderNameFromWorkId(workId) {
    try {
        const response = await fetch('images/');
        if (!response.ok) return null;

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a[href]');

        for (let link of links) {
            const href = link.getAttribute('href');
            if (href && href.startsWith('works-') && href.endsWith('/')) {
                const folderName = href.slice(0, -1); // 末尾の/を削除

                // このフォルダの0.txtをチェックしてIDを確認
                try {
                    const txtResponse = await fetch(`images/${folderName}/0.txt`);
                    if (txtResponse.ok) {
                        const txtText = await txtResponse.text();
                        const lines = txtText.split('\n');
                        for (let line of lines) {
                            if (line.startsWith('ID:')) {
                                const id = line.replace('ID:', '').trim();
                                if (id === workId) {
                                    return folderName;
                                }
                            }
                        }
                    }
                } catch (e) {
                    // エラーは無視して次のフォルダをチェック
                }
            }
        }
        return null;
    } catch (error) {
        console.error('フォルダ名の取得エラー:', error);
        return null;
    }
}

// 0.txtファイルをパース
function parseWorkText(text) {
    const lines = text.split('\n');
    const work = {
        client: '',
        title: '',
        tags: [],
        description: '',
        role: '',
        images: []
    };

    let currentSection = '';

    for (let line of lines) {
        line = line.trim();
        if (!line) continue;

        // コロンで始まる行をチェック
        if (line.startsWith('クライアント:')) {
            work.client = line.replace('クライアント:', '').trim();
        } else if (line.startsWith('作品名:')) {
            work.title = line.replace('作品名:', '').trim();
        } else if (line.startsWith('タグ:')) {
            const tagsStr = line.replace('タグ:', '').trim();
            work.tags = tagsStr.split(',').map(tag => tag.trim());
        } else if (line.startsWith('紹介文:')) {
            work.description = line.replace('紹介文:', '').trim();
        } else if (line.startsWith('役割:')) {
            work.role = line.replace('役割:', '').trim();
        } else if (line.startsWith('ID:')) {
            // IDは別途処理
        } else if (currentSection === 'description' && work.description) {
            // 紹介文の続き
            work.description += ' ' + line;
        }
    }

    work.description = work.description.trim();
    return work;
}

// 作品ページをレンダリング
function renderWorkPage(work) {

    // ページタイトルを更新
    document.title = `${work.title} - Shohei Yamaguchi`;

    // 作品タイトルを更新
    const titleElement = document.querySelector('.work-title');
    if (titleElement) {
        titleElement.textContent = work.title;
    }

    // クライアントを更新
    const clientElement = document.querySelector('.work-client');
    if (clientElement) {
        clientElement.textContent = work.client;
    }

    // ロールを更新
    const roleElement = document.querySelector('.work-role');
    if (roleElement) {
        // 役割に応じたツールチップ文言を設定
        let tooltipText = '';
        switch (work.role) {
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

        roleElement.innerHTML = `role: <span class="tooltip">${work.role}<span class="tooltiptext">${tooltipText}</span></span>`;
    }

    // タグを更新
    const tagsElement = document.querySelector('.work-tags');
    if (tagsElement && work.tags) {
        const tags = Array.isArray(work.tags) ? work.tags : [work.tags];
        tagsElement.innerHTML = tags.map(tag =>
            `<span class="work-tag tag-btn">${tag}</span>`
        ).join('');
    }

    // 説明を更新
    const descriptionElement = document.querySelector('.work-description');
    if (descriptionElement) {
        descriptionElement.innerHTML = `<p>${work.description}</p>`;
    }
}

// 作品画像を動的に読み込む
async function loadWorkImages(workId, folderName) {
    const imagesContainer = document.querySelector('.work-images');
    if (!imagesContainer) return;

    // 画像ファイルのリストを取得
    const imageFiles = await getImageFiles(folderName);

    if (imageFiles.length === 0) {
        imagesContainer.innerHTML = '<p>画像が見つかりませんでした。</p>';
        return;
    }

    // 画像を表示
    imagesContainer.innerHTML = '';
    imageFiles.forEach((imageFile, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = `images/${folderName}/${imageFile}`;
        imgElement.alt = `作品画像 ${index + 1}`;
        imgElement.className = 'work-image';
        imgElement.loading = 'lazy';

        // 画像読み込みエラーの処理
        imgElement.onerror = function () {
            console.warn(`画像の読み込みに失敗しました: images/${folderName}/${imageFile}`);
            this.style.display = 'none';
        };

        // 画像読み込み成功の処理
        imgElement.onload = function () {
            console.log(`画像の読み込みに成功しました: images/${folderName}/${imageFile}`);
        };

        imagesContainer.appendChild(imgElement);
    });
}

// 指定されたフォルダの画像ファイルを取得
async function getImageFiles(folderName) {
    const imageFiles = [];
    // PNGを最初に、JPGを次に探す順序に変更
    const imageExtensions = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'svg'];

    // 画像ファイルを順番にチェック（01.png, 02.png... または 1.png, 2.png...）
    for (let i = 1; i <= 10; i++) {
        let foundForThisNumber = false;

        // まず2桁の形式（01, 02...）をチェック
        for (let ext of imageExtensions) {
            const filename = `${String(i).padStart(2, '0')}.${ext}`;
            try {
                const response = await fetch(`images/${folderName}/${filename}`, { method: 'HEAD' });
                if (response.ok) {
                    imageFiles.push(filename);
                    foundForThisNumber = true;
                    break; // 同じ番号の画像が見つかったら次の番号へ
                }
            } catch (error) {
                // ファイルが存在しない場合は無視
            }
        }

        // 2桁の形式で見つからない場合は1桁の形式（1, 2...）をチェック
        if (!foundForThisNumber) {
            for (let ext of imageExtensions) {
                const filename = `${i}.${ext}`;
                try {
                    const response = await fetch(`images/${folderName}/${filename}`, { method: 'HEAD' });
                    if (response.ok) {
                        imageFiles.push(filename);
                        foundForThisNumber = true;
                        break; // 同じ番号の画像が見つかったら次の番号へ
                    }
                } catch (error) {
                    // ファイルが存在しない場合は無視
                }
            }
        }

        // この番号のファイルが見つからない場合、以降の番号は探さない
        if (!foundForThisNumber) {
            break;
        }
    }

    // 01.png, 02.png などの形式もチェック（既にファイルが見つかっている場合のみ）
    if (imageFiles.length === 0) {
        consecutiveNotFound = 0;
        for (let i = 1; i <= 10; i++) {
            let foundForThisNumber = false;

            for (let ext of imageExtensions) {
                const filename = `${String(i).padStart(2, '0')}.${ext}`;
                try {
                    const response = await fetch(`images/${folderName}/${filename}`, { method: 'HEAD' });
                    if (response.ok) {
                        imageFiles.push(filename);
                        foundForThisNumber = true;
                        consecutiveNotFound = 0;
                        break;
                    }
                } catch (error) {
                    // ファイルが存在しない場合は無視
                }
            }

            if (!foundForThisNumber) {
                consecutiveNotFound++;
                if (consecutiveNotFound >= maxConsecutiveNotFound) {
                    console.log(`フォルダ ${folderName}: 連続${consecutiveNotFound}回ファイルが見つからないため、検索を終了`);
                    break;
                }
            }
        }
    }

    // ファイル名でソート（数値順）
    imageFiles.sort((a, b) => {
        const numA = parseInt(a.match(/\d+/)[0]);
        const numB = parseInt(b.match(/\d+/)[0]);
        return numA - numB;
    });

    return imageFiles;
}

// エラーメッセージを表示
function displayErrorMessage() {
    const container = document.querySelector('.work-detail .container');
    if (!container) return;

    container.innerHTML = `
        <div class="work-header">
            <p class="work-client">エラー</p>
            <h1 class="work-title">作品情報の読み込みに失敗しました</h1>
            <div class="work-meta">
                <p class="work-role">システムエラー</p>
                <div class="work-tags"></div>
            </div>
        </div>
        <div class="work-description">
            <p>作品情報を読み込むことができませんでした。ファイルが存在するか確認してください。</p>
        </div>
    `;
}

