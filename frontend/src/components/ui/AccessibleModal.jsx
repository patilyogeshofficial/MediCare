import { useEffect, useRef, useId } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

// Module-level stack for managing active modal dialogs, background isolation, focus trapping, and nested modals
const activeModalStack = [];
let originalBodyOverflow = "";

/**
 * Synchronizes background isolation across the document:
 * - When any modal is open, #root receives `inert` and `aria-hidden="true"`, preventing keyboard
 *   and screen-reader interaction with the underlying page.
 * - When child modals open on top of parent modals, previous modals in the stack are isolated.
 * - The topmost active modal remains fully interactive and is never marked inert.
 * - When all modals close, #root is restored to fully accessible status and body scroll is restored.
 */
function syncModalStackIsolation() {
  if (typeof document === "undefined") return;
  const root = document.getElementById("root");

  if (activeModalStack.length > 0) {
    // 1. Isolate the main application background (#root)
    if (root && !root.hasAttribute("inert")) {
      root.setAttribute("inert", "");
      root.setAttribute("aria-hidden", "true");
    }

    // 2. Lock body scrolling on the first opened modal
    if (activeModalStack.length === 1 && !originalBodyOverflow) {
      originalBodyOverflow = document.body.style.overflow || "";
      document.body.style.overflow = "hidden";
    }

    // 3. Coordinate stack layers: isolate non-topmost modals, un-isolate topmost modal
    activeModalStack.forEach((entry, idx) => {
      const isTopmost = idx === activeModalStack.length - 1;
      const backdropEl = entry.backdropRef?.current;
      if (backdropEl) {
        if (isTopmost) {
          backdropEl.removeAttribute("inert");
          backdropEl.removeAttribute("aria-hidden");
        } else {
          backdropEl.setAttribute("inert", "");
          backdropEl.setAttribute("aria-hidden", "true");
        }
      }
    });
  } else {
    // All modals closed: restore root accessibility and body scrolling
    if (root) {
      root.removeAttribute("inert");
      root.removeAttribute("aria-hidden");
    }
    if (originalBodyOverflow !== undefined) {
      document.body.style.overflow = originalBodyOverflow;
      originalBodyOverflow = "";
    }
  }
}

/**
 * WCAG 2.2 Level AA Accessible Modal Dialog
 * Features:
 * - Full background isolation with `inert` and `aria-hidden="true"` applied to #root
 * - Proper ARIA semantics (role="dialog", aria-modal="true", aria-labelledby, aria-describedby)
 * - Strict focus trapping (Tab and Shift+Tab cycling within modal)
 * - Safe nested modal support (only topmost modal captures Escape and Tab)
 * - Layered stack isolation (underlying parent modal is made inert while child is active)
 * - Automatic focus restoration to the triggering element on close
 * - Safe scroll locking (body scroll unlocked only when all modals close)
 * - Portal rendering to document.body
 * - Focus initialization to initialFocusRef or first focusable element
 */
export default function AccessibleModal({
  isOpen,
  onClose,
  title,
  titleId: customTitleId,
  description,
  descriptionId: customDescriptionId,
  children,
  maxWidth = "max-w-xl",
  showCloseButton = true,
  initialFocusRef = null,
  closeOnBackdropClick = true,
  className = "",
}) {
  const modalRef = useRef(null);
  const backdropRef = useRef(null);
  const previousActiveElement = useRef(null);
  const generatedId = useId();
  const titleId = customTitleId || `modal-title-${generatedId}`;
  const descriptionId = customDescriptionId || `modal-desc-${generatedId}`;

  // Keep latest callbacks/refs in mutable refs to avoid re-triggering modal lifecycle on parent state changes
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const initialFocusRefRef = useRef(initialFocusRef);
  initialFocusRefRef.current = initialFocusRef;

  useEffect(() => {
    if (!isOpen) return;

    // 1. Remember the element that had focus prior to opening this modal
    previousActiveElement.current = document.activeElement;

    // 2. Register this modal on the active modal stack
    const modalEntry = {
      id: generatedId,
      modalRef,
      backdropRef,
      triggerElement: previousActiveElement.current,
      onClose: () => onCloseRef.current?.(),
    };
    activeModalStack.push(modalEntry);

    // 3. Synchronize background isolation and body scroll locking
    syncModalStackIsolation();

    // 4. Focus initial element: custom ref, first input/textarea, or first focusable element
    const focusTimer = setTimeout(() => {
      // 4a. Prioritize explicit custom focus ref if provided
      const customFocusEl = initialFocusRefRef.current?.current;
      if (customFocusEl && typeof customFocusEl.focus === "function") {
        customFocusEl.focus();
        return;
      }

      // 4b. Prioritize first form input/textarea/select so the user can immediately type without focus jumping to buttons
      const firstFormInput = modalRef.current?.querySelector(
        'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"]), ' +
        'textarea:not([disabled]):not([aria-hidden="true"]), ' +
        'select:not([disabled]):not([aria-hidden="true"])'
      );
      if (firstFormInput && typeof firstFormInput.focus === "function") {
        firstFormInput.focus();
        return;
      }

      // 4c. Fallback to any focusable element (e.g. action buttons in confirmation dialogs)
      const focusable = modalRef.current?.querySelectorAll(
        'button:not([disabled]):not([aria-hidden="true"]), ' +
        '[href]:not([aria-hidden="true"]), ' +
        'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"]), ' +
        'select:not([disabled]):not([aria-hidden="true"]), ' +
        'textarea:not([disabled]):not([aria-hidden="true"]), ' +
        '[tabindex]:not([tabindex="-1"]):not([disabled]):not([aria-hidden="true"])'
      );

      if (focusable && focusable.length > 0) {
        focusable[0].focus();
      } else if (modalRef.current) {
        modalRef.current.focus();
      }
    }, 40);

    // 5. Keydown listener for strict Tab focus trap & Escape handling
    const handleKeyDown = (e) => {
      // Check if this modal is the topmost modal in the stack
      const isTopModal =
        activeModalStack.length > 0 &&
        activeModalStack[activeModalStack.length - 1].id === generatedId;

      if (!isTopModal) return;

      if (e.key === "Escape") {
        e.preventDefault();
        e.stopPropagation();
        onCloseRef.current?.();
        return;
      }

      if (e.key === "Tab") {
        const focusable = modalRef.current?.querySelectorAll(
          'button:not([disabled]):not([aria-hidden="true"]), ' +
          '[href]:not([aria-hidden="true"]), ' +
          'input:not([disabled]):not([type="hidden"]):not([aria-hidden="true"]), ' +
          'select:not([disabled]):not([aria-hidden="true"]), ' +
          'textarea:not([disabled]):not([aria-hidden="true"]), ' +
          '[tabindex]:not([tabindex="-1"]):not([disabled]):not([aria-hidden="true"])'
        );

        if (!focusable || focusable.length === 0) {
          e.preventDefault();
          modalRef.current?.focus();
          return;
        }

        const firstElement = focusable[0];
        const lastElement = focusable[focusable.length - 1];

        if (e.shiftKey) {
          // Shift + Tab: if on first element, wrap to last
          if (
            document.activeElement === firstElement ||
            !modalRef.current?.contains(document.activeElement)
          ) {
            e.preventDefault();
            lastElement.focus();
          }
        } else {
          // Tab: if on last element, wrap to first
          if (
            document.activeElement === lastElement ||
            !modalRef.current?.contains(document.activeElement)
          ) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown, true);

    return () => {
      clearTimeout(focusTimer);
      window.removeEventListener("keydown", handleKeyDown, true);

      // Find this modal's position in the stack
      const index = activeModalStack.findIndex((m) => m.id === generatedId);
      const parentEntry = index > 0 ? activeModalStack[index - 1] : null;

      if (index !== -1) {
        activeModalStack.splice(index, 1);
      }

      // Re-synchronize isolation (removes inert from parent modal or from #root)
      syncModalStackIsolation();

      // Restore focus to previously focused element (or fallback to parent modal)
      const targetElement = previousActiveElement.current;
      const fallbackParent = parentEntry?.modalRef?.current;

      setTimeout(() => {
        try {
          if (
            targetElement &&
            typeof targetElement.focus === "function" &&
            document.contains(targetElement)
          ) {
            targetElement.focus();
          } else if (
            fallbackParent &&
            typeof fallbackParent.focus === "function"
          ) {
            fallbackParent.focus();
          }
        } catch {
          // Ignore focus errors
        }
      }, 40);
    };
  }, [isOpen, generatedId]);

  if (!isOpen) return null;

  const stackIndex = activeModalStack.findIndex((m) => m.id === generatedId);
  const zIndexVal = 50 + (stackIndex >= 0 ? stackIndex * 10 : 0);

  const modalNode = (
    <div
      ref={backdropRef}
      style={{ zIndex: zIndexVal }}
      className={`fixed inset-0 flex items-center justify-center p-4 sm:p-6 overflow-y-auto bg-slate-900/60 backdrop-blur-xs transition-opacity ${
        stackIndex >= 0 && stackIndex < activeModalStack.length - 1
          ? "pointer-events-none"
          : ""
      }`}
      onClick={(e) => {
        const isTop =
          activeModalStack.length > 0 &&
          activeModalStack[activeModalStack.length - 1].id === generatedId;
        if (closeOnBackdropClick && e.target === e.currentTarget && isTop) {
          onClose();
        }
      }}
      role="presentation"
    >
      <div
        ref={modalRef}
        role="dialog"
        tabIndex={-1}
        aria-modal="true"
        aria-labelledby={title ? titleId : undefined}
        aria-describedby={description ? descriptionId : undefined}
        className={`relative w-full ${maxWidth} rounded-3xl bg-white shadow-2xl border border-slate-100 overflow-hidden outline-none transform transition-all my-8 ${className}`}
      >
        {/* Header */}
        {(title || showCloseButton) && (
          <div className="flex items-center justify-between border-b border-slate-100 px-6 py-5">
            <div>
              {title && (
                <h3 id={titleId} className="text-lg font-bold text-slate-900">
                  {title}
                </h3>
              )}
              {description && (
                <p id={descriptionId} className="mt-0.5 text-xs text-slate-500 font-medium">
                  {description}
                </p>
              )}
            </div>

            {showCloseButton && (
              <button
                type="button"
                onClick={onClose}
                className="rounded-full p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition focus-visible:ring-2 focus-visible:ring-cyan-600 focus-visible:outline-none"
                aria-label="Close dialog"
              >
                <X size={18} aria-hidden="true" />
              </button>
            )}
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  return typeof document !== "undefined"
    ? createPortal(modalNode, document.body)
    : modalNode;
}
