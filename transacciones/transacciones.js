/**
 * TRUNO - Transacciones v8
 * Con toast notifications y texto "Saldo por conciliar"
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
    ingresosMes: $('ingresosMes'), egresosMes: $('egresosMes'), sinConciliar: $('sinConciliar'), balance: $('balance'),
    searchInput: $('searchInput'), filterType: $('filterType'), filterCuenta: $('filterCuenta'), filterConciliado: $('filterConciliado'),
    tableContainer: $('tableContainer'), tableBody: $('tableBody'), mobileCards: $('mobileCards'), emptyState: $('emptyState'),
    pagination: $('pagination'), showingStart: $('showingStart'), showingEnd: $('showingEnd'), totalRecords: $('totalRecords'),
    prevPage: $('prevPage'), nextPage: $('nextPage'),
    addTxBtn: $('addTxBtn'), addFirstTxBtn: $('addFirstTxBtn'), fabBtn: $('fabBtn'),
    detailModal: $('detailModal'), closeDetailModal: $('closeDetailModal'), closeDetailBtn: $('closeDetailBtn'),
    detailAmount: $('detailAmount'), detailGrid: $('detailGrid'), detailConciliacion: $('detailConciliacion'),
    editFromDetailBtn: $('editFromDetailBtn'),
    txModal: $('txModal'), txForm: $('txForm'), modalTitle: $('modalTitle'),
    closeModal: $('closeModal'), cancelModal: $('cancelModal'), submitModal: $('submitModal'),
    tipo: $('tipo'), cuentaId: $('cuentaId'), monto: $('monto'), fecha: $('fecha'),
    contactoId: $('contactoId'), descripcion: $('descripcion'), referencia: $('referencia'),
    addCuentaBtn: $('addCuentaBtn'),
    gastoModal: $('gastoModal'), gastoForm: $('gastoForm'), closeGastoModal: $('closeGastoModal'),
    cancelGastoModal: $('cancelGastoModal'), submitGastoModal: $('submitGastoModal'),
    gastoFromTxInfo: $('gastoFromTxInfo'), gastoFromTxBox: $('gastoFromTxBox'),
    gastoConcepto: $('gastoConcepto'), gastoProveedor: $('gastoProveedor'),
    gastoFecha: $('gastoFecha'), gastoFechaVencimiento: $('gastoFechaVencimiento'),
    gastoCategoria: $('gastoCategoria'), gastoSubcategoria: $('gastoSubcategoria'),
    gastoSubtotal: $('gastoSubtotal'), gastoTotal: $('gastoTotal'),
    gastoImpuestosContainer: $('gastoImpuestosContainer'),
    gastoMoneda: $('gastoMoneda'), gastoMetodoPago: $('gastoMetodoPago'),
    gastoEsFiscal: $('gastoEsFiscal'), gastoFiscalFields: $('gastoFiscalFields'),
    gastoUuid: $('gastoUuid'), gastoFolio: $('gastoFolio'), gastoNotas: $('gastoNotas'),
    ventaModal: $('ventaModal'), ventaForm: $('ventaForm'), closeVentaModal: $('closeVentaModal'),
    cancelVentaModal: $('cancelVentaModal'), submitVentaModal: $('submitVentaModal'),
    ventaFromTxInfo: $('ventaFromTxInfo'), ventaFromTxBox: $('ventaFromTxBox'),
    ventaFolio: $('ventaFolio'), ventaCliente: $('ventaCliente'), ventaFecha: $('ventaFecha'),
    ventaSubtotal: $('ventaSubtotal'), ventaTotal: $('ventaTotal'), ventaConcepto: $('ventaConcepto'),
    cuentaModal: $('cuentaModal'), cuentaForm: $('cuentaForm'), closeCuentaModal: $('closeCuentaModal'),
    cancelCuentaModal: $('cancelCuentaModal'), cuentaNombre: $('cuentaNombre'), cuentaBanco: $('cuentaBanco'), cuentaSaldo: $('cuentaSaldo'),
    deleteModal: $('deleteModal'), closeDeleteModal: $('closeDeleteModal'), cancelDeleteModal: $('cancelDeleteModal'), confirmDelete: $('confirmDelete')
  };

  let state = {
    user: null, org: null, 
    transacciones: [], cuentas: [], contactos: [], categorias: [], impuestosCatalogo: [],
    gastoImpuestosTemp: [],
    paginacion: { pagina: 1, limite: 20, total: 0, paginas: 0 },
    editingId: null, deletingId: null, viewingTx: null,
    gastoFromTxId: null,
    ventaFromTxId: null,
    filters: { buscar: '', tipo: '', cuenta_bancaria_id: '', conciliado: '' }
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
      
      // Trigger animation
      requestAnimationFrame(() => toastEl.classList.add('show'));
      
      // Close button
      toastEl.querySelector('.toast-close').addEventListener('click', () => this.hide(toastEl));
      
      // Auto hide
      if (duration > 0) {
        setTimeout(() => this.hide(toastEl), duration);
      }
      
      return toastEl;
    },
    hide(toastEl) {
      toastEl.classList.remove('show');
      toastEl.classList.add('hide');
      setTimeout(() => toastEl.remove(), 300);
    },
    success(msg, duration) { return this.show(msg, 'success', duration); },
    error(msg, duration) { return this.show(msg, 'error', duration); },
    warning(msg, duration) { return this.show(msg, 'warning', duration); },
    info(msg, duration) { return this.show(msg, 'info', duration); }
  };

  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: url => window.location.href = url,
    getInitials: n => (n?.charAt(0) || '') + (n?.split(' ')[1]?.charAt(0) || ''),
    formatMoney: (a, c = 'MXN') => new Intl.NumberFormat('es-MX', { style: 'currency', currency: c }).format(a || 0),
    formatDate(d) {
      if (!d) return '-';
      let date;
      if (typeof d === 'string') {
        if (d.includes('T')) d = d.split('T')[0];
        if (d.match(/^\d{4}-\d{2}-\d{2}$/)) {
          date = new Date(d + 'T12:00:00');
        } else {
          date = new Date(d);
        }
      } else {
        date = new Date(d);
      }
      if (isNaN(date.getTime())) return '-';
      return date.toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
    },
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
    getImpuestos: () => api.request('/api/impuestos'),
    createGasto: d => api.request('/api/gastos', { method: 'POST', body: JSON.stringify(d) }),
    createVenta: d => api.request('/api/ventas', { method: 'POST', body: JSON.stringify(d) }),
    getGasto: id => api.request(`/api/gastos/${id}`),
    getVenta: id => api.request(`/api/ventas/${id}`)
  };

  const render = {
    user() { if (state.user) elements.userAvatar.textContent = utils.getInitials(state.user.nombre); },
    org() { if (state.org) { elements.orgName.textContent = state.org.nombre; elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`; } },
    stats() {
      const now = new Date(), m = now.getMonth(), y = now.getFullYear();
      let ingresos = 0, egresos = 0, sinConc = 0;
      state.transacciones.forEach(t => {
        const f = new Date(t.fecha), monto = parseFloat(t.monto) || 0;
        if (f.getMonth() === m && f.getFullYear() === y) {
          if (t.tipo === 'ingreso') ingresos += monto;
          else egresos += monto;
        }
        if (!t.gasto_id && !t.venta_id) sinConc++;
      });
      elements.ingresosMes.textContent = utils.formatMoney(ingresos);
      elements.egresosMes.textContent = utils.formatMoney(egresos);
      elements.sinConciliar.textContent = sinConc;
      elements.balance.textContent = utils.formatMoney(ingresos - egresos);
    },
    cuentas() {
      const opts = state.cuentas.map(c => `<option value="${c.id}">${c.nombre} (${utils.formatMoney(c.saldo_actual)})</option>`).join('');
      elements.cuentaId.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
      elements.filterCuenta.innerHTML = '<option value="">Cuenta</option>' + opts;
    },
    contactos() {
      const provOpts = state.contactos.filter(c => c.tipo === 'proveedor' || c.tipo === 'ambos').map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      const cliOpts = state.contactos.filter(c => c.tipo === 'cliente' || c.tipo === 'ambos').map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      const allOpts = state.contactos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      elements.contactoId.innerHTML = '<option value="">-- Sin contacto --</option>' + allOpts;
      elements.gastoProveedor.innerHTML = '<option value="">-- Seleccionar --</option>' + provOpts;
      elements.ventaCliente.innerHTML = '<option value="">-- Seleccionar --</option>' + cliOpts;
    },
    categorias() {
      elements.gastoCategoria.innerHTML = '<option value="">-- Seleccionar --</option>' + state.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
    },
    subcategorias(subcats) {
      elements.gastoSubcategoria.innerHTML = '<option value="">-- Seleccionar --</option>' + (subcats || []).map(s => `<option value="${s.id}">${s.nombre}</option>`).join('');
    },
    gastoImpuestos() {
      const container = elements.gastoImpuestosContainer;
      if (!container) return;
      
      if (!state.gastoImpuestosTemp.length) {
        container.innerHTML = '<div class="impuestos-empty">Sin impuestos agregados</div>';
        return;
      }
      
      const selectOpts = state.impuestosCatalogo.map(i => 
        `<option value="${i.id}" data-tasa="${i.tasa}" data-tipo="${i.tipo}">${i.nombre}</option>`
      ).join('');
      
      container.innerHTML = state.gastoImpuestosTemp.map((imp, idx) => {
        return `<div class="impuesto-row" data-idx="${idx}">
          <select class="imp-select">
            <option value="">-- Seleccionar --</option>
            ${selectOpts}
          </select>
          <span class="impuesto-tipo ${imp.tipo || 'traslado'}">${imp.tipo === 'retencion' ? 'Ret.' : 'Tras.'}</span>
          <input type="number" class="imp-importe" value="${imp.importe || ''}" placeholder="0.00" step="0.01">
          <button type="button" class="btn-remove-imp" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>`;
      }).join('');
      
      container.querySelectorAll('.impuesto-row').forEach((row, idx) => {
        const select = row.querySelector('.imp-select');
        const impInput = row.querySelector('.imp-importe');
        const tipoSpan = row.querySelector('.impuesto-tipo');
        const removeBtn = row.querySelector('.btn-remove-imp');
        
        if (state.gastoImpuestosTemp[idx].impuesto_id) {
          select.value = state.gastoImpuestosTemp[idx].impuesto_id;
        }
        
        select.addEventListener('change', () => {
          const opt = select.selectedOptions[0];
          const tasa = parseFloat(opt?.dataset?.tasa) || 0;
          const tipo = opt?.dataset?.tipo || 'traslado';
          state.gastoImpuestosTemp[idx].impuesto_id = select.value;
          state.gastoImpuestosTemp[idx].tasa = tasa;
          state.gastoImpuestosTemp[idx].tipo = tipo;
          tipoSpan.textContent = tipo === 'retencion' ? 'Ret.' : 'Tras.';
          tipoSpan.className = `impuesto-tipo ${tipo}`;
          const subtotal = parseFloat(elements.gastoSubtotal.value) || 0;
          if (subtotal > 0 && tasa > 0) {
            impInput.value = (subtotal * tasa).toFixed(2);
            state.gastoImpuestosTemp[idx].importe = parseFloat(impInput.value);
          }
          handlers.calcGastoTotal();
        });
        
        impInput.addEventListener('input', () => {
          state.gastoImpuestosTemp[idx].importe = parseFloat(impInput.value) || 0;
          handlers.calcGastoTotal();
        });
        
        removeBtn.addEventListener('click', () => {
          state.gastoImpuestosTemp.splice(idx, 1);
          render.gastoImpuestos();
          handlers.calcGastoTotal();
        });
      });
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
            <span class="badge ${isIncome ? 'fiscal' : 'sin-factura'}">${isIncome ? 'Ingreso' : 'Egreso'}</span>
            ${conciliado ? '<span class="badge conciliado">Conciliado</span>' : '<span class="badge pendiente">Por conciliar</span>'}
          </div></td>
          <td style="text-align:right;"><div class="cell-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto))}</div></td>
          <td><div class="table-actions">
            ${!conciliado ? `<button class="action-btn success" title="${isIncome ? 'Registrar Venta' : 'Registrar Gasto'}" data-action="conciliar" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></button>` : ''}
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
            <div class="mobile-card-amount ${isIncome ? 'income' : ''}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto))}</div>
          </div>
          <div class="mobile-card-meta">
            <span>${utils.formatDate(t.fecha)}</span>
            <span>${t.nombre_cuenta || '-'}</span>
          </div>
          <div class="mobile-card-badges">
            <span class="badge ${isIncome ? 'fiscal' : 'sin-factura'}">${isIncome ? 'Ingreso' : 'Egreso'}</span>
            ${conciliado ? '<span class="badge conciliado">Conciliado</span>' : '<span class="badge pendiente">Por conciliar</span>'}
          </div>
        </div>`;
      }).join('');

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
      elements.tableBody.querySelectorAll('[data-action="conciliar"]').forEach(btn => {
        btn.addEventListener('click', () => {
          const tx = state.transacciones.find(t => t.id === btn.dataset.id);
          if (tx) {
            state.viewingTx = tx;
            if (tx.tipo === 'ingreso') handlers.openVentaFromTx();
            else handlers.openGastoFromTx();
          }
        });
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
        const [txRes, cuentasRes, contactosRes, catRes, impRes] = await Promise.all([
          api.getTransacciones({ ...state.filters, pagina: state.paginacion.pagina, limite: state.paginacion.limite }),
          api.getCuentas(),
          api.getContactos(),
          api.getCategorias().catch(() => ({ categorias: [] })),
          api.getImpuestos().catch(() => ({ impuestos: [] }))
        ]);
        state.transacciones = txRes.transacciones || [];
        state.paginacion = txRes.paginacion || { pagina: 1, limite: 20, total: 0, paginas: 0 };
        state.cuentas = cuentasRes.cuentas || [];
        state.contactos = contactosRes.contactos || [];
        state.categorias = catRes.categorias || [];
        state.impuestosCatalogo = impRes.impuestos || [];
        render.cuentas();
        render.contactos();
        render.categorias();
        render.stats();
        render.transacciones();
      } catch (e) { console.error(e); }
    },
    async loadSubcategorias() {
      const catId = elements.gastoCategoria.value;
      if (!catId) { render.subcategorias([]); return; }
      try {
        const res = await api.getSubcategorias(catId);
        render.subcategorias(res.subcategorias || []);
      } catch (e) { render.subcategorias([]); }
    },
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
          <div class="conciliacion-header"><span class="badge pendiente">⏳ Saldo por conciliar</span></div>
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
    closeDetailModal() { 
      elements.detailModal.classList.remove('active'); 
    },
    editFromDetail() {
      if (state.viewingTx) { this.closeDetailModal(); this.openEditModal(state.viewingTx); }
    },
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
        toast.success(state.editingId ? 'Movimiento actualizado' : 'Movimiento registrado');
      } catch (e) { toast.error(e.message); }
      finally { elements.submitModal.disabled = false; }
    },
    openGastoFromTx() {
      const tx = state.viewingTx;
      if (!tx) return;
      
      state.gastoFromTxId = tx.id;
      
      this.closeDetailModal();
      
      elements.gastoForm.reset();
      state.gastoImpuestosTemp = [];
      elements.gastoFromTxBox.style.display = 'block';
      elements.gastoFromTxInfo.textContent = `${utils.formatMoney(tx.monto)} del ${utils.formatDate(tx.fecha)}`;
      
      elements.gastoConcepto.value = tx.descripcion || '';
      elements.gastoProveedor.value = tx.contacto_id || '';
      elements.gastoFecha.value = utils.formatDateInput(tx.fecha);
      elements.gastoTotal.value = tx.monto;
      elements.gastoSubtotal.value = tx.monto;
      
      elements.gastoFiscalFields.style.display = 'none';
      elements.gastoEsFiscal.checked = false;
      render.subcategorias([]);
      render.gastoImpuestos();
      
      elements.gastoModal.classList.add('active');
    },
    closeGastoModal() { 
      elements.gastoModal.classList.remove('active'); 
      state.gastoFromTxId = null;
      state.viewingTx = null;
    },
    addGastoImpuesto() {
      state.gastoImpuestosTemp.push({ impuesto_id: '', tasa: 0, tipo: 'traslado', importe: 0 });
      render.gastoImpuestos();
    },
    calcGastoTotal() {
      const subtotal = parseFloat(elements.gastoSubtotal.value) || 0;
      let traslados = 0, retenciones = 0;
      state.gastoImpuestosTemp.forEach(imp => {
        if (imp.tipo === 'retencion') retenciones += (imp.importe || 0);
        else traslados += (imp.importe || 0);
      });
      const total = subtotal + traslados - retenciones;
      if (subtotal > 0 || state.gastoImpuestosTemp.length > 0) {
        elements.gastoTotal.value = total.toFixed(2);
      }
    },
    recalcGastoImpuestos() {
      const subtotal = parseFloat(elements.gastoSubtotal.value) || 0;
      state.gastoImpuestosTemp.forEach(imp => {
        if (imp.tasa > 0 && subtotal > 0) {
          imp.importe = subtotal * imp.tasa;
        }
      });
      render.gastoImpuestos();
      this.calcGastoTotal();
    },
    async submitGasto(e) {
      e.preventDefault();
      
      const txId = state.gastoFromTxId;
      
      let totalImpuesto = 0;
      state.gastoImpuestosTemp.forEach(imp => {
        if (imp.tipo === 'traslado') totalImpuesto += (imp.importe || 0);
        else totalImpuesto -= (imp.importe || 0);
      });
      
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
        impuesto: Math.abs(totalImpuesto),
        total: parseFloat(elements.gastoTotal.value),
        es_fiscal: elements.gastoEsFiscal.checked ? 1 : 0,
        uuid_cfdi: elements.gastoUuid.value.trim() || null,
        folio_cfdi: elements.gastoFolio.value.trim() || null,
        notas: elements.gastoNotas.value.trim() || null,
        transaccion_id: txId,
        estatus_pago: 'pagado',
        impuestos: state.gastoImpuestosTemp.filter(i => i.impuesto_id).map(i => ({
          impuesto_id: i.impuesto_id,
          base: parseFloat(elements.gastoSubtotal.value) || parseFloat(elements.gastoTotal.value),
          importe: i.importe || 0
        }))
      };
      
      elements.submitGastoModal.disabled = true;
      try {
        await api.createGasto(gastoData);
        this.closeGastoModal();
        await this.loadData();
        toast.success('Gasto registrado y conciliado');
      } catch (e) { toast.error(e.message); }
      finally { elements.submitGastoModal.disabled = false; }
    },
    openVentaFromTx() {
      const tx = state.viewingTx;
      if (!tx) return;
      
      state.ventaFromTxId = tx.id;
      
      this.closeDetailModal();
      
      elements.ventaForm.reset();
      elements.ventaFromTxBox.style.display = 'block';
      elements.ventaFromTxInfo.textContent = `${utils.formatMoney(tx.monto)} del ${utils.formatDate(tx.fecha)}`;
      
      elements.ventaCliente.value = tx.contacto_id || '';
      elements.ventaFecha.value = utils.formatDateInput(tx.fecha);
      elements.ventaTotal.value = tx.monto;
      elements.ventaSubtotal.value = tx.monto;
      elements.ventaConcepto.value = tx.descripcion || '';
      
      elements.ventaModal.classList.add('active');
    },
    closeVentaModal() { 
      elements.ventaModal.classList.remove('active'); 
      state.ventaFromTxId = null;
      state.viewingTx = null;
    },
    async submitVenta(e) {
      e.preventDefault();
      
      const txId = state.ventaFromTxId;
      
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
        const ventaId = result.venta?.id || result.id;
        
        if (txId && ventaId) {
          await api.updateTransaccion(txId, { venta_id: ventaId });
        }
        
        this.closeVentaModal();
        await this.loadData();
        toast.success('Venta registrada y conciliada');
      } catch (e) { toast.error(e.message); }
      finally { elements.submitVentaModal.disabled = false; }
    },
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
        toast.success('Cuenta creada');
      } catch (e) { toast.error(e.message); }
    },
    openDeleteModal(t) { state.deletingId = t.id; elements.deleteModal.classList.add('active'); },
    closeDeleteModal() { elements.deleteModal.classList.remove('active'); state.deletingId = null; },
    async confirmDelete() {
      elements.confirmDelete.disabled = true;
      try { 
        await api.deleteTransaccion(state.deletingId); 
        this.closeDeleteModal(); 
        await this.loadData(); 
        toast.success('Movimiento eliminado');
      }
      catch (e) { toast.error(e.message); }
      finally { elements.confirmDelete.disabled = false; }
    },
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
    state.org = utils.getOrg();
    if (!state.org) { utils.redirect(CONFIG.REDIRECT.SELECT_ORG); return; }
    state.user = utils.getUser();
    render.user();
    render.org();

    elements.menuToggle.addEventListener('click', () => handlers.toggleSidebar());
    elements.sidebarOverlay.addEventListener('click', () => handlers.closeSidebar());
    elements.orgSwitcher.addEventListener('click', () => handlers.switchOrg());

    elements.addTxBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.addFirstTxBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.fabBtn.addEventListener('click', () => handlers.openCreateModal());

    elements.closeDetailModal.addEventListener('click', () => { handlers.closeDetailModal(); state.viewingTx = null; });
    elements.closeDetailBtn.addEventListener('click', () => { handlers.closeDetailModal(); state.viewingTx = null; });
    elements.editFromDetailBtn.addEventListener('click', () => handlers.editFromDetail());
    elements.detailModal.addEventListener('click', e => { if (e.target === elements.detailModal) { handlers.closeDetailModal(); state.viewingTx = null; } });

    elements.closeModal.addEventListener('click', () => handlers.closeTxModal());
    elements.cancelModal.addEventListener('click', () => handlers.closeTxModal());
    elements.txForm.addEventListener('submit', e => handlers.submitTx(e));
    elements.txModal.addEventListener('click', e => { if (e.target === elements.txModal) handlers.closeTxModal(); });
    elements.addCuentaBtn.addEventListener('click', () => handlers.openCuentaModal());

    elements.closeGastoModal.addEventListener('click', () => handlers.closeGastoModal());
    elements.cancelGastoModal.addEventListener('click', () => handlers.closeGastoModal());
    elements.gastoForm.addEventListener('submit', e => handlers.submitGasto(e));
    elements.gastoModal.addEventListener('click', e => { if (e.target === elements.gastoModal) handlers.closeGastoModal(); });
    elements.gastoCategoria.addEventListener('change', () => handlers.loadSubcategorias());
    elements.gastoSubtotal.addEventListener('input', () => handlers.recalcGastoImpuestos());
    elements.gastoEsFiscal.addEventListener('change', () => {
      elements.gastoFiscalFields.style.display = elements.gastoEsFiscal.checked ? 'block' : 'none';
    });
    $('addGastoImpuestoBtn')?.addEventListener('click', () => handlers.addGastoImpuesto());

    elements.closeVentaModal.addEventListener('click', () => handlers.closeVentaModal());
    elements.cancelVentaModal.addEventListener('click', () => handlers.closeVentaModal());
    elements.ventaForm.addEventListener('submit', e => handlers.submitVenta(e));
    elements.ventaModal.addEventListener('click', e => { if (e.target === elements.ventaModal) handlers.closeVentaModal(); });

    elements.closeCuentaModal.addEventListener('click', () => handlers.closeCuentaModal());
    elements.cancelCuentaModal.addEventListener('click', () => handlers.closeCuentaModal());
    elements.cuentaForm.addEventListener('submit', e => handlers.submitCuenta(e));
    elements.cuentaModal.addEventListener('click', e => { if (e.target === elements.cuentaModal) handlers.closeCuentaModal(); });

    elements.closeDeleteModal.addEventListener('click', () => handlers.closeDeleteModal());
    elements.cancelDeleteModal.addEventListener('click', () => handlers.closeDeleteModal());
    elements.confirmDelete.addEventListener('click', () => handlers.confirmDelete());
    elements.deleteModal.addEventListener('click', e => { if (e.target === elements.deleteModal) handlers.closeDeleteModal(); });

    const df = utils.debounce(() => handlers.applyFilters(), 300);
    elements.searchInput.addEventListener('input', df);
    elements.filterType.addEventListener('change', () => handlers.applyFilters());
    elements.filterCuenta.addEventListener('change', () => handlers.applyFilters());
    elements.filterConciliado.addEventListener('change', () => handlers.applyFilters());
    elements.prevPage.addEventListener('click', () => handlers.prevPage());
    elements.nextPage.addEventListener('click', () => handlers.nextPage());

    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        handlers.closeDetailModal(); state.viewingTx = null;
        handlers.closeTxModal(); handlers.closeGastoModal();
        handlers.closeVentaModal(); handlers.closeCuentaModal(); handlers.closeDeleteModal();
      }
    });

    handlers.loadData();
    console.log('🚀 TRUNO Transacciones v8');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
