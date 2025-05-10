import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { api, apiEndpoints, handleApiError } from "../utils/api";

const DeckDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeck = async () => {
    setLoading(true);
    setError(null);

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
    navigate(`/play/${id}`);
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
    <div className="max-w-5xl mx-auto px-4 py-6">
      <div className="flex justify-between items-center mb-6 pb-2 border-b-2 border-blue-500">
        <h2 className="text-2xl font-bold text-gray-800">{deck.name}</h2>
        <button
          onClick={handlePlayDeck}
          className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white font-medium rounded-md shadow transition-colors duration-200 flex items-center"
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

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {deck.cards.map((card, i) => (
          <div
            key={i}
            className="w-full h-32 border rounded-md overflow-hidden flex items-center justify-center bg-gray-100"
          >
            {card.id ? (
              <img
                src={apiEndpoints.cards.getImageById(card.id)}
                alt={card.name || `カード${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  console.error(
                    "直接cardIdのURLでの画像読み込みに失敗:",
                    apiEndpoints.cards.getImageById(card.id)
                  );

                  // まずdeck経由のURLを試す（フォールバック）
                  try {
                    const fallbackUrl = apiEndpoints.cards.getImage(
                      deck.id,
                      card.id
                    );
                    console.log("フォールバックURLを試行:", fallbackUrl);
                    e.target.src = fallbackUrl;
                    e.target.onerror = () => {
                      // deck経由のURLも失敗した場合
                      console.error("フォールバックURLも失敗:", fallbackUrl);
                      e.target.style.display = "none"; // 最終的に失敗したら非表示
                    };
                  } catch (_) {
                    // エラー時は非表示
                    e.target.style.display = "none";
                  }
                }}
              />
            ) : card.image_url || card.imageUrl ? (
              <img
                src={card.image_url || card.imageUrl}
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
                    } catch (_) {
                      // URL解析に失敗
                    }
                  }

                  // 最終的には非表示に
                  e.target.style.display = "none";
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
  );
};

export default DeckDetail;
