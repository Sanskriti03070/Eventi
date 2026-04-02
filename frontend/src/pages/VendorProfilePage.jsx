import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Star, MapPin, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

export default function VendorProfilePage() {
  const { vendorId } = useParams();
  const navigate = useNavigate();
  const [vendor, setVendor] = useState(null);
  const [photoIndex, setPhotoIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVendor();
  }, [vendorId]);

  const fetchVendor = async () => {
    try {
      const res = await axios.get(`${API}/vendors/${vendorId}`);
      setVendor(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleBookService = (service) => {
    navigate('/booking', {
      state: {
        vendor,
        service,
      },
    });
  };

  if (loading) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#DC143C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!vendor) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <p className="text-gray-500">Vendor not found</p>
      </div>
    );
  }

  const photos = vendor.cover_photos || [];

  return (
    <div data-testid="vendor-profile-page" className="max-w-md mx-auto min-h-screen bg-white pb-20">
      {/* Cover Photo Gallery */}
      <div className="relative h-64 bg-gray-100">
        {photos.length > 0 && (
          <img
            src={photos[photoIndex]}
            alt={vendor.business_name}
            className="w-full h-full object-cover"
          />
        )}
        <button
          data-testid="vendor-back-btn"
          onClick={() => navigate(-1)}
          className="absolute top-4 left-4 w-8 h-8 bg-white/90 rounded-full flex items-center justify-center"
        >
          <ArrowLeft size={16} className="text-black" />
        </button>
        {photos.length > 1 && (
          <>
            <button
              onClick={() => setPhotoIndex((i) => (i > 0 ? i - 1 : photos.length - 1))}
              className="absolute left-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center"
            >
              <ChevronLeft size={14} />
            </button>
            <button
              onClick={() => setPhotoIndex((i) => (i < photos.length - 1 ? i + 1 : 0))}
              className="absolute right-2 top-1/2 -translate-y-1/2 w-7 h-7 bg-white/80 rounded-full flex items-center justify-center"
            >
              <ChevronRight size={14} />
            </button>
            <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
              {photos.map((_, i) => (
                <div
                  key={i}
                  className={`w-1.5 h-1.5 rounded-full ${i === photoIndex ? 'bg-white' : 'bg-white/50'}`}
                />
              ))}
            </div>
          </>
        )}
      </div>

      {/* Vendor Info */}
      <div className="px-4 py-4">
        <div className="flex items-start justify-between mb-2">
          <div>
            <div className="flex items-center gap-2">
              <h1 data-testid="vendor-name" className="text-xl font-bold text-black">{vendor.business_name}</h1>
              {vendor.verified && (
                <CheckCircle size={16} className="text-blue-500 fill-blue-500" />
              )}
            </div>
            <div className="flex items-center gap-1 mt-1 text-gray-500 text-xs">
              <MapPin size={12} />
              <span>{vendor.location}</span>
            </div>
          </div>
          <div className="flex items-center gap-1 bg-green-50 px-2.5 py-1 rounded">
            <Star size={14} className="text-green-600 fill-green-600" />
            <span className="text-sm font-semibold text-green-700">{vendor.rating}</span>
          </div>
        </div>
        <p className="text-gray-600 text-sm leading-relaxed mt-2">{vendor.description}</p>

        {/* Tags */}
        <div className="flex gap-2 flex-wrap mt-3">
          {vendor.category_tags?.map((tag) => (
            <span key={tag} className="text-xs bg-gray-100 text-gray-600 px-3 py-1 rounded-full">{tag}</span>
          ))}
        </div>
      </div>

      {/* Gallery */}
      {photos.length > 1 && (
        <div className="px-4 pb-4">
          <h2 className="text-base font-semibold mb-2">Gallery</h2>
          <div className="flex gap-2 overflow-x-auto" style={{ scrollbarWidth: 'none' }}>
            {photos.map((p, i) => (
              <div
                key={i}
                onClick={() => setPhotoIndex(i)}
                className={`w-20 h-20 rounded-lg overflow-hidden flex-shrink-0 cursor-pointer border-2 ${
                  i === photoIndex ? 'border-[#DC143C]' : 'border-transparent'
                }`}
              >
                <img src={p} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Services */}
      <div className="px-4 pb-4">
        <h2 className="text-base font-semibold mb-3">Services</h2>
        <div className="space-y-3">
          {vendor.services?.map((s, i) => (
            <div
              key={i}
              data-testid={`service-${i}`}
              className="bg-white rounded-[12px] border border-gray-100 p-3 flex items-center gap-3"
            >
              <div className="flex-1">
                <h3 className="font-medium text-sm text-black">{s.name}</h3>
                <p className="text-[#DC143C] font-semibold text-sm mt-0.5">&#8377;{s.price?.toLocaleString('en-IN')}</p>
                {s.description && (
                  <p className="text-gray-500 text-xs mt-0.5">{s.description}</p>
                )}
              </div>
              <Button
                data-testid={`book-service-${i}`}
                onClick={() => handleBookService(s)}
                className="h-8 px-3 text-xs rounded-[8px] bg-[#DC143C] hover:bg-[#B01030] text-white"
              >
                Add +
              </Button>
            </div>
          ))}
        </div>
      </div>

      {/* Addons */}
      {vendor.addons && vendor.addons.length > 0 && (
        <div className="px-4 pb-4">
          <h2 className="text-base font-semibold mb-3">Add-ons</h2>
          <div className="bg-white rounded-[12px] border border-gray-100 divide-y divide-gray-50">
            {vendor.addons.map((a, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2.5">
                <span className="text-sm text-black">{a.name}</span>
                <span className="text-sm font-medium text-gray-600">&#8377;{a.price?.toLocaleString('en-IN')}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Terms */}
      {vendor.terms && (
        <div className="px-4 pb-4">
          <h2 className="text-base font-semibold mb-2">Vendor Terms</h2>
          <p className="text-gray-600 text-xs leading-relaxed">{vendor.terms}</p>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
