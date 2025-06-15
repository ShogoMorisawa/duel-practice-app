module Api
  class UploadsController < ApplicationController
    def create
      # リクエスト情報のログ記録
      Rails.logger.info "Content-Type: #{request.content_type}"
      Rails.logger.info "Parameters: #{params.keys.inspect}"
      
      # アップロードされたファイルを取得
      uploaded_file = params[:file] || params[:image]
      
      unless uploaded_file.is_a?(ActionDispatch::Http::UploadedFile)
        Rails.logger.error "Invalid file upload: #{uploaded_file.class}"
        return render json: { error: "有効な画像ファイルではありません" }, status: :unprocessable_entity
      end

      begin
        Rails.logger.info "Processing uploaded file: #{uploaded_file.original_filename}"
        Rails.logger.info "File content type: #{uploaded_file.content_type}"
        Rails.logger.info "File size: #{uploaded_file.size} bytes"
        
        # カードを作成
        card = Card.create!(
          name: uploaded_file.original_filename,
          deck_id: nil # 一時的に未紐付けのカードとして保存
        )
        
        # 画像を直接アタッチ（S3に最適化）
        card.image.attach(uploaded_file)
        
        # アタッチの成功を確認
        unless card.image.attached?
          raise "画像のアタッチに失敗しました"
        end
        
        Rails.logger.info "Card created and image attached: #{card.id}"
        Rails.logger.info "Storage service: #{card.image.blob.service_name}"
        Rails.logger.info "Storage key: #{card.image.blob.key}"
        
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