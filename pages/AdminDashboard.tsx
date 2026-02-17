import React, { useState, useEffect, useRef } from 'react';
import { User, Vendor, Gift as GiftType } from '../types';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { VENDOR_CATEGORIES } from '../constants';
import { ShieldCheck, CreditCard, Users, Mic, Plus, Trash2, Save, Store, Smartphone, DollarSign, LayoutDashboard, Loader2, Upload, MapPin, Phone, Mail, Image as ImageIcon, Video, Youtube, Gift as GiftIcon, Link as LinkIcon, AlertCircle, FileText, Radio, CheckCircle } from 'lucide-react';

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
    description: '',
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
  const [gifts, setGifts] = useState<GiftType[]>([]);
  const initialGiftState = { name: '', price: 0, provider: '', phone: '', image: '' };
  const [newGift, setNewGift] = useState(initialGiftState);
  const giftImageInputRef = useRef<HTMLInputElement>(null);
  
  // -- Content State --
  const [contentSubTab, setContentSubTab] = useState<'audio' | 'video' | 'live'>('audio');
  const [adminPostContent, setAdminPostContent] = useState('');
  const [adminAudio, setAdminAudio] = useState<string | null>(null);
  const audioInputRef = useRef<HTMLInputElement>(null);
  const [videoTitle, setVideoTitle] = useState('');
  const [videoUrl, setVideoUrl] = useState('');
  const [liveTitle, setLiveTitle] = useState('');
  const [liveUrl, setLiveUrl] = useState('');

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
      setGifts(snap.docs.map(d => ({ id: d.id, ...d.data() } as GiftType)));
    } catch (e) { console.error(e); }
  };

  const handleSavePayments = async () => {
    setLoading(true);
    try {
      const docRef = doc(db, 'settings', 'payments');
      await setDoc(docRef, paymentSettings);
      alert('Payment gateways updated successfully.');
    } catch (e) {
      console.error("Error saving payment settings:", e);
      alert('Failed to save payment settings.');
    } finally {
      setLoading(false);
    }
  };

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

  const handleGiftImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setNewGift(prev => ({ ...prev, image: reader.result as string }));
    };
    reader.readAsDataURL(file);
  };

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      setAdminAudio(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleAddVendor = async () => {
    if(!newVendor.name) return;
    setLoading(true);
    try {
      await addDoc(collection(db, 'vendors'), newVendor);
      setNewVendor(initialVendorState);
      fetchVendors();
      alert('Vendor added successfully.');
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
      alert('Gift added successfully.');
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
        alert('Pastoral message posted.');
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
        alert('Video tutorial added.');
    } catch(e) { console.error(e); } finally { setLoading(false); }
  };

  const handlePostLive = async () => {
    if (!liveTitle || !liveUrl) return;
    setLoading(true);
    try {
        await addDoc(collection(db, "admin_live"), {
            title: liveTitle,
            url: liveUrl,
            timestamp: new Date(),
            active: true
        });
        setLiveTitle(''); setLiveUrl('');
        alert('Live prayer session scheduled.');
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
                                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-4">USSD Shortcode</label>
                                    <input value={paymentSettings.ecocashCode} onChange={e => setPaymentSettings({...paymentSettings, ecocashCode: e.target.value})} placeholder="e.g. *151*2*..." className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-blue-400 font-bold outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-4">Payment Link</label>
                                <input value={paymentSettings.ecocashUrl} onChange={e => setPaymentSettings({...paymentSettings, ecocashUrl: e.target.value})} className="w-full p-4 rounded-2xl bg-white border-2 border-transparent focus:border-blue-400 font-bold font-mono text-sm outline-none" placeholder="https://..." />
                            </div>
                        </div>

                        <div className="flex justify-end pt-4">
                            <button onClick={handleSavePayments} disabled={loading} className="px-12 py-5 bg-blue-600 text-white rounded-[2rem] font-black shadow-2xl hover:bg-blue-700 transition-all flex items-center gap-3">
                                {loading ? <Loader2 className="animate-spin" /> : <><Save size={24} /> Save Gateway Settings</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'vendors' && (
              <div className="space-y-8 animate-in slide-in-from-right-10">
                <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-white">
                  <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-rose-600"><Plus /> Register New Partner</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Vendor Name</label>
                      <input placeholder="Enter Business Name" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-400 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Category</label>
                      <select value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-400 font-bold outline-none">
                        {VENDOR_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Description</label>
                      <textarea placeholder="Describe services offered..." value={newVendor.description} onChange={e => setNewVendor({...newVendor, description: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-400 font-bold min-h-[100px] outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Address</label>
                      <input placeholder="Physical Address" value={newVendor.address} onChange={e => setNewVendor({...newVendor, address: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-400 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Phone Number</label>
                      <input placeholder="e.g. +263 77..." value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-400 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Price Range</label>
                      <input placeholder="e.g. $50 - $200" value={newVendor.priceRange} onChange={e => setNewVendor({...newVendor, priceRange: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-rose-400 font-bold outline-none" />
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    <label className="text-[10px] font-black text-rose-400 uppercase tracking-widest ml-4">Gallery (Max 5 Photos)</label>
                    <div className="flex flex-wrap gap-4">
                      {newVendor.images.map((img, i) => (
                        <div key={i} className="w-24 h-24 rounded-2xl overflow-hidden border-2 border-rose-100 relative group">
                          <img src={img} className="w-full h-full object-cover" />
                          <button onClick={() => setNewVendor({...newVendor, images: newVendor.images.filter((_, idx) => idx !== i)})} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16} /></button>
                        </div>
                      ))}
                      {newVendor.images.length < 5 && (
                        <button onClick={() => vendorImageInputRef.current?.click()} className="w-24 h-24 rounded-2xl border-4 border-dashed border-rose-100 flex flex-col items-center justify-center text-rose-200 hover:bg-rose-50 transition-all">
                          <ImageIcon size={24} />
                          <span className="text-[8px] font-black uppercase mt-1">Upload</span>
                        </button>
                      )}
                    </div>
                    <input ref={vendorImageInputRef} type="file" multiple hidden accept="image/*" onChange={handleVendorImageUpload} />
                  </div>

                  <button onClick={handleAddVendor} disabled={loading} className="w-full mt-10 py-5 bg-rose-600 text-white rounded-[2rem] font-black shadow-xl hover:bg-rose-700 transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : <><Plus /> Save Vendor Partner</>}
                  </button>
                </div>

                <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-white">
                    <h2 className="text-2xl font-black mb-8">Existing Vendors</h2>
                    <div className="space-y-4">
                        {vendors.map(v => (
                            <div key={v.id} className="p-6 rounded-3xl bg-gray-50 border-2 border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-16 h-16 rounded-2xl bg-gray-200 overflow-hidden">
                                        <img src={v.images[0] || 'https://via.placeholder.com/150'} className="w-full h-full object-cover" />
                                    </div>
                                    <div>
                                        <h4 className="font-black text-rose-950">{v.name}</h4>
                                        <p className="text-[10px] font-bold text-rose-400 uppercase tracking-widest">{v.category}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteVendor(v.id)} className="p-3 text-rose-400 hover:text-rose-600 transition-colors"><Trash2 size={20} /></button>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'gifts' && (
              <div className="space-y-8 animate-in slide-in-from-right-10">
                <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-white">
                  <h2 className="text-3xl font-black mb-8 flex items-center gap-3 text-pink-600"><GiftIcon /> Add to Catalog</h2>
                  <div className="grid md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4">Gift Item Name</label>
                      <input placeholder="e.g. Rose Bouquet" value={newGift.name} onChange={e => setNewGift({...newGift, name: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-pink-400 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4">Price (USD)</label>
                      <input type="number" placeholder="25.00" value={newGift.price || ''} onChange={e => setNewGift({...newGift, price: parseFloat(e.target.value)})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-pink-400 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4">Shop Name</label>
                      <input placeholder="Enter Merchant Name" value={newGift.provider} onChange={e => setNewGift({...newGift, provider: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-pink-400 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4">Phone Number</label>
                      <input placeholder="+263..." value={newGift.phone} onChange={e => setNewGift({...newGift, phone: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-pink-400 font-bold outline-none" />
                    </div>
                  </div>
                  
                  <div className="mt-8 space-y-4">
                    <label className="text-[10px] font-black text-pink-400 uppercase tracking-widest ml-4">Product Photo (1 Max)</label>
                    <div className="flex gap-4">
                      {newGift.image ? (
                        <div className="w-48 h-32 rounded-3xl overflow-hidden border-2 border-pink-100 relative group">
                          <img src={newGift.image} className="w-full h-full object-cover" />
                          <button onClick={() => setNewGift({...newGift, image: ''})} className="absolute inset-0 bg-black/40 flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 /></button>
                        </div>
                      ) : (
                        <button onClick={() => giftImageInputRef.current?.click()} className="w-48 h-32 rounded-3xl border-4 border-dashed border-pink-100 flex flex-col items-center justify-center text-pink-200 hover:bg-pink-50 transition-all">
                          <ImageIcon size={32} />
                          <span className="text-[10px] font-black uppercase mt-2">Upload Photo</span>
                        </button>
                      )}
                    </div>
                    <input ref={giftImageInputRef} type="file" hidden accept="image/*" onChange={handleGiftImageUpload} />
                  </div>

                  <button onClick={handleAddGift} disabled={loading} className="w-full mt-10 py-5 bg-pink-600 text-white rounded-[2rem] font-black shadow-xl hover:bg-pink-700 transition-all flex items-center justify-center gap-2">
                    {loading ? <Loader2 className="animate-spin" /> : <><Plus /> Add to Shop</>}
                  </button>
                </div>

                <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-white">
                    <h2 className="text-2xl font-black mb-8 text-pink-900">Active Gift Catalog</h2>
                    <div className="grid md:grid-cols-2 gap-4">
                        {gifts.map(g => (
                            <div key={g.id} className="p-6 rounded-3xl bg-gray-50 border-2 border-gray-100 flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <img src={g.image} className="w-16 h-16 rounded-2xl object-cover" />
                                    <div>
                                        <h4 className="font-black text-pink-950">{g.name}</h4>
                                        <p className="text-xs font-bold text-gray-500">${g.price} • {g.provider}</p>
                                    </div>
                                </div>
                                <button onClick={() => handleDeleteGift(g.id)} className="p-3 text-pink-400 hover:text-pink-600 transition-colors"><Trash2 size={20} /></button>
                            </div>
                        ))}
                    </div>
                </div>
              </div>
            )}

            {activeTab === 'content' && (
              <div className="bg-white p-10 rounded-[4rem] shadow-2xl border-4 border-white animate-in slide-in-from-right-10">
                <div className="flex items-center gap-4 mb-10 overflow-x-auto pb-2 no-scrollbar">
                  {[
                    { id: 'audio', icon: Radio, label: 'Audio Upload' },
                    { id: 'video', icon: Youtube, label: 'Video Embed' },
                    { id: 'live', icon: Radio, label: 'Pray Live' }
                  ].map(sub => (
                    <button 
                      key={sub.id} 
                      onClick={() => setContentSubTab(sub.id as any)} 
                      className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-2 transition-all border-2 ${contentSubTab === sub.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg' : 'bg-indigo-50 border-transparent text-indigo-400'}`}
                    >
                      <sub.icon size={16} /> {sub.label}
                    </button>
                  ))}
                </div>

                {contentSubTab === 'audio' && (
                  <div className="space-y-6 animate-in fade-in">
                    <h2 className="text-2xl font-black mb-4 flex items-center gap-3 text-indigo-900"><Mic /> Pastoral Audio Message</h2>
                    <textarea value={adminPostContent} onChange={e => setAdminPostContent(e.target.value)} placeholder="Type devotional message..." className="w-full p-6 rounded-3xl bg-indigo-50 border-2 border-transparent focus:border-indigo-400 font-bold min-h-[120px] outline-none" />
                    <div className="p-6 bg-gray-50 rounded-3xl border-2 border-dashed border-indigo-100">
                      {adminAudio ? (
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-indigo-600 uppercase">Audio Loaded Successfully</p>
                          <button onClick={() => setAdminAudio(null)} className="text-red-500 hover:text-red-700"><Trash2 size={20} /></button>
                        </div>
                      ) : (
                        <button onClick={() => audioInputRef.current?.click()} className="w-full py-4 flex flex-col items-center gap-2 text-indigo-300">
                          <Upload />
                          <span className="text-xs font-black uppercase">Click to Upload Audio File</span>
                        </button>
                      )}
                      <input ref={audioInputRef} type="file" hidden accept="audio/*" onChange={handleAudioUpload} />
                    </div>
                    <button onClick={handlePostContent} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl">
                      {loading ? <Loader2 className="animate-spin" /> : 'Post Audio Devotional'}
                    </button>
                  </div>
                )}

                {contentSubTab === 'video' && (
                  <div className="space-y-6 animate-in fade-in">
                    <h2 className="text-2xl font-black mb-4 flex items-center gap-3 text-indigo-900"><Youtube /> YouTube Video Embed</h2>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Video Title</label>
                        <input placeholder="Teaching Title" value={videoTitle} onChange={e => setVideoTitle(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-400 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">YouTube URL</label>
                        <input placeholder="e.g. https://www.youtube.com/watch?v=..." value={videoUrl} onChange={e => setVideoUrl(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-400 font-bold outline-none" />
                    </div>
                    <button onClick={handlePostVideo} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl">
                      {loading ? <Loader2 className="animate-spin" /> : 'Embed Video Teaching'}
                    </button>
                  </div>
                )}

                {contentSubTab === 'live' && (
                  <div className="space-y-6 animate-in fade-in">
                    <h2 className="text-2xl font-black mb-4 flex items-center gap-3 text-indigo-900"><Radio /> Launch Pray Live Session</h2>
                    <p className="text-xs font-bold text-gray-500 mb-4 leading-relaxed">Schedule a live prayer session. Users will receive a notification to join your sanctuary stream.</p>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Live Session Title</label>
                        <input placeholder="e.g. Midnight Intercession" value={liveTitle} onChange={e => setLiveTitle(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-400 font-bold outline-none" />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-indigo-400 uppercase tracking-widest ml-4">Stream URL / Link</label>
                        <input placeholder="Zoom, YouTube Live, or Facebook Live Link" value={liveUrl} onChange={e => setLiveUrl(e.target.value)} className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-400 font-bold outline-none" />
                    </div>
                    <button onClick={handlePostLive} disabled={loading} className="w-full py-5 bg-indigo-600 text-white rounded-[2rem] font-black shadow-xl flex items-center justify-center gap-2">
                      {loading ? <Loader2 className="animate-spin" /> : <><Radio className="animate-pulse" /> Launch Live Session</>}
                    </button>
                  </div>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
