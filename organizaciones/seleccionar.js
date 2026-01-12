/**
 * TRUNO - Selección de Organización - DEBUG
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
      ORG: 'truno_org'
    },
    REDIRECT: {
      LOGIN: '/login/login.html',
      DASHBOARD: '/dashboard/index.html'
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
      elements.createModal.classList.add('active');
      // Bloquea el scroll del fondo mientras el modal está visible
      // Relación: `organizaciones/seleccionar.css` -> regla `body.modal-open`
      document.body.classList.add('modal-open');
      elements.orgName.focus();
    },

    closeModal() {
      elements.createModal.classList.remove('active');
      // Restaura el scroll del fondo al cerrar el modal
      // Relación: `organizaciones/seleccionar.css` -> regla `body.modal-open`
      document.body.classList.remove('modal-open');
      elements.createOrgForm.reset();
    },

    toggleUserMenu() {
      elements.userDropdown.classList.toggle('active');
    },

    closeUserMenu(e) {
      if (!elements.userMenuBtn?.contains(e.target) && !elements.userDropdown?.contains(e.target)) {
        elements.userDropdown?.classList.remove('active');
      }
    },

    async submitOrg(e) {
      e.preventDefault();

      const name = elements.orgName.value.trim();
      if (!name) {
        elements.orgName.focus();
        return;
      }

      elements.submitOrgBtn.classList.add('loading');
      elements.submitOrgBtn.disabled = true;

      try {
        const data = {
          nombre: name,
          tipo: elements.orgType?.value || 'pyme',
          rfc: elements.orgRfc?.value.trim() || null,
          correo: elements.orgEmail?.value.trim() || null
        };

        await api.createOrganization(data);
        this.closeModal();
        await this.loadOrganizations();
      } catch (error) {
        console.error('Error:', error);
        alert(error.message);
      } finally {
        elements.submitOrgBtn.classList.remove('loading');
        elements.submitOrgBtn.disabled = false;
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
