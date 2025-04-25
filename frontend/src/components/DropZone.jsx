import { useDrop } from "react-dnd";

/**
 * ドロップゾーンコンポーネント
 * @param {Object} props
 * @param {string} props.type - ゾーンの種類（battleZone, manaZone, graveyard, etc.）
 * @param {function} props.onDrop - ドロップ時のハンドラ
 * @param {React.ReactNode} props.children - 子要素
 * @param {string} props.className - 追加のCSSクラス
 */
const DropZone = ({ type, onDrop, children, className = "" }) => {
  // ドロップ機能の設定
  const [{ isOver }, dropRef] = useDrop(() => ({
    accept: "CARD", // カードタイプを受け入れる
    drop: (item) => {
      // ドロップ時にonDrop関数を呼び出す（カード情報とゾーンタイプを渡す）
      onDrop && onDrop(item, type);
    },
    collect: (monitor) => ({
      isOver: monitor.isOver(),
    }),
  }));

  // ドロップ可能なゾーンのスタイリング
  const dropZoneClasses = isOver ? "ring-2 ring-blue-400" : "";

  return (
    <div ref={dropRef} className={`${className} ${dropZoneClasses}`}>
      {children}
    </div>
  );
};

export default DropZone;
