import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useAuth } from '../context/AuthContext';
import { Shield, AlertTriangle, Key, UserCheck } from 'lucide-react';

const loginSchema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: 'admin@erp.com',
      password: 'Password@123',
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    setErrorMessage(null);
    setSubmitting(true);
    try {
      await login(data.email, data.password);
      navigate('/');
    } catch (err: any) {
      setErrorMessage(err.response?.data?.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillQuickDemo = (email: string) => {
    setValue('email', email);
    setValue('password', 'Password@123');
    setErrorMessage(null);
  };

  return (
    <div class="min-h-screen bg-brand-black bg-grid-pattern flex flex-col justify-center items-center p-4">
      <div class="w-full max-w-md bg-brand-dark border-2 border-brand-border shadow-2xl p-8 relative">
        {/* Accent Top Line */}
        <div class="absolute top-0 left-0 right-0 h-1 bg-brand-red"></div>

        {/* Title / Header */}
        <div class="mb-8 text-center">
          <div class="inline-flex items-center justify-center p-3 bg-brand-red-light border border-brand-red mb-4">
            <Shield class="w-8 h-8 text-brand-red" />
          </div>
          <h1 class="font-heading text-2xl tracking-wider text-white">MINI ERP + CRM</h1>
          <p class="text-xs uppercase text-zinc-400 font-mono tracking-widest mt-1">Industrial Operational Portal</p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div class="mb-6 bg-red-950/80 border border-brand-red text-red-200 p-4 text-xs font-mono flex items-start gap-3">
            <AlertTriangle class="w-5 h-5 text-brand-red shrink-0 mt-0.5" />
            <div>
              <div class="font-bold text-brand-red uppercase">AUTHENTICATION_ERROR</div>
              <div>{errorMessage}</div>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} class="space-y-5">
          <div>
            <label class="block text-xs uppercase font-mono tracking-wider text-zinc-300 mb-2">
              System Identifier / Email
            </label>
            <input
              type="email"
              {...register('email')}
              class="w-full bg-brand-black border border-brand-border px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-brand-red transition-colors"
              placeholder="user@erp.com"
            />
            {errors.email && (
              <p class="text-brand-red text-xs font-mono mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label class="block text-xs uppercase font-mono tracking-wider text-zinc-300 mb-2">
              Security Key / Password
            </label>
            <input
              type="password"
              {...register('password')}
              class="w-full bg-brand-black border border-brand-border px-4 py-3 text-sm font-mono text-white focus:outline-none focus:border-brand-red transition-colors"
              placeholder="••••••••"
            />
            {errors.password && (
              <p class="text-brand-red text-xs font-mono mt-1">{errors.password.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={submitting}
            class="w-full bg-brand-red hover:bg-brand-red-hover text-white font-mono text-sm uppercase py-3.5 tracking-wider font-bold transition-colors flex items-center justify-center gap-2 border border-brand-red disabled:opacity-50"
          >
            {submitting ? (
              <span>AUTHENTICATING...</span>
            ) : (
              <>
                <Key class="w-4 h-4" />
                <span>AUTHORIZE SYSTEM ACCESS</span>
              </>
            )}
          </button>
        </form>

        {/* Quick Demo Credentials Preset */}
        <div class="mt-8 border-t border-brand-border pt-6">
          <div class="text-xs uppercase font-mono text-zinc-400 mb-3 flex items-center gap-1.5">
            <UserCheck class="w-3.5 h-3.5 text-brand-red" />
            <span>Select Demo Role:</span>
          </div>
          <div class="grid grid-cols-2 gap-2 font-mono text-xs">
            <button
              type="button"
              onClick={() => fillQuickDemo('admin@erp.com')}
              class="bg-brand-black hover:bg-zinc-900 border border-brand-border py-2 px-2 text-left text-zinc-300 hover:text-white transition-colors"
            >
              <span class="text-brand-red font-bold">● ADMIN</span> admin@erp.com
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('sales@erp.com')}
              class="bg-brand-black hover:bg-zinc-900 border border-brand-border py-2 px-2 text-left text-zinc-300 hover:text-white transition-colors"
            >
              <span class="text-brand-red font-bold">● SALES</span> sales@erp.com
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('warehouse@erp.com')}
              class="bg-brand-black hover:bg-zinc-900 border border-brand-border py-2 px-2 text-left text-zinc-300 hover:text-white transition-colors"
            >
              <span class="text-brand-red font-bold">● WAREHOUSE</span> warehouse@erp.com
            </button>
            <button
              type="button"
              onClick={() => fillQuickDemo('accounts@erp.com')}
              class="bg-brand-black hover:bg-zinc-900 border border-brand-border py-2 px-2 text-left text-zinc-300 hover:text-white transition-colors"
            >
              <span class="text-brand-red font-bold">● ACCOUNTS</span> accounts@erp.com
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
