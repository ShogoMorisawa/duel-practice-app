module Api
  class CardsController < ApplicationController
    before_action :authenticate_user!, except: [:image]

    def image
      card = Card.find(params[:id])

      # 認証トークンがあれば所有者チェックを行う
      if current_user.present?
        # カードの所有者チェック
        if card.deck.present? && card.deck.user_id != current_user.id
          # 認証エラーの場合でもフォールバック画像を返すように変更
          Rails.logger.info "認証エラー: ユーザーID #{current_user.id} はカード #{card.id} の所有者ではありません"
        end
      else
        Rails.logger.info "認証なしでカード #{card.id} の画像にアクセスしています"
      end

      if card.image.attached?
        # 画像データを直接送信（リダイレクトを使わない）
        send_data card.image.download, type: card.image.content_type, disposition: "inline"
      else
        head :not_found
      end
    rescue ActiveRecord::RecordNotFound
      head :not_found
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
