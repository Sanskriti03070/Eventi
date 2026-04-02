import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, User, Calendar, HelpCircle, LogOut, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/context/AuthContext';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function AccountPage() {
  const navigate = useNavigate();
  const { user, logout, refreshUser } = useAuth();
  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`${API}/auth/profile`, { name, phone }, { withCredentials: true });
      await refreshUser();
      setEditing(false);
      toast.success('Profile updated!');
    } catch {
      toast.error('Update failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };

  return (
    <div data-testid="account-page" className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}>
            <ArrowLeft size={20} className="text-black" />
          </button>
          <h1 className="text-base font-semibold text-black">Account</h1>
        </div>
      </div>

      {/* Profile Section */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-4">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-14 h-14 rounded-full bg-gray-100 overflow-hidden flex-shrink-0">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-[#DC143C]">
                  <span className="text-white text-xl font-bold">{user?.name?.[0] || 'U'}</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="font-semibold text-base text-black">{user?.name}</h2>
              <p className="text-xs text-gray-500">{user?.email}</p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-3">
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Name</label>
                <Input
                  data-testid="edit-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="h-10 rounded-[12px] bg-gray-50 border-gray-200"
                />
              </div>
              <div>
                <label className="text-xs text-gray-500 mb-1 block">Phone</label>
                <Input
                  data-testid="edit-phone"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 XXXXX XXXXX"
                  className="h-10 rounded-[12px] bg-gray-50 border-gray-200"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  data-testid="save-profile-btn"
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 h-10 rounded-[12px] bg-[#DC143C] hover:bg-[#B01030] text-white text-sm"
                >
                  {saving ? 'Saving...' : 'Save'}
                </Button>
                <Button
                  onClick={() => { setEditing(false); setName(user?.name || ''); setPhone(user?.phone || ''); }}
                  variant="outline"
                  className="flex-1 h-10 rounded-[12px] text-sm"
                >
                  Cancel
                </Button>
              </div>
            </div>
          ) : (
            <Button
              data-testid="edit-profile-btn"
              onClick={() => setEditing(true)}
              variant="outline"
              className="w-full h-10 rounded-[12px] text-sm border-gray-200"
            >
              Edit Profile
            </Button>
          )}
        </div>
      </div>

      {/* Menu Items */}
      <div className="px-4 pt-4 space-y-1">
        <button
          data-testid="menu-bookings"
          onClick={() => navigate('/my-bookings')}
          className="w-full flex items-center gap-3 bg-white rounded-[12px] border border-gray-100 px-4 py-3.5"
        >
          <Calendar size={18} className="text-gray-500" />
          <span className="text-sm text-black flex-1 text-left">My Bookings</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
        <button
          data-testid="menu-help"
          onClick={() => toast.info('Contact us at help@eventi.in')}
          className="w-full flex items-center gap-3 bg-white rounded-[12px] border border-gray-100 px-4 py-3.5"
        >
          <HelpCircle size={18} className="text-gray-500" />
          <span className="text-sm text-black flex-1 text-left">Help & Support</span>
          <ChevronRight size={16} className="text-gray-400" />
        </button>
        <button
          data-testid="logout-btn"
          onClick={handleLogout}
          className="w-full flex items-center gap-3 bg-white rounded-[12px] border border-gray-100 px-4 py-3.5"
        >
          <LogOut size={18} className="text-red-500" />
          <span className="text-sm text-red-500 flex-1 text-left">Log out</span>
        </button>
      </div>

      <BottomNav />
    </div>
  );
}
