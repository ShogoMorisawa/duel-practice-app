class AddNameToCards < ActiveRecord::Migration[7.2]
  def change
    add_column :cards, :name, :string
  end
end
