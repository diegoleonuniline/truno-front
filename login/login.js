/**
 * TRUNO - Login Module v2
 * Con soporte para Face ID / Touch ID
 */

(function() {
  'use strict';

  const CONFIG = {
    API_URL: 'https://truno-9bbbe9cf4d78.herokuapp.com',
    ENDPOINTS: {
      LOGIN: '/api/auth/login',
      WEBAUTHN_LOGIN_OPTIONS: '/api/auth/webauthn/login-options',
      WEBAUTHN_LOGIN: '/api/auth/webauthn/login'
    },
    STORAGE_KEYS: {
      TOKEN: 'truno_token',
      USER: 'truno_user',
      BIOMETRIC_EMAIL: 'truno_biometric_email'
    },
    REDIRECT: {
      SUCCESS: '/truno-front/organizaciones/seleccionar.html',
      ALREADY_LOGGED: '/truno-front/dashboard/index.html'
    }
  };

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

  let isSubmitting = false;

  const utils = {
    isValidEmail(email) {
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    },
    showError(message) {
      elements.errorMessage.textContent = message;
      elements.formError.classList.add('visible');
    },
    hideError() {
      elements.formError.classList.remove('visible');
    },
    setLoading(loading) {
      isSubmitting = loading;
      elements.submitBtn.classList.toggle('loading', loading);
      elements.submitBtn.disabled = loading;
      elements.email.disabled = loading;
      elements.password.disabled = loading;
    },
    saveSession(token, usuario) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
      localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(usuario));
    },
    checkExistingSession() {
      const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
      if (token) {
        window.location.href = CONFIG.REDIRECT.ALREADY_LOGGED;
        return true;
      }
      return false;
    },
    redirect(url) {
      window.location.href = url;
    },
    
    // WebAuthn helpers
    bufferToBase64url(buffer) {
      const bytes = new Uint8Array(buffer);
      let str = '';
      for (const byte of bytes) {
        str += String.fromCharCode(byte);
      }
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },
    base64urlToBuffer(base64url) {
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const binary = atob(base64 + padding);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i);
      }
      return bytes.buffer;
    },

    // Verificar soporte de biometría
    async isBiometricAvailable() {
      if (!window.PublicKeyCredential) return false;
      try {
        const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
      } catch {
        return false;
      }
    }
  };

  const api = {
    async login(correo, contrasena) {
      const response = await fetch(`${CONFIG.API_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');
      return data;
    },

    async getWebAuthnLoginOptions(correo) {
      const response = await fetch(`${CONFIG.API_URL}${CONFIG.ENDPOINTS.WEBAUTHN_LOGIN_OPTIONS}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error obteniendo opciones');
      return data;
    },

    async webAuthnLogin(correo, credential) {
      const response = await fetch(`${CONFIG.API_URL}${CONFIG.ENDPOINTS.WEBAUTHN_LOGIN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, credential })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error de autenticación');
      return data;
    }
  };

  const handlers = {
    togglePassword() {
      const type = elements.password.type === 'password' ? 'text' : 'password';
      elements.password.type = type;
    },

    onInputFocus() {
      utils.hideError();
      this.classList.remove('error');
    },

    async onSubmit(e) {
      e.preventDefault();
      if (isSubmitting) return;

      const correo = elements.email.value.trim();
      const contrasena = elements.password.value;

      if (!correo || !utils.isValidEmail(correo)) {
        utils.showError('Ingresa un correo electrónico válido');
        elements.email.classList.add('error');
        elements.email.focus();
        return;
      }

      if (!contrasena || contrasena.length < 8) {
        utils.showError('La contraseña debe tener al menos 8 caracteres');
        elements.password.classList.add('error');
        elements.password.focus();
        return;
      }

      utils.setLoading(true);
      utils.hideError();

      try {
        const data = await api.login(correo, contrasena);
        utils.saveSession(data.token, data.usuario);
        
        // Guardar email para biometría futura
        localStorage.setItem(CONFIG.STORAGE_KEYS.BIOMETRIC_EMAIL, correo);
        
        utils.redirect(CONFIG.REDIRECT.SUCCESS);
      } catch (error) {
        utils.showError(error.message || 'Error de conexión');
        elements.password.value = '';
        elements.password.focus();
      } finally {
        utils.setLoading(false);
      }
    },

    async onFaceId() {
      const savedEmail = localStorage.getItem(CONFIG.STORAGE_KEYS.BIOMETRIC_EMAIL);
      
      if (!savedEmail) {
        utils.showError('Inicia sesión primero para configurar Face ID');
        return;
      }

      // Verificar soporte
      const available = await utils.isBiometricAvailable();
      if (!available) {
        utils.showError('Tu dispositivo no soporta autenticación biométrica');
        return;
      }

      elements.faceIdBtn.classList.add('loading');
      elements.faceIdBtn.disabled = true;
      utils.hideError();

      try {
        // 1. Obtener opciones del servidor
        const options = await api.getWebAuthnLoginOptions(savedEmail);

        // 2. Convertir challenge y allowCredentials
        options.challenge = utils.base64urlToBuffer(options.challenge);
        if (options.allowCredentials) {
          options.allowCredentials = options.allowCredentials.map(cred => ({
            ...cred,
            id: utils.base64urlToBuffer(cred.id)
          }));
        }

        // 3. Solicitar autenticación biométrica
        const credential = await navigator.credentials.get({ publicKey: options });

        // 4. Preparar respuesta
        const credentialData = {
          id: credential.id,
          rawId: utils.bufferToBase64url(credential.rawId),
          type: credential.type,
          response: {
            authenticatorData: utils.bufferToBase64url(credential.response.authenticatorData),
            clientDataJSON: utils.bufferToBase64url(credential.response.clientDataJSON),
            signature: utils.bufferToBase64url(credential.response.signature)
          }
        };

        // 5. Enviar al servidor
        const data = await api.webAuthnLogin(savedEmail, credentialData);
        utils.saveSession(data.token, data.usuario);
        utils.redirect(CONFIG.REDIRECT.SUCCESS);

      } catch (error) {
        console.error('Face ID error:', error);
        
        if (error.name === 'NotAllowedError') {
          utils.showError('Autenticación cancelada');
        } else if (error.message.includes('No hay biometría')) {
          utils.showError('Configura Face ID desde tu perfil después de iniciar sesión');
          localStorage.removeItem(CONFIG.STORAGE_KEYS.BIOMETRIC_EMAIL);
        } else {
          utils.showError(error.message || 'Error de autenticación biométrica');
        }
      } finally {
        elements.faceIdBtn.classList.remove('loading');
        elements.faceIdBtn.disabled = false;
      }
    }
  };

  async function init() {
    if (utils.checkExistingSession()) return;

    // Event listeners
    elements.form.addEventListener('submit', handlers.onSubmit);
    elements.passwordToggle.addEventListener('click', handlers.togglePassword);
    elements.faceIdBtn.addEventListener('click', handlers.onFaceId);
    elements.email.addEventListener('focus', handlers.onInputFocus);
    elements.password.addEventListener('focus', handlers.onInputFocus);

    // Verificar soporte biométrico
    const biometricAvailable = await utils.isBiometricAvailable();
    const savedEmail = localStorage.getItem(CONFIG.STORAGE_KEYS.BIOMETRIC_EMAIL);
    
    if (biometricAvailable && savedEmail) {
      elements.faceIdBtn.style.display = 'flex';
      elements.email.value = savedEmail;
    } else if (!biometricAvailable) {
      elements.faceIdBtn.style.display = 'none';
    }

    elements.email.focus();

    // Verificar errores en URL
    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'session_expired') {
      utils.showError('Tu sesión ha expirado');
    }

    console.log('🚀 TRUNO Login v2 initialized');
    console.log('📱 Biometric available:', biometricAvailable);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
