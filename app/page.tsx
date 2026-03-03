'use client';

import React, { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  ChevronRight, 
  Plus, 
  Trash2, 
  LayoutGrid, 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle,
  Settings,
  X,
  Target,
  ListTodo,
  Sparkles,
  ArrowRight,
  Zap,
  Trophy,
  Flame,
  CalendarDays
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Persistence, DBEntry } from '@/lib/persistence';
import { isConfigured } from '@/lib/supabase';

const getTodayString = () => new Date().toISOString().split('T')[0];

export default function DailyView() {
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(getTodayString());
  const [definitions, setDefinitions] = useState<string[]>([]);
  const [entries, setEntries] = useState<DBEntry[]>([]);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [newHabitName, setNewHabitName] = useState('');
  const [activeTab, setActiveTab] = useState<'habits' | 'tasks'>('habits');
  const [isProgressEnlarged, setIsProgressEnlarged] = useState(false);

  useEffect(() => {
    const initData = async () => {
      if (!isConfigured) return;
      setLoading(true);
      setDbError(null);
      try {
        const defs = await Persistence.getDefinitions();
        setDefinitions(defs);
        await Persistence.syncDailyHabits(defs, selectedDate);
        const dateEntries = await Persistence.getEntriesForDate(selectedDate);
        setEntries(dateEntries);
      } catch (err: any) {
        setDbError(err.message || "Failed to connect to database");
      } finally {
        setLoading(false);
      }
    };
    initData();
  }, [selectedDate]);

  const dailyHabits = useMemo(() => entries.filter(e => e.type === 'Habit' && e.date === selectedDate), [entries, selectedDate]);
  const dailyTodos = useMemo(() => entries.filter(e => e.type === 'TODO' && e.date === selectedDate), [entries, selectedDate]);

  const progress = useMemo(() => {
    if (dailyHabits.length === 0) return 0;
    return Math.round((dailyHabits.filter(h => h.done).length / dailyHabits.length) * 100);
  }, [dailyHabits]);

  const handleDateOffset = (offset: number) => {
    const date = new Date(selectedDate);
    date.setDate(date.getDate() + offset);
    setSelectedDate(date.toISOString().split('T')[0]);
  };

  const handleToggleDone = async (entry: DBEntry) => {
    const updatedEntry = { ...entry, done: !entry.done };
    setEntries(prev => prev.map(e => e.id === entry.id ? updatedEntry : e));
    await Persistence.saveEntry(updatedEntry);
  };

  const handleUpdateTask = async (entry: DBEntry, newTask: string) => {
    const updatedEntry = { ...entry, task: newTask };
    setEntries(prev => prev.map(e => e.id === entry.id ? updatedEntry : e));
    await Persistence.saveEntry(updatedEntry);
  };

  const handleDeleteEntry = async (entry: DBEntry) => {
    setEntries(prev => prev.filter(e => e.id !== entry.id));
    await Persistence.deleteEntry(entry.id);
  };

  const handleAddHabit = async () => {
    if (!newHabitName.trim()) return;
    const name = newHabitName.trim();
    if (definitions.includes(name)) return;
    const newDefs = [...definitions, name];
    setDefinitions(newDefs);
    setNewHabitName('');
    setIsDropdownOpen(false);
    await Persistence.saveDefinitions(newDefs);
    await Persistence.syncDailyHabits(newDefs, selectedDate);
    const freshEntries = await Persistence.getEntriesForDate(selectedDate);
    setEntries(freshEntries);
  };

  const handleDeleteHabitDef = async (e: React.MouseEvent, habitName: string) => {
    e.stopPropagation();
    const newDefs = definitions.filter(d => d !== habitName);
    setDefinitions(newDefs);
    await Persistence.saveDefinitions(newDefs);
  };

  const handleAddTodo = async () => {
    const newTodo: DBEntry = {
      id: crypto.randomUUID(),
      task: '',
      done: false,
      type: 'TODO',
      date: selectedDate,
    };
    setEntries(prev => [...prev, newTodo]);
    await Persistence.saveEntry(newTodo);
  };

  if (!isConfigured) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center bg-[#F8FAFC]">
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="max-w-md p-10 glass-card"
        >
          <div className="w-20 h-20 mx-auto mb-8 bg-indigo-100 rounded-3xl flex items-center justify-center">
            <Settings className="w-10 h-10 text-indigo-600" />
          </div>
          <h2 className="mb-4 text-3xl font-bold text-slate-900">Setup Required</h2>
          <p className="mb-8 text-slate-600 leading-relaxed">
            To start tracking your habits, please configure your Supabase credentials in the environment variables.
          </p>
          <div className="p-6 text-sm text-left text-indigo-900 bg-indigo-50/50 rounded-2xl border border-indigo-100/50">
            <p className="font-semibold mb-2 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Quick Tip
            </p>
            Check your <code>.env.local</code> file for <code>NEXT_PUBLIC_SUPABASE_URL</code> and <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>.
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20 bg-[#F8FAFC]">
      {/* Dynamic Background Elements */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-200/30 blur-[120px] rounded-full" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-emerald-200/30 blur-[120px] rounded-full" />
        <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-purple-200/20 blur-[100px] rounded-full" />
      </div>

      <div className="max-w-7xl mx-auto px-4 md:px-8 pt-6 md:pt-12">
        {/* Header Section */}
        <header className="flex items-center justify-between gap-4 mb-8 md:mb-10">
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="flex items-center gap-3 md:gap-4 shrink-0"
          >
            <div className="p-2 md:p-3 bg-indigo-600 rounded-[1.1rem] md:rounded-[1.4rem] shadow-lg shadow-indigo-100">
              <Target className="w-5 h-5 md:w-6 md:h-6 text-white" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-xl md:text-2xl font-black tracking-tight text-slate-900 leading-none">Flow</h1>
              <p className="text-slate-500 font-bold text-[9px] md:text-[10px] uppercase tracking-widest mt-0.5">Habit Tracker</p>
            </div>
          </motion.div>

          <div className="flex items-center gap-2 md:gap-4">
            {/* Date Controls */}
            <div className="flex items-center gap-1 md:gap-2 p-1 md:p-1.5 glass-panel">
              <button 
                onClick={() => handleDateOffset(-1)} 
                className="p-1.5 md:p-2 hover:bg-white rounded-lg md:rounded-xl transition-all active:scale-90"
              >
                <ChevronLeft className="w-4 h-4 text-slate-600" />
              </button>
              <div className="flex items-center gap-2 px-2 md:px-3 py-1.5 bg-white rounded-lg md:rounded-xl shadow-sm border border-slate-100">
                <CalendarIcon className="w-3.5 h-3.5 text-indigo-500 hidden xs:block" />
                <input 
                  type="date" 
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent font-black text-slate-800 outline-none cursor-pointer text-[10px] md:text-xs w-24 md:w-28"
                />
              </div>
              <button 
                onClick={() => handleDateOffset(1)} 
                className="p-1.5 md:p-2 hover:bg-white rounded-lg md:rounded-xl transition-all active:scale-90"
              >
                <ChevronRight className="w-4 h-4 text-slate-600" />
              </button>
            </div>

            {/* Config & Analytics Buttons */}
            <div className="flex items-center gap-2">
              <div className="relative">
                <button 
                  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                  className="p-2.5 md:p-3 bg-white border border-slate-200 rounded-xl md:rounded-2xl hover:border-indigo-300 hover:shadow-md transition-all text-slate-600 active:scale-95"
                  title="Config"
                >
                  <Settings className="w-4 h-4 md:w-5 md:h-5" />
                </button>
                <AnimatePresence>
                  {isDropdownOpen && (
                    <motion.div 
                      initial={{ opacity: 0, y: 10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: 10, scale: 0.95 }}
                      className="absolute top-full right-0 mt-4 w-72 sm:w-80 glass-card z-50 overflow-hidden shadow-2xl"
                    >
                      <div className="p-5 border-b border-slate-100 bg-slate-50/50">
                        <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3">Add New Habit</h4>
                        <div className="flex gap-2">
                          <input 
                            type="text" 
                            placeholder="Morning Run..." 
                            value={newHabitName}
                            onChange={(e) => setNewHabitName(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleAddHabit()}
                            className="w-full px-4 py-2 text-xs bg-white border border-slate-200 rounded-xl outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500"
                          />
                          <button onClick={handleAddHabit} className="p-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-all active:scale-90">
                            <Plus className="w-5 h-5" />
                          </button>
                        </div>
                      </div>
                      <div className="max-h-[280px] overflow-y-auto p-2 space-y-1">
                        {definitions.length === 0 ? (
                          <div className="p-8 text-center text-slate-400 text-sm italic">No habits defined yet</div>
                        ) : (
                          definitions.map(habit => (
                            <div key={habit} className="flex items-center justify-between px-4 py-2.5 hover:bg-slate-50 rounded-xl transition-colors group">
                              <span className="text-xs font-bold text-slate-700">{habit}</span>
                              <button 
                                onClick={(e) => handleDeleteHabitDef(e, habit)}
                                className="p-1.5 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              <Link 
                href="/table" 
                className="p-2.5 md:p-3 bg-indigo-600 text-white rounded-xl md:rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
                title="Analytics"
              >
                <LayoutGrid className="w-4 h-4 md:w-5 md:h-5" />
              </Link>
            </div>

            {/* Progress Indicator (Clickable) */}
            <button 
              onClick={() => setIsProgressEnlarged(true)}
              className="flex items-center gap-3 px-3 py-1.5 glass-panel hover:shadow-md transition-all active:scale-95 group"
            >
              <div className="relative w-8 h-8 md:w-10 md:h-10">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" className="stroke-slate-100 fill-none" strokeWidth="12" />
                  <motion.circle 
                    cx="50" cy="50" r="42" 
                    className="stroke-indigo-600 fill-none" 
                    strokeWidth="12" 
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 264" }}
                    animate={{ strokeDasharray: `${(progress / 100) * 264} 264` }}
                  />
                </svg>
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-[9px] md:text-[10px] font-black text-slate-900">{progress}%</span>
                </div>
              </div>
            </button>
          </div>
        </header>

        {/* Mobile Tab Switcher */}
        <div className="lg:hidden mb-6 p-1.5 glass-panel flex gap-1">
          <button 
            onClick={() => setActiveTab('habits')}
            className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'habits' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            Habits
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex-1 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all ${activeTab === 'tasks' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-400'}`}
          >
            Tasks
          </button>
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 items-start">
          {/* Habits Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className={`glass-card overflow-hidden min-h-[300px] md:min-h-[400px] ${activeTab !== 'habits' ? 'hidden lg:block' : 'block'}`}
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white/30">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-emerald-100 rounded-xl flex items-center justify-center shadow-inner">
                  <Flame className="w-5 h-5 md:w-6 md:h-6 text-emerald-600" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Daily Habits</h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest">Consistency is power</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-8">
              {loading ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 space-y-4">
                  <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin" />
                  <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">Syncing Flow...</p>
                </div>
              ) : dailyHabits.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Sparkles className="w-8 h-8 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-900 font-black text-lg">No habits defined</p>
                    <p className="text-slate-400 font-medium max-w-xs mx-auto text-xs">Click the config button to add habits you want to track daily.</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-3">
                  {dailyHabits.map((entry, idx) => (
                    <motion.div 
                      key={entry.id} 
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`group flex items-center gap-3 md:gap-4 p-4 rounded-2xl border transition-all cursor-pointer ${
                        entry.done 
                          ? 'bg-emerald-50/40 border-emerald-100/50 shadow-inner' 
                          : 'bg-white border-slate-100 hover:border-indigo-300 hover:shadow-md'
                      }`}
                      onClick={() => handleToggleDone(entry)}
                    >
                      <div className="relative shrink-0">
                        {entry.done ? (
                          <div className="w-8 h-8 md:w-9 md:h-9 bg-emerald-500 rounded-xl flex items-center justify-center shadow-lg shadow-emerald-200">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 md:w-9 md:h-9 border-2 border-slate-200 rounded-xl group-hover:border-indigo-400 transition-colors flex items-center justify-center">
                            <Circle className="w-3 h-3 text-slate-100 group-hover:text-indigo-100" />
                          </div>
                        )}
                      </div>
                      <span className={`flex-1 text-base md:text-lg transition-all ${entry.done ? 'text-slate-400 line-through font-bold' : 'text-slate-800 font-black'}`}>
                        {entry.task}
                      </span>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>

          {/* Tasks Section */}
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className={`glass-card overflow-hidden min-h-[300px] md:min-h-[400px] ${activeTab !== 'tasks' ? 'hidden lg:block' : 'block'}`}
          >
            <div className="p-6 md:p-8 border-b border-slate-100 flex items-center justify-between bg-white/30">
              <div className="flex items-center gap-3 md:gap-4">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-indigo-100 rounded-xl flex items-center justify-center shadow-inner">
                  <ListTodo className="w-5 h-5 md:w-6 md:h-6 text-indigo-600" />
                </div>
                <div>
                  <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">Tasks</h2>
                  <p className="text-[10px] md:text-xs text-slate-500 font-bold uppercase tracking-widest">Focus on what matters</p>
                </div>
              </div>
              <button 
                onClick={handleAddTodo}
                className="flex items-center gap-2 px-4 py-2.5 bg-indigo-600 text-white text-xs font-black rounded-xl hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" /> <span>Add Task</span>
              </button>
            </div>

            <div className="p-6 md:p-8 space-y-4">
              {dailyTodos.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 md:py-20 text-center space-y-4">
                  <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center border border-slate-100">
                    <Zap className="w-8 h-8 text-slate-200" />
                  </div>
                  <div className="space-y-1">
                    <p className="text-slate-900 font-black text-lg">All clear</p>
                    <p className="text-slate-400 font-medium text-xs">No tasks for today. Enjoy your free time!</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-3">
                  {dailyTodos.map((entry, idx) => (
                    <motion.div 
                      key={entry.id} 
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.05 }}
                      className={`group flex items-center gap-3 md:gap-4 p-4 rounded-2xl border transition-all ${
                        entry.done 
                          ? 'bg-slate-50/50 border-slate-100' 
                          : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-md'
                      }`}
                    >
                      <button 
                        onClick={() => handleToggleDone(entry)} 
                        className="transition-transform active:scale-90 shrink-0"
                      >
                        {entry.done ? (
                          <div className="w-8 h-8 md:w-9 md:h-9 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                            <CheckCircle2 className="w-5 h-5 text-white" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 md:w-9 md:h-9 border-2 border-slate-200 rounded-xl hover:border-indigo-400 transition-colors" />
                        )}
                      </button>
                      <input
                        type="text"
                        value={entry.task}
                        placeholder="What's on your mind?"
                        onChange={(e) => handleUpdateTask(entry, e.target.value)}
                        className={`flex-1 bg-transparent text-base md:text-lg outline-none transition-all ${entry.done ? 'text-slate-400 line-through font-bold' : 'text-slate-800 font-black'}`}
                      />
                      <button 
                        onClick={() => handleDeleteEntry(entry)}
                        className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                      >
                        <Trash2 className="w-4 h-4 md:w-5 md:h-5" />
                      </button>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </motion.section>
        </div>

        {/* Bottom Stats Row (Desktop Only) */}
        <div className="hidden lg:grid grid-cols-2 gap-8 mt-8">
          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="glass-panel p-6 flex items-center gap-6"
          >
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center shrink-0">
              <Trophy className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Milestones</h3>
              <p className="text-slate-500 text-xs font-medium">12 days streak. Keep it up!</p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-indigo-600 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:translate-x-1 transition-transform">
              Achievements <ArrowRight className="w-3 h-3" />
            </div>
          </motion.section>

          <motion.section 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="glass-panel p-6 flex items-center gap-6"
          >
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center shrink-0">
              <CalendarDays className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900 tracking-tight">Today</h3>
              <p className="text-slate-500 text-xs font-medium">
                {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </p>
            </div>
            <div className="ml-auto flex items-center gap-2 text-purple-600 font-black text-[10px] uppercase tracking-widest cursor-pointer hover:translate-x-1 transition-transform">
              Calendar <ArrowRight className="w-3 h-3" />
            </div>
          </motion.section>
        </div>
      </div>

      {/* Enlarged Progress Modal */}
      <AnimatePresence>
        {isProgressEnlarged && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-slate-900/40 backdrop-blur-md"
            onClick={() => setIsProgressEnlarged(false)}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="glass-card p-10 md:p-16 max-w-lg w-full text-center relative"
              onClick={(e) => e.stopPropagation()}
            >
              <button 
                onClick={() => setIsProgressEnlarged(false)}
                className="absolute top-6 right-6 p-2 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X className="w-6 h-6 text-slate-400" />
              </button>
              
              <h3 className="text-slate-400 font-black uppercase tracking-[0.2em] text-[10px] md:text-xs mb-10">Daily Completion</h3>
              
              <div className="relative w-48 h-48 md:w-64 md:h-64 mx-auto mb-10">
                <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" className="stroke-slate-100 fill-none" strokeWidth="10" />
                  <motion.circle 
                    cx="50" cy="50" r="42" 
                    className="stroke-indigo-600 fill-none" 
                    strokeWidth="10" 
                    strokeLinecap="round"
                    initial={{ strokeDasharray: "0 264" }}
                    animate={{ strokeDasharray: `${(progress / 100) * 264} 264` }}
                    transition={{ duration: 1.5, ease: "circOut" }}
                  />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter">{progress}%</span>
                  <span className="text-[10px] md:text-xs font-black text-slate-400 uppercase tracking-widest mt-2">Done</span>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-slate-900 font-black text-xl md:text-2xl leading-tight">
                  {progress === 100 ? "Legendary!" : progress > 75 ? "Almost there!" : progress > 50 ? "Great work!" : progress > 0 ? "Keep going!" : "Let's start!"}
                </p>
                <p className="text-slate-500 text-sm md:text-base font-medium">
                  {progress === 100 
                    ? "You've completed everything! 🏆" 
                    : `${dailyHabits.filter(h => h.done).length} of ${dailyHabits.length} habits finished.`}
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Error Toast */}
      <AnimatePresence>
        {dbError && (
          <motion.div 
            initial={{ opacity: 0, y: 50, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 50, x: '-50%' }}
            className="fixed bottom-10 left-1/2 px-6 md:px-8 py-3 md:py-4 bg-red-600 text-white rounded-2xl md:rounded-[2rem] shadow-2xl flex items-center gap-3 md:gap-4 z-[100] w-[90%] sm:w-auto"
          >
            <div className="w-6 h-6 md:w-8 md:h-8 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <X className="w-4 h-4 md:w-5 md:h-5" />
            </div>
            <span className="font-bold text-xs md:text-base">{dbError}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
