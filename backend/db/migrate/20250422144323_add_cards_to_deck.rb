class AddCardsToDeck < ActiveRecord::Migration[7.2]
  def change
    add_column :decks, :cards, :json
  end
end
