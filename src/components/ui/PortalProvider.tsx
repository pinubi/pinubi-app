import React, { createContext, ReactNode, useCallback, useContext, useState } from 'react';
import { View } from 'react-native';

interface PortalContextType {
  showPortal: (content: ReactNode, id?: string) => void;
  hidePortal: (id?: string) => void;
}

const PortalContext = createContext<PortalContextType | undefined>(undefined);

export const usePortal = () => {
  const context = useContext(PortalContext);
  if (!context) {
    throw new Error('usePortal must be used within a PortalProvider');
  }
  return context;
};

interface PortalItem {
  id: string;
  content: ReactNode;
}

export const PortalProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [portals, setPortals] = useState<PortalItem[]>([]);

  const showPortal = useCallback((content: ReactNode, id: string = 'default') => {
    setPortals(prev => {
      const filtered = prev.filter(p => p.id !== id);
      return [...filtered, { id, content }];
    });
  }, []);

  const hidePortal = useCallback((id: string = 'default') => {
    setPortals(prev => prev.filter(p => p.id !== id));
  }, []);

  return (
    <PortalContext.Provider value={{ showPortal, hidePortal }}>
      <View style={{ flex: 1 }}>
        {children}
        
        {/* Portal container - renders above everything */}
        {portals.map(portal => (
          <View
            key={portal.id}
            style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: 1000,
              elevation: 1000,
            }}
            pointerEvents="box-none"
          >
            {portal.content}
          </View>
        ))}
      </View>
    </PortalContext.Provider>
  );
};
