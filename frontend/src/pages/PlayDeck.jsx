import { useEffect, useCallback, useReducer, useRef } from "react";
import { useParams } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";
import Card from "../components/Card";
import DropZone from "../components/DropZone";

// アクションタイプを定義
const ACTIONS = {
  SET_DECK: "set_deck",
  SET_LOADING: "set_loading",
  SET_REST_DECK: "set_rest_deck",
  SET_HAND: "set_hand",
  ADD_TO_HAND: "add_to_hand",
  REMOVE_FROM_HAND: "remove_from_hand",
  REMOVE_FROM_REST_DECK: "remove_from_rest_deck",
  FLIP_CARD: "flip_card",
  ADD_TO_BATTLE_ZONE: "add_to_battle_zone",
  ADD_TO_MANA_ZONE: "add_to_mana_zone",
  ADD_TO_GRAVEYARD: "add_to_graveyard",
  MOVE_CARD: "move_card",
};

// 初期状態を定義
const initialState = {
  deck: null,
  restDeck: [],
  hand: [],
  battleZone: [],
  manaZone: [],
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
    case ACTIONS.REMOVE_FROM_HAND: {
      return {
        ...state,
        hand: state.hand.filter((card) => card.id !== action.payload.id),
      };
    }
    case ACTIONS.REMOVE_FROM_REST_DECK:
      return { ...state, restDeck: state.restDeck.slice(0, -1) };
    case ACTIONS.FLIP_CARD: {
      const updated = state.hand.map((card) =>
        card.id === action.payload
          ? { ...card, isFlipped: !card.isFlipped }
          : card
      );
      return { ...state, hand: updated };
    }
    case ACTIONS.ADD_TO_BATTLE_ZONE:
      return {
        ...state,
        battleZone: [...state.battleZone, action.payload],
      };
    case ACTIONS.ADD_TO_MANA_ZONE:
      return {
        ...state,
        manaZone: [...state.manaZone, action.payload],
      };
    case ACTIONS.ADD_TO_GRAVEYARD:
      return {
        ...state,
        graveyard: [...state.graveyard, action.payload],
      };
    case ACTIONS.MOVE_CARD: {
      const { card, sourceZone, targetZone } = action.payload;

      // 元のゾーンからカードを削除
      const sourceState = { ...state };
      if (sourceZone === "hand") {
        sourceState.hand = sourceState.hand.filter((c) => c.id !== card.id);
      } else if (sourceZone === "battleZone") {
        sourceState.battleZone = sourceState.battleZone.filter(
          (c) => c.id !== card.id
        );
      } else if (sourceZone === "manaZone") {
        sourceState.manaZone = sourceState.manaZone.filter(
          (c) => c.id !== card.id
        );
      }

      // 対象のゾーンにカードを追加
      if (targetZone === "battleZone") {
        sourceState.battleZone = [...sourceState.battleZone, card];
      } else if (targetZone === "manaZone") {
        sourceState.manaZone = [...sourceState.manaZone, card];
      } else if (targetZone === "graveyard") {
        sourceState.graveyard = [...sourceState.graveyard, card];
      } else if (targetZone === "hand") {
        sourceState.hand = [...sourceState.hand, card];
      }

      return sourceState;
    }
    default:
      return state;
  }
}

function PlayDeck() {
  const { deckId } = useParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false);

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

  // deck データが取得できたら初期シャッフル（初回のみ実行）
  useEffect(() => {
    if (!initialized.current && state.deck && state.deck.cards) {
      // 初期化済みフラグを立てる
      initialized.current = true;

      // 初期時のみ全カードをシャッフル
      const shuffledDeck = [...state.deck.cards];
      for (let i = shuffledDeck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffledDeck[i], shuffledDeck[j]] = [shuffledDeck[j], shuffledDeck[i]];
      }

      // 最初の5枚をシールド用（State管理なし、UI表示のみ）
      // 次の5枚（5～9）を手札として設定（表向き）
      const initialHand = shuffledDeck.slice(5, 10).map((card) => ({
        ...card,
        isFlipped: false, // isFlipped=falseは表向き
        id: `hand-${Math.random().toString(36).substr(2, 9)}`, // 一意のIDを追加
      }));
      // 残り30枚を山札として設定（全て裏向き）
      const remainingDeck = shuffledDeck.slice(10).map((card) => ({
        ...card,
        isFlipped: true, // isFlipped=trueは裏向き
        id: `deck-${Math.random().toString(36).substr(2, 9)}`, // 一意のIDを追加
      }));

      dispatch({ type: ACTIONS.SET_HAND, payload: initialHand });
      dispatch({ type: ACTIONS.SET_REST_DECK, payload: remainingDeck });
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
    // 裏向きで引いたカードを表向きにする
    const drawnCard = {
      ...card,
      isFlipped: false,
      id: `hand-${Math.random().toString(36).substr(2, 9)}`, // 一意のIDを追加
    };
    dispatch({ type: ACTIONS.ADD_TO_HAND, payload: drawnCard });
    dispatch({ type: ACTIONS.REMOVE_FROM_REST_DECK });
  }, [state.restDeck]);

  // カードをめくる関数 - IDベースに変更
  const flipCard = useCallback((cardId) => {
    dispatch({ type: ACTIONS.FLIP_CARD, payload: cardId });
  }, []);

  // カードをドロップ処理するハンドラ
  const handleCardDrop = useCallback((card, targetZone) => {
    console.log(`カードをドロップ: ${card.name} を ${targetZone} に`);

    if (card.type === "hand") {
      // 手札から他のゾーンに移動
      dispatch({
        type: ACTIONS.MOVE_CARD,
        payload: {
          card,
          sourceZone: "hand",
          targetZone,
        },
      });
    } else if (card.type === "battle") {
      // バトルゾーンから他のゾーンに移動
      dispatch({
        type: ACTIONS.MOVE_CARD,
        payload: {
          card,
          sourceZone: "battleZone",
          targetZone,
        },
      });
    } else if (card.type === "mana") {
      // マナゾーンから他のゾーンに移動
      dispatch({
        type: ACTIONS.MOVE_CARD,
        payload: {
          card,
          sourceZone: "manaZone",
          targetZone,
        },
      });
    }
  }, []);

  if (state.loading) return <div>ロード中...</div>;
  if (!state.deck) return <div>デッキが見つかりません</div>;

  // カード1枚分の高さを定義
  const cardHeight = "h-24"; // 基本的なカードの高さ

  // ダミーのシールドカード（表示用）
  const shieldCards = [...Array(5)].map((_, i) => ({
    id: `shield-${i}`,
    name: "シールド",
    isFlipped: true,
  }));

  return (
    <DndProvider backend={HTML5Backend}>
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
          <DropZone
            type="battleZone"
            onDrop={handleCardDrop}
            className="flex-1 bg-green-100 rounded-lg shadow-inner border border-green-300 relative mb-2 overflow-auto"
          >
            <div className="absolute top-2 left-4 text-sm font-semibold text-green-800">
              バトルゾーン
            </div>
            {state.battleZone.length > 0 ? (
              <div className="flex flex-wrap gap-2 p-8">
                {state.battleZone.map((card) => (
                  <Card
                    key={card.id}
                    id={card.id}
                    name={card.name}
                    cost={card.cost}
                    isFlipped={card.isFlipped || false}
                    type="battle"
                  />
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center h-full text-gray-500 italic">
                ドラッグしてカードを配置
              </div>
            )}
          </DropZone>

          {/* 山札エリア - 高さをカード1枚分に固定 */}
          <div
            className={`${cardHeight} bg-blue-50 rounded-lg shadow-inner border border-blue-200 mb-2 flex items-center px-2 py-1`}
          >
            {/* シールドゾーン */}
            <div className="flex-1 mr-4">
              <div className="text-xs font-semibold text-green-800 mb-1 text-center">
                シールド
              </div>
              <div className="flex gap-1 justify-center">
                {shieldCards.map((card) => (
                  <Card
                    key={card.id}
                    id={card.id}
                    name={card.name}
                    isFlipped={card.isFlipped}
                    type="shield"
                  />
                ))}
              </div>
            </div>

            {/* 山札 */}
            <div className="text-center">
              <div className="text-xs font-semibold text-green-800 mb-1">
                山札
              </div>
              <div className="relative w-12 h-16">
                {/* 山札の重なり表現 */}
                <div className="absolute top-0 left-0">
                  <Card
                    id="deck-top-2"
                    name="山札"
                    isFlipped={true}
                    type="deck"
                  />
                </div>
                <div className="absolute top-0.5 left-0.5">
                  <Card
                    id="deck-top-1"
                    name="山札"
                    isFlipped={true}
                    type="deck"
                  />
                </div>
                <div className="absolute top-1 left-1 flex items-center justify-center">
                  <Card
                    id="deck-top"
                    name="山札"
                    isFlipped={true}
                    type="deck"
                  />
                  <span className="absolute text-white font-bold text-xs">
                    {state.restDeck.length}
                  </span>
                </div>
              </div>
            </div>

            {/* 墓地 */}
            <DropZone
              type="graveyard"
              onDrop={handleCardDrop}
              className="text-center ml-4"
            >
              <div className="text-xs font-semibold text-green-800 mb-1">
                墓地
              </div>
              <div className="w-12 h-16 rounded border border-gray-400 border-dashed flex items-center justify-center">
                <span className="text-gray-500 font-bold text-xs">
                  {state.graveyard.length}
                </span>
              </div>
            </DropZone>

            {/* ボタン */}
            <div className="flex flex-col gap-1 ml-4">
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

          {/* マナゾーン - 高さをカード1枚分に固定 */}
          <DropZone
            type="manaZone"
            onDrop={handleCardDrop}
            className={`${cardHeight} bg-yellow-50 rounded-lg shadow-inner border border-yellow-200 relative mb-2`}
          >
            <div className="absolute top-2 left-4 text-xs font-semibold text-yellow-800">
              マナゾーン ({state.manaZone.length})
            </div>
            {state.manaZone.length > 0 ? (
              <div className="flex flex-wrap gap-1 p-2 pt-6 overflow-auto">
                {state.manaZone.map((card) => (
                  <Card
                    key={card.id}
                    id={card.id}
                    name={card.name}
                    cost={card.cost}
                    isFlipped={false}
                    type="mana"
                  />
                ))}
              </div>
            ) : (
              <div className="flex justify-center items-center w-full h-full text-gray-500 italic text-sm">
                ドラッグしてマナを配置
              </div>
            )}
          </DropZone>
        </div>

        {/* 手札（画面下部固定） - 高さをカード1枚分に固定 */}
        <div className={`${cardHeight} bg-gray-800 border-t p-2 shadow-lg`}>
          <h3 className="text-xs font-semibold mb-1 text-white">
            手札 ({state.hand.length})
          </h3>
          <div className="flex gap-1 overflow-x-auto pb-1">
            {state.hand.map((card) => (
              <Card
                key={card.id}
                id={card.id}
                name={card.name}
                cost={card.cost}
                isFlipped={card.isFlipped}
                onClick={() => flipCard(card.id)}
                type="hand"
              />
            ))}
            {state.hand.length === 0 && (
              <div className="flex justify-center items-center w-full text-gray-400 italic text-xs">
                手札がありません。ドローボタンを押してカードを引きましょう。
              </div>
            )}
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default PlayDeck;
