
import React, { useState, useEffect } from 'react';
import { X, CreditCard, Smartphone, CheckCircle, Loader2, Lock, ShieldCheck, DollarSign } from 'lucide-react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  amount: number;
  title: string;
  description: string;
  onSuccess: () => void;
}

type PaymentMethod = 'stripe' | 'paypal' | 'ecocash' | null;

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, amount, title, description, onSuccess }) => {
  const [method, setMethod] = useState<PaymentMethod>(null);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<'select' | 'process' | 'success'>('select');
  
  // EcoCash State
  const [phoneNumber, setPhoneNumber] = useState('');
  
  // Card State
  const [cardNumber, setCardNumber] = useState('');
  const [expiry, setExpiry] = useState('');
  const [cvc, setCvc] = useState('');

  useEffect(() => {
    if (isOpen) {
      setStep('select');
      setMethod(null);
      setLoading(false);
      setPhoneNumber('');
      setCardNumber('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handlePayment = async () => {
    setLoading(true);
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 3000));
    setLoading(false);
    setStep('success');
    setTimeout(() => {
      onSuccess();
      onClose();
    }, 2000);
  };

  const renderSelection = () => (
    <div className="space-y-4">
      <button 
        onClick={() => { setMethod('ecocash'); setStep('process'); }}
        className="w-full p-4 rounded-2xl border-2 border-blue-100 hover:border-blue-500 hover:bg-blue-50 transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center">
            <Smartphone size={24} />
          </div>
          <div className="text-left">
            <h4 className="font-black text-blue-900">EcoCash</h4>
            <p className="text-xs font-bold text-gray-400">Mobile Money (Zimbabwe)</p>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-blue-200 group-hover:border-blue-600"></div>
      </button>

      <button 
        onClick={() => { setMethod('stripe'); setStep('process'); }}
        className="w-full p-4 rounded-2xl border-2 border-gray-100 hover:border-indigo-500 hover:bg-indigo-50 transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
            <CreditCard size={24} />
          </div>
          <div className="text-left">
            <h4 className="font-black text-gray-900">Credit Card</h4>
            <p className="text-xs font-bold text-gray-400">Powered by Stripe</p>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-indigo-600"></div>
      </button>

      <button 
        onClick={() => { setMethod('paypal'); setStep('process'); }}
        className="w-full p-4 rounded-2xl border-2 border-yellow-100 hover:border-yellow-500 hover:bg-yellow-50 transition-all flex items-center justify-between group"
      >
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-[#003087] text-white flex items-center justify-center relative overflow-hidden">
             <span className="font-black italic text-[10px] z-10">Pay</span>
             <div className="absolute inset-0 bg-gradient-to-br from-[#003087] to-[#009cde]"></div>
          </div>
          <div className="text-left">
            <h4 className="font-black text-gray-900">PayPal</h4>
            <p className="text-xs font-bold text-gray-400">International Secure Checkout</p>
          </div>
        </div>
        <div className="w-6 h-6 rounded-full border-2 border-gray-200 group-hover:border-yellow-600"></div>
      </button>
    </div>
  );

  const renderProcess = () => {
    if (method === 'ecocash') {
      return (
        <div className="space-y-6">
          <div className="bg-blue-50 p-6 rounded-3xl border border-blue-100 text-center">
            <p className="text-xs font-black text-blue-400 uppercase tracking-widest mb-1">Amount Due</p>
            <p className="text-4xl font-black text-blue-900 tracking-tighter">${amount.toFixed(2)}</p>
          </div>
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">EcoCash Number</label>
            <input 
              type="tel" 
              value={phoneNumber}
              onChange={e => setPhoneNumber(e.target.value)}
              placeholder="077..." 
              className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-blue-500 outline-none font-bold text-gray-900 text-lg"
            />
            <p className="text-[10px] font-bold text-gray-400 px-2">You will receive a USSD popup on your phone to enter your PIN.</p>
          </div>
          <button 
            onClick={handlePayment}
            disabled={!phoneNumber || loading}
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl hover:bg-blue-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" /> : 'Send Request'}
          </button>
        </div>
      );
    }

    if (method === 'stripe') {
      return (
        <div className="space-y-6">
           <div className="bg-indigo-50 p-6 rounded-3xl border border-indigo-100 text-center">
            <p className="text-xs font-black text-indigo-400 uppercase tracking-widest mb-1">Total to Pay</p>
            <p className="text-4xl font-black text-indigo-900 tracking-tighter">${amount.toFixed(2)}</p>
          </div>
          <div className="space-y-4">
            <div className="space-y-2">
               <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Card Number</label>
               <div className="relative">
                 <input 
                    type="text" 
                    value={cardNumber}
                    onChange={e => setCardNumber(e.target.value)}
                    placeholder="0000 0000 0000 0000"
                    className="w-full p-4 pl-12 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-gray-900"
                 />
                 <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
               </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">Expiry</label>
                  <input 
                    type="text" 
                    value={expiry}
                    onChange={e => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-gray-900"
                  />
               </div>
               <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-2">CVC</label>
                  <input 
                    type="text" 
                    value={cvc}
                    onChange={e => setCvc(e.target.value)}
                    placeholder="123"
                    className="w-full p-4 rounded-2xl bg-gray-50 border-2 border-transparent focus:border-indigo-500 outline-none font-bold text-gray-900"
                  />
               </div>
            </div>
          </div>
          <button 
            onClick={handlePayment}
            disabled={!cardNumber || !expiry || !cvc || loading}
            className="w-full py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
          >
             {loading ? <Loader2 className="animate-spin" /> : 'Pay Securely'}
          </button>
        </div>
      );
    }

    if (method === 'paypal') {
        return (
            <div className="space-y-8 text-center pt-4">
                <div className="w-20 h-20 mx-auto bg-blue-50 rounded-full flex items-center justify-center text-[#003087]">
                    <span className="font-black italic text-2xl">Pay</span>
                </div>
                <div>
                    <h4 className="text-xl font-black text-gray-900 mb-2">Continue to PayPal</h4>
                    <p className="text-gray-500 font-bold text-sm px-8">You will be redirected to PayPal to complete your secure payment of <span className="text-gray-900">${amount.toFixed(2)}</span>.</p>
                </div>
                <button 
                    onClick={handlePayment}
                    disabled={loading}
                    className="w-full py-4 bg-[#FFC439] text-[#003087] rounded-2xl font-black shadow-xl hover:brightness-105 transition-all flex items-center justify-center gap-2 disabled:opacity-50"
                >
                    {loading ? <Loader2 className="animate-spin" /> : 'Proceed to PayPal'}
                </button>
            </div>
        );
    }
  };

  const renderSuccess = () => (
    <div className="text-center py-12">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6 text-green-600 animate-in zoom-in duration-300">
            <CheckCircle size={48} />
        </div>
        <h3 className="text-2xl font-black text-green-900 mb-2">Payment Successful!</h3>
        <p className="text-gray-500 font-bold">Thank you for your investment.</p>
    </div>
  );

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white w-full max-w-md rounded-[3rem] shadow-2xl relative overflow-hidden animate-in slide-in-from-bottom-10 duration-500">
        
        {/* Header */}
        <div className="bg-gray-50 px-8 py-6 border-b border-gray-100 flex items-center justify-between">
            <div>
                <h3 className="text-lg font-black text-gray-900 tracking-tight">{title}</h3>
                <p className="text-xs font-bold text-gray-400">{description}</p>
            </div>
            <button onClick={onClose} className="p-2 bg-white rounded-full text-gray-400 hover:text-rose-600 transition-colors shadow-sm">
                <X size={18} />
            </button>
        </div>

        {/* Content */}
        <div className="p-8">
            {step === 'select' && renderSelection()}
            {step === 'process' && renderProcess()}
            {step === 'success' && renderSuccess()}
        </div>

        {/* Secure Footer */}
        {step !== 'success' && (
            <div className="bg-gray-50 px-8 py-4 border-t border-gray-100 flex items-center justify-center gap-2 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                <ShieldCheck size={12} /> 256-Bit Secure SSL Payment
            </div>
        )}
      </div>
    </div>
  );
};

export default PaymentModal;
