import React from "react";
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
  // URLが相対パスかどうかを確認し、必要に応じて絶対URLに変換する関数
  const ensureAbsoluteUrl = (url) => {
    if (!url) return null;
    if (url.startsWith("http") || url.startsWith("blob:")) return url;

    // 絶対URLに変換
    return getAbsoluteImageUrl(url);
  };

  // 画像URLを取得する関数
  const getCardImageUrl = () => {
    // シールドカードの処理を追加（裏面でも画像参照できるように）
    // 未使用変数警告を修正
    // const isShield = zone === "field" && isFlipped;

    // cardIdがUUID形式または数値（DB ID）かどうかを確認
    const isValidDbId =
      cardId &&
      (/^\d+$/.test(cardId) || // 数値のみのID
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          cardId
        )); // UUID形式

    console.log("🔎 Card.getCardImageUrl", {
      id,
      cardId,
      deckId,
      isValidDbId,
      imageUrl,
      zone,
    });

    // 画像URLの優先順位
    let result;
    if (isValidDbId) {
      // 1. DBのIDがある場合はそれを使用
      result = ensureAbsoluteUrl(apiEndpoints.cards.getImageById(cardId));
      console.log("📸 Using cardId URL:", result);
    } else if (deckId && id) {
      // 2. デッキIDとカードIDがある場合
      result = ensureAbsoluteUrl(apiEndpoints.cards.getImage(deckId, id));
      console.log("📸 Using deckId+id URL:", result);
    } else if (imageUrl) {
      // 3. 直接のimageUrlがある場合
      result = ensureAbsoluteUrl(imageUrl);
      console.log("📸 Using direct imageUrl:", result);
    } else {
      // 4. フォールバック画像
      result = ensureAbsoluteUrl(apiEndpoints.cards.getFallbackImage());
      console.warn("📸 Card image URL fallback reached", {
        cardId,
        deckId,
        imageUrl,
        id,
      });
    }

    return result;
  };

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

  // カードのベーススタイル
  const baseClasses =
    "border shadow rounded w-12 h-16 flex flex-col justify-between text-xs";

  // クリック可能なカードのスタイル
  const clickClasses = onClick
    ? "cursor-pointer hover:shadow-md transition-shadow"
    : "";

  // 裏面/表面スタイル
  const flipClasses = isFlipped ? "bg-gray-900" : cardZoneClasses[actualZone];

  // 実際に使用する画像URL
  const cardImageUrl = getCardImageUrl();

  return (
    <div
      className={`${baseClasses} ${clickClasses} ${flipClasses}`}
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
        // 🔄 裏面表示（URLはプリロードのために維持）
        <div className="w-full h-full bg-gray-800 flex items-center justify-center text-white text-[8px] rounded">
          {/* 画像をプリロード（非表示） */}
          {cardImageUrl && (
            <img
              src={cardImageUrl}
              alt=""
              style={{ display: "none" }}
              onError={(e) => {
                console.error(
                  "[Card] 裏面表示時に画像の読み込みに失敗:",
                  cardImageUrl
                );

                // cardIdがある場合は常に直接cardIdのURLを使用
                if (cardId && /^\d+$/.test(cardId)) {
                  const directUrl = ensureAbsoluteUrl(
                    apiEndpoints.cards.getImageById(cardId)
                  );
                  e.target.src = directUrl;
                } else {
                  // フォールバック画像を表示
                  const fallbackUrl = ensureAbsoluteUrl(
                    apiEndpoints.cards.getFallbackImage()
                  );
                  e.target.src = fallbackUrl;
                }
              }}
            />
          )}
          裏面
        </div>
      ) : (
        // 表面表示
        <>
          <div className="p-1 text-center font-bold">{cost}</div>
          <div className="flex-1 p-1 flex items-center justify-center text-center">
            {name}
          </div>
          {cardImageUrl && (
            <img
              src={cardImageUrl}
              alt={name || "カード"}
              className="w-full h-full object-cover rounded-b"
              onError={(e) => {
                console.error(
                  "[Card] 表面表示時に画像の読み込みに失敗:",
                  cardImageUrl
                );

                // 認証エラーの場合（401）はフォールバック画像を表示
                if (e.target.status === 401) {
                  const fallbackUrl = ensureAbsoluteUrl(
                    apiEndpoints.cards.getFallbackImage()
                  );
                  e.target.src = fallbackUrl;
                  return;
                }

                // cardIdがある場合は常に直接cardIdのURLを使用
                if (cardId && /^\d+$/.test(cardId)) {
                  const directUrl = ensureAbsoluteUrl(
                    apiEndpoints.cards.getImageById(cardId)
                  );
                  e.target.src = directUrl;
                } else {
                  // フォールバック画像を表示
                  const fallbackUrl = ensureAbsoluteUrl(
                    apiEndpoints.cards.getFallbackImage()
                  );
                  e.target.src = fallbackUrl;
                }
              }}
            />
          )}
        </>
      )}
    </div>
  );
};

export default Card;
