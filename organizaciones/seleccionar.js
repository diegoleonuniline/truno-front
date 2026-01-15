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
    orgEmail: document.getElementById('orgEmail'),
    // Modal editar
    editModal: document.getElementById('editModal'),
    editOrgForm: document.getElementById('editOrgForm'),
    closeEditModalBtn: document.getElementById('closeEditModalBtn'),
    cancelEditModalBtn: document.getElementById('cancelEditModalBtn'),
    submitEditOrgBtn: document.getElementById('submitEditOrgBtn'),
    editOrgName: document.getElementById('editOrgName'),
    // Modal estado (baja/activar)
    estadoModal: document.getElementById('estadoModal'),
    estadoForm: document.getElementById('estadoForm'),
    closeEstadoModalBtn: document.getElementById('closeEstadoModalBtn'),
    cancelEstadoModalBtn: document.getElementById('cancelEstadoModalBtn'),
    submitEstadoBtn: document.getElementById('submitEstadoBtn'),
    estadoTitle: document.getElementById('estadoTitle'),
    estadoText: document.getElementById('estadoText'),
    // Filtro inactivas
    orgFilters: document.getElementById('orgFilters'),
    toggleInactiveBtn: document.getElementById('toggleInactiveBtn'),
    toggleInactiveLabel: document.getElementById('toggleInactiveLabel'),
    inactiveCount: document.getElementById('inactiveCount')
  };

  let state = {
    user: null,
    organizations: [],
    isLoading: false,
    editingOrg: null,
    estadoOrg: null,
    estadoActivo: null,
    showInactive: false
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

  // ========== TOAST SYSTEM (estilo TRUNO) ==========
  // Relación:
  // - truno-front/organizaciones/seleccionar.css -> estilos .toast-*
  const toast = {
    container: null,
    init() {
      if (this.container) return;
      this.container = document.createElement('div');
      this.container.className = 'toast-container';
      document.body.appendChild(this.container);
    },
    show(message, type = 'warning', duration = 2500) {
      this.init();
      const toastEl = document.createElement('div');
      toastEl.className = `toast toast-${type}`;
      const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
      };
      toastEl.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.warning}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close" type="button" aria-label="Cerrar">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
          </svg>
        </button>
      `;
      this.container.appendChild(toastEl);
      requestAnimationFrame(() => toastEl.classList.add('show'));
      const closeBtn = toastEl.querySelector('.toast-close');
      closeBtn?.addEventListener('click', () => this.hide(toastEl));
      if (duration > 0) setTimeout(() => this.hide(toastEl), duration);
      return toastEl;
    },
    hide(toastEl) {
      if (!toastEl || !toastEl.parentNode) return;
      toastEl.classList.remove('show');
      toastEl.classList.add('hide');
      setTimeout(() => toastEl.remove(), 220);
    },
    success(msg, duration) { return this.show(msg, 'success', duration ?? 2200); },
    error(msg, duration) { return this.show(msg, 'error', duration ?? 3200); },
    warning(msg, duration) { return this.show(msg, 'warning', duration ?? 2600); }
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
    },

    /**
     * Actualizar organización (nombre).
     * Relación:
     * - truno-back/src/routes/organizaciones.routes.js -> PUT /api/organizaciones/:id
     */
    async updateOrganization(id, data) {
      const response = await fetch(`${CONFIG.API_URL}/api/organizaciones/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${utils.getToken()}`,
          // IMPORTANTE: el backend requiere contexto de organización para permisos
          // Relación: truno-back/src/middlewares/auth.middleware.js -> requireOrg
          'X-Organization-Id': id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(data)
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || payload.mensaje || 'Error al actualizar organización');
      }
      return payload;
    },

    /**
     * Dar de baja / reactivar organización.
     * Relación:
     * - truno-back/src/routes/organizaciones.routes.js -> PUT /api/organizaciones/:id/estado
     */
    async setOrganizationEstado(id, activo) {
      const response = await fetch(`${CONFIG.API_URL}/api/organizaciones/${id}/estado`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${utils.getToken()}`,
          // IMPORTANTE: el backend requiere contexto de organización para permisos
          // Relación: truno-back/src/middlewares/auth.middleware.js -> requireOrg
          'X-Organization-Id': id,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ activo })
      });

      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(payload.error || payload.mensaje || 'Error al cambiar estado');
      }
      return payload;
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
        if (elements.orgFilters) elements.orgFilters.style.display = 'none';
        return;
      }

      const isInactive = (o) => (o.activo === 0 || o.activo === false);
      const inactivas = orgs.filter(isInactive);
      const activas = orgs.filter(o => !isInactive(o));

      // Mostrar/ocultar filtro
      if (elements.orgFilters) {
        elements.orgFilters.style.display = inactivas.length ? 'flex' : 'none';
      }
      if (elements.inactiveCount) elements.inactiveCount.textContent = String(inactivas.length || 0);
      if (elements.toggleInactiveBtn) {
        elements.toggleInactiveBtn.classList.toggle('active', !!state.showInactive);
        if (elements.toggleInactiveLabel) {
          elements.toggleInactiveLabel.textContent = state.showInactive ? 'Ocultar empresas inactivas' : 'Ver empresas inactivas';
        }
      }

      // Filtrar lista a renderizar
      const listToRender = state.showInactive ? [...activas, ...inactivas] : activas;

      // Si no hay activas pero sí inactivas y el toggle está apagado, mostrar mensaje útil
      if (!listToRender.length && inactivas.length && !state.showInactive) {
        if (elements.emptyState) {
          elements.emptyState.style.display = 'block';
          elements.orgList.style.display = 'none';
          elements.emptyState.innerHTML = `
            <div class="org-empty-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 21h18"/><path d="M9 8h1"/><path d="M9 12h1"/>
                <path d="M9 16h1"/><path d="M14 8h1"/><path d="M14 12h1"/>
                <path d="M14 16h1"/><path d="M5 21V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16"/>
              </svg>
            </div>
            <h3 class="org-empty-title">No hay empresas activas</h3>
            <p class="org-empty-text">Tienes ${inactivas.length} empresa(s) inactiva(s). Usa “Ver empresas inactivas” para activarlas.</p>
          `;
        }
        return;
      }

      elements.orgList.innerHTML = listToRender.map(org => {
        const isAdmin = org.rol === 'propietario' || org.rol === 'administrador';
        const inactive = isInactive(org);
        return `
        <div class="org-card ${inactive ? 'inactive' : ''}" data-org-id="${org.id}" data-org='${JSON.stringify(org).replace(/'/g, "&#39;")}'>
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
              ${inactive ? `<span class="org-status-badge">Baja</span>` : ''}
            </div>
          </div>
          ${isAdmin ? `
            <div class="org-actions">
              <button type="button" class="org-action-btn" data-action="edit" title="Editar nombre">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button type="button" class="org-action-btn danger" data-action="estado" title="${inactive ? 'Reactivar' : 'Dar de baja'}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M12 2v4"/><path d="M12 18v4"/>
                  <path d="M4.93 4.93l2.83 2.83"/><path d="M16.24 16.24l2.83 2.83"/>
                  <path d="M2 12h4"/><path d="M18 12h4"/>
                  <path d="M4.93 19.07l2.83-2.83"/><path d="M16.24 7.76l2.83-2.83"/>
                </svg>
              </button>
            </div>
          ` : ''}
          <svg class="org-arrow" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18l6-6-6-6"/>
          </svg>
        </div>
      `;
      }).join('');

      elements.orgList.style.display = 'flex';
      elements.emptyState.style.display = 'none';

      document.querySelectorAll('.org-card').forEach(card => {
        card.addEventListener('click', () => handlers.selectOrg(card));
      });

      // Acciones: editar / estado (stopPropagation para no seleccionar org al dar click)
      document.querySelectorAll('.org-action-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const card = btn.closest('.org-card');
          if (!card) return;
          const org = JSON.parse(card.dataset.org.replace(/&#39;/g, "'"));
          const action = btn.dataset.action;
          if (action === 'edit') handlers.openEditModal(org);
          if (action === 'estado') handlers.openEstadoModal(org);
        });
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
      // No permitir seleccionar una empresa inactiva (solo administrar: activar/editar)
      if (org.activo === 0 || org.activo === false) {
        // Requisito:
        // - Al seleccionar empresa inactiva: SOLO mostrar aviso (no abrir modal).
        toast.warning('Empresa inactiva. Usa el botón de reactivar para activarla.');
        return;
      }
      utils.saveOrg(org);
      utils.redirect(CONFIG.REDIRECT.DASHBOARD);
    },
    toggleInactive() {
      state.showInactive = !state.showInactive;
      render.organizations(state.organizations);
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

    openEditModal(org) {
      state.editingOrg = org;
      if (elements.editOrgName) elements.editOrgName.value = org?.nombre || '';
      elements.editModal?.classList.add('active');
      document.body.classList.add('modal-open');
      elements.editOrgName?.focus();
    },

    closeEditModal() {
      elements.editModal?.classList.remove('active');
      document.body.classList.remove('modal-open');
      state.editingOrg = null;
      elements.editOrgForm?.reset();
    },

    async submitEditOrg(e) {
      e.preventDefault();
      if (!state.editingOrg?.id) return;
      const nombre = elements.editOrgName?.value?.trim();
      if (!nombre) return;

      elements.submitEditOrgBtn?.classList.add('loading');
      if (elements.submitEditOrgBtn) elements.submitEditOrgBtn.disabled = true;
      try {
        await api.updateOrganization(state.editingOrg.id, { nombre });
        this.closeEditModal();
        await this.loadOrganizations();
        toast.success('Empresa actualizada');
      } catch (err) {
        toast.error(err.message);
      } finally {
        elements.submitEditOrgBtn?.classList.remove('loading');
        if (elements.submitEditOrgBtn) elements.submitEditOrgBtn.disabled = false;
      }
    },

    openEstadoModal(org) {
      state.estadoOrg = org;
      const isInactive = (org.activo === 0 || org.activo === false);
      state.estadoActivo = isInactive ? 1 : 0; // si estaba inactiva -> reactivar
      if (elements.estadoTitle) elements.estadoTitle.textContent = isInactive ? 'Reactivar empresa' : 'Dar de baja empresa';
      if (elements.estadoText) {
        elements.estadoText.textContent = isInactive
          ? `¿Deseas reactivar la empresa "${org.nombre}"?`
          : `¿Deseas dar de baja la empresa "${org.nombre}"? (No se eliminará, solo quedará inactiva)`;
      }
      elements.estadoModal?.classList.add('active');
      document.body.classList.add('modal-open');
    },

    closeEstadoModal() {
      elements.estadoModal?.classList.remove('active');
      document.body.classList.remove('modal-open');
      state.estadoOrg = null;
      state.estadoActivo = null;
      elements.estadoForm?.reset();
    },

    async submitEstado(e) {
      e.preventDefault();
      if (!state.estadoOrg?.id || state.estadoActivo === null) return;

      // Guardar acción antes de cerrar modal (closeEstadoModal limpia el state)
      const willBeActive = state.estadoActivo === true || state.estadoActivo === 1 || state.estadoActivo === '1';

      elements.submitEstadoBtn?.classList.add('loading');
      if (elements.submitEstadoBtn) elements.submitEstadoBtn.disabled = true;
      try {
        await api.setOrganizationEstado(state.estadoOrg.id, state.estadoActivo);
        this.closeEstadoModal();
        await this.loadOrganizations();
        toast.success(willBeActive ? 'Empresa reactivada correctamente' : 'Empresa dada de baja correctamente');
      } catch (err) {
        toast.error(err.message);
      } finally {
        elements.submitEstadoBtn?.classList.remove('loading');
        if (elements.submitEstadoBtn) elements.submitEstadoBtn.disabled = false;
      }
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
        toast.error(error.message);
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
    elements.toggleInactiveBtn?.addEventListener('click', () => handlers.toggleInactive());
    elements.closeModalBtn?.addEventListener('click', () => handlers.closeModal());
    elements.cancelModalBtn?.addEventListener('click', () => handlers.closeModal());
    elements.createOrgForm?.addEventListener('submit', (e) => handlers.submitOrg(e));
    // Edit modal
    elements.closeEditModalBtn?.addEventListener('click', () => handlers.closeEditModal());
    elements.cancelEditModalBtn?.addEventListener('click', () => handlers.closeEditModal());
    elements.editOrgForm?.addEventListener('submit', (e) => handlers.submitEditOrg(e));
    elements.editModal?.addEventListener('click', (e) => { if (e.target === elements.editModal) handlers.closeEditModal(); });
    // Estado modal
    elements.closeEstadoModalBtn?.addEventListener('click', () => handlers.closeEstadoModal());
    elements.cancelEstadoModalBtn?.addEventListener('click', () => handlers.closeEstadoModal());
    elements.estadoForm?.addEventListener('submit', (e) => handlers.submitEstado(e));
    elements.estadoModal?.addEventListener('click', (e) => { if (e.target === elements.estadoModal) handlers.closeEstadoModal(); });

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
        handlers.closeEditModal();
        handlers.closeEstadoModal();
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
