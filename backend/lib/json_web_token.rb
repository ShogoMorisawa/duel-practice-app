class JsonWebToken
  # JWTの署名に使用される秘密鍵。Railsアプリケーションのsecret_key_baseから取得します。
  # これにより、生成されたトークンが改ざんされていないことを確認できます。
  SECRET_KEY = Rails.application.secret_key_base

  # トークンをエンコード（生成）するメソッド
  # payload: トークンに含めたいデータ（ハッシュ形式）
  # exp: トークンの有効期限。デフォルトは現在時刻から24時間後です。
  def self.encode(payload, exp = 24.hours.from_now)
    # ペイロードに有効期限(exp)を追加します。
    # to_i は時刻をUnixタイムスタンプ（秒）に変換します。
    payload[:exp] = exp.to_i
    # JWTライブラリを使って、ペイロードと秘密鍵でトークンをエンコードします。
    # これにより、署名付きのJWT文字列が生成されます。
    JWT.encode(payload, SECRET_KEY)
  end

  # トークンをデコード（検証・解析）するメソッド
  # token: デコードしたいJWT文字列
  def self.decode(token)
    # JWTライブラリを使って、トークンと秘密鍵でデコードします。
    # JWT.decode は、デコードされたペイロードとヘッダーの配列を返します。
    # [0] でペイロード（ハッシュ形式）のみを取り出します。
    body = JWT.decode(token, SECRET_KEY)[0]
    # 取り出したペイロードを HashWithIndifferentAccess に変換します。
    # これにより、ハッシュのキーにシンボル（:key）でも文字列("key")でもアクセスできるようになります。
    HashWithIndifferentAccess.new body
  rescue
    # デコード中にエラーが発生した場合（例: 無効なトークン、期限切れのトークンなど）
    # エラーを捕捉し、nilを返します。
    nil
  end
end