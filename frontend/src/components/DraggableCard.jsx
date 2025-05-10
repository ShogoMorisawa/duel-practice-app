import { useState, useEffect, useRef } from "react";
import { useDrag } from "react-dnd";
import Card from "./Card";

/**
 * 自由配置できるドラッグ可能なカード
 * @param {Object} props
 * @param {string} props.id カードID
 * @param {string} props.name カード名
 * @param {string} props.cost カードコスト
 * @param {boolean} props.isFlipped 裏向きかどうか
 * @param {string} props.type カードタイプ (後方互換用)
 * @param {string} props.zone カードゾーン (field, hand, deck など)
 * @param {number} props.x X座標
 * @param {number} props.y Y座標
 * @param {number} props.rotation 回転角度
 * @param {function} props.onMove 移動時のコールバック
 * @param {function} props.onClick クリック時のコールバック
 * @param {string} props.imageUrl カードの画像URL (レガシーサポート用)
 * @param {string} props.deckId カードが所属するデッキのID
 * @param {string} props.cardId カードのID（APIエンドポイント用）
 */
const DraggableCard = ({
  id,
  name,
  cost,
  isFlipped,
  type = "default",
  zone,
  x,
  y,
  rotation = 0,
  onMove,
  onClick,
  imageUrl,
  deckId,
  cardId,
}) => {
  console.log("[DraggableCard] Props:", {
    id,
    name,
    cost,
    isFlipped,
    type,
    zone,
    x,
    y,
    rotation,
    imageUrl,
    deckId,
    cardId,
  });

  // zoneがあればそれを使い、なければtypeを使う移行期コード
  const actualZone = zone || type;

  // ドラッグの検出用
  const isDraggingRef = useRef(false);
  const dragStartTimeRef = useRef(0);

  // 位置情報のステート管理
  const [initialPos, setInitialPos] = useState({ x, y });

  // propsのx, yが変更されたらステートを更新
  useEffect(() => {
    setInitialPos({ x, y });
  }, [x, y]);

  console.log(
    `[DraggableCard] Rendering card ID: ${id} at Coords: {x: ${x}, y: ${y}}, rotation: ${rotation}, zone: ${actualZone}`
  );

  // ドラッグ設定
  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: "CARD",
      item: () => {
        // ドラッグ開始時の時間を記録
        dragStartTimeRef.current = Date.now();
        isDraggingRef.current = true;
        console.log("🧪 isDragging", true); // ドラッグ開始時のログ

        // 実際のDBに存在するcardIdを優先的に使用
        const actualCardId = /^\d+$/.test(cardId) ? cardId : id;

        return {
          id,
          name,
          cost,
          isFlipped,
          x,
          y,
          type: actualZone, // 後方互換性のため
          zone: actualZone, // 新しいプロパティ
          rotation,
          imageUrl, // imageUrlを追加
          deckId,
          cardId: actualCardId, // DBのIDを優先
        };
      },
      end: (item, monitor) => {
        const delta = monitor.getDifferenceFromInitialOffset();
        const didDrop = monitor.didDrop();

        if (delta) {
          const newX = Math.round(initialPos.x + delta.x);
          const newY = Math.round(initialPos.y + delta.y);

          if (didDrop && onMove) {
            console.log(
              `[DEBUG] Card dragged to new position: {x: ${newX}, y: ${newY}}`
            );
            onMove({
              id,
              x: newX,
              y: newY,
              rotation,
            });
          }
        }

        // ドラッグ終了後、少し待ってからフラグをリセット
        setTimeout(() => {
          isDraggingRef.current = false;
          console.log("🧪 isDragging", false); // ドラッグ終了時のログ
        }, 300);
      },
      collect: (monitor) => {
        const dragging = monitor.isDragging();
        console.log("🧪 isDragging (collect)", dragging); // collect時のログ
        return {
          isDragging: dragging,
        };
      },
      options: {
        dropEffect: "move",
      },
      // 山札はドラッグ不可
      canDrag: () => actualZone !== "deck",
    }),
    [
      id,
      name,
      cost,
      isFlipped,
      initialPos.x,
      initialPos.y,
      rotation,
      onMove,
      actualZone,
      imageUrl,
      deckId,
      cardId,
    ]
  );

  // 回転イベントハンドラ（右クリック）
  const handleRotate = (e) => {
    // 右クリックメニューを防止
    e.preventDefault();

    // 回転処理
    if (onMove) {
      const newRotation = (rotation + 90) % 360;
      console.log(
        `[DEBUG] DraggableCard requesting rotation via right-click: ${rotation} -> ${newRotation}`
      );
      onMove({
        id,
        x,
        y,
        rotation: newRotation,
      });
    }
  };

  // 通常クリック (左クリック) 処理
  const handleCardClick = () => {
    // ドラッグ中または直後ならクリックイベント発火しない
    if (
      isDraggingRef.current ||
      isDragging ||
      Date.now() - dragStartTimeRef.current < 200
    ) {
      console.log("[DEBUG] Ignoring click because card was recently dragged");
      return;
    }

    console.log("[DEBUG] Card clicked (left click) in DraggableCard:", id);

    // 回転処理
    if (onMove) {
      const newRotation = (rotation + 90) % 360;
      console.log(
        `[DEBUG] DraggableCard requesting rotation via click: ${rotation} -> ${newRotation}`
      );
      onMove({
        id,
        x,
        y,
        rotation: newRotation,
      });
    }

    // 親から渡されたクリックハンドラも呼び出す
    if (onClick) {
      console.log("[DEBUG] Calling parent onClick with id:", id);
      onClick(id);
    }
  };

  const style = {
    position: "absolute",
    left: `${x}px`,
    top: `${y}px`,
    transform: `rotate(${rotation}deg)`,
    opacity: isDragging ? 0.5 : 1,
    cursor: "move",
    zIndex: isDragging ? 1000 : 1,
    transition: isDragging ? "none" : "transform 0.2s",
    touchAction: "none",
    WebkitTouchCallout: "none",
    WebkitUserSelect: "none",
    userSelect: "none",
  };

  return (
    <div
      ref={dragRef}
      style={style}
      onContextMenu={handleRotate}
      onTouchStart={() => console.log("📱 Touch start on card:", id)}
      onTouchMove={() => console.log("📱 Touch move on card:", id)}
      onTouchEnd={() => console.log("📱 Touch end on card:", id)}
      className="absolute touch-none select-none"
    >
      <Card
        id={id}
        name={name}
        cost={cost}
        isFlipped={isFlipped}
        type={type}
        zone={actualZone}
        onClick={handleCardClick}
        draggable={false}
        imageUrl={imageUrl}
        deckId={deckId}
        cardId={cardId}
      />
    </div>
  );
};

export default DraggableCard;
