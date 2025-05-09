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
        decoded_token = JWT.decode(jwt_token, ENV['DEVISE_JWT_SECRET_KEY'], true, algorithm: 'HS256')
        user_id = decoded_token[0]['sub']
        @current_user = User.find(user_id)
      rescue JWT::DecodeError, ActiveRecord::RecordNotFound
        render json: { error: '認証に失敗しました' }, status: :unauthorized
      end
    end
  end

  def current_user
    @current_user
  end
end
