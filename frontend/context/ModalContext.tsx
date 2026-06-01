'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

type ModalType = 
  | 'CONFIRMATION'
  | 'INFO'
  | 'CUSTOM' 
  | null;

interface ModalState {
  isOpen: boolean;
  type: ModalType;
  title?: string;
  content?: ReactNode;
  onConfirm?: () => void | Promise<void>;
  onCancel?: () => void;
  confirmText?: string;
  cancelText?: string;
  customProps?: any;
}

interface ModalContextType {
  modalState: ModalState;
  showModal: (config: Omit<ModalState, 'isOpen'>) => void;
  hideModal: () => void;
}

const initialState: ModalState = {
  isOpen: false,
  type: null,
};

const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const ModalProvider = ({ children }: { children: ReactNode }) => {
  const [modalState, setModalState] = useState<ModalState>(initialState);

  const showModal = (config: Omit<ModalState, 'isOpen'>) => {
    setModalState({ ...config, isOpen: true });
  };

  const hideModal = () => {
    setModalState(initialState);
  };

  return (
    <ModalContext.Provider value={{ modalState, showModal, hideModal }}>
      {children}
    </ModalContext.Provider>
  );
};

export const useModal = () => {
  const context = useContext(ModalContext);
  if (context === undefined) {
    throw new Error('useModal must be used within a ModalProvider');
  }
  return context;
};
