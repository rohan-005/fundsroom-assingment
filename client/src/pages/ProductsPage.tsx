import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import EmptyState from '../components/common/EmptyState';
import Modal from '../components/common/Modal';
import Badge from '../components/common/Badge';
import { productsApi } from '../api/products.api';
import { stockApi } from '../api/stock.api';
import { Product } from '../types/product.types';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, Search, AlertTriangle, ArrowDownRight, ArrowUpRight, History, Edit3, ShieldAlert } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const productFormSchema = z.object({
  productName: z.string().min(2, 'Product name is required'),
  sku: z.string().min(2, 'SKU is required'),
  category: z.string().min(2, 'Category is required'),
  unitPrice: z.coerce.number().positive('Unit price must be positive'),
  currentStock: z.coerce.number().int().min(0, 'Stock cannot be negative'),
  minimumStock: z.coerce.number().int().min(0, 'Minimum stock cannot be negative'),
  warehouseLocation: z.string().optional().or(z.literal('')),
});

const stockMovementFormSchema = z.object({
  quantity: z.coerce.number().int().positive('Quantity must be greater than 0'),
  movementType: z.enum(['IN', 'OUT']),
  reason: z.string().min(2, 'Reason for stock movement is required'),
});

type ProductFormData = z.infer<typeof productFormSchema>;
type StockMovementFormData = z.infer<typeof stockMovementFormSchema>;

