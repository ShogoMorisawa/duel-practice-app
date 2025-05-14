class DropCardsTable < ActiveRecord::Migration[7.2]
  def change
    # テーブルが存在しないときでもOKにする
    drop_table :cards, if_exists: true
  end
end
