// context/UserContext.tsx
'use client';
import { createContext, useContext, ReactNode } from 'react';

interface UserContextType {
  user: any;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({
  user,
  children
}: {
  user: any;
  children: ReactNode;
}) => {
  return (
    <UserContext.Provider value={{ user }}>{children}</UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
