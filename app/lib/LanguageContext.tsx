"use client";

import { createContext, useState, useContext, type ReactNode, useEffect } from "react";

// Idiomas permitidos
type Language = "es" | "en";

// Forma del contexto
interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

// Contexto con valor inicial undefined
enum _Internal {} // dummy to avoid declaration merge issues
const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Proveedor que persiste selección en localStorage
export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguage] = useState<Language>("es");

  useEffect(() => {
    const saved = localStorage.getItem("language") as Language | null;
    if (saved) setLanguage(saved);
  }, []);

  const setLang = (lang: Language) => {
    setLanguage(lang);
    localStorage.setItem("language", lang);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage: setLang }}>
      {children}
    </LanguageContext.Provider>
  );
};

// Hook de acceso al contexto
export const useLanguage = () => {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage debe usarse dentro de LanguageProvider");
  return ctx;
};