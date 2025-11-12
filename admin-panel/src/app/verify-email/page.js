"use client";

import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  CheckCircleIcon, 
  XCircleIcon, 
  ArrowPathIcon,
  EnvelopeIcon
} from '@heroicons/react/24/outline';

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get('token');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (token) {
      verifyEmail();
    } else {
      setError('Invalid verification link. Please check your email for the correct link.');
    }
  }, [token]);

  const verifyEmail = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Email verification failed');
        return;
      }

      setSuccess(true);
      setMessage('Your email has been successfully verified! You can now log in to your account.');
      
      // Redirect to signin page after 3 seconds
      setTimeout(() => {
        router.push('/signin');
      }, 3000);

    } catch (err) {
      console.error('Error verifying email:', err);
      setError('Failed to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.2 }}
            className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6"
          >
            <CheckCircleIcon className="w-8 h-8 text-green-600" />
          </motion.div>
          
          <h1 className="text-2xl font-bold text-gray-900 mb-4">
            Email Verified!
          </h1>
          
          <p className="text-gray-600 mb-6">
            {message}
          </p>
          
          <div className="flex items-center justify-center">
            <ArrowPathIcon className="w-5 h-5 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600">Redirecting to sign in...</span>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-white rounded-xl shadow-2xl p-8 max-w-md w-full text-center"
      >
        <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-6">
          <EnvelopeIcon className="w-8 h-8 text-blue-600" />
        </div>
        
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Verifying Email
        </h1>
        
        {loading && (
          <div className="flex items-center justify-center mb-6">
            <ArrowPathIcon className="w-6 h-6 animate-spin text-blue-600 mr-2" />
            <span className="text-blue-600">Verifying your email...</span>
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6"
          >
            <div className="flex items-center">
              <XCircleIcon className="w-5 h-5 text-red-600 mr-2" />
              <p className="text-red-800 text-sm">{error}</p>
            </div>
          </motion.div>
        )}

        {!loading && !error && (
          <p className="text-gray-600 mb-6">
            Please wait while we verify your email address...
          </p>
        )}

        <div className="mt-6">
          <button
            onClick={() => router.push('/signin')}
            className="text-blue-600 hover:text-blue-700 text-sm font-medium"
          >
            Back to Sign In
          </button>
        </div>
      </motion.div>
    </div>
  );
}
