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
      const isHandCard = item.zone === "hand" || item.type === "hand";

      if (isFieldCard && onDropFromField) {
        console.log(
          "[HandArea] Field card dropped to hand via react-dnd:",
          item
        );
        onDropFromField(item);
      } else if (isHandCard) {
        console.log(
          "[HandArea] Hand card dropped to hand via react-dnd - ignoring:",
          item
        );
        // 手札から手札へのドロップは無視する（PCではもともと元の位置に戻る）
        // ここでは特に何もしない
        return false; // ドロップを拒否
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
      if (!cardData) return;

      // 手札から手札へのドロップを検出したら、元の位置に戻す視覚的効果を与える
      if (cardData.zone === "hand" || cardData.type === "hand") {
        console.log(
          "[HandArea] Hand-to-hand drop detected - returning to original position:",
          cardData
        );

        // カード要素を取得（現在ドラッグ中のもの）
        const cardElement = document.querySelector(
          `[data-card-id="${cardData.id}"]`
        );
        if (cardElement) {
          // アニメーションで元の位置に戻す
          cardElement.style.transition = "all 0.2s ease-out";
        }

        // ドロップ成功のフィードバック（視覚的効果）
        const touch = window.lastTouchPosition;
        if (touch) {
          const feedback = document.createElement("div");
          feedback.className = "drop-feedback";
          feedback.style.position = "fixed";
          feedback.style.left = `${touch.x}px`;
          feedback.style.top = `${touch.y}px`;
          feedback.style.width = "10px";
          feedback.style.height = "10px";
          feedback.style.borderRadius = "50%";
          feedback.style.backgroundColor = "rgba(59, 130, 246, 0.5)";
          feedback.style.transform = "translate(-50%, -50%)";
          feedback.style.zIndex = "10000";
          feedback.style.transition = "all 0.3s ease-out";
          document.body.appendChild(feedback);

          // フィードバックアニメーション
          setTimeout(() => {
            feedback.style.opacity = "0";
            feedback.style.transform = "translate(-50%, -50%) scale(1.5)";
          }, 10);

          // フィードバック要素を削除
          setTimeout(() => {
            if (feedback.parentNode) {
              feedback.parentNode.removeChild(feedback);
            }
          }, 300);
        }

        // 手札から手札の移動は許可しない
        return;
      }

      // フィールドからの場合のみ処理
      if (
        cardData &&
        onDropFromField &&
        (cardData.zone === "field" || cardData.type === "field")
      ) {
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

  // 手札カードの位置計算（横並びになるように座標を調整）
  const getCardPosition = (index) => {
    const CARD_WIDTH = 60; // カード幅 + マージン

    return {
      x: index * CARD_WIDTH + 10, // 横位置: 左から順に配置（折り返しなし）
      y: 10, // 縦位置: すべて同じ高さ
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
      className={`hand-area w-full md:flex-1 h-32 max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap rounded border relative ${
        isOver ? "bg-blue-100 border-blue-500" : "bg-blue-50 border-blue-300"
      }`}
      style={{ touchAction: "pan-x", WebkitOverflowScrolling: "touch" }}
    >
      <div
        className="py-1 px-2 h-[calc(100%-24px)] relative"
        style={{
          minWidth: "100%",
          width: `${Math.max(handCards.length * 60 + 20, 100)}px`,
        }}
      >
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
                onMove={() => {
                  // 手札内では位置の移動を許可しない（元の位置に戻す）
                  console.log(
                    "[HandArea] onMove called for hand card - ignoring and returning to original position"
                  );
                  return false;
                }}
                imageUrl={card.imageUrl}
                deckId={card.deckId}
                cardId={card.cardId}
              />
            );
          })
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
