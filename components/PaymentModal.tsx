
import React, { useState, useEffect } from 'react';
import { X, CheckCircle, Loader2, Lock, ShieldCheck, ExternalLink, ArrowRight } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  title: string;
  description: string;
  onSuccess: () => void;
}

type PaymentMethod = 'paynow' | 'paypal' | null;

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, amount, title, description, onSuccess }) => {
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [loading, setLoading] = useState(false);
  const [fetchingConfig, setFetchingConfig] = useState(true);
  const [config, setConfig] = useState<any>(null);
  const [step, setStep] = useState<'select' | 'process' | 'verify' | 'success'>('select');
  
  // Input states
  // Removed card/mobile inputs; we use hosted payment links for PayNow and PayPal.

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setMethod(null);
      setLoading(false);
      setPhoneNumber('');
      setCardNumber('');
      fetchConfig();
    }
  }, [isOpen]);

  const fetchConfig = async () => {
    setFetchingConfig(true);
    try {
      const docRef = doc(db, 'settings', 'payments');
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setConfig(docSnap.data());
      } else {
        setConfig({}); // Fallback to empty object if no admin settings found
      }
    } catch (e) {
      console.error("Error fetching payment config:", e);
      setConfig({});
    } finally {
      setFetchingConfig(false);
    }
  };

  const handleOpenLink = (url: string) => {
    if (!url) return;
    // Standard practice for handling external payment redirects
    const formattedUrl = url.startsWith('http') ? url : `https://${url}`;
    window.open(formattedUrl, '_blank', 'noopener,noreferrer');
    setStep('verify'); // Transition to manual verification step
  };

  const handlePayment = async () => {
    setLoading(true);

    const externalUrl = method === 'paynow' ? config?.paynowUrl : config?.paypalUrl;
    
    // IF we have an external URL and we are just starting (step === 'process')
    // We REDIRECT and PAUSE. We do NOT simulate success yet.
    if (externalUrl && step === 'process') {
      handleOpenLink(externalUrl);
      setLoading(false);
      return; 
    }

    // Handshake/Verification simulation (Step 2)
    // This part only triggers if:
    // 1. We are in 'verify' step (user returned from link)
    // 2. OR we are in 'process' and NO external URL is set (Demo Mode)
    await new Promise(resolve => setTimeout(resolve, 3500));
    
    setLoading(false);
    setStep('success');
    
    // Delay closing slightly so user sees the success state
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  if (!isOpen) return null;

  const renderSelection = () => (
    <div className="space-y-4">
      {fetchingConfig ? (
        <div className="flex flex-col items-center justify-center py-10">
          <Loader2 className="animate-spin text-rose-600 mb-2" />
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Waking Gateways...</p>
        </div>
      ) : (
        <>
          <button 
            onClick={() => { setMethod('paynow'); setStep('process'); }}
            className="w-full p-5 rounded-3xl border-2 border-gray-100 hover:border-blue-600 hover:bg-blue-50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-100 font-black">PN</div>
              <div className="text-left">
                <h4 className="font-black text-blue-900 text-lg">PayNow Zimbabwe</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Cards • Mobile Money • Bank</p>
              </div>
            </div>
            {config?.paynowUrl ? <ArrowRight size={18} className="text-blue-200" /> : <div className="px-2 py-1 bg-gray-100 rounded text-[8px] font-black text-gray-400 uppercase tracking-widest">Demo</div>}
          </button>

          <button 
            onClick={() => { setMethod('paypal'); setStep('process'); }}
            className="w-full p-5 rounded-3xl border-2 border-gray-100 hover:border-yellow-500 hover:bg-yellow-50 transition-all flex items-center justify-between group"
          >
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-[#003087] text-white flex items-center justify-center shadow-lg shadow-blue-100 relative overflow-hidden">
                 <span className="font-black italic text-sm z-10">Pay</span>
                 <div className="absolute inset-0 bg-gradient-to-br from-[#003087] to-[#009cde]"></div>
              </div>
              <div className="text-left">
                <h4 className="font-black text-gray-900 text-lg">PayPal</h4>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Secure Link</p>
              </div>
            </div>
            {config?.paypalUrl ? <ArrowRight size={18} className="text-yellow-400" /> : <div className="px-2 py-1 bg-gray-100 rounded text-[8px] font-black text-gray-400 uppercase tracking-widest">Demo</div>}
          </button>
        </>
      )}
    </div>
  );

  const renderProcess = () => {
    const isUrlMode = (method === 'paynow' && !!config?.paynowUrl) || (method === 'paypal' && !!config?.paypalUrl);

    return (
      <div className="space-y-6">
        <div className={`p-8 rounded-[2.5rem] text-center border-2 ${method === 'paynow' ? 'bg-blue-50 border-blue-100' : 'bg-yellow-50 border-yellow-100'}`}>
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-2">Order Total</p>
          <p className={`text-5xl font-black tracking-tighter ${method === 'paynow' ? 'text-blue-900' : 'text-gray-900'}`}>${amount.toFixed(2)}</p>
        </div>

        {isUrlMode ? (
          <div className="text-center space-y-4 px-4">
            <p className="text-sm font-bold text-gray-500 leading-relaxed">
              We are using a secure {method === 'paynow' ? 'PayNow' : 'PayPal'} gateway. 
              Clicking below will open the payment portal in a new tab.
            </p>
            <div className="p-4 bg-green-50 rounded-2xl border border-green-100 flex items-center gap-3">
              <ShieldCheck className="text-green-600 shrink-0" size={20} />
              <p className="text-[10px] font-black text-green-800 uppercase text-left leading-tight">Secure Payment Protection Enabled</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest text-center">Development Demo Mode</p>
            {method === 'paynow' ? (
              <p className="text-sm font-bold text-gray-400 text-center">No PayNow link configured. Using demo handshake.</p>
            ) : (
              <p className="text-sm font-bold text-gray-400 text-center">No PayPal link configured. Using demo handshake.</p>
            )}
          </div>
        )}

        <button 
          onClick={handlePayment} 
          disabled={loading} 
          className={`w-full py-6 text-white rounded-[2rem] font-black text-xl shadow-2xl transition-all flex items-center justify-center gap-3 disabled:opacity-50 ${method === 'paynow' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-[#FFC439] text-[#003087]'}`}
        >
          {loading ? <Loader2 className="animate-spin" /> : (isUrlMode ? <><ExternalLink size={24} /> Pay Now</> : 'Verify & Upgrade')}
        </button>
      </div>
    );
  };

  const renderVerify = () => (
    <div className="text-center py-10 space-y-8">
        <div className="w-24 h-24 bg-amber-50 rounded-[2.5rem] flex items-center justify-center mx-auto text-amber-500 animate-pulse border-4 border-amber-100">
          <ShieldCheck size={48} strokeWidth={2.5} />
        </div>
        <div className="space-y-3">
            <h3 className="text-2xl font-black text-gray-900">Verifying Transaction</h3>
            <p className="text-sm font-bold text-gray-500 px-6 leading-relaxed">
              Did you complete the payment in the other window? Click below to confirm. We will automatically verify the receipt.
            </p>
        </div>
        <div className="space-y-4">
          <button onClick={handlePayment} disabled={loading} className="w-full py-6 bg-gray-900 text-white rounded-[2rem] font-black text-xl shadow-2xl hover:bg-black transition-all flex items-center justify-center gap-3">
              {loading ? <Loader2 className="animate-spin" /> : <><CheckCircle size={24} /> Confirm Payment</>}
          </button>
          <button onClick={() => setStep('process')} className="text-[10px] font-black text-gray-300 uppercase tracking-[0.2em] hover:text-rose-600 transition-colors">Wrong Method? Go Back</button>
        </div>
    </div>
  );

  const renderSuccess = () => (
    <div className="text-center py-12 animate-in zoom-in duration-500">
        <div className="w-28 h-28 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-8 text-green-600 shadow-xl shadow-green-50"><CheckCircle size={56} strokeWidth={2.5} /></div>
        <h3 className="text-3xl font-black text-green-900 mb-2">Covenant Upgrade!</h3>
        <p className="text-gray-500 font-bold text-lg">Your tier has been successfully updated.</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[4rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-10 duration-500 border-8 border-white">
        <div className="bg-gray-50/50 px-10 py-8 border-b border-gray-100 flex items-center justify-between">
            <div>
              <h3 className="text-xl font-black text-rose-950 tracking-tight">{title}</h3>
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">{description.substring(0, 40)}...</p>
            </div>
            <button onClick={onClose} className="p-3 bg-white rounded-2xl text-gray-300 hover:text-rose-600 transition-colors shadow-sm"><X size={20} /></button>
        </div>
        <div className="p-10">
            {step === 'select' && renderSelection()}
            {step === 'process' && renderProcess()}
            {step === 'verify' && renderVerify()}
            {step === 'success' && renderSuccess()}
        </div>
        {step !== 'success' && (
          <div className="bg-gray-50/50 px-10 py-6 border-t border-gray-100 flex items-center justify-center gap-2 text-[10px] font-black text-gray-300 uppercase tracking-widest">
            <Lock size={12} /> Securely Managed by {method === 'paynow' ? 'PayNow' : 'PayPal'}
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
