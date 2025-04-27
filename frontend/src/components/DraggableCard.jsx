import { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import Card from "./Card";

/**
 * 自由配置できるドラッグ可能なカード
 * @param {Object} props
 * @param {string} props.id
 * @param {string} props.name
 * @param {string} props.cost
 * @param {boolean} props.isFlipped
 * @param {number} props.x
 * @param {number} props.y
 * @param {function} props.onMove
 * @param {function} props.onClick
 */
const DraggableCard = ({
  id,
  name,
  cost,
  isFlipped,
  type = "default",
  x,
  y,
  rotation = 0,
  onMove,
  onClick,
}) => {
  // 位置情報のステート管理
  const [initialPos, setInitialPos] = useState({ x, y });
  // 現在のポジションはpropsから直接使用するため変数は不要
  // 変更があった場合はコールバックで親コンポーネントに伝える

  // propsのx, yが変更されたらステートを更新
  useEffect(() => {
    setInitialPos({ x, y });
  }, [x, y]);

  console.log(
    `[DraggableCard] Rendering card ID: ${id} at Coords: {x: ${x}, y: ${y}}, rotation: ${rotation}`
  );

  const [{ isDragging }, dragRef] = useDrag(
    () => ({
      type: "CARD",
      item: { id, name, cost, isFlipped, x, y, type: "field", rotation },
      end: (item, monitor) => {
        const delta = monitor.getDifferenceFromInitialOffset();
        const didDrop = monitor.didDrop();

        if (delta) {
          const newX = Math.round(initialPos.x + delta.x);
          const newY = Math.round(initialPos.y + delta.y);

          if (didDrop && onMove) {
            onMove({
              id,
              x: newX,
              y: newY,
              rotation, // 回転情報も渡す
            });
          }
        }
      },
      collect: (monitor) => ({
        isDragging: monitor.isDragging(),
      }),
    }),
    [id, name, cost, isFlipped, initialPos.x, initialPos.y, rotation, onMove]
  );

  // 回転イベントハンドラ
  const handleRotate = (e) => {
    // 右クリックメニューを防止
    e.preventDefault();

    // 回転処理
    if (onMove) {
      const newRotation = (rotation + 90) % 360;
      onMove({
        id,
        x,
        y,
        rotation: newRotation,
      });
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
    transition: "transform 0.2s", // スムーズに回転
  };

  return (
    <div
      ref={dragRef}
      style={style}
      onContextMenu={handleRotate} // 右クリックで回転
    >
      <Card
        id={id}
        name={name}
        cost={cost}
        isFlipped={isFlipped}
        type={type}
        onClick={onClick}
        draggable={false}
      />
    </div>
  );
};

export default DraggableCard;
