class Deck < ApplicationRecord
  belongs_to :user, optional: true

  validate :cards_format

  private

  def cards_format
    if cards.present?
      unless cards.is_a?(Array) && cards.all? { |c| c.is_a?(Hash) && c.key?("name") && c.key?("imageUrl") }
        errors.add(:cards, "must be an array of objects with name and imageUrl")
      end
    end
  end
end
