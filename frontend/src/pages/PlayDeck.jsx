import { useEffect, useCallback, useReducer, useRef, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DndProvider } from "react-dnd";
import { HTML5Backend } from "react-dnd-html5-backend";
import { TouchBackend } from "react-dnd-touch-backend";
import {
  api,
  apiEndpoints,
  handleApiError,
  getAbsoluteImageUrl,
} from "../utils/api";
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
  SET_ERROR: "set_error",
};

// 初期状態
const initialState = {
  deckInfo: null, // デッキ情報 (name, cards配列など)
  cards: [], // すべてのカード（zone プロパティで区分）
  loading: true, // ローディング状態
  error: null, // エラー状態を追加
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

    case ACTIONS.SET_ERROR:
      return { ...state, error: action.payload, loading: false };

    case ACTIONS.ADD_CARD:
      console.log("[Reducer] Adding card:", action.payload);
      return { ...state, cards: [...state.cards, action.payload] };

    case ACTIONS.MOVE_CARD_ZONE: {
      const { id, newZone, newProps = {}, insertAtTop } = action.payload;

      // ① 対象カードを更新
      const updatedCard = state.cards.find((card) => card.id === id);
      if (!updatedCard) {
        console.error(
          `[Reducer] Card with id ${id} not found for MOVE_CARD_ZONE`
        );
        return state;
      }

      console.log(
        `[Reducer] Moving card ${id} from ${updatedCard.zone} to ${newZone}`
      );
      console.log("[Reducer] Original card:", updatedCard);
      console.log("[Reducer] New props:", newProps);

      const modifiedCard = {
        ...updatedCard,
        zone: newZone,
        ...(newZone === "field" && !updatedCard.x ? { x: 0, y: 0 } : {}),
        ...(newZone !== "field" ? { x: undefined, y: undefined } : {}),
        ...newProps,
        // 重要な情報は常に維持
        deckId: newProps.deckId || updatedCard.deckId,
        cardId: newProps.cardId || updatedCard.cardId || updatedCard.id,
        imageUrl: newProps.imageUrl || updatedCard.imageUrl,
        name: newProps.name || updatedCard.name,
        cost: newProps.cost || updatedCard.cost,
      };

      console.log("[Reducer] Modified card:", modifiedCard);

      // ② 対象カードを除いた配列を作成
      const remainingCards = state.cards.filter((card) => card.id !== id);

      // ③ zoneが"deck"で insertAtTop の場合、先頭 or 末尾に挿入
      const newCards =
        newZone === "deck"
          ? insertAtTop
            ? [modifiedCard, ...remainingCards]
            : [...remainingCards, modifiedCard]
          : [...remainingCards, modifiedCard];

      return {
        ...state,
        cards: newCards,
      };
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
      const { id } = action.payload;
      const newCards = state.cards.map((card) =>
        card.id === id
          ? {
              ...card,
              rotation: ((card.rotation || 0) + 90) % 360,
            }
          : card
      );
      return { ...state, cards: newCards };
    }

    case ACTIONS.FLIP_CARD: {
      const { id } = action.payload;
      const cardToFlip = state.cards.find((card) => card.id === id);

      // カードが見つからない場合は何もしない
      if (!cardToFlip) return state;

      const newCards = state.cards.map((card) =>
        card.id === id
          ? {
              ...card,
              isFlipped: !card.isFlipped,
              // deckIdとcardIdを明示的に維持する
              deckId: card.deckId,
              cardId: card.cardId || card.id,
            }
          : card
      );

      console.log("[Reducer] Flipping card:", id, "New state:", newCards);
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

      // 山札の一番上（配列の先頭）のカードを引く
      const cardToDraw = deckCards[0];
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

// タッチデバイス判定の追加
const isTouchDevice = () => {
  return (
    "ontouchstart" in window ||
    navigator.maxTouchPoints > 0 ||
    navigator.msMaxTouchPoints > 0
  );
};

// スマホ用グローバル変数の初期化（ファイル先頭部分に追加）
// スマホ向けのグローバルフラグを設定
if (typeof window !== "undefined") {
  window.isMobileCardDragging = false;
  window.currentDraggedCard = null;
  window.lastTouchPosition = null;
}

// --- メインコンポーネント ---
function PlayDeck() {
  const { deckId } = useParams();
  const isGuestMode = deckId === "guest" || deckId.startsWith("guest-");
  const navigate = useNavigate();
  const [state, dispatch] = useReducer(reducer, initialState);
  const initialized = useRef(false); // 初期化処理が実行されたかどうかのフラグ
  const [fieldSize, setFieldSize] = useState({ width: 0, height: 0 });
  const [activeMode, setActiveMode] = useState(null); // アクティブなモードを一元管理
  const [isShuffling, setIsShuffling] = useState(false); // シャッフルアニメーション状態

  // URLが相対パスかどうかを確認し、必要に応じて絶対URLに変換する関数
  const ensureAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;

    // 絶対URLに変換
    try {
      return getAbsoluteImageUrl(url);
    } catch (error) {
      console.error("[PlayDeck] URL変換エラー:", error);
      // フォールバック画像を返す
      return "/images/card-not-found.svg";
    }
  };

  // モード切り替え関数
  const activateMode = useCallback((mode) => {
    setActiveMode((currentMode) => (currentMode === mode ? null : mode));
  }, []);

  const deactivateMode = useCallback(() => {
    setActiveMode(null);
  }, []);

  // モードの状態を確認する関数
  const isModeActive = useCallback(
    (mode) => {
      return activeMode === mode;
    },
    [activeMode]
  );

  // 1. デッキデータ取得 Effect
  const fetchDeck = async () => {
    dispatch({ type: ACTIONS.SET_LOADING, payload: true });

    // ゲストモードの場合はJSONファイルからデッキを取得
    if (isGuestMode) {
      try {
        // ゲストデッキのIDを抽出（guest-deck-1などの形式）
        let guestDeckId = deckId;

        // deckIdがすでにguest-で始まっていなければ、プレフィックスを追加
        if (!guestDeckId.startsWith("guest-")) {
          guestDeckId = `guest-${guestDeckId}`;
        }

        console.log("[PlayDeck] 使用するゲストデッキID:", guestDeckId);

        // ゲストデッキのJSONを取得
        const response = await fetch("/data/guestDecks.json");
        if (!response.ok) {
          throw new Error("ゲストデッキの取得に失敗しました");
        }

        const guestDecks = await response.json();
        console.log(
          "[PlayDeck] 取得したゲストデッキ一覧:",
          guestDecks.map((d) => d.id)
        );

        const selectedDeck = guestDecks.find((deck) => deck.id === guestDeckId);

        if (!selectedDeck) {
          throw new Error(
            `指定されたゲストデッキが見つかりません: ${guestDeckId}`
          );
        }

        console.log("[PlayDeck] ゲストデッキ情報をセットします:", selectedDeck);
        dispatch({ type: ACTIONS.SET_DECK_INFO, payload: selectedDeck });

        // ゲストモードではここでカードを追加せず、初期化Effectで統一的に配置する
        dispatch({ type: ACTIONS.SET_LOADING, payload: false });
      } catch (error) {
        console.error("Error loading guest deck:", error);
        dispatch({
          type: ACTIONS.SET_ERROR,
          payload: {
            message: error.message || "ゲストデッキの読み込みに失敗しました",
          },
        });
      }
      return;
    }

    // 通常モード：APIからデッキを取得
    try {
      const response = await api.get(apiEndpoints.decks.getOne(deckId), {
        onAuthError: () => navigate("/login"), // 認証エラー時はログインページへ
      });
      dispatch({ type: ACTIONS.SET_DECK_INFO, payload: response.data });
      dispatch({ type: ACTIONS.SET_LOADING, payload: false });
    } catch (error) {
      console.error("Error fetching deck:", error);
      const standardizedError = handleApiError(error, {
        context: "デッキデータ取得",
        onAuthError: () => navigate("/"), // 認証エラー時はトップページへ
      });
      dispatch({ type: ACTIONS.SET_ERROR, payload: standardizedError });
    }
  };

  useEffect(() => {
    fetchDeck();
  }, [deckId]);

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
      fieldSize.width > 0 && // フィールドサイズが取得されていることを確認
      state.cards.length === 0 // カードが追加されていない場合のみ実行（重複防止）
    ) {
      console.log("[PlayDeck] 初期化開始");
      console.log("[PlayDeck] デッキ情報:", state.deckInfo);
      console.log("[PlayDeck] フィールドサイズ:", fieldSize);
      console.log("[PlayDeck] カード枚数:", state.deckInfo.cards.length);

      // --- このブロックは初回のみ実行 ---
      initialized.current = true; // フラグを立てて再実行を防ぐ

      const cardDataList = [...state.deckInfo.cards];
      console.log("[PlayDeck] カードデータリスト:", cardDataList.length);

      // シャッフル
      for (let i = cardDataList.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [cardDataList[i], cardDataList[j]] = [cardDataList[j], cardDataList[i]];
      }

      // シールドカード
      const initialShield = cardDataList.slice(0, 5).map((cardData, i) => {
        const card = createCard({
          name: cardData.name || "",
          imageUrl: cardData.imageUrl
            ? ensureAbsoluteUrl(cardData.imageUrl)
            : "/images/card-not-found.svg", // フォールバック画像を設定
          zone: "field",
          isFlipped: true,
          x: fieldSize.width / 2 - (5 * 60) / 2 + i * 60,
          y: fieldSize.height / 2,
          rotation: 0,
          deckId: deckId,
          cardId: cardData.id,
        });
        console.log("[PlayDeck] シールドカード作成:", card);
        return card;
      });

      // 手札カード
      const initialHand = cardDataList.slice(5, 10).map((cardData) => {
        const card = createCard({
          name: cardData.name || "",
          imageUrl: cardData.imageUrl
            ? ensureAbsoluteUrl(cardData.imageUrl)
            : "/images/card-not-found.svg", // フォールバック画像を設定
          zone: "hand",
          isFlipped: false,
          deckId: deckId,
          cardId: cardData.id,
        });
        console.log("[PlayDeck] 手札カード作成:", card);
        return card;
      });

      // 山札カード
      const deckCards = cardDataList.slice(10).map((cardData) => {
        const card = createCard({
          name: cardData.name || "",
          imageUrl: cardData.imageUrl
            ? ensureAbsoluteUrl(cardData.imageUrl)
            : "/images/card-not-found.svg", // フォールバック画像を設定
          zone: "deck",
          isFlipped: true,
          deckId: deckId,
          cardId: cardData.id,
        });
        console.log("[PlayDeck] 山札カード作成:", card);
        return card;
      });

      console.log(
        "[PlayDeck] カード追加開始 - 合計枚数:",
        initialShield.length + initialHand.length + deckCards.length
      );

      // 一括でカードを追加
      [...initialShield, ...initialHand, ...deckCards].forEach((card) => {
        dispatch({ type: ACTIONS.ADD_CARD, payload: card });
      });

      console.log("[PlayDeck] カード追加完了");
    }
  }, [state.deckInfo, fieldSize, deckId, state.cards.length]);

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

    // シャッフルアニメーション開始
    setIsShuffling(true);

    // アニメーション終了後に実際のシャッフル処理を実行
    setTimeout(() => {
      dispatch({ type: ACTIONS.SHUFFLE_DECK });

      // アニメーション状態をリセット
      setTimeout(() => {
        setIsShuffling(false);
      }, 300);
    }, 500);
  }, [state.cards]);

  // カードを引く
  const handleDrawCard = useCallback(() => {
    // 山札が0枚なら引けない
    if (getCardsByZone(state.cards, "deck").length === 0) return;
    dispatch({ type: ACTIONS.DRAW_CARD });
  }, [state.cards]);

  // カードのクリック処理（フィールド・手札共通）
  const handleCardClick = useCallback(
    (cardId) => {
      console.log(
        "[DEBUG] PlayDeck.handleCardClick called with cardId:",
        cardId
      );

      const card = state.cards.find((card) => card.id === cardId);

      if (!card) {
        console.error("[ERROR] Card not found with id:", cardId);
        console.log(
          "[DEBUG] Available cards:",
          state.cards.map((c) => ({ id: c.id, zone: c.zone }))
        );
        return;
      }

      console.log("[DEBUG] Found card:", card);

      // 裏返しモードの場合
      if (
        isModeActive("flip") &&
        (card.zone === "field" || card.zone === "hand")
      ) {
        dispatch({
          type: ACTIONS.FLIP_CARD,
          payload: { id: cardId },
        });
        deactivateMode();
        return;
      }

      // 山札の上に戻すモードの場合
      if (
        isModeActive("deckTop") &&
        (card.zone === "field" || card.zone === "hand")
      ) {
        dispatch({
          type: ACTIONS.MOVE_CARD_ZONE,
          payload: {
            id: card.id,
            newZone: "deck",
            newProps: { isFlipped: true },
            insertAtTop: true,
          },
        });
        deactivateMode();
        return;
      }

      // 山札の下に戻すモードの場合
      if (
        isModeActive("deckBottom") &&
        (card.zone === "field" || card.zone === "hand")
      ) {
        dispatch({
          type: ACTIONS.MOVE_CARD_ZONE,
          payload: {
            id: card.id,
            newZone: "deck",
            newProps: { isFlipped: true },
            insertAtTop: false,
          },
        });
        deactivateMode();
        return;
      }

      // 通常時は回転
      if (card.zone === "field") {
        dispatch({
          type: ACTIONS.ROTATE_CARD,
          payload: {
            id: cardId,
            rotation: ((card.rotation || 0) + 90) % 360,
          },
        });
      }
    },
    [activeMode, state.cards, deactivateMode, isModeActive]
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
          deckId: deckId,
          cardId: item.cardId,
        });

        const fieldCard = createCard({
          name: item.name || "", // nameがなければ空文字
          imageUrl: item.imageUrl || null, // 🔥 元のimageUrlを確実に引き継ぐ
          zone: "field",
          isFlipped: item.isFlipped || false,
          x: Math.round(x),
          y: Math.round(y),
          rotation: item.rotation || 0,
          deckId: deckId,
          cardId: item.cardId || item.id, // cardIdがなければitemのidを使用
        });

        console.log("[DEBUG] Created field card:", fieldCard);

        // 新しいフィールドカードを追加（先に追加する）
        dispatch({
          type: ACTIONS.ADD_CARD,
          payload: fieldCard,
        });

        // 手札のカードを削除（後で削除する）
        dispatch({
          type: ACTIONS.REMOVE_CARD,
          payload: { id: item.id },
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
    [state.cards, handleMoveFieldCard, deckId]
  );

  // onDropFromFieldハンドラの修正
  const handleDropFromField = useCallback(
    (item) => {
      console.log("[PlayDeck] Field card dropped to hand:", item);

      // スマホからのドロップは特別なIDが必要なため、実際のIDを確認
      const cardId = item.id;

      // スマホの場合はitem.cardIdも確認（グローバル変数から取得した場合）
      const actualCard = state.cards.find(
        (card) =>
          card.id === cardId ||
          (card.cardId && card.cardId === item.cardId) ||
          // type/zoneのチェックも追加（ID不一致の場合の対応）
          card.id === item.cardId ||
          card.cardId === item.id
      );

      if (!actualCard) {
        console.error("[PlayDeck] Could not find card with id:", cardId);
        // デバッグ用にcardIdとstateを表示
        console.log("[PlayDeck] Debug card lookup:", {
          itemId: item.id,
          itemCardId: item.cardId,
          allCards: state.cards.map((c) => ({
            id: c.id,
            cardId: c.cardId,
            zone: c.zone,
          })),
        });

        // 最終手段としてフィールドのカードを探す
        const fieldCards = state.cards.filter((card) => card.zone === "field");
        if (fieldCards.length > 0) {
          console.log("[PlayDeck] Trying to find any field card as fallback");
          // カードが見つからない場合は、いずれかのフィールドカードを使用
          return handleDropFromField({ ...item, id: fieldCards[0].id });
        }

        return;
      }

      console.log("[PlayDeck] Found card to move to hand:", actualCard);

      // itemからの情報を確実に保持
      const cardInfo = {
        id: actualCard.id, // 見つかった実際のカードIDを使用
        newZone: "hand",
        newProps: {
          rotation: 0,
          isFlipped: false,
          // 重要: これらの情報を維持
          deckId: actualCard.deckId || item.deckId || deckId,
          cardId: actualCard.cardId || item.cardId || item.id,
          imageUrl: actualCard.imageUrl || item.imageUrl,
          name: actualCard.name || item.name,
          cost: actualCard.cost || item.cost,
        },
      };

      console.log("[PlayDeck] Moving card to hand with props:", cardInfo);

      // 成功を示すために一時的にグローバル変数をクリア
      if (window.currentDraggedCard) {
        window.currentDraggedCard = null;
        window.isMobileCardDragging = false;
      }

      // ステート更新
      dispatch({
        type: ACTIONS.MOVE_CARD_ZONE,
        payload: cardInfo,
      });
    },
    [state.cards, dispatch, deckId]
  );

  // --- レンダリング ---

  if (state.loading && !state.deckInfo)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500"></div>
        <p className="mt-6 text-lg text-gray-600">デッキデータをロード中...</p>
      </div>
    );

  if (state.error)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100 p-4">
        <div className="bg-red-100 border border-red-300 rounded-md p-6 text-red-700 max-w-lg w-full">
          <h2 className="text-xl font-bold mb-3">エラーが発生しました</h2>
          <p className="mb-4">{state.error.message}</p>
          <div className="flex gap-4">
            <button
              onClick={fetchDeck}
              className="px-4 py-2 bg-red-100 border border-red-500 rounded-md hover:bg-red-200"
            >
              再試行
            </button>
            <button
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
              onClick={() => navigate("/decks")}
            >
              戻る
            </button>
          </div>
        </div>
      </div>
    );

  if (!state.deckInfo)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <div className="bg-yellow-100 border border-yellow-300 rounded-md p-6 text-yellow-700 max-w-lg">
          <h2 className="text-xl font-bold mb-2">デッキ情報がありません</h2>
          <p>デッキデータの読み込みに失敗しました。</p>
          <button
            className="mt-6 px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300 transition"
            onClick={() => navigate("/decks")}
          >
            デッキ一覧に戻る
          </button>
        </div>
      </div>
    );

  return (
    <DndProvider
      backend={isTouchDevice() ? TouchBackend : HTML5Backend}
      options={
        isTouchDevice()
          ? {
              enableMouseEvents: true,
              delayTouchStart: 0, // タッチの遅延をなくす
              delayMouseStart: 0,
              touchSlop: 0, // 微小なタッチの移動を許容
              ignoreContextMenu: true,
              enableKeyboardEvents: true,
              scrollAngleRanges: [
                { start: 330, end: 30 }, // スクロール無効化範囲を縮小
              ],
            }
          : undefined
      }
    >
      <div className="fixed inset-x-0 top-16 bottom-0 flex flex-col h-[calc(100dvh-64px)] bg-gray-100">
        {/* メインゲーム領域 */}
        <div className="flex-1 flex flex-col p-1 md:p-2 overflow-hidden">
          {/* プレイエリア (FreePlacementArea) */}
          <div className="flex-1 relative mb-1 md:mb-2">
            <FreePlacementArea
              fieldCards={getCardsByZone(state.cards, "field").map((card) => ({
                ...card,
                deckId: card.deckId || deckId, // deckIdが存在しない場合は現在のdeckIdを設定
                cardId: card.cardId || card.id, // cardIdがない場合はcardのidを使用
              }))}
              onDropCard={handleDropToField}
              onMoveCard={handleMoveFieldCard}
              onClickCard={handleCardClick}
              onInit={handleFieldInit}
              className="w-full h-full bg-white rounded shadow-inner border border-gray-300 overflow-auto"
            />
          </div>

          {/* アクションエリア・コントロールパネル */}
          <div className="flex flex-col md:flex-row bg-gray-200 rounded shadow p-1 md:p-2 gap-1 md:gap-2 overflow-hidden">
            {/* 手札エリア */}
            <div className="md:flex-1 min-w-0 overflow-hidden">
              <HandArea
                handCards={getCardsByZone(state.cards, "hand").map((card) => ({
                  ...card,
                  deckId: card.deckId || deckId,
                  cardId: card.cardId || card.id, // cardIdがない場合はcardのidを使用
                }))}
                onClickCard={handleCardClick}
                activeMode={activeMode}
                isShuffling={isShuffling}
                onDropFromField={handleDropFromField}
              />
            </div>

            {/* 山札＆シャッフル */}
            <div className="flex-shrink-0 md:w-[240px] lg:w-[280px] flex items-center justify-center p-1 gap-2 bg-gray-300 rounded border border-gray-400">
              {/* 山札 */}
              <div className="flex flex-col items-center">
                <div
                  className={`text-[10px] ${
                    isShuffling ? "text-purple-600 font-bold" : "text-gray-600"
                  } mb-1 transition-colors duration-300`}
                >
                  残り {getCardsByZone(state.cards, "deck").length} 枚
                </div>
                <div
                  className={`relative cursor-pointer ${
                    isShuffling ? "animate-bounce" : ""
                  }`}
                  onClick={handleDrawCard}
                >
                  {getCardsByZone(state.cards, "deck").length > 0 && (
                    <Card
                      id="deck-top"
                      name="山札"
                      isFlipped={true}
                      type="deck"
                      zone="deck"
                      deckId={deckId}
                      cardId={
                        getCardsByZone(state.cards, "deck")[0]?.cardId ||
                        getCardsByZone(state.cards, "deck")[0]?.id
                      }
                    />
                  )}
                </div>
              </div>

              {/* ボタンWrapper */}
              <div className="grid grid-cols-2 w-[160px] md:w-[180px] h-[120px] gap-1">
                <button
                  className={`text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-1 border ${
                    isModeActive("deckTop")
                      ? "bg-blue-400 hover:bg-blue-500 text-white border-blue-600"
                      : "bg-white hover:bg-blue-50 border-gray-100"
                  }`}
                  onClick={() => activateMode("deckTop")}
                  aria-label={
                    isModeActive("deckTop")
                      ? "山札の上に戻すモードを解除"
                      : "山札の上に戻すモードに切替"
                  }
                  title={
                    isModeActive("deckTop")
                      ? "クリックでモード解除"
                      : "クリックして山札の上に戻すモードに切替"
                  }
                >
                  <span className="text-base">↑</span>
                  <span className="whitespace-nowrap">
                    {isModeActive("deckTop") ? "モード中" : "上に戻す"}
                  </span>
                </button>
                <button
                  className={`text-[10px] px-3 py-1.5 rounded-lg shadow-sm hover:shadow-md transition-all duration-200 flex items-center justify-center gap-1 border border-gray-100 
                    ${
                      isShuffling
                        ? "bg-purple-100 animate-pulse"
                        : "bg-white hover:bg-purple-50"
                    }`}
                  onClick={handleShuffleDeck}
                  disabled={
                    getCardsByZone(state.cards, "deck").length <= 1 ||
                    isShuffling
                  }
                  aria-label="山札をシャッフル"
                >
                  <span
                    className={`text-base ${isShuffling ? "animate-spin" : ""}`}
                  >
                    🔀
                  </span>
                  <span className="whitespace-nowrap">
                    {isShuffling ? "シャッフル中..." : "シャッフル"}
                  </span>
                </button>
                <button
                  className={`text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-1 border ${
                    isModeActive("deckBottom")
                      ? "bg-blue-400 hover:bg-blue-500 text-white border-blue-600"
                      : "bg-white hover:bg-blue-50 border-gray-100"
                  }`}
                  onClick={() => activateMode("deckBottom")}
                  aria-label={
                    isModeActive("deckBottom")
                      ? "山札の下に戻すモードを解除"
                      : "山札の下に戻すモードに切替"
                  }
                  title={
                    isModeActive("deckBottom")
                      ? "クリックでモード解除"
                      : "クリックして山札の下に戻すモードに切替"
                  }
                >
                  <span className="text-base">↓</span>
                  <span className="whitespace-nowrap">
                    {isModeActive("deckBottom") ? "モード中" : "下に戻す"}
                  </span>
                </button>
                <button
                  className={`text-[10px] px-3 py-1.5 rounded-lg shadow-sm transition-all duration-200 flex items-center justify-center gap-1 border ${
                    isModeActive("flip")
                      ? "bg-blue-400 hover:bg-blue-500 text-white border-blue-600"
                      : "bg-white hover:bg-purple-50 border-gray-100"
                  }`}
                  onClick={() => activateMode("flip")}
                  aria-label={
                    isModeActive("flip")
                      ? "カードを裏返すモードを解除"
                      : "カードを裏返すモードに切替"
                  }
                  title={
                    isModeActive("flip")
                      ? "クリックでモード解除"
                      : "クリックしてカードを裏返すモードに切替"
                  }
                >
                  <span className="text-base">🔄</span>
                  <span className="whitespace-nowrap">
                    {isModeActive("flip") ? "モード中" : "裏返す"}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DndProvider>
  );
}

export default PlayDeck;
