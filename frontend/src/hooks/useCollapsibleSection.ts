import { useCallback, useRef } from 'react';
import { Animated, NativeScrollEvent, NativeSyntheticEvent } from 'react-native';

/**
 * Collapses a section above a scrollable list based on scroll direction:
 * scrolling up the list hides it, scrolling back down (or reaching the top)
 * reveals it again. Animations are interruptible, and the section never
 * hides if collapsing would leave the list too short to scroll — otherwise
 * no scroll event could ever bring it back.
 */
export function useCollapsibleSection(expandedHeight: number) {
  const anim = useRef(new Animated.Value(1)).current;
  const visible = useRef(true);
  const lastY = useRef(0);

  const setVisible = useCallback(
    (show: boolean) => {
      if (visible.current === show) return;
      visible.current = show;
      Animated.timing(anim, {
        toValue: show ? 1 : 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    },
    [anim]
  );

  const onScroll = useCallback(
    (e: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { contentOffset, contentSize, layoutMeasurement } = e.nativeEvent;
      const y = contentOffset.y;
      const dy = y - lastY.current;
      lastY.current = y;

      if (y < 20 || dy < -8) {
        // Near the top, or scrolling down — reveal
        setVisible(true);
        return;
      }
      // Scroll room left after the list grows by the collapsed section's height
      const roomAfterCollapse =
        contentSize.height - (layoutMeasurement.height + expandedHeight);
      if (dy > 8 && y > 50 && roomAfterCollapse > 80) {
        setVisible(false);
      }
    },
    [expandedHeight, setVisible]
  );

  const maxHeight = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, expandedHeight],
  });

  return { anim, maxHeight, onScroll };
}
