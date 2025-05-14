class ApplicationController < ActionController::Base
  include ActionController::MimeResponds
  include ActionController::ImplicitRender
  include ActionController::StrongParameters

  before_action :authenticate_user_from_token!
  before_action :configure_permitted_parameters, if: :devise_controller?

  protected

  def configure_permitted_parameters
    devise_parameter_sanitizer.permit(:sign_up, keys: [:email, :password, :password_confirmation])
    devise_parameter_sanitizer.permit(:sign_in, keys: [:email, :password])
  end

  private

  def authenticate_user_from_token!
    if request.headers['Authorization'].present?
      begin
        jwt_token = request.headers['Authorization'].split(' ').last
        
        # デバッグログ
        Rails.logger.info("JWT Token: #{jwt_token}")
        
        # トークンをデコード
        decoded_token = JWT.decode(jwt_token, ENV['DEVISE_JWT_SECRET_KEY'] || Rails.application.credentials.secret_key_base, true, algorithm: 'HS256')
        Rails.logger.info("Decoded token: #{decoded_token.inspect}")
        
        # トークンのペイロードからユーザーIDを取得（両方の形式をサポート）
        payload = decoded_token[0]
        user_id = payload['sub'] || payload['user_id']
        Rails.logger.info("Extracted user_id: #{user_id}")
        
        @current_user = User.find(user_id)
        Rails.logger.info("Found user: #{@current_user.id}")
      rescue JWT::DecodeError => e
        Rails.logger.error("JWT decode error: #{e.message}")
        render json: { error: '認証に失敗しました' }, status: :unauthorized
      rescue ActiveRecord::RecordNotFound => e
        Rails.logger.error("User not found: #{e.message}")
        render json: { error: '認証に失敗しました' }, status: :unauthorized
      rescue => e
        Rails.logger.error("Unexpected error: #{e.message}")
        render json: { error: '認証に失敗しました' }, status: :unauthorized
      end
    end
  end

  def current_user
    @current_user
  end
end
