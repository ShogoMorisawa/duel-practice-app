class User < ApplicationRecord
  # Include default devise modules. Others available are:
  # :confirmable, :lockable, :timeoutable, :trackable and :omniauthable
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable,
         :jwt_authenticatable, jwt_revocation_strategy: JwtDenylist
  # has_secure_password は Devise に置き換えるため不要
  # has_secure_password
  has_many :decks, dependent: :destroy
  has_many :cards, through: :decks
  has_many :study_sessions, dependent: :destroy
  has_many :study_records, through: :study_sessions
  validates :email, presence: true, uniqueness: true
  validates :password, presence: true, length: { minimum: 6 }, if: :password_required?
  validates :password_confirmation, presence: true, if: :password_required?

  private

  def password_required?
    new_record? || password.present?
  end
end
