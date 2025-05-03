module Api
  class DecksController < ApplicationController
    def index
      decks = Deck.all
      render json: decks
    end

    def show
      deck = Deck.find(params[:id])
      render json: deck
    end

    def create
      deck = Deck.new(deck_params)
      if deck.save
        render json: deck, status: :created
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
<<<<<<< HEAD
      params.require(:deck).permit(:name, cards: [])
=======
      params.require(:deck).permit(
        :name,
        cards: [:name, :imageUrl]
      )
>>>>>>> b6bf80d (feat: デッキ作成画面に画像アップロード機能を実装)
    end
  end
end
