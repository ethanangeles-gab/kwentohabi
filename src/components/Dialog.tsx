import React, { useEffect, useId, useRef } from "react";
export function Dialog({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLDialogElement>(null),
    id = useId();
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const dialog = ref.current!;
    dialog.showModal();
    return () => {
      dialog.close();
      previous?.focus();
    };
  }, []);
  return (
    <dialog
      ref={ref}
      aria-labelledby={id}
      onKeyDown={(event) => {
        if ((event.target as Element).closest("dialog") !== event.currentTarget)
          return;
        if (event.key !== "Tab") return;
        const controls = [
          ...ref.current!.querySelectorAll<HTMLElement>(
            'button:not([disabled]),input:not([disabled]),select:not([disabled]),textarea:not([disabled]),a[href],[tabindex]:not([tabindex="-1"])',
          ),
        ].filter((element) => element.getClientRects().length > 0);
        const first = controls[0],
          last = controls[controls.length - 1];
        if (!first) {
          event.preventDefault();
          ref.current!.focus();
          return;
        }
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      }}
      onCancel={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onClose();
      }}
      className="dialog-panel"
    >
      <div className="flex items-start justify-between gap-3 mb-5">
        <h2 id={id} className="text-xl font-bold font-serif">
          {title}
        </h2>
        <button
          type="button"
          aria-label="Close / Isara"
          onClick={onClose}
          className="btn-light"
        >
          ×
        </button>
      </div>
      {children}
    </dialog>
  );
}
