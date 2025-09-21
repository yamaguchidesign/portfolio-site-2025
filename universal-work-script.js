// 汎用的な作品ページ用スクリプト
// URLパラメータまたはページ名から作品IDを自動判定

document.addEventListener('DOMContentLoaded', async function () {
    console.log('汎用作品ページスクリプトが読み込まれました');

    // 作品IDを取得
    const workId = getWorkIdFromPage();
    console.log('検出された作品ID:', workId);

    if (!workId) {
        console.error('作品IDを特定できませんでした');
        displayErrorMessage();
        return;
    }

    // TxtWorkReaderのインスタンスを作成
    const txtReader = new TxtWorkReader();

    try {
        // 作品データを読み込んで表示
        const workData = await txtReader.loadAndDisplayWork(workId);

        if (workData) {
            console.log('作品データが正常に読み込まれました:', workData);

            // 画像も動的に読み込み
            await loadWorkImages(workId);

        } else {
            console.error('作品データの読み込みに失敗しました');
            displayErrorMessage();
        }

    } catch (error) {
        console.error('初期化エラー:', error);
        displayErrorMessage();
    }
});

// ページ名またはURLから作品IDを取得
function getWorkIdFromPage() {
    // URLパラメータから取得を試行
    const urlParams = new URLSearchParams(window.location.search);
    const workIdFromParam = urlParams.get('workId');
    if (workIdFromParam) {
        return parseInt(workIdFromParam);
    }

    // ページ名から取得を試行
    const pageName = window.location.pathname.split('/').pop();

    // work1.html, work2.html などの形式の場合
    const workMatch = pageName.match(/work(\d+)\.html/);
    if (workMatch) {
        return parseInt(workMatch[1]);
    }

    // work.html?workId=1 などの形式の場合（既存のwork.html用）
    if (pageName === 'work.html') {
        return parseInt(urlParams.get('workId')) || 1;
    }

    return null;
}

// 作品画像を動的に読み込む
async function loadWorkImages(workId) {
    const imagesContainer = document.querySelector('.work-images');
    if (!imagesContainer) return;

    // 画像ファイルのリストを取得
    const imageFiles = await getImageFiles(workId);

    if (imageFiles.length === 0) {
        imagesContainer.innerHTML = '<p>画像が見つかりませんでした。</p>';
        return;
    }

    // 画像を表示
    imagesContainer.innerHTML = '';
    imageFiles.forEach((imageFile, index) => {
        const imgElement = document.createElement('img');
        imgElement.src = `images/works-${workId}/${imageFile}`;
        imgElement.alt = `作品画像 ${index + 1}`;
        imgElement.loading = 'lazy';

        // 画像読み込みエラーの処理
        imgElement.onerror = function () {
            console.warn(`画像の読み込みに失敗しました: images/works-${workId}/${imageFile}`);
            this.style.display = 'none';
        };

        // 画像読み込み成功の処理
        imgElement.onload = function () {
            console.log(`画像の読み込みに成功しました: images/works-${workId}/${imageFile}`);
        };

        imagesContainer.appendChild(imgElement);
    });
}

// 指定されたworksフォルダの画像ファイルを取得
async function getImageFiles(workId) {
    const imageFiles = [];
    const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'];

    // 連続する404エラーを避けるため、最初の数個のファイルが見つからない場合は早期終了
    let consecutiveNotFound = 0;
    const maxConsecutiveNotFound = 3;

    // 画像ファイルを順番にチェック（1.jpg, 2.jpg, 3.jpg...）
    for (let i = 1; i <= 10; i++) {
        let foundForThisNumber = false;

        for (let ext of imageExtensions) {
            const filename = `${i}.${ext}`;
            try {
                const response = await fetch(`images/works-${workId}/${filename}`, { method: 'HEAD' });
                if (response.ok) {
                    imageFiles.push(filename);
                    foundForThisNumber = true;
                    consecutiveNotFound = 0; // リセット
                    break; // 同じ番号の画像が見つかったら次の番号へ
                }
            } catch (error) {
                // ファイルが存在しない場合は無視
            }
        }

        if (!foundForThisNumber) {
            consecutiveNotFound++;
            // 連続してファイルが見つからない場合、早期終了
            if (consecutiveNotFound >= maxConsecutiveNotFound) {
                console.log(`作品 ${workId}: 連続${consecutiveNotFound}回ファイルが見つからないため、検索を終了`);
                break;
            }
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
                    const response = await fetch(`images/works-${workId}/${filename}`, { method: 'HEAD' });
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
                    console.log(`作品 ${workId}: 連続${consecutiveNotFound}回ファイルが見つからないため、検索を終了`);
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

    console.log(`作品 ${workId}: ${imageFiles.length}個の画像ファイルを発見:`, imageFiles);
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

// 利用可能な作品一覧を取得する関数
async function getAvailableWorks() {
    const txtReader = new TxtWorkReader();
    const workIds = await txtReader.getAvailableWorkIds();
    const works = [];

    for (let workId of workIds) {
        try {
            const workData = await txtReader.loadWorkFromTxt(workId);
            if (workData) {
                works.push({
                    id: workId,
                    ...workData
                });
            }
        } catch (error) {
            console.warn(`作品 ${workId} の読み込みに失敗:`, error);
        }
    }

    return works;
}

// グローバルに利用可能にする
window.getAvailableWorks = getAvailableWorks;