export default function ProductsPage() {
  const { hasRole } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [lowStockFilter, setLowStockFilter] = useState(false);

  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  const [stockProduct, setStockProduct] = useState<Product | null>(null);
  const [stockError, setStockError] = useState<string | null>(null);

  const canManageProducts = hasRole('ADMIN', 'WAREHOUSE');

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['products', search, categoryFilter, lowStockFilter],
    queryFn: () =>
      productsApi.getAll({
        search: search || undefined,
        category: categoryFilter || undefined,
        lowStock: lowStockFilter || undefined,
      }),
  });

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues: {
      currentStock: 0,
      minimumStock: 5,
    },
  });

  const {
    register: registerStock,
    handleSubmit: handleSubmitStock,
    reset: resetStock,
    formState: { errors: stockErrors },
  } = useForm<StockMovementFormData>({
    resolver: zodResolver(stockMovementFormSchema),
    defaultValues: {
      movementType: 'IN',
    },
  });

  // Create / Update product mutation
  const saveProductMutation = useMutation({
    mutationFn: (data: ProductFormData) => {
      if (editingProduct) {
        return productsApi.update(editingProduct.id, data);
      }
      return productsApi.create(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setIsProductModalOpen(false);
      setEditingProduct(null);
      reset();
    },
  });

  // Manual stock movement mutation
  const stockMovementMutation = useMutation({
    mutationFn: (data: StockMovementFormData) => {
      setStockError(null);
      return stockApi.create({
        productId: stockProduct!.id,
        quantity: data.quantity,
        movementType: data.movementType,
        reason: data.reason,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      setStockProduct(null);
      resetStock();
    },
    onError: (err: any) => {
      setStockError(err.response?.data?.message || 'Failed to record stock movement.');
    },
  });

  const handleOpenCreate = () => {
    setEditingProduct(null);
    reset({
      productName: '',
      sku: '',
      category: '',
      unitPrice: 0,
      currentStock: 0,
      minimumStock: 5,
      warehouseLocation: '',
    });
    setIsProductModalOpen(true);
  };

  const handleOpenEdit = (p: Product) => {
    setEditingProduct(p);
    setValue('productName', p.productName);
    setValue('sku', p.sku);
    setValue('category', p.category);
    setValue('unitPrice', p.unitPrice);
    setValue('currentStock', p.currentStock);
    setValue('minimumStock', p.minimumStock);
    setValue('warehouseLocation', p.warehouseLocation || '');
    setIsProductModalOpen(true);
  };

  const products = data?.products || [];

  return (
    <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      <Header
        title="PRODUCTS & INVENTORY"
        subtitle="Catalog, stock control & warehouse location records"
        actionButton={
          canManageProducts ? (
            <button
              onClick={handleOpenCreate}
              className="bg-brand-red hover:bg-brand-red-hover text-white font-mono text-xs uppercase font-bold px-4 py-2.5 flex items-center gap-2 border border-brand-red transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>NEW PRODUCT</span>
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
            placeholder="Search by SKU, product name..."
            className="w-full bg-brand-black border border-brand-border pl-9 pr-4 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div>
          <input
            type="text"
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Filter by category..."
            className="w-full bg-brand-black border border-brand-border px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-brand-red"
          />
        </div>

        <div className="flex items-center">
          <label className="flex items-center gap-2 text-xs font-mono text-zinc-300 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={lowStockFilter}
              onChange={(e) => setLowStockFilter(e.target.checked)}
              className="w-4 h-4 bg-brand-black border border-brand-border text-brand-red focus:ring-0 cursor-pointer"
            />
            <span className={lowStockFilter ? 'text-brand-red font-bold' : ''}>SHOW LOW STOCK ONLY</span>
          </label>
        </div>
      </div>

      {isLoading && <Loader label="FETCHING INVENTORY RECORDS..." />}
      {isError && <ErrorMessage onRetry={refetch} />}

      {!isLoading && !isError && products.length === 0 && (
        <EmptyState
          title="NO PRODUCTS FOUND"
          description="No inventory items match the current search filters."
          action={
            canManageProducts ? (
              <button
                onClick={handleOpenCreate}
                className="bg-brand-red hover:bg-brand-red-hover text-white font-mono text-xs uppercase px-4 py-2 border border-brand-red font-bold"
              >
                ADD PRODUCT
              </button>
            ) : undefined
          }
        />
      )}

      {/* Product List Table */}
      {!isLoading && !isError && products.length > 0 && (
        <div className="bg-brand-dark border border-brand-border overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-black border-b border-brand-border font-mono text-[11px] uppercase tracking-wider text-zinc-400">
                <th className="p-3.5">Product Name & Category</th>
                <th className="p-3.5">SKU</th>
                <th className="p-3.5">Unit Price</th>
                <th className="p-3.5">Current Stock</th>
                <th className="p-3.5">Location</th>
                <th className="p-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-brand-border font-sans text-xs">
              {products.map((p) => {
                const isLow = p.currentStock <= p.minimumStock;
                return (
                  <tr key={p.id} className={`hover:bg-brand-black/60 transition-colors ${isLow ? 'bg-red-950/20' : ''}`}>
                    <td className="p-3.5">
                      <div className="font-bold text-sm text-white">{p.productName}</div>
                      <div className="text-zinc-400 font-mono text-[11px] mt-0.5">{p.category}</div>
                    </td>
                    <td className="p-3.5 font-mono text-brand-red font-bold">{p.sku}</td>
                    <td className="p-3.5 font-mono text-white">₹{Number(p.unitPrice).toFixed(2)}</td>
                    <td className="p-3.5 font-mono">
                      <div className="flex items-center gap-2">
                        <span className={`font-bold text-sm ${isLow ? 'text-brand-red' : 'text-zinc-200'}`}>
                          {p.currentStock} UNITS
                        </span>
                        {isLow && <Badge variant="danger">LOW STOCK</Badge>}
                      </div>
                      <div className="text-[10px] text-zinc-500 mt-0.5 uppercase">Min threshold: {p.minimumStock}</div>
                    </td>
                    <td className="p-3.5 font-mono text-zinc-400">{p.warehouseLocation || 'N/A'}</td>
                    <td className="p-3.5 text-right">
                      <div className="inline-flex items-center gap-2">
                        {canManageProducts && (
                          <button
                            onClick={() => {
                              setStockProduct(p);
                              setStockError(null);
                              resetStock({ movementType: 'IN', quantity: 1, reason: '' });
                            }}
                            className="bg-brand-black hover:bg-zinc-800 border border-brand-border px-2.5 py-1 text-zinc-300 hover:text-white font-mono text-[11px] uppercase transition-colors flex items-center gap-1"
                          >
                            <History className="w-3 h-3 text-brand-red" />
                            Stock Adj
                          </button>
                        )}
                        {canManageProducts && (
                          <button
                            onClick={() => handleOpenEdit(p)}
                            className="p-1.5 text-zinc-400 hover:text-white border border-brand-border bg-brand-black hover:bg-zinc-800"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Product Form Modal */}
      <Modal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        title={editingProduct ? `Edit Product: ${editingProduct.sku}` : 'Add Product to Inventory Catalog'}
      >
        <form onSubmit={handleSubmit((data) => saveProductMutation.mutate(data))} className="space-y-4 font-mono text-xs">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-zinc-300 mb-1">Product Name *</label>
              <input
                {...register('productName')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
              {errors.productName && <p className="text-brand-red mt-0.5">{errors.productName.message}</p>}
            </div>

            <div>
              <label className="block uppercase text-zinc-300 mb-1">SKU Code *</label>
              <input
                {...register('sku')}
                disabled={!!editingProduct}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red uppercase disabled:opacity-50"
              />
              {errors.sku && <p className="text-brand-red mt-0.5">{errors.sku.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block uppercase text-zinc-300 mb-1">Category *</label>
              <input
                {...register('category')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
              {errors.category && <p className="text-brand-red mt-0.5">{errors.category.message}</p>}
            </div>

            <div>
              <label className="block uppercase text-zinc-300 mb-1">Unit Price (₹) *</label>
              <input
                type="number"
                step="0.01"
                {...register('unitPrice')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
              {errors.unitPrice && <p className="text-brand-red mt-0.5">{errors.unitPrice.message}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block uppercase text-zinc-300 mb-1">Current Stock</label>
              <input
                type="number"
                {...register('currentStock')}
                disabled={!!editingProduct}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red disabled:opacity-50"
              />
              {editingProduct && (
                <p className="text-[10px] text-zinc-500 mt-0.5">Use Stock Adjustment for stock updates</p>
              )}
            </div>

            <div>
              <label className="block uppercase text-zinc-300 mb-1">Min Threshold</label>
              <input
                type="number"
                {...register('minimumStock')}
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
            </div>

            <div>
              <label className="block uppercase text-zinc-300 mb-1">Warehouse Loc</label>
              <input
                {...register('warehouseLocation')}
                placeholder="Aisle 1, Bin 4"
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-brand-border flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setIsProductModalOpen(false)}
              className="px-4 py-2 border border-brand-border bg-brand-black hover:bg-zinc-800 text-zinc-300 uppercase font-bold"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saveProductMutation.isPending}
              className="px-5 py-2 border border-brand-red bg-brand-red hover:bg-brand-red-hover text-white uppercase font-bold disabled:opacity-50"
            >
              {saveProductMutation.isPending ? 'SAVING...' : 'SAVE PRODUCT'}
            </button>
          </div>
        </form>
      </Modal>

      {/* Manual Stock Intake / Removal Modal */}
      <Modal
        isOpen={!!stockProduct}
        onClose={() => setStockProduct(null)}
        title={stockProduct ? `Stock Adjustment: ${stockProduct.productName}` : ''}
      >
        {stockProduct && (
          <form
            onSubmit={handleSubmitStock((data) => stockMovementMutation.mutate(data))}
            className="space-y-4 font-mono text-xs"
          >
            <div className="bg-brand-black border border-brand-border p-3 flex justify-between items-center">
              <div>
                <span className="text-zinc-500 uppercase block">SKU: {stockProduct.sku}</span>
                <span className="text-zinc-300">Warehouse Location: {stockProduct.warehouseLocation || 'N/A'}</span>
              </div>
              <div className="text-right">
                <span className="text-zinc-500 uppercase block">Available Stock</span>
                <span className="text-brand-red font-bold text-base">{stockProduct.currentStock} Units</span>
              </div>
            </div>

            {stockError && (
              <div className="bg-red-950 border border-brand-red p-3 text-red-200 flex items-start gap-2">
                <ShieldAlert className="w-4 h-4 text-brand-red shrink-0 mt-0.5" />
                <span>{stockError}</span>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block uppercase text-zinc-300 mb-1">Movement Type *</label>
                <select
                  {...registerStock('movementType')}
                  className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
                >
                  <option value="IN">STOCK IN (+ Intake)</option>
                  <option value="OUT">STOCK OUT (- Manual Dispatch)</option>
                </select>
              </div>

              <div>
                <label className="block uppercase text-zinc-300 mb-1">Quantity *</label>
                <input
                  type="number"
                  min="1"
                  {...registerStock('quantity')}
                  className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
                />
                {stockErrors.quantity && <p className="text-brand-red mt-0.5">{stockErrors.quantity.message}</p>}
              </div>
            </div>

            <div>
              <label className="block uppercase text-zinc-300 mb-1">Reason / Justification *</label>
              <textarea
                {...registerStock('reason')}
                rows={2}
                placeholder="e.g. Factory shipment batch intake, damaged stock write-off..."
                className="w-full bg-brand-black border border-brand-border px-3 py-2 text-white focus:outline-none focus:border-brand-red"
              />
              {stockErrors.reason && <p className="text-brand-red mt-0.5">{stockErrors.reason.message}</p>}
            </div>

            <div className="pt-4 border-t border-brand-border flex justify-end gap-3">
              <button
                type="button"
                onClick={() => setStockProduct(null)}
                className="px-4 py-2 border border-brand-border bg-brand-black hover:bg-zinc-800 text-zinc-300 uppercase font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={stockMovementMutation.isPending}
                className="px-5 py-2 border border-brand-red bg-brand-red hover:bg-brand-red-hover text-white uppercase font-bold disabled:opacity-50"
              >
                {stockMovementMutation.isPending ? 'PROCESSING...' : 'CONFIRM ADJUSTMENT'}
              </button>
            </div>
          </form>
        )}
      </Modal>
    </div>
  );
}
