import React, { useRef, useEffect } from "react";
import { useDrop } from "react-dnd";
import Card from "./Card";

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

      if (
        draggedCard &&
        (draggedCard.zone === "field" || draggedCard.type === "field")
      ) {
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

            // 視覚的フィードバックを追加
            const feedback = document.createElement("div");
            feedback.className = "drop-feedback";
            feedback.style.position = "fixed";
            feedback.style.left = `${touch.clientX}px`;
            feedback.style.top = `${touch.clientY}px`;
            feedback.style.width = "20px";
            feedback.style.height = "20px";
            feedback.style.borderRadius = "50%";
            feedback.style.backgroundColor = "rgba(59, 130, 246, 0.6)";
            feedback.style.transform = "translate(-50%, -50%)";
            feedback.style.zIndex = "10000";
            document.body.appendChild(feedback);

            // フィードバックアニメーション
            setTimeout(() => {
              feedback.style.opacity = "0";
              feedback.style.transform = "translate(-50%, -50%) scale(2)";
            }, 10);

            // フィードバック要素を削除
            setTimeout(() => {
              if (feedback.parentNode) {
                feedback.parentNode.removeChild(feedback);
              }
            }, 300);
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
      className={`hand-area w-full md:flex-1 h-32 max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap px-2 py-1 rounded border relative ${
        isOver ? "bg-blue-100 border-blue-500" : "bg-blue-50 border-blue-300"
      }`}
      style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
    >
      <div className="py-1 inline-flex gap-2">
        {handCards.map((card) => (
          <div key={card.id} className="inline-block">
            <Card
              id={card.id}
              name={card.name}
              cost={card.cost}
              isFlipped={card.isFlipped}
              zone="hand"
              type="hand"
              imageUrl={card.imageUrl}
              deckId={card.deckId}
              cardId={card.cardId}
              onClick={() => onClickCard && onClickCard(card.id)}
              draggable={true}
              rotation={card.rotation || 0}
            />
          </div>
        ))}
        {handCards.length === 0 && (
          <div className="h-full w-full flex items-center justify-center text-gray-500 italic">
            手札がありません
          </div>
        )}
      </div>

      {/* 常に表示される操作ガイド */}
      <div
        className={`sticky left-0 right-0 bottom-0 min-w-full text-xs ${
          isShuffling
            ? "text-purple-700 bg-purple-100"
            : "text-blue-700 bg-blue-100"
        } font-semibold text-center bg-opacity-90 py-1 border-t ${
          isShuffling ? "border-purple-200" : "border-blue-200"
        } whitespace-normal flex justify-center items-center transition-colors duration-300`}
      >
        <div className="text-center">
          {activeMode || isShuffling ? (
            getModeMessage()
          ) : (
            <>
              自由にカードをドラッグ＆ドロップ。
              <span className="md:inline hidden">&nbsp;</span>
              <br className="md:hidden" />
              カードをタップして90度回転できます。
            </>
          )}
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
