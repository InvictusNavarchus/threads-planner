import React, { useState, useEffect } from 'react';
import { 
  format, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameMonth, 
  isSameDay, 
  addMonths, 
  subMonths, 
  startOfWeek, 
  endOfWeek,
  getWeek,
  isToday
} from 'date-fns';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  Plus, 
  MoreHorizontal,
  Lightbulb,
  FileText,
  Layers,
  Sparkles
} from 'lucide-react';
import { AppState, DayPlan, ThreadPost, MonthPlan } from './types';
import { ThreadEditor } from './components/ThreadEditor';
import { generateThreadIdeas } from './services/geminiService';

// --- Helper Functions ---
const getStorageKey = () => 'threads-planner-v1';

const loadState = (): AppState => {
  try {
    const saved = localStorage.getItem(getStorageKey());
    if (saved) return JSON.parse(saved);
  } catch (e) {
    console.error("Failed to load state", e);
  }
  return { plans: {}, monthPlans: {} };
};

const saveState = (state: AppState) => {
  localStorage.setItem(getStorageKey(), JSON.stringify(state));
};

export default function App() {
  // State
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [appState, setAppState] = useState<AppState>(loadState());
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [showIdeas, setShowIdeas] = useState(false);
  const [ideaTopic, setIdeaTopic] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState<string[]>([]);
  const [loadingIdeas, setLoadingIdeas] = useState(false);

  // Persist state changes
  useEffect(() => {
    saveState(appState);
  }, [appState]);

  // Calendar Logic
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  
  const calendarDays = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const currentMonthKey = format(currentDate, 'yyyy-MM');

  // --- Data Accessors ---
  
  const getDayPlan = (date: Date): DayPlan => {
    const key = format(date, 'yyyy-MM-dd');
    return appState.plans[key] || { date: key, dailyTheme: '', posts: [] };
  };

  const getMonthPlan = (date: Date): MonthPlan => {
    const key = format(date, 'yyyy-MM');
    return appState.monthPlans[key] || { monthKey: key, monthlyTheme: '', weeklyThemes: {} };
  };

  // --- Handlers ---

  const handleDayClick = (date: Date) => {
    setSelectedDate(date);
    setEditingPostId(null);
    setShowIdeas(false);
  };

  const updateMonthTheme = (theme: string) => {
    setAppState(prev => ({
      ...prev,
      monthPlans: {
        ...prev.monthPlans,
        [currentMonthKey]: { ...getMonthPlan(currentDate), monthlyTheme: theme }
      }
    }));
  };

  const updateWeeklyTheme = (date: Date, theme: string) => {
    const weekNum = getWeek(date);
    const mPlan = getMonthPlan(date);
    setAppState(prev => ({
      ...prev,
      monthPlans: {
        ...prev.monthPlans,
        [mPlan.monthKey]: {
          ...mPlan,
          weeklyThemes: { ...mPlan.weeklyThemes, [weekNum]: theme }
        }
      }
    }));
  };

  const updateDailyTheme = (date: Date, theme: string) => {
    const key = format(date, 'yyyy-MM-dd');
    const existing = getDayPlan(date);
    setAppState(prev => ({
      ...prev,
      plans: {
        ...prev.plans,
        [key]: { ...existing, dailyTheme: theme }
      }
    }));
  };

  const createNewPost = () => {
    if (!selectedDate) return;
    const newPost: ThreadPost = {
      id: crypto.randomUUID(),
      title: '',
      status: 'draft',
      time: '09:00',
      segments: [{ id: crypto.randomUUID(), content: '' }]
    };
    
    const key = format(selectedDate, 'yyyy-MM-dd');
    const dayPlan = getDayPlan(selectedDate);
    
    setAppState(prev => ({
      ...prev,
      plans: {
        ...prev.plans,
        [key]: { ...dayPlan, posts: [...dayPlan.posts, newPost] }
      }
    }));
    setEditingPostId(newPost.id);
  };

  const savePost = (updatedPost: ThreadPost) => {
    if (!selectedDate) return;
    const key = format(selectedDate, 'yyyy-MM-dd');
    const dayPlan = getDayPlan(selectedDate);
    
    setAppState(prev => ({
      ...prev,
      plans: {
        ...prev.plans,
        [key]: {
          ...dayPlan,
          posts: dayPlan.posts.map(p => p.id === updatedPost.id ? updatedPost : p)
        }
      }
    }));
    setEditingPostId(null);
  };

  const deletePost = (postId: string) => {
      if (!selectedDate) return;
      const key = format(selectedDate, 'yyyy-MM-dd');
      const dayPlan = getDayPlan(selectedDate);
      
      setAppState(prev => ({
        ...prev,
        plans: {
          ...prev.plans,
          [key]: {
            ...dayPlan,
            posts: dayPlan.posts.filter(p => p.id !== postId)
          }
        }
      }));
      setEditingPostId(null);
  };

  const handleGenerateIdeas = async () => {
    if (!ideaTopic) return;
    setLoadingIdeas(true);
    const dayTheme = selectedDate ? getDayPlan(selectedDate).dailyTheme : '';
    const monthTheme = getMonthPlan(currentDate).monthlyTheme;
    const context = `Themes - Month: ${monthTheme || 'None'}, Day: ${dayTheme || 'None'}`;
    
    const ideas = await generateThreadIdeas(ideaTopic, context);
    setGeneratedIdeas(ideas);
    setLoadingIdeas(false);
  };

  const useIdea = (ideaText: string) => {
      if (!selectedDate) return;
      const newPost: ThreadPost = {
        id: crypto.randomUUID(),
        title: ideaText.slice(0, 30) + "...",
        status: 'draft',
        time: '12:00',
        segments: [{ id: crypto.randomUUID(), content: ideaText }]
      };
      
      const key = format(selectedDate, 'yyyy-MM-dd');
      const dayPlan = getDayPlan(selectedDate);
      
      setAppState(prev => ({
        ...prev,
        plans: {
          ...prev.plans,
          [key]: { ...dayPlan, posts: [...dayPlan.posts, newPost] }
        }
      }));
      
      setEditingPostId(newPost.id);
      setShowIdeas(false);
  };

  // --- Render Helpers ---

  const renderMonthStats = () => {
    // Calculate simple stats
    let totalPosts = 0;
    let drafts = 0;
    let scheduled = 0;
    
    // Iterate over days in this month
    const daysInMonth = eachDayOfInterval({start: monthStart, end: monthEnd});
    daysInMonth.forEach(d => {
        const p = getDayPlan(d);
        p.posts.forEach(post => {
            totalPosts++;
            if(post.status === 'draft') drafts++;
            if(post.status === 'scheduled') scheduled++;
        });
    });

    return (
        <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">Total Posts</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{totalPosts}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">Drafts</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{drafts}</div>
            </div>
            <div className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm">
                <div className="text-gray-500 text-xs font-medium uppercase tracking-wider">Scheduled</div>
                <div className="text-2xl font-bold text-gray-900 mt-1">{scheduled}</div>
            </div>
        </div>
    );
  };

  // Derived state for editor
  const currentPostToEdit = selectedDate && editingPostId 
    ? getDayPlan(selectedDate).posts.find(p => p.id === editingPostId)
    : null;

  return (
    <div className="min-h-screen flex bg-[#f8fafc]">
      
      {/* --- Main Content Area --- */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        
        {/* Header */}
        <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 z-10">
          <div className="flex items-center gap-4">
            <div className="bg-black text-white p-1.5 rounded-lg">
                <CalendarIcon size={20} />
            </div>
            <h1 className="text-xl font-bold tracking-tight text-gray-900">Threads Planner</h1>
          </div>
          
          <div className="flex items-center gap-6">
             <div className="flex items-center bg-gray-100 rounded-lg p-1">
                <button onClick={() => setCurrentDate(subMonths(currentDate, 1))} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all">
                    <ChevronLeft size={18} className="text-gray-600" />
                </button>
                <span className="px-4 text-sm font-medium text-gray-900 min-w-[140px] text-center">
                    {format(currentDate, 'MMMM yyyy')}
                </span>
                <button onClick={() => setCurrentDate(addMonths(currentDate, 1))} className="p-1 hover:bg-white hover:shadow-sm rounded-md transition-all">
                    <ChevronRight size={18} className="text-gray-600" />
                </button>
             </div>
          </div>
        </header>

        <div className="flex-1 overflow-auto p-8">
            <div className="max-w-7xl mx-auto">
                {/* Stats & Monthly Theme */}
                <div className="flex gap-6 mb-8 items-start">
                    <div className="flex-1">
                        {renderMonthStats()}
                    </div>
                    <div className="w-1/3 bg-gradient-to-br from-gray-900 to-gray-800 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-2 mb-3 opacity-80">
                            <Lightbulb size={16} />
                            <span className="text-xs font-medium uppercase tracking-wider">Monthly Focus</span>
                        </div>
                        <textarea
                            className="w-full bg-transparent border-none text-xl font-medium placeholder-gray-400 focus:ring-0 resize-none"
                            placeholder="What is the main goal this month?"
                            rows={2}
                            value={getMonthPlan(currentDate).monthlyTheme}
                            onChange={(e) => updateMonthTheme(e.target.value)}
                        />
                    </div>
                </div>

                {/* Calendar Grid */}
                <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
                    {/* Weekday Headers */}
                    <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                            <div key={d} className="py-3 text-center text-xs font-semibold text-gray-500 uppercase tracking-wide">
                                {d}
                            </div>
                        ))}
                    </div>

                    {/* Days */}
                    <div className="grid grid-cols-7 auto-rows-[minmax(140px,1fr)]">
                        {calendarDays.map((day) => {
                            const isCurrentMonth = isSameMonth(day, currentDate);
                            const isSelected = selectedDate && isSameDay(day, selectedDate);
                            const dayData = getDayPlan(day);
                            const isTodayDate = isToday(day);

                            // Handle Weekly Theme logic (simplified: first day of week shows input)
                            const isStartOfWeek = day.getDay() === 0;
                            const weekNum = getWeek(day);
                            const weeklyTheme = getMonthPlan(day).weeklyThemes[weekNum] || '';

                            return (
                                <div 
                                    key={day.toString()}
                                    onClick={() => handleDayClick(day)}
                                    className={`
                                        relative p-2 border-b border-r border-gray-100 transition-all cursor-pointer group
                                        ${!isCurrentMonth ? 'bg-gray-50/50 text-gray-400' : 'bg-white hover:bg-gray-50'}
                                        ${isSelected ? 'ring-2 ring-inset ring-black z-10' : ''}
                                    `}
                                >
                                    {/* Date Number */}
                                    <div className="flex justify-between items-start mb-2">
                                        <span className={`
                                            text-sm font-medium w-7 h-7 flex items-center justify-center rounded-full
                                            ${isTodayDate ? 'bg-black text-white' : 'text-gray-700'}
                                        `}>
                                            {format(day, 'd')}
                                        </span>
                                        {dayData.posts.length > 0 && (
                                            <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-full">
                                                {dayData.posts.length}
                                            </span>
                                        )}
                                    </div>

                                    {/* Weekly Theme Indicator (Only on Sundays) */}
                                    {isStartOfWeek && isCurrentMonth && (
                                        <div className="absolute top-2 right-2 left-10">
                                            <input 
                                                className="w-full text-[10px] bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border-none focus:ring-1 focus:ring-purple-500 placeholder-purple-300 truncate"
                                                placeholder="Week Theme..."
                                                value={weeklyTheme}
                                                onClick={(e) => e.stopPropagation()}
                                                onChange={(e) => updateWeeklyTheme(day, e.target.value)}
                                            />
                                        </div>
                                    )}

                                    {/* Posts Previews */}
                                    <div className="space-y-1 mt-2">
                                        {dayData.posts.slice(0, 3).map(post => (
                                            <div key={post.id} className="flex items-center gap-1.5 bg-gray-50 p-1.5 rounded-md border border-gray-100">
                                                {post.segments.length > 1 ? (
                                                    <Layers size={12} className="text-blue-500 shrink-0" />
                                                ) : (
                                                    <FileText size={12} className="text-gray-400 shrink-0" />
                                                )}
                                                <span className={`text-[10px] truncate ${post.status === 'published' ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                                                    {post.title || post.segments[0].content || 'Untitled Draft'}
                                                </span>
                                            </div>
                                        ))}
                                        {dayData.posts.length > 3 && (
                                            <div className="text-[10px] text-gray-400 pl-1">
                                                + {dayData.posts.length - 3} more
                                            </div>
                                        )}
                                    </div>

                                    {/* Hover Add Button */}
                                    <div className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="bg-black text-white p-1 rounded-full shadow-lg">
                                            <Plus size={14} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
      </div>

      {/* --- Right Sidebar (Editor) --- */}
      <div 
        className={`
            w-[480px] bg-white border-l border-gray-200 h-screen overflow-y-auto transition-transform duration-300 ease-in-out shadow-2xl z-20 absolute right-0 top-0
            ${selectedDate ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        {selectedDate && (
            <div className="p-6 min-h-full flex flex-col">
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h2 className="text-2xl font-bold text-gray-900">{format(selectedDate, 'EEEE, MMMM do')}</h2>
                        <p className="text-sm text-gray-500">Daily Content Planner</p>
                    </div>
                    <button onClick={() => setSelectedDate(null)} className="text-gray-400 hover:text-black">
                        <X size={24} />
                    </button>
                </div>

                {/* Daily Theme */}
                <div className="mb-8">
                    <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2 block">Daily Theme</label>
                    <input 
                        type="text"
                        className="w-full text-base border-b-2 border-gray-200 focus:border-black py-2 outline-none transition-colors bg-transparent text-gray-900 placeholder-gray-400"
                        placeholder="e.g. Educational Thread about React"
                        value={getDayPlan(selectedDate).dailyTheme}
                        onChange={(e) => updateDailyTheme(selectedDate, e.target.value)}
                    />
                </div>

                {/* Ideas Generator */}
                <div className="mb-8 bg-gradient-to-r from-purple-50 to-blue-50 p-4 rounded-xl border border-purple-100">
                     <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-2 text-purple-700 font-semibold text-sm">
                            <Sparkles size={16} />
                            <span>Idea Generator</span>
                        </div>
                        <button onClick={() => setShowIdeas(!showIdeas)} className="text-xs text-purple-600 hover:underline">
                            {showIdeas ? 'Close' : 'Open'}
                        </button>
                     </div>
                     
                     {showIdeas && (
                        <div className="animate-in fade-in zoom-in-95">
                            <div className="flex gap-2 mb-3">
                                <input 
                                    className="flex-1 text-sm rounded-md border border-purple-200 px-3 py-2 focus:ring-2 focus:ring-purple-400 outline-none text-gray-900 placeholder-gray-500"
                                    placeholder="Topic (e.g. Remote Work)"
                                    value={ideaTopic}
                                    onChange={(e) => setIdeaTopic(e.target.value)}
                                />
                                <button 
                                    disabled={loadingIdeas}
                                    onClick={handleGenerateIdeas}
                                    className="bg-purple-600 text-white px-3 py-2 rounded-md text-sm font-medium hover:bg-purple-700 disabled:opacity-50"
                                >
                                    {loadingIdeas ? '...' : 'Go'}
                                </button>
                            </div>
                            <div className="space-y-2">
                                {generatedIdeas.map((idea, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-lg border border-purple-100 text-sm text-gray-700 shadow-sm hover:shadow-md transition-shadow cursor-pointer" onClick={() => useIdea(idea)}>
                                        {idea}
                                    </div>
                                ))}
                            </div>
                        </div>
                     )}
                </div>

                {/* Posts List or Editor */}
                <div className="flex-1 flex flex-col">
                    {editingPostId && currentPostToEdit ? (
                        <ThreadEditor 
                            post={currentPostToEdit}
                            onSave={savePost}
                            onCancel={() => setEditingPostId(null)}
                            onDelete={deletePost}
                        />
                    ) : (
                        <>
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-gray-900">Planned Posts</h3>
                                <button 
                                    onClick={createNewPost}
                                    className="flex items-center gap-1 text-sm bg-black text-white px-3 py-1.5 rounded-lg hover:bg-gray-800 transition-colors"
                                >
                                    <Plus size={16} /> New Post
                                </button>
                            </div>

                            <div className="space-y-3">
                                {getDayPlan(selectedDate).posts.length === 0 ? (
                                    <div className="text-center py-12 border-2 border-dashed border-gray-100 rounded-xl">
                                        <p className="text-gray-400 text-sm">No posts planned for today.</p>
                                    </div>
                                ) : (
                                    getDayPlan(selectedDate).posts.map(post => (
                                        <div 
                                            key={post.id} 
                                            onClick={() => setEditingPostId(post.id)}
                                            className="bg-white p-4 rounded-xl border border-gray-200 hover:border-black transition-colors cursor-pointer shadow-sm group"
                                        >
                                            <div className="flex justify-between items-start mb-2">
                                                <div className="flex items-center gap-2">
                                                    <span className={`w-2 h-2 rounded-full ${
                                                        post.status === 'published' ? 'bg-green-500' :
                                                        post.status === 'scheduled' ? 'bg-blue-500' : 'bg-gray-300'
                                                    }`} />
                                                    <span className="text-xs font-mono text-gray-500">{post.time}</span>
                                                </div>
                                                {post.segments.length > 1 && (
                                                    <span className="bg-blue-50 text-blue-600 text-[10px] font-bold px-1.5 py-0.5 rounded">
                                                        CHAIN ({post.segments.length})
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                                                {post.title || (post.segments[0].content ? post.segments[0].content : 'Untitled Post')}
                                            </h4>
                                            <p className="text-xs text-gray-500 line-clamp-2">
                                                {post.segments[0].content || "No content yet..."}
                                            </p>
                                        </div>
                                    ))
                                )}
                            </div>
                        </>
                    )}
                </div>
            </div>
        )}
      </div>

      {/* Overlay when sidebar is open on small screens (optional, but good for focus) */}
      {selectedDate && (
        <div 
            className="fixed inset-0 bg-black/5 z-10 pointer-events-none lg:pointer-events-auto lg:hidden"
            aria-hidden="true"
        />
      )}

    </div>
  );
}

// Simple close icon for sidebar
function X({size, className}: {size: number, className?: string}) {
    return (
        <svg 
            xmlns="http://www.w3.org/2000/svg" 
            width={size} 
            height={size} 
            viewBox="0 0 24 24" 
            fill="none" 
            stroke="currentColor" 
            strokeWidth="2" 
            strokeLinecap="round" 
            strokeLinejoin="round"
            className={className}
        >
            <path d="M18 6 6 18" /><path d="m6 6 18 18" />
        </svg>
    )
}