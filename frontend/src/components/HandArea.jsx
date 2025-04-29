import React from "react";
import Card from "./Card";

/**
 * 手札エリア
 * @param {Object} props
 * @param {Array} props.handCards 手札のカード配列
 * @param {function} props.onClickCard カードをクリックしたときの処理
 */
const HandArea = ({ handCards, onClickCard }) => {
  return (
    <div className="w-full md:flex-1 flex flex-wrap justify-center items-center gap-2 p-2 bg-blue-100 rounded border border-blue-300">
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
