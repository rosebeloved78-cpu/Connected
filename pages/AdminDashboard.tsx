
import React, { useState, useEffect, useRef } from 'react';
import { User, Vendor, Gift } from '../types';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { VENDOR_CATEGORIES } from '../constants';
import { ShieldCheck, CreditCard, Users, Mic, Plus, Trash2, Save, Store, Smartphone, DollarSign, LayoutDashboard, Loader2, Upload, MapPin, Phone, Mail, Image as ImageIcon, Video, Youtube, Gift as GiftIcon, Link as LinkIcon, AlertCircle } from 'lucide-react';

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'vendors' | 'gifts' | 'content'>('payments');
  const [loading, setLoading] = useState(false);

  // -- Payment State --
  const [paymentSettings, setPaymentSettings] = useState({
    ecocashCode: '',
    ecocashName: '',
    ecocashUrl: '',
    stripeKey: '',
    stripeUrl: '',
    paypalClientId: '',
    paypalUrl: ''
  });

  // -- Vendor State --
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const initialVendorState = { 
    name: '', 
    category: VENDOR_CATEGORIES[0], 
    location: 'Harare', 
    address: '',
    phone: '',
    email: '',
    priceRange: '',
    images: [] as string[]
  };
  const [newVendor, setNewVendor] = useState(initialVendorState);
  const vendorImageInputRef = useRef<HTMLInputElement>(null);

  // -- Gift State --
  const [gifts, setGifts] = useState<Gift[]>([]);
  const initialGiftState = { name: '', price: 0, provider: '', image: '' };
  const [newGift, setNewGift] = useState(initialGiftState);
  const giftImageInputRef = useRef<HTMLInputElement>(null);
  
  // -- Content State --
  const [contentSubTab, setContentSubTab] = useState<'audio' | 'video'>('audio');
  const [adminPostContent, setAdminPostContent] = useState('');
  const [adminAudio, setAdminAudio] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');

  useEffect(() => {
    fetchVendors();
    fetchGifts();
    fetchPaymentSettings();
  }, []);

  const fetchPaymentSettings = async () => {
    try {
      const docRef = doc(db, 'settings', 'payments');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setPaymentSettings(prev => ({ ...prev, ...docSnap.data() }));
      }
    } catch (e) {
      console.error("Error fetching payment settings:", e);
    }
  };

  const fetchVendors = async () => {
    try {
      const snap = await getDocs(collection(db, 'vendors'));
      setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));
    } catch (e) { console.error(e); }
  };

  const fetchGifts = async () => {
    try {
      const snap = await getDocs(collection(db, 'gifts'));
      setGifts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Gift)));
    } catch (e) { console.error(e); }
  };

  const handleSavePayments = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'payments');
      await setDoc(docRef, paymentSettings);
      alert('Payment gateways updated successfully. Users will now be redirected to these links.');
    } catch (e) {
      console.error("Error saving payment settings:", e);
      alert('Failed to save payment settings.');
    } finally {
      setLoading(false);
    }
  };

  // Vendor & Gift handlers remain the same to minimize changes
  const handleVendorImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const remainingSlots = 5 - newVendor.images.length;
    if (remainingSlots <= 0) return;
    const filesToProcess = Array.from(files).slice(0, remainingSlots) as File[];
    const readers = filesToProcess.map(file => {
        return new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(file);
        });
    });
    Promise.all(readers).then(base64Images => {
        setNewVendor(prev => ({ ...prev, images: [...prev.images, ...base64Images] }));
    });
  };

  const handleAddVendor = async () => {
    if(!newVendor.name) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'vendors'), newVendor);
      setNewVendor(initialVendorState);
      fetchVendors();
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDeleteVendor = async (id: string) => {
    if(!window.confirm('Delete vendor?')) return;
    try { await deleteDoc(doc(db, 'vendors', id)); fetchVendors(); } catch(e) { console.error(e); }
  };

  const handleAddGift = async () => {
    if(!newGift.name) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'gifts'), newGift);
      setNewGift(initialGiftState);
      fetchGifts();
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const handleDeleteGift = async (id: string) => {
    if(!window.confirm('Delete gift?')) return;
    try { await deleteDoc(doc(db, 'gifts', id)); fetchGifts(); } catch(e) { console.error(e); }
  };

  const handlePostContent = async () => {
    if (!adminPostContent && !adminAudio) return;
    setLoading(true);
    try {
        await addDoc(collection(db, "admin_posts"), {
            userId: user.id,
            userName: 'Site Administrator',
            content: adminPostContent,
            timestamp: new Date(),
            isAdminPost: true,
            audioUrl: adminAudio || null,
            comments: []
        });
        setAdminPostContent('');
        setAdminAudio(null);
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const handlePostVideo = async () => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = videoUrl.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    if (!videoTitle || !videoId) return;
    setLoading(true);
    try {
        await addDoc(collection(db, "admin_videos"), {
            title: videoTitle,
            url: videoUrl,
            videoId: videoId,
            timestamp: new Date()
        });
        setVideoTitle(''); setVideoUrl('');
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  if (!user.isAdmin) return null;

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pb-32">
      <div className="flex items-center gap-6 mb-12 bg-gray-900 text-white p-10 rounded-[4rem] shadow-2xl">
        <div className="p-5 bg-gray-800 rounded-3xl"><LayoutDashboard size={40} /></div>
        <div>
            <h1 className="text-4xl font-black tracking-tight">Covenant Admin</h1>
            <p className="text-gray-400 font-bold text-sm">Managing the Kingdom's Digital Gates.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        <div className="space-y-3">
            {[
              { id: 'payments', label: 'Payments', icon: CreditCard, color: 'bg-blue-600' },
              { id: 'vendors', label: 'Vendors', icon: Store, color: 'bg-rose-600' },
              { id: 'gifts', label: 'Gifts', icon: GiftIcon, color: 'bg-pink-600' },
              { id: 'content', label: 'Pastoral', icon: Mic, color: 'bg-indigo-600' }
            ].map(tab => (
              <button 
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)} 
                className={`w-full p-5 rounded-[2.5rem] font-black text-left flex items-center gap-4 transition-all border-4 ${activeTab === tab.id ? `${tab.color} text-white border-${tab.color} shadow-xl` : 'bg-white text-gray-400 border-white hover:border-gray-50'}`}
              >
                <tab.icon size={20} /> {tab.label}
              </button>
            ))}
        </div>

        <div className="lg:col-span-3">
            {activeTab === 'payments' && (
                <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-white animate-in slide-in-from-right-10">
                    <div className="flex items-center justify-between mb-8">
                      <h2 className="text-3xl font-black text-gray-900 flex items-center gap-3"><DollarSign className="text-blue-600" /> Gateway Setup</h2>
                      <div className="bg-amber-50 px-4 py-2 rounded-xl border border-amber-100 flex items-center gap-2 text-amber-600 font-black text-[10px] uppercase tracking-widest">
                        <AlertCircle size={14} /> Use secure HTTPS links
                      </div>
                    </div>
                    
                    <div className="space-y-10">
                        {/* EcoCash Section */}
                        <div className="p-8 bg-blue-50/50 rounded-[3rem] border-2 border-blue-100">
                            <h3 className="text-xl font-black text-blue-900 flex items-center gap-2 mb-6"><Smartphone size={24} /> EcoCash Zimbabwe</h3>
                            <div className="grid md:grid-cols-2 gap-6 mb-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-4">Merchant Name</label>
                                    <input value={paymentSettings.ecocashName} onChange={e => setPaymentSettings({...paymentSettings, ecocashName: e.target.value})} placeholder="e.g. Lifestyle Connect Zim" className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-blue-400 font-bold outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-4">USSD Shortcode (Optional)</label>
                                    <input value={paymentSettings.ecocashCode} onChange={e => setPaymentSettings({...paymentSettings, ecocashCode: e.target.value})} placeholder="e.g. *151*2*1*..." className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-blue-400 font-bold outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-4 flex items-center gap-2">EcoCash Web Portal / Paynow Link</label>
                                <input value={paymentSettings.ecocashUrl} onChange={e => setPaymentSettings({...paymentSettings, ecocashUrl: e.target.value})} className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-blue-400 font-bold font-mono text-sm outline-none" placeholder="https://www.paynow.co.zw/..." />
                                <p className="text-[9px] font-bold text-blue-400 px-4">If set, users will be redirected to this link to pay before they can verify.</p>
                            </div>
                        </div>

                        {/* Stripe Section */}
                        <div className="p-8 bg-gray-50 rounded-[3rem] border-2 border-gray-100">
                            <h3 className="text-xl font-black text-gray-900 flex items-center gap-2 mb-6"><CreditCard size={24} /> Stripe Checkout</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Stripe Publishable Key</label>
                                    <input value={paymentSettings.stripeKey} onChange={e => setPaymentSettings({...paymentSettings, stripeKey: e.target.value})} placeholder="pk_live_..." className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-indigo-400 font-bold font-mono text-sm outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-4">Stripe Payment Link (Preferred)</label>
                                    <input value={paymentSettings.stripeUrl} onChange={e => setPaymentSettings({...paymentSettings, stripeUrl: e.target.value})} className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-indigo-400 font-bold font-mono text-sm outline-none" placeholder="https://buy.stripe.com/..." />
                                    <p className="text-[9px] font-bold text-gray-400 px-4">Create a 'Payment Link' in your Stripe Dashboard for easiest integration.</p>
                                </div>
                            </div>
                        </div>

                        {/* PayPal Section */}
                        <div className="p-8 bg-blue-50/20 rounded-[3rem] border-2 border-blue-100">
                            <h3 className="text-xl font-black text-blue-900 flex items-center gap-2 mb-6"><LinkIcon size={24} /> PayPal Portal</h3>
                            <div className="space-y-6">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-4">PayPal Client ID</label>
                                    <input value={paymentSettings.paypalClientId} onChange={e => setPaymentSettings({...paymentSettings, paypalClientId: e.target.value})} placeholder="Client ID from PayPal Developer Portal" className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-blue-400 font-bold font-mono text-sm outline-none" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-4">PayPal.me or Checkout URL</label>
                                    <input value={paymentSettings.paypalUrl} onChange={e => setPaymentSettings({...paymentSettings, paypalUrl: e.target.value})} className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-blue-400 font-bold font-mono text-sm outline-none" placeholder="https://www.paypal.com/ncp/payment/..." />
                                    <p className="text-[9px] font-bold text-blue-400 px-4">Direct link to a PayPal 'Buy Now' button or PayPal.me link.</p>
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={handleSavePayments} disabled={loading} className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl hover:bg-blue-700 active:scale-95 transition-all flex items-center gap-3">
                                {loading ? <Loader2 className="animate-spin" /> : <><Save size={24} /> Synchronize Gateways</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* Other tabs remain essentially the same, but with the same high-end styling */}
            {activeTab === 'vendors' && (
              <div className="space-y-8 animate-in slide-in-from-right-10">
                <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-white">
                  <h2 className="text-2xl font-black mb-8">Add Vendor Partner</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <input placeholder="Vendor Name" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-400 font-bold" />
                    <select value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-400 font-bold">
                      {VENDOR_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                    <input placeholder="City" value={newVendor.location} onChange={e => setNewVendor({...newVendor, location: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-400 font-bold" />
                    <button onClick={handleAddVendor} className="px-8 py-4 bg-rose-600 text-white rounded-2xl font-black shadow-lg">Save Vendor</button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'gifts' && (
              <div className="space-y-8 animate-in slide-in-from-right-10">
                <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-white">
                  <h2 className="text-2xl font-black mb-8">Catalog Management</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <input placeholder="Gift Item Name" value={newGift.name} onChange={e => setNewGift({...newGift, name: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-pink-400 font-bold" />
                    <input placeholder="Price USD" type="number" value={newGift.price || ''} onChange={e => setNewGift({...newGift, price: parseFloat(e.target.value)})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-pink-400 font-bold" />
                    <button onClick={handleAddGift} className="px-8 py-4 bg-pink-600 text-white rounded-2xl font-black shadow-lg">Add to Shop</button>
                  </div>
                </div>
              </div>
            )}
            {activeTab === 'content' && (
              <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-white animate-in slide-in-from-right-10">
                <h2 className="text-2xl font-black mb-8">Community Broadcast</h2>
                <textarea value={adminPostContent} onChange={e => setAdminPostContent(e.target.value)} placeholder="Type pastoral message..." className="w-full p-6 rounded-3xl bg-indigo-50 border-2 border-transparent focus:border-indigo-400 font-bold min-h-[200px]" />
                <button onClick={handlePostContent} className="mt-6 px-12 py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl">Post Pastoral Message</button>
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
