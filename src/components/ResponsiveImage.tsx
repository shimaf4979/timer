// components/ResponsiveImage.tsx
import React, { useState, useEffect, useRef } from 'react';
import { preloadAndCacheImage, getFromImageCache, hasImageInCache } from '@/utils/imageCache';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onLoad?: () => void;
  onProgressChange?: (progress: number) => void;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  onClick,
  onLoad,
  onProgressChange
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [imageStyle, setImageStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 進捗更新関数
  const updateProgress = (progress: number) => {
    setLoadProgress(progress);
    if (onProgressChange) {
      onProgressChange(progress);
    }
  };

  // 画像の読み込みを監視
  useEffect(() => {
    if (!src) return;
    
    // キャッシュを確認して即時表示
    if (hasImageInCache(src)) {
      const cachedInfo = getFromImageCache(src);
      if (cachedInfo) {
        setIsLoaded(true);
        updateProgress(100);
        if (onLoad) onLoad();
        
        // 画像の読み込み完了イベントを発火
        window.dispatchEvent(new CustomEvent('imageLoaded', { 
          detail: { 
            container: containerRef.current,
            src: src,
            ...cachedInfo
          }
        }));
        return;
      }
    }
    
    // キャッシュにない場合は新規読み込み
    let isMounted = true;
    updateProgress(10); // 開始状態
    
    preloadAndCacheImage(src)
      .then(imageInfo => {
        if (!isMounted) return;
        
        // 画像情報を更新
        setIsLoaded(true);
        updateProgress(100);
        if (onLoad) onLoad();
        
        // 画像の読み込み完了イベントを発火
        window.dispatchEvent(new CustomEvent('imageLoaded', { 
          detail: { 
            container: containerRef.current,
            src: src,
            ...imageInfo
          }
        }));
      })
      .catch(error => {
        console.error('画像の読み込みエラー:', error);
        updateProgress(0);
      });
    
    return () => {
      isMounted = false;
    };
  }, [src, onLoad, onProgressChange]);

  // 画像を中央に配置し、コンテナに収まるようにサイズ調整
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !imgRef.current) return;
    
    const updateImageStyle = () => {
      if (!containerRef.current || !imgRef.current) return;
      
      const containerRect = containerRef.current.getBoundingClientRect();
      const imageInfo = getFromImageCache(src);
      
      if (imageInfo) {
        const { originalWidth, originalHeight, aspectRatio } = imageInfo;
        
        // コンテナと画像のアスペクト比を比較
        const containerAspect = containerRect.height / containerRect.width;
        
        let width, height;
        
        if (aspectRatio > containerAspect) {
          // 画像の方が縦長 -> 高さを合わせる
          height = containerRect.height;
          width = height / aspectRatio;
        } else {
          // 画像の方が横長 -> 幅を合わせる
          width = containerRect.width;
          height = width * aspectRatio;
        }
        
        // スタイルを更新
        setImageStyle({
          width: `${width}px`,
          height: `${height}px`,
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        });
      }
    };
    
    // 初回実行
    updateImageStyle();
    
    // リサイズ監視
    const resizeObserver = new ResizeObserver(() => {
      requestAnimationFrame(updateImageStyle);
    });
    
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }
    
    // ウィンドウリサイズも監視
    const handleResize = () => {
      requestAnimationFrame(updateImageStyle);
    };
    
    window.addEventListener('resize', handleResize);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
      window.removeEventListener('resize', handleResize);
    };
  }, [isLoaded, src]);

  return (
    <div 
      ref={containerRef}
      className={`relative flex items-center justify-center ${className}`}
      style={{ width: '100%', height: '100%' }}
      onClick={onClick}
      data-image-src={src}
      data-image-loaded={isLoaded ? 'true' : 'false'}
    >
      {isLoaded ? (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="max-w-full max-h-full"
          style={imageStyle}
          onLoad={() => {
            // 画像が実際に描画された後の処理
            if (src) {
              const imgInfo = getFromImageCache(src);
              if (imgInfo) {
                window.dispatchEvent(new CustomEvent('imageFullyLoaded', { 
                  detail: { 
                    container: containerRef.current,
                    image: imgRef.current,
                    src: src,
                    ...imgInfo
                  }
                }));
              }
            }
          }}
        />
      ) : (
        <div className="flex flex-col items-center justify-center w-3/4 max-w-md">
          <div className="w-full h-2 bg-gray-200 rounded-full overflow-hidden">
            <div 
              className="h-full bg-blue-500 transition-all duration-300"
              style={{ width: `${loadProgress}%` }}
            ></div>
          </div>
          <span className="text-xs text-gray-500 mt-2">{loadProgress}%</span>
        </div>
      )}
    </div>
  );
};

export default ResponsiveImage;