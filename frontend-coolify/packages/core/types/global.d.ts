export {};

declare module "*.lottie" {
  const src: string;
  export default src;
}

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: {
            client_id?: string;
            callback: (response: { credential?: string }) => void;
            [key: string]: any;
          }) => void;
          prompt: (notification?: (notification: any) => void) => void;
          cancel: () => void;
          renderButton: (parent: HTMLElement, options: any) => void;
        };
      };
    };
    AppleID?: {
      auth: {
        init: (config: {
          clientId?: string;
          scope?: string;
          redirectURI?: string;
          state?: string;
          nonce?: string;
          usePopup?: boolean;
        }) => void;
        signIn: () => Promise<{
          authorization?: {
            id_token?: string;
            code?: string;
            state?: string;
          };
          user?: {
            name?: {
              firstName?: string;
              lastName?: string;
            };
            email?: string;
          };
        }>;
      };
    };
  }
}
