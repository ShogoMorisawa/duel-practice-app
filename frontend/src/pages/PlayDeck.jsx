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
};

// 初期状態を定義
const initialState = {
  deck: null,
  restDeck: [],
  hand: [],
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

  return (
    <div>
      <h2>プレイ画面: {state.deck.name}</h2>
      <div>
        <h3>デッキ構成</h3>
        {state.deck.cards.map((card, index) => (
          <div key={index}>{card}</div>
        ))}
      </div>
      <button onClick={shuffleDeck}>デッキをシャッフル</button>
      <button onClick={drawCard} disabled={state.restDeck.length === 0}>
        カードを引く ({state.restDeck.length})
      </button>
      <div>
        <h3>手札 ({state.hand.length})</h3>
        <div>
          {state.hand.map((card, index) => (
            <div key={index}>{card}</div>
          ))}
        </div>
        <h3>残りのデッキ ({state.restDeck.length})</h3>
        <div>
          {state.restDeck.map((card, index) => (
            <div key={index}>{card}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default PlayDeck;
