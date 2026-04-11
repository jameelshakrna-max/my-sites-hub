import type { Variants } from 'framer-motion';
'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Globe,
  Plus,
  Search,
  Settings,
  Trash2,
  Edit,
  ExternalLink,
  LayoutGrid,
  Star,
  X,
  Save,
  Palette,
  Tag,
  Link as LinkIcon,
  Type,
  User,
  MessageSquare,
  Briefcase,
  Wrench,
  Gamepad2,
  GraduationCap,
  Heart,
  LogOut,
  Mail,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import AuthScreen from '@/components/AuthScreen';
import { useAuth } from '@/context/AuthContext';

// ─── Types ────────────────────────────────────────────────────────
interface Site {
  id: string;
  name: string;
  url: string;
  description: string | null;
  category: string;
  iconColor: string;
  order: number;
  createdAt: string;
  updatedAt: string;
}

interface DashboardSettings {
  dashboardName: string;
  greeting: string;
  userName: string;
}

interface SiteFormData {
  name: string;
  url: string;
  description: string;
  category: string;
  iconColor: string;
}

// ─── Constants ────────────────────────────────────────────────────
const CATEGORIES = [
  { name: 'شخصي', color: '#059669', icon: Heart, label: 'شخصي' },
  { name: 'عمل', color: '#2563eb', icon: Briefcase, label: 'عمل' },
  { name: 'أدوات', color: '#d97706', icon: Wrench, label: 'أدوات' },
  { name: 'ترفيه', color: '#7c3aed', icon: Gamepad2, label: 'ترفيه' },
  { name: 'تعليم', color: '#e11d48', icon: GraduationCap, label: 'تعليم' },
];

const ICON_COLORS = [
  '#059669', '#0891b2', '#2563eb', '#7c3aed',
  '#e11d48', '#d97706', '#ea580c', '#4f46e5',
  '#0d9488', '#84cc16', '#f43f5e', '#6366f1',
];

const DEFAULT_SETTINGS: DashboardSettings = {
  dashboardName: 'لوحة مواقعي',
  greeting: 'أهلاً وسهلاً',
  userName: '',
};

// ─── Animation Variants - start visible to prevent blank page if JS fails ──
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.06,
      delayChildren: 0.05,
    },
  },
};

const itemVariants: Variants = {
  hidden: { y: 8 },
  visible: {
    y: 0,
    opacity: 1,
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

const cardVariants: Variants = {
  hidden: { scale: 0.97 },
  visible: {
    scale: 1,
    opacity: 1,
    transition: { duration: 0.3, ease: 'easeOut' },
  },
};

// ─── Helper Functions ─────────────────────────────────────────────
function getArabicDate() {
  return new Date().toLocaleDateString('ar-SA', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function getGreetingTime() {
  const hour = new Date().getHours();
  if (hour < 12) return 'صباح الخير';
  if (hour < 17) return 'مساء النور';
  return 'مساء الخير';
}

function getCategoryInfo(categoryName: string) {
  return CATEGORIES.find((c) => c.name === categoryName) || CATEGORIES[0];
}

function getDomainFromUrl(url: string) {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}

function normalizeUrl(url: string): string {
  if (!url) return url;
  if (!/^https?:\/\//i.test(url)) {
    return 'https://' + url;
  }
  return url;
}

// ─── Dashboard Screen ─────────────────────────────────────────────
function DashboardScreen({ email, onLogout }: { email: string; onLogout: () => void }) {
  const { toast } = useToast();

  // State
  const [sites, setSites] = useState<Site[]>([]);
  const [settings, setSettings] = useState<DashboardSettings>(DEFAULT_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('الكل');
  const [searchQuery, setSearchQuery] = useState('');

  // Dialogs
  const [siteDialogOpen, setSiteDialogOpen] = useState(false);
  const [editingSite, setEditingSite] = useState<Site | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingSite, setDeletingSite] = useState<Site | null>(null);
  const [settingsDialogOpen, setSettingsDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);

  // Form
  const [formData, setFormData] = useState<SiteFormData>({
    name: '',
    url: '',
    description: '',
    category: 'شخصي',
    iconColor: '#059669',
  });

  // Settings form
  const [settingsForm, setSettingsForm] = useState<DashboardSettings>(DEFAULT_SETTINGS);

  // Time-based strings (client-only to avoid hydration mismatch)
  const [arabicDate, setArabicDate] = useState('');
  const [greetingTime, setGreetingTime] = useState('');
  useEffect(() => {
    setArabicDate(new Date().toLocaleDateString('ar-SA', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
    const hour = new Date().getHours();
    setGreetingTime(hour < 12 ? 'صباح الخير' : hour < 17 ? 'مساء النور' : 'مساء الخير');
  }, []);

  const emailParam = `?email=${encodeURIComponent(email)}`;

  // ─── Data Fetching ──────────────────────────────────────────────
  const fetchSites = useCallback(async () => {
    try {
      const res = await fetch(`/api/sites${emailParam}`);
      if (res.ok) {
        const data = await res.json();
        setSites(data);
      }
    } catch (error) {
      console.error('Error fetching sites:', error);
    }
  }, [emailParam]);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch(`/api/settings${emailParam}`);
      if (res.ok) {
        const data = await res.json();
        setSettings({
          dashboardName: data.dashboardName || DEFAULT_SETTINGS.dashboardName,
          greeting: data.greeting || DEFAULT_SETTINGS.greeting,
          userName: data.userName || DEFAULT_SETTINGS.userName,
        });
        setSettingsForm({
          dashboardName: data.dashboardName || DEFAULT_SETTINGS.dashboardName,
          greeting: data.greeting || DEFAULT_SETTINGS.greeting,
          userName: data.userName || DEFAULT_SETTINGS.userName,
        });
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
    }
  }, [emailParam]);

  const seedDatabase = useCallback(async () => {
    try {
      await fetch('/api/seed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      await fetchSites();
      await fetchSettings();
    } catch (error) {
      console.error('Error seeding database:', error);
    }
  }, [email, fetchSites, fetchSettings]);

  useEffect(() => {
    const init = async () => {
      await fetchSettings();
      await fetchSites();
      setLoading(false);
    };
    init();
  }, [fetchSites, fetchSettings, emailParam]);

  // ─── Filtered Sites ─────────────────────────────────────────────
  const filteredSites = useMemo(() => {
    let result = sites;
    if (activeCategory !== 'الكل') {
      result = result.filter((s) => s.category === activeCategory);
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.url.toLowerCase().includes(q)
      );
    }
    return result;
  }, [sites, activeCategory, searchQuery]);

  const allCategories = useMemo(() => {
    const cats = new Set(sites.map((s) => s.category));
    return CATEGORIES.filter((c) => cats.has(c.name));
  }, [sites]);

  const statsTotal = sites.length;
  const statsCategories = allCategories.length;

  // ─── Site CRUD ──────────────────────────────────────────────────
  const openAddDialog = () => {
    setEditingSite(null);
    setFormData({
      name: '',
      url: '',
      description: '',
      category: activeCategory !== 'الكل' ? activeCategory : 'شخصي',
      iconColor: '#059669',
    });
    setSiteDialogOpen(true);
  };

  const openEditDialog = (site: Site) => {
    setEditingSite(site);
    setFormData({
      name: site.name,
      url: site.url,
      description: site.description || '',
      category: site.category,
      iconColor: site.iconColor,
    });
    setSiteDialogOpen(true);
  };

  const handleSaveSite = async () => {
    if (!formData.name.trim() || !formData.url.trim()) {
      toast({ title: 'خطأ', description: 'يرجى إدخال اسم الموقع والرابط', variant: 'destructive' });
      return;
    }

    setSaving(true);
    try {
      const url = normalizeUrl(formData.url.trim());
      const body = {
        email,
        name: formData.name.trim(),
        url,
        description: formData.description.trim() || null,
        category: formData.category,
        iconColor: formData.iconColor,
      };

      let res: Response;
      if (editingSite) {
        res = await fetch(`/api/sites/${editingSite.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        res = await fetch('/api/sites', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }

      if (res.ok) {
        await fetchSites();
        setSiteDialogOpen(false);
        toast({
          title: editingSite ? 'تم التحديث' : 'تم الإضافة',
          description: editingSite ? 'تم تحديث الموقع بنجاح' : 'تم إضافة الموقع بنجاح',
        });
      } else {
        toast({ title: 'خطأ', description: 'حدث خطأ أثناء الحفظ', variant: 'destructive' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ في الاتصال', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const confirmDelete = (site: Site) => {
    setDeletingSite(site);
    setDeleteDialogOpen(true);
  };

  const handleDeleteSite = async () => {
    if (!deletingSite) return;
    setSaving(true);
    try {
      const res = await fetch(`/api/sites/${deletingSite.id}?email=${encodeURIComponent(email)}`, { method: 'DELETE' });
      if (res.ok) {
        await fetchSites();
        setDeleteDialogOpen(false);
        setDeletingSite(null);
        toast({ title: 'تم الحذف', description: 'تم حذف الموقع بنجاح' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء الحذف', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, settings: settingsForm }),
      });
      if (res.ok) {
        setSettings(settingsForm);
        setSettingsDialogOpen(false);
        toast({ title: 'تم الحفظ', description: 'تم حفظ الإعدادات بنجاح' });
      }
    } catch {
      toast({ title: 'خطأ', description: 'حدث خطأ أثناء الحفظ', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = () => {
    safeRemoveItem('hub-email');
    onLogout();
  };

  // ─── Loading ────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: 'linear' }}
          className="w-10 h-10 border-3 border-sky-500/30 border-t-sky-500 rounded-full"
        />
      </div>
    );
  }

  // ─── Render ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen relative overflow-hidden text-white">
      {/* Background Effects */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950" />
      <div className="fixed top-0 right-0 w-96 h-96 bg-sky-500/[0.03] rounded-full blur-3xl" />
      <div className="fixed bottom-0 left-0 w-[500px] h-[500px] bg-indigo-500/[0.03] rounded-full blur-3xl" />
      <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-slate-500/[0.02] rounded-full blur-3xl" />

      {/* Content */}
      <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pb-24">

        {/* ─── Header ─────────────────────────────────────────── */}
        <motion.header
          className="pt-6 pb-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
        >
          {/* Top bar */}
          <motion.div variants={itemVariants} className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 flex items-center justify-center shadow-lg shadow-sky-500/20">
                <LayoutGrid className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold bg-gradient-to-l from-white to-slate-300 bg-clip-text text-transparent">
                  {settings.dashboardName}
                </h1>
                <p className="text-[11px] text-slate-500 mt-0.5" dir="ltr">{email}</p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={openAddDialog}
                className="rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
              >
                <Plus className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setSettingsDialogOpen(true)}
                className="rounded-xl text-slate-400 hover:text-white hover:bg-white/5"
              >
                <Settings className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="rounded-xl text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                title="تسجيل الخروج"
              >
                <LogOut className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Greeting & Date */}
          <motion.div variants={itemVariants} className="mb-5">
            <h2 className="text-2xl sm:text-3xl font-bold text-white mb-1">
              {settings.greeting}
              {settings.userName ? (
                <span className="bg-gradient-to-l from-sky-400 to-blue-400 bg-clip-text text-transparent"> {settings.userName}</span>
              ) : null}
              <span className="text-lg sm:text-xl font-normal text-slate-400 mr-2">👋</span>
            </h2>
            <p className="text-slate-400 text-sm">{arabicDate} • {greetingTime}</p>
          </motion.div>

          {/* Search & Stats */}
          <motion.div variants={itemVariants} className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
              <Input
                placeholder="ابحث عن موقع..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-500 rounded-xl pr-10 pl-4 focus:border-sky-500/50 focus:ring-sky-500/20 backdrop-blur-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08]">
                <Globe className="w-4 h-4 text-sky-400" />
                <span className="text-sm text-slate-300">
                  {statsTotal} <span className="text-slate-500">موقع</span>
                </span>
              </div>
              <div className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/[0.05] backdrop-blur-sm border border-white/[0.08]">
                <Star className="w-4 h-4 text-amber-400" />
                <span className="text-sm text-slate-300">
                  {statsCategories} <span className="text-slate-500">فئة</span>
                </span>
              </div>
            </div>
          </motion.div>
        </motion.header>

        {/* ─── Category Tabs ───────────────────────────────────── */}
        <motion.div
          className="mb-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <ScrollArea className="w-full" dir="rtl">
            <div className="flex items-center gap-2 pb-1 min-w-max">
              <button
                onClick={() => setActiveCategory('الكل')}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                  activeCategory === 'الكل'
                    ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                    : 'bg-white/[0.03] text-slate-400 border border-white/[0.05] hover:bg-white/[0.06] hover:text-slate-300'
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
                الكل
              </button>
              {CATEGORIES.map((cat) => {
                const Icon = cat.icon;
                const isActive = activeCategory === cat.name;
                const hasSites = sites.some((s) => s.category === cat.name);
                return (
                  <button
                    key={cat.name}
                    onClick={() => setActiveCategory(cat.name)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-200 whitespace-nowrap ${
                      isActive
                        ? 'bg-white/[0.08] text-white border border-white/[0.15] shadow-sm'
                        : 'bg-white/[0.03] text-slate-400 border border-white/[0.05] hover:bg-white/[0.06] hover:text-slate-300'
                    }`}
                    style={isActive ? { boxShadow: `0 0 20px ${cat.color}15, inset 0 0 20px ${cat.color}10` } : {}}
                  >
                    <Icon className="w-4 h-4" style={isActive ? { color: cat.color } : {}} />
                    {cat.label}
                    {hasSites && (
                      <span className={`text-xs px-1.5 py-0.5 rounded-md ${isActive ? 'bg-white/10' : 'bg-white/5'}`}>
                        {sites.filter((s) => s.category === cat.name).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </ScrollArea>
        </motion.div>

        {/* ─── Sites Grid ──────────────────────────────────────── */}
        <motion.div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          initial="hidden"
          animate="visible"
          variants={containerVariants}
          key={`${activeCategory}-${searchQuery}`}
        >
          <AnimatePresence mode="popLayout">
            {filteredSites.map((site, index) => {
              const catInfo = getCategoryInfo(site.category);
              const firstLetter = site.name.charAt(0);
              return (
                <motion.div
                  key={site.id}
                  variants={cardVariants}
                  layout
                  initial="hidden"
                  animate="visible"
                  exit={{ opacity: 0, scale: 0.85, transition: { duration: 0.2 } }}
                  transition={{ duration: 0.3, delay: index * 0.04 }}
                >
                  <Card
                    className="group relative bg-white/[0.04] backdrop-blur-xl border-white/[0.08] overflow-hidden cursor-pointer hover:bg-white/[0.07] transition-all duration-300 hover:border-white/[0.15] hover:shadow-lg hover:shadow-black/20"
                    style={{ borderRightWidth: '3px', borderRightColor: site.iconColor }}
                  >
                    <CardContent className="p-4 sm:p-5">
                      <div className="flex items-start gap-3">
                        {/* Site Icon */}
                        <a
                          href={normalizeUrl(site.url)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <div
                            className="w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-lg shadow-lg transition-transform duration-300 group-hover:scale-110"
                            style={{
                              background: `linear-gradient(135deg, ${site.iconColor}, ${site.iconColor}cc)`,
                              boxShadow: `0 4px 15px ${site.iconColor}30`,
                            }}
                          >
                            {firstLetter}
                          </div>
                        </a>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <a
                              href={normalizeUrl(site.url)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex items-center gap-1.5 min-w-0 group/title"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <h3 className="font-bold text-white text-base truncate group-hover/title:text-sky-300 transition-colors">
                                {site.name}
                              </h3>
                              <ExternalLink className="w-3.5 h-3.5 text-slate-500 opacity-0 group-hover/title:opacity-100 transition-opacity flex-shrink-0" />
                            </a>

                            {/* Action buttons */}
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  openEditDialog(site);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  confirmDelete(site);
                                }}
                                className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>

                          {site.description && (
                            <p className="text-slate-400 text-xs sm:text-sm line-clamp-2 mb-2 leading-relaxed">
                              {site.description}
                            </p>
                          )}

                          <div className="flex items-center gap-2 mt-2">
                            <Badge
                              variant="outline"
                              className="text-[10px] px-2 py-0.5 rounded-md border-white/10 bg-white/[0.03] text-slate-400"
                            >
                              {site.category}
                            </Badge>
                            <span className="text-[10px] text-slate-600 truncate" dir="ltr">
                              {getDomainFromUrl(site.url)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </CardContent>

                    {/* Hover gradient overlay */}
                    <div
                      className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                      style={{
                        background: `radial-gradient(circle at 80% 20%, ${site.iconColor}08, transparent 60%)`,
                      }}
                    />
                  </Card>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </motion.div>

        {/* ─── Empty State ─────────────────────────────────────── */}
        {filteredSites.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.2 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto rounded-2xl bg-white/[0.03] border border-white/[0.08] flex items-center justify-center mb-5">
              <Globe className="w-10 h-10 text-slate-600" />
            </div>
            <h3 className="text-lg font-bold text-slate-400 mb-2">
              {searchQuery ? 'لا توجد نتائج' : 'لا توجد مواقع بعد'}
            </h3>
            <p className="text-sm text-slate-500 mb-6">
              {searchQuery
                ? 'جرب البحث بكلمات مختلفة'
                : 'أضف مواقعك المفضلة للبدء في تنظيمها'}
            </p>
            {!searchQuery && (
              <Button
                onClick={openAddDialog}
                className="bg-gradient-to-l from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl px-6 shadow-lg shadow-sky-500/20"
              >
                <Plus className="w-4 h-4 ml-2" />
                أضف موقع جديد
              </Button>
            )}
          </motion.div>
        )}

        {/* ─── Add Site Button (bottom) ───────────────────────── */}
        <motion.div
          className="hidden sm:block mt-6"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Button
            onClick={openAddDialog}
            variant="outline"
            className="w-full h-12 rounded-xl bg-white/[0.03] border-dashed border-white/[0.1] text-slate-400 hover:text-white hover:bg-white/[0.06] hover:border-white/[0.2] transition-all"
          >
            <Plus className="w-4 h-4 ml-2" />
            إضافة موقع جديد
          </Button>
        </motion.div>
      </div>

      {/* ─── Floating Action Button (Mobile) ───────────────────── */}
      <motion.div
        className="fixed bottom-6 left-6 sm:hidden z-50"
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: 'spring', stiffness: 260, damping: 20, delay: 0.6 }}
      >
        <Button
          onClick={openAddDialog}
          className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white shadow-xl shadow-sky-500/30"
          size="icon"
        >
          <Plus className="w-6 h-6" />
        </Button>
      </motion.div>

      {/* ─── Add/Edit Site Dialog ──────────────────────────────── */}
      <Dialog open={siteDialogOpen} onOpenChange={setSiteDialogOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/[0.1] text-white max-w-md mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">
              {editingSite ? 'تعديل الموقع' : 'إضافة موقع جديد'}
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              {editingSite ? 'قم بتعديل بيانات الموقع' : 'أدخل بيانات الموقع الجديد'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Name */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Type className="w-4 h-4 text-slate-500" />
                اسم الموقع <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="مثال: Google"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-600 rounded-xl focus:border-sky-500/50 focus:ring-sky-500/20"
              />
            </div>

            {/* URL */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-slate-500" />
                الرابط <span className="text-red-400">*</span>
              </Label>
              <Input
                placeholder="example.com"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                dir="ltr"
                className="h-11 bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-600 rounded-xl text-left focus:border-sky-500/50 focus:ring-sky-500/20"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                الوصف
              </Label>
              <Textarea
                placeholder="وصف مختصر للموقع (اختياري)"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-white/[0.05] border-white/[0.08] text-white placeholder:text-slate-600 rounded-xl resize-none focus:border-sky-500/50 focus:ring-sky-500/20"
                rows={2}
              />
            </div>

            {/* Category */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Tag className="w-4 h-4 text-slate-500" />
                الفئة
              </Label>
              <div className="flex flex-wrap gap-2">
                {CATEGORIES.map((cat) => {
                  const Icon = cat.icon;
                  const isSelected = formData.category === cat.name;
                  return (
                    <button
                      key={cat.name}
                      onClick={() => setFormData({ ...formData, category: cat.name })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                        isSelected
                          ? 'text-white border border-white/20'
                          : 'text-slate-400 bg-white/[0.03] border border-white/[0.05] hover:bg-white/[0.06]'
                      }`}
                      style={isSelected ? { backgroundColor: `${cat.color}30`, borderColor: `${cat.color}50` } : {}}
                    >
                      <Icon className="w-3.5 h-3.5" style={isSelected ? { color: cat.color } : {}} />
                      {cat.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Icon Color */}
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <Palette className="w-4 h-4 text-slate-500" />
                لون الأيقونة
              </Label>
              <div className="flex flex-wrap gap-2">
                {ICON_COLORS.map((color) => {
                  const isSelected = formData.iconColor === color;
                  return (
                    <button
                      key={color}
                      onClick={() => setFormData({ ...formData, iconColor: color })}
                      className={`w-8 h-8 rounded-lg transition-all duration-200 ${
                        isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-slate-900 scale-110' : 'hover:scale-110'
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  );
                })}
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setSiteDialogOpen(false)}
              className="text-slate-400 hover:text-white rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveSite}
              disabled={saving}
              className="bg-gradient-to-l from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl px-6 shadow-lg shadow-sky-500/20"
            >
              {saving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  {editingSite ? 'حفظ التعديلات' : 'إضافة'}
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Delete Confirmation Dialog ────────────────────────── */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/[0.1] text-white max-w-sm mx-4 rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg font-bold flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-red-500/10 flex items-center justify-center">
                <Trash2 className="w-4 h-4 text-red-400" />
              </div>
              حذف الموقع
            </AlertDialogTitle>
            <AlertDialogDescription className="text-slate-400 pt-2">
              هل أنت متأكد من حذف موقع{' '}
              <span className="text-white font-medium">{deletingSite?.name}</span>؟
              <br />
              لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0 mt-3">
            <AlertDialogCancel className="text-slate-400 hover:text-white rounded-xl border-white/[0.08] hover:bg-white/[0.05]">
              إلغاء
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSite}
              disabled={saving}
              className="bg-red-600 hover:bg-red-500 text-white rounded-xl border-0"
            >
              {saving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                'حذف'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ─── Settings Dialog ───────────────────────────────────── */}
      <Dialog open={settingsDialogOpen} onOpenChange={setSettingsDialogOpen}>
        <DialogContent className="bg-slate-900/95 backdrop-blur-xl border-white/[0.1] text-white max-w-md mx-4 rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-400" />
              إعدادات اللوحة
            </DialogTitle>
            <DialogDescription className="text-slate-400">
              تخصيص إعدادات لوحة مواقعك
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <LayoutGrid className="w-4 h-4 text-slate-500" />
                اسم اللوحة
              </Label>
              <Input
                value={settingsForm.dashboardName}
                onChange={(e) => setSettingsForm({ ...settingsForm, dashboardName: e.target.value })}
                className="h-11 bg-white/[0.05] border-white/[0.08] text-white rounded-xl focus:border-sky-500/50 focus:ring-sky-500/20"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-slate-500" />
                رسالة الترحيب
              </Label>
              <Input
                value={settingsForm.greeting}
                onChange={(e) => setSettingsForm({ ...settingsForm, greeting: e.target.value })}
                className="h-11 bg-white/[0.05] border-white/[0.08] text-white rounded-xl focus:border-sky-500/50 focus:ring-sky-500/20"
                placeholder="أهلاً وسهلاً"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-slate-300 flex items-center gap-2">
                <User className="w-4 h-4 text-slate-500" />
                اسم المستخدم
              </Label>
              <Input
                value={settingsForm.userName}
                onChange={(e) => setSettingsForm({ ...settingsForm, userName: e.target.value })}
                className="h-11 bg-white/[0.05] border-white/[0.08] text-white rounded-xl focus:border-sky-500/50 focus:ring-sky-500/20"
                placeholder="أدخل اسمك (اختياري)"
              />
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="ghost"
              onClick={() => setSettingsDialogOpen(false)}
              className="text-slate-400 hover:text-white rounded-xl"
            >
              إلغاء
            </Button>
            <Button
              onClick={handleSaveSettings}
              disabled={saving}
              className="bg-gradient-to-l from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white rounded-xl px-6 shadow-lg shadow-sky-500/20"
            >
              {saving ? (
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                  className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full"
                />
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Safe localStorage helper (works in private browsing) ────
let memoryStorage: Record<string, string> = {};

function safeGetItem(key: string): string | null {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem(key);
    }
  } catch {
    // localStorage not available (private browsing)
  }
  return memoryStorage[key] ?? null;
}

function safeSetItem(key: string, value: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.setItem(key, value);
    }
  } catch {
    // localStorage not available (private browsing)
  }
  memoryStorage[key] = value;
}

function safeRemoveItem(key: string): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem(key);
    }
  } catch {
    // localStorage not available (private browsing)
  }
  delete memoryStorage[key];
}

// ─── Main Page ────────────────────────────────────────────────────
// null = loading (SSR), '' = no email (show login), string = logged in (show dashboard)

export default function DashboardPage() {
  const { user, loading: authLoading, signOut } = useAuth();

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
          className="w-10 h-10 border-3 border-sky-500/30 border-t-sky-500 rounded-full"
        />
      </div>
    );
  }

  if (!user) {
    return <AuthScreen />;
  }

  return <DashboardScreen email={user.email!} onLogout={async () => { await signOut(); }} />;
}