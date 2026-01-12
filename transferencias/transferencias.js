/**
 * TRUNO - Transferencias Module v1
 * Movimientos entre cuentas bancarias
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
    menuToggle: $('menuToggle'),
    orgSwitcher: $('orgSwitcher'),
    orgName: $('orgName'),
    orgPlan: $('orgPlan'),
    userAvatar: $('userAvatar'),
    // Stats
    totalMes: $('totalMes'),
    cantidadMes: $('cantidadMes'),
    totalHistorico: $('totalHistorico'),
    cuentasGrid: $('cuentasGrid'),
    // Filters
    searchInput: $('searchInput'),
    filterCuenta: $('filterCuenta'),
    filterFechaDesde: $('filterFechaDesde'),
    filterFechaHasta: $('filterFechaHasta'),
    // Table
    tableContainer: $('tableContainer'),
    tableBody: $('tableBody'),
    mobileCards: $('mobileCards'),
    emptyState: $('emptyState'),
    pagination: $('pagination'),
    showingStart: $('showingStart'),
    showingEnd: $('showingEnd'),
    totalRecords: $('totalRecords'),
    prevPage: $('prevPage'),
    nextPage: $('nextPage'),
    // Buttons
    addTransferenciaBtn: $('addTransferenciaBtn'),
    addFirstBtn: $('addFirstBtn'),
    fabBtn: $('fabBtn'),
    // Modal Transferencia
    transferenciaModal: $('transferenciaModal'),
    transferenciaForm: $('transferenciaForm'),
    closeModal: $('closeModal'),
    cancelModal: $('cancelModal'),
    submitModal: $('submitModal'),
    cuentaOrigen: $('cuentaOrigen'),
    cuentaDestino: $('cuentaDestino'),
    saldoOrigen: $('saldoOrigen'),
    saldoDestino: $('saldoDestino'),
    visualOrigen: $('visualOrigen'),
    visualDestino: $('visualDestino'),
    monto: $('monto'),
    montoError: $('montoError'),
    fecha: $('fecha'),
    descripcion: $('descripcion'),
    referencia: $('referencia'),
    // Modal Delete
    deleteModal: $('deleteModal'),
    closeDeleteModal: $('closeDeleteModal'),
    cancelDeleteModal: $('cancelDeleteModal'),
    confirmDelete: $('confirmDelete'),
    deleteAmount: $('deleteAmount')
  };

  let state = {
    user: null,
    org: null,
    transferencias: [],
    cuentas: [],
    paginacion: { pagina: 1, limite: 20, total: 0 },
    filters: { buscar: '', cuenta_id: '', fecha_desde: '', fecha_hasta: '' },
    deletingId: null,
    saldoOrigenActual: 0
  };

  // ========== TOAST SYSTEM ==========
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
      const toastEl = document.createElement('div');
      toastEl.className = `toast toast-${type}`;
      const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      };
      toastEl.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.info}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      `;
      this.container.appendChild(toastEl);
      requestAnimationFrame(() => toastEl.classList.add('show'));
      toastEl.querySelector('.toast-close').addEventListener('click', () => this.hide(toastEl));
      if (duration > 0) setTimeout(() => this.hide(toastEl), duration);
      return toastEl;
    },
    hide(toastEl) {
      if (!toastEl || !toastEl.parentNode) return;
      toastEl.classList.remove('show');
      toastEl.classList.add('hide');
      setTimeout(() => toastEl.remove(), 300);
    },
    success(msg) { return this.show(msg, 'success'); },
    error(msg) { return this.show(msg, 'error'); },
    warning(msg) { return this.show(msg, 'warning'); },
    info(msg) { return this.show(msg, 'info'); }
  };

  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: url => window.location.href = url,
    getInitials(n, a) { return (n?.charAt(0).toUpperCase() || '') + (a?.charAt(0).toUpperCase() || '') || '??'; },
    formatMoney(amount, currency = 'MXN') {
      return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount || 0);
    },
    formatDate(d) {
      if (!d) return '-';
      const date = new Date(typeof d === 'string' && d.includes('T') ? d : d + 'T12:00:00');
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    },
    formatDateInput(d) { return d ? d.split('T')[0] : ''; },
    today() { return new Date().toISOString().split('T')[0]; },
    debounce(fn, delay) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; }
  };

  const api = {
    async request(endpoint, options = {}) {
      const r = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${utils.getToken()}`,
          'X-Organization-Id': state.org?.id,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      if (r.status === 401) { utils.redirect(CONFIG.REDIRECT.LOGIN); return; }
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error');
      return data;
    },
    getTransferencias(p = {}) {
      const q = new URLSearchParams({ pagina: p.pagina || 1, limite: p.limite || 20, es_transferencia: '1' });
      if (p.buscar) q.append('buscar', p.buscar);
      if (p.cuenta_id) q.append('cuenta_id', p.cuenta_id);
      if (p.fecha_desde) q.append('fecha_desde', p.fecha_desde);
      if (p.fecha_hasta) q.append('fecha_hasta', p.fecha_hasta);
      return this.request(`/api/transacciones?${q}`);
    },
    getCuentas() { return this.request('/api/cuentas-bancarias'); },
    createTransferencia(data) { return this.request('/api/transacciones/transferencia', { method: 'POST', body: JSON.stringify(data) }); },
    deleteTransferencia(id) { return this.request(`/api/transacciones/transferencia/${id}`, { method: 'DELETE' }); }
  };

  const render = {
    user() {
      if (state.user) elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido);
    },
    org() {
      if (state.org) {
        elements.orgName.textContent = state.org.nombre;
        elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`;
      }
    },
    cuentas() {
      // Select de filtros
      elements.filterCuenta.innerHTML = '<option value="">Todas las cuentas</option>' +
        state.cuentas.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');

      // Selects del modal
      const optsCuentas = state.cuentas.map(c => 
        `<option value="${c.id}" data-saldo="${c.saldo_actual}">${c.nombre} (${utils.formatMoney(c.saldo_actual)})</option>`
      ).join('');
      
      elements.cuentaOrigen.innerHTML = '<option value="">-- Seleccionar cuenta origen --</option>' + optsCuentas;
      elements.cuentaDestino.innerHTML = '<option value="">-- Seleccionar cuenta destino --</option>' + optsCuentas;

      // Grid de cuentas
      if (state.cuentas.length) {
        elements.cuentasGrid.innerHTML = state.cuentas.map(c => `
          <div class="cuenta-card">
            <div class="cuenta-card-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                <line x1="1" y1="10" x2="23" y2="10"/>
              </svg>
            </div>
            <div class="cuenta-card-info">
              <div class="cuenta-card-name">${c.nombre}</div>
              <div class="cuenta-card-banco">${c.banco || 'Sin banco'}</div>
            </div>
            <div class="cuenta-card-saldo ${parseFloat(c.saldo_actual) >= 0 ? 'positive' : 'negative'}">
              ${utils.formatMoney(c.saldo_actual)}
            </div>
          </div>
        `).join('');
      } else {
        elements.cuentasGrid.innerHTML = '<p class="no-cuentas">No hay cuentas bancarias registradas</p>';
      }
    },
    stats() {
      const now = new Date();
      const m = now.getMonth();
      const y = now.getFullYear();
      
      let totalMes = 0, cantidadMes = 0, totalHistorico = 0;
      
      state.transferencias.forEach(t => {
        if (t.tipo === 'egreso' && t.es_transferencia_interna) {
          const monto = parseFloat(t.monto) || 0;
          totalHistorico += monto;
          
          const fecha = new Date(t.fecha);
          if (fecha.getMonth() === m && fecha.getFullYear() === y) {
            totalMes += monto;
            cantidadMes++;
          }
        }
      });

      elements.totalMes.textContent = utils.formatMoney(totalMes);
      elements.cantidadMes.textContent = cantidadMes;
      elements.totalHistorico.textContent = utils.formatMoney(totalHistorico);
    },
    transferencias() {
      // Filtrar solo egresos (para no duplicar con ingresos)
      const transferencias = state.transferencias.filter(t => t.tipo === 'egreso' && t.es_transferencia_interna);
      const { paginacion } = state;

      if (!transferencias.length) {
        elements.tableContainer.style.display = 'none';
        elements.mobileCards.innerHTML = '';
        elements.emptyState.style.display = 'block';
        elements.pagination.style.display = 'none';
        return;
      }

      elements.emptyState.style.display = 'none';
      elements.tableContainer.style.display = 'block';
      elements.pagination.style.display = 'flex';

      const total = Math.ceil(transferencias.length / 2); // Dividir entre 2 porque cada transferencia tiene 2 registros
      const start = (paginacion.pagina - 1) * paginacion.limite + 1;
      const end = Math.min(paginacion.pagina * paginacion.limite, total);
      
      elements.showingStart.textContent = start;
      elements.showingEnd.textContent = end;
      elements.totalRecords.textContent = total;
      elements.prevPage.disabled = paginacion.pagina <= 1;
      elements.nextPage.disabled = paginacion.pagina >= Math.ceil(total / paginacion.limite);

      // Buscar el par de cada transferencia
      const transferenciasConPar = transferencias.map(t => {
        const par = state.transferencias.find(p => p.id === t.id_par_transferencia);
        return { ...t, par };
      });

      elements.tableBody.innerHTML = transferenciasConPar.map(t => {
        const cuentaOrigen = state.cuentas.find(c => c.id === t.cuenta_bancaria_id);
        const cuentaDestino = t.par ? state.cuentas.find(c => c.id === t.par.cuenta_bancaria_id) : null;

        return `
          <tr data-id="${t.id}">
            <td>${utils.formatDate(t.fecha)}</td>
            <td>
              <div class="transfer-flow">
                <span class="transfer-from">${cuentaOrigen?.nombre || 'Desconocida'}</span>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="transfer-arrow-icon">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
                <span class="transfer-to">${cuentaDestino?.nombre || 'Desconocida'}</span>
              </div>
            </td>
            <td>
              <div class="cell-main">${t.descripcion || 'Transferencia'}</div>
            </td>
            <td><span class="cell-sub">${t.referencia || '-'}</span></td>
            <td style="text-align:right;">
              <div class="cell-amount transfer">${utils.formatMoney(t.monto)}</div>
            </td>
            <td>
              <div class="table-actions">
                <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${t.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Mobile cards
      elements.mobileCards.innerHTML = transferenciasConPar.map(t => {
        const cuentaOrigen = state.cuentas.find(c => c.id === t.cuenta_bancaria_id);
        const cuentaDestino = t.par ? state.cuentas.find(c => c.id === t.par.cuenta_bancaria_id) : null;

        return `
          <div class="mobile-card" data-id="${t.id}">
            <div class="mobile-card-header">
              <div class="mobile-card-title">${t.descripcion || 'Transferencia'}</div>
              <div class="mobile-card-amount transfer">${utils.formatMoney(t.monto)}</div>
            </div>
            <div class="mobile-card-flow">
              <span class="flow-from">${cuentaOrigen?.nombre || '?'}</span>
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="5" y1="12" x2="19" y2="12"/>
                <polyline points="12 5 19 12 12 19"/>
              </svg>
              <span class="flow-to">${cuentaDestino?.nombre || '?'}</span>
            </div>
            <div class="mobile-card-footer">
              <span class="mobile-card-date">${utils.formatDate(t.fecha)}</span>
              <div class="table-actions">
                <button class="action-btn danger" data-action="delete" data-id="${t.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Event listeners
      document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const t = state.transferencias.find(x => x.id === btn.dataset.id);
          handlers.openDeleteModal(t);
        });
      });
    }
  };

  const handlers = {
    async loadData() {
      try {
        const [transRes, cuentasRes] = await Promise.all([
          api.getTransferencias({ ...state.filters, pagina: state.paginacion.pagina }),
          api.getCuentas()
        ]);

        state.transferencias = transRes.transacciones || [];
        state.cuentas = cuentasRes.cuentas || [];
        state.paginacion = transRes.paginacion || state.paginacion;

        render.cuentas();
        render.transferencias();
        render.stats();
      } catch (e) {
        console.error('Error:', e);
        toast.error('Error al cargar datos');
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

    openModal() {
      elements.transferenciaForm.reset();
      elements.fecha.value = utils.today();
      elements.saldoOrigen.textContent = '$0.00';
      elements.saldoDestino.textContent = '$0.00';
      elements.montoError.style.display = 'none';
      elements.monto.classList.remove('error');
      state.saldoOrigenActual = 0;
      this.updateVisual();
      elements.transferenciaModal.classList.add('active');
      elements.cuentaOrigen.focus();
    },
    closeModal() {
      elements.transferenciaModal.classList.remove('active');
      elements.transferenciaForm.reset();
    },

    onCuentaOrigenChange() {
      const selected = elements.cuentaOrigen.selectedOptions[0];
      if (selected && selected.value) {
        const saldo = parseFloat(selected.dataset.saldo) || 0;
        state.saldoOrigenActual = saldo;
        elements.saldoOrigen.textContent = utils.formatMoney(saldo);
        elements.saldoOrigen.className = `saldo-valor ${saldo >= 0 ? 'positive' : 'negative'}`;
        
        // Deshabilitar la misma cuenta en destino
        Array.from(elements.cuentaDestino.options).forEach(opt => {
          opt.disabled = opt.value === selected.value;
        });
      } else {
        state.saldoOrigenActual = 0;
        elements.saldoOrigen.textContent = '$0.00';
        elements.saldoOrigen.className = 'saldo-valor';
      }
      this.validateMonto();
      this.updateVisual();
    },

    onCuentaDestinoChange() {
      const selected = elements.cuentaDestino.selectedOptions[0];
      if (selected && selected.value) {
        const saldo = parseFloat(selected.dataset.saldo) || 0;
        elements.saldoDestino.textContent = utils.formatMoney(saldo);
        elements.saldoDestino.className = `saldo-valor ${saldo >= 0 ? 'positive' : 'negative'}`;
        
        // Deshabilitar la misma cuenta en origen
        Array.from(elements.cuentaOrigen.options).forEach(opt => {
          opt.disabled = opt.value === selected.value;
        });
      } else {
        elements.saldoDestino.textContent = '$0.00';
        elements.saldoDestino.className = 'saldo-valor';
      }
      this.updateVisual();
    },

    validateMonto() {
      const monto = parseFloat(elements.monto.value) || 0;
      if (monto > state.saldoOrigenActual) {
        elements.montoError.style.display = 'flex';
        elements.monto.classList.add('error');
        return false;
      } else {
        elements.montoError.style.display = 'none';
        elements.monto.classList.remove('error');
        return true;
      }
    },

    updateVisual() {
      const origenOpt = elements.cuentaOrigen.selectedOptions[0];
      const destinoOpt = elements.cuentaDestino.selectedOptions[0];
      const monto = parseFloat(elements.monto.value) || 0;

      // Visual origen
      if (origenOpt && origenOpt.value) {
        const cuenta = state.cuentas.find(c => c.id === origenOpt.value);
        elements.visualOrigen.querySelector('.transfer-account-name').textContent = cuenta?.nombre || 'Origen';
        elements.visualOrigen.querySelector('.transfer-account-amount').textContent = utils.formatMoney((parseFloat(cuenta?.saldo_actual) || 0) - monto);
      } else {
        elements.visualOrigen.querySelector('.transfer-account-name').textContent = 'Origen';
        elements.visualOrigen.querySelector('.transfer-account-amount').textContent = '$0.00';
      }

      // Visual destino
      if (destinoOpt && destinoOpt.value) {
        const cuenta = state.cuentas.find(c => c.id === destinoOpt.value);
        elements.visualDestino.querySelector('.transfer-account-name').textContent = cuenta?.nombre || 'Destino';
        elements.visualDestino.querySelector('.transfer-account-amount').textContent = utils.formatMoney((parseFloat(cuenta?.saldo_actual) || 0) + monto);
      } else {
        elements.visualDestino.querySelector('.transfer-account-name').textContent = 'Destino';
        elements.visualDestino.querySelector('.transfer-account-amount').textContent = '$0.00';
      }
    },

    async submitTransferencia(e) {
      e.preventDefault();

      if (!this.validateMonto()) {
        toast.error('El monto excede el saldo disponible');
        return;
      }

      const cuentaOrigenId = elements.cuentaOrigen.value;
      const cuentaDestinoId = elements.cuentaDestino.value;

      if (cuentaOrigenId === cuentaDestinoId) {
        toast.error('Las cuentas deben ser diferentes');
        return;
      }

      const data = {
        cuenta_origen_id: cuentaOrigenId,
        cuenta_destino_id: cuentaDestinoId,
        monto: parseFloat(elements.monto.value),
        fecha: elements.fecha.value,
        descripcion: elements.descripcion.value.trim() || 'Transferencia entre cuentas',
        referencia: elements.referencia.value.trim() || null
      };

      elements.submitModal.classList.add('loading');
      elements.submitModal.disabled = true;

      try {
        await api.createTransferencia(data);
        this.closeModal();
        await this.loadData();
        toast.success('Transferencia realizada');
      } catch (e) {
        toast.error(e.message);
      } finally {
        elements.submitModal.classList.remove('loading');
        elements.submitModal.disabled = false;
      }
    },

    openDeleteModal(t) {
      if (!t) return;
      state.deletingId = t.id;
      elements.deleteAmount.textContent = utils.formatMoney(t.monto);
      elements.deleteModal.classList.add('active');
    },
    closeDeleteModal() {
      elements.deleteModal.classList.remove('active');
      state.deletingId = null;
    },

    async confirmDelete() {
      elements.confirmDelete.classList.add('loading');
      elements.confirmDelete.disabled = true;

      try {
        await api.deleteTransferencia(state.deletingId);
        this.closeDeleteModal();
        await this.loadData();
        toast.success('Transferencia eliminada');
      } catch (e) {
        toast.error(e.message);
      } finally {
        elements.confirmDelete.classList.remove('loading');
        elements.confirmDelete.disabled = false;
      }
    },

    applyFilters() {
      state.filters.buscar = elements.searchInput.value.trim();
      state.filters.cuenta_id = elements.filterCuenta.value;
      state.filters.fecha_desde = elements.filterFechaDesde.value;
      state.filters.fecha_hasta = elements.filterFechaHasta.value;
      state.paginacion.pagina = 1;
      this.loadData();
    },

    prevPage() {
      if (state.paginacion.pagina > 1) {
        state.paginacion.pagina--;
        this.loadData();
      }
    },
    nextPage() {
      if (state.paginacion.pagina < Math.ceil(state.paginacion.total / state.paginacion.limite)) {
        state.paginacion.pagina++;
        this.loadData();
      }
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

    render.user();
    render.org();

    // Sidebar
    elements.menuToggle?.addEventListener('click', () => handlers.toggleSidebar());
    elements.sidebarOverlay?.addEventListener('click', () => handlers.closeSidebar());
    elements.orgSwitcher?.addEventListener('click', () => handlers.switchOrg());

    // Botones
    elements.addTransferenciaBtn?.addEventListener('click', () => handlers.openModal());
    elements.addFirstBtn?.addEventListener('click', () => handlers.openModal());
    elements.fabBtn?.addEventListener('click', () => handlers.openModal());

    // Modal transferencia
    elements.closeModal?.addEventListener('click', () => handlers.closeModal());
    elements.cancelModal?.addEventListener('click', () => handlers.closeModal());
    elements.transferenciaForm?.addEventListener('submit', e => handlers.submitTransferencia(e));
    elements.transferenciaModal?.addEventListener('click', e => { if (e.target === elements.transferenciaModal) handlers.closeModal(); });

    // Cuenta changes
    elements.cuentaOrigen?.addEventListener('change', () => handlers.onCuentaOrigenChange());
    elements.cuentaDestino?.addEventListener('change', () => handlers.onCuentaDestinoChange());
    elements.monto?.addEventListener('input', () => { handlers.validateMonto(); handlers.updateVisual(); });

    // Modal delete
    elements.closeDeleteModal?.addEventListener('click', () => handlers.closeDeleteModal());
    elements.cancelDeleteModal?.addEventListener('click', () => handlers.closeDeleteModal());
    elements.confirmDelete?.addEventListener('click', () => handlers.confirmDelete());
    elements.deleteModal?.addEventListener('click', e => { if (e.target === elements.deleteModal) handlers.closeDeleteModal(); });

    // Filtros
    const df = utils.debounce(() => handlers.applyFilters(), 300);
    elements.searchInput?.addEventListener('input', df);
    elements.filterCuenta?.addEventListener('change', () => handlers.applyFilters());
    elements.filterFechaDesde?.addEventListener('change', () => handlers.applyFilters());
    elements.filterFechaHasta?.addEventListener('change', () => handlers.applyFilters());
    elements.prevPage?.addEventListener('click', () => handlers.prevPage());
    elements.nextPage?.addEventListener('click', () => handlers.nextPage());

    // Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        handlers.closeModal();
        handlers.closeDeleteModal();
      }
    });

    handlers.loadData();
    console.log('🚀 TRUNO Transferencias v1');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
