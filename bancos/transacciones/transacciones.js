/**
 * TRUNO - Transacciones v2
 * Simple: Ingreso/Egreso + Comprobante + Conciliación
 */

(function() {
  'use strict';

  const CONFIG = {
    API_URL: 'https://truno-9bbbe9cf4d78.herokuapp.com',
    STORAGE_KEYS: { TOKEN: 'truno_token', USER: 'truno_user', ORG: 'truno_org' },
    REDIRECT: { LOGIN: '/truno-front/login/login.html', SELECT_ORG: '/truno-front/organizaciones/seleccionar.html' }
  };

  const $ = id => document.getElementById(id);

  const elements = {
    sidebar: $('sidebar'), sidebarOverlay: $('sidebarOverlay'), menuToggle: $('menuToggle'),
    orgSwitcher: $('orgSwitcher'), orgName: $('orgName'), orgPlan: $('orgPlan'), userAvatar: $('userAvatar'),
    searchInput: $('searchInput'), filterType: $('filterType'), filterCuenta: $('filterCuenta'), filterConciliado: $('filterConciliado'),
    tableContainer: $('tableContainer'), tableBody: $('tableBody'), mobileCards: $('mobileCards'), emptyState: $('emptyState'),
    pagination: $('pagination'), showingStart: $('showingStart'), showingEnd: $('showingEnd'), totalRecords: $('totalRecords'),
    prevPage: $('prevPage'), nextPage: $('nextPage'),
    addTxBtn: $('addTxBtn'), addFirstTxBtn: $('addFirstTxBtn'), fabBtn: $('fabBtn'),
    // Tx Modal
    txModal: $('txModal'), txForm: $('txForm'), modalTitle: $('modalTitle'),
    closeModal: $('closeModal'), cancelModal: $('cancelModal'), submitModal: $('submitModal'),
    tipo: $('tipo'), cuentaId: $('cuentaId'), monto: $('monto'), fecha: $('fecha'),
    descripcion: $('descripcion'), referencia: $('referencia'),
    comprobanteUpload: $('comprobanteUpload'), comprobanteFile: $('comprobanteFile'),
    comprobantePreview: $('comprobantePreview'), comprobanteFileName: $('comprobanteFileName'), removeComprobante: $('removeComprobante'),
    conciliarTipo: $('conciliarTipo'), conciliarGastoGroup: $('conciliarGastoGroup'), gastoId: $('gastoId'),
    conciliarVentaGroup: $('conciliarVentaGroup'), ventaId: $('ventaId'),
    addCuentaBtn: $('addCuentaBtn'),
    // Cuenta Modal
    cuentaModal: $('cuentaModal'), cuentaForm: $('cuentaForm'), closeCuentaModal: $('closeCuentaModal'),
    cancelCuentaModal: $('cancelCuentaModal'), cuentaNombre: $('cuentaNombre'), cuentaBanco: $('cuentaBanco'),
    cuentaSaldo: $('cuentaSaldo'), cuentaDigitos: $('cuentaDigitos'),
    // Delete Modal
    deleteModal: $('deleteModal'), closeDeleteModal: $('closeDeleteModal'), cancelDeleteModal: $('cancelDeleteModal'), confirmDelete: $('confirmDelete')
  };

  let state = {
    user: null, org: null, transacciones: [], cuentas: [], gastos: [], ventas: [],
    paginacion: { pagina: 1, limite: 20, total: 0 },
    editingId: null, deletingId: null, comprobanteData: null,
    filters: { buscar: '', tipo: '', cuenta_bancaria_id: '', conciliado: '' }
  };

  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: (url) => window.location.href = url,
    getInitials(n) { return (n?.charAt(0).toUpperCase() || '') + (n?.split(' ')[1]?.charAt(0).toUpperCase() || n?.charAt(1)?.toUpperCase() || ''); },
    formatMoney(a, c = 'MXN') { return new Intl.NumberFormat('es-MX', { style: 'currency', currency: c }).format(a || 0); },
    formatDate(d) { if (!d) return '-'; return new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }); },
    formatDateInput(d) { return d ? d.split('T')[0] : ''; },
    today() { return new Date().toISOString().split('T')[0]; },
    debounce(fn, delay) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; }
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
      const params = { pagina: p.pagina || 1, limite: p.limite || 20 };
      if (p.buscar) params.buscar = p.buscar;
      if (p.tipo) params.tipo = p.tipo;
      if (p.cuenta_bancaria_id) params.cuenta_bancaria_id = p.cuenta_bancaria_id;
      if (p.conciliado === '1') params.conciliado = '1';
      if (p.conciliado === '0') params.sin_conciliar = '1';
      return this.request(`/api/transacciones?${new URLSearchParams(params)}`);
    },
    createTransaccion(d) { return this.request('/api/transacciones', { method: 'POST', body: JSON.stringify(d) }); },
    updateTransaccion(id, d) { return this.request(`/api/transacciones/${id}`, { method: 'PUT', body: JSON.stringify(d) }); },
    deleteTransaccion(id) { return this.request(`/api/transacciones/${id}`, { method: 'DELETE' }); },
    getCuentas() { return this.request('/api/cuentas-bancarias'); },
    createCuenta(d) { return this.request('/api/cuentas-bancarias', { method: 'POST', body: JSON.stringify(d) }); },
    getGastosSinConciliar() { return this.request('/api/gastos?sin_conciliar=1&limite=50'); },
    getVentasSinConciliar() { return this.request('/api/ventas?estatus=pendiente&limite=50'); }
  };

  const render = {
    user() { if (state.user) elements.userAvatar.textContent = utils.getInitials(state.user.nombre); },
    org() { if (state.org) { elements.orgName.textContent = state.org.nombre; elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`; } },
    cuentas() {
      const opts = state.cuentas.map(c => `<option value="${c.id}">${c.nombre} (${utils.formatMoney(c.saldo_actual)})</option>`).join('');
      elements.cuentaId.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
      elements.filterCuenta.innerHTML = '<option value="">Cuenta</option>' + opts;
    },
    gastos() {
      elements.gastoId.innerHTML = '<option value="">-- Seleccionar --</option>' + state.gastos.map(g => 
        `<option value="${g.id}">${utils.formatDate(g.fecha)} - ${utils.formatMoney(g.total)} - ${g.concepto || g.nombre_proveedor || 'Sin descripción'}</option>`
      ).join('');
    },
    ventas() {
      elements.ventaId.innerHTML = '<option value="">-- Seleccionar --</option>' + state.ventas.map(v => 
        `<option value="${v.id}">${utils.formatDate(v.fecha)} - ${utils.formatMoney(v.total)} - ${v.nombre_contacto || v.folio || 'Sin descripción'}</option>`
      ).join('');
    },
    transacciones() {
      const { transacciones, paginacion } = state;
      if (!transacciones.length) { elements.tableContainer.style.display = 'none'; elements.mobileCards.innerHTML = ''; elements.emptyState.style.display = 'block'; elements.pagination.style.display = 'none'; return; }
      elements.emptyState.style.display = 'none'; elements.tableContainer.style.display = 'block'; elements.pagination.style.display = 'flex';
      const start = (paginacion.pagina - 1) * paginacion.limite + 1, end = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);
      elements.showingStart.textContent = start; elements.showingEnd.textContent = end; elements.totalRecords.textContent = paginacion.total;
      elements.prevPage.disabled = paginacion.pagina <= 1; elements.nextPage.disabled = paginacion.pagina >= paginacion.paginas;

      elements.tableBody.innerHTML = transacciones.map(t => {
        const isIncome = t.tipo === 'ingreso';
        const badges = [`<span class="badge ${t.tipo}">${isIncome ? 'Ingreso' : 'Egreso'}</span>`];
        if (t.gasto_id || t.venta_id) badges.push(`<span class="badge conciliado">Conciliado</span>`);
        if (t.comprobante_url) badges.push(`<span class="badge comprobante">📎</span>`);
        
        return `<tr data-id="${t.id}">
          <td><div class="cell-main">${t.descripcion || 'Sin descripción'}</div><div class="cell-sub">${t.referencia || ''}</div></td>
          <td>${utils.formatDate(t.fecha)}</td>
          <td>${t.nombre_cuenta || '-'}</td>
          <td><div class="badges-group" style="display:flex;gap:4px;flex-wrap:wrap;">${badges.join('')}</div></td>
          <td style="text-align:right;"><div class="cell-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto))}</div></td>
          <td><div class="table-actions">
            <button class="action-btn" title="Editar" data-action="edit" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div></td></tr>`;
      }).join('');

      elements.mobileCards.innerHTML = transacciones.map(t => {
        const isIncome = t.tipo === 'ingreso';
        const badges = [`<span class="badge ${t.tipo}">${isIncome ? 'Ingreso' : 'Egreso'}</span>`];
        if (t.gasto_id || t.venta_id) badges.push(`<span class="badge conciliado">Conciliado</span>`);
        
        return `<div class="mobile-card" data-id="${t.id}">
          <div class="mobile-card-header"><div class="mobile-card-title">${t.descripcion || 'Sin descripción'}</div><div class="mobile-card-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto))}</div></div>
          <div class="mobile-card-meta"><span>${utils.formatDate(t.fecha)}</span><span>${t.nombre_cuenta || ''}</span></div>
          <div class="mobile-card-badges">${badges.join('')}</div>
          <div class="mobile-card-footer"><span>${t.referencia || ''}</span>
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
        const [txData, cuentasData, gastosData, ventasData] = await Promise.all([
          api.getTransacciones({ ...state.filters, pagina: state.paginacion.pagina }),
          api.getCuentas().catch(() => ({ cuentas: [] })),
          api.getGastosSinConciliar().catch(() => ({ gastos: [] })),
          api.getVentasSinConciliar().catch(() => ({ ventas: [] }))
        ]);
        state.transacciones = txData.transacciones || [];
        state.paginacion = txData.paginacion || state.paginacion;
        state.cuentas = cuentasData.cuentas || [];
        state.gastos = gastosData.gastos || [];
        state.ventas = ventasData.ventas || [];
        render.transacciones(); render.cuentas(); render.gastos(); render.ventas();
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
      state.editingId = null; state.comprobanteData = null;
      elements.modalTitle.textContent = 'Nuevo Movimiento';
      elements.txForm.reset();
      elements.tipo.value = 'egreso';
      elements.fecha.value = utils.today();
      elements.comprobanteUpload.classList.remove('has-file');
      elements.comprobantePreview.style.display = 'none';
      elements.conciliarGastoGroup.style.display = 'none';
      elements.conciliarVentaGroup.style.display = 'none';
      elements.txModal.classList.add('active');
      elements.monto.focus();
    },
    openEditModal(t) {
      state.editingId = t.id; state.comprobanteData = t.comprobante_url || null;
      elements.modalTitle.textContent = 'Editar Movimiento';
      elements.tipo.value = t.tipo || 'egreso';
      elements.cuentaId.value = t.cuenta_bancaria_id || '';
      elements.monto.value = Math.abs(t.monto);
      elements.fecha.value = utils.formatDateInput(t.fecha);
      elements.descripcion.value = t.descripcion || '';
      elements.referencia.value = t.referencia || '';
      
      if (t.comprobante_url) {
        elements.comprobanteUpload.classList.add('has-file');
        elements.comprobantePreview.style.display = 'flex';
        elements.comprobanteFileName.textContent = 'Comprobante guardado';
      } else {
        elements.comprobanteUpload.classList.remove('has-file');
        elements.comprobantePreview.style.display = 'none';
      }
      
      if (t.gasto_id) {
        elements.conciliarTipo.value = 'gasto';
        elements.conciliarGastoGroup.style.display = 'block';
        elements.conciliarVentaGroup.style.display = 'none';
        elements.gastoId.value = t.gasto_id;
      } else if (t.venta_id) {
        elements.conciliarTipo.value = 'venta';
        elements.conciliarGastoGroup.style.display = 'none';
        elements.conciliarVentaGroup.style.display = 'block';
        elements.ventaId.value = t.venta_id;
      } else {
        elements.conciliarTipo.value = '';
        elements.conciliarGastoGroup.style.display = 'none';
        elements.conciliarVentaGroup.style.display = 'none';
      }
      
      elements.txModal.classList.add('active');
    },
    closeTxModal() { elements.txModal.classList.remove('active'); elements.txForm.reset(); state.editingId = null; state.comprobanteData = null; },
    async submitTx(e) {
      e.preventDefault();
      const d = {
        tipo: elements.tipo.value,
        cuenta_bancaria_id: elements.cuentaId.value,
        monto: parseFloat(elements.monto.value),
        fecha: elements.fecha.value,
        descripcion: elements.descripcion.value.trim() || null,
        referencia: elements.referencia.value.trim() || null,
        comprobante_url: state.comprobanteData || null,
        gasto_id: elements.conciliarTipo.value === 'gasto' ? elements.gastoId.value || null : null,
        venta_id: elements.conciliarTipo.value === 'venta' ? elements.ventaId.value || null : null
      };
      elements.submitModal.classList.add('loading'); elements.submitModal.disabled = true;
      try {
        if (state.editingId) await api.updateTransaccion(state.editingId, d); else await api.createTransaccion(d);
        this.closeTxModal(); await this.loadData();
      } catch (e) { alert(e.message); }
      finally { elements.submitModal.classList.remove('loading'); elements.submitModal.disabled = false; }
    },
    handleConciliarChange() {
      const tipo = elements.conciliarTipo.value;
      elements.conciliarGastoGroup.style.display = tipo === 'gasto' ? 'block' : 'none';
      elements.conciliarVentaGroup.style.display = tipo === 'venta' ? 'block' : 'none';
    },
    handleFileSelect(e) {
      const file = e.target.files[0];
      if (file) {
        state.comprobanteData = file.name; // En producción subirías a Cloudinary
        elements.comprobanteUpload.classList.add('has-file');
        elements.comprobantePreview.style.display = 'flex';
        elements.comprobanteFileName.textContent = file.name;
      }
    },
    removeComprobante() {
      state.comprobanteData = null;
      elements.comprobanteFile.value = '';
      elements.comprobanteUpload.classList.remove('has-file');
      elements.comprobantePreview.style.display = 'none';
    },
    // Cuenta Modal
    openCuentaModal() { elements.cuentaForm.reset(); elements.cuentaModal.classList.add('active'); elements.cuentaNombre.focus(); },
    closeCuentaModal() { elements.cuentaModal.classList.remove('active'); },
    async submitCuenta(e) {
      e.preventDefault();
      try {
        const data = await api.createCuenta({
          nombre: elements.cuentaNombre.value.trim(),
          banco: elements.cuentaBanco.value.trim() || null,
          saldo_inicial: parseFloat(elements.cuentaSaldo.value) || 0,
          ultimos_digitos: elements.cuentaDigitos.value.trim() || null
        });
        state.cuentas.push(data.cuenta || data);
        render.cuentas();
        elements.cuentaId.value = data.cuenta?.id || data.id;
        this.closeCuentaModal();
      } catch (e) { alert(e.message); }
    },
    // Delete
    openDeleteModal(t) { state.deletingId = t.id; elements.deleteModal.classList.add('active'); },
    closeDeleteModal() { elements.deleteModal.classList.remove('active'); state.deletingId = null; },
    async confirmDelete() {
      elements.confirmDelete.classList.add('loading'); elements.confirmDelete.disabled = true;
      try { await api.deleteTransaccion(state.deletingId); this.closeDeleteModal(); await this.loadData(); }
      catch (e) { alert(e.message); }
      finally { elements.confirmDelete.classList.remove('loading'); elements.confirmDelete.disabled = false; }
    },
    // Filters
    applyFilters() {
      state.filters.buscar = elements.searchInput.value.trim();
      state.filters.tipo = elements.filterType.value;
      state.filters.cuenta_bancaria_id = elements.filterCuenta.value;
      state.filters.conciliado = elements.filterConciliado.value;
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

    // Sidebar
    elements.menuToggle.addEventListener('click', () => handlers.toggleSidebar());
    elements.sidebarOverlay.addEventListener('click', () => handlers.closeSidebar());
    elements.orgSwitcher.addEventListener('click', () => handlers.switchOrg());

    // Add buttons
    elements.addTxBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.addFirstTxBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.fabBtn.addEventListener('click', () => handlers.openCreateModal());

    // Tx modal
    elements.closeModal.addEventListener('click', () => handlers.closeTxModal());
    elements.cancelModal.addEventListener('click', () => handlers.closeTxModal());
    elements.txForm.addEventListener('submit', e => handlers.submitTx(e));
    elements.txModal.addEventListener('click', e => { if (e.target === elements.txModal) handlers.closeTxModal(); });

    // Form interactions
    elements.conciliarTipo.addEventListener('change', () => handlers.handleConciliarChange());
    elements.comprobanteUpload.addEventListener('click', () => elements.comprobanteFile.click());
    elements.comprobanteFile.addEventListener('change', e => handlers.handleFileSelect(e));
    elements.removeComprobante.addEventListener('click', e => { e.stopPropagation(); handlers.removeComprobante(); });
    elements.addCuentaBtn.addEventListener('click', () => handlers.openCuentaModal());

    // Cuenta modal
    elements.closeCuentaModal.addEventListener('click', () => handlers.closeCuentaModal());
    elements.cancelCuentaModal.addEventListener('click', () => handlers.closeCuentaModal());
    elements.cuentaForm.addEventListener('submit', e => handlers.submitCuenta(e));
    elements.cuentaModal.addEventListener('click', e => { if (e.target === elements.cuentaModal) handlers.closeCuentaModal(); });

    // Delete modal
    elements.closeDeleteModal.addEventListener('click', () => handlers.closeDeleteModal());
    elements.cancelDeleteModal.addEventListener('click', () => handlers.closeDeleteModal());
    elements.confirmDelete.addEventListener('click', () => handlers.confirmDelete());
    elements.deleteModal.addEventListener('click', e => { if (e.target === elements.deleteModal) handlers.closeDeleteModal(); });

    // Filters
    const df = utils.debounce(() => handlers.applyFilters(), 300);
    elements.searchInput.addEventListener('input', df);
    elements.filterType.addEventListener('change', () => handlers.applyFilters());
    elements.filterCuenta.addEventListener('change', () => handlers.applyFilters());
    elements.filterConciliado.addEventListener('change', () => handlers.applyFilters());
    elements.prevPage.addEventListener('click', () => handlers.prevPage());
    elements.nextPage.addEventListener('click', () => handlers.nextPage());

    // ESC key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { handlers.closeTxModal(); handlers.closeCuentaModal(); handlers.closeDeleteModal(); }
    });

    handlers.loadData();
    console.log('🚀 TRUNO Transacciones v2 initialized');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
