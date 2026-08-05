import { useState, useCallback } from "react";

export function useToast() {
  const [toast, setToast] = useState({ message: "", visible: false });

  const showToast = useCallback((message, duration = 2500) => {
    setToast({ message, visible: true });
    setTimeout(() => setToast((t) => ({ ...t, visible: false })), duration);
  }, []);

  return { toast, showToast };
}