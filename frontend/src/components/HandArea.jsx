import React, { useRef, useEffect } from "react";
import { useDrop } from "react-dnd";
import Card from "./Card";
import DraggableCard from "./DraggableCard";

/**
 * 手札エリア
 * @param {Object} props
 * @param {Array} props.handCards 手札のカード配列
 * @param {function} props.onClickCard カードをクリックしたときの処理
 * @param {function} props.onDropFromField フィールドからのカードを受け取ったときの処理
 * @param {string} props.activeMode 現在のアクティブなモード
 * @param {boolean} props.isShuffling シャッフル中かどうか
 */
const HandArea = ({
  handCards,
  onClickCard,
  onDropFromField,
  activeMode,
  isShuffling,
}) => {
  const areaRef = useRef(null);

  // react-dndのドロップ処理（PCユーザー向け）
  const [{ isOver }, dropRef] = useDrop({
    accept: "CARD",
    drop: (item) => {
      // zoneとtypeの両方をチェック（後方互換性のため）
      const isFieldCard = item.zone === "field" || item.type === "field";
      if (isFieldCard && onDropFromField) {
        console.log(
          "[HandArea] Field card dropped to hand via react-dnd:",
          item
        );
        onDropFromField(item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  // スマホ向けのタッチイベント処理
  useEffect(() => {
    const handAreaEl = areaRef.current;
    if (!handAreaEl) return;

    const handleTouchStart = (e) => {
      handAreaEl.classList.add("hand-area-active");
      console.log("[HandArea] TouchStart detected");

      // タッチ位置の情報を記録（デバッグ用）
      if (e.touches && e.touches[0]) {
        const touch = e.touches[0];
        console.log("[HandArea] Touch position:", touch.clientX, touch.clientY);
      }
    };

    const handleTouchEnd = (e) => {
      console.log("[HandArea] TouchEnd detected");

      // クラスを削除（視覚的フィードバック用）
      handAreaEl.classList.remove("hand-area-active");
      handAreaEl.classList.remove("hand-area-hover");

      // グローバル状態から現在ドラッグ中のカード情報を取得
      const draggedCard = window.currentDraggedCard;

      if (draggedCard && draggedCard.zone === "field") {
        console.log(
          "[HandArea] Potential mobile drop detected for card:",
          draggedCard
        );

        // 手札エリア内でのタッチ終了かどうかを確認
        const rect = handAreaEl.getBoundingClientRect();
        const touch = e.changedTouches[0];

        if (
          touch &&
          touch.clientX >= rect.left &&
          touch.clientX <= rect.right &&
          touch.clientY >= rect.top &&
          touch.clientY <= rect.bottom
        ) {
          console.log("[HandArea] Valid drop in hand area detected on mobile");
          // 有効なドロップとして処理
          if (onDropFromField) {
            onDropFromField(draggedCard);

            // グローバル状態をリセット
            window.currentDraggedCard = null;
            window.isMobileCardDragging = false;
          }
        }
      }
    };

    // モバイル専用のカスタムイベントリスナー（DraggableCardからの通知用）
    const handleMobileCardDrop = (e) => {
      console.log("[HandArea] mobile-card-drop event received:", e.detail);

      const cardData = e.detail.cardData;
      if (cardData && onDropFromField) {
        // カードを手札に移動
        onDropFromField(cardData);

        // すぐに通常状態に戻す（ホバー状態も解除）
        handAreaEl.classList.remove("hand-area-hover");
        handAreaEl.classList.remove("hand-area-active");

        // グローバル状態をリセット
        window.currentDraggedCard = null;
        window.isMobileCardDragging = false;
      }
    };

    // イベントリスナーを追加
    handAreaEl.addEventListener("touchstart", handleTouchStart);
    handAreaEl.addEventListener("touchend", handleTouchEnd);
    handAreaEl.addEventListener("mobile-card-drop", handleMobileCardDrop);

    // クリーンアップ
    return () => {
      handAreaEl.removeEventListener("touchstart", handleTouchStart);
      handAreaEl.removeEventListener("touchend", handleTouchEnd);
      handAreaEl.removeEventListener("mobile-card-drop", handleMobileCardDrop);
    };
  }, [onDropFromField]);

  // refを結合
  const setCombinedRef = (el) => {
    areaRef.current = el;
    dropRef(el);
  };

  // 手札カードの位置計算（DraggableCardに必要なx,yを計算）
  const getCardPosition = (index) => {
    const spacing = 60; // カード間の間隔
    return {
      x: 10 + index * spacing, // 左から順に配置
      y: 10, // 上からの位置
    };
  };

  // モードメッセージの取得
  const getModeMessage = () => {
    if (isShuffling) return "シャッフル中...";
    if (!activeMode) return null;

    const messages = {
      deckTop: "山札の上に戻すカードを選択してください",
      deckBottom: "山札の下に戻すカードを選択してください",
      flip: "裏返すカードを選択してください",
    };

    return messages[activeMode];
  };

  return (
    <div
      ref={setCombinedRef}
      className={`hand-area w-full md:flex-1 h-32 max-w-full overflow-hidden whitespace-nowrap px-0 pt-1 rounded border relative ${
        isOver ? "bg-blue-100 border-blue-500" : "bg-blue-50 border-blue-300"
      }`}
    >
      {/* カードエリア - カードだけを配置 */}
      <div className="h-[calc(100%-24px)] px-2 relative">
        {handCards.length === 0 ? (
          <div className="h-full w-full flex items-center justify-center text-gray-500 italic">
            手札がありません
          </div>
        ) : (
          handCards.map((card, index) => {
            const position = getCardPosition(index);
            return (
              <DraggableCard
                key={card.id}
                id={card.id}
                name={card.name}
                cost={card.cost}
                isFlipped={card.isFlipped}
                type="hand"
                zone="hand"
                x={position.x}
                y={position.y}
                rotation={card.rotation || 0}
                onClick={() => onClickCard && onClickCard(card.id)}
                onMove={() => {}} // 手札内ではonMove不要だが必須プロパティ
                imageUrl={card.imageUrl}
                deckId={card.deckId}
                cardId={card.cardId}
              />
            );
          })
        )}
      </div>

      {/* テキスト部分 - スクロール可能エリア */}
      <div
        className={`h-[24px] w-full text-xs ${
          isShuffling
            ? "text-purple-700 bg-purple-100"
            : "text-blue-700 bg-blue-100"
        } font-semibold border-t ${
          isShuffling ? "border-purple-200" : "border-blue-200"
        } flex items-center`}
      >
        {/* スクロールコンテナ */}
        <div
          className="w-full h-full overflow-x-auto overflow-y-hidden touch-pan-x"
          style={{ WebkitOverflowScrolling: "touch" }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* スクロール可能なコンテンツ */}
          <div className="whitespace-nowrap px-2 py-1 min-w-max inline-block">
            {activeMode || isShuffling ? (
              getModeMessage()
            ) : (
              <span>
                自由にカードをドラッグ＆ドロップ。
                <span className="mx-1"></span>
                カードをタップして90度回転できます。
                <span className="mx-3"></span>
                ←このテキストは横にスクロールできます→
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

HandArea.defaultProps = {
  activeMode: null,
  isShuffling: false,
};

export default HandArea;
