module Api
  module Auth
    class SessionsController < ApplicationController
      # APIではセッション使わないので、CSRF/セッション系の保護は外す
      skip_before_action :verify_authenticity_token
      skip_before_action :authenticate_user_from_token!, only: [:create]

      def create
        user = User.find_by(email: params[:email])

        if user&.valid_password?(params[:password])
          # JWTトークンを生成する
          token = Warden::JWTAuth::UserEncoder.new.call(user, :user, nil).first

          render json: {
            status: { code: 200, message: 'ログインに成功しました' },
            data: {
              user: user.as_json(only: [:id, :email]),
              token: token
            }
          }
        else
          render json: {
            status: { code: 401, message: 'メールアドレスまたはパスワードが正しくありません' }
          }, status: :unauthorized
        end
      end

      def destroy
        head :no_content
      end
    end
  end
end 