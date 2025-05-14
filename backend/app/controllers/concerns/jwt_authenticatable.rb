# frozen_string_literal: true

module JwtAuthenticatable
  extend ActiveSupport::Concern

  included do
    before_action :authenticate_user_from_token!, unless: :devise_controller?
  end

  private

  def authenticate_user_from_token!
    header = request.headers['Authorization']
    header = header.split(' ').last if header

    begin
      # デバッグログ
      Rails.logger.info("JWT Token (from concern): #{header}")
      Rails.logger.info("ENV['DEVISE_JWT_SECRET_KEY'] (from concern): #{ENV['DEVISE_JWT_SECRET_KEY'] ? 'exists' : 'not set'}")
      
      # 明示的に同じ秘密鍵を使用
      secret_key = ENV['DEVISE_JWT_SECRET_KEY']
      Rails.logger.info("Using secret key (from concern): #{secret_key ? 'exists' : 'not set'}")
      Rails.logger.info("Secret key length (from concern): #{secret_key&.length}")
      
      # トークンをデコード
      decoded = JWT.decode(header, secret_key, true, { algorithm: 'HS256' })[0]
      Rails.logger.info("Decoded token (from concern): #{decoded.inspect}")
      
      # 両方の形式をサポート
      user_id = decoded['sub'] || decoded['user_id']
      Rails.logger.info("Extracted user_id (from concern): #{user_id}")
      
      @current_user = User.find(user_id)
      Rails.logger.info("Found user (from concern): #{@current_user.id}")
    rescue JWT::DecodeError => e
      Rails.logger.error("JWT decode error (from concern): #{e.message}")
      Rails.logger.error("JWT token that failed (from concern): #{header}")
      render json: { errors: '認証に失敗しました' }, status: :unauthorized
    rescue ActiveRecord::RecordNotFound => e
      Rails.logger.error("User not found (from concern): #{e.message}")
      render json: { errors: '認証に失敗しました' }, status: :unauthorized
    rescue => e
      Rails.logger.error("Unexpected error (from concern): #{e.class.name} - #{e.message}")
      Rails.logger.error(e.backtrace.join("\n"))
      render json: { errors: '認証に失敗しました' }, status: :unauthorized
    end
  end
end 