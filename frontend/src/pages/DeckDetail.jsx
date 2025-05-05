import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { api, apiEndpoints, handleApiError } from "../utils/api";

const DeckDetail = () => {
  const { id } = useParams();
  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchDeck = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await api.get(apiEndpoints.decks.getOne(id));
      setDeck(response.data);
      setLoading(false);
    } catch (err) {
      const standardizedError = handleApiError(err, { context: 'デッキ詳細取得' });
      setError(standardizedError);
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDeck();
  }, [id]);

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
      <h2 className="text-2xl font-bold text-gray-800 mb-6 pb-2 border-b-2 border-blue-500">
        {deck.name}
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-4">
        {deck.cards.map((card, i) => (
          <div
            key={i}
            className="w-full h-32 border rounded-md overflow-hidden flex items-center justify-center bg-gray-100"
          >
            {card.imageUrl ? (
              <img
                src={card.imageUrl}
                alt={card.name || `カード${i + 1}`}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.style.display = "none"; // 読み込み失敗したら非表示
                  console.error("画像の読み込みに失敗しました:", card.imageUrl);
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
