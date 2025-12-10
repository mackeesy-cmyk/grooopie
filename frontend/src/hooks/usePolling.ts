import { useEffect, useRef } from 'react';

export function usePolling(callback: () => void, delay: number | null) {
    const savedCallback = useRef(callback);

    // Remember the latest callback.
    useEffect(() => {
        savedCallback.current = callback;
    }, [callback]);

    // Set up the interval.
    useEffect(() => {
        if (delay !== null) {
            const tick = () => {
                savedCallback.current();
            };
            const id = setInterval(tick, delay);
            return () => clearInterval(id);
        }
    }, [delay]);
}
