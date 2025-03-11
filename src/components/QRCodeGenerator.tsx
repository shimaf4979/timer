// components/QRCodeGenerator.tsx の修正部分
'use client';

import React, { useState, useEffect } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import ImprovedModal from './ImprovedModal';

interface QRCodeGeneratorProps {
  url: string;
  title?: string;
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({ url, title }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullUrl, setFullUrl] = useState('');

  useEffect(() => {
    // 完全なURLを構築（クライアントサイドでのみ実行）
    if (typeof window !== 'undefined') {
      const origin = window.location.origin;
      setFullUrl(`${origin}${url}`);
    }
  }, [url]);

  // モーダル開閉時にbodyにクラスを追加/削除
  useEffect(() => {
    if (isModalOpen) {
      document.body.classList.add('qr-modal-open');
    } else {
      document.body.classList.remove('qr-modal-open');
    }
    
    return () => {
      document.body.classList.remove('qr-modal-open');
    };
  }, [isModalOpen]);

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className="inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors cursor-pointer"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1V4zm2 2V5h1v1H5zm-2 7a1 1 0 011-1h3a1 1 0 011 1v3a1 1 0 01-1 1H4a1 1 0 01-1-1v-3zm2 2v-1h1v1H5zm8-12a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1V4a1 1 0 00-1-1h-3zm1 2V5h1v1h-1zm-1 4a1 1 0 00-1 1v3a1 1 0 001 1h3a1 1 0 001-1v-3a1 1 0 00-1-1h-3zm1 2v-1h1v1h-1z" clipRule="evenodd" />
        </svg>
        QRコード
      </button>

      <ImprovedModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        title="閲覧用QRコード"
        size="md"
      >
        <div className="flex flex-col items-center">
          <div className="flex justify-center mb-4 bg-white p-4 rounded">
            <QRCodeSVG
              value={fullUrl}
              size={200}
              level="H"
              includeMargin={true}
            />
          </div>
          
          <p className="text-sm text-gray-600 mb-4 text-center">
            このQRコードを読み取ると、閲覧用ページにアクセスできます。
          </p>
          
          <div className="flex space-x-4">
            <button
              onClick={() => {
                window.open(fullUrl, '_blank');
              }}
              className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600"
            >
              閲覧者ページへ
            </button>
            <button
              onClick={() => {
                navigator.clipboard.writeText(fullUrl);
                alert('URLをクリップボードにコピーしました');
              }}
              className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
            >
              URLをコピー
            </button>
          </div>
        </div>
      </ImprovedModal>
    </>
  );
};

export default QRCodeGenerator;