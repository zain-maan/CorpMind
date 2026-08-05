import { useEffect } from "react";
import { X } from "lucide-react";

export default function Modal({ open, onClose, title, subtitle, children, width = "max-w-md" }) {
  useEffect(() => {
    if (!open) return;
    function onKey(e) {
      if (e.key === "Escape") onClose?.();
    }
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-inkdeep/60 backdrop-blur-[2px] animate-fade-in"
        onClick={onClose}
      />
      <div
        className={`relative w-full ${width} bg-card border border-border rounded-cardlg shadow-float animate-scale-in max-h-[90vh] flex flex-col`}
      >
        <div className="flex items-start justify-between px-6 pt-5 pb-4 border-b border-border shrink-0">
          <div>
            <h3 className="font-heading font-semibold text-[16px] text-text-primary">{title}</h3>
            {subtitle && <p className="text-[13px] text-text-muted mt-0.5">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="text-text-faint hover:text-status-dangertext hover:bg-status-dangerbg rounded-md p-1 transition-colors -mt-1 -mr-1"
          >
            <X size={17} />
          </button>
        </div>
        <div className="px-6 py-5 overflow-y-auto scroll-thin">{children}</div>
      </div>
    </div>
  );
}
