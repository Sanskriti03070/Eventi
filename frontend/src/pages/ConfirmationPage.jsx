import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { CheckCircle, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function ConfirmationPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { booking } = location.state || {};

  if (!booking) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No booking details</p>
          <Button onClick={() => navigate('/home')} className="bg-[#DC143C] hover:bg-[#B01030] text-white rounded-[12px]">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const whatsappMessage = encodeURIComponent(
    `Hi! I've booked ${booking.service_name} with ${booking.vendor_name} for ${booking.event_date}. Booking ID: ${booking.booking_id}`
  );

  return (
    <div data-testid="confirmation-page" className="max-w-md mx-auto min-h-screen bg-white px-4 py-8">
      <div className="flex flex-col items-center text-center pt-8">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4">
          <CheckCircle size={40} className="text-green-500" />
        </div>
        <h1 data-testid="confirmation-title" className="text-2xl font-bold text-black mb-2">Booking Confirmed!</h1>
        <p className="text-gray-500 text-sm">Your event decoration has been booked successfully</p>
      </div>

      <div className="mt-8 space-y-4">
        <div className="bg-gray-50 rounded-[12px] p-4 space-y-3">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Vendor</span>
            <span className="font-medium text-black">{booking.vendor_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Service</span>
            <span className="font-medium text-black">{booking.service_name}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Date</span>
            <span className="font-medium text-black">{booking.event_date}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Time</span>
            <span className="font-medium text-black">{booking.time_slot}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Venue</span>
            <span className="font-medium text-black text-right max-w-[200px]">{booking.venue_address}</span>
          </div>
        </div>

        <div className="bg-green-50 rounded-[12px] p-4 space-y-2 border border-green-100">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Advance Paid</span>
            <span className="font-semibold text-green-600">&#8377;{booking.advance_amount?.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Due on Event Day</span>
            <span className="font-bold text-black">&#8377;{booking.balance_amount?.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <Button
          data-testid="whatsapp-btn"
          onClick={() => window.open(`https://wa.me/?text=${whatsappMessage}`, '_blank')}
          className="w-full h-12 rounded-[12px] bg-green-500 hover:bg-green-600 text-white text-sm font-medium"
        >
          <MessageCircle size={16} className="mr-2" />
          Contact Coordinator via WhatsApp
        </Button>
        <Button
          data-testid="view-bookings-btn"
          onClick={() => navigate('/my-bookings', { replace: true })}
          variant="outline"
          className="w-full h-12 rounded-[12px] border-gray-200 text-sm font-medium"
        >
          View My Bookings
        </Button>
        <Button
          data-testid="go-home-btn"
          onClick={() => navigate('/home', { replace: true })}
          variant="ghost"
          className="w-full h-10 text-sm text-gray-500"
        >
          Back to Home
        </Button>
      </div>
    </div>
  );
}
