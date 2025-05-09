module Api
  class CardsController < ApplicationController
    def image
      card = Card.find(params[:id])
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