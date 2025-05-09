# frozen_string_literal: true

class Users::RegistrationsController < Devise::RegistrationsController
  respond_to :json

  # POST /signup
  def create
    build_resource(sign_up_params)

    resource.save
    if resource.persisted?
      if resource.active_for_authentication?
        token = generate_jwt_token(resource)
        
        render json: {
          status: { code: 200, message: 'アカウント登録成功' },
          data: {
            user: {
              id: resource.id,
              email: resource.email
            },
            token: token
          }
        }
      else
        expire_data_after_sign_in!
        render json: {
          status: { code: 401, message: 'アカウントは有効化されていません' }
        }, status: :unauthorized
      end
    else
      clean_up_passwords resource
      render json: {
        status: { code: 422, message: 'アカウント登録失敗' },
        errors: resource.errors.full_messages
      }, status: :unprocessable_entity
    end
  end

  private

  def generate_jwt_token(user)
    payload = {
      user_id: user.id,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, Rails.application.credentials.secret_key_base)
  end
end 