import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User } from '../types';
import { UserPlus, Mail, Lock, ArrowRight, Loader2, Eye, EyeOff, AlertCircle, Heart, ShieldCheck } from 'lucide-react';

const SignupPage: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      // Don't create profile yet - let onboarding create it
      // Just authenticate the user and redirect to onboarding
      navigate('/onboarding');
    } catch (err: any) {
      console.error("Signup error:", err.code);
      if (err.code === 'auth/email-already-in-use') {
        setError("An account with this email already exists. Please login.");
      } else if (err.code === 'auth/weak-password') {
        setError("Password should be at least 6 characters long.");
      } else if (err.code === 'auth/invalid-email') {
        setError("Please enter a valid email address.");
      } else {
        setError("Failed to create account. Please try again.");
      }
      setLoading(false);
    }
  };

  const handleGoogleSignup = async () => {
    setLoading(true);
    setError('');
    
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      // Don't create profile yet - let onboarding create it
      // Just authenticate user and redirect to onboarding
      navigate('/onboarding');
    } catch (err: any) {
      console.error("Google Signup Error:", err);
      if (err.code === 'auth/unauthorized-domain') {
        setError("Domain not authorized. Please add this domain in Firebase Console > Authentication > Settings > Authorized Domains.");
      } else if (err.code === 'auth/popup-closed-by-user') {
        setError("Sign up cancelled by user.");
      } else if (err.code === 'auth/popup-blocked') {
        setError("Sign up popup blocked. Please allow popups for this site.");
      } else if (err.code === 'auth/operation-not-allowed') {
        setError("Google Sign-Up is not enabled. Enable it in Firebase Console > Authentication > Sign-in method.");
      } else {
        setError("Failed to sign up with Google. " + (err.message || ""));
      }
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gradient-to-br from-rose-50 via-white to-rose-50 p-4">
      <div className="w-full max-w-md">
        {/* Logo/Brand */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-rose-600 rounded-3xl shadow-xl mb-4">
            <UserPlus className="text-white" size={40} />
          </div>
          <h1 className="text-4xl font-black text-rose-950 mb-2">Join Lifestyle Connect</h1>
          <p className="text-gray-600 font-bold">Start your journey to find love</p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 border border-rose-100">
          {/* Header */}
          <div className="text-center mb-8">
            <h2 className="text-2xl font-black text-rose-950 mb-2">Create Your Account</h2>
            <p className="text-gray-600 text-sm font-bold">Join our community of Christian believers</p>
          </div>

          {/* Trust Badges */}
          <div className="flex justify-center gap-6 mb-6">
            <div className="flex items-center gap-2 text-rose-600">
              <Heart size={16} fill="currentColor" />
              <span className="text-xs font-black">Purposeful</span>
            </div>
            <div className="flex items-center gap-2 text-rose-600">
              <ShieldCheck size={16} />
              <span className="text-xs font-black">Verified</span>
            </div>
          </div>

          {/* Google Sign Up */}
          <button
            onClick={handleGoogleSignup}
            disabled={loading}
            className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-2xl font-black text-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-6 disabled:opacity-50"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
            </svg>
            Sign up with Google
          </button>

          {/* Divider */}
          <div className="relative flex py-3 items-center mb-6">
            <div className="flex-grow border-t border-gray-200"></div>
            <span className="flex-shrink-0 mx-4 text-gray-400 font-black text-xs uppercase tracking-widest">Or</span>
            <div className="flex-grow border-t border-gray-200"></div>
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-3 mb-1 block">
                Email Address
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-12 pr-4 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-100 outline-none font-bold text-gray-900 transition-all" 
                  placeholder="you@email.com"
                />
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-3 mb-1 block">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                <input 
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-100 outline-none font-bold text-gray-900 transition-all" 
                  placeholder="••••••••"
                  minLength={6}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-rose-600 transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              <p className="text-xs text-gray-500 mt-1 ml-3">Minimum 6 characters</p>
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center gap-2 p-3 bg-red-50 rounded-xl text-red-600 text-xs font-black">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            {/* Submit Button */}
            <button 
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-rose-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? <Loader2 className="animate-spin" /> : 'Create Account'}
              <ArrowRight size={18} />
            </button>
          </form>

          {/* Terms Notice */}
          <div className="mt-6 p-4 bg-rose-50 rounded-2xl">
            <p className="text-xs font-bold text-rose-900 leading-relaxed">
              By creating an account, you agree to our community guidelines and commit to our Christian values. 
              This platform is for serious marriage-minded believers only.
            </p>
          </div>

          {/* Already have account */}
          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-gray-600 font-black text-sm mb-2">Already have an account?</p>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 text-rose-600 hover:text-rose-700 font-black text-lg transition-colors"
            >
              SIGN IN
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <Link 
            to="/"
            className="inline-flex items-center gap-2 text-gray-500 hover:text-rose-600 font-black text-sm transition-colors"
          >
            <ArrowRight size={16} className="rotate-180" />
            Back to Home
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;
