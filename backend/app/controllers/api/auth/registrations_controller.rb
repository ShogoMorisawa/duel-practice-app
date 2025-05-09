module Api
  module Auth
    class RegistrationsController < ApplicationController
      # createアクションではログイン不要にする
      skip_before_action :authenticate_user_from_token!, only: [:create]

      def create
        user = User.new(user_params)
        if user.save
          sign_in(user)
          render json: {
            token: current_token,
            data: {
              user: user.as_json(only: [:id, :email, :name])
            }
          }, status: :created
        else
          render json: { errors: user.errors.full_messages }, status: :unprocessable_entity
        end
      end

      private

      def user_params
        params.permit(:email, :password, :password_confirmation, :name)
      end

      def current_token
        request.env['warden-jwt_auth.token']
      end
    end
  end
end 