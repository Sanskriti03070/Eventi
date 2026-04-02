import React, { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Trash2, Edit, Plus, X } from 'lucide-react';
import axios from 'axios';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL;
const API = `${BACKEND_URL}/api`;

function VendorForm({ vendor, onSave, onCancel }) {
  const [form, setForm] = useState({
    business_name: vendor?.business_name || '',
    description: vendor?.description || '',
    category_tags: vendor?.category_tags?.join(', ') || '',
    rating: vendor?.rating || 4.5,
    location: vendor?.location || 'Chennai',
    terms: vendor?.terms || '',
    verified: vendor?.verified || false,
    cover_photos: vendor?.cover_photos?.join('\n') || '',
    services: vendor?.services || [{ name: '', price: 0, description: '' }],
    addons: vendor?.addons || [],
  });
  const [saving, setSaving] = useState(false);

  const updateService = (i, field, val) => {
    const s = [...form.services];
    s[i] = { ...s[i], [field]: field === 'price' ? parseInt(val) || 0 : val };
    setForm({ ...form, services: s });
  };

  const addService = () => setForm({ ...form, services: [...form.services, { name: '', price: 0, description: '' }] });
  const removeService = (i) => setForm({ ...form, services: form.services.filter((_, idx) => idx !== i) });

  const updateAddon = (i, field, val) => {
    const a = [...form.addons];
    a[i] = { ...a[i], [field]: field === 'price' ? parseInt(val) || 0 : val };
    setForm({ ...form, addons: a });
  };

  const addAddon = () => setForm({ ...form, addons: [...form.addons, { name: '', price: 0 }] });
  const removeAddon = (i) => setForm({ ...form, addons: form.addons.filter((_, idx) => idx !== i) });

  const handleSubmit = async () => {
    if (!form.business_name.trim()) { toast.error('Business name is required'); return; }
    setSaving(true);
    try {
      const payload = {
        business_name: form.business_name,
        description: form.description,
        category_tags: form.category_tags.split(',').map(t => t.trim()).filter(Boolean),
        rating: parseFloat(form.rating) || 4.5,
        location: form.location,
        terms: form.terms,
        verified: form.verified,
        cover_photos: form.cover_photos.split('\n').map(u => u.trim()).filter(Boolean),
        services: form.services.filter(s => s.name),
        addons: form.addons.filter(a => a.name),
      };
      await onSave(payload);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg border p-6 space-y-4">
      <h3 className="text-lg font-semibold">{vendor ? 'Edit Vendor' : 'Add New Vendor'}</h3>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Business Name *</label>
          <Input data-testid="admin-vendor-name" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Location</label>
          <Input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Description</label>
          <textarea data-testid="admin-vendor-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} className="w-full rounded-md border border-gray-200 p-2 text-sm" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Category Tags (comma separated)</label>
          <Input data-testid="admin-vendor-tags" value={form.category_tags} onChange={(e) => setForm({ ...form, category_tags: e.target.value })} placeholder="Birthday, Theme, Balloon" />
        </div>
        <div>
          <label className="text-sm font-medium text-gray-700 mb-1 block">Rating</label>
          <Input type="number" step="0.1" min="0" max="5" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })} />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Cover Photo URLs (one per line)</label>
          <textarea value={form.cover_photos} onChange={(e) => setForm({ ...form, cover_photos: e.target.value })} rows={3} className="w-full rounded-md border border-gray-200 p-2 text-sm" placeholder="https://..." />
        </div>
        <div className="md:col-span-2">
          <label className="text-sm font-medium text-gray-700 mb-1 block">Terms</label>
          <textarea value={form.terms} onChange={(e) => setForm({ ...form, terms: e.target.value })} rows={2} className="w-full rounded-md border border-gray-200 p-2 text-sm" />
        </div>
        <div className="flex items-center gap-2">
          <input type="checkbox" checked={form.verified} onChange={(e) => setForm({ ...form, verified: e.target.checked })} className="rounded" />
          <label className="text-sm text-gray-700">Verified vendor</label>
        </div>
      </div>

      {/* Services */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Services</label>
          <Button size="sm" variant="outline" onClick={addService} className="h-7 text-xs"><Plus size={12} className="mr-1" />Add</Button>
        </div>
        {form.services.map((s, i) => (
          <div key={i} className="flex gap-2 mb-2 items-start">
            <Input placeholder="Service name" value={s.name} onChange={(e) => updateService(i, 'name', e.target.value)} className="flex-1 h-9 text-sm" />
            <Input placeholder="Price" type="number" value={s.price || ''} onChange={(e) => updateService(i, 'price', e.target.value)} className="w-24 h-9 text-sm" />
            <Input placeholder="Description" value={s.description || ''} onChange={(e) => updateService(i, 'description', e.target.value)} className="flex-1 h-9 text-sm" />
            <Button size="sm" variant="ghost" onClick={() => removeService(i)} className="h-9 px-2 text-red-500"><X size={14} /></Button>
          </div>
        ))}
      </div>

      {/* Addons */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-sm font-medium text-gray-700">Add-ons</label>
          <Button size="sm" variant="outline" onClick={addAddon} className="h-7 text-xs"><Plus size={12} className="mr-1" />Add</Button>
        </div>
        {form.addons.map((a, i) => (
          <div key={i} className="flex gap-2 mb-2 items-center">
            <Input placeholder="Addon name" value={a.name} onChange={(e) => updateAddon(i, 'name', e.target.value)} className="flex-1 h-9 text-sm" />
            <Input placeholder="Price" type="number" value={a.price || ''} onChange={(e) => updateAddon(i, 'price', e.target.value)} className="w-24 h-9 text-sm" />
            <Button size="sm" variant="ghost" onClick={() => removeAddon(i)} className="h-9 px-2 text-red-500"><X size={14} /></Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2 pt-2">
        <Button data-testid="admin-save-vendor" onClick={handleSubmit} disabled={saving} className="bg-[#DC143C] hover:bg-[#B01030] text-white">
          {saving ? 'Saving...' : (vendor ? 'Update Vendor' : 'Create Vendor')}
        </Button>
        <Button variant="outline" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

export default function AdminPage() {
  const [vendors, setVendors] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [editVendor, setEditVendor] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [vRes, bRes] = await Promise.all([
        axios.get(`${API}/vendors`),
        axios.get(`${API}/admin/bookings`),
      ]);
      setVendors(vRes.data);
      setBookings(bRes.data);
    } catch (err) {
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateVendor = async (payload) => {
    try {
      await axios.post(`${API}/admin/vendors`, payload);
      toast.success('Vendor created!');
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to create vendor');
    }
  };

  const handleUpdateVendor = async (payload) => {
    try {
      await axios.put(`${API}/admin/vendors/${editVendor.vendor_id}`, payload);
      toast.success('Vendor updated!');
      setEditVendor(null);
      setShowForm(false);
      fetchData();
    } catch (err) {
      toast.error('Failed to update vendor');
    }
  };

  const handleDeleteVendor = async (vendorId) => {
    if (!window.confirm('Delete this vendor?')) return;
    try {
      await axios.delete(`${API}/admin/vendors/${vendorId}`);
      toast.success('Vendor deleted');
      fetchData();
    } catch {
      toast.error('Failed to delete');
    }
  };

  const handleBookingStatus = async (bookingId, status, paymentStatus) => {
    try {
      await axios.put(`${API}/admin/bookings/${bookingId}/status`, { status, payment_status: paymentStatus });
      toast.success('Status updated');
      fetchData();
    } catch {
      toast.error('Failed to update');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-6 h-6 border-2 border-[#DC143C] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div data-testid="admin-page" className="min-h-screen bg-gray-50">
      <div className="bg-[#DC143C] text-white px-6 py-4">
        <h1 className="font-logo text-2xl font-bold">Eventi Admin</h1>
        <p className="text-sm text-white/80">Manage vendors and bookings</p>
      </div>

      <div className="p-4 md:p-6">
        <Tabs defaultValue="bookings" className="w-full">
          <TabsList className="mb-4">
            <TabsTrigger value="bookings">Bookings ({bookings.length})</TabsTrigger>
            <TabsTrigger value="vendors">Vendors ({vendors.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            <div className="bg-white rounded-lg border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-gray-50 border-b">
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Customer</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Vendor</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Date</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Venue</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Amount</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Status</th>
                      <th className="text-left px-4 py-3 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {bookings.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="text-center py-8 text-gray-500">No bookings yet</td>
                      </tr>
                    ) : (
                      bookings.map((b) => (
                        <tr key={b.booking_id} data-testid={`admin-booking-${b.booking_id}`}>
                          <td className="px-4 py-3">
                            <div className="font-medium text-black">{b.customer_name}</div>
                            <div className="text-xs text-gray-500">{b.customer_email}</div>
                          </td>
                          <td className="px-4 py-3 text-gray-700">{b.vendor_name}</td>
                          <td className="px-4 py-3 text-gray-700">{b.event_date}</td>
                          <td className="px-4 py-3 text-gray-700 max-w-[150px] truncate">{b.venue_address}</td>
                          <td className="px-4 py-3 font-medium">&#8377;{b.subtotal?.toLocaleString('en-IN')}</td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-0.5 rounded-full ${
                              b.status === 'Confirmed' ? 'bg-blue-50 text-blue-700' :
                              b.status === 'Completed' ? 'bg-green-50 text-green-700' :
                              'bg-yellow-50 text-yellow-700'
                            }`}>{b.status}</span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <Button
                                data-testid={`confirm-booking-${b.booking_id}`}
                                size="sm"
                                variant="outline"
                                onClick={() => handleBookingStatus(b.booking_id, 'Confirmed', b.payment_status)}
                                className="h-7 text-xs"
                              >
                                Confirm
                              </Button>
                              <Button
                                data-testid={`complete-booking-${b.booking_id}`}
                                size="sm"
                                onClick={() => handleBookingStatus(b.booking_id, 'Completed', 'Final Paid')}
                                className="h-7 text-xs bg-green-600 hover:bg-green-700 text-white"
                              >
                                Complete
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="vendors">
            {(showForm || editVendor) ? (
              <VendorForm
                vendor={editVendor}
                onSave={editVendor ? handleUpdateVendor : handleCreateVendor}
                onCancel={() => { setShowForm(false); setEditVendor(null); }}
              />
            ) : (
              <>
                <div className="flex justify-end mb-4">
                  <Button
                    data-testid="admin-add-vendor-btn"
                    onClick={() => setShowForm(true)}
                    className="bg-[#DC143C] hover:bg-[#B01030] text-white"
                  >
                    <Plus size={16} className="mr-1" /> Add Vendor
                  </Button>
                </div>
                <div className="space-y-3">
                  {vendors.map((v) => (
                    <div key={v.vendor_id} data-testid={`admin-vendor-${v.vendor_id}`} className="bg-white rounded-lg border p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <h3 className="font-semibold text-black">{v.business_name}</h3>
                          <p className="text-sm text-gray-500 mt-0.5">{v.description?.substring(0, 100)}...</p>
                          <div className="flex gap-1 mt-2 flex-wrap">
                            {v.category_tags?.map(t => (
                              <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">{t}</span>
                            ))}
                          </div>
                          <p className="text-sm mt-2">Rating: <strong>{v.rating}</strong> | Starting: <strong>&#8377;{v.starting_price?.toLocaleString('en-IN')}</strong></p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            data-testid={`edit-vendor-${v.vendor_id}`}
                            size="sm"
                            variant="outline"
                            onClick={() => { setEditVendor(v); setShowForm(true); }}
                            className="h-8"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            data-testid={`delete-vendor-${v.vendor_id}`}
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteVendor(v.vendor_id)}
                            className="h-8 text-red-500 hover:text-red-700"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
