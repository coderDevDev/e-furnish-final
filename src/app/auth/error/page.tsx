'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';

export default function AuthErrorPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [errorMessage, setErrorMessage] = useState<string>(
    searchParams.get('message') || 'Authentication failed'
  );

  useEffect(() => {
    // Check if there are error parameters in the URL hash
    if (typeof window !== 'undefined' && window.location.hash) {
      const hashParams = new URLSearchParams(window.location.hash.substring(1));

      // Extract error information from hash
      const error = hashParams.get('error');
      const errorCode = hashParams.get('error_code');
      const errorDescription = hashParams.get('error_description');

      // Log the hash parameters for debugging
      console.log('Hash params:', { error, errorCode, errorDescription });

      // Set appropriate error message based on hash parameters
      if (errorCode === 'otp_expired') {
        setErrorMessage(
          'The verification link has expired. Please request a new one.'
        );
      } else if (error === 'access_denied') {
        setErrorMessage('Access denied. ' + (errorDescription || ''));
      } else if (errorDescription) {
        setErrorMessage(errorDescription);
      }
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-gray-50">
      <div className="w-full max-w-md space-y-8 bg-white p-8 rounded-lg shadow-md">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">
            Authentication Error
          </h1>
          <p className="text-gray-700 mb-6">{errorMessage}</p>
          <Link
            href="/login"
            className="inline-block bg-primary hover:bg-primary/90 text-white font-medium py-2 px-6 rounded-lg transition-colors">
            Return to Login
          </Link>
        </div>
      </div>
    </div>
  );
}
