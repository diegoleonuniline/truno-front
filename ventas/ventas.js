/**
 * TRUNO - Ventas Module v3
 * Con toast notifications y columna de saldo
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
    totalMes: document.getElementById('totalMes'),
    porCobrar: document.getElementById('porCobrar'),
    vencidas: document.getElementById('vencidas'),
    cobradas: document.getElementById('cobradas'),
    searchInput: document.getElementById('searchInput'),
    filterStatus: document.getElementById('filterStatus'),
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
    addVentaBtn: document.getElementById('addVentaBtn'),
    addFirstVentaBtn: document.getElementById('addFirstVentaBtn'),
    fabBtn: document.getElementById('fabBtn'),
    ventaModal: document.getElementById('ventaModal'),
    ventaForm: document.getElementById('ventaForm'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    cancelModal: document.getElementById('cancelModal'),
    submitModal: document.getElementById('submitModal'),
    contactoId: document.getElementById('contactoId'),
    folio: document.getElementById('folio'),
    fecha: document.getElementById('fecha'),
    fechaVencimiento: document.getElementById('fechaVencimiento'),
    descripcion: document.getElementById('descripcion'),
    subtotal: document.getElementById('subtotal'),
    impuesto: document.getElementById('impuesto'),
    total: document.getElementById('total'),
    moneda: document.getElementById('moneda'),
    tipoCambio: document.getElementById('tipoCambio'),
    uuidCfdi: document.getElementById('uuidCfdi'),
    folioCfdi: document.getElementById('folioCfdi'),
    notas: document.getElementById('notas'),
    cobroModal: document.getElementById('cobroModal'),
    cobroForm: document.getElementById('cobroForm'),
    closeCobroModal: document.getElementById('closeCobroModal'),
    cancelCobroModal: document.getElementById('cancelCobroModal'),
    cobroVentaInfo: document.getElementById('cobroVentaInfo'),
    cobroTotal: document.getElementById('cobroTotal'),
    cobroPendiente: document.getElementById('cobroPendiente'),
    cobroMonto: document.getElementById('cobroMonto'),
    cobroFecha: document.getElementById('cobroFecha'),
    cobroCuenta: document.getElementById('cobroCuenta'),
    cobroMetodo: document.getElementById('cobroMetodo'),
    submitCobro: document.getElementById('submitCobro'),
    deleteModal: document.getElementById('deleteModal'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDeleteModal: document.getElementById('cancelDeleteModal'),
    confirmDelete: document.getElementById('confirmDelete'),
    deleteVentaName: document.getElementById('deleteVentaName')
  };

  let state = {
    user: null, org: null, ventas: [], contactos: [], cuentas: [],
    paginacion: { pagina: 1, limite: 20, total: 0 },
    editingId: null, deletingId: null, collectingVenta: null,
    filters: { buscar: '', estatus: '' }
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
    getVentas(p = {}) {
      const q = new URLSearchParams({ pagina: p.pagina || 1, limite: p.limite || 20, ...(p.buscar && { buscar: p.buscar }), ...(p.estatus && { estatus: p.estatus }) });
      return this.request(`/api/ventas?${q}`);
    },
    createVenta(d) { return this.request('/api/ventas', { method: 'POST', body: JSON.stringify(d) }); },
    updateVenta(id, d) { return this.request(`/api/ventas/${id}`, { method: 'PUT', body: JSON.stringify(d) }); },
    deleteVenta(id) { return this.request(`/api/ventas/${id}`, { method: 'DELETE' }); },
    getContactos() { return this.request('/api/contactos?tipo=cliente&limite=100'); },
    getCuentas() { return this.request('/api/cuentas-bancarias'); },
    registrarCobro(d) { return this.request('/api/pagos', { method: 'POST', body: JSON.stringify(d) }); }
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
        
        return `<tr data-id="${v.id}">
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
    },
    contactos() { 
      elements.contactoId.innerHTML = '<option value="">-- Sin cliente --</option>' + 
        state.contactos.map(c => `<option value="${c.id}">${c.nombre}</option>`).join(''); 
    },
    cuentas() { 
      elements.cobroCuenta.innerHTML = '<option value="">-- Sin registrar en banco --</option>' + 
        state.cuentas.map(c => `<option value="${c.id}">${c.nombre} (${utils.formatMoney(c.saldo_actual)})</option>`).join(''); 
    }
  };

  const handlers = {
    async loadData() {
      try {
        const [ventasData, contactosData, cuentasData] = await Promise.all([
          api.getVentas({ ...state.filters, pagina: state.paginacion.pagina }),
          api.getContactos().catch(() => ({ contactos: [] })),
          api.getCuentas().catch(() => ({ cuentas: [] }))
        ]);
        state.ventas = ventasData.ventas || [];
        state.paginacion = ventasData.paginacion || state.paginacion;
        state.contactos = contactosData.contactos || [];
        state.cuentas = cuentasData.cuentas || [];
        render.ventas(); 
        render.stats(); 
        render.contactos(); 
        render.cuentas();
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
      if (action === 'edit') this.openEditModal(v);
      else if (action === 'delete') this.openDeleteModal(v);
      else if (action === 'collect') this.openCobroModal(v);
    },
    openCreateModal() {
      state.editingId = null; 
      elements.modalTitle.textContent = 'Nueva Venta'; 
      elements.ventaForm.reset();
      elements.fecha.value = utils.today(); 
      elements.ventaModal.classList.add('active'); 
      elements.contactoId.focus();
    },
    openEditModal(v) {
      state.editingId = v.id; 
      elements.modalTitle.textContent = 'Editar Venta';
      elements.contactoId.value = v.contacto_id || ''; 
      elements.folio.value = v.folio || '';
      elements.fecha.value = utils.formatDateInput(v.fecha); 
      elements.fechaVencimiento.value = utils.formatDateInput(v.fecha_vencimiento);
      elements.descripcion.value = v.descripcion || ''; 
      elements.subtotal.value = v.subtotal || '';
      elements.impuesto.value = v.impuesto || ''; 
      elements.total.value = v.total || '';
      elements.moneda.value = v.moneda || 'MXN'; 
      elements.tipoCambio.value = v.tipo_cambio || 1;
      elements.uuidCfdi.value = v.uuid_cfdi || ''; 
      elements.folioCfdi.value = v.folio_cfdi || '';
      elements.notas.value = v.notas || ''; 
      elements.ventaModal.classList.add('active');
    },
    closeVentaModal() { 
      elements.ventaModal.classList.remove('active'); 
      elements.ventaForm.reset(); 
      state.editingId = null; 
    },
    async submitVenta(e) {
      e.preventDefault();
      const d = {
        contacto_id: elements.contactoId.value || null, 
        folio: elements.folio.value.trim() || null,
        fecha: elements.fecha.value, 
        fecha_vencimiento: elements.fechaVencimiento.value || null,
        descripcion: elements.descripcion.value.trim() || null,
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
      const d = { 
        tipo: 'venta', 
        referencia_id: state.collectingVenta.id, 
        monto: parseFloat(elements.cobroMonto.value), 
        fecha: elements.cobroFecha.value, 
        metodo_pago: elements.cobroMetodo.value, 
        cuenta_bancaria_id: elements.cobroCuenta.value || null 
      };
      elements.submitCobro.classList.add('loading'); 
      elements.submitCobro.disabled = true;
      try { 
        await api.registrarCobro(d); 
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
    calcTotal() { 
      const s = parseFloat(elements.subtotal.value) || 0;
      const i = parseFloat(elements.impuesto.value) || 0; 
      if (s > 0) elements.total.value = (s + i).toFixed(2); 
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

    elements.menuToggle.addEventListener('click', () => handlers.toggleSidebar());
    elements.sidebarOverlay.addEventListener('click', () => handlers.closeSidebar());
    elements.orgSwitcher.addEventListener('click', () => handlers.switchOrg());
    elements.addVentaBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.addFirstVentaBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.fabBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.closeModal.addEventListener('click', () => handlers.closeVentaModal());
    elements.cancelModal.addEventListener('click', () => handlers.closeVentaModal());
    elements.ventaForm.addEventListener('submit', e => handlers.submitVenta(e));
    elements.ventaModal.addEventListener('click', e => { if (e.target === elements.ventaModal) handlers.closeVentaModal(); });
    elements.subtotal.addEventListener('input', () => handlers.calcTotal());
    elements.impuesto.addEventListener('input', () => handlers.calcTotal());
    elements.closeCobroModal.addEventListener('click', () => handlers.closeCobroModal());
    elements.cancelCobroModal.addEventListener('click', () => handlers.closeCobroModal());
    elements.cobroForm.addEventListener('submit', e => handlers.submitCobro(e));
    elements.cobroModal.addEventListener('click', e => { if (e.target === elements.cobroModal) handlers.closeCobroModal(); });
    elements.closeDeleteModal.addEventListener('click', () => handlers.closeDeleteModal());
    elements.cancelDeleteModal.addEventListener('click', () => handlers.closeDeleteModal());
    elements.confirmDelete.addEventListener('click', () => handlers.confirmDelete());
    elements.deleteModal.addEventListener('click', e => { if (e.target === elements.deleteModal) handlers.closeDeleteModal(); });
    
    const df = utils.debounce(() => handlers.applyFilters(), 300);
    elements.searchInput.addEventListener('input', df);
    elements.filterStatus.addEventListener('change', () => handlers.applyFilters());
    elements.prevPage.addEventListener('click', () => handlers.prevPage());
    elements.nextPage.addEventListener('click', () => handlers.nextPage());
    
    document.addEventListener('keydown', e => { 
      if (e.key === 'Escape') { 
        handlers.closeVentaModal(); 
        handlers.closeCobroModal(); 
        handlers.closeDeleteModal(); 
      } 
    });

    handlers.loadData();
    console.log('🚀 TRUNO Ventas v3');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
