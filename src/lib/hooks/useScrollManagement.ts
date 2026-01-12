import { useState, useEffect, useRef } from "react";

export const useScrollManagement = (isMounted: boolean, messagesLength: number) => {
  const [isAtBottom, setIsAtBottom] = useState(true);
  const [hasScrollbar, setHasScrollbar] = useState(false);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMounted) return;

    const setupScrollListener = () => {
      const scrollContainer = scrollContainerRef.current;
      if (!scrollContainer) {
        setTimeout(setupScrollListener, 100);
        return;
      }

      const updateScrollState = () => {
        const { scrollTop, scrollHeight, clientHeight } = scrollContainer;
        const isAtBottom = scrollTop + clientHeight >= scrollHeight - 10; // 10px tolerance
        const hasScrollbar = scrollHeight > clientHeight + 50 && messagesLength > 0;
        setIsAtBottom(isAtBottom);
        setHasScrollbar(hasScrollbar);
      };

      scrollContainer.addEventListener('scroll', updateScrollState);
      setTimeout(updateScrollState, 0);

      return () => {
        scrollContainer.removeEventListener('scroll', updateScrollState);
      };
    };

    const cleanup = setupScrollListener();
    return cleanup;
  }, [isMounted, messagesLength]);

  const scrollToBottom = () => {
    setTimeout(() => {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({
          top: scrollContainerRef.current.scrollHeight,
          behavior: 'smooth'
        });
      }
    }, 100);
  };

  return {
    scrollContainerRef,
    messagesEndRef,
    isAtBottom,
    hasScrollbar,
    scrollToBottom,
  };
};
