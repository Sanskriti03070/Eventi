import React, { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Star, SlidersHorizontal } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function VendorListingPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [vendors, setVendors] = useState([]);
  const [sort, setSort] = useState('');
  const [loading, setLoading] = useState(true);

  const category = searchParams.get('category') || '';
  const search = searchParams.get('search') || '';

  useEffect(() => {
    fetchVendors();
  }, [category, search, sort]);

  const fetchVendors = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (category) params.set('category', category);
      if (search) params.set('search', search);
      if (sort) params.set('sort', sort);
      const res = await axios.get(`${API}/vendors?${params.toString()}`);
      setVendors(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const title = category || search || 'All Decorators';

  return (
    <div data-testid="vendor-listing-page" className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button data-testid="back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} className="text-black" />
          </button>
          <h1 className="text-base font-semibold text-black flex-1">{title}</h1>
          <span className="text-xs text-gray-500">{vendors.length} found</span>
        </div>
      </div>

      {/* Filters */}
      <div className="px-4 py-3 flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
        <Select value={sort} onValueChange={setSort}>
          <SelectTrigger data-testid="sort-filter" className="h-9 rounded-full text-xs w-auto min-w-[100px] bg-white border-gray-200">
            <SlidersHorizontal size={14} className="mr-1" />
            <SelectValue placeholder="Sort" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="rating">Top Rated</SelectItem>
            <SelectItem value="price_low">Price: Low to High</SelectItem>
            <SelectItem value="price_high">Price: High to Low</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Vendor List */}
      <div className="px-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#DC143C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : vendors.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-500 text-sm">No decorators found</p>
          </div>
        ) : (
          vendors.map((v) => (
            <div
              key={v.vendor_id}
              data-testid={`listing-card-${v.vendor_id}`}
              onClick={() => navigate(`/vendor/${v.vendor_id}`)}
              className="bg-white rounded-[12px] border border-gray-100 shadow-sm overflow-hidden cursor-pointer"
            >
              <div className="h-44 bg-gray-100 overflow-hidden">
                <img
                  src={v.cover_photos?.[0] || ''}
                  alt={v.business_name}
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="p-3">
                <div className="flex items-start justify-between mb-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-base text-black">{v.business_name}</h3>
                    {v.verified && (
                      <span className="text-blue-500 text-xs">&#10003;</span>
                    )}
                  </div>
                  <div className="flex items-center gap-1 bg-green-50 px-2 py-0.5 rounded flex-shrink-0">
                    <Star size={12} className="text-green-600 fill-green-600" />
                    <span className="text-xs font-semibold text-green-700">{v.rating}</span>
                  </div>
                </div>
                <p className="text-gray-500 text-xs mb-2">
                  Starting from <span className="font-semibold text-black">&#8377;{v.starting_price?.toLocaleString('en-IN')}</span>
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  {v.category_tags?.map((tag) => (
                    <span key={tag} className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{tag}</span>
                  ))}
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
