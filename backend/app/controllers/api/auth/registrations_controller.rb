module Api
  module Auth
    class RegistrationsController < ApplicationController
      # 認証とCSRF保護を無効化
      skip_before_action :authenticate_user_from_token!, only: [:create]
      skip_before_action :verify_authenticity_token, only: [:create]
      
      def create
        begin
          # デバッグ用にリクエストの内容をログに出力
          Rails.logger.info("Registration params: #{params.inspect}")
          Rails.logger.info("Request body: #{request.body.read}")
          request.body.rewind # body読み取り後に巻き戻す
          
          user = User.new(user_params)
          
          if user.save
            # JWTトークンを生成
            jwt_payload = { 'sub' => user.id, 'exp' => 24.hours.from_now.to_i }
            jwt_token = JWT.encode(jwt_payload, ENV['DEVISE_JWT_SECRET_KEY'] || Rails.application.credentials.secret_key_base, 'HS256')
            
            render json: {
              data: {
                token: jwt_token,
                user: {
                  id: user.id,
                  email: user.email
                }
              }
            }, status: :created
          else
            render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
          end
        rescue => e
          Rails.logger.error("Registration error: #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))
          render json: { errors: ["サーバーエラーが発生しました。時間をおいて再度お試しください。"] }, status: :internal_server_error
        end
      end

      private

      def user_params
        params.require(:user).permit(:email, :password, :password_confirmation)
      end
    end
  end
end 