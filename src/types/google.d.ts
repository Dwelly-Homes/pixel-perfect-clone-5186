export {};

declare global {
  interface GoogleCredentialResponse {
    credential?: string;
    select_by?: string;
    clientId?: string;
  }

  interface GoogleButtonRenderOptions {
    theme?: "outline" | "filled_blue" | "filled_black";
    size?: "large" | "medium" | "small";
    text?: "signin_with" | "signup_with" | "continue_with" | "signin";
    shape?: "rectangular" | "pill" | "circle" | "square";
    width?: number;
    logo_alignment?: "left" | "center";
    locale?: string;
  }

  interface GoogleIdentityServices {
    initialize: (config: {
      client_id: string;
      callback: (response: GoogleCredentialResponse) => void;
      auto_select?: boolean;
      cancel_on_tap_outside?: boolean;
    }) => void;
    renderButton: (parent: HTMLElement, options: GoogleButtonRenderOptions) => void;
    prompt: () => void;
    cancel: () => void;
  }

  interface GoogleAccounts {
    id: GoogleIdentityServices;
  }

  interface Window {
    google?: {
      accounts: GoogleAccounts;
    };
  }
}
