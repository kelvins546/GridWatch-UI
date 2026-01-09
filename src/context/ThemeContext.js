import React, { createContext, useState, useContext } from "react";

const baseFontSizes = {
  xs: 12,
  sm: 14,
  base: 16,
  lg: 18,
  xl: 20,
  "2xl": 24,
  "3xl": 30,
  "4xl": 36,
};

const themes = {
  dark: {
    background: "#18191a",
    card: "#242526",
    cardBorder: "#3a3b3c",
    text: "#FFFFFF",
    textSecondary: "#D0D2D6",
    icon: "#D0D2D6",

    statusOffline: "#9DA3AE",

    primary: "#FFD700",
    statusBarStyle: "light-content",
    buttonPrimary: "#00A651",
    buttonPrimaryText: "#ffffff",
    buttonNeutral: "#3a3b3c",
    buttonNeutralText: "#ffffff",
    buttonDanger: "rgba(239, 68, 68, 0.15)",
    buttonDangerText: "#ef4444",
  },
  light: {
    background: "#f0f2f5",
    card: "#ffffff",
    cardBorder: "#b0b3b8",
    text: "#000000",
    textSecondary: "#1F1F1F",
    icon: "#1F1F1F",

    statusOffline: "#5F6672",

    primary: "#007A3B",
    statusBarStyle: "dark-content",
    buttonPrimary: "#00A651",
    buttonPrimaryText: "#ffffff",
    buttonNeutral: "#e4e6eb",
    buttonNeutralText: "#000000",
    buttonDanger: "rgba(239, 68, 68, 0.1)",
    buttonDangerText: "#d32f2f",
  },
};

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDarkMode, setIsDarkMode] = useState(true);
  const [fontScale, setFontScale] = useState(1);

  const toggleTheme = () => setIsDarkMode((prev) => !prev);
  const updateFontScale = (scale) => setFontScale(scale);

  const scaledSize = (size) => size * fontScale;

  const typography = {
    xs: baseFontSizes.xs * fontScale,
    sm: baseFontSizes.sm * fontScale,
    base: baseFontSizes.base * fontScale,
    lg: baseFontSizes.lg * fontScale,
    xl: baseFontSizes.xl * fontScale,
    "2xl": baseFontSizes["2xl"] * fontScale,
    "3xl": baseFontSizes["3xl"] * fontScale,
    "4xl": baseFontSizes["4xl"] * fontScale,
  };

  const activeTheme = isDarkMode ? themes.dark : themes.light;

  const theme = {
    ...activeTheme,
    font: typography,
  };

  return (
    <ThemeContext.Provider
      value={{
        isDarkMode,
        toggleTheme,
        theme,
        fontScale,
        updateFontScale,
        scaledSize,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
