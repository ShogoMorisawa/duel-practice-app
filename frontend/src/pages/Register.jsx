import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { api, apiEndpoints, handleApiError } from "../utils/api";

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // 入力検証
    if (password !== passwordConfirmation) {
      setError("パスワードが一致しません");
      return;
    }

    setIsLoading(true);

    try {
      const payload = {
        user: {
          email,
          password,
          password_confirmation: passwordConfirmation,
        },
      };

      console.log("Register: Sending request with data:", payload);
      console.log("Register: JSON payload:", JSON.stringify(payload));

      const response = await api.post(apiEndpoints.auth.register(), payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });

      console.log(
        "Register: Registration successful, response =",
        response.data
      );

      // レスポンスからトークンとユーザー情報を取得
      const { data } = response.data;

      if (data && data.token && data.user) {
        console.log("登録成功:", data.user.email);
        // 登録成功後、自動ログイン
        await login(data.token, data.user);
        navigate("/decks");
      } else {
        throw new Error("レスポンスデータが不正です");
      }
    } catch (err) {
      console.error("Register: Error occurred", err);
      console.error("エラー詳細:", {
        status: err.response?.status,
        data: JSON.stringify(err.response?.data),
        headers: err.response?.headers,
        message: err.message,
        errors: err.response?.data?.errors,
      });

      // エラーメッセージがバックエンドから返されていれば表示
      if (
        err.response?.data?.errors &&
        Array.isArray(err.response.data.errors)
      ) {
        setError(err.response.data.errors.join(", "));
      } else {
        const standardizedError = handleApiError(err, {
          context: "ユーザー登録",
        });
        setError(standardizedError.message);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-blue-500">
          アカウント登録
        </h2>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              メールアドレス
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="example@example.com"
            />
          </div>

          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <div>
            <label
              htmlFor="password-confirmation"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              パスワード（確認）
            </label>
            <input
              id="password-confirmation"
              type="password"
              value={passwordConfirmation}
              onChange={(e) => setPasswordConfirmation(e.target.value)}
              required
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2 text-white font-medium rounded-md ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            }`}
          >
            {isLoading ? "登録中..." : "登録する"}
          </button>

          <div className="text-center mt-4">
            <p className="text-sm text-gray-600">
              すでにアカウントをお持ちですか？{" "}
              <Link to="/login" className="text-blue-600 hover:underline">
                ログイン
              </Link>
            </p>
          </div>
        </form>
      </div>
    </div>
  );
}
