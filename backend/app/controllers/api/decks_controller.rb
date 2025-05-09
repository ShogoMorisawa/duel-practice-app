module Api
  class DecksController < ApplicationController
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
      render json: deck
    end

    def create
      deck = Deck.new(deck_params)
      deck.user = current_user if current_user
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
      params.require(:deck).permit(
        :name,
        cards: [:name, :imageUrl]
      )
    end
  end
end
