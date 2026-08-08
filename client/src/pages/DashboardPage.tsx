import React from 'react';
import { useQuery } from '@tanstack/react-query';
import Header from '../components/common/Header';
import Loader from '../components/common/Loader';
import ErrorMessage from '../components/common/ErrorMessage';
import Badge from '../components/common/Badge';
import { customersApi } from '../api/customers.api';
import { productsApi } from '../api/products.api';
import { challansApi } from '../api/challans.api';
import { Users, Package, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DashboardPage() {
  const { data: customersData, isLoading: loadingCustomers, error: errCustomers, refetch: refetchCustomers } = useQuery({
    queryKey: ['customers-dashboard'],
    queryFn: () => customersApi.getAll({ limit: 10 }),
  });

  const { data: productsData, isLoading: loadingProducts, error: errProducts, refetch: refetchProducts } = useQuery({
    queryKey: ['products-dashboard'],
    queryFn: () => productsApi.getAll({ limit: 100 }),
  });

  const { data: challansData, isLoading: loadingChallans, error: errChallans, refetch: refetchChallans } = useQuery({
    queryKey: ['challans-dashboard'],
    queryFn: () => challansApi.getAll({ limit: 5 }),
  });

  const isLoading = loadingCustomers || loadingProducts || loadingChallans;
  const isError = errCustomers || errProducts || errChallans;

  if (isLoading) return <Loader label="SYNCHRONIZING ERP SYSTEM METRICS..." />;
  if (isError) return <ErrorMessage onRetry={() => { refetchCustomers(); refetchProducts(); refetchChallans(); }} />;

  const customers = customersData?.customers || [];
  const products = productsData?.products || [];
  const challans = challansData?.challans || [];

  const lowStockProducts = products.filter((p) => p.currentStock <= p.minimumStock);
  const pendingChallans = challans.filter((c) => c.status === 'DRAFT');
  const activeCustomers = customers.filter((c) => c.status === 'Active');

  return (
    <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      <Header
        title="EXECUTIVE OVERVIEW"
        subtitle="Real-time operational inventory & CRM status"
      />

      {/* Top Key Performance Metric Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-brand-dark border-2 border-brand-border p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Active Accounts</span>
            <Users className="w-5 h-5 text-brand-red" />
          </div>
          <div className="font-pixel text-3xl text-white mt-3">{activeCustomers.length}</div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2 uppercase">Out of {customers.length} total leads</p>
        </div>

        <div className="bg-brand-dark border-2 border-brand-border p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Total Inventory SKUs</span>
            <Package className="w-5 h-5 text-brand-red" />
          </div>
          <div className="font-pixel text-3xl text-white mt-3">{products.length}</div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2 uppercase">Tracked warehouse items</p>
        </div>

        <div className="bg-brand-dark border-2 border-brand-border p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Low Stock Warnings</span>
            <AlertTriangle className="w-5 h-5 text-brand-red" />
          </div>
          <div className="font-pixel text-3xl text-brand-red mt-3">{lowStockProducts.length}</div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2 uppercase">Requires immediate intake</p>
        </div>

        <div className="bg-brand-dark border-2 border-brand-border p-5 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono text-zinc-400 uppercase tracking-widest">Pending Drafts</span>
            <FileText className="w-5 h-5 text-brand-red" />
          </div>
          <div className="font-pixel text-3xl text-white mt-3">{pendingChallans.length}</div>
          <p className="text-[11px] font-mono text-zinc-500 mt-2 uppercase">Unconfirmed sales challans</p>
        </div>
      </div>

      {/* Main Grid: Low Stock Alerts & Recent Sales Challans */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Low Stock Alerts */}
        <div className="bg-brand-dark border border-brand-border p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-brand-red" />
                <h2 className="font-heading text-sm text-white uppercase tracking-wider">Critical Inventory Thresholds</h2>
              </div>
              <Link to="/products" className="text-xs font-mono text-brand-red hover:underline uppercase flex items-center gap-1">
                View All <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {lowStockProducts.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-zinc-500 uppercase">
                All inventory levels are above minimum threshold limits.
              </div>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((p) => (
                  <div key={p.id} className="bg-brand-black border border-red-900/50 p-3.5 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-sm text-white">{p.productName}</div>
                      <div className="text-xs font-mono text-zinc-400 mt-0.5">
                        SKU: {p.sku} | Loc: {p.warehouseLocation || 'N/A'}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="danger">{p.currentStock} UNITS LEFT</Badge>
                      <div className="text-[10px] font-mono text-zinc-500 mt-1 uppercase">Min: {p.minimumStock}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Recent Sales Challans */}
        <div className="bg-brand-dark border border-brand-border p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-brand-border">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-brand-red" />
                <h2 className="font-heading text-sm text-white uppercase tracking-wider">Recent Sales Challans</h2>
              </div>
              <Link to="/challans" className="text-xs font-mono text-brand-red hover:underline uppercase flex items-center gap-1">
                Manage Challans <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            {challans.length === 0 ? (
              <div className="py-8 text-center font-mono text-xs text-zinc-500 uppercase">
                No sales challans recorded in system.
              </div>
            ) : (
              <div className="space-y-3">
                {challans.map((c) => (
                  <div key={c.id} className="bg-brand-black border border-brand-border p-3.5 flex items-center justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-brand-red">{c.challanNumber}</span>
                        <Badge
                          variant={
                            c.status === 'CONFIRMED' ? 'white' : c.status === 'DRAFT' ? 'warning' : 'subtle'
                          }
                        >
                          {c.status}
                        </Badge>
                      </div>
                      <div className="text-xs text-zinc-300 font-medium mt-1">
                        {c.customer?.name || 'Unknown Customer'}
                      </div>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <div className="text-white font-bold">{c.totalQuantity} Units</div>
                      <div className="text-zinc-500 text-[10px] mt-0.5">
                        {new Date(c.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
