import React, { useState } from 'react';
import { HashRouter as Router, Routes, Route, Navigate, Link } from 'react-router-dom';
import { Heart, Users, Gift as GiftIcon, MessageCircle, User as UserIcon, LogOut, Menu, X, Loader2, LayoutDashboard, Send } from 'lucide-react';
import LandingPage from '../pages/Landing';
import LoginPage from '../pages/Login';
import SignupPage from '../pages/Signup';
import Onboarding from '../pages/Onboarding';
import FeedPage from '../pages/Feed';
import DiasporaPage from '../pages/Diaspora';
import GiftPage from '../pages/GiftShop';
import CommunityPage from '../pages/Community';
import ProfilePage from '../pages/Profile';
import MessagesPage from '../pages/Messages';
import AdminDashboard from '../pages/AdminDashboard';
import { Logo } from '../constants';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { InstallApp } from './InstallApp';

const AppContent: React.FC = () => {
  const { userProfile, loading, logout } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDF8F9]">
        <Loader2 className="w-12 h-12 text-rose-600 animate-spin" />
      </div>
    );
  }

  const handleLogout = async () => {
    await logout();
    setIsMenuOpen(false);
  };

  const NavLink = ({ to, children, icon: Icon }: { to: string; children?: React.ReactNode; icon: any }) => (
    <Link
      to={to}
      onClick={() => setIsMenuOpen(false)}
      className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:text-rose-600 font-bold transition-colors"
    >
      <Icon size={18} />
      <span>{children}</span>
    </Link>
  );

  return (
    <Router>
      <div className={`min-h-screen flex flex-col ${userProfile ? 'bg-[#FDF8F9]' : 'bg-white'}`}>
        <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-rose-100 shadow-sm">
          <div className="max-w-6xl mx-auto px-4 h-20 flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <Logo className="w-8 h-8" />
              <span className="font-extrabold text-2xl tracking-tight text-gray-900 hidden sm:inline">Lifestyle <span className="text-rose-600">Connect</span></span>
            </Link>

            <div className="hidden md:flex items-center gap-1">
              {userProfile ? (
                <>
                  <NavLink to="/feed" icon={Heart}>Match</NavLink>
                  <NavLink to="/messages" icon={Send}>Messages</NavLink>
                  <NavLink to="/diaspora" icon={Users}>Diaspora</NavLink>
                  <NavLink to="/gifts" icon={GiftIcon}>Gifts</NavLink>
                  <NavLink to="/community" icon={MessageCircle}>Community</NavLink>
                  <NavLink to="/profile" icon={UserIcon}>Profile</NavLink>
                  {userProfile.isAdmin && (
                    <NavLink to="/admin" icon={LayoutDashboard}>Admin</NavLink>
                  )}
                  <button
                    onClick={handleLogout}
                    className="ml-4 p-2 text-gray-400 hover:text-rose-600 transition-colors"
                    title="Logout"
                  >
                    <LogOut size={20} />
                  </button>
                </>
              ) : (
                <NavLink to="/community" icon={MessageCircle}>Community</NavLink>
              )}
              {/* Install Button for Desktop */}
              <div className="ml-2">
                <InstallApp />
              </div>
            </div>

            <button
              className="md:hidden p-2 text-gray-700 bg-gray-50 rounded-2xl"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? <X /> : <Menu />}
            </button>
          </div>

          {isMenuOpen && (
            <div className="md:hidden bg-white border-b border-rose-100 animate-in slide-in-from-top duration-300">
              <div className="flex flex-col p-6 space-y-4">
                {userProfile ? (
                  <>
                    <NavLink to="/feed" icon={Heart}>Find Matches</NavLink>
                    <NavLink to="/messages" icon={Send}>Messages</NavLink>
                    <NavLink to="/diaspora" icon={Users}>Diaspora Connect</NavLink>
                    <NavLink to="/gifts" icon={GiftIcon}>Gift Shop</NavLink>
                    <NavLink to="/community" icon={MessageCircle}>Community</NavLink>
                    <NavLink to="/profile" icon={UserIcon}>My Profile</NavLink>
                    {userProfile.isAdmin && <NavLink to="/admin" icon={LayoutDashboard}>Admin Dashboard</NavLink>}
                    <button onClick={handleLogout} className="flex items-center gap-2 px-4 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black uppercase text-xs tracking-widest">
                      <LogOut size={18} /> Logout
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink to="/community" icon={MessageCircle}>Community</NavLink>
                    <Link to="/onboarding" className="flex items-center gap-2 px-4 py-3 bg-rose-600 text-white rounded-2xl font-black uppercase text-xs tracking-widest">
                      Join Us
                    </Link>
                  </>
                )}
                <div className="pt-2 border-t border-gray-100">
                    <InstallApp mobile />
                </div>
              </div>
            </div>
          )}
        </header>

        <main className="flex-1 overflow-x-hidden relative">
          <Routes>
            <Route path="/" element={userProfile ? <Navigate to="/feed" replace /> : <LandingPage />} />
            <Route path="/login" element={userProfile ? <Navigate to="/feed" replace /> : <LoginPage />} />
            <Route path="/signup" element={userProfile ? <Navigate to="/feed" replace /> : <SignupPage />} />
            <Route path="/onboarding" element={userProfile ? <Navigate to="/feed" replace /> : <Onboarding />} />
            <Route path="/feed" element={userProfile ? <FeedPage user={userProfile} onUpdateUser={() => {}} /> : <Navigate to="/" replace />} />
            <Route path="/messages" element={userProfile ? <MessagesPage user={userProfile} /> : <Navigate to="/" replace />} />
            <Route path="/diaspora" element={userProfile ? <DiasporaPage user={userProfile} /> : <Navigate to="/" replace />} />
            <Route path="/gifts" element={userProfile ? <GiftPage user={userProfile} /> : <Navigate to="/" replace />} />
            <Route path="/community" element={<CommunityPage user={userProfile} />} />
            <Route path="/profile" element={userProfile ? <ProfilePage user={userProfile} onUpdate={() => {}} /> : <Navigate to="/" replace />} />
            <Route path="/admin" element={userProfile?.isAdmin ? <AdminDashboard user={userProfile} /> : <Navigate to="/" replace />} />
          </Routes>
        </main>

        <footer className={`py-12 ${userProfile ? 'bg-white border-t border-rose-50' : 'bg-rose-50/20 text-rose-900/40'}`}>
          <div className="max-w-6xl mx-auto px-4 text-center">
            <p className="text-[10px] font-black uppercase tracking-[0.3em]"> 2026 Lifestyle Connect • Ministry Focused</p>
          </div>
        </footer>
      </div>
    </Router>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <AppContent />
  </AuthProvider>
);

export default App;