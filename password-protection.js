// パスワード保護機能
// このファイルを削除するか、enablePasswordProtection を false にするとパスワード保護が無効になります

const passwordConfig = {
    // パスワード保護を有効にするかどうか
    enablePasswordProtection: true,

    // パスワード（変更してください）
    password: "ymgc",

    // パスワード入力画面のスタイル
    styles: `
        .password-overlay {
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: #ffffff;
            z-index: 9999;
            display: flex;
            align-items: center;
            justify-content: center;
            font-family: 'Satoshi', -apple-system, BlinkMacSystemFont, sans-serif;
        }
        
        .password-container {
            text-align: center;
            max-width: 400px;
            padding: 40px;
            background: #fff;
            border: 1px solid #eee;
            border-radius: 8px;
            box-shadow: 0 4px 20px rgba(0, 0, 0, 0.1);
        }
        
        
        .password-input {
            width: 100%;
            padding: 12px 16px;
            border: 1px solid #ddd;
            border-radius: 4px;
            font-size: 16px;
            margin-bottom: 16px;
            box-sizing: border-box;
        }
        
        .password-input:focus {
            outline: none;
            border-color: #000;
        }
        
        .password-button {
            width: 100%;
            padding: 12px 24px;
            background: #000;
            color: #fff;
            border: none;
            border-radius: 4px;
            font-size: 16px;
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .password-button:hover {
            background: #333;
        }
        
        .password-error {
            color: #e74c3c;
            font-size: 14px;
            margin-top: 12px;
            display: none;
        }
    `
};

function initPasswordProtection() {
    // パスワード保護が無効の場合は何もしない
    if (!passwordConfig.enablePasswordProtection) {
        return;
    }

    // 既にパスワードが入力済みかチェック
    const isAuthenticated = sessionStorage.getItem('portfolio_authenticated') === 'true';
    if (isAuthenticated) {
        return;
    }

    // スタイルを追加
    const styleElement = document.createElement('style');
    styleElement.textContent = passwordConfig.styles;
    document.head.appendChild(styleElement);

    // パスワード入力画面を作成
    const overlay = document.createElement('div');
    overlay.className = 'password-overlay';
    overlay.innerHTML = `
        <div class="password-container">
            <input type="password" class="password-input" placeholder="パスワードを入力" id="passwordInput">
            <button class="password-button" id="passwordSubmit">アクセス</button>
            <div class="password-error" id="passwordError">パスワードが正しくありません</div>
        </div>
    `;

    document.body.appendChild(overlay);

    // イベントリスナーを追加
    const passwordInput = document.getElementById('passwordInput');
    const passwordSubmit = document.getElementById('passwordSubmit');
    const passwordError = document.getElementById('passwordError');

    function checkPassword() {
        const enteredPassword = passwordInput.value;

        if (enteredPassword === passwordConfig.password) {
            // パスワード正解
            sessionStorage.setItem('portfolio_authenticated', 'true');
            overlay.remove();
        } else {
            // パスワード不正解
            passwordError.style.display = 'block';
            passwordInput.value = '';
            passwordInput.focus();

            // エラーメッセージを3秒後に非表示
            setTimeout(() => {
                passwordError.style.display = 'none';
            }, 3000);
        }
    }

    passwordSubmit.addEventListener('click', checkPassword);
    passwordInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            checkPassword();
        }
    });

    // 初期フォーカス
    setTimeout(() => {
        passwordInput.focus();
    }, 100);
}

// DOMが読み込まれたら実行
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initPasswordProtection);
} else {
    initPasswordProtection();
}
