import React from 'react';
import { useAuth } from '../context/AuthContext';
import Header from '../components/common/Header';
import Badge from '../components/common/Badge';
import { User, Shield, Key, LogOut, Check, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const permissions = [
    { name: 'View CRM Customers', admin: true, sales: true, warehouse: true, accounts: true },
    { name: 'Create & Edit Customers', admin: true, sales: true, warehouse: false, accounts: false },
    { name: 'Delete Customer Records', admin: true, sales: false, warehouse: false, accounts: false },
    { name: 'View Product Catalog', admin: true, sales: true, warehouse: true, accounts: true },
    { name: 'Create & Edit Products', admin: true, sales: false, warehouse: true, accounts: false },
    { name: 'Manual Stock Intake / Movement', admin: true, sales: false, warehouse: true, accounts: false },
    { name: 'Generate & Confirm Sales Challan', admin: true, sales: true, warehouse: false, accounts: false },
  ];

  const roleKey = user.role.toLowerCase() as 'admin' | 'sales' | 'warehouse' | 'accounts';

  return (
    <div className="pb-24 max-w-7xl mx-auto px-4 sm:px-6">
      <Header
        title="USER PROFILE & ACCESS"
        subtitle="Identity verification & role privilege matrix"
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* User Card */}
        <div className="bg-brand-dark border-2 border-brand-border p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-6 pb-4 border-b border-brand-border">
              <div className="p-3 bg-brand-red-light border border-brand-red">
                <User className="w-8 h-8 text-brand-red" />
              </div>
              <div>
                <h2 className="font-bold text-lg text-white">{user.name}</h2>
                <p className="text-xs font-mono text-zinc-400">{user.email}</p>
              </div>
            </div>

            <div className="space-y-4 font-mono text-xs mb-6">
              <div>
                <span className="text-zinc-500 uppercase block mb-1">System Security Role:</span>
                <Badge variant="danger">{user.role}</Badge>
              </div>
              <div>
                <span className="text-zinc-500 uppercase block mb-1">System UUID:</span>
                <span className="text-zinc-300 text-[11px] block break-all bg-brand-black p-2 border border-brand-border">
                  {user.id}
                </span>
              </div>
              <div>
                <span className="text-zinc-500 uppercase block mb-1">Account Created:</span>
                <span className="text-zinc-300">{new Date(user.createdAt).toLocaleDateString()}</span>
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="w-full bg-brand-black hover:bg-red-950/50 border border-brand-border hover:border-brand-red text-zinc-300 hover:text-brand-red py-3 font-mono text-xs font-bold uppercase transition-colors flex items-center justify-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            <span>TERMINATE ACTIVE SESSION</span>
          </button>
        </div>

        {/* Role Privileges Table */}
        <div className="lg:col-span-2 bg-brand-dark border border-brand-border p-6">
          <div className="flex items-center gap-2 mb-4 pb-3 border-b border-brand-border">
            <Shield className="w-4 h-4 text-brand-red" />
            <h2 className="font-heading text-sm text-white uppercase tracking-wider">Role Privilege Matrix</h2>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-brand-black border-b border-brand-border text-[11px] text-zinc-400 uppercase">
                  <th className="p-3">Permission / Action</th>
                  <th className="p-3 text-center">Your Role ({user.role})</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-border">
                {permissions.map((p, idx) => {
                  const allowed = p[roleKey];
                  return (
                    <tr key={idx} className="hover:bg-brand-black/50">
                      <td className="p-3 text-zinc-200">{p.name}</td>
                      <td className="p-3 text-center">
                        {allowed ? (
                          <span className="inline-flex items-center gap-1 text-white bg-red-950/80 border border-brand-red px-2 py-0.5 font-bold text-[10px]">
                            <Check className="w-3 h-3 text-brand-red" /> AUTHORIZED
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-zinc-500 border border-brand-border px-2 py-0.5 text-[10px]">
                            <X className="w-3 h-3" /> RESTRICTED
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
