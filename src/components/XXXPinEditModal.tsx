// // components/PinEditModal.tsx
// import React, { useState } from 'react';
// import { Pin, Floor } from '@/types/map-types';

// interface PinEditModalProps {
//   pin: Pin;
//   floors: Floor[];
//   onClose: () => void;
//   onSave: (updatedPin: Pin) => void;
// }

// const PinEditModal: React.FC<PinEditModalProps> = ({ 
//   pin, 
//   floors, 
//   onClose, 
//   onSave 
// }) => {
//   const [title, setTitle] = useState(pin.title);
//   const [description, setDescription] = useState(pin.description);
//   const [floorId, setFloorId] = useState(pin.floor_id);

//   const handleSubmit = (e: React.FormEvent) => {
//     e.preventDefault();
//     if (title.trim() === '') return;

//     const updatedPin: Pin = {
//       ...pin,
//       title,
//       description,
//       floor_id: floorId
//     };

//     onSave(updatedPin);
//   };

//   return (
//     <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
//       <div className="bg-white rounded-lg p-6 max-w-md w-full">
//         <h2 className="text-xl font-semibold mb-4">ピン情報を編集</h2>
//         <form onSubmit={handleSubmit}>
//           <div className="mb-4">
//             <label className="block text-gray-700 mb-2">タイトル</label>
//             <input
//               type="text"
//               value={title}
//               onChange={(e) => setTitle(e.target.value)}
//               className="w-full p-2 border rounded-md"
//               placeholder="タイトルを入力"
//               required
//             />
//           </div>
//           <div className="mb-4">
//             <label className="block text-gray-700 mb-2">説明</label>
//             <textarea
//               value={description}
//               onChange={(e) => setDescription(e.target.value)}
//               className="w-full p-2 border rounded-md h-32"
//               placeholder="説明を入力"
//             />
//           </div>
//           <div className="mb-6">
//             <label className="block text-gray-700 mb-2">エリア</label>
//             <select
//               title="エリア"
//               value={floorId}
//               onChange={(e) => setFloorId(e.target.value)}
//               className="w-full p-2 border rounded-md"
//             >
//               {floors.map((floor) => (
//                 <option key={floor.id} value={floor.id}>
//                   {floor.name}
//                 </option>
//               ))}
//             </select>
//           </div>
//           <div className="flex justify-end space-x-2">
//             <button
//               type="button"
//               onClick={onClose}
//               className="px-4 py-2 border rounded-md text-gray-700 hover:bg-gray-100"
//             >
//               キャンセル
//             </button>
//             <button
//               type="submit"
//               className="px-4 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600"
//             >
//               保存
//             </button>
//           </div>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default PinEditModal;