// components/QRCodeGenerator.tsx
'use client';

import { useState } from 'react';
import Modal from './Modal';
import { QRCodeCanvas } from 'qrcode.react';

interface QRCodeGeneratorProps {
  url: string;
  title?: string;
  publicEditUrl?: string;
  className?: string;
}

export default function QRCodeGenerator({
  url,
  title,
  publicEditUrl,
  className = ''
}: QRCodeGeneratorProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'view' | 'edit'>('view');
  
  // 完全なURLを構築
  const getFullUrl = (path: string) => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}${path}`;
  };
  
  const fullViewUrl = getFullUrl(url);
  const fullEditUrl = publicEditUrl ? getFullUrl(publicEditUrl) : '';

  // URLをクリップボードにコピー
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  return (
    <>
      <button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-md transition-colors ${className}`}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        QRコード
      </button>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="QRコード"
        size="md"
      >
        <div className="flex flex-col items-center">
          {/* タブ切り替え (公開編集URLがある場合のみ) */}
          {publicEditUrl && (
            <div className="flex w-full mb-6 border-b">
              <button
                onClick={() => setActiveTab('view')}
                className={`flex-1 py-2 text-center border-b-2 ${
                  activeTab === 'view'
                    ? 'border-blue-500 text-blue-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                閲覧用
              </button>
              <button
                onClick={() => setActiveTab('edit')}
                className={`flex-1 py-2 text-center border-b-2 ${
                  activeTab === 'edit'
                    ? 'border-purple-500 text-purple-600 font-medium'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                公開編集用
              </button>
            </div>
          )}
          
          {activeTab === 'view' ? (
            <>
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <QRCodeCanvas
                  value={fullViewUrl}
                  size={200}
                  level="H"
                  includeMargin
                  className="mx-auto"
                />
              </div>
              
              <p className="text-sm text-gray-600 mb-4 text-center">
                このQRコードを読み取ると、閲覧用ページにアクセスできます。
              </p>
              
              <div className="w-full flex items-center mb-4">
                <input
                  title="閲覧用URL"
                  placeholder="閲覧用URL"
                  type="text"
                  value={fullViewUrl}
                  readOnly
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => copyToClipboard(fullViewUrl)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                  title="URLをコピー"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={() => window.open(fullViewUrl, '_blank')}
                className="px-4 py-2 bg-green-500 text-white rounded-md hover:bg-green-600 w-full"
              >
                閲覧ページを開く
              </button>
            </>
          ) : (
            <>
              <div className="bg-white p-4 rounded-lg shadow-sm mb-4">
                <QRCodeCanvas
                  value={fullEditUrl}
                  size={200}
                  level="H"
                  includeMargin
                  className="mx-auto"
                />
              </div>
              
              <p className="text-sm text-gray-600 mb-4 text-center">
                このQRコードを読み取ると、公開編集ページにアクセスできます。
                誰でもニックネームを設定してピンの追加・編集ができます。
              </p>
              
              <div className="w-full flex items-center mb-4">
                <input
                  title="公開編集用URL"
                  placeholder="公開編集用URL"
                  type="text"
                  value={fullEditUrl}
                  readOnly
                  className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                <button
                  onClick={() => copyToClipboard(fullEditUrl)}
                  className="px-4 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                  title="URLをコピー"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                    <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                  </svg>
                </button>
              </div>
              
              <button
                onClick={() => window.open(fullEditUrl, '_blank')}
                className="px-4 py-2 bg-purple-500 text-white rounded-md hover:bg-purple-600 w-full"
              >
                公開編集ページを開く
              </button>
            </>
          )}
        </div>
      </Modal>
    </>
  );
}