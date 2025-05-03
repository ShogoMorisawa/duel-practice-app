module Api
  class UploadsController < ApplicationController
    def create
      if params[:image].blank?
        return render json: { error: "画像が選択されていません" }, status: :unprocessable_entity
      end

      begin
        image = params[:image]
        blob = ActiveStorage::Blob.create_and_upload!(
          io: image.tempfile,
          filename: image.original_filename,
          content_type: image.content_type
        )
        
        # シンプルなURL生成
        url = url_for(blob)
        Rails.logger.info "Generated URL: #{url}"
        Rails.logger.info "Blob key: #{blob.key}"
        Rails.logger.info "Blob signed_id: #{blob.signed_id}"
        
        render json: { imageUrl: url }
      rescue => e
        Rails.logger.error "Upload error: #{e.message}"
        Rails.logger.error e.backtrace.join("\n")
        render json: { error: "画像のアップロードに失敗しました: #{e.message}" }, status: :unprocessable_entity
      end
    end
  end
end 