/**
 * TRUNO - Módulo Compartido de Menú y Perfil
 * Maneja el sidebar, header con menú de usuario y funcionalidad de perfil
 * Relacionado con: todas las páginas del frontend que requieren navegación
 */

(function() {
  'use strict';

  // Usar configuración centralizada desde config.js
  // Relacionado con: config.js (configuración global)
  const CONFIG = window.TRUNO_CONFIG || {
    API_URL: 'http://localhost:3000',
    STORAGE_KEYS: { TOKEN: 'truno_token', USER: 'truno_user', ORG: 'truno_org' },
    REDIRECT: { LOGIN: '/login/login.html', SELECT_ORG: '/organizaciones/seleccionar.html' }
  };

  const $ = id => document.getElementById(id);

  // Elementos del menú que se inicializarán
  const elements = {
    sidebar: $('sidebar'),
    sidebarOverlay: $('sidebarOverlay'),
    sidebarClose: $('sidebarClose'),
    menuToggle: $('menuToggle'),
    userMenuBtn: $('userMenuBtn'),
    userDropdown: $('userDropdown'),
    userAvatar: $('userAvatar'),
    userFullName: $('userFullName'),
    logoutBtn: $('logoutBtn'),
    sidebarLogoutBtn: $('sidebarLogoutBtn'),
    switchOrgBtn: $('switchOrgBtn'),
    orgSwitcher: $('orgSwitcher'),
    orgName: $('orgName'),
    orgPlan: $('orgPlan')
  };

  let state = {
    user: null,
    org: null
  };

  // Utilidades compartidas
  // Relacionado con: funcionalidad de autenticación y navegación
  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: url => window.location.href = url,
    logout() {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.TOKEN);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.USER);
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG);
      this.redirect(CONFIG.REDIRECT.LOGIN);
    },
    getInitials(n, a) { 
      return (n?.charAt(0) || '') + (a?.charAt(0) || '') || '??'; 
    }
  };

  // Renderizado de datos del usuario y organización
  // Relacionado con: visualización de información en el header y sidebar
  const render = {
    user() {
      if (!state.user) return;
      if (elements.userAvatar) {
        elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido);
      }
      if (elements.userFullName) {
        elements.userFullName.textContent = `${state.user.nombre || ''} ${state.user.apellido || ''}`.trim() || 'Usuario';
      }
    },

    org() {
      if (!state.org) return;
      if (elements.orgName) elements.orgName.textContent = state.org.nombre;
      if (elements.orgPlan) elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`;
    }
  };

  // Handlers de eventos del menú
  // Relacionado con: interacción del usuario con el sidebar y menú de perfil
  const handlers = {
    openSidebar() {
      if (elements.sidebar) elements.sidebar.classList.add('open');
      if (elements.sidebarOverlay) elements.sidebarOverlay.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    closeSidebar() {
      if (elements.sidebar) elements.sidebar.classList.remove('open');
      if (elements.sidebarOverlay) elements.sidebarOverlay.classList.remove('active');
      document.body.style.overflow = '';
    },

    toggleSidebar() {
      if (elements.sidebar?.classList.contains('open')) {
        this.closeSidebar();
      } else {
        this.openSidebar();
      }
    },

    toggleUserMenu() {
      if (elements.userDropdown) {
        elements.userDropdown.classList.toggle('active');
      }
    },

    closeUserMenu(e) {
      if (!elements.userMenuBtn?.contains(e.target) && !elements.userDropdown?.contains(e.target)) {
        if (elements.userDropdown) {
          elements.userDropdown.classList.remove('active');
        }
      }
    },

    logout() {
      utils.logout();
    },

    switchOrg() {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG);
      utils.redirect(CONFIG.REDIRECT.SELECT_ORG);
    }
  };

  // Función de inicialización del menú
  // Relacionado con: setup inicial de todas las páginas
  function init() {
    // Verificar autenticación
    if (!utils.getToken()) { 
      utils.redirect(CONFIG.REDIRECT.LOGIN); 
      return; 
    }
    
    state.org = utils.getOrg();
    if (!state.org) { 
      utils.redirect(CONFIG.REDIRECT.SELECT_ORG); 
      return; 
    }
    
    state.user = utils.getUser();

    // Renderizar información del usuario y organización
    render.user();
    render.org();

    // Event listeners del sidebar
    // Relacionado con: funcionalidad de navegación móvil y desktop
    if (elements.menuToggle) {
      // Usar capture + stopImmediatePropagation para evitar conflictos
      // con listeners duplicados de los módulos específicos (bancos.js, ventas.js, etc.)
      elements.menuToggle.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handlers.toggleSidebar();
      }, true);
    }
    if (elements.sidebarOverlay) {
      elements.sidebarOverlay.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handlers.closeSidebar();
      }, true);
    }
    if (elements.sidebarClose) {
      elements.sidebarClose.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handlers.closeSidebar();
      }, true);
    }

    // Event listeners del menú de usuario
    // Relacionado con: funcionalidad de perfil y logout
    if (elements.userMenuBtn) {
      elements.userMenuBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handlers.toggleUserMenu();
      }, true);
    }
    if (elements.logoutBtn) {
      elements.logoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handlers.logout();
      }, true);
    }
    if (elements.sidebarLogoutBtn) {
      elements.sidebarLogoutBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handlers.logout();
      }, true);
    }
    if (elements.switchOrgBtn) {
      elements.switchOrgBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handlers.switchOrg();
      }, true);
    }
    if (elements.orgSwitcher) {
      elements.orgSwitcher.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        handlers.switchOrg();
      }, true);
    }

    // Cerrar menú de usuario al hacer click fuera
    document.addEventListener('click', e => handlers.closeUserMenu(e));

    // Cerrar sidebar al hacer click en un nav-item (en móvil)
    // Relacionado con: mejor UX en dispositivos móviles
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          handlers.closeSidebar();
        }
      });
    });

    // Resize handler para cerrar sidebar si cambia a desktop
    // Relacionado con: comportamiento responsive
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        handlers.closeSidebar();
      }
    });

    // Marcar el item activo en el sidebar según la página actual
    // IMPORTANTE: NO comparar solo "index.html" porque todas las rutas lo comparten.
    // Relacionado con: indicador visual de página actual
    const normalizePath = (p) => (p || '').replace(/\/+$/, '');
    const currentPath = normalizePath(new URL(window.location.href).pathname);

    // Limpiar cualquier "active" hardcodeado para evitar múltiples items activos
    document.querySelectorAll('.sidebar .nav-item.active').forEach(el => el.classList.remove('active'));
    document.querySelectorAll('.bottom-nav .bottom-nav-item.active').forEach(el => el.classList.remove('active'));

    // Sidebar
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (!href) return;
      try {
        const linkPath = normalizePath(new URL(href, window.location.href).pathname);
        if (linkPath === currentPath) item.classList.add('active');
      } catch (_) {
        // Si el href es inválido, no marcamos activo
      }
    });

    // Bottom nav (si existe)
    document.querySelectorAll('.bottom-nav .bottom-nav-item').forEach(item => {
      const href = item.getAttribute('href');
      if (!href) return;
      try {
        const linkPath = normalizePath(new URL(href, window.location.href).pathname);
        if (linkPath === currentPath) item.classList.add('active');
      } catch (_) {
        // noop
      }
    });
  }

  // Inicializar cuando el DOM esté listo
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Exportar funciones útiles para uso en otros módulos
  // Relacionado con: integración con otros scripts de las páginas
  window.TRUNO_MENU = {
    render: render,
    handlers: handlers,
    utils: utils,
    state: state
  };
})();
