/**
 * TRUNO - Gastos Module
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
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    menuToggle: document.getElementById('menuToggle'),
    orgSwitcher: document.getElementById('orgSwitcher'),
    orgName: document.getElementById('orgName'),
    orgPlan: document.getElementById('orgPlan'),
    userAvatar: document.getElementById('userAvatar'),
    // Stats
    totalMes: document.getElementById('totalMes'),
    porPagar: document.getElementById('porPagar'),
    vencidos: document.getElementById('vencidos'),
    pagados: document.getElementById('pagados'),
    // Filters
    searchInput: document.getElementById('searchInput'),
    filterStatus: document.getElementById('filterStatus'),
    filterCategory: document.getElementById('filterCategory'),
    // Table
    tableContainer: document.getElementById('tableContainer'),
    tableBody: document.getElementById('tableBody'),
    mobileCards: document.getElementById('mobileCards'),
    emptyState: document.getElementById('emptyState'),
    pagination: document.getElementById('pagination'),
    showingStart: document.getElementById('showingStart'),
    showingEnd: document.getElementById('showingEnd'),
    totalRecords: document.getElementById('totalRecords'),
    prevPage: document.getElementById('prevPage'),
    nextPage: document.getElementById('nextPage'),
    // Buttons
    addGastoBtn: document.getElementById('addGastoBtn'),
    addFirstGastoBtn: document.getElementById('addFirstGastoBtn'),
    fabBtn: document.getElementById('fabBtn'),
    // Gasto Modal
    gastoModal: document.getElementById('gastoModal'),
    gastoForm: document.getElementById('gastoForm'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    cancelModal: document.getElementById('cancelModal'),
    submitModal: document.getElementById('submitModal'),
    // Form fields
    contactoId: document.getElementById('contactoId'),
    numeroGasto: document.getElementById('numeroGasto'),
    fecha: document.getElementById('fecha'),
    fechaVencimiento: document.getElementById('fechaVencimiento'),
    categoria: document.getElementById('categoria'),
    categoriasList: document.getElementById('categoriasList'),
    subtotal: document.getElementById('subtotal'),
    impuesto: document.getElementById('impuesto'),
    total: document.getElementById('total'),
    moneda: document.getElementById('moneda'),
    tipoCambio: document.getElementById('tipoCambio'),
    uuidCfdi: document.getElementById('uuidCfdi'),
    folioCfdi: document.getElementById('folioCfdi'),
    notas: document.getElementById('notas'),
    // Pago Modal
    pagoModal: document.getElementById('pagoModal'),
    pagoForm: document.getElementById('pagoForm'),
    closePagoModal: document.getElementById('closePagoModal'),
    cancelPagoModal: document.getElementById('cancelPagoModal'),
    pagoGastoInfo: document.getElementById('pagoGastoInfo'),
    pagoTotal: document.getElementById('pagoTotal'),
    pagoPendiente: document.getElementById('pagoPendiente'),
    pagoMonto: document.getElementById('pagoMonto'),
    pagoFecha: document.getElementById('pagoFecha'),
    pagoCuenta: document.getElementById('pagoCuenta'),
    pagoMetodo: document.getElementById('pagoMetodo'),
    submitPago: document.getElementById('submitPago'),
    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDeleteModal: document.getElementById('cancelDeleteModal'),
    confirmDelete: document.getElementById('confirmDelete'),
    deleteGastoName: document.getElementById('deleteGastoName')
  };

  let state = {
    user: null,
    org: null,
    gastos: [],
    contactos: [],
    cuentas: [],
    categorias: [],
    paginacion: { pagina: 1, limite: 20, total: 0 },
    editingId: null,
    deletingId: null,
    payingGasto: null,
    filters: { buscar: '', estatus: '', categoria: '' }
  };

  // ============================================
  // UTILITIES
  // ============================================
  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: (url) => window.location.href = url,

    getInitials(nombre, apellido) {
      const n = nombre?.charAt(0).toUpperCase() || '';
      const a = apellido?.charAt(0).toUpperCase() || '';
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
      const date = new Date(dateStr + 'T00:00:00');
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatDateInput(dateStr) {
      if (!dateStr) return '';
      return dateStr.split('T')[0];
    },

    today() {
      return new Date().toISOString().split('T')[0];
    },

    isOverdue(dateStr) {
      if (!dateStr) return false;
      return new Date(dateStr) < new Date();
    },

    debounce(fn, delay) {
      let timeout;
      return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => fn(...args), delay);
      };
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
        utils.redirect(CONFIG.REDIRECT.LOGIN);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
      }

      return data;
    },

    getGastos(params = {}) {
      const query = new URLSearchParams({
        pagina: params.pagina || 1,
        limite: params.limite || 20,
        ...(params.buscar && { buscar: params.buscar }),
        ...(params.estatus && { estatus: params.estatus }),
        ...(params.categoria && { categoria: params.categoria })
      });
      return this.request(`/api/gastos?${query}`);
    },

    getGasto(id) {
      return this.request(`/api/gastos/${id}`);
    },

    createGasto(data) {
      return this.request('/api/gastos', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateGasto(id, data) {
      return this.request(`/api/gastos/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteGasto(id) {
      return this.request(`/api/gastos/${id}`, {
        method: 'DELETE'
      });
    },

    getContactos() {
      return this.request('/api/contactos?tipo=proveedor&limite=100');
    },

    getCuentas() {
      return this.request('/api/cuentas-bancarias');
    },

    getCategorias() {
      return this.request('/api/gastos/meta/categorias');
    },

    registrarPago(data) {
      return this.request('/api/pagos', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  };

  // ============================================
  // RENDER
  // ============================================
  const render = {
    user() {
      if (!state.user) return;
      elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido);
    },

    org() {
      if (!state.org) return;
      elements.orgName.textContent = state.org.nombre;
      elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`;
    },

    stats() {
      const { gastos } = state;
      
      const now = new Date();
      const mesActual = now.getMonth();
      const añoActual = now.getFullYear();

      let totalMes = 0, porPagar = 0, vencidos = 0, pagados = 0;

      gastos.forEach(g => {
        const fechaGasto = new Date(g.fecha);
        const total = parseFloat(g.total) || 0;
        const pagado = parseFloat(g.monto_pagado) || 0;
        const pendiente = total - pagado;

        if (fechaGasto.getMonth() === mesActual && fechaGasto.getFullYear() === añoActual) {
          totalMes += total;
        }

        if (g.estatus_pago === 'pagado') {
          pagados += total;
        } else if (g.estatus_pago === 'vencido' || (g.fecha_vencimiento && utils.isOverdue(g.fecha_vencimiento) && pendiente > 0)) {
          vencidos += pendiente;
        } else if (pendiente > 0) {
          porPagar += pendiente;
        }
      });

      elements.totalMes.textContent = utils.formatMoney(totalMes);
      elements.porPagar.textContent = utils.formatMoney(porPagar);
      elements.vencidos.textContent = utils.formatMoney(vencidos);
      elements.pagados.textContent = utils.formatMoney(pagados);
    },

    gastos() {
      const { gastos, paginacion } = state;

      if (!gastos.length) {
        elements.tableContainer.style.display = 'none';
        elements.mobileCards.innerHTML = '';
        elements.emptyState.style.display = 'block';
        elements.pagination.style.display = 'none';
        return;
      }

      elements.emptyState.style.display = 'none';
      elements.tableContainer.style.display = 'block';
      elements.pagination.style.display = 'flex';

      // Pagination info
      const start = (paginacion.pagina - 1) * paginacion.limite + 1;
      const end = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);
      elements.showingStart.textContent = start;
      elements.showingEnd.textContent = end;
      elements.totalRecords.textContent = paginacion.total;
      elements.prevPage.disabled = paginacion.pagina <= 1;
      elements.nextPage.disabled = paginacion.pagina >= paginacion.paginas;

      // Table
      elements.tableBody.innerHTML = gastos.map(g => {
        const pendiente = parseFloat(g.total) - parseFloat(g.monto_pagado || 0);
        const statusClass = g.estatus_pago || 'pendiente';
        const statusLabel = {
          'pendiente': 'Pendiente',
          'parcial': 'Parcial',
          'pagado': 'Pagado',
          'vencido': 'Vencido',
          'cancelado': 'Cancelado'
        }[statusClass] || statusClass;

        return `
          <tr data-id="${g.id}">
            <td>
              <div class="cell-main">${g.nombre_contacto || g.numero_gasto || 'Sin proveedor'}</div>
              <div class="cell-sub">${g.numero_gasto ? `#${g.numero_gasto}` : ''} ${g.categoria || ''}</div>
            </td>
            <td>${utils.formatDate(g.fecha)}</td>
            <td>${g.categoria || '-'}</td>
            <td>${g.fecha_vencimiento ? utils.formatDate(g.fecha_vencimiento) : '-'}</td>
            <td><span class="status-badge ${statusClass}">${statusLabel}</span></td>
            <td style="text-align:right;">
              <div class="cell-amount expense">${utils.formatMoney(g.total, g.moneda)}</div>
              ${pendiente > 0 && pendiente < parseFloat(g.total) ? `<div class="cell-sub">Pend: ${utils.formatMoney(pendiente)}</div>` : ''}
            </td>
            <td>
              <div class="table-actions">
                ${pendiente > 0 ? `
                  <button class="action-btn" title="Registrar pago" data-action="pay" data-id="${g.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </button>
                ` : ''}
                <button class="action-btn" title="Editar" data-action="edit" data-id="${g.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${g.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');

      // Mobile cards
      elements.mobileCards.innerHTML = gastos.map(g => {
        const pendiente = parseFloat(g.total) - parseFloat(g.monto_pagado || 0);
        const statusClass = g.estatus_pago || 'pendiente';
        const statusLabel = {
          'pendiente': 'Pendiente',
          'parcial': 'Parcial',
          'pagado': 'Pagado',
          'vencido': 'Vencido',
          'cancelado': 'Cancelado'
        }[statusClass] || statusClass;

        return `
          <div class="mobile-card" data-id="${g.id}">
            <div class="mobile-card-header">
              <div class="mobile-card-title">${g.nombre_contacto || g.numero_gasto || 'Sin proveedor'}</div>
              <div class="mobile-card-amount">${utils.formatMoney(g.total, g.moneda)}</div>
            </div>
            <div class="mobile-card-meta">
              <span>${utils.formatDate(g.fecha)}</span>
              <span>${g.categoria || ''}</span>
            </div>
            <div class="mobile-card-footer">
              <span class="status-badge ${statusClass}">${statusLabel}</span>
              <div class="table-actions">
                ${pendiente > 0 ? `
                  <button class="action-btn" title="Pagar" data-action="pay" data-id="${g.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                  </button>
                ` : ''}
                <button class="action-btn" title="Editar" data-action="edit" data-id="${g.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                  </svg>
                </button>
                <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${g.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        `;
      }).join('');

      // Bind action buttons
      document.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = btn.dataset.action;
          const id = btn.dataset.id;
          handlers.handleAction(action, id);
        });
      });
    },

    contactos() {
      elements.contactoId.innerHTML = '<option value="">-- Sin proveedor --</option>' +
        state.contactos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    },

    cuentas() {
      elements.pagoCuenta.innerHTML = '<option value="">-- Sin registrar en banco --</option>' +
        state.cuentas.map(c => `<option value="${c.id}">${c.nombre} (${utils.formatMoney(c.saldo_actual)})</option>`).join('');
    },

    categorias() {
      elements.categoriasList.innerHTML = state.categorias.map(c => `<option value="${c.categoria}">`).join('');
      elements.filterCategory.innerHTML = '<option value="">Todas las categorías</option>' +
        state.categorias.map(c => `<option value="${c.categoria}">${c.categoria} (${c.total})</option>`).join('');
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handlers = {
    async loadData() {
      try {
        const [gastosData, contactosData, cuentasData] = await Promise.all([
          api.getGastos({ ...state.filters, pagina: state.paginacion.pagina }),
          api.getContactos().catch(() => ({ contactos: [] })),
          api.getCuentas().catch(() => ({ cuentas: [] }))
        ]);

        state.gastos = gastosData.gastos || [];
        state.paginacion = gastosData.paginacion || state.paginacion;
        state.contactos = contactosData.contactos || [];
        state.cuentas = cuentasData.cuentas || [];

        // Get categories
        api.getCategorias().then(data => {
          state.categorias = data || [];
          render.categorias();
        }).catch(() => {});

        render.gastos();
        render.stats();
        render.contactos();
        render.cuentas();
      } catch (error) {
        console.error('Error loading data:', error);
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

    handleAction(action, id) {
      const gasto = state.gastos.find(g => g.id === id);
      switch (action) {
        case 'edit': this.openEditModal(gasto); break;
        case 'delete': this.openDeleteModal(gasto); break;
        case 'pay': this.openPagoModal(gasto); break;
      }
    },

    // Gasto Modal
    openCreateModal() {
      state.editingId = null;
      elements.modalTitle.textContent = 'Nuevo Gasto';
      elements.gastoForm.reset();
      elements.fecha.value = utils.today();
      elements.gastoModal.classList.add('active');
      elements.contactoId.focus();
    },

    openEditModal(gasto) {
      state.editingId = gasto.id;
      elements.modalTitle.textContent = 'Editar Gasto';
      
      elements.contactoId.value = gasto.contacto_id || '';
      elements.numeroGasto.value = gasto.numero_gasto || '';
      elements.fecha.value = utils.formatDateInput(gasto.fecha);
      elements.fechaVencimiento.value = utils.formatDateInput(gasto.fecha_vencimiento);
      elements.categoria.value = gasto.categoria || '';
      elements.subtotal.value = gasto.subtotal || '';
      elements.impuesto.value = gasto.impuesto || '';
      elements.total.value = gasto.total || '';
      elements.moneda.value = gasto.moneda || 'MXN';
      elements.tipoCambio.value = gasto.tipo_cambio || 1;
      elements.uuidCfdi.value = gasto.uuid_cfdi || '';
      elements.folioCfdi.value = gasto.folio_cfdi || '';
      elements.notas.value = gasto.notas || '';

      elements.gastoModal.classList.add('active');
    },

    closeGastoModal() {
      elements.gastoModal.classList.remove('active');
      elements.gastoForm.reset();
      state.editingId = null;
    },

    async submitGasto(e) {
      e.preventDefault();

      const data = {
        contacto_id: elements.contactoId.value || null,
        numero_gasto: elements.numeroGasto.value.trim() || null,
        fecha: elements.fecha.value,
        fecha_vencimiento: elements.fechaVencimiento.value || null,
        categoria: elements.categoria.value.trim() || null,
        subtotal: parseFloat(elements.subtotal.value) || parseFloat(elements.total.value),
        impuesto: parseFloat(elements.impuesto.value) || 0,
        total: parseFloat(elements.total.value),
        moneda: elements.moneda.value,
        tipo_cambio: parseFloat(elements.tipoCambio.value) || 1,
        uuid_cfdi: elements.uuidCfdi.value.trim() || null,
        folio_cfdi: elements.folioCfdi.value.trim() || null,
        notas: elements.notas.value.trim() || null
      };

      elements.submitModal.classList.add('loading');
      elements.submitModal.disabled = true;

      try {
        if (state.editingId) {
          await api.updateGasto(state.editingId, data);
        } else {
          await api.createGasto(data);
        }

        this.closeGastoModal();
        await this.loadData();
      } catch (error) {
        alert(error.message);
      } finally {
        elements.submitModal.classList.remove('loading');
        elements.submitModal.disabled = false;
      }
    },

    // Pago Modal
    openPagoModal(gasto) {
      state.payingGasto = gasto;
      const pendiente = parseFloat(gasto.total) - parseFloat(gasto.monto_pagado || 0);
      
      elements.pagoGastoInfo.value = gasto.nombre_contacto || gasto.numero_gasto || `Gasto ${gasto.id.slice(0, 8)}`;
      elements.pagoTotal.value = utils.formatMoney(gasto.total);
      elements.pagoPendiente.value = utils.formatMoney(pendiente);
      elements.pagoMonto.value = pendiente.toFixed(2);
      elements.pagoMonto.max = pendiente;
      elements.pagoFecha.value = utils.today();
      elements.pagoCuenta.value = '';
      elements.pagoMetodo.value = 'transferencia';

      elements.pagoModal.classList.add('active');
      elements.pagoMonto.focus();
    },

    closePagoModal() {
      elements.pagoModal.classList.remove('active');
      elements.pagoForm.reset();
      state.payingGasto = null;
    },

    async submitPago(e) {
      e.preventDefault();

      const data = {
        tipo: 'gasto',
        referencia_id: state.payingGasto.id,
        monto: parseFloat(elements.pagoMonto.value),
        fecha: elements.pagoFecha.value,
        metodo_pago: elements.pagoMetodo.value,
        cuenta_bancaria_id: elements.pagoCuenta.value || null
      };

      elements.submitPago.classList.add('loading');
      elements.submitPago.disabled = true;

      try {
        await api.registrarPago(data);
        this.closePagoModal();
        await this.loadData();
      } catch (error) {
        alert(error.message);
      } finally {
        elements.submitPago.classList.remove('loading');
        elements.submitPago.disabled = false;
      }
    },

    // Delete Modal
    openDeleteModal(gasto) {
      state.deletingId = gasto.id;
      elements.deleteGastoName.textContent = gasto.nombre_contacto || gasto.numero_gasto || `Gasto del ${utils.formatDate(gasto.fecha)}`;
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
        await api.deleteGasto(state.deletingId);
        this.closeDeleteModal();
        await this.loadData();
      } catch (error) {
        alert(error.message);
      } finally {
        elements.confirmDelete.classList.remove('loading');
        elements.confirmDelete.disabled = false;
      }
    },

    // Filters
    applyFilters() {
      state.filters.buscar = elements.searchInput.value.trim();
      state.filters.estatus = elements.filterStatus.value;
      state.filters.categoria = elements.filterCategory.value;
      state.paginacion.pagina = 1;
      this.loadData();
    },

    // Pagination
    prevPage() {
      if (state.paginacion.pagina > 1) {
        state.paginacion.pagina--;
        this.loadData();
      }
    },

    nextPage() {
      if (state.paginacion.pagina < state.paginacion.paginas) {
        state.paginacion.pagina++;
        this.loadData();
      }
    },

    // Auto-calc
    calcTotal() {
      const subtotal = parseFloat(elements.subtotal.value) || 0;
      const impuesto = parseFloat(elements.impuesto.value) || 0;
      if (subtotal > 0) {
        elements.total.value = (subtotal + impuesto).toFixed(2);
      }
    },

    switchOrg() {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG);
      utils.redirect(CONFIG.REDIRECT.SELECT_ORG);
    }
  };

  // ============================================
  // INIT
  // ============================================
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
    elements.menuToggle.addEventListener('click', handlers.toggleSidebar.bind(handlers));
    elements.sidebarOverlay.addEventListener('click', handlers.closeSidebar.bind(handlers));
    elements.orgSwitcher.addEventListener('click', handlers.switchOrg.bind(handlers));

    // Add buttons
    elements.addGastoBtn.addEventListener('click', handlers.openCreateModal.bind(handlers));
    elements.addFirstGastoBtn.addEventListener('click', handlers.openCreateModal.bind(handlers));
    elements.fabBtn.addEventListener('click', handlers.openCreateModal.bind(handlers));

    // Gasto modal
    elements.closeModal.addEventListener('click', handlers.closeGastoModal.bind(handlers));
    elements.cancelModal.addEventListener('click', handlers.closeGastoModal.bind(handlers));
    elements.gastoForm.addEventListener('submit', handlers.submitGasto.bind(handlers));
    elements.gastoModal.addEventListener('click', (e) => {
      if (e.target === elements.gastoModal) handlers.closeGastoModal();
    });

    // Auto calc
    elements.subtotal.addEventListener('input', handlers.calcTotal.bind(handlers));
    elements.impuesto.addEventListener('input', handlers.calcTotal.bind(handlers));

    // Pago modal
    elements.closePagoModal.addEventListener('click', handlers.closePagoModal.bind(handlers));
    elements.cancelPagoModal.addEventListener('click', handlers.closePagoModal.bind(handlers));
    elements.pagoForm.addEventListener('submit', handlers.submitPago.bind(handlers));
    elements.pagoModal.addEventListener('click', (e) => {
      if (e.target === elements.pagoModal) handlers.closePagoModal();
    });

    // Delete modal
    elements.closeDeleteModal.addEventListener('click', handlers.closeDeleteModal.bind(handlers));
    elements.cancelDeleteModal.addEventListener('click', handlers.closeDeleteModal.bind(handlers));
    elements.confirmDelete.addEventListener('click', handlers.confirmDelete.bind(handlers));
    elements.deleteModal.addEventListener('click', (e) => {
      if (e.target === elements.deleteModal) handlers.closeDeleteModal();
    });

    // Filters
    const debouncedFilter = utils.debounce(() => handlers.applyFilters(), 300);
    elements.searchInput.addEventListener('input', debouncedFilter);
    elements.filterStatus.addEventListener('change', () => handlers.applyFilters());
    elements.filterCategory.addEventListener('change', () => handlers.applyFilters());

    // Pagination
    elements.prevPage.addEventListener('click', handlers.prevPage.bind(handlers));
    elements.nextPage.addEventListener('click', handlers.nextPage.bind(handlers));

    // ESC key
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        handlers.closeGastoModal();
        handlers.closePagoModal();
        handlers.closeDeleteModal();
      }
    });

    // Load data
    handlers.loadData();

    console.log('🚀 TRUNO Gastos initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
