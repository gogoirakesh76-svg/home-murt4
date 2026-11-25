import React, { useState } from 'react';
import { Lock, Mail, Phone, User as UserIcon } from 'lucide-react';
import { useRouter } from '../context/RouterContext';
import { useStore } from '../context/StoreContext';

export function AuthPage({ initialMode = 'login' }: { initialMode?: 'login' | 'register' }) {
  const { search, navigate } = useRouter();
  const { loginUser, registerUser, showToast } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>(initialMode);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  const redirectTo = new URLSearchParams(search).get('redirect') || '/';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      if (mode === 'login') {
        const user = await loginUser(email.trim(), password);
        showToast(`Welcome back, ${user.name}!`);
      } else {
        const user = await registerUser({
          name: name.trim(),
          email: email.trim(),
          password,
          phone: phone.trim(),
        });
        showToast(`Welcome to HOME MURT, ${user.name}!`);
      }
      navigate(redirectTo);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Authentication failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const fillDemoCustomer = () => {
    setMode('login');
    setEmail('customer@homemurt.com');
    setPassword('Customer@123');
    setError('');
  };

  return (
    <main className="min-h-[75vh] bg-[#F8FAF9] py-12 px-4 flex items-center justify-center">
      <div className="w-full max-w-md bg-white border border-[#E5EAE7] rounded-2xl p-6 sm:p-8 shadow-sm">
        <div className="text-center mb-6">
          <p className="font-display text-xl font-extrabold text-[#0B1914]">
            HOME <span className="text-emerald-700">MURT</span>
          </p>
          <h1 className="font-display text-2xl font-bold text-[#0B1914] mt-2">
            {mode === 'login' ? 'Sign in to your account' : 'Create customer account'}
          </h1>
          <p className="text-sm text-[#6B7280] mt-1">
            Track orders, manage addresses, and save your wishlist.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-1 p-1 bg-[#F3F6F4] rounded-xl mb-6">
          <button
            type="button"
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`py-2 text-sm font-semibold rounded-lg transition-colors ${
              mode === 'login' ? 'bg-white text-[#0B1914] shadow-sm' : 'text-[#4B5563]'
            }`}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`py-2 text-sm font-semibold rounded-lg transition-colors ${
              mode === 'register' ? 'bg-white text-[#0B1914] shadow-sm' : 'text-[#4B5563]'
            }`}
          >
            Register
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="auth-name" className="block text-xs font-semibold text-[#374151] mb-1">
                  Full Name
                </label>
                <div className="relative">
                  <UserIcon className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Aarav Sharma"
                    className="w-full h-11 pl-10 pr-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-phone" className="block text-xs font-semibold text-[#374151] mb-1">
                  Phone Number
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    id="auth-phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full h-11 pl-10 pr-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="auth-email" className="block text-xs font-semibold text-[#374151] mb-1">
              Email Address
            </label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full h-11 pl-10 pr-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          <div>
            <label htmlFor="auth-password" className="block text-xs font-semibold text-[#374151] mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[#6B7280] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                id="auth-password"
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimum 6 characters"
                className="w-full h-11 pl-10 pr-3 text-sm border border-[#D1DBD5] rounded-lg focus:outline-none focus:border-emerald-700"
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-800">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={submitting}
            className="w-full h-11 bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
          >
            {submitting
              ? 'Please wait...'
              : mode === 'login'
              ? 'Sign In'
              : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#E5EAE7] text-center space-y-2">
          <p className="text-xs text-[#6B7280]">Want to test ordering quickly?</p>
          <button
            type="button"
            onClick={fillDemoCustomer}
            className="w-full py-2 text-xs font-semibold text-[#0B1914] bg-[#F3F6F4] hover:bg-[#E5EAE7] rounded-lg transition-colors"
          >
            Fill Demo Customer Credentials
          </button>
        </div>
      </div>
    </main>
  );
}
