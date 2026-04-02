import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar as CalendarIcon, Clock, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { format } from 'date-fns';
import { toast } from 'sonner';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

const TIME_SLOTS = [
  '9:00 AM - 1:00 PM',
  '10:00 AM - 2:00 PM',
  '2:00 PM - 6:00 PM',
  '4:00 PM - 8:00 PM',
  '6:00 PM - 10:00 PM',
];

export default function BookingPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { vendor, service } = location.state || {};

  const [eventDate, setEventDate] = useState(null);
  const [timeSlot, setTimeSlot] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [selectedAddons, setSelectedAddons] = useState([]);
  const [policyAccepted, setPolicyAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  if (!vendor || !service) {
    return (
      <div className="max-w-md mx-auto min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-500 mb-4">No booking details found</p>
          <Button onClick={() => navigate('/home')} className="bg-[#DC143C] hover:bg-[#B01030] text-white rounded-[12px]">
            Go Home
          </Button>
        </div>
      </div>
    );
  }

  const toggleAddon = (addon) => {
    setSelectedAddons((prev) => {
      const exists = prev.find((a) => a.name === addon.name);
      if (exists) return prev.filter((a) => a.name !== addon.name);
      return [...prev, addon];
    });
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const totalAmount = service.price + addonsTotal;
  const gstAmount = Math.round(totalAmount * 0.18);
  const subtotal = totalAmount + gstAmount;
  const advanceAmount = Math.round(subtotal * 0.30);
  const balanceAmount = subtotal - advanceAmount;

  const handlePayAndBook = async () => {
    if (!eventDate) { toast.error('Please select a date'); return; }
    if (!timeSlot) { toast.error('Please select a time slot'); return; }
    if (!venueAddress.trim()) { toast.error('Please enter venue address'); return; }
    if (!policyAccepted) { toast.error('Please accept the policy'); return; }

    setSubmitting(true);
    try {
      const res = await axios.post(`${API}/bookings`, {
        vendor_id: vendor.vendor_id,
        service_name: service.name,
        service_price: service.price,
        addons: selectedAddons,
        event_date: format(eventDate, 'yyyy-MM-dd'),
        time_slot: timeSlot,
        venue_address: venueAddress,
      }, { withCredentials: true });

      navigate('/confirmation', { state: { booking: res.data }, replace: true });
    } catch (err) {
      console.error('Booking error:', err);
      toast.error('Booking failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div data-testid="booking-page" className="max-w-md mx-auto min-h-screen bg-gray-50 pb-32">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white border-b border-gray-100 px-4 py-3">
        <div className="flex items-center gap-3">
          <button data-testid="booking-back-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={20} className="text-black" />
          </button>
          <h1 className="text-base font-semibold text-black">Cart</h1>
        </div>
      </div>

      {/* Selected Service */}
      <div className="px-4 pt-4">
        <div className="bg-white rounded-[12px] border border-red-100 p-4">
          <div className="flex gap-3">
            <div className="flex-1">
              <h3 className="font-semibold text-base text-black">{vendor.business_name}</h3>
              <p className="text-sm text-gray-600 mt-1">{service.name}</p>
              {service.description && (
                <p className="text-xs text-gray-400 mt-0.5">{service.description}</p>
              )}
            </div>
            <div className="text-right">
              <p className="font-bold text-base text-black">&#8377;{service.price?.toLocaleString('en-IN')}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Date Picker */}
      <div className="px-4 pt-4">
        <h2 className="text-sm font-semibold mb-2">Date of Event</h2>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              data-testid="date-picker-trigger"
              variant="outline"
              className="w-full h-12 rounded-[12px] justify-start text-left font-normal bg-white border-gray-200"
            >
              <CalendarIcon size={16} className="mr-2 text-gray-400" />
              {eventDate ? format(eventDate, 'PPP') : <span className="text-gray-400">Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={eventDate}
              onSelect={setEventDate}
              disabled={(date) => date < new Date()}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Time Slots */}
      <div className="px-4 pt-4">
        <h2 className="text-sm font-semibold mb-2">Time Slot</h2>
        <div className="grid grid-cols-2 gap-2">
          {TIME_SLOTS.map((slot) => (
            <button
              key={slot}
              data-testid={`time-slot-${slot.replace(/\s+/g, '-')}`}
              onClick={() => setTimeSlot(slot)}
              className={`h-10 text-xs rounded-[12px] border transition-colors ${
                timeSlot === slot
                  ? 'bg-[#DC143C] text-white border-[#DC143C]'
                  : 'bg-white text-gray-700 border-gray-200 hover:border-[#DC143C]'
              }`}
            >
              <Clock size={12} className="inline mr-1" />
              {slot}
            </button>
          ))}
        </div>
      </div>

      {/* Venue Address */}
      <div className="px-4 pt-4">
        <h2 className="text-sm font-semibold mb-2">Venue Address</h2>
        <div className="relative">
          <MapPin size={16} className="absolute left-3 top-3.5 text-gray-400" />
          <Input
            data-testid="venue-input"
            placeholder="Enter complete venue address"
            value={venueAddress}
            onChange={(e) => setVenueAddress(e.target.value)}
            className="pl-9 h-12 rounded-[12px] bg-white border-gray-200"
          />
        </div>
      </div>

      {/* Add-ons */}
      {vendor.addons && vendor.addons.length > 0 && (
        <div className="px-4 pt-4">
          <h2 className="text-sm font-semibold mb-2">Add-ons</h2>
          <div className="bg-white rounded-[12px] border border-gray-100 divide-y divide-gray-50">
            {vendor.addons.map((addon, i) => {
              const isSelected = selectedAddons.find((a) => a.name === addon.name);
              return (
                <label
                  key={i}
                  data-testid={`addon-${i}`}
                  className="flex items-center justify-between px-3 py-3 cursor-pointer"
                >
                  <div className="flex-1">
                    <span className="text-sm text-black">{addon.name}</span>
                    <span className="text-sm text-gray-500 ml-2">&#8377;{addon.price?.toLocaleString('en-IN')}</span>
                  </div>
                  <Checkbox
                    checked={!!isSelected}
                    onCheckedChange={() => toggleAddon(addon)}
                    className="border-[#DC143C] data-[state=checked]:bg-[#DC143C]"
                  />
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Bill Summary */}
      <div className="px-4 pt-4">
        <h2 className="text-sm font-semibold mb-2">Bill Summary</h2>
        <div className="bg-white rounded-[12px] border border-green-200 p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">Total Amount</span>
            <span className="font-medium">&#8377;{totalAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600">GST Charges (18%)</span>
            <span className="font-medium">&#8377;{gstAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="border-t border-gray-100 pt-2 flex justify-between text-sm">
            <span className="font-semibold" style={{ color: '#DC143C' }}>Subtotal</span>
            <span className="font-bold" style={{ color: '#DC143C' }}>&#8377;{subtotal.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Advance (30%) (Pay Now)</span>
            <span className="font-semibold">&#8377;{advanceAmount.toLocaleString('en-IN')}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-600 font-medium">Pay On Event Day</span>
            <span className="font-semibold">&#8377;{balanceAmount.toLocaleString('en-IN')}</span>
          </div>
        </div>
      </div>

      {/* Policy */}
      <div className="px-4 pt-4">
        <p className="text-xs text-green-600 mb-3">
          Your advance is held securely by Eventi until the event is started.
        </p>
        <label className="flex items-start gap-2 cursor-pointer">
          <Checkbox
            data-testid="policy-checkbox"
            checked={policyAccepted}
            onCheckedChange={setPolicyAccepted}
            className="mt-0.5 border-[#DC143C] data-[state=checked]:bg-[#DC143C]"
          />
          <span className="text-xs text-gray-500">I have read Eventi's Policy and Vendor Policy</span>
        </label>
      </div>

      {/* Pay Button - Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 p-4 z-50">
        <div className="max-w-md mx-auto">
          <Button
            data-testid="pay-and-book-btn"
            onClick={handlePayAndBook}
            disabled={submitting}
            className="w-full h-12 rounded-[12px] text-base font-semibold bg-[#DC143C] hover:bg-[#B01030] text-white"
          >
            {submitting ? 'Processing...' : `PAY AND BOOK  •  ₹${advanceAmount.toLocaleString('en-IN')}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
