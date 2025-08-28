import React, {forwardRef, useImperativeHandle} from 'react';
import {View, Text, StyleSheet} from 'react-native';

export type BottomSheetState = 'collapsed' | 'half' | 'full';

export type GoThreeStageBottomSheetRef = {
  handleMapTap: () => void;
  animateToState: (state: BottomSheetState) => void;
  snapTo: (state: BottomSheetState) => void;
  expand: () => void;
  collapse: () => void;
};

type Props = {
  children?: React.ReactNode;
  initialState?: BottomSheetState;
  onStateChange?: (state: BottomSheetState) => void;
  onMapInteractionShouldLock?: (lock: boolean) => void;
};

const GoThreeStageBottomSheetMinimal = forwardRef<GoThreeStageBottomSheetRef, Props>(
  ({children, initialState = 'half', onStateChange, onMapInteractionShouldLock}, ref) => {
    
    const handleMapTap = () => {
      console.log('Map tapped');
    };
    
    const animateToState = (state: BottomSheetState) => {
      console.log('Animate to:', state);
      onStateChange?.(state);
    };

    useImperativeHandle(ref, () => ({
      handleMapTap,
      animateToState,
      snapTo: animateToState,
      expand: () => animateToState('full'),
      collapse: () => animateToState('collapsed'),
    }));

    return (
      <View style={styles.container}>
        <Text style={styles.debug}>GoThreeStageBottomSheet - Minimal Test</Text>
        <Text style={styles.debug}>State: {initialState}</Text>
        {children}
      </View>
    );
  }
);

GoThreeStageBottomSheetMinimal.displayName = 'GoThreeStageBottomSheetMinimal';

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {width: 0, height: 6},
    shadowOpacity: 0.37,
    shadowRadius: 7.49,
    elevation: 12,
  },
  debug: {
    fontSize: 14,
    color: '#333',
    marginBottom: 8,
  },
});

export default GoThreeStageBottomSheetMinimal;