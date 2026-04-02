import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { MapPin, Search, Star, ChevronRight } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const CATEGORIES = [
  { name: 'Birthday Decorators', tag: 'Birthday', image: 'https://images.unsplash.com/photo-1761300725208-e8f92da35f5c?w=400&h=300&fit=crop' },
  { name: 'Anniversary Decorators', tag: 'Anniversary', image: 'https://images.unsplash.com/photo-1759730840961-09faa5731a3b?w=400&h=300&fit=crop' },
  { name: 'Baby Shower', tag: 'Baby Shower', image: 'https://images.unsplash.com/photo-1766918780916-228d10b071be?w=400&h=300&fit=crop' },
  { name: 'Under 6k', tag: 'Under 6k', image: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400&h=300&fit=crop' },
];

function VendorCard({ vendor, onClick }) {
  return (
    <div
      data-testid={`vendor-card-${vendor.vendor_id}`}
      onClick={onClick}
      className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden cursor-pointer min-w-[260px] flex-shrink-0"
    >
      <div className="h-36 bg-gray-100 overflow-hidden">
        <img
          src={vendor.cover_photos?.[0] || 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=400'}
          alt={vendor.business_name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3">
        <div className="flex items-start justify-between mb-1">
          <h3 className="font-semibold text-sm text-black truncate flex-1">{vendor.business_name}</h3>
          <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded ml-2 flex-shrink-0">
            <Star size={12} className="text-green-600 fill-green-600" />
            <span className="text-xs font-semibold text-green-700">{vendor.rating}</span>
          </div>
        </div>
        <p className="text-gray-500 text-xs mb-2">Starting from <span className="font-semibold text-black">&#8377;{vendor.starting_price?.toLocaleString('en-IN')}</span></p>
        <div className="flex gap-1 flex-wrap">
          {vendor.category_tags?.slice(0, 3).map((tag) => (
            <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HomePage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [vendors, setVendors] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchVendors();
  }, []);

  const fetchVendors = async () => {
    try {
      const res = await axios.get(`${API}/vendors`);
      setVendors(res.data);
    } catch (err) {
      console.error('Error fetching vendors:', err);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/vendors?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <div data-testid="home-page" className="max-w-md mx-auto min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40" style={{ backgroundColor: '#DC143C' }}>
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <MapPin size={16} className="text-white" />
              <span className="text-white text-xs font-medium">Chennai</span>
            </div>
            <h1 data-testid="home-logo" className="font-logo text-white text-xl font-bold">Eventi</h1>
            <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
              {user?.picture ? (
                <img src={user.picture} alt="" className="w-full h-full object-cover" />
              ) : (
                <span className="text-white text-xs font-bold">{user?.name?.[0] || 'U'}</span>
              )}
            </div>
          </div>
          <form onSubmit={handleSearch}>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <Input
                data-testid="home-search"
                placeholder="Search birthday decoration"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 h-10 rounded-full bg-white border-0 text-sm placeholder:text-gray-400"
              />
            </div>
          </form>
        </div>
      </div>

      {/* Categories */}
      <div className="px-4 pt-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-black">Categories</h2>
          <button
            data-testid="see-all-vendors"
            onClick={() => navigate('/vendors')}
            className="text-xs font-medium"
            style={{ color: '#DC143C' }}
          >
            See all
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.tag}
              data-testid={`category-${cat.tag.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => navigate(`/vendors?category=${encodeURIComponent(cat.tag)}`)}
              className="relative rounded-[12px] overflow-hidden cursor-pointer h-28"
            >
              <img src={cat.image} alt={cat.name} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
              <p className="absolute bottom-2 left-3 text-white text-xs font-semibold">{cat.name}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Vendor Cards - Horizontal Scroll */}
      <div className="px-4 pt-6">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-black">Top Decorators</h2>
          <button
            onClick={() => navigate('/vendors')}
            className="flex items-center gap-1 text-xs font-medium"
            style={{ color: '#DC143C' }}
          >
            View all <ChevronRight size={14} />
          </button>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide" style={{ scrollbarWidth: 'none' }}>
          {vendors.map((v) => (
            <VendorCard key={v.vendor_id} vendor={v} onClick={() => navigate(`/vendor/${v.vendor_id}`)} />
          ))}
        </div>
      </div>

      <BottomNav />
    </div>
  );
}
