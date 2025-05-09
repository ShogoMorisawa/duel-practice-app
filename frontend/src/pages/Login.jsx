import { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { api, apiEndpoints, handleApiError } from "../utils/api";

export default function Login() {
  console.log("Login: Component rendering");
  const { login } = useAuth();
  console.log("Login: useAuth result =", { login });
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    console.log("Login: Component mounted, login function =", login);
  }, [login]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      console.log("Login: Submitting form");
      const response = await api.post(apiEndpoints.auth.login(), {
        email,
        password,
      });

      console.log("Login: Login successful, response =", response.data);
      const { data } = response.data;
      console.log("Login: Login successful, calling login function");

      if (typeof login !== "function") {
        throw new Error("Login function is not available");
      }

      await login(data.token, data.user);
      navigate("/");
    } catch (err) {
      console.error("Login: Error occurred", err);
      const standardizedError = handleApiError(err, { context: "ログイン" });
      setError(standardizedError.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-6">
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-green-500">
          ログイン
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
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
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full px-4 py-2 text-white font-medium rounded-md ${
              isLoading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
            }`}
          >
            {isLoading ? "ログイン中..." : "ログイン"}
          </button>
        </form>
      </div>
    </div>
  );
}
