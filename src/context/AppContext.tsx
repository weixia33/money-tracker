import React, { createContext, useContext, useReducer, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Account, Category } from '../types';
import { db } from '../db';

interface AppState {
  accounts: Account[];
  categories: Category[];
  loading: boolean;
}

type AppAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ACCOUNTS'; payload: Account[] }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_ACCOUNT'; payload: Account }
  | { type: 'UPDATE_ACCOUNT'; payload: Account }
  | { type: 'DELETE_ACCOUNT'; payload: string }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string };

function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
    case 'SET_ACCOUNTS':
      return { ...state, accounts: action.payload };
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    case 'ADD_ACCOUNT':
      return { ...state, accounts: [...state.accounts, action.payload] };
    case 'UPDATE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.map((a) =>
          a.id === action.payload.id ? action.payload : a
        ),
      };
    case 'DELETE_ACCOUNT':
      return {
        ...state,
        accounts: state.accounts.filter((a) => a.id !== action.payload),
      };
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };
    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter((c) => c.id !== action.payload),
      };
    default:
      return state;
  }
}

interface AppContextValue {
  state: AppState;
  dispatch: React.Dispatch<AppAction>;
  refreshAccounts: () => Promise<void>;
  refreshCategories: () => Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(appReducer, {
    accounts: [],
    categories: [],
    loading: true,
  });

  const refreshAccounts = async () => {
    const accounts = await db.accounts.toArray();
    dispatch({ type: 'SET_ACCOUNTS', payload: accounts });
  };

  const refreshCategories = async () => {
    const categories = await db.categories.toArray();
    dispatch({ type: 'SET_CATEGORIES', payload: categories });
  };

  useEffect(() => {
    const init = async () => {
      await db.seedData();
      await Promise.all([refreshAccounts(), refreshCategories()]);
      dispatch({ type: 'SET_LOADING', payload: false });
    };
    init();
  }, []);

  return (
    <AppContext.Provider
      value={{ state, dispatch, refreshAccounts, refreshCategories }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useAppContext() {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useAppContext must be used within AppProvider');
  return ctx;
}
