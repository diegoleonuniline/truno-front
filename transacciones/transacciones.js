/**
 * TRUNO - Transacciones v12
 * Con catálogo de plataformas y cálculo automático de comisión
 * Lógica: Monto Total - Monto Recibido = Comisión
 */
(function() {
  'use strict';

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
    orgSwitcher: $('orgSwitcher'), 
    orgName: $('orgName'), 
    orgPlan: $('orgPlan'), 
    userAvatar: $('userAvatar'),
    ingresosMes: $('ingresosMes'), 
    egresosMes: $('egresosMes'), 
    sinConciliar: $('sinConciliar'), 
    balance: $('balance'),
    searchInput: $('searchInput'), 
    filterType: $('filterType'), 
    filterCuenta: $('filterCuenta'), 
    filterConciliado: $('filterConciliado'),
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
    addTxBtn: $('addTxBtn'), 
    addFirstTxBtn: $('addFirstTxBtn'), 
    fabBtn: $('fabBtn'),
    // Modal detalle
    detailModal: $('detailModal'), 
    closeDetailModal: $('closeDetailModal'), 
    closeDetailBtn: $('closeDetailBtn'),
    detailAmount: $('detailAmount'), 
    detailGrid: $('detailGrid'), 
    detailConciliacion: $('detailConciliacion'),
    editFromDetailBtn: $('editFromDetailBtn'),
    // Modal transacción
    txModal: $('txModal'), 
    txForm: $('txForm'), 
    modalTitle: $('modalTitle'),
    closeModal: $('closeModal'), 
    cancelModal: $('cancelModal'), 
    submitModal: $('submitModal'),
    tipo: $('tipo'), 
    cuentaId: $('cuentaId'), 
    monto: $('monto'), 
    fecha: $('fecha'),
    moneda: $('moneda'),
    metodoPago: $('metodoPago'),
    contactoId: $('contactoId'), 
    descripcion: $('descripcion'), 
    referencia: $('referencia'),
    addCuentaBtn: $('addCuentaBtn'),
    addContactoBtn: $('addContactoBtn'),
    addMetodoPagoBtn: $('addMetodoPagoBtn'),
    // Campos plataforma y comisión
    plataformaId: $('plataformaId'),
    addPlataformaBtn: $('addPlataformaBtn'),
    comisionSection: $('comisionSection'),
    montoTotal: $('montoTotal'),
    montoRecibido: $('montoRecibido'),
    monedaOrigen: $('monedaOrigen'),
    tipoCambio: $('tipoCambio'),
    comisionCalculada: $('comisionCalculada'),
    porcentajeCalculado: $('porcentajeCalculado'),
    // Modal crear contacto
    contactoModal: $('contactoModal'),
    contactoForm: $('contactoForm'),
    closeContactoModal: $('closeContactoModal'),
    cancelContactoModal: $('cancelContactoModal'),
    contactoNombre: $('contactoNombre'),
    contactoTipo: $('contactoTipo'),
    contactoEmail: $('contactoEmail'),
    contactoTelefono: $('contactoTelefono'),
    contactoRfc: $('contactoRfc'),
    // Modal crear método de pago
    metodoPagoModal: $('metodoPagoModal'),
    metodoPagoForm: $('metodoPagoForm'),
    closeMetodoPagoModal: $('closeMetodoPagoModal'),
    cancelMetodoPagoModal: $('cancelMetodoPagoModal'),
    metodoNombre: $('metodoNombre'),
    metodoClave: $('metodoClave'),
    metodoDescripcion: $('metodoDescripcion'),
    // Modal crear plataforma
    plataformaModal: $('plataformaModal'),
    plataformaForm: $('plataformaForm'),
    closePlataformaModal: $('closePlataformaModal'),
    cancelPlataformaModal: $('cancelPlataformaModal'),
    plataformaNombre: $('plataformaNombre'),
    plataformaDescripcion: $('plataformaDescripcion'),
    // Modal gasto
    gastoModal: $('gastoModal'), 
    gastoForm: $('gastoForm'), 
    closeGastoModal: $('closeGastoModal'),
    cancelGastoModal: $('cancelGastoModal'), 
    submitGastoModal: $('submitGastoModal'),
    gastoFromTxInfo: $('gastoFromTxInfo'), 
    gastoFromTxBox: $('gastoFromTxBox'),
    gastoConcepto: $('gastoConcepto'), 
    gastoProveedor: $('gastoProveedor'),
    gastoFecha: $('gastoFecha'), 
    gastoFechaVencimiento: $('gastoFechaVencimiento'),
    gastoCategoria: $('gastoCategoria'), 
    gastoSubcategoria: $('gastoSubcategoria'),
    gastoSubtotal: $('gastoSubtotal'), 
    gastoTotal: $('gastoTotal'),
    gastoImpuestosContainer: $('gastoImpuestosContainer'),
    gastoMoneda: $('gastoMoneda'), 
    gastoMetodoPago: $('gastoMetodoPago'),
    gastoEsFiscal: $('gastoEsFiscal'), 
    gastoFiscalFields: $('gastoFiscalFields'),
    gastoUuid: $('gastoUuid'), 
    gastoFolio: $('gastoFolio'), 
    gastoNotas: $('gastoNotas'),
    // Modal venta
    ventaModal: $('ventaModal'), 
    ventaForm: $('ventaForm'), 
    closeVentaModal: $('closeVentaModal'),
    cancelVentaModal: $('cancelVentaModal'), 
    submitVentaModal: $('submitVentaModal'),
    ventaFromTxInfo: $('ventaFromTxInfo'), 
    ventaFromTxBox: $('ventaFromTxBox'),
    ventaFolio: $('ventaFolio'), 
    ventaCliente: $('ventaCliente'), 
    ventaFecha: $('ventaFecha'),
    ventaSubtotal: $('ventaSubtotal'), 
    ventaTotal: $('ventaTotal'), 
    ventaConcepto: $('ventaConcepto'),
    // Modal cuenta
    cuentaModal: $('cuentaModal'), 
    cuentaForm: $('cuentaForm'), 
    closeCuentaModal: $('closeCuentaModal'),
    cancelCuentaModal: $('cancelCuentaModal'), 
    cuentaNombre: $('cuentaNombre'), 
    cuentaBanco: $('cuentaBanco'), 
    cuentaSaldo: $('cuentaSaldo'),
    // Modal eliminar
    deleteModal: $('deleteModal'), 
    closeDeleteModal: $('closeDeleteModal'), 
    cancelDeleteModal: $('cancelDeleteModal'), 
    confirmDelete: $('confirmDelete')
  };

  let state = {
    user: null, 
    org: null, 
    transacciones: [], 
    cuentas: [], 
    contactos: [], 
    categorias: [], 
    impuestosCatalogo: [],
    monedas: [],
    metodosPago: [],
    plataformas: [],
    gastoImpuestosTemp: [],
    paginacion: { pagina: 1, limite: 20, total: 0, paginas: 0 },
    editingId: null, 
    deletingId: null, 
    viewingTx: null,
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
    getInitials: (n, a) => (n?.charAt(0).toUpperCase() || '') + (a?.charAt(0).toUpperCase() || '') || '??',
    formatMoney: (a, c = 'MXN') => new Intl.NumberFormat('es-MX', { style: 'currency', currency: c }).format(a || 0),
    formatPercent: (p) => `${(p * 100).toFixed(2)}%`,
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
    createContacto: d => api.request('/api/contactos', { method: 'POST', body: JSON.stringify(d) }),
    getCategorias: () => api.request('/api/categorias?tipo=gasto'),
    getSubcategorias: catId => api.request(`/api/categorias/${catId}/subcategorias`),
    getImpuestos: () => api.request('/api/impuestos'),
    getMonedas: () => api.request('/api/monedas'),
    getMetodosPago: () => api.request('/api/metodos-pago'),
    createMetodoPago: d => api.request('/api/metodos-pago', { method: 'POST', body: JSON.stringify(d) }),
    getPlataformas: () => api.request('/api/plataformas'),
    createPlataforma: d => api.request('/api/plataformas', { method: 'POST', body: JSON.stringify(d) }),
    createGasto: d => api.request('/api/gastos', { method: 'POST', body: JSON.stringify(d) }),
    createVenta: d => api.request('/api/ventas', { method: 'POST', body: JSON.stringify(d) }),
    getGasto: id => api.request(`/api/gastos/${id}`),
    getVenta: id => api.request(`/api/ventas/${id}`)
  };

  const render = {
    user() { if (state.user) elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido); },
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
    monedas() {
      if (!elements.moneda) return;
      if (state.monedas.length > 0) {
        const activas = state.monedas.filter(m => m.activo);
        elements.moneda.innerHTML = activas.map(m => 
          `<option value="${m.codigo}" ${m.es_default ? 'selected' : ''}>${m.codigo} - ${m.nombre}</option>`
        ).join('');
        if (elements.monedaOrigen) {
          elements.monedaOrigen.innerHTML = activas.map(m => 
            `<option value="${m.codigo}">${m.codigo}</option>`
          ).join('');
        }
      } else {
        const defaultOpts = `
          <option value="MXN" selected>MXN - Peso Mexicano</option>
          <option value="USD">USD - Dólar</option>
          <option value="EUR">EUR - Euro</option>
        `;
        elements.moneda.innerHTML = defaultOpts;
        if (elements.monedaOrigen) {
          elements.monedaOrigen.innerHTML = `
            <option value="MXN">MXN</option>
            <option value="USD">USD</option>
            <option value="EUR">EUR</option>
          `;
        }
      }
    },
    metodosPago() {
      if (!elements.metodoPago) return;
      const defaultMetodos = [
        { id: 'transferencia', nombre: 'Transferencia' },
        { id: 'efectivo', nombre: 'Efectivo' },
        { id: 'cheque', nombre: 'Cheque' },
        { id: 'tarjeta_debito', nombre: 'Tarjeta Débito' },
        { id: 'tarjeta_credito', nombre: 'Tarjeta Crédito' }
      ];
      const metodos = state.metodosPago.length > 0 
        ? state.metodosPago.filter(m => m.activo !== false)
        : defaultMetodos;
      const opts = metodos.map(m => 
        `<option value="${m.id || m.clave || m.nombre}">${m.nombre}</option>`
      ).join('');
      elements.metodoPago.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
      if (elements.gastoMetodoPago) {
        elements.gastoMetodoPago.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
      }
    },
    plataformas() {
      if (!elements.plataformaId) return;
      const activas = state.plataformas.filter(p => p.activo);
      const opts = activas.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
      elements.plataformaId.innerHTML = '<option value="">-- Sin plataforma --</option>' + opts;
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

      const getMetodoLabel = (metodo) => {
        if (!metodo) return '-';
        const found = state.metodosPago.find(m => m.id === metodo || m.clave === metodo || m.nombre === metodo);
        if (found) return found.nombre;
        const labels = {
          transferencia: 'Transferencia',
          efectivo: 'Efectivo',
          cheque: 'Cheque',
          tarjeta_debito: 'T. Débito',
          tarjeta_credito: 'T. Crédito'
        };
        return labels[metodo] || metodo;
      };

      const getPlataformaNombre = (plataformaId) => {
        if (!plataformaId) return null;
        const p = state.plataformas.find(p => p.id === plataformaId);
        return p ? p.nombre : null;
      };

      elements.tableBody.innerHTML = transacciones.map(t => {
        const isIncome = t.tipo === 'ingreso';
        const conciliado = t.gasto_id || t.venta_id;
        const metodoLabel = getMetodoLabel(t.metodo_pago);
        const moneda = t.moneda || 'MXN';
        const plataformaNombre = getPlataformaNombre(t.plataforma_id) || t.plataforma_origen;
        const tieneComision = plataformaNombre && t.monto_bruto;
        
        return `<tr data-id="${t.id}" class="clickable-row">
          <td>
            <div class="cell-main">${t.descripcion || 'Sin descripción'}</div>
            <div class="cell-sub">${plataformaNombre ? `📍 ${plataformaNombre}` : ''} ${t.referencia || ''}</div>
          </td>
          <td>${utils.formatDate(t.fecha)}</td>
          <td>${t.nombre_cuenta || '-'}</td>
          <td>${t.nombre_contacto || '-'}</td>
          <td><span class="metodo-badge">${metodoLabel}</span></td>
          <td>
            <div class="badges-group">
              <span class="badge ${isIncome ? 'fiscal' : 'sin-factura'}">${isIncome ? 'Ingreso' : 'Egreso'}</span>
              ${conciliado ? '<span class="badge conciliado">Conciliado</span>' : '<span class="badge pendiente">Por conciliar</span>'}
              ${tieneComision ? '<span class="badge warning">Comisión</span>' : ''}
            </div>
          </td>
          <td style="text-align:right;">
            <div class="cell-amount ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto), moneda)}</div>
            <div class="cell-sub">${tieneComision ? `Total: ${utils.formatMoney(t.monto_bruto, t.moneda_origen || moneda)}` : moneda}</div>
          </td>
          <td>
            <div class="table-actions">
              ${!conciliado ? `<button class="action-btn success" title="${isIncome ? 'Registrar Venta' : 'Registrar Gasto'}" data-action="conciliar" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></button>` : ''}
              <button class="action-btn" title="Ver" data-action="view" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
              <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </td>
        </tr>`;
      }).join('');

      elements.mobileCards.innerHTML = transacciones.map(t => {
        const isIncome = t.tipo === 'ingreso';
        const conciliado = t.gasto_id || t.venta_id;
        const metodoLabel = getMetodoLabel(t.metodo_pago);
        const moneda = t.moneda || 'MXN';
        const plataformaNombre = getPlataformaNombre(t.plataforma_id) || t.plataforma_origen;
        const tieneComision = plataformaNombre && t.monto_bruto;
        const comision = t.monto_bruto ? (t.monto_bruto - t.monto) : 0;
        const porcentaje = t.monto_bruto && t.monto_bruto > 0 ? ((comision / t.monto_bruto) * 100).toFixed(1) : 0;
        
        return `<div class="mobile-card" data-id="${t.id}">
          <div class="mobile-card-header">
            <div class="mobile-card-title">${t.descripcion || 'Sin descripción'}</div>
            <div class="mobile-card-amount ${isIncome ? 'income' : ''}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto), moneda)}</div>
          </div>
          <div class="mobile-card-meta">
            <span>${utils.formatDate(t.fecha)}</span>
            <span>${t.nombre_cuenta || '-'}</span>
            ${plataformaNombre ? `<span>📍 ${plataformaNombre}</span>` : ''}
            ${metodoLabel !== '-' ? `<span>${metodoLabel}</span>` : ''}
          </div>
          ${tieneComision ? `<div class="mobile-card-meta"><span>Total: ${utils.formatMoney(t.monto_bruto, t.moneda_origen || moneda)}</span><span>Comisión: ${utils.formatMoney(comision)} (${porcentaje}%)</span></div>` : ''}
          <div class="mobile-card-footer">
            <div class="mobile-card-badges">
              <span class="badge ${isIncome ? 'fiscal' : 'sin-factura'}">${isIncome ? 'Ingreso' : 'Egreso'}</span>
              ${conciliado ? '<span class="badge conciliado">Conciliado</span>' : '<span class="badge pendiente">Por conciliar</span>'}
            </div>
            <div class="table-actions">
              ${!conciliado ? `<button class="action-btn success" data-action="conciliar" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg></button>` : ''}
              <button class="action-btn" data-action="view" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg></button>
              <button class="action-btn danger" data-action="delete" data-id="${t.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </div>
        </div>`;
      }).join('');

      elements.tableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', e => {
          if (e.target.closest('.action-btn')) return;
          handlers.openDetailModal(state.transacciones.find(t => t.id === row.dataset.id));
        });
      });
      
      document.querySelectorAll('[data-action="view"]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          handlers.openDetailModal(state.transacciones.find(t => t.id === btn.dataset.id));
        });
      });
      
      document.querySelectorAll('[data-action="delete"]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          handlers.openDeleteModal(state.transacciones.find(t => t.id === btn.dataset.id));
        });
      });
      
      document.querySelectorAll('[data-action="conciliar"]').forEach(btn => {
        btn.addEventListener('click', e => {
          e.stopPropagation();
          const tx = state.transacciones.find(t => t.id === btn.dataset.id);
          if (tx) {
            state.viewingTx = tx;
            if (tx.tipo === 'ingreso') handlers.openVentaFromTx();
            else handlers.openGastoFromTx();
          }
        });
      });
      
      elements.mobileCards.querySelectorAll('.mobile-card').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('.action-btn')) return;
          handlers.openDetailModal(state.transacciones.find(t => t.id === card.dataset.id));
        });
      });
    }
  };

  const handlers = {
    toggleSidebar() { 
      elements.sidebar.classList.toggle('open'); 
      elements.sidebarOverlay.classList.toggle('active'); 
    },
    closeSidebar() { 
      elements.sidebar.classList.remove('open'); 
      elements.sidebarOverlay.classList.remove('active'); 
    },
    
    async loadData() {
      try {
        const [txRes, cuentasRes, contactosRes, catRes, impRes, monedasRes, metodosRes, plataformasRes] = await Promise.all([
          api.getTransacciones({ ...state.filters, pagina: state.paginacion.pagina, limite: state.paginacion.limite }),
          api.getCuentas(),
          api.getContactos(),
          api.getCategorias().catch(() => ({ categorias: [] })),
          api.getImpuestos().catch(() => ({ impuestos: [] })),
          api.getMonedas().catch(() => ({ monedas: [] })),
          api.getMetodosPago().catch(() => ({ metodos_pago: [] })),
          api.getPlataformas().catch(() => ({ plataformas: [] }))
        ]);
        state.transacciones = txRes.transacciones || [];
        state.paginacion = txRes.paginacion || { pagina: 1, limite: 20, total: 0, paginas: 0 };
        state.cuentas = cuentasRes.cuentas || [];
        state.contactos = contactosRes.contactos || [];
        state.categorias = catRes.categorias || [];
        state.impuestosCatalogo = impRes.impuestos || [];
        state.monedas = monedasRes.monedas || [];
        state.metodosPago = metodosRes.metodos_pago || metodosRes.metodosPago || [];
        state.plataformas = plataformasRes.plataformas || [];
        render.cuentas();
        render.contactos();
        render.categorias();
        render.monedas();
        render.metodosPago();
        render.plataformas();
        render.stats();
        render.transacciones();
      } catch (e) { 
        console.error(e); 
        toast.error('Error al cargar datos');
      }
    },
    
    async loadSubcategorias() {
      const catId = elements.gastoCategoria.value;
      if (!catId) { render.subcategorias([]); return; }
      try {
        const res = await api.getSubcategorias(catId);
        render.subcategorias(res.subcategorias || []);
      } catch (e) { render.subcategorias([]); }
    },

    // ========== PLATAFORMA Y COMISIÓN HANDLERS ==========
    toggleComisionSection() {
      const plataformaSeleccionada = elements.plataformaId?.value;
      if (elements.comisionSection) {
        elements.comisionSection.style.display = plataformaSeleccionada ? 'block' : 'none';
        if (!plataformaSeleccionada) {
          // Limpiar campos si se oculta
          if (elements.montoTotal) elements.montoTotal.value = '';
          if (elements.montoRecibido) elements.montoRecibido.value = '';
          if (elements.tipoCambio) elements.tipoCambio.value = '1';
          if (elements.comisionCalculada) elements.comisionCalculada.textContent = '$0.00';
          if (elements.porcentajeCalculado) elements.porcentajeCalculado.textContent = '0%';
          // Limpiar monto neto también
          if (elements.monto) elements.monto.value = '';
        }
      }
    },

    calcComision() {
      const montoTotal = parseFloat(elements.montoTotal?.value) || 0;
      const montoRecibido = parseFloat(elements.montoRecibido?.value) || 0;
      const tc = parseFloat(elements.tipoCambio?.value) || 1;
      
      if (montoTotal > 0 && montoRecibido >= 0) {
        const comision = montoTotal - montoRecibido;
        const porcentaje = montoTotal > 0 ? (comision / montoTotal) : 0;
        const montoFinal = montoRecibido * tc;
        
        // Actualizar displays
        if (elements.comisionCalculada) {
          elements.comisionCalculada.textContent = utils.formatMoney(comision);
        }
        if (elements.porcentajeCalculado) {
          elements.porcentajeCalculado.textContent = `${(porcentaje * 100).toFixed(2)}%`;
        }
        // Actualizar monto neto (el que se guarda)
        if (elements.monto) {
          elements.monto.value = montoFinal.toFixed(2);
        }
      }
    },
    
    async openDetailModal(tx) {
      if (!tx) return;
      state.viewingTx = tx;
      const isIncome = tx.tipo === 'ingreso';
      const conciliado = tx.gasto_id || tx.venta_id;
      const moneda = tx.moneda || 'MXN';
      
      // Buscar nombre de plataforma
      const plataforma = state.plataformas.find(p => p.id === tx.plataforma_id);
      const plataformaNombre = plataforma?.nombre || tx.plataforma_origen;
      const tieneComision = plataformaNombre && tx.monto_bruto;
      
      // Calcular comisión
      const comision = tx.monto_bruto ? (tx.monto_bruto - tx.monto) : 0;
      const porcentaje = tx.monto_bruto && tx.monto_bruto > 0 ? (comision / tx.monto_bruto) : 0;
      
      const getMetodoLabel = (metodo) => {
        if (!metodo) return '-';
        const found = state.metodosPago.find(m => m.id === metodo || m.clave === metodo || m.nombre === metodo);
        if (found) return found.nombre;
        const labels = { transferencia: 'Transferencia', efectivo: 'Efectivo', cheque: 'Cheque', tarjeta_debito: 'Tarjeta Débito', tarjeta_credito: 'Tarjeta Crédito' };
        return labels[metodo] || metodo;
      };
      const metodoLabel = getMetodoLabel(tx.metodo_pago);

      elements.detailAmount.innerHTML = `
        <div class="detail-amount-value ${isIncome ? 'income' : 'expense'}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(tx.monto), moneda)}</div>
        <div class="detail-amount-label">${isIncome ? '💰 Ingreso' : '💸 Egreso'} • ${moneda}</div>
        ${tieneComision ? `<div class="detail-amount-label" style="margin-top:8px;">Total pagado: ${utils.formatMoney(tx.monto_bruto, tx.moneda_origen || moneda)} → Comisión: ${utils.formatMoney(comision)} (${(porcentaje * 100).toFixed(1)}%)</div>` : ''}
      `;

      const contacto = state.contactos.find(c => c.id === tx.contacto_id);
      let gridHTML = `
        <div class="detail-item"><label>Fecha</label><span>${utils.formatDate(tx.fecha)}</span></div>
        <div class="detail-item"><label>Cuenta</label><span>${tx.nombre_cuenta || '-'}</span></div>
        <div class="detail-item"><label>Contacto</label><span>${contacto?.nombre || tx.nombre_contacto || '-'}</span></div>
        <div class="detail-item"><label>Método de Pago</label><span>${metodoLabel}</span></div>
        <div class="detail-item"><label>Moneda</label><span>${moneda}</span></div>
        <div class="detail-item"><label>Descripción</label><span>${tx.descripcion || '-'}</span></div>
        <div class="detail-item"><label>Referencia</label><span>${tx.referencia || '-'}</span></div>
      `;
      
      if (tieneComision) {
        gridHTML += `
          <div class="detail-item"><label>Plataforma</label><span>${plataformaNombre}</span></div>
          <div class="detail-item"><label>Monto Total</label><span>${utils.formatMoney(tx.monto_bruto, tx.moneda_origen || moneda)}</span></div>
          <div class="detail-item"><label>Monto Recibido</label><span>${utils.formatMoney(tx.monto, moneda)}</span></div>
          <div class="detail-item"><label>Comisión</label><span>${utils.formatMoney(comision)} (${(porcentaje * 100).toFixed(1)}%)</span></div>
          ${tx.tipo_cambio && tx.tipo_cambio !== 1 ? `<div class="detail-item"><label>Tipo de Cambio</label><span>${tx.tipo_cambio}</span></div>` : ''}
        `;
      }
      
      elements.detailGrid.innerHTML = gridHTML;

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
          const btn = document.getElementById('createFromTxBtn');
          if (btn) {
            btn.addEventListener('click', () => {
              if (isIncome) handlers.openVentaFromTx();
              else handlers.openGastoFromTx();
            });
          }
        }, 10);
      }

      elements.detailModal.classList.add('active');
    },
    
    closeDetailModal() { 
      elements.detailModal.classList.remove('active'); 
    },
    
    editFromDetail() {
      if (state.viewingTx) { 
        this.closeDetailModal(); 
        this.openEditModal(state.viewingTx); 
      }
    },
    
    openCreateModal() {
      state.editingId = null;
      elements.modalTitle.textContent = 'Nuevo Movimiento';
      elements.txForm.reset();
      elements.fecha.value = utils.today();
      if (elements.tipoCambio) elements.tipoCambio.value = '1';
      if (elements.comisionSection) elements.comisionSection.style.display = 'none';
      if (elements.comisionCalculada) elements.comisionCalculada.textContent = '$0.00';
      if (elements.porcentajeCalculado) elements.porcentajeCalculado.textContent = '0%';
      render.monedas();
      render.metodosPago();
      render.plataformas();
      elements.txModal.classList.add('active');
    },
    
    openEditModal(tx) {
      state.editingId = tx.id;
      elements.modalTitle.textContent = 'Editar Movimiento';
      elements.tipo.value = tx.tipo;
      elements.cuentaId.value = tx.cuenta_bancaria_id;
      elements.monto.value = tx.monto;
      elements.fecha.value = utils.formatDateInput(tx.fecha);
      elements.moneda.value = tx.moneda || 'MXN';
      elements.metodoPago.value = tx.metodo_pago || '';
      elements.contactoId.value = tx.contacto_id || '';
      elements.descripcion.value = tx.descripcion || '';
      elements.referencia.value = tx.referencia || '';
      
      // Campos plataforma y comisión
      if (elements.plataformaId) elements.plataformaId.value = tx.plataforma_id || '';
      if (elements.montoTotal) elements.montoTotal.value = tx.monto_bruto || '';
      if (elements.montoRecibido) elements.montoRecibido.value = tx.monto || '';
      if (elements.monedaOrigen) elements.monedaOrigen.value = tx.moneda_origen || 'MXN';
      if (elements.tipoCambio) elements.tipoCambio.value = tx.tipo_cambio || '1';
      
      this.toggleComisionSection();
      if (tx.plataforma_id && tx.monto_bruto) {
        this.calcComision();
      }
      
      elements.txModal.classList.add('active');
    },
    
    closeTxModal() { 
      elements.txModal.classList.remove('active'); 
      state.editingId = null; 
    },
    
    async submitTx(e) {
      e.preventDefault();
      
      const plataformaId = elements.plataformaId?.value || null;
      const montoTotal = parseFloat(elements.montoTotal?.value) || null;
      const montoRecibido = parseFloat(elements.montoRecibido?.value) || null;
      const tc = parseFloat(elements.tipoCambio?.value) || 1;
      
      // Si hay plataforma, calcular valores
      let monto = parseFloat(elements.monto.value);
      let montoBruto = null;
      let comisionValor = 0;
      let tipoComision = 'monto';
      
      if (plataformaId && montoTotal && montoRecibido !== null) {
        montoBruto = montoTotal;
        monto = montoRecibido * tc;
        comisionValor = montoTotal - montoRecibido;
        tipoComision = 'monto';
      }
      
      const d = {
        tipo: elements.tipo.value,
        cuenta_bancaria_id: elements.cuentaId.value,
        monto: monto,
        fecha: elements.fecha.value,
        moneda: elements.moneda.value || 'MXN',
        metodo_pago: elements.metodoPago.value || null,
        contacto_id: elements.contactoId.value || null,
        descripcion: elements.descripcion.value.trim() || null,
        referencia: elements.referencia.value.trim() || null,
        plataforma_id: plataformaId,
        monto_bruto: montoBruto,
        tipo_comision: tipoComision,
        comision_valor: comisionValor,
        moneda_origen: elements.monedaOrigen?.value || 'MXN',
        tipo_cambio: tc
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
    
    // ========== CREAR CONTACTO ==========
    openContactoModal() {
      elements.contactoForm.reset();
      elements.contactoTipo.value = 'cliente';
      elements.contactoModal.classList.add('active');
      elements.contactoNombre.focus();
    },
    
    closeContactoModal() {
      elements.contactoModal.classList.remove('active');
    },
    
    async submitContacto(e) {
      e.preventDefault();
      const data = {
        nombre: elements.contactoNombre.value.trim(),
        tipo: elements.contactoTipo.value,
        email: elements.contactoEmail.value.trim() || null,
        telefono: elements.contactoTelefono.value.trim() || null,
        rfc: elements.contactoRfc.value.trim().toUpperCase() || null
      };
      try {
        const result = await api.createContacto(data);
        const nuevoContacto = result.contacto || result;
        state.contactos.push(nuevoContacto);
        render.contactos();
        elements.contactoId.value = nuevoContacto.id;
        this.closeContactoModal();
        toast.success('Contacto creado');
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    // ========== CREAR MÉTODO DE PAGO ==========
    openMetodoPagoModal() {
      elements.metodoPagoForm.reset();
      elements.metodoPagoModal.classList.add('active');
      elements.metodoNombre.focus();
    },
    
    closeMetodoPagoModal() {
      elements.metodoPagoModal.classList.remove('active');
    },
    
    async submitMetodoPago(e) {
      e.preventDefault();
      const data = {
        nombre: elements.metodoNombre.value.trim(),
        clave: elements.metodoClave.value.trim() || null,
        descripcion: elements.metodoDescripcion.value.trim() || null
      };
      try {
        const result = await api.createMetodoPago(data);
        const nuevoMetodo = result.metodo_pago || result.metodoPago || result;
        state.metodosPago.push(nuevoMetodo);
        render.metodosPago();
        elements.metodoPago.value = nuevoMetodo.id || nuevoMetodo.clave || nuevoMetodo.nombre;
        this.closeMetodoPagoModal();
        toast.success('Método de pago creado');
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    // ========== CREAR PLATAFORMA ==========
    openPlataformaModal() {
      elements.plataformaForm.reset();
      elements.plataformaModal.classList.add('active');
      elements.plataformaNombre.focus();
    },
    
    closePlataformaModal() {
      elements.plataformaModal.classList.remove('active');
    },
    
    async submitPlataforma(e) {
      e.preventDefault();
      const data = {
        nombre: elements.plataformaNombre.value.trim(),
        descripcion: elements.plataformaDescripcion.value.trim() || null
      };
      try {
        const result = await api.createPlataforma(data);
        const nuevaPlataforma = result.plataforma || result;
        state.plataformas.push(nuevaPlataforma);
        render.plataformas();
        elements.plataformaId.value = nuevaPlataforma.id;
        this.closePlataformaModal();
        this.toggleComisionSection();
        toast.success('Plataforma creada');
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    // ========== GASTO DESDE TRANSACCIÓN ==========
    openGastoFromTx() {
      const tx = state.viewingTx;
      if (!tx) return;
      state.gastoFromTxId = tx.id;
      this.closeDetailModal();
      elements.gastoForm.reset();
      state.gastoImpuestosTemp = [];
      elements.gastoFromTxBox.style.display = 'block';
      elements.gastoFromTxInfo.textContent = `${utils.formatMoney(tx.monto, tx.moneda || 'MXN')} del ${utils.formatDate(tx.fecha)}`;
      elements.gastoConcepto.value = tx.descripcion || '';
      elements.gastoProveedor.value = tx.contacto_id || '';
      elements.gastoFecha.value = utils.formatDateInput(tx.fecha);
      elements.gastoTotal.value = tx.monto;
      elements.gastoSubtotal.value = tx.monto;
      elements.gastoMoneda.value = tx.moneda || 'MXN';
      elements.gastoMetodoPago.value = tx.metodo_pago || '';
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
    
    // ========== VENTA DESDE TRANSACCIÓN ==========
    openVentaFromTx() {
      const tx = state.viewingTx;
      if (!tx) return;
      state.ventaFromTxId = tx.id;
      this.closeDetailModal();
      elements.ventaForm.reset();
      elements.ventaFromTxBox.style.display = 'block';
      elements.ventaFromTxInfo.textContent = `${utils.formatMoney(tx.monto, tx.moneda || 'MXN')} del ${utils.formatDate(tx.fecha)}`;
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
    
    // ========== CUENTA ==========
    openCuentaModal() { 
      elements.cuentaForm.reset(); 
      elements.cuentaModal.classList.add('active'); 
    },
    
    closeCuentaModal() { 
      elements.cuentaModal.classList.remove('active'); 
    },
    
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
    
    // ========== ELIMINAR ==========
    openDeleteModal(t) { 
      state.deletingId = t.id; 
      elements.deleteModal.classList.add('active'); 
    },
    
    closeDeleteModal() { 
      elements.deleteModal.classList.remove('active'); 
      state.deletingId = null; 
    },
    
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
    elements.sidebarClose?.addEventListener('click', () => handlers.closeSidebar());
    elements.sidebarOverlay?.addEventListener('click', () => handlers.closeSidebar());
    elements.orgSwitcher?.addEventListener('click', () => handlers.switchOrg());

    // Botones crear
    elements.addTxBtn?.addEventListener('click', () => handlers.openCreateModal());
    elements.addFirstTxBtn?.addEventListener('click', () => handlers.openCreateModal());
    elements.fabBtn?.addEventListener('click', () => handlers.openCreateModal());

    // Modal detalle
    elements.closeDetailModal?.addEventListener('click', () => { handlers.closeDetailModal(); state.viewingTx = null; });
    elements.closeDetailBtn?.addEventListener('click', () => { handlers.closeDetailModal(); state.viewingTx = null; });
    elements.editFromDetailBtn?.addEventListener('click', () => handlers.editFromDetail());
    elements.detailModal?.addEventListener('click', e => { if (e.target === elements.detailModal) { handlers.closeDetailModal(); state.viewingTx = null; } });

    // Modal transacción
    elements.closeModal?.addEventListener('click', () => handlers.closeTxModal());
    elements.cancelModal?.addEventListener('click', () => handlers.closeTxModal());
    elements.txForm?.addEventListener('submit', e => handlers.submitTx(e));
    elements.txModal?.addEventListener('click', e => { if (e.target === elements.txModal) handlers.closeTxModal(); });
    elements.addCuentaBtn?.addEventListener('click', () => handlers.openCuentaModal());
    elements.addContactoBtn?.addEventListener('click', () => handlers.openContactoModal());
    elements.addMetodoPagoBtn?.addEventListener('click', () => handlers.openMetodoPagoModal());
    elements.addPlataformaBtn?.addEventListener('click', () => handlers.openPlataformaModal());
    
    // Plataforma y comisión listeners
    elements.plataformaId?.addEventListener('change', () => handlers.toggleComisionSection());
    elements.montoTotal?.addEventListener('input', () => handlers.calcComision());
    elements.montoRecibido?.addEventListener('input', () => handlers.calcComision());
    elements.tipoCambio?.addEventListener('input', () => handlers.calcComision());

    // Modal crear contacto
    elements.closeContactoModal?.addEventListener('click', () => handlers.closeContactoModal());
    elements.cancelContactoModal?.addEventListener('click', () => handlers.closeContactoModal());
    elements.contactoForm?.addEventListener('submit', e => handlers.submitContacto(e));
    elements.contactoModal?.addEventListener('click', e => { if (e.target === elements.contactoModal) handlers.closeContactoModal(); });

    // Modal crear método de pago
    elements.closeMetodoPagoModal?.addEventListener('click', () => handlers.closeMetodoPagoModal());
    elements.cancelMetodoPagoModal?.addEventListener('click', () => handlers.closeMetodoPagoModal());
    elements.metodoPagoForm?.addEventListener('submit', e => handlers.submitMetodoPago(e));
    elements.metodoPagoModal?.addEventListener('click', e => { if (e.target === elements.metodoPagoModal) handlers.closeMetodoPagoModal(); });

    // Modal crear plataforma
    elements.closePlataformaModal?.addEventListener('click', () => handlers.closePlataformaModal());
    elements.cancelPlataformaModal?.addEventListener('click', () => handlers.closePlataformaModal());
    elements.plataformaForm?.addEventListener('submit', e => handlers.submitPlataforma(e));
    elements.plataformaModal?.addEventListener('click', e => { if (e.target === elements.plataformaModal) handlers.closePlataformaModal(); });

    // Modal gasto
    elements.closeGastoModal?.addEventListener('click', () => handlers.closeGastoModal());
    elements.cancelGastoModal?.addEventListener('click', () => handlers.closeGastoModal());
    elements.gastoForm?.addEventListener('submit', e => handlers.submitGasto(e));
    elements.gastoModal?.addEventListener('click', e => { if (e.target === elements.gastoModal) handlers.closeGastoModal(); });
    elements.gastoCategoria?.addEventListener('change', () => handlers.loadSubcategorias());
    elements.gastoSubtotal?.addEventListener('input', () => handlers.recalcGastoImpuestos());
    elements.gastoEsFiscal?.addEventListener('change', () => {
      elements.gastoFiscalFields.style.display = elements.gastoEsFiscal.checked ? 'block' : 'none';
    });
    document.getElementById('addGastoImpuestoBtn')?.addEventListener('click', () => handlers.addGastoImpuesto());

    // Modal venta
    elements.closeVentaModal?.addEventListener('click', () => handlers.closeVentaModal());
    elements.cancelVentaModal?.addEventListener('click', () => handlers.closeVentaModal());
    elements.ventaForm?.addEventListener('submit', e => handlers.submitVenta(e));
    elements.ventaModal?.addEventListener('click', e => { if (e.target === elements.ventaModal) handlers.closeVentaModal(); });

    // Modal cuenta
    elements.closeCuentaModal?.addEventListener('click', () => handlers.closeCuentaModal());
    elements.cancelCuentaModal?.addEventListener('click', () => handlers.closeCuentaModal());
    elements.cuentaForm?.addEventListener('submit', e => handlers.submitCuenta(e));
    elements.cuentaModal?.addEventListener('click', e => { if (e.target === elements.cuentaModal) handlers.closeCuentaModal(); });

    // Modal eliminar
    elements.closeDeleteModal?.addEventListener('click', () => handlers.closeDeleteModal());
    elements.cancelDeleteModal?.addEventListener('click', () => handlers.closeDeleteModal());
    elements.confirmDelete?.addEventListener('click', () => handlers.confirmDelete());
    elements.deleteModal?.addEventListener('click', e => { if (e.target === elements.deleteModal) handlers.closeDeleteModal(); });

    // Filtros
    const df = utils.debounce(() => handlers.applyFilters(), 300);
    elements.searchInput?.addEventListener('input', df);
    elements.filterType?.addEventListener('change', () => handlers.applyFilters());
    elements.filterCuenta?.addEventListener('change', () => handlers.applyFilters());
    elements.filterConciliado?.addEventListener('change', () => handlers.applyFilters());
    elements.prevPage?.addEventListener('click', () => handlers.prevPage());
    elements.nextPage?.addEventListener('click', () => handlers.nextPage());

    // Escape para cerrar modales
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        handlers.closeDetailModal(); 
        state.viewingTx = null;
        handlers.closeTxModal(); 
        handlers.closeContactoModal();
        handlers.closeMetodoPagoModal();
        handlers.closePlataformaModal();
        handlers.closeGastoModal();
        handlers.closeVentaModal(); 
        handlers.closeCuentaModal(); 
        handlers.closeDeleteModal();
      }
    });

    handlers.loadData();
    console.log('🚀 TRUNO Transacciones v12 - Catálogo plataformas y cálculo automático comisión');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
