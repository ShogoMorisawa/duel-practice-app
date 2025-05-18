module Api
  class StaticController < ApplicationController
    # 認証をスキップ
    skip_before_action :authenticate_user!
    
    def images
      # パスからファイル名を取得
      path = params[:path]
      # ファイルの保存場所
      file_path = Rails.root.join('public', 'images', path)
      
      # ファイルが存在するか確認
      if File.exist?(file_path)
        # MIMEタイプを判断
        content_type = case File.extname(file_path).downcase
                       when '.jpg', '.jpeg'
                         'image/jpeg'
                       when '.png'
                         'image/png'
                       when '.gif'
                         'image/gif'
                       when '.svg'
                         'image/svg+xml'
                       else
                         'application/octet-stream'
                       end
        
        # ファイルを送信
        send_file file_path, type: content_type, disposition: 'inline'
      else
        # ファイルが見つからない場合は404エラー
        render json: { error: 'ファイルが見つかりません' }, status: :not_found
      end
    end
  end
end 