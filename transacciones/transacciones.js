/**
 * TRUNO - Transacciones v3
 * Con detalle, filtro contacto y acción rápida crear gasto/venta
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
    user: null, org: null, transacciones: [], cuentas: [], contactos: [], gastos: [], ventas: [],
    paginacion: { pagina: 1, limite: 20, total: 0, paginas: 0 },
    editingId: null, deletingId: null, viewingTx: null, comprobanteData: null,
    filters: { buscar: '', tipo: '', cuenta_bancaria_id: '', contacto_id: '', conciliado: '' }
  };

  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: (url) => window.location.href = url,
    getInitials(n) { return (n?.charAt(0).toUpperCase() || '') + (n?.split(' ')[1]?.charAt(0).toUpperCase() || ''); },
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
      if (p.contacto_id) params.contacto_id = p.contacto_id;
      if (p.conciliado === '1') params.conciliado = '1';
      if (p.conciliado === '0') params.sin_conciliar = '1';
      return this.request(`/api/transacciones?${new URLSearchParams(params)}`);
    },
    createTransaccion(d) { return this.request('/api/transacciones', { method: 'POST', body: JSON.stringify(d) }); },
    updateTransaccion(id, d) { return this.request(`/api/transacciones/${id}`, { method: 'PUT', body: JSON.stringify(d) }); },
    deleteTransaccion(id) { return this.request(`/api/transacciones/${id}`, { method: 'DELETE' }); },
    getCuentas() { return this.request('/api/cuentas-bancarias'); },
    createCuenta(d) { return this.request('/api/cuentas-bancarias', { method: 'POST', body: JSON.stringify(d) }); },
    getContactos() { return this.request('/api/contactos?limite=200'); },
    getGastosSinConciliar(contactoId) { 
      let url = '/api/gastos?sin_conciliar=1&limite=50';
      if (contactoId) url += `&proveedor_id=${contactoId}`;
      return this.request(url); 
    },
    getVentasSinConciliar(contactoId) { 
      let url = '/api/ventas?estatus=pendiente&limite=50';
      if (contactoId) url += `&cliente_id=${contactoId}`;
      return this.request(url); 
    },
    getGasto(id) { return this.request(`/api/gastos/${id}`); },
    getVenta(id) { return this.request(`/api/ventas/${id}`); }
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
      const opts = state.contactos.map(c => `<option value="${c.id}">${c.nombre}${c.empresa ? ` - ${c.empresa}` : ''}</option>`).join('');
      elements.contactoId.innerHTML = '<option value="">-- Sin contacto --</option>' + opts;
      elements.filterContacto.innerHTML = '<option value="">Contacto</option>' + opts;
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

      // Table
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
            ${t.comprobante_url ? '<span class="badge comprobante">📎</span>' : ''}
          </div></td>
          <td style="text-align:right;"><div class="cell-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto))}</div></td>
          <td><div class="table-actions">
            <button class="action-btn" title="Ver" data-action="view" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
            <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div></td>
        </tr>`;
      }).join('');

      // Mobile cards
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
            ${t.nombre_contacto ? `<span>${t.nombre_contacto}</span>` : ''}
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
        const [txRes, cuentasRes, contactosRes] = await Promise.all([
          api.getTransacciones({ ...state.filters, pagina: state.paginacion.pagina, limite: state.paginacion.limite }),
          api.getCuentas(),
          api.getContactos()
        ]);
        state.transacciones = txRes.transacciones || [];
        state.paginacion = txRes.paginacion || { pagina: 1, limite: 20, total: 0, paginas: 0 };
        state.cuentas = cuentasRes.cuentas || [];
        state.contactos = contactosRes.contactos || [];
        render.cuentas();
        render.contactos();
        render.transacciones();
      } catch (e) { console.error(e); }
    },
    // Detail Modal
    async openDetailModal(tx) {
      if (!tx) return;
      state.viewingTx = tx;
      const isIncome = tx.tipo === 'ingreso';
      const conciliado = tx.gasto_id || tx.venta_id;

      // Amount header
      elements.detailAmount.innerHTML = `
        <div class="detail-amount-value ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(tx.monto))}</div>
        <div class="detail-amount-label">${isIncome ? '💰 Ingreso' : '💸 Egreso'}</div>
      `;

      // Info grid
      const cuenta = state.cuentas.find(c => c.id === tx.cuenta_bancaria_id);
      const contacto = state.contactos.find(c => c.id === tx.contacto_id);
      elements.detailGrid.innerHTML = `
        <div class="detail-item"><label>Fecha</label><span>${utils.formatDate(tx.fecha)}</span></div>
        <div class="detail-item"><label>Cuenta</label><span>${cuenta?.nombre || tx.nombre_cuenta || '-'}</span></div>
        <div class="detail-item"><label>Contacto</label><span>${contacto?.nombre || tx.nombre_contacto || '-'}</span></div>
        <div class="detail-item"><label>Descripción</label><span>${tx.descripcion || '-'}</span></div>
        <div class="detail-item"><label>Referencia</label><span>${tx.referencia || '-'}</span></div>
        ${tx.comprobante_url ? `<div class="detail-item full"><label>Comprobante</label><a href="${tx.comprobante_url}" target="_blank" class="btn btn-xs btn-outline">Ver comprobante</a></div>` : ''}
      `;

      // Conciliación section
      if (conciliado) {
        let infoHtml = '<div class="conciliacion-header"><span class="badge conciliado">✓ Conciliado</span></div>';
        try {
          if (tx.gasto_id) {
            const gasto = await api.getGasto(tx.gasto_id);
            infoHtml += `<div class="conciliacion-info">
              <div class="conciliacion-tipo">Gasto vinculado</div>
              <div class="conciliacion-detalle">
                <strong>${gasto.concepto || 'Sin concepto'}</strong><br>
                ${gasto.nombre_proveedor || 'Sin proveedor'} • ${utils.formatDate(gasto.fecha)} • ${utils.formatMoney(gasto.total)}
              </div>
              <a href="../gastos/index.html?id=${tx.gasto_id}" class="btn btn-xs btn-outline">Ver gasto</a>
            </div>`;
          } else if (tx.venta_id) {
            const venta = await api.getVenta(tx.venta_id);
            infoHtml += `<div class="conciliacion-info">
              <div class="conciliacion-tipo">Venta vinculada</div>
              <div class="conciliacion-detalle">
                <strong>${venta.folio || 'Sin folio'}</strong><br>
                ${venta.nombre_contacto || 'Sin cliente'} • ${utils.formatDate(venta.fecha)} • ${utils.formatMoney(venta.total)}
              </div>
              <a href="../ventas/index.html?id=${tx.venta_id}" class="btn btn-xs btn-outline">Ver venta</a>
            </div>`;
          }
        } catch (e) { console.error(e); }
        elements.detailConciliacion.innerHTML = infoHtml;
      } else {
        // Sin conciliar - mostrar botón para crear gasto/venta
        const tipoDoc = isIncome ? 'venta' : 'gasto';
        const tipoLabel = isIncome ? 'Venta' : 'Gasto';
        const params = new URLSearchParams({
          from_tx: tx.id,
          monto: tx.monto,
          fecha: tx.fecha,
          contacto_id: tx.contacto_id || '',
          descripcion: tx.descripcion || ''
        });
        elements.detailConciliacion.innerHTML = `
          <div class="conciliacion-header"><span class="badge pendiente">⏳ Sin conciliar</span></div>
          <div class="conciliacion-actions">
            <p>Este movimiento no está vinculado a ningún ${tipoDoc}.</p>
            <a href="../${tipoDoc}s/index.html?crear=1&${params.toString()}" class="btn btn-primary">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:16px;height:16px;margin-right:6px;"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
              Crear ${tipoLabel}
            </a>
          </div>
        `;
      }

      elements.detailModal.classList.add('active');
    },
    closeDetailModal() { 
      elements.detailModal.classList.remove('active'); 
      state.viewingTx = null; 
    },
    editFromDetail() {
      if (state.viewingTx) {
        this.closeDetailModal();
        this.openEditModal(state.viewingTx);
      }
    },
    // Create/Edit Modal
    openCreateModal() {
      state.editingId = null;
      elements.modalTitle.textContent = 'Nuevo Movimiento';
      elements.txForm.reset();
      elements.fecha.value = utils.today();
      elements.conciliarTipo.value = '';
      elements.conciliarGastoGroup.style.display = 'none';
      elements.conciliarVentaGroup.style.display = 'none';
      elements.comprobantePreview.style.display = 'none';
      elements.comprobanteUpload.classList.remove('has-file');
      state.comprobanteData = null;
      elements.txModal.classList.add('active');
      elements.tipo.focus();
    },
    async openEditModal(tx) {
      state.editingId = tx.id;
      elements.modalTitle.textContent = 'Editar Movimiento';
      elements.tipo.value = tx.tipo;
      elements.cuentaId.value = tx.cuenta_bancaria_id;
      elements.monto.value = tx.monto;
      elements.fecha.value = utils.formatDateInput(tx.fecha);
      elements.contactoId.value = tx.contacto_id || '';
      elements.descripcion.value = tx.descripcion || '';
      elements.referencia.value = tx.referencia || '';
      
      // Cargar gastos/ventas sin conciliar según contacto
      if (tx.contacto_id) {
        const [gastosRes, ventasRes] = await Promise.all([
          api.getGastosSinConciliar(tx.contacto_id),
          api.getVentasSinConciliar(tx.contacto_id)
        ]);
        state.gastos = gastosRes.gastos || [];
        state.ventas = ventasRes.ventas || [];
      } else {
        const [gastosRes, ventasRes] = await Promise.all([
          api.getGastosSinConciliar(),
          api.getVentasSinConciliar()
        ]);
        state.gastos = gastosRes.gastos || [];
        state.ventas = ventasRes.ventas || [];
      }
      render.gastos();
      render.ventas();

      if (tx.gasto_id) {
        elements.conciliarTipo.value = 'gasto';
        elements.conciliarGastoGroup.style.display = 'block';
        elements.gastoId.value = tx.gasto_id;
      } else if (tx.venta_id) {
        elements.conciliarTipo.value = 'venta';
        elements.conciliarVentaGroup.style.display = 'block';
        elements.ventaId.value = tx.venta_id;
      } else {
        elements.conciliarTipo.value = '';
        elements.conciliarGastoGroup.style.display = 'none';
        elements.conciliarVentaGroup.style.display = 'none';
      }

      if (tx.comprobante_url) {
        elements.comprobantePreview.style.display = 'flex';
        elements.comprobanteFileName.textContent = 'Comprobante actual';
        elements.comprobanteUpload.classList.add('has-file');
        state.comprobanteData = tx.comprobante_url;
      } else {
        elements.comprobantePreview.style.display = 'none';
        elements.comprobanteUpload.classList.remove('has-file');
        state.comprobanteData = null;
      }

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
        referencia: elements.referencia.value.trim() || null,
        comprobante_url: state.comprobanteData || null,
        gasto_id: elements.conciliarTipo.value === 'gasto' ? elements.gastoId.value || null : null,
        venta_id: elements.conciliarTipo.value === 'venta' ? elements.ventaId.value || null : null
      };
      elements.submitModal.classList.add('loading'); 
      elements.submitModal.disabled = true;
      try {
        if (state.editingId) await api.updateTransaccion(state.editingId, d); 
        else await api.createTransaccion(d);
        this.closeTxModal(); 
        await this.loadData();
      } catch (e) { alert(e.message); }
      finally { elements.submitModal.classList.remove('loading'); elements.submitModal.disabled = false; }
    },
    async handleConciliarChange() {
      const tipo = elements.conciliarTipo.value;
      const contactoId = elements.contactoId.value;
      elements.conciliarGastoGroup.style.display = tipo === 'gasto' ? 'block' : 'none';
      elements.conciliarVentaGroup.style.display = tipo === 'venta' ? 'block' : 'none';
      
      // Cargar gastos/ventas filtrados por contacto
      if (tipo === 'gasto') {
        const res = await api.getGastosSinConciliar(contactoId);
        state.gastos = res.gastos || [];
        render.gastos();
      } else if (tipo === 'venta') {
        const res = await api.getVentasSinConciliar(contactoId);
        state.ventas = res.ventas || [];
        render.ventas();
      }
    },
    handleFileSelect(e) {
      const file = e.target.files[0];
      if (file) {
        state.comprobanteData = file.name;
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
      elements.confirmDelete.classList.add('loading'); 
      elements.confirmDelete.disabled = true;
      try { 
        await api.deleteTransaccion(state.deletingId); 
        this.closeDeleteModal(); 
        await this.loadData(); 
      }
      catch (e) { alert(e.message); }
      finally { elements.confirmDelete.classList.remove('loading'); elements.confirmDelete.disabled = false; }
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

    // Form interactions
    elements.conciliarTipo.addEventListener('change', () => handlers.handleConciliarChange());
    elements.contactoId.addEventListener('change', () => handlers.handleConciliarChange());
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
    elements.filterContacto.addEventListener('change', () => handlers.applyFilters());
    elements.filterConciliado.addEventListener('change', () => handlers.applyFilters());
    elements.prevPage.addEventListener('click', () => handlers.prevPage());
    elements.nextPage.addEventListener('click', () => handlers.nextPage());

    // ESC key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') { 
        handlers.closeDetailModal();
        handlers.closeTxModal(); 
        handlers.closeCuentaModal(); 
        handlers.closeDeleteModal(); 
      }
    });

    handlers.loadData();
    console.log('🚀 TRUNO Transacciones v3');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
