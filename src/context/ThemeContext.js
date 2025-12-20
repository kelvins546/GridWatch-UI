import React, { createContext, useState, useContext } from "react";

const themes = {
  dark: {
    background: "#0f0f0f",
    card: "#222",
    cardBorder: "#2a2a2a",
    text: "#ffffff",
    textSecondary: "#888",
    icon: "#888",
    primary: "#00ff99",
    statusBarStyle: "light-content",
  },
  light: {
    background: "#f2f2f7",
    card: "#ffffff",
    cardBorder: "#e5e5ea",
    text: "#000000",
    textSecondary: "#666",
    icon: "#666",
    primary: "#00995e",
    statusBarStyle: "dark-content",
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);

  const toggleTheme = () => {
    setIsDarkMode((prev) => !prev);
  };

  const theme = isDarkMode ? themes.dark : themes.light;

  return (
    <ThemeContext.Provider value={{ isDarkMode, toggleTheme, theme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
