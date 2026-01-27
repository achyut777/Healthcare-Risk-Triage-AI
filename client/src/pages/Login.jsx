import { Activity, ArrowRight, Eye, EyeOff, Lock, Mail } from 'lucide-react';
import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login, isLoading, error } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      toast.success('Welcome back!');
      navigate('/dashboard');
    } else {
      toast.error(result.error || 'Login failed');
    }
  };

  // Demo login
  const handleDemoLogin = async () => {
    setEmail('demo@healthtriage.ai');
    setPassword('demo123');
    const result = await login('demo@healthtriage.ai', 'demo123');
    if (result.success) {
      toast.success('Welcome to the demo!');
      navigate('/dashboard');
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Branding */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary-600 via-primary-700 to-primary-800 p-12 flex-col justify-between relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <svg className="w-full h-full" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="grid" width="10" height="10" patternUnits="userSpaceOnUse">
                <circle cx="1" cy="1" r="1" fill="currentColor" />
              </pattern>
            </defs>
            <rect width="100" height="100" fill="url(#grid)" />
          </svg>
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-xl bg-white/10 backdrop-blur">
              <Activity className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-display font-bold text-white">HealthTriage AI</span>
          </div>
        </div>

        <div className="relative space-y-6">
          <h1 className="text-4xl lg:text-5xl font-display font-bold text-white leading-tight">
            Intelligent Patient<br />Risk Assessment
          </h1>
          <p className="text-lg text-primary-100 max-w-md">
            AI-powered triage system for faster, smarter patient prioritization. 
            Improve care outcomes with data-driven decisions.
          </p>
          <div className="flex gap-8 pt-4">
            <div>
              <div className="text-3xl font-bold text-white">95%</div>
              <div className="text-sm text-primary-200">Accuracy Rate</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">50%</div>
              <div className="text-sm text-primary-200">Faster Triage</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-white">24/7</div>
              <div className="text-sm text-primary-200">Availability</div>
            </div>
          </div>
        </div>

        <div className="relative text-sm text-primary-200">
          © 2024 HealthTriage AI. All rights reserved.
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center justify-center gap-3 mb-8">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-primary-600">
              <Activity className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-display font-bold text-slate-900">HealthTriage AI</span>
          </div>

          <div className="text-center lg:text-left">
            <h2 className="text-2xl font-display font-bold text-slate-900">Welcome back</h2>
            <p className="text-slate-600 mt-2">Sign in to access the triage system</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label htmlFor="email" className="label">Email Address</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type="email"
                  id="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="input pl-10"
                  placeholder="you@example.com"
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="label">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="input pl-10 pr-10"
                  placeholder="••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2">
                <input type="checkbox" className="rounded border-slate-300 text-primary-600 focus:ring-primary-500" />
                <span className="text-slate-600">Remember me</span>
              </label>
              <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
                Forgot password?
              </a>
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-3"
            >
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <svg className="animate-spin w-5 h-5" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                  </svg>
                  Signing in...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  Sign in
                  <ArrowRight className="w-5 h-5" />
                </span>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-200" />
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white text-slate-500">Or continue with</span>
            </div>
          </div>

          <button
            onClick={handleDemoLogin}
            className="btn-secondary w-full py-3"
          >
            Try Demo Account
          </button>

          <p className="text-center text-sm text-slate-600">
            Need access?{' '}
            <a href="#" className="text-primary-600 hover:text-primary-700 font-medium">
              Contact your administrator
            </a>
          </p>

          <Link
            to="/patient-portal"
            className="block text-center text-sm text-slate-500 hover:text-primary-600"
          >
            → Check your queue status (Patient Portal)
          </Link>
        </div>
      </div>
    </div>
  );
}
