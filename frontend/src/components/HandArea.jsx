import React from "react";
import { useDrop } from "react-dnd";
import Card from "./Card";

/**
 * 手札エリア
 * @param {Object} props
 * @param {Array} props.handCards 手札のカード配列
 * @param {function} props.onClickCard カードをクリックしたときの処理
 * @param {function} props.onDropFromField フィールドからのカードを受け取ったときの処理
 */
const HandArea = ({ handCards, onClickCard, onDropFromField }) => {
  const [{ isOver }, dropRef] = useDrop({
    accept: "CARD",
    drop: (item) => {
      if (item.zone === "field" && onDropFromField) {
        onDropFromField(item);
      }
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  });

  return (
    <div
      ref={dropRef}
      className={`w-full md:flex-1 flex flex-wrap justify-center items-center gap-2 p-2 rounded border ${
        isOver ? "bg-blue-200 border-blue-500" : "bg-blue-100 border-blue-300"
      }`}
    >
      {handCards.map((card) => (
        <Card
          key={card.id}
          id={card.id}
          name={card.name}
          cost={card.cost}
          isFlipped={card.isFlipped}
          zone="hand"
          imageUrl={card.imageUrl}
          onClick={() => onClickCard && onClickCard(card.id)}
        />
      ))}
    </div>
  );
};

export default HandArea;
