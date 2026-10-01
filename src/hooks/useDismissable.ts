import { useEffect, useRef, useCallback } from 'react';

interface UseDismissableOptions {
  onDismiss: () => void;
  isOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  lockScroll?: boolean;
}

/**
 * Hook to handle Escape key press, clicking outside/backdrop, and optional body scroll locking.
 */
export function useDismissable<T extends HTMLElement = HTMLDivElement>({
  onDismiss,
  isOpen = true,
  closeOnEscape = true,
  closeOnOutsideClick = true,
  lockScroll = true,
}: UseDismissableOptions) {
  const contentRef = useRef<T | null>(null);
  const onDismissRef = useRef(onDismiss);

  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Lock body scroll when modal is open
  useEffect(() => {
    if (!isOpen || !lockScroll) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, lockScroll]);

  // Handle Escape key and outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && e.key === 'Escape') {
        e.stopPropagation();
        onDismissRef.current();
      }
    };

    const handleMouseDown = (e: MouseEvent) => {
      if (
        closeOnOutsideClick &&
        contentRef.current &&
        !contentRef.current.contains(e.target as Node)
      ) {
        onDismissRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [isOpen, closeOnEscape, closeOnOutsideClick]);

  // Handler for explicit backdrop click (e.g. onClick={handleBackdropClick} on outer container)
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onDismissRef.current();
    }
  }, []);

  return { contentRef, handleBackdropClick };
}
