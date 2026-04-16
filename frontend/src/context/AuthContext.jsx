import React, { createContext, useCallback, useContext, useReducer } from 'react';

const AuthContext = createContext();

const getAuthStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return window.sessionStorage;
};

const getStoredUser = () => {
  try {
    const storage = getAuthStorage();
    const storedUser = storage?.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    return null;
  }
};

const getStoredToken = () => {
  try {
    const storage = getAuthStorage();
    return storage?.getItem('token') || null;
  } catch (error) {
    return null;
  }
};

const initialState = {
  user: getStoredUser(),
  token: getStoredToken(),
  isAuthenticated: !!getStoredToken(),
  loading: false,
  error: null
};

const authReducer = (state, action) => {
  switch (action.type) {
    case 'LOGIN_START':
      return { ...state, loading: true, error: null };
    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        loading: false
      };
    case 'LOGIN_FAILURE':
      return {
        ...state,
        error: action.payload,
        loading: false
      };
    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false
      };
    default:
      return state;
  }
};

export const AuthProvider = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  const clearSession = useCallback(() => {
    const storage = getAuthStorage();
    storage?.removeItem('token');
    storage?.removeItem('user');

    dispatch({ type: 'LOGOUT' });
  }, []);

  const login = useCallback((user, token) => {
    const storage = getAuthStorage();
    if (storage) {
      storage.setItem('token', token);
      storage.setItem('user', JSON.stringify(user));
    }

    dispatch({
      type: 'LOGIN_SUCCESS',
      payload: { user, token }
    });
  }, []);

  const logout = useCallback(() => {
    clearSession();
  }, [clearSession]);

  const value = {
    ...state,
    login,
    logout,
    clearSession
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
