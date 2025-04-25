import { useEffect, useCallback, useReducer } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// アクションタイプを定義
const ACTIONS = {
  SET_DECK: "set_deck",
  SET_LOADING: "set_loading",
  SET_REST_DECK: "set_rest_deck",
  SET_HAND: "set_hand",
  ADD_TO_HAND: "add_to_hand",
  REMOVE_FROM_REST_DECK: "remove_from_rest_deck",
  SET_SHIELDS: "set_shields",
  SET_MANA: "set_mana",
  SET_GRAVEYARD: "set_graveyard",
  ADD_TO_GRAVEYARD: "add_to_graveyard",
};

// 初期状態を定義
const initialState = {
  deck: null,
  restDeck: [],
  hand: [],
  shields: [],
  mana: [],
  graveyard: [],
  loading: true,
};

// リデューサー関数を定義
function reducer(state, action) {
  switch (action.type) {
    case ACTIONS.SET_DECK:
      return { ...state, deck: action.payload };
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };
    case ACTIONS.SET_REST_DECK:
      return { ...state, restDeck: action.payload };
    case ACTIONS.SET_HAND:
      return { ...state, hand: action.payload };
    case ACTIONS.ADD_TO_HAND:
      return { ...state, hand: [...state.hand, action.payload] };
    case ACTIONS.REMOVE_FROM_REST_DECK:
      return { ...state, restDeck: state.restDeck.slice(0, -1) };
    case ACTIONS.SET_SHIELDS:
      return { ...state, shields: action.payload };
    case ACTIONS.SET_MANA:
      return { ...state, mana: action.payload };
    case ACTIONS.SET_GRAVEYARD:
      return { ...state, graveyard: action.payload };
    case ACTIONS.ADD_TO_GRAVEYARD:
      return { ...state, graveyard: [...state.graveyard, action.payload] };
    default:
      return state;
  }
}

