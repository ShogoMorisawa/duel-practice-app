import { useRef, useEffect } from "react";
import { useDrop } from "react-dnd";
import DraggableCard from "./DraggableCard";

/**
 * フィールドカードを自由に配置できるエリア
 * @param {Object} props
 * @param {Array} props.fieldCards フィールド上のカード配列
 * @param {function} props.onDropCard カードがドロップされた時のコールバック
 * @param {function} props.onMoveCard フィールドカードが移動した時のコールバック
 * @param {function} props.onClickCard カードがクリックされた時のコールバック
 * @param {function} props.onInit 初期化時のコールバック（サイズ情報を渡す）
 * @param {string} props.className 追加のCSSクラス
 */
const FreePlacementArea = ({
  fieldCards = [],
  onDropCard,
  onMoveCard,
  onClickCard,
  onInit,
}) => {
  const areaRef = useRef(null);

  useEffect(() => {
    if (areaRef.current && onInit) {
      // エリアのサイズを取得して初期化関数に渡す
      const { offsetWidth, offsetHeight } = areaRef.current;
      onInit({ width: offsetWidth, height: offsetHeight });
    }
  }, [onInit]);

  // スマホのドラッグ操作時のスクロール制御
  useEffect(() => {
    const areaEl = areaRef.current;
    if (!areaEl) return;

    const handleTouchMove = (e) => {
      // ドラッグ操作中はスクロールを抑制
      if (window.currentDraggedCard) {
        // ドラッグ中はbodyにクラスを追加してスクロールを無効化
        document.body.classList.add("dragging");

        // スクロールを防止
        e.preventDefault();
      }
    };

    const handleTouchEnd = () => {
      // ドラッグ終了時にスクロールを再有効化
      document.body.classList.remove("dragging");

      // 手札エリアのホバー状態もリセット
      const handArea = document.querySelector(".hand-area");
      if (handArea) {
        handArea.classList.remove("hand-area-hover");
      }

      // フィールドエリアのホバー状態もリセット
      areaEl.classList.remove("field-area-hover");
    };

    // 手札からフィールドへのドロップ処理 (スマホ専用)
    const handleMobileHandToFieldDrop = (e) => {
      const cardData = e.detail.cardData;
      if (cardData && onDropCard) {
        // フィールドへのドロップ座標を設定
        const dropInfo = {
          item: cardData,
          x: cardData.x,
          y: cardData.y,
        };

        // ドロップ処理を呼び出し
        onDropCard(dropInfo);

        // ホバー状態を解除
        areaEl.classList.remove("field-area-hover");
      }
    };

    areaEl.addEventListener("touchmove", handleTouchMove, { passive: false });
    areaEl.addEventListener("touchend", handleTouchEnd);
    areaEl.addEventListener(
      "mobile-hand-to-field-drop",
      handleMobileHandToFieldDrop
    );

    return () => {
      areaEl.removeEventListener("touchmove", handleTouchMove);
      areaEl.removeEventListener("touchend", handleTouchEnd);
      areaEl.removeEventListener(
        "mobile-hand-to-field-drop",
        handleMobileHandToFieldDrop
      );
      // 念のため、アンマウント時にもスクロールを再有効化
      document.body.classList.remove("dragging");
    };
  }, [onDropCard]);

  // ドロップ処理
  const [{ isOver }, dropRef] = useDrop(
    () => ({
      accept: "CARD",
      drop: (item, monitor) => {
        const offset = monitor.getClientOffset();
        const areaRect = areaRef.current?.getBoundingClientRect();

        if (!offset) {
          console.error("[FreePlacementArea] Cannot get client offset.");
          return;
        }

        const x = areaRect ? offset.x - areaRect.left : offset.x;
        const y = areaRect ? offset.y - areaRect.top : offset.y;

        // zone か type プロパティを確認（移行期のため両方対応）
        const itemZone = item.zone || item.type;

        if (itemZone === "hand") {
          onDropCard({ item, x, y }); // PlayDeck は {item, x, y} を受け取る
        } else if (itemZone === "field") {
          // PlayDeck の handleMoveFieldCard は {id, x, y} を受け取る想定
          onMoveCard({ id: item.id, x, y });
        }

        return { dropped: true }; // ドロップ成功を明示的に返す
      },
      hover: (item, monitor) => {
        // ホバー状態の処理（必要に応じて）
        if (!monitor.isOver({ shallow: true })) return;
      },
      canDrop: () => {
        // ドロップ可能かどうかの判定（必要に応じて）
        return true;
      },
      options: {
        // ドロップエフェクト設定
        dropEffect: "move",
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
        isOverCurrent: !!monitor.isOver({ shallow: true }),
      }),
    }),
    [onDropCard, onMoveCard]
  );

  const combinedRef = (el) => {
    areaRef.current = el;
    dropRef(el);
  };

  return (
    <div
      ref={combinedRef}
      className={`free-placement-area relative w-full h-full rounded-lg overflow-auto ${
        isOver ? "bg-green-200" : "bg-green-100"
      }`}
      style={{
        minHeight: "200px",
        border: isOver ? "2px solid #4ade80" : "2px dashed #ccc",
        touchAction: "none",
        WebkitOverflowScrolling: "touch",
      }}
    >
      {/* fieldCardsを全部表示 */}
      {fieldCards.map((card) => (
        <DraggableCard
          key={card.id}
          id={card.id}
          name={card.name}
          cost={card.cost}
          isFlipped={card.isFlipped}
          type={card.type || "field"}
          zone={card.zone || "field"}
          x={card.x}
          y={card.y}
          rotation={card.rotation || 0}
          onMove={onMoveCard}
          onClick={() => {
            if (onClickCard) {
              onClickCard(card.id);
            } else {
              console.error(
                "[ERROR] onClickCard is not defined in FreePlacementArea"
              );
            }
          }}
          imageUrl={card.imageUrl}
          deckId={card.deckId}
          cardId={card.cardId || card.id}
        />
      ))}
    </div>
  );
};

export default FreePlacementArea;
