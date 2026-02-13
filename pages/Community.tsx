
import React, { useState, useEffect, useRef } from 'react';
import { User, PrayerPost, Testimony, FriendshipPost, Comment, Vendor, VideoPost } from '../types';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Star, Users, Camera, MapPin, Hand, Send, Mic, Play, Music, ShieldCheck, Stars, Sparkles, MessageSquare, Lock, CheckCircle2, Coffee, Armchair, Church, DollarSign, Video } from 'lucide-react';
import { VENDORS as STATIC_VENDORS, VENDOR_CATEGORIES } from '../constants';
import { collection, addDoc, onSnapshot, query, orderBy, Timestamp, updateDoc, arrayUnion, doc, getDocs } from 'firebase/firestore';
import { db } from '../firebase';

const CommunityPage: React.FC<{ user: User | null }> = ({ user }) => {
  // -- Data State --
  const [prayers, setPrayers] = useState<PrayerPost[]>([]);
  const [adminPrayers, setAdminPrayers] = useState<PrayerPost[]>([]);
  const [friendshipPosts, setFriendshipPosts] = useState<FriendshipPost[]>([]);
  const [testimonies, setTestimonies] = useState<Testimony[]>([]);
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [videos, setVideos] = useState<VideoPost[]>([]);
  
  // -- UI State --
  const [selectedVendorCategory, setSelectedVendorCategory] = useState(VENDOR_CATEGORIES[0]);

  // -- Input State --
  // Prayer
  const [newPrayer, setNewPrayer] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  // Friendship
  const [newFriendshipContent, setNewFriendshipContent] = useState('');
  const [friendshipCategory, setFriendshipCategory] = useState<'Prayer Partner' | 'Same Church' | 'Same City'>('Prayer Partner');
  
  // -- Realtime Listeners --
  useEffect(() => {
    // 1. Prayers Listener
    const qPrayers = query(collection(db, "prayers"), orderBy("timestamp", "desc"));
    const unsubPrayers = onSnapshot(qPrayers, (snapshot) => {
      setPrayers(snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() } as PrayerPost)));
    });

    // 2. Admin Posts Listener (Audio/Text)
    const qAdmin = query(collection(db, "admin_posts"), orderBy("timestamp", "desc"));
    const unsubAdmin = onSnapshot(qAdmin, (snapshot) => {
      setAdminPrayers(snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() } as PrayerPost)));
    });

    // 3. Admin Videos Listener
    const qVideos = query(collection(db, "admin_videos"), orderBy("timestamp", "desc"));
    const unsubVideos = onSnapshot(qVideos, (snapshot) => {
      setVideos(snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() } as VideoPost)));
    });

    // 4. Friendship Bench Listener
    const qFriends = query(collection(db, "friendship_posts"), orderBy("timestamp", "desc"));
    const unsubFriends = onSnapshot(qFriends, (snapshot) => {
      setFriendshipPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() } as FriendshipPost)));
    });

    // 5. Testimonies Listener
    const qTestimonies = query(collection(db, "testimonies"), orderBy("timestamp", "desc"));
    const unsubTestimonies = onSnapshot(qTestimonies, (snapshot) => {
      setTestimonies(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Testimony)));
    });

    // 6. Vendors Fetch (One time)
    const fetchVendors = async () => {
      try {
        const snap = await getDocs(collection(db, 'vendors'));
        if (!snap.empty) {
          setVendors(snap.docs.map(d => ({ id: d.id, ...d.data() } as Vendor)));
        } else {
          setVendors(STATIC_VENDORS);
        }
      } catch (e) {
        console.error(e);
        setVendors(STATIC_VENDORS);
      }
    };
    fetchVendors();

    return () => {
      unsubPrayers();
      unsubAdmin();
      unsubVideos();
      unsubFriends();
      unsubTestimonies();
    };
  }, []);

  // -- Actions --

  const addComment = async (collectionName: string, docId: string, content: string) => {
    if (!content.trim() || !user) return;
    
    const newComment: Comment = {
      id: Date.now().toString(),
      userName: user.name,
      content: content,
      timestamp: new Date()
    };

    try {
      const docRef = doc(db, collectionName, docId);
      await updateDoc(docRef, {
        comments: arrayUnion(newComment)
      });
    } catch (e) {
      console.error("Error adding comment:", e);
      alert("Failed to post comment. Please try again.");
    }
  };

  const addPrayer = async () => {
    if (!newPrayer.trim() || !user) return;
    try {
      await addDoc(collection(db, "prayers"), {
        userId: user.id,
        userName: isAnon ? 'Anonymous' : user.name,
        content: newPrayer,
        isAnonymous: isAnon,
        amenCount: 0,
        timestamp: Timestamp.now(),
        comments: []
      });
      setNewPrayer('');
    } catch (e) {
      console.error("Error posting prayer:", e);
    }
  };

  const likePrayer = async (id: string, currentCount: number) => {
    if (!user) return;
    try {
      const docRef = doc(db, "prayers", id);
      await updateDoc(docRef, { amenCount: currentCount + 1 });
    } catch (e) {
      console.error(e);
    }
  };

  const addFriendshipPost = async () => {
    if (!newFriendshipContent.trim() || !user) return;
    try {
      await addDoc(collection(db, "friendship_posts"), {
        userId: user.id,
        userName: user.name,
        userLocation: user.city,
        userChurch: user.churchName || '',
        content: newFriendshipContent,
        category: friendshipCategory,
        timestamp: Timestamp.now(),
        comments: []
      });
      setNewFriendshipContent('');
    } catch (e) {
      console.error("Error posting to bench:", e);
    }
  };

  const PublicOverlay = () => (
    <div className="absolute inset-0 bg-white/40 backdrop-blur-[4px] z-20 flex items-center justify-center rounded-[3rem] p-10 text-center">
      <div className="bg-white p-8 rounded-[2rem] shadow-2xl border-4 border-rose-100 max-w-sm">
        <Lock size={48} className="mx-auto text-rose-600 mb-4 animate-bounce" />
        <h4 className="text-xl font-black text-rose-950 mb-2">Join the Sanctuary</h4>
        <p className="text-sm font-bold text-gray-600 mb-6">Create an account to lift up prayers, share testimonies, and connect with the community.</p>
        <Link to="/onboarding" className="block w-full py-4 bg-rose-600 text-white rounded-2xl font-black shadow-xl shadow-rose-200 hover:scale-105 transition-transform">
          Register Forever
        </Link>
      </div>
    </div>
  );

  const filteredVendors = vendors.filter(v => v.category === selectedVendorCategory);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 space-y-24">
      
      {/* GUEST BANNER */}
      {!user && (
        <section className="bg-gradient-to-r from-rose-500 to-rose-700 p-12 rounded-[4rem] text-white flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl shadow-rose-100 animate-in fade-in zoom-in duration-1000">
          <div className="space-y-4 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter">Witness the Kingdom in Action</h1>
            <p className="text-xl font-medium opacity-90">Every day, Zimbabweans find their God-ordained partners here.</p>
          </div>
          <Link to="/onboarding" className="px-12 py-6 bg-white text-rose-600 rounded-[2rem] font-black text-2xl shadow-xl hover:scale-110 transition-all flex items-center gap-3">
            Join the Family <Stars size={28} />
          </Link>
        </section>
      )}

      {/* ADMIN LINK BANNER (If Admin) */}
      {user?.isAdmin && (
        <section className="animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-gray-900 p-6 rounded-[2rem] flex items-center justify-between text-white shadow-xl">
             <div className="flex items-center gap-4">
                <ShieldCheck size={24} className="text-amber-400" />
                <div>
                   <h3 className="font-black text-lg">Admin Controls Active</h3>
                   <p className="text-xs font-bold text-gray-400">Post prayers and manage content from the dashboard.</p>
                </div>
             </div>
             <Link to="/admin" className="px-6 py-3 bg-amber-400 text-gray-900 rounded-xl font-black text-sm hover:bg-amber-300 transition-colors">
                Go to Dashboard
             </Link>
          </div>
        </section>
      )}

      {/* KINGDOM VISION: Admin Video Gallery */}
      {videos.length > 0 && (
        <section>
          <div className="flex items-center gap-6 mb-12">
            <div className="bg-red-600 p-4 rounded-3xl text-white shadow-xl shadow-red-100">
              <Video size={32} />
            </div>
            <div>
              <h2 className="text-4xl font-black text-rose-950 tracking-tight">Kingdom Vision</h2>
              <p className="text-red-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1 italic">Teachings, Worship & Testimonies</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {videos.map((v) => (
              <div key={v.id} className="bg-white rounded-[3.5rem] p-4 shadow-2xl border-4 border-gray-50 overflow-hidden">
                <iframe 
                  className="w-full aspect-video rounded-[2.5rem] mb-4 shadow-lg"
                  src={`https://www.youtube.com/embed/${v.videoId}`}
                  title={v.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                  allowFullScreen
                ></iframe>
                <div className="px-4 pb-4">
                    <h3 className="font-black text-rose-950 text-lg leading-tight mb-2">{v.title}</h3>
                    <div className="flex items-center gap-2">
                         <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest">Watch Now</span>
                         <span className="text-[10px] font-bold text-gray-300 uppercase tracking-widest">{v.timestamp?.toLocaleDateString()}</span>
                    </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* VOICE OF THE HEAVENS: Admin Audio Gallery */}
      <section>
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-indigo-600 p-4 rounded-3xl text-white shadow-xl shadow-indigo-100">
            <Music size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-indigo-950 tracking-tight">Voice of the Heavens</h2>
            <p className="text-indigo-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1 italic">Pastoral Audio Prayers & Guidance</p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {adminPrayers.map((p) => (
            <div key={p.id} className="bg-white rounded-[3.5rem] p-10 shadow-2xl shadow-indigo-100 border-4 border-indigo-50 relative overflow-hidden group flex flex-col">
              <div className="relative z-10 flex-1">
                <div className="flex items-center gap-2 mb-6">
                  <span className="px-4 py-1.5 bg-amber-400 text-indigo-950 rounded-full text-[9px] font-black uppercase tracking-widest shadow-sm">Official Admin</span>
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{p.timestamp.toLocaleDateString()}</span>
                </div>
                <p className="text-indigo-950 text-xl font-bold italic mb-10 leading-relaxed">"{p.content}"</p>
                {p.audioUrl && (
                  <div className="p-4 bg-indigo-50 rounded-[2rem] border border-indigo-100 flex items-center gap-4 mb-6">
                    <audio controls src={p.audioUrl} className="w-full" />
                  </div>
                )}
              </div>
              <div className="mt-auto pt-6 border-t border-indigo-50">
                 <CommentSection collectionName="admin_posts" id={p.id} comments={p.comments || []} activeUser={user} onAddComment={addComment} />
              </div>
            </div>
          ))}
          {adminPrayers.length === 0 && <div className="col-span-full p-8 text-center text-gray-400 font-bold">No pastoral posts yet.</div>}
        </div>
      </section>

      {/* COMMUNITY PRAYER BOARD */}
      <section>
        <div className="flex items-center gap-4 mb-12">
          <div className="bg-rose-100 p-4 rounded-3xl text-rose-600">
            <Hand size={32} strokeWidth={3} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-rose-950 tracking-tight">Community Prayer Board</h2>
            <p className="text-rose-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1">Lifting each other in the Kingdom</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          <div className="lg:col-span-1 relative">
            {!user && <PublicOverlay />}
            <div className={`bg-white p-10 rounded-[3.5rem] border-4 border-rose-50 shadow-2xl h-fit ${!user ? 'opacity-20 pointer-events-none' : ''}`}>
              <h3 className="text-xl font-black text-rose-950 uppercase tracking-tight mb-6">Submit Request</h3>
              <textarea 
                value={newPrayer}
                onChange={e => setNewPrayer(e.target.value)}
                className="w-full p-6 rounded-[2rem] bg-rose-50/30 border-2 border-transparent focus:border-rose-100 outline-none min-h-[160px] font-bold text-rose-900 placeholder:text-rose-200"
                placeholder="What can the community pray for?"
              />
              <div className="flex items-center justify-between mt-8">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <div className={`w-8 h-8 rounded-xl border-2 transition-all flex items-center justify-center ${isAnon ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white border-rose-100'}`}>
                    {isAnon && <CheckCircle2 size={14} strokeWidth={4} />}
                  </div>
                  <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} className="hidden" />
                  <span className="text-xs font-black text-rose-950 uppercase tracking-widest">Anonymous</span>
                </label>
                <button 
                  onClick={addPrayer}
                  className="w-14 h-14 bg-rose-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
                >
                  <Send size={24} />
                </button>
              </div>
            </div>
          </div>
          
          <div className="lg:col-span-2 space-y-6 max-h-[800px] overflow-y-auto pr-4 custom-scrollbar">
            {prayers.map(p => (
              <div key={p.id} className="bg-white p-10 rounded-[3rem] border-4 border-white shadow-xl group hover:border-rose-50 transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest px-3 py-1 bg-rose-50 rounded-full">{p.userName}</span>
                      <span className="text-[10px] font-black text-gray-300 uppercase tracking-widest">{p.timestamp?.toLocaleDateString()}</span>
                    </div>
                    <p className="text-rose-950 font-black italic text-xl leading-relaxed">"{p.content}"</p>
                  </div>
                  <button 
                    onClick={() => likePrayer(p.id, p.amenCount)}
                    className="flex flex-col items-center gap-1 text-rose-100 hover:text-rose-600 transition-all active:scale-95"
                  >
                    <Heart size={32} strokeWidth={3} className={p.amenCount > 0 ? "fill-rose-600 text-rose-600" : ""} />
                    <span className="text-xs font-black text-rose-950">{p.amenCount}</span>
                  </button>
                </div>
                <div className="pt-6 border-t border-rose-50">
                  <CommentSection collectionName="prayers" id={p.id} comments={p.comments || []} activeUser={user} onAddComment={addComment} />
                </div>
              </div>
            ))}
            {prayers.length === 0 && (
              <div className="text-center p-10 text-gray-400 font-bold">
                No prayers yet. Be the first to lift up a request.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* THE FRIENDSHIP BENCH */}
      <section>
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-teal-100 p-4 rounded-3xl text-teal-600">
            <Coffee size={32} strokeWidth={2.5} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-teal-950 tracking-tight uppercase">The Friendship Bench</h2>
            <p className="text-teal-500 font-black uppercase text-[10px] tracking-[0.3em] mt-1">Find your tribe: Prayer Partners, Church Mates, & Friends</p>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-12">
          {/* Post Form */}
          <div className="lg:col-span-1 relative">
             {!user && <PublicOverlay />}
             <div className={`bg-teal-50 p-10 rounded-[3.5rem] border-4 border-teal-100 shadow-2xl h-fit ${!user ? 'opacity-20 pointer-events-none' : ''}`}>
               <h3 className="text-xl font-black text-teal-950 uppercase tracking-tight mb-6">Post a Request</h3>
               
               <div className="mb-4">
                 <label className="text-[10px] font-black text-teal-600 uppercase tracking-widest mb-2 block">I am looking for:</label>
                 <select 
                  value={friendshipCategory} 
                  onChange={(e) => setFriendshipCategory(e.target.value as any)}
                  className="w-full p-4 rounded-2xl bg-white border-2 border-teal-100 outline-none font-bold text-teal-900 text-sm focus:border-teal-300 transition-colors"
                 >
                   <option value="Prayer Partner">Prayer Partner</option>
                   <option value="Same Church">Friends from My Church</option>
                   <option value="Same City">Friends in My City</option>
                 </select>
               </div>

               <textarea 
                 value={newFriendshipContent}
                 onChange={e => setNewFriendshipContent(e.target.value)}
                 className="w-full p-6 rounded-[2rem] bg-white border-2 border-teal-100 focus:border-teal-300 outline-none min-h-[140px] font-bold text-teal-900 placeholder:text-teal-200/70"
                 placeholder="Share a bit about who you are looking for..."
               />
               <div className="mt-6 flex justify-end">
                 <button 
                   onClick={addFriendshipPost}
                   className="px-8 py-4 bg-teal-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest shadow-xl shadow-teal-100 hover:bg-teal-700 transition-all flex items-center gap-2"
                 >
                   Post to Bench <Send size={16} />
                 </button>
               </div>
             </div>
          </div>

          {/* Post List */}
          <div className="lg:col-span-2 grid md:grid-cols-2 gap-6">
            {friendshipPosts.map(post => (
              <div key={post.id} className="bg-white p-8 rounded-[3rem] border-4 border-teal-50 shadow-xl flex flex-col hover:-translate-y-1 transition-transform">
                <div className="mb-4">
                   <span className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest ${
                     post.category === 'Prayer Partner' ? 'bg-purple-100 text-purple-700' :
                     post.category === 'Same Church' ? 'bg-amber-100 text-amber-700' :
                     'bg-green-100 text-green-700'
                   }`}>
                     {post.category}
                   </span>
                </div>
                
                <p className="text-gray-800 font-bold text-lg mb-6 flex-1">"{post.content}"</p>
                
                <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-3xl">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                     <Users size={14} className="text-teal-500" /> {post.userName}
                  </div>
                  {post.userChurch && (
                    <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <Church size={14} className="text-teal-500" /> {post.userChurch}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                      <MapPin size={14} className="text-teal-500" /> {post.userLocation}
                  </div>
                </div>

                <div className="pt-4 border-t border-teal-50">
                   <CommentSection collectionName="friendship_posts" id={post.id} comments={post.comments || []} activeUser={user} onAddComment={addComment} />
                </div>
              </div>
            ))}
            {friendshipPosts.length === 0 && (
              <div className="col-span-full p-8 text-center text-gray-400 font-bold bg-white rounded-[2rem] border-dashed border-2 border-teal-100">
                The bench is empty. Be the first to sit and wait for a friend.
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section>
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-amber-100 p-4 rounded-3xl text-amber-600">
            <Star size={32} fill="currentColor" />
          </div>
          <h2 className="text-4xl font-black text-rose-950 tracking-tight uppercase">Kingdom Testimonies</h2>
        </div>
        <div className="grid md:grid-cols-2 gap-12">
          {testimonies.map(t => (
            <div key={t.id} className="bg-white rounded-[4rem] p-10 border-4 border-amber-50 shadow-2xl group transition-all flex flex-col">
              <div className="aspect-video rounded-[2.5rem] overflow-hidden mb-8 shadow-xl">
                <img src={t.image} className="w-full h-full object-cover" />
              </div>
              <h3 className="text-2xl font-black text-rose-950 mb-4 tracking-tight">{t.title}</h3>
              <p className="text-rose-900 font-bold italic text-lg leading-relaxed mb-6 flex-1">"{t.content}"</p>
              <div className="flex items-center gap-3 text-rose-600 font-black text-xs uppercase tracking-widest bg-rose-50 w-fit px-6 py-3 rounded-2xl mb-8">
                <Users size={16} /> Verified Union
              </div>
              <div className="pt-8 border-t border-amber-50">
                <CommentSection collectionName="testimonies" id={t.id} comments={t.comments || []} activeUser={user} onAddComment={addComment} />
              </div>
            </div>
          ))}
          {testimonies.length === 0 && (
              <div className="col-span-full p-12 bg-white rounded-[3rem] text-center text-gray-400 font-bold border-2 border-dashed border-amber-100">
                Testimonies loading... or none yet shared.
              </div>
          )}
        </div>
      </section>

      {/* Wedding Vendors */}
      <section className="pb-24">
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-blue-100 p-4 rounded-3xl text-blue-600">
            <Camera size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-rose-950 tracking-tight uppercase">Trusted Wedding Directory</h2>
            <p className="text-blue-500 font-black uppercase text-[10px] tracking-[0.3em] mt-1">Vetted Service Providers</p>
          </div>
        </div>

        {/* Category Menu */}
        <div className="flex gap-4 overflow-x-auto pb-8 mb-4 no-scrollbar">
            {VENDOR_CATEGORIES.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedVendorCategory(cat)}
                    className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                        selectedVendorCategory === cat 
                        ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-200' 
                        : 'bg-white border-blue-100 text-blue-300 hover:border-blue-300 hover:text-blue-500'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {filteredVendors.map(v => (
            <div key={v.id} className="group cursor-pointer bg-white rounded-[2.5rem] border-4 border-white shadow-xl hover:border-blue-50 transition-all overflow-hidden flex flex-col">
              <div className="relative aspect-square overflow-hidden bg-gray-100">
                <img src={v.images?.[0] || 'https://via.placeholder.com/300'} className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000" />
                <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-blue-900 shadow-lg">
                    {v.images?.length || 1} Photos
                </div>
                {/* Hover overlay */}
                <div className="absolute inset-0 bg-blue-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center p-6 text-center backdrop-blur-[2px]">
                   <span className="text-white font-black uppercase text-xs tracking-widest border-2 border-white px-6 py-3 rounded-2xl mb-4">View Gallery</span>
                   {v.phone && <p className="text-white text-xs font-bold">{v.phone}</p>}
                   {v.email && <p className="text-white text-[10px] opacity-80">{v.email}</p>}
                </div>
              </div>
              
              <div className="p-6 flex-1 flex flex-col">
                <h4 className="font-black text-rose-950 text-xl tracking-tight mb-2 leading-none">{v.name}</h4>
                <div className="mt-auto space-y-2">
                    <div className="flex items-center justify-between border-t border-gray-100 pt-3">
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-1">
                            <MapPin size={10} /> {v.location}
                        </span>
                        {v.priceRange && (
                            <span className="text-[10px] font-black text-green-600 uppercase tracking-widest flex items-center gap-1">
                                <DollarSign size={10} /> {v.priceRange}
                            </span>
                        )}
                    </div>
                </div>
              </div>
            </div>
          ))}
          {filteredVendors.length === 0 && (
              <div className="col-span-full py-16 text-center bg-gray-50 rounded-[3rem] border-2 border-dashed border-gray-200">
                  <p className="text-gray-400 font-black uppercase tracking-widest text-xs">No vendors listed in this category yet.</p>
              </div>
          )}
        </div>
      </section>

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 6px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #FDA4AF; border-radius: 10px; }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
};

// Helper component for comments (Kept same as before)
const CommentSection = ({ collectionName, id, comments, activeUser, onAddComment }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const [text, setText] = useState('');

  const handleSubmit = () => {
    if(!text.trim()) return;
    onAddComment(collectionName, id, text);
    setText('');
  };

  return (
    <div className="space-y-4">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-600 transition-colors"
      >
        <MessageSquare size={16} /> {comments.length} Comments
      </button>

      {isOpen && (
        <div className="space-y-4 animate-in slide-in-from-top-2 duration-300">
          <div className="space-y-3 max-h-48 overflow-y-auto custom-scrollbar pr-2">
            {comments.map((c: any) => (
              <div key={c.id} className="bg-gray-50 p-4 rounded-2xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-[9px] font-black uppercase text-rose-600">{c.userName}</span>
                  <span className="text-[8px] font-bold text-gray-300 uppercase">{new Date(c.timestamp.seconds * 1000 || c.timestamp).toLocaleDateString()}</span>
                </div>
                <p className="text-sm font-bold text-gray-800 leading-snug">{c.content}</p>
              </div>
            ))}
            {comments.length === 0 && <p className="text-[10px] font-bold text-gray-300 uppercase italic">Be the first to comment...</p>}
          </div>

          {activeUser ? (
            <div className="relative">
              <input 
                value={text}
                onChange={e => setText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmit()}
                placeholder="Write a comment..."
                className="w-full px-6 py-3 rounded-xl bg-rose-50/50 border border-transparent focus:border-rose-100 outline-none text-xs font-bold text-rose-900"
              />
              <button 
                onClick={handleSubmit}
                className="absolute right-2 top-1/2 -translate-y-1/2 text-rose-600 hover:scale-110 transition-transform"
              >
                <Send size={18} />
              </button>
            </div>
          ) : (
            <Link to="/onboarding" className="block text-center py-3 bg-gray-50 rounded-xl text-[9px] font-black uppercase text-gray-400 hover:text-rose-600 transition-colors border border-dashed border-gray-200">
              Sign in to Comment
            </Link>
          )}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
