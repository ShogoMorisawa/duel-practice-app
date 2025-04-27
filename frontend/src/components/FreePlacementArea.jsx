import { useRef } from "react";
import { useDrop } from "react-dnd";
import DraggableCard from "./DraggableCard";

const FreePlacementArea = ({
  fieldCards = [],
  onDropCard,
  onMoveCard,
  onClickCard,
  className = "",
}) => {
  const areaRef = useRef(null);

  // ドロップ処理
  const [{ isOver, canDrop }, dropRef] = useDrop(
    () => ({
      // isOver, canDrop を追加
      accept: "CARD",
      drop: (item, monitor) => {
        console.log("[FreePlacementArea] Drop detected! Item:", item); // ログは残す

        const offset = monitor.getClientOffset();
        const areaRect = areaRef.current?.getBoundingClientRect();

        if (!offset) {
          console.error("[FreePlacementArea] Cannot get client offset.");
          return;
        }

        const x = areaRect ? offset.x - areaRect.left : offset.x;
        const y = areaRect ? offset.y - areaRect.top : offset.y;
        if (item.type === "hand") {
          console.log("[FreePlacementArea] Calling onDropCard (for hand drop)");
          onDropCard({ item, x, y }); // PlayDeck は {item, x, y} を受け取る
        } else if (item.type === "field") {
          // type が "field" かチェック
          console.log(
            "[FreePlacementArea] Calling onMoveCard (for field drop/move)"
          );
          // PlayDeck の handleMoveFieldCard は {id, x, y} を受け取る想定
          onMoveCard({ id: item.id, x, y }); // <<< ペイロードを修正
        } else {
          console.log(
            "[FreePlacementArea] Unknown item type dropped:",
            item.type
          );
        }
      },
      collect: (monitor) => ({
        // collect を追加
        isOver: !!monitor.isOver(),
        canDrop: !!monitor.canDrop(),
      }),
    }),
    [onDropCard, onMoveCard]
  ); // 依存配列

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
          x={card.x}
          y={card.y}
          // ▼▼▼ prop名を onMove に、onClick の引数を card.id に修正 ▼▼▼
          onMove={onMoveCard}
          onClick={() => onClickCard && onClickCard(card.id)}
        />
      ))}
    </div>
  );
};

export default FreePlacementArea;
