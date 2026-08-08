import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { customersApi } from '../api/customers.api';
import { Customer, CustomerType, CustomerStatus } from '../types/customer.types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, Phone, Mail, Building, Clock, MessageSquare, Trash2, Edit3 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const customerFormSchema = z.object({
  name: z.string().min(2, 'Full name is required'),
  mobile: z.string().min(8, 'Valid mobile number required'),
  email: z.string().email().optional().or(z.literal('')),
  businessName: z.string().optional().or(z.literal('')),
  gstNumber: z.string().optional().or(z.literal('')),
  customerType: z.enum(['Retail', 'Wholesale', 'Distributor']),
  address: z.string().optional().or(z.literal('')),
  status: z.enum(['Lead', 'Active', 'Inactive']),
  followUpDate: z.string().optional().nullable(),
  notes: z.string().optional().or(z.literal('')),
});

type CustomerFormData = z.infer<typeof customerFormSchema>;

export default function CustomersPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<CustomerStatus | ''>('');
  const [typeFilter, setTypeFilter] = useState<CustomerType | ''>('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const [detailCustomer, setDetailCustomer] = useState<Customer | null>(null);
  const [followUpNote, setFollowUpNote] = useState('');

  const canEdit = hasRole('ADMIN', 'SALES');
  const canDelete = hasRole('ADMIN');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['customers', search, statusFilter, typeFilter],
    queryFn: () =>
      customersApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
        customerType: typeFilter || undefined,
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<CustomerFormData>({
    resolver: zodResolver(customerFormSchema),
    defaultValues: {
      customerType: 'Retail',
      status: 'Lead',
    },
  });

  // Create / Update mutation
  const saveMutation = useMutation({
    mutationFn: (formData: CustomerFormData) => {
      if (editingCustomer) {
        return customersApi.update(editingCustomer.id, formData);
      }
      return customersApi.create(formData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setIsModalOpen(false);
      setEditingCustomer(null);
      reset();
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => customersApi.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      if (detailCustomer) setDetailCustomer(null);
    },
  });

  // Add Follow Up mutation
  const addFollowUpMutation = useMutation({
    mutationFn: ({ id, note }: { id: string; note: string }) => customersApi.addFollowUp(id, { note }),
    onSuccess: (newFollowUp) => {
      queryClient.invalidateQueries({ queryKey: ['customers'] });
      setFollowUpNote('');
      if (detailCustomer) {
        setDetailCustomer((prev) =>
          prev
            ? {
                ...prev,
                followUps: [newFollowUp, ...(prev.followUps || [])],
              }
            : null
        );
      }
    },
  });

  const handleOpenCreate = () => {
    setEditingCustomer(null);
    reset({
      name: '',
      mobile: '',
      email: '',
      businessName: '',
      gstNumber: '',
      customerType: 'Retail',
      address: '',
      status: 'Lead',
      followUpDate: '',
      notes: '',
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (c: Customer) => {
    setEditingCustomer(c);
    setValue('name', c.name);
    setValue('mobile', c.mobile);
    setValue('email', c.email || '');
    setValue('businessName', c.businessName || '');
    setValue('gstNumber', c.gstNumber || '');
    setValue('customerType', c.customerType);
    setValue('address', c.address || '');
    setValue('status', c.status);
    setValue(
      'followUpDate',
      c.followUpDate ? new Date(c.followUpDate).toISOString().substring(0, 10) : ''
    );
    setValue('notes', c.notes || '');
    setIsModalOpen(true);
  };

  const openDetails = async (c: Customer) => {
    try {
      const full = await customersApi.getById(c.id);
      setDetailCustomer(full);
    } catch {
      setDetailCustomer(c);
    }
  };

  const customers = data?.customers || [];

  return (
    <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      <Header
        title="CUSTOMER CRM PORTAL"
        subtitle="Manage leads, enterprise clients & interaction logs"
        actionButton={
          canEdit ? (
            <button
              onClick={handleOpenCreate}
              className="bg-brand-red hover:bg-brand-red-hover text-white font-mono text-xs uppercase font-bold px-4 py-2.5 flex items-center gap-2 border border-brand-red transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>NEW CUSTOMER</span>
            </button>
          ) : null
        }
      />

      {/* Filter Bar */}
      <div className="bg-brand-dark border border-brand-border p-4 mb-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, mobile, GST..."
            className="w-full bg-brand-black border border-brand-border pl-9 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as CustomerStatus)}
            className="w-full bg-brand-black border border-brand-border px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-red"
          >
            <option value="">ALL STATUSES</option>
            <option value="Lead">LEAD</option>
            <option value="Active">ACTIVE</option>
            <option value="Inactive">INACTIVE</option>
          </select>
        </div>

        <div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value as CustomerType)}
            className="w-full bg-brand-black border border-brand-border px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-red"
          >
            <option value="">ALL CUSTOMER TYPES</option>
            <option value="Retail">RETAIL</option>
            <option value="Wholesale">WHOLESALE</option>
            <option value="Distributor">DISTRIBUTOR</option>
          </select>
        </div>
      </div>

      {isLoading && <Loader label="FETCHING CUSTOMER DIRECTORY..." />}
      {isError && <ErrorMessage onRetry={refetch} />}

      {!isLoading && !isError && customers.length === 0 && (
        <EmptyState
          title="NO CUSTOMERS FOUND"
          description="Try modifying search criteria or add a new customer record."
          action={
            canEdit ? (
              <button
                onClick={handleOpenCreate}
                className="bg-brand-red hover:bg-brand-red-hover text-white font-mono text-xs uppercase px-4 py-2 border border-brand-red font-bold"
              >
                CREATE RECORD
              </button>
            ) : undefined
          }
        />
      )}

      {/* Customer List Table */}
      {!isLoading && !isError && customers.length > 0 && (
        <div className="bg-brand-dark border border-brand-border overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-black border-b border-brand-border font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="p-3.5">Customer Name & Business</th>
                <th className="p-3.5">Contact Info</th>
                <th className="p-3.5">Type & Status</th>
                <th className="p-3.5">GST Number</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border font-sans text-xs">
              {customers.map((c) => (
                <tr key={c.id} className="hover:bg-brand-black/60 transition-colors">
                  <td className="p-3.5">
                    <button
                      onClick={() => openDetails(c)}
                      className="font-bold text-sm text-white hover:text-brand-red transition-colors text-left"
                    >
                      {c.name}
                    </button>
                    {c.businessName && (
                      <div className="text-zinc-400 font-mono text-[11px] flex items-center gap-1 mt-0.5">
                        <Building className="w-3 h-3 text-brand-red" />
                        {c.businessName}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-[11px]">
                    <div className="text-zinc-200 flex items-center gap-1.5">
                      <Phone className="w-3 h-3 text-zinc-500" />
                      {c.mobile}
                    </div>
                    {c.email && (
                      <div className="text-zinc-400 flex items-center gap-1.5 mt-0.5">
                        <Mail className="w-3 h-3 text-zinc-500" />
                        {c.email}
                      </div>
                    )}
                  </td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <Badge variant={c.status === 'Active' ? 'white' : c.status === 'Lead' ? 'warning' : 'subtle'}>
                        {c.status}
                      </Badge>
                      <Badge variant="subtle">{c.customerType}</Badge>
                    </div>
                  </td>
                  <td className="p-3.5 font-mono text-zinc-400">{c.gstNumber || 'N/A'}</td>
                  <td className="p-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openDetails(c)}
                        className="bg-brand-black hover:bg-zinc-800 border border-brand-border px-2.5 py-1 text-zinc-300 hover:text-white font-mono text-[11px] uppercase transition-colors"
                      >
                        Details
                      </button>
                      {canEdit && (
                        <button
                          onClick={() => handleOpenEdit(c)}
                          className="p-1.5 text-zinc-400 hover:text-white border border-brand-border bg-brand-black hover:bg-zinc-800"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      {canDelete && (
                        <button
                          onClick={() => {
                            if (confirm(`Delete customer ${c.name}?`)) {
                              deleteMutation.mutate(c.id);
                            }
                          }}
                          className="p-1.5 text-zinc-500 hover:text-brand-red border border-brand-border bg-brand-black hover:bg-zinc-900"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Customer Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingCustomer ? `Edit Customer: ${editingCustomer.name}` : 'Create New Customer Record'}
      >
        <form onSubmit={handleSubmit((data) => saveMutation.mutate(data))} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-zinc-300 mb-1">Full Name *</label>
              <input
                {...register('name')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
              {errors.name && <p className="text-brand-red mt-0.5">{errors.name.message}</p>}
            </div>

            <div>
              <label className="block uppercase text-zinc-300 mb-1">Mobile Number *</label>
              <input
                {...register('mobile')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
              {errors.mobile && <p className="text-brand-red mt-0.5">{errors.mobile.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-zinc-300 mb-1">Email Address</label>
              <input
                type="email"
                {...register('email')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block uppercase text-zinc-300 mb-1">Business Name</label>
              <input
                {...register('businessName')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block uppercase text-zinc-300 mb-1">GST Number</label>
              <input
                {...register('gstNumber')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block uppercase text-zinc-300 mb-1">Customer Type</label>
              <select
                {...register('customerType')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              >
                <option value="Retail">Retail</option>
                <option value="Wholesale">Wholesale</option>
                <option value="Distributor">Distributor</option>
              </select>
            </div>

            <div>
              <label className="block uppercase text-zinc-300 mb-1">Status</label>
              <select
                {...register('status')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              >
                <option value="Lead">Lead</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block uppercase text-zinc-300 mb-1">Billing & Delivery Address</label>
            <textarea
              {...register('address')}
              rows={2}
              className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div>
            <label className="block uppercase text-zinc-300 mb-1">Notes & Overview</label>
            <textarea
              {...register('notes')}
              rows={2}
              className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
            />
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-4 py-2 border border-brand-border bg-brand-black hover:bg-zinc-800 text-zinc-300 uppercase font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveMutation.isPending}
              className="px-5 py-2 border border-brand-red bg-brand-red hover:bg-brand-red-hover text-white uppercase font-bold disabled:opacity-50"
            >
              {saveMutation.isPending ? 'SAVING...' : 'SAVE RECORD'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Customer Details & Follow-up Timeline Modal */}
      <Modal
        isOpen={!!detailCustomer}
        onClose={() => setDetailCustomer(null)}
        title={detailCustomer ? `Customer Dossier: ${detailCustomer.name}` : ''}
      >
        {detailCustomer && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-brand-black border border-brand-border p-4 font-mono text-xs">
              <div>
                <span className="text-zinc-500 block uppercase">Mobile:</span>
                <span className="text-white font-bold">{detailCustomer.mobile}</span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase">Email:</span>
                <span className="text-white">{detailCustomer.email || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase">Business Name:</span>
                <span className="text-white">{detailCustomer.businessName || 'N/A'}</span>
              </div>
              <div>
                <span className="text-zinc-500 block uppercase">GST Number:</span>
                <span className="text-white">{detailCustomer.gstNumber || 'N/A'}</span>
              </div>
              <div className="col-span-1 sm:col-span-2">
                <span className="text-zinc-500 block uppercase">Address:</span>
                <span className="text-zinc-300">{detailCustomer.address || 'N/A'}</span>
              </div>
            </div>

            {/* Follow-up Section */}
            <div>
              <h3 className="font-heading text-xs text-white uppercase tracking-wider mb-3 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-brand-red" />
                <span>Interaction Log & Follow-ups</span>
              </h3>

              {canEdit && (
                <div className="flex gap-2 mb-4">
                  <input
                    type="text"
                    value={followUpNote}
                    onChange={(e) => setFollowUpNote(e.target.value)}
                    placeholder="Enter call notes or follow-up summary..."
                    className="flex-1 bg-brand-black border border-brand-border px-3 py-2 font-mono text-xs text-white focus:outline-none focus:border-brand-red"
                  />
                  <button
                    disabled={!followUpNote.trim() || addFollowUpMutation.isPending}
                    onClick={() =>
                      addFollowUpMutation.mutate({ id: detailCustomer.id, note: followUpNote })
                    }
                    className="bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2 font-mono text-xs uppercase font-bold border border-brand-red disabled:opacity-50"
                  >
                    Log Entry
                  </button>
                </div>
              )}

              <div className="space-y-2 max-h-60 overflow-y-auto">
                {(!detailCustomer.followUps || detailCustomer.followUps.length === 0) && (
                  <p className="text-zinc-500 font-mono text-xs italic py-2">No follow-up entries logged yet.</p>
                )}
                {detailCustomer.followUps?.map((f) => (
                  <div key={f.id} className="bg-brand-black border border-brand-border p-3 font-mono text-xs">
                    <div className="flex justify-between items-center text-[10px] text-zinc-400 mb-1">
                      <span>By: {f.createdBy?.name || 'System User'}</span>
                      <span>{new Date(f.date).toLocaleString()}</span>
                    </div>
                    <p className="text-zinc-200">{f.note}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
