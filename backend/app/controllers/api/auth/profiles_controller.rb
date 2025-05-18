module Api
  module Auth
    class ProfilesController < ApplicationController
      before_action :authenticate_user!

      def show
        render json: {
          data: {
            user: {
              id: current_user.id,
              email: current_user.email
            }
          }
        }
      end

      private

      def authenticate_user!
        unless current_user
          render json: { error: '認証が必要です' }, status: :unauthorized
          return false
        end
        true
      end
    end
  end
end
