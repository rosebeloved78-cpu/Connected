
import React, { useState, useRef } from 'react';
import { User } from '../types';
import { User as UserIcon, ShieldCheck, Heart, Baby, Church, Briefcase, MapPin, CheckCircle, Plus, Check, X, UserCheck, Camera, Image as ImageIcon, Trash2, Loader2, EyeOff, Eye, Ban, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { useNavigate } from 'react-router-dom';

const ProfilePage: React.FC<{ user: User; onUpdate: (user: User) => void }> = ({ user, onUpdate }) => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({ ...user });
  const [isEditing, setIsEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const { refreshProfile, logout } = useAuth();
  
  const profileInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

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
          // Optional: handle auth user deletion if needed, but for now we just log out
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
                  <section className="bg-rose-50 p-10 rounded-[3.5rem] border-4 border-white shadow-xl">
                    <h3 className="text-xl font-black text-rose-950 uppercase tracking-tight mb-8 flex items-center gap-3">
                      <Church className="text-rose-600" /> Spiritual Foundation
                    </h3>
                    <div className="space-y-6">
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
                          <img src={img} className="w-full h-full object-cover" />
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
