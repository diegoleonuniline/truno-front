/**
 * TRUNO - Login Module v3
 * Con Passkeys / Face ID nativo
 */

(function() {
  'use strict';

  // Usar configuración centralizada desde config.js
  // Relacionado con: config.js (configuración global)
  const CONFIG = window.TRUNO_CONFIG || {
    API_URL: 'http://localhost:3000',
    STORAGE_KEYS: {
      TOKEN: 'truno_token',
      USER: 'truno_user',
      BIOMETRIC_EMAIL: 'truno_biometric_email'
    },
    REDIRECT: {
      SUCCESS: '/organizaciones/seleccionar.html',
      DASHBOARD: '/dashboard/index.html'
    }
  };

  // Validar que CONFIG.REDIRECT.SUCCESS existe
  if (!CONFIG.REDIRECT || !CONFIG.REDIRECT.SUCCESS) {
    console.warn('⚠️ CONFIG.REDIRECT.SUCCESS no está definido, usando valor por defecto');
    CONFIG.REDIRECT = CONFIG.REDIRECT || {};
    CONFIG.REDIRECT.SUCCESS = CONFIG.REDIRECT.SUCCESS || '/organizaciones/seleccionar.html';
  }

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
  let abortController = null;

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
        window.location.href = CONFIG.REDIRECT.SUCCESS;
        return true;
      }
      return false;
    },
    redirect(url) {
      // Validar que la URL existe antes de redirigir
      // Relacionado con: config.js (configuración de rutas)
      if (!url || url === 'undefined' || url.includes('undefined')) {
        console.error('❌ Error: URL de redirección inválida:', url);
        console.error('   CONFIG.REDIRECT:', CONFIG.REDIRECT);
        // Fallback a la ruta por defecto
        url = '/organizaciones/seleccionar.html';
      }
      console.log('🔄 Redirigiendo a:', url);
      window.location.href = url;
    },
    bufferToBase64url(buffer) {
      const bytes = new Uint8Array(buffer);
      let str = '';
      for (const byte of bytes) str += String.fromCharCode(byte);
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },
    base64urlToBuffer(base64url) {
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - base64.length % 4) % 4);
      const binary = atob(base64 + padding);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    },
    async isBiometricAvailable() {
      if (!window.PublicKeyCredential) return false;
      try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch { return false; }
    }
  };

  const api = {
    async login(correo, contrasena) {
      const response = await fetch(`${CONFIG.API_URL}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');
      return data;
    },

    async getWebAuthnLoginOptions(correo) {
      const response = await fetch(`${CONFIG.API_URL}/api/auth/webauthn/login-options`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error obteniendo opciones');
      return data;
    },

    async webAuthnLogin(correo, credential) {
      const response = await fetch(`${CONFIG.API_URL}/api/auth/webauthn/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, credential })
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error de autenticación');
      return data;
    }
  };

  async function performBiometricLogin(correo, signal) {
    // 1. Obtener opciones
    const options = await api.getWebAuthnLoginOptions(correo);

    // 2. Configurar opciones para WebAuthn
    const publicKeyOptions = {
      challenge: utils.base64urlToBuffer(options.challenge),
      timeout: options.timeout || 60000,
      rpId: options.rpId,
      userVerification: 'preferred',
      allowCredentials: options.allowCredentials?.map(cred => ({
        id: utils.base64urlToBuffer(cred.id),
        type: 'public-key',
        transports: ['internal', 'hybrid']
      }))
    };

    // 3. Configurar request options
    const requestOptions = {
      publicKey: publicKeyOptions,
      mediation: 'optional'
    };

    // Solo agregar signal si existe
    if (signal) {
      requestOptions.signal = signal;
    }

    // 4. Solicitar autenticación
    const credential = await navigator.credentials.get(requestOptions);

    // 5. Preparar respuesta
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

    // 6. Enviar al servidor
    const data = await api.webAuthnLogin(correo, credentialData);
    utils.saveSession(data.token, data.usuario);
    utils.redirect(CONFIG.REDIRECT.SUCCESS);
  }

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

      if (abortController) {
        abortController.abort();
        abortController = null;
      }

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

      elements.faceIdBtn.classList.add('loading');
      elements.faceIdBtn.disabled = true;
      utils.hideError();

      try {
        await performBiometricLogin(savedEmail);
      } catch (error) {
        console.error('Face ID error:', error);
        
        if (error.name === 'NotAllowedError' || error.name === 'AbortError') {
          utils.showError('Autenticación cancelada');
        } else if (error.message.includes('No hay biometría')) {
          utils.showError('Configura Face ID desde Configuración');
          localStorage.removeItem(CONFIG.STORAGE_KEYS.BIOMETRIC_EMAIL);
        } else {
          utils.showError(error.message || 'Error de autenticación');
        }
      } finally {
        elements.faceIdBtn.classList.remove('loading');
        elements.faceIdBtn.disabled = false;
      }
    }
  };

  async function init() {
    console.log('🚀 TRUNO Login v3');
    
    if (utils.checkExistingSession()) return;

    elements.form.addEventListener('submit', handlers.onSubmit);
    elements.passwordToggle?.addEventListener('click', handlers.togglePassword);
    elements.faceIdBtn?.addEventListener('click', handlers.onFaceId);
    elements.email.addEventListener('focus', handlers.onInputFocus);
    elements.password.addEventListener('focus', handlers.onInputFocus);

    const biometricAvailable = await utils.isBiometricAvailable();
    const savedEmail = localStorage.getItem(CONFIG.STORAGE_KEYS.BIOMETRIC_EMAIL);
    
    console.log('📱 Biometric:', biometricAvailable);
    console.log('📧 Email guardado:', savedEmail ? 'SÍ' : 'NO');

    if (biometricAvailable && savedEmail) {
      elements.faceIdBtn.style.display = 'flex';
      elements.email.value = savedEmail;
    } else {
      elements.faceIdBtn.style.display = 'none';
    }

    elements.email.focus();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
