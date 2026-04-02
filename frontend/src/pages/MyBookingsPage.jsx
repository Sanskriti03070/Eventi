import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import BottomNav from '@/components/BottomNav';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const STATUS_COLORS = {
  Confirmed: 'bg-blue-50 text-blue-700 border-blue-200',
  Completed: 'bg-green-50 text-green-700 border-green-200',
  Pending: 'bg-yellow-50 text-yellow-700 border-yellow-200',
  Cancelled: 'bg-red-50 text-red-700 border-red-200',
};

const PAYMENT_COLORS = {
  'Advance Paid': 'bg-orange-50 text-orange-700 border-orange-200',
  'Final Paid': 'bg-green-50 text-green-700 border-green-200',
};

export default function MyBookingsPage() {
  const navigate = useNavigate();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      const res = await axios.get(`${API}/bookings/me`, { withCredentials: true });
      setBookings(res.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div data-testid="my-bookings-page" className="max-w-md mx-auto min-h-screen bg-gray-50 pb-20">
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button data-testid="bookings-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} className="text-black" />
          </button>
          <h1 className="text-base font-semibold text-black">My Bookings</h1>
        </div>
      </div>

      <div className="px-4 pt-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-6 h-6 border-2 border-[#DC143C] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : bookings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No bookings yet</p>
            <button
              onClick={() => navigate('/home')}
              className="text-sm font-medium mt-3"
              style={{ color: '#DC143C' }}
            >
              Browse Decorators
            </button>
          </div>
        ) : (
          bookings.map((b) => (
            <div
              key={b.booking_id}
              data-testid={`booking-card-${b.booking_id}`}
              className="bg-white rounded-[12px] border border-gray-100 shadow-sm p-4"
            >
              <div className="flex items-start justify-between mb-2">
                <h3 className="font-semibold text-sm text-black">{b.vendor_name}</h3>
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${STATUS_COLORS[b.status] || 'bg-gray-50 text-gray-600'}`}>
                  {b.status}
                </span>
              </div>
              <p className="text-xs text-gray-600">{b.service_name}</p>
              <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                <span>{b.event_date}</span>
                <span>{b.time_slot}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1 truncate">{b.venue_address}</p>
              <div className="flex items-center justify-between mt-3 pt-2 border-t border-gray-50">
                <span className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${PAYMENT_COLORS[b.payment_status] || 'bg-gray-50 text-gray-600'}`}>
                  {b.payment_status}
                </span>
                <span className="text-sm font-semibold text-black">&#8377;{b.subtotal?.toLocaleString('en-IN')}</span>
              </div>
            </div>
          ))
        )}
      </div>

      <BottomNav />
    </div>
  );
}
