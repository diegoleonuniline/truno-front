/**
 * TRUNO - Transacciones Module
 */

(function() {
  'use strict';

  const CONFIG = {
    API_URL: 'https://truno-9bbbe9cf4d78.herokuapp.com',
    STORAGE_KEYS: { TOKEN: 'truno_token', USER: 'truno_user', ORG: 'truno_org' },
    REDIRECT: { LOGIN: '/truno-front/login/login.html', SELECT_ORG: '/truno-front/organizaciones/seleccionar.html' }
  };

  const elements = {
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    menuToggle: document.getElementById('menuToggle'),
    orgSwitcher: document.getElementById('orgSwitcher'),
    orgName: document.getElementById('orgName'),
    orgPlan: document.getElementById('orgPlan'),
    userAvatar: document.getElementById('userAvatar'),
    searchInput: document.getElementById('searchInput'),
    filterType: document.getElementById('filterType'),
    filterCuenta: document.getElementById('filterCuenta'),
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
    addTxBtn: document.getElementById('addTxBtn'),
    addFirstTxBtn: document.getElementById('addFirstTxBtn'),
    fabBtn: document.getElementById('fabBtn'),
    txModal: document.getElementById('txModal'),
    txForm: document.getElementById('txForm'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    cancelModal: document.getElementById('cancelModal'),
    submitModal: document.getElementById('submitModal'),
    tipo: document.getElementById('tipo'),
    cuentaId: document.getElementById('cuentaId'),
    cuentaDestinoGroup: document.getElementById('cuentaDestinoGroup'),
    cuentaDestinoId: document.getElementById('cuentaDestinoId'),
    monto: document.getElementById('monto'),
    fecha: document.getElementById('fecha'),
    descripcion: document.getElementById('descripcion'),
    referencia: document.getElementById('referencia'),
    categoria: document.getElementById('categoria'),
    deleteModal: document.getElementById('deleteModal'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDeleteModal: document.getElementById('cancelDeleteModal'),
    confirmDelete: document.getElementById('confirmDelete')
  };

  let state = {
    user: null, org: null, transacciones: [], cuentas: [],
    paginacion: { pagina: 1, limite: 20, total: 0 },
    editingId: null, deletingId: null,
    filters: { buscar: '', tipo: '', cuenta_bancaria_id: '' }
  };

  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: (url) => window.location.href = url,
    getInitials(n, a) { return (n?.charAt(0).toUpperCase() || '') + (a?.charAt(0).toUpperCase() || '') || '??'; },
    formatMoney(amount, currency = 'MXN') { return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount || 0); },
    formatDate(d) { if (!d) return '-'; return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); },
    formatDateInput(d) { return d ? d.split('T')[0] : ''; },
    today() { return new Date().toISOString().split('T')[0]; },
    debounce(fn, delay) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; },
    getUrlParam(name) { return new URLSearchParams(window.location.search).get(name); }
  };

  const api = {
    async request(endpoint, options = {}) {
      const r = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        ...options,
        headers: { 'Authorization': `Bearer ${utils.getToken()}`, 'X-Organization-Id': state.org?.id, 'Content-Type': 'application/json', ...options.headers }
      });
      if (r.status === 401) { utils.redirect(CONFIG.REDIRECT.LOGIN); return; }
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error');
      return data;
    },
    getTransacciones(p = {}) {
      const q = new URLSearchParams({
        pagina: p.pagina || 1, limite: p.limite || 20,
        ...(p.buscar && { buscar: p.buscar }),
        ...(p.tipo && { tipo: p.tipo }),
        ...(p.cuenta_bancaria_id && { cuenta_bancaria_id: p.cuenta_bancaria_id })
      });
      return this.request(`/api/transacciones?${q}`);
    },
    createTransaccion(d) { return this.request('/api/transacciones', { method: 'POST', body: JSON.stringify(d) }); },
    updateTransaccion(id, d) { return this.request(`/api/transacciones/${id}`, { method: 'PUT', body: JSON.stringify(d) }); },
    deleteTransaccion(id) { return this.request(`/api/transacciones/${id}`, { method: 'DELETE' }); },
    getCuentas() { return this.request('/api/cuentas-bancarias'); }
  };

  const render = {
    user() { if (state.user) elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido); },
    org() { if (state.org) { elements.orgName.textContent = state.org.nombre; elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`; } },
    cuentas() {
      const opts = state.cuentas.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      elements.cuentaId.innerHTML = '<option value="">Selecciona cuenta</option>' + opts;
      elements.cuentaDestinoId.innerHTML = '<option value="">Selecciona cuenta destino</option>' + opts;
      elements.filterCuenta.innerHTML = '<option value="">Todas las cuentas</option>' + opts;
    },
    transacciones() {
      const { transacciones, paginacion } = state;
      if (!transacciones.length) { elements.tableContainer.style.display = 'none'; elements.mobileCards.innerHTML = ''; elements.emptyState.style.display = 'block'; elements.pagination.style.display = 'none'; return; }
      elements.emptyState.style.display = 'none'; elements.tableContainer.style.display = 'block'; elements.pagination.style.display = 'flex';
      const start = (paginacion.pagina - 1) * paginacion.limite + 1, end = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);
      elements.showingStart.textContent = start; elements.showingEnd.textContent = end; elements.totalRecords.textContent = paginacion.total;
      elements.prevPage.disabled = paginacion.pagina <= 1; elements.nextPage.disabled = paginacion.pagina >= paginacion.paginas;

      const typeLabels = { ingreso: 'Ingreso', egreso: 'Egreso', transferencia: 'Transferencia', ajuste: 'Ajuste' };

      elements.tableBody.innerHTML = transacciones.map(t => {
        const isIncome = t.tipo === 'ingreso' || (t.tipo === 'ajuste' && parseFloat(t.monto) > 0);
        const amountClass = isIncome ? 'income' : 'expense';
        const sign = isIncome ? '+' : '-';
        return `<tr data-id="${t.id}">
          <td><div class="cell-main">${t.descripcion || 'Sin descripción'}</div><div class="cell-sub">${t.referencia || ''} ${t.categoria || ''}</div></td>
          <td>${utils.formatDate(t.fecha)}</td>
          <td>${t.nombre_cuenta || '-'}</td>
          <td><span class="type-badge ${t.tipo}">${typeLabels[t.tipo] || t.tipo}</span></td>
          <td style="text-align:right;"><div class="cell-amount ${amountClass}">${sign}${utils.formatMoney(Math.abs(t.monto))}</div></td>
          <td><div class="table-actions">
            <button class="action-btn" title="Editar" data-action="edit" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div></td></tr>`;
      }).join('');

      elements.mobileCards.innerHTML = transacciones.map(t => {
        const isIncome = t.tipo === 'ingreso' || (t.tipo === 'ajuste' && parseFloat(t.monto) > 0);
        const amountClass = isIncome ? 'income' : 'expense';
        const sign = isIncome ? '+' : '-';
        return `<div class="mobile-card" data-id="${t.id}">
          <div class="mobile-card-header"><div class="mobile-card-title">${t.descripcion || 'Sin descripción'}</div><div class="mobile-card-amount ${amountClass}">${sign}${utils.formatMoney(Math.abs(t.monto))}</div></div>
          <div class="mobile-card-meta"><span>${utils.formatDate(t.fecha)}</span><span>${t.nombre_cuenta || ''}</span></div>
          <div class="mobile-card-footer"><span class="type-badge ${t.tipo}">${t.tipo}</span>
            <div class="table-actions">
              <button class="action-btn" data-action="edit" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="action-btn danger" data-action="delete" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </div></div>`;
      }).join('');

      document.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); handlers.handleAction(b.dataset.action, b.dataset.id); }));
    }
  };

  const handlers = {
    async loadData() {
      try {
        const [txData, cuentasData] = await Promise.all([
          api.getTransacciones({ ...state.filters, pagina: state.paginacion.pagina }),
          api.getCuentas().catch(() => ({ cuentas: [] }))
        ]);
        state.transacciones = txData.transacciones || [];
        state.paginacion = txData.paginacion || state.paginacion;
        state.cuentas = cuentasData.cuentas || [];
        render.cuentas();
        render.transacciones();
      } catch (e) { console.error('Error:', e); }
    },
    toggleSidebar() { elements.sidebar.classList.toggle('open'); elements.sidebarOverlay.classList.toggle('active'); },
    closeSidebar() { elements.sidebar.classList.remove('open'); elements.sidebarOverlay.classList.remove('active'); },
    handleAction(action, id) {
      const t = state.transacciones.find(x => x.id === id);
      if (action === 'edit') this.openEditModal(t);
      else if (action === 'delete') this.openDeleteModal(t);
    },
    openCreateModal() {
      state.editingId = null; elements.modalTitle.textContent = 'Nueva Transacción'; elements.txForm.reset();
      elements.fecha.value = utils.today(); elements.tipo.value = 'ingreso';
      this.handleTipoChange(); elements.txModal.classList.add('active'); elements.tipo.focus();
    },
    openEditModal(t) {
      state.editingId = t.id; elements.modalTitle.textContent = 'Editar Transacción';
      elements.tipo.value = t.tipo || 'ingreso';
      elements.cuentaId.value = t.cuenta_bancaria_id || '';
      elements.cuentaDestinoId.value = t.cuenta_destino_id || '';
      elements.monto.value = Math.abs(t.monto);
      elements.fecha.value = utils.formatDateInput(t.fecha);
      elements.descripcion.value = t.descripcion || '';
      elements.referencia.value = t.referencia || '';
      elements.categoria.value = t.categoria || '';
      this.handleTipoChange();
      elements.txModal.classList.add('active');
    },
    closeTxModal() { elements.txModal.classList.remove('active'); elements.txForm.reset(); state.editingId = null; },
    handleTipoChange() {
      const isTransfer = elements.tipo.value === 'transferencia';
      elements.cuentaDestinoGroup.style.display = isTransfer ? 'block' : 'none';
      elements.cuentaDestinoId.required = isTransfer;
    },
    async submitTx(e) {
      e.preventDefault();
      const d = {
        tipo: elements.tipo.value,
        cuenta_bancaria_id: elements.cuentaId.value,
        monto: parseFloat(elements.monto.value),
        fecha: elements.fecha.value,
        descripcion: elements.descripcion.value.trim() || null,
        referencia: elements.referencia.value.trim() || null,
        categoria: elements.categoria.value.trim() || null
      };
      if (elements.tipo.value === 'transferencia') {
        d.cuenta_destino_id = elements.cuentaDestinoId.value;
      }
      elements.submitModal.classList.add('loading'); elements.submitModal.disabled = true;
      try {
        if (state.editingId) await api.updateTransaccion(state.editingId, d); else await api.createTransaccion(d);
        this.closeTxModal(); await this.loadData();
      } catch (e) { alert(e.message); }
      finally { elements.submitModal.classList.remove('loading'); elements.submitModal.disabled = false; }
    },
    openDeleteModal(t) { state.deletingId = t.id; elements.deleteModal.classList.add('active'); },
    closeDeleteModal() { elements.deleteModal.classList.remove('active'); state.deletingId = null; },
    async confirmDelete() {
      elements.confirmDelete.classList.add('loading'); elements.confirmDelete.disabled = true;
      try { await api.deleteTransaccion(state.deletingId); this.closeDeleteModal(); await this.loadData(); }
      catch (e) { alert(e.message); }
      finally { elements.confirmDelete.classList.remove('loading'); elements.confirmDelete.disabled = false; }
    },
    applyFilters() {
      state.filters.buscar = elements.searchInput.value.trim();
      state.filters.tipo = elements.filterType.value;
      state.filters.cuenta_bancaria_id = elements.filterCuenta.value;
      state.paginacion.pagina = 1;
      this.loadData();
    },
    prevPage() { if (state.paginacion.pagina > 1) { state.paginacion.pagina--; this.loadData(); } },
    nextPage() { if (state.paginacion.pagina < state.paginacion.paginas) { state.paginacion.pagina++; this.loadData(); } },
    switchOrg() { localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG); utils.redirect(CONFIG.REDIRECT.SELECT_ORG); }
  };

  function init() {
    if (!utils.getToken()) { utils.redirect(CONFIG.REDIRECT.LOGIN); return; }
    state.org = utils.getOrg(); if (!state.org) { utils.redirect(CONFIG.REDIRECT.SELECT_ORG); return; }
    state.user = utils.getUser(); render.user(); render.org();

    // Check URL params for cuenta filter
    const cuentaParam = utils.getUrlParam('cuenta_id');
    if (cuentaParam) state.filters.cuenta_bancaria_id = cuentaParam;

    elements.menuToggle.addEventListener('click', () => handlers.toggleSidebar());
    elements.sidebarOverlay.addEventListener('click', () => handlers.closeSidebar());
    elements.orgSwitcher.addEventListener('click', () => handlers.switchOrg());
    elements.addTxBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.addFirstTxBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.fabBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.closeModal.addEventListener('click', () => handlers.closeTxModal());
    elements.cancelModal.addEventListener('click', () => handlers.closeTxModal());
    elements.txForm.addEventListener('submit', e => handlers.submitTx(e));
    elements.txModal.addEventListener('click', e => { if (e.target === elements.txModal) handlers.closeTxModal(); });
    elements.tipo.addEventListener('change', () => handlers.handleTipoChange());
    elements.closeDeleteModal.addEventListener('click', () => handlers.closeDeleteModal());
    elements.cancelDeleteModal.addEventListener('click', () => handlers.closeDeleteModal());
    elements.confirmDelete.addEventListener('click', () => handlers.confirmDelete());
    elements.deleteModal.addEventListener('click', e => { if (e.target === elements.deleteModal) handlers.closeDeleteModal(); });
    const df = utils.debounce(() => handlers.applyFilters(), 300);
    elements.searchInput.addEventListener('input', df);
    elements.filterType.addEventListener('change', () => handlers.applyFilters());
    elements.filterCuenta.addEventListener('change', () => handlers.applyFilters());
    elements.prevPage.addEventListener('click', () => handlers.prevPage());
    elements.nextPage.addEventListener('click', () => handlers.nextPage());
    document.addEventListener('keydown', e => { if (e.key === 'Escape') { handlers.closeTxModal(); handlers.closeDeleteModal(); } });

    handlers.loadData().then(() => {
      if (cuentaParam) elements.filterCuenta.value = cuentaParam;
    });
    console.log('🚀 TRUNO Transacciones initialized');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
