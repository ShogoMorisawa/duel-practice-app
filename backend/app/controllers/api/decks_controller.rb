module Api
  class DecksController < ApplicationController
    before_action :authenticate_user!, except: [:card_image]

    def index
      if current_user
        decks = Deck.where(user_id: current_user.id)
      else
        decks = Deck.where(user_id: nil) # ゲスト用
      end
      render json: decks
    end

    def show
      deck = Deck.find(params[:id])
      
      # カードの画像URLを含めてレスポンスを返す
      cards_with_image_urls = deck.cards.map do |card|
        if card.is_a?(Hash)
          # JSONデータ内のカード情報（既存の実装）
          card
        else
          # ActiveRecordのカードオブジェクト（新しい実装）
          card.as_json.merge(image_url: card.image_url)
        end
      end
      
      render json: {
        deck: deck,
        cards: cards_with_image_urls
      }
    end

    def card_image
      card = Card.find(params[:card_id])
      if card.image.attached?
        # 認証不要で直接画像を返す
        redirect_to url_for(card.image)
      else
        render json: { error: "画像が添付されていません" }, status: :not_found
      end
    end

    def create
      deck = Deck.new(deck_params)
      deck.user = current_user if current_user
      
      # 一時保存されたカードの処理
      if params[:deck][:cards].present?
        params[:deck][:cards].each do |card_data|
          # カードIDがある場合は、一時カードをデッキに紐付ける
          if card_data[:id].present?
            temp_card = Card.find_by(id: card_data[:id])
            if temp_card && temp_card.deck_id.nil?
              temp_card.update(deck: deck)
            end
          end
        end
      end
      
      if deck.save
        render json: { 
          id: deck.id,
          name: deck.name,
          message: "デッキが作成されました" 
        }, status: :created
      else
        render json: { errors: deck.errors.full_messages }, status: :unprocessable_entity
      end
    end

    def destroy
      deck = Deck.find(params[:id])
      if deck.destroy
        render json: { message: "デッキが削除されました" }, status: :ok
      else
        render json: { errors: deck.errors.full_messages }, status: :unprocessable_entity
      end
    end

    private

    def deck_params
      params.require(:deck).permit(
        :name,
        cards: [:id, :name, :imageUrl]
      )
    end

    def authenticate_user!
      unless current_user
        render json: { error: '認証が必要です' }, status: :unauthorized
        return false
      end
      true
    end
  end
end
