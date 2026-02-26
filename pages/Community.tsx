
import React, { useState, useEffect, useRef } from 'react';
import { User, PrayerPost, Testimony, FriendshipPost, Comment, Vendor, VideoPost, Event } from '../types';
import { Link } from 'react-router-dom';
import { MessageCircle, Heart, Star, Users, Camera, MapPin, Hand, Send, Mic, Play, Music, ShieldCheck, Stars, Sparkles, MessageSquare, Lock, CheckCircle2, Coffee, Armchair, Church, DollarSign, Video, Radio, ExternalLink, Calendar, Plus, Upload } from 'lucide-react';
import { VENDORS as STATIC_VENDORS, VENDOR_CATEGORIES } from '../constants';

// Community Tab Categories
const COMMUNITY_TABS = ['Prayer Board', 'Friendship Bench', 'Kingdom Testimonies', 'Lifestyle Connect Events'];
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
  const [lives, setLives] = useState<any[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  
  // -- UI State --
  const [selectedVendorCategory, setSelectedVendorCategory] = useState(VENDOR_CATEGORIES[0]);
  const [selectedCommunityTab, setSelectedCommunityTab] = useState('Prayer Board');

  // -- Input State --
  // Prayer
  const [newPrayer, setNewPrayer] = useState('');
  const [isAnon, setIsAnon] = useState(false);
  // Friendship
  const [newFriendshipContent, setNewFriendshipContent] = useState('');
  const [friendshipCategory, setFriendshipCategory] = useState<'Prayer Partner' | 'Same Church' | 'Same City'>('Prayer Partner');
  
  // Events Input State (Admin Only)
  const [newEvent, setNewEvent] = useState({
    name: '',
    date: '',
    time: '',
    place: '',
    description: '',
    photo: ''
  });
  const [showEventForm, setShowEventForm] = useState(false);
  
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

    // 4. Events Listener
    const qEvents = query(collection(db, "events"), orderBy("timestamp", "desc"));
    const unsubEvents = onSnapshot(qEvents, (snapshot) => {
      setEvents(snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() } as Event)));
    });

    // 4. Admin Live Sessions Listener
    const qLive = query(collection(db, "admin_live"), orderBy("timestamp", "desc"));
    const unsubLive = onSnapshot(qLive, (snapshot) => {
      setLives(snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() })));
    });

    // 5. Friendship Bench Listener
    const qFriends = query(collection(db, "friendship_posts"), orderBy("timestamp", "desc"));
    const unsubFriends = onSnapshot(qFriends, (snapshot) => {
      setFriendshipPosts(snapshot.docs.map(d => ({ id: d.id, ...d.data(), timestamp: d.data().timestamp?.toDate() } as FriendshipPost)));
    });

    // 6. Testimonies Listener
    const qTestimonies = query(collection(db, "testimonies"), orderBy("timestamp", "desc"));
    const unsubTestimonies = onSnapshot(qTestimonies, (snapshot) => {
      setTestimonies(snapshot.docs.map(d => ({ id: d.id, ...d.data() } as Testimony)));
    });

    // 7. Vendors Fetch (One time)
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
      unsubEvents();
      unsubLive();
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

  // Event Functions (Admin Only)
  const handleEventPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && user?.isAdmin) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewEvent(prev => ({ ...prev, photo: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const addEvent = async () => {
    if (!user?.isAdmin) return;
    if (!newEvent.name.trim() || !newEvent.date.trim() || !newEvent.time.trim() || !newEvent.place.trim() || !newEvent.description.trim()) {
      alert("Please fill in all event fields");
      return;
    }

    try {
      await addDoc(collection(db, "events"), {
        name: newEvent.name,
        date: newEvent.date,
        time: newEvent.time,
        place: newEvent.place,
        description: newEvent.description,
        photo: newEvent.photo,
        timestamp: Timestamp.now()
      });

      // Reset form
      setNewEvent({
        name: '',
        date: '',
        time: '',
        place: '',
        description: '',
        photo: ''
      });
      setShowEventForm(false);
    } catch (e) {
      console.error("Error adding event:", e);
      alert("Failed to add event. Please try again.");
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

      {/* LIVE SANCTUARY: Admin Live Sessions */}
      {lives.length > 0 && (
        <section>
          <div className="flex items-center gap-6 mb-12">
            <div className="bg-rose-600 p-4 rounded-3xl text-white shadow-xl shadow-rose-100">
              <Radio size={32} className="animate-pulse" />
            </div>
            <div>
              <h2 className="text-4xl font-black text-rose-950 tracking-tight">Live Sanctuary</h2>
              <p className="text-rose-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1 italic">Join live prayer and intercession sessions</p>
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {lives.filter(l => l.active).map((l) => (
              <div key={l.id} className="bg-white rounded-[3.5rem] p-10 shadow-2xl border-4 border-rose-50 flex items-center justify-between gap-6 group hover:border-rose-200 transition-all">
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <span className="w-3 h-3 rounded-full bg-rose-600 animate-ping"></span>
                    <span className="text-[10px] font-black text-rose-600 uppercase tracking-widest">Happening Now</span>
                  </div>
                  <h3 className="text-2xl font-black text-rose-950 tracking-tight">{l.title}</h3>
                  <p className="text-xs font-bold text-gray-400">Pastoral lead session. Join our global gathering.</p>
                </div>
                <a 
                  href={l.url} 
                  target="_blank" 
                  rel="noreferrer" 
                  className="px-8 py-5 bg-rose-600 text-white rounded-[2rem] font-black uppercase text-xs tracking-widest flex items-center gap-2 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-rose-100"
                >
                  Join Sanctuary <ExternalLink size={16} />
                </a>
              </div>
            ))}
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
                         <span className="px-3 py-1 bg-red-50 text-red-600 rounded-full text-[9px] font-black uppercase tracking-widest">Official Teaching</span>
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
                  <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{p.timestamp?.toLocaleDateString()}</span>
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

      {/* COMMUNITY HUB - Tabbed Sections */}
      <section>
        <div className="flex items-center gap-6 mb-12">
          <div className="bg-gradient-to-r from-rose-600 to-purple-600 p-4 rounded-3xl text-white shadow-xl">
            <Users size={32} />
          </div>
          <div>
            <h2 className="text-4xl font-black text-rose-950 tracking-tight">Community Hub</h2>
            <p className="text-rose-400 font-black uppercase text-[10px] tracking-[0.3em] mt-1">Connect, Share & Grow Together</p>
          </div>
        </div>

        {/* Community Tabs Menu */}
        <div className="flex gap-4 overflow-x-auto pb-8 mb-6 no-scrollbar">
          {COMMUNITY_TABS.map(tab => (
            <button
              key={tab}
              onClick={() => setSelectedCommunityTab(tab)}
              className={`px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest whitespace-nowrap transition-all border-2 ${
                selectedCommunityTab === tab 
                ? 'bg-gradient-to-r from-rose-600 to-purple-600 border-transparent text-white shadow-lg shadow-rose-200' 
                : 'bg-white border-rose-100 text-rose-300 hover:border-rose-300 hover:text-rose-500'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Swipe Indicator for Mobile */}
        <div className="flex items-center justify-center gap-2 mb-8 md:hidden">
          <div className="flex items-center gap-1">
            {COMMUNITY_TABS.map((tab, index) => (
              <div
                key={tab}
                className={`h-2 w-2 rounded-full transition-all ${
                  selectedCommunityTab === tab 
                    ? 'bg-gradient-to-r from-rose-600 to-purple-600 w-6' 
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Swipe Across For More</span>
        </div>

        {/* Tab Content */}
        <div className="animate-in fade-in slide-in-from-top-4 duration-500">
          {/* Prayer Board Tab */}
          {selectedCommunityTab === 'Prayer Board' && (
            <div>
              {/* Mobile Swipe Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6 md:hidden">
                <div className="flex items-center gap-1">
                  {COMMUNITY_TABS.map((tab, index) => (
                    <div
                      key={tab}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        selectedCommunityTab === tab 
                          ? 'bg-gradient-to-r from-rose-600 to-purple-600 w-4' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Swipe Across For More</span>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="bg-rose-100 p-3 rounded-2xl text-rose-600">
                  <Hand size={24} strokeWidth={3} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-rose-950 tracking-tight">Community Prayer Board</h3>
                  <p className="text-rose-400 font-black uppercase text-[9px] tracking-[0.3em] mt-1">Lifting each other in the Kingdom</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 relative">
                  {!user && <PublicOverlay />}
                  <div className={`bg-white p-8 rounded-[3rem] border-4 border-rose-50 shadow-2xl h-fit ${!user ? 'opacity-20 pointer-events-none' : ''}`}>
                    <h4 className="text-lg font-black text-rose-950 uppercase tracking-tight mb-6">Submit Request</h4>
                    <textarea 
                      value={newPrayer}
                      onChange={e => setNewPrayer(e.target.value)}
                      className="w-full p-5 rounded-[2rem] bg-rose-50/30 border-2 border-transparent focus:border-rose-100 outline-none min-h-[140px] font-bold text-rose-900 placeholder:text-rose-200"
                      placeholder="What can the community pray for?"
                    />
                    <div className="flex items-center justify-between mt-6">
                      <label className="flex items-center gap-3 cursor-pointer group">
                        <div className={`w-7 h-7 rounded-xl border-2 transition-all flex items-center justify-center ${isAnon ? 'bg-rose-600 border-rose-600 text-white shadow-md' : 'bg-white border-rose-100'}`}>
                          {isAnon && <CheckCircle2 size={12} strokeWidth={4} />}
                        </div>
                        <input type="checkbox" checked={isAnon} onChange={e => setIsAnon(e.target.checked)} className="hidden" />
                        <span className="text-xs font-black text-rose-950 uppercase tracking-widest">Anonymous</span>
                      </label>
                      <button 
                        onClick={addPrayer}
                        className="w-12 h-12 bg-rose-600 text-white rounded-2xl shadow-xl flex items-center justify-center hover:scale-105 transition-transform"
                      >
                        <Send size={20} />
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  {prayers.map((p) => (
                    <div key={p.id} className="bg-white p-8 rounded-[2.5rem] border-4 border-white shadow-xl group hover:border-rose-50 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-rose-600 uppercase tracking-widest px-2 py-1 bg-rose-50 rounded-full">{p.userName}</span>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{p.timestamp?.toLocaleDateString()}</span>
                          </div>
                          {p.isAnonymous && <span className="text-[8px] font-black text-amber-600 uppercase tracking-widest">🙏 Anonymous Request</span>}
                        </div>
                        <button onClick={() => likePrayer(p.id, p.amenCount)} className="group">
                          <div className="flex items-center gap-2 px-4 py-2 bg-rose-50 rounded-2xl group-hover:bg-rose-100 transition-colors">
                            <Heart size={16} className="text-rose-600 group-hover:scale-110 transition-transform" />
                            <span className="text-xs font-black text-rose-600">{p.amenCount}</span>
                          </div>
                        </button>
                      </div>
                      <p className="text-rose-900 font-bold text-lg leading-relaxed mb-4">"{p.content}"</p>
                      <div className="mt-auto pt-4 border-t border-rose-50">
                         <CommentSection collectionName="prayers" id={p.id} comments={p.comments || []} activeUser={user} onAddComment={addComment} />
                      </div>
                    </div>
                  ))}
                  {prayers.length === 0 && <div className="text-center text-gray-400 font-bold py-12">No prayer requests yet. Be the first to share!</div>}
                </div>
              </div>
            </div>
          )}

          {/* Friendship Bench Tab */}
          {selectedCommunityTab === 'Friendship Bench' && (
            <div>
              {/* Mobile Swipe Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6 md:hidden">
                <div className="flex items-center gap-1">
                  {COMMUNITY_TABS.map((tab, index) => (
                    <div
                      key={tab}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        selectedCommunityTab === tab 
                          ? 'bg-gradient-to-r from-rose-600 to-purple-600 w-4' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Swipe Across For More</span>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="bg-teal-100 p-3 rounded-2xl text-teal-600">
                  <Coffee size={24} strokeWidth={2.5} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-teal-950 tracking-tight">The Friendship Bench</h3>
                  <p className="text-teal-400 font-black uppercase text-[9px] tracking-[0.3em] mt-1">Find Your Kingdom Companions</p>
                </div>
              </div>

              <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 relative">
                  {!user && <PublicOverlay />}
                  <div className={`bg-white p-8 rounded-[3rem] border-4 border-teal-50 shadow-2xl h-fit ${!user ? 'opacity-20 pointer-events-none' : ''}`}>
                    <h4 className="text-lg font-black text-teal-950 uppercase tracking-tight mb-6">Post on Bench</h4>
                    <div className="space-y-4">
                      <select 
                        value={friendshipCategory}
                        onChange={e => setFriendshipCategory(e.target.value as any)}
                        className="w-full px-5 py-3 rounded-xl bg-teal-50/30 border-2 border-transparent focus:border-teal-100 outline-none font-bold text-teal-900"
                      >
                        <option value="Prayer Partner">Prayer Partner</option>
                        <option value="Same Church">Same Church</option>
                        <option value="Same City">Same City</option>
                      </select>
                      <textarea 
                        value={newFriendshipContent}
                        onChange={e => setNewFriendshipContent(e.target.value)}
                        className="w-full p-5 rounded-[2rem] bg-teal-50/30 border-2 border-transparent focus:border-teal-100 outline-none min-h-[120px] font-bold text-teal-900 placeholder:text-teal-200"
                        placeholder="Share your heart and what you're looking for..."
                      />
                      <button 
                        onClick={addFriendshipPost}
                        className="w-full py-4 bg-teal-600 text-white rounded-2xl font-black shadow-xl hover:bg-teal-700 transition-colors"
                      >
                        Post on Bench
                      </button>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-2 space-y-6">
                  {friendshipPosts.map((post) => (
                    <div key={post.id} className="bg-white p-8 rounded-[2.5rem] border-4 border-white shadow-xl group hover:border-teal-50 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[9px] font-black text-teal-600 uppercase tracking-widest px-2 py-1 bg-teal-50 rounded-full">{post.userName}</span>
                            <span className="text-[9px] font-black text-gray-300 uppercase tracking-widest">{post.timestamp?.toLocaleDateString()}</span>
                          </div>
                          <span className="text-[8px] font-black text-teal-600 uppercase tracking-widest bg-teal-50 px-2 py-1 rounded-full">{post.category}</span>
                        </div>
                      </div>
                      <p className="text-gray-800 font-bold text-lg mb-4">"{post.content}"</p>
                      <div className="space-y-2 mb-4 p-4 bg-gray-50 rounded-2xl">
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                           <Users size={12} className="text-teal-500" /> {post.userName}
                        </div>
                        {post.userChurch && (
                          <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                            <Church size={12} className="text-teal-500" /> {post.userChurch}
                          </div>
                        )}
                        <div className="flex items-center gap-2 text-xs font-bold text-gray-500">
                          <MapPin size={12} className="text-teal-500" /> {post.userLocation}
                        </div>
                      </div>
                      <div className="mt-auto pt-4 border-t border-teal-50">
                         <CommentSection collectionName="friendship_posts" id={post.id} comments={post.comments || []} activeUser={user} onAddComment={addComment} />
                      </div>
                    </div>
                  ))}
                  {friendshipPosts.length === 0 && <div className="text-center text-gray-400 font-bold py-12">No posts on the Friendship Bench yet. Be the first to reach out!</div>}
                </div>
              </div>
            </div>
          )}

          {/* Kingdom Testimonies Tab */}
          {selectedCommunityTab === 'Kingdom Testimonies' && (
            <div>
              {/* Mobile Swipe Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6 md:hidden">
                <div className="flex items-center gap-1">
                  {COMMUNITY_TABS.map((tab, index) => (
                    <div
                      key={tab}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        selectedCommunityTab === tab 
                          ? 'bg-gradient-to-r from-rose-600 to-purple-600 w-4' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Swipe Across For More</span>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="bg-amber-100 p-3 rounded-2xl text-amber-600">
                  <Star size={24} fill="currentColor" />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-amber-950 tracking-tight">Kingdom Testimonies</h3>
                  <p className="text-amber-400 font-black uppercase text-[9px] tracking-[0.3em] mt-1">God's Faithfulness in Action</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {testimonies.map((t) => (
                  <div key={t.id} className="bg-white rounded-[3rem] p-8 shadow-2xl border-4 border-amber-50 group hover:border-amber-100 transition-all">
                    <div className="aspect-video mb-6 rounded-2xl overflow-hidden">
                      <img src={t.image} alt={t.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="space-y-4">
                      <h3 className="text-xl font-black text-amber-950 mb-4 tracking-tight">{t.title}</h3>
                      <p className="text-amber-900 font-bold italic text-lg leading-relaxed mb-6 flex-1">"{t.content}"</p>
                      <div className="flex items-center gap-3 text-amber-600 font-black text-xs uppercase tracking-widest bg-amber-50 w-fit px-4 py-2 rounded-2xl mb-6">
                        <Users size={14} /> Verified Union
                      </div>
                      <div className="pt-6 border-t border-amber-50">
                        <CommentSection collectionName="testimonies" id={t.id} comments={t.comments || []} activeUser={user} onAddComment={addComment} />
                      </div>
                    </div>
                  </div>
                ))}
                {testimonies.length === 0 && (
                  <div className="col-span-full p-12 bg-white rounded-[3rem] text-center text-gray-400 font-bold border-2 border-dashed border-amber-100">
                    Testimonies loading... or none yet shared.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Lifestyle Connect Events Tab */}
          {selectedCommunityTab === 'Lifestyle Connect Events' && (
            <div>
              {/* Mobile Swipe Indicator */}
              <div className="flex items-center justify-center gap-2 mb-6 md:hidden">
                <div className="flex items-center gap-1">
                  {COMMUNITY_TABS.map((tab, index) => (
                    <div
                      key={tab}
                      className={`h-1.5 w-1.5 rounded-full transition-all ${
                        selectedCommunityTab === tab 
                          ? 'bg-gradient-to-r from-rose-600 to-purple-600 w-4' 
                          : 'bg-gray-300'
                      }`}
                    />
                  ))}
                </div>
                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Swipe Across For More</span>
              </div>

              <div className="flex items-center gap-4 mb-8">
                <div className="bg-purple-600 p-3 rounded-2xl text-white shadow-xl">
                  <Calendar size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-purple-950 tracking-tight">Lifestyle Connect Events</h3>
                  <p className="text-purple-400 font-black uppercase text-[9px] tracking-[0.3em] mt-1 italic">Community Gatherings & Meetups</p>
                </div>
              </div>

              {/* Admin Event Form */}
              {user?.isAdmin && (
                <div className="mb-8">
                  <button
                    onClick={() => setShowEventForm(!showEventForm)}
                    className="px-6 py-3 bg-purple-600 text-white rounded-xl font-black text-sm hover:bg-purple-700 transition-colors flex items-center gap-2"
                  >
                    <Plus size={16} />
                    {showEventForm ? 'Cancel Event' : 'Add New Event'}
                  </button>

                  {showEventForm && (
                    <div className="bg-white p-8 rounded-3xl shadow-2xl border-4 border-purple-50 mt-6">
                      <h4 className="text-xl font-black text-purple-950 mb-6">Create New Event</h4>
                      
                      <div className="grid md:grid-cols-2 gap-6 mb-6">
                        <div>
                          <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-3 mb-1 block">Event Name</label>
                          <input
                            type="text"
                            value={newEvent.name}
                            onChange={e => setNewEvent(prev => ({ ...prev, name: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-purple-50/50 outline-none font-bold text-purple-950 border-2 border-transparent focus:border-purple-100"
                            placeholder="Enter event name"
                          />
                        </div>
                        
                        <div>
                          <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-3 mb-1 block">Date</label>
                          <input
                            type="date"
                            value={newEvent.date}
                            onChange={e => setNewEvent(prev => ({ ...prev, date: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-purple-50/50 outline-none font-bold text-purple-950 border-2 border-transparent focus:border-purple-100"
                          />
                        </div>
                        
                        <div>
                          <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-3 mb-1 block">Time</label>
                          <input
                            type="time"
                            value={newEvent.time}
                            onChange={e => setNewEvent(prev => ({ ...prev, time: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-purple-50/50 outline-none font-bold text-purple-950 border-2 border-transparent focus:border-purple-100"
                          />
                        </div>
                        
                        <div>
                          <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-3 mb-1 block">Place</label>
                          <input
                            type="text"
                            value={newEvent.place}
                            onChange={e => setNewEvent(prev => ({ ...prev, place: e.target.value }))}
                            className="w-full px-4 py-3 rounded-xl bg-purple-50/50 outline-none font-bold text-purple-950 border-2 border-transparent focus:border-purple-100"
                            placeholder="Event location"
                          />
                        </div>
                      </div>

                      <div className="mb-6">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-3 mb-1 block">Description</label>
                        <textarea
                          value={newEvent.description}
                          onChange={e => setNewEvent(prev => ({ ...prev, description: e.target.value }))}
                          className="w-full px-4 py-3 rounded-xl bg-purple-50/50 outline-none font-bold text-purple-950 border-2 border-transparent focus:border-purple-100 h-20 resize-none"
                          placeholder="Describe the event..."
                        />
                      </div>

                      <div className="mb-6">
                        <label className="text-[9px] font-black text-purple-400 uppercase tracking-widest ml-3 mb-1 block">Event Photo</label>
                        <div className="flex items-center gap-4">
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleEventPhotoUpload}
                            className="hidden"
                            id="event-photo-upload-tab"
                          />
                          <label
                            htmlFor="event-photo-upload-tab"
                            className="px-6 py-3 bg-purple-100 text-purple-700 rounded-xl font-black text-sm hover:bg-purple-200 transition-colors flex items-center gap-2 cursor-pointer"
                          >
                            <Upload size={16} />
                            {newEvent.photo ? 'Change Photo' : 'Upload Photo'}
                          </label>
                          {newEvent.photo && (
                            <img src={newEvent.photo} alt="Event preview" className="w-14 h-14 rounded-xl object-cover" />
                          )}
                        </div>
                      </div>

                      <div className="flex gap-4">
                        <button
                          onClick={addEvent}
                          className="px-8 py-3 bg-purple-600 text-white rounded-xl font-black hover:bg-purple-700 transition-colors"
                        >
                          Create Event
                        </button>
                        <button
                          onClick={() => setShowEventForm(false)}
                          className="px-8 py-3 bg-gray-200 text-gray-700 rounded-xl font-black hover:bg-gray-300 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Events Display */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {events.map((event) => (
                  <div key={event.id} className="bg-white rounded-[3rem] p-6 shadow-2xl border-4 border-purple-50 overflow-hidden group hover:border-purple-200 transition-all">
                    {event.photo && (
                      <div className="aspect-video mb-4 rounded-2xl overflow-hidden">
                        <img 
                          src={event.photo} 
                          alt={event.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                      </div>
                    )}
                    
                    <div className="space-y-3">
                      <h4 className="text-lg font-black text-purple-950 leading-tight">{event.name}</h4>
                      
                      <div className="flex items-center gap-3 text-sm font-bold text-purple-600">
                        <Calendar size={14} />
                        <span>{event.date}</span>
                        <span>•</span>
                        <span>{event.time}</span>
                      </div>
                      
                      <div className="flex items-center gap-2 text-sm font-bold text-purple-600">
                        <MapPin size={14} />
                        <span>{event.place}</span>
                      </div>
                      
                      <p className="text-gray-700 font-bold text-sm leading-relaxed line-clamp-3">{event.description}</p>
                      
                      <div className="flex items-center gap-2 text-xs font-bold text-gray-400">
                        <span>Posted {event.timestamp?.toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {events.length === 0 && (
                <div className="col-span-full p-12 bg-white rounded-[3rem] text-center text-gray-400 font-bold border-2 border-dashed border-purple-100">
                  <Calendar size={48} className="mx-auto text-purple-300 mb-4" />
                  No events scheduled yet. Check back soon!
                </div>
              )}
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
                 <img src={v.images?.[0] || 'https://via.placeholder.com/300'} crossOrigin="anonymous" referrerPolicy="no-referrer" className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-1000" />
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
                  <span className="text-[8px] font-bold text-gray-300 uppercase">{new Date(c.timestamp?.seconds * 1000 || c.timestamp).toLocaleDateString()}</span>
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
