/**
 * TRUNO - Super Dashboard v3
 * Con gráficos, filtros, análisis completo y navegación móvil
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
    orgPlan: $('orgPlan'),
    fechaDesde: $('fechaDesde'),
    fechaHasta: $('fechaHasta'),
    applyDates: $('applyDates'),
    saldoTotal: $('saldoTotal'),
    totalIngresos: $('totalIngresos'),
    totalEgresos: $('totalEgresos'),
    balance: $('balance'),
    porCobrar: $('porCobrar'),
    porPagar: $('porPagar'),
    txIngresos: $('txIngresos'),
    txEgresos: $('txEgresos'),
    ventasPend: $('ventasPend'),
    gastosPend: $('gastosPend'),
    listPorCobrar: $('listPorCobrar'),
    listPorPagar: $('listPorPagar'),
    listTransacciones: $('listTransacciones'),
    chartFlujo: $('chartFlujo'),
    chartCategorias: $('chartCategorias'),
    chartProveedores: $('chartProveedores'),
    chartClientes: $('chartClientes'),
    chartCuentas: $('chartCuentas')
  };

  let state = {
    user: null,
    org: null,
    fechaDesde: null,
    fechaHasta: null,
    transacciones: [],
    ventas: [],
    gastos: [],
    cuentas: [],
    categorias: [],
    charts: {}
  };

  // Colores para gráficos
  const COLORS = {
    primary: '#6366f1',
    success: '#10b981',
    error: '#ef4444',
    warning: '#f59e0b',
    info: '#3b82f6',
    palette: ['#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e', '#f97316', '#eab308', '#84cc16', '#22c55e', '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6']
  };

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
    getInitials(n, a) { return (n?.charAt(0) || '') + (a?.charAt(0) || '') || '??'; },
    formatMoney(amount, currency = 'MXN') {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount || 0);
    },
    formatMoneyShort(amount) {
      if (Math.abs(amount) >= 1000000) return '$' + (amount / 1000000).toFixed(1) + 'M';
      if (Math.abs(amount) >= 1000) return '$' + (amount / 1000).toFixed(1) + 'K';
      return '$' + amount.toFixed(0);
    },
    formatDate(d) {
      if (!d) return '-';
      const date = new Date(d.includes('T') ? d : d + 'T12:00:00');
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
    },
    formatDateFull(d) {
      if (!d) return '-';
      const date = new Date(d.includes('T') ? d : d + 'T12:00:00');
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    isOverdue(d) { return d && new Date(d) < new Date(); },
    today() { return new Date().toISOString().split('T')[0]; },
    startOfMonth() {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().split('T')[0];
    },
    endOfMonth() {
      const d = new Date();
      return new Date(d.getFullYear(), d.getMonth() + 1, 0).toISOString().split('T')[0];
    },
    startOfWeek() {
      const d = new Date();
      const day = d.getDay();
      const diff = d.getDate() - day + (day === 0 ? -6 : 1);
      return new Date(d.setDate(diff)).toISOString().split('T')[0];
    },
    startOfQuarter() {
      const d = new Date();
      const q = Math.floor(d.getMonth() / 3);
      return new Date(d.getFullYear(), q * 3, 1).toISOString().split('T')[0];
    },
    startOfYear() {
      return new Date(new Date().getFullYear(), 0, 1).toISOString().split('T')[0];
    },
    getDaysInRange(start, end) {
      const days = [];
      const current = new Date(start + 'T12:00:00');
      const endDate = new Date(end + 'T12:00:00');
      while (current <= endDate) {
        days.push(current.toISOString().split('T')[0]);
        current.setDate(current.getDate() + 1);
      }
      return days;
    },
    groupByDay(items, dateField) {
      const groups = {};
      items.forEach(item => {
        const date = item[dateField]?.split('T')[0];
        if (date) {
          if (!groups[date]) groups[date] = [];
          groups[date].push(item);
        }
      });
      return groups;
    }
  };

  const api = {
    async request(endpoint, options = {}) {
      try {
        const r = await fetch(`${CONFIG.API_URL}${endpoint}`, {
          ...options,
          headers: {
            'Authorization': `Bearer ${utils.getToken()}`,
            'X-Organization-Id': state.org?.id,
            'Content-Type': 'application/json',
            ...options.headers
          }
        });
        if (r.status === 401) { utils.logout(); return null; }
        if (!r.ok) return null;
        return r.json();
      } catch (e) { console.error('API Error:', e); return null; }
    },
    getTransacciones(desde, hasta) {
      let url = '/api/transacciones?limite=500';
      if (desde) url += `&fecha_desde=${desde}`;
      if (hasta) url += `&fecha_hasta=${hasta}`;
      return this.request(url);
    },
    getVentas() { return this.request('/api/ventas?limite=500'); },
    getGastos() { return this.request('/api/gastos?limite=500'); },
    getCuentas() { return this.request('/api/cuentas-bancarias'); },
    getCategorias() { return this.request('/api/categorias?tipo=gasto'); }
  };

  const charts = {
    destroy(name) {
      if (state.charts[name]) {
        state.charts[name].destroy();
        state.charts[name] = null;
      }
    },
    
    flujoEfectivo(data) {
      this.destroy('flujo');
      const ctx = elements.chartFlujo?.getContext('2d');
      if (!ctx) return;

      state.charts.flujo = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: data.labels,
          datasets: [
            {
              label: 'Ingresos',
              data: data.ingresos,
              backgroundColor: 'rgba(16, 185, 129, 0.8)',
              borderColor: '#10b981',
              borderWidth: 1,
              borderRadius: 4
            },
            {
              label: 'Egresos',
              data: data.egresos,
              backgroundColor: 'rgba(239, 68, 68, 0.8)',
              borderColor: '#ef4444',
              borderWidth: 1,
              borderRadius: 4
            }
          ]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              titleColor: '#f8fafc',
              bodyColor: '#cbd5e1',
              borderColor: 'rgba(148, 163, 184, 0.2)',
              borderWidth: 1,
              padding: 12,
              callbacks: {
                label: ctx => `${ctx.dataset.label}: ${utils.formatMoney(ctx.raw)}`
              }
            }
          },
          scales: {
            x: {
              grid: { display: false },
              ticks: { color: '#64748b', font: { size: 11 }, maxRotation: 45, minRotation: 0 }
            },
            y: {
              grid: { color: 'rgba(148, 163, 184, 0.1)' },
              ticks: {
                color: '#64748b',
                font: { size: 11 },
                callback: v => utils.formatMoneyShort(v)
              }
            }
          }
        }
      });
    },

    categorias(data) {
      this.destroy('categorias');
      const ctx = elements.chartCategorias?.getContext('2d');
      if (!ctx || !data.length) return;

      state.charts.categorias = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.nombre),
          datasets: [{
            data: data.map(d => d.total),
            backgroundColor: COLORS.palette.slice(0, data.length),
            borderWidth: 0,
            spacing: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94a3b8', font: { size: 11 }, padding: 8, usePointStyle: true }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              callbacks: {
                label: ctx => ` ${ctx.label}: ${utils.formatMoney(ctx.raw)}`
              }
            }
          }
        }
      });
    },

    proveedores(data) {
      this.destroy('proveedores');
      const ctx = elements.chartProveedores?.getContext('2d');
      if (!ctx || !data.length) return;

      const top5 = data.slice(0, 5);
      state.charts.proveedores = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: top5.map(d => d.nombre?.substring(0, 15) || 'Sin proveedor'),
          datasets: [{
            data: top5.map(d => d.total),
            backgroundColor: 'rgba(239, 68, 68, 0.8)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              callbacks: { label: ctx => utils.formatMoney(ctx.raw) }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(148, 163, 184, 0.1)' },
              ticks: { color: '#64748b', callback: v => utils.formatMoneyShort(v) }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 11 } }
            }
          }
        }
      });
    },

    clientes(data) {
      this.destroy('clientes');
      const ctx = elements.chartClientes?.getContext('2d');
      if (!ctx || !data.length) return;

      const top5 = data.slice(0, 5);
      state.charts.clientes = new Chart(ctx, {
        type: 'bar',
        data: {
          labels: top5.map(d => d.nombre?.substring(0, 15) || 'Sin cliente'),
          datasets: [{
            data: top5.map(d => d.total),
            backgroundColor: 'rgba(16, 185, 129, 0.8)',
            borderRadius: 4
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          indexAxis: 'y',
          plugins: {
            legend: { display: false },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              callbacks: { label: ctx => utils.formatMoney(ctx.raw) }
            }
          },
          scales: {
            x: {
              grid: { color: 'rgba(148, 163, 184, 0.1)' },
              ticks: { color: '#64748b', callback: v => utils.formatMoneyShort(v) }
            },
            y: {
              grid: { display: false },
              ticks: { color: '#94a3b8', font: { size: 11 } }
            }
          }
        }
      });
    },

    cuentas(data) {
      this.destroy('cuentas');
      const ctx = elements.chartCuentas?.getContext('2d');
      if (!ctx || !data.length) return;

      state.charts.cuentas = new Chart(ctx, {
        type: 'doughnut',
        data: {
          labels: data.map(d => d.nombre),
          datasets: [{
            data: data.map(d => Math.max(0, d.saldo)),
            backgroundColor: COLORS.palette.slice(0, data.length),
            borderWidth: 0,
            spacing: 2
          }]
        },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          cutout: '65%',
          plugins: {
            legend: {
              position: 'right',
              labels: { color: '#94a3b8', font: { size: 11 }, padding: 8, usePointStyle: true }
            },
            tooltip: {
              backgroundColor: 'rgba(15, 23, 42, 0.9)',
              callbacks: { label: ctx => ` ${ctx.label}: ${utils.formatMoney(ctx.raw)}` }
            }
          }
        }
      });
    }
  };

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
    },

    stats(data) {
      if (elements.saldoTotal) elements.saldoTotal.textContent = utils.formatMoney(data.saldoTotal);
      if (elements.totalIngresos) elements.totalIngresos.textContent = utils.formatMoney(data.ingresos);
      if (elements.totalEgresos) elements.totalEgresos.textContent = utils.formatMoney(data.egresos);
      if (elements.txIngresos) elements.txIngresos.textContent = `${data.txIngresos} transacciones`;
      if (elements.txEgresos) elements.txEgresos.textContent = `${data.txEgresos} transacciones`;
      
      const balance = data.ingresos - data.egresos;
      if (elements.balance) {
        elements.balance.textContent = utils.formatMoney(balance);
        elements.balance.className = `stat-value ${balance >= 0 ? 'positive' : 'negative'}`;
      }
      
      if (elements.porCobrar) elements.porCobrar.textContent = utils.formatMoney(data.porCobrar);
      if (elements.porPagar) elements.porPagar.textContent = utils.formatMoney(data.porPagar);
      if (elements.ventasPend) elements.ventasPend.textContent = `${data.ventasPend} ventas`;
      if (elements.gastosPend) elements.gastosPend.textContent = `${data.gastosPend} gastos`;
    },

    listPorCobrar(ventas) {
      if (!elements.listPorCobrar) return;
      
      const pendientes = ventas.filter(v => {
        const saldo = (parseFloat(v.total) || 0) - (parseFloat(v.monto_cobrado) || 0);
        return saldo > 0;
      }).slice(0, 5);

      if (!pendientes.length) {
        elements.listPorCobrar.innerHTML = '<div class="list-empty">✓ Sin ventas pendientes</div>';
        return;
      }

      elements.listPorCobrar.innerHTML = pendientes.map(v => {
        const saldo = (parseFloat(v.total) || 0) - (parseFloat(v.monto_cobrado) || 0);
        const isOverdue = v.fecha_vencimiento && utils.isOverdue(v.fecha_vencimiento);
        return `
          <div class="list-item ${isOverdue ? 'overdue' : ''}">
            <div class="list-item-info">
              <div class="list-item-name">${v.nombre_contacto || v.folio || 'Venta'}</div>
              <div class="list-item-meta">${v.folio || ''} • ${utils.formatDate(v.fecha)}</div>
            </div>
            <div class="list-item-amount ingreso">${utils.formatMoney(saldo)}</div>
          </div>
        `;
      }).join('');
    },

    listPorPagar(gastos) {
      if (!elements.listPorPagar) return;
      
      const pendientes = gastos.filter(g => {
        const saldo = (parseFloat(g.total) || 0) - (parseFloat(g.monto_pagado) || 0);
        return g.estatus_pago !== 'pagado' && saldo > 0;
      }).slice(0, 5);

      if (!pendientes.length) {
        elements.listPorPagar.innerHTML = '<div class="list-empty">✓ Sin gastos pendientes</div>';
        return;
      }

      elements.listPorPagar.innerHTML = pendientes.map(g => {
        const saldo = (parseFloat(g.total) || 0) - (parseFloat(g.monto_pagado) || 0);
        const isOverdue = g.fecha_vencimiento && utils.isOverdue(g.fecha_vencimiento);
        return `
          <div class="list-item ${isOverdue ? 'overdue' : ''}">
            <div class="list-item-info">
              <div class="list-item-name">${g.nombre_proveedor || g.concepto || 'Gasto'}</div>
              <div class="list-item-meta">${g.nombre_categoria || ''} • ${utils.formatDate(g.fecha)}</div>
            </div>
            <div class="list-item-amount egreso">${utils.formatMoney(saldo)}</div>
          </div>
        `;
      }).join('');
    },

    listTransacciones(transacciones) {
      if (!elements.listTransacciones) return;
      
      if (!transacciones.length) {
        elements.listTransacciones.innerHTML = '<div class="list-empty">Sin transacciones recientes</div>';
        return;
      }

      elements.listTransacciones.innerHTML = transacciones.slice(0, 8).map(t => `
        <div class="list-item">
          <div class="list-item-icon ${t.tipo}">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              ${t.tipo === 'ingreso' 
                ? '<polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>'
                : '<polyline points="23 18 13.5 8.5 8.5 13.5 1 6"/>'}
            </svg>
          </div>
          <div class="list-item-info">
            <div class="list-item-name">${t.descripcion || 'Sin descripción'}</div>
            <div class="list-item-meta">${t.nombre_cuenta || '-'} • ${utils.formatDate(t.fecha)}</div>
          </div>
          <div class="list-item-amount ${t.tipo}">${t.tipo === 'ingreso' ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto))}</div>
        </div>
      `).join('');
    }
  };

  const handlers = {
    async loadDashboard() {
      const desde = state.fechaDesde;
      const hasta = state.fechaHasta;

      const [txRes, ventasRes, gastosRes, cuentasRes] = await Promise.all([
        api.getTransacciones(desde, hasta),
        api.getVentas(),
        api.getGastos(),
        api.getCuentas()
      ]);

      state.transacciones = txRes?.transacciones || [];
      state.ventas = ventasRes?.ventas || [];
      state.gastos = gastosRes?.gastos || [];
      state.cuentas = cuentasRes?.cuentas || [];

      // Filtrar transacciones por fecha
      const txFiltradas = state.transacciones.filter(t => {
        const fecha = t.fecha?.split('T')[0];
        if (desde && fecha < desde) return false;
        if (hasta && fecha > hasta) return false;
        return true;
      });

      // Calcular estadísticas
      let ingresos = 0, egresos = 0, txIngresos = 0, txEgresos = 0;
      txFiltradas.forEach(t => {
        const monto = parseFloat(t.monto) || 0;
        if (t.tipo === 'ingreso') { ingresos += monto; txIngresos++; }
        else { egresos += monto; txEgresos++; }
      });

      let porCobrar = 0, ventasPend = 0;
      state.ventas.forEach(v => {
        const saldo = (parseFloat(v.total) || 0) - (parseFloat(v.monto_cobrado) || 0);
        if (saldo > 0) { porCobrar += saldo; ventasPend++; }
      });

      let porPagar = 0, gastosPend = 0;
      state.gastos.forEach(g => {
        const saldo = (parseFloat(g.total) || 0) - (parseFloat(g.monto_pagado) || 0);
        if (g.estatus_pago !== 'pagado' && saldo > 0) { porPagar += saldo; gastosPend++; }
      });

      const saldoTotal = state.cuentas.reduce((sum, c) => sum + (parseFloat(c.saldo_actual) || 0), 0);

      render.stats({ saldoTotal, ingresos, egresos, txIngresos, txEgresos, porCobrar, porPagar, ventasPend, gastosPend });

      // Gráfico flujo de efectivo
      const days = utils.getDaysInRange(desde, hasta);
      const txByDay = utils.groupByDay(txFiltradas, 'fecha');
      const flujoData = {
        labels: days.map(d => utils.formatDate(d)),
        ingresos: days.map(d => {
          const dayTx = txByDay[d] || [];
          return dayTx.filter(t => t.tipo === 'ingreso').reduce((s, t) => s + (parseFloat(t.monto) || 0), 0);
        }),
        egresos: days.map(d => {
          const dayTx = txByDay[d] || [];
          return dayTx.filter(t => t.tipo === 'egreso').reduce((s, t) => s + (parseFloat(t.monto) || 0), 0);
        })
      };
      
      // Si hay muchos días, agrupar por semana
      if (days.length > 31) {
        const step = Math.ceil(days.length / 15);
        flujoData.labels = flujoData.labels.filter((_, i) => i % step === 0);
        flujoData.ingresos = flujoData.ingresos.filter((_, i) => i % step === 0);
        flujoData.egresos = flujoData.egresos.filter((_, i) => i % step === 0);
      }
      
      charts.flujoEfectivo(flujoData);

      // Gastos por categoría
      const gastosPorCat = {};
      state.gastos.forEach(g => {
        const cat = g.nombre_categoria || 'Sin categoría';
        gastosPorCat[cat] = (gastosPorCat[cat] || 0) + (parseFloat(g.total) || 0);
      });
      const categoriasData = Object.entries(gastosPorCat)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 8);
      charts.categorias(categoriasData);

      // Gastos por proveedor
      const gastosPorProv = {};
      state.gastos.forEach(g => {
        const prov = g.nombre_proveedor || 'Sin proveedor';
        gastosPorProv[prov] = (gastosPorProv[prov] || 0) + (parseFloat(g.total) || 0);
      });
      const proveedoresData = Object.entries(gastosPorProv)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total);
      charts.proveedores(proveedoresData);

      // Ventas por cliente
      const ventasPorCli = {};
      state.ventas.forEach(v => {
        const cli = v.nombre_contacto || 'Sin cliente';
        ventasPorCli[cli] = (ventasPorCli[cli] || 0) + (parseFloat(v.total) || 0);
      });
      const clientesData = Object.entries(ventasPorCli)
        .map(([nombre, total]) => ({ nombre, total }))
        .sort((a, b) => b.total - a.total);
      charts.clientes(clientesData);

      // Cuentas bancarias
      const cuentasData = state.cuentas.map(c => ({
        nombre: c.nombre,
        saldo: parseFloat(c.saldo_actual) || 0
      }));
      charts.cuentas(cuentasData);

      // Listas
      render.listPorCobrar(state.ventas);
      render.listPorPagar(state.gastos);
      render.listTransacciones(state.transacciones);

      console.log('📊 Dashboard cargado');
    },

    setPreset(preset) {
      const today = utils.today();
      let desde, hasta = today;

      switch (preset) {
        case 'today':
          desde = today;
          break;
        case 'week':
          desde = utils.startOfWeek();
          break;
        case 'month':
          desde = utils.startOfMonth();
          hasta = utils.endOfMonth();
          break;
        case 'quarter':
          desde = utils.startOfQuarter();
          break;
        case 'year':
          desde = utils.startOfYear();
          break;
      }

      state.fechaDesde = desde;
      state.fechaHasta = hasta;
      if (elements.fechaDesde) elements.fechaDesde.value = desde;
      if (elements.fechaHasta) elements.fechaHasta.value = hasta;

      // Update active button
      document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.preset === preset);
      });

      this.loadDashboard();
    },

    applyDateRange() {
      state.fechaDesde = elements.fechaDesde?.value;
      state.fechaHasta = elements.fechaHasta?.value;
      document.querySelectorAll('.preset-btn').forEach(btn => btn.classList.remove('active'));
      this.loadDashboard();
    },

    openSidebar() {
      elements.sidebar?.classList.add('open');
      elements.sidebarOverlay?.classList.add('active');
      document.body.style.overflow = 'hidden';
    },

    closeSidebar() {
      elements.sidebar?.classList.remove('open');
      elements.sidebarOverlay?.classList.remove('active');
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
      elements.userDropdown?.classList.toggle('active');
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
    }
  };

  function init() {
    if (!utils.getToken()) { utils.redirect(CONFIG.REDIRECT.LOGIN); return; }
    state.org = utils.getOrg();
    if (!state.org) { utils.redirect(CONFIG.REDIRECT.SELECT_ORG); return; }
    state.user = utils.getUser();

    // Fechas por defecto: mes actual
    state.fechaDesde = utils.startOfMonth();
    state.fechaHasta = utils.endOfMonth();
    if (elements.fechaDesde) elements.fechaDesde.value = state.fechaDesde;
    if (elements.fechaHasta) elements.fechaHasta.value = state.fechaHasta;

    render.user();
    render.org();

    // Event listeners
    elements.menuToggle?.addEventListener('click', () => handlers.toggleSidebar());
    elements.sidebarOverlay?.addEventListener('click', () => handlers.closeSidebar());
    elements.sidebarClose?.addEventListener('click', () => handlers.closeSidebar());
    elements.userMenuBtn?.addEventListener('click', () => handlers.toggleUserMenu());
    elements.logoutBtn?.addEventListener('click', () => handlers.logout());
    elements.sidebarLogoutBtn?.addEventListener('click', () => handlers.logout());
    elements.switchOrgBtn?.addEventListener('click', () => handlers.switchOrg());
    elements.orgSwitcher?.addEventListener('click', () => handlers.switchOrg());
    elements.applyDates?.addEventListener('click', () => handlers.applyDateRange());
    document.addEventListener('click', e => handlers.closeUserMenu(e));

    // Cerrar sidebar al hacer click en un nav-item (en móvil)
    document.querySelectorAll('.sidebar .nav-item').forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 1024) {
          handlers.closeSidebar();
        }
      });
    });

    // Preset buttons
    document.querySelectorAll('.preset-btn').forEach(btn => {
      btn.addEventListener('click', () => handlers.setPreset(btn.dataset.preset));
    });

    // Resize handler para cerrar sidebar si cambia a desktop
    window.addEventListener('resize', () => {
      if (window.innerWidth > 1024) {
        handlers.closeSidebar();
      }
    });

    handlers.loadDashboard();
    console.log('🚀 TRUNO Super Dashboard v3 - Mobile Ready');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
