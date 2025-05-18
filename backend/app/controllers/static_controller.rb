class StaticController < ApplicationController
  # authenticate_user!が定義されていないためコメントアウト
  # skip_before_action :authenticate_user!
  
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