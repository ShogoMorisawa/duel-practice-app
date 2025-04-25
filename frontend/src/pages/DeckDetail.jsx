import { useEffect, useReducer } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// アクションタイプを定義
const ACTIONS = {
  SET_DECK: "set_deck",
};

// 初期状態を定義
const initialState = {
  deck: null,
  loading: true,
  error: null,
};

// リデューサー関数を定義
function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DECK:
      return { ...state, deck: action.payload, loading: false };
    case "SET_ERROR":
      return { ...state, error: action.payload, loading: false };
    default:
      return state;
  }
}

export default function DeckDetail() {
  const { id } = useParams();
  const [state, dispatch] = useReducer(reducer, initialState);

  useEffect(() => {
    axios
      .get(`http://localhost:3000/api/decks/${id}`)
      .then((res) => {
        dispatch({ type: ACTIONS.SET_DECK, payload: res.data });
        console.log(res.data);
      })
      .catch((err) => {
        console.error("デッキ取得に失敗！", err);
        dispatch({
          type: "SET_ERROR",
          payload: "デッキの読み込みに失敗しました",
        });
      });
  }, [id]);

  if (state.loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="text-gray-600">読み込み中...</div>
      </div>
    );
  }

  if (state.error || !state.deck) {
    return (
      <div className="bg-red-50 text-red-600 p-4 rounded-lg shadow mt-4">
        <p className="font-semibold">エラー</p>
        <p>{state.error || "デッキが見つかりません"}</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6">
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="bg-blue-600 p-6">
          <h2 className="text-2xl font-bold text-white">{state.deck.name}</h2>
        </div>

        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            カード一覧
          </h3>

          {state.deck.cards.length === 0 ? (
            <p className="text-gray-500">このデッキにはカードがありません</p>
          ) : (
            <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {state.deck.cards.map((card, index) => (
                <li
                  key={index}
                  className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:bg-gray-100 transition-colors"
                >
                  {card}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
