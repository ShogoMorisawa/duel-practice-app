module Api
  class StaticController < ApplicationController
    # 認証をスキップ
    
    def images
      path = params[:path]
      file_path = Rails.root.join('public', 'images', path)
      
      if File.exist?(file_path)
        send_file file_path, disposition: 'inline'
      else
        render json: { error: 'File not found' }, status: :not_found
      end
    end
  end
end 