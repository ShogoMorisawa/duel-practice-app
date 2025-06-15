# 🚚 Render から Supabase への PostgreSQL 移行記録

## 🎯 目的

Render 上で稼働している Ruby on Rails アプリケーションのバックエンド DB（PostgreSQL）を、Supabase 上の新しい PostgreSQL データベースへ完全に移行する。

移行プロセスは以下の 2 フェーズで実施：

1. データの移行（pg_dump / pg_restore）
2. アプリケーションの接続先変更（DATABASE_URL）

## ✅ 最終的な結果

- データ移行は完全に成功
- Render のデータを Supabase に正しくリストア
- Rails アプリは Supabase DB に接続し、正常に動作確認済み

## 🧭 実行プロセスと問題解決の全記録

### フェーズ 1：pg_dump による Render DB バックアップ

#### 🔧 pg_dump の準備

**問題**：Windows PowerShell 上で pg_dump が使えない。

**解決**：PostgreSQL の bin ディレクトリを PATH に追加。

#### 🔐 環境変数の管理

- `.env` を `load-env.ps1` で読み込み、安全に変数を渡す。

#### 🌐 DNS エラー（Render 接続）

**問題**：Name or service not known エラー。

**原因**：

- `.env` に内部ホスト名を指定していた
- DATABASE_URL を -h に渡していた

**解決**：ホスト名・ユーザー名・DB 名などを .env に明示的に設定。

**結果**：pg_dump による backup.dump 取得に成功。

### フェーズ 2：pg_restore による Supabase へのリストア

#### 🌐 再び DNS エラー（Supabase 接続）

**現象**：ping も pg_restore も失敗。

**切り分け**：テザリング等でも再現 → PC 環境に問題あり。

**調査結果**：Supabase は IPv6（AAAA レコード）のみ対応。PC は IPv4。

#### 🧩 解決策：Supabase の Connection Pooler を利用

**変更**：接続先を Pooler ホストに切り替え。

**新たな問題**：FATAL: Tenant or user not found

**原因**：Pooler では postgres.[project_id] 形式のユーザー名が必要。

**解決**：正しいユーザー名を -U に指定しリストア成功。

#### 📎 補足（所有権エラー）

**内容**：旧 DB の backend ロールが存在しないため多数の警告。

**結論**：無視して問題なし。データとテーブルは正常に移行完了。

### 🔄 接続先の変更（Rails アプリ）

#### DATABASE_URL の更新

**手順**：Render の環境変数 DATABASE_URL を Supabase 用に変更。

**問題**：URI::InvalidURIError

**原因**：Supabase のパスワードに % や | などの URL 予約文字が含まれていた。

**解決**：英数字のみのパスワードに変更。

#### Prepared Statements エラー

**現象**：PG::DuplicatePstatement で Rails アプリがクラッシュ。

**原因**：Supabase の Transaction Pooler は prepared statements 非対応。

**対策**：DATABASE_URL に `?prepared_statements=false` を追加。

## 📝 学びと今後の活用

- DNS, 接続形式, 認証構成, URL エンコードなど、クラウド移行における多面的な課題を経験
- 他クラウド（PlanetScale, Neon 等）移行時にも活かせる知見

## 💻 使用コマンド例

### 🔹 backup.dump の取得

```powershell
. .\load-env.ps1
$env:PGPASSWORD = $env:DB_PASSWORD
pg_dump -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME -F c -v -f backup.dump
```

### 🔹 Supabase へのリストア

```powershell
$env:PGPASSWORD = "your_supabase_password"
pg_restore -h db.connection-pooler.supabase.co `
  -U postgres.projectrefid `
  -d postgres `
  -F c -v backup.dump
```
