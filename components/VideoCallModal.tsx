
import React, { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Video, VideoOff, PhoneOff, Minimize2, Maximize2 } from 'lucide-react';

interface VideoCallModalProps {
  isOpen: boolean;
  onClose: () => void;
  partnerName: string;
  partnerImage: string;
}

const VideoCallModal: React.FC<VideoCallModalProps> = ({ isOpen, onClose, partnerName, partnerImage }) => {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    if (isOpen) {
      startVideo();
    } else {
      stopVideo();
    }
    return () => stopVideo();
  }, [isOpen]);

  const startVideo = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      streamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (err) {
      console.error("Error accessing media devices:", err);
      alert("Could not access camera/microphone. Please check permissions.");
    }
  };

  const stopVideo = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
  };

  const toggleMute = () => {
    if (streamRef.current) {
      streamRef.current.getAudioTracks().forEach(track => track.enabled = !track.enabled);
      setIsMuted(!isMuted);
    }
  };

  const toggleVideo = () => {
    if (streamRef.current) {
      streamRef.current.getVideoTracks().forEach(track => track.enabled = !track.enabled);
      setIsVideoOff(!isVideoOff);
    }
  };

  if (!isOpen) return null;

  return (
    <div className={`fixed z-[200] transition-all duration-300 shadow-2xl overflow-hidden bg-gray-900 ${isMinimized ? 'bottom-4 right-4 w-48 h-72 rounded-2xl border-2 border-white' : 'inset-0 flex flex-col'}`}>
      
      {/* Header (Only visible when not minimized) */}
      {!isMinimized && (
        <div className="absolute top-0 inset-x-0 p-6 z-20 flex justify-between items-start bg-gradient-to-b from-black/60 to-transparent">
          <div className="text-white">
             <h3 className="font-black text-lg drop-shadow-md">{partnerName}</h3>
             <p className="text-xs font-bold text-green-400 flex items-center gap-1">
               <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse" /> Connected
             </p>
          </div>
          <button onClick={() => setIsMinimized(true)} className="p-2 bg-white/10 rounded-full text-white hover:bg-white/20 backdrop-blur-md transition-colors">
            <Minimize2 size={20} />
          </button>
        </div>
      )}

      {/* Remote Video (Simulated for Demo) */}
      <div className="relative flex-1 bg-gray-800 flex items-center justify-center">
         <img src={partnerImage} className="absolute inset-0 w-full h-full object-cover opacity-50 blur-sm" alt="" />
         <div className="relative z-10 flex flex-col items-center animate-pulse">
            <div className="w-24 h-24 rounded-full border-4 border-white shadow-xl overflow-hidden mb-4">
                <img src={partnerImage} className="w-full h-full object-cover" alt="" />
            </div>
            <p className="text-white font-black text-xl tracking-widest uppercase">Connecting...</p>
         </div>
      </div>

      {/* Local Video (Picture-in-Picture) */}
      <div className={`absolute transition-all duration-300 bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-white/20 ${isMinimized ? 'inset-0 w-full h-full z-0 opacity-50' : 'bottom-24 right-6 w-32 h-48 z-20'}`}>
         <video ref={localVideoRef} autoPlay muted playsInline className="w-full h-full object-cover transform -scale-x-100" />
         {isVideoOff && <div className="absolute inset-0 flex items-center justify-center bg-gray-800 text-white"><VideoOff size={isMinimized ? 32 : 24} /></div>}
      </div>

      {/* Controls */}
      {!isMinimized ? (
        <div className="absolute bottom-0 inset-x-0 p-8 flex justify-center gap-6 z-30 bg-gradient-to-t from-black/80 to-transparent">
           <button onClick={toggleMute} className={`p-4 rounded-full text-white transition-all ${isMuted ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'}`}>
              {isMuted ? <MicOff size={24} /> : <Mic size={24} />}
           </button>
           <button onClick={onClose} className="p-6 rounded-full bg-red-600 text-white shadow-xl hover:scale-105 transition-transform">
              <PhoneOff size={32} fill="currentColor" />
           </button>
           <button onClick={toggleVideo} className={`p-4 rounded-full text-white transition-all ${isVideoOff ? 'bg-red-500' : 'bg-white/20 hover:bg-white/30 backdrop-blur-md'}`}>
              {isVideoOff ? <VideoOff size={24} /> : <Video size={24} />}
           </button>
        </div>
      ) : (
        <div className="absolute inset-0 z-30 flex items-center justify-center opacity-0 hover:opacity-100 bg-black/60 transition-opacity">
            <button onClick={() => setIsMinimized(false)} className="p-3 bg-white rounded-full text-black mx-1 hover:scale-110 transition-transform"><Maximize2 size={20} /></button>
            <button onClick={onClose} className="p-3 bg-red-600 rounded-full text-white mx-1 hover:scale-110 transition-transform"><PhoneOff size={20} /></button>
        </div>
      )}
    </div>
  );
};

export default VideoCallModal;
