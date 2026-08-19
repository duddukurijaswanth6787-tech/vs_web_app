'use client';

import { useRef, useState } from 'react';

interface PincodeResult {
  city: string;
  state: string;
}

interface PostOffice {
  District: string;
  State: string;
}

interface PincodeApiResponse {
  Status: string;
  PostOffice: PostOffice[] | null;
}

/**
 * Looks up City/State from a 6-digit Indian PIN code via India Post's public
 * API, so a customer only has to type the PIN once instead of also typing
 * City and State by hand. Never blocks the form -- on any failure (offline,
 * unknown PIN, API down) it just leaves whatever the customer already typed
 * alone, so manual entry is always the fallback.
 */
export function usePincodeLookup() {
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const requestId = useRef(0);

  const lookup = async (pincode: string): Promise<PincodeResult | null> => {
    if (!/^\d{6}$/.test(pincode)) return null;

    const thisRequest = ++requestId.current;
    setIsLoading(true);
    setNotFound(false);
    try {
      const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
      const data: PincodeApiResponse[] = await res.json();
      // A field the customer kept typing in after this request started --
      // its result is stale, ignore it so it can't clobber a newer lookup.
      if (thisRequest !== requestId.current) return null;

      const postOffice = data?.[0]?.PostOffice?.[0];
      if (data?.[0]?.Status === 'Success' && postOffice) {
        return { city: postOffice.District, state: postOffice.State };
      }
      setNotFound(true);
      return null;
    } catch {
      if (thisRequest === requestId.current) setNotFound(true);
      return null;
    } finally {
      if (thisRequest === requestId.current) setIsLoading(false);
    }
  };

  return { lookup, isLoading, notFound };
}
