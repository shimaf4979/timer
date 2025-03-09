// components/ResponsiveImage.tsx
import React, { useState, useEffect, useRef } from 'react';

interface ResponsiveImageProps {
  src: string;
  alt: string;
  className?: string;
  onClick?: (e: React.MouseEvent<HTMLDivElement>) => void;
  onLoad?: () => void;
}

const ResponsiveImage: React.FC<ResponsiveImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  onClick,
  onLoad 
}) => {
  const [aspectRatio, setAspectRatio] = useState<number | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);

  // 画像がロードされたら縦横比を計算
  useEffect(() => {
    if (!src) return;
    
    const img = new Image();
    img.onload = () => {
      const ratio = img.height / img.width;
      setAspectRatio(ratio);
      setIsLoaded(true);
      if (onLoad) onLoad();
    };
    img.src = src;
    
    return () => {
      img.onload = null;
    };
  }, [src, onLoad]);

  // 画像のリサイズを監視して調整
  useEffect(() => {
    if (!isLoaded || !containerRef.current || !imgRef.current) return;

    const resizeObserver = new ResizeObserver(() => {
      // コンテナサイズに変更があったとき、必要な調整をここに追加
      const event = new CustomEvent('imageResize', { 
        detail: { 
          container: containerRef.current,
          image: imgRef.current
        }
      });
      window.dispatchEvent(event);
    });

    resizeObserver.observe(containerRef.current);
    
    return () => {
      if (containerRef.current) {
        resizeObserver.unobserve(containerRef.current);
      }
    };
  }, [isLoaded]);

  return (
    <div 
      ref={containerRef}
      className={`relative w-full ${className}`}
      style={{ 
        // アスペクト比が計算されるまでは暫定の高さ
        paddingBottom: aspectRatio ? `${aspectRatio * 100}%` : '75%', 
      }}
      onClick={onClick}
    >
      {isLoaded && (
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className="absolute inset-0 w-full h-full object-contain"
          onLoad={() => {
            // 画像が実際に描画された後に追加の処理が必要な場合
            const event = new CustomEvent('imageFullyLoaded', { 
              detail: { 
                container: containerRef.current,
                image: imgRef.current
              }
            });
            window.dispatchEvent(event);
          }}
        />
      )}
      {!isLoaded && (
        <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
          <div className="animate-pulse bg-gray-300 w-full h-full"></div>
        </div>
      )}
    </div>
  );
};

export default ResponsiveImage;