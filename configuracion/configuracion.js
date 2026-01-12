/**
 * TRUNO - Configuración Module
 * Perfil, Biometría y Seguridad
 */

(function() {
  'use strict';

  // Usar configuración centralizada desde config.js
  // Relacionado con: config.js (configuración global)
  const CONFIG = window.TRUNO_CONFIG || {
    API_URL: 'http://localhost:3000',
    STORAGE_KEYS: { TOKEN: 'truno_token', USER: 'truno_user', ORG: 'truno_org', BIOMETRIC_EMAIL: 'truno_biometric_email' },
    REDIRECT: { LOGIN: '/login/login.html', SELECT_ORG: '/organizaciones/seleccionar.html' }
  };

  const $ = id => document.getElementById(id);

  const elements = {
    sidebar: $('sidebar'),
    sidebarOverlay: $('sidebarOverlay'),
    menuToggle: $('menuToggle'),
    orgSwitcher: $('orgSwitcher'),
    orgName: $('orgName'),
    orgPlan: $('orgPlan'),
    userAvatar: $('userAvatar'),
    // Perfil
    perfilForm: $('perfilForm'),
    nombre: $('nombre'),
    apellido: $('apellido'),
    correo: $('correo'),
    // Biometría
    biometricStatus: $('biometricStatus'),
    biometricAction: $('biometricAction'),
    biometricUnsupported: $('biometricUnsupported'),
    registerBiometricBtn: $('registerBiometricBtn'),
    devicesSection: $('devicesSection'),
    devicesList: $('devicesList'),
    // Password
    passwordForm: $('passwordForm'),
    passwordActual: $('passwordActual'),
    passwordNuevo: $('passwordNuevo'),
    passwordConfirmar: $('passwordConfirmar'),
    // Logout
    logoutBtn: $('logoutBtn')
  };

  let state = { user: null, org: null, biometricSupported: false, credentials: [] };

  // Toast
  const toast = {
    container: null,
    init() {
      if (this.container) return;
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    },
    show(message, type = 'success', duration = 3000) {
      this.init();
      const el = document.createElement('div');
      el.className = `toast toast-${type}`;
      const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      };
      el.innerHTML = `<div class="toast-icon">${icons[type] || icons.info}</div><div class="toast-message">${message}</div><button class="toast-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
      this.container.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      el.querySelector('.toast-close').onclick = () => this.hide(el);
      if (duration > 0) setTimeout(() => this.hide(el), duration);
    },
    hide(el) {
      if (!el?.parentNode) return;
      el.classList.remove('show');
      el.classList.add('hide');
      setTimeout(() => el.remove(), 300);
    },
    success(m) { this.show(m, 'success'); },
    error(m) { this.show(m, 'error'); },
    info(m) { this.show(m, 'info'); }
  };

  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    setUser: u => localStorage.setItem(CONFIG.STORAGE_KEYS.USER, JSON.stringify(u)),
    redirect: url => window.location.href = url,
    getInitials: (n, a) => ((n?.charAt(0) || '') + (a?.charAt(0) || '')).toUpperCase() || '??',
    logout() {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG);
      this.redirect(CONFIG.REDIRECT.LOGIN);
    },
    // WebAuthn helpers
    bufferToBase64url(buffer) {
      const bytes = new Uint8Array(buffer);
      let str = '';
      for (const b of bytes) str += String.fromCharCode(b);
      return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
    },
    base64urlToBuffer(base64url) {
      const base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');
      const pad = '='.repeat((4 - base64.length % 4) % 4);
      const binary = atob(base64 + pad);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return bytes.buffer;
    },
    async isBiometricAvailable() {
      if (!window.PublicKeyCredential) return false;
      try {
        return await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
      } catch { return false; }
    },
    getDeviceName() {
      const ua = navigator.userAgent;
      if (/iPhone/.test(ua)) return 'iPhone';
      if (/iPad/.test(ua)) return 'iPad';
      if (/Mac/.test(ua)) return 'Mac';
      if (/Android/.test(ua)) return 'Android';
      if (/Windows/.test(ua)) return 'Windows';
      return 'Dispositivo';
    },
    formatDate(d) {
      if (!d) return '-';
      return new Date(d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    }
  };

  const api = {
    async request(endpoint, options = {}) {
      const r = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${utils.getToken()}`,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      if (r.status === 401) { utils.logout(); return; }
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error');
      return data;
    },
    updatePerfil: (data) => api.request('/api/auth/perfil', { method: 'PUT', body: JSON.stringify(data) }),
    changePassword: (data) => api.request('/api/auth/cambiar-password', { method: 'PUT', body: JSON.stringify(data) }),
    getWebAuthnRegisterOptions: () => api.request('/api/auth/webauthn/register-options', { method: 'POST' }),
    registerWebAuthn: (data) => api.request('/api/auth/webauthn/register', { method: 'POST', body: JSON.stringify(data) }),
    getWebAuthnCredentials: () => api.request('/api/auth/webauthn/credentials'),
    deleteWebAuthnCredential: (id) => api.request(`/api/auth/webauthn/credentials/${id}`, { method: 'DELETE' })
  };

  const render = {
    user() {
      if (!state.user) return;
      elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido);
      elements.nombre.value = state.user.nombre || '';
      elements.apellido.value = state.user.apellido || '';
      elements.correo.value = state.user.correo || '';
    },
    org() {
      if (!state.org) return;
      elements.orgName.textContent = state.org.nombre;
      elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`;
    },
    biometricStatus(status) {
      const statusEl = elements.biometricStatus;
      
      if (status === 'checking') {
        statusEl.innerHTML = `
          <div class="status-icon checking"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></div>
          <div class="status-info"><div class="status-title">Verificando compatibilidad...</div><div class="status-desc">Espera un momento</div></div>
        `;
        statusEl.style.display = 'flex';
      } else if (status === 'supported') {
        statusEl.innerHTML = `
          <div class="status-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div class="status-info"><div class="status-title">Biometría Disponible</div><div class="status-desc">Tu dispositivo soporta Face ID / Touch ID</div></div>
        `;
        statusEl.style.display = 'flex';
        elements.biometricAction.style.display = 'block';
        elements.biometricUnsupported.style.display = 'none';
      } else if (status === 'configured') {
        statusEl.innerHTML = `
          <div class="status-icon success"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg></div>
          <div class="status-info"><div class="status-title">Biometría Configurada ✓</div><div class="status-desc">Puedes iniciar sesión con Face ID / Touch ID</div></div>
        `;
        statusEl.style.display = 'flex';
        elements.biometricAction.style.display = 'block';
      } else {
        statusEl.style.display = 'none';
        elements.biometricAction.style.display = 'none';
        elements.biometricUnsupported.style.display = 'block';
      }
    },
    devices() {
      if (!state.credentials.length) {
        elements.devicesSection.style.display = 'none';
        return;
      }

      elements.devicesSection.style.display = 'block';
      elements.devicesList.innerHTML = state.credentials.map(c => `
        <div class="device-item">
          <div class="device-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="5" y="2" width="14" height="20" rx="2" ry="2"/>
              <line x1="12" y1="18" x2="12.01" y2="18"/>
            </svg>
          </div>
          <div class="device-info">
            <div class="device-name">${c.dispositivo || 'Dispositivo'}</div>
            <div class="device-date">Registrado: ${utils.formatDate(c.created_at)}</div>
          </div>
          <button class="btn-remove-device" data-id="${c.id}" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
            </svg>
          </button>
        </div>
      `).join('');

      // Event listeners para eliminar
      document.querySelectorAll('.btn-remove-device').forEach(btn => {
        btn.addEventListener('click', () => handlers.removeDevice(btn.dataset.id));
      });
    }
  };

  const handlers = {
    toggleSidebar() {
      elements.sidebar.classList.toggle('open');
      elements.sidebarOverlay.classList.toggle('active');
    },
    closeSidebar() {
      elements.sidebar.classList.remove('open');
      elements.sidebarOverlay.classList.remove('active');
    },
    switchOrg() {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG);
      utils.redirect(CONFIG.REDIRECT.SELECT_ORG);
    },

    async savePerfil(e) {
      e.preventDefault();
      const btn = e.target.querySelector('button[type="submit"]');
      btn.classList.add('loading');
      btn.disabled = true;

      try {
        await api.updatePerfil({
          nombre: elements.nombre.value.trim(),
          apellido: elements.apellido.value.trim()
        });

        // Actualizar localStorage
        state.user.nombre = elements.nombre.value.trim();
        state.user.apellido = elements.apellido.value.trim();
        utils.setUser(state.user);
        render.user();

        toast.success('Perfil actualizado');
      } catch (e) {
        toast.error(e.message);
      } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    },

    async changePassword(e) {
      e.preventDefault();
      
      const actual = elements.passwordActual.value;
      const nuevo = elements.passwordNuevo.value;
      const confirmar = elements.passwordConfirmar.value;

      if (!actual || !nuevo || !confirmar) {
        toast.error('Completa todos los campos');
        return;
      }

      if (nuevo.length < 8) {
        toast.error('La nueva contraseña debe tener al menos 8 caracteres');
        return;
      }

      if (nuevo !== confirmar) {
        toast.error('Las contraseñas no coinciden');
        return;
      }

      const btn = e.target.querySelector('button[type="submit"]');
      btn.classList.add('loading');
      btn.disabled = true;

      try {
        await api.changePassword({ password_actual: actual, password_nuevo: nuevo });
        toast.success('Contraseña actualizada');
        elements.passwordForm.reset();
      } catch (e) {
        toast.error(e.message);
      } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    },

    async checkBiometric() {
      render.biometricStatus('checking');
      
      state.biometricSupported = await utils.isBiometricAvailable();
      
      if (!state.biometricSupported) {
        render.biometricStatus('unsupported');
        return;
      }

      // Cargar credenciales existentes
      try {
        const res = await api.getWebAuthnCredentials();
        state.credentials = res.credentials || [];
        
        if (state.credentials.length > 0) {
          render.biometricStatus('configured');
        } else {
          render.biometricStatus('supported');
        }
        
        render.devices();
      } catch {
        render.biometricStatus('supported');
      }
    },

    async registerBiometric() {
      const btn = elements.registerBiometricBtn;
      btn.classList.add('loading');
      btn.disabled = true;

      try {
        // 1. Obtener opciones del servidor
        const options = await api.getWebAuthnRegisterOptions();
        console.log('📱 WebAuthn options:', options);

        // 2. Convertir valores
        options.challenge = utils.base64urlToBuffer(options.challenge);
        options.user.id = utils.base64urlToBuffer(options.user.id);

        // 3. Crear credencial (esto abre Face ID / Touch ID)
        console.log('🔐 Solicitando biometría...');
        const credential = await navigator.credentials.create({ publicKey: options });
        console.log('✅ Credencial creada:', credential);

        // 4. Preparar para enviar
        const credentialData = {
          id: credential.id,
          rawId: utils.bufferToBase64url(credential.rawId),
          type: credential.type,
          response: {
            attestationObject: utils.bufferToBase64url(credential.response.attestationObject),
            clientDataJSON: utils.bufferToBase64url(credential.response.clientDataJSON)
          }
        };

        // 5. Registrar en servidor
        await api.registerWebAuthn({ 
          credential: credentialData, 
          dispositivo: utils.getDeviceName() 
        });

        // 6. Guardar email localmente para login futuro
        localStorage.setItem(CONFIG.STORAGE_KEYS.BIOMETRIC_EMAIL, state.user.correo);

        toast.success('¡Face ID / Touch ID configurado correctamente!');
        
        // Recargar credenciales
        await this.checkBiometric();

      } catch (error) {
        console.error('❌ Error registrando biometría:', error);
        
        if (error.name === 'NotAllowedError') {
          toast.error('Configuración cancelada por el usuario');
        } else if (error.name === 'InvalidStateError') {
          toast.error('Este dispositivo ya está registrado');
        } else {
          toast.error(error.message || 'Error configurando biometría');
        }
      } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    },

    async removeDevice(id) {
      if (!confirm('¿Eliminar este dispositivo?')) return;

      try {
        await api.deleteWebAuthnCredential(id);
        toast.success('Dispositivo eliminado');
        await this.checkBiometric();
      } catch (e) {
        toast.error(e.message);
      }
    },

    togglePassword(e) {
      const targetId = e.currentTarget.dataset.target;
      const input = $(targetId);
      input.type = input.type === 'password' ? 'text' : 'password';
    }
  };

  function init() {
    if (!utils.getToken()) { utils.redirect(CONFIG.REDIRECT.LOGIN); return; }
    state.org = utils.getOrg();
    if (!state.org) { utils.redirect(CONFIG.REDIRECT.SELECT_ORG); return; }
    state.user = utils.getUser();

    render.user();
    render.org();

    // Sidebar
    elements.menuToggle?.addEventListener('click', () => handlers.toggleSidebar());
    elements.sidebarOverlay?.addEventListener('click', () => handlers.closeSidebar());
    elements.orgSwitcher?.addEventListener('click', () => handlers.switchOrg());

    // Forms
    elements.perfilForm?.addEventListener('submit', e => handlers.savePerfil(e));
    elements.passwordForm?.addEventListener('submit', e => handlers.changePassword(e));

    // Biometría
    elements.registerBiometricBtn?.addEventListener('click', () => handlers.registerBiometric());

    // Password toggles
    document.querySelectorAll('.password-toggle').forEach(btn => {
      btn.addEventListener('click', e => handlers.togglePassword(e));
    });

    // Logout
    elements.logoutBtn?.addEventListener('click', () => utils.logout());

    // Verificar biometría
    handlers.checkBiometric();

    console.log('🚀 TRUNO Configuración initialized');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
