import React, { createContext, useContext, useState } from 'react';

interface WalkBadgeContextValue {
  pendingCount: number;
  setPendingCount: (n: number) => void;
  unreadMsgCount: number;
  setUnreadMsgCount: (n: number) => void;
}

const WalkBadgeContext = createContext<WalkBadgeContextValue>({
  pendingCount: 0,
  setPendingCount: () => {},
  unreadMsgCount: 0,
  setUnreadMsgCount: () => {},
});

export const WalkBadgeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [pendingCount, setPendingCount] = useState(0);
  const [unreadMsgCount, setUnreadMsgCount] = useState(0);
  return (
    <WalkBadgeContext.Provider value={{ pendingCount, setPendingCount, unreadMsgCount, setUnreadMsgCount }}>
      {children}
    </WalkBadgeContext.Provider>
  );
};

export const useWalkBadge = () => useContext(WalkBadgeContext);
