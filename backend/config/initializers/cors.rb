Rails.application.config.middleware.insert_before 0, Rack::Cors do
  allow do
    # ローカル開発でアクセスする可能性のあるフロントエンドのURLを列挙
    origins '*'

    resource '*',
      headers: :any,
      expose: ['Authorization'],
      methods: [:get, :post, :patch, :put, :delete, :options, :head],
      credentials: false
  end

  # ActiveStorage用の設定
  allow do
    origins '*'
    resource '/rails/active_storage/*',
      headers: :any,
      methods: [:get, :post, :patch, :put, :delete, :options, :head],
      credentials: false
  end
end
