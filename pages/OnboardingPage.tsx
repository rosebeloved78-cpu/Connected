
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Tier } from '../types';
import { Logo, ZIM_CITIES } from '../constants';
import { ArrowRight, Check, Church, Heart, ShieldCheck, Briefcase, MapPin, Globe, Star, Zap, Lock, Loader2, Mail } from 'lucide-react';

const OnboardingPage: React.FC = () => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [googleUser, setGoogleUser] = useState<any>(null);

  const [formData, setFormData] = useState({
    name: '',
    age: 24,
    gender: 'female',
    locationType: 'Zimbabwe' as 'Zimbabwe' | 'Diaspora',
    country: 'Zimbabwe',
    city: '',
    profession: '',
    education: '',
    maritalStatus: 'Never Married' as 'Never Married' | 'Divorced',
    hasChildren: false,
    numberOfChildren: 0,
    wantsChildren: 'Yes' as 'Yes' | 'No' | 'Maybe',
    attendsChurch: null as boolean | null,
    churchName: '',
    servesInChurch: null as boolean | null,
    department: '',
    vowAccepted: false,
    tier: 'free' as Tier,
    // Auth Data
    email: '',
    password: ''
  });

  // Check if user is already authenticated (e.g. via Landing Page Google Login)
  useEffect(() => {
    if (auth.currentUser) {
        setGoogleUser(auth.currentUser);
        setFormData(prev => ({
            ...prev,
            name: auth.currentUser?.displayName || prev.name,
            email: auth.currentUser?.email || prev.email
        }));
    }
  }, []);

  const TOTAL_STEPS = 10; 
  const isDiasporaUser = formData.locationType === 'Diaspora';

  const handleNext = () => {
    // Validation logic
    if (step === 4 && formData.attendsChurch === false) { setStep(8); return; }
    if (step === 6 && formData.servesInChurch === false) { setStep(8); return; }
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const updateForm = (key: string, val: any) => setFormData(prev => {
    const newData = { ...prev, [key]: val };
    if (key === 'locationType') {
      newData.country = val === 'Zimbabwe' ? 'Zimbabwe' : '';
      newData.city = '';
      newData.tier = val === 'Diaspora' ? 'diaspora_free' : 'free';
    }
    return newData;
  });

  const createProfileData = (uid: string) => {
    const displayLocation = `${formData.city}, ${formData.country}`;
    const newUserProfile: User = {
        id: uid,
        name: formData.name,
        age: formData.age,
        gender: formData.gender as 'male' | 'female',
        country: formData.country,
        city: formData.city,
        location: displayLocation,
        bio: "Excited to find my God-ordained partner through Lifestyle Connect!",
        images: ['https://picsum.photos/seed/profile/400/600'], // Default placeholder
        attendsChurch: !!formData.attendsChurch,
        churchName: formData.attendsChurch ? formData.churchName : undefined,
        servesInChurch: !!formData.servesInChurch,
        department: formData.servesInChurch ? formData.department : undefined,
        vowAccepted: formData.vowAccepted,
        tier: formData.tier,
        isDiaspora: formData.locationType === 'Diaspora',
        showInDiaspora: formData.gender === 'female' || formData.locationType === 'Diaspora',
        profession: formData.profession,
        education: formData.education,
        verificationStatus: 'unverified',
        maritalStatus: formData.maritalStatus,
        hasChildren: formData.hasChildren,
        numberOfChildren: formData.hasChildren ? formData.numberOfChildren : 0,
        wantsChildren: formData.wantsChildren,
        isAdmin: false
      };
      return newUserProfile;
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user = auth.currentUser;

      // 1. Create Auth User if not exists
      if (!user) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;
        // 2. Send Verification Email only for new email users
        await sendEmailVerification(user);
      }

      // 3. Save to Firestore
      const newUserProfile = createProfileData(user!.uid);
      await setDoc(doc(db, "users", user!.uid), newUserProfile);
      
      // 4. Redirect
      if (!googleUser) {
        alert("Account created! Please check your email inbox to verify your account.");
      }
      navigate('/feed');

    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email address is already registered. Please log in instead.");
      } else {
        setError("Failed to create account. Please check your connection and details.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignUp = async () => {
    setError('');
    setLoading(true);
    try {
        const provider = new GoogleAuthProvider();
        const result = await signInWithPopup(auth, provider);
        const user = result.user;
        
        // Save Profile
        const newUserProfile = createProfileData(user.uid);
        await setDoc(doc(db, "users", user.uid), newUserProfile);
        
        navigate('/feed');
    } catch (err: any) {
        console.error("Google Sign Up Error:", err);
        if (err.code === 'auth/unauthorized-domain') {
            setError("Domain not authorized in Firebase. Please add this domain in the Firebase Console > Authentication > Settings.");
        } else if (err.code === 'auth/popup-closed-by-user') {
            setError("Sign up cancelled.");
        } else {
            setError("Could not sign up with Google. " + (err.message || ""));
        }
    } finally {
        setLoading(false);
    }
  };

  const isNextDisabled = () => {
    if (step === 1) {
      if (!formData.name || !formData.age || !formData.city) return true;
      if (formData.locationType === 'Diaspora' && !formData.country) return true;
      return false;
    }
    if (step === 3 && (!formData.profession || !formData.education)) return true;
    if (step === 4 && formData.attendsChurch === null) return true;
    if (step === 5 && !formData.churchName) return true;
    if (step === 6 && formData.servesInChurch === null) return true;
    if (step === 7 && !formData.department) return true;
    if (step === 8 && !formData.vowAccepted) return true;
    // Step 10 validation
    if (step === 10) {
      if (googleUser) return false;
      return !formData.email || formData.password.length < 6;
    }
    return false;
  };

  return (
    <div className="min-h-screen py-16 flex justify-center items-start px-6 bg-rose-50/20">
      <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl shadow-rose-100/40 w-full max-w-2xl border border-rose-50 relative overflow-hidden">
        
        {/* Progress Tracker */}
        <div className="flex flex-col items-center mb-12">
          <Logo className="w-16 h-16 mb-6" />
          <h2 className="text-3xl font-black text-rose-950 tracking-tight text-center">
            {step === 1 && "Identity & Location"}
            {step === 2 && "Personal History"}
            {step === 3 && "Vocation & Education"}
            {(step >= 4 && step <= 7) && "Church Life"}
            {step === 8 && "Covenant Vow"}
            {step === 9 && "Select Your Tier"}
            {step === 10 && "Create Account"}
          </h2>
          <div className="flex gap-2 mt-6">
            {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
              <div key={i} className={`h-2 w-8 rounded-full transition-all duration-700 ${step >= i + 1 ? (isDiasporaUser ? 'bg-blue-600' : 'bg-rose-600') : 'bg-rose-100'}`} />
            ))}
          </div>
        </div>

        <form onSubmit={handleRegistration} className="space-y-10">
          
          {step === 1 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Full Name</label>
                <input required value={formData.name} onChange={e => updateForm('name', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" placeholder="e.g. Tendai Moyo" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Gender</label>
                  <select value={formData.gender} onChange={e => updateForm('gender', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200">
                    <option value="male">Male</option>
                    <option value="female">Female</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Age</label>
                  <input type="number" min="18" required value={formData.age} onChange={e => updateForm('age', parseInt(e.target.value))} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" />
                </div>
              </div>
              <div className="space-y-4 pt-4 border-t border-rose-50">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4 block mb-2">Residency Status</label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => updateForm('locationType', 'Zimbabwe')} className={`py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all ${formData.locationType === 'Zimbabwe' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-rose-100 text-rose-900 hover:border-rose-200'}`}> <MapPin size={18} /> Zimbabwe </button>
                  <button type="button" onClick={() => updateForm('locationType', 'Diaspora')} className={`py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all ${formData.locationType === 'Diaspora' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-rose-100 text-rose-900 hover:border-rose-200'}`}> <Globe size={18} /> Diaspora </button>
                </div>
              </div>
              {formData.locationType === 'Zimbabwe' ? (
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Select City</label>
                  <select value={formData.city} onChange={e => updateForm('city', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200">
                    <option value="">-- Choose --</option>
                    {ZIM_CITIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Country</label>
                    <input required value={formData.country} onChange={e => updateForm('country', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" placeholder="UK, USA, etc" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">City</label>
                    <input required value={formData.city} onChange={e => updateForm('city', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" placeholder="London, etc" />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 2 && (
            <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Marital Status</label>
                <div className="grid grid-cols-2 gap-4">
                  {['Never Married', 'Divorced'].map(status => (
                    <button key={status} type="button" onClick={() => updateForm('maritalStatus', status)} className={`py-6 rounded-[2rem] font-black border-2 transition-all ${formData.maritalStatus === status ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-rose-50/50 border-transparent text-rose-950 hover:border-rose-100'}`}>{status}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Do you have children?</label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => updateForm('hasChildren', true)} className={`py-6 rounded-[2rem] font-black border-2 transition-all ${formData.hasChildren ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-rose-50/50 border-transparent text-rose-950 hover:border-rose-100'}`}>Yes</button>
                  <button type="button" onClick={() => updateForm('hasChildren', false)} className={`py-6 rounded-[2rem] font-black border-2 transition-all ${!formData.hasChildren ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-rose-50/50 border-transparent text-rose-950 hover:border-rose-100'}`}>No</button>
                </div>
              </div>
              {formData.hasChildren && (
                <div className="space-y-2"><label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Number of Children</label><input type="number" min="1" value={formData.numberOfChildren} onChange={e => updateForm('numberOfChildren', parseInt(e.target.value))} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" /></div>
              )}
              <div className="space-y-4">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Would you like (more) children?</label>
                <div className="grid grid-cols-3 gap-3">
                  {['Yes', 'No', 'Maybe'].map(opt => (<button key={opt} type="button" onClick={() => updateForm('wantsChildren', opt)} className={`py-4 rounded-3xl font-black border-2 transition-all ${formData.wantsChildren === opt ? 'bg-rose-600 border-rose-600 text-white' : 'bg-rose-50/50 border-transparent text-rose-950'}`}>{opt}</button>))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Profession / Occupation</label>
                <input required value={formData.profession} onChange={e => updateForm('profession', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" placeholder="e.g. Accountant" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Educational Qualifications</label>
                <input required value={formData.education} onChange={e => updateForm('education', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" placeholder="e.g. BSc Economics" />
              </div>
            </div>
          )}

          {(step >= 4 && step <= 7) && (
             <div className="space-y-8 animate-in fade-in slide-in-from-right-10 duration-500">
               {step === 4 && <div className="text-center"><h3 className="text-2xl font-black text-rose-950">Do you attend a local church regularly?</h3><div className="grid grid-cols-2 gap-4 pt-6"><button type="button" onClick={() => updateForm('attendsChurch', true)} className={`py-8 rounded-[2.5rem] font-black text-xl border-4 ${formData.attendsChurch ? 'bg-rose-600 text-white' : 'bg-white'}`}>Yes</button><button type="button" onClick={() => updateForm('attendsChurch', false)} className={`py-8 rounded-[2.5rem] font-black text-xl border-4 ${formData.attendsChurch === false ? 'bg-rose-600 text-white' : 'bg-white'}`}>No</button></div></div>}
               {step === 5 && <div className="space-y-2"><label className="ml-4 font-black text-rose-400 text-[10px] uppercase">Church Name</label><input value={formData.churchName} onChange={e => updateForm('churchName', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 font-bold" /></div>}
               {step === 6 && <div className="text-center"><h3 className="text-2xl font-black text-rose-950">Do you serve?</h3><div className="grid grid-cols-2 gap-4 pt-6"><button type="button" onClick={() => updateForm('servesInChurch', true)} className={`py-8 rounded-[2.5rem] font-black text-xl border-4 ${formData.servesInChurch ? 'bg-rose-600 text-white' : 'bg-white'}`}>Yes</button><button type="button" onClick={() => updateForm('servesInChurch', false)} className={`py-8 rounded-[2.5rem] font-black text-xl border-4 ${formData.servesInChurch === false ? 'bg-rose-600 text-white' : 'bg-white'}`}>No</button></div></div>}
               {step === 7 && <div className="space-y-2"><label className="ml-4 font-black text-rose-400 text-[10px] uppercase">Department</label><input value={formData.department} onChange={e => updateForm('department', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 font-bold" /></div>}
             </div>
          )}

          {step === 8 && (
             <div className="bg-rose-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <h3 className="text-3xl font-black mb-6 flex items-center gap-3"><Heart fill="white" /> The Covenant Vow</h3>
                <p className="text-lg leading-relaxed font-bold opacity-90 mb-10">"I solemnly promise to interact with integrity, honor, and Godly respect..."</p>
                <button type="button" onClick={() => updateForm('vowAccepted', !formData.vowAccepted)} className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all ${formData.vowAccepted ? 'bg-white text-rose-900' : 'bg-rose-800 text-rose-100 border-2 border-rose-700'}`}>{formData.vowAccepted ? "Accepted" : "Accept Covenant Vow"}</button>
              </div>
          )}

          {step === 9 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
               <h3 className="text-2xl font-black text-rose-950 text-center mb-6">Select Your Tier</h3>
               {/* Simplified Tier selection for brevity, logic exists in updateForm */}
               <div className="grid gap-4">
                 <button type="button" onClick={() => updateForm('tier', isDiasporaUser ? 'diaspora_free' : 'free')} className={`p-6 rounded-[2rem] border-4 text-left font-black ${formData.tier.includes('free') ? 'bg-rose-600 text-white' : 'bg-white'}`}>Basic Free</button>
                 <button type="button" onClick={() => updateForm('tier', isDiasporaUser ? 'diaspora_premium' : 'tier2')} className={`p-6 rounded-[2rem] border-4 text-left font-black ${['tier2','diaspora_premium'].includes(formData.tier) ? 'bg-rose-600 text-white' : 'bg-white'}`}>Premium</button>
                 <button type="button" onClick={() => updateForm('tier', isDiasporaUser ? 'diaspora_vetted' : 'tier3')} className={`p-6 rounded-[2rem] border-4 text-left font-black ${['tier3','diaspora_vetted'].includes(formData.tier) ? 'bg-rose-600 text-white' : 'bg-white'}`}>Elite / Vetted</button>
               </div>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="bg-white p-8 rounded-[3rem] border-4 border-rose-50 text-center mb-6">
                <Lock size={48} className="mx-auto text-rose-600 mb-4" />
                <h3 className="text-2xl font-black text-rose-950">Secure Your Profile</h3>
                <p className="text-gray-500 font-bold text-sm mt-2">
                    {googleUser ? "Confirm your Google details to finish." : "Create your login details or use Google."}
                </p>
              </div>

              {!googleUser ? (
                  <>
                    <button
                        type="button"
                        onClick={handleGoogleSignUp}
                        className="w-full py-4 bg-white border-2 border-gray-200 text-gray-700 rounded-[2rem] font-black text-lg shadow-sm hover:bg-gray-50 transition-all flex items-center justify-center gap-3 mb-6"
                    >
                        <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                        Sign up with Google
                    </button>
                    
                    <div className="relative flex py-2 items-center">
                        <div className="flex-grow border-t border-gray-200"></div>
                        <span className="flex-shrink-0 mx-4 text-gray-300 font-bold text-xs uppercase tracking-widest">Or using email</span>
                        <div className="flex-grow border-t border-gray-200"></div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Email Address</label>
                        <input 
                            type="email" 
                            required 
                            value={formData.email} 
                            onChange={e => updateForm('email', e.target.value)} 
                            className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" 
                            placeholder="you@example.com"
                        />
                        </div>
                        <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Create Password</label>
                        <input 
                            type="password" 
                            required 
                            minLength={6}
                            value={formData.password} 
                            onChange={e => updateForm('password', e.target.value)} 
                            className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" 
                            placeholder="••••••••"
                        />
                        </div>
                    </div>
                  </>
              ) : (
                  <div className="bg-green-50 p-6 rounded-3xl border border-green-200 text-center">
                      <p className="text-green-800 font-black mb-2">Authenticated via Google</p>
                      <p className="text-sm font-bold text-gray-600">{googleUser.email}</p>
                  </div>
              )}

              {error && (
                <div className="p-4 bg-red-50 text-red-600 rounded-2xl text-center font-bold text-sm animate-in fade-in slide-in-from-bottom-2">
                  {error}
                </div>
              )}
            </div>
          )}

          {/* CONTROLS */}
          <div className="pt-10 flex flex-col gap-4">
            {step < TOTAL_STEPS ? (
              <button 
                type="button"
                disabled={isNextDisabled()}
                onClick={handleNext}
                className={`w-full py-8 text-white rounded-[2.5rem] font-black text-2xl shadow-xl transition-all flex items-center justify-center gap-4 group ${isDiasporaUser ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'} disabled:opacity-30 disabled:shadow-none`}
              >
                Continue <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
              </button>
            ) : (
              <button 
                type="submit"
                disabled={loading || isNextDisabled()}
                className={`w-full py-8 text-white rounded-[2.5rem] font-black text-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${isDiasporaUser ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'} disabled:opacity-50`}
              >
                {loading ? <Loader2 className="animate-spin" /> : (googleUser ? 'Complete Profile' : 'Create Account')}
              </button>
            )}
            
            {step > 1 && (
              <button 
                type="button" 
                onClick={() => setStep(step - 1)} 
                className="w-full py-4 text-gray-400 font-bold hover:text-rose-600 transition-colors"
              >
                Go Back
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
