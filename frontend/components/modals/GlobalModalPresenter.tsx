'use client';

import React from 'react';
import { useModal } from '../../context/ModalContext';

export const GlobalModalPresenter = () => {
  const { modalState, hideModal } = useModal();

  if (!modalState.isOpen) return null;

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
      if (modalState.onCancel) modalState.onCancel();
      hideModal();
    }
  };

  const handleConfirm = async () => {
    if (modalState.onConfirm) {
      await modalState.onConfirm();
    }
    hideModal();
  };

  const handleCancel = () => {
    if (modalState.onCancel) {
      modalState.onCancel();
    }
    hideModal();
  };

  // Render Custom Modal Content Directly
  if (modalState.type === 'CUSTOM') {
    return (
      <div 
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      >
        <div className="bg-white rounded-xl shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
           {modalState.content}
        </div>
      </div>
    );
  }

  // Render Standard Confirmation / Info Modals
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-200 border border-slate-200">
        
        {modalState.title && (
          <div className="px-6 py-4 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="text-lg font-semibold text-slate-800">{modalState.title}</h3>
            <button 
              onClick={handleCancel}
              className="text-slate-400 hover:text-slate-600 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}

        <div className="px-6 py-5 text-slate-600 text-sm leading-relaxed">
          {modalState.content}
        </div>

        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
          {modalState.type !== 'INFO' && (
             <button
                onClick={handleCancel}
                className="px-4 py-2 text-sm font-medium text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition-colors"
             >
                {modalState.cancelText || 'İptal'}
             </button>
          )}
          
          <button
            onClick={handleConfirm}
            className={`px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors ${
              modalState.type === 'INFO' 
                ? 'bg-blue-600 hover:bg-blue-700' 
                : 'bg-red-600 hover:bg-red-700'
            }`}
          >
            {modalState.confirmText || 'Onayla'}
          </button>
        </div>

      </div>
    </div>
  );
};
