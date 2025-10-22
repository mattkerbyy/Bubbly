/**
 * Theme initialization utilities
 */

export const initializeTheme = () => {
  if (typeof window === "undefined") return;

  try {
    const stored = localStorage.getItem("bubbly-ui");
    let theme = "light";

    if (stored) {
      const parsed = JSON.parse(stored);
      theme = parsed.state?.theme || "light";
    } else {
      theme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
    }

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);
  } catch (error) {
    document.documentElement.classList.add("light");
  }
};

export const watchSystemTheme = (callback) => {
  if (typeof window === "undefined") return;

  const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");

  const handler = (e) => {
    const stored = localStorage.getItem("bubbly-ui");
    if (!stored) {
      const theme = e.matches ? "dark" : "light";
      document.documentElement.classList.remove("light", "dark");
      document.documentElement.classList.add(theme);
      if (callback) callback(theme);
    }
  };

  mediaQuery.addEventListener("change", handler);

  return () => mediaQuery.removeEventListener("change", handler);
};
