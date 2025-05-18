module Api
  class CardsController < ApplicationController
    before_action :authenticate_user_from_token!

    def image
      card = Card.find(params[:id])

      # カードの所有者チェック
      # デッキがnilまたはデッキの所有者が現在のユーザーでない場合は認証エラー
      if card.deck.nil? || card.deck.user_id != current_user.id
        # 認証エラーの場合は401を返す
        return head :unauthorized
      end

      if card.image.attached?
        # 画像が添付されている場合は一時的なURLを生成して返す
        # ActiveStorageのURLヘルパーを使用（rails_blob_url）
        temp_url = Rails.application.routes.url_helpers.rails_blob_url(card.image, only_path: false)
        render json: { url: temp_url }
      else
        render json: { error: "画像が添付されていません" }, status: :not_found
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "カードが見つかりません" }, status: :not_found
    end
  end
end
