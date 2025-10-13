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
                updateUITexts(); // ボタンテキストも更新
            }
        } catch (error) {
            console.error('言語変更後の再読み込みエラー:', error);
        }
    });

    // エクスポート機能の初期化
    initExportFunctionality();

    // 初回表示時にもUIテキストを更新
    updateUITexts();
});

// UIテキストを言語に応じて更新
function updateUITexts() {
    const currentLang = window.languageManager ? window.languageManager.getCurrentLanguage() : 'ja';

    const texts = {
        downloadBtn: {
            ja: '実績資料をダウンロードする',
            en: 'Download Work Material'
        },
        modalTitle: {
            ja: '実績画像プレビュー',
            en: 'Work Image Preview'
        },
        downloadAgainBtn: {
            ja: '実績資料をダウンロード(PNG)',
            en: 'Download Work Material (PNG)'
        },
        closeBtn: {
            ja: '閉じる',
            en: 'Close'
        }
    };

    // ダウンロードボタン
    const downloadBtn = document.getElementById('download-work-png');
    if (downloadBtn) {
        downloadBtn.textContent = texts.downloadBtn[currentLang];
    }

    // モーダルタイトル
    const modalTitle = document.querySelector('.export-modal-header h3');
    if (modalTitle) {
        modalTitle.textContent = texts.modalTitle[currentLang];
    }

    // モーダル内ダウンロードボタン
    const downloadAgainBtn = document.getElementById('download-again-btn');
    if (downloadAgainBtn) {
        downloadAgainBtn.textContent = texts.downloadAgainBtn[currentLang];
    }

    // 閉じるボタン
    const closeModalBtn = document.getElementById('close-modal-btn');
    if (closeModalBtn) {
        closeModalBtn.textContent = texts.closeBtn[currentLang];
    }
}

// URLパラメータから作品IDを取得
function getWorkIdFromPage() {
    const urlParams = new URLSearchParams(window.location.search);
    return urlParams.get('id');
}

// 画像URLを取得
async function getImageUrls(folderName) {
    try {
        const response = await fetch(`images/${folderName}/`);
        if (!response.ok) {
            console.error('画像フォルダの読み込みに失敗:', response.status);
            return [];
        }

        const html = await response.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const links = doc.querySelectorAll('a[href]');

        const imageUrls = [];
        links.forEach(link => {
            const href = link.getAttribute('href');
            if (href && /\.(png|jpg|jpeg|gif|webp|svg)$/i.test(href)) {
                imageUrls.push(`images/${folderName}/${href}`);
            }
        });

        return imageUrls;
    } catch (error) {
        console.error('画像URL取得エラー:', error);
        return [];
    }
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

        // 言語マネージャーが利用可能な場合は、言語別データを取得
        let workData;
        if (window.languageManager) {
            const parsedData = window.languageManager.parseWorkTextWithLanguage(text);
            workData = window.languageManager.getWorkInfoForCurrentLanguage(parsedData);
        } else {
            workData = parseWorkText(text);
        }

        workData.id = workId;
        workData.folderName = folderName;

        // 画像データを追加
        const imageUrls = await getImageUrls(folderName);
        workData.images = imageUrls;
        workData.loadedImages = imageUrls;

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

// Tag translations
const tagTranslations = {
    'ロゴ': 'Logo',
    'UI/UX': 'UI/UX',
    'ブランディング': 'Branding',
    'Web': 'Web',
    'キャラクターデザイン': 'Character Design',
    'パッケージ': 'Package',
    'イラストレーション': 'Illustration'
};

// 0.txtファイルをパース
function parseWorkText(text) {
    // 共通パーサーを使用
    const work = TxtWorkReader.parseWorkTextCommon(text);
    work.images = []; // 画像配列を追加
    return work;
}

// エクスポート機能の初期化
function initExportFunctionality() {
    // ダウンロードボタンのイベントリスナー
    const downloadBtn = document.getElementById('download-work-png');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', handleExportClick);
    }

    // モーダルのイベントリスナー
    const closeModalBtn = document.getElementById('close-export-modal');
    const closeModalBtn2 = document.getElementById('close-modal-btn');
    const downloadAgainBtn = document.getElementById('download-again-btn');

    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeExportModal);
    }
    if (closeModalBtn2) {
        closeModalBtn2.addEventListener('click', closeExportModal);
    }
    if (downloadAgainBtn) {
        downloadAgainBtn.addEventListener('click', downloadPNG);
    }

    // オーバーレイクリックでモーダルを閉じる
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal || e.target.classList.contains('export-modal-overlay')) {
                closeExportModal();
            }
        });
    }
}

// グローバル変数として現在の作品データとCanvasのDataURLを保存
let currentWorkData = null;
let currentDataUrl = null;

// エクスポートボタンクリック処理（プレビューのみ表示、ダウンロードはしない）
async function handleExportClick() {
    try {
        // 現在の作品データを取得
        const workId = getWorkIdFromPage();
        if (!workId) {
            alert('作品データが見つかりません。');
            return;
        }

        const workData = await loadWorkData(workId);
        if (!workData) {
            alert('作品データの読み込みに失敗しました。');
            return;
        }

        // 作品データを保存
        currentWorkData = workData;

        // モーダルを表示
        showExportModal();

        // 少し待機してからプレビュー生成（ダウンロードはしない）
        setTimeout(async () => {
            await generatePreview(workData);
        }, 100);

    } catch (error) {
        console.error('エクスポートエラー:', error);
        alert('エクスポートに失敗しました。');
    }
}


// モーダル表示
function showExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.style.display = 'block';
        document.body.style.overflow = 'hidden';
    }
}

// モーダルを閉じる
function closeExportModal() {
    const modal = document.getElementById('export-modal');
    if (modal) {
        modal.style.display = 'none';
        document.body.style.overflow = '';
    }
}


// 3枚用レイアウト描画関数
async function drawThreeImageLayout(ctx, images, padding, gridSpacing) {
    // 1枚目の画像（左側、大きめ）- 5:3アスペクト比
    const firstImageWidth = 1208;
    const firstImageHeight = 725; // 5:3のアスペクト比
    const firstImageX = padding;
    const firstImageY = 1080 - padding - firstImageHeight; // 画面下端に配置

    // 右側の画像用スペース計算（縦並び）
    const rightImagesX = firstImageX + firstImageWidth + gridSpacing; // 1枚目の右側
    const rightImagesWidth = 1920 - padding - rightImagesX; // 残りの幅
    const rightImagesHeight = firstImageHeight; // 1枚目と同じ高さ
    const rightImageWidth = rightImagesWidth; // 右側の画像幅
    const rightImageHeight = Math.floor((rightImagesHeight - gridSpacing) / 2); // 2枚で縦に分割

    for (let i = 0; i < Math.min(images.length, 3); i++) {
        try {
            const img = new Image();

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    if (i === 0) {
                        // 1枚目：左側に大きく配置
                        const imgAspectRatio = img.width / img.height;
                        const targetAspectRatio = firstImageWidth / firstImageHeight;

                        let sourceX, sourceY, sourceWidth, sourceHeight;

                        if (imgAspectRatio > targetAspectRatio) {
                            // 画像が横長：上下をクロップ
                            sourceHeight = img.height;
                            sourceWidth = img.height * targetAspectRatio;
                            sourceX = (img.width - sourceWidth) / 2;
                            sourceY = 0;
                        } else {
                            // 画像が縦長：左右をクロップ
                            sourceWidth = img.width;
                            sourceHeight = img.width / targetAspectRatio;
                            sourceX = 0;
                            sourceY = (img.height - sourceHeight) / 2;
                        }

                        ctx.drawImage(
                            img,
                            sourceX, sourceY, sourceWidth, sourceHeight,
                            firstImageX, firstImageY, firstImageWidth, firstImageHeight
                        );
                    } else {
                        // 2-3枚目：右側に縦並びで配置
                        const x = rightImagesX;
                        const y = firstImageY + ((i - 1) * (rightImageHeight + gridSpacing));

                        // 画像をcover表示
                        const imgAspectRatio = img.width / img.height;
                        const targetAspectRatio = rightImageWidth / rightImageHeight;

                        let sourceX, sourceY, sourceWidth, sourceHeight;

                        if (imgAspectRatio > targetAspectRatio) {
                            sourceHeight = img.height;
                            sourceWidth = img.height * targetAspectRatio;
                            sourceX = (img.width - sourceWidth) / 2;
                            sourceY = 0;
                        } else {
                            sourceWidth = img.width;
                            sourceHeight = img.width / targetAspectRatio;
                            sourceX = 0;
                            sourceY = (img.height - sourceHeight) / 2;
                        }

                        ctx.drawImage(
                            img,
                            sourceX, sourceY, sourceWidth, sourceHeight,
                            x, y, rightImageWidth, rightImageHeight
                        );
                    }
                    resolve();
                };
                img.onerror = reject;
                img.src = images[i];
            });
        } catch (error) {
            console.warn(`画像 ${i + 1} の読み込みに失敗:`, error);
        }
    }
}

// 5枚用レイアウト描画関数（既存のロジック）
async function drawFiveImageLayout(ctx, images, padding, gridSpacing, imageCount) {
    // 1枚目の画像（4:3アスペクト比、幅967px）
    const firstImageWidth = 967;
    const firstImageHeight = Math.round(firstImageWidth * 3 / 4); // 4:3のアスペクト比
    const firstImageX = padding;
    const firstImageY = 1080 - padding - firstImageHeight; // 画面下端に配置

    // 右側の画像用スペース計算（2×2グリッド、16px間隔）
    const rightImagesX = firstImageX + firstImageWidth + gridSpacing; // 1枚目の右側
    const rightImagesWidth = 1920 - padding - rightImagesX; // 残りの幅
    const rightImagesHeight = firstImageHeight; // 1枚目と同じ高さ
    const gridImageWidth = Math.floor((rightImagesWidth - gridSpacing) / 2); // 2列、スペースを考慮
    const gridImageHeight = Math.floor((rightImagesHeight - gridSpacing) / 2); // 2行、スペースを考慮

    for (let i = 0; i < imageCount; i++) {
        try {
            const img = new Image();

            await new Promise((resolve, reject) => {
                img.onload = () => {
                    if (i === 0) {
                        // 1枚目：5:3アスペクト比で左端に配置
                        const imgAspectRatio = img.width / img.height;
                        const targetAspectRatio = firstImageWidth / firstImageHeight;

                        let sourceX, sourceY, sourceWidth, sourceHeight;

                        if (imgAspectRatio > targetAspectRatio) {
                            // 画像が横長：上下をクロップ
                            sourceHeight = img.height;
                            sourceWidth = img.height * targetAspectRatio;
                            sourceX = (img.width - sourceWidth) / 2;
                            sourceY = 0;
                        } else {
                            // 画像が縦長：左右をクロップ
                            sourceWidth = img.width;
                            sourceHeight = img.width / targetAspectRatio;
                            sourceX = 0;
                            sourceY = (img.height - sourceHeight) / 2;
                        }

                        ctx.drawImage(
                            img,
                            sourceX, sourceY, sourceWidth, sourceHeight,
                            firstImageX, firstImageY, firstImageWidth, firstImageHeight
                        );
                    } else {
                        // 2枚目以降：Zの字順で2×2グリッドに配置
                        // ②③
                        // ④⑤
                        const gridIndex = i - 1; // 0, 1, 2, 3
                        const col = gridIndex % 2; // 0, 1, 0, 1
                        const row = Math.floor(gridIndex / 2); // 0, 0, 1, 1

                        const x = rightImagesX + (col * (gridImageWidth + gridSpacing));
                        const y = firstImageY + (row * (gridImageHeight + gridSpacing));

                        // 画像をcover表示
                        const imgAspectRatio = img.width / img.height;
                        const targetAspectRatio = gridImageWidth / gridImageHeight;

                        let sourceX, sourceY, sourceWidth, sourceHeight;

                        if (imgAspectRatio > targetAspectRatio) {
                            sourceHeight = img.height;
                            sourceWidth = img.height * targetAspectRatio;
                            sourceX = (img.width - sourceWidth) / 2;
                            sourceY = 0;
                        } else {
                            sourceWidth = img.width;
                            sourceHeight = img.width / targetAspectRatio;
                            sourceX = 0;
                            sourceY = (img.height - sourceHeight) / 2;
                        }

                        ctx.drawImage(
                            img,
                            sourceX, sourceY, sourceWidth, sourceHeight,
                            x, y, gridImageWidth, gridImageHeight
                        );
                    }
                    resolve();
                };
                img.onerror = reject;
                img.src = images[i];
            });
        } catch (error) {
            console.warn(`画像 ${i + 1} の読み込みに失敗:`, error);
        }
    }
}

// プレビュー生成関数（ダウンロードはしない）
async function generatePreview(workData) {
    try {
        // Canvas要素を作成
        const canvas = document.createElement('canvas');
        canvas.width = 1920;
        canvas.height = 1080;
        const ctx = canvas.getContext('2d');

        // 背景を白で塗りつぶし
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, 1920, 1080);

        // テキスト情報を準備
        const title = workData.title ? workData.title.substring(0, 50) : 'タイトルなし';
        const client = workData.client || 'クライアント名なし';
        const description = workData.description || '説明がありません。';

        // レイアウト設定
        const padding = 56;
        const contentWidth = 1920 - (padding * 2);
        const contentHeight = 1080 - (padding * 2);

        // クライアント名描画（タイトルの上）
        ctx.font = '24px Arial, sans-serif';
        ctx.fillStyle = '#666666';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(client, padding, padding);

        // タイトル描画
        ctx.font = 'bold 40px Arial, sans-serif';
        ctx.fillStyle = '#333333';
        ctx.fillText(title, padding, padding + 40 + 12); // 上マージン8px追加

        // 説明文描画（複数行対応・文字単位折り返し）
        ctx.font = '24px Arial, sans-serif';
        ctx.fillStyle = '#333333';
        const lineHeight = 1.5 * 24;
        const maxWidth = contentWidth; // パディング内の最大幅（画像用スペースを削除）
        let y = padding + 100 + 16; // タイトル位置の調整に合わせて変更 + 上マージン8px
        const maxDescriptionHeight = 400; // 説明文の最大高さを拡張

        // 文字単位で折り返し処理
        let currentLine = '';
        for (let i = 0; i < description.length; i++) {
            const char = description[i];
            const testLine = currentLine + char;
            const metrics = ctx.measureText(testLine);

            if (metrics.width > maxWidth && currentLine.length > 0) {
                // 現在の行を描画して次の行へ
                ctx.fillText(currentLine, padding, y);
                currentLine = char;
                y += lineHeight;
                if (y > padding + maxDescriptionHeight) break; // 最大高さ制限
            } else {
                currentLine = testLine;
            }
        }

        // 最後の行を描画
        if (currentLine && y <= padding + maxDescriptionHeight) {
            ctx.fillText(currentLine, padding, y);
        }

        // 画像描画（枚数に応じてレイアウトを変更）
        const images = workData.loadedImages || workData.images || workData.imageUrls || [];

        if (images.length > 0) {
            const imageCount = Math.min(images.length, 5);
            const gridSpacing = 16; // 画像間のスペース

            if (imageCount === 3 || imageCount === 4) {
                // 3枚または4枚の場合：最初の3枚のみ使用して3枚レイアウト
                const threeImages = images.slice(0, 3);
                await drawThreeImageLayout(ctx, threeImages, padding, gridSpacing);
            } else {
                // 5枚用レイアウト（既存）
                await drawFiveImageLayout(ctx, images, padding, gridSpacing, imageCount);
            }
        }

        // CanvasをDataURLに変換
        const dataUrl = canvas.toDataURL('image/png');

        // グローバル変数に保存（後でダウンロード時に使用）
        currentDataUrl = dataUrl;

        // プレビュー画像を更新
        const preview = document.getElementById('export-preview');
        if (preview) {
            const img = document.createElement('img');
            img.src = dataUrl;
            img.alt = 'プレビュー';
            // CSSファイルのスタイルを使用（インラインスタイルは削除）

            preview.innerHTML = '';
            preview.appendChild(img);
        }

        // ダウンロードはしない

    } catch (error) {
        console.error('PNG生成エラー:', error);
        alert('画像の生成に失敗しました: ' + error.message);
    }
}

