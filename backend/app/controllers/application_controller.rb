class ApplicationController < ActionController::Base
  include ActionController::MimeResponds
  include ActionController::ImplicitRender
  include ActionController::StrongParameters
  include JwtAuthenticatable

  # 認証を個別のコントローラーで制御するため、グローバルな認証は無効化
  # before_action :authenticate_user!
  before_action :set_current_user_from_token
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:email, :password, :password_confirmation])
    devise_parameter_sanitizer.permit(:sign_in, keys: [:email, :password])
  end

  private

  # トークンからユーザーを設定するだけで例外はスローしない
  def set_current_user_from_token
    if request.headers['Authorization'].present?
      begin
        jwt_token = request.headers['Authorization'].split(' ').last
        
        # デバッグログ
        Rails.logger.info("JWT Token in application_controller: #{jwt_token}")
        Rails.logger.info("ENV['DEVISE_JWT_SECRET_KEY']: #{ENV['DEVISE_JWT_SECRET_KEY'] ? 'exists' : 'not set'}")
        
        # 明示的に同じ秘密鍵を使用
        secret_key = ENV['DEVISE_JWT_SECRET_KEY']
        Rails.logger.info("Using secret key: #{secret_key ? 'exists' : 'not set'}")
        
        # トークンをデコードする前にエンコードに使用された秘密鍵を確認
        Rails.logger.info("Secret key length: #{secret_key&.length}")
        
        # トークンをデコード
        decoded_token = JWT.decode(jwt_token, secret_key, true, { algorithm: 'HS256' })
        Rails.logger.info("Decoded token in application_controller: #{decoded_token.inspect}")
        
        # トークンのペイロードからユーザーIDを取得（両方の形式をサポート）
        payload = decoded_token[0]
        user_id = payload['sub'] || payload['user_id']
        Rails.logger.info("Extracted user_id: #{user_id}")
        
        @current_user = User.find(user_id)
        Rails.logger.info("Found user: #{@current_user.id}")
      rescue JWT::DecodeError => e
        Rails.logger.error("JWT decode error in application_controller: #{e.message}")
        Rails.logger.error("JWT token that failed: #{jwt_token}")
        @current_user = nil
      rescue ActiveRecord::RecordNotFound => e
        Rails.logger.error("User not found in application_controller: #{e.message}")
        @current_user = nil
      rescue => e
        Rails.logger.error("Unexpected error in application_controller: #{e.class.name} - #{e.message}")
        Rails.logger.error(e.backtrace.join("\n"))
        @current_user = nil
      end
    else
      @current_user = nil
    end
  end

  def current_user
    @current_user
  end
end
