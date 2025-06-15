# 🚚 Render から Supabase への PostgreSQL 移行記録

## 🎯 目的

Render で稼働していた PostgreSQL データベースを、Supabase 上の新しいプロジェクトへ移行する。  
Windows 環境から `pg_dump` と `pg_restore` を使用して、**データベースのバックアップとリストア**を行った。

---

## ✅ 最終的な状況

- 移行は**成功**。
- `backup.dump` の取得と、Supabase へのリストアを完了。
- 所有者（role）に関するエラーは発生したが、これは既知の仕様であり問題なし。
- テーブルとデータは正常に移行されたことを確認済み。

---

## 🧭 実行プロセスと問題解決の記録

### 🗂 フェーズ 1：pg_dump によるバックアップ取得

#### 🔧 pg_dump の有効化

- **問題**：`pg_dump` が PowerShell で認識されずエラー。
- **解決**：PostgreSQL の `bin` ディレクトリを PATH に追加。

#### 🔐 認証情報の管理

- `.env` を `load-env.ps1` で読み込み、環境変数として安全に利用。

#### 🌐 Render 接続エラー（DNS 関連）

- **問題**：`Name or service not known` エラー。
- **原因 1**：`.env` に Render の**内部ホスト名**を指定していた。
- **原因 2**：接続 URL を丸ごと `DB_HOST` に指定していた（ホスト名ではなく URL）。
- **解決**：ホスト名・ユーザー名・パスワード・DB 名を正しく分解して `.env` に設定。
- **結果**：`pg_dump` に成功し、`backup.dump` を取得。

---

### 🛠 フェーズ 2：pg_restore による Supabase へのリストア

#### 🌐 Supabase 接続エラー（再び DNS）

- **問題**：`Name or service not known` エラー（ping も失敗）。
- **切り分け**：
  - Supabase プロジェクトは "Healthy"
  - テザリングでも同様の症状 → **ネットワークではなく PC 本体の問題**
- **調査**：`nslookup` 結果より、Supabase のホストは**IPv6 のみ（AAAA）**を返すと判明。
- **結論**：IPv6 にしか対応していない Supabase のホストに、PC が IPv4 で接続しようとして失敗。

#### 🧩 解決策：Supabase の Connection Pooler を利用

- **方針転換**：Supabase の Connection Pooler を経由することで IPv4 での接続を実現。
- **問題**：`FATAL: Tenant or user not found` エラー。
- **原因**：Connection Pooler では `ユーザー名 = postgres.[project_ref]` 形式で指定する必要がある。
- **解決**：正しいユーザー名 `postgres.tkvvsedmuemzasslffkb` を `-U` に指定。

#### ✅ リストア完了

- `pg_restore` によるデータ移行成功。
- 以下の所有権エラーが多数表示されたが、想定内のもの：

- **分析**：旧 DB に存在した `backend` ユーザーを再現できなかったが、テーブルとデータは `postgres` に正常に割り当てられた。

---

## 📝 学びと今後の応用

- クラウド DB 移行における接続構成（Direct vs Pooler）や、IPv6/IPv4 非互換の影響を体験。
- pg_dump/pg_restore によるマイグレーションに加え、接続周り・認証情報管理・DNS の問題まで対処。
- 本移行記録は、将来的な構成変更や他クラウド（PlanetScale, Neon など）への移行時にも再利用可能。

---

## 📌 使用コマンドの一例

### backup.dump の取得：

```powershell
. .\load-env.ps1
$env:PGPASSWORD = $env:DB_PASSWORD
pg_dump -h $env:DB_HOST -U $env:DB_USER -d $env:DB_NAME -F c -v -f backup.dump
```

### Supabase へのリストア

$env:PGPASSWORD = "your_supabase_password"
pg_restore -h db.connection-pooler.supabase.co `           -U postgres.projectrefid`
-d postgres `
-F c -v backup.dump
