import React, { useState, useEffect } from "react";
import { useDrag } from "react-dnd";
import { apiEndpoints, getAbsoluteImageUrl, api } from "../utils/api";

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
  const [imageError, setImageError] = useState(false);

  // URLが相対パスかどうかを確認し、必要に応じて絶対URLに変換する関数
  const ensureAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;

    // 絶対URLに変換
    return getAbsoluteImageUrl(url);
  };

  // 認証付きリクエストで画像URLを取得する関数
  const fetchAuthenticatedImageUrl = async (id) => {
    try {
      // 数値IDまたはUUID形式のIDかチェック
      const isValidDbId =
        id &&
        (/^\d+$/.test(id) || // 数値のみのID
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id
          )); // UUID形式

      // 一時的に生成されたフロントエンドIDを除外（"field-123456789"のような形式）
      const isGeneratedId = id && /^(field|hand|deck)-\d+-[a-z0-9]+$/.test(id);

      if (!isValidDbId || isGeneratedId) {
        // 有効なDBのIDでない場合は、既存のURLをそのまま使用
        setActualImageUrl(imageUrl ? ensureAbsoluteUrl(imageUrl) : null);
        return;
      }

      console.log(`[Card] 認証付きで画像URLを取得: cardId=${id}`);
      const response = await api.get(apiEndpoints.cards.getImageById(id));

      if (response.data && response.data.url) {
        console.log(`[Card] 一時的なURL取得成功: ${response.data.url}`);
        setActualImageUrl(response.data.url);
        setImageError(false);
      } else {
        console.error(
          `[Card] 画像URLの取得に失敗: サーバーがURLを返しませんでした`
        );
        setImageError(true);
        // フォールバックとして直接のimageUrlを試す
        setActualImageUrl(imageUrl ? ensureAbsoluteUrl(imageUrl) : null);
      }
    } catch (error) {
      console.error(`[Card] 画像URLの取得に失敗:`, error);
      setImageError(true);
      // 認証エラーなどでフォールバックとして直接のimageUrlを試す
      setActualImageUrl(imageUrl ? ensureAbsoluteUrl(imageUrl) : null);
    }
  };

  // カードIDが変更されたら画像URLを取得
  useEffect(() => {
    if (cardId && !isFlipped) {
      fetchAuthenticatedImageUrl(cardId);
    } else if (imageUrl) {
      // cardIdがない場合や裏面の場合は直接imageUrlを使用
      setActualImageUrl(ensureAbsoluteUrl(imageUrl));
    } else {
      setActualImageUrl(null);
    }
  }, [cardId, imageUrl, isFlipped]);

  // シールドカードの処理を追加（裏面でも画像参照できるように）
  const isShield = zone === "field" && isFlipped;

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

  // 画像読み込みエラー時の処理
  const handleImageError = () => {
    console.error("[Card] 画像の読み込みに失敗:", actualImageUrl);
    setImageError(true);
    setActualImageUrl(fallbackImageUrl);
  };

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
      ) : actualImageUrl ? (
        // 表面表示 - 画像あり
        <div
          className="w-full h-full bg-cover bg-center rounded"
          style={{
            backgroundImage: `url(${actualImageUrl})`,
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
            width: "100%",
            height: "100%",
            borderRadius: "4px",
            WebkitTouchCallout: "none",
            WebkitUserSelect: "none",
            userSelect: "none",
            touchAction: "manipulation",
            pointerEvents: "all",
          }}
          onError={handleImageError}
        />
      ) : (
        // 表面表示 - 画像なし
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
