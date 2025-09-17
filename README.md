# Shohei Yamaguchi Portfolio

シンプルでモダンなポートフォリオサイトです。JSONファイルで作品を管理できるため、簡単に更新できます。

## ファイル構成

```
portfolio/
├── index.html          # メインページ
├── style.css           # スタイルシート
├── script.js           # JavaScript
├── data/
│   └── works.json      # 作品データ
└── images/             # 作品画像フォルダ
```

## 作品の追加・編集方法

### 1. 画像の追加
`images/` フォルダに作品画像を追加してください。

### 2. 作品データの編集
`data/works.json` ファイルを編集して作品情報を更新します。

#### 作品データの構造
```json
{
  "id": 1,                                    // 作品ID（重複不可）
  "title": "作品タイトル",                     // 作品名
  "client": "クライアント名",                 // クライアント企業名
  "description": "作品の詳細説明...",          // 作品の説明
  "category": "Web",                          // カテゴリ（Web, UI, Logo, Graphic, Illustration, Other）
  "role": "UI/UX Design",                     // 担当分野
  "images": ["work1-1.jpg", "work1-2.jpg"],  // 画像ファイル名の配列
  "featured": true                            // おすすめ作品かどうか
}
```

#### カテゴリ一覧
- `Web` - Webサイト
- `UI` - UIデザイン
- `Logo` - ロゴデザイン
- `Graphic` - グラフィックデザイン
- `Illustration` - イラストレーション
- `Other` - その他

### 3. 新しい作品の追加例
```json
{
  "id": 11,
  "title": "New Project",
  "client": "Client Company",
  "description": "Project description...",
  "category": "Web",
  "role": "Web Design",
  "images": ["new-work-1.jpg", "new-work-2.jpg"],
  "featured": true
}
```

## 機能

- レスポンシブデザイン（モバイル・タブレット・デスクトップ対応）
- カテゴリフィルター機能
- スクロール時のフェードインアニメーション
- 作品詳細モーダル
- スムーススクロールナビゲーション

## カスタマイズ

### 連絡先情報の変更
`index.html` の以下の部分を編集してください：
- メールアドレス
- Twitterリンク
- Noteリンク

### デザインの調整
`style.css` を編集してデザインをカスタマイズできます。

## 注意事項

- 画像ファイル名は英数字とハイフンのみ使用してください
- JSONファイルの編集時は、カンマや括弧の記述ミスに注意してください
- 作品IDは重複しないようにしてください
