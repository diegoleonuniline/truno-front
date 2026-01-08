/**
 * TRUNO - Transacciones v5
 * Con modales completos de gasto/venta idénticos al original
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
    searchInput: $('searchInput'), filterType: $('filterType'), filterCuenta: $('filterCuenta'), 
    filterContacto: $('filterContacto'), filterConciliado: $('filterConciliado'),
    tableContainer: $('tableContainer'), tableBody: $('tableBody'), mobileCards: $('mobileCards'), emptyState: $('emptyState'),
    pagination: $('pagination'), showingStart: $('showingStart'), showingEnd: $('showingEnd'), totalRecords: $('totalRecords'),
    prevPage: $('prevPage'), nextPage: $('nextPage'),
    addTxBtn: $('addTxBtn'), addFirstTxBtn: $('addFirstTxBtn'), fabBtn: $('fabBtn'),
    // Detail Modal
    detailModal: $('detailModal'), closeDetailModal: $('closeDetailModal'), closeDetailBtn: $('closeDetailBtn'),
    detailAmount: $('detailAmount'), detailGrid: $('detailGrid'), detailConciliacion: $('detailConciliacion'),
    editFromDetailBtn: $('editFromDetailBtn'),
    // Tx Modal
    txModal: $('txModal'), txForm: $('txForm'), modalTitle: $('modalTitle'),
    closeModal: $('closeModal'), cancelModal: $('cancelModal'), submitModal: $('submitModal'),
    tipo: $('tipo'), cuentaId: $('cuentaId'), monto: $('monto'), fecha: $('fecha'),
    contactoId: $('contactoId'), descripcion: $('descripcion'), referencia: $('referencia'),
    addCuentaBtn: $('addCuentaBtn'),
    // Gasto Modal (completo)
    gastoModal: $('gastoModal'), gastoForm: $('gastoForm'), closeGastoModal: $('closeGastoModal'),
    cancelGastoModal: $('cancelGastoModal'), submitGastoModal: $('submitGastoModal'),
    gastoFromTxInfo: $('gastoFromTxInfo'), gastoFromTxBox: $('gastoFromTxBox'),
    gastoConcepto: $('gastoConcepto'), gastoProveedor: $('gastoProveedor'),
    gastoFecha: $('gastoFecha'), gastoFechaVencimiento: $('gastoFechaVencimiento'),
    gastoCategoria: $('gastoCategoria'), gastoSubcategoria: $('gastoSubcategoria'),
    gastoSubtotal: $('gastoSubtotal'), gastoImpuesto: $('gastoImpuesto'), gastoTotal: $('gastoTotal'),
    gastoMoneda: $('gastoMoneda'), gastoMetodoPago: $('gastoMetodoPago'),
    gastoEsFiscal: $('gastoEsFiscal'), gastoFiscalFields: $('gastoFiscalFields'),
    gastoFacturaRecibida: $('gastoFacturaRecibida'),
    gastoUuid: $('gastoUuid'), gastoFolio: $('gastoFolio'), gastoNotas: $('gastoNotas'),
    // Venta Modal
    ventaModal: $('ventaModal'), ventaForm: $('ventaForm'), closeVentaModal: $('closeVentaModal'),
    cancelVentaModal: $('cancelVentaModal'), submitVentaModal: $('submitVentaModal'),
    ventaFromTxInfo: $('ventaFromTxInfo'), ventaFromTxBox: $('ventaFromTxBox'),
    ventaFolio: $('ventaFolio'), ventaCliente: $('ventaCliente'), ventaFecha: $('ventaFecha'),
    ventaSubtotal: $('ventaSubtotal'), ventaImpuesto: $('ventaImpuesto'), ventaTotal: $('ventaTotal'),
    ventaConcepto: $('ventaConcepto'),
    // Cuenta Modal
    cuentaModal: $('cuentaModal'), cuentaForm: $('cuentaForm'), closeCuentaModal: $('closeCuentaModal'),
    cancelCuentaModal: $('cancelCuentaModal'), cuentaNombre: $('cuentaNombre'), cuentaBanco: $('cuentaBanco'), cuentaSaldo: $('cuentaSaldo'),
    // Delete Modal
    deleteModal: $('deleteModal'), closeDeleteModal: $('closeDeleteModal'), cancelDeleteModal: $('cancelDeleteModal'), confirmDelete: $('confirmDelete')
  };

  let state = {
    user: null, org: null, 
    transacciones: [], cuentas: [], contactos: [], categorias: [],
    paginacion: { pagina: 1, limite: 20, total: 0, paginas: 0 },
    editingId: null, deletingId: null, viewingTx: null,
    filters: { buscar: '', tipo: '', cuenta_bancaria_id: '', contacto_id: '', conciliado: '' }
  };

  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: url => window.location.href = url,
    getInitials: n => (n?.charAt(0) || '') + (n?.split(' ')[1]?.charAt(0) || ''),
    formatMoney: (a, c = 'MXN') => new Intl.NumberFormat('es-MX', { style: 'currency', currency: c }).format(a || 0),
    formatDate: d => d ? new Date(d + 'T00:00:00').toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }) : '-',
    formatDateInput: d => d ? d.split('T')[0] : '',
    today: () => new Date().toISOString().split('T')[0],
    debounce: (fn, delay) => { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; }
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
      if (p.contacto_id) params.contacto_id = p.contacto_id;
      if (p.conciliado === '1') params.conciliado = '1';
      if (p.conciliado === '0') params.sin_conciliar = '1';
      return this.request(`/api/transacciones?${new URLSearchParams(params)}`);
    },
    createTransaccion: d => api.request('/api/transacciones', { method: 'POST', body: JSON.stringify(d) }),
    updateTransaccion: (id, d) => api.request(`/api/transacciones/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    deleteTransaccion: id => api.request(`/api/transacciones/${id}`, { method: 'DELETE' }),
    getCuentas: () => api.request('/api/cuentas-bancarias'),
    createCuenta: d => api.request('/api/cuentas-bancarias', { method: 'POST', body: JSON.stringify(d) }),
    getContactos: () => api.request('/api/contactos?limite=200'),
    getCategorias: () => api.request('/api/categorias?tipo=gasto'),
    getSubcategorias: catId => api.request(`/api/categorias/${catId}/subcategorias`),
    createGasto: d => api.request('/api/gastos', { method: 'POST', body: JSON.stringify(d) }),
    createVenta: d => api.request('/api/ventas', { method: 'POST', body: JSON.stringify(d) }),
    getGasto: id => api.request(`/api/gastos/${id}`),
    getVenta: id => api.request(`/api/ventas/${id}`)
  };

  const render = {
    user() { if (state.user) elements.userAvatar.textContent = utils.getInitials(state.user.nombre); },
    org() { if (state.org) { elements.orgName.textContent = state.org.nombre; elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`; } },
    cuentas() {
      const opts = state.cuentas.map(c => `<option value="${c.id}">${c.nombre} (${utils.formatMoney(c.saldo_actual)})</option>`).join('');
      elements.cuentaId.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
      elements.filterCuenta.innerHTML = '<option value="">Cuenta</option>' + opts;
    },
    contactos() {
      const provOpts = state.contactos.filter(c => c.tipo === 'proveedor' || c.tipo === 'ambos').map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      const cliOpts = state.contactos.filter(c => c.tipo === 'cliente' || c.tipo === 'ambos').map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      const allOpts = state.contactos.map(c => `<option value="${c.id}">${c.nombre}${c.tipo !== 'ambos' ? ` (${c.tipo})` : ''}</option>`).join('');
      elements.contactoId.innerHTML = '<option value="">-- Sin contacto --</option>' + allOpts;
      elements.filterContacto.innerHTML = '<option value="">Contacto</option>' + allOpts;
      elements.gastoProveedor.innerHTML = '<option value="">-- Seleccionar --</option>' + provOpts;
      elements.ventaCliente.innerHTML = '<option value="">-- Seleccionar --</option>' + cliOpts;
    },
    categorias() {
      elements.gastoCategoria.innerHTML = '<option value="">-- Seleccionar --</option>' + state.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    },
    subcategorias(subcats) {
      elements.gastoSubcategoria.innerHTML = '<option value="">-- Seleccionar --</option>' + (subcats || []).map(s => `<option value="${s.id}">${s.nombre}</option>`).join('');
    },
    transacciones() {
      const { transacciones, paginacion } = state;
      if (!transacciones.length) { 
        elements.tableContainer.style.display = 'none'; 
        elements.mobileCards.innerHTML = ''; 
        elements.emptyState.style.display = 'block'; 
        elements.pagination.style.display = 'none'; 
        return; 
      }
      elements.emptyState.style.display = 'none'; 
      elements.tableContainer.style.display = 'block'; 
      elements.pagination.style.display = 'flex';
      
      const start = (paginacion.pagina - 1) * paginacion.limite + 1;
      const end = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);
      elements.showingStart.textContent = start; 
      elements.showingEnd.textContent = end; 
      elements.totalRecords.textContent = paginacion.total;
      elements.prevPage.disabled = paginacion.pagina <= 1; 
      elements.nextPage.disabled = paginacion.pagina >= paginacion.paginas;

      elements.tableBody.innerHTML = transacciones.map(t => {
        const isIncome = t.tipo === 'ingreso';
        const conciliado = t.gasto_id || t.venta_id;
        return `<tr data-id="${t.id}" class="clickable-row">
          <td><div class="cell-main">${t.descripcion || 'Sin descripción'}</div><div class="cell-sub">${t.referencia || ''}</div></td>
          <td>${utils.formatDate(t.fecha)}</td>
          <td>${t.nombre_cuenta || '-'}</td>
          <td>${t.nombre_contacto || '-'}</td>
          <td><div class="badges-group">
            <span class="badge ${t.tipo}">${isIncome ? 'Ingreso' : 'Egreso'}</span>
            ${conciliado ? '<span class="badge conciliado">Conciliado</span>' : '<span class="badge pendiente">Pendiente</span>'}
          </div></td>
          <td style="text-align:right;"><div class="cell-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto))}</div></td>
          <td><div class="table-actions">
            <button class="action-btn" title="Ver" data-action="view" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
            <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div></td>
        </tr>`;
      }).join('');

      elements.mobileCards.innerHTML = transacciones.map(t => {
        const isIncome = t.tipo === 'ingreso';
        const conciliado = t.gasto_id || t.venta_id;
        return `<div class="mobile-card" data-id="${t.id}">
          <div class="mobile-card-header">
            <div class="mobile-card-title">${t.descripcion || 'Sin descripción'}</div>
            <div class="mobile-card-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto))}</div>
          </div>
          <div class="mobile-card-meta">
            <span>${utils.formatDate(t.fecha)}</span>
            <span>${t.nombre_cuenta || '-'}</span>
          </div>
          <div class="mobile-card-badges">
            <span class="badge ${t.tipo}">${isIncome ? 'Ingreso' : 'Egreso'}</span>
            ${conciliado ? '<span class="badge conciliado">Conciliado</span>' : '<span class="badge pendiente">Pendiente</span>'}
          </div>
        </div>`;
      }).join('');

      // Events
      elements.tableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', e => {
          if (e.target.closest('.action-btn')) return;
          handlers.openDetailModal(state.transacciones.find(t => t.id === row.dataset.id));
        });
      });
      elements.tableBody.querySelectorAll('[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', () => handlers.openDetailModal(state.transacciones.find(t => t.id === btn.dataset.id)));
      });
      elements.tableBody.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', () => handlers.openDeleteModal(state.transacciones.find(t => t.id === btn.dataset.id)));
      });
      elements.mobileCards.querySelectorAll('.mobile-card').forEach(card => {
        card.addEventListener('click', () => handlers.openDetailModal(state.transacciones.find(t => t.id === card.dataset.id)));
      });
    }
  };

  const handlers = {
    toggleSidebar() { elements.sidebar.classList.toggle('open'); elements.sidebarOverlay.classList.toggle('active'); },
    closeSidebar() { elements.sidebar.classList.remove('open'); elements.sidebarOverlay.classList.remove('active'); },
    async loadData() {
      try {
        const [txRes, cuentasRes, contactosRes, catRes] = await Promise.all([
          api.getTransacciones({ ...state.filters, pagina: state.paginacion.pagina, limite: state.paginacion.limite }),
          api.getCuentas(),
          api.getContactos(),
          api.getCategorias().catch(() => ({ categorias: [] }))
        ]);
        state.transacciones = txRes.transacciones || [];
        state.paginacion = txRes.paginacion || { pagina: 1, limite: 20, total: 0, paginas: 0 };
        state.cuentas = cuentasRes.cuentas || [];
        state.contactos = contactosRes.contactos || [];
        state.categorias = catRes.categorias || [];
        render.cuentas();
        render.contactos();
        render.categorias();
        render.transacciones();
      } catch (e) { console.error(e); }
    },
    // Detail Modal
    async openDetailModal(tx) {
      if (!tx) return;
      state.viewingTx = tx;
      const isIncome = tx.tipo === 'ingreso';
      const conciliado = tx.gasto_id || tx.venta_id;

      elements.detailAmount.innerHTML = `
        <div class="detail-amount-value ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(tx.monto))}</div>
        <div class="detail-amount-label">${isIncome ? '💰 Ingreso' : '💸 Egreso'}</div>
      `;

      const contacto = state.contactos.find(c => c.id === tx.contacto_id);
      elements.detailGrid.innerHTML = `
        <div class="detail-item"><label>Fecha</label><span>${utils.formatDate(tx.fecha)}</span></div>
        <div class="detail-item"><label>Cuenta</label><span>${tx.nombre_cuenta || '-'}</span></div>
        <div class="detail-item"><label>Contacto</label><span>${contacto?.nombre || tx.nombre_contacto || '-'}</span></div>
        <div class="detail-item"><label>Descripción</label><span>${tx.descripcion || '-'}</span></div>
        <div class="detail-item"><label>Referencia</label><span>${tx.referencia || '-'}</span></div>
      `;

      if (conciliado) {
        let infoHtml = '<div class="conciliacion-header"><span class="badge conciliado">✓ Conciliado</span></div>';
        try {
          if (tx.gasto_id) {
            const g = await api.getGasto(tx.gasto_id);
            infoHtml += `<div class="conciliacion-info">
              <div class="conciliacion-tipo">Gasto vinculado</div>
              <div class="conciliacion-detalle"><strong>${g.concepto || 'Sin concepto'}</strong><br>${g.nombre_proveedor || ''} • ${utils.formatMoney(g.total)}</div>
            </div>`;
          } else if (tx.venta_id) {
            const v = await api.getVenta(tx.venta_id);
            infoHtml += `<div class="conciliacion-info">
              <div class="conciliacion-tipo">Venta vinculada</div>
              <div class="conciliacion-detalle"><strong>${v.folio || 'Sin folio'}</strong><br>${v.nombre_contacto || ''} • ${utils.formatMoney(v.total)}</div>
            </div>`;
          }
        } catch (e) { console.error(e); }
        elements.detailConciliacion.innerHTML = infoHtml;
      } else {
        const btnLabel = isIncome ? 'Registrar Venta' : 'Registrar Gasto';
        const btnAction = isIncome ? 'openVentaFromTx' : 'openGastoFromTx';
        elements.detailConciliacion.innerHTML = `
          <div class="conciliacion-header"><span class="badge pendiente">⏳ Sin conciliar</span></div>
          <div class="conciliacion-actions">
            <p>Este movimiento no está vinculado a ningún documento.</p>
            <button type="button" class="btn btn-primary" id="createFromTxBtn">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              ${btnLabel}
            </button>
          </div>
        `;
        setTimeout(() => {
          $('createFromTxBtn')?.addEventListener('click', () => handlers[btnAction]());
        }, 10);
      }

      elements.detailModal.classList.add('active');
    },
    closeDetailModal() { elements.detailModal.classList.remove('active'); state.viewingTx = null; },
    editFromDetail() {
      if (state.viewingTx) { this.closeDetailModal(); this.openEditModal(state.viewingTx); }
    },
    // Tx Modal
    openCreateModal() {
      state.editingId = null;
      elements.modalTitle.textContent = 'Nuevo Movimiento';
      elements.txForm.reset();
      elements.fecha.value = utils.today();
      elements.txModal.classList.add('active');
    },
    openEditModal(tx) {
      state.editingId = tx.id;
      elements.modalTitle.textContent = 'Editar Movimiento';
      elements.tipo.value = tx.tipo;
      elements.cuentaId.value = tx.cuenta_bancaria_id;
      elements.monto.value = tx.monto;
      elements.fecha.value = utils.formatDateInput(tx.fecha);
      elements.contactoId.value = tx.contacto_id || '';
      elements.descripcion.value = tx.descripcion || '';
      elements.referencia.value = tx.referencia || '';
      elements.txModal.classList.add('active');
    },
    closeTxModal() { elements.txModal.classList.remove('active'); state.editingId = null; },
    async submitTx(e) {
      e.preventDefault();
      const d = {
        tipo: elements.tipo.value,
        cuenta_bancaria_id: elements.cuentaId.value,
        monto: parseFloat(elements.monto.value),
        fecha: elements.fecha.value,
        contacto_id: elements.contactoId.value || null,
        descripcion: elements.descripcion.value.trim() || null,
        referencia: elements.referencia.value.trim() || null
      };
      elements.submitModal.disabled = true;
      try {
        if (state.editingId) await api.updateTransaccion(state.editingId, d);
        else await api.createTransaccion(d);
        this.closeTxModal();
        await this.loadData();
      } catch (e) { alert(e.message); }
      finally { elements.submitModal.disabled = false; }
    },
    // Gasto from Tx
    openGastoFromTx() {
      const tx = state.viewingTx;
      if (!tx) return;
      this.closeDetailModal();
      
      elements.gastoForm.reset();
      elements.gastoFromTxBox.style.display = 'block';
      elements.gastoFromTxInfo.textContent = `${utils.formatMoney(tx.monto)} del ${utils.formatDate(tx.fecha)}`;
      elements.gastoConcepto.value = tx.descripcion || '';
      elements.gastoProveedor.value = tx.contacto_id || '';
      elements.gastoFecha.value = utils.formatDateInput(tx.fecha);
      elements.gastoTotal.value = tx.monto;
      elements.gastoSubtotal.value = '';
      elements.gastoImpuesto.value = '';
      elements.gastoFiscalFields.style.display = 'none';
      elements.gastoEsFiscal.checked = false;
      render.subcategorias([]);
      
      elements.gastoModal.classList.add('active');
    },
    closeGastoModal() { elements.gastoModal.classList.remove('active'); },
    async loadSubcategorias() {
      const catId = elements.gastoCategoria.value;
      if (!catId) { render.subcategorias([]); return; }
      try {
        const res = await api.getSubcategorias(catId);
        render.subcategorias(res.subcategorias || []);
      } catch (e) { render.subcategorias([]); }
    },
    calcGastoTotal() {
      const sub = parseFloat(elements.gastoSubtotal.value) || 0;
      const iva = parseFloat(elements.gastoImpuesto.value) || 0;
      if (sub > 0) elements.gastoTotal.value = (sub + iva).toFixed(2);
    },
    async submitGasto(e) {
      e.preventDefault();
      const tx = state.viewingTx;
      
      const gastoData = {
        concepto: elements.gastoConcepto.value.trim(),
        proveedor_id: elements.gastoProveedor.value || null,
        categoria_id: elements.gastoCategoria.value || null,
        subcategoria_id: elements.gastoSubcategoria.value || null,
        fecha: elements.gastoFecha.value,
        fecha_vencimiento: elements.gastoFechaVencimiento.value || null,
        metodo_pago: elements.gastoMetodoPago.value || null,
        moneda: elements.gastoMoneda.value,
        subtotal: parseFloat(elements.gastoSubtotal.value) || parseFloat(elements.gastoTotal.value),
        impuesto: parseFloat(elements.gastoImpuesto.value) || 0,
        total: parseFloat(elements.gastoTotal.value),
        es_fiscal: elements.gastoEsFiscal.checked ? 1 : 0,
        factura_recibida: elements.gastoFacturaRecibida?.checked ? 1 : 0,
        uuid_cfdi: elements.gastoUuid.value.trim() || null,
        folio_cfdi: elements.gastoFolio.value.trim() || null,
        notas: elements.gastoNotas.value.trim() || null,
        transaccion_id: tx?.id || null
      };
      
      elements.submitGastoModal.disabled = true;
      try {
        const result = await api.createGasto(gastoData);
        // Vincular transacción al gasto
        if (tx?.id && result.id) {
          await api.updateTransaccion(tx.id, { gasto_id: result.id });
        }
        this.closeGastoModal();
        state.viewingTx = null;
        await this.loadData();
        alert('✅ Gasto registrado y conciliado');
      } catch (e) { alert(e.message); }
      finally { elements.submitGastoModal.disabled = false; }
    },
    // Venta from Tx
    openVentaFromTx() {
      const tx = state.viewingTx;
      if (!tx) return;
      this.closeDetailModal();
      
      elements.ventaForm.reset();
      elements.ventaFromTxBox.style.display = 'block';
      elements.ventaFromTxInfo.textContent = `${utils.formatMoney(tx.monto)} del ${utils.formatDate(tx.fecha)}`;
      elements.ventaCliente.value = tx.contacto_id || '';
      elements.ventaFecha.value = utils.formatDateInput(tx.fecha);
      elements.ventaTotal.value = tx.monto;
      elements.ventaSubtotal.value = '';
      elements.ventaImpuesto.value = '';
      elements.ventaConcepto.value = tx.descripcion || '';
      
      elements.ventaModal.classList.add('active');
    },
    closeVentaModal() { elements.ventaModal.classList.remove('active'); },
    calcVentaTotal() {
      const sub = parseFloat(elements.ventaSubtotal.value) || 0;
      const iva = parseFloat(elements.ventaImpuesto.value) || 0;
      if (sub > 0) elements.ventaTotal.value = (sub + iva).toFixed(2);
    },
    async submitVenta(e) {
      e.preventDefault();
      const tx = state.viewingTx;
      
      const ventaData = {
        folio: elements.ventaFolio.value.trim() || null,
        contacto_id: elements.ventaCliente.value || null,
        fecha: elements.ventaFecha.value,
        subtotal: parseFloat(elements.ventaSubtotal.value) || parseFloat(elements.ventaTotal.value),
        total: parseFloat(elements.ventaTotal.value),
        concepto: elements.ventaConcepto.value.trim() || null,
        estatus: 'cobrada'
      };
      
      elements.submitVentaModal.disabled = true;
      try {
        const result = await api.createVenta(ventaData);
        if (tx?.id && result.id) {
          await api.updateTransaccion(tx.id, { venta_id: result.id });
        }
        this.closeVentaModal();
        state.viewingTx = null;
        await this.loadData();
        alert('✅ Venta registrada y conciliada');
      } catch (e) { alert(e.message); }
      finally { elements.submitVentaModal.disabled = false; }
    },
    // Cuenta Modal
    openCuentaModal() { elements.cuentaForm.reset(); elements.cuentaModal.classList.add('active'); },
    closeCuentaModal() { elements.cuentaModal.classList.remove('active'); },
    async submitCuenta(e) {
      e.preventDefault();
      try {
        const data = await api.createCuenta({
          nombre: elements.cuentaNombre.value.trim(),
          banco: elements.cuentaBanco.value.trim() || null,
          saldo_inicial: parseFloat(elements.cuentaSaldo.value) || 0
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
      elements.confirmDelete.disabled = true;
      try { await api.deleteTransaccion(state.deletingId); this.closeDeleteModal(); await this.loadData(); }
      catch (e) { alert(e.message); }
      finally { elements.confirmDelete.disabled = false; }
    },
    // Filters
    applyFilters() {
      state.filters.buscar = elements.searchInput.value.trim();
      state.filters.tipo = elements.filterType.value;
      state.filters.cuenta_bancaria_id = elements.filterCuenta.value;
      state.filters.contacto_id = elements.filterContacto.value;
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
    state.org = utils.getOrg();
    if (!state.org) { utils.redirect(CONFIG.REDIRECT.SELECT_ORG); return; }
    state.user = utils.getUser();
    render.user();
    render.org();

    // Sidebar
    elements.menuToggle.addEventListener('click', () => handlers.toggleSidebar());
    elements.sidebarOverlay.addEventListener('click', () => handlers.closeSidebar());
    elements.orgSwitcher.addEventListener('click', () => handlers.switchOrg());

    // Add buttons
    elements.addTxBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.addFirstTxBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.fabBtn.addEventListener('click', () => handlers.openCreateModal());

    // Detail modal
    elements.closeDetailModal.addEventListener('click', () => handlers.closeDetailModal());
    elements.closeDetailBtn.addEventListener('click', () => handlers.closeDetailModal());
    elements.editFromDetailBtn.addEventListener('click', () => handlers.editFromDetail());
    elements.detailModal.addEventListener('click', e => { if (e.target === elements.detailModal) handlers.closeDetailModal(); });

    // Tx modal
    elements.closeModal.addEventListener('click', () => handlers.closeTxModal());
    elements.cancelModal.addEventListener('click', () => handlers.closeTxModal());
    elements.txForm.addEventListener('submit', e => handlers.submitTx(e));
    elements.txModal.addEventListener('click', e => { if (e.target === elements.txModal) handlers.closeTxModal(); });
    elements.addCuentaBtn.addEventListener('click', () => handlers.openCuentaModal());

    // Gasto modal
    elements.closeGastoModal.addEventListener('click', () => handlers.closeGastoModal());
    elements.cancelGastoModal.addEventListener('click', () => handlers.closeGastoModal());
    elements.gastoForm.addEventListener('submit', e => handlers.submitGasto(e));
    elements.gastoModal.addEventListener('click', e => { if (e.target === elements.gastoModal) handlers.closeGastoModal(); });
    elements.gastoCategoria.addEventListener('change', () => handlers.loadSubcategorias());
    elements.gastoSubtotal.addEventListener('input', () => handlers.calcGastoTotal());
    elements.gastoImpuesto.addEventListener('input', () => handlers.calcGastoTotal());
    elements.gastoEsFiscal.addEventListener('change', () => {
      elements.gastoFiscalFields.style.display = elements.gastoEsFiscal.checked ? 'block' : 'none';
    });

    // Venta modal
    elements.closeVentaModal.addEventListener('click', () => handlers.closeVentaModal());
    elements.cancelVentaModal.addEventListener('click', () => handlers.closeVentaModal());
    elements.ventaForm.addEventListener('submit', e => handlers.submitVenta(e));
    elements.ventaModal.addEventListener('click', e => { if (e.target === elements.ventaModal) handlers.closeVentaModal(); });
    elements.ventaSubtotal.addEventListener('input', () => handlers.calcVentaTotal());
    elements.ventaImpuesto.addEventListener('input', () => handlers.calcVentaTotal());

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
    elements.filterContacto.addEventListener('change', () => handlers.applyFilters());
    elements.filterConciliado.addEventListener('change', () => handlers.applyFilters());
    elements.prevPage.addEventListener('click', () => handlers.prevPage());
    elements.nextPage.addEventListener('click', () => handlers.nextPage());

    // ESC
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        handlers.closeDetailModal(); handlers.closeTxModal(); handlers.closeGastoModal();
        handlers.closeVentaModal(); handlers.closeCuentaModal(); handlers.closeDeleteModal();
      }
    });

    handlers.loadData();
    console.log('🚀 TRUNO Transacciones v5');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
