/**
 * TRUNO - Dashboard v2
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
    saldoTotal: document.getElementById('saldoTotal'),
    ingresosMes: document.getElementById('ingresosMes'),
    egresosMes: document.getElementById('egresosMes'),
    porCobrar: document.getElementById('porCobrar'),
    transactionList: document.getElementById('transactionList'),
    pendingList: document.getElementById('pendingList'),
    ventasPendientes: document.getElementById('ventasPendientes'),
    gastosPendientes: document.getElementById('gastosPendientes'),
    fabBtn: document.getElementById('fabBtn')
  };

  let state = {
    user: null,
    org: null
  };

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
      if (!dateStr) return '-';
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

  const api = {
    async request(endpoint, options = {}) {
      try {
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
          return null;
        }

        if (!response.ok) {
          console.error(`API Error: ${endpoint}`, response.status);
          return null;
        }

        return response.json();
      } catch (e) {
        console.error(`API Error: ${endpoint}`, e);
        return null;
      }
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

  const render = {
    user() {
      if (!state.user) return;
      elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido);
      elements.userFullName.textContent = `${state.user.nombre || ''} ${state.user.apellido || ''}`.trim() || 'Usuario';
    },

    org() {
      if (!state.org) return;
      elements.orgName.textContent = state.org.nombre;
      elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`;
    },

    stats(data) {
      elements.saldoTotal.textContent = utils.formatMoney(data.saldoTotal);
      elements.ingresosMes.textContent = utils.formatMoney(data.ingresos);
      elements.egresosMes.textContent = utils.formatMoney(data.egresos);
      elements.porCobrar.textContent = utils.formatMoney(data.porCobrar);

      if (data.porCobrarCant > 0) {
        elements.ventasPendientes.textContent = data.porCobrarCant;
        elements.ventasPendientes.style.display = 'flex';
      } else {
        elements.ventasPendientes.style.display = 'none';
      }
      
      if (data.porPagarCant > 0) {
        elements.gastosPendientes.textContent = data.porPagarCant;
        elements.gastosPendientes.style.display = 'flex';
      } else {
        elements.gastosPendientes.style.display = 'none';
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
            <div class="transaction-desc">${t.descripcion || 'Sin descripción'}</div>
            <div class="transaction-meta">${t.nombre_cuenta || '-'} • ${utils.formatDate(t.fecha)}</div>
          </div>
          <div class="transaction-amount ${t.tipo}">
            ${t.tipo === 'ingreso' ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto))}
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

      elements.pendingList.innerHTML = items.slice(0, 5).map(p => {
        const isVenta = p.tipo === 'venta';
        const isOverdue = p.fecha_vencimiento && utils.isOverdue(p.fecha_vencimiento);
        
        return `
          <div class="pending-item">
            <div class="pending-icon ${isVenta ? 'venta' : 'gasto'}">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                ${isVenta 
                  ? '<line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>'
                  : '<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>'}
              </svg>
            </div>
            <div class="pending-info">
              <div class="pending-name">${p.descripcion || 'Sin descripción'}</div>
              <div class="pending-date ${isOverdue ? 'vencido' : ''}">
                ${p.fecha_vencimiento ? (isOverdue ? '⚠️ Vencido: ' : 'Vence: ') + utils.formatDate(p.fecha_vencimiento) : 'Sin vencimiento'}
              </div>
            </div>
            <div class="pending-amount ${isVenta ? 'ingreso' : 'egreso'}">${utils.formatMoney(p.monto)}</div>
          </div>
        `;
      }).join('');
    }
  };

  const handlers = {
    async loadDashboard() {
      try {
        const [txRes, ventasRes, gastosRes, cuentasRes] = await Promise.all([
          api.getTransacciones(),
          api.getVentas(),
          api.getGastos(),
          api.getCuentas()
        ]);

        const transacciones = txRes?.transacciones || [];
        const ventas = ventasRes?.ventas || [];
        const gastos = gastosRes?.gastos || [];
        const cuentas = cuentasRes?.cuentas || [];

        // Calcular estadísticas
        const now = new Date();
        const m = now.getMonth();
        const y = now.getFullYear();
        
        let ingresos = 0, egresos = 0, porCobrar = 0, porPagar = 0;
        let porCobrarCant = 0, porPagarCant = 0;

        // Ingresos y egresos del mes
        transacciones.forEach(t => {
          const f = new Date(t.fecha);
          if (f.getMonth() === m && f.getFullYear() === y) {
            const monto = parseFloat(t.monto) || 0;
            if (t.tipo === 'ingreso') ingresos += monto;
            else egresos += monto;
          }
        });

        // Ventas por cobrar (saldo > 0)
        ventas.forEach(v => {
          const total = parseFloat(v.total) || 0;
          const cobrado = parseFloat(v.monto_cobrado) || 0;
          const saldo = total - cobrado;
          
          if (saldo > 0) {
            porCobrar += saldo;
            porCobrarCant++;
          }
        });

        // Gastos por pagar
        gastos.forEach(g => {
          const total = parseFloat(g.total) || 0;
          const pagado = parseFloat(g.monto_pagado) || 0;
          const saldo = total - pagado;
          
          if (g.estatus_pago !== 'pagado' && saldo > 0) {
            porPagar += saldo;
            porPagarCant++;
          }
        });

        // Saldo total de cuentas
        const saldoTotal = cuentas.reduce((sum, c) => sum + (parseFloat(c.saldo_actual) || 0), 0);

        // Render stats
        render.stats({
          saldoTotal,
          ingresos,
          egresos,
          porCobrar,
          porCobrarCant,
          porPagarCant
        });

        // Render transacciones recientes
        render.transactions(transacciones);

        // Preparar y ordenar pendientes
        const pendientes = [];
        
        // Ventas pendientes
        ventas.forEach(v => {
          const total = parseFloat(v.total) || 0;
          const cobrado = parseFloat(v.monto_cobrado) || 0;
          const saldo = total - cobrado;
          
          if (saldo > 0) {
            pendientes.push({
              tipo: 'venta',
              descripcion: v.nombre_contacto || v.folio || v.concepto || 'Venta',
              monto: saldo,
              fecha_vencimiento: v.fecha_vencimiento
            });
          }
        });
        
        // Gastos pendientes
        gastos.forEach(g => {
          const total = parseFloat(g.total) || 0;
          const pagado = parseFloat(g.monto_pagado) || 0;
          const saldo = total - pagado;
          
          if (g.estatus_pago !== 'pagado' && saldo > 0) {
            pendientes.push({
              tipo: 'gasto',
              descripcion: g.nombre_proveedor || g.concepto || 'Gasto',
              monto: saldo,
              fecha_vencimiento: g.fecha_vencimiento
            });
          }
        });

        // Ordenar: vencidos primero, luego por fecha
        pendientes.sort((a, b) => {
          const aDate = a.fecha_vencimiento ? new Date(a.fecha_vencimiento) : new Date('2099-12-31');
          const bDate = b.fecha_vencimiento ? new Date(b.fecha_vencimiento) : new Date('2099-12-31');
          return aDate - bDate;
        });
        
        render.pending(pendientes);

        console.log('📊 Dashboard cargado:', { saldoTotal, ingresos, egresos, porCobrar, porPagar });
      } catch (e) {
        console.error('Error loading dashboard:', e);
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
      if (!elements.userMenuBtn?.contains(e.target) && !elements.userDropdown?.contains(e.target)) {
        elements.userDropdown?.classList.remove('active');
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
      utils.redirect('/truno-front/transacciones/index.html');
    }
  };

  function init() {
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

    render.user();
    render.org();

    // Event listeners
    elements.menuToggle?.addEventListener('click', handlers.toggleSidebar);
    elements.sidebarOverlay?.addEventListener('click', handlers.closeSidebar);
    elements.userMenuBtn?.addEventListener('click', handlers.toggleUserMenu);
    elements.logoutBtn?.addEventListener('click', handlers.logout);
    elements.switchOrgBtn?.addEventListener('click', handlers.switchOrg);
    elements.orgSwitcher?.addEventListener('click', handlers.switchOrg);
    elements.fabBtn?.addEventListener('click', handlers.newTransaction);
    document.addEventListener('click', handlers.closeUserMenu);

    handlers.loadDashboard();

    console.log('🚀 TRUNO Dashboard v2');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
