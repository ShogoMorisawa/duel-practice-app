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
  className = "",
}) => {
  const areaRef = useRef(null);

  useEffect(() => {
    if (areaRef.current && onInit) {
      const { offsetWidth, offsetHeight } = areaRef.current;
      onInit({ width: offsetWidth, height: offsetHeight });
    }
  }, [onInit]);

  // ドロップ処理
  const [, dropRef] = useDrop(
    () => ({
      accept: "CARD",
      drop: (item, monitor) => {
        console.log("[FreePlacementArea] Drop detected! Item:", item);

        const offset = monitor.getClientOffset();
        const areaRect = areaRef.current?.getBoundingClientRect();

        if (!offset) {
          console.error("[FreePlacementArea] Cannot get client offset.");
          return;
        }

        const x = areaRect ? offset.x - areaRect.left : offset.x;
        const y = areaRect ? offset.y - areaRect.top : offset.y;
        console.log("[FreePlacementArea] Calculated drop coordinates:", {
          x,
          y,
        });

        // zone か type プロパティを確認（移行期のため両方対応）
        const itemZone = item.zone || item.type;

        if (itemZone === "hand") {
          console.log("[FreePlacementArea] Calling onDropCard (for hand drop)");
          onDropCard({ item, x, y }); // PlayDeck は {item, x, y} を受け取る
        } else if (itemZone === "field") {
          console.log(
            "[FreePlacementArea] Calling onMoveCard (for field drop/move)"
          );
          // PlayDeck の handleMoveFieldCard は {id, x, y} を受け取る想定
          onMoveCard({ id: item.id, x, y });
        } else {
          console.log(
            "[FreePlacementArea] Unknown item zone/type dropped:",
            itemZone
          );
        }
      },
      collect: (monitor) => ({
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [onDropCard, onMoveCard]
  );

  const combinedRef = (el) => {
    areaRef.current = el;
    dropRef(el);
  };

  return (
    <div ref={combinedRef} className={`relative ${className}`}>
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
            console.log(
              "[DEBUG] DraggableCard clicked, calling onClickCard with id:",
              card.id
            );
            if (onClickCard) onClickCard(card.id);
          }}
          imageUrl={card.imageUrl}
        />
      ))}
    </div>
  );
};

export default FreePlacementArea;
