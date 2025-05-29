import React, { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { apiEndpoints, getAbsoluteImageUrl } from "../utils/api";

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
 * @param {string} props.imageUrl - カード画像のURL（レガシーサポート用）
 * @param {string} props.deckId - カードが所属するデッキのID
 * @param {string} props.cardId - カードのID（APIエンドポイント用）
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
  deckId,
  cardId,
  rotation = 0,
}) => {
  // デバッグログを追加
  console.log(
    `[Card Debug] id: ${id}, isFlipped: ${isFlipped}, imageUrl: ${imageUrl}, deckId: ${deckId}, cardId: ${cardId}`
  );

  // 画像URLの状態変数
  const [actualImageUrl, setActualImageUrl] = useState(null);

  // URLが相対パスかどうかを確認し、必要に応じて絶対URLに変換する関数
  const ensureAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;

    // 絶対URLに変換
    return getAbsoluteImageUrl(url);
  };

  // カードIDから数値部分を抽出する関数
  const extractNumericId = (id) => {
    if (!id) return null;
    // 数値のみを抽出
    const match = id.match(/\d+/);
    return match ? match[0] : null;
  };

  // カードIDが変更されたら画像URLを取得
  useEffect(() => {
    if (cardId && !isFlipped) {
      const numericId = extractNumericId(cardId);
      if (numericId) {
        // 常に/api/cards/{id}/imageの形式を使用
        setActualImageUrl(
          ensureAbsoluteUrl(apiEndpoints.cards.getImageById(numericId))
        );
      } else if (imageUrl) {
        // 数値IDが抽出できない場合は直接imageUrlを使用
        setActualImageUrl(ensureAbsoluteUrl(imageUrl));
      } else {
        setActualImageUrl(null);
      }
    } else if (imageUrl) {
      // cardIdがない場合や裏面の場合は直接imageUrlを使用
      setActualImageUrl(ensureAbsoluteUrl(imageUrl));
    } else {
      setActualImageUrl(null);
    }
  }, [cardId, imageUrl, isFlipped]);

  // zoneがあればそれを使い、なければtypeを使う移行期コード
  const actualZone = zone || type;

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
      imageUrl: actualImageUrl || imageUrl,
      deckId,
      cardId,
    },
    collect: (monitor) => ({
      isDragging: monitor.isDragging(),
    }),
    // 山札はドラッグ不可
    canDrag: () => actualZone !== "deck",
  }));

  // カードゾーンごとのクラス定義
  const cardZoneClasses = {
    hand: "bg-white border-gray-300",
    deck: "bg-gray-900 border-blue-900",
    field: "bg-white border-gray-300",
    shield: "bg-gray-900 border-blue-900",
    default: "bg-white border-gray-300",
  };

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

  // フォールバック画像
  const fallbackImageUrl = ensureAbsoluteUrl(
    apiEndpoints.cards.getFallbackImage()
  );

  return (
    <div
      ref={dragRef}
      className={`${baseClasses} ${dragClasses} ${clickClasses} ${flipClasses} ${dragableClasses}`}
      onClick={onClick}
      draggable={false}
      style={{
        transform: `rotate(${rotation}deg)`,
        touchAction: "none",
        WebkitTouchCallout: "none",
        WebkitUserSelect: "none",
        userSelect: "none",
        pointerEvents: "all",
      }}
    >
      {isFlipped ? (
        // 🔄 裏面表示
        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-[8px] rounded">
          裏面
        </div>
      ) : (
        // 表面表示
        <div className="w-full h-full relative">
          <img
            src={actualImageUrl || fallbackImageUrl}
            alt={name || "カード"}
            className="w-full h-full object-cover rounded"
            onError={() => {
              console.error("[Card] 画像の読み込みに失敗:", actualImageUrl);
              setActualImageUrl(fallbackImageUrl);
            }}
          />
        </div>
      )}
    </div>
  );
};

export default Card;
