
import React, { useState, useEffect, useMemo } from 'react';
import { User, Tier } from '../types';
import { Heart, X, Sparkles, MapPin, SlidersHorizontal, Coffee, Lock, Loader2, Zap, Armchair, ShieldCheck, Globe } from 'lucide-react';
import { collection, getDocs, query, limit, addDoc, serverTimestamp, where } from 'firebase/firestore';
import { db } from '../firebase';
import PaymentModal from '../components/PaymentModal';
import { useNavigate, Link } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";

interface FeedPageProps {
  user: User;
  onUpdateUser: (user: User) => void;
}

const FeedPage: React.FC<FeedPageProps> = ({ user, onUpdateUser }) => {
  const navigate = useNavigate();
  const [dbUsers, setDbUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [aiInsight, setAiInsight] = useState<{ id: string, text: string } | null>(null);
  const [loadingAiId, setLoadingAiId] = useState<string | null>(null);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [pendingUpgrade, setPendingUpgrade] = useState<{ tier: Tier, amount: number, title: string, desc: string } | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const [locationView, setLocationView] = useState<'city' | 'country' | 'global'>(user.isDiaspora ? 'country' : 'city');
  const [ageRange, setAgeRange] = useState({ min: 18, max: 45 });
  const [targetOrigin, setTargetOrigin] = useState<'local' | 'diaspora'>(user.isDiaspora ? 'diaspora' : 'local'); 
  const [filterChurch, setFilterChurch] = useState('');
  const [filterMarital, setFilterMarital] = useState<'Any' | 'Never Married'>('Any');
  const [filterChildren, setFilterChildren] = useState<'Any' | 'No Children'>('Any');

  const isLocal = !user.isDiaspora;
  const localTier2OrHigher = user.tier === 'tier2' || user.tier === 'tier3';
  const localTier3 = user.tier === 'tier3';
  const diasporaTier2OrHigher = user.tier === 'diaspora_premium' || user.tier === 'diaspora_vetted';

  const canLocalSeeWholeZim = isLocal;
  const canDiasporaSeeWholeCountry = user.isDiaspora; 
  const canDiasporaSeeGlobal = user.isDiaspora && diasporaTier2OrHigher;
  
  const canLocalSeeDiaspora = isLocal && localTier2OrHigher;
  const canDiasporaSeeZim = user.isDiaspora && diasporaTier2OrHigher;

  const canFilterChurch = (isLocal && localTier2OrHigher) || (user.isDiaspora && diasporaTier2OrHigher);
  const canFilterHistory = (isLocal && localTier3) || (user.isDiaspora && diasporaTier2OrHigher);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const usersRef = collection(db, 'users');
        const q = query(usersRef, limit(200)); 
        const snapshot = await getDocs(q);
        const fetched: User[] = [];
        snapshot.forEach((doc) => {
          const u = { id: doc.id, ...doc.data() } as User;
          if (u.id !== user.id && !u.isHidden) fetched.push(u);
        });
        setDbUsers(fetched);
      } catch (error) {
        console.error("Error fetching matches:", error);
      } finally {
        setLoadingUsers(false);
      }
    };
    fetchUsers();
  }, [user.id]);

  const generateSpiritualDiscernment = async (match: User) => {
    setLoadingAiId(match.id);
    setAiInsight(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });
      const prompt = `You are a spiritual advisor for 'Lifestyle Connect', a Zimbabwean Christian dating app. 
      Analyze the spiritual compatibility between these two believers based on their spiritual walk and church life:
      
      PERSON 1 (ME):
      Name: ${user.name}
      Maturity Level: ${user.spiritualMaturity || "'Teknon', growing"}
      Church: ${user.churchName || 'Not specified'}
      Serving: ${user.servesInChurch ? `Serves in ${user.department}` : 'Dedicated Member'}
      Bio Snippet: ${user.bio.substring(0, 100)}

      PERSON 2 (MATCH):
      Name: ${match.name}
      Maturity Level: ${match.spiritualMaturity || "'Teknon', growing"}
      Church: ${match.churchName || 'Not specified'}
      Serving: ${match.servesInChurch ? `Serves in ${match.department}` : 'Dedicated Member'}
      Bio Snippet: ${match.bio.substring(0, 100)}

      Provide a brief (max 50 words) "Spiritual Discernment" highlighting their shared dedication to Christ. Mention how their biblical maturity (Nepios/Teknon/Huios) and ministry roles might complement each other. Use a warm, faith-based tone.`;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: [{ parts: [{ text: prompt }] }],
      });

      setAiInsight({ id: match.id, text: response.text || "A beautiful spiritual alignment is possible here." });
    } catch (error) {
      console.error("AI Error:", error);
      setAiInsight({ id: match.id, text: "Your shared faith provides a solid foundation for a God-honoring connection." });
    } finally {
      setLoadingAiId(null);
    }
  };

  const filteredMatches = useMemo(() => {
    return dbUsers.filter(m => {
      if (m.gender === user.gender) return false;
      if (m.age < ageRange.min || m.age > ageRange.max) return false;

      if (isLocal) {
        if (targetOrigin === 'diaspora') {
          if (!canLocalSeeDiaspora) return false;
          if (!m.isDiaspora) return false;
        } else {
          if (m.isDiaspora) return false;
          if (locationView === 'city' && m.city !== user.city) return false;
          if (locationView === 'country' && !canLocalSeeWholeZim) return false;
        }
      } else {
        if (targetOrigin === 'local') {
          if (!canDiasporaSeeZim || m.isDiaspora) return false;
        } else {
          if (!m.isDiaspora) return false;
          if (locationView === 'city' && (m.city !== user.city || m.country !== user.country)) return false;
          if (locationView === 'country' && m.country !== user.country) return false;
          if (locationView === 'global' && !canDiasporaSeeGlobal) return false;
        }
      }

      if (filterChurch && canFilterChurch) {
        if (!m.churchName?.toLowerCase().includes(filterChurch.toLowerCase())) return false;
      }
      if (filterMarital === 'Never Married' && canFilterHistory) {
         if (m.maritalStatus !== 'Never Married') return false;
      }
      if (filterChildren === 'No Children' && canFilterHistory) {
        if (m.hasChildren) return false;
      }
      return true;
    });
  }, [dbUsers, user, locationView, ageRange, targetOrigin, filterChurch, filterMarital, filterChildren, canLocalSeeWholeZim, canLocalSeeDiaspora, canDiasporaSeeZim, canDiasporaSeeGlobal, canFilterChurch, canFilterHistory]);

  const initiateUpgrade = (targetTier: Tier, amount: number, title: string, desc: string) => {
    setPendingUpgrade({ tier: targetTier, amount, title, desc });
    setPaymentModalOpen(true);
  };

  const handlePaymentSuccess = () => {
    if (pendingUpgrade) {
      onUpdateUser({ ...user, tier: pendingUpgrade.tier });
      setPaymentModalOpen(false);
      setPendingUpgrade(null);
    }
  };

  const handleConnect = async (targetUser: User) => {
    try {
      await addDoc(collection(db, 'chats'), {
        participants: [user.id, targetUser.id],
        participantNames: { [user.id]: user.name, [targetUser.id]: targetUser.name },
        participantImages: { [user.id]: user.images[0] || '', [targetUser.id]: targetUser.images[0] || '' },
        lastMessage: 'New Connection',
        lastMessageTimestamp: serverTimestamp()
      });
      navigate('/messages');
    } catch (e) { alert("Could not connect."); }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 pb-32">
      <div className="flex items-center justify-between mb-8 max-w-xl mx-auto">
        <div>
           <h1 className="text-3xl font-black text-rose-950 tracking-tight">Discover</h1>
           <p className="text-rose-400 font-bold text-xs uppercase tracking-widest">
             {filteredMatches.length} Soulful Matches
           </p>
        </div>
        <button onClick={() => setShowFilters(!showFilters)} className={`p-4 rounded-2xl transition-all ${showFilters ? 'bg-rose-600 text-white shadow-lg' : 'bg-white text-gray-400 hover:text-rose-600 shadow-sm'}`}>
          <SlidersHorizontal size={20} />
        </button>
      </div>

      <div className="max-w-xl mx-auto bg-white p-6 rounded-[2.5rem] border-2 border-rose-50 shadow-sm mb-6">
        <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest mb-4 block">Age Range: {ageRange.min} - {ageRange.max}</label>
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-gray-300 uppercase w-6">Min</span>
            <input 
              type="range" min="18" max="70" value={ageRange.min} 
              onChange={e => setAgeRange(prev => ({ ...prev, min: Math.min(parseInt(e.target.value), prev.max) }))} 
              className="flex-1 h-1.5 bg-rose-50 rounded-lg appearance-none cursor-pointer accent-rose-600" 
            />
          </div>
          <div className="flex items-center gap-4">
            <span className="text-[9px] font-black text-gray-300 uppercase w-6">Max</span>
            <input 
              type="range" min="18" max="70" value={ageRange.max} 
              onChange={e => setAgeRange(prev => ({ ...prev, max: Math.max(parseInt(e.target.value), prev.min) }))} 
              className="flex-1 h-1.5 bg-rose-50 rounded-lg appearance-none cursor-pointer accent-rose-600" 
            />
          </div>
        </div>
      </div>

      <div className="max-w-xl mx-auto">
        <div className="flex flex-col gap-4 mb-4">
           <div className="bg-white p-1 rounded-2xl border-2 border-rose-50 shadow-sm flex overflow-hidden">
              <button 
                onClick={() => setLocationView('city')} 
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${locationView === 'city' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-300'}`}
              >
                My City
              </button>
              <button 
                onClick={() => {
                  if (user.isDiaspora || canLocalSeeWholeZim) setLocationView('country');
                  else initiateUpgrade('tier2', 10, 'Whole Zimbabwe', 'Search across all cities for $10.');
                }} 
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${locationView === 'country' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-300'}`}
              >
                {(!user.isDiaspora && !canLocalSeeWholeZim) && <Lock size={10} />}
                Whole {user.isDiaspora ? user.country : 'Zim'}
              </button>
              {user.isDiaspora && (
                <button 
                  onClick={() => {
                    if (canDiasporaSeeGlobal) setLocationView('global');
                    else initiateUpgrade('diaspora_premium', 20, 'Global Connect', 'Search for matches in other countries for $20.');
                  }} 
                  className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${locationView === 'global' ? 'bg-rose-600 text-white shadow-md' : 'text-rose-300'}`}
                >
                  {!canDiasporaSeeGlobal && <Lock size={10} />}
                  Other Countries
                </button>
              )}
           </div>
           
           <div className="bg-white p-1 rounded-2xl border-2 border-rose-50 shadow-sm flex overflow-hidden">
              <button 
                onClick={() => setTargetOrigin(user.isDiaspora ? 'diaspora' : 'local')} 
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${targetOrigin === (user.isDiaspora ? 'diaspora' : 'local') ? 'bg-rose-600 text-white shadow-md' : 'text-rose-300'}`}
              >
                {user.isDiaspora ? 'Diaspora Region' : 'Local Zimbabwe'}
              </button>
              <button 
                onClick={() => { 
                  if (user.isDiaspora ? diasporaTier2OrHigher : localTier2OrHigher) setTargetOrigin(user.isDiaspora ? 'local' : 'diaspora'); 
                  else initiateUpgrade(user.isDiaspora ? 'diaspora_premium' : 'tier2', 20, 'Diaspora Connect', `Bridge the gap and connect ${user.isDiaspora ? 'back home' : 'with the Diaspora'}.`); 
                }} 
                className={`flex-1 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${targetOrigin !== (user.isDiaspora ? 'diaspora' : 'local') ? 'bg-rose-600 text-white shadow-md' : 'text-rose-300'}`}
              >
                {!(user.isDiaspora ? diasporaTier2OrHigher : localTier2OrHigher) && <Lock size={10} />}
                {user.isDiaspora ? 'Connect Zimbabwe' : 'Connect Diaspora'}
              </button>
           </div>
        </div>

        {showFilters && (
          <div className="bg-white p-8 rounded-[2rem] shadow-xl mb-8 border-4 border-rose-50 animate-in slide-in-from-top-4">
            <div className="space-y-8">
              <div className="space-y-4">
                <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest flex items-center gap-2"> 
                  Church Search {!canFilterChurch && <Lock size={10} />} 
                </label>
                <input 
                  value={filterChurch} 
                  onChange={e => { 
                    if (canFilterChurch) setFilterChurch(e.target.value); 
                    else initiateUpgrade(isLocal ? 'tier2' : 'diaspora_premium', isLocal ? 10 : 20, 'Church Search', 'Unlock denomination and ministry filters.'); 
                  }} 
                  placeholder={canFilterChurch ? "Enter denomination..." : `Upgrade for Church Filter ($${isLocal ? '10' : '20'})`} 
                  className="w-full px-6 py-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-200 outline-none text-sm font-bold" 
                />
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-rose-50">
                <button onClick={() => { if (canFilterHistory) setFilterMarital(prev => prev === 'Any' ? 'Never Married' : 'Any'); else initiateUpgrade(isLocal ? 'tier3' : 'diaspora_premium', 20, 'Elite Filters', 'Find souls who have never been married.'); }} className={`py-4 rounded-2xl border-2 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${filterMarital !== 'Any' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-gray-100 text-rose-300 hover:border-rose-100'}`}> 
                   {!canFilterHistory && <Lock size={10} />} Never Married 
                </button>
                <button onClick={() => { if (canFilterHistory) setFilterChildren(prev => prev === 'Any' ? 'No Children' : 'Any'); else initiateUpgrade(isLocal ? 'tier3' : 'diaspora_premium', 20, 'Elite Filters', 'Search for matches with no children.'); }} className={`py-4 rounded-2xl border-2 text-[10px] font-black uppercase flex items-center justify-center gap-2 transition-all ${filterChildren !== 'Any' ? 'bg-rose-600 border-rose-600 text-white shadow-lg' : 'bg-white border-gray-100 text-rose-300 hover:border-rose-100'}`}> 
                   {!canFilterHistory && <Lock size={10} />} No Kids 
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="space-y-8">
          {loadingUsers ? <div className="py-20 flex justify-center"><Loader2 className="animate-spin text-rose-600" size={40} /></div> : filteredMatches.map(match => (
              <div key={match.id} className="bg-white rounded-[3.5rem] p-5 shadow-2xl border-4 border-white hover:border-rose-50 transition-all overflow-hidden group">
                <div className="relative aspect-[3/4] rounded-[2.5rem] overflow-hidden mb-6">
                  <img src={match.images?.[0]} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={match.name} />
                  <div className="absolute bottom-0 inset-x-0 p-10 bg-gradient-to-t from-black/90 to-transparent text-white">
                    <h3 className="text-3xl font-black mb-2 tracking-tight">{match.name}, {match.age}</h3>
                    <div className="flex items-center gap-2 text-sm font-bold text-rose-300"> 
                      <MapPin size={16} fill="currentColor" /> {match.city}, {match.country} 
                    </div>
                  </div>
                </div>
                <div className="px-5 pb-5">
                  <div className="flex items-center gap-2 mb-4">
                     <span className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-full text-[9px] font-black uppercase tracking-widest">{match.churchName || 'Faithful Christian'}</span>
                  </div>
                  <p className="text-gray-600 font-bold text-base mb-8 line-clamp-3 italic leading-relaxed">"{match.bio}"</p>
                  
                  {/* AI Insight Display */}
                  {aiInsight?.id === match.id && (
                    <div className="mb-8 p-6 bg-indigo-50/50 rounded-[2rem] border-2 border-indigo-100 animate-in fade-in zoom-in duration-500">
                      <div className="flex items-center gap-2 mb-3 text-indigo-600">
                        <Sparkles size={16} fill="currentColor" />
                        <span className="text-[10px] font-black uppercase tracking-widest">Spiritual Discernment</span>
                      </div>
                      <p className="text-indigo-900 font-bold text-sm italic leading-relaxed">"{aiInsight.text}"</p>
                    </div>
                  )}

                  <div className="grid grid-cols-4 gap-4">
                    <button className="h-16 rounded-2xl bg-gray-50 text-gray-400 flex items-center justify-center hover:bg-rose-50 hover:text-rose-600 transition-colors"><X size={28} /></button>
                    <button onClick={() => handleConnect(match)} className="col-span-2 h-16 rounded-2xl bg-rose-600 text-white flex items-center justify-center gap-3 shadow-xl shadow-rose-100 font-black uppercase text-xs tracking-widest hover:bg-rose-700 active:scale-95 transition-all"> <Heart size={24} fill="currentColor" /> Connect </button>
                    <button 
                      onClick={() => generateSpiritualDiscernment(match)} 
                      disabled={loadingAiId === match.id}
                      className="h-16 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-100 transition-colors disabled:opacity-50"
                    > 
                      {loadingAiId === match.id ? <Loader2 className="animate-spin" /> : <Sparkles size={28} />} 
                    </button>
                  </div>
                </div>
              </div>
          ))}
          {filteredMatches.length === 0 && !loadingUsers && (
            <div className="text-center py-24 bg-white rounded-[4rem] border-4 border-dashed border-rose-50 shadow-inner">
               <ShieldCheck className="mx-auto text-rose-100 mb-6" size={64} />
               <h3 className="text-2xl font-black text-rose-950">Seeking matches...</h3>
               <p className="text-gray-400 font-bold text-sm mt-2 px-12">Try adjusting your age filters or expanding your search scope above.</p>
            </div>
          )}
        </div>
      </div>
      <PaymentModal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} amount={pendingUpgrade?.amount || 0} title={pendingUpgrade?.title || ''} description={pendingUpgrade?.desc || ''} onSuccess={handlePaymentSuccess} />
    </div>
  );
};

export default FeedPage;
