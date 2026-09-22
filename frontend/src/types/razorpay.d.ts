export {};

declare global {
  interface RazorpayCheckoutResponse {
    razorpay_payment_id: string;
    razorpay_order_id: string;
    razorpay_signature: string;
  }

  interface RazorpayCheckoutOptions {
    key: string;
    amount: number;
    currency: string;
    order_id: string;
    name?: string;
    description?: string;
    prefill?: {
      name?: string;
      email?: string;
      contact?: string;
      method?: string;
      [key: string]: any;
    };
    handler: (response: RazorpayCheckoutResponse) => void;
    modal?: { ondismiss?: () => void };
    theme?: { color?: string };
    [key: string]: any;
  }

  interface RazorpayCheckoutInstance {
    open: () => void;
  }

  interface Window {
    Razorpay?: new (options: RazorpayCheckoutOptions) => RazorpayCheckoutInstance;
  }
}
