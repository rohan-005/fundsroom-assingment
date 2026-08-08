import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { challansApi } from '../api/challans.api';
import { customersApi } from '../api/customers.api';
import { productsApi } from '../api/products.api';
import { SalesChallan, ChallanStatus } from '../types/challan.types';
import { Product } from '../types/product.types';
import { Plus, Search, CheckCircle2, XCircle, FileText, AlertTriangle, Trash2, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

interface ChallanItemInput {
  productId: string;
  quantity: number;
}

export default function ChallansPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<ChallanStatus | ''>('');

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState('');
  const [selectedItems, setSelectedItems] = useState<ChallanItemInput[]>([
    { productId: '', quantity: 1 },
  ]);
  const [formError, setFormError] = useState<string | null>(null);

  const [detailChallan, setDetailChallan] = useState<SalesChallan | null>(null);

  const canCreate = hasRole('ADMIN', 'SALES');

  // Queries
  const { data: challansData, isLoading, isError, refetch } = useQuery({
    queryKey: ['challans', search, statusFilter],
    queryFn: () =>
      challansApi.getAll({
        search: search || undefined,
        status: statusFilter || undefined,
      }),
  });

  const { data: customersData } = useQuery({
    queryKey: ['customers-list'],
    queryFn: () => customersApi.getAll({ limit: 100 }),
    enabled: isCreateOpen,
  });

  const { data: productsData } = useQuery({
    queryKey: ['products-list'],
    queryFn: () => productsApi.getAll({ limit: 100 }),
    enabled: isCreateOpen,
  });

  // Create Challan Mutation
  const createMutation = useMutation({
    mutationFn: (data: { customerId: string; items: ChallanItemInput[]; status: 'DRAFT' | 'CONFIRMED' }) => {
      setFormError(null);
      return challansApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsCreateOpen(false);
      setSelectedCustomerId('');
      setSelectedItems([{ productId: '', quantity: 1 }]);
    },
    onError: (err: any) => {
      setFormError(err.response?.data?.message || 'Failed to process Sales Challan.');
    },
  });

  // Confirm Challan Mutation
  const confirmMutation = useMutation({
    mutationFn: (id: string) => challansApi.confirm(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (detailChallan) setDetailChallan(null);
    },
    onError: (err: any) => {
      alert(err.response?.data?.message || 'Stock confirmation failed.');
    },
  });

  // Cancel Challan Mutation
  const cancelMutation = useMutation({
    mutationFn: (id: string) => challansApi.update(id, { status: 'CANCELLED' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['challans'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
      if (detailChallan) setDetailChallan(null);
    },
  });

  const customers = customersData?.customers || [];
  const products = productsData?.products || [];
  const challans = challansData?.challans || [];

  const handleAddItemRow = () => {
    setSelectedItems([...selectedItems, { productId: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (selectedItems.length === 1) return;
    setSelectedItems(selectedItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: 'productId' | 'quantity', value: any) => {
    const next = [...selectedItems];
    next[index] = { ...next[index], [field]: value };
    setSelectedItems(next);
  };

  const submitChallan = (targetStatus: 'DRAFT' | 'CONFIRMED') => {
    setFormError(null);
    if (!selectedCustomerId) {
      setFormError('Please select a customer.');
      return;
    }
    const validItems = selectedItems.filter((i) => i.productId && i.quantity > 0);
    if (validItems.length === 0) {
      setFormError('Please add at least one valid product line item.');
      return;
    }

    createMutation.mutate({
      customerId: selectedCustomerId,
      items: validItems,
      status: targetStatus,
    });
  };

  const openDetails = async (c: SalesChallan) => {
    try {
      const full = await challansApi.getById(c.id);
      setDetailChallan(full);
    } catch {
      setDetailChallan(c);
    }
  };

  return (
    <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      <Header
        title="SALES CHALLANS"
        subtitle="Stock allocation, outbound dispatch & snapshot tracking"
        actionButton={
          canCreate ? (
            <button
              onClick={() => {
                setFormError(null);
                setIsCreateOpen(true);
              }}
              className="bg-brand-red hover:bg-brand-red-hover text-white font-mono text-xs uppercase font-bold px-4 py-2.5 flex items-center gap-2 border border-brand-red transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>CREATE SALES CHALLAN</span>
            </button>
          ) : null
        }
      />

      {/* Filter Bar */}
      <div className="bg-brand-dark border border-brand-border p-4 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="relative">
          <Search className="w-4 h-4 text-zinc-500 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by challan # or customer..."
            className="w-full bg-brand-black border border-brand-border pl-9 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as ChallanStatus)}
            className="w-full bg-brand-black border border-brand-border px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-red"
          >
            <option value="">ALL CHALLAN STATUSES</option>
            <option value="DRAFT">DRAFT</option>
            <option value="CONFIRMED">CONFIRMED</option>
            <option value="CANCELLED">CANCELLED</option>
          </select>
        </div>
      </div>

      {isLoading && <Loader label="FETCHING SALES CHALLANS..." />}
      {isError && <ErrorMessage onRetry={refetch} />}

      {!isLoading && !isError && challans.length === 0 && (
        <EmptyState
          title="NO SALES CHALLANS FOUND"
          description="There are no active challans matching the requested query."
          action={
            canCreate ? (
              <button
                onClick={() => setIsCreateOpen(true)}
                className="bg-brand-red hover:bg-brand-red-hover text-white font-mono text-xs uppercase px-4 py-2 border border-brand-red font-bold"
              >
                CREATE CHALLAN
              </button>
            ) : undefined
          }
        />
      )}

      {/* Challan Table */}
      {!isLoading && !isError && challans.length > 0 && (
        <div className="bg-brand-dark border border-brand-border overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-black border-b border-brand-border font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="p-3.5">Challan Number</th>
                <th className="p-3.5">Customer Name</th>
                <th className="p-3.5">Total Quantity</th>
                <th className="p-3.5">Status</th>
                <th className="p-3.5">Created Date</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border font-sans text-xs">
              {challans.map((c) => (
                <tr key={c.id} className="hover:bg-brand-black/60 transition-colors">
                  <td className="p-3.5">
                    <button
                      onClick={() => openDetails(c)}
                      className="font-mono font-bold text-sm text-brand-red hover:underline"
                    >
                      {c.challanNumber}
                    </button>
                  </td>
                  <td className="p-3.5">
                    <div className="font-bold text-sm text-white">{c.customer?.name || 'N/A'}</div>
                    {c.customer?.businessName && (
                      <div className="text-zinc-400 font-mono text-[11px]">{c.customer.businessName}</div>
                    )}
                  </td>
                  <td className="p-3.5 font-mono text-zinc-200 font-bold">{c.totalQuantity} Units</td>
                  <td className="p-3.5">
                    <Badge variant={c.status === 'CONFIRMED' ? 'white' : c.status === 'DRAFT' ? 'warning' : 'subtle'}>
                      {c.status}
                    </Badge>
                  </td>
                  <td className="p-3.5 font-mono text-zinc-400">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </td>
                  <td className="p-3.5 text-right">
                    <div className="inline-flex items-center gap-2">
                      <button
                        onClick={() => openDetails(c)}
                        className="bg-brand-black hover:bg-zinc-800 border border-brand-border px-2.5 py-1 text-zinc-300 hover:text-white font-mono text-[11px] uppercase transition-colors"
                      >
                        Inspect
                      </button>
                      {c.status === 'DRAFT' && canCreate && (
                        <button
                          onClick={() => confirmMutation.mutate(c.id)}
                          disabled={confirmMutation.isPending}
                          className="bg-brand-red hover:bg-brand-red-hover text-white border border-brand-red px-2.5 py-1 font-mono text-[11px] uppercase font-bold transition-colors disabled:opacity-50 flex items-center gap-1"
                        >
                          <CheckCircle2 className="w-3 h-3" />
                          Confirm
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

      {/* Create Sales Challan Modal */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Generate Sales Challan Document"
        maxWidth="max-w-3xl"
      >
        <div className="space-y-5 font-mono text-xs">
          {formError && (
            <div className="bg-red-950 border border-brand-red p-3 text-red-200 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block uppercase text-zinc-300 mb-1">Select Account / Customer *</label>
            <select
              value={selectedCustomerId}
              onChange={(e) => setSelectedCustomerId(e.target.value)}
              className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
            >
              <option value="">-- Choose Customer --</option>
              {customers.map((cust) => (
                <option key={cust.id} value={cust.id}>
                  {cust.name} ({cust.customerType}) {cust.businessName ? `- ${cust.businessName}` : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Product Items Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="uppercase text-zinc-300">Line Items & Product Quantities *</span>
              <button
                type="button"
                onClick={handleAddItemRow}
                className="text-brand-red hover:underline uppercase font-bold text-[11px] flex items-center gap-1"
              >
                <Plus className="w-3 h-3" /> Add Product
              </button>
            </div>

            <div className="space-y-2">
              {selectedItems.map((item, idx) => {
                const selectedProd = products.find((p) => p.id === item.productId);
                const isInsufficient = selectedProd ? selectedProd.currentStock < item.quantity : false;

                return (
                  <div key={idx} className="bg-brand-black border border-brand-border p-3 flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div className="flex-1 w-full">
                      <select
                        value={item.productId}
                        onChange={(e) => handleItemChange(idx, 'productId', e.target.value)}
                        className="w-full bg-brand-dark border border-brand-border px-3 py-2 text-white text-xs focus:outline-none focus:border-brand-red"
                      >
                        <option value="">-- Select Product --</option>
                        {products.map((prod) => (
                          <option key={prod.id} value={prod.id}>
                            [{prod.sku}] {prod.productName} (Avail: {prod.currentStock})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="w-full sm:w-32">
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                        className="w-full bg-brand-dark border border-brand-border px-3 py-2 text-white text-xs focus:outline-none focus:border-brand-red"
                      />
                    </div>

                    {selectedProd && (
                      <div className="text-[11px]">
                        <span className={`font-bold ${isInsufficient ? 'text-brand-red' : 'text-zinc-400'}`}>
                          Stock: {selectedProd.currentStock}
                        </span>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(idx)}
                      disabled={selectedItems.length === 1}
                      className="text-zinc-500 hover:text-brand-red disabled:opacity-30 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsCreateOpen(false)}
              className="px-4 py-2 border border-brand-border bg-brand-black hover:bg-zinc-800 text-zinc-300 uppercase font-bold"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => submitChallan('DRAFT')}
              disabled={createMutation.isPending}
              className="px-4 py-2 border border-zinc-600 bg-zinc-800 hover:bg-zinc-700 text-white uppercase font-bold disabled:opacity-50"
            >
              Save Draft
            </button>
            <button
              type="button"
              onClick={() => submitChallan('CONFIRMED')}
              disabled={createMutation.isPending}
              className="px-5 py-2 border border-brand-red bg-brand-red hover:bg-brand-red-hover text-white uppercase font-bold disabled:opacity-50 flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Deduct Stock</span>
            </button>
          </div>
        </div>
      </Modal>

      {/* Challan Detail Inspector Modal */}
      <Modal
        isOpen={!!detailChallan}
        onClose={() => setDetailChallan(null)}
        title={detailChallan ? `Sales Challan: ${detailChallan.challanNumber}` : ''}
        maxWidth="max-w-3xl"
      >
        {detailChallan && (
          <div className="space-y-6 font-mono text-xs">
            <div className="bg-brand-black border border-brand-border p-4 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <span className="text-zinc-500 uppercase block">Customer / Account:</span>
                <span className="font-bold text-white text-sm">{detailChallan.customer?.name}</span>
                {detailChallan.customer?.businessName && (
                  <span className="text-zinc-400 block">{detailChallan.customer.businessName}</span>
                )}
              </div>
              <div>
                <span className="text-zinc-500 uppercase block">Document Status:</span>
                <div className="mt-1">
                  <Badge variant={detailChallan.status === 'CONFIRMED' ? 'white' : detailChallan.status === 'DRAFT' ? 'warning' : 'subtle'}>
                    {detailChallan.status}
                  </Badge>
                </div>
              </div>
              <div>
                <span className="text-zinc-500 uppercase block">Created By:</span>
                <span className="text-zinc-200">{detailChallan.createdBy?.name || 'System'} ({detailChallan.createdBy?.role})</span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase block">Dispatch Date:</span>
                <span className="text-zinc-200">{new Date(detailChallan.createdAt).toLocaleString()}</span>
              </div>
            </div>

            {/* Snapshot Line Items */}
            <div>
              <h3 className="font-heading text-xs text-white uppercase tracking-wider mb-2">
                Line Items (Preserved Snapshots)
              </h3>
              <div className="bg-brand-black border border-brand-border overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-brand-border text-[10px] text-zinc-400 uppercase">
                      <th className="p-2.5">Snapshot Product Name</th>
                      <th className="p-2.5">SKU Snapshot</th>
                      <th className="p-2.5">Quantity</th>
                      <th className="p-2.5">Snapshot Unit Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-brand-border text-xs">
                    {detailChallan.items.map((item) => (
                      <tr key={item.id}>
                        <td className="p-2.5 text-white font-bold">{item.productNameSnapshot}</td>
                        <td className="p-2.5 font-mono text-brand-red">{item.skuSnapshot}</td>
                        <td className="p-2.5 font-mono text-zinc-200 font-bold">{item.quantity} Units</td>
                        <td className="p-2.5 font-mono text-zinc-300">₹{Number(item.unitPrice).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-border flex justify-between items-center">
              <div>
                {detailChallan.status === 'DRAFT' && canCreate && (
                  <button
                    onClick={() => confirmMutation.mutate(detailChallan.id)}
                    disabled={confirmMutation.isPending}
                    className="bg-brand-red hover:bg-brand-red-hover text-white px-4 py-2 uppercase font-bold border border-brand-red disabled:opacity-50 flex items-center gap-1.5"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Confirm & Commit Stock Reduction</span>
                  </button>
                )}
              </div>

              {detailChallan.status !== 'CANCELLED' && canCreate && (
                <button
                  onClick={() => {
                    if (confirm('Cancel this sales challan?')) {
                      cancelMutation.mutate(detailChallan.id);
                    }
                  }}
                  className="bg-brand-black hover:bg-zinc-800 text-zinc-400 hover:text-brand-red px-3 py-2 uppercase font-mono text-[11px] border border-brand-border"
                >
                  Cancel Challan
                </button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
