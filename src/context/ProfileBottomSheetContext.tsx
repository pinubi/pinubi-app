import React, { createContext, useContext } from 'react';

import { type BottomSheetRef } from '@/components/ui';

interface ProfileBottomSheetContextType {
  profileBottomSheetRef: React.RefObject<BottomSheetRef> | null;
  setProfileBottomSheetRef: (ref: React.RefObject<BottomSheetRef>) => void;
  openProfileBottomSheet: () => void;
}

const ProfileBottomSheetContext = createContext<ProfileBottomSheetContextType | undefined>(undefined);

export const ProfileBottomSheetProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [profileBottomSheetRef, setProfileBottomSheetRefState] = React.useState<React.RefObject<BottomSheetRef> | null>(null);

  const setProfileBottomSheetRef = React.useCallback((ref: React.RefObject<BottomSheetRef>) => {
    setProfileBottomSheetRefState(ref);
  }, []);

  const openProfileBottomSheet = React.useCallback(() => {
    if (profileBottomSheetRef?.current) {
      profileBottomSheetRef.current.snapToIndex(0);
    }
  }, [profileBottomSheetRef]);

  return (
    <ProfileBottomSheetContext.Provider
      value={{
        profileBottomSheetRef,
        setProfileBottomSheetRef,
        openProfileBottomSheet,
      }}
    >
      {children}
    </ProfileBottomSheetContext.Provider>
  );
};

export const useProfileBottomSheet = () => {
  const context = useContext(ProfileBottomSheetContext);
  if (context === undefined) {
    throw new Error('useProfileBottomSheet must be used within a ProfileBottomSheetProvider');
  }
  return context;
};
