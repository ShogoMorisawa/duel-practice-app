import React, { useReducer, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  getAbsoluteImageUrl,
  apiEndpoints,
  handleApiError,
} from "../utils/api";
import { useAuth } from "../contexts/AuthContext";

const initialState = {
  name: "",
  cards: Array(40).fill({ name: "", imageUrl: null }),
  isSubmitting: false,
  error: null,
};

function deckFormReducer(state, action) {
  switch (action.type) {
    case "SET_NAME":
      return { ...state, name: action.payload };
    case "SET_CARD": {
      const newCards = [...state.cards];
      newCards[action.index] = action.payload;
      return { ...state, cards: newCards };
    }
    case "SUBMIT_START":
      return { ...state, isSubmitting: true, error: null };
    case "SUBMIT_SUCCESS":
      return { ...state, isSubmitting: false };
    case "SUBMIT_ERROR":
      return { ...state, isSubmitting: false, error: action.payload };
    default:
      return state;
  }
}

const NewDeckForm = () => {
  const [state, dispatch] = useReducer(deckFormReducer, initialState);
  const [currentPage, setCurrentPage] = useState(0);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }
  }, [isAuthenticated, navigate]);

  const handleCardDrop = async (e, index) => {
    e.preventDefault();
    const url = e.dataTransfer.getData("text/uri-list");

    // 既存の画像URLがドラッグされた場合
    if (url && url.startsWith("http")) {
      dispatch({
        type: "SET_CARD",
        index,
        payload: { name: "", imageUrl: url },
      });
      return;
    }

    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) {
      // まずローカルでプレビューを表示
      const localUrl = URL.createObjectURL(file);
      dispatch({
        type: "SET_CARD",
        index,
        payload: { name: file.name, imageUrl: localUrl },
      });

      try {
        const formData = new FormData();
        formData.append("image", file);

        const response = await api.post(
          apiEndpoints.uploads.create(),
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        // シンプルにURLを処理
        let imageUrl = response.data.imageUrl;

        // URLを絶対パスに変換（必要な場合）
        imageUrl = getAbsoluteImageUrl(imageUrl);
        console.log("使用するURL:", imageUrl);

        dispatch({
          type: "SET_CARD",
          index,
          payload: { name: file.name, imageUrl: imageUrl },
        });

        // ローカルURLを解放
        URL.revokeObjectURL(localUrl);
      } catch (error) {
        const standardizedError = handleApiError(error, {
          context: "画像アップロード",
        });
        dispatch({
          type: "SUBMIT_ERROR",
          payload: standardizedError.message,
        });
        // エラー時にもローカルURLを解放
        URL.revokeObjectURL(localUrl);
      }
    }
  };

  const handleCardDragStart = (e, card) => {
    if (card.imageUrl) {
      e.dataTransfer.setData("text/uri-list", card.imageUrl);
    }
  };

  const handleFileChange = async (e, index) => {
    const file = e.target.files[0];
    if (!file) return;

    // まずローカルでプレビューを表示
    const localUrl = URL.createObjectURL(file);
    dispatch({
      type: "SET_CARD",
      index,
      payload: { name: file.name, imageUrl: localUrl },
    });

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await api.post(apiEndpoints.uploads.create(), formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // シンプルにURLを処理
      let imageUrl = response.data.imageUrl;

      // URLを絶対パスに変換（必要な場合）
      imageUrl = getAbsoluteImageUrl(imageUrl);
      console.log("使用するURL:", imageUrl);

      dispatch({
        type: "SET_CARD",
        index,
        payload: { name: file.name, imageUrl: imageUrl },
      });

      // ローカルURLを解放
      URL.revokeObjectURL(localUrl);
    } catch (error) {
      const standardizedError = handleApiError(error, {
        context: "画像アップロード",
      });
      dispatch({
        type: "SUBMIT_ERROR",
        payload: standardizedError.message,
      });
      // エラー時にもローカルURLを解放
      URL.revokeObjectURL(localUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    dispatch({ type: "SUBMIT_START" });

    try {
      await api.post(apiEndpoints.decks.create(), {
        deck: {
          name: state.name,
          cards: state.cards,
        },
      });
      dispatch({ type: "SUBMIT_SUCCESS" });
      navigate("/");
    } catch (error) {
      const standardizedError = handleApiError(error, {
        context: "デッキ作成",
      });
      dispatch({ type: "SUBMIT_ERROR", payload: standardizedError.message });
    }
  };

  const renderCardInputs = () => {
    const pageStartIndex = currentPage * 8;
    const pageCards = state.cards.slice(pageStartIndex, pageStartIndex + 8);

    return (
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {pageCards.map((card, i) => {
          const index = pageStartIndex + i;
          return (
            <label
              key={index}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleCardDrop(e, index)}
              onDragStart={(e) => handleCardDragStart(e, card)}
              draggable={!!card.imageUrl}
              className="w-full h-32 border-2 border-dashed border-gray-400 rounded-md flex items-center justify-center bg-gray-50 relative cursor-pointer"
            >
              {card.imageUrl ? (
                <div className="w-full h-full relative">
                  <img
                    src={card.imageUrl}
                    alt={card.name || `カード${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      console.error(
                        "画像の読み込みに失敗しました:",
                        card.imageUrl
                      );

                      // 相対パスなら絶対URLに変換して再試行
                      if (card.imageUrl && !card.imageUrl.startsWith("http")) {
                        const newUrl = getAbsoluteImageUrl(card.imageUrl);
                        console.log("絶対URLに変換して再試行:", newUrl);
                        e.target.src = newUrl;
                        return;
                      }

                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              ) : (
                <span className="text-gray-400 text-sm whitespace-pre-line text-center">
                  ここにドロップ
                  <br />
                  またはクリック
                </span>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileChange(e, index)}
              />
            </label>
          );
        })}
      </div>
    );
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      {!isAuthenticated ? (
        <div className="text-center py-8">
          <p className="text-gray-600 mb-4">
            デッキを作成するにはログインが必要です
          </p>
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
          >
            ログインする
          </button>
        </div>
      ) : (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-lg shadow-md p-6"
        >
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-blue-500">
            デッキ作成
          </h2>

          <div className="mb-6">
            <label
              htmlFor="deck-name"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              デッキ名
            </label>
            <input
              id="deck-name"
              type="text"
              placeholder="デッキ名を入力してください"
              value={state.name}
              onChange={(e) =>
                dispatch({ type: "SET_NAME", payload: e.target.value })
              }
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-lg"
              required
            />
          </div>

          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              カード登録（40枚）
            </h3>

            {renderCardInputs()}

            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                disabled={currentPage === 0}
                onClick={() => setCurrentPage(currentPage - 1)}
                className={`px-4 py-2 rounded ${
                  currentPage === 0
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                前へ
              </button>

              <div className="text-gray-700 font-medium">
                ページ {currentPage + 1} / 5
              </div>

              <button
                type="button"
                disabled={currentPage === 4}
                onClick={() => setCurrentPage(currentPage + 1)}
                className={`px-4 py-2 rounded ${
                  currentPage === 4
                    ? "bg-gray-300 cursor-not-allowed"
                    : "bg-blue-500 text-white hover:bg-blue-600"
                }`}
              >
                次へ
              </button>
            </div>
          </div>

          {state.error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              エラー: {state.error}
            </div>
          )}

          <div className="flex justify-center mt-6">
            <button
              type="submit"
              className={`px-6 py-3 rounded-md text-white font-medium ${
                state.isSubmitting || !state.name.trim()
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              }`}
              disabled={state.isSubmitting || !state.name.trim()}
            >
              {state.isSubmitting ? "作成中..." : "デッキを作成"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
};

export default NewDeckForm;
