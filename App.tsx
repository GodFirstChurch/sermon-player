import React, { useState, useEffect } from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import Player from './components/Player';
import PublicFeed from './pages/PublicFeed';
import AdminDashboard from './pages/AdminDashboard';
import { subscribeToSermons } from './services/storage';
import { Sermon } from './types';

const App: React.FC = () => {
  // Global Player State
  const [sermons, setSermons] = useState<Sermon[]>([]);
  const [currentSermon, setCurrentSermon] = useState<Sermon | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [initialSeekTime, setInitialSeekTime] = useState(0);

  // Features State
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const saved = localStorage.getItem('bookmarkedSermons');
    return saved ? JSON.parse(saved) : [];
  });

  const [darkMode, setDarkMode] = useState(() => {
    return localStorage.getItem('theme') === 'dark';
  });

  // Dark Mode Effect
  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [darkMode]);

  // Data Fetching & State Restoration
  useEffect(() => {
    // Subscribe to real-time updates
    const unsubscribe = subscribeToSermons((fetchedSermons) => {
      setSermons(fetchedSermons);
      
      // Attempt to restore last played position once sermons are loaded
      // Only do this on the first load
      if (isLoading) {
        const lastPlayedId = localStorage.getItem('lastPlayedSermonId');
        const lastTimestamp = parseFloat(localStorage.getItem('lastPlayedTime') || '0');

        if (lastPlayedId && fetchedSermons.length > 0) {
          const matchedSermon = fetchedSermons.find(s => s.id === lastPlayedId);
          if (matchedSermon) {
            setCurrentSermon(matchedSermon);
            setInitialSeekTime(lastTimestamp);
            // Don't auto-play, just queue it up
            setIsPlaying(false);
          }
        }
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, [isLoading]);

  const handlePlaySermon = (sermon: Sermon) => {
    if (currentSermon?.id === sermon.id) {
      // Toggle
      setIsPlaying(!isPlaying);
    } else {
      // New Track
      setCurrentSermon(sermon);
      setIsPlaying(true);
      setInitialSeekTime(0); // Reset seek time for new tracks
    }
  };

  const toggleBookmark = (id: string) => {
    setBookmarks(prev => {
      let newBookmarks;
      if (prev.includes(id)) {
        newBookmarks = prev.filter(b => b !== id);
      } else {
        newBookmarks = [...prev, id];
      }
      localStorage.setItem('bookmarkedSermons', JSON.stringify(newBookmarks));
      return newBookmarks;
    });
  };

  return (
    <HashRouter>
      <div className="flex flex-col min-h-screen bg-slate-50 dark:bg-slate-900 transition-colors duration-300">
        <Header darkMode={darkMode} toggleDarkMode={() => setDarkMode(!darkMode)} />
        
        <main className="flex-1 overflow-y-auto">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center h-64 text-slate-400">
              <svg className="animate-spin h-8 w-8 text-sky-500 mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <p className="font-medium brand-font tracking-wide uppercase">Loading Sermons...</p>
            </div>
          ) : (
            <Routes>
              <Route 
                path="/" 
                element={
                  <PublicFeed 
                    sermons={sermons} 
                    currentSermonId={currentSermon?.id}
                    isPlaying={isPlaying}
                    onPlay={handlePlaySermon}
                    bookmarks={bookmarks}
                    onToggleBookmark={toggleBookmark}
                  />
                } 
              />
              <Route 
                path="/admin" 
                element={
                  <AdminDashboard />
                } 
              />
            </Routes>
          )}
        </main>

        <Player 
          currentSermon={currentSermon}
          isPlaying={isPlaying}
          onPlayPause={() => setIsPlaying(!isPlaying)}
          onEnded={() => setIsPlaying(false)}
          initialTime={initialSeekTime}
        />
      </div>
    </HashRouter>
  );
};

export default App;