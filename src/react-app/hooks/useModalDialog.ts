import { useCallback, useEffect, useRef } from "react";

// Fixed-body locking also preserves the underlying page position on mobile Safari.
export default function useModalDialog() {
    const dialogRef = useRef<HTMLDialogElement>(null);
    const restoreRef = useRef<(() => void) | null>(null);

    const restore = useCallback(() => {
        // A queued close event may arrive after Strict Mode or a fast reopen.
        if (dialogRef.current?.open) return;
        const restorePage = restoreRef.current;
        restoreRef.current = null;
        restorePage?.();
    }, []);

    const open = useCallback(() => {
        const dialog = dialogRef.current;
        if (!dialog || dialog.open) return;
        const focus = document.activeElement;
        const { scrollX, scrollY } = window;
        const body = document.body;
        const properties = ["position", "top", "left", "width", "overflow"] as const;
        const previous = properties.map(property => body.style[property]);
        const rootOverflow = document.documentElement.style.overflow;
        dialog.showModal();
        body.style.position = "fixed";
        body.style.top = `-${scrollY}px`;
        body.style.left = `-${scrollX}px`;
        body.style.width = "100%";
        body.style.overflow = "hidden";
        document.documentElement.style.overflow = "hidden";
        restoreRef.current = () => {
            properties.forEach((property, index) => { body.style[property] = previous[index]; });
            document.documentElement.style.overflow = rootOverflow;
            window.scrollTo({ left: scrollX, top: scrollY, behavior: "instant" });
            if (focus instanceof HTMLElement && focus.isConnected) focus.focus({ preventScroll: true });
        };
    }, []);

    const close = useCallback(() => {
        dialogRef.current?.close();
        restore();
    }, [restore]);

    useEffect(() => {
        // React detaches refs before effect cleanup, including its development replay.
        const dialog = dialogRef.current;
        return () => {
            dialog?.close();
            restore();
        };
    }, [restore]);

    return { dialogRef, open, close, restore };
}
