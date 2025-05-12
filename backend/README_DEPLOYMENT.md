# Render への Rails バックエンドデプロイ手順

## 1. デプロイに必要なファイル

- `Procfile` - バックエンドディレクトリに配置済み
- `render.yaml` - プロジェクトルートに配置済み

## 2. Render アカウント設定

1. [Render.com](https://render.com) にアクセスしてサインアップ
2. GitHub と連携し、リポジトリへのアクセスを許可

## 3. デプロイ手順

1. GitHub リポジトリにコードをプッシュ
2. Render ダッシュボードで「New Web Service」をクリック
3. 連携した GitHub リポジトリを選択
4. 以下の設定を行う:
   - Name: `duel-practice-api` (またはお好みの名前)
   - Root Directory: `backend`
   - Environment: `Ruby`
   - Build Command: `bundle install && bundle exec rails db:migrate`
   - Start Command: `bundle exec rails s -p 3000 -b 0.0.0.0`

## 4. 環境変数の設定

Render ダッシュボードの「Environment」タブで以下の環境変数を設定:

- `RAILS_MASTER_KEY`: `backend/config/master.key`ファイルの内容をコピー
- `RAILS_ENV`: `production`

## 5. データベースの設定

Render ダッシュボードで「New PostgreSQL」をクリックし、データベースを作成:

- Name: `duel-practice-db`
- Database: 自動設定されるので変更不要
- User: 自動設定されるので変更不要

作成後、データベースの接続情報を確認し、Web Service の環境変数に`DATABASE_URL`として追加されていることを確認

## 6. フロントエンド(Vercel)の環境変数設定

Vercel ダッシュボードで以下の環境変数を設定:

- `VITE_API_URL`: `https://duel-practice-api.onrender.com` (実際の Render のアプリ URL)

## 7. 注意事項

- 初回デプロイ後、データベースのマイグレーションが実行されるのを待つ
- CORS の設定が正しいか確認する（特にフロントエンドの URL が許可されているか）
- API リクエストで認証が必要な場合、適切な認証情報を設定
