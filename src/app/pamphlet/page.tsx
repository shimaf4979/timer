// app/pamphlet/page.tsx

'use client';

import { useState, useEffect, useRef, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { MapData, Floor, Pin } from '@/types/map-types';

function PamphletContent() {
  const searchParams = useSearchParams();
  const mapId = searchParams.get('id') || '';
  const floorId = searchParams.get('floor') || '';

  const [mapData, setMapData] = useState<MapData | null>(null);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [pins, setPins] = useState<Pin[]>([]);
  const [activeFloor, setActiveFloor] = useState<Floor | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageRatio, setImageRatio] = useState({ width: 0, height: 0 });

  const containerRef = useRef<HTMLDivElement>(null);
  const imageContainerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // データ読み込み
  useEffect(() => {
    if (!mapId) {
      setError('マップIDが指定されていません');
      setLoading(false);
      return;
    }

    const fetchData = async () => {
      try {
        setLoading(true);

        // APIからマップデータを取得
        const response = await fetch(`/api/viewer/${mapId}`);

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'データの取得に失敗しました');
        }

        const data = await response.json();

        // データを設定
        setMapData(data.map);

        // URLでフロアが指定されているか確認
        if (floorId) {
          // 指定されたフロアだけをセット
          const selectedFloor = data.floors.find((f: Floor) => f.id === floorId);
          if (selectedFloor) {
            setFloors([selectedFloor]);
            setActiveFloor(selectedFloor);
            // 選択したフロアのピンだけをフィルタリング
            setPins(data.pins.filter((p: Pin) => p.floor_id === floorId));
          } else {
            // 指定されたフロアが見つからない場合は最初のフロアを表示
            setFloors([data.floors[0]]);
            setActiveFloor(data.floors[0]);
            setPins(data.pins.filter((p: Pin) => p.floor_id === data.floors[0].id));
          }
        } else {
          // フロアが指定されていない場合は最初のフロアを表示
          if (data.floors.length > 0) {
            setFloors([data.floors[0]]);
            setActiveFloor(data.floors[0]);
            setPins(data.pins.filter((p: Pin) => p.floor_id === data.floors[0].id));
          } else {
            setFloors([]);
            setPins([]);
          }
        }

        setError(null);
      } catch (error) {
        console.error('データの取得エラー:', error);
        setError(error instanceof Error ? error.message : 'データの取得に失敗しました');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [mapId, floorId]);

  // 印刷ボタンのクリックハンドラ
  const handlePrint = () => {
    window.print();
  };

  // 画像読み込み完了時のハンドラ
  const handleImageLoad = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const img = e.currentTarget;
    setImageRatio({
      width: img.naturalWidth,
      height: img.naturalHeight,
    });
    setImageLoaded(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sky-500 mb-4"></div>
          <p className="text-gray-600">読み込み中...</p>
        </div>
      </div>
    );
  }

  if (error || !mapData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center max-w-md p-6 bg-white rounded-lg shadow-md">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-12 w-12 mx-auto mb-4 text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
            />
          </svg>
          <h2 className="text-xl font-semibold mb-2">エラー</h2>
          <p className="text-gray-600 mb-4">{error || 'マップが見つかりません。'}</p>
          <Link href="/" className="text-sky-500 hover:underline">
            トップページに戻る
          </Link>
        </div>
      </div>
    );
  }

  // ピンを位置情報でソート（上から下、左から右）
  const sortedPins = [...pins].sort((a, b) => {
    // まずY座標で比較（上から下）
    if (Math.abs(a.y_position - b.y_position) > 10) {
      return a.y_position - b.y_position;
    }
    // Y座標が近い場合はX座標で比較（左から右）
    return a.x_position - b.x_position;
  });

  return (
    <div ref={containerRef} className="bg-white min-h-screen">
      {/* 画面表示用のヘッダー（印刷時には非表示） */}
      <header className="print:hidden text-white py-8 px-6 flex justify-center items-center">
        <div className="flex gap-3">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-sky-700 text-white rounded-md hover:bg-sky-50 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z"
                clipRule="evenodd"
              />
            </svg>
            印刷する
          </button>
          <Link
            href={`/viewer?id=${mapId}`}
            className="px-4 py-2 bg-sky-700 text-white rounded-md hover:bg-sky-800 flex items-center"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-5 w-5 mr-2"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M9.707 16.707a1 1 0 01-1.414 0l-6-6a1 1 0 010-1.414l6-6a1 1 0 011.414 1.414L5.414 9H17a1 1 0 110 2H5.414l4.293 4.293a1 1 0 010 1.414z"
                clipRule="evenodd"
              />
            </svg>
            戻る
          </Link>
        </div>
      </header>

      {/* 印刷用メインコンテンツ */}
      <main className="p-2 print:p-0 max-w-6xl mx-auto print:max-w-none">
        {/* 画面用のレイアウト - スマホやデスクトップでの表示用 */}
        <div className="print:hidden">
          {/* タイトルとフロア情報 */}
          <div className="mb-6 bg-sky-50 p-4 rounded-lg border border-sky-200">
            <h1 className="text-2xl font-bold text-center text-sky-800">{mapData.title}</h1>
            {mapData.description && (
              <p className="text-sm text-gray-600 text-center mt-2">{mapData.description}</p>
            )}
          </div>

          {/* フロア・画像セクション */}
          <div className="mb-8">
            {floors.map((floor) => (
              <div
                key={floor.id}
                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
              >
                <div className="p-4 border-b border-gray-200 bg-sky-50 flex justify-between items-center">
                  <h2 className="text-lg font-medium text-gray-900">{floor.name}</h2>
                  <span className="text-sm text-sky-600">{sortedPins.length}ポイント</span>
                </div>

                <div className="relative overflow-hidden bg-white flex items-center justify-center">
                  {floor.image_url ? (
                    <div className="relative">
                      <img
                        src={floor.image_url}
                        alt={`${floor.name}マップ`}
                        className="max-w-full max-h-[50vh] object-contain"
                      />

                      {/* ピンの位置表示 */}
                      {sortedPins.map((pin, index) => (
                        <div
                          key={pin.id}
                          className="absolute w-6 h-6 flex items-center justify-center bg-sky-500 rounded-full text-white border-2 border-white transform -translate-x-1/2 -translate-y-1/2 shadow-md"
                          style={{
                            left: `${pin.x_position}%`,
                            top: `${pin.y_position}%`,
                          }}
                        >
                          <span className="text-xs font-bold">{index + 1}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center text-gray-500 p-6">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-12 w-12 mx-auto mb-2"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p>画像がありません</p>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* ポイント情報のカードセクション */}
          <div className="mt-8">
            <h2 className="text-xl font-bold mb-4 text-sky-800">ポイント情報一覧</h2>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sortedPins.map((pin, index) => (
                <div
                  key={pin.id}
                  className="bg-white rounded-lg border border-sky-200 overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="px-3 py-2 border-b border-sky-100 bg-sky-50 flex items-center">
                    <div className="w-5 h-5 flex items-center justify-center bg-sky-500 rounded-full text-white mr-2 flex-shrink-0">
                      <span className="text-xs font-bold">{index + 1}</span>
                    </div>
                    <div className="flex-grow">
                      <h3 className="font-medium text-sky-800 text-sm">{pin.title}</h3>
                      {pin.editor_nickname && (
                        <span className="text-xs text-gray-500">作成者: {pin.editor_nickname}</span>
                      )}
                    </div>
                  </div>
                  <div className="p-3">
                    <p className="text-sm text-gray-700 whitespace-pre-line">
                      {pin.description || '説明はありません'}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* 印刷レイアウト - 印刷時だけ表示 */}
        <div className="hidden print:block print:h-[100vh]">
          <div className="print:p-4 print:flex print:h-full">
            {/* 左側 - 画像とタイトル（55%） */}
            <div className="print:w-[55%] print:h-full print:pr-2 print:flex print:flex-col">
              {/* タイトル部分 - よりオシャレなデザイン */}
              <div className="print:mb-2 print:relative print:overflow-hidden">
                <div className="print:bg-gradient-to-r print:from-sky-50 print:to-white print:py-3 print:px-4 print:border print:border-gray-200 print:rounded-lg print:shadow-sm">
                  <div className="print:flex print:justify-between print:items-center">
                    <div className="print:w-10 print:h-10 print:bg-sky-500 print:rounded-full print:flex print:items-center print:justify-center print:text-white print:font-bold print:text-xl print:mr-3 print:shadow-sm">
                      P
                    </div>
                    <div className="print:flex-grow">
                      <h1 className="print:text-2xl print:font-bold print:text-gray-800">
                        {mapData.title}
                      </h1>
                      {mapData.description && (
                        <p className="print:text-sm print:text-gray-600 print:mt-1">
                          {mapData.description}
                        </p>
                      )}
                    </div>
                  </div>

                  {activeFloor && (
                    <div className="print:flex print:justify-between print:items-center print:mt-2 print:border-t print:border-gray-100 print:pt-2">
                      <div className="print:flex print:items-center">
                        <span className="print:w-5 print:h-5 print:flex print:items-center print:justify-center print:bg-sky-400 print:text-white print:rounded print:mr-2 print:text-xs">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="print:h-3 print:w-3"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"
                            />
                          </svg>
                        </span>
                        <p className="print:text-lg print:font-medium print:text-gray-700">
                          {activeFloor.name}
                        </p>
                      </div>
                      <span className="print:text-sm print:text-gray-600 print:bg-sky-50 print:px-2 print:py-1 print:rounded-full print:flex print:items-center">
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="print:h-3 print:w-3 print:mr-1"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                        {sortedPins.length}ポイント
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* 画像エリア - 正確なピン位置表示のためのコンテナ */}
              <div className="print:flex-grow print:border print:border-gray-200 print:rounded-lg print:overflow-hidden print:shadow-sm">
                {floors.map((floor) => (
                  <div
                    key={floor.id}
                    className="print:w-full print:h-full print:flex print:items-center print:justify-center"
                    ref={imageContainerRef}
                  >
                    {floor.image_url ? (
                      <div className="print:w-full print:h-full print:flex print:items-center print:justify-center">
                        {/* 画像とピンの位置関係を正確に保つためのラッパー */}
                        <div className="print:relative print:inline-block">
                          <img
                            ref={imageRef}
                            src={floor.image_url}
                            alt={`${floor.name}マップ`}
                            className="print:block print:max-w-full print:max-h-[calc(100vh-18rem)] print:object-contain"
                            onLoad={handleImageLoad}
                          />

                          {/* ピンの絶対位置表示 */}
                          <div className="print:absolute print:top-0 print:left-0 print:w-full print:h-full">
                            {imageLoaded &&
                              sortedPins.map((pin, index) => {
                                // x, yはパーセンテージ値（0-100）
                                // 値が0-100の範囲内にあることを確認して表示
                                const x = Math.min(Math.max(pin.x_position, 0), 100);
                                const y = Math.min(Math.max(pin.y_position, 0), 100);

                                return (
                                  <div
                                    key={pin.id}
                                    style={{
                                      position: 'absolute',
                                      left: `${x}%`,
                                      top: `${y}%`,
                                      width: '20px',
                                      height: '20px',
                                      backgroundColor: '#3b82f6',
                                      color: '#fff',
                                      borderRadius: '50%',
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      border: '2px solid white',
                                      transform: 'translate(-50%, -50%)',
                                      fontSize: '10px',
                                      fontWeight: 'bold',
                                      boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
                                    }}
                                  >
                                    {index + 1}
                                  </div>
                                );
                              })}
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="print:text-center print:text-gray-500 print:p-6">
                        <p>画像がありません</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* 右側 - ポイント情報（45%） */}
            <div className="print:w-[45%] print:h-full print:overflow-hidden print:flex print:flex-col print:pl-2">
              <div className="print:bg-gradient-to-r print:from-sky-50 print:to-white print:py-3 print:px-4 print:border print:border-gray-200 print:rounded-lg print:mb-2 print:flex print:items-center print:shadow-sm">
                <div className="print:w-6 print:h-6 print:bg-sky-500 print:rounded-full print:flex print:items-center print:justify-center print:text-white print:font-bold print:text-sm print:mr-3 print:shadow-sm">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="print:h-3 print:w-3"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                </div>
                <h2 className="print:text-xl print:font-bold print:text-gray-800">
                  ポイント情報一覧
                </h2>
              </div>

              <div className="print:flex-grow print:overflow-auto print:border print:border-gray-200 print:rounded-lg print:p-3 print:shadow-sm print:max-h-[calc(100vh-10rem)]">
                {/* ピンの数に応じて列数、フォントサイズ、余白を動的に調整 */}
                <div
                  className={`
    print:grid print:gap-2 print:auto-rows-min
    ${
      sortedPins.length <= 4
        ? 'print:grid-cols-1'
        : sortedPins.length <= 8
          ? 'print:grid-cols-2'
          : sortedPins.length <= 12
            ? 'print:grid-cols-2'
            : 'print:grid-cols-3'
    }
    `}
                >
                  {sortedPins.map((pin, index) => (
                    <div
                      key={pin.id}
                      className="print:bg-white print:rounded-lg print:overflow-hidden print:break-inside-avoid print:shadow-md print:border print:border-gray-200 print:flex print:flex-col print:h-auto print:min-h-0"
                    >
                      <div
                        className={`
          print:bg-gradient-to-r print:from-sky-100 print:to-blue-50
          print:border-b print:border-gray-200
          print:flex print:items-center
          ${
            sortedPins.length <= 8
              ? 'print:p-3'
              : sortedPins.length <= 15
                ? 'print:p-2'
                : 'print:p-1.5'
          }
        `}
                      >
                        <div className="print:font-bold print:text-sky-800 print:text-xl print:mr-2">
                          {index + 1}
                        </div>
                        <div className="print:flex-grow">
                          <h3
                            className={`
              print:font-bold print:text-gray-800 
              ${
                sortedPins.length <= 8
                  ? 'print:text-base'
                  : sortedPins.length <= 15
                    ? 'print:text-sm'
                    : 'print:text-xs'
              }
            `}
                          >
                            {pin.title}
                          </h3>
                          {pin.editor_nickname && sortedPins.length <= 15 && (
                            <span
                              className={`
                print:text-gray-500
                ${sortedPins.length > 12 ? 'print:text-[8px]' : 'print:text-xs'}
              `}
                            >
                              作成者: {pin.editor_nickname}
                            </span>
                          )}
                        </div>
                      </div>
                      <div
                        className={`
          ${
            sortedPins.length <= 8
              ? 'print:p-3'
              : sortedPins.length <= 15
                ? 'print:p-2'
                : 'print:p-1.5'
          }
        `}
                      >
                        <p
                          className={`
            print:text-gray-700 print:whitespace-pre-line
            ${
              sortedPins.length <= 4
                ? 'print:text-sm'
                : sortedPins.length <= 8
                  ? 'print:text-xs'
                  : sortedPins.length <= 15
                    ? 'print:text-[9px]'
                    : 'print:text-[8px]'
            }
            ${
              sortedPins.length <= 4
                ? 'print:line-clamp-none'
                : sortedPins.length <= 8
                  ? 'print:line-clamp-10'
                  : sortedPins.length <= 15
                    ? 'print:line-clamp-8'
                    : 'print:line-clamp-6'
            }
          `}
                        >
                          {pin.description || '説明はありません'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* フッター */}
              <div className="print:mt-2 print:text-xs print:text-gray-500 print:text-right print:pr-2">
                <p>印刷日： {new Date().toLocaleDateString('ja-JP')}</p>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 印刷用のスタイル */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 landscape;
            margin: 0;
          }

          body {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            color-adjust: exact !important;
            font-size: 9pt;
            background: white !important;
            color: black !important;
          }

          html,
          body {
            height: 100vh;
            width: 100vw;
            margin: 0;
            padding: 0;
            overflow: hidden;
          }

          .print\\:break-inside-avoid {
            break-inside: avoid;
          }

          /* 不要な要素を完全に非表示 */
          .print\\:hidden {
            display: none !important;
          }

          /* ナビゲーションバーも非表示に */
          header,
          nav,
          footer,
          .nav-container {
            display: none !important;
          }

          /* 画像のスタイル調整 */
          img {
            display: block !important;
            max-width: 100% !important;
            margin: 0 auto !important;
            object-fit: contain !important;
          }

          /* コンテンツのサイズ調整 */
          .print\\:p-4 {
            padding: 1rem !important;
          }

          .print\\:p-3 {
            padding: 0.75rem !important;
          }

          .print\\:w-\\[55\\%\\] {
            width: 55% !important;
            padding-right: 0.5rem !important;
          }

          .print\\:w-\\[45\\%\\] {
            width: 45% !important;
            padding-left: 0.5rem !important;
          }

          /* レイアウト調整 */
          .print\\:flex {
            display: flex !important;
          }

          .print\\:grid {
            display: grid !important;
          }

          .print\\:grid-cols-1 {
            grid-template-columns: 1fr !important;
          }

          .print\\:grid-cols-2 {
            grid-template-columns: 1fr 1fr !important;
          }

          .print\\:grid-cols-3 {
            grid-template-columns: 1fr 1fr 1fr !important;
          }

          .print\\:flex-col {
            flex-direction: column !important;
          }

          .print\\:flex-grow {
            flex-grow: 1 !important;
          }

          .print\\:items-center {
            align-items: center !important;
          }

          .print\\:justify-center {
            justify-content: center !important;
          }

          .print\\:inline-block {
            display: inline-block !important;
          }

          .print\\:relative {
            position: relative !important;
          }

          .print\\:absolute {
            position: absolute !important;
          }

          /* カードスタイル */
          .print\\:rounded-lg {
            border-radius: 0.5rem !important;
          }

          .print\\:shadow-md {
            box-shadow:
              0 4px 6px -1px rgba(0, 0, 0, 0.1),
              0 2px 4px -1px rgba(0, 0, 0, 0.06) !important;
          }

          .print\\:border {
            border-width: 1px !important;
          }

          .print\\:border-gray-200 {
            border-color: #e5e7eb !important;
          }

          .print\\:border-b {
            border-bottom-width: 1px !important;
          }

          /* 背景グラデーション */
          .print\\:bg-gradient-to-r {
            background-image: linear-gradient(to right, var(--tw-gradient-stops)) !important;
          }

          .print\\:from-sky-100 {
            --tw-gradient-from: #e0f2fe !important;
            --tw-gradient-stops:
              var(--tw-gradient-from), var(--tw-gradient-to, rgba(224, 242, 254, 0)) !important;
          }

          .print\\:to-blue-50 {
            --tw-gradient-to: #eff6ff !important;
          }

          /* ギャップ設定 */
          .print\\:gap-3 {
            gap: 0.75rem !important;
          }

          /* テキストスタイル */
          .print\\:text-xl {
            font-size: 1.25rem !important;
            line-height: 1.75rem !important;
          }

          .print\\:text-lg {
            font-size: 1.125rem !important;
            line-height: 1.75rem !important;
          }

          .print\\:text-base {
            font-size: 1rem !important;
            line-height: 1.5rem !important;
          }

          .print\\:text-sm {
            font-size: 0.875rem !important;
            line-height: 1.25rem !important;
          }

          .print\\:text-xs {
            font-size: 0.75rem !important;
            line-height: 1rem !important;
          }

          .print\\:text-\\[9px\\] {
            font-size: 9px !important;
          }

          .print\\:text-\\[8px\\] {
            font-size: 8px !important;
          }

          .print\\:font-bold {
            font-weight: 700 !important;
          }

          .print\\:text-gray-700 {
            color: #374151 !important;
          }

          .print\\:text-gray-800 {
            color: #1f2937 !important;
          }

          .print\\:text-sky-800 {
            color: #075985 !important;
          }

          /* 画像最大高さを設定 */
          .print\\:max-h-\\[calc\\(100vh-18rem\\)\\] {
            max-height: calc(100vh - 18rem) !important;
          }

          /* コンテンツの均等配置 */
          .print\\:h-full {
            height: 100% !important;
          }
          /* 印刷用のスタイル追加部分 */
          .print\\:max-h-\\[calc\\(100vh-10rem\\)\\] {
            max-height: calc(100vh - 10rem) !important;
          }

          .print\\:auto-rows-min {
            grid-auto-rows: min-content !important;
          }

          .print\\:h-auto {
            height: auto !important;
          }

          .print\\:min-h-0 {
            min-height: 0 !important;
          }

          .print\\:p-2 {
            padding: 0.5rem !important;
          }

          .print\\:p-1\\.5 {
            padding: 0.375rem !important;
          }

          .print\\:line-clamp-none {
            -webkit-line-clamp: unset !important;
            display: block !important;
          }

          .print\\:line-clamp-6 {
            display: -webkit-box !important;
            -webkit-line-clamp: 6 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }

          .print\\:line-clamp-8 {
            display: -webkit-box !important;
            -webkit-line-clamp: 8 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }

          .print\\:line-clamp-10 {
            display: -webkit-box !important;
            -webkit-line-clamp: 10 !important;
            -webkit-box-orient: vertical !important;
            overflow: hidden !important;
          }
        }
      `}</style>
    </div>
  );
}

// メインのコンポーネント
export default function PamphletPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p className="text-gray-600">読み込み中...</p>
          </div>
        </div>
      }
    >
      <PamphletContent />
    </Suspense>
  );
}
