
import React, { useState, useEffect, useRef } from 'react';
import { User, Vendor, Gift } from '../types';
import { collection, addDoc, getDocs, deleteDoc, doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { VENDOR_CATEGORIES } from '../constants';
import { ShieldCheck, CreditCard, Users, Mic, Plus, Trash2, Save, Store, Smartphone, DollarSign, LayoutDashboard, Loader2, Upload, MapPin, Phone, Mail, Image as ImageIcon, Video, Youtube, Gift as GiftIcon } from 'lucide-react';

const AdminDashboard: React.FC<{ user: User }> = ({ user }) => {
  const [activeTab, setActiveTab] = useState<'payments' | 'vendors' | 'gifts' | 'content'>('payments');
  const [loading, setLoading] = useState(false);

  // -- Payment State --
  const [paymentSettings, setPaymentSettings] = useState({
    ecocashCode: '',
    ecocashName: '',
    stripeKey: '',
    paypalClientId: ''
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
  
  // Audio
  const [adminPostContent, setAdminPostContent] = useState('');
  const [adminAudio, setAdminAudio] = useState<string | null>(null);
  // Fix: Move the declaration of audioInputRef to the top and make it a constant to avoid reassignment errors
  const audioInputRef = useRef<HTMLInputElement>(null);

  // Video
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
        setPaymentSettings(docSnap.data() as any);
      }
    } catch (e) {
      console.error("Error fetching payment settings:", e);
    }
  };

  const fetchVendors = async () => {
    try {
      const snap = await getDocs(collection(db, 'vendors'));
      setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));
    } catch (e) {
      console.error(e);
    }
  };

  const fetchGifts = async () => {
    try {
      const snap = await getDocs(collection(db, 'gifts'));
      setGifts(snap.docs.map(d => ({ id: d.id, ...d.data() } as Gift)));
    } catch (e) {
      console.error(e);
    }
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
    if (remainingSlots <= 0) {
        alert("Maximum 5 photos allowed per vendor.");
        return;
    }

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

  const removeVendorImage = (index: number) => {
    setNewVendor(prev => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index)
    }));
  };

  const handleAddVendor = async () => {
    if(!newVendor.name || newVendor.images.length === 0) {
        alert("Please provide at least a name and 1 photo.");
        return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'vendors'), newVendor);
      setNewVendor(initialVendorState);
      fetchVendors();
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = async (id: string) => {
    if(!window.confirm('Are you sure?')) return;
    try {
      await deleteDoc(doc(db, 'vendors', id));
      fetchVendors();
    } catch(e) { console.error(e); }
  };

  // -- Gift Logic --

  const handleGiftImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setNewGift(prev => ({ ...prev, image: reader.result as string }));
      reader.readAsDataURL(file);
    }
  };

  const handleAddGift = async () => {
    if(!newGift.name || !newGift.price || !newGift.image) {
      alert("Please provide a name, price, and image.");
      return;
    }
    setLoading(true);
    try {
      await addDoc(collection(db, 'gifts'), newGift);
      setNewGift(initialGiftState);
      fetchGifts();
    } catch(e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteGift = async (id: string) => {
    if(!window.confirm('Delete this gift?')) return;
    try {
      await deleteDoc(doc(db, 'gifts', id));
      fetchGifts();
    } catch(e) { console.error(e); }
  };

  // -- Content Logic --

  const handleAudioUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setAdminAudio(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handlePostContent = async () => {
    if (!adminPostContent && !adminAudio) return;
    setLoading(true);
    try {
        await addDoc(collection(db, "admin_posts"), {
            userId: user.id,
            userName: 'Site Administrator',
            content: adminPostContent,
            isAnonymous: false,
            amenCount: 0,
            timestamp: new Date(),
            isAdminPost: true,
            audioUrl: adminAudio || null,
            comments: []
        });
        setAdminPostContent('');
        setAdminAudio(null);
        alert("Pastoral content posted to Community page.");
    } catch(e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  // Video Helper
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const handlePostVideo = async () => {
    const videoId = getYoutubeId(videoUrl);
    if (!videoTitle || !videoId) {
        alert("Please provide a valid title and YouTube URL");
        return;
    }
    setLoading(true);
    try {
        await addDoc(collection(db, "admin_videos"), {
            title: videoTitle,
            url: videoUrl,
            videoId: videoId,
            timestamp: new Date()
        });
        setVideoTitle('');
        setVideoUrl('');
        alert("Video posted successfully to Community.");
    } catch(e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  if (!user.isAdmin) {
    return (
        <div className="min-h-[60vh] flex items-center justify-center text-center p-8">
            <div>
                <ShieldCheck size={64} className="mx-auto text-gray-300 mb-4" />
                <h2 className="text-2xl font-black text-gray-900">Access Denied</h2>
                <p className="text-gray-500">You do not have administrative privileges.</p>
            </div>
        </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-6 py-12 pb-32">
      {/* Header */}
      <div className="flex items-center gap-6 mb-12 bg-gray-900 text-white p-8 rounded-[3rem] shadow-2xl">
        <div className="p-4 bg-gray-800 rounded-2xl">
            <LayoutDashboard size={32} />
        </div>
        <div>
            <h1 className="text-3xl font-black tracking-tight">Admin Dashboard</h1>
            <p className="text-gray-400 font-bold text-sm">Manage payments, partners, and pastoral care.</p>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Sidebar Nav */}
        <div className="space-y-2">
            <button 
                onClick={() => setActiveTab('payments')}
                className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-3 transition-all ${activeTab === 'payments' ? 'bg-blue-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
                <CreditCard size={18} /> Payment Accounts
            </button>
            <button 
                onClick={() => setActiveTab('vendors')}
                className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-3 transition-all ${activeTab === 'vendors' ? 'bg-rose-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
                <Store size={18} /> Service Vendors
            </button>
            <button 
                onClick={() => setActiveTab('gifts')}
                className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-3 transition-all ${activeTab === 'gifts' ? 'bg-pink-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
                <GiftIcon size={18} /> Gift Shop
            </button>
            <button 
                onClick={() => setActiveTab('content')}
                className={`w-full p-4 rounded-2xl font-black text-left flex items-center gap-3 transition-all ${activeTab === 'content' ? 'bg-indigo-600 text-white shadow-lg' : 'bg-white text-gray-500 hover:bg-gray-50'}`}
            >
                <Mic size={18} /> Prayer & Content
            </button>
        </div>

        {/* Content Area */}
        <div className="lg:col-span-3">
            
            {/* --- PAYMENTS TAB --- */}
            {activeTab === 'payments' && (
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 animate-in fade-in slide-in-from-right-4">
                    <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                        <DollarSign className="text-blue-600" /> Payment Gateways
                    </h2>
                    
                    <div className="space-y-8">
                        <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100">
                            <h3 className="font-black text-blue-900 flex items-center gap-2 mb-4">
                                <Smartphone size={20} /> EcoCash (Zimbabwe)
                            </h3>
                            <div className="grid md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-2">Merchant Name</label>
                                    <input value={paymentSettings.ecocashName} onChange={e => setPaymentSettings({...paymentSettings, ecocashName: e.target.value})} className="w-full p-3 rounded-xl border border-blue-200 font-bold text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-blue-400 ml-2">Merchant Code / Shortcode</label>
                                    <input value={paymentSettings.ecocashCode} onChange={e => setPaymentSettings({...paymentSettings, ecocashCode: e.target.value})} className="w-full p-3 rounded-xl border border-blue-200 font-bold text-sm" />
                                </div>
                            </div>
                        </div>

                        <div className="p-6 bg-gray-50 rounded-3xl border border-gray-100">
                            <h3 className="font-black text-gray-900 flex items-center gap-2 mb-4">
                                <CreditCard size={20} /> International (Stripe & PayPal)
                            </h3>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Stripe Publishable Key</label>
                                    <input value={paymentSettings.stripeKey} onChange={e => setPaymentSettings({...paymentSettings, stripeKey: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm font-mono" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">PayPal Client ID</label>
                                    <input value={paymentSettings.paypalClientId} onChange={e => setPaymentSettings({...paymentSettings, paypalClientId: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm font-mono" />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end">
                            <button onClick={handleSavePayments} disabled={loading} className="px-8 py-3 bg-blue-600 text-white rounded-2xl font-black shadow-lg hover:scale-105 transition-transform flex items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : <><Save size={18} /> Save Settings</>}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* --- VENDORS TAB --- */}
            {activeTab === 'vendors' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            <Plus className="text-rose-600" /> Add New Vendor
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Business Name</label>
                                <input placeholder="e.g. Golden Conifer" value={newVendor.name} onChange={e => setNewVendor({...newVendor, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Category</label>
                                <select value={newVendor.category} onChange={e => setNewVendor({...newVendor, category: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm">
                                    {VENDOR_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">City/Location</label>
                                <input placeholder="e.g. Harare" value={newVendor.location} onChange={e => setNewVendor({...newVendor, location: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Price Range</label>
                                <input placeholder="e.g. $500 - $1500" value={newVendor.priceRange} onChange={e => setNewVendor({...newVendor, priceRange: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                            </div>
                            <div className="col-span-full space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Full Address</label>
                                <input placeholder="e.g. 123 Samora Machel Ave" value={newVendor.address} onChange={e => setNewVendor({...newVendor, address: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Phone Number</label>
                                <input placeholder="+263..." value={newVendor.phone} onChange={e => setNewVendor({...newVendor, phone: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Email Address</label>
                                <input placeholder="info@business.co.zw" value={newVendor.email} onChange={e => setNewVendor({...newVendor, email: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                            </div>
                        </div>
                        
                        {/* Image Upload */}
                        <div className="mb-6">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2 mb-2 block">Gallery Photos (Max 5)</label>
                            <div className="grid grid-cols-5 gap-2">
                                {newVendor.images.map((img, idx) => (
                                    <div key={idx} className="relative aspect-square rounded-xl overflow-hidden border border-gray-200">
                                        <img src={img} className="w-full h-full object-cover" />
                                        <button onClick={() => removeVendorImage(idx)} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full">
                                            <Trash2 size={10} />
                                        </button>
                                    </div>
                                ))}
                                {newVendor.images.length < 5 && (
                                    <button onClick={() => vendorImageInputRef.current?.click()} className="aspect-square rounded-xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-gray-400 hover:bg-gray-50 hover:border-rose-400 hover:text-rose-400 transition-colors">
                                        <Plus size={20} />
                                        <span className="text-[8px] font-black uppercase mt-1">Add Photo</span>
                                    </button>
                                )}
                            </div>
                            <input ref={vendorImageInputRef} type="file" multiple accept="image/*" className="hidden" onChange={handleVendorImageUpload} />
                        </div>

                        <div className="flex justify-end">
                             <button onClick={handleAddVendor} disabled={loading} className="px-6 py-3 bg-rose-600 text-white rounded-xl font-black shadow-lg hover:bg-rose-700 transition-colors flex items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : <><Plus size={18} /> Add Vendor</>}
                             </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Existing Vendors</h2>
                        <div className="space-y-4">
                            {vendors.map(v => (
                                <div key={v.id} className="flex items-start gap-4 p-4 bg-gray-50 rounded-2xl">
                                    <img src={v.images?.[0] || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-xl object-cover" alt={v.name} />
                                    <div className="flex-1">
                                        <h4 className="font-black text-gray-900">{v.name}</h4>
                                        <p className="text-xs font-bold text-gray-500 mb-1">{v.category} • {v.location}</p>
                                        <div className="flex flex-wrap gap-2 text-[10px] text-gray-400 font-bold">
                                            <span className="flex items-center gap-1"><MapPin size={10} /> {v.address}</span>
                                            <span className="flex items-center gap-1"><Phone size={10} /> {v.phone}</span>
                                            <span className="flex items-center gap-1"><DollarSign size={10} /> {v.priceRange}</span>
                                        </div>
                                    </div>
                                    <button onClick={() => handleDeleteVendor(v.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {vendors.length === 0 && <p className="text-gray-400 font-bold text-center">No vendors found.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* --- GIFTS TAB --- */}
            {activeTab === 'gifts' && (
                <div className="space-y-8 animate-in fade-in slide-in-from-right-4">
                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                            <Plus className="text-pink-600" /> Add New Gift Item
                        </h2>
                        <div className="grid md:grid-cols-2 gap-4 mb-4">
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Item Name</label>
                                <input placeholder="e.g. Luxury Bouquet" value={newGift.name} onChange={e => setNewGift({...newGift, name: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Price ($)</label>
                                <input type="number" placeholder="e.g. 50" value={newGift.price || ''} onChange={e => setNewGift({...newGift, price: parseFloat(e.target.value)})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Provider / Brand</label>
                                <input placeholder="e.g. Blooms Zim" value={newGift.provider} onChange={e => setNewGift({...newGift, provider: e.target.value})} className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Item Image</label>
                                <div className="flex gap-4">
                                  {newGift.image ? (
                                    <div className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-200 shrink-0">
                                      <img src={newGift.image} className="w-full h-full object-cover" />
                                      <button onClick={() => setNewGift({...newGift, image: ''})} className="absolute top-1 right-1 p-1 bg-red-500 text-white rounded-full"><Trash2 size={8} /></button>
                                    </div>
                                  ) : (
                                    <button onClick={() => giftImageInputRef.current?.click()} className="w-full p-3 rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-pink-400 hover:text-pink-400 transition-colors flex items-center justify-center gap-2 text-xs font-black uppercase">
                                      <Upload size={16} /> Upload Image
                                    </button>
                                  )}
                                  <input ref={giftImageInputRef} type="file" accept="image/*" className="hidden" onChange={handleGiftImageUpload} />
                                </div>
                            </div>
                        </div>

                        <div className="flex justify-end mt-6">
                             <button onClick={handleAddGift} disabled={loading} className="px-6 py-3 bg-pink-600 text-white rounded-xl font-black shadow-lg hover:bg-pink-700 transition-colors flex items-center gap-2">
                                {loading ? <Loader2 className="animate-spin" /> : <><Plus size={18} /> Add Gift</>}
                             </button>
                        </div>
                    </div>

                    <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100">
                        <h2 className="text-2xl font-black text-gray-900 mb-6">Gift Inventory</h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {gifts.map(g => (
                                <div key={g.id} className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl">
                                    <img src={g.image || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-xl object-cover" alt={g.name} />
                                    <div className="flex-1">
                                        <h4 className="font-black text-gray-900">{g.name}</h4>
                                        <p className="text-xs font-bold text-pink-600">${g.price}</p>
                                        <p className="text-[10px] font-bold text-gray-400">{g.provider}</p>
                                    </div>
                                    <button onClick={() => handleDeleteGift(g.id)} className="p-2 text-red-400 hover:bg-red-50 hover:text-red-600 rounded-lg transition-colors">
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            ))}
                            {gifts.length === 0 && <p className="col-span-full text-gray-400 font-bold text-center">No gifts added yet.</p>}
                        </div>
                    </div>
                </div>
            )}

            {/* --- CONTENT TAB --- */}
            {activeTab === 'content' && (
                <div className="bg-white p-8 rounded-[3rem] shadow-xl border border-gray-100 animate-in fade-in slide-in-from-right-4">
                    <h2 className="text-2xl font-black text-gray-900 mb-6 flex items-center gap-2">
                        {contentSubTab === 'audio' ? <Mic className="text-indigo-600" /> : <Video className="text-red-600" />} 
                        {contentSubTab === 'audio' ? 'Pastoral Audio' : 'Kingdom Video'}
                    </h2>
                    
                    {/* Sub-tab Toggle */}
                    <div className="flex bg-gray-100 p-1.5 rounded-xl mb-8 w-fit">
                        <button 
                            onClick={() => setContentSubTab('audio')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${contentSubTab === 'audio' ? 'bg-white text-indigo-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            Audio & Text
                        </button>
                        <button 
                            onClick={() => setContentSubTab('video')}
                            className={`px-4 py-2 rounded-lg text-xs font-black uppercase tracking-widest transition-all ${contentSubTab === 'video' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            YouTube Video
                        </button>
                    </div>

                    {contentSubTab === 'audio' ? (
                         <div className="space-y-6 animate-in fade-in slide-in-from-left-4">
                             <p className="text-gray-500 font-bold text-sm">Post written prayers or upload audio messages.</p>
                             <textarea 
                                 value={adminPostContent}
                                 onChange={e => setAdminPostContent(e.target.value)}
                                 placeholder="Type pastoral message here..."
                                 className="w-full p-6 rounded-3xl bg-indigo-50/50 border-2 border-indigo-100 outline-none font-bold text-indigo-900 min-h-[150px]"
                             />
                             
                             <div className="flex gap-4">
                                 <button 
                                     onClick={() => audioInputRef.current?.click()}
                                     className={`flex-1 py-4 rounded-2xl font-black flex items-center justify-center gap-2 border-2 transition-all ${adminAudio ? 'bg-green-50 border-green-200 text-green-700' : 'bg-gray-50 border-gray-200 text-gray-500 hover:bg-gray-100'}`}
                                 >
                                     <Upload size={20} /> {adminAudio ? 'Audio Attached' : 'Upload MP3'}
                                 </button>
                                 <input ref={audioInputRef} type="file" hidden accept="audio/*" onChange={handleAudioUpload} />
     
                                 <button onClick={handlePostContent} disabled={loading} className="flex-1 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2">
                                     {loading ? <Loader2 className="animate-spin" /> : 'Post to Community'}
                                 </button>
                             </div>
                         </div>
                    ) : (
                        <div className="space-y-6 animate-in fade-in slide-in-from-right-4">
                            <p className="text-gray-500 font-bold text-sm">Embed Kingdom teachings and worship from YouTube.</p>
                            <div className="space-y-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">Video Title</label>
                                    <input value={videoTitle} onChange={e => setVideoTitle(e.target.value)} placeholder="e.g. Sunday Service Highlights" className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 ml-2">YouTube URL</label>
                                    <input value={videoUrl} onChange={e => setVideoUrl(e.target.value)} placeholder="https://youtube.com/watch?v=..." className="w-full p-3 rounded-xl border border-gray-200 font-bold text-sm" />
                                </div>
                                <button onClick={handlePostVideo} disabled={loading} className="w-full py-4 bg-red-600 text-white rounded-2xl font-black shadow-xl hover:bg-red-700 transition-colors flex items-center justify-center gap-2">
                                     {loading ? <Loader2 className="animate-spin" /> : <><Youtube size={20} /> Post Video</>}
                                </button>
                            </div>
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
