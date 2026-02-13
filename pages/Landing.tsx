
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { Heart, Globe, Stars, ShieldCheck, ArrowRight, X, Loader2, LogIn, LayoutDashboard } from 'lucide-react';
import { User } from '../types';

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [showLogin, setShowLogin] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      // The App component listening to auth state will handle the redirect
    } catch (err: any) {
      console.error("Login error:", err.code);
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        setError("Incorrect email or password. Please try again.");
      } else if (err.code === 'auth/too-many-requests') {
        setError("Access blocked temporarily due to many failed attempts. Try again later.");
      } else {
        setError("Failed to login. Please check your internet connection.");
      }
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    setError('');
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Check if profile exists
        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);
        
        if (!docSnap.exists()) {
            // User authenticated but has no profile. Redirect to Onboarding to finish signup.
            navigate('/onboarding');
            return;
        }
        // If profile exists, App context will handle redirect to feed
    } catch (err: any) {
        console.error("Google Login Error:", err);
        if (err.code === 'auth/unauthorized-domain') {
            setError("Domain not authorized in Firebase. Please add this domain in the Firebase Console > Authentication > Settings.");
        } else if (err.code === 'auth/popup-closed-by-user') {
            setError("Sign in cancelled.");
        } else {
            setError("Failed to sign in with Google. " + (err.message || ""));
        }
        setLoading(false);
    }
  };

  const handleAdminDemoLogin = async () => {
    setLoading(true);
    setError('');
    try {
      // For demo purposes, we will try to create a demo admin user or login if exists.
      // In a real app, this logic would be protected.
      const adminEmail = "admin@lifestyleconnect.com";
      const adminPass = "admin123";

      try {
        await signInWithEmailAndPassword(auth, adminEmail, adminPass);
      } catch (e: any) {
        if (e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') {
            // Create the admin user if doesn't exist
            try {
              const cred = await createUserWithEmailAndPassword(auth, adminEmail, adminPass);
              const adminUser: User = {
                  id: cred.user.uid,
                  name: "Site Administrator",
                  age: 30,
                  gender: "male",
                  country: "Zimbabwe",
                  city: "Harare",
                  location: "Harare, Zimbabwe",
                  bio: "Official Administrator Account",
                  images: [],
                  attendsChurch: true,
                  churchName: "Lifestyle Connect HQ",
                  servesInChurch: true,
                  vowAccepted: true,
                  tier: 'tier3',
                  isDiaspora: false,
                  showInDiaspora: true,
                  verificationStatus: 'verified',
                  isAdmin: true
              };
              await setDoc(doc(db, 'users', cred.user.uid), adminUser);
            } catch (createErr: any) {
              if (createErr.code === 'auth/email-already-in-use') {
                setError("Admin account exists but password was incorrect.");
              } else {
                throw createErr;
              }
              setLoading(false);
            }
        } else {
            throw e;
        }
      }
    } catch (err: any) {
      console.error(err);
      if (loading) { // Only set error if we haven't already handled it
         setError("Could not login as admin. " + err.message);
         setLoading(false);
      }
    }
  };

  const collageImages = [
    // White Wedding Vibe
    "https://images.unsplash.com/photo-1515934751635-c81c6bc9a2d8?auto=format&fit=crop&w=600&q=80", // Joyful Black couple wedding
    "https://images.unsplash.com/photo-1608630712773-455562762a4b?auto=format&fit=crop&w=600&q=80", // Formal couple
    "https://images.unsplash.com/photo-1551509653-6b7f3844b266?auto=format&fit=crop&w=600&q=80", // Wedding embrace
    "https://images.unsplash.com/photo-1522673607200-1648832cee33?auto=format&fit=crop&w=600&q=80", // Black couple outdoors
    
    // Traditional / Lobola / Culture Vibe
    "https://images.unsplash.com/photo-1546961329-78bef0414d7c?auto=format&fit=crop&w=600&q=80", // African cultural attire
    "https://images.unsplash.com/photo-1534008775685-2c938d613149?auto=format&fit=crop&w=600&q=80", // Woman in headwrap
    "https://images.unsplash.com/photo-1531123897727-8f129e16fd3c?auto=format&fit=crop&w=600&q=80", // Traditional fashion
    "https://images.unsplash.com/photo-1567215132561-26792694b423?auto=format&fit=crop&w=600&q=80", // Couple laughing
    
    // Celebration & Love
    "https://images.unsplash.com/photo-1628891566324-42f2b7d41071?auto=format&fit=crop&w=600&q=80", // Black bride portrait
    "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=600&q=80", // Reception setting
    "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80", // Joyful woman
    "https://images.unsplash.com/photo-1606105953063-448f7000d664?auto=format&fit=crop&w=600&q=80", // Wedding couple sunset
  ];

  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center overflow-hidden bg-white">
      {/* Background Photo Collage */}
      <div className="absolute inset-0 z-0 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3 opacity-90 scale-105 pointer-events-none">
        {collageImages.concat(collageImages).map((src, i) => (
          <div key={i} className="relative aspect-[3/4] overflow-hidden rounded-[2rem] shadow-xl">
            <img src={src} className="w-full h-full object-cover" alt="" />
          </div>
        ))}
      </div>
      
      {/* Bright Champagne Morning Overlay */}
      <div className="absolute inset-0 z-10 bg-gradient-to-b from-white/70 via-white/30 to-rose-50/60 backdrop-blur-[2px] pointer-events-none"></div>

      {/* Login Button (Top Right) */}
      <div className="absolute top-6 right-6 z-50">
        <button 
          onClick={() => setShowLogin(true)}
          className="flex items-center gap-2 px-6 py-3 bg-white/80 backdrop-blur-md rounded-2xl font-black text-rose-950 shadow-lg hover:bg-white transition-all border-2 border-white"
        >
          <LogIn size={18} /> Login
        </button>
      </div>

      {/* Main Content */}
      <div className="relative z-20 max-w-6xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rose-600 text-white shadow-xl shadow-rose-200 font-black text-[12px] uppercase tracking-[0.25em] mb-12 animate-bounce">
          <Stars size={18} />
          <span>For Zimbabwean Christian Believers</span>
        </div>

        <h1 className="text-7xl md:text-[11rem] font-[900] tracking-tighter text-rose-950 leading-[0.85] mb-12">
          Lifestyle <br /> 
          <span className="relative inline-block pb-4 text-rose-600">
            Connect
            <div className="absolute -bottom-1 md:-bottom-2 left-0 right-0 h-4 md:h-10 bg-[#BE185D] rounded-full -z-10 -rotate-1"></div>
          </span>
        </h1>

        <p className="text-2xl md:text-5xl text-rose-950 font-black max-w-4xl mx-auto leading-[1.1] mb-20 drop-shadow-sm">
          Connect with your kingdom spouse, someone who will love you and help you fulfil your God given purpose.
        </p>

        <div className="flex flex-col sm:flex-row items-center gap-10 justify-center w-full max-w-5xl mx-auto mb-24">
          <Link
            to="/onboarding"
            className="group w-full sm:w-auto px-16 py-9 bg-rose-600 text-white rounded-[3.5rem] font-black text-3xl hover:bg-rose-700 transition-all shadow-[0_30px_70px_-15px_rgba(225,29,72,0.5)] hover:scale-105 active:scale-95 flex items-center justify-center gap-5"
          >
            Seek & Find <ArrowRight size={40} className="group-hover:translate-x-3 transition-transform" />
          </Link>
          
          <div className="flex items-center gap-5 px-10 py-8 bg-white/90 backdrop-blur-xl rounded-[4rem] border-4 border-rose-50 shadow-2xl text-rose-950 font-black">
            <div className="flex -space-x-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-14 h-14 rounded-full border-4 border-white bg-rose-100 overflow-hidden">
                  <img src={`https://i.pravatar.cc/100?u=${i + 22}`} alt="" />
                </div>
              ))}
            </div>
            <div className="text-left">
              <span className="block text-2xl leading-none">2k+</span>
              <span className="text-[11px] uppercase tracking-[0.2em] opacity-60">Verified Souls</span>
            </div>
          </div>
        </div>

        {/* Highlight Section */}
        <div className="grid md:grid-cols-3 gap-10 text-left">
          {[
            { icon: <Heart className="text-rose-600" fill="currentColor" />, title: "Purposeful", desc: "No hook-ups. Only serious Zimbabwean Christians seeking marriage." },
            { icon: <Globe className="text-rose-600" />, title: "Diaspora", desc: "Premium global connect bridging UK, USA, AUS, and home." },
            { icon: <ShieldCheck className="text-rose-600" />, title: "Verified", desc: "Background and church verification for safety and integrity." }
          ].map((item, i) => (
            <div key={i} className="p-12 bg-white/95 rounded-[4rem] border-2 border-rose-50 shadow-xl hover:shadow-2xl transition-all group hover:-translate-y-3">
              <div className="mb-8 p-5 bg-rose-50 rounded-3xl w-fit group-hover:rotate-[15deg] transition-transform">{item.icon}</div>
              <h4 className="text-rose-950 font-black text-2xl mb-4 uppercase tracking-tight">{item.title}</h4>
              <p className="text-gray-600 text-base font-bold leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Login Modal */}
      {showLogin && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/40 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl relative animate-in zoom-in-95 duration-300">
            <button 
              onClick={() => setShowLogin(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-rose-600 transition-colors"
            >
              <X size={24} />
            </button>

            <div className="text-center mb-8">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4 text-rose-600">
                <LogIn size={28} />
              </div>
              <h2 className="text-2xl font-black text-rose-950">Welcome Back</h2>
            </div>

            <button
                onClick={handleGoogleLogin}
                className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-[2rem] font-black text-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-6"
            >
                <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                Sign in with Google
            </button>

            <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200"></div>
                <span className="flex-shrink-0 mx-4 text-gray-300 font-bold text-xs uppercase tracking-widest">Or email</span>
                <div className="flex-grow border-t border-gray-200"></div>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-3 mb-1 block">Email</label>
                <input 
                  type="email" 
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-100 outline-none font-bold text-gray-900" 
                  placeholder="you@email.com"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-3 mb-1 block">Password</label>
                <input 
                  type="password" 
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-100 outline-none font-bold text-gray-900" 
                  placeholder="••••••••"
                />
              </div>
              
              {error && <p className="text-red-500 text-xs font-bold text-center animate-in slide-in-from-top-1">{error}</p>}

              <button 
                type="submit"
                disabled={loading}
                className="w-full py-5 bg-rose-600 text-white rounded-2xl font-black text-lg shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2 mt-4"
              >
                {loading ? <Loader2 className="animate-spin" /> : 'Login'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
                <button 
                  onClick={handleAdminDemoLogin}
                  disabled={loading}
                  className="text-xs font-black text-gray-400 uppercase tracking-widest hover:text-rose-600 flex items-center justify-center gap-2 mx-auto"
                >
                   <LayoutDashboard size={14} /> Login as Admin (Demo)
                </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
