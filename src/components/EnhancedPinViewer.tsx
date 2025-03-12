// components/EnhancedPinViewer.tsx
import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { Pin, Floor } from '@/types/map-types';
import ImprovedModal from './ImprovedModal';
import PinInfo from './PinInfo';

interface EnhancedPinViewerProps {
  pin: Pin;
  floors: Floor[];
  containerRef?: React.RefObject<HTMLDivElement | null>;
  is3DView?: boolean;
  isEditable?: boolean; // 編集可能かどうか（デフォルトは編集不可）
  isViewerMode?: boolean; // Viewerモードかどうか
  isPublicEdit?: boolean; // 公開編集モードかどうか
  currentEditorId?: string | null; // 現在の編集者ID（公開編集時）
  isSelected?: boolean; // 選択されているかどうか
  onEditPin?: (pin: Pin) => void; // ピン編集コールバック
  onDeletePin?: (pin: Pin) => void; // ピン削除コールバック
}

const EnhancedPinViewer: React.FC<EnhancedPinViewerProps> = ({ 
  pin, 
  floors, 
  containerRef,
  is3DView = false,
  isEditable = false,
  isViewerMode = false,
  isPublicEdit = false,
  currentEditorId = null,
  isSelected = false,
  onEditPin,
  onDeletePin
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  const [fixedTooltip, setFixedTooltip] = useState(isSelected);
  const [showModal, setShowModal] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const pinRef = useRef<HTMLButtonElement>(null);
  const [portalContainer, setPortalContainer] = useState<HTMLElement | null>(null);
  
  // DOMでのピン位置を状態として管理
  const [pinPosition, setPinPosition] = useState({
    left: 0,
    top: 0,
    display: 'none' // 最初は非表示
  });

  // ツールチップの位置状態
  const [tooltipPosition, setTooltipPosition] = useState({
    left: 0,
    top: 0,
    width: 200,
    transformOrigin: 'center bottom'
  });
  
  // 選択状態が変更されたときにfixedTooltipを更新
  useEffect(() => {
    setFixedTooltip(isSelected);
  }, [isSelected]);
  
  // スマホ検出 - sm以下（640px未満）
  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth < 640);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => {
      window.removeEventListener('resize', checkIfMobile);
    };
  }, []);
  
  // ポータルコンテナを作成
  useEffect(() => {
    // すでに存在するかチェック
    let tooltipRoot = document.getElementById('tooltip-root');
    
    if (!tooltipRoot) {
      // なければ作成
      tooltipRoot = document.createElement('div');
      tooltipRoot.id = 'tooltip-root';
      tooltipRoot.style.position = 'fixed';
      tooltipRoot.style.top = '0';
      tooltipRoot.style.left = '0';
      tooltipRoot.style.width = '100%';
      tooltipRoot.style.height = '100%';
      tooltipRoot.style.pointerEvents = 'none';
      tooltipRoot.style.zIndex = '800';
      document.body.appendChild(tooltipRoot);
    }
    
    setPortalContainer(tooltipRoot);
    
    return () => {
      // コンポーネントがアンマウントされても、ポータルは削除しない
      // 他のピンも使用する可能性があるため
    };
  }, []);

  // 画面全体をクリックしたときにfixedTooltipをリセットする
  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (pinRef.current && !pinRef.current.contains(e.target as Node)) {
        setFixedTooltip(false);
      }
    };

    if (fixedTooltip) {
      document.addEventListener('click', handleGlobalClick);
    }

    return () => {
      document.removeEventListener('click', handleGlobalClick);
    };
  }, [fixedTooltip]);

  // ピン位置を計算して更新
  useEffect(() => {
    if (!containerRef?.current) return;
    let isMounted = true;
    let frameId: number | null = null;
    
    // ピン位置の計算と更新を行う関数
    const updatePinPosition = () => {
      if (!containerRef?.current || !isMounted) return;
      
      try {
        // ピンの親要素（フロアコンテナ）を探す
        const floorContainer = containerRef.current.closest('.floor-container') || containerRef.current;
        
        // 画像要素を取得
        const imageEl = floorContainer.querySelector('img');
        if (!imageEl) {
          frameId = requestAnimationFrame(updatePinPosition);
          return;
        }
        
        // コンテナの位置とサイズを取得
        const containerRect = floorContainer.getBoundingClientRect();
        
        // 画像の表示サイズと位置を取得
        const imageRect = imageEl.getBoundingClientRect();
        
        // 画像がレンダリングされているかチェック
        if (imageRect.width === 0 || imageRect.height === 0) {
          frameId = requestAnimationFrame(updatePinPosition);
          return;
        }
        
        // ピンの座標を計算（画像の実際のサイズに基づく）
        const pinXPercent = pin.x_position / 100;
        const pinYPercent = pin.y_position / 100;
        
        // コンテナ内での画像のオフセット
        const imageOffsetX = imageRect.left - containerRect.left;
        const imageOffsetY = imageRect.top - containerRect.top;
        
        // 画像サイズ
        const imageWidth = imageRect.width;
        const imageHeight = imageRect.height;
        
        // ピンの位置計算
        const pinX = imageOffsetX + (pinXPercent * imageWidth);
        const pinY = imageOffsetY + (pinYPercent * imageHeight);
        
        if (isMounted) {
          setPinPosition({
            left: pinX,
            top: pinY,
            display: 'block'
          });
        }
      } catch (err) {
        console.error('Error updating pin position:', err);
      }
    };
    
    // 初回更新
    updatePinPosition();
    
    // 画像読み込み、リサイズ、スクロールでの位置更新
    const handleUpdate = () => {
      if (frameId) cancelAnimationFrame(frameId);
      frameId = requestAnimationFrame(updatePinPosition);
    };
    
    window.addEventListener('resize', handleUpdate);
    window.addEventListener('scroll', handleUpdate);
    window.addEventListener('imageLoaded', handleUpdate);
    window.addEventListener('imageFullyLoaded', handleUpdate);
    
    // 3Dビューの場合は定期的に更新
    let intervalId: NodeJS.Timeout | null = null;
    if (is3DView) {
      intervalId = setInterval(handleUpdate, 100);
    }
    
    // 再レンダリング時や非マウント時にクリーンアップ
    return () => {
      isMounted = false;
      if (frameId) cancelAnimationFrame(frameId);
      if (intervalId) clearInterval(intervalId);
      
      window.removeEventListener('resize', handleUpdate);
      window.removeEventListener('scroll', handleUpdate);
      window.removeEventListener('imageLoaded', handleUpdate);
      window.removeEventListener('imageFullyLoaded', handleUpdate);
    };
  }, [pin.x_position, pin.y_position, containerRef, is3DView]);

  // ツールチップ位置の更新
  useEffect(() => {
    if ((showTooltip || fixedTooltip) && pinRef.current) {
      const updateTooltipPosition = () => {
        if (!pinRef.current) return;
        
        // ピンの画面上の位置を取得
        const pinRect = pinRef.current.getBoundingClientRect();
        const pinCenterX = pinRect.left + pinRect.width / 2;
        const pinTop = pinRect.top;
        const pinBottom = pinRect.bottom;
        
        // ビューポートのサイズ
        const viewportWidth = window.innerWidth;
        const viewportHeight = window.innerHeight;
        
        // ツールチップのサイズ設定
        const tooltipWidth = Math.min(200, viewportWidth - 40);
        const tooltipHeight = 120; // 推定高さ
        
        // 初期位置 - ピンの上
        let tooltipLeft = pinCenterX - tooltipWidth / 2;
        let tooltipTop = pinTop - tooltipHeight - 10;
        let origin = 'center bottom';
        
        // 上に表示するスペースがない場合は下に表示
        if (tooltipTop < 10) {
          tooltipTop = pinBottom + 10;
          origin = 'center top';
        }
        
        // 左右の画面端に近い場合は調整
        if (tooltipLeft < 10) {
          tooltipLeft = 10;
        } else if (tooltipLeft + tooltipWidth > viewportWidth - 10) {
          tooltipLeft = viewportWidth - tooltipWidth - 10;
        }
        
        // 位置を更新
        setTooltipPosition({
          left: tooltipLeft,
          top: tooltipTop,
          width: tooltipWidth,
          transformOrigin: origin
        });
      };
      
      updateTooltipPosition();
      
      // スクロールとリサイズでツールチップ位置を更新
      window.addEventListener('scroll', updateTooltipPosition);
      window.addEventListener('resize', updateTooltipPosition);
      
      return () => {
        window.removeEventListener('scroll', updateTooltipPosition);
        window.removeEventListener('resize', updateTooltipPosition);
      };
    }
  }, [showTooltip, fixedTooltip]);

  // 説明文の短縮表示用関数
  const truncateText = (text?: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
  };

  // ピンのクリックハンドラー
  const handlePinClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // ビューワーモードでは吹き出しの表示/非表示を切り替え
    setFixedTooltip(!fixedTooltip);
    
    // カスタムイベントを発火
    window.dispatchEvent(new CustomEvent('pinClick', { detail: pin }));
  };
  
  // ツールチップ内の詳細ボタンのクリックハンドラー
  const handleViewDetailsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowModal(true);
    setFixedTooltip(false);
  };

  // 編集権限の確認
  const canEdit = isEditable || (isPublicEdit && currentEditorId === pin.editor_id);

  // ピンの色を決定
  const getPinColor = () => {
    if (fixedTooltip || isSelected) return 'bg-blue-500 hover:bg-blue-600'; // 選択中
    if (isPublicEdit && currentEditorId === pin.editor_id) return 'bg-green-500 hover:bg-green-600'; // 自分のピン
    return 'bg-red-500 hover:bg-red-600'; // デフォルト
  };

  return (
    <>
      <button
        ref={pinRef}
        onClick={handlePinClick}
        onMouseEnter={() => !isMobile && setShowTooltip(true)}
        onMouseLeave={() => !isMobile && setShowTooltip(false)}
        className={`absolute transform -translate-x-1/2 -translate-y-1/2 ${is3DView ? 'pin-3d' : 'pin-normal'} ${fixedTooltip || isSelected ? 'selected-pin pin-hover-animation' : ''}`}
        style={{
          left: `${pinPosition.left}px`,
          top: `${pinPosition.top}px`,
          display: pinPosition.display,
          zIndex: fixedTooltip || isSelected ? 100 : 50,
          pointerEvents: 'auto'
        }}
        data-pin-id={pin.id}
        data-pin-x={pin.x_position}
        data-pin-y={pin.y_position}
        data-floor-id={pin.floor_id}
      >
        <div className="w-6 h-12 relative flex flex-col items-center group">
          {/* ピンのヘッド部分 */}
          <div className={`w-6 h-6 ${getPinColor()} rounded-full flex items-center justify-center text-white 
                        shadow-md transition-all duration-200 border-2 border-white
                        hover:scale-110 z-10 transform-gpu group-hover:-translate-y-1`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
          
          {/* ピンの棒部分 */}
          <div className="absolute flex flex-col items-center">
            {/* 上部 - 棒の上部 */}
            <div className={`h-4 w-2 ${
              fixedTooltip || isSelected 
                ? 'bg-blue-600' 
                : isPublicEdit && currentEditorId === pin.editor_id 
                  ? 'bg-green-600' 
                  : 'bg-red-600'
            } z-0 transform-gpu rounded-b-none mt-4`}></div>
            
            {/* 下部 - 尖った部分 */}
            <div className={`h-3 w-2 ${
              fixedTooltip || isSelected 
                ? 'bg-blue-700' 
                : isPublicEdit && currentEditorId === pin.editor_id 
                  ? 'bg-green-700' 
                  : 'bg-red-700'
            } clip-path-triangle z-0 transform-gpu`}></div>
          </div>
          
          {/* ピンの影 */}
          <div className="absolute bottom-0 w-4 h-1 bg-black/30 rounded-full blur-sm"></div>
        </div>
      </button>
      
      {/* ツールチップ（ポータル経由で表示） */}
      {(showTooltip || fixedTooltip) && portalContainer && createPortal(
        <div 
          className={`fixed bg-white border border-gray-200 rounded-lg shadow-lg p-3 pointer-events-auto ${fixedTooltip ? 'animate-none' : 'animate-tooltip-appear'}`}
          style={{
            left: tooltipPosition.left,
            top: tooltipPosition.top,
            width: tooltipPosition.width,
            zIndex: 800,
            transformOrigin: tooltipPosition.transformOrigin
          }}
        >
          <div className="relative">
            <h3 className="font-bold text-gray-900 mb-1 text-sm">{pin.title}</h3>
            
            {/* 編集者情報 - 常に表示 */}
            <div className="text-xs text-gray-500 mb-1 flex items-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              {pin.editor_nickname || "不明な編集者"}
            </div>
            
            {pin.description && (
              <p className="text-xs text-gray-600">{truncateText(pin.description, 80)}</p>
            )}
            
            <div className="mt-2 flex justify-end gap-1">
              <button 
                onClick={handleViewDetailsClick}
                className="text-xs text-white bg-blue-500 px-2 py-1 rounded hover:bg-blue-600 pointer-events-auto"
              >
                詳細を見る
              </button>
              
              {/* 編集・削除ボタン（条件付き表示） */}
              {canEdit && (
                <>
                  {onEditPin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onEditPin) onEditPin(pin);
                        setFixedTooltip(false);
                      }}
                      className="text-xs text-white bg-green-500 px-2 py-1 rounded hover:bg-green-600 pointer-events-auto"
                    >
                      編集
                    </button>
                  )}
                  
                  {onDeletePin && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (onDeletePin) onDeletePin(pin);
                        setFixedTooltip(false);
                      }}
                      className="text-xs text-white bg-red-500 px-2 py-1 rounded hover:bg-red-600 pointer-events-auto"
                    >
                      削除
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>,
        portalContainer
      )}
      
      {/* 詳細モーダル */}
      <ImprovedModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={pin.title || 'ポイント情報'}
        size="md"
      >
        <PinInfo 
          pin={pin} 
          floors={floors}
          isEditable={canEdit}
          onEdit={() => {
            // 編集モードに切り替え
            if (onEditPin) onEditPin(pin);
            setShowModal(false);
          }}
          onDelete={() => {
            // 削除確認
            if (onDeletePin) onDeletePin(pin);
            setShowModal(false);
          }}
          onClose={() => setShowModal(false)}
        />
      </ImprovedModal>
    </>
  );
};

export default EnhancedPinViewer;