module Api
  class CardsController < ApplicationController
    before_action :authenticate_user_from_token!

    def image
      card = Card.find(params[:id])

      # 所有権チェック：カードにデッキが紐づいていない、または別ユーザーのデッキなら拒否
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
