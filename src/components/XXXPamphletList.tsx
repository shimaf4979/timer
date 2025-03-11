// // components/PamphletList.tsx
// import React, { useState, useEffect } from 'react';
// import Link from 'next/link';

// interface Pamphlet {
//   id: string;
//   title: string;
//   description: string;
//   imageUrl: string | null;
//   floorsCount: number;
//   pinsCount: number;
// }

// interface PamphletListProps {
//   currentId?: string;
//   isAdmin?: boolean;
// }

// const PamphletList: React.FC<PamphletListProps> = ({ currentId, isAdmin = false }) => {
//   const [pamphlets, setPamphlets] = useState<Pamphlet[]>([]);
//   const [loading, setLoading] = useState(true);

//   // LocalStorageからすべてのパンフレットデータを読み込む
//   useEffect(() => {
//     const loadPamphlets = () => {
//       try {
//         const allPamphlets: Pamphlet[] = [];
//         // LocalStorageのすべてのキーを取得
//         for (let i = 0; i < localStorage.length; i++) {
//           const key = localStorage.key(i);
          
//           // floors_で始まるキーを探す（パンフレットのデータ）
//           if (key && key.startsWith('floors_')) {
//             const pamphletId = key.replace('floors_', '');
//             const floorsData = localStorage.getItem(key);
//             const pinsData = localStorage.getItem(`pins_${pamphletId}`);
            
//             if (floorsData) {
//               const floors = JSON.parse(floorsData);
//               const pins = pinsData ? JSON.parse(pinsData) : [];
              
//               // サムネイル用の画像（最初の階の画像を使用）
//               const thumbnailImage = floors.length > 0 && floors[0].imageUrl 
//                 ? floors[0].imageUrl 
//                 : null;
              
//               allPamphlets.push({
//                 id: pamphletId,
//                 title: `パンフレット: ${pamphletId}`,
//                 description: `${floors.length}階建て、${pins.length}個のポイント`,
//                 imageUrl: thumbnailImage,
//                 floorsCount: floors.length,
//                 pinsCount: pins.length
//               });
//             }
//           }
//         }
        
//         setPamphlets(allPamphlets);
//       } catch (error) {
//         console.error('パンフレットの読み込みに失敗しました', error);
//       } finally {
//         setLoading(false);
//       }
//     };
    
//     loadPamphlets();
//   }, []);

//   if (loading) {
//     return (
//       <div className="text-center py-8">
//         <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
//         <p className="text-gray-600">パンフレットを読み込み中...</p>
//       </div>
//     );
//   }

//   if (pamphlets.length === 0) {
//     return (
//       <div className="text-center py-8 bg-white rounded-lg shadow-sm">
//         <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//           <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//         </svg>
//         <p className="text-gray-600 mb-4">パンフレットがありません</p>
//         {isAdmin && (
//           <Link href="/" className="text-blue-500 hover:underline">
//             新しいパンフレットを作成
//           </Link>
//         )}
//       </div>
//     );
//   }

//   return (
//     <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
//       {pamphlets.map((pamphlet) => (
//         <Link
//           key={pamphlet.id}
//           href={isAdmin ? `/` : `/viewer?id=${pamphlet.id}`}
//           className={`block ${currentId === pamphlet.id ? 'ring-2 ring-blue-500' : ''}`}
//         >
//           <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow">
//             <div className="h-40 bg-gray-100 relative">
//               {pamphlet.imageUrl ? (
//                 <img
//                   src={pamphlet.imageUrl}
//                   alt={pamphlet.title}
//                   className="w-full h-full object-cover"
//                 />
//               ) : (
//                 <div className="absolute inset-0 flex items-center justify-center">
//                   <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
//                   </svg>
//                 </div>
//               )}
//               <div className="absolute top-2 right-2">
//                 <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded-full">
//                   {pamphlet.floorsCount}階
//                 </span>
//               </div>
//             </div>
//             <div className="p-4">
//               <h3 className="font-medium text-gray-800 mb-1 truncate">{pamphlet.title}</h3>
//               <p className="text-sm text-gray-500">{pamphlet.description}</p>
//             </div>
//           </div>
//         </Link>
//       ))}
      
//       {isAdmin && (
//         <Link href="/" className="block">
//           <div className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow border-2 border-dashed border-gray-300 flex items-center justify-center h-full min-h-[200px]">
//             <div className="text-center p-4">
//               <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                 <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
//               </svg>
//               <p className="text-gray-600">新規作成</p>
//             </div>
//           </div>
//         </Link>
//       )}
//     </div>
//   );
// };

// export default PamphletList;