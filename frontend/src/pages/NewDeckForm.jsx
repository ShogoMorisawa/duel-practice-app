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
  cards: Array(40).fill({ name: "", imageUrl: null, uploading: false }),
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

  // URLが相対パスかどうかを確認し、必要に応じて絶対URLに変換する関数
  const ensureAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;

    // 絶対URLに変換
    return getAbsoluteImageUrl(url);
  };

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

  // 画像URLから画像を取得する関数（CORSエラー対策含む）
  const fetchImageFromUrl = async (url) => {
    try {
      // 直接URLから取得を試みる
      const response = await fetch(url, { mode: "cors" });
      return await response.blob();
    } catch (error) {
      console.warn("直接画像の取得に失敗しました:", error);

      // CORSエラーの可能性があるため、サーバーサイドプロキシを使用して再試行
      try {
        // バックエンドにURLを渡してプロキシとして取得してもらう
        // Render側のプロキシAPIを絶対URLで指定
        const apiBaseUrl = "https://duel-practice-api.onrender.com";
        const proxyUrl = `${apiBaseUrl}/api/proxy?url=${encodeURIComponent(
          url
        )}`;
        console.log("プロキシURLを使用して再試行:", proxyUrl);

        const proxyResponse = await fetch(proxyUrl);
        if (!proxyResponse.ok) {
          throw new Error(`プロキシからの取得に失敗: ${proxyResponse.status}`);
        }
        return await proxyResponse.blob();
      } catch (proxyError) {
        console.error("プロキシを使用した画像取得にも失敗:", proxyError);
        throw proxyError; // 元の呼び出し元に再スロー
      }
    }
  };

  // カードIDを判定する関数（dmXXrpX-XXX形式）
  const isCardId = (text) => /^dm\d{2,}rp\d{1,}-[A-Za-z0-9]+$/.test(text);

  // URLからカードIDを抽出する関数
  const extractCardIdFromUrl = (url) => {
    const match = url.match(/id=([a-zA-Z0-9-]+)/);
    return match ? match[1] : null;
  };

  // カードIDから画像URLを構築する関数
  // const buildImageUrlFromCardId = (cardId) =>
  //   `https://dm.takaratomy.co.jp/wp-content/card/cardimage/${cardId}.jpg`;

  // プロキシ経由で画像を取得する関数
  const fetchImageFromProxy = async (url) => {
    const encodedUrl = encodeURIComponent(url);
    // 絶対URLを使用してRenderのバックエンドに直接リクエストを送信
    const response = await fetch(
      `https://duel-practice-api.onrender.com/api/proxy?url=${encodedUrl}`
    );
    if (!response.ok) throw new Error("プロキシ取得失敗");
    return await response.blob();
  };

  // BlobをFileに変換する関数
  const blobToFile = (blob, fileName) =>
    new File([blob], fileName, { type: blob.type });

  const handleCardDrop = async (e, index) => {
    e.preventDefault();

    // 使用可能なすべてのデータタイプを確認
    console.log("利用可能なドラッグデータタイプ:", e.dataTransfer.types);

    // まずtext/uri-listをチェック（一般的な画像ドラッグでよく使われる）
    let imageUrl = null;
    if (e.dataTransfer.types.includes("text/uri-list")) {
      imageUrl = e.dataTransfer.getData("text/uri-list");
      console.log("text/uri-listから取得したURL:", imageUrl);
    }

    // text/htmlからの画像URLを抽出（ウェブページから画像をドラッグした場合）
    if (!imageUrl && e.dataTransfer.types.includes("text/html")) {
      const htmlContent = e.dataTransfer.getData("text/html");
      console.log("HTMLコンテンツを受け取りました:", htmlContent);

      // imgタグからsrc属性を抽出
      const imgMatch = htmlContent.match(/<img[^>]+src="([^">]+)"/i);
      if (imgMatch && imgMatch[1]) {
        imageUrl = imgMatch[1];
        console.log("HTMLから抽出した画像URL:", imageUrl);
      }
    }

    // 通常のテキストデータを取得
    const data = e.dataTransfer.getData("text");

    try {
      // まずJSONとして解析を試みる（アプリ内カードドラッグの場合）
      const card = JSON.parse(data);
      if (card && card.name) {
        dispatch({
          type: "SET_CARD",
          index,
          payload: {
            name: card.name,
            imageUrl: card.imageUrl ? ensureAbsoluteUrl(card.imageUrl) : null,
            id: card.id || null, // 可能であればIDを保持
            uploading: false, // 既存カードのドロップはアップロード不要
          },
        });
        return; // 処理完了
      }
    } catch (error) {
      console.log("ドラッグデータはJSONではありません:", error);
      // JSONではない場合は続行（URLまたはカードIDとして処理）
    }

    // テキストデータがカードIDかURLから抽出したカードIDかをチェック
    let cardId = null;

    // データがカードID形式かチェック
    if (isCardId(data)) {
      console.log("カードID形式を検出:", data);
      cardId = data;
    }
    // データがカード詳細ページのURLかチェック
    else if (
      data.includes("takaratomy.co.jp/card/detail/") &&
      data.includes("id=")
    ) {
      cardId = extractCardIdFromUrl(data);
      console.log("URLからカードIDを抽出:", cardId);
    }

    // カードIDが取得できた場合、画像URLを構築
    if (cardId) {
      try {
        const cardImageUrl = cardId;
        console.log("カードIDから構築した画像URL:", cardImageUrl);

        // アップロード中フラグを設定
        dispatch({
          type: "SET_CARD",
          index,
          payload: {
            name: cardId, // 仮の名前としてカードID
            imageUrl: null, // 一時的にnull
            uploading: true,
          },
        });

        // プロキシ経由で画像を取得
        const blob = await fetchImageFromProxy(cardImageUrl);
        const fileName = `${cardId}.jpg`;

        // FormDataの作成
        const formData = new FormData();
        formData.append("file", blobToFile(blob, fileName));

        // APIにアップロード
        console.log("カード画像をアップロード:", fileName);
        const uploadResponse = await uploadApi.post(
          apiEndpoints.uploads.create(),
          formData,
          {
            headers: {
              "X-Requested-With": "XMLHttpRequest",
            },
          }
        );

        // アップロード成功ならカードを更新
        let responseImageUrl = uploadResponse.data.imageUrl;
        let permanent_url = uploadResponse.data.image_url;

        // 永続URLを優先し、ない場合は一時URLを使用
        let displayUrl = permanent_url || responseImageUrl;

        // 相対パスの場合は絶対URLに変換
        displayUrl = ensureAbsoluteUrl(displayUrl);
        console.log("使用するURL:", displayUrl);

        dispatch({
          type: "SET_CARD",
          index,
          payload: {
            name: cardId, // より良い名前があれば更新
            imageUrl: displayUrl,
            uploading: false, // アップロード完了
          },
        });
        return; // 処理完了
      } catch (error) {
        console.error("カード画像の取得/アップロードに失敗:", error);
        // エラー時
        dispatch({
          type: "SET_CARD",
          index,
          payload: {
            name: cardId || "エラー",
            imageUrl: null,
            uploading: false,
            error: true,
          },
        });
        return; // エラー処理完了
      }
    }

    // JSON形式でなく、カードIDでもない場合は、取得した画像URLまたはテキストデータをURLとして処理
    imageUrl = imageUrl || data;

    if (imageUrl) {
      try {
        // 画像URLからファイル名を抽出
        const fileName = imageUrl.split("/").pop() || "unknown";

        // アップロード中フラグを設定
        dispatch({
          type: "SET_CARD",
          index,
          payload: {
            name: fileName,
            imageUrl: imageUrl, // 元のURLを一時的に表示
            uploading: true,
          },
        });

        // 画像URLから直接または必要に応じてプロキシ経由で画像を取得
        const blob = await fetchImageFromUrl(imageUrl);

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
        let responseImageUrl = uploadResponse.data.imageUrl;
        let permanent_url = uploadResponse.data.image_url;

        // 永続URLを優先し、ない場合は一時URLを使用
        let displayUrl = permanent_url || responseImageUrl;

        // 相対パスの場合は絶対URLに変換（blobは変換しない）
        displayUrl = ensureAbsoluteUrl(displayUrl);
        console.log("使用するURL:", displayUrl);

        dispatch({
          type: "SET_CARD",
          index,
          payload: {
            name: fileName,
            imageUrl: displayUrl,
            uploading: false, // アップロード完了
          },
        });
      } catch (error) {
        console.error("URLからの画像取得に失敗しました:", error);
        // エラー時もフラグを解除
        dispatch({
          type: "SET_CARD",
          index,
          payload: {
            name: "エラー",
            imageUrl: null,
            uploading: false,
            error: true,
          },
        });
      }
    }
  };

  const handleCardDragStart = (e, card) => {
    e.dataTransfer.setData("text", JSON.stringify(card));
    if (card.imageUrl) {
      // 標準的なURL形式をセット
      e.dataTransfer.setData("text/uri-list", card.imageUrl);

      // HTMLタグとしてもセット（他のアプリケーションとの互換性向上）
      const htmlContent = `<img src="${card.imageUrl}" alt="${
        card.name || ""
      }">`;
      e.dataTransfer.setData("text/html", htmlContent);
    }
  };

  const handleFileChange = async (e, index) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 一時的なプレビュー用に画像URLを生成
    const localUrl = URL.createObjectURL(file);

    // 画像ファイルが選択されたら、一時的にローカルURLを表示しアップロード中フラグをセット
    dispatch({
      type: "SET_CARD",
      index,
      payload: {
        name: file.name,
        imageUrl: localUrl,
        uploading: true, // アップロード中フラグをセット
      },
    });

    // FormDataの作成
    const formData = new FormData();
    formData.append("file", file);

    try {
      // アップロードエンドポイントの確認
      console.log("Uploading to:", apiEndpoints.uploads.create());

      // 画像ファイルをアップロード
      const response = await uploadApi.post(
        apiEndpoints.uploads.create(),
        formData,
        {
          headers: {
            // Content-Typeヘッダーを指定せずaxiosに自動設定させる
            "X-Requested-With": "XMLHttpRequest",
          },
        }
      );

      // アップロード成功後、一時的なBlob URLを解放
      URL.revokeObjectURL(localUrl);

      // サーバーからの応答を確認
      console.log("Upload response:", response.data);

      // 永続的なURLを優先し、なければ一時的なURLを使用
      const permanentUrl = response.data.image_url;
      const tempUrl = response.data.imageUrl;
      let displayUrl = permanentUrl || tempUrl;

      // 相対パスの場合は絶対URLに変換
      displayUrl = ensureAbsoluteUrl(displayUrl);
      console.log("最終的に使用するURL:", displayUrl);

      dispatch({
        type: "SET_CARD",
        index,
        payload: {
          name: file.name,
          imageUrl: displayUrl,
          uploading: false, // アップロード完了フラグ
        },
      });
    } catch (error) {
      console.error("画像のアップロードに失敗しました:", error);
      // エラー発生時はアップロード失敗を通知
      dispatch({
        type: "SET_CARD",
        index,
        payload: {
          name: file.name,
          imageUrl: localUrl, // 元の画像URLを維持
          uploading: false, // エラー時もフラグを解除
          error: true, // エラーフラグを追加
        },
      });
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
      // 成功したらデッキ一覧ページに戻る
      navigate("/decks");
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
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {pageCards.map((card, i) => {
          const index = pageStartIndex + i;
          return (
            <label
              key={index}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => handleCardDrop(e, index)}
              onDragStart={(e) => handleCardDragStart(e, card)}
              draggable={!!card.imageUrl && !card.uploading}
              className={`w-full h-32 border-2 border-dashed ${
                card.error ? "border-red-400" : "border-gray-400"
              } rounded-md flex items-center justify-center bg-gray-50 relative ${
                card.uploading ? "cursor-wait" : "cursor-pointer"
              }`}
            >
              {card.id && deckId ? (
                <div className="w-full h-full relative">
                  <img
                    src={ensureAbsoluteUrl(
                      apiEndpoints.cards.getImage(deckId, card.id)
                    )}
                    alt={card.name || `カード${index + 1}`}
                    className="w-full h-full object-cover rounded-md"
                    onError={(e) => {
                      console.error(
                        "永続的なURLで画像の読み込みに失敗しました:",
                        apiEndpoints.cards.getImage(deckId, card.id)
                      );
                      e.target.onerror = null;

                      // フォールバックイメージを試す
                      const fallbackImage = ensureAbsoluteUrl(
                        apiEndpoints.cards.getFallbackImage()
                      );
                      if (fallbackImage) {
                        e.target.src = fallbackImage;
                        e.target.onerror = () => {
                          e.target.style.display = "none";
                        };
                      } else {
                        e.target.style.display = "none";
                      }
                    }}
                  />
                </div>
              ) : card.uploading && card.imageUrl ? (
                // 画像上にアップロード中のスピナー表示
                <div className="w-full h-full relative">
                  <img
                    src={ensureAbsoluteUrl(card.imageUrl)}
                    alt={card.name || `カード${index + 1}`}
                    className="w-full h-full object-cover rounded-md opacity-70"
                  />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-blue-500 z-10 bg-white bg-opacity-60 p-2 rounded-full"></div>
                  </div>
                </div>
              ) : card.imageUrl ? (
                <div className="w-full h-full relative">
                  <img
                    src={ensureAbsoluteUrl(card.imageUrl)}
                    alt={card.name || `カード${index + 1}`}
                    className={`w-full h-full object-cover rounded-md ${
                      card.error ? "opacity-50" : ""
                    }`}
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
                        const fallbackUrl = ensureAbsoluteUrl(
                          apiEndpoints.cards.getImage(null, card.id)
                        );
                        console.log(
                          "永続的なURLにフォールバック:",
                          fallbackUrl
                        );
                        e.target.src = fallbackUrl;
                        return;
                      }

                      // フォールバックイメージを試す
                      const fallbackImage = ensureAbsoluteUrl(
                        apiEndpoints.cards.getFallbackImage()
                      );
                      if (fallbackImage) {
                        console.log("フォールバック画像を使用:", fallbackImage);
                        e.target.src = fallbackImage;
                        e.target.onerror = () => {
                          e.target.style.display = "none";
                        };
                      } else {
                        e.target.style.display = "none";
                      }
                    }}
                  />
                  {card.error && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="bg-red-100 bg-opacity-80 p-2 rounded-full">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-8 w-8 text-red-600"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                          />
                        </svg>
                      </div>
                    </div>
                  )}
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
    <div className="max-w-6xl px-4 py-8 mx-auto">
      {!isAuthenticated ? (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
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
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-blue-500">
            デッキ作成
          </h2>

          <form onSubmit={handleSubmit}>
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

              <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <svg
                      className="h-5 w-5 text-yellow-400"
                      xmlns="http://www.w3.org/2000/svg"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-yellow-700">
                      公式サイトなどの画像をそのまま使うことはご遠慮ください。
                      <br />
                      必ずご自身で撮影した画像や、自作のカード画像をご利用ください。
                    </p>
                  </div>
                </div>
              </div>

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
              {/* アップロード中かどうかチェック */}
              {(() => {
                const isAnyUploading = state.cards.some(
                  (card) => card.uploading
                );
                return (
                  <button
                    type="submit"
                    className={`px-6 py-3 rounded-md text-white font-medium ${
                      state.isSubmitting || !state.name.trim() || isAnyUploading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-blue-500 hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    }`}
                    disabled={
                      state.isSubmitting || !state.name.trim() || isAnyUploading
                    }
                  >
                    {state.isSubmitting
                      ? "作成中..."
                      : isAnyUploading
                      ? "画像アップロード中..."
                      : "デッキを作成"}
                  </button>
                );
              })()}
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NewDeckForm;
