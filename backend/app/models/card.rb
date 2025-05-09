class Card < ApplicationRecord
  belongs_to :deck, optional: true
  has_one_attached :image
  
  # 永続的な画像URLを返すメソッド
  def image_url
    if deck_id.present? && id.present?
      "/api/decks/#{deck_id}/cards/#{id}/image"
    elsif id.present?
      # デッキIDがなくても永続的なURLを返す
      "/api/cards/#{id}/image"
    elsif image.attached?
      # 上記のどちらもない場合はActiveStorageのURLを返す
      Rails.application.routes.url_helpers.url_for(image)
    else
      nil
    end
  end
end
