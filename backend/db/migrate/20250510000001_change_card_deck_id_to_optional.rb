class ChangeCardDeckIdToOptional < ActiveRecord::Migration[7.2]
  def change
    change_column_null :cards, :deck_id, true
  end
end 