/**
 * TRUNO - Selección de Organización - DEBUG
 */

(function() {
  'use strict';

  const CONFIG = {
    API_URL: 'https://truno-9bbbe9cf4d78.herokuapp.com',
    STORAGE_KEYS: {
      TOKEN: 'truno_token',
      USER: 'truno_user',
      ORG: 'truno_org'
    },
    REDIRECT: {
      LOGIN: '/truno-front/login/login.html',
      DASHBOARD: '/truno-front/dashboard/index.html'
    }
  };

  const elements = {
    loadingState: document.getElementById('loadingState'),
    orgList: document.getElementById('orgList'),
    emptyState: document.getElementById('emptyState'),
    createOrgBtn: document.getElementById('createOrgBtn'),
    createModal: document.getElementById('createModal'),
    createOrgForm: document.getElementById('createOrgForm'),
    closeModalBtn: document.getElementById('closeModalBtn'),
    cancelModalBtn: document.getElementById('cancelModalBtn'),
    submitOrgBtn: document.getElementById('submitOrgBtn'),
    createOrgError: document.getElementById('createOrgError'),
    toastContainer: document.getElementById('toastContainer'),
    userMenuBtn: document.getElementById('userMenuBtn'),
    userDropdown: document.getElementById('userDropdown'),
    userAvatar: document.getElementById('userAvatar'),
    userName: document.getElementById('userName'),
    logoutBtn: document.getElementById('logoutBtn'),
    profileBtn: document.getElementById('profileBtn'),
    orgName: document.getElementById('orgName'),
    orgType: document.getElementById('orgType'),
    orgRfc: document.getElementById('orgRfc'),
    orgEmail: document.getElementById('orgEmail')
  };

  let state = {
    user: null,
    organizations: [],
    isLoading: false
  };

  const utils = {
    getToken() {
      const token = localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
      console.log('🔑 getToken:', token ? `${token.substring(0, 30)}...` : 'NULL');
      return token;
    },

    getUser() {
      const user = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    },

    saveOrg(org) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ORG, JSON.stringify(org));
    },

    redirect(url) {
      console.log('🚀 Redirigiendo a:', url);
      window.location.href = url;
    },

    logout() {
      console.log('🚪 LOGOUT - Borrando sesión');
      localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG);
      this.redirect(CONFIG.REDIRECT.LOGIN);
    },

    getInitials(nombre, apellido) {
      const n = nombre ? nombre.charAt(0).toUpperCase() : '';
      const a = apellido ? apellido.charAt(0).toUpperCase() : '';
      return n + a || '??';
    },

    getRoleLabel(rol) {
      const roles = {
        'propietario': 'Propietario',
        'administrador': 'Administrador',
        'usuario': 'Usuario',
        'visualizador': 'Visualizador'
      };
      return roles[rol] || rol;
    }
  };

  /**
   * UI helpers (relacionado con seleccionar.html: #createOrgError y #toastContainer)
   * - Evita usar alert() para errores de creación (mejor UX + no bloquea)
   */
  const ui = {
    clearCreateError() {
      if (!elements.createOrgError) return;
      elements.createOrgError.style.display = 'none';
      elements.createOrgError.textContent = '';
    },

    showCreateError(message) {
      if (!elements.createOrgError) return;
      elements.createOrgError.textContent = message;
      elements.createOrgError.style.display = 'block';
    },

    /**
     * Toast simple (CSS en seleccionar.css)
     * type: 'success' | 'error'
     */
    showToast({ title, message, type = 'success', durationMs = 3500 }) {
      if (!elements.toastContainer) return;

      const toast = document.createElement('div');
      toast.className = `toast toast--${type}`;

      // Contenido minimalista y accesible
      toast.innerHTML = `
        <div>
          <div class="toast-title">${title || (type === 'error' ? 'Ocurrió un error' : 'Listo')}</div>
          <div class="toast-message">${message || ''}</div>
        </div>
      `;

      elements.toastContainer.appendChild(toast);

      window.setTimeout(() => {
        toast.style.animation = 'toastOut 180ms ease forwards';
        window.setTimeout(() => toast.remove(), 220);
      }, durationMs);
    }
  };

  const validators = {
    normalizeRFC(value) {
      return (value || '').toString().toUpperCase().replace(/\s+/g, '');
    },

    isValidRFC(value) {
      // RFC genérico MX: 12 (PF) o 13 (PM) caracteres.
      // Formato básico: 3-4 letras (&/Ñ), 6 dígitos de fecha, 3 alfanum.
      const rfc = this.normalizeRFC(value);
      if (!rfc) return true; // opcional
      if (rfc.length !== 12 && rfc.length !== 13) return false;
      return /^[A-Z&Ñ]{3,4}\d{6}[A-Z0-9]{3}$/.test(rfc);
    }
  };

  const api = {
    async getOrganizations() {
      const token = utils.getToken();
      console.log('📡 Llamando /api/auth/me...');
      console.log('📡 Token a enviar:', token ? 'SÍ HAY' : 'NO HAY');
      
      const response = await fetch(`${CONFIG.API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      console.log('📥 Response status:', response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.log('❌ Error response:', errorData);
        
        if (response.status === 401) {
          console.log('⚠️ 401 - NO hacemos logout, solo mostramos error');
          // NO hacer logout automático para debuggear
          throw new Error('Token inválido - revisa la consola');
        }
        throw new Error('Error al obtener organizaciones');
      }

      const data = await response.json();
      console.log('✅ Response data:', data);
      return data;
    },

    async createOrganization(data) {
      const response = await fetch(`${CONFIG.API_URL}/api/organizaciones`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${utils.getToken()}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Error al crear organización');
      }

      return response.json();
    }
  };

  const render = {
    showLoading() {
      elements.loadingState.style.display = 'flex';
      elements.orgList.style.display = 'none';
      elements.emptyState.style.display = 'none';
    },

    hideLoading() {
      elements.loadingState.style.display = 'none';
    },

    showEmpty() {
      elements.emptyState.style.display = 'block';
      elements.orgList.style.display = 'none';
    },

    organizations(orgs) {
      console.log('🏢 Renderizando', orgs.length, 'organizaciones');
      
      if (!orgs || !orgs.length) {
        this.showEmpty();
        return;
      }

      elements.orgList.innerHTML = orgs.map(org => `
        <div class="org-card" data-org-id="${org.id}" data-org='${JSON.stringify(org).replace(/'/g, "&#39;")}'>
          <div class="org-icon">
            ${org.url_logo 
              ? `<img src="${org.url_logo}" alt="${org.nombre}">`
              : `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 21h18"/><path d="M9 8h1"/><path d="M9 12h1"/>
                  <path d="M9 16h1"/><path d="M14 8h1"/><path d="M14 12h1"/>
                  <path d="M14 16h1"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
                </svg>`
            }
          </div>
          <div class="org-info">
            <h3 class="org-name">${org.nombre}</h3>
            <div class="org-meta">
              <span class="org-role ${org.rol}">${utils.getRoleLabel(org.rol)}</span>
            </div>
          </div>
          <svg class="org-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      `).join('');

      elements.orgList.style.display = 'flex';
      elements.emptyState.style.display = 'none';

      document.querySelectorAll('.org-card').forEach(card => {
        card.addEventListener('click', () => handlers.selectOrg(card));
      });
    },

    user(user) {
      if (!user) return;
      elements.userAvatar.textContent = utils.getInitials(user.nombre, user.apellido);
      elements.userName.textContent = `${user.nombre || ''} ${user.apellido || ''}`.trim();
    }
  };

  const handlers = {
    async loadOrganizations() {
      console.log('========== CARGANDO ORGANIZACIONES ==========');
      render.showLoading();

      try {
        const data = await api.getOrganizations();
        state.user = data.usuario;
        state.organizations = data.organizaciones || [];

        console.log('👤 Usuario:', state.user);
        console.log('🏢 Organizaciones:', state.organizations);

        render.user(state.user);
        render.organizations(state.organizations);
      } catch (error) {
        console.error('❌ Error cargando organizaciones:', error);
        // Mostrar el error en la página en vez de redirigir
        if (elements.emptyState) {
          elements.emptyState.innerHTML = `
            <div style="color: #ef4444; padding: 20px; text-align: center;">
              <h3>Error: ${error.message}</h3>
              <p>Token actual: ${utils.getToken() ? 'Existe' : 'NO EXISTE'}</p>
              <button onclick="location.reload()" style="margin-top: 10px; padding: 10px 20px; cursor: pointer;">
                Reintentar
              </button>
            </div>
          `;
          elements.emptyState.style.display = 'block';
        }
      } finally {
        render.hideLoading();
      }
    },

    selectOrg(card) {
      const org = JSON.parse(card.dataset.org.replace(/&#39;/g, "'"));
      console.log('✅ Organización seleccionada:', org);
      utils.saveOrg(org);
      utils.redirect(CONFIG.REDIRECT.DASHBOARD);
    },

    openModal() {
      // DEBUG/Robustez: asegura que el overlay sea visible aunque otro CSS lo esconda.
      // Relacionado con seleccionar.html: #createModal
      // Cierra menú de usuario si estaba abierto (evita overlays simultáneos)
      elements.userDropdown?.classList.remove('active');
      elements.userMenuBtn?.setAttribute?.('aria-expanded', 'false');

      elements.createModal.classList.add('active');
      elements.createModal.setAttribute('aria-hidden', 'false');
      // Fuerza visibilidad por inline styles (se limpia en closeModal)
      elements.createModal.style.opacity = '1';
      elements.createModal.style.visibility = 'visible';
      elements.createModal.style.display = 'flex';
      document.body.style.overflow = 'hidden'; // evita scroll de fondo (móvil)
      ui.clearCreateError();
      elements.orgName.focus();
    },

    closeModal() {
      elements.createModal.classList.remove('active');
      elements.createModal.setAttribute('aria-hidden', 'true');
      // Limpia forzados de openModal
      elements.createModal.style.opacity = '';
      elements.createModal.style.visibility = '';
      elements.createModal.style.display = '';
      elements.createOrgForm.reset();
      document.body.style.overflow = ''; // restaura scroll
      ui.clearCreateError();

      // Limpia resaltados de validación
      [elements.orgName, elements.orgRfc, elements.orgEmail].forEach((el) => el?.classList.remove('invalid'));

      // Regresa el foco al botón que abre el modal (mejor accesibilidad)
      elements.createOrgBtn?.focus?.();
    },

    toggleUserMenu() {
      elements.userDropdown.classList.toggle('active');
      // Mantiene aria-expanded sincronizado (definido en seleccionar.html)
      if (elements.userMenuBtn) {
        const isOpen = elements.userDropdown.classList.contains('active');
        elements.userMenuBtn.setAttribute('aria-expanded', String(isOpen));
      }
    },

    closeUserMenu(e) {
      if (!elements.userMenuBtn?.contains(e.target) && !elements.userDropdown?.contains(e.target)) {
        elements.userDropdown?.classList.remove('active');
        elements.userMenuBtn?.setAttribute?.('aria-expanded', 'false');
      }
    },

    async submitOrg(e) {
      e.preventDefault();

      ui.clearCreateError();
      [elements.orgName, elements.orgRfc, elements.orgEmail].forEach((el) => el?.classList.remove('invalid'));

      const name = elements.orgName.value.trim();
      if (!name) {
        elements.orgName.classList.add('invalid');
        ui.showCreateError('Por favor ingresa el nombre de la empresa.');
        elements.orgName.focus();
        return;
      }

      // Normaliza RFC mientras el usuario escribe/pega
      const rfcNormalized = validators.normalizeRFC(elements.orgRfc?.value);
      if (elements.orgRfc) elements.orgRfc.value = rfcNormalized;
      if (!validators.isValidRFC(rfcNormalized)) {
        elements.orgRfc?.classList.add('invalid');
        ui.showCreateError('El RFC no parece válido. Revisa que tenga 12–13 caracteres y el formato correcto.');
        elements.orgRfc?.focus?.();
        return;
      }

      // Validación nativa de email (si se completó)
      const emailValue = elements.orgEmail?.value?.trim() || '';
      if (emailValue && elements.orgEmail && !elements.orgEmail.checkValidity()) {
        elements.orgEmail.classList.add('invalid');
        ui.showCreateError('El correo empresarial no es válido.');
        elements.orgEmail.focus();
        return;
      }

      elements.submitOrgBtn.classList.add('loading');
      elements.submitOrgBtn.disabled = true;
      elements.cancelModalBtn && (elements.cancelModalBtn.disabled = true);
      elements.closeModalBtn && (elements.closeModalBtn.disabled = true);

      try {
        const data = {
          nombre: name,
          tipo: elements.orgType?.value || 'pyme',
          rfc: rfcNormalized || null,
          correo: emailValue || null
        };

        await api.createOrganization(data);
        this.closeModal();
        await this.loadOrganizations();
        ui.showToast({ title: 'Empresa creada', message: 'Ya puedes seleccionarla para comenzar.' , type: 'success' });
      } catch (error) {
        console.error('Error:', error);
        ui.showCreateError(error.message || 'Error al crear la empresa.');
        ui.showToast({ title: 'No se pudo crear', message: error.message || 'Inténtalo de nuevo.', type: 'error' });
        // alert(error.message); // Reemplazado por mensaje inline + toast (mejor UX, no bloquea).
      } finally {
        elements.submitOrgBtn.classList.remove('loading');
        elements.submitOrgBtn.disabled = false;
        elements.cancelModalBtn && (elements.cancelModalBtn.disabled = false);
        elements.closeModalBtn && (elements.closeModalBtn.disabled = false);
      }
    },

    logout() {
      utils.logout();
    }
  };

  function init() {
    console.log('========== INIT SELECCIONAR ORG ==========');
    
    // Verificar token
    const token = utils.getToken();
    console.log('🔐 Token al iniciar:', token ? 'SÍ EXISTE' : 'NO EXISTE');
    
    if (!token) {
      console.log('⚠️ Sin token, redirigiendo a login...');
      utils.redirect(CONFIG.REDIRECT.LOGIN);
      return;
    }

    // Event listeners
    elements.createOrgBtn?.addEventListener('click', () => handlers.openModal());
    elements.closeModalBtn?.addEventListener('click', () => handlers.closeModal());
    elements.cancelModalBtn?.addEventListener('click', () => handlers.closeModal());
    elements.createOrgForm?.addEventListener('submit', (e) => handlers.submitOrg(e));
    // Normaliza RFC en tiempo real (relacionado con seleccionar.html: #orgRfc)
    elements.orgRfc?.addEventListener('input', () => {
      elements.orgRfc.value = validators.normalizeRFC(elements.orgRfc.value);
    });
    elements.userMenuBtn?.addEventListener('click', () => handlers.toggleUserMenu());
    elements.logoutBtn?.addEventListener('click', () => handlers.logout());
    document.addEventListener('click', (e) => handlers.closeUserMenu(e));

    elements.createModal?.addEventListener('click', (e) => {
      if (e.target === elements.createModal) {
        handlers.closeModal();
      }
    });

    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        handlers.closeModal();
        elements.userDropdown?.classList.remove('active');
        elements.userMenuBtn?.setAttribute?.('aria-expanded', 'false');
      }
    });

    // Cargar organizaciones
    handlers.loadOrganizations();

    console.log('🚀 TRUNO Organizaciones DEBUG initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
