module Api
  class CardsController < ApplicationController
    before_action :authenticate_user_from_token!
    def image
      card = Card.find(params[:id])
      
      # カードの所有者チェック
      # デッキがnilまたはデッキの所有者が現在のユーザーでない場合は認証エラー
      if card.deck.nil? || card.deck.user_id != current_user.id
        return head :unauthorized
      end
      
      if card.image.attached?
        redirect_to url_for(card.image)
      else
        render json: { error: "画像が添付されていません" }, status: :not_found
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "カードが見つかりません" }, status: :not_found
    end
  end
end 