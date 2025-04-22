module Api
  class DecksController < ApplicationController
    def index
      decks = Deck.all
      render json: decks
    end
  end
end
