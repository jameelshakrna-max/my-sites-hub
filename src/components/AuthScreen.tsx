'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Mail,
  Lock,
  User,
  ArrowRight,
  LayoutGrid,
  Eye,
  EyeOff,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/context/AuthContext';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (mode === 'signin') {
      const { error: err } = await signIn(email, password);
      if (err) setError(err.message);
    } else {
      if (password.length < 8) {
        setError('كلمة المرور يجب أن تكون 8 أحرف على الأقل');
        setLoading(false);
        return;
      }
      const { error: err } = await signUp(email, password);
      if (err) setError(err.message);
      else setDone(true);
    }
    setLoading(false);
  }

  if (done) {
    return (
      <div className="min-h-screen relative overflow-hidden text-white flex items-center justify-center">
        <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
        <div className="fixed top-0 right-0 w-96 h-96 bg-sky-500/[0.05] rounded-full blur-3xl" />
        <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/[0.05] rounded-full blur-3xl" />

        <motion.div
          className="relative z-10 w-full max-w-md mx-4 text-center"
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
        >
          <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
            <div className="text-6xl mb-6">📬</div>
            <h2 className="text-2xl font-bold text-white mb-3">تحقق من بريدك الإلكتروني</h2>
            <p className="text-slate-400 text-sm leading-relaxed mb-6">
              أرسلنا رابط تأكيد إلى بريدك الإلكتروني.
              <br />
              اضغط على الرابط لتفعيل حسابك ثم سجّل الدخول.
            </p>
            <button
              onClick={() => { setDone(false); setMode('signin'); }}
              className="text-sky-400 hover:text-sky-300 text-sm font-medium transition-colors"
            >
              العودة لتسجيل الدخول ←
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden text-white flex items-center justify-center">
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-sky-500/[0.05] rounded-full blur-3xl" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/[0.05] rounded-full blur-3xl" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-slate-500/[0.03] rounded-full blur-3xl" />

      <motion.div
        className="relative z-10 w-full max-w-md mx-4"
        initial={{ y: 10 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="bg-white/[0.04] backdrop-blur-xl border border-white/[0.08] rounded-3xl p-8 shadow-2xl">
          <motion.div
            className="mx-auto w-20 h-20 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-xl shadow-sky-500/25 mb-6"
            initial={{ scale: 0.95 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          >
            <LayoutGrid className="w-10 h-10 text-white" />
          </motion.div>

          <motion.div
            className="text-center mb-8"
            initial={{ y: 5 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <h1 className="text-3xl font-bold bg-gradient-to-l from-white to-slate-300 bg-clip-text text-transparent mb-2">
              لوحة مواقعي
            </h1>
            <p className="text-slate-400 text-sm">
              مركزك الشخصي لتنظيم مواقعك
            </p>
          </motion.div>

          <motion.div
            className="flex bg-white/[0.04] rounded-xl p-1 mb-6 border border-white/[0.06]"
            initial={{ y: 5 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.35 }}
          >
            <button
              onClick={() => { setMode('signin'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                mode === 'signin'
                  ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              تسجيل الدخول
            </button>
            <button
              onClick={() => { setMode('signup'); setError(''); }}
              className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-all duration-300 ${
                mode === 'signup'
                  ? 'bg-sky-500/20 text-sky-300 shadow-sm'
                  : 'text-slate-400 hover:text-slate-300'
              }`}
            >
              إنشاء حساب
            </button>
          </motion.div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.25 }}
                >
                  <Label className="text-slate-300 text-sm mb-2 block flex items-center gap-2">
                    <User className="w-4 h-4 text-slate-500" />
                    الاسم الكامل
                  </Label>
                  <Input
                    type="text"
                    placeholder="اسمك الكامل"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    dir="rtl"
                    className="h-12 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 rounded-xl text-center text-base focus:border-sky-500/50 focus:ring-sky-500/20 transition-all"
                    disabled={loading}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ y: 5 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              <Label className="text-slate-300 text-sm mb-2 block flex items-center gap-2">
                <Mail className="w-4 h-4 text-slate-500" />
                البريد الإلكتروني
              </Label>
              <Input
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => { setEmail(e.target.value); setError(''); }}
                dir="ltr"
                className="h-12 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 rounded-xl text-center text-base focus:border-sky-500/50 focus:ring-sky-500/20 transition-all"
                disabled={loading}
                required
              />
            </motion.div>

            <motion.div
              initial={{ y: 5 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.45 }}
            >
              <Label className="text-slate-300 text-sm mb-2 block flex items-center gap-2">
                <Lock className="w-4 h-4 text-slate-500" />
                كلمة المرور
              </Label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={mode === 'signup' ? '8 أحرف على الأقل' : '••••••••'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  dir="ltr"
                  className="h-12 bg-white/[0.05] border-white/[0.1] text-white placeholder:text-slate-600 rounded-xl text-center text-base focus:border-sky-500/50 focus:ring-sky-500/20 transition-all pr-10"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </motion.div>

            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -5 }}
                  className="bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3"
                >
                  <p className="text-red-400 text-sm text-center">{error}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <motion.div
              initial={{ y: 5 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <button
                type="submit"
                disabled={loading}
                className="w-full h-12 bg-gradient-to-l from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl font-medium text-base shadow-lg shadow-sky-500/20 transition-all flex items-center justify-center gap-2"
              >
                {loading ? (
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                    className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full"
                  />
                ) : (
                  <>
                    {mode === 'signin' ? 'تسجيل الدخول' : 'إنشاء حساب'}
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
              className="text-center"
            >
              <button
                type="button"
                onClick={() => { setMode(mode === 'signin' ? 'signup' : 'signin'); setError(''); }}
                className="text-slate-400 hover:text-sky-400 text-sm transition-colors"
              >
                {mode === 'signin' ? (
                  <>ليس لديك حساب؟ <span className="text-sky-400 font-medium">أنشئ حساب مجاني</span></>
                ) : (
                  <>لديك حساب بالفعل؟ <span className="text-sky-400 font-medium">سجّل الدخول</span></>
                )}
              </button>
            </motion.div>
          </form>
        </div>

        <motion.div
          className="flex items-center justify-center gap-8 mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          {[
            { icon: Mail, label: 'مؤمن', color: 'text-sky-400' },
            { icon: Lock, label: 'آمن', color: 'text-emerald-400' },
            { icon: LayoutGrid, label: 'مجاني', color: 'text-amber-400' },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className="flex flex-col items-center gap-1.5">
                <div className="w-10 h-10 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                  <Icon className={`w-5 h-5 ${item.color}`} />
                </div>
                <span className="text-[10px] text-slate-500">{item.label}</span>
              </div>
            );
          })}
        </motion.div>
      </motion.div>
    </div>
  );
}
