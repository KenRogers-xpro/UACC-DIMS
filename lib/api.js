const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://uacc-dims-backend.onrender.com/api';

const TOKEN_KEY = 'uacc_dims_token';

const api = {
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem(TOKEN_KEY);
    }
    return null;
  },

  setToken: (token) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(TOKEN_KEY, token);
    }
  },

  clearToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem(TOKEN_KEY);
    }
  },

  async request(endpoint, options = {}) {
    const token = this.getToken();
    const headers = {
      ...options.headers,
    };

    if (!(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const config = {
      ...options,
      headers,
    };

    try {
      const response = await fetch(`${BASE_URL}${endpoint}`, config);

      // Auto logout on 401 Unauthorized
      if (response.status === 401 && typeof window !== 'undefined') {
        this.clearToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }

      return response.json();
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  },

  get(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'GET' });
  },

  async getBlob(endpoint, options = {}) {
    const token = this.getToken();
    const headers = { ...options.headers };
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
      method: 'GET',
    });

    if (!response.ok) {
      if (response.status === 401 && typeof window !== 'undefined') {
        this.clearToken();
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
      throw new Error(`Failed to fetch blob: ${response.statusText}`);
    }

    const blob = await response.blob();
    return URL.createObjectURL(blob);
  },

  post(endpoint, body, options = {}) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, {
      ...options,
      method: 'POST',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  put(endpoint, body, options = {}) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, {
      ...options,
      method: 'PUT',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  patch(endpoint, body, options = {}) {
    const isFormData = body instanceof FormData;
    return this.request(endpoint, {
      ...options,
      method: 'PATCH',
      body: isFormData ? body : JSON.stringify(body),
    });
  },

  delete(endpoint, options = {}) {
    return this.request(endpoint, { ...options, method: 'DELETE' });
  },
};

export default api;
