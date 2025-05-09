import React, { useReducer, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  api,
  uploadApi,
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

  // デッキIDの仮の状態管理（新規作成時は空文字）
  // eslint-disable-next-line no-unused-vars
  const [deckId, setDeckId] = useState("");

  // ページ移動前に古いblob URLをクリーンアップするための処理
  const handlePageChange = (newPage) => {
    // 現在のページの状態を処理
    const pageStartIndex = currentPage * 8;
    const pageCards = state.cards.slice(pageStartIndex, pageStartIndex + 8);

    // 古いblob URLをクリーンアップ
    pageCards.forEach((card) => {
      if (card.imageUrl && card.imageUrl.startsWith("blob:")) {
        try {
          URL.revokeObjectURL(card.imageUrl);
        } catch (e) {
          console.error("Failed to revoke blob URL:", e);
        }
      }
    });

    setCurrentPage(newPage);
  };

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login");
    }

    // コンポーネントのクリーンアップ時にすべてのblob URLを解放
    return () => {
      state.cards.forEach((card) => {
        if (card.imageUrl && card.imageUrl.startsWith("blob:")) {
          try {
            URL.revokeObjectURL(card.imageUrl);
          } catch (e) {
            console.error("Failed to revoke blob URL:", e);
          }
        }
      });
    };
  }, [isAuthenticated, navigate, state.cards]);

  const handleCardDrop = async (e, index) => {
    e.preventDefault();

    // ドラッグデータの取得
    const data = e.dataTransfer.getData("text");
    try {
      const card = JSON.parse(data);
      if (card && card.name) {
        dispatch({
          type: "SET_CARD",
          index,
          payload: {
            name: card.name,
            imageUrl: card.imageUrl || null,
            id: card.id || null, // 可能であればIDを保持
          },
        });
      }
    } catch (error) {
      console.error("ドラッグデータの解析に失敗しました:", error);
      // JSONでなければURLとして処理
      const imageUrl = data;
      if (imageUrl) {
        try {
          // 画像URLからファイル名を抽出
          const fileName = imageUrl.split("/").pop() || "unknown";

          // URLから画像を取得
          const response = await fetch(imageUrl);
          const blob = await response.blob();

          // FormDataの作成
          const formData = new FormData();
          formData.append("file", blob, fileName);

          // フォームデータの内容を確認（デバッグ用）
          console.log("Drag&Drop FormData entries:");
          for (let pair of formData.entries()) {
            console.log(
              `${pair[0]}: ${pair[1]} (${typeof pair[1]}, filename: ${
                blob.name || "N/A"
              })`
            );
          }

          // APIにアップロード
          console.log("Uploading drag&drop to:", apiEndpoints.uploads.create());
          const uploadResponse = await uploadApi.post(
            apiEndpoints.uploads.create(),
            formData,
            {
              headers: {
                // ヘッダーからContent-Typeを削除し、axiosに自動設定させる
                "X-Requested-With": "XMLHttpRequest",
              },
            }
          );

          // アップロード成功ならカードを更新
          let imageUrl = uploadResponse.data.imageUrl;
          let permanent_url = uploadResponse.data.image_url;

          // 永続URLを優先し、ない場合は一時URLを使用
          let displayUrl = permanent_url || imageUrl;

          // 相対パスの場合のみ絶対URLに変換（blobは変換しない）
          if (
            displayUrl &&
            !displayUrl.startsWith("http") &&
            !displayUrl.startsWith("blob:")
          ) {
            displayUrl = getAbsoluteImageUrl(displayUrl);
            console.log("使用するURL:", displayUrl);
          }

          dispatch({
            type: "SET_CARD",
            index,
            payload: { name: fileName, imageUrl: displayUrl },
          });
        } catch (error) {
          console.error("URLからの画像取得に失敗しました:", error);
        }
      }
    }
  };

  const handleCardDragStart = (e, card) => {
    e.dataTransfer.setData("text", JSON.stringify(card));
    if (card.imageUrl) {
      e.dataTransfer.setData("text/uri-list", card.imageUrl);
    }
  };

  const handleFileChange = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 一時的なプレビュー用に画像URLを生成
    const localUrl = URL.createObjectURL(file);

    // 画像ファイルが選択されたら、一時的にローカルURLを表示

    dispatch({
      type: "SET_CARD",
      index,
      payload: { name: file.name, imageUrl: localUrl },
    });

    // FormDataの作成
    const formData = new FormData();
    formData.append("file", file);

    // フォームデータの内容を確認（デバッグ用）
    console.log("FormData entries:");
    for (let pair of formData.entries()) {
      console.log(`${pair[0]}: ${pair[1]} (${typeof pair[1]})`);
    }

    try {
      // APIにアップロード
      console.log("Uploading to:", apiEndpoints.uploads.create());
      const response = await uploadApi.post(
        apiEndpoints.uploads.create(),
        formData,
        {
          headers: {
            // ヘッダーからContent-Typeを削除し、axiosに自動設定させる
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      // アップロード成功ならカードを更新
      let imageUrl = response.data.imageUrl;
      let permanent_url = response.data.image_url;

      // 永続URLを優先し、ない場合は一時URLを使用
      let displayUrl = permanent_url || imageUrl;

      // 相対パスの場合のみ絶対URLに変換（blobは変換しない）
      if (
        displayUrl &&
        !displayUrl.startsWith("http") &&
        !displayUrl.startsWith("blob:")
      ) {
        displayUrl = getAbsoluteImageUrl(displayUrl);
        console.log("使用するURL:", displayUrl);
      }

      // ローカルURLは不要になったので解放
      URL.revokeObjectURL(localUrl);

      // サーバーから返ってきたURLとIDを使ってカードを更新
      dispatch({
        type: "SET_CARD",
        index,
        payload: {
          name: file.name,
          imageUrl: displayUrl,
          id: response.data.id, // サーバーがIDを返す場合はここで保存
        },
      });
    } catch (error) {
      console.error("画像アップロードに失敗しました:", error);
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
      const response = await api.post(apiEndpoints.decks.create(), {
        deck: {
          name: state.name,
          cards: state.cards.map((card) => ({
            ...card,
            // idを明示的に含める
            id: card.id || undefined,
          })),
        },
      });

      // 新しいデッキIDを保存
      const newDeckId = response.data.id;
      setDeckId(newDeckId);
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
              {card.id && deckId ? (
                <div className="w-full h-full relative">
                  <img
                    src={apiEndpoints.cards.getImage(deckId, card.id)}
                    alt={card.name || `カード${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      console.error(
                        "永続的なURLで画像の読み込みに失敗しました:",
                        apiEndpoints.cards.getImage(deckId, card.id)
                      );
                      e.target.onerror = null;
                      e.target.style.display = "none";
                    }}
                  />
                </div>
              ) : card.imageUrl ? (
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

                      // blobURLの場合は非表示にする（再試行は無意味）
                      if (card.imageUrl && card.imageUrl.startsWith("blob:")) {
                        e.target.onerror = null;
                        e.target.style.display = "none";
                        return;
                      }

                      // ActiveStorageのURLで固定IPが含まれる場合は現在のホストに置き換える
                      if (
                        card.imageUrl &&
                        card.imageUrl.includes("/rails/active_storage/")
                      ) {
                        try {
                          // URLからパスだけ抽出（/rails/active_storage/...以降）
                          const urlObj = new URL(card.imageUrl);
                          const pathParts = urlObj.pathname.split("/");
                          const activePath = pathParts
                            .slice(pathParts.indexOf("rails"))
                            .join("/");

                          // 新しいホストベースのURLを構築
                          const newUrl = `${window.location.protocol}//${window.location.host}/${activePath}`;
                          console.log("ホスト名を置き換えた新しいURL:", newUrl);
                          e.target.src = newUrl;
                          return;
                        } catch (err) {
                          console.error("URL置換に失敗:", err);
                        }
                      }

                      // カードIDがあれば永続的なURLにフォールバック
                      if (card.id) {
                        const fallbackUrl = apiEndpoints.cards.getImage(
                          null,
                          card.id
                        );
                        console.log(
                          "永続的なURLにフォールバック:",
                          fallbackUrl
                        );
                        e.target.src = fallbackUrl;
                        return;
                      }

                      // 相対パスなら絶対URLに変換して再試行
                      if (card.imageUrl && !card.imageUrl.startsWith("http")) {
                        const newUrl = getAbsoluteImageUrl(card.imageUrl);
                        console.log("絶対URLに変換して再試行:", newUrl);
                        e.target.src = newUrl;
                        return;
                      }

                      // それでも失敗したら非表示
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
                onClick={() => handlePageChange(currentPage - 1)}
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
                onClick={() => handlePageChange(currentPage + 1)}
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
