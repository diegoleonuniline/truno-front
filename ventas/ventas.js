/**
 * TRUNO - Ventas Module v8
 * Con crear cliente, crear impuesto, crear moneda + monedas dinámicas
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
    sidebar: $('sidebar'),
    sidebarOverlay: $('sidebarOverlay'),
    sidebarClose: $('sidebarClose'),
    menuToggle: $('menuToggle'),
    orgSwitcher: $('orgSwitcher'),
    orgName: $('orgName'),
    orgPlan: $('orgPlan'),
    userAvatar: $('userAvatar'),
    totalMes: $('totalMes'),
    porCobrar: $('porCobrar'),
    vencidas: $('vencidas'),
    cobradas: $('cobradas'),
    tabTodas: $('tabTodas'),
    tabPorCobrar: $('tabPorCobrar'),
    searchInput: $('searchInput'),
    filterStatus: $('filterStatus'),
    filterFechaDesde: $('filterFechaDesde'),
    filterFechaHasta: $('filterFechaHasta'),
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
    addVentaBtn: $('addVentaBtn'),
    addFirstVentaBtn: $('addFirstVentaBtn'),
    fabBtn: $('fabBtn'),
    // Modal crear/editar venta
    ventaModal: $('ventaModal'),
    ventaForm: $('ventaForm'),
    modalTitle: $('modalTitle'),
    closeModal: $('closeModal'),
    cancelModal: $('cancelModal'),
    submitModal: $('submitModal'),
    contactoId: $('contactoId'),
    addClienteBtn: $('addClienteBtn'),
    folio: $('folio'),
    fecha: $('fecha'),
    fechaVencimiento: $('fechaVencimiento'),
    descripcion: $('descripcion'),
    subtotal: $('subtotal'),
    total: $('total'),
    descuento: $('descuento'),
    moneda: $('moneda'),
    addMonedaBtn: $('addMonedaBtn'),
    tipoCambio: $('tipoCambio'),
    uuidCfdi: $('uuidCfdi'),
    folioCfdi: $('folioCfdi'),
    notas: $('notas'),
    // Impuestos dinámicos
    impuestosContainer: $('impuestosContainer'),
    addImpuestoBtn: $('addImpuestoBtn'),
    createImpuestoBtn: $('createImpuestoBtn'),
    // Modal crear cliente
    clienteModal: $('clienteModal'),
    clienteForm: $('clienteForm'),
    closeClienteModal: $('closeClienteModal'),
    cancelClienteModal: $('cancelClienteModal'),
    clienteNombre: $('clienteNombre'),
    clienteEmail: $('clienteEmail'),
    clienteTelefono: $('clienteTelefono'),
    clienteRfc: $('clienteRfc'),
    // Modal crear impuesto
    impuestoModal: $('impuestoModal'),
    impuestoForm: $('impuestoForm'),
    closeImpuestoModal: $('closeImpuestoModal'),
    cancelImpuestoModal: $('cancelImpuestoModal'),
    impuestoNombre: $('impuestoNombre'),
    impuestoClaveSat: $('impuestoClaveSat'),
    impuestoTipo: $('impuestoTipo'),
    impuestoTasa: $('impuestoTasa'),
    // Modal crear moneda
    monedaModal: $('monedaModal'),
    monedaForm: $('monedaForm'),
    closeMonedaModal: $('closeMonedaModal'),
    cancelMonedaModal: $('cancelMonedaModal'),
    monedaCodigo: $('monedaCodigo'),
    monedaNombre: $('monedaNombre'),
    monedaSimbolo: $('monedaSimbolo'),
    monedaDecimales: $('monedaDecimales'),
    // Modal detalle
    detailModal: $('detailModal'),
    closeDetailModal: $('closeDetailModal'),
    closeDetailBtn: $('closeDetailBtn'),
    detailAmount: $('detailAmount'),
    detailGrid: $('detailGrid'),
    detailPagos: $('detailPagos'),
    editFromDetailBtn: $('editFromDetailBtn'),
    cobrarFromDetailBtn: $('cobrarFromDetailBtn'),
    // Modal cobro
    cobroModal: $('cobroModal'),
    cobroForm: $('cobroForm'),
    closeCobroModal: $('closeCobroModal'),
    cancelCobroModal: $('cancelCobroModal'),
    cobroVentaInfo: $('cobroVentaInfo'),
    cobroTotal: $('cobroTotal'),
    cobroPendiente: $('cobroPendiente'),
    cobroMonto: $('cobroMonto'),
    cobroFecha: $('cobroFecha'),
    cobroCuenta: $('cobroCuenta'),
    cobroMetodo: $('cobroMetodo'),
    submitCobro: $('submitCobro'),
    // Modal eliminar
    deleteModal: $('deleteModal'),
    closeDeleteModal: $('closeDeleteModal'),
    cancelDeleteModal: $('cancelDeleteModal'),
    confirmDelete: $('confirmDelete'),
    deleteVentaName: $('deleteVentaName')
  };

  let state = {
    user: null, 
    org: null, 
    ventas: [], 
    contactos: [], 
    cuentas: [],
    monedas: [],
    impuestosCatalogo: [],
    impuestosTemp: [],
    paginacion: { pagina: 1, limite: 20, total: 0 },
    editingId: null, 
    deletingId: null, 
    collectingVenta: null, 
    viewingVenta: null,
    filters: { buscar: '', estatus: '', fecha_desde: '', fecha_hasta: '', solo_por_cobrar: false },
    ultimoFolio: 0
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
    redirect: (url) => window.location.href = url,
    getInitials(n, a) { return (n?.charAt(0).toUpperCase() || '') + (a?.charAt(0).toUpperCase() || '') || '??'; },
    formatMoney(amount, currency = 'MXN') { return new Intl.NumberFormat('es-MX', { style: 'currency', currency }).format(amount || 0); },
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
    formatDateInput(d) { return d ? d.split('T')[0] : ''; },
    today() { return new Date().toISOString().split('T')[0]; },
    isOverdue(d) { return d && new Date(d) < new Date(); },
    debounce(fn, delay) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; },
    generarFolio(ultimo) {
      const num = (ultimo || 0) + 1;
      return `V-${String(num).padStart(4, '0')}`;
    },
    extraerNumeroFolio(folio) {
      if (!folio) return 0;
      const match = folio.match(/V-(\d+)/i);
      return match ? parseInt(match[1]) : 0;
    }
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
    getVentas(p = {}) {
      const q = new URLSearchParams({ pagina: p.pagina || 1, limite: p.limite || 20 });
      if (p.buscar) q.append('buscar', p.buscar);
      if (p.estatus) q.append('estatus', p.estatus);
      if (p.fecha_desde) q.append('fecha_desde', p.fecha_desde);
      if (p.fecha_hasta) q.append('fecha_hasta', p.fecha_hasta);
      if (p.solo_por_cobrar) q.append('por_cobrar', '1');
      return this.request(`/api/ventas?${q}`);
    },
    createVenta(d) { return this.request('/api/ventas', { method: 'POST', body: JSON.stringify(d) }); },
    updateVenta(id, d) { return this.request(`/api/ventas/${id}`, { method: 'PUT', body: JSON.stringify(d) }); },
    deleteVenta(id) { return this.request(`/api/ventas/${id}`, { method: 'DELETE' }); },
    getContactos() { return this.request('/api/contactos?limite=200'); },
    createContacto(d) { return this.request('/api/contactos', { method: 'POST', body: JSON.stringify(d) }); },
    getCuentas() { return this.request('/api/cuentas-bancarias'); },
    getImpuestos() { return this.request('/api/impuestos'); },
    createImpuesto(d) { return this.request('/api/impuestos', { method: 'POST', body: JSON.stringify(d) }); },
    getVentaImpuestos(ventaId) { return this.request(`/api/ventas/${ventaId}/impuestos`); },
    getTransacciones() { return this.request('/api/transacciones?limite=200'); },
    getMonedas() { return this.request('/api/monedas'); },
    createMoneda(d) { return this.request('/api/monedas', { method: 'POST', body: JSON.stringify(d) }); }
  };

  const render = {
    user() { if (state.user) elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido); },
    org() { if (state.org) { elements.orgName.textContent = state.org.nombre; elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`; } },
    stats() {
      const now = new Date(), m = now.getMonth(), y = now.getFullYear();
      let totalMes = 0, porCobrar = 0, vencidas = 0, cobradas = 0;
      state.ventas.forEach(v => {
        const f = new Date(v.fecha), tot = parseFloat(v.total) || 0, pag = parseFloat(v.monto_cobrado) || 0, pend = tot - pag;
        if (f.getMonth() === m && f.getFullYear() === y) totalMes += tot;
        if (v.estatus_pago === 'pagado') cobradas += tot;
        else if (v.estatus_pago === 'vencido' || (v.fecha_vencimiento && utils.isOverdue(v.fecha_vencimiento) && pend > 0)) vencidas += pend;
        else if (pend > 0) porCobrar += pend;
      });
      elements.totalMes.textContent = utils.formatMoney(totalMes);
      elements.porCobrar.textContent = utils.formatMoney(porCobrar);
      elements.vencidas.textContent = utils.formatMoney(vencidas);
      elements.cobradas.textContent = utils.formatMoney(cobradas);
    },
    tabs() {
      elements.tabTodas?.classList.toggle('active', !state.filters.solo_por_cobrar);
      elements.tabPorCobrar?.classList.toggle('active', state.filters.solo_por_cobrar);
    },
    
    // ========== MONEDAS DINÁMICAS ==========
    monedas() {
      const select = elements.moneda;
      if (!select) return;
      
      if (state.monedas.length > 0) {
        const activas = state.monedas.filter(m => m.activo);
        select.innerHTML = activas.map(m => 
          `<option value="${m.codigo}" ${m.es_default ? 'selected' : ''}>${m.codigo} - ${m.nombre}</option>`
        ).join('');
      } else {
        select.innerHTML = `
          <option value="MXN" selected>MXN - Peso Mexicano</option>
          <option value="USD">USD - Dólar</option>
          <option value="EUR">EUR - Euro</option>
        `;
      }
    },
    
    // ========== IMPUESTOS DINÁMICOS ==========
    impuestos() {
      const container = elements.impuestosContainer;
      if (!container) return;
      
      if (!state.impuestosTemp.length) {
        container.innerHTML = '<div class="impuestos-empty">Sin impuestos agregados</div>';
        return;
      }
      
      const selectOpts = state.impuestosCatalogo.map(i => 
        `<option value="${i.id}" data-tasa="${i.tasa}" data-tipo="${i.tipo}">${i.nombre} (${(i.tasa * 100).toFixed(0)}%)</option>`
      ).join('');
      
      container.innerHTML = state.impuestosTemp.map((imp, idx) => `
        <div class="impuesto-row" data-idx="${idx}">
          <select class="imp-select">
            <option value="">-- Seleccionar --</option>
            ${selectOpts}
          </select>
          <span class="impuesto-tipo ${imp.tipo || 'traslado'}">${imp.tipo === 'retencion' ? 'Ret.' : 'Tras.'}</span>
          <input type="number" class="imp-importe" value="${imp.importe || ''}" placeholder="0.00" step="0.01">
          <button type="button" class="btn-remove-imp" title="Eliminar">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      `).join('');
      
      container.querySelectorAll('.impuesto-row').forEach((row, idx) => {
        const select = row.querySelector('.imp-select');
        const impInput = row.querySelector('.imp-importe');
        const tipoSpan = row.querySelector('.impuesto-tipo');
        const removeBtn = row.querySelector('.btn-remove-imp');
        
        if (state.impuestosTemp[idx].impuesto_id) {
          select.value = state.impuestosTemp[idx].impuesto_id;
        }
        
        select.addEventListener('change', () => {
          const opt = select.selectedOptions[0];
          const tasa = parseFloat(opt?.dataset?.tasa) || 0;
          const tipo = opt?.dataset?.tipo || 'traslado';
          
          state.impuestosTemp[idx].impuesto_id = select.value;
          state.impuestosTemp[idx].tasa = tasa;
          state.impuestosTemp[idx].tipo = tipo;
          
          tipoSpan.textContent = tipo === 'retencion' ? 'Ret.' : 'Tras.';
          tipoSpan.className = `impuesto-tipo ${tipo}`;
          
          const subtotal = parseFloat(elements.subtotal.value) || 0;
          if (subtotal > 0 && tasa > 0) {
            const importe = subtotal * tasa;
            impInput.value = importe.toFixed(2);
            state.impuestosTemp[idx].importe = importe;
          }
          
          handlers.calcTotal();
        });
        
        impInput.addEventListener('input', () => {
          state.impuestosTemp[idx].importe = parseFloat(impInput.value) || 0;
          handlers.calcTotal();
        });
        
        removeBtn.addEventListener('click', () => {
          state.impuestosTemp.splice(idx, 1);
          render.impuestos();
          handlers.calcTotal();
        });
      });
    },
    
    ventas() {
      const { ventas, paginacion } = state;
      if (!ventas.length) { 
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

      let maxFolio = 0;
      ventas.forEach(v => {
        const num = utils.extraerNumeroFolio(v.folio);
        if (num > maxFolio) maxFolio = num;
      });
      state.ultimoFolio = maxFolio;

      elements.tableBody.innerHTML = ventas.map(v => {
        const total = parseFloat(v.total) || 0;
        const cobrado = parseFloat(v.monto_cobrado) || 0;
        const saldo = total - cobrado;
        const sc = v.estatus_pago || 'pendiente';
        const statusLabels = { 
          pendiente: 'Por cobrar', 
          parcial: 'Parcial', 
          pagado: 'Cobrada', 
          vencido: 'Vencida', 
          cancelado: 'Cancelada' 
        };
        const sl = statusLabels[sc] || sc;
        
        return `<tr data-id="${v.id}" class="clickable-row">
          <td>
            <div class="cell-main">${v.nombre_contacto || v.descripcion || 'Sin cliente'}</div>
            <div class="cell-sub">${v.folio ? `#${v.folio}` : ''}</div>
          </td>
          <td>${utils.formatDate(v.fecha)}</td>
          <td>${v.folio || '-'}</td>
          <td><span class="status-badge ${sc}">${sl}</span></td>
          <td style="text-align:right;">
            <div class="cell-amount income">${utils.formatMoney(total, v.moneda)}</div>
          </td>
          <td style="text-align:right;">
            ${saldo > 0 
              ? `<div class="cell-amount expense">${utils.formatMoney(saldo, v.moneda)}</div>` 
              : `<div class="cell-amount success">$0.00</div>`
            }
          </td>
          <td>
            <div class="table-actions">
              <button class="action-btn" title="Ver detalle" data-action="view" data-id="${v.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              ${saldo > 0 ? `<button class="action-btn success" title="Cobrar" data-action="collect" data-id="${v.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </button>` : ''}
              <button class="action-btn" title="Editar" data-action="edit" data-id="${v.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${v.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </td>
        </tr>`;
      }).join('');

      elements.mobileCards.innerHTML = ventas.map(v => {
        const total = parseFloat(v.total) || 0;
        const cobrado = parseFloat(v.monto_cobrado) || 0;
        const saldo = total - cobrado;
        const sc = v.estatus_pago || 'pendiente';
        const statusLabels = { 
          pendiente: 'Por cobrar', 
          parcial: 'Parcial', 
          pagado: 'Cobrada', 
          vencido: 'Vencida', 
          cancelado: 'Cancelada' 
        };
        const sl = statusLabels[sc] || sc;
        
        return `<div class="mobile-card" data-id="${v.id}">
          <div class="mobile-card-header">
            <div class="mobile-card-title">${v.nombre_contacto || v.descripcion || 'Sin cliente'}</div>
            <div class="mobile-card-amount income">${utils.formatMoney(total, v.moneda)}</div>
          </div>
          <div class="mobile-card-meta">
            <span>${utils.formatDate(v.fecha)}</span>
            <span>${v.folio || ''}</span>
          </div>
          <div class="mobile-card-saldo">
            ${saldo > 0 
              ? `<span class="saldo-label">Saldo:</span> <span class="saldo-amount">${utils.formatMoney(saldo)}</span>` 
              : `<span class="saldo-paid">✓ Cobrada</span>`
            }
          </div>
          <div class="mobile-card-footer">
            <span class="status-badge ${sc}">${sl}</span>
            <div class="table-actions">
              <button class="action-btn" data-action="view" data-id="${v.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
              </button>
              ${saldo > 0 ? `<button class="action-btn success" data-action="collect" data-id="${v.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="12" y1="1" x2="12" y2="23"/>
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                </svg>
              </button>` : ''}
              <button class="action-btn" data-action="edit" data-id="${v.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                  <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                </svg>
              </button>
              <button class="action-btn danger" data-action="delete" data-id="${v.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        </div>`;
      }).join('');

      document.querySelectorAll('[data-action]').forEach(b => {
        b.addEventListener('click', e => { 
          e.stopPropagation(); 
          handlers.handleAction(b.dataset.action, b.dataset.id); 
        });
      });

      elements.tableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', e => {
          if (e.target.closest('.action-btn')) return;
          handlers.openDetailModal(state.ventas.find(v => v.id === row.dataset.id));
        });
      });

      elements.mobileCards.querySelectorAll('.mobile-card').forEach(card => {
        card.addEventListener('click', e => {
          if (e.target.closest('.action-btn')) return;
          handlers.openDetailModal(state.ventas.find(v => v.id === card.dataset.id));
        });
      });
    },
    contactos() { 
      const clientes = state.contactos.filter(c => c.tipo === 'cliente' || c.tipo === 'ambos');
      elements.contactoId.innerHTML = '<option value="">-- Sin cliente --</option>' + 
        clientes.map(c => `<option value="${c.id}">${c.nombre}</option>`).join(''); 
    },
    cuentas() { 
      elements.cobroCuenta.innerHTML = '<option value="">-- Seleccionar cuenta --</option>' + 
        state.cuentas.map(c => `<option value="${c.id}">${c.nombre} (${utils.formatMoney(c.saldo_actual)})</option>`).join(''); 
    }
  };

  const handlers = {
    async loadData() {
      try {
        const [ventasData, contactosData, cuentasData, impuestosData, monedasData] = await Promise.all([
          api.getVentas({ ...state.filters, pagina: state.paginacion.pagina }),
          api.getContactos().catch(() => ({ contactos: [] })),
          api.getCuentas().catch(() => ({ cuentas: [] })),
          api.getImpuestos().catch(() => ({ impuestos: [] })),
          api.getMonedas().catch(() => ({ monedas: [] }))
        ]);
        state.ventas = ventasData.ventas || [];
        state.paginacion = ventasData.paginacion || state.paginacion;
        state.contactos = contactosData.contactos || [];
        state.cuentas = cuentasData.cuentas || [];
        state.impuestosCatalogo = impuestosData.impuestos || [];
        state.monedas = monedasData.monedas || [];
        render.ventas(); 
        render.stats(); 
        render.contactos(); 
        render.cuentas();
        render.monedas();
        render.tabs();
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
    handleAction(action, id) {
      const v = state.ventas.find(x => x.id === id);
      if (action === 'view') this.openDetailModal(v);
      else if (action === 'edit') this.openEditModal(v);
      else if (action === 'delete') this.openDeleteModal(v);
      else if (action === 'collect') this.openCobroModal(v);
    },
    setTab(tab) {
      state.filters.solo_por_cobrar = tab === 'por_cobrar';
      state.paginacion.pagina = 1;
      this.loadData();
    },
    
    // ========== IMPUESTOS HANDLERS ==========
    addImpuesto() {
      state.impuestosTemp.push({ 
        impuesto_id: '', 
        tasa: 0, 
        tipo: 'traslado', 
        importe: 0 
      });
      render.impuestos();
    },
    
    recalcImpuestos() {
      const subtotal = parseFloat(elements.subtotal.value) || 0;
      state.impuestosTemp.forEach(imp => {
        if (imp.tasa > 0 && subtotal > 0) {
          imp.importe = subtotal * imp.tasa;
        }
      });
      render.impuestos();
      this.calcTotal();
    },
    
    calcTotal() { 
      const subtotal = parseFloat(elements.subtotal.value) || 0;
      const descuento = parseFloat(elements.descuento?.value) || 0;
      
      let traslados = 0;
      let retenciones = 0;
      
      state.impuestosTemp.forEach(imp => {
        const importe = parseFloat(imp.importe) || 0;
        if (imp.tipo === 'retencion') {
          retenciones += importe;
        } else {
          traslados += importe;
        }
      });
      
      const total = subtotal + traslados - retenciones - descuento;
      
      if (subtotal > 0 || state.impuestosTemp.length > 0) {
        elements.total.value = total.toFixed(2);
      }
    },
    
    // ========== CREAR CLIENTE ==========
    openClienteModal() {
      elements.clienteForm.reset();
      elements.clienteModal.classList.add('active');
      elements.clienteNombre.focus();
    },
    closeClienteModal() {
      elements.clienteModal.classList.remove('active');
    },
    async submitCliente(e) {
      e.preventDefault();
      const data = {
        nombre: elements.clienteNombre.value.trim(),
        tipo: 'cliente',
        email: elements.clienteEmail.value.trim() || null,
        telefono: elements.clienteTelefono.value.trim() || null,
        rfc: elements.clienteRfc.value.trim().toUpperCase() || null
      };
      
      try {
        const result = await api.createContacto(data);
        const nuevoCliente = result.contacto || result;
        
        state.contactos.push(nuevoCliente);
        render.contactos();
        
        elements.contactoId.value = nuevoCliente.id;
        
        this.closeClienteModal();
        toast.success('Cliente creado');
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    // ========== CREAR IMPUESTO ==========
    openImpuestoModal() {
      elements.impuestoForm.reset();
      elements.impuestoTipo.value = 'traslado';
      elements.impuestoModal.classList.add('active');
      elements.impuestoNombre.focus();
    },
    closeImpuestoModal() {
      elements.impuestoModal.classList.remove('active');
    },
    async submitImpuesto(e) {
      e.preventDefault();
      const tasaInput = parseFloat(elements.impuestoTasa.value);
      const tasa = tasaInput > 1 ? tasaInput / 100 : tasaInput;
      
      const data = {
        nombre: elements.impuestoNombre.value.trim(),
        clave_sat: elements.impuestoClaveSat.value.trim() || null,
        tipo: elements.impuestoTipo.value,
        tasa: tasa
      };
      
      try {
        const result = await api.createImpuesto(data);
        const nuevoImpuesto = result.impuesto || result;
        
        state.impuestosCatalogo.push(nuevoImpuesto);
        
        state.impuestosTemp.push({
          impuesto_id: nuevoImpuesto.id,
          tasa: nuevoImpuesto.tasa,
          tipo: nuevoImpuesto.tipo,
          importe: 0
        });
        
        render.impuestos();
        this.recalcImpuestos();
        
        this.closeImpuestoModal();
        toast.success('Impuesto creado y agregado');
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    // ========== CREAR MONEDA ==========
    openMonedaModal() {
      elements.monedaForm.reset();
      elements.monedaDecimales.value = 2;
      elements.monedaModal.classList.add('active');
      elements.monedaCodigo.focus();
    },
    closeMonedaModal() {
      elements.monedaModal.classList.remove('active');
    },
    async submitMoneda(e) {
      e.preventDefault();
      const data = {
        codigo: elements.monedaCodigo.value.trim().toUpperCase(),
        nombre: elements.monedaNombre.value.trim(),
        simbolo: elements.monedaSimbolo.value.trim() || '$',
        decimales: parseInt(elements.monedaDecimales.value) || 2
      };
      
      try {
        const result = await api.createMoneda(data);
        const nuevaMoneda = result.moneda || result;
        
        state.monedas.push(nuevaMoneda);
        render.monedas();
        
        elements.moneda.value = nuevaMoneda.codigo;
        
        this.closeMonedaModal();
        toast.success('Moneda creada');
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    openCreateModal() {
      state.editingId = null; 
      elements.modalTitle.textContent = 'Nueva Venta'; 
      elements.ventaForm.reset();
      elements.fecha.value = utils.today();
      elements.folio.value = utils.generarFolio(state.ultimoFolio);
      state.impuestosTemp = [];
      render.impuestos();
      render.monedas();
      elements.ventaModal.classList.add('active'); 
      elements.contactoId.focus();
    },
    
    async openEditModal(v) {
      state.editingId = v.id; 
      elements.modalTitle.textContent = 'Editar Venta';
      elements.contactoId.value = v.contacto_id || ''; 
      elements.folio.value = v.folio || '';
      elements.fecha.value = utils.formatDateInput(v.fecha); 
      elements.fechaVencimiento.value = utils.formatDateInput(v.fecha_vencimiento);
      elements.descripcion.value = v.descripcion || ''; 
      elements.subtotal.value = v.subtotal || '';
      elements.total.value = v.total || '';
      if (elements.descuento) elements.descuento.value = v.descuento || '';
      elements.moneda.value = v.moneda || 'MXN'; 
      elements.tipoCambio.value = v.tipo_cambio || 1;
      elements.uuidCfdi.value = v.uuid_cfdi || ''; 
      elements.folioCfdi.value = v.folio_cfdi || '';
      elements.notas.value = v.notas || ''; 
      
      state.impuestosTemp = [];
      try {
        const impRes = await api.getVentaImpuestos(v.id);
        if (impRes.impuestos && impRes.impuestos.length > 0) {
          state.impuestosTemp = impRes.impuestos.map(imp => ({
            impuesto_id: imp.impuesto_id,
            tasa: imp.tasa || 0,
            tipo: imp.tipo || 'traslado',
            importe: parseFloat(imp.importe) || 0
          }));
        }
      } catch (e) {
        if (v.impuesto && parseFloat(v.impuesto) > 0) {
          const iva16 = state.impuestosCatalogo.find(i => i.nombre.includes('IVA') && i.tasa === 0.16);
          if (iva16) {
            state.impuestosTemp.push({ 
              impuesto_id: iva16.id, 
              tasa: iva16.tasa, 
              tipo: iva16.tipo || 'traslado', 
              importe: parseFloat(v.impuesto) 
            });
          }
        }
      }
      
      render.impuestos();
      elements.ventaModal.classList.add('active');
    },
    
    closeVentaModal() { 
      elements.ventaModal.classList.remove('active'); 
      elements.ventaForm.reset(); 
      state.editingId = null;
      state.impuestosTemp = [];
    },
    
    async submitVenta(e) {
      e.preventDefault();
      
      let totalImpuesto = 0;
      state.impuestosTemp.forEach(imp => {
        if (imp.tipo === 'traslado') {
          totalImpuesto += (parseFloat(imp.importe) || 0);
        } else {
          totalImpuesto -= (parseFloat(imp.importe) || 0);
        }
      });
      
      const d = {
        contacto_id: elements.contactoId.value || null, 
        folio: elements.folio.value.trim() || null,
        fecha: elements.fecha.value, 
        fecha_vencimiento: elements.fechaVencimiento.value || null,
        descripcion: elements.descripcion.value.trim() || null,
        subtotal: parseFloat(elements.subtotal.value) || parseFloat(elements.total.value),
        impuesto: Math.abs(totalImpuesto),
        descuento: parseFloat(elements.descuento?.value) || 0,
        total: parseFloat(elements.total.value),
        moneda: elements.moneda.value, 
        tipo_cambio: parseFloat(elements.tipoCambio.value) || 1,
        uuid_cfdi: elements.uuidCfdi.value.trim() || null, 
        folio_cfdi: elements.folioCfdi.value.trim() || null,
        notas: elements.notas.value.trim() || null,
        impuestos: state.impuestosTemp.filter(i => i.impuesto_id).map(i => ({
          impuesto_id: i.impuesto_id,
          base: parseFloat(elements.subtotal.value) || parseFloat(elements.total.value),
          importe: parseFloat(i.importe) || 0
        }))
      };
      
      elements.submitModal.classList.add('loading'); 
      elements.submitModal.disabled = true;
      try {
        if (state.editingId) {
          await api.updateVenta(state.editingId, d);
          toast.success('Venta actualizada');
        } else {
          await api.createVenta(d);
          toast.success('Venta registrada');
        }
        this.closeVentaModal(); 
        await this.loadData();
      } catch (e) { 
        toast.error(e.message); 
      }
      finally { 
        elements.submitModal.classList.remove('loading'); 
        elements.submitModal.disabled = false; 
      }
    },
    
    async openDetailModal(v) {
      if (!v) return;
      state.viewingVenta = v;
      
      const total = parseFloat(v.total) || 0;
      const cobrado = parseFloat(v.monto_cobrado) || 0;
      const saldo = total - cobrado;
      const sc = v.estatus_pago || 'pendiente';
      const statusLabels = { 
        pendiente: 'Por cobrar', 
        parcial: 'Parcial', 
        pagado: 'Cobrada', 
        vencido: 'Vencida', 
        cancelado: 'Cancelada' 
      };

      elements.detailAmount.innerHTML = `
        <div class="detail-amount-value income">${utils.formatMoney(total)}</div>
        <div class="detail-amount-label">
          <span class="status-badge ${sc}">${statusLabels[sc] || sc}</span>
        </div>
      `;

      elements.detailGrid.innerHTML = `
        <div class="detail-item"><label>Folio</label><span>${v.folio || '-'}</span></div>
        <div class="detail-item"><label>Cliente</label><span>${v.nombre_contacto || '-'}</span></div>
        <div class="detail-item"><label>Fecha</label><span>${utils.formatDate(v.fecha)}</span></div>
        <div class="detail-item"><label>Vencimiento</label><span>${utils.formatDate(v.fecha_vencimiento) || '-'}</span></div>
        <div class="detail-item"><label>Descripción</label><span>${v.descripcion || '-'}</span></div>
        <div class="detail-item"><label>Subtotal</label><span>${utils.formatMoney(v.subtotal)}</span></div>
        <div class="detail-item"><label>Impuestos</label><span>${utils.formatMoney(v.impuesto)}</span></div>
        <div class="detail-item"><label>Total</label><span class="income">${utils.formatMoney(total)}</span></div>
        <div class="detail-item"><label>Cobrado</label><span class="success">${utils.formatMoney(cobrado)}</span></div>
        <div class="detail-item"><label>Saldo</label><span class="${saldo > 0 ? 'expense' : 'success'}">${utils.formatMoney(saldo)}</span></div>
      `;

      elements.detailPagos.innerHTML = '<div class="loading-pagos">Cargando pagos...</div>';

      if (elements.cobrarFromDetailBtn) {
        elements.cobrarFromDetailBtn.style.display = saldo > 0 ? 'inline-flex' : 'none';
      }

      elements.detailModal.classList.add('active');

      try {
        const txRes = await api.getTransacciones();
        let transacciones = txRes.transacciones || [];
        
        transacciones = transacciones.filter(tx => tx.venta_id === v.id);
        
        if (transacciones.length) {
          elements.detailPagos.innerHTML = `
            <div class="pagos-header">
              <h4>Pagos registrados (${transacciones.length})</h4>
            </div>
            <div class="pagos-list">
              ${transacciones.map(tx => `
                <div class="pago-item">
                  <div class="pago-info">
                    <div class="pago-fecha">${utils.formatDate(tx.fecha)}</div>
                    <div class="pago-desc">${tx.descripcion || 'Cobro'}</div>
                    <div class="pago-cuenta">${tx.nombre_cuenta || '-'}</div>
                  </div>
                  <div class="pago-monto success">+${utils.formatMoney(tx.monto)}</div>
                </div>
              `).join('')}
            </div>
          `;
        } else {
          elements.detailPagos.innerHTML = `
            <div class="pagos-empty">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" style="width:32px;height:32px;opacity:0.5;">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              <p>Sin pagos registrados</p>
            </div>
          `;
        }
      } catch (e) {
        console.error(e);
        elements.detailPagos.innerHTML = '<div class="pagos-error">Error al cargar pagos</div>';
      }
    },
    closeDetailModal() { 
      elements.detailModal.classList.remove('active'); 
      state.viewingVenta = null;
    },
    editFromDetail() {
      const v = state.viewingVenta;
      if (v) {
        this.closeDetailModal();
        this.openEditModal(v);
      }
    },
    cobrarFromDetail() {
      const v = state.viewingVenta;
      if (v) {
        this.closeDetailModal();
        this.openCobroModal(v);
      }
    },
    openCobroModal(v) {
      state.collectingVenta = v;
      const pend = parseFloat(v.total) - parseFloat(v.monto_cobrado || 0);
      elements.cobroVentaInfo.value = v.nombre_contacto || v.folio || `Venta ${v.id.slice(0, 8)}`;
      elements.cobroTotal.value = utils.formatMoney(v.total); 
      elements.cobroPendiente.value = utils.formatMoney(pend);
      elements.cobroMonto.value = pend.toFixed(2); 
      elements.cobroMonto.max = pend;
      elements.cobroFecha.value = utils.today(); 
      elements.cobroCuenta.value = ''; 
      elements.cobroMetodo.value = 'transferencia';
      elements.cobroModal.classList.add('active'); 
      elements.cobroMonto.focus();
    },
    closeCobroModal() { 
      elements.cobroModal.classList.remove('active'); 
      elements.cobroForm.reset(); 
      state.collectingVenta = null; 
    },
    async submitCobro(e) {
      e.preventDefault();
      
      const venta = state.collectingVenta;
      const monto = parseFloat(elements.cobroMonto.value);
      const cuentaId = elements.cobroCuenta.value;
      
      if (!cuentaId) {
        toast.error('Selecciona una cuenta bancaria');
        return;
      }
      
      elements.submitCobro.classList.add('loading'); 
      elements.submitCobro.disabled = true;
      
      try {
        const txData = {
          tipo: 'ingreso',
          cuenta_bancaria_id: cuentaId,
          monto: monto,
          fecha: elements.cobroFecha.value,
          contacto_id: venta.contacto_id || null,
          descripcion: `Cobro: ${venta.nombre_contacto || venta.folio || 'Venta'}`,
          referencia: venta.folio || null,
          venta_id: venta.id
        };
        
        await api.request('/api/transacciones', { 
          method: 'POST', 
          body: JSON.stringify(txData) 
        });
        
        this.closeCobroModal(); 
        await this.loadData(); 
        toast.success('Cobro registrado');
      }
      catch (e) { 
        toast.error(e.message); 
      }
      finally { 
        elements.submitCobro.classList.remove('loading'); 
        elements.submitCobro.disabled = false; 
      }
    },
    openDeleteModal(v) { 
      state.deletingId = v.id; 
      elements.deleteVentaName.textContent = v.nombre_contacto || v.folio || `Venta del ${utils.formatDate(v.fecha)}`; 
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
        await api.deleteVenta(state.deletingId); 
        this.closeDeleteModal(); 
        await this.loadData(); 
        toast.success('Venta eliminada');
      }
      catch (e) { 
        toast.error(e.message); 
      }
      finally { 
        elements.confirmDelete.classList.remove('loading'); 
        elements.confirmDelete.disabled = false; 
      }
    },
    applyFilters() { 
      state.filters.buscar = elements.searchInput.value.trim(); 
      state.filters.estatus = elements.filterStatus.value;
      state.filters.fecha_desde = elements.filterFechaDesde?.value || '';
      state.filters.fecha_hasta = elements.filterFechaHasta?.value || '';
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

    // Tabs
    elements.tabTodas?.addEventListener('click', () => handlers.setTab('todas'));
    elements.tabPorCobrar?.addEventListener('click', () => handlers.setTab('por_cobrar'));

    // Botones crear
    elements.addVentaBtn?.addEventListener('click', () => handlers.openCreateModal());
    elements.addFirstVentaBtn?.addEventListener('click', () => handlers.openCreateModal());
    elements.fabBtn?.addEventListener('click', () => handlers.openCreateModal());

    // Modal venta
    elements.closeModal?.addEventListener('click', () => handlers.closeVentaModal());
    elements.cancelModal?.addEventListener('click', () => handlers.closeVentaModal());
    elements.ventaForm?.addEventListener('submit', e => handlers.submitVenta(e));
    elements.ventaModal?.addEventListener('click', e => { if (e.target === elements.ventaModal) handlers.closeVentaModal(); });
    
    // Cálculo de totales con impuestos
    elements.subtotal?.addEventListener('input', () => handlers.recalcImpuestos());
    elements.descuento?.addEventListener('input', () => handlers.calcTotal());
    
    // Agregar impuesto / Crear impuesto
    elements.addImpuestoBtn?.addEventListener('click', () => handlers.addImpuesto());
    elements.createImpuestoBtn?.addEventListener('click', () => handlers.openImpuestoModal());
    
    // Crear cliente
    elements.addClienteBtn?.addEventListener('click', () => handlers.openClienteModal());
    
    // Crear moneda
    elements.addMonedaBtn?.addEventListener('click', () => handlers.openMonedaModal());
    
    // Modal crear cliente
    elements.closeClienteModal?.addEventListener('click', () => handlers.closeClienteModal());
    elements.cancelClienteModal?.addEventListener('click', () => handlers.closeClienteModal());
    elements.clienteForm?.addEventListener('submit', e => handlers.submitCliente(e));
    elements.clienteModal?.addEventListener('click', e => { if (e.target === elements.clienteModal) handlers.closeClienteModal(); });
    
    // Modal crear impuesto
    elements.closeImpuestoModal?.addEventListener('click', () => handlers.closeImpuestoModal());
    elements.cancelImpuestoModal?.addEventListener('click', () => handlers.closeImpuestoModal());
    elements.impuestoForm?.addEventListener('submit', e => handlers.submitImpuesto(e));
    elements.impuestoModal?.addEventListener('click', e => { if (e.target === elements.impuestoModal) handlers.closeImpuestoModal(); });
    
    // Modal crear moneda
    elements.closeMonedaModal?.addEventListener('click', () => handlers.closeMonedaModal());
    elements.cancelMonedaModal?.addEventListener('click', () => handlers.closeMonedaModal());
    elements.monedaForm?.addEventListener('submit', e => handlers.submitMoneda(e));
    elements.monedaModal?.addEventListener('click', e => { if (e.target === elements.monedaModal) handlers.closeMonedaModal(); });

    // Modal detalle
    elements.closeDetailModal?.addEventListener('click', () => handlers.closeDetailModal());
    elements.closeDetailBtn?.addEventListener('click', () => handlers.closeDetailModal());
    elements.editFromDetailBtn?.addEventListener('click', () => handlers.editFromDetail());
    elements.cobrarFromDetailBtn?.addEventListener('click', () => handlers.cobrarFromDetail());
    elements.detailModal?.addEventListener('click', e => { if (e.target === elements.detailModal) handlers.closeDetailModal(); });

    // Modal cobro
    elements.closeCobroModal?.addEventListener('click', () => handlers.closeCobroModal());
    elements.cancelCobroModal?.addEventListener('click', () => handlers.closeCobroModal());
    elements.cobroForm?.addEventListener('submit', e => handlers.submitCobro(e));
    elements.cobroModal?.addEventListener('click', e => { if (e.target === elements.cobroModal) handlers.closeCobroModal(); });

    // Modal eliminar
    elements.closeDeleteModal?.addEventListener('click', () => handlers.closeDeleteModal());
    elements.cancelDeleteModal?.addEventListener('click', () => handlers.closeDeleteModal());
    elements.confirmDelete?.addEventListener('click', () => handlers.confirmDelete());
    elements.deleteModal?.addEventListener('click', e => { if (e.target === elements.deleteModal) handlers.closeDeleteModal(); });

    // Filtros
    const df = utils.debounce(() => handlers.applyFilters(), 300);
    elements.searchInput?.addEventListener('input', df);
    elements.filterStatus?.addEventListener('change', () => handlers.applyFilters());
    elements.filterFechaDesde?.addEventListener('change', () => handlers.applyFilters());
    elements.filterFechaHasta?.addEventListener('change', () => handlers.applyFilters());
    elements.prevPage?.addEventListener('click', () => handlers.prevPage());
    elements.nextPage?.addEventListener('click', () => handlers.nextPage());

    // Escape para cerrar modales
    document.addEventListener('keydown', e => { 
      if (e.key === 'Escape') { 
        handlers.closeVentaModal();
        handlers.closeClienteModal();
        handlers.closeImpuestoModal();
        handlers.closeMonedaModal();
        handlers.closeDetailModal();
        handlers.closeCobroModal(); 
        handlers.closeDeleteModal(); 
      } 
    });

    handlers.loadData();
    console.log('🚀 TRUNO Ventas v8 - Crear cliente/impuesto/moneda + Monedas dinámicas');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
