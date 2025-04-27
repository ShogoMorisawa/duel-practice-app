import { useEffect, useCallback, useReducer, useRef } from "react";
import { useParams } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";
import Card from "../components/Card";
import DropZone from "../components/DropZone"; // DropZoneを使用する場合 (現状未使用)
import FreePlacementArea from "../components/FreePlacementArea";
import DraggableCard from "../components/DraggableCard"; // FreePlacementArea内で使用

// アクションタイプを定義
const ACTIONS = {
  SET_DECK: "set_deck",
  SET_LOADING: "set_loading",
  SET_REST_DECK: "set_rest_deck",
  SET_HAND: "set_hand",
  ADD_TO_HAND: "add_to_hand",
  REMOVE_FROM_HAND: "remove_from_hand",
  REMOVE_FROM_REST_DECK: "remove_from_rest_deck",
  ADD_TO_FIELD: "add_to_field",
  UPDATE_FIELD_CARD_POSITION: "update_field_card_position",
  REMOVE_FROM_FIELD: "remove_from_field", // 将来的に使用する場合
  FLIP_HAND_CARD: "flip_hand_card",
  ROTATE_FIELD_CARD: "rotate_field_card", // FLIP_FIELD_CARDの代わりに回転アクション
};

// 初期状態
const initialState = {
  deck: null, // デッキ情報 (name, cards配列など)
  restDeck: [], // 山札 (カードオブジェクトの配列)
  hand: [], // 手札のカード (カードオブジェクトの配列)
  fieldCards: [], // 場に配置されたカード (カードオブジェクト + 座標 の配列)
  loading: true, // ローディング状態
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
      // すでに同じカードIDが手札にある場合は追加しない（ドロー重複防止）
      if (state.hand.some((card) => card.id === action.payload.id)) {
        return state;
      }
      return { ...state, hand: [...state.hand, action.payload] };
    case ACTIONS.REMOVE_FROM_HAND: {
      const newState = {
        ...state,
        hand: state.hand.filter((card) => card.id !== action.payload.id),
      };
      return newState;
    }
    case ACTIONS.REMOVE_FROM_REST_DECK:
      // 山札から1枚取り除く (最新のものを想定)
      return { ...state, restDeck: state.restDeck.slice(0, -1) };

    // --- fieldCards 操作 ---
    case ACTIONS.ADD_TO_FIELD: {
      if (state.fieldCards.some((card) => card.id === action.payload.id)) {
        return state;
      }
      const newState = {
        ...state,
        fieldCards: [...state.fieldCards, action.payload],
      };
      // ★★★ 更新後の state.fieldCards を確認 ★★★
      return newState;
    }
    case ACTIONS.UPDATE_FIELD_CARD_POSITION: {
      return {
        ...state,
        fieldCards: state.fieldCards.map((card) =>
          card.id === action.payload.id
            ? {
                ...card,
                x: action.payload.x,
                y: action.payload.y,
                rotation: action.payload.rotation, // rotation値も更新
              }
            : card
        ),
      };
    }
    case ACTIONS.REMOVE_FROM_FIELD: // 将来的に場からカードを消す場合
      return {
        ...state,
        fieldCards: state.fieldCards.filter(
          (card) => card.id !== action.payload.id
        ),
      };

    // --- カード反転 ---
    case ACTIONS.FLIP_HAND_CARD:
      return {
        ...state,
        hand: state.hand.map((card) =>
          card.id === action.payload // payload は cardId
            ? { ...card, isFlipped: !card.isFlipped }
            : card
        ),
      };
    case ACTIONS.ROTATE_FIELD_CARD: {
      // payload は { id, rotation } の形式
      console.log("[DEBUG] ROTATE_FIELD_CARD action received:", action.payload);
      const targetCard = state.fieldCards.find(
        (card) => card.id === action.payload.id
      );
      console.log("[DEBUG] Target card before rotation:", targetCard);

      const newState = {
        ...state,
        fieldCards: state.fieldCards.map((card) =>
          card.id === action.payload.id
            ? { ...card, rotation: action.payload.rotation }
            : card
        ),
      };

      console.log("[DEBUG] fieldCards after rotation:", newState.fieldCards);
      return newState;
    }

    default:
      return state;
  }
}

// --- メインコンポーネント ---
function PlayDeck() {
  const { deckId } = useParams();
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false); // 初期化処理が実行されたかどうかのフラグ

  // 1. デッキデータ取得 Effect
  useEffect(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    axios
      .get(`http://localhost:3000/api/decks/${deckId}`)
      .then((res) => {
        // APIレスポンスに cards 配列が含まれているか確認
        if (res.data && Array.isArray(res.data.cards)) {
          dispatch({ type: ACTIONS.SET_DECK, payload: res.data });
        } else {
          console.error(
            "API response is missing or has invalid 'cards' array:",
            res.data
          );
          // エラー状態にするか、空のデッキとして扱うなどの処理
          dispatch({
            type: ACTIONS.SET_DECK,
            payload: { ...res.data, cards: [] },
          }); // 仮に空配列で設定
        }
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      })
      .catch((err) => {
        console.error("デッキ取得に失敗！", err);
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        // エラー表示などの処理を追加しても良い
      });
  }, [deckId]); // deckId が変わった時だけ再実行

  // 2. 初期設定 Effect (シャッフル、手札配布)
  useEffect(() => {
    // 初期化フラグが false で、deckデータとcards配列が存在する場合のみ実行
    if (
      !initialized.current &&
      state.deck &&
      state.deck.cards &&
      state.deck.cards.length > 0
    ) {
      // --- このブロックは初回のみ実行 ---
      initialized.current = true; // フラグを立てて再実行を防ぐ

      const cardNames = [...state.deck.cards]; // APIからのカード名配列

      // カード名をシャッフル
      for (let i = cardNames.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardNames[i], cardNames[j]] = [cardNames[j], cardNames[i]];
      }

      // カードオブジェクトを生成するヘルパー関数
      const createCardObject = (name, type, index, isFlipped = true) => ({
        id: `${type}-${name}-${index}-${Math.random()
          .toString(36)
          .substr(2, 9)}`, // より一意性の高いID
        name: name,
        cost: null, // APIにコスト情報がないため null
        isFlipped: isFlipped,
        type: type, // 'hand', 'deck' などのタイプ
        // x, y 座標は場に出た時に設定
      });

      // 最初の5枚はシールド (UI表示のみ、State管理外)

      // 次の5枚（インデックス 5〜9）を手札に
      const initialHand = cardNames.slice(5, 10).map(
        (name, i) => createCardObject(name, "hand", i, false) // 手札は表向き (isFlipped: false)
      );

      // 残り（インデックス 10〜）を山札に
      const remainingDeck = cardNames.slice(10).map(
        (name, i) => createCardObject(name, "deck", i, true) // 山札は裏向き (isFlipped: true)
      );

      dispatch({ type: ACTIONS.SET_HAND, payload: initialHand });
      dispatch({ type: ACTIONS.SET_REST_DECK, payload: remainingDeck });
      // --- 初回実行ブロックここまで ---
    }
  }, [state.deck]); // state.deck が変更されたら実行 (データ取得後に実行される)

  // --- コールバック関数 ---

  // 山札シャッフル
  const handleShuffleDeck = useCallback(() => {
    if (state.restDeck.length <= 1) return; // 1枚以下ならシャッフル不要

    const shuffled = [...state.restDeck];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    dispatch({ type: ACTIONS.SET_REST_DECK, payload: shuffled });
  }, [state.restDeck]);

  // カードを引く
  const handleDrawCard = useCallback(() => {
    if (state.restDeck.length === 0) return; // 山札が0枚なら引けない

    // 山札の一番上のカードを取得 (restDeckの最後尾と仮定)
    const drawnCardFromDeck = state.restDeck[state.restDeck.length - 1];

    // 手札用の新しいカードオブジェクトを作成（ID変更、表向きにする）
    const cardForHand = {
      ...drawnCardFromDeck,
      id: `hand-${drawnCardFromDeck.name}-${Math.random()
        .toString(36)
        .substr(2, 9)}`, // 新しい手札ID
      isFlipped: false, // 表向きにする
      type: "hand", // タイプを手札に
    };

    dispatch({ type: ACTIONS.ADD_TO_HAND, payload: cardForHand });
    dispatch({ type: ACTIONS.REMOVE_FROM_REST_DECK }); // 山札から削除
  }, [state.restDeck]);

  // 手札のカードを反転
  const handleFlipHandCard = useCallback((cardId) => {
    dispatch({ type: ACTIONS.FLIP_HAND_CARD, payload: cardId });
  }, []);

  // 場のカードを回転（クリック時）
  const handleRotateFieldCard = useCallback(
    (cardId) => {
      console.log("[DEBUG] handleRotateFieldCard called with cardId:", cardId);

      // 該当カードを検索
      const card = state.fieldCards.find((card) => card.id === cardId);
      console.log("[DEBUG] Found card:", card);

      if (!card) {
        console.error("[ERROR] Card not found with id:", cardId);
        return;
      }

      // 現在の回転角度から90度回転させる
      const currentRotation = card.rotation || 0;
      const newRotation = (currentRotation + 90) % 360;
      console.log(
        `[DEBUG] Rotating card from ${currentRotation} to ${newRotation} degrees`
      );

      dispatch({
        type: ACTIONS.ROTATE_FIELD_CARD,
        payload: {
          id: cardId,
          rotation: newRotation,
        },
      });
    },
    [state.fieldCards]
  );

  // 手札から場へのドロップ処理 (FreePlacementArea用)
  const handleDropToField = useCallback(
    (dropInfo) => {
      console.log("[DEBUG] handleDropToField called with:", dropInfo);

      // dropInfoは { item, x, y } 形式で渡される
      const { item, x, y } = dropInfo;

      if (!item) {
        console.error("[PlayDeck] handleDropToField: item is undefined");
        return;
      }

      if (item.type === "hand") {
        // 手札からドロップされた場合
        const droppedCard = state.hand.find(
          (card) => card && card.id === item.id
        );

        if (!droppedCard) {
          console.error(`[ERROR] Card not found with id: ${item.id}`);
          return;
        }

        // 場に置くためのカード情報を作成
        const cardForField = {
          ...droppedCard,
          id: `field-${droppedCard.name}-${Math.random()
            .toString(36)
            .substr(2, 9)}`,
          type: "field", // typeを明示的に"field"に設定
          x: Math.round(x),
          y: Math.round(y),
          rotation: 0, // 初期回転は0度
        };
        console.log(
          "[DEBUG] Creating field card with type:",
          cardForField.type
        );

        // 手札から削除して場に追加
        dispatch({
          type: ACTIONS.REMOVE_FROM_HAND,
          payload: { id: item.id },
        });

        dispatch({
          type: ACTIONS.ADD_TO_FIELD,
          payload: cardForField,
        });
      }
    },
    [state.hand]
  );

  // 場のカードの位置更新 (DraggableCard用)
  const handleMoveFieldCard = useCallback(
    (moveInfo) => {
      // moveInfoは { id, x, y } の形式
      const { id, x, y } = moveInfo;

      // 既存のカードを見つけて、その回転値を保持する
      const existingCard = state.fieldCards.find((card) => card.id === id);
      const rotation = existingCard ? existingCard.rotation || 0 : 0;

      dispatch({
        type: ACTIONS.UPDATE_FIELD_CARD_POSITION,
        payload: {
          id,
          x: Math.round(x),
          y: Math.round(y),
          rotation, // 既存の回転値を保持
        },
      });
    },
    [state.fieldCards]
  );

  // --- レンダリング ---

  if (state.loading)
    return <div className="p-4 text-center">デッキデータをロード中...</div>;
  if (!state.deck)
    return (
      <div className="p-4 text-center text-red-600">
        デッキ情報の読み込みに失敗しました。
      </div>
    );

  // ダミーのシールドカード（表示用、State管理外）
  const shieldCards = [...Array(5)].map((_, i) => ({
    id: `shield-${i}`,
    name: "シールド",
    isFlipped: true,
    type: "shield",
  }));

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* ヘッダー */}
        <header className="bg-gray-800 text-white shadow p-2 text-sm font-semibold flex justify-between items-center">
          <div>{state.deck.name} - プレイ</div>
          {/* 必要ならメニューボタンなどを追加 */}
        </header>

        {/* メインゲーム領域 */}
        <div className="flex-1 flex flex-col p-1 md:p-2 overflow-hidden">
          {/* プレイエリア (FreePlacementArea) */}
          <div className="flex-1 relative mb-1 md:mb-2">
            <FreePlacementArea
              fieldCards={state.fieldCards} // 場にあるカードの配列
              onDropCard={handleDropToField} // カードがドロップされた時の処理
              onMoveCard={handleMoveFieldCard} // 場にあるカードが移動した時の処理
              onClickCard={handleRotateFieldCard} // 場のカードクリック時に回転
              className="w-full h-full bg-green-100 rounded shadow-inner border border-green-300 overflow-auto" // overflow-autoを追加
            />
          </div>

          {/* 下部ゾーン (シールド、山札、墓地、手札など) */}
          <div className="flex flex-col gap-1 md:gap-2">
            {/* シールド・山札・墓地エリア */}
            <div className="bg-blue-50 rounded shadow border border-blue-200 p-1 md:p-2 flex justify-between items-center gap-2 md:gap-4">
              {/* シールドゾーン */}
              <div className="text-center">
                <div className="text-xs font-semibold text-blue-800 mb-1">
                  シールド
                </div>
                <div className="flex gap-1">
                  {shieldCards.map((card) => (
                    <Card key={card.id} {...card} />
                  ))}
                </div>
              </div>

              {/* 山札 */}
              <div className="text-center">
                <div className="text-xs font-semibold text-blue-800 mb-1">
                  山札
                </div>
                <div
                  className="relative w-12 h-16 cursor-pointer"
                  onClick={handleDrawCard}
                  title="クリックしてドロー"
                >
                  {state.restDeck.length > 0 ? (
                    <>
                      {/* 重なり表現 (少しずらす) */}
                      {state.restDeck.length > 2 && (
                        <div className="absolute top-0 left-0">
                          <Card
                            id="deck-dummy-2"
                            name="山札"
                            isFlipped={true}
                            type="deck"
                          />
                        </div>
                      )}
                      {state.restDeck.length > 1 && (
                        <div className="absolute top-0.5 left-0.5">
                          <Card
                            id="deck-dummy-1"
                            name="山札"
                            isFlipped={true}
                            type="deck"
                          />
                        </div>
                      )}
                      <div className="absolute top-1 left-1">
                        <Card
                          id="deck-top"
                          name="山札"
                          isFlipped={true}
                          type="deck"
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-white font-bold text-sm pointer-events-none">
                          {state.restDeck.length}
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="w-12 h-16 rounded border border-gray-400 border-dashed flex items-center justify-center">
                      <span className="text-gray-500 font-bold text-xs">0</span>
                    </div>
                  )}
                </div>
              </div>

              {/* 墓地 (今は表示のみ) */}
              <div className="text-center">
                <div className="text-xs font-semibold text-gray-600 mb-1">
                  墓地
                </div>
                <div className="w-12 h-16 rounded border border-gray-400 border-dashed flex items-center justify-center">
                  {/* 将来的に墓地のカードを表示 */}
                  <span className="text-gray-500 font-bold text-xs">0</span>
                </div>
              </div>

              {/* 操作ボタン */}
              <div className="flex flex-col gap-1">
                <button
                  className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-1 px-2 rounded text-xs disabled:bg-gray-400"
                  onClick={handleShuffleDeck}
                  disabled={state.restDeck.length <= 1}
                  title="山札をシャッフル"
                >
                  シャッフル
                </button>
                <button
                  className="bg-green-500 hover:bg-green-600 text-white font-bold py-1 px-2 rounded text-xs disabled:bg-gray-400"
                  onClick={handleDrawCard}
                  disabled={state.restDeck.length === 0}
                  title="山札からカードを1枚引く"
                >
                  ドロー
                </button>
              </div>
            </div>

            {/* 手札エリア */}
            <div className="bg-gray-800 p-1 md:p-2 rounded shadow">
              <h3 className="text-xs font-semibold mb-1 text-white">
                手札 ({state.hand.length})
              </h3>
              <div className="flex gap-1 overflow-x-auto pb-1 min-h-[4.5rem]">
                {state.hand.length > 0 ? (
                  state.hand.map((card) => (
                    <Card
                      key={card.id}
                      {...card} // カード情報をまとめて渡す
                      onClick={() => handleFlipHandCard(card.id)} // 手札クリックで反転
                    />
                  ))
                ) : (
                  <div className="flex items-center justify-center w-full text-gray-400 italic text-xs">
                    手札はありません。
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default PlayDeck;
