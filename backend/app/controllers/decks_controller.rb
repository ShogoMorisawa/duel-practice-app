# DecksController クラスは ApplicationController を継承しています。
# これにより、ApplicationController で定義されているメソッド（authorize_request など）
# や設定（共通のフィルターなど）を利用できます。
class DecksController < ApplicationController

  # before_action は、このコントローラーのアクションが実行される「前」に
  # 指定されたメソッドを実行するためのRailsの仕組みです。
  # ここでは、全てのアクション（index, create）の前に authorize_request メソッドが
  # 実行されるように設定されています。
  # authorize_request はJWTによる認証処理を行うメソッドなので、
  # このコントローラーへの全てのリクエストは、まず認証が必要になります。
  before_action :authorize_request

  # HTTP GET /decks に対応するアクションです。
  # 全てのデッキを取得して返します。
  def index
    # @current_user は authorize_request メソッドによって設定された、
    # 現在リクエストを行っているユーザーオブジェクトです。
    # @current_user.decks は、そのユーザーが所有する（関連付けられている）
    # 全てのデッキを取得します。
    decks = @current_user.decks

    # 取得したデッキのコレクションをJSON形式でクライアントに返します。
    render json: decks
  end

  # HTTP POST /decks に対応するアクションです。
  # 新しいデッキを作成します。
  def create
    # @current_user.decks.build(deck_params) は、
    # 現在のユーザーに関連付けられた新しい Deck オブジェクトをメモリ上に作成します。
    # deck_params は、リクエストパラメータから安全に属性を取り出すためのメソッドです。
    deck = @current_user.decks.build(deck_params)

    # 作成した Deck オブジェクトをデータベースに保存しようとします。
    if deck.save
      # 保存に成功した場合、作成されたデッキ情報をJSON形式で返し、
      # HTTPステータスコード 201 (Created) を設定します。
      render json: deck, status: :created
    else
      # 保存に失敗した場合（バリデーションエラーなど）、
      # エラーメッセージをJSON形式で返し、
      # HTTPステータスコード 422 (Unprocessable Entity) を設定します。
      render json: { errors: deck.errors.full_messages }, status: :unprocessable_entity
    end
  end

  # private より下に定義されたメソッドは、
  # このクラスの内部でのみ呼び出すことができます。
  # 外部（ルーティングなど）から直接呼び出されることはありません。
  private

  # ストロングパラメータを定義するメソッドです。
  # リクエストパラメータから許可された属性のみを安全に取り出すために使用します。
  def deck_params
    # params.require(:deck) は、リクエストパラメータに :deck というキーが
    # 必須であることを示します。もし存在しない場合はエラーになります。
    # .permit(:title, :cards_json) は、:deck キーの中にある属性のうち、
    # :title と :cards_json だけを許可することを指定します。
    # これにより、悪意のあるユーザーが許可されていない属性（例: user_id）を
    # 勝手に更新するのを防ぎます。
    params.require(:deck).permit(:title, :cards_json)
  end
end