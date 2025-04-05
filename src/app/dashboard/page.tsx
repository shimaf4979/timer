// app/dashboard/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/hooks/auth';
import { MapAPI } from '@/lib/api-client';
import { MapData } from '@/types';
import Loading from '@/components/Loading';
import DeleteConfirmationModal from '@/components/DeleteConfirmationModal';

export default function DashboardPage() {
  const { user, isAuthenticated, token, loading: authLoading } = useAuth();
  const router = useRouter();
  
  const [maps, setMaps] = useState<MapData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newMap, setNewMap] = useState({
    map_id: '',
    title: '',
    description: '',
    is_publicly_editable: false
  });
  
  // 削除確認モーダル用の状態
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [mapToDelete, setMapToDelete] = useState<MapData | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  
  // マップ一覧の取得
  useEffect(() => {
    if (authLoading) return;
    
    if (!isAuthenticated || !token) {
      router.push('/login');
      return;
    }
    
    fetchMaps();
  }, [isAuthenticated, token, authLoading, router]);
  
  const fetchMaps = async () => {
    if (!token) return;
    
    setLoading(true);
    try {
      const data = await MapAPI.getMaps(token);
      console.log("data-maps", data);
      setMaps(data || []);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'マップの取得に失敗しました');
      setMaps([]);
    } finally {
      setLoading(false);
    }
  };
  
  // 入力フォームの変更を処理
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const target = e.target as HTMLInputElement;
      setNewMap({ ...newMap, [name]: target.checked });
    } else {
      setNewMap({ ...newMap, [name]: value });
    }
  };
  
  // マップ作成の処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;
    
    try {
      await MapAPI.createMap(newMap, token);
      
      // 成功したら入力フォームをリセットしてマップ一覧を更新
      setNewMap({
        map_id: '',
        title: '',
        description: '',
        is_publicly_editable: false
      });
      setShowCreateForm(false);
      fetchMaps();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'マップの作成に失敗しました');
    }
  };
  
  // マップ削除の処理
  const handleDeleteMap = (map: MapData) => {
    setMapToDelete(map);
    setDeleteModalOpen(true);
  };
  
  const confirmDelete = async () => {
    if (!mapToDelete || !token) return;
    
    setIsDeleting(true);
    
    try {
      await MapAPI.deleteMap(mapToDelete.id, token);
      
      // 削除が成功したらリストから削除
      setMaps(maps.filter(m => m.id !== mapToDelete.id));
      setDeleteModalOpen(false);
      setMapToDelete(null);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'マップの削除に失敗しました');
    } finally {
      setIsDeleting(false);
    }
  };
  
  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loading />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">マイマップ</h1>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
        >
          {showCreateForm ? 'キャンセル' : '新規マップ作成'}
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      {/* 新規マップ作成フォーム */}
      {showCreateForm && (
        <div className="bg-white shadow-md rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">新規マップ作成</h2>
          <form onSubmit={handleSubmit}>
            <div className="mb-4">
              <label htmlFor="map_id" className="block text-sm font-medium text-gray-700 mb-1">
                マップID (英数字のみ)
              </label>
              <input
                type="text"
                id="map_id"
                name="map_id"
                required
                pattern="[a-zA-Z0-9_\-]+"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newMap.map_id}
                onChange={handleInputChange}
                placeholder="例: shop1, hotel2など"
              />
              <p className="text-xs text-gray-500 mt-1">
                URLや識別子として使用されます。英数字、ハイフン、アンダースコアのみ使用可能です。
              </p>
            </div>
            
            <div className="mb-4">
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                タイトル
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                value={newMap.title}
                onChange={handleInputChange}
                placeholder="マップのタイトル"
              />
            </div>
            
            <div className="mb-4">
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
                説明 (任意)
              </label>
              <textarea
                id="description"
                name="description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                rows={3}
                value={newMap.description}
                onChange={handleInputChange}
                placeholder="マップの説明"
              />
            </div>
            
            <div className="mb-4">
              <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                <input
                  type="checkbox"
                  id="is_publicly_editable"
                  name="is_publicly_editable"
                  checked={newMap.is_publicly_editable}
                  onChange={handleInputChange}
                  className="mr-2 h-4 w-4 text-blue-600"
                />
                公開編集を許可する（誰でもピンを追加・編集できます）
              </label>
              <p className="text-xs text-gray-500 mt-1 ml-6">
                チェックすると、ログインしていないユーザーでもニックネームを設定してピンの追加・編集ができるようになります。
              </p>
            </div>
            
            <div className="flex justify-end">
              <button
                type="submit"
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                作成
              </button>
            </div>
          </form>
        </div>
      )}
      
      {/* マップ一覧 */}
      {Array.isArray(maps) && maps.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {maps.map((map) => (
            <div key={map.id} className="bg-white shadow-md rounded-lg overflow-hidden">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-2">{map.title}</h2>
                <p className="text-gray-600 mb-4 text-sm line-clamp-2">{map.description || '説明なし'}</p>
                <div className="text-gray-500 text-xs mb-4">
                  <p>ID: {map.id}</p>
                  <p>作成日: {new Date(map.created_at || '').toLocaleDateString()}</p>
                  <p>更新日: {new Date(map.updated_at || '').toLocaleDateString()}</p>
                  {map.is_publicly_editable && (
                    <p className="text-green-600 font-medium mt-1">※ 公開編集モード有効</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2 mt-4">
                  <Link
                    href={`/maps/${map.id}/edit`}
                    className="px-3 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm flex-1 text-center"
                  >
                    編集
                  </Link>
                  <Link
                    href={`/viewer/${map.map_id}`}
                    target="_blank"
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm flex-1 text-center"
                  >
                    閲覧
                  </Link>
                  {map.is_publicly_editable && (
                    <Link
                      href={`/public-edit/${map.map_id}`}
                      target="_blank"
                      className="px-3 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 text-sm flex-1 text-center"
                    >
                      公開編集
                    </Link>
                  )}
                  <button
                    onClick={() => handleDeleteMap(map)}
                    className="px-3 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 text-sm flex-none"
                  >
                    削除
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white shadow-md rounded-lg p-6 text-center">
          <p className="text-gray-600">
            マップがまだありません。「新規マップ作成」ボタンから作成しましょう。
          </p>
        </div>
      )}
      
      {/* 削除確認モーダル */}
      <DeleteConfirmationModal
        isOpen={deleteModalOpen}
        title="マップの削除"
        message="このマップを削除しますか？この操作は元に戻せません。関連するすべてのエリアとピンも削除されます。"
        itemName={mapToDelete?.title}
        isDeleting={isDeleting}
        onClose={() => {
          if (!isDeleting) {
            setDeleteModalOpen(false);
            setMapToDelete(null);
          }
        }}
        onConfirm={confirmDelete}
      />
    </div>
  );
}
  