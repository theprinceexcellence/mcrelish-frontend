const SCRIPT_URL = "https://js.paystack.co/v2/inline.js";

type Transaction = { reference?: string; status?: string };

type PopupCallbacks = {
  onSuccess: (transaction: Transaction) => void;
  onCancel: () => void;
  onError: (error: { message?: string }) => void;
};

declare global {
  interface Window {
    PaystackPop?: new () => {
      resumeTransaction: (accessCode: string, callbacks: PopupCallbacks) => void;
    };
  }
}

let loading: Promise<void> | null = null;

export function loadPaystack(): Promise<void> {
  if (typeof window === "undefined") return Promise.reject(new Error("No window"));
  if (window.PaystackPop) return Promise.resolve();
  loading ??= new Promise<void>((resolve, reject) => {
    const script = document.createElement("script");
    script.src = SCRIPT_URL;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => {
      loading = null;
      script.remove();
      reject(new Error("Payment window could not load"));
    };
    document.head.appendChild(script);
  });
  return loading;
}

export type InlinePayment = {
  accessCode: string;
  onPaid: (reference: string) => void;
  onDismiss: () => void;
};

export async function openPaystack(payment: InlinePayment) {
  await loadPaystack();
  const Popup = window.PaystackPop;
  if (!Popup) throw new Error("Payment window could not load");
  let settled = false;
  const finish = (action: () => void) => {
    if (settled) return;
    settled = true;
    action();
  };
  new Popup().resumeTransaction(payment.accessCode, {
    onSuccess: (transaction) => finish(() => payment.onPaid(transaction.reference ?? "paid")),
    onCancel: () => finish(payment.onDismiss),
    onError: () => finish(payment.onDismiss),
  });
}
