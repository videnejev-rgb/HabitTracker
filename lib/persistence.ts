import { supabase } from './supabase';

export type DBEntry = {
  id: string;
  task: string;
  done: boolean;
  type: 'Habit' | 'TODO';
  date: string; // YYYY-MM-DD
};

const TABLE_ENTRIES = 'entries';
const TABLE_SETTINGS = 'settings';
const SETTING_ID_DEFINITIONS = 'habit_definitions';
const DEFAULT_HABITS = [
  'Yoga',
  'Wasser trinken',
  'Zielerreichung prüfen',
  'Top 3 Aktivitäten eintragen',
];

export const Persistence = {
  // Fetch the list of configured habits from Supabase
  getDefinitions: async (): Promise<string[]> => {
    if (!supabase) return DEFAULT_HABITS;
    try {
      const { data, error } = await supabase
        .from(TABLE_SETTINGS)
        .select('list')
        .eq('id', SETTING_ID_DEFINITIONS)
        .single();

      if (error) {
        if (error.code === 'PGRST116') { // Not found
          await supabase.from(TABLE_SETTINGS).insert({ id: SETTING_ID_DEFINITIONS, list: DEFAULT_HABITS });
          return DEFAULT_HABITS;
        }
        throw error;
      }
      return data.list || [];
    } catch (error) {
      console.error("Error fetching definitions:", error);
      return DEFAULT_HABITS;
    }
  },

  // Save the list of configured habits
  saveDefinitions: async (defs: string[]) => {
    if (!supabase) return;
    try {
      await supabase
        .from(TABLE_SETTINGS)
        .upsert({ id: SETTING_ID_DEFINITIONS, list: defs });
    } catch (error) {
      console.error("Error saving definitions:", error);
    }
  },

  // Get all TODOs and Habits for a specific date
  getEntriesForDate: async (dateStr: string): Promise<DBEntry[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from(TABLE_ENTRIES)
      .select('*')
      .eq('date', dateStr);
    
    if (error) {
      console.error("Error fetching entries:", error);
      return [];
    }
    return data as DBEntry[];
  },

  // Update or Create a single entry
  saveEntry: async (entry: DBEntry) => {
    if (!supabase) return;
    const { error } = await supabase
      .from(TABLE_ENTRIES)
      .upsert(entry);
    if (error) console.error("Error saving entry:", error);
  },

  // Delete a single entry
  deleteEntry: async (id: string) => {
    if (!supabase) return;
    const { error } = await supabase
      .from(TABLE_ENTRIES)
      .delete()
      .eq('id', id);
    if (error) console.error("Error deleting entry:", error);
  },

  // Ensure database has entries for habits on the specific date
  syncDailyHabits: async (definitions: string[], dateStr: string) => {
    if (!supabase) return;
    const { data: existing, error } = await supabase
      .from(TABLE_ENTRIES)
      .select('task')
      .eq('date', dateStr)
      .eq('type', 'Habit');
    
    if (error) {
      console.error("Error syncing habits (fetch):", error);
      return;
    }

    const existingTasks = (existing || []).map(d => d.task);

    const newEntries = definitions
      .filter(habitName => !existingTasks.includes(habitName))
      .map(habitName => ({
        id: crypto.randomUUID(),
        task: habitName,
        done: false,
        type: 'Habit',
        date: dateStr,
      }));
    
    if (newEntries.length > 0) {
      const { error: insertError } = await supabase
        .from(TABLE_ENTRIES)
        .insert(newEntries);
      if (insertError) {
        console.error("Error inserting new habits:", insertError);
      }
    }
  },

  // Get all habit entries for the table view
  getAllHabitEntries: async (): Promise<DBEntry[]> => {
    if (!supabase) return [];
    const { data, error } = await supabase
      .from(TABLE_ENTRIES)
      .select('*')
      .eq('type', 'Habit')
      .order('date', { ascending: false });
    
    if (error) {
      console.error("Error fetching all habits:", error);
      return [];
    }
    return data as DBEntry[];
  }
};
