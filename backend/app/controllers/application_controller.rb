class ApplicationController < ActionController::API
  # リクエストヘッダーからAuthorizationトークンを取得し、
  # ユーザーを認証・特定するためのメソッドです。
  # このメソッドは通常、コントローラーのアクションが実行される前に
  # before_action として呼び出されます。
  def authorize_request
    # 1. リクエストヘッダーから 'Authorization' フィールドを取得します。
    #    Authorizationヘッダーは通常、認証情報を含んでいます。
    header = request.headers['Authorization']

    # 2. ヘッダーが存在する場合、それをスペースで分割し、
    #    配列の最後の要素（トークン本体）を取得します。
    #    Authorizationヘッダーは "Bearer [token]" のような形式であることが多いため、
    #    ここで "Bearer " 部分を除去します。
    header = header.split(' ').last if header

    # 3. 取得したトークンを JsonWebToken.decode メソッドを使ってデコードします。
    #    この JsonWebToken.decode メソッドは、提供されたJWTを秘密鍵を使って検証し、
    #    有効であればトークンに含まれるペイロード（データ）を返します。
    decoded = JsonWebToken.decode(header)

    # 4. デコードされたペイロードから 'user_id' を取り出し、
    #    そのIDを持つユーザーをデータベースから検索します。
    #    見つかったユーザーは @current_user インスタンス変数に格納されます。
    #    これにより、以降のアクションで認証されたユーザー情報 (@current_user) に
    #    アクセスできるようになります。
    @current_user = User.find(decoded[:user_id])

  # 5. エラーハンドリング:
  #    トークンのデコードやユーザー検索中に以下のいずれかのエラーが発生した場合、
  #    そのエラーを捕捉します。
  rescue ActiveRecord::RecordNotFound, # デコードされた user_id に対応するユーザーがDBに見つからなかった場合
         JWT::DecodeError              # トークンが無効である（署名が不正、期限切れなど）場合

    # 6. エラーが発生した場合、認証失敗として処理し、
    #    JSON形式の `{ errors: 'Unauthorized' }` というメッセージと、
    #    HTTPステータスコード 401 (Unauthorized) をクライアントに返します。
    render json: { errors: 'Unauthorized' }, status: :unauthorized
  end
end
