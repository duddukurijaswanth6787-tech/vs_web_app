'use client';

import React, { useEffect, useRef } from 'react';
import Script from 'next/script';

const GOOGLE_CLIENT_ID = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;

export function GoogleSignInButton({ onCredential }: { onCredential: (credential: string) => void }) {
  const containerRef = useRef<HTMLDivElement>(null);

  const renderButton = () => {
    if (!GOOGLE_CLIENT_ID || !window.google || !containerRef.current) return;
    window.google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: (response) => onCredential(response.credential),
    });
    containerRef.current.innerHTML = '';
    window.google.accounts.id.renderButton(containerRef.current, {
      type: 'standard',
      theme: 'outline',
      size: 'large',
      shape: 'pill',
      width: 320,
      text: 'continue_with',
    });
  };

  useEffect(() => {
    // Covers the case where the GIS script was already loaded (e.g. this
    // button re-mounts on client-side navigation back to /login) -- a fresh
    // page load is handled by the Script tag's onLoad instead.
    renderButton();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onCredential]);

  if (!GOOGLE_CLIENT_ID) return null;

  return (
    <>
      <Script src="https://accounts.google.com/gsi/client" strategy="afterInteractive" onLoad={renderButton} />
      <div ref={containerRef} className="flex justify-center" />
    </>
  );
}
