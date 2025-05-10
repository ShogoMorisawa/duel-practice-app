module Api
  module Auth
    class ProfilesController < ApplicationController
      before_action :authenticate_user_from_token!

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
    end
  end
end
