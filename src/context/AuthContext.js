import React, { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "../lib/supabase"; // Adjust path to your supabase.js

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Check for an existing session on app load
    const loadSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (session) {
          setSession(session);
          setUser(session.user);
        }
      } catch (error) {
        console.log("Auth load error:", error);
      } finally {
        setLoading(false); // Finished checking
      }
    };

    loadSession();

    // 2. Listen for background changes (e.g. sign in, sign out)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session ? session.user : null);
      setLoading(false);
    });

    return () => subscription?.unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, session, loading }}>
      {children}
    </AuthContext.Provider>
  );
};
