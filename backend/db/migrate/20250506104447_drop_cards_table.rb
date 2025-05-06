class DropCardsTable < ActiveRecord::Migration[7.2]
  def change
    drop_table :cards do |t|
      t.string :image_url
      t.integer :position_x
      t.integer :position_y
      t.references :deck, null: false, foreign_key: true
      t.timestamps
    end
  end
end
