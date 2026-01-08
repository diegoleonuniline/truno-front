/**
 * TRUNO - Selección de Organización
 */

(function() {
  'use strict';

  // ============================================
  // CONFIGURACIÓN
  // ============================================
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

  // ============================================
  // DOM ELEMENTS
  // ============================================
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
    // Form fields
    orgName: document.getElementById('orgName'),
    orgType: document.getElementById('orgType'),
    orgRfc: document.getElementById('orgRfc'),
    orgEmail: document.getElementById('orgEmail')
  };

  // ============================================
  // STATE
  // ============================================
  let state = {
    user: null,
    organizations: [],
    isLoading: false
  };

  // ============================================
  // UTILITIES
  // ============================================
  const utils = {
    getToken() {
      return localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN);
    },

    getUser() {
      const user = localStorage.getItem(CONFIG.STORAGE_KEYS.USER);
      return user ? JSON.parse(user) : null;
    },

    saveOrg(org) {
      localStorage.setItem(CONFIG.STORAGE_KEYS.ORG, JSON.stringify(org));
    },

    redirect(url) {
      window.location.href = url;
    },

    logout() {
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

  // ============================================
  // API CALLS
  // ============================================
  const api = {
    async getOrganizations() {
      const response = await fetch(`${CONFIG.API_URL}/api/auth/me`, {
        headers: {
          'Authorization': `Bearer ${utils.getToken()}`
        }
      });

      if (!response.ok) {
        if (response.status === 401) {
          utils.logout();
          return;
        }
        throw new Error('Error al obtener organizaciones');
      }

      return response.json();
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

  // ============================================
  // RENDER
  // ============================================
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
      if (!orgs.length) {
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
              <span class="org-plan">Plan ${org.plan || 'free'}</span>
            </div>
          </div>
          <svg class="org-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      `).join('');

      elements.orgList.style.display = 'flex';
      elements.emptyState.style.display = 'none';

      // Add click handlers
      document.querySelectorAll('.org-card').forEach(card => {
        card.addEventListener('click', () => handlers.selectOrg(card));
      });
    },

    user(user) {
      if (!user) return;
      elements.userAvatar.textContent = utils.getInitials(user.nombre, user.apellido);
      elements.userName.textContent = `${user.nombre} ${user.apellido}`;
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handlers = {
    async loadOrganizations() {
      render.showLoading();

      try {
        const data = await api.getOrganizations();
        state.user = data.usuario;
        state.organizations = data.organizaciones;

        render.user(state.user);
        render.organizations(state.organizations);
      } catch (error) {
        console.error('Error:', error);
        render.showEmpty();
      } finally {
        render.hideLoading();
      }
    },

    selectOrg(card) {
      const org = JSON.parse(card.dataset.org.replace(/&#39;/g, "'"));
      utils.saveOrg(org);
      utils.redirect(CONFIG.REDIRECT.DASHBOARD);
    },

    openModal() {
      elements.createModal.classList.add('active');
      elements.orgName.focus();
    },

    closeModal() {
      elements.createModal.classList.remove('active');
      elements.createOrgForm.reset();
    },

    toggleUserMenu() {
      elements.userDropdown.classList.toggle('active');
    },

    closeUserMenu(e) {
      if (!elements.userMenuBtn.contains(e.target) && !elements.userDropdown.contains(e.target)) {
        elements.userDropdown.classList.remove('active');
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
          tipo: elements.orgType.value,
          rfc: elements.orgRfc.value.trim() || null,
          correo: elements.orgEmail.value.trim() || null
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

  // ============================================
  // INITIALIZATION
  // ============================================
  function init() {
    // Check auth
    if (!utils.getToken()) {
      utils.redirect(CONFIG.REDIRECT.LOGIN);
      return;
    }

    // Event listeners
    elements.createOrgBtn.addEventListener('click', () => handlers.openModal());
    elements.closeModalBtn.addEventListener('click', () => handlers.closeModal());
    elements.cancelModalBtn.addEventListener('click', () => handlers.closeModal());
    elements.createOrgForm.addEventListener('submit', (e) => handlers.submitOrg(e));
    elements.userMenuBtn.addEventListener('click', () => handlers.toggleUserMenu());
    elements.logoutBtn.addEventListener('click', () => handlers.logout());
    document.addEventListener('click', (e) => handlers.closeUserMenu(e));

    // Close modal on overlay click
    elements.createModal.addEventListener('click', (e) => {
      if (e.target === elements.createModal) {
        handlers.closeModal();
      }
    });

    // Close modal on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        handlers.closeModal();
        elements.userDropdown.classList.remove('active');
      }
    });

    // Load data
    handlers.loadOrganizations();

    console.log('🚀 TRUNO Organizaciones initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
