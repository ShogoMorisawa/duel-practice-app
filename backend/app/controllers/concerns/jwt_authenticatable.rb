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
      decoded = JWT.decode(header, Rails.application.credentials.secret_key_base)[0]
      @current_user = User.find(decoded['user_id'])
    rescue JWT::DecodeError, ActiveRecord::RecordNotFound
      render json: { errors: '認証に失敗しました' }, status: :unauthorized
    end
  end
end 