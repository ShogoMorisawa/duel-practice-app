module Api
  module Auth
    class SessionsController < ApplicationController
      # APIではセッション使わないので、CSRF/セッション系の保護は外す
      skip_before_action :verify_authenticity_token
      skip_before_action :authenticate_user_from_token!, only: [:create]

      def create
        Rails.logger.info("SessionsController#create: Parameters: #{params.to_unsafe_h.except('password').inspect}")
        
        user = User.find_by(email: params[:email])
        Rails.logger.info("User found: #{user ? 'Yes' : 'No'}")

        if user&.valid_password?(params[:password])
          Rails.logger.info("Password valid for user: #{user.email}")
          
          # JWT秘密鍵の確認
          secret_key = ENV['DEVISE_JWT_SECRET_KEY']
          Rails.logger.info("SessionsController using DEVISE_JWT_SECRET_KEY: #{secret_key ? 'exists (length: ' + secret_key.length.to_s + ')' : 'not set'}")
          
          # JWTトークンを生成する
          token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first
          Rails.logger.info("Generated token: #{token}")

          render json: {
            status: { code: 200, message: 'ログインに成功しました' },
            data: {
              user: user.as_json(only: [:id, :email]),
              token: token
            }
          }
        else
          Rails.logger.info("Authentication failed for email: #{params[:email]}")
          render json: {
            status: { code: 401, message: 'メールアドレスまたはパスワードが正しくありません' }
          }, status: :unauthorized
        end
      end

      def destroy
        # DEVISEが使用する秘密鍵を確認
        secret_key = ENV['DEVISE_JWT_SECRET_KEY']
        Rails.logger.info("SessionsController#destroy using DEVISE_JWT_SECRET_KEY: #{secret_key ? 'exists' : 'not set'}")
        
        # 明示的にトークンを取得してログに記録
        token = request.headers['Authorization']&.split(' ')&.last
        Rails.logger.info("Logout token: #{token}")
        
        begin
          head :no_content
        rescue => e
          Rails.logger.error("Logout error: #{e.class.name} - #{e.message}")
          Rails.logger.error(e.backtrace.join("\n"))
          head :internal_server_error
        end
      end
    end
  end
end 