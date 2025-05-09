# frozen_string_literal: true

class Users::SessionsController < Devise::SessionsController
  respond_to :json

  # POST /login
  def create
    self.resource = warden.authenticate!(auth_options)
    token = generate_jwt_token(resource)
    
    render json: {
      status: { code: 200, message: 'ログイン成功' },
      data: {
        user: {
          id: resource.id,
          email: resource.email
        },
        token: token
      }
    }
  end

  # DELETE /logout
  def destroy
    render json: {
      status: { code: 200, message: 'ログアウト成功' }
    }
  end

  private

  def generate_jwt_token(user)
    payload = {
      user_id: user.id,
      exp: 24.hours.from_now.to_i
    }
    JWT.encode(payload, Rails.application.credentials.secret_key_base)
  end

  def respond_to_on_destroy
    render json: {
      status: 200,
      message: 'ログアウト成功'
    }
  end
end 