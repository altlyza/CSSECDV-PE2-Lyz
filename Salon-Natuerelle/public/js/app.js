// API Configuration
//const API_URL = '/api';
const API_URL = 'http://localhost:8080/api';


// Storage helpers
const storage = {
    getToken: () => localStorage.getItem('token'),
    setToken: (token) => localStorage.setItem('token', token),
    removeToken: () => localStorage.removeItem('token'),
    getUser: () => JSON.parse(localStorage.getItem('user') || '{}'),
    setUser: (user) => localStorage.setItem('user', JSON.stringify(user)),
    removeUser: () => localStorage.removeItem('user'),
    clear: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    }
};

// API helper functions
const api = {
    // Base request function
    request: async (endpoint, options = {}) => {
        const token = storage.getToken();
        const headers = {
            'Content-Type': 'application/json',
            ...(token && { 'Authorization': `Bearer ${token}` }),
            ...options.headers
        };

        try {
            const response = await fetch(`${API_URL}${endpoint}`, {
                ...options,
                headers
            });

            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Something went wrong');
            }

            return data;
        } catch (error) {
            console.error('API Error:', error);
            throw error;
        }
    },

    // Auth endpoints
    auth: {
        login: (credentials) => api.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify(credentials)
        }),

        register: (userData) => api.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),

        getMe: () => api.request('/auth/me'),

        changePassword: (passwords) => api.request('/auth/change-password', {
            method: 'POST',
            body: JSON.stringify(passwords)
        })
    },

    // Services endpoints
    services: {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return api.request(`/services${query ? '?' + query : ''}`);
        },

        getOne: (id) => api.request(`/services/${id}`),

        create: (service) => api.request('/services', {
            method: 'POST',
            body: JSON.stringify(service)
        }),

        update: (id, service) => api.request(`/services/${id}`, {
            method: 'PUT',
            body: JSON.stringify(service)
        }),

        delete: (id) => api.request(`/services/${id}`, {
            method: 'DELETE'
        })
    },

    // Reservations endpoints
    reservations: {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return api.request(`/reservations${query ? '?' + query : ''}`);
        },

        getOne: (id) => api.request(`/reservations/${id}`),

        create: (reservation) => api.request('/reservations', {
            method: 'POST',
            body: JSON.stringify(reservation)
        }),

        update: (id, reservation) => api.request(`/reservations/${id}`, {
            method: 'PUT',
            body: JSON.stringify(reservation)
        }),

        cancel: (id) => api.request(`/reservations/${id}`, {
            method: 'DELETE'
        })
    },

    // Users endpoints (Admin)
    users: {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return api.request(`/users${query ? '?' + query : ''}`);
        },

        getCustomers: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return api.request(`/users/customers${query ? '?' + query : ''}`);
        },

        registerStaff: (userData) => api.request('/users/staff', {
            method: 'POST',
            body: JSON.stringify(userData)
        }),

        delete: (id) => api.request(`/users/${id}`, {
            method: 'DELETE'
        }),

        changeRole: (id, role) => api.request(`/users/${id}/role`, {
            method: 'PUT',
            body: JSON.stringify({ role })
        })
    },

    // Logs endpoints (Admin)
    logs: {
        getAll: (params = {}) => {
            const query = new URLSearchParams(params).toString();
            return api.request(`/logs${query ? '?' + query : ''}`);
        },

        getStats: () => api.request('/logs/stats')
    }
};

// UI Helper functions
const ui = {
    showAlert: (message, type = 'info') => {
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${type}`;
        alertDiv.textContent = message;
        
        const container = document.querySelector('.alerts-container') || document.querySelector('.container');
        container.insertBefore(alertDiv, container.firstChild);
        
        setTimeout(() => alertDiv.remove(), 5000);
    },

    showLoading: (container) => {
        container.innerHTML = `
            <div class="loading-container">
                <div class="spinner"></div>
                <p>Loading...</p>
            </div>
        `;
    },

    formatDate: (dateString) => {
        const options = { 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric', 
            hour: '2-digit', 
            minute: '2-digit' 
        };
        return new Date(dateString).toLocaleDateString('en-US', options);
    },

    formatCurrency: (amount) => {
        return new Intl.NumberFormat('en-US', {
            style: 'currency',
            currency: 'USD'
        }).format(amount);
    },

    getStatusBadgeClass: (status) => {
        const statusClasses = {
            'pending': 'badge-pending',
            'confirmed': 'badge-confirmed',
            'completed': 'badge-completed',
            'cancelled': 'badge-cancelled'
        };
        return statusClasses[status] || '';
    }
};

// Navigation helper
navigation.updateNav = () => {
  const user = storage.getUser();
  const navLinks = document.querySelector('.nav-links');
  
  if (!navLinks) return;

  if (user.id) {
    navLinks.innerHTML = `
      <li><a href="/pages/dashboard.html">Dashboard</a></li>
      <li><a href="/pages/services.html">Services</a></li>
      ${user.role === 'Customer' ? '<li><a href="/pages/book.html">Book Now</a></li>' : ''}
      <li><a href="/pages/my-reservations.html">My Reservations</a></li>
      ${user.role === 'Admin' ? '<li><a href="/pages/admin.html">Admin Panel</a></li>' : ''}
      <li><a href="#" id="logoutLink">Logout (${user.name})</a></li>
    `;

    document.getElementById('logoutLink').addEventListener('click', e => {
      e.preventDefault();
      logout();
    });

  } else {
    navLinks.innerHTML = `
      <li><a href="/pages/services.html">Services</a></li>
      <li><a href="/pages/login.html">Login</a></li>
      <li><a href="/pages/register.html">Register</a></li>
    `;
  }
};

// Authentication check
const checkAuth = () => {
    const token = storage.getToken();
    const user = storage.getUser();
    
    if (!token || !user.id) {
        window.location.href = '/pages/login.html';
        return false;
    }
    return true;
};

// Logout function
const logout = () => {
    storage.clear();
    window.location.href = '/pages/login.html';
};

// Initialize navigation on page load
document.addEventListener('DOMContentLoaded', () => {
    navigation.updateNav();
});
