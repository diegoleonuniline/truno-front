/**
 * TRUNO - Login Module v2 DEBUG
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
      console.log('💾 Intentando guardar sesión...');
      console.log('   Token recibido:', token ? `${token.substring(0, 20)}...` : 'NULL/UNDEFINED');
      console.log('   Usuario recibido:', usuario);
      
      try {
        localStorage.setItem(CONFIG.STORAGE_KEYS.TOKEN, token);
        localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(usuario));
        
        // Verificar que se guardó
        const savedToken = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
        const savedUser = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
        console.log('✅ Verificación después de guardar:');
        console.log('   Token en localStorage:', savedToken ? 'OK' : 'FALLÓ');
        console.log('   User en localStorage:', savedUser ? 'OK' : 'FALLÓ');
      } catch (e) {
        console.error('❌ Error guardando en localStorage:', e);
      }
    },
    checkExistingSession() {
      const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
      console.log('🔍 Verificando sesión existente:', token ? 'HAY TOKEN' : 'NO HAY TOKEN');
      if (token) {
        window.location.href = CONFIG.REDIRECT.ALREADY_LOGGED;
        return true;
      }
      return false;
    },
    redirect(url) {
      console.log('🚀 Redirigiendo a:', url);
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
      console.log('📡 Llamando API login...');
      console.log('   URL:', `${CONFIG.API_URL}${CONFIG.ENDPOINTS.LOGIN}`);
      
      const response = await fetch(`${CONFIG.API_URL}${CONFIG.ENDPOINTS.LOGIN}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ correo, contrasena })
      });
      
      console.log('📥 Response status:', response.status);
      
      const data = await response.json();
      console.log('📥 Response data:', data);
      
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
      console.log('========== SUBMIT LOGIN ==========');
      
      if (isSubmitting) {
        console.log('⏳ Ya hay un submit en proceso');
        return;
      }

      const correo = elements.email.value.trim();
      const contrasena = elements.password.value;

      console.log('📝 Datos del form:');
      console.log('   Correo:', correo);
      console.log('   Password length:', contrasena.length);

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
        
        console.log('✅ Login API exitoso');
        console.log('   data.token existe:', !!data.token);
        console.log('   data.usuario existe:', !!data.usuario);
        
        utils.saveSession(data.token, data.usuario);
        localStorage.setItem(CONFIG.STORAGE_KEYS.BIOMETRIC_EMAIL, correo);
        
        // Esperar un momento antes de redirigir
        console.log('⏳ Esperando 500ms antes de redirigir...');
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Verificar una última vez
        console.log('🔍 Verificación final antes de redirect:');
        console.log('   Token:', localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN) ? 'OK' : 'VACÍO');
        console.log('   User:', localStorage.getItem(CONFIG.STORAGE_KEYS.USER) ? 'OK' : 'VACÍO');
        
        utils.redirect(CONFIG.REDIRECT.SUCCESS);
        
      } catch (error) {
        console.error('❌ Error en login:', error);
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

      const available = await utils.isBiometricAvailable();
      if (!available) {
        utils.showError('Tu dispositivo no soporta autenticación biométrica');
        return;
      }

      elements.faceIdBtn.classList.add('loading');
      elements.faceIdBtn.disabled = true;
      utils.hideError();

      try {
        const options = await api.getWebAuthnLoginOptions(savedEmail);
        options.challenge = utils.base64urlToBuffer(options.challenge);
        if (options.allowCredentials) {
          options.allowCredentials = options.allowCredentials.map(cred => ({
            ...cred,
            id: utils.base64urlToBuffer(cred.id)
          }));
        }

        const credential = await navigator.credentials.get({ publicKey: options });

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
    console.log('========== INIT LOGIN ==========');
    
    if (utils.checkExistingSession()) return;

    elements.form.addEventListener('submit', handlers.onSubmit);
    elements.passwordToggle.addEventListener('click', handlers.togglePassword);
    elements.faceIdBtn.addEventListener('click', handlers.onFaceId);
    elements.email.addEventListener('focus', handlers.onInputFocus);
    elements.password.addEventListener('focus', handlers.onInputFocus);

    const biometricAvailable = await utils.isBiometricAvailable();
    const savedEmail = localStorage.getItem(CONFIG.STORAGE_KEYS.BIOMETRIC_EMAIL);
    
    if (biometricAvailable && savedEmail) {
      elements.faceIdBtn.style.display = 'flex';
      elements.email.value = savedEmail;
    } else if (!biometricAvailable) {
      elements.faceIdBtn.style.display = 'none';
    }

    elements.email.focus();

    const urlParams = new URLSearchParams(window.location.search);
    const errorParam = urlParams.get('error');
    if (errorParam === 'session_expired') {
      utils.showError('Tu sesión ha expirado');
    }

    console.log('🚀 TRUNO Login DEBUG initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
