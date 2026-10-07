import React, { useMemo, useRef } from 'react';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

// Gesture callbacks read refs when touch events arrive, after render.
// oxlint-disable react/refs

interface PullToRefreshGestureProps {
  children: React.ReactElement;
  scrollOffset: React.RefObject<number>;
  onPullMove?: (distance: number) => void;
  onPullEnd?: (completed: boolean) => void;
}

export function PullToRefreshGesture({
  children,
  scrollOffset,
  onPullMove,
  onPullEnd,
}: PullToRefreshGestureProps) {
  const startedAtTop = useRef(false);
  const gesture = useMemo(() => {
    const native = Gesture.Native();
    const pan = Gesture.Pan()
      .maxPointers(1)
      .activeOffsetY(12)
      .failOffsetX([-18, 18])
      .cancelsTouchesInView(false)
      .simultaneousWithExternalGesture(native)
      .runOnJS(true)
      .onBegin(() => { startedAtTop.current = scrollOffset.current <= 1; })
      .onUpdate(event => {
        if (startedAtTop.current && event.translationY > 0) {
          onPullMove?.(event.translationY);
        }
      })
      .onFinalize((_event, completed) => {
        if (startedAtTop.current) onPullEnd?.(completed);
        startedAtTop.current = false;
      });
    return Gesture.Simultaneous(pan, native);
  }, [scrollOffset, onPullMove, onPullEnd]);

  return <GestureDetector gesture={gesture}>{children}</GestureDetector>;
}
// oxlint-enable react/refs
