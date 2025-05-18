Rails.application.routes.draw do
  # カスタムパスとコントローラーでDeviseを設定
  devise_for :users,
           path: '',
           path_names: {
             sign_in: 'login',
             sign_out: 'logout',
             registration: 'signup'
           },
           controllers: {
             sessions: 'users/sessions',
             registrations: 'users/registrations'
           }

  # 既存のログイン・ユーザー作成ルートはDeviseに置き換えるため不要
  # post "/login", to: "auth#login"
  # resources :users, only: [:create]  # 登録用

  namespace :api do
    # 認証関連のルート
    namespace :auth do
      devise_scope :user do
        post 'login', to: 'sessions#create'
        delete 'logout', to: 'sessions#destroy'
        post 'register', to: 'registrations#create'
      end
      # より明示的なルート
      post '/register', to: 'registrations#create'
      get 'profile', to: 'profiles#show'
    end

    # 既存のAPIルート
    resources :decks, only: [:index, :show, :create, :destroy] do
      resources :cards, only: [] do
        get 'image', to: 'decks#card_image', on: :member
      end
    end

    post 'uploads', to: 'uploads#create'
    
    # デッキIDなしでカード画像にアクセスするための直接ルート
    resources :cards, only: [] do
      get 'image', to: 'cards#image', on: :member
    end

    # 画像プロキシAPI（CORS対策用）
    get "proxy", to: "proxy#image"
    
    # 静的ファイルへのアクセスを許可
    get "/images/*path", to: "static#images"
  end
  
  # ActiveStorageのルーティング
  direct :rails_blob do |blob, options|
    route_for(:rails_service_blob, blob, options)
  end
  
  # Define your application routes per the DSL in https://guides.rubyonrails.org/routing.html

  # Reveal health status on /up that returns 200 if the app boots with no exceptions, otherwise 500.
  # Can be used by load balancers and uptime monitors to verify that the app is live.
  get "up" => "rails/health#show", as: :rails_health_check

  # Defines the root path route ("/")
  # root "posts#index"
end
