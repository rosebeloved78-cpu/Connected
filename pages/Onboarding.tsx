
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, sendEmailVerification, GoogleAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { User, Tier } from '../types';
import { Logo, ZIM_CITIES } from '../constants';
import { ArrowRight, Check, Church, Heart, ShieldCheck, Briefcase, MapPin, Globe, Star, Zap, Lock, Loader2, Mail, AlertCircle, CheckCircle } from 'lucide-react';

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
    email: '',
    password: ''
  });

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
    return {
        id: uid,
        name: formData.name,
        age: formData.age,
        gender: formData.gender as 'male' | 'female',
        country: formData.country,
        city: formData.city,
        location: displayLocation,
        bio: `Excited to find my God-ordained partner through Lifestyle Connect! Based in ${displayLocation}.`,
        images: ['https://picsum.photos/seed/profile/400/600'],
        attendsChurch: !!formData.attendsChurch,
        churchName: formData.attendsChurch ? formData.churchName : undefined,
        servesInChurch: !!formData.servesInChurch,
        department: formData.servesInChurch ? formData.department : undefined,
        vowAccepted: formData.vowAccepted,
        tier: formData.tier,
        isDiaspora: formData.locationType === 'Diaspora',
        showInDiaspora: true,
        profession: formData.profession,
        education: formData.education,
        verificationStatus: 'unverified',
        maritalStatus: formData.maritalStatus,
        hasChildren: formData.hasChildren,
        numberOfChildren: formData.hasChildren ? formData.numberOfChildren : 0,
        wantsChildren: formData.wantsChildren,
        isAdmin: false
      } as User;
  };

  const handleRegistration = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      let user = auth.currentUser;

      if (!user) {
        const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
        user = userCredential.user;
        try {
          await sendEmailVerification(user);
        } catch (vErr) {
          console.warn("Could not send verification email", vErr);
        }
      }

      const newUserProfile = createProfileData(user!.uid);
      await setDoc(doc(db, "users", user!.uid), newUserProfile);
      
      navigate('/feed');
    } catch (err: any) {
      console.error(err);
      if (err.code === 'auth/email-already-in-use') {
        setError("This email address is already in use.");
      } else {
        setError(err.message || "Failed to create account.");
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
    if (step === 10) {
      if (googleUser) return false;
      return !formData.email || formData.password.length < 6;
    }
    return false;
  };

  return (
    <div className="min-h-screen py-16 flex justify-center items-start px-6 bg-rose-50/20">
      <div className="bg-white p-12 md:p-16 rounded-[4rem] shadow-2xl shadow-rose-100/40 w-full max-w-2xl border border-rose-50 relative overflow-hidden">
        
        <div className="flex flex-col items-center mb-12">
          <Logo className="w-16 h-16 mb-6" />
          <h2 className="text-3xl font-black text-rose-950 tracking-tight text-center leading-tight">
            {step === 1 && "Identity & Location"}
            {step === 2 && "Personal History"}
            {step === 3 && "Vocation & Education"}
            {(step >= 4 && step <= 7) && "Church Life"}
            {step === 8 && "Covenant Vow"}
            {step === 9 && "Select Your Tier"}
            {step === 10 && "Secure Profile"}
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
                  <button type="button" onClick={() => updateForm('locationType', 'Diaspora')} className={`py-4 rounded-3xl font-black text-sm flex items-center justify-center gap-2 border-2 transition-all ${formData.locationType === 'Diaspora' ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-white border-rose-100 text-rose-900 hover:border-rose-200'}`}> <Globe size={18} /> Diaspora </button>
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
                    <button key={status} type="button" onClick={() => updateForm('maritalStatus', status)} className={`py-6 rounded-[2rem] font-black border-2 transition-all ${formData.maritalStatus === status ? (isDiasporaUser ? 'bg-blue-600 border-blue-600 text-white shadow-lg' : 'bg-rose-600 border-rose-600 text-white shadow-lg') : 'bg-rose-50/50 border-transparent text-rose-950 hover:border-rose-100'}`}>{status}</button>
                  ))}
                </div>
              </div>
              <div className="space-y-4">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Do you have children?</label>
                <div className="grid grid-cols-2 gap-4">
                  <button type="button" onClick={() => updateForm('hasChildren', true)} className={`py-6 rounded-[2rem] font-black border-2 transition-all ${formData.hasChildren ? (isDiasporaUser ? 'bg-blue-600 border-blue-600 text-white' : 'bg-rose-600 border-rose-600 text-white') : 'bg-rose-50/50 border-transparent text-rose-950'}`}>Yes</button>
                  <button type="button" onClick={() => updateForm('hasChildren', false)} className={`py-6 rounded-[2rem] font-black border-2 transition-all ${!formData.hasChildren ? (isDiasporaUser ? 'bg-blue-600 border-blue-600 text-white' : 'bg-rose-600 border-rose-600 text-white') : 'bg-rose-50/50 border-transparent text-rose-950'}`}>No</button>
                </div>
              </div>
              {formData.hasChildren && (
                <div className="space-y-2"><label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Number of Children</label><input type="number" min="1" value={formData.numberOfChildren} onChange={e => updateForm('numberOfChildren', parseInt(e.target.value))} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" /></div>
              )}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Profession</label>
                <input required value={formData.profession} onChange={e => updateForm('profession', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" placeholder="e.g. Accountant" />
              </div>
              <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Education</label>
                <input required value={formData.education} onChange={e => updateForm('education', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" placeholder="e.g. Degree" />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="text-center">
                <h3 className="text-2xl font-black text-rose-950 leading-tight">Do you attend a local church regularly?</h3>
                <p className="text-gray-500 font-bold mt-2">Faith is the core of Lifestyle Connect.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => updateForm('attendsChurch', true)} className={`py-8 rounded-[2.5rem] font-black text-xl border-4 transition-all ${formData.attendsChurch === true ? 'bg-rose-600 border-rose-600 text-white shadow-xl' : 'bg-white border-rose-100 text-rose-950 hover:border-rose-300'}`}>Yes</button>
                <button type="button" onClick={() => updateForm('attendsChurch', false)} className={`py-8 rounded-[2.5rem] font-black text-xl border-4 transition-all ${formData.attendsChurch === false ? 'bg-rose-600 border-rose-600 text-white shadow-xl' : 'bg-white border-rose-100 text-rose-950 hover:border-rose-300'}`}>No</button>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Congregation / Church Name</label>
                <input required value={formData.churchName} onChange={e => updateForm('churchName', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" placeholder="e.g. Celebration Church" />
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-10 animate-in fade-in slide-in-from-right-10 duration-500">
              <div className="text-center">
                <h3 className="text-2xl font-black text-rose-950 leading-tight">Do you serve in a department?</h3>
                <p className="text-gray-500 font-bold mt-2">Sharing your gifts with the Kingdom.</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" onClick={() => updateForm('servesInChurch', true)} className={`py-8 rounded-[2.5rem] font-black text-xl border-4 transition-all ${formData.servesInChurch === true ? 'bg-rose-600 border-rose-600 text-white shadow-xl' : 'bg-white border-rose-100 text-rose-950 hover:border-rose-300'}`}>Yes</button>
                <button type="button" onClick={() => updateForm('servesInChurch', false)} className={`py-8 rounded-[2.5rem] font-black text-xl border-4 transition-all ${formData.servesInChurch === false ? 'bg-rose-600 border-rose-600 text-white shadow-xl' : 'bg-white border-rose-100 text-rose-950 hover:border-rose-300'}`}>No</button>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
               <div className="space-y-2">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Department Name</label>
                <input required value={formData.department} onChange={e => updateForm('department', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 text-lg border-2 border-transparent focus:border-rose-200" placeholder="e.g. Worship, Ushering, Multimedia" />
              </div>
            </div>
          )}

          {step === 8 && (
             <div className="bg-rose-900 p-10 rounded-[3rem] text-white shadow-2xl relative overflow-hidden">
                <h3 className="text-3xl font-black mb-6 flex items-center gap-3"><Heart fill="white" /> Covenant Vow</h3>
                <p className="text-lg leading-relaxed font-bold opacity-90 mb-10">"I promise to interact with integrity, honor, and Godly respect."</p>
                <button type="button" onClick={() => updateForm('vowAccepted', !formData.vowAccepted)} className={`w-full py-6 rounded-[2rem] font-black text-xl flex items-center justify-center gap-4 transition-all ${formData.vowAccepted ? 'bg-white text-rose-900' : 'bg-rose-800 text-rose-100 border-2 border-rose-700'}`}>{formData.vowAccepted ? "Accepted" : "Accept Vow"}</button>
              </div>
          )}

          {step === 9 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
               <h3 className="text-2xl font-black text-rose-950 text-center mb-6">Select Tier</h3>
               <div className="grid gap-4">
                 <button type="button" onClick={() => updateForm('tier', isDiasporaUser ? 'diaspora_free' : 'free')} className={`p-6 rounded-[2rem] border-4 text-left font-black transition-all ${formData.tier.includes('free') ? (isDiasporaUser ? 'bg-blue-600 border-blue-600 text-white' : 'bg-rose-600 border-rose-600 text-white') : 'bg-white'}`}>
                    <div className="flex justify-between items-center">
                        <span>Basic Free</span>
                        <span className="text-xs opacity-70">Free Forever</span>
                    </div>
                    <p className="text-[10px] mt-2 opacity-80 font-bold uppercase tracking-widest">See people in your {isDiasporaUser ? 'city or country' : 'city or whole Zimbabwe'}</p>
                 </button>
                 <button type="button" onClick={() => updateForm('tier', isDiasporaUser ? 'diaspora_premium' : 'tier2')} className={`p-6 rounded-[2rem] border-4 text-left font-black transition-all ${['tier2','diaspora_premium'].includes(formData.tier) ? (isDiasporaUser ? 'bg-blue-600 border-blue-600 text-white' : 'bg-rose-600 border-rose-600 text-white') : 'bg-white'}`}>
                    <div className="flex justify-between items-center">
                        <span>Premium</span>
                        <span className="text-xs opacity-70">${isDiasporaUser ? '20' : '10'}/mo</span>
                    </div>
                    <p className="text-[10px] mt-2 opacity-80 font-bold uppercase tracking-widest">Video calls, {isDiasporaUser ? 'Zimbabwe Connect' : 'Church Filters'} & Advanced Filters</p>
                 </button>
                 <button type="button" onClick={() => updateForm('tier', isDiasporaUser ? 'diaspora_vetted' : 'tier3')} className={`p-6 rounded-[2rem] border-4 text-left font-black transition-all ${['tier3','diaspora_vetted'].includes(formData.tier) ? (isDiasporaUser ? 'bg-blue-600 border-blue-600 text-white' : 'bg-rose-600 border-rose-600 text-white') : 'bg-white'}`}>
                    <div className="flex justify-between items-center">
                        <span>Elite / Vetted</span>
                        <span className="text-xs opacity-70">${isDiasporaUser ? '50' : '20'}/mo</span>
                    </div>
                    <p className="text-[10px] mt-2 opacity-80 font-bold uppercase tracking-widest">{isDiasporaUser ? 'Concierge Vetting' : 'Gift Delivery & Advanced Filters'}</p>
                 </button>
               </div>
            </div>
          )}

          {step === 10 && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-10 duration-500">
              {googleUser ? (
                <div className="bg-green-50 p-8 rounded-3xl border-2 border-green-200 text-center">
                    <CheckCircle className="mx-auto text-green-600 mb-4" size={48} />
                    <p className="font-black text-green-900 mb-2">Authenticated as {googleUser.displayName}</p>
                    <p className="text-xs font-bold text-green-700">{googleUser.email}</p>
                </div>
              ) : (
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Email</label>
                        <input type="email" required value={formData.email} onChange={e => updateForm('email', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 border-2 border-transparent focus:border-rose-200" placeholder="you@example.com" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Password</label>
                        <input type="password" required minLength={6} value={formData.password} onChange={e => updateForm('password', e.target.value)} className="w-full px-8 py-6 rounded-[2rem] bg-rose-50/50 outline-none font-bold text-rose-950 border-2 border-transparent focus:border-rose-200" placeholder="••••••••" />
                    </div>
                </div>
              )}
              {error && <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-2 font-bold text-xs"><AlertCircle size={14} /> {error}</div>}
            </div>
          )}

          <div className="pt-10 flex flex-col gap-4">
            {step < TOTAL_STEPS ? (
              <button type="button" disabled={isNextDisabled()} onClick={handleNext} className={`w-full py-8 text-white rounded-[2.5rem] font-black text-2xl shadow-xl transition-all flex items-center justify-center gap-4 group ${isDiasporaUser ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'} disabled:opacity-30`}>
                Continue <ArrowRight size={32} className="group-hover:translate-x-2 transition-transform" />
              </button>
            ) : (
              <button type="submit" disabled={loading || isNextDisabled()} className={`w-full py-8 text-white rounded-[2.5rem] font-black text-2xl shadow-xl transition-all flex items-center justify-center gap-3 ${isDiasporaUser ? 'bg-blue-600 hover:bg-blue-700 shadow-blue-100' : 'bg-rose-600 hover:bg-rose-700 shadow-rose-100'} disabled:opacity-50`}>
                {loading ? <Loader2 className="animate-spin" /> : 'Finish Setup'}
              </button>
            )}
            {step > 1 && <button type="button" onClick={() => setStep(step - 1)} className="w-full py-4 text-gray-400 font-bold hover:text-rose-600 transition-colors">Go Back</button>}
          </div>
        </form>
      </div>
    </div>
  );
};

export default OnboardingPage;
