
import React, { useState, useEffect } from 'react';
import { User } from '../types';
import { Globe, ShieldCheck, CheckCircle2, MessageSquare, ArrowLeft, Star, MapPin, Loader2, Lock, Sparkles, Check } from 'lucide-react';
import { collection, getDocs, query, where, limit } from 'firebase/firestore';
import { db } from '../firebase';
import PaymentModal from '../components/PaymentModal';
import { ADMIN_WHATSAPP } from '../constants';

const DiasporaPage: React.FC<{ user: User }> = ({ user }) => {
  const isTier3Diaspora = user.tier === 'diaspora_vetted';
  const [dbProfiles, setDbProfiles] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedForVetting, setSelectedForVetting] = useState<User | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<{ amount: number, title: string, desc: string } | null>(null);
  const [showWhatsAppLink, setShowWhatsAppLink] = useState(false);

  useEffect(() => {
    const fetchProfiles = async () => {
      try {
        const q = query(collection(db, 'users'), where("isDiaspora", "==", false), limit(50));
        const snapshot = await getDocs(q);
        const fetched: User[] = snapshot.docs
          .map(doc => ({ id: doc.id, ...doc.data() } as User))
          .filter(u => !u.isHidden);
        setDbProfiles(fetched);
      } catch (err) { console.error(err); } finally { setLoading(false); }
    };
    if (user.isDiaspora) fetchProfiles();
    else setLoading(false);
  }, [user.id, user.isDiaspora]);

  const calculateFee = (city: string) => city?.toLowerCase().includes('harare') ? 100 : 200;

  const handleVettingPayment = (targetUser: User) => {
    if (!isTier3Diaspora) {
        alert("This exclusive service requires Diaspora Tier 3 (Elite Vetted) membership.");
        return;
    }
    const fee = calculateFee(targetUser.city);
    setPaymentConfig({ 
      amount: fee, 
      title: `Concierge Vetting: ${targetUser.name}`, 
      desc: `Comprehensive face-to-face verification, background check, and etiquette coaching for your potential partner in ${targetUser.city}.` 
    });
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    setShowWhatsAppLink(true);
  };

  if (!user.isDiaspora) {
     return (
      <div className="max-w-2xl mx-auto py-32 text-center animate-in fade-in duration-700"> 
        <ShieldCheck size={80} className="text-rose-100 mx-auto mb-8" /> 
        <h1 className="text-4xl font-black text-rose-950 mb-4 uppercase tracking-tighter">Concierge Services</h1> 
        <p className="text-gray-500 font-bold px-12 leading-relaxed">Our Concierge Vetting is an exclusive service for Diaspora members to verify the integrity and background of local Zimbabwean matches through face-to-face interaction.</p> 
      </div>
     );
  }

  if (selectedForVetting) {
    const fee = calculateFee(selectedForVetting.city);
    
    if (showWhatsAppLink) return (
        <div className="max-w-md mx-auto py-32 text-center animate-in zoom-in duration-500">
            <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-green-50"><CheckCircle2 size={48} className="text-green-600" /></div>
            <h2 className="text-3xl font-black text-green-900 mb-4 tracking-tight">Vetting Service Activated</h2>
            <p className="text-gray-600 font-bold mb-8 leading-relaxed">Your Concierge Vetting fee has been received. Please click below to coordinate the logistics and schedule with our Zimbabwean site administrator.</p>
            <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=I have just paid for the Concierge Vetting of ${selectedForVetting.name} in ${selectedForVetting.city}. Please help me coordinate the logistics.`} target="_blank" rel="noreferrer" className="w-full py-6 bg-green-500 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-green-600 transition-all flex items-center justify-center gap-3"><MessageSquare size={28} /> Coordinate via WhatsApp</a>
            <button onClick={() => { setSelectedForVetting(null); setShowWhatsAppLink(false); }} className="mt-8 text-gray-400 font-bold text-sm hover:text-rose-600 transition-colors">Return to Directory</button>
        </div>
    );

    return (
      <div className="max-w-3xl mx-auto px-4 py-12 pb-32 animate-in slide-in-from-right-10 duration-500">
        <button onClick={() => setSelectedForVetting(null)} className="flex items-center gap-2 text-rose-950 font-black mb-10 uppercase text-xs tracking-widest hover:text-rose-600 transition-colors"><ArrowLeft size={18} /> Back to Directory</button>
        
        <div className="bg-white rounded-[4rem] shadow-2xl border-4 border-blue-50 overflow-hidden">
          <div className="bg-gradient-to-br from-blue-700 to-indigo-900 p-12 text-white relative">
            <Globe className="absolute top-0 right-0 w-64 h-64 -translate-y-1/2 translate-x-1/4 opacity-10" />
            <h2 className="text-5xl font-black mb-2 tracking-tighter">Elite Concierge Vetting</h2>
            <p className="opacity-80 font-black uppercase text-[10px] tracking-[0.4em] flex items-center gap-2">
              <Sparkles size={12} className="text-amber-300" /> Exclusive Tier 3 Premium Service
            </p>
          </div>
          
          <div className="p-12 space-y-12">
            <div className="flex items-center gap-8 p-10 bg-blue-50/50 rounded-[3.5rem] border-2 border-blue-50">
               <img src={selectedForVetting.images?.[0]} crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-32 h-32 rounded-[2.5rem] object-cover shadow-2xl border-4 border-white" alt={selectedForVetting.name} />
              <div> 
                <h3 className="text-4xl font-black text-gray-900 tracking-tight">{selectedForVetting.name}</h3> 
                <p className="text-blue-600 font-black flex items-center gap-2 uppercase text-xs mt-2"><MapPin size={16} fill="currentColor" /> Based in {selectedForVetting.city}, Zimbabwe</p> 
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-gray-50 rounded-[3rem] p-10 flex flex-col items-center justify-center text-center border-2 border-transparent hover:border-blue-100 transition-colors"> 
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Service Fee</p> 
                <p className="text-6xl font-black text-gray-900 mb-2 tracking-tighter">${fee}</p> 
                <p className="text-xs font-black text-blue-600 uppercase tracking-widest"> {fee === 100 ? "Harare Central" : "Regional Zimbabwe"} </p> 
              </div>

              <div className="bg-blue-50/30 rounded-[3rem] p-10 space-y-4">
                <h4 className="font-black text-blue-900 uppercase text-xs tracking-widest">What's Included:</h4>
                <ul className="space-y-3">
                  {[
                    "Face-to-face identity verification",
                    "Background & Church check",
                    "Free lunch for user with Admin",
                    "Grooming & Etiquette assessment",
                    "Post-vetting integrity report"
                  ].map((item, i) => (
                    <li key={i} className="flex items-start gap-3 text-xs font-bold text-gray-600">
                      <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5"><Check size={12} className="text-blue-600" /></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 p-6 rounded-3xl flex items-center gap-4 border border-amber-100">
              <ShieldCheck className="text-amber-600 shrink-0" size={24} />
              <p className="text-xs font-bold text-amber-900 leading-relaxed">
                By proceeding, you agree to sponsor a physical vetting session. The user must consent to a complimentary meeting with our site admin to verify their profile details.
              </p>
            </div>

            <button 
              onClick={() => handleVettingPayment(selectedForVetting)} 
              className={`w-full py-8 text-white rounded-[2.5rem] font-black text-2xl shadow-2xl transition-all flex items-center justify-center gap-4 ${isTier3Diaspora ? 'bg-blue-600 hover:bg-blue-700 hover:scale-[1.01] active:scale-95 shadow-blue-100' : 'bg-gray-300 opacity-50 cursor-not-allowed'}`}
            >
               {!isTier3Diaspora && <Lock size={24} />} 
               {isTier3Diaspora ? `Initiate Vetting for $${fee}` : 'Upgrade to Elite (Tier 3) to Vet'}
            </button>
          </div>
        </div>

        <PaymentModal 
          isOpen={paymentModalOpen} 
          onClose={() => setPaymentModalOpen(false)} 
          amount={paymentConfig?.amount || 0} 
          title={paymentConfig?.title || ''} 
          description={paymentConfig?.desc || ''} 
          onSuccess={handlePaymentSuccess} 
        />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 pb-32 animate-in fade-in duration-700">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-6"> 
          <div className="bg-blue-600 p-5 rounded-[2.5rem] text-white shadow-2xl shadow-blue-100">
            <Globe size={32} />
          </div> 
          <div> 
            <h1 className="text-4xl md:text-5xl font-black text-rose-950 uppercase tracking-tighter">Concierge Vetting</h1> 
            <p className="text-blue-500 font-black uppercase text-[10px] tracking-[0.4em] mt-1">Tier 3 Elite Global Service</p> 
          </div> 
        </div>

        {isTier3Diaspora ? (
          <div className="bg-white p-6 rounded-[2rem] border-4 border-blue-50 shadow-xl flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600"><Star fill="currentColor" size={24} /></div>
            <div>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Active Status</p>
              <p className="text-lg font-black text-blue-900 tracking-tight">Elite Tier 3 Member</p>
            </div>
          </div>
        ) : (
          <div className="bg-indigo-900 p-6 rounded-[2rem] text-white shadow-2xl flex items-center gap-4 max-w-xs transition-transform hover:scale-[1.02]">
            <Lock className="text-amber-400" size={24} />
            <p className="text-xs font-black leading-tight uppercase tracking-wider">Upgrade to Tier 3 for physical vetting access.</p>
          </div>
        )}
      </div>

      <div className="mb-12 bg-white p-10 rounded-[4rem] border-4 border-rose-50 shadow-inner">
        <h2 className="text-2xl font-black text-rose-950 mb-4 flex items-center gap-3"><Sparkles className="text-amber-400" /> Vetting Directory</h2>
        <p className="text-gray-500 font-bold max-w-2xl mb-10">Select a potential partner based in Zimbabwe to initiate our signature Concierge Vetting process. We provide boots on the ground to ensure your peace of mind.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
          {loading ? (
            <div className="flex flex-col items-center justify-center p-20 col-span-full gap-4">
              <Loader2 className="animate-spin text-blue-600" size={48} />
              <p className="text-xs font-black text-gray-400 uppercase tracking-[0.2em]">Searching Local Directory...</p>
            </div>
          ) : dbProfiles.map(profile => (
              <div key={profile.id} className="bg-white rounded-[3.5rem] overflow-hidden border-4 border-gray-50 shadow-2xl hover:border-blue-100 transition-all group flex flex-col h-full">
                  <div className="relative aspect-[3/4] overflow-hidden">
                       <img src={profile.images?.[0]} crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={profile.name} />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-transparent" />
                      <div className="absolute bottom-0 inset-x-0 p-10"> 
                        <p className="text-blue-400 text-[10px] font-black uppercase flex items-center gap-2 mb-2"><MapPin size={12} fill="currentColor" /> {profile.city}, Zimbabwe</p> 
                        <h3 className="text-3xl font-black text-white tracking-tight">{profile.name}, {profile.age}</h3> 
                        <p className="text-white/60 text-[9px] font-bold uppercase tracking-widest mt-1">{profile.churchName || "Christian Believer"}</p>
                      </div>
                  </div>
                  <div className="p-10 mt-auto"> 
                    <button 
                      onClick={() => setSelectedForVetting(profile)} 
                      className="w-full py-5 bg-blue-600 text-white rounded-[2rem] font-black text-sm flex items-center justify-center gap-3 shadow-xl hover:bg-blue-700 active:scale-95 transition-all shadow-blue-100"
                    > 
                      <ShieldCheck size={20} /> Request Vetting 
                    </button> 
                  </div>
              </div>
          ))}
          {!loading && dbProfiles.length === 0 && (
            <div className="col-span-full py-20 text-center border-4 border-dashed border-gray-100 rounded-[3rem]">
              <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No local users available for vetting at this time.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DiasporaPage;
