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
 * @param {string} props.type - カードの種類（手札、シールド、山札など）[後方互換用]
 * @param {string} props.zone - カードのゾーン（hand, deck, field など）
 * @param {string} props.imageUrl - カード画像のURL
 * @param {number} props.rotation - 回転角度
 */
const Card = ({
  id,
  name,
  cost,
  isFlipped,
  onClick,
  type = "default",
  zone,
  imageUrl,
  rotation = 0,
}) => {
  // デバッグログを追加
  console.log(
    `[Card Debug] id: ${id}, isFlipped: ${isFlipped}, imageUrl: ${imageUrl}`
  );

  // zoneがあればそれを使い、なければtypeを使う移行期コード
  const actualZone = zone || type;

  // カードゾーンごとのクラス定義
  const cardZoneClasses = {
    hand: "bg-white border-gray-300",
    deck: "bg-gray-900 border-blue-900",
    field: "bg-white border-gray-300",
    shield: "bg-gray-900 border-blue-900",
    default: "bg-white border-gray-300",
  };

  // ドラッグ機能の設定
  const [{ isDragging }, dragRef] = useDrag(() => ({
    type: "CARD",
    item: {
      id,
      name,
      cost,
      isFlipped,
      type: actualZone,
      zone: actualZone,
      imageUrl,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    // 山札はドラッグ不可
    canDrag: () => actualZone !== "deck",
  }));

  // カードのベーススタイル
  const baseClasses =
    "border shadow rounded w-12 h-16 flex flex-col justify-between text-xs";

  // ドラッグ中のスタイル
  const dragClasses = isDragging ? "opacity-50" : "opacity-100";

  // クリック可能なカードのスタイル
  const clickClasses = onClick
    ? "cursor-pointer hover:shadow-md transition-shadow"
    : "";

  // ドラッグ可能なカードのスタイル
  const dragableClasses = actualZone !== "deck" ? "cursor-move" : "";

  // 裏面/表面スタイル
  const flipClasses = isFlipped ? "bg-gray-900" : cardZoneClasses[actualZone];

  return (
    <div
      ref={dragRef}
      className={`${baseClasses} ${dragClasses} ${clickClasses} ${flipClasses} ${dragableClasses}`}
      onClick={onClick}
      draggable={actualZone !== "deck"}
      style={{
        transform: `rotate(${rotation}deg)`,
        touchAction: "none",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        pointerEvents: "auto",
      }}
    >
      {isFlipped ? (
        // 🔄 裏面表示
        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-[8px] rounded">
          裏面
        </div>
      ) : imageUrl ? (
        <div
          className="w-full h-full bg-cover bg-center rounded"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            width: "100%",
            height: "100%",
            borderRadius: "4px",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            touchAction: "none",
            pointerEvents: "auto",
          }}
        />
      ) : (
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
