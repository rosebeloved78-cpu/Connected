
import React, { useState, useEffect, useRef } from 'react';
import { User, ChatSession, Message } from '../types';
import { collection, query, where, onSnapshot, addDoc, orderBy, serverTimestamp, doc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase';
import { Send, Loader2, ArrowLeft, MessageCircle, Video, Lock } from 'lucide-react';
import VideoCallModal from '../components/VideoCallModal';
import PaymentModal from '../components/PaymentModal';
import { useAuth } from '../contexts/AuthContext';

const MessagesPage: React.FC<{ user: User }> = ({ user }) => {
  const [chats, setChats] = useState<ChatSession[]>([]);
  const [activeChat, setActiveChat] = useState<ChatSession | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loadingChats, setLoadingChats] = useState(true);
  const [isCallOpen, setIsCallOpen] = useState(false);
  const [paymentModalOpen, setPaymentModalOpen] = useState(false);
  const { refreshProfile } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const canVideoCall = user.tier !== 'free' && user.tier !== 'diaspora_free';

  useEffect(() => {
    const q = query(collection(db, 'chats'), where('participants', 'array-contains', user.id));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetched = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatSession));
      fetched.sort((a, b) => (b.lastMessageTimestamp?.seconds || 0) - (a.lastMessageTimestamp?.seconds || 0));
      setChats(fetched);
      setLoadingChats(false);
    });
    return () => unsubscribe();
  }, [user.id]);

  useEffect(() => {
    if (!activeChat) return;
    const q = query(collection(db, 'chats', activeChat.id, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Message)));
    });
    return () => unsubscribe();
  }, [activeChat]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat) return;
    const text = newMessage;
    setNewMessage('');
    try {
      await addDoc(collection(db, 'chats', activeChat.id, 'messages'), { senderId: user.id, text, timestamp: serverTimestamp() });
      await updateDoc(doc(db, 'chats', activeChat.id), { lastMessage: text, lastMessageTimestamp: serverTimestamp() });
    } catch (err) { console.error(err); }
  };

  const getOtherParticipantId = (chat: ChatSession) => chat.participants.find(pId => pId !== user.id) || '';

  return (
    <div className="max-w-6xl mx-auto h-[calc(100vh-100px)] px-4 py-8 flex gap-6">
      <div className={`w-full md:w-1/3 bg-white rounded-[2.5rem] border-2 border-gray-100 shadow-xl overflow-hidden flex flex-col ${activeChat ? 'hidden md:flex' : 'flex'}`}>
        <div className="p-6 border-b border-gray-100"><h2 className="text-2xl font-black text-rose-950">Messages</h2></div>
        <div className="flex-1 overflow-y-auto p-2 space-y-2">
          {loadingChats ? <div className="p-10 flex justify-center"><Loader2 className="animate-spin text-rose-300" /></div> : chats.map(chat => {
              const otherId = getOtherParticipantId(chat);
              return (
                <button key={chat.id} onClick={() => setActiveChat(chat)} className={`w-full p-4 rounded-3xl flex items-center gap-4 transition-all ${activeChat?.id === chat.id ? 'bg-rose-50 border-2 border-rose-100' : 'hover:bg-gray-50'}`}>
                  <img src={chat.participantImages[otherId]} className="w-14 h-14 rounded-2xl object-cover bg-gray-200" />
                  <div className="text-left"><h4 className="font-black text-gray-900">{chat.participantNames[otherId]}</h4><p className="text-xs font-bold text-gray-500 truncate max-w-[150px]">{chat.lastMessage}</p></div>
                </button>
              );
            })
          }
        </div>
      </div>
      <div className={`w-full md:w-2/3 bg-white rounded-[2.5rem] border-2 border-gray-100 shadow-xl overflow-hidden flex flex-col ${!activeChat ? 'hidden md:flex' : 'flex'}`}>
        {activeChat ? (
          <>
            <div className="p-6 border-b border-gray-100 flex items-center justify-between shadow-sm z-10 bg-white">
              <div className="flex items-center gap-4">
                <button onClick={() => setActiveChat(null)} className="md:hidden text-gray-400"><ArrowLeft /></button>
                <div className="flex items-center gap-3">
                  <img src={activeChat.participantImages[getOtherParticipantId(activeChat)]} className="w-10 h-10 rounded-xl object-cover" />
                  <h3 className="font-black text-gray-900 leading-tight">{activeChat.participantNames[getOtherParticipantId(activeChat)]}</h3>
                </div>
              </div>
              <button onClick={() => { if (!canVideoCall) setPaymentModalOpen(true); else setIsCallOpen(true); }} className={`p-3 rounded-full ${canVideoCall ? 'bg-rose-50 text-rose-600 hover:bg-rose-100' : 'bg-gray-100 text-gray-400'}`}>
                {canVideoCall ? <Video size={20} /> : <Lock size={20} />}
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-gray-50/30">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] p-4 rounded-3xl font-bold text-sm ${msg.senderId === user.id ? 'bg-rose-600 text-white rounded-br-none' : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-none'}`}>{msg.text}</div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
            <form onSubmit={handleSendMessage} className="p-4 bg-white border-t border-gray-100 flex gap-2">
              <input value={newMessage} onChange={e => setNewMessage(e.target.value)} className="flex-1 p-4 bg-gray-50 rounded-2xl border-2 border-transparent focus:border-rose-100 outline-none font-bold text-gray-900" placeholder="Type a message..." />
              <button type="submit" disabled={!newMessage.trim()} className="p-4 bg-rose-600 text-white rounded-2xl hover:scale-105 transition-transform disabled:opacity-50"><Send size={20} /></button>
            </form>
          </>
        ) : <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-gray-300"><MessageCircle size={64} className="mb-4 opacity-20" /><h3 className="text-xl font-black text-gray-400">Select a Chat</h3></div>}
      </div>
      {activeChat && <VideoCallModal isOpen={isCallOpen} onClose={() => setIsCallOpen(false)} partnerName={activeChat.participantNames[getOtherParticipantId(activeChat)]} partnerImage={activeChat.participantImages[getOtherParticipantId(activeChat)]} />}
      <PaymentModal isOpen={paymentModalOpen} onClose={() => setPaymentModalOpen(false)} amount={user.isDiaspora ? 20 : 10} title="Unlock Video Call" description={`Upgrade to ${user.isDiaspora ? 'Premium' : 'Tier 2'} to start calling.`} onSuccess={() => { updateDoc(doc(db, 'users', user.id), { tier: user.isDiaspora ? 'diaspora_premium' : 'tier2' }); refreshProfile(); }} />
    </div>
  );
};

export default MessagesPage;
