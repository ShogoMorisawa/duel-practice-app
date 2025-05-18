class StaticController < ApplicationController
  # 認証をスキップ
  skip_before_action :set_current_user_from_token, only: [:images]
  
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