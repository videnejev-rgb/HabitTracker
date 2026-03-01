'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  LayoutGrid, 
  CheckCircle2, 
  X,
  Calendar,
  ArrowLeft,
  Search
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Persistence, DBEntry } from '@/lib/persistence';
import { isConfigured } from '@/lib/supabase';

export default function TableView() {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [allHabitEntries, setAllHabitEntries] = useState<DBEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const fetchData = async () => {
      if (!isConfigured) return;
      setLoading(true);
      try {
        const allHabits = await Persistence.getAllHabitEntries();
        setAllHabitEntries(allHabits);
      } catch (err: any) {
        setDbError(err.message || "Failed to fetch table data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredEntries = allHabitEntries.filter(entry => 
    entry.task.toLowerCase().includes(searchTerm.toLowerCase()) ||
    entry.date.includes(searchTerm)
  );

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#F8FAFC]">
        <div className="max-w-md p-10 glass-card">
          <h2 className="mb-4 text-2xl font-black text-slate-900">Setup Required</h2>
          <p className="mb-8 text-slate-600 font-medium">Please configure your Supabase environment variables.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-indigo-200/20 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-200/20 blur-[120px] rounded-full" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-8 pt-8 md:pt-12">
        <header className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-12">
          <div className="flex items-center gap-4">
            <Link 
              href="/" 
              className="p-3 bg-white border border-slate-200 rounded-2xl hover:bg-slate-50 transition-all active:scale-95 shadow-sm"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight flex items-center gap-3">
                <LayoutGrid className="w-7 h-7 text-indigo-600" />
                History
              </h1>
              <p className="text-slate-500 font-bold text-xs uppercase tracking-widest mt-1">Your journey so far</p>
            </div>
          </div>

          <div className="relative w-full md:w-72">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search habits or dates..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-11 pr-4 py-3 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-medium text-sm transition-all"
            />
          </div>
        </header>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-card overflow-hidden"
        >
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-white/50 border-b border-slate-100">
                  <th className="text-left p-8 font-black text-slate-400 uppercase tracking-widest text-[10px]">Date</th>
                  <th className="text-left p-8 font-black text-slate-400 uppercase tracking-widest text-[10px]">Habit</th>
                  <th className="text-left p-8 font-black text-slate-400 uppercase tracking-widest text-[10px]">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {loading ? (
                  <tr>
                    <td colSpan={3} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-xs">Loading History...</p>
                      </div>
                    </td>
                  </tr>
                ) : filteredEntries.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="p-20 text-center">
                      <div className="flex flex-col items-center gap-4">
                        <div className="w-16 h-16 bg-slate-50 rounded-[2rem] flex items-center justify-center">
                          <Calendar className="w-8 h-8 text-slate-200" />
                        </div>
                        <p className="text-slate-400 font-bold">No entries found</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredEntries.map((entry, idx) => (
                    <motion.tr 
                      key={entry.id} 
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="hover:bg-indigo-50/30 transition-colors group"
                    >
                      <td className="p-8">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center group-hover:bg-white transition-colors">
                            <Calendar className="w-4 h-4 text-slate-400" />
                          </div>
                          <span className="text-slate-600 font-black font-mono text-sm">{entry.date}</span>
                        </div>
                      </td>
                      <td className="p-8">
                        <span className="text-slate-900 font-black text-lg tracking-tight">{entry.task}</span>
                      </td>
                      <td className="p-8">
                        <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.15em] shadow-sm ${
                          entry.done 
                            ? 'bg-emerald-500 text-white shadow-emerald-100' 
                            : 'bg-red-500 text-white shadow-red-100'
                        }`}>
                          {entry.done ? (
                            <><CheckCircle2 className="w-3 h-3" /> Done</>
                          ) : (
                            <><X className="w-3 h-3" /> Missed</>
                          )}
                        </span>
                      </td>
                    </motion.tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </motion.div>
      </div>

      <AnimatePresence>
        {dbError && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 px-8 py-4 bg-red-600 text-white rounded-[2rem] shadow-2xl flex items-center gap-4 z-[100]"
          >
            <X className="w-5 h-5" />
            <span className="font-bold">{dbError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
