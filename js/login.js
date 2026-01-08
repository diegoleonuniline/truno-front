/**
 * TRUNO - Login Module
 * Manejo de autenticación
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURACIÓN
  // ============================================
  const CONFIG = {
    API_URL: 'https://api.truno.app', // Cambiar por tu URL real
    ENDPOINTS: {
      LOGIN: '/api/auth/login'
    },
    STORAGE_KEYS: {
      TOKEN: 'truno_token',
      USER: 'truno_user'
    },
    REDIRECT: {
      SUCCESS: '/organizations/select.html',
      ALREADY_LOGGED: '/dashboard/index.html'
    }
  };

  // ============================================
  // DOM ELEMENTS
  // ============================================
  const elements = {
    form: document.getElementById('loginForm'),
    email: document.getElementById('email'),
    password: document.getElementById('password'),
    passwordToggle: document.getElementById('passwordToggle'),
    submitBtn: document.getElementById('submitBtn'),
    faceIdBtn: document.getElementById('faceIdBtn'),
    formError: document.getElementById('formError'),
    errorMessage: document.getElementById('errorMessage')
  };

  // ============================================
  // STATE
  // ============================================
  let isSubmitting = false;

  // ============================================
  // UTILITIES
  // ============================================
  const utils = {
    // Validar email
    isValidEmail(email) {
      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      return regex.test(email);
    },

    // Mostrar error
    showError(message) {
      elements.errorMessage.textContent = message;
      elements.formError.classList.add('visible');
      elements.formError.setAttribute('aria-hidden', 'false');
    },

    // Ocultar error
    hideError() {
      elements.formError.classList.remove('visible');
      elements.formError.setAttribute('aria-hidden', 'true');
    },

    // Set loading state
    setLoading(loading) {
      isSubmitting = loading;
      elements.submitBtn.classList.toggle('loading', loading);
      elements.submitBtn.disabled = loading;
      elements.email.disabled = loading;
      elements.password.disabled = loading;
    },

    // Guardar sesión
    saveSession(token, user) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(user));
    },

    // Verificar sesión existente
    checkExistingSession() {
      const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
      if (token) {
        window.location.href = CONFIG.REDIRECT.ALREADY_LOGGED;
        return true;
      }
      return false;
    },

    // Redirect
    redirect(url) {
      window.location.href = url;
    }
  };

  // ============================================
  // API CALLS
  // ============================================
  const api = {
    async login(email, password) {
      const response = await fetch(`${CONFIG.API_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al iniciar sesión');
      }

      return data;
    }
  };

  // ============================================
  // EVENT HANDLERS
  // ============================================
  const handlers = {
    // Toggle password visibility
    togglePassword() {
      const type = elements.password.type === 'password' ? 'text' : 'password';
      elements.password.type = type;
      elements.passwordToggle.setAttribute(
        'aria-label', 
        type === 'password' ? 'Mostrar contraseña' : 'Ocultar contraseña'
      );
    },

    // Input focus - clear error
    onInputFocus() {
      utils.hideError();
      this.classList.remove('error');
    },

    // Form submit
    async onSubmit(e) {
      e.preventDefault();

      if (isSubmitting) return;

      const email = elements.email.value.trim();
      const password = elements.password.value;

      // Validaciones
      if (!email) {
        utils.showError('Ingresa tu correo electrónico');
        elements.email.classList.add('error');
        elements.email.focus();
        return;
      }

      if (!utils.isValidEmail(email)) {
        utils.showError('Ingresa un correo electrónico válido');
        elements.email.classList.add('error');
        elements.email.focus();
        return;
      }

      if (!password) {
        utils.showError('Ingresa tu contraseña');
        elements.password.classList.add('error');
        elements.password.focus();
        return;
      }

      if (password.length < 8) {
        utils.showError('La contraseña debe tener al menos 8 caracteres');
        elements.password.classList.add('error');
        elements.password.focus();
        return;
      }

      // API Call
      utils.setLoading(true);
      utils.hideError();

      try {
        const data = await api.login(email, password);
        
        // Guardar sesión
        utils.saveSession(data.token, data.user);
        
        // Redirect
        utils.redirect(CONFIG.REDIRECT.SUCCESS);

      } catch (error) {
        console.error('Login error:', error);
        utils.showError(error.message || 'Error de conexión. Intenta de nuevo.');
        elements.password.value = '';
        elements.password.focus();
      } finally {
        utils.setLoading(false);
      }
    },

    // Face ID (simulado)
    onFaceId() {
      // Verificar si hay credenciales guardadas para biometría
      const savedEmail = localStorage.getItem('truno_biometric_email');
      
      if (!savedEmail) {
        utils.showError('Primero inicia sesión para habilitar Face ID');
        return;
      }

      // En producción: usar Web Authentication API
      // navigator.credentials.get({ publicKey: ... })
      
      utils.showError('Face ID no disponible en esta versión');
    },

    // Keyboard navigation
    onKeyDown(e) {
      if (e.key === 'Enter' && e.target === elements.email) {
        e.preventDefault();
        elements.password.focus();
      }
    }
  };

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Check existing session
    if (utils.checkExistingSession()) return;

    // Event listeners
    elements.form.addEventListener('submit', handlers.onSubmit);
    elements.passwordToggle.addEventListener('click', handlers.togglePassword);
    elements.faceIdBtn.addEventListener('click', handlers.onFaceId);
    elements.email.addEventListener('focus', handlers.onInputFocus);
    elements.password.addEventListener('focus', handlers.onInputFocus);
    elements.email.addEventListener('keydown', handlers.onKeyDown);

    // Auto-focus email
    elements.email.focus();

    // Check for error params (ej: redirect desde página protegida)
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    
    if (errorParam === 'session_expired') {
      utils.showError('Tu sesión ha expirado. Inicia sesión nuevamente.');
    } else if (errorParam === 'unauthorized') {
      utils.showError('Debes iniciar sesión para continuar.');
    }

    console.log('🚀 TRUNO Login initialized');
  }

  // Run on DOM ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
