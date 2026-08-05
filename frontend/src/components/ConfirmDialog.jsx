import Modal from "./Modal";
import Button from "./Button";
import { AlertTriangle } from "lucide-react";

export default function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title = "Are you sure?",
  description,
  confirmLabel = "Delete",
  loading = false,
}) {
  return (
    <Modal open={open} onClose={onClose} title="" width="max-w-sm">
      <div className="flex flex-col items-center text-center -mt-2">
        <div className="w-11 h-11 rounded-full bg-status-dangerbg flex items-center justify-center mb-3">
          <AlertTriangle size={20} className="text-status-dangertext" />
        </div>
        <h3 className="font-heading font-semibold text-[15px] text-text-primary mb-1">{title}</h3>
        {description && (
          <p className="text-[13.5px] text-text-muted leading-relaxed mb-5">{description}</p>
        )}
        <div className="flex gap-2 w-full mt-1">
          <Button variant="secondary" size="md" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            variant="danger"
            size="md"
            className="flex-1 !bg-status-dangertext !text-white !border-0 hover:!bg-status-dangertext/90"
            onClick={onConfirm}
            loading={loading}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </Modal>
  );
}
