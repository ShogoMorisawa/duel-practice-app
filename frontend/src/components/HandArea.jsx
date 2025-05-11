import React from "react";
import { useDrop } from "react-dnd";
import Card from "./Card";

/**
 * 手札エリア
 * @param {Object} props
 * @param {Array} props.handCards 手札のカード配列
 * @param {function} props.onClickCard カードをクリックしたときの処理
 * @param {function} props.onDropFromField フィールドからのカードを受け取ったときの処理
 * @param {string} props.activeMode 現在のアクティブなモード
 */
const HandArea = ({ handCards, onClickCard, onDropFromField, activeMode }) => {
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

  // モードメッセージの取得
  const getModeMessage = () => {
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
      ref={dropRef}
      className={`w-full md:flex-1 h-32 max-w-full overflow-x-auto overflow-y-hidden whitespace-nowrap px-2 py-1 rounded border relative ${
        isOver ? "bg-blue-100 border-blue-500" : "bg-blue-50 border-blue-300"
      }`}
    >
      {handCards.map((card) => (
        <div key={card.id} className="inline-block mr-2">
          <Card
            id={card.id}
            name={card.name}
            cost={card.cost}
            isFlipped={card.isFlipped}
            zone="hand"
            imageUrl={card.imageUrl}
            onClick={() => onClickCard && onClickCard(card.id)}
          />
        </div>
      ))}
      {handCards.length === 0 && (
        <div className="h-full w-full flex items-center justify-center text-gray-500 italic">
          手札がありません
        </div>
      )}

      {/* モード中のメッセージ表示 - 手札エリア内下部 */}
      {activeMode && (
        <div className="sticky left-0 right-0 bottom-0 min-w-full text-sm text-blue-700 font-semibold text-center bg-blue-100 bg-opacity-90 py-1 border-t border-blue-200 whitespace-normal">
          {getModeMessage()}
        </div>
      )}
    </div>
  );
};

HandArea.defaultProps = {
  activeMode: null,
};

export default HandArea;
