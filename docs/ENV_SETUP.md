# 環境変数設定ガイド

このプロジェクトでは、ローカル開発環境と本番環境での動作を切り替えるために環境変数を使用しています。

## 環境変数の概要

主な環境変数：

- `VITE_API_URL` - バックエンド API のベース URL

## ローカル開発環境での設定

1. プロジェクトのルートディレクトリに `.env.local` ファイルを作成します。

```
VITE_API_URL=http://localhost:3000
```

2. 開発サーバーを起動します。

```bash
npm run dev
```

3. 環境変数の値は `import.meta.env.VITE_API_URL` でアクセスできます。

## 本番環境(Vercel)での設定

1. Vercel のダッシュボードにログインします。
2. 該当するプロジェクトを選択します。
3. 「Settings」→「Environment Variables」を選択します。
4. 以下の環境変数を追加します：
   - 名前: `VITE_API_URL`
   - 値: 本番環境の API エンドポイント（例: `https://api.example.com`）
5. 「Save」をクリックして保存します。
6. 環境変数を反映させるために、プロジェクトを再デプロイします。

## フォールバック機能

`frontend/src/utils/api.js` には環境変数が存在しない場合のフォールバック機能が実装されています：

```javascript
const getApiBaseUrl = () => {
  // 環境変数が設定されていればそれを使用
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL;
  }

  // 環境変数がない場合は現在のウィンドウのホスト名を使用（開発環境用）
  const host = window.location.hostname;
  const port = "3000"; // APIのポートは固定
  return `${window.location.protocol}//${host}:${port}`;
};
```

これにより、環境変数が設定されていない場合でも、現在のホスト名を使用して API のベース URL を動的に生成します。
