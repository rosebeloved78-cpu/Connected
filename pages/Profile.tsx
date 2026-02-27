
import React, { useState, useRef } from 'react';
import { User, Tier, SpiritualMaturity } from '../types';
import { User as UserIcon, ShieldCheck, Heart, Baby, Church, Briefcase, MapPin, CheckCircle, Plus, Check, X, UserCheck, Camera, Image as ImageIcon, Trash2, Loader2, EyeOff, Eye, Ban, AlertTriangle, Zap, Star, Gift as GiftIcon, Video, Globe, Truck, Sparkles, ShieldAlert, Mail, Lock } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';
import { updateEmail, reauthenticateWithCredential, EmailAuthProvider, sendEmailVerification } from 'firebase/auth';
import PaymentModal from '../components/PaymentModal';
import { GoogleGenAI } from "@google/genai";

const ProfilePage: React.FC<{ user: User; onUpdate: (user: User) => void }> = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ ...user });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { refreshProfile, logout } = useAuth();
  
  // Email editing states
  const [newEmail, setNewEmail] = useState('');
  const [emailPassword, setEmailPassword] = useState('');
  const [showEmailEdit, setShowEmailEdit] = useState(false);
  const [emailError, setEmailError] = useState('');
  const [emailSuccess, setEmailSuccess] = useState('');
  
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingUpgrade, setPendingUpgrade] = useState<{ tier: Tier, amount: number, title: string, desc: string } | null>(null);

  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const verificationInputRef = useRef<HTMLInputElement>(null);

  const isLocal = !user.isDiaspora;

  const handleSave = async () => {
    setSaving(true);
    try {
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, formData as any);
      await refreshProfile();
      onUpdate(formData);
      setIsEditing(false);
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  const handleEmailUpdate = async () => {
    setEmailError('');
    setEmailSuccess('');
    
    if (!newEmail || !emailPassword) {
      setEmailError('Please enter both new email and password');
      return;
    }
    
    if (!auth.currentUser) {
      setEmailError('No authenticated user found');
      return;
    }
    
    // Check if user signed up with Google (no password)
    if (!auth.currentUser.providerData.some(provider => provider.providerId === 'password')) {
      setEmailError('Email editing is only available for users who signed up with email and password');
      return;
    }
    
    setSaving(true);
    
    try {
      // Reauthenticate user
      const credential = EmailAuthProvider.credential(
        auth.currentUser.email!,
        emailPassword
      );
      await reauthenticateWithCredential(auth.currentUser, credential);
      
      // Update email
      await updateEmail(auth.currentUser, newEmail);
      
      // Update email in Firestore
      const userRef = doc(db, 'users', user.id);
      await updateDoc(userRef, { 
        email: newEmail,
        emailVerified: false 
      });
      
      // Send verification email
      await sendEmailVerification(auth.currentUser);
      
      // Update local state
      setFormData(prev => ({ ...prev, email: newEmail, emailVerified: false }));
      
      setEmailSuccess('Email updated successfully! Please check your new email for verification.');
      setShowEmailEdit(false);
      setNewEmail('');
      setEmailPassword('');
      
      // Refresh profile to get updated data
      await refreshProfile();
      
    } catch (error: any) {
      console.error("Error updating email:", error);
      if (error.code === 'auth/wrong-password') {
        setEmailError('Incorrect password. Please try again.');
      } else if (error.code === 'auth/email-already-in-use') {
        setEmailError('This email is already in use by another account.');
      } else if (error.code === 'auth/invalid-email') {
        setEmailError('Invalid email format.');
      } else {
        setEmailError('Failed to update email. Please try again.');
      }
    } finally {
      setSaving(false);
    }
  };

  const handleResendVerification = async () => {
    if (!auth.currentUser) return;
    
    setSaving(true);
    try {
      await sendEmailVerification(auth.currentUser);
      setEmailSuccess('Verification email sent! Please check your inbox.');
    } catch (error) {
      console.error("Error sending verification:", error);
      setEmailError('Failed to send verification email.');
    } finally {
      setSaving(false);
    }
  };

  const handleVerificationUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSaving(true);
    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64Image = reader.result as string;
      const userRef = doc(db, 'users', user.id);
      
      try {
        // Automated AI Biometric Check
        const apiKey = import.meta.env.VITE_GOOGLE_GENAI_KEY;
        if (!apiKey) {
          console.warn("API Key missing, skipping AI verification");
          throw new Error("API Key missing");
        }

        const ai = new GoogleGenAI({ apiKey });
        const prompt = `You are a biometric security expert. Compare these two images:
        Image 1: The user's primary profile picture.
        Image 2: The user's verification selfie.
        
        Determine if they are the same person. Return a JSON object:
        {
          "match": boolean,
          "confidence": number (0 to 1),
          "reason": "short explanation"
        }`;

        const img1Part = {
          inlineData: {
            data: user.images[0].split(',')[1],
            mimeType: 'image/jpeg'
          }
        };
        const img2Part = {
          inlineData: {
            data: base64Image.split(',')[1],
            mimeType: 'image/jpeg'
          }
        };

        const result = await ai.models.generateContent({
          model: 'gemini-3-flash-preview',
          contents: [{ parts: [img1Part, img2Part, { text: prompt }] }],
        });

        const assessment = JSON.parse(result.text.replace(/```json/g, '').replace(/```/g, ''));
        
        if (assessment.match && assessment.confidence > 0.9) {
          await updateDoc(userRef, {
            verificationStatus: 'verified',
            verificationImage: null // Clear image if verified automatically
          });
          alert("Hallelujah! Our AI Smart-Scan has verified your identity instantly. You are now a verified member!");
        } else {
          await updateDoc(userRef, {
            verificationImage: base64Image,
            verificationStatus: 'pending'
          });
          alert("Verification selfie submitted! An administrator will review your profile shortly.");
        }
        
        await refreshProfile();
      } catch (err) {
        console.error("AI Verification failed or skipped, falling back to manual review:", err);
        const userRef = doc(db, 'users', user.id);
        
        // Fallback to manual review (pending)
        await updateDoc(userRef, {
          verificationImage: base64Image,
          verificationStatus: 'pending'
        });
        
        await refreshProfile();
        alert("Verification selfie submitted! An administrator will review your profile shortly.");
      } finally {
        setSaving(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleToggleHide = async () => {
    const nextHiddenStatus = !user.isHidden;
    const confirmMsg = nextHiddenStatus 
      ? "Need a break? Hide your profile and continue to use our community service to find prayer partners or join in community prayers."
      : "Unhide your profile and start appearing in matches again?";
    
    if (window.confirm(confirmMsg)) {
      setSaving(true);
      try {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, { isHidden: nextHiddenStatus });
        await refreshProfile();
      } catch (error) {
        console.error("Error toggling visibility:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleCancelSubscription = async () => {
    if (window.confirm("Are you sure you want to cancel your premium subscription? You will be reverted to the free tier immediately.")) {
      setSaving(true);
      try {
        const userRef = doc(db, 'users', user.id);
        const freeTier = user.isDiaspora ? 'diaspora_free' : 'free';
        await updateDoc(userRef, { tier: freeTier });
        await refreshProfile();
        alert("Subscription canceled. You are now on the free tier.");
      } catch (error) {
        console.error("Error canceling subscription:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const handleDeleteProfile = async () => {
    const msg = "Are you sure you want to permanently delete your profile? This cannot be undone. Would you like to hide your profile instead?";
    if (window.confirm(msg)) {
      if (window.confirm("This is your final warning. Your profile and all data will be permanently deleted. Do you insist on deleting?")) {
        setSaving(true);
        try {
          const userRef = doc(db, 'users', user.id);
          await deleteDoc(userRef);
          await logout();
          navigate('/');
        } catch (error) {
          console.error("Error deleting profile:", error);
          alert("Failed to delete profile.");
        } finally {
          setSaving(false);
        }
      }
    }
  };

  const initiateUpgrade = (targetTier: Tier, amount: number, title: string, desc: string) => {
    setPendingUpgrade({ tier: targetTier, amount, title, desc });
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = async () => {
    if (pendingUpgrade) {
      setSaving(true);
      try {
        const userRef = doc(db, 'users', user.id);
        await updateDoc(userRef, { tier: pendingUpgrade.tier });
        await refreshProfile();
        setPaymentModalOpen(false);
        setPendingUpgrade(null);
      } catch (error) {
        console.error("Error upgrading:", error);
      } finally {
        setSaving(false);
      }
    }
  };

  const updateField = (key: string, val: any) => setFormData(prev => ({ ...prev, [key]: val }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'profile' | 'cover' | 'gallery') => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const readFile = (file: File): Promise<string> => {
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(file);
      });
    };

    if (type === 'profile') {
      readFile(files[0]).then(base64 => {
        const newImages = [...formData.images];
        newImages[0] = base64;
        updateField('images', newImages);
      });
    } else if (type === 'cover') {
      readFile(files[0]).then(base64 => {
        updateField('coverImage', base64);
      });
    } else if (type === 'gallery') {
      const remainingSlots = 10 - formData.images.length;
      if (remainingSlots <= 0) {
        alert("Maximum of 10 photos reached.");
        return;
      }
      
      const filesToProcess = Array.from(files).slice(0, remainingSlots);
      Promise.all(filesToProcess.map(readFile)).then(newBase64s => {
        updateField('images', [...formData.images, ...newBase64s]);
      });
    }
  };

  const removeGalleryImage = (index: number) => {
    if (index === 0) return;
    const newImages = formData.images.filter((_, i) => i !== index);
    updateField('images', newImages);
  };

  return (
    <div className="max-w-5xl mx-auto px-6 py-12 pb-32">
      <div className="bg-white rounded-[4rem] shadow-2xl shadow-gray-100 overflow-hidden border border-gray-50 relative">
        
        {/* Profile Header (Cover Photo) */}
        <div 
          className="relative h-80 bg-rose-600 transition-all duration-500"
          style={{ 
            backgroundImage: formData.coverImage ? `url(${formData.coverImage})` : 'none',
            backgroundSize: 'cover',
            backgroundPosition: 'center'
          }}
        >
          {isEditing && (
            <div className="absolute inset-0 bg-black/40 flex items-center justify-center backdrop-blur-[2px] transition-all">
              <button 
                onClick={() => coverInputRef.current?.click()}
                className="px-6 py-3 bg-white/20 hover:bg-white/40 text-white border-2 border-white/50 rounded-2xl font-black flex items-center gap-2 backdrop-blur-md transition-all"
              >
                <Camera size={20} /> Change Cover Photo
              </button>
              <input ref={coverInputRef} type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'cover')} />
            </div>
          )}

          <div className="absolute -bottom-24 left-12">
            <div className="relative group">
              <div className="w-48 h-48 rounded-[3.5rem] overflow-hidden border-8 border-white shadow-2xl bg-gray-100">
                <img 
                  src={formData.images[0] || 'https://i.pravatar.cc/300'} 
                  crossOrigin="anonymous" 
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform group-hover:scale-105" 
                  alt="Profile"
                />
              </div>
              
              {isEditing && (
                <button 
                  onClick={() => profileInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 rounded-[3.5rem] flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Camera size={32} />
                </button>
              )}
              <input ref={profileInputRef} type="file" hidden accept="image/*" onChange={(e) => handleFileChange(e, 'profile')} />

              {user.verificationStatus === 'verified' && !isEditing && (
                <div className="absolute -top-3 -right-3 bg-blue-500 text-white p-3 rounded-2xl border-4 border-white shadow-xl">
                  <CheckCircle size={24} fill="currentColor" />
                </div>
              )}
            </div>
          </div>

          <div className="absolute bottom-6 right-12 flex gap-4">
            {isEditing ? (
              <>
                <button onClick={() => setIsEditing(false)} disabled={saving} className="px-8 py-4 bg-white/20 backdrop-blur-md text-white font-black rounded-2xl border-2 border-white/30 hover:bg-white/30 transition-all flex items-center gap-2">
                  <X size={18} strokeWidth={3} /> Cancel
                </button>
                <button onClick={handleSave} disabled={saving} className="px-8 py-4 bg-white text-rose-600 font-black rounded-2xl shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2">
                  {saving ? <Loader2 className="animate-spin" /> : <><Check size={18} strokeWidth={3} /> Save Changes</>}
                </button>
              </>
            ) : (
              <button onClick={() => setIsEditing(true)} className="px-10 py-5 bg-white text-rose-900 font-black rounded-3xl shadow-xl hover:-translate-y-1 transition-all flex items-center gap-2">
                <Plus size={18} strokeWidth={3} className="rotate-45" /> Edit Profile Settings
              </button>
            )}
          </div>
        </div>

        <div className="pt-32 px-12 pb-16">
          <div className="mb-12 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-5xl font-black text-rose-950 mb-2 tracking-tight">{formData.name}, {formData.age}</h1>
              <p className="text-rose-400 font-black flex items-center gap-2 uppercase text-xs tracking-widest">
                <MapPin size={16} strokeWidth={3} /> {formData.location} • {formData.tier !== 'free' && formData.tier !== 'diaspora_free' ? 'Premium Covenant' : 'Standard Member'}
              </p>
            </div>
            {user.isHidden && (
              <div className="flex items-center gap-3 bg-amber-50 text-amber-600 px-6 py-3 rounded-2xl border-2 border-amber-100 font-black text-xs uppercase tracking-widest">
                <EyeOff size={16} /> Profile Hidden
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-2 gap-16">
            <div className="space-y-12">
              {!isEditing ? (
                <>
                  {/* Account Verification Status Section */}
                  <section className={`p-10 rounded-[3.5rem] border-4 shadow-xl transition-all ${user.verificationStatus === 'verified' ? 'bg-blue-50 border-blue-100' : user.verificationStatus === 'pending' ? 'bg-amber-50 border-amber-100' : 'bg-rose-50 border-rose-100'}`}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`text-xl font-black uppercase tracking-tight flex items-center gap-3 ${user.verificationStatus === 'verified' ? 'text-blue-900' : user.verificationStatus === 'pending' ? 'text-amber-900' : 'text-rose-900'}`}>
                        {user.verificationStatus === 'verified' ? <ShieldCheck size={24} /> : user.verificationStatus === 'pending' ? <Loader2 className="animate-spin" size={24} /> : <ShieldAlert size={24} />}
                        Profile Accountability
                      </h3>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${user.verificationStatus === 'verified' ? 'bg-blue-600 text-white' : user.verificationStatus === 'pending' ? 'bg-amber-500 text-white' : 'bg-rose-600 text-white'}`}>
                        {user.verificationStatus}
                      </span>
                    </div>

                    {user.verificationStatus === 'unverified' && (
                      <div className="space-y-6">
                        <p className="text-sm font-bold text-rose-800 leading-relaxed italic">"Trust is the cornerstone of our community. Verify your identity to gain the trust of potential partners and show you are a genuine believer."</p>
                        <button 
                          onClick={() => verificationInputRef.current?.click()}
                          disabled={saving}
                          className="w-full py-5 bg-white text-rose-600 rounded-[2rem] font-black shadow-lg hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 border-2 border-rose-200"
                        >
                          {saving ? <Loader2 className="animate-spin" /> : <><Camera size={20} /> Verify My Identity</>}
                        </button>
                        <input ref={verificationInputRef} type="file" hidden accept="image/*" onChange={handleVerificationUpload} />
                        <p className="text-[9px] font-black text-rose-400 text-center uppercase tracking-widest leading-relaxed">Upload a clear selfie. Our administrators will review it manually.</p>
                      </div>
                    )}

                    {user.verificationStatus === 'pending' && (
                      <div className="space-y-4">
                        <p className="text-sm font-bold text-amber-800 leading-relaxed italic">"Your identity is currently being reviewed by the Covenant Security team. We will update your status within 24 hours."</p>
                        <div className="flex items-center justify-center gap-2 text-amber-400 font-black text-[10px] uppercase tracking-[0.2em] py-4 bg-white/50 rounded-2xl">
                          <Loader2 size={12} className="animate-spin" /> In Review
                        </div>
                      </div>
                    )}

                    {user.verificationStatus === 'verified' && (
                      <div className="space-y-4">
                        <p className="text-sm font-bold text-blue-800 leading-relaxed italic">"Hallelujah! Your profile is verified. You are recognized as a trusted member of the Lifestyle Connect family."</p>
                        <div className="flex items-center justify-center gap-2 text-blue-600 font-black text-[10px] uppercase tracking-[0.2em] py-4 bg-white rounded-2xl shadow-sm">
                          <CheckCircle size={16} fill="currentColor" /> Identity Confirmed
                        </div>
                      </div>
                    )}
                  </section>

                  {/* Email Account Section */}
                  <section className={`p-10 rounded-[3.5rem] border-4 shadow-xl transition-all ${
                    user.emailVerified ? 'bg-green-50 border-green-100' : 'bg-amber-50 border-amber-100'
                  }`}>
                    <div className="flex items-center justify-between mb-6">
                      <h3 className={`text-xl font-black uppercase tracking-tight flex items-center gap-3 ${
                        user.emailVerified ? 'text-green-900' : 'text-amber-900'
                      }`}>
                        <Mail className={user.emailVerified ? 'text-green-600' : 'text-amber-600'} />
                        Email Account
                      </h3>
                      <span className={`text-[10px] font-black uppercase tracking-widest px-4 py-1.5 rounded-full ${
                        user.emailVerified ? 'bg-green-600 text-white' : 'bg-amber-500 text-white'
                      }`}>
                        {user.emailVerified ? 'Verified' : 'Not Verified'}
                      </span>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-bold text-gray-800 leading-relaxed">
                            Current Email: <span className="text-gray-600">{user.email}</span>
                          </p>
                          {!user.emailVerified && (
                            <p className="text-xs font-bold text-amber-700 mt-1">
                              Please verify your email to ensure account security
                            </p>
                          )}
                        </div>
                        
                        {/* Show edit button only for password users */}
                        {auth.currentUser?.providerData.some(provider => provider.providerId === 'password') && (
                          <button
                            onClick={() => setShowEmailEdit(true)}
                            className="px-4 py-2 bg-white text-amber-600 rounded-xl font-black text-xs uppercase tracking-widest border-2 border-amber-200 hover:bg-amber-50 transition-colors"
                          >
                            Edit Email
                          </button>
                        )}
                      </div>

                      {!user.emailVerified && (
                        <button
                          onClick={handleResendVerification}
                          disabled={saving}
                          className="w-full py-3 bg-white text-amber-600 rounded-2xl font-black shadow-sm hover:bg-amber-50 transition-colors flex items-center justify-center gap-2 border-2 border-amber-200"
                        >
                          {saving ? <Loader2 className="animate-spin" size={16} /> : <><Mail size={16} /> Resend Verification Email</>}
                        </button>
                      )}

                      {emailError && (
                        <div className="p-3 bg-red-50 rounded-xl border-2 border-red-100">
                          <p className="text-xs font-bold text-red-700">{emailError}</p>
                        </div>
                      )}

                      {emailSuccess && (
                        <div className="p-3 bg-green-50 rounded-xl border-2 border-green-100">
                          <p className="text-xs font-bold text-green-700">{emailSuccess}</p>
                        </div>
                      )}
                    </div>
                  </section>

                  <section className="bg-rose-50 p-10 rounded-[3.5rem] border-4 border-white shadow-xl">
                    <h3 className="text-xl font-black text-rose-950 uppercase tracking-tight mb-8 flex items-center gap-3">
                      <Church className="text-rose-600" /> Spiritual Foundation
                    </h3>
                    <div className="space-y-6">
                      <ProfileDetail label="Discernment" value={formData.spiritualMaturity} />
                      <ProfileDetail label="Church Life" value={formData.attendsChurch ? 'Attends Regularly' : 'Prays from Home'} />
                      {formData.attendsChurch && (
                        <>
                          <ProfileDetail label="Congregation" value={formData.churchName} />
                          <ProfileDetail label="Status" value={formData.servesInChurch ? `Serves in ${formData.department}` : 'Dedicated Member'} />
                        </>
                      )}
                      <div className="pt-6 border-t border-rose-200 flex items-center gap-2 text-rose-600 font-black text-[10px] uppercase tracking-widest">
                        <ShieldCheck size={14} strokeWidth={3} /> Integrity Vow Accepted
                      </div>
                    </div>
                  </section>

                  <section className="bg-blue-50 p-10 rounded-[3.5rem] border-4 border-white shadow-xl">
                    <h3 className="text-xl font-black text-blue-950 uppercase tracking-tight mb-8 flex items-center gap-3">
                      <UserCheck className="text-blue-600" /> Personal History
                    </h3>
                    <div className="space-y-6">
                      <ProfileDetail label="Marital Status" value={formData.maritalStatus} />
                      <ProfileDetail label="Children" value={formData.hasChildren ? `${formData.numberOfChildren} Child(ren)` : 'No Children'} />
                      <ProfileDetail label="Wants More?" value={formData.wantsChildren} />
                    </div>
                  </section>
                </>
              ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-left-4 duration-300">
                  <div className="p-10 bg-indigo-50/50 rounded-[4rem] border-2 border-indigo-100">
                    <h4 className="text-2xl font-black text-indigo-950 mb-6 flex items-center gap-2"><Sparkles className="text-indigo-600" /> Spiritual Discernment</h4>
                    <EditField label="Maturity Level">
                      <select 
                        value={formData.spiritualMaturity} 
                        onChange={e => updateField('spiritualMaturity', e.target.value as SpiritualMaturity)} 
                        className="edit-input"
                      >
                        <option value="'Nepios', a baby">'Nepios', a baby</option>
                        <option value="'Teknon', growing">'Teknon', growing</option>
                        <option value="'Huios', mature">'Huios', mature</option>
                      </select>
                    </EditField>
                  </div>

                  <div className="space-y-8 p-10 bg-blue-50/50 rounded-[4rem] border-2 border-blue-100">
                    <h4 className="text-2xl font-black text-blue-950 mb-4 flex items-center gap-2"><Baby /> Family History</h4>
                    <div className="space-y-6">
                      <EditField label="Marital Status">
                        <select value={formData.maritalStatus} onChange={e => updateField('maritalStatus', e.target.value)} className="edit-input">
                          <option value="Never Married">Never Married</option>
                          <option value="Divorced">Divorced</option>
                        </select>
                      </EditField>
                      <EditField label="Do you have children?">
                        <select value={formData.hasChildren ? 'true' : 'false'} onChange={e => updateField('hasChildren', e.target.value === 'true')} className="edit-input">
                          <option value="true">Yes</option>
                          <option value="false">No</option>
                        </select>
                      </EditField>
                      {formData.hasChildren && (
                        <EditField label="How many children?">
                          <input type="number" value={formData.numberOfChildren} onChange={e => updateField('numberOfChildren', parseInt(e.target.value))} className="edit-input" />
                        </EditField>
                      )}
                      <EditField label="Would you like (more) children?">
                        <select value={formData.wantsChildren} onChange={e => updateField('wantsChildren', e.target.value)} className="edit-input">
                          <option value="Yes">Yes</option>
                          <option value="No">No</option>
                          <option value="Maybe">Maybe</option>
                        </select>
                      </EditField>
                    </div>
                  </div>

                  <div className="p-10 bg-gray-50 rounded-[4rem] border-2 border-gray-100">
                    <h4 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2"><Briefcase /> Vocation</h4>
                    <div className="space-y-6">
                      <EditField label="Profession">
                        <input value={formData.profession} onChange={e => updateField('profession', e.target.value)} className="edit-input" />
                      </EditField>
                      <EditField label="About Your Heart">
                        <textarea value={formData.bio} onChange={e => updateField('bio', e.target.value)} className="edit-input min-h-[120px]" />
                      </EditField>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="space-y-12">
              {!isEditing ? (
                <>
                  <section>
                    <h3 className="text-xl font-black text-rose-950 uppercase tracking-tight mb-8 flex items-center gap-3">
                      <ImageIcon className="text-rose-600" /> Photo Gallery
                    </h3>
                    <div className="grid grid-cols-2 gap-4">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-3xl overflow-hidden shadow-md group">
                          <img src={img} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                          {idx === 0 && (
                            <div className="absolute top-2 left-2 bg-rose-600 text-white text-[8px] font-black uppercase px-2 py-1 rounded-full">Profile</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                  <section>
                    <h3 className="text-xl font-black text-rose-950 uppercase tracking-tight mb-6 flex items-center gap-3">
                      <Heart className="text-rose-500" fill="currentColor" /> About My Journey
                    </h3>
                    <p className="text-rose-900 font-extrabold italic text-xl leading-relaxed px-4">"{formData.bio}"</p>
                  </section>
                </>
              ) : (
                <div className="space-y-12 animate-in fade-in slide-in-from-right-4 duration-300">
                  <div className="p-10 bg-rose-50/30 rounded-[4rem] border-2 border-rose-100">
                    <div className="flex justify-between items-center mb-6">
                      <h4 className="text-2xl font-black text-rose-950 flex items-center gap-2"><ImageIcon /> Photo Gallery</h4>
                      <span className="text-xs font-black text-rose-400">{formData.images.length}/10 Photos</span>
                    </div>
                    
                    <div className="grid grid-cols-3 gap-4 mb-8">
                      {formData.images.map((img, idx) => (
                        <div key={idx} className="relative aspect-square rounded-2xl overflow-hidden group border-2 border-white shadow-sm">
                          <img src={img} crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-full object-cover" />
                          {idx !== 0 && (
                            <button 
                              onClick={() => removeGalleryImage(idx)}
                              className="absolute top-1 right-1 p-1.5 bg-rose-600 text-white rounded-lg opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      ))}
                      {formData.images.length < 10 && (
                        <button 
                          onClick={() => galleryInputRef.current?.click()}
                          className="aspect-square rounded-2xl border-2 border-dashed border-rose-200 flex flex-col items-center justify-center text-rose-400 hover:bg-white transition-all bg-rose-50/50"
                        >
                          <Plus size={24} />
                          <span className="text-[10px] font-black uppercase mt-1">Add Photo</span>
                        </button>
                      )}
                      <input ref={galleryInputRef} type="file" hidden multiple accept="image/*" onChange={(e) => handleFileChange(e, 'gallery')} />
                    </div>

                    <h4 className="text-2xl font-black text-rose-950 mb-4 flex items-center gap-2"><Church /> Church Life</h4>
                    <div className="space-y-6">
                      <EditField label="Faith Foundation">
                        <select value={formData.attendsChurch ? 'true' : 'false'} onChange={e => updateField('attendsChurch', e.target.value === 'true')} className="edit-input">
                          <option value="true">Regularly Attend</option>
                          <option value="false">Pray from Home</option>
                        </select>
                      </EditField>
                      {formData.attendsChurch && (
                        <>
                          <EditField label="Church Name">
                            <input value={formData.churchName} onChange={e => updateField('churchName', e.target.value)} className="edit-input" />
                          </EditField>
                          <EditField label="Service Status">
                            <select value={formData.servesInChurch ? 'true' : 'false'} onChange={e => updateField('servesInChurch', e.target.value === 'true')} className="edit-input">
                              <option value="true">I Serve</option>
                              <option value="false">Dedicated Member</option>
                            </select>
                          </EditField>
                          {formData.servesInChurch && (
                            <EditField label="Department">
                              <input value={formData.department} onChange={e => updateField('department', e.target.value)} className="edit-input" />
                            </EditField>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Membership & Tiers Section */}
          <div className="mt-20 pt-16 border-t border-gray-100">
            <h3 className="text-2xl font-black text-rose-950 mb-8 flex items-center gap-3">
              <Zap className="text-amber-500" fill="currentColor" /> Membership Tiers
            </h3>
            
            {/* --- LOCAL ZIMBABWE TIERS --- */}
            {isLocal ? (
              <div className="grid md:grid-cols-2 gap-8">
                {/* Local Tier 2 */}
                <div className={`p-10 rounded-[3.5rem] border-4 transition-all ${user.tier === 'tier2' ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100 shadow-xl'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-black text-rose-950">Premium</h4>
                      <p className="text-xs font-black text-rose-400 uppercase tracking-widest">$10 / MONTH</p>
                    </div>
                    {user.tier === 'tier2' && <CheckCircle className="text-green-500" size={32} fill="currentColor" />}
                  </div>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><Globe size={16} className="text-rose-600" /> Diaspora Connections</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><Video size={16} className="text-rose-600" /> Video Calling</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><MapPin size={16} className="text-rose-600" /> Filter by Church & City</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><GiftIcon size={16} className="text-rose-600" /> Gift Buying Access</li>
                  </ul>
                  {user.tier === 'free' && (
                    <button 
                      onClick={() => initiateUpgrade('tier2', 10, 'Upgrade to Premium', 'Unlock Diaspora connections, video calls, and advanced filters.')}
                      className="w-full py-5 bg-rose-600 text-white rounded-[2rem] font-black shadow-lg hover:scale-105 transition-all"
                    >
                      Upgrade to Premium
                    </button>
                  )}
                  {user.tier === 'tier2' && <p className="text-center font-black text-rose-600 text-xs uppercase tracking-widest">Active Membership</p>}
                </div>

                {/* Local Tier 3 */}
                <div className={`p-10 rounded-[3.5rem] border-4 transition-all ${user.tier === 'tier3' ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100 shadow-xl'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-black text-rose-950">Elite</h4>
                      <p className="text-xs font-black text-rose-400 uppercase tracking-widest">$20 / MONTH</p>
                    </div>
                    {user.tier === 'tier3' && <CheckCircle className="text-green-500" size={32} fill="currentColor" />}
                  </div>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><Star size={16} className="text-amber-500" fill="currentColor" /> All Premium Features</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><Truck size={16} className="text-amber-500" /> Special Gift Delivery Service</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><ShieldCheck size={16} className="text-amber-500" /> Never Married & No Kids Filters</li>
                  </ul>
                  {user.tier !== 'tier3' && (
                    <button 
                      onClick={() => initiateUpgrade('tier3', 20, 'Upgrade to Elite', 'Unlock special delivery services and exclusive life-history filters.')}
                      className="w-full py-5 bg-amber-500 text-white rounded-[2rem] font-black shadow-lg hover:scale-105 transition-all"
                    >
                      Upgrade to Elite
                    </button>
                  )}
                  {user.tier === 'tier3' && <p className="text-center font-black text-amber-600 text-xs uppercase tracking-widest">Active Membership</p>}
                </div>
              </div>
            ) : (
              /* --- DIASPORA CONNECT TIERS --- */
              <div className="grid md:grid-cols-2 gap-8">
                {/* Diaspora Tier 2 */}
                <div className={`p-10 rounded-[3.5rem] border-4 transition-all ${user.tier === 'diaspora_premium' ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-100 shadow-xl'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-black text-blue-950">Diaspora Premium</h4>
                      <p className="text-xs font-black text-blue-400 uppercase tracking-widest">$20 / MONTH</p>
                    </div>
                    {user.tier === 'diaspora_premium' && <CheckCircle className="text-blue-500" size={32} fill="currentColor" />}
                  </div>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><Globe size={16} className="text-blue-600" /> Zimbabwe & Global Access</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><Video size={16} className="text-blue-600" /> Video Calling</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><MapPin size={16} className="text-blue-600" /> Filter by Church & City</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><GiftIcon size={16} className="text-blue-600" /> Gift Buying (Send to Zim)</li>
                  </ul>
                  {user.tier === 'diaspora_free' && (
                    <button 
                      onClick={() => initiateUpgrade('diaspora_premium', 20, 'Upgrade to Diaspora Premium', 'Unlock connections back home, video calls, and advanced filters.')}
                      className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-lg hover:scale-105 transition-all"
                    >
                      Upgrade to Premium
                    </button>
                  )}
                  {user.tier === 'diaspora_premium' && <p className="text-center font-black text-blue-600 text-xs uppercase tracking-widest">Active Membership</p>}
                </div>

                {/* Diaspora Tier 3 */}
                <div className={`p-10 rounded-[3.5rem] border-4 transition-all ${user.tier === 'diaspora_vetted' ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-100 shadow-xl'}`}>
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h4 className="text-2xl font-black text-indigo-950">Elite Vetted</h4>
                      <p className="text-xs font-black text-indigo-400 uppercase tracking-widest">$50 / MONTH</p>
                    </div>
                    {user.tier === 'diaspora_vetted' && <CheckCircle className="text-indigo-500" size={32} fill="currentColor" />}
                  </div>
                  <ul className="space-y-4 mb-10">
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><ShieldCheck size={16} className="text-amber-500" /> Concierge Physical Vetting</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><Star size={16} className="text-amber-500" fill="currentColor" /> All Premium Features</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><Truck size={16} className="text-amber-500" /> Special Gift Delivery Service</li>
                    <li className="flex items-center gap-3 text-sm font-bold text-gray-600"><Baby size={16} className="text-amber-500" /> Elite Life History Filters</li>
                  </ul>
                  {user.tier !== 'diaspora_vetted' && (
                    <button 
                      onClick={() => initiateUpgrade('diaspora_vetted', 50, 'Upgrade to Elite Vetted', 'Unlock concierge face-to-face vetting and special delivery services.')}
                      className="w-full py-5 bg-indigo-900 text-white rounded-[2rem] font-black shadow-lg hover:scale-105 transition-all"
                    >
                      Upgrade to Elite Vetted
                    </button>
                  )}
                  {user.tier === 'diaspora_vetted' && <p className="text-center font-black text-indigo-600 text-xs uppercase tracking-widest">Active Membership</p>}
                </div>
              </div>
            )}
          </div>

          {/* Account Settings Section */}
          <div className="mt-20 pt-16 border-t border-gray-100">
            <h3 className="text-2xl font-black text-rose-950 mb-8 flex items-center gap-3">
              <ShieldCheck className="text-gray-400" /> Account Management
            </h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              {/* Hide Profile */}
              <button 
                onClick={handleToggleHide}
                className="group flex flex-col items-start p-8 rounded-[2.5rem] bg-gray-50 hover:bg-white border-4 border-transparent hover:border-amber-50 shadow-sm hover:shadow-xl transition-all text-left"
              >
                <div className="p-3 bg-white rounded-2xl text-amber-500 mb-6 group-hover:scale-110 transition-transform">
                  {user.isHidden ? <Eye size={24} /> : <EyeOff size={24} />}
                </div>
                <h4 className="font-black text-rose-950 mb-2">{user.isHidden ? 'Unhide Profile' : 'Hide Profile'}</h4>
                <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                  Need a break? Hide your profile and continue to use our community service to find prayer partners or join in community prayers.
                </p>
              </button>

              {/* Cancel Subscription */}
              <button 
                onClick={handleCancelSubscription}
                disabled={user.tier === 'free' || user.tier === 'diaspora_free'}
                className="group flex flex-col items-start p-8 rounded-[2.5rem] bg-gray-50 hover:bg-white border-4 border-transparent hover:border-rose-50 shadow-sm hover:shadow-xl transition-all text-left disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <div className="p-3 bg-white rounded-2xl text-rose-600 mb-6 group-hover:scale-110 transition-transform">
                  <Ban size={24} />
                </div>
                <h4 className="font-black text-rose-950 mb-2">Cancel Subscription</h4>
                <p className="text-[10px] font-bold text-gray-500 leading-relaxed">
                  Stop automatic billing. You will be placed back on the free tier immediately.
                </p>
              </button>

              {/* Delete Profile */}
              <button 
                onClick={handleDeleteProfile}
                className="group flex flex-col items-start p-8 rounded-[2.5rem] bg-rose-50/50 hover:bg-rose-600 border-4 border-transparent hover:border-rose-700 shadow-sm hover:shadow-xl transition-all text-left"
              >
                <div className="p-3 bg-white rounded-2xl text-red-600 mb-6 group-hover:scale-110 transition-transform">
                  <Trash2 size={24} />
                </div>
                <h4 className="font-black text-rose-950 group-hover:text-white mb-2">Delete Profile</h4>
                <p className="text-[10px] font-bold text-gray-500 group-hover:text-rose-100 leading-relaxed">
                  Permanently remove your data from Lifestyle Connect. Consider hiding your profile instead.
                </p>
              </button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Email Edit Modal */}
      {showEmailEdit && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-[3rem] p-8 max-w-md w-full shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-black text-rose-950">Update Email</h3>
              <button
                onClick={() => {
                  setShowEmailEdit(false);
                  setEmailError('');
                  setEmailSuccess('');
                  setNewEmail('');
                  setEmailPassword('');
                }}
                className="p-2 rounded-xl hover:bg-gray-100 transition-colors"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  New Email Address
                </label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  placeholder="Enter new email"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-rose-100 outline-none font-bold text-gray-900"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 block">
                  Current Password
                </label>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={(e) => setEmailPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 border-2 border-transparent focus:border-rose-100 outline-none font-bold text-gray-900"
                />
              </div>

              <div className="p-4 bg-amber-50 rounded-xl border-2 border-amber-100">
                <div className="flex items-start gap-3">
                  <Lock size={16} className="text-amber-600 mt-1" />
                  <div>
                    <p className="text-xs font-bold text-amber-800 mb-1">
                      Security Notice
                    </p>
                    <p className="text-xs text-amber-700 leading-relaxed">
                      For security, you'll need to re-authenticate with your current password. A verification email will be sent to your new address.
                    </p>
                  </div>
                </div>
              </div>

              {emailError && (
                <div className="p-3 bg-red-50 rounded-xl border-2 border-red-100">
                  <p className="text-xs font-bold text-red-700">{emailError}</p>
                </div>
              )}

              <div className="flex gap-4">
                <button
                  onClick={() => {
                    setShowEmailEdit(false);
                    setEmailError('');
                    setEmailSuccess('');
                    setNewEmail('');
                    setEmailPassword('');
                  }}
                  className="flex-1 py-3 bg-gray-100 text-gray-700 rounded-xl font-black hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleEmailUpdate}
                  disabled={saving || !newEmail || !emailPassword}
                  className="flex-1 py-3 bg-rose-600 text-white rounded-xl font-black hover:bg-rose-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {saving ? <Loader2 className="animate-spin" size={16} /> : 'Update Email'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      <PaymentModal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        amount={pendingUpgrade?.amount || 0} 
        title={pendingUpgrade?.title || ''} 
        description={pendingUpgrade?.desc || ''} 
        onSuccess={handlePaymentSuccess} 
      />

      <style>{`
        .edit-input {
          width: 100%;
          padding: 1rem 1.5rem;
          border-radius: 1.5rem;
          background: white;
          border: 2px solid #FEE2E2;
          font-weight: 800;
          outline: none;
          color: #111827;
          transition: all 0.2s;
        }
        .edit-input:focus {
          border-color: #E11D48;
          box-shadow: 0 0 0 4px rgba(225, 29, 72, 0.05);
        }
      `}</style>
    </div>
  );
};

const ProfileDetail = ({ label, value }: any) => (
  <div className="flex justify-between items-center py-1">
    <span className="text-[10px] font-black text-rose-400 uppercase tracking-widest">{label}</span>
    <span className="font-black text-rose-950 text-lg">{value || '---'}</span>
  </div>
);

const EditField = ({ label, children }: any) => (
  <div className="space-y-2">
    <label className="text-[10px] font-black text-rose-400 uppercase tracking-[0.2em] ml-4">{label}</label>
    {children}
  </div>
);

export default ProfilePage;
