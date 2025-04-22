class Deck < ApplicationRecord
  belongs_to :user, optional: true
end
