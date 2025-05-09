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
    end

    # 既存のAPIルート
    resources :decks, only: [:index, :show, :create, :destroy]
    post 'uploads', to: 'uploads#create'
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
