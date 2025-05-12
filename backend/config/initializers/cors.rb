Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # 環境に応じてオリジンを設定
    origins Rails.env.production? ? [
      'https://duel-practice-app.vercel.app',  # 本番環境のフロントエンドURL
      /\.vercel\.app$/  # Vercelのプレビュー環境を許可
    ] : '*'

    resource '*',
      headers: :any,
      expose: ['Authorization'],
      methods: [:get, :post, :patch, :put, :delete, :options, :head],
      credentials: false
  end

  # ActiveStorage用の設定
  allow do
    origins Rails.env.production? ? [
      'https://duel-practice-app.vercel.app',  # 本番環境のフロントエンドURL
      /\.vercel\.app$/  # Vercelのプレビュー環境を許可
    ] : '*'
    
    resource '/rails/active_storage/*',
      headers: :any,
      methods: [:get, :post, :patch, :put, :delete, :options, :head],
      credentials: false
  end
end
