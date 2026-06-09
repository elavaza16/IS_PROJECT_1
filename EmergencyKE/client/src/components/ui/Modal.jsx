import { useEffect } from "react";
import { MdClose } from "react-icons/md";
import Button from "./Button";

export default function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  maxWidth = 480,
}) {
  // Close on Escape key
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") onClose(); };
    if (open) document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" style={{ maxWidth }}
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="modal-header">
          <h3 className="modal-title">{title}</h3>
          <button className="modal-close" onClick={onClose}
            aria-label="Close modal">
            <MdClose size={20} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-body">{children}</div>

        {/* Footer */}
        {footer && <div className="modal-footer">{footer}</div>}

      </div>
    </div>
  );
}