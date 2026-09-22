'use client';

import { useRef, useState } from 'react';

export interface PincodeResult {
  city: string;
  state: string;
  district?: string;
  areas?: string[];
}

interface PostOffice {
  Name?: string;
  District: string;
  State: string;
  Division?: string;
}

interface PincodeApiResponse {
  Status: string;
  PostOffice: PostOffice[] | null;
}

/**
 * Looks up City/State and localities from a 6-digit Indian PIN code via India Post's public
 * API, so a customer gets auto-detected City, State and area suggestions.
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
      if (thisRequest !== requestId.current) return null;

      const postOffices = data?.[0]?.PostOffice;
      if (data?.[0]?.Status === 'Success' && postOffices && postOffices.length > 0) {
        const areas = Array.from(new Set(postOffices.map((po) => po.Name).filter(Boolean))) as string[];
        const primary = postOffices[0];
        return {
          city: primary.District || primary.Division || primary.Name || '',
          state: primary.State || '',
          district: primary.District,
          areas,
        };
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
