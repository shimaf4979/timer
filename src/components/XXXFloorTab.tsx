// // components/FloorTab.tsx
// import React, { useState, useRef, useEffect } from 'react';
// import { Floor } from '@/types/map-types';

// interface FloorTabProps {
//   floor: Floor;
//   isActive: boolean;
//   onClick: () => void;
//   onRename: (newName: string) => void;
//   onRemove: () => void;
// }

// const FloorTab: React.FC<FloorTabProps> = ({ 
//   floor, 
//   isActive, 
//   onClick, 
//   onRename, 
//   onRemove 
// }) => {
//   const [isEditing, setIsEditing] = useState(false);
//   const [editName, setEditName] = useState(floor.name);
//   const inputRef = useRef<HTMLInputElement>(null);
//   const [showMenu, setShowMenu] = useState(false);
//   const menuRef = useRef<HTMLDivElement>(null);

//   // 編集モードになったら入力欄にフォーカス
//   useEffect(() => {
//     if (isEditing && inputRef.current) {
//       inputRef.current.focus();
//     }
//   }, [isEditing]);

//   // メニューの外側をクリックしたらメニューを閉じる
//   useEffect(() => {
//     const handleClickOutside = (event: MouseEvent) => {
//       if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
//         setShowMenu(false);
//       }
//     };

//     document.addEventListener('mousedown', handleClickOutside);
//     return () => {
//       document.removeEventListener('mousedown', handleClickOutside);
//     };
//   }, []);

//   // 名前の保存処理
//   const handleSaveName = () => {
//     if (editName.trim()) {
//       onRename(editName);
//     } else {
//       setEditName(floor.name);
//     }
//     setIsEditing(false);
//   };

//   // Enterキーで保存、Escキーでキャンセル
//   const handleKeyDown = (e: React.KeyboardEvent) => {
//     if (e.key === 'Enter') {
//       handleSaveName();
//     } else if (e.key === 'Escape') {
//       setEditName(floor.name);
//       setIsEditing(false);
//     }
//   };

//   return (
//     <div className="relative">
//       <div 
//         className={`px-4 py-2 border-b-2 cursor-pointer ${
//           isActive 
//             ? 'text-blue-600 border-blue-500 bg-blue-50' 
//             : 'text-gray-700 border-transparent hover:bg-gray-100'
//         }`}
//         onClick={onClick}
//       >
//         <div className="flex items-center">
//           {isEditing ? (
//             <input
//               title="floor-name"
//               placeholder="floor-name"
//               ref={inputRef}
//               type="text"
//               value={editName}
//               onChange={(e) => setEditName(e.target.value)}
//               onBlur={handleSaveName}
//               onKeyDown={handleKeyDown}
//               className="w-20 p-1 border rounded text-sm"
//               onClick={(e) => e.stopPropagation()}
//             />
//           ) : (
//             <span>{floor.name}</span>
//           )}

//           {/* タブのオプションボタン */}
//           <button
//             title="floor-menu"
//             className="ml-2 text-gray-500 hover:text-gray-700"
//             onClick={(e) => {
//               e.stopPropagation();
//               setShowMenu(!showMenu);
//             }}
//           >
//             <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
//             </svg>
//           </button>
//         </div>
//       </div>

//       {/* タブのオプションメニュー */}
//       {showMenu && (
//         <div 
//           ref={menuRef}
//           className="absolute right-0 mt-1 w-32 bg-white border rounded-md shadow-lg z-10"
//         >
//           <button 
//             className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
//             onClick={(e) => {
//               e.stopPropagation();
//               setIsEditing(true);
//               setShowMenu(false);
//             }}
//           >
//             名前変更
//           </button>
//           <button 
//             className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100"
//             onClick={(e) => {
//               e.stopPropagation();
//               onRemove();
//               setShowMenu(false);
//             }}
//           >
//             削除
//           </button>
//         </div>
//       )}
//     </div>
//   );
// };

// export default FloorTab;