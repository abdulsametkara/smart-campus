import React, { createContext, useState, useContext, useEffect, useMemo, useCallback } from 'react';
import { createTheme, ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { CssBaseline } from '@mui/material';
import { translations } from '../i18n/translations';

const ThemeContext = createContext();

export const useThemeMode = () => {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useThemeMode must be used within a ThemeProvider');
    }
    return context;
};

export const ThemeProvider = ({ children }) => {
    const [mode, setMode] = useState(() => {
        const saved = localStorage.getItem('theme-mode');
        return saved || 'light';
    });

    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('app-language');
        return saved || 'tr';
    });

    useEffect(() => {
        localStorage.setItem('theme-mode', mode);
        document.body.setAttribute('data-theme', mode);
    }, [mode]);

    useEffect(() => {
        localStorage.setItem('app-language', language);
        document.documentElement.lang = language;
    }, [language]);

    const toggleTheme = () => {
        setMode(prev => prev === 'light' ? 'dark' : 'light');
    };

    const toggleLanguage = () => {
        setLanguage(prev => prev === 'tr' ? 'en' : 'tr');
    };

    // Translation helper function
    const t = useCallback((key) => {
        return translations[language]?.[key] || translations['tr']?.[key] || key;
    }, [language]);

    const theme = useMemo(() => createTheme({
        palette: {
            mode,
            ...(mode === 'light'
                ? {
                    // Light mode
                    primary: { main: '#2563eb' },
                    secondary: { main: '#10b981' },
                    background: {
                        default: '#f8fafc',
                        paper: '#ffffff',
                    },
                    text: {
                        primary: '#1e293b',
                        secondary: '#64748b',
                    },
                }
                : {
                    // Dark mode
                    primary: {
                        main: '#60a5fa', // Lighter blue for better contrast
                        light: '#93c5fd',
                        dark: '#2563eb',
                    },
                    secondary: {
                        main: '#34d399',
                        light: '#6ee7b7',
                        dark: '#059669',
                    },
                    background: {
                        default: '#111827', // Gray-900 (softer than black)
                        paper: '#1f2937',   // Gray-800
                        subtle: '#374151',
                    },
                    text: {
                        primary: '#f9fafb', // Gray-50
                        secondary: '#9ca3af', // Gray-400
                    },
                    divider: 'rgba(255, 255, 255, 0.08)',
                }
            ),
        },
        typography: {
            fontFamily: "'Inter', 'Segoe UI', sans-serif",
        },
        shape: {
            borderRadius: 12,
        },
        components: {
            MuiCard: {
                styleOverrides: {
                    root: {
                        boxShadow: mode === 'light'
                            ? '0 4px 20px rgba(0,0,0,0.05)'
                            : '0 4px 20px rgba(0,0,0,0.3)',
                    },
                },
            },
            MuiPaper: {
                styleOverrides: {
                    root: {
                        backgroundImage: 'none',
                    },
                },
            },
            MuiButton: {
                styleOverrides: {
                    root: {
                        textTransform: 'none',
                        fontWeight: 600,
                    },
                },
            },
            MuiTableCell: {
                styleOverrides: {
                    root: {
                        borderColor: mode === 'dark' ? '#334155' : '#e2e8f0',
                    },
                },
            },
        },
    }), [mode]);

    const value = {
        mode,
        language,
        toggleTheme,
        toggleLanguage,
        isDark: mode === 'dark',
        isEnglish: language === 'en',
        t, // Translation helper
    };

    return (
        <ThemeContext.Provider value={value}>
            <MUIThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </MUIThemeProvider>
        </ThemeContext.Provider>
    );
};

export default ThemeContext;

