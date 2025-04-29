import { useEffect, useCallback, useReducer, useRef, useState } from "react";
import { useParams } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import axios from "axios";
import Card from "../components/Card";
import FreePlacementArea from "../components/FreePlacementArea";
import HandArea from "../components/HandArea";
import { createCard, getCardsByZone } from "../utils/cardUtils";

const CARD_WIDTH = 48;
const CARD_GAP = 12;
const TOTAL_WIDTH = 5 * CARD_WIDTH + 4 * CARD_GAP; // 5枚 + 4つの間隔
const FIELD_WIDTH = 800; // 仮に 800px
const START_X = (FIELD_WIDTH - TOTAL_WIDTH) / 2;

// アクションタイプを定義
const ACTIONS = {
  SET_DECK_INFO: "set_deck_info",
  ADD_CARD: "add_card",
  MOVE_CARD_ZONE: "move_card_zone",
  UPDATE_POSITION: "update_position",
  FLIP_CARD: "flip_card",
  ROTATE_CARD: "rotate_card",
  REMOVE_CARD: "remove_card",
  DRAW_CARD: "draw_card",
  SHUFFLE_DECK: "shuffle_deck",
  SET_LOADING: "set_loading",
};

// 初期状態
const initialState = {
  deckInfo: null, // デッキ情報 (name, cards配列など)
  cards: [], // すべてのカード（zone プロパティで区分）
  loading: true, // ローディング状態
};

// リデューサー関数を定義
function reducer(state, action) {
  console.log("[Reducer] Action:", action.type, "Payload:", action.payload);
  console.log("[Reducer] Current state:", state);

  switch (action.type) {
    case ACTIONS.SET_LOADING:
      return { ...state, loading: action.payload };

    case ACTIONS.SET_DECK_INFO:
      return { ...state, deckInfo: action.payload };

    case ACTIONS.ADD_CARD:
      console.log("[Reducer] Adding card:", action.payload);
      return { ...state, cards: [...state.cards, action.payload] };

    case ACTIONS.MOVE_CARD_ZONE: {
      const { id, newZone, newProps = {} } = action.payload;
      const newCards = state.cards.map((card) =>
        card.id === id
          ? {
              ...card,
              zone: newZone,
              // フィールドゾーンに移動する場合、座標情報を追加
              ...(newZone === "field" && !card.x ? { x: 0, y: 0 } : {}),
              // フィールドゾーン以外に移動する場合、座標情報を削除
              ...(newZone !== "field" ? { x: undefined, y: undefined } : {}),
              ...newProps,
            }
          : card
      );
      console.log("[Reducer] Moving card to zone:", id, newZone, newCards);
      return { ...state, cards: newCards };
    }

    case ACTIONS.UPDATE_POSITION: {
      const { id, x, y } = action.payload;
      const newCards = state.cards.map((card) =>
        card.id === id ? { ...card, x, y } : card
      );
      console.log("[Reducer] Updating position:", id, x, y, newCards);
      return { ...state, cards: newCards };
    }

    case ACTIONS.ROTATE_CARD: {
      const { id, rotation } = action.payload;
      const newCards = state.cards.map((card) =>
        card.id === id ? { ...card, rotation } : card
      );
      console.log("[Reducer] Rotating card:", id, rotation, newCards);
      return { ...state, cards: newCards };
    }

    case ACTIONS.FLIP_CARD: {
      const { id } = action.payload;
      const newCards = state.cards.map((card) =>
        card.id === id ? { ...card, isFlipped: !card.isFlipped } : card
      );
      console.log("[Reducer] Flipping card:", id, newCards);
      return { ...state, cards: newCards };
    }

    case ACTIONS.REMOVE_CARD: {
      const { id } = action.payload;
      const newCards = state.cards.filter((card) => card.id !== id);
      console.log("[Reducer] Removing card:", id, newCards);
      return { ...state, cards: newCards };
    }

    case ACTIONS.DRAW_CARD: {
      // 山札から手札へカードを1枚移動
      const deckCards = state.cards.filter((card) => card.zone === "deck");
      if (deckCards.length === 0) return state; // 山札が空なら何もしない

      const cardToDraw = deckCards[deckCards.length - 1];
      const newCards = state.cards.map((card) =>
        card.id === cardToDraw.id
          ? { ...card, zone: "hand", isFlipped: false }
          : card
      );
      console.log("[Reducer] Drawing card:", cardToDraw.id, newCards);
      return { ...state, cards: newCards };
    }

    case ACTIONS.SHUFFLE_DECK: {
      // 山札をシャッフル
      const deckCards = state.cards.filter((card) => card.zone === "deck");
      const otherCards = state.cards.filter((card) => card.zone !== "deck");

      // Fisher-Yates アルゴリズムでシャッフル
      const shuffled = [...deckCards];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      const newCards = [...otherCards, ...shuffled];
      console.log("[Reducer] Shuffling deck:", newCards);
      return { ...state, cards: newCards };
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
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 }); // 初期値を0に変更

  // 1. デッキデータ取得 Effect
  useEffect(() => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });
    axios
      .get(`http://localhost:3000/api/decks/${deckId}`)
      .then((res) => {
        // APIレスポンスに cards 配列が含まれているか確認
        if (res.data && Array.isArray(res.data.cards)) {
          dispatch({ type: ACTIONS.SET_DECK_INFO, payload: res.data });
        } else {
          console.error(
            "API response is missing or has invalid 'cards' array:",
            res.data
          );
          // エラー状態にするか、空のデッキとして扱うなどの処理
          dispatch({
            type: ACTIONS.SET_DECK_INFO,
            payload: { ...res.data, cards: [] },
          });
        }
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      })
      .catch((err) => {
        console.error("デッキ取得に失敗！", err);
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
        // エラー表示などの処理を追加しても良い
      });
  }, [deckId]); // deckId が変わった時だけ再実行

  // フィールドサイズの初期化ハンドラ
  const handleFieldInit = useCallback((size) => {
    console.log("フィールドサイズ取得:", size);
    setFieldSize(size);
  }, []);

  // 2. 初期設定 Effect (シャッフル、手札配布)
  useEffect(() => {
    // 初期化フラグが false で、deckデータとcards配列が存在し、フィールドサイズが取得されている場合のみ実行
    if (
      !initialized.current &&
      state.deckInfo &&
      state.deckInfo.cards &&
      state.deckInfo.cards.length > 0 &&
      fieldSize.width > 0 // フィールドサイズが取得されていることを確認
    ) {
      console.log("[PlayDeck] 初期化開始");
      console.log("[PlayDeck] デッキ情報:", state.deckInfo);
      console.log("[PlayDeck] フィールドサイズ:", fieldSize);

      // --- このブロックは初回のみ実行 ---
      initialized.current = true; // フラグを立てて再実行を防ぐ

      const cardDataList = [...state.deckInfo.cards];

      // シャッフル
      for (let i = cardDataList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardDataList[i], cardDataList[j]] = [cardDataList[j], cardDataList[i]];
      }

      // シールドカード
      const initialShield = cardDataList.slice(0, 5).map((cardData, i) =>
        createCard({
          name: cardData.name || "",
          imageUrl: cardData.imageUrl || null,
          zone: "field",
          isFlipped: true,
          x: fieldSize.width / 2 - (5 * 60) / 2 + i * 60,
          y: fieldSize.height / 2 + 80,
          rotation: 0,
        })
      );

      // 手札カード
      const initialHand = cardDataList.slice(5, 10).map((cardData) =>
        createCard({
          name: cardData.name || "",
          imageUrl: cardData.imageUrl || null,
          zone: "hand",
          isFlipped: false,
        })
      );

      // 山札カード
      const deckCards = cardDataList.slice(10).map((cardData) =>
        createCard({
          name: cardData.name || "",
          imageUrl: cardData.imageUrl || null,
          zone: "deck",
          isFlipped: true,
        })
      );

      // 一括でカードを追加
      [...initialShield, ...initialHand, ...deckCards].forEach((card) => {
        console.log("[PlayDeck] カード追加:", card);
        dispatch({ type: ACTIONS.ADD_CARD, payload: card });
      });
    }
  }, [state.deckInfo, fieldSize]); // fieldSizeを依存配列に追加

  // --- コールバック関数 ---

  // 場のカードの位置更新 (DraggableCard用)
  const handleMoveFieldCard = useCallback((moveInfo) => {
    // moveInfoは { id, x, y } の形式
    const { id, x, y } = moveInfo;

    dispatch({
      type: ACTIONS.UPDATE_POSITION,
      payload: {
        id,
        x: Math.round(x),
        y: Math.round(y),
      },
    });
  }, []);

  // 山札シャッフル
  const handleShuffleDeck = useCallback(() => {
    if (getCardsByZone(state.cards, "deck").length <= 1) return;
    dispatch({ type: ACTIONS.SHUFFLE_DECK });
  }, [state.cards]);

  // カードを引く
  const handleDrawCard = useCallback(() => {
    // 山札が0枚なら引けない
    if (getCardsByZone(state.cards, "deck").length === 0) return;
    dispatch({ type: ACTIONS.DRAW_CARD });
  }, [state.cards]);

  // 手札のカードを反転
  const handleFlipHandCard = useCallback((cardId) => {
    dispatch({
      type: ACTIONS.FLIP_CARD,
      payload: { id: cardId },
    });
  }, []);

  // 場のカードを回転（クリック時）
  const handleRotateFieldCard = useCallback(
    (cardId) => {
      console.log("[DEBUG] handleRotateFieldCard called with cardId:", cardId);

      const card = getCardsByZone(state.cards, "field").find(
        (card) => card.id === cardId
      );

      if (!card) {
        console.error("[ERROR] Card not found with id:", cardId);
        return;
      }

      // 現在の回転角度を取得
      const currentRotation = card.rotation || 0;

      // 次の回転角度を計算
      const newRotation = (currentRotation + 90) % 360;

      console.log(
        `[DEBUG] Rotating card from ${currentRotation} to ${newRotation} degrees`
      );

      dispatch({
        type: ACTIONS.ROTATE_CARD,
        payload: {
          id: cardId,
          rotation: newRotation,
        },
      });
    },
    [state.cards]
  );

  // 手札から場へのドロップ処理 (FreePlacementArea用)
  const handleDropToField = useCallback(
    (dropInfo) => {
      console.log("[DEBUG] handleDropToField called with:", dropInfo);
      console.log("[DEBUG] Item details:", {
        id: dropInfo.item?.id,
        name: dropInfo.item?.name,
        imageUrl: dropInfo.item?.imageUrl,
        type: dropInfo.item?.type,
        zone: dropInfo.item?.zone,
      });

      // dropInfoは { item, x, y } 形式で渡される
      const { item, x, y } = dropInfo;

      if (!item) {
        console.error("[PlayDeck] handleDropToField: item is undefined");
        return;
      }

      // item.type か item.zone で手札かどうかを判定
      const isHandCard = item.type === "hand" || item.zone === "hand";
      const isFieldCard = item.type === "field" || item.zone === "field";

      if (isHandCard) {
        // 手札から場へ - 新しいフィールドカードを作成
        console.log("[DEBUG] Creating field card from hand card:", {
          name: item.name,
          imageUrl: item.imageUrl,
          isFlipped: item.isFlipped,
          x: Math.round(x),
          y: Math.round(y),
          rotation: item.rotation,
        });

        const fieldCard = createCard({
          name: item.name || "", // nameがなければ空文字
          imageUrl: item.imageUrl || null, // 🔥 元のimageUrlを確実に引き継ぐ
          zone: "field",
          isFlipped: item.isFlipped || false,
          x: Math.round(x),
          y: Math.round(y),
          rotation: item.rotation || 0,
        });

        console.log("[DEBUG] Created field card:", fieldCard);

        // 手札のカードを非表示にする
        dispatch({
          type: ACTIONS.REMOVE_CARD,
          payload: { id: item.id },
        });

        // 新しいフィールドカードを追加
        dispatch({
          type: ACTIONS.ADD_CARD,
          payload: fieldCard,
        });
      } else if (isFieldCard) {
        // フィールド上のカードが移動した場合
        handleMoveFieldCard({
          id: item.id,
          x: Math.round(x),
          y: Math.round(y),
        });
      }
    },
    [state.cards, handleMoveFieldCard]
  );

  // --- レンダリング ---

  if (state.loading)
    return <div className="p-4 text-center">デッキデータをロード中...</div>;
  if (!state.deckInfo)
    return (
      <div className="p-4 text-center text-red-600">
        デッキ情報の読み込みに失敗しました。
      </div>
    );

  const fieldCards = getCardsByZone(state.cards, "field");

  return (
    <DndProvider backend={HTML5Backend}>
      <div className="flex flex-col h-screen bg-gray-100">
        {/* ヘッダー */}
        <header className="bg-gray-800 text-white shadow p-2 text-sm font-semibold flex justify-between items-center">
          <div>{state.deckInfo.name} - プレイ</div>
        </header>

        {/* メインゲーム領域 */}
        <div className="flex-1 flex flex-col p-1 md:p-2 overflow-hidden">
          {/* プレイエリア (FreePlacementArea) */}
          <div className="flex-1 relative mb-1 md:mb-2">
            <FreePlacementArea
              fieldCards={getCardsByZone(state.cards, "field")}
              onDropCard={handleDropToField}
              onMoveCard={handleMoveFieldCard}
              onClickCard={handleRotateFieldCard}
              onInit={handleFieldInit}
              className="w-full h-full bg-green-100 rounded shadow-inner border border-green-300 overflow-auto"
            />
          </div>

          {/* アクションエリア・コントロールパネル */}
          <div className="flex flex-col md:flex-row bg-gray-200 rounded shadow p-1 md:p-2 gap-1 md:gap-2">
            {/* 手札エリア */}
            <div className="flex flex-wrap justify-center items-center gap-1 p-1 bg-blue-100 rounded border border-blue-300 md:flex-1">
              {getCardsByZone(state.cards, "hand").map((card) => (
                <Card
                  key={card.id}
                  id={card.id}
                  name={card.name}
                  cost={card.cost}
                  isFlipped={card.isFlipped}
                  zone="hand"
                  onClick={() => handleFlipHandCard(card.id)}
                  imageUrl={card.imageUrl}
                />
              ))}
            </div>

            {/* 山札＆シャッフル */}
            <div className="flex items-center justify-center p-1 gap-2 bg-gray-300 rounded border border-gray-400">
              {/* 山札 */}
              <div className="flex flex-col items-center">
                <div className="text-xs mb-1 text-gray-700">
                  残り {getCardsByZone(state.cards, "deck").length} 枚
                </div>
                <div
                  className="relative cursor-pointer"
                  onClick={handleDrawCard}
                >
                  {getCardsByZone(state.cards, "deck").length > 0 && (
                    <Card
                      id="deck-top"
                      name="山札"
                      isFlipped={true}
                      type="deck"
                    />
                  )}
                </div>
              </div>
              {/* シャッフルボタン */}
              <button
                className="bg-blue-500 hover:bg-blue-600 text-white text-xs py-1 px-2 rounded"
                onClick={handleShuffleDeck}
                disabled={getCardsByZone(state.cards, "deck").length <= 1}
              >
                シャッフル
              </button>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default PlayDeck;
