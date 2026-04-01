import { useEffect, useRef, useState } from "react";

type GoogleButtonText = "signin_with" | "signup_with" | "continue_with" | "signin";

interface GoogleSignInButtonProps {
  onCredential: (credential: string) => void | Promise<void>;
  text?: GoogleButtonText;
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined;

let googleScriptPromise: Promise<void> | null = null;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) {
    return Promise.resolve();
  }

  if (!googleScriptPromise) {
    googleScriptPromise = new Promise((resolve, reject) => {
      const existingScript = document.querySelector<HTMLScriptElement>('script[data-google-identity="true"]');
      if (existingScript) {
        existingScript.addEventListener("load", () => resolve(), { once: true });
        existingScript.addEventListener("error", () => reject(new Error("Unable to load Google sign-in.")), { once: true });
        return;
      }

      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.dataset.googleIdentity = "true";
      script.onload = () => resolve();
      script.onerror = () => reject(new Error("Unable to load Google sign-in."));
      document.head.appendChild(script);
    });
  }

  return googleScriptPromise;
};

export function GoogleSignInButton({ onCredential, text = "continue_with" }: GoogleSignInButtonProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const callbackRef = useRef(onCredential);
  const [width, setWidth] = useState(0);
  const [isReady, setIsReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    callbackRef.current = onCredential;
  }, [onCredential]);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const updateWidth = () => setWidth(Math.round(node.getBoundingClientRect().width));
    updateWidth();

    if (typeof ResizeObserver === "undefined") {
      return;
    }

    const observer = new ResizeObserver(updateWidth);
    observer.observe(node);

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let cancelled = false;

    if (!GOOGLE_CLIENT_ID) {
      setError("Google sign-in is not configured yet.");
      return;
    }

    loadGoogleScript()
      .then(() => {
        if (cancelled) return;
        if (!window.google?.accounts?.id) {
          throw new Error("Google sign-in library did not initialize.");
        }

        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: (response) => {
            if (!response.credential) return;
            try {
              void Promise.resolve(callbackRef.current(response.credential)).catch((callbackError) => {
                console.error("Google sign-in callback failed:", callbackError);
              });
            } catch (callbackError) {
              console.error("Google sign-in callback failed:", callbackError);
            }
          },
          auto_select: false,
          cancel_on_tap_outside: true,
        });

        setIsReady(true);
      })
      .catch((loadError) => {
        if (!cancelled) {
          console.error(loadError);
          setError("Google sign-in is unavailable right now.");
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!isReady || !containerRef.current || !window.google?.accounts?.id || width <= 0) return;

    const node = containerRef.current;
    node.innerHTML = "";

    window.google.accounts.id.renderButton(node, {
      theme: "outline",
      size: "large",
      text,
      shape: "rectangular",
      width: Math.max(240, Math.min(width, 400)),
      logo_alignment: "left",
    });
  }, [isReady, text, width]);

  if (error) {
    return <p className="text-xs text-muted-foreground font-body">{error}</p>;
  }

  return <div ref={containerRef} className="w-full min-h-12" />;
}
