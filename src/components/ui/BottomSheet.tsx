import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet';
import React, { forwardRef, useCallback, useMemo } from 'react';

interface BottomSheetProps {
  children: React.ReactNode;
  snapPoints?: (string | number)[];
  index?: number;
  enablePanDownToClose?: boolean;
  enableHandlePanningGesture?: boolean;
  enableContentPanningGesture?: boolean;
  onChange?: (index: number) => void;
  onClose?: () => void;
}

type BottomSheetRef = BottomSheet;

const PinubiBottomSheet = forwardRef<BottomSheetRef, BottomSheetProps>(
  (
    {
      children,
      snapPoints = ['20%', '50%', '90%'],
      index = 0,
      enablePanDownToClose = false,
      enableHandlePanningGesture = true,
      enableContentPanningGesture = true,
      onChange,
      onClose,
    },
    ref
  ) => {
    const memoizedSnapPoints = useMemo(() => snapPoints, [snapPoints]);

    const handleSheetChanges = useCallback(
      (sheetIndex: number) => {
        console.log('BottomSheet index changed to:', sheetIndex);
        if (sheetIndex === -1 && onClose) {
          onClose();
        }
        if (onChange) {
          onChange(sheetIndex);
        }
      },
      [onChange, onClose]
    );

    console.log('Rendering BottomSheet with index:', index);

    return (
      <BottomSheet
        ref={ref}
        index={index}
        snapPoints={memoizedSnapPoints}
        enablePanDownToClose={enablePanDownToClose}
        enableHandlePanningGesture={enableHandlePanningGesture}
        enableContentPanningGesture={enableContentPanningGesture}
        onChange={handleSheetChanges}
        enableOverDrag={false}
        keyboardBehavior="interactive"
        keyboardBlurBehavior="restore"
        style={{
          shadowColor: '#000000',
          shadowOffset: {
            width: 0,
            height: -4,
          },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 10,
        }}
        handleStyle={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          paddingTop: 12,
        }}
        handleIndicatorStyle={{
          backgroundColor: '#E5E7EB',
          width: 40,
          height: 4,
          borderRadius: 2,
        }}
        backgroundStyle={{
          backgroundColor: '#FFFFFF',
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
        }}
      >
        <BottomSheetView style={{ flex: 1, backgroundColor: 'white' }}>          
          {children}
        </BottomSheetView>
      </BottomSheet>
    );
  }
);

PinubiBottomSheet.displayName = 'PinubiBottomSheet';

export default PinubiBottomSheet;
export type { BottomSheetProps, BottomSheetRef };