function PlayDeck() {
  const { deckId } = useParams();
  const [state, dispatch] = useReducer(reducer, initialState);

  // データ取得
  useEffect(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    axios
      .get(`http://localhost:3000/api/decks/${deckId}`)
      .then((res) => {
        dispatch({ type: ACTIONS.SET_DECK, payload: res.data });
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      })
      .catch((err) => {
        console.error("デッキ取得に失敗！", err);
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      });
  }, [deckId]);

  // deck データが取得できたら初期シャッフル
  useEffect(() => {
    if (state.deck && state.deck.cards) {
      // 初期時のみ全カードをシャッフル
      const shuffledDeck = [...state.deck.cards];
      for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
      }
      dispatch({ type: ACTIONS.SET_REST_DECK, payload: shuffledDeck });
      dispatch({ type: ACTIONS.SET_HAND, payload: [] }); // 初期時は手札をリセット
      dispatch({ type: ACTIONS.SET_GRAVEYARD, payload: [] }); // 墓地をリセット

      // シールドを5枚セット（デッキから上から5枚を取得）
      const shields = shuffledDeck.slice(0, 5);
      const remainingDeck = shuffledDeck.slice(5);
      dispatch({ type: ACTIONS.SET_SHIELDS, payload: shields });
      dispatch({ type: ACTIONS.SET_REST_DECK, payload: remainingDeck });

      // マナゾーンは初期時には空
      dispatch({ type: ACTIONS.SET_MANA, payload: [] });
    }
  }, [state.deck]);

  // シャッフル関数
  const shuffleDeck = useCallback(() => {
    if (!state.deck || !state.deck.cards) return;

    const shuffledDeck = [...state.restDeck];
    for (let i = shuffledDeck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
    }
    dispatch({ type: ACTIONS.SET_REST_DECK, payload: shuffledDeck });
  }, [state.restDeck]);

  // カードを引く関数
  const drawCard = useCallback(() => {
    if (state.restDeck.length === 0) return;

    const card = state.restDeck[state.restDeck.length - 1];
    dispatch({ type: ACTIONS.ADD_TO_HAND, payload: card });
    dispatch({ type: ACTIONS.REMOVE_FROM_REST_DECK });
  }, [state.restDeck]);

  if (state.loading) return <div>ロード中...</div>;
  if (!state.deck) return <div>デッキが見つかりません</div>;

  // カード1枚分の高さを定義
  const cardHeight = "h-24"; // 基本的なカードの高さ

  return (
    <div className="relative flex flex-col h-screen bg-green-50">
      {/* ヘッダー */}
      <header className="bg-gray-800 text-white shadow p-2 text-lg font-bold flex justify-between items-center">
        <div>{state.deck.name} - プレイ画面</div>
        <button className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-3 rounded text-sm">
          メニュー
        </button>
      </header>

      {/* ゲーム領域 - flex-1で残りの高さを全て使う */}
      <div className="flex-1 flex flex-col p-2 overflow-hidden">
        {/* バトルゾーン - 残りの高さを全て使用 */}
        <div className="flex-1 bg-green-100 rounded-lg shadow-inner border border-green-300 relative mb-2 overflow-auto">
          <div className="absolute top-2 left-4 text-sm font-semibold text-green-800">
            バトルゾーン
          </div>
          <div className="flex justify-center items-center h-full text-gray-500 italic">
            ドラッグしてカードを配置
          </div>
        </div>

        {/* シールド・山札・墓地エリア - 高さをカード1枚分に固定 */}
        <div
          className={`${cardHeight} bg-blue-50 rounded-lg shadow-inner border border-blue-200 mb-2 flex justify-between items-center px-2 py-1`}
        >
          {/* シールドゾーン */}
          <div className="flex-1">
            <div className="text-xs font-semibold text-green-800 mb-1 text-center">
              シールド ({state.shields.length})
            </div>
            <div className="flex gap-1 justify-center">
              {[...Array(5)].map((_, index) => (
                <div
                  key={index}
                  className={`w-12 h-16 rounded border ${
                    index < state.shields.length
                      ? "bg-white border-blue-500 shadow-sm"
                      : "border-gray-300 border-dashed"
                  }`}
                ></div>
              ))}
            </div>
          </div>

          {/* 右側：山札・墓地・ボタン */}
          <div className="flex gap-2 items-center">
            {/* 山札 */}
            <div className="text-center">
              <div className="text-xs font-semibold text-green-800 mb-1">
                山札
              </div>
              <div className="relative w-12 h-16">
                <div className="absolute top-0 left-0 w-12 h-16 bg-blue-800 rounded border border-blue-900 shadow-sm"></div>
                <div className="absolute top-0.5 left-0.5 w-12 h-16 bg-blue-800 rounded border border-blue-900 shadow-sm"></div>
                <div className="absolute top-1 left-1 w-12 h-16 bg-blue-800 rounded border border-blue-900 shadow-sm flex items-center justify-center">
                  <span className="text-white font-bold text-xs">
                    {state.restDeck.length}
                  </span>
                </div>
              </div>
            </div>

            {/* 墓地 */}
            <div className="text-center">
              <div className="text-xs font-semibold text-green-800 mb-1">
                墓地
              </div>
              <div className="w-24 h-16 rounded border border-gray-400 border-dashed flex items-center justify-center">
                <span className="text-gray-500 font-bold text-xs">
                  {state.graveyard.length}
                </span>
              </div>
            </div>

            {/* ボタン */}
            <div className="flex flex-col gap-1">
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs"
                onClick={shuffleDeck}
              >
                シャッフル
              </button>
              <button
                className={`${
                  state.restDeck.length === 0
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-green-500 hover:bg-green-600"
                } text-white font-bold py-1 px-2 rounded text-xs`}
                onClick={drawCard}
                disabled={state.restDeck.length === 0}
              >
                ドロー
              </button>
            </div>
          </div>
        </div>

        {/* マナゾーン - 高さをカード1枚分に固定 */}
        <div
          className={`${cardHeight} bg-yellow-50 rounded-lg shadow-inner border border-yellow-200 relative mb-2`}
        >
          <div className="absolute top-2 left-4 text-xs font-semibold text-yellow-800">
            マナゾーン ({state.mana.length})
          </div>
          <div className="flex flex-wrap gap-1 p-2 pt-6 overflow-auto">
            {state.mana.length > 0 ? (
              state.mana.map((card, index) => (
                <div
                  key={index}
                  className="bg-yellow-100 border border-yellow-300 shadow rounded w-12 h-16 flex flex-col justify-between p-1 text-xs"
                >
                  <div className="font-bold text-center truncate text-[8px]">
                    {card.name}
                  </div>
                </div>
              ))
            ) : (
              <div className="flex justify-center items-center w-full h-full text-gray-500 italic text-sm">
                ドラッグしてマナを配置
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 手札（画面下部固定） - 高さをカード1枚分に固定 */}
      <div className={`${cardHeight} bg-gray-800 border-t p-2 shadow-lg`}>
        <h3 className="text-xs font-semibold mb-1 text-white">
          手札 ({state.hand.length})
        </h3>
        <div className="flex gap-1 overflow-x-auto pb-1">
          {state.hand.map((card, index) => (
            <div
              key={index}
              className="bg-white border border-gray-300 shadow rounded p-1 w-12 h-16 flex flex-col justify-between text-xs cursor-pointer hover:shadow-md transition-shadow"
              draggable="true"
            >
              <div className="font-bold text-center truncate text-[8px]">
                {card.name}
              </div>
              <div className="text-[8px] text-center">{card.cost}</div>
            </div>
          ))}
          {state.hand.length === 0 && (
            <div className="flex justify-center items-center w-full text-gray-400 italic text-xs">
              手札がありません。ドローボタンを押してカードを引きましょう。
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default PlayDeck;
