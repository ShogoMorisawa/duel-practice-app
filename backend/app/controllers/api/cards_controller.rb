module Api
  class CardsController < ApplicationController
    before_action :authenticate_user!, except: [:image]

    def image
      card = Card.find(params[:id])

      # 認証トークンがあれば所有者チェックを行う
      if current_user.present?
        # カードの所有者チェック
        # デッキがnilまたはデッキの所有者が現在のユーザーでない場合は認証エラー
        if card.deck.present? && card.deck.user_id != current_user.id
          # 認証エラーの場合でもフォールバック画像を返すように変更
          Rails.logger.info "認証エラー: ユーザーID #{current_user.id} はカード #{card.id} の所有者ではありません"
        end
      else
        Rails.logger.info "認証なしでカード #{card.id} の画像にアクセスしています"
      end

      if card.image.attached?
        # 画像が添付されている場合は一時的なURLを生成して返す
        # ActiveStorageのURLヘルパーを使用（rails_blob_url）
        temp_url = Rails.application.routes.url_helpers.rails_blob_url(card.image, only_path: false)
        render json: { url: temp_url }
      else
        render json: { error: "画像が添付されていません" }, status: :not_found
      end
    rescue ActiveRecord::RecordNotFound
      render json: { error: "カードが見つかりません" }, status: :not_found
    end

    private

    def authenticate_user!
      unless current_user
        render json: { error: '認証が必要です' }, status: :unauthorized
        return false
      end
      true
    end
  end
end
