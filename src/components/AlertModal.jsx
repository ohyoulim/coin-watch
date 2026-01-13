import React, { useState, useEffect } from 'react';
import { FaTimes, FaTrash } from 'react-icons/fa';

export default function AlertModal({ isOpen, onClose, coin, currentAlert, onSave, onDelete }) {
  if (!isOpen || !coin) return null;

  const [targetPrice, setTargetPrice] = useState('');
  const [condition, setCondition] = useState('gte'); // 'gte' (>=) or 'lte' (<=)

  useEffect(() => {
    if (currentAlert) {
      setTargetPrice(currentAlert.targetPrice);
      setCondition(currentAlert.condition);
    } else {
      setTargetPrice(coin.price);
      setCondition('gte');
    }
  }, [coin, currentAlert, isOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(coin.symbol, parseFloat(targetPrice), condition);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-2xl max-w-sm w-full shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
          <h3 className="text-lg font-bold">{coin.symbol} 알림 설정</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <FaTimes />
          </button>
        </div>
        
        {/* Body */}
        <form onSubmit={handleSubmit}>
          <div className="p-6">
            <div className="mb-4">
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">현재 가격</label>
              <div className="text-xl font-mono font-bold">
                {new Intl.NumberFormat('ko-KR').format(coin.price)} 원
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">목표 가격</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={targetPrice}
                    onChange={(e) => setTargetPrice(e.target.value)}
                    placeholder="가격 입력" 
                    className="w-full pl-4 pr-12 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none font-mono"
                    required
                  />
                  <span className="absolute right-4 top-3.5 text-gray-400">원</span>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button 
                  type="button"
                  onClick={() => setCondition('gte')}
                  className={`py-2 px-4 rounded-lg font-semibold text-sm border-2 ${condition === 'gte' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-transparent bg-gray-100 text-gray-600'}`}
                >
                  이상 (≥)
                </button>
                <button 
                  type="button"
                  onClick={() => setCondition('lte')}
                  className={`py-2 px-4 rounded-lg font-semibold text-sm border-2 ${condition === 'lte' ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-transparent bg-gray-100 text-gray-600'}`}
                >
                  이하 (≤)
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 flex space-x-3">
            <button type="submit" className="flex-1 bg-blue-600 text-white font-bold py-3 rounded-xl hover:bg-blue-700 transition-colors">
              저장하기
            </button>
            {currentAlert && (
              <button 
                type="button"
                onClick={() => { onDelete(coin.symbol); onClose(); }}
                className="px-4 py-3 rounded-xl border border-gray-300 text-gray-400 hover:text-red-500"
              >
                <FaTrash />
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
}
