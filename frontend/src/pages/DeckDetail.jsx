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
                src={apiEndpoints.cards.getImage(deck.id, card.id)}
                alt={card.name || `カード${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none"; // 読み込み失敗したら非表示
                  console.error(
                    "画像の読み込みに失敗しました:",
                    apiEndpoints.cards.getImage(deck.id, card.id)
                  );
                }}
              />
            ) : card.image_url || card.imageUrl ? (
              <img
                src={card.image_url || card.imageUrl}
                alt={card.name || `カード${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none"; // 読み込み失敗したら非表示
                  console.error(
                    "画像の読み込みに失敗しました:",
                    card.image_url || card.imageUrl
                  );
                }}
              />
            ) : (
              <span className="text-xs text-gray-500">
                {card.name || `カード${i + 1}`}
              </span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DeckDetail;
