
import React, { useState, useEffect } from 'react';
import { User, Gift, Tier } from '../types';
import { Gift as GiftIcon, MapPin, Truck, Lock, Loader2, MessageSquare, CheckCircle } from 'lucide-react';
import { GIFTS as STATIC_GIFTS, ADMIN_WHATSAPP } from '../constants';
import PaymentModal from '../components/PaymentModal';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const GiftPage: React.FC<{ user: User }> = ({ user }) => {
  const isBlocked = user.tier === 'free' || user.tier === 'diaspora_free';
  const isLocal = !user.isDiaspora;
  
  // Zim Tier 3 ($20) or Diaspora Tier 2 ($20) unlock delivery
  const canDeliver = (isLocal && user.tier === 'tier3') || (user.isDiaspora && (user.tier === 'diaspora_premium' || user.tier === 'diaspora_vetted'));
  
  const deliveryFee = 20;

  const [gifts, setGifts] = useState<Gift[]>([]);
  const [loading, setLoading] = useState(true);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const [paymentConfig, setPaymentConfig] = useState<{ amount: number, title: string, desc: string, isDelivery: boolean } | null>(null);
  const [showWhatsApp, setShowWhatsApp] = useState(false);

  useEffect(() => {
    const fetchGifts = async () => {
      try {
        const snap = await getDocs(collection(db, 'gifts'));
        const dynamicGifts = snap.docs.map(d => ({ id: d.id, ...d.data() } as Gift));
        setGifts(dynamicGifts.length > 0 ? dynamicGifts : STATIC_GIFTS);
      } catch (e) { setGifts(STATIC_GIFTS); } finally { setLoading(false); }
    };
    if (!isBlocked) fetchGifts();
  }, [isBlocked]);

  const handlePurchase = (gift: Gift, delivery: boolean) => {
    const total = gift.price + (delivery ? deliveryFee : 0);
    setPaymentConfig({ 
      amount: total, 
      title: `Gift: ${gift.name}`, 
      desc: delivery ? `Includes $${deliveryFee} special delivery fee.` : `Purchase complete. Your partner can collect this at the shop for free.`,
      isDelivery: delivery
    });
    setPaymentModalOpen(true);
  };

  if (isBlocked) return (
      <div className="max-w-4xl mx-auto py-32 text-center"> <div className="bg-rose-50 w-32 h-32 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-white shadow-2xl"><Lock className="w-12 h-12 text-rose-300" /></div> <h1 className="text-4xl font-black text-rose-950 uppercase mb-4 tracking-tight">Members Only Boutique</h1> <p className="text-gray-500 font-bold">Upgrade to Premium to send gifts and tokens of appreciation.</p> </div>
  );

  if (showWhatsApp) return (
        <div className="max-w-md mx-auto py-32 px-6 text-center animate-in zoom-in duration-500">
             <div className="bg-green-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl"><CheckCircle size={48} className="text-green-600" /></div>
             <h2 className="text-3xl font-black text-green-900 mb-4 tracking-tight">Delivery Confirmed</h2>
             <p className="text-gray-600 font-bold mb-8 leading-relaxed">Your special delivery fee has been received. Please click below to coordinate the logistics with our site administrator.</p>
             <a href={`https://wa.me/${ADMIN_WHATSAPP}?text=Hi, I have just paid for a special gift delivery on Lifestyle Connect. Please help me coordinate.`} target="_blank" rel="noreferrer" className="w-full py-6 bg-green-500 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-green-600 transition-all flex items-center justify-center gap-3"><MessageSquare size={28} /> Coordinate via WhatsApp</a>
             <button onClick={() => setShowWhatsApp(false)} className="mt-8 text-gray-400 font-bold text-sm hover:text-rose-600 transition-colors">Return to Gift Shop</button>
        </div>
  );

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 pb-32">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-8 mb-16">
        <div className="flex items-center gap-6"> <div className="bg-rose-600 p-5 rounded-[2rem] text-white shadow-xl"><GiftIcon size={32} /></div> <div> <h1 className="text-4xl font-black text-rose-950 uppercase tracking-tighter">Love & Tokens</h1> <p className="text-rose-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1 italic">Vetted Vendors Across Zimbabwe</p> </div> </div>
        <div className="bg-white p-6 rounded-[2.5rem] border-4 border-rose-50 shadow-xl text-sm font-black flex flex-col gap-2">
            <p className="text-rose-950 flex items-center gap-3"> <div className="w-2 h-2 rounded-full bg-green-500" /> Partner Pickup: Always FREE </p>
            <p className={`flex items-center gap-3 ${canDeliver ? 'text-rose-950' : 'text-gray-300'}`}> 
               <Truck size={16} className={canDeliver ? "text-rose-600" : "text-gray-200"} /> Special Delivery: {canDeliver ? '$20 (Premium Unlock)' : 'Unlock with Premium'} 
            </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
        {loading ? <div className="flex justify-center p-20 col-span-full"><Loader2 className="animate-spin text-rose-600" size={48} /></div> : gifts.map(gift => (
            <div key={gift.id} className="bg-white rounded-[3.5rem] overflow-hidden border-4 border-rose-50 shadow-2xl transition-transform hover:-translate-y-2">
                 <div className="relative aspect-[4/3]"><img src={gift.image} crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-full object-cover" alt={gift.name} /><div className="absolute top-6 right-6 bg-white/95 backdrop-blur-md px-6 py-2 rounded-full font-black text-2xl text-rose-950 shadow-xl border-2 border-rose-50">${gift.price}</div></div>
                <div className="p-10 space-y-4">
                    <h3 className="text-2xl font-black text-rose-950 tracking-tight">{gift.name}</h3>
                    <p className="text-rose-500 font-black text-xs uppercase tracking-widest bg-rose-50 w-fit px-4 py-1.5 rounded-full">{gift.provider}</p>
                    <button onClick={() => handlePurchase(gift, false)} className="w-full py-4 bg-gray-50 text-gray-600 rounded-[2rem] font-black text-xs uppercase flex items-center justify-center gap-2 hover:bg-rose-50 hover:text-rose-600 transition-all"><MapPin size={18} /> Partner Pickup (Free)</button>
                    <button onClick={() => handlePurchase(gift, true)} disabled={!canDeliver} className={`w-full py-4 rounded-[2rem] font-black text-xs uppercase flex items-center justify-center gap-2 shadow-xl transition-all ${canDeliver ? 'bg-rose-600 text-white hover:bg-rose-700' : 'bg-gray-100 text-gray-300 cursor-not-allowed'}`}>
                        {canDeliver ? <><Truck size={18} /> Special Delivery (+$20)</> : <><Lock size={16} /> Premium Required</>}
                    </button>
                </div>
            </div>
        ))}
      </div>
      <PaymentModal 
        isOpen={paymentModalOpen} 
        onClose={() => setPaymentModalOpen(false)} 
        amount={paymentConfig?.amount || 0} 
        title={paymentConfig?.title || ''} 
        description={paymentConfig?.desc || ''} 
        onSuccess={() => { 
          if (paymentConfig?.isDelivery) {
            setShowWhatsApp(true); 
          } else {
            alert("Order Confirmed! Your partner can collect their gift at the vendor's local shop."); 
          }
        }} 
      />
    </div>
  );
};

export default GiftPage;
