module Api
  class UploadsController < ApplicationController
    def create
      # リクエスト情報のログ記録
      Rails.logger.info "Content-Type: #{request.content_type}"
      Rails.logger.info "Parameters: #{params.keys.inspect}"
      Rails.logger.info "File params: #{params[:file].present?}, Image params: #{params[:image].present?}"
      
      # マルチパートフォームデータ処理
      if params[:file].respond_to?(:tempfile)
        uploaded_file = params[:file]
      elsif params[:image].respond_to?(:tempfile)
        uploaded_file = params[:image]
      else
        uploaded_file = nil
        # フォームデータからファイルを検索
        params.each do |key, value|
          if value.respond_to?(:tempfile)
            Rails.logger.info "Found file in param: #{key}"
            uploaded_file = value
            break
          end
        end
      end
      
      if uploaded_file.nil?
        Rails.logger.error "No valid file found in params: #{params.keys}"
        return render json: { error: "画像が選択されていません" }, status: :unprocessable_entity
      end

      begin
        Rails.logger.info "Processing uploaded file: #{uploaded_file.original_filename}"
        Rails.logger.info "File content type: #{uploaded_file.content_type}"
        Rails.logger.info "File size: #{uploaded_file.size} bytes"
        
        # カードを作成してイメージを直接アタッチ
        card = Card.create!(
          name: uploaded_file.original_filename,
          deck_id: nil # 一時的に未紐付けのカードとして保存
        )
        
        # 画像をアタッチ
        card.image.attach(
          io: uploaded_file.tempfile,
          filename: uploaded_file.original_filename,
          content_type: uploaded_file.content_type
        )
        
        Rails.logger.info "Card created and image attached: #{card.id}"
        
        # URL生成
        card_image_url = card.image_url
        blob_url = url_for(card.image)
        
        Rails.logger.info "Generated URL (blob): #{blob_url}"
        Rails.logger.info "Card image_url (permanent): #{card_image_url}"
        
        render json: { 
          id: card.id,
          imageUrl: blob_url,
          image_url: card_image_url,
          name: card.name
        }
      rescue => e
        Rails.logger.error "Upload error: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: "画像のアップロードに失敗しました: #{e.message}" }, status: :unprocessable_entity
      end
    end
  end
end 