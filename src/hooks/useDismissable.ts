import { useEffect, useRef, useCallback } from 'react';

interface UseDismissableOptions {
  onDismiss: () => void;
  isOpen?: boolean;
  closeOnEscape?: boolean;
  closeOnOutsideClick?: boolean;
  lockScroll?: boolean;
}

/**
 * Hook ultrarrobusto para cierre accesible mediante tecla Escape y clic por fuera / backdrop.
 * Utiliza capture phase para garantizar que ningún elemento interno trague el evento.
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

  // Mantener siempre la referencia más fresca a la función de cierre
  useEffect(() => {
    onDismissRef.current = onDismiss;
  }, [onDismiss]);

  // Bloqueo de scroll de fondo mientras esté activo
  useEffect(() => {
    if (!isOpen || !lockScroll) return;

    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen, lockScroll]);

  // Manejo de Escape (fase de captura) y clic por fuera
  useEffect(() => {
    if (!isOpen) return;

    // Escuchar Escape en fase de captura para que ningún input lo trague
    const handleKeyDown = (e: KeyboardEvent) => {
      if (closeOnEscape && (e.key === 'Escape' || e.key === 'Esc' || e.keyCode === 27)) {
        e.preventDefault();
        e.stopPropagation();
        onDismissRef.current();
      }
    };

    // Detectar clic por fuera de la tarjeta modal
    const handlePointerDown = (e: MouseEvent | PointerEvent) => {
      if (!closeOnOutsideClick || !contentRef.current) return;
      const target = e.target as Node;
      if (!contentRef.current.contains(target)) {
        onDismissRef.current();
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    document.addEventListener('pointerdown', handlePointerDown, true);

    return () => {
      window.removeEventListener('keydown', handleKeyDown, true);
      document.removeEventListener('pointerdown', handlePointerDown, true);
    };
  }, [isOpen, closeOnEscape, closeOnOutsideClick]);

  // Manejador directo sobre el contenedor de backdrop (fondo oscuro)
  const handleBackdropClick = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      e.preventDefault();
      e.stopPropagation();
      onDismissRef.current();
    }
  }, []);

  return { contentRef, handleBackdropClick };
}
