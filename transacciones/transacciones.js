/**
 * TRUNO - Transacciones v11
 * Con comisiones, plataforma origen y tipo de cambio
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
    // Crear cliente rápido desde conciliación (Registrar Venta)
    // Relación:
    // - truno-front/transacciones/index.html (#addVentaClienteBtn)
    // - handlers.openContactoModal('venta') -> al crear, autoselecciona en #ventaCliente
    addVentaClienteBtn: $('addVentaClienteBtn'),
    addMetodoPagoBtn: $('addMetodoPagoBtn'),
    addMonedaBtn: $('addMonedaBtn'),
    // Campos comisión
    plataformaOrigen: $('plataformaOrigen'),
    addPlataformaBtn: $('addPlataformaBtn'),
    comisionSection: $('comisionSection'),
    tieneComision: $('tieneComision'),
    montoBruto: $('montoBruto'),
    monedaOrigen: $('monedaOrigen'),
    // `tipoComision` se mantiene para compatibilidad (se guarda en DB)
    // En UI el usuario elige `comisionModo` para definir cómo capturar el dato.
    tipoComision: $('tipoComision'),
    comisionModo: $('comisionModo'),
    comisionValor: $('comisionValor'),
    tipoCambio: $('tipoCambio'),
    montoNetoDisplay: $('montoNetoDisplay'),
    pagoBrutoDisplay: $('pagoBrutoDisplay'),
    comisionMontoDisplay: $('comisionMontoDisplay'),
    comisionPctDisplay: $('comisionPctDisplay'),
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
    // Modal crear moneda
    // Relacionado con:
    // - truno-front/transacciones/index.html (#monedaModal)
    // - truno-back/src/routes/monedas.routes.js (POST /api/monedas)
    monedaModal: $('monedaModal'),
    monedaForm: $('monedaForm'),
    closeMonedaModal: $('closeMonedaModal'),
    cancelMonedaModal: $('cancelMonedaModal'),
    monedaCodigo: $('monedaCodigo'),
    monedaNombre: $('monedaNombre'),
    monedaSimbolo: $('monedaSimbolo'),
    monedaDecimales: $('monedaDecimales'),
    monedaTipoCambio: $('monedaTipoCambio'),
    // Modal crear plataforma (origen)
    // Relación:
    // - truno-front/transacciones/index.html (#plataformaModal)
    // - truno-back/src/routes/plataformas.routes.js (GET/POST /api/plataformas)
    plataformaModal: $('plataformaModal'),
    plataformaForm: $('plataformaForm'),
    closePlataformaModal: $('closePlataformaModal'),
    cancelPlataformaModal: $('cancelPlataformaModal'),
    submitPlataformaBtn: $('submitPlataformaBtn'),
    plataformaModalTitle: $('plataformaModalTitle'),
    cancelEditPlataformaBtn: $('cancelEditPlataformaBtn'),
    plataformasList: $('plataformasList'),
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
    confirmDelete: $('confirmDelete'),
    // Modal confirmación (reutilizable)
    // Relación:
    // - truno-front/transacciones/index.html (#confirmModal)
    confirmModal: $('confirmModal'),
    closeConfirmModal: $('closeConfirmModal'),
    confirmTitle: $('confirmTitle'),
    confirmMessage: $('confirmMessage'),
    confirmCancelBtn: $('confirmCancelBtn'),
    confirmOkBtn: $('confirmOkBtn')
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
    plataformaEditingId: null,
    gastoImpuestosTemp: [],
    paginacion: { pagina: 1, limite: 20, total: 0, paginas: 0 },
    editingId: null, 
    deletingId: null, 
    viewingTx: null,
    gastoFromTxId: null,
    ventaFromTxId: null,
    // Target para creación rápida de contactos:
    // - 'tx' -> selecciona en #contactoId (movimiento)
    // - 'venta' -> selecciona en #ventaCliente (conciliar venta)
    // - 'gasto' -> selecciona en #gastoProveedor (conciliar gasto) [no solicitado ahora, pero queda listo]
    contactCreateTarget: 'tx',
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
    // Formateador seguro (evita RangeError si llega un código de moneda no estándar)
    formatMoney: (a, c = 'MXN') => {
      try {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: c }).format(a || 0);
      } catch (_) {
        return new Intl.NumberFormat('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(a || 0) + ` ${c || ''}`.trim();
      }
    },
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
      // IMPORTANT:
      // En Transacciones no queremos mezclar Transferencias internas (tienen su propio módulo).
      // Si se mezclan, el filtro "Estado" (Conciliados / Sin conciliar) se percibe incorrecto.
      // Relacionado con: truno-back/src/routes/transacciones.routes.js (excluir_transferencias)
      params.excluir_transferencias = '1';
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
    createMoneda: d => api.request('/api/monedas', { method: 'POST', body: JSON.stringify(d) }),
    getMetodosPago: () => api.request('/api/metodos-pago'),
    createMetodoPago: d => api.request('/api/metodos-pago', { method: 'POST', body: JSON.stringify(d) }),
    // Plataformas (orígenes)
    getPlataformas: () => api.request('/api/plataformas?activo=1'),
    createPlataforma: d => api.request('/api/plataformas', { method: 'POST', body: JSON.stringify(d) }),
    updatePlataforma: (id, d) => api.request(`/api/plataformas/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    deletePlataforma: id => api.request(`/api/plataformas/${id}`, { method: 'DELETE' }),
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
      // Relacionado con:
      // - truno-front/transacciones/index.html (#moneda, #gastoMoneda)
      // - truno-front/catalogos/catalogos.js (fuente: /api/monedas)
      const targets = [elements.moneda, elements.gastoMoneda].filter(Boolean);
      if (!targets.length && !elements.monedaOrigen) return;

      if (state.monedas.length > 0) {
        const activas = state.monedas.filter(m => m.activo);
        // Si vienen monedas pero ninguna está activa, usar fallback seguro
        if (!activas.length) {
          const defaultOpts = `
            <option value="MXN" selected>MXN - Peso Mexicano</option>
            <option value="USD">USD - Dólar</option>
            <option value="EUR">EUR - Euro</option>
          `;
          targets.forEach(sel => { sel.innerHTML = defaultOpts; });

          if (elements.monedaOrigen) {
            elements.monedaOrigen.innerHTML = `
              <option value="MXN">MXN</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            `;
          }
          return;
        }

        const html = activas.map(m =>
          `<option value="${m.codigo}" ${m.es_default ? 'selected' : ''}>${m.codigo} - ${m.nombre}</option>`
        ).join('');
        targets.forEach(sel => { sel.innerHTML = html; });

        // Select para moneda origen (solo código, usado en comisión/conversión)
        if (elements.monedaOrigen) {
          elements.monedaOrigen.innerHTML = activas.map(m =>
            `<option value="${m.codigo}" ${m.es_default ? 'selected' : ''}>${m.codigo}</option>`
          ).join('');
        }
      } else {
        const defaultOpts = `
          <option value="MXN" selected>MXN - Peso Mexicano</option>
          <option value="USD">USD - Dólar</option>
          <option value="EUR">EUR - Euro</option>
        `;
        targets.forEach(sel => { sel.innerHTML = defaultOpts; });

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
      // Relación:
      // - truno-front/transacciones/index.html (#plataformaOrigen)
      // - truno-back/src/routes/plataformas.routes.js (GET /api/plataformas)
      if (!elements.plataformaOrigen) return;
      const plataformasActivas = (state.plataformas || []).filter(p => p.activo !== false);
      const opts = plataformasActivas.map(p => `<option value="${p.nombre}">${p.nombre}</option>`).join('');
      const current = elements.plataformaOrigen.value;
      elements.plataformaOrigen.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
      // Mantener selección si existía y aún está en la lista
      if (current) elements.plataformaOrigen.value = current;
    },
    plataformasAdmin() {
      // Render dentro del modal de plataformas (editar / eliminar)
      // Relación:
      // - truno-front/transacciones/index.html (#plataformasList)
      // - truno-back/src/routes/plataformas.routes.js (PUT/DELETE)
      if (!elements.plataformasList) return;
      const list = Array.isArray(state.plataformas) ? state.plataformas.slice() : [];
      // Mostrar activas primero
      list.sort((a, b) => (b.activo === false) - (a.activo === false) || String(a.nombre).localeCompare(String(b.nombre)));

      if (!list.length) {
        elements.plataformasList.innerHTML = `<div class="impuestos-empty">Sin plataformas registradas</div>`;
        return;
      }

      elements.plataformasList.innerHTML = list.map(p => {
        const inactive = (p.activo === 0 || p.activo === false);
        return `
          <div class="plataforma-item ${inactive ? 'inactive' : ''}" data-id="${p.id}">
            <div class="plataforma-item-info">
              <div class="plataforma-item-name">
                ${p.nombre || 'Sin nombre'}
                ${inactive ? '<span class="plataforma-status">Baja</span>' : ''}
              </div>
              <div class="plataforma-item-desc">${p.descripcion || '—'}</div>
            </div>
            <div class="plataforma-item-actions">
              <!--
                IMPORTANTE:
                No usar data-action="delete" aquí porque colisiona con listeners globales de Transacciones
                (render.transacciones() enlaza [data-action="delete"] para eliminar movimientos).
              -->
              <button type="button" class="action-btn" title="Editar" data-plataforma-action="edit" data-plataforma-id="${p.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button type="button" class="action-btn danger" title="Eliminar / Dar de baja" data-plataforma-action="delete" data-plataforma-id="${p.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        `;
      }).join('');

      // Event delegation para evitar listeners duplicados en re-render
      elements.plataformasList.onclick = (e) => {
        const btn = e.target.closest('button[data-plataforma-action]');
        if (!btn) return;
        e.preventDefault();
        e.stopPropagation();
        const action = btn.dataset.plataformaAction;
        const id = btn.dataset.plataformaId;
        const p = state.plataformas.find(x => x.id === id);
        if (!p) return;
        if (action === 'edit') handlers.startEditPlataforma(p);
        if (action === 'delete') handlers.deletePlataforma(p);
      };
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
      // Nota:
      // - En transacciones.css hay reglas con display: ... !important (desktop).
      // - Por eso aquí usamos una clase .truno-hidden (display:none !important) para ocultar de verdad.
      // Relacionado con: truno-front/transacciones/transacciones.css
      const hide = (el) => el?.classList?.add('truno-hidden');
      const show = (el) => el?.classList?.remove('truno-hidden');

      if (!transacciones.length) {
        // Limpiar para evitar que se vean filas "viejas" si CSS fuerza la tabla visible
        if (elements.tableBody) elements.tableBody.innerHTML = '';
        if (elements.mobileCards) elements.mobileCards.innerHTML = '';

        hide(elements.tableContainer);
        hide(elements.pagination);
        show(elements.emptyState);
        return;
      }

      hide(elements.emptyState);
      show(elements.tableContainer);
      show(elements.pagination);
      
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

      // Helpers de comisión: muestra siempre monto + % real (estilo “Remitly”)
      const normalizePct = (raw) => {
        const v = parseFloat(raw) || 0;
        if (!v) return 0;
        return v <= 1 ? v * 100 : v; // soporta % guardado como fracción (0-1)
      };
      const calcFeeFromTx = (t) => {
        const bruto = parseFloat(t.monto_bruto) || 0;
        if (!bruto) return { fee: 0, pct: 0, bruto: 0 };
        const tipo = t.tipo_comision || 'monto';
        const raw = parseFloat(t.comision_valor) || 0;
        let fee = 0;
        if (tipo === 'porcentaje') {
          const pct = normalizePct(raw);
          fee = bruto * (pct / 100);
        } else {
          fee = raw;
        }
        const pctReal = bruto > 0 ? (fee / bruto) * 100 : 0;
        return { fee, pct: pctReal, bruto };
      };

      elements.tableBody.innerHTML = transacciones.map(t => {
        const isIncome = t.tipo === 'ingreso';
        const conciliado = t.gasto_id || t.venta_id;
        const metodoLabel = getMetodoLabel(t.metodo_pago);
        const moneda = t.moneda || 'MXN';
        const tieneComision = !!(t.monto_bruto && (t.comision_valor !== null && t.comision_valor !== undefined));
        const feeInfo = tieneComision ? calcFeeFromTx(t) : null;
        
        return `<tr data-id="${t.id}" class="clickable-row">
          <td>
            <div class="cell-main">${t.descripcion || 'Sin descripción'}</div>
            <div class="cell-sub">${t.plataforma_origen ? `📍 ${t.plataforma_origen}` : ''} ${t.referencia || ''}</div>
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
            <div class="cell-sub">${tieneComision ? `Pagado: ${utils.formatMoney(feeInfo.bruto, t.moneda_origen || moneda)} • Comisión: ${utils.formatMoney(feeInfo.fee, t.moneda_origen || moneda)} (${feeInfo.pct.toFixed(2)}%)` : moneda}</div>
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
        const tieneComision = !!(t.monto_bruto && (t.comision_valor !== null && t.comision_valor !== undefined));
        const feeInfo = tieneComision ? calcFeeFromTx(t) : null;
        
        return `<div class="mobile-card" data-id="${t.id}">
          <div class="mobile-card-header">
            <div class="mobile-card-title">${t.descripcion || 'Sin descripción'}</div>
            <div class="mobile-card-amount ${isIncome ? 'income' : ''}">${isIncome ? '+' : '-'}${utils.formatMoney(Math.abs(t.monto), moneda)}</div>
          </div>
          <div class="mobile-card-meta">
            <span>${utils.formatDate(t.fecha)}</span>
            <span>${t.nombre_cuenta || '-'}</span>
            ${t.plataforma_origen ? `<span>📍 ${t.plataforma_origen}</span>` : ''}
            ${metodoLabel !== '-' ? `<span>${metodoLabel}</span>` : ''}
          </div>
          ${tieneComision ? `<div class="mobile-card-meta"><span>Pagado: ${utils.formatMoney(feeInfo.bruto, t.moneda_origen || moneda)}</span><span>Comisión: ${utils.formatMoney(feeInfo.fee, t.moneda_origen || moneda)} (${feeInfo.pct.toFixed(2)}%)</span></div>` : ''}
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
    // ========== CONFIRMACIÓN CON ESTILO (MODAL) ==========
    // Reemplaza window.confirm para mantener el diseño del sistema.
    // Retorna Promise<boolean>.
    uiConfirm(opts = {}) {
      const title = opts.title || 'Confirmar';
      const message = opts.message || '¿Seguro que deseas continuar?';
      const confirmText = opts.confirmText || 'Confirmar';
      const confirmVariant = opts.confirmVariant || 'danger'; // 'danger' | 'primary'

      return new Promise(resolve => {
        if (!elements.confirmModal) return resolve(false);

        // Set content
        if (elements.confirmTitle) elements.confirmTitle.textContent = title;
        if (elements.confirmMessage) elements.confirmMessage.textContent = message;
        if (elements.confirmOkBtn) {
          elements.confirmOkBtn.textContent = confirmText;
          elements.confirmOkBtn.classList.remove('btn-primary', 'btn-danger');
          elements.confirmOkBtn.classList.add(confirmVariant === 'primary' ? 'btn-primary' : 'btn-danger');
        }

        const cleanup = () => {
          elements.confirmModal.classList.remove('active');
          elements.confirmCancelBtn?.removeEventListener('click', onCancel);
          elements.closeConfirmModal?.removeEventListener('click', onCancel);
          elements.confirmOkBtn?.removeEventListener('click', onOk);
          elements.confirmModal?.removeEventListener('click', onOverlay);
          document.removeEventListener('keydown', onEsc);
        };

        const onCancel = () => { cleanup(); resolve(false); };
        const onOk = () => { cleanup(); resolve(true); };
        const onOverlay = (e) => { if (e.target === elements.confirmModal) onCancel(); };
        const onEsc = (e) => { if (e.key === 'Escape') onCancel(); };

        elements.confirmCancelBtn?.addEventListener('click', onCancel);
        elements.closeConfirmModal?.addEventListener('click', onCancel);
        elements.confirmOkBtn?.addEventListener('click', onOk);
        elements.confirmModal?.addEventListener('click', onOverlay);
        document.addEventListener('keydown', onEsc);

        elements.confirmModal.classList.add('active');
      });
    },
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

    // ========== COMISIÓN HANDLERS ==========
    toggleComisionSection() {
      // Mostrar sección SOLO si el usuario activó el switch.
      // Nota: antes también se mostraba al escribir "Plataforma Origen" (legacy),
      // pero eso hacía que el switch pareciera "no hacer nada".
      const show = !!elements.tieneComision?.checked;
      if (elements.comisionSection) {
        elements.comisionSection.style.display = show ? 'block' : 'none';
        if (!show) {
          if (elements.montoBruto) elements.montoBruto.value = '';
          if (elements.comisionValor) elements.comisionValor.value = '';
          if (elements.tipoCambio) elements.tipoCambio.value = '1';
          if (elements.comisionModo) elements.comisionModo.value = 'desde_neto';
          if (elements.tipoComision) elements.tipoComision.value = 'monto';
          handlers.renderComisionResumen();
        }
      }
    },

    /**
     * Calcula comisión/monto recibido en ambos sentidos.
     *
     * Modelo:
     * - `montoBruto` está en moneda origen (lo pagado)
     * - `monto` (principal) está en moneda de la cuenta (lo recibido)
     * - `tipoCambio` = (moneda cuenta) por 1 (moneda origen). Ej: 1 USD = 17.10 MXN
     * - `comisionValor` puede ser:
     *   - monto fijo en moneda origen, o
     *   - porcentaje (0-100)
     *
     * Relación:
     * - truno-front/transacciones/index.html (#comisionModo, #tipoComision, #comisionValor, #montoBruto, #monto, #tipoCambio)
     */
    calcComisionYMontos(source = 'auto') {
      const brutoOrigen = parseFloat(elements.montoBruto?.value) || 0;
      const tc = Math.max(0, parseFloat(elements.tipoCambio?.value) || 1);
      const netoCuenta = parseFloat(elements.monto?.value) || 0;
      const monedaCuenta = elements.moneda?.value || 'MXN';
      const monedaOrigen = elements.monedaOrigen?.value || monedaCuenta;

      // Si no hay bruto, solo refrescar resumen.
      if (!brutoOrigen) {
        handlers.renderComisionResumen();
        return;
      }

      // Determinar modo de captura
      const modo = elements.comisionModo?.value || 'desde_neto';

      // Normalizar: si el usuario tocó el input de comisión, respetar ese modo
      if (source === 'comisionValor' || source === 'tipoComision') {
        if (elements.comisionModo) {
          if (elements.tipoComision?.value === 'porcentaje') elements.comisionModo.value = 'porcentaje';
          else elements.comisionModo.value = 'monto';
        }
      }

      // Ejecutar cálculo según modo
      if (modo === 'porcentaje') {
        if (elements.tipoComision) elements.tipoComision.value = 'porcentaje';
        if (elements.comisionValor) elements.comisionValor.disabled = false;
        const pct = Math.max(0, parseFloat(elements.comisionValor?.value) || 0);
        const feeOrigen = brutoOrigen * (pct / 100);
        const netoCalc = (brutoOrigen - feeOrigen) * tc;
        if (elements.monto) elements.monto.value = isFinite(netoCalc) ? netoCalc.toFixed(2) : '';
      } else if (modo === 'monto') {
        if (elements.tipoComision) elements.tipoComision.value = 'monto';
        if (elements.comisionValor) elements.comisionValor.disabled = false;
        const feeOrigen = Math.max(0, parseFloat(elements.comisionValor?.value) || 0);
        const netoCalc = (brutoOrigen - feeOrigen) * tc;
        if (elements.monto) elements.monto.value = isFinite(netoCalc) ? netoCalc.toFixed(2) : '';
      } else {
        // desde_neto: el usuario conoce lo recibido (monto) y el bruto; calculamos la comisión
        if (elements.tipoComision) elements.tipoComision.value = 'monto';
        if (elements.comisionValor) elements.comisionValor.disabled = true;

        const netoEnOrigen = tc > 0 ? (netoCuenta / tc) : 0;
        const feeOrigen = Math.max(0, brutoOrigen - netoEnOrigen);
        if (elements.comisionValor) elements.comisionValor.value = feeOrigen ? feeOrigen.toFixed(2) : '0';
      }

      // Refrescar resumen (incluye % calculado siempre)
      handlers.renderComisionResumen({ monedaCuenta, monedaOrigen });
    },

    /**
     * Renderiza el resumen: pagado, comisión (monto + %) y llega.
     * - Siempre calcula % real, aunque la comisión se haya ingresado como monto.
     */
    renderComisionResumen(opts = {}) {
      const monedaCuenta = opts.monedaCuenta || (elements.moneda?.value || 'MXN');
      const monedaOrigen = opts.monedaOrigen || (elements.monedaOrigen?.value || monedaCuenta);

      const brutoOrigen = parseFloat(elements.montoBruto?.value) || 0;
      const tc = Math.max(0, parseFloat(elements.tipoCambio?.value) || 1);
      const netoCuenta = parseFloat(elements.monto?.value) || 0;

      let feeOrigen = 0;
      const tipoComision = elements.tipoComision?.value || 'monto';
      const rawComision = parseFloat(elements.comisionValor?.value) || 0;

      // Soportar datos antiguos: porcentaje puede venir como fracción (0.035) o como % (3.5)
      if (tipoComision === 'porcentaje') {
        const pct = rawComision <= 1 ? (rawComision * 100) : rawComision;
        feeOrigen = brutoOrigen > 0 ? brutoOrigen * (pct / 100) : 0;
      } else {
        feeOrigen = rawComision;
      }

      const pctReal = brutoOrigen > 0 ? (feeOrigen / brutoOrigen) * 100 : 0;

      if (elements.pagoBrutoDisplay) elements.pagoBrutoDisplay.textContent = utils.formatMoney(brutoOrigen, monedaOrigen);
      if (elements.comisionMontoDisplay) elements.comisionMontoDisplay.textContent = utils.formatMoney(feeOrigen, monedaOrigen);
      if (elements.comisionPctDisplay) elements.comisionPctDisplay.textContent = `${(pctReal || 0).toFixed(2)}%`;
      if (elements.montoNetoDisplay) elements.montoNetoDisplay.textContent = utils.formatMoney(netoCuenta, monedaCuenta);

      // UX: placeholder cambia según modo
      const modo = elements.comisionModo?.value || 'desde_neto';
      if (elements.comisionValor) {
        if (modo === 'porcentaje') elements.comisionValor.placeholder = 'Ej: 3.5';
        else elements.comisionValor.placeholder = '0.00';
      }
    },
    
    async openDetailModal(tx) {
      if (!tx) return;
      state.viewingTx = tx;
      const isIncome = tx.tipo === 'ingreso';
      const conciliado = tx.gasto_id || tx.venta_id;
      const moneda = tx.moneda || 'MXN';
      const tieneComision = !!(tx.monto_bruto && (tx.comision_valor !== null && tx.comision_valor !== undefined));

      const normalizePct = (raw) => {
        const v = parseFloat(raw) || 0;
        if (!v) return 0;
        return v <= 1 ? v * 100 : v;
      };
      const calcFee = () => {
        const bruto = parseFloat(tx.monto_bruto) || 0;
        if (!bruto) return { fee: 0, pct: 0, bruto: 0 };
        const tipo = tx.tipo_comision || 'monto';
        const raw = parseFloat(tx.comision_valor) || 0;
        let fee = 0;
        if (tipo === 'porcentaje') {
          const pct = normalizePct(raw);
          fee = bruto * (pct / 100);
        } else {
          fee = raw;
        }
        const pctReal = bruto > 0 ? (fee / bruto) * 100 : 0;
        return { fee, pct: pctReal, bruto };
      };
      const feeInfo = tieneComision ? calcFee() : null;
      
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
        ${tieneComision ? `<div class="detail-amount-label" style="margin-top:8px;">Pagado: ${utils.formatMoney(feeInfo.bruto, tx.moneda_origen || moneda)} → Comisión: ${utils.formatMoney(feeInfo.fee, tx.moneda_origen || moneda)} (${feeInfo.pct.toFixed(2)}%)</div>` : ''}
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
          <div class="detail-item"><label>Plataforma Origen</label><span>${tx.plataforma_origen || '-'}</span></div>
          <div class="detail-item"><label>Moneda Origen</label><span>${tx.moneda_origen || moneda}</span></div>
          <div class="detail-item"><label>Tipo de Cambio</label><span>${tx.tipo_cambio || 1}</span></div>
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
      if (elements.tieneComision) elements.tieneComision.checked = false;
      if (elements.comisionModo) elements.comisionModo.value = 'desde_neto';
      if (elements.tipoComision) elements.tipoComision.value = 'monto';
      if (elements.comisionValor) elements.comisionValor.disabled = true;
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
      
      // Asegurar que la plataforma exista en el select (por compatibilidad con datos antiguos)
      if (elements.plataformaOrigen) {
        const val = tx.plataforma_origen || '';
        if (val) {
          const has = Array.from(elements.plataformaOrigen.options).some(o => o.value === val);
          if (!has) {
            const opt = document.createElement('option');
            opt.value = val;
            opt.textContent = val;
            elements.plataformaOrigen.appendChild(opt);
          }
        }
        elements.plataformaOrigen.value = val;
      }
      if (elements.montoBruto) elements.montoBruto.value = tx.monto_bruto || '';
      if (elements.monedaOrigen) elements.monedaOrigen.value = tx.moneda_origen || 'MXN';
      if (elements.tipoComision) elements.tipoComision.value = tx.tipo_comision || 'monto';
      if (elements.comisionValor) elements.comisionValor.value = (tx.comision_valor ?? '') !== null ? (tx.comision_valor ?? '') : '';
      if (elements.tipoCambio) elements.tipoCambio.value = tx.tipo_cambio || '1';

      // Marcar el switch si hay datos de comisión/conversión
      if (elements.tieneComision) {
        elements.tieneComision.checked = !!(tx.monto_bruto || tx.plataforma_origen);
      }

      // Derivar modo UI desde lo guardado
      if (elements.comisionModo) {
        if (tx.tipo_comision === 'porcentaje') elements.comisionModo.value = 'porcentaje';
        else elements.comisionModo.value = 'monto';
        // Si no hay valor de comisión pero sí bruto, permitir “desde_neto” (calcular)
        if ((tx.comision_valor === null || tx.comision_valor === undefined) && tx.monto_bruto) {
          elements.comisionModo.value = 'desde_neto';
        }
      }
      
      this.toggleComisionSection();
      handlers.calcComisionYMontos('auto');
      
      elements.txModal.classList.add('active');
    },
    
    closeTxModal() { 
      elements.txModal.classList.remove('active'); 
      state.editingId = null; 
    },
    
    async submitTx(e) {
      e.preventDefault();
      // Asegurar que el resumen y los valores calculados estén sincronizados antes de enviar
      handlers.calcComisionYMontos('auto');

      const usarComision = !!elements.tieneComision?.checked;
      const d = {
        tipo: elements.tipo.value,
        cuenta_bancaria_id: elements.cuentaId.value,
        monto: parseFloat(elements.monto.value),
        fecha: elements.fecha.value,
        moneda: elements.moneda.value || 'MXN',
        metodo_pago: elements.metodoPago.value || null,
        contacto_id: elements.contactoId.value || null,
        descripcion: elements.descripcion.value.trim() || null,
        referencia: elements.referencia.value.trim() || null,
        plataforma_origen: elements.plataformaOrigen?.value || null,
        // Solo enviar payload de comisión si el switch está activo.
        // Esto evita “comisiones fantasma” y hace el comportamiento evidente.
        monto_bruto: usarComision ? (parseFloat(elements.montoBruto?.value) || null) : null,
        tipo_comision: usarComision ? (elements.tipoComision?.value || 'monto') : null,
        comision_valor: usarComision ? (parseFloat(elements.comisionValor?.value) || 0) : null,
        moneda_origen: elements.monedaOrigen?.value || 'MXN',
        tipo_cambio: parseFloat(elements.tipoCambio?.value) || 1
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
    // ========== CREAR PLATAFORMA (ORIGEN) ==========
    async openPlataformaModal() {
      handlers.cancelEditPlataforma(); // fuerza modo "crear"
      elements.plataformaForm?.reset();
      elements.plataformaModal?.classList.add('active');
      try {
        const res = await api.getPlataformas().catch(() => ({ plataformas: [] }));
        state.plataformas = res.plataformas || [];
        render.plataformas();
        render.plataformasAdmin();
      } catch (_) {
        render.plataformasAdmin();
      }
      elements.plataformaNombre?.focus();
    },

    closePlataformaModal() {
      elements.plataformaModal?.classList.remove('active');
    },

    startEditPlataforma(plataforma) {
      state.plataformaEditingId = plataforma.id;
      if (elements.plataformaModalTitle) elements.plataformaModalTitle.textContent = 'Editar Plataforma';
      if (elements.submitPlataformaBtn) elements.submitPlataformaBtn.textContent = 'Guardar Cambios';
      if (elements.cancelEditPlataformaBtn) elements.cancelEditPlataformaBtn.style.display = 'inline-flex';
      if (elements.plataformaNombre) elements.plataformaNombre.value = plataforma.nombre || '';
      if (elements.plataformaDescripcion) elements.plataformaDescripcion.value = plataforma.descripcion || '';
      elements.plataformaNombre?.focus();
    },

    cancelEditPlataforma() {
      state.plataformaEditingId = null;
      if (elements.plataformaModalTitle) elements.plataformaModalTitle.textContent = 'Nueva Plataforma';
      if (elements.submitPlataformaBtn) elements.submitPlataformaBtn.textContent = 'Crear Plataforma';
      if (elements.cancelEditPlataformaBtn) elements.cancelEditPlataformaBtn.style.display = 'none';
    },

    async submitPlataforma(e) {
      e.preventDefault();
      const nombre = elements.plataformaNombre?.value?.trim();
      if (!nombre) return;

      const data = {
        nombre,
        descripcion: elements.plataformaDescripcion?.value?.trim() || null,
        activo: true
      };

      try {
        if (state.plataformaEditingId) {
          const prev = state.plataformas.find(p => p.id === state.plataformaEditingId);
          const oldName = prev?.nombre || null;
          const result = await api.updatePlataforma(state.plataformaEditingId, data);
          const updated = result.plataforma || result;
          state.plataformas = state.plataformas.map(p => p.id === updated.id ? updated : p);
          render.plataformas();
          render.plataformasAdmin();
          // Si el select estaba usando el nombre anterior, actualizarlo al nuevo nombre
          if (oldName && elements.plataformaOrigen?.value === oldName) {
            elements.plataformaOrigen.value = updated.nombre;
          }
          handlers.cancelEditPlataforma();
          toast.success('Plataforma actualizada');
        } else {
          const result = await api.createPlataforma(data);
          const nueva = result.plataforma || result;
          state.plataformas.push(nueva);
          render.plataformas();
          render.plataformasAdmin();
          if (elements.plataformaOrigen) elements.plataformaOrigen.value = nueva.nombre;
          toast.success('Plataforma creada');
        }
      } catch (err) {
        toast.error(err.message);
      }
    },

    async deletePlataforma(plataforma) {
      const nombre = plataforma?.nombre || 'esta plataforma';
      const ok = await handlers.uiConfirm({
        title: 'Eliminar plataforma',
        message: `¿Eliminar / dar de baja "${nombre}"?`,
        confirmText: 'Eliminar',
        confirmVariant: 'danger'
      });
      if (!ok) return;
      try {
        await api.deletePlataforma(plataforma.id);
        // Refrescar desde API para respetar si fue borrado o desactivado
        const res = await api.getPlataformas().catch(() => ({ plataformas: [] }));
        state.plataformas = res.plataformas || [];
        render.plataformas();
        render.plataformasAdmin();
        // Si estaba seleccionada y ya no existe/está inactiva, limpiar
        const stillActive = state.plataformas.some(p => p.nombre === elements.plataformaOrigen?.value && p.activo !== false);
        if (elements.plataformaOrigen && elements.plataformaOrigen.value && !stillActive) {
          elements.plataformaOrigen.value = '';
        }
        handlers.cancelEditPlataforma();
        toast.success('Plataforma eliminada/dada de baja');
      } catch (err) {
        toast.error(err.message);
      }
    },

    
    // ========== CREAR CONTACTO ==========
    openContactoModal(target = 'tx') {
      // Guardar target para autoseleccionar después de crear
      state.contactCreateTarget = (target === 'venta' || target === 'gasto') ? target : 'tx';

      // Si el contacto se crea desde conciliación (venta), este modal debe quedar arriba del modal de venta.
      // Relación:
      // - truno-front/transacciones/transacciones.css (#contactoModal.truno-modal-top)
      if (elements.contactoModal) {
        if (state.contactCreateTarget === 'venta') elements.contactoModal.classList.add('truno-modal-top');
        else elements.contactoModal.classList.remove('truno-modal-top');
      }

      elements.contactoForm.reset();
      // Por defecto: cliente (esto cubre Transacción + Venta).
      // Si en el futuro se usa para gasto, se puede forzar a proveedor.
      elements.contactoTipo.value = (state.contactCreateTarget === 'gasto') ? 'proveedor' : 'cliente';
      elements.contactoModal.classList.add('active');
      elements.contactoNombre.focus();
    },
    
    closeContactoModal() {
      elements.contactoModal.classList.remove('active');
      // Limpiar stacking para futuros usos
      elements.contactoModal.classList.remove('truno-modal-top');
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
        // Autoseleccionar según el flujo donde se creó
        // Relación:
        // - 'tx' -> Movimiento
        // - 'venta' -> Registrar Venta
        // - 'gasto' -> Registrar Gasto (opcional)
        if (state.contactCreateTarget === 'venta' && elements.ventaCliente) {
          elements.ventaCliente.value = nuevoContacto.id;
        } else if (state.contactCreateTarget === 'gasto' && elements.gastoProveedor) {
          elements.gastoProveedor.value = nuevoContacto.id;
        } else if (elements.contactoId) {
          elements.contactoId.value = nuevoContacto.id;
        }

        // Reset target al default para no “contaminar” otros flujos
        state.contactCreateTarget = 'tx';
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

    // ========== CREAR MONEDA (rápido desde Transacciones) ==========
    openMonedaModal() {
      elements.monedaForm?.reset();
      // Defaults (alineado con el backend)
      if (elements.monedaDecimales) elements.monedaDecimales.value = 2;
      if (elements.monedaTipoCambio) elements.monedaTipoCambio.value = 1;
      elements.monedaModal?.classList.add('active');
      elements.monedaCodigo?.focus();
    },

    closeMonedaModal() {
      elements.monedaModal?.classList.remove('active');
    },

    async submitMoneda(e) {
      e.preventDefault();

      // Nota: `monedaTipoCambio` existe en UI, pero el backend de /api/monedas no lo maneja.
      // Lo ignoramos para no romper el flujo y mantener compatibilidad.
      const data = {
        codigo: elements.monedaCodigo.value.trim().toUpperCase(),
        nombre: elements.monedaNombre.value.trim(),
        simbolo: elements.monedaSimbolo.value.trim() || '$',
        decimales: parseInt(elements.monedaDecimales.value, 10) || 2,
        es_default: false,
        activo: true
      };

      try {
        const result = await api.createMoneda(data);
        const monedaNueva = result.moneda || data;

        // Actualizar state local y re-renderizar selects
        state.monedas.push(monedaNueva);
        render.monedas();

        // Seleccionar la moneda recién creada en el movimiento y en el gasto (si aplica)
        if (elements.moneda) elements.moneda.value = monedaNueva.codigo;
        if (elements.gastoMoneda) elements.gastoMoneda.value = monedaNueva.codigo;

        this.closeMonedaModal();
        toast.success('Moneda creada');
      } catch (err) {
        toast.error(err.message);
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
    // Crear contacto desde el modal de movimiento
    elements.addContactoBtn?.addEventListener('click', () => handlers.openContactoModal('tx'));
    elements.addMetodoPagoBtn?.addEventListener('click', () => handlers.openMetodoPagoModal());
    elements.addMonedaBtn?.addEventListener('click', () => handlers.openMonedaModal());
    elements.addPlataformaBtn?.addEventListener('click', () => handlers.openPlataformaModal());
    
    // Comisión listeners
    // `plataformaOrigen` es informativo; NO controla visibilidad de la sección.
    elements.plataformaOrigen?.addEventListener('change', () => { handlers.calcComisionYMontos('plataformaOrigen'); });
    elements.tieneComision?.addEventListener('change', () => { handlers.toggleComisionSection(); handlers.calcComisionYMontos('tieneComision'); });
    elements.comisionModo?.addEventListener('change', () => { handlers.calcComisionYMontos('comisionModo'); handlers.renderComisionResumen(); });
    elements.montoBruto?.addEventListener('input', () => handlers.calcComisionYMontos('montoBruto'));
    elements.tipoComision?.addEventListener('change', () => handlers.calcComisionYMontos('tipoComision'));
    elements.comisionValor?.addEventListener('input', () => handlers.calcComisionYMontos('comisionValor'));
    elements.tipoCambio?.addEventListener('input', () => handlers.calcComisionYMontos('tipoCambio'));
    elements.monto?.addEventListener('input', () => handlers.calcComisionYMontos('monto'));
    elements.moneda?.addEventListener('change', () => handlers.renderComisionResumen());
    elements.monedaOrigen?.addEventListener('change', () => handlers.renderComisionResumen());

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

    // Modal crear moneda
    elements.closeMonedaModal?.addEventListener('click', () => handlers.closeMonedaModal());
    elements.cancelMonedaModal?.addEventListener('click', () => handlers.closeMonedaModal());
    elements.monedaForm?.addEventListener('submit', e => handlers.submitMoneda(e));
    elements.monedaModal?.addEventListener('click', e => { if (e.target === elements.monedaModal) handlers.closeMonedaModal(); });

    // Modal crear plataforma
    elements.closePlataformaModal?.addEventListener('click', () => handlers.closePlataformaModal());
    elements.cancelPlataformaModal?.addEventListener('click', () => handlers.closePlataformaModal());
    elements.cancelEditPlataformaBtn?.addEventListener('click', () => handlers.cancelEditPlataforma());
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
    // Crear cliente rápido desde conciliación (Registrar Venta)
    elements.addVentaClienteBtn?.addEventListener('click', () => handlers.openContactoModal('venta'));

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

    // Modal confirmación (reutilizable)
    // Nota: Los listeners principales se instalan dinámicamente en handlers.uiConfirm()
    // aquí solo soportamos cerrar si el usuario abre el modal y presiona Escape global.

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
        handlers.closeMonedaModal();
        handlers.closePlataformaModal();
        handlers.closeGastoModal();
        handlers.closeVentaModal(); 
        handlers.closeCuentaModal(); 
        handlers.closeDeleteModal();
      }
    });

    handlers.loadData();
    console.log('🚀 TRUNO Transacciones v11 - Comisiones y tipo de cambio');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
