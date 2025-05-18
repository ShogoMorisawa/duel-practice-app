import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  api,
  apiEndpoints,
  handleApiError,
  getAbsoluteImageUrl,
} from "../utils/api";

const DeckDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isGuestMode =
    id.startsWith("guest-") ||
    window.location.pathname.includes("/decks/guest/");

  // URLが相対パスかどうかを確認し、必要に応じて絶対URLに変換する関数
  const ensureAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;

    // 絶対URLに変換
    return getAbsoluteImageUrl(url);
  };

  const fetchDeck = async () => {
    setLoading(true);
    setError(null);

    // ゲストモードの場合はJSONからデッキデータを取得
    if (isGuestMode) {
      try {
        // ゲストデッキのIDを正規化
        const guestDeckId = id.startsWith("guest-") ? id : `guest-${id}`;

        // guestDecks.jsonからデータを取得
        const response = await fetch("/data/guestDecks.json");
        if (!response.ok) {
          throw new Error("ゲストデッキデータの取得に失敗しました");
        }

        const guestDecks = await response.json();
        const selectedDeck = guestDecks.find((deck) => deck.id === guestDeckId);

        if (!selectedDeck) {
          throw new Error("指定されたゲストデッキが見つかりません");
        }

        setDeck({
          ...selectedDeck,
          cards: selectedDeck.cards || [],
        });
        setLoading(false);
      } catch (error) {
        console.error("Error fetching guest deck:", error);
        setError({
          message: error.message || "ゲストデッキの取得に失敗しました",
        });
        setLoading(false);
      }
      return;
    }

    // 通常モード: APIからデッキデータを取得
    try {
      const response = await api.get(apiEndpoints.decks.getOne(id));
      setDeck(response.data.deck);
      setDeck((prevDeck) => ({
        ...prevDeck,
        cards: response.data.cards || [],
      }));
      setLoading(false);
    } catch (err) {
      const standardizedError = handleApiError(err, {
        context: "デッキ詳細取得",
      });
      setError(standardizedError);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeck();
  }, [id]);

  const handlePlayDeck = () => {
    if (isGuestMode) {
      // ゲストデッキのプレイページへ
      // guestId変数には完全なIDを渡す
      const guestId = id.startsWith("guest-") ? id : `guest-${id}`;
      navigate(`/play/guest/${guestId}`);
    } else {
      // 通常デッキのプレイページへ
      navigate(`/play/${id}`);
    }
  };

  if (loading)
    return (
      <div className="p-6 flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
        <p className="mt-4 text-gray-600">読み込み中...</p>
      </div>
    );

  if (error)
    return (
      <div className="p-6 text-center">
        <div className="bg-red-100 border border-red-300 rounded-md p-4 text-red-700 max-w-md mx-auto">
          <p className="font-medium mb-2">エラーが発生しました</p>
          <p className="mb-3">{error.message}</p>
          <button
            onClick={fetchDeck}
            className="px-4 py-2 bg-red-100 border border-red-500 rounded-md hover:bg-red-200 text-sm"
          >
            再試行
          </button>
        </div>
      </div>
    );

  if (!deck)
    return (
      <div className="p-6 text-center text-gray-600">
        デッキが見つかりません
      </div>
    );

  return (
    <div className="max-w-6xl px-4 py-8 mx-auto">
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="mb-6 pb-3 border-b-2 border-blue-500">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <div>
              <h2 className="text-2xl font-bold text-gray-800 mb-1">
                {deck.name}
                {isGuestMode && (
                  <span className="ml-2 inline-block bg-yellow-500 text-white px-2 py-1 text-xs font-bold rounded">
                    ゲストデッキ
                  </span>
                )}
              </h2>
            </div>
            <button
              onClick={handlePlayDeck}
              className="w-full sm:w-auto px-6 py-3 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow transition-colors duration-200 flex items-center justify-center"
            >
              <span className="mr-2">プレイする</span>
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            </button>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
          {deck.cards.map((card, i) => (
            <div
              key={i}
              className="w-full h-32 border rounded-md overflow-hidden flex items-center justify-center bg-gray-100"
            >
              {isGuestMode ? (
                // ゲストデッキの場合は直接imageUrlを使用
                <img
                  src={card.imageUrl}
                  alt={card.name || `カード${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(
                      "ゲストカード画像の読み込みに失敗:",
                      card.imageUrl
                    );
                    e.target.src = `/images/card-not-found.svg`;
                  }}
                />
              ) : card.id ? (
                <img
                  src={ensureAbsoluteUrl(
                    apiEndpoints.cards.getImageById(card.id)
                  )}
                  alt={card.name || `カード${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(
                      "直接cardIdのURLでの画像読み込みに失敗:",
                      apiEndpoints.cards.getImageById(card.id)
                    );

                    // まずdeck経由のURLを試す（フォールバック）
                    try {
                      const fallbackUrl = ensureAbsoluteUrl(
                        apiEndpoints.cards.getImage(deck.id, card.id)
                      );
                      console.log("フォールバックURLを試行:", fallbackUrl);
                      e.target.src = fallbackUrl;
                      e.target.onerror = () => {
                        // deck経由のURLも失敗した場合
                        console.error("フォールバックURLも失敗:", fallbackUrl);

                        // 最後のフォールバック：静的画像を使用
                        const staticFallback = ensureAbsoluteUrl(
                          apiEndpoints.cards.getFallbackImage()
                        );
                        if (staticFallback) {
                          console.log(
                            "静的フォールバック画像を使用:",
                            staticFallback
                          );
                          e.target.src = staticFallback;
                          e.target.onerror = () => {
                            e.target.style.display = "none"; // 最終的に失敗したら非表示
                          };
                        } else {
                          e.target.style.display = "none"; // 最終的に失敗したら非表示
                        }
                      };
                    } catch (e) {
                      // エラー時は非表示
                      e.target.style.display = "none";
                    }
                  }}
                />
              ) : card.image_url || card.imageUrl ? (
                <img
                  src={ensureAbsoluteUrl(card.image_url || card.imageUrl)}
                  alt={card.name || `カード${i + 1}`}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    console.error(
                      "従来のimageUrlでの読み込みに失敗:",
                      card.image_url || card.imageUrl
                    );

                    // 固定IPが含まれているか確認
                    const url = card.image_url || card.imageUrl;
                    if (url && url.match(/^https?:\/\/\d+\.\d+\.\d+\.\d+/)) {
                      try {
                        // URLをパースしてパスを取得し、現在のホストで再構築
                        const parsedUrl = new URL(url);
                        const path = parsedUrl.pathname;
                        const newUrl = `${window.location.origin}${path}`;
                        console.log("固定IPのURLを動的URLに変換:", newUrl);
                        e.target.src = newUrl;
                        return;
                      } catch {
                        // URL解析に失敗
                      }
                    }

                    // 最終的には静的フォールバックか非表示に
                    const staticFallback = ensureAbsoluteUrl(
                      apiEndpoints.cards.getFallbackImage()
                    );
                    if (staticFallback) {
                      console.log(
                        "静的フォールバック画像を使用:",
                        staticFallback
                      );
                      e.target.src = staticFallback;
                      e.target.onerror = () => {
                        e.target.style.display = "none";
                      };
                    } else {
                      e.target.style.display = "none";
                    }
                  }}
                />
              ) : (
                <div className="w-full h-full flex flex-col items-center justify-center p-2 text-center">
                  <div className="text-sm font-semibold mb-1 text-gray-700 truncate w-full">
                    {card.name || `カード${i + 1}`}
                  </div>
                  <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center text-gray-500">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-6 w-6"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default DeckDetail;
