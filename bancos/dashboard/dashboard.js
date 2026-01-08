/**
 * TRUNO - Dashboard
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
      SELECT_ORG: '/truno-front/organizaciones/seleccionar.html'
    }
  };

  const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    menuToggle: document.getElementById('menuToggle'),
    userMenuBtn: document.getElementById('userMenuBtn'),
    userDropdown: document.getElementById('userDropdown'),
    userAvatar: document.getElementById('userAvatar'),
    userFullName: document.getElementById('userFullName'),
    logoutBtn: document.getElementById('logoutBtn'),
    switchOrgBtn: document.getElementById('switchOrgBtn'),
    orgSwitcher: document.getElementById('orgSwitcher'),
    orgName: document.getElementById('orgName'),
    orgPlan: document.getElementById('orgPlan'),
    // Stats
    saldoTotal: document.getElementById('saldoTotal'),
    ingresosMes: document.getElementById('ingresosMes'),
    egresosMes: document.getElementById('egresosMes'),
    porCobrar: document.getElementById('porCobrar'),
    // Lists
    transactionList: document.getElementById('transactionList'),
    pendingList: document.getElementById('pendingList'),
    // Badges
    ventasPendientes: document.getElementById('ventasPendientes'),
    gastosPendientes: document.getElementById('gastosPendientes'),
    // FAB
    fabBtn: document.getElementById('fabBtn')
  };

  let state = {
    user: null,
    org: null
  };

  // ============================================
  // UTILITIES
  // ============================================
  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    
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

    formatMoney(amount, currency = 'MXN') {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency
      }).format(amount || 0);
    },

    formatDate(dateStr) {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    },

    isOverdue(dateStr) {
      if (!dateStr) return false;
      return new Date(dateStr) < new Date();
    }
  };

  // ============================================
  // API
  // ============================================
  const api = {
    async request(endpoint, options = {}) {
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${utils.getToken()}`,
          'X-Organization-Id': state.org?.id,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (response.status === 401) {
        utils.logout();
        return;
      }

      if (!response.ok) {
        throw new Error('Error en la petición');
      }

      return response.json();
    },

    getDashboard(periodo = 'month') {
      return this.request(`/api/reportes/dashboard?periodo=${periodo}`);
    }
  };

  // ============================================
  // RENDER
  // ============================================
  const render = {
    user() {
      if (!state.user) return;
      elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido);
      elements.userFullName.textContent = `${state.user.nombre} ${state.user.apellido}`;
    },

    org() {
      if (!state.org) return;
      elements.orgName.textContent = state.org.nombre;
      elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`;
    },

    stats(data) {
      elements.saldoTotal.textContent = utils.formatMoney(data.saldo?.total);
      elements.ingresosMes.textContent = utils.formatMoney(data.flujo_efectivo?.ingresos);
      elements.egresosMes.textContent = utils.formatMoney(data.flujo_efectivo?.egresos);
      elements.porCobrar.textContent = utils.formatMoney(data.pendientes?.por_cobrar);

      // Badges
      if (data.pendientes?.por_cobrar_cantidad > 0) {
        elements.ventasPendientes.textContent = data.pendientes.por_cobrar_cantidad;
        elements.ventasPendientes.style.display = 'block';
      }
      if (data.pendientes?.por_pagar_cantidad > 0) {
        elements.gastosPendientes.textContent = data.pendientes.por_pagar_cantidad;
        elements.gastosPendientes.style.display = 'block';
      }
    },

    transactions(transactions) {
      if (!transactions || !transactions.length) {
        elements.transactionList.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
              <line x1="1" y1="10" x2="23" y2="10"/>
            </svg>
            <p>Sin transacciones recientes</p>
          </div>
        `;
        return;
      }

      elements.transactionList.innerHTML = transactions.slice(0, 5).map(t => `
        <div class="transaction-item">
          <div class="transaction-icon ${t.tipo}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${t.tipo === 'ingreso' 
                ? '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/>'
                : '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/><polyline points="17 18 23 18 23 12"/>'}
            </svg>
          </div>
          <div class="transaction-info">
            <div class="transaction-desc">${t.descripcion}</div>
            <div class="transaction-meta">${t.nombre_cuenta} • ${utils.formatDate(t.fecha)}</div>
          </div>
          <div class="transaction-amount ${t.tipo}">
            ${t.tipo === 'ingreso' ? '+' : '-'}${utils.formatMoney(t.monto)}
          </div>
        </div>
      `).join('');
    },

    pending(porCobrar, porPagar) {
      // Combinar y ordenar por fecha
      const items = [];
      
      // Simular datos de pendientes (normalmente vendría de la API)
      if (!items.length) {
        elements.pendingList.innerHTML = `
          <div class="empty-state">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
              <polyline points="22 4 12 14.01 9 11.01"/>
            </svg>
            <p>No hay pagos pendientes</p>
          </div>
        `;
        return;
      }

      elements.pendingList.innerHTML = items.map(p => `
        <div class="pending-item">
          <div class="pending-info">
            <div class="pending-name">${p.nombre}</div>
            <div class="pending-date ${utils.isOverdue(p.fecha_vencimiento) ? 'vencido' : ''}">
              Vence: ${utils.formatDate(p.fecha_vencimiento)}
            </div>
          </div>
          <div class="pending-amount">${utils.formatMoney(p.monto)}</div>
        </div>
      `).join('');
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handlers = {
    async loadDashboard() {
      try {
        const data = await api.getDashboard();
        render.stats(data);
        render.transactions(data.transacciones_recientes);
      } catch (error) {
        console.error('Error loading dashboard:', error);
      }
    },

    toggleSidebar() {
      elements.sidebar.classList.toggle('open');
      elements.sidebarOverlay.classList.toggle('active');
    },

    closeSidebar() {
      elements.sidebar.classList.remove('open');
      elements.sidebarOverlay.classList.remove('active');
    },

    toggleUserMenu() {
      elements.userDropdown.classList.toggle('active');
    },

    closeUserMenu(e) {
      if (!elements.userMenuBtn.contains(e.target) && !elements.userDropdown.contains(e.target)) {
        elements.userDropdown.classList.remove('active');
      }
    },

    logout() {
      utils.logout();
    },

    switchOrg() {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG);
      utils.redirect(CONFIG.REDIRECT.SELECT_ORG);
    },

    newTransaction() {
      utils.redirect('/truno-front/transacciones/nueva.html');
    }
  };

  // ============================================
  // INIT
  // ============================================
  function init() {
    // Check auth
    if (!utils.getToken()) {
      utils.redirect(CONFIG.REDIRECT.LOGIN);
      return;
    }

    // Check org
    state.org = utils.getOrg();
    if (!state.org) {
      utils.redirect(CONFIG.REDIRECT.SELECT_ORG);
      return;
    }

    state.user = utils.getUser();

    // Render initial data
    render.user();
    render.org();

    // Event listeners
    elements.menuToggle.addEventListener('click', handlers.toggleSidebar);
    elements.sidebarOverlay.addEventListener('click', handlers.closeSidebar);
    elements.userMenuBtn.addEventListener('click', handlers.toggleUserMenu);
    elements.logoutBtn.addEventListener('click', handlers.logout);
    elements.switchOrgBtn.addEventListener('click', handlers.switchOrg);
    elements.orgSwitcher.addEventListener('click', handlers.switchOrg);
    elements.fabBtn.addEventListener('click', handlers.newTransaction);
    document.addEventListener('click', handlers.closeUserMenu);

    // Load data
    handlers.loadDashboard();

    console.log('🚀 TRUNO Dashboard initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
