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
      let date;
      if (typeof dateStr === 'string') {
        if (dateStr.includes('T')) dateStr = dateStr.split('T')[0];
        if (dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(dateStr + 'T12:00:00');
        } else {
          date = new Date(dateStr);
        }
      } else {
        date = new Date(dateStr);
      }
      if (isNaN(date.getTime())) return '-';
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
    },
    getTransacciones() {
      return this.request('/api/transacciones?limite=10');
    },
    getVentas() {
      return this.request('/api/ventas?limite=100');
    },
    getGastos() {
      return this.request('/api/gastos?limite=100');
    },
    getCuentas() {
      return this.request('/api/cuentas-bancarias');
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

    pending(items) {
      if (!items || !items.length) {
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
          <div class="pending-icon ${p.tipo}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${p.tipo === 'venta' 
                ? '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'
                : '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'}
            </svg>
          </div>
          <div class="pending-info">
            <div class="pending-name">${p.descripcion || 'Sin descripción'}</div>
            <div class="pending-date ${p.fecha_vencimiento && utils.isOverdue(p.fecha_vencimiento) ? 'vencido' : ''}">
              ${p.fecha_vencimiento ? 'Vence: ' + utils.formatDate(p.fecha_vencimiento) : 'Sin vencimiento'}
            </div>
          </div>
          <div class="pending-amount ${p.tipo === 'venta' ? 'ingreso' : 'egreso'}">${utils.formatMoney(p.monto)}</div>
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
        // Intentar cargar del endpoint de dashboard primero
        const data = await api.getDashboard();
        render.stats(data);
        render.transactions(data.transacciones_recientes);
        render.pending(data.pendientes_pago || []);
      } catch (error) {
        console.log('Dashboard endpoint failed, loading from individual sources...');
        // Si falla, cargar de fuentes individuales
        await this.loadFromSources();
      }
    },

    async loadFromSources() {
      try {
        const [txRes, ventasRes, gastosRes, cuentasRes] = await Promise.all([
          api.getTransacciones().catch(() => ({ transacciones: [] })),
          api.getVentas().catch(() => ({ ventas: [] })),
          api.getGastos().catch(() => ({ gastos: [] })),
          api.getCuentas().catch(() => ({ cuentas: [] }))
        ]);

        const transacciones = txRes.transacciones || [];
        const ventas = ventasRes.ventas || [];
        const gastos = gastosRes.gastos || [];
        const cuentas = cuentasRes.cuentas || [];

        // Calcular estadísticas
        const now = new Date(), m = now.getMonth(), y = now.getFullYear();
        let ingresos = 0, egresos = 0, porCobrar = 0, porPagar = 0;
        let porCobrarCant = 0, porPagarCant = 0;

        transacciones.forEach(t => {
          const f = new Date(t.fecha);
          if (f.getMonth() === m && f.getFullYear() === y) {
            if (t.tipo === 'ingreso') ingresos += parseFloat(t.monto) || 0;
            else egresos += parseFloat(t.monto) || 0;
          }
        });

        ventas.forEach(v => {
          if (v.estatus_pago !== 'pagado' && v.estatus !== 'cobrada') {
            porCobrar += (parseFloat(v.total) || 0) - (parseFloat(v.monto_cobrado) || 0);
            porCobrarCant++;
          }
        });

        gastos.forEach(g => {
          if (g.estatus_pago !== 'pagado') {
            porPagar += parseFloat(g.total) || 0;
            porPagarCant++;
          }
        });

        const saldoTotal = cuentas.reduce((sum, c) => sum + (parseFloat(c.saldo_actual) || 0), 0);

        // Render stats
        elements.saldoTotal.textContent = utils.formatMoney(saldoTotal);
        elements.ingresosMes.textContent = utils.formatMoney(ingresos);
        elements.egresosMes.textContent = utils.formatMoney(egresos);
        elements.porCobrar.textContent = utils.formatMoney(porCobrar);

        if (porCobrarCant > 0) {
          elements.ventasPendientes.textContent = porCobrarCant;
          elements.ventasPendientes.style.display = 'block';
        }
        if (porPagarCant > 0) {
          elements.gastosPendientes.textContent = porPagarCant;
          elements.gastosPendientes.style.display = 'block';
        }

        // Render transacciones recientes
        render.transactions(transacciones);

        // Render pendientes
        const pendientes = [
          ...ventas.filter(v => v.estatus_pago !== 'pagado' && v.estatus !== 'cobrada').map(v => ({
            tipo: 'venta', descripcion: v.folio || 'Venta', monto: v.total, fecha_vencimiento: v.fecha_vencimiento
          })),
          ...gastos.filter(g => g.estatus_pago !== 'pagado').map(g => ({
            tipo: 'gasto', descripcion: g.concepto || 'Gasto', monto: g.total, fecha_vencimiento: g.fecha_vencimiento
          }))
        ].sort((a, b) => new Date(a.fecha_vencimiento || '2099-12-31') - new Date(b.fecha_vencimiento || '2099-12-31'));
        
        render.pending(pendientes.slice(0, 5));
      } catch (e) {
        console.error('Error loading from sources:', e);
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
