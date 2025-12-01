export const authConfig = {
    TOKEN_KEY: 'interacthub_token',
    USER_KEY: 'interacthub_user',
    USER_ID_KEY: 'userId',
    USER_NAME_KEY: 'userName',
    DEPARTMENT_ID_KEY: 'departmentId',
    ROLE_KEY: 'userRole',
    SESSION_TOKEN_KEY: 'interacthub_session_token',
    SESSION_USER_KEY: 'interacthub_session_user',
    DEFAULT_DEPARTMENT_ID: null,
    DEFAULT_USER_ROLE: null,
    LOGIN_ENDPOINT: '/auth/login',
    LOGOUT_ENDPOINT: '/auth/logout',
    REFRESH_ENDPOINT: '/auth/refresh',
    VERIFY_ENDPOINT: '/auth/verify'
};

function safeParse(json, fallback = null) { try { return JSON.parse(json); } catch { return fallback; } }
function nonEmpty(s, fallback) { return (typeof s === 'string' && s.trim().length > 0) ? s.trim() : fallback; }

export const authHelpers = {
    getUser() {
        const local = localStorage.getItem(authConfig.USER_KEY);
        const session = sessionStorage.getItem(authConfig.SESSION_USER_KEY);
        return safeParse(local, safeParse(session, null));
    },

    getUserId() {
        const u = this.getUser();
        const id = u?.id ?? u?.userId ?? localStorage.getItem(authConfig.USER_ID_KEY);
        const n = Number(id);
        return Number.isFinite(n) && n > 0 ? n : 0;
    },

    // CRITICAL: Helper to retrieve the unique DM identifier (Email)
    getUserEmail() {
        const u = this.getUser();
        const email = u?.email ?? localStorage.getItem('userEmail');
        return nonEmpty(email, null);
    },

    getDisplayName() {
        const u = this.getUser();
        const name = u?.name ?? u?.fullName ?? u?.username ?? localStorage.getItem(authConfig.USER_NAME_KEY);
        return nonEmpty(name, this.getUserEmail() ?? 'User');
    },

    getUserName() {
        return this.getDisplayName();
    },

    getDepartmentId() {
        const u = this.getUser();
        const raw = u?.departmentId ?? localStorage.getItem(authConfig.DEPARTMENT_ID_KEY);
        const n = Number(raw);
        return Number.isFinite(n) && n > 0 ? n : 0;
    },

    getUserRole() {
        const u = this.getUser();
        const role = u?.role ?? localStorage.getItem(authConfig.ROLE_KEY);
        return role ?? null;
    },

    setUser(userData, useSession = false) {
        const storage = useSession ? sessionStorage : localStorage;
        const id = userData.id ?? userData.userId ?? '';
        const name = nonEmpty(userData.name ?? userData.userName ?? userData.username, 'User');

        storage.setItem(authConfig.USER_KEY, JSON.stringify(userData));
        storage.setItem(authConfig.USER_ID_KEY, String(id));
        storage.setItem(authConfig.USER_NAME_KEY, name);
        if (userData.email) storage.setItem('userEmail', String(userData.email)); // Store email explicitly

        if (userData.departmentId != null) storage.setItem(authConfig.DEPARTMENT_ID_KEY, String(userData.departmentId));
        if (userData.role != null) storage.setItem(authConfig.ROLE_KEY, String(userData.role));
    },

    clearUser() {
        [authConfig.USER_KEY, authConfig.USER_ID_KEY, authConfig.USER_NAME_KEY, authConfig.DEPARTMENT_ID_KEY, authConfig.ROLE_KEY, authConfig.TOKEN_KEY, 'userEmail']
          .forEach(k => { try { localStorage.removeItem(k); } catch {} });
        [authConfig.SESSION_USER_KEY, authConfig.USER_ID_KEY, authConfig.USER_NAME_KEY, authConfig.DEPARTMENT_ID_KEY, authConfig.ROLE_KEY, authConfig.SESSION_TOKEN_KEY, 'userEmail']
          .forEach(k => { try { sessionStorage.removeItem(k); } catch {} });
    },

    setToken(token, useSession = false) {
        const storage = useSession ? sessionStorage : localStorage;
        storage.setItem(authConfig.TOKEN_KEY, token);
    },

    getToken() {
        return localStorage.getItem(authConfig.TOKEN_KEY) || sessionStorage.getItem(authConfig.TOKEN_KEY) || null;
    },

    clearToken() {
        try { localStorage.removeItem(authConfig.TOKEN_KEY); } catch {}
        try { sessionStorage.removeItem(authConfig.TOKEN_KEY); } catch {}
    },

    isAuthenticated() { return this.getUserId() > 0; }
};