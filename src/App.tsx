import React, { useState, useEffect } from 'react';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import FoodSearch from './components/FoodSearch';
import Profile from './components/Profile';
import History from './components/History';
import Recipes from './components/Recipes';
import AIChat from './components/AIChat';
import FloatingAIButton from './components/FloatingAIButton';
import SplashScreen from './components/SplashScreen';
import Login from './components/Login';
import { useLocalStorage } from './hooks/useLocalStorage';
import { User, FoodEntry, DailyLog } from './types';
import { getAuthToken, clearAuthToken, getDailyLog, saveDailyLog, updateProfile, getProfile, getWeightHistory, saveWeightHistory, syncAll } from './utils/api';
import { computeDailyTargets } from './utils/nutrition';

function App() {
  const defaultUser = {
    name: 'Utilisateur',
    email: 'user@example.com',
    age: 30,
    weight: 70,
    height: 175,
    gender: 'homme' as const,
    activityLevel: 'modérée' as const,
    goal: 'maintien' as const,
    avatar: 'https://images.pexels.com/photos/1310474/pexels-photo-1310474.jpeg?auto=compress&cs=tinysrgb&w=100&h=100&fit=crop',
    theme: 'dark' as const,
    notifications: true,
    password: 'password',
    stepGoal: 10000,
    dailyWater: 2000
  };

  const targets = computeDailyTargets(defaultUser);

  const storedUserRaw =
    localStorage.getItem('nutritalk-user') ||
    sessionStorage.getItem('nutritalk-user');
  console.log(storedUserRaw);
  let parsedStored: User | null = null;
  if (storedUserRaw && storedUserRaw !== 'undefined') {
    try {
      parsedStored = JSON.parse(storedUserRaw) as User;
    } catch (err) {
      console.error('Failed to parse stored user:', err, storedUserRaw);
    }
  }
  const initialUser: User = parsedStored ?? {
        ...defaultUser,
        dailyCalories: targets.calories,
        dailyProtein: targets.protein,
        dailyCarbs: targets.carbs,
        dailyFat: targets.fat,
        dailyWater: defaultUser.dailyWater,
      };
  const [user, setUserState] = useState<User>(initialUser);
  const rememberRef = React.useRef(!!localStorage.getItem('nutritalk-user'));

  const userRef = React.useRef(user);
  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const persistUser = React.useCallback((u: User | null | undefined) => {
    if (!u) {
      console.warn('persistUser called with empty value');
      localStorage.removeItem('nutritalk-user');
      sessionStorage.removeItem('nutritalk-user');
      return;
    }
    const str = JSON.stringify(u);
    if (rememberRef.current) {
      localStorage.setItem('nutritalk-user', str);
      sessionStorage.removeItem('nutritalk-user');
    } else {
      sessionStorage.setItem('nutritalk-user', str);
      localStorage.removeItem('nutritalk-user');
    }
  }, []);

  const setUser = React.useCallback((val: User | ((prev: User) => User)) => {
    setUserState(prev => {
      const newUser = typeof val === 'function' ? (val as (p: User) => User)(prev) : val;
      persistUser(newUser);
      return newUser;
    });
  }, [persistUser]);

  const [dailyLog, setDailyLogStorage] = useLocalStorage<DailyLog>('nutritalk-daily-log', {
    date: new Date().toISOString().split('T')[0],
    entries: [],
    totalCalories: 0,
    totalProtein: 0,
    totalCarbs: 0,
    totalFat: 0,
    totalFiber: 0,
    totalVitaminC: 0,
    water: 0,
    steps: 0,
    targetCalories: targets.calories,
    weight: defaultUser.weight
  });

  const [weightHistory, setWeightHistoryStorage] = useLocalStorage<{ date: string; weight: number }[]>('nutritalk-weight-history', []);

  const dailyLogRef = React.useRef(dailyLog);
  useEffect(() => {
    dailyLogRef.current = dailyLog;
  }, [dailyLog]);

  const weightHistoryRef = React.useRef(weightHistory);
  useEffect(() => {
    weightHistoryRef.current = weightHistory;
  }, [weightHistory]);

  const setDailyLog = React.useCallback((val: DailyLog | ((prev: DailyLog) => DailyLog)) => {
    const newVal = typeof val === 'function' ? (val as (p: DailyLog) => DailyLog)(dailyLogRef.current) : val;
    dailyLogRef.current = newVal;
    setDailyLogStorage(newVal);
  }, [setDailyLogStorage]);

  const setWeightHistory = React.useCallback((val: { date: string; weight: number }[] | ((prev: { date: string; weight: number }[]) => { date: string; weight: number }[])) => {
    const newVal = typeof val === 'function' ? (val as (p: { date: string; weight: number }[]) => { date: string; weight: number }[])(weightHistoryRef.current) : val;
    weightHistoryRef.current = newVal;
    setWeightHistoryStorage(newVal);
  }, [setWeightHistoryStorage]);


  const [currentView, setCurrentView] = useState('splash');
  const [isAIChatOpen, setIsAIChatOpen] = useState(false);
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Ensure dashboard shows once the user is authenticated
  useEffect(() => {
    if (user.id && currentView !== 'dashboard') {
      setCurrentView('dashboard');
    }
  }, [user.id, currentView]);

  // Splash screen then determine if we should show auth or dashboard
  useEffect(() => {
    const token = getAuthToken();
    if (!token) {
      localStorage.removeItem('nutritalk-user');
      sessionStorage.removeItem('nutritalk-user');
      setUserState({
        ...defaultUser,
        dailyCalories: targets.calories,
        dailyProtein: targets.protein,
        dailyCarbs: targets.carbs,
        dailyFat: targets.fat,
        dailyWater: defaultUser.dailyWater,
      });
      rememberRef.current = false;
    } else {
      rememberRef.current = !!localStorage.getItem('token');
    }
    const timer = setTimeout(() => {
      setCurrentView(token ? 'dashboard' : 'auth');
    }, 1000);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (user.theme === 'dark') {
      setIsDarkMode(true);
      document.documentElement.classList.add('dark');
    } else if (user.theme === 'light') {
      setIsDarkMode(false);
      document.documentElement.classList.remove('dark');
    } else {
      const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      setIsDarkMode(prefersDark);
      document.documentElement.classList.toggle('dark', prefersDark);
    }
  }, [user.theme]);


  useEffect(() => {
    if (user.id) {
      const today = new Date().toISOString().split('T')[0];
      syncAll(user.id).then(data => {
        if (data.profile) setUser(prev => ({ ...prev, ...data.profile }));
        const log = data.logs?.find((l: { date: string; data: DailyLog }) => l.date === today);
        if (log) setDailyLog(log.data);
        if (data.weights) setWeightHistory(data.weights);
      }).catch(() => {
        getProfile(user.id).then(setUser).catch(() => {});
        getDailyLog(user.id, today).then(log => {
          if (log) setDailyLog(log);
        }).catch(() => {});
        getWeightHistory(user.id).then(hist => {
          if (hist) setWeightHistory(hist);
        }).catch(() => {});
      });
    }
  }, [user.id, setUser, setDailyLog, setWeightHistory]);

  useEffect(() => {
    if (user.id) {
      saveDailyLog(user.id, dailyLog.date, dailyLog).catch(() => {});
    }
  }, [dailyLog, user.id]);

  useEffect(() => {
    if (user.id) {
      updateProfile(user.id, user).catch(() => {});
    }
  }, [user, user.id]);

  useEffect(() => {
    if (user.id) {
      saveWeightHistory(user.id, weightHistory).catch(() => {});
    }
  }, [weightHistory, user.id]);


  const addFoodEntry = (entry: Omit<FoodEntry, 'id' | 'timestamp'>) => {
    const newEntry: FoodEntry = {
      ...entry,
      id: Date.now().toString(),
      timestamp: new Date().toISOString()
    };

    const updatedLog = {
      ...dailyLog,
      entries: [...dailyLog.entries, newEntry],
      totalCalories: dailyLog.totalCalories + entry.calories,
      totalProtein: dailyLog.totalProtein + entry.protein,
      totalCarbs: dailyLog.totalCarbs + entry.carbs,
      totalFat: dailyLog.totalFat + entry.fat,
      totalFiber: (dailyLog.totalFiber || 0) + (entry.fiber || 0),
      totalVitaminC: (dailyLog.totalVitaminC || 0) + (entry.vitaminC || 0)
    };

    setDailyLog(updatedLog);
    if (user.id) saveDailyLog(user.id, updatedLog.date, updatedLog).catch(() => {});
  };

  const removeFoodEntry = (id: string) => {
    const entryToRemove = dailyLog.entries.find(entry => entry.id === id);
    if (!entryToRemove) return;

    const updatedLog = {
      ...dailyLog,
      entries: dailyLog.entries.filter(entry => entry.id !== id),
      totalCalories: dailyLog.totalCalories - entryToRemove.calories,
      totalProtein: dailyLog.totalProtein - entryToRemove.protein,
      totalCarbs: dailyLog.totalCarbs - entryToRemove.carbs,
      totalFat: dailyLog.totalFat - entryToRemove.fat,
      totalFiber: (dailyLog.totalFiber || 0) - (entryToRemove.fiber || 0),
      totalVitaminC: (dailyLog.totalVitaminC || 0) - (entryToRemove.vitaminC || 0)
    };

    setDailyLog(updatedLog);
    if (user.id) saveDailyLog(user.id, updatedLog.date, updatedLog).catch(() => {});
  };

  const updateWater = (amount: number) => {
    setDailyLog(prev => {
      const updated = { ...prev, water: Math.max(0, prev.water + amount) };
      if (user.id) saveDailyLog(user.id, updated.date, updated).catch(() => {});
      return updated;
    });
  };

  const updateSteps = (amount: number) => {
    setDailyLog(prev => {
      const updated = { ...prev, steps: Math.max(0, prev.steps + amount) };
      if (user.id) saveDailyLog(user.id, updated.date, updated).catch(() => {});
      return updated;
    });
  };

  const updateWeight = (delta: number) => {
    const newWeight = Math.max(0, user.weight + delta);
    setUser(prev => ({ ...prev, weight: newWeight }));
    setDailyLog(prev => {
      const updated = { ...prev, weight: newWeight };
      if (user.id) saveDailyLog(user.id, updated.date, updated).catch(() => {});
      return updated;
    });
    const today = new Date().toISOString().split('T')[0];
    setWeightHistory(prev => {
      const filtered = prev.filter(p => p.date !== today);
      return [...filtered, { date: today, weight: newWeight }];
    });
  };

  const handleLogin = (u: User, remember: boolean) => {
    rememberRef.current = remember;
    const merged = { ...defaultUser, ...u } as User;
    if (!u.dailyCalories) {
      const t = computeDailyTargets(merged);
      merged.dailyCalories = t.calories;
      merged.dailyProtein = t.protein;
      merged.dailyCarbs = t.carbs;
      merged.dailyFat = t.fat;
    }
    setUser(merged);
    setCurrentView('dashboard');
  };

  const handleLogout = () => {
    clearAuthToken();
    localStorage.removeItem('nutritalk-user');
    sessionStorage.removeItem('nutritalk-user');
    setUser({
      ...defaultUser,
      dailyCalories: targets.calories,
      dailyProtein: targets.protein,
      dailyCarbs: targets.carbs,
      dailyFat: targets.fat,
      dailyWater: defaultUser.dailyWater,
    });
    setCurrentView('auth');
  };

  const renderView = () => {
    switch (currentView) {
      case 'splash':
        return <SplashScreen />;
      case 'auth':
        return <Login user={user} onLogin={handleLogin} />;
      case 'dashboard':
        return (
          <Dashboard
            user={user}
            dailyLog={dailyLog}
            onRemoveEntry={removeFoodEntry}
            onUpdateWater={updateWater}
            onUpdateSteps={updateSteps}
            onUpdateWeight={updateWeight}
            weightHistory={weightHistory}
          />
        );
      case 'search':
        return <FoodSearch onAddFood={addFoodEntry} />;
      case 'recipes':
        return <Recipes />;
      case 'profile':
        return <Profile user={user} onUpdateUser={setUser} onLogout={handleLogout} />;
      case 'history':
        return <History user={user} weightHistory={weightHistory} />;
      default:
        return (
          <Dashboard
            user={user}
            dailyLog={dailyLog}
            onRemoveEntry={removeFoodEntry}
            onUpdateWater={updateWater}
            onUpdateSteps={updateSteps}
            onUpdateWeight={updateWeight}
            weightHistory={weightHistory}
          />
        );
    }
  };

  return (
    <div className={`min-h-screen transition-colors duration-300 ${
      isDarkMode ? 'bg-gray-900 text-white' : 'bg-gray-50 text-gray-900'
    }`}>
      {currentView !== 'auth' && currentView !== 'splash' && (
        <Header
          currentView={currentView}
          onViewChange={setCurrentView}
          isDarkMode={isDarkMode}
          onToggleTheme={() => {
            const newTheme = isDarkMode ? 'light' : 'dark';
            setUser(prev => ({ ...prev, theme: newTheme }));
          }}
        />
      )}

      <main className="container mx-auto px-4 py-6 pb-20">
        {renderView()}
      </main>

      {currentView === 'dashboard' && (
        <>
          <FloatingAIButton onClick={() => setIsAIChatOpen(true)} />
          {isAIChatOpen && (
            <AIChat
              onClose={() => setIsAIChatOpen(false)}
              onAddFood={addFoodEntry}
              isDarkMode={isDarkMode}
            />
          )}
        </>
      )}
    </div>
  );
}

export default App;