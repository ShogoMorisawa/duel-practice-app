require 'net/http'

class Api::ProxyController < ApplicationController
  skip_before_action :verify_authenticity_token
  skip_before_action :set_current_user_from_token

  def image
    url = params[:url]

    begin
      uri = URI.parse(url)
      response = Net::HTTP.get_response(uri)

      if response.is_a?(Net::HTTPSuccess)
        send_data response.body, type: response.content_type, disposition: "inline"
      else
        render json: { error: "画像取得に失敗しました" }, status: :bad_gateway
      end
    rescue => e
      render json: { error: "例外: #{e.message}" }, status: :internal_server_error
    end
  end
end 