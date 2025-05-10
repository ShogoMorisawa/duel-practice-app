import React from "react";
import { useDrag } from "react-dnd";
import { apiEndpoints } from "../utils/api";

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

  // 画像URLを取得する関数
  const getCardImageUrl = () => {
    // シールドカードの処理を追加（裏面でも画像参照できるように）
    const isShield = zone === "field" && isFlipped;

    // cardIdがUUID形式または数値（DB ID）かどうかを確認
    const isValidDbId =
      cardId &&
      (/^\d+$/.test(cardId) || // 数値のみのID
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
          cardId
        )); // UUID形式

    // ⚠️ 一時的に生成されたフロントエンドIDを除外（"field-123456789"のような形式）
    const isGeneratedId =
      cardId && /^(field|hand|deck)-\d+-[a-z0-9]+$/.test(cardId);

    // シールドカードなら裏面でも画像を参照できるようログ出力
    if (isShield) {
      console.log(
        "[Card] シールドカード（裏面）: deckId=",
        deckId,
        "cardId=",
        cardId
      );
    }

    // 1. DBに存在するcardIdがある場合は常に直接cardIdのエンドポイントを優先（より信頼性が高い）
    if (isValidDbId && !isGeneratedId) {
      console.log("[Card] 永続的なURL（cardIdのみ）を使用: cardId=", cardId);
      return apiEndpoints.cards.getImageById(cardId);
    }

    // 2. deckIdとDBに存在するcardIdが両方ある場合、deck経由の永続的なURLを使用 (フォールバック用)
    if (deckId && isValidDbId && !isGeneratedId) {
      console.log(
        "[Card] 永続的なURL（deck経由・フォールバック）を使用: deckId=",
        deckId,
        "cardId=",
        cardId
      );
      return apiEndpoints.cards.getImage(deckId, cardId);
    }

    // 3. imageUrlが絶対パスでIPアドレスを含む場合、現在のホストに書き換え
    if (imageUrl && imageUrl.match(/^https?:\/\/\d+\.\d+\.\d+\.\d+/)) {
      try {
        // URLをパースしてパスを取得
        const parsedUrl = new URL(imageUrl);
        // パスからAPIのIDを抽出（例：/api/cards/45/image → 45）
        const idMatch = parsedUrl.pathname.match(/\/api\/cards\/(\d+)\/image/);
        if (idMatch && idMatch[1]) {
          // 抽出したIDで永続的なURLを構築
          const extractedId = idMatch[1];
          console.log("[Card] URLからIDを抽出:", extractedId);
          return apiEndpoints.cards.getImageById(extractedId);
        }

        // IDが抽出できない場合は現在のホストでURLを再構成
        const path = parsedUrl.pathname;
        const newUrl = `${window.location.origin}${path}`;
        console.log(
          "[Card] 固定IPを現在のホストに置換:",
          imageUrl,
          "→",
          newUrl
        );
        return newUrl;
      } catch (e) {
        console.error("[Card] URL解析エラー:", e);
      }
    }

    // 4. そうでない場合は従来のimageUrlを使用（後方互換性）
    console.log("[Card] 従来のimageURLを使用:", imageUrl);
    return imageUrl;
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
      imageUrl: getCardImageUrl(),
      deckId,
      cardId,
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

  // 実際に使用する画像URL
  const cardImageUrl = getCardImageUrl();

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
                  const directUrl = apiEndpoints.cards.getImageById(cardId);
                  console.log(
                    "[Card] 裏面で直接cardIdによるURLを使用:",
                    directUrl
                  );
                  e.target.src = directUrl;
                } else {
                  // フォールバック画像を表示
                  const fallbackUrl = apiEndpoints.cards.getFallbackImage();
                  console.log(
                    "[Card] 裏面でフォールバック画像を使用:",
                    fallbackUrl
                  );
                  e.target.src = fallbackUrl;
                }
              }}
            />
          )}
          裏面
        </div>
      ) : cardImageUrl ? (
        <div
          className="w-full h-full bg-cover bg-center rounded"
          style={{
            backgroundImage: `url(${cardImageUrl})`,
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
          onError={(e) => {
            console.error(
              "[Card] 表面表示での画像読み込みエラー:",
              cardImageUrl
            );

            // cardIdがある場合のフォールバック処理
            if (cardId && /^\d+$/.test(cardId)) {
              // 常に直接cardIdによるエンドポイントを使用（より信頼性が高い）
              const directUrl = apiEndpoints.cards.getImageById(cardId);

              // 現在のURLがdeck経由の場合は直接cardIdのURLに切り替え
              if (cardImageUrl.includes(`/decks/${deckId}/cards/`)) {
                console.log(
                  "[Card] deck経由URLから直接cardIdURLへ切り替え:",
                  directUrl
                );
                e.target.style.backgroundImage = `url(${directUrl})`;
                return;
              }
            }

            // それでも失敗したらフォールバック画像を表示
            const fallbackImage = apiEndpoints.cards.getFallbackImage();
            console.log("[Card] 最終フォールバック画像を使用:", fallbackImage);
            e.target.style.backgroundImage = `url(${fallbackImage})`;
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
