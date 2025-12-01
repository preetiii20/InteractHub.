const makeAuth = (scope) => {
  const KEY = (k) => `${scope}:${k}`;

  const cfg = {
    TOKEN_KEY: KEY('token'),
    USER_KEY: KEY('user'),
    USER_ID_KEY: KEY('userId'),
    USER_NAME_KEY: KEY('userName')
  };

  const safeParse = (j, f = null) => { try { return JSON.parse(j); } catch { return f; } };
  const nonEmpty = (s, f) => (typeof s === 'string' && s.trim()) ? s.trim() : f;

  return {
    // Session-scoped by default so tabs are isolated
    setUser(user, useSession = true) {
      const storage = useSession ? sessionStorage : localStorage;
      const display =
        [user.firstName, user.lastName].filter(Boolean).join(' ').trim()
        || user.fullName || user.name || user.username
        || (user.email ? user.email.split('@')[0] : '')
        || 'User';

      const id = user.id ?? user.userId ?? '';
      const stored = { ...user, displayName: display };

      storage.setItem(cfg.USER_KEY, JSON.stringify(stored));
      storage.setItem(cfg.USER_ID_KEY, String(id));
      storage.setItem(cfg.USER_NAME_KEY, display);
    },

    getUser(useSession = true) {
      const storage = useSession ? sessionStorage : localStorage;
      return safeParse(storage.getItem(cfg.USER_KEY), null);
    },

    getUserName(useSession = true) {
      const u = this.getUser(useSession);
      return u?.displayName || storage.getItem(cfg.USER_NAME_KEY) || 'User';
    },

    setToken(token, useSession = true) {
      const storage = useSession ? sessionStorage : localStorage;
      storage.setItem(cfg.TOKEN_KEY, token);
    },

    getToken(useSession = true) {
      const storage = useSession ? sessionStorage : localStorage;
      return storage.getItem(cfg.TOKEN_KEY) || null;
    },

    clear(useSession = true) {
      const storage = useSession ? sessionStorage : localStorage;
      [cfg.TOKEN_KEY, cfg.USER_KEY, cfg.USER_ID_KEY, cfg.USER_NAME_KEY].forEach(k => {
        try { storage.removeItem(k); } catch {}
      });
    }
  };
};

// Export role-scoped helpers
export const adminAuth = makeAuth('admin');
export const managerAuth = makeAuth('manager');
