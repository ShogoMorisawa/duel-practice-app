import React from "react";
import { useDrag } from "react-dnd";

/**
 * カードコンポーネント
 * @param {Object} props
 * @param {string} props.id - カードの一意のID
 * @param {string} props.name - カード名
 * @param {string} props.cost - カードのコスト
 * @param {boolean} props.isFlipped - 裏向きかどうか
 * @param {function} props.onClick - クリック時のハンドラ
 * @param {string} props.type - カードの種類（手札、シールド、山札など）
 */
const Card = ({ id, name, cost, isFlipped, onClick, type = "default" }) => {
  // カードタイプごとのクラス定義
  const cardTypeClasses = {
    hand: "bg-white border-gray-300",
    deck: "bg-gray-900 border-blue-900",
    field: "bg-white border-gray-300",
    default: "bg-white border-gray-300",
  };

  // ドラッグ機能の設定
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "CARD",
    item: { id, name, cost, isFlipped, type },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    // シールドと山札はドラッグ不可
    canDrag: () => type !== "shield" && type !== "deck",
  }));

  // カードのベーススタイル
  const baseClasses =
    "border shadow rounded p-1 w-12 h-16 flex flex-col justify-between text-xs";

  // ドラッグ中のスタイル
  const dragClasses = isDragging ? "opacity-50" : "opacity-100";

  // クリック可能なカードのスタイル
  const clickClasses = onClick
    ? "cursor-pointer hover:shadow-md transition-shadow"
    : "";

  // ドラッグ可能なカードのスタイル
  const dragableClasses =
    type !== "shield" && type !== "deck" ? "cursor-move" : "";

  // 裏面/表面スタイル
  const flipClasses = isFlipped ? "bg-gray-900" : cardTypeClasses[type];

  return (
    <div
      ref={dragRef}
      className={`${baseClasses} ${dragClasses} ${clickClasses} ${flipClasses} ${dragableClasses}`}
      onClick={onClick}
      draggable={type !== "shield" && type !== "deck"}
    >
      {!isFlipped && (
        <>
          <div className="font-bold text-center truncate text-[8px]">
            {name}
          </div>
          {cost && <div className="text-[8px] text-center">{cost}</div>}
        </>
      )}
    </div>
  );
};

export default Card;
