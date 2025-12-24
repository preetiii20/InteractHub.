import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';

const DarkModeToggle = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);

  // Load dark mode preference from localStorage on mount
  useEffect(() => {
    const savedMode = localStorage.getItem('darkMode');
    if (savedMode !== null) {
      const isDark = JSON.parse(savedMode);
      setIsDarkMode(isDark);
      applyDarkMode(isDark);
    }
  }, []);

  const applyDarkMode = (isDark) => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      
      const style = document.getElementById('dark-mode-style') || document.createElement('style');
      style.id = 'dark-mode-style';
      style.innerHTML = `
        /* Dark mode - Teams style */
        .dark {
          color-scheme: dark;
        }
        
        .dark body {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }
        
        /* Main content area */
        .dark main {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
        }
        
        /* Sidebar - dark */
        .dark aside {
          background-color: #1a1a1a !important;
          color: #ffffff !important;
          border-color: #2a2a2a !important;
        }
        
        .dark aside * {
          color: #ffffff !important;
        }
        
        /* Header - preserve gradient */
        .dark header {
          background: linear-gradient(to right, #1a3a52, #1a2f42, #1a3a52) !important;
          border-color: #1a3a52 !important;
        }
        
        .dark header * {
          color: #ffffff !important;
        }
        
        /* Cards - dark gray */
        .dark [class*="card"],
        .dark [class*="container"],
        .dark [class*="panel"],
        .dark [class*="box"] {
          background-color: #2a2a2a !important;
          color: #ffffff !important;
          border-color: #3a3a3a !important;
        }
        
        /* Tables */
        .dark table,
        .dark tr,
        .dark td,
        .dark th {
          background-color: #2a2a2a !important;
          color: #ffffff !important;
          border-color: #3a3a3a !important;
        }
        
        .dark thead {
          background-color: #3a3a3a !important;
          color: #ffffff !important;
        }
        
        /* Buttons */
        .dark button {
          background-color: #3a3a3a !important;
          color: #ffffff !important;
          border-color: #4a4a4a !important;
        }
        
        .dark button:hover {
          background-color: #4a4a4a !important;
        }
        
        /* Preserve gradient buttons */
        .dark button[class*="gradient"],
        .dark button[class*="primary"],
        .dark button[class*="blue"] {
          background: linear-gradient(135deg, #5b7cfa, #4c6ef5) !important;
          color: #ffffff !important;
        }
        
        .dark button[class*="gradient"]:hover,
        .dark button[class*="primary"]:hover,
        .dark button[class*="blue"]:hover {
          background: linear-gradient(135deg, #4c6ef5, #5b7cfa) !important;
        }
        
        /* Input fields */
        .dark input,
        .dark textarea,
        .dark select {
          background-color: #2a2a2a !important;
          color: #ffffff !important;
          border-color: #4a4a4a !important;
        }
        
        .dark input::placeholder,
        .dark textarea::placeholder {
          color: #888888 !important;
        }
        
        .dark input:focus,
        .dark textarea:focus,
        .dark select:focus {
          border-color: #5b7cfa !important;
          outline: none !important;
        }
        
        /* Links */
        .dark a {
          color: #5b7cfa !important;
        }
        
        .dark a:hover {
          color: #748ffc !important;
        }
        
        /* Modals and dropdowns */
        .dark [class*="modal"],
        .dark [class*="dropdown"],
        .dark [class*="menu"],
        .dark [class*="popup"] {
          background-color: #2a2a2a !important;
          color: #ffffff !important;
          border-color: #3a3a3a !important;
        }
        
        /* Badges and tags */
        .dark [class*="badge"],
        .dark [class*="tag"],
        .dark [class*="label"] {
          background-color: #3a3a3a !important;
          color: #ffffff !important;
          border-color: #4a4a4a !important;
        }
        
        /* Alerts */
        .dark [class*="alert"],
        .dark [class*="warning"],
        .dark [class*="error"],
        .dark [class*="success"] {
          background-color: #3a3a3a !important;
          color: #ffffff !important;
          border-color: #4a4a4a !important;
        }
        
        /* Form labels */
        .dark label {
          color: #ffffff !important;
        }
        
        /* Dividers */
        .dark hr,
        .dark [class*="divider"] {
          border-color: #3a3a3a !important;
        }
        
        /* Scrollbar */
        .dark ::-webkit-scrollbar {
          background-color: #1a1a1a;
        }
        
        .dark ::-webkit-scrollbar-track {
          background-color: #1a1a1a;
        }
        
        .dark ::-webkit-scrollbar-thumb {
          background-color: #4a4a4a;
          border-radius: 4px;
        }
        
        .dark ::-webkit-scrollbar-thumb:hover {
          background-color: #5a5a5a;
        }
        
        /* Text selection */
        .dark ::selection {
          background-color: #5b7cfa;
          color: #ffffff;
        }
      `;
      
      if (!document.getElementById('dark-mode-style')) {
        document.head.appendChild(style);
      }
    } else {
      // Remove dark mode
      document.documentElement.classList.remove('dark');
      
      const style = document.getElementById('dark-mode-style');
      if (style) {
        style.remove();
      }
    }
  };

  const toggleDarkMode = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem('darkMode', JSON.stringify(newMode));
    applyDarkMode(newMode);
  };

  return (
    <button
      onClick={toggleDarkMode}
      className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors duration-200"
      title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
      aria-label="Toggle dark mode"
    >
      {isDarkMode ? (
        <Sun className="w-5 h-5 text-yellow-300" />
      ) : (
        <Moon className="w-5 h-5 text-white" />
      )}
    </button>
  );
};

export default DarkModeToggle;