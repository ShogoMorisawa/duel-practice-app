Rails.application.routes.draw do

  post "/login", to: "auth#login"
  resources :users, only: [:create]  # 登録用
  resources :decks, only: [:index, :create, :destroy, :show]

  namespace :api do
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