// 実際のダウンロード処理（モーダル内のボタンから呼ばれる）
function downloadPNG() {
    if (!currentDataUrl || !currentWorkData) {
        alert('プレビューデータがありません。');
        return;
    }

    try {
        // ダウンロード
        const link = document.createElement('a');
        link.download = `${currentWorkData.title || 'work'}.png`;
        link.href = currentDataUrl;
        link.click();
    } catch (error) {
        console.error('ダウンロードエラー:', error);
        alert('ダウンロードに失敗しました: ' + error.message);
    }
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
        const currentLang = window.languageManager ? window.languageManager.getCurrentLanguage() : 'ja';
        const tags = Array.isArray(work.tags) ? work.tags : [work.tags];
        tagsElement.innerHTML = tags.map(tag => {
            const displayTag = currentLang === 'en' && tagTranslations[tag] ? tagTranslations[tag] : tag;
            return `<span class="work-tag tag-btn">${displayTag}</span>`;
        }).join('');
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

    // 画像と動画を表示
    imagesContainer.innerHTML = '';
    imageFiles.forEach((mediaFile, index) => {
        const mediaPath = `images/${folderName}/${mediaFile}`;

        if (isVideo(mediaFile)) {
            // 動画の場合
            const videoElement = document.createElement('video');
            videoElement.src = mediaPath;
            videoElement.className = 'work-video';
            videoElement.controls = true;
            videoElement.autoplay = true;
            videoElement.loop = true;
            videoElement.muted = true;
            videoElement.playsInline = true;
            videoElement.setAttribute('playsinline', '');
            videoElement.setAttribute('preload', 'auto');

            // 動画読み込みエラーの処理
            videoElement.onerror = function () {
                this.style.display = 'none';
            };

            imagesContainer.appendChild(videoElement);
        } else {
            // 画像の場合
            const imgElement = document.createElement('img');
            imgElement.src = mediaPath;
            imgElement.alt = `作品画像 ${index + 1}`;
            imgElement.className = 'work-image';
            imgElement.loading = 'lazy';

            // 画像読み込みエラーの処理
            imgElement.onerror = function () {
                this.style.display = 'none';
            };

            imagesContainer.appendChild(imgElement);
        }
    });
}

// ファイルが動画かどうかを判定
function isVideo(filePath) {
    const videoExtensions = ['mp4', 'webm', 'mov'];
    const extension = filePath.split('.').pop().toLowerCase();
    return videoExtensions.includes(extension);
}

// 指定されたフォルダの画像ファイルを取得
async function getImageFiles(folderName) {
    const imageFiles = [];
    // WebPを最優先、動画も検索対象に
    const mediaExtensions = ['webp', 'png', 'jpg', 'jpeg', 'gif', 'svg', 'mp4', 'webm', 'mov'];

    // 画像ファイルを順番にチェック（01.png, 02.png... または 1.png, 2.png...）
    for (let i = 1; i <= 10; i++) {
        let foundForThisNumber = false;

        // まず2桁の形式（01, 02...）をチェック
        for (let ext of mediaExtensions) {
            const filename = `${String(i).padStart(2, '0')}.${ext}`;
            try {
                const response = await fetch(`images/${folderName}/${filename}`, { method: 'HEAD' });
                if (response.ok) {
                    imageFiles.push(filename);
                    foundForThisNumber = true;
                    break; // 同じ番号のファイルが見つかったら次の番号へ
                }
            } catch (error) {
                // ファイルが存在しない場合は無視
            }
        }

        // 2桁の形式で見つからない場合は1桁の形式（1, 2...）をチェック
        if (!foundForThisNumber) {
            for (let ext of mediaExtensions) {
                const filename = `${i}.${ext}`;
                try {
                    const response = await fetch(`images/${folderName}/${filename}`, { method: 'HEAD' });
                    if (response.ok) {
                        imageFiles.push(filename);
                        foundForThisNumber = true;
                        break; // 同じ番号のファイルが見つかったら次の番号へ
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

