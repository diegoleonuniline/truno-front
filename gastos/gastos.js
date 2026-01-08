/**
 * TRUNO - Gastos Module v2
 * Con creación inline tipo Odoo
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
    totalMes: $('totalMes'), pendientes: $('pendientes'), sinFactura: $('sinFactura'), pagados: $('pagados'),
    searchInput: $('searchInput'), filterStatus: $('filterStatus'), filterCategoria: $('filterCategoria'), filterFiscal: $('filterFiscal'),
    tableContainer: $('tableContainer'), tableBody: $('tableBody'), mobileCards: $('mobileCards'), emptyState: $('emptyState'),
    pagination: $('pagination'), showingStart: $('showingStart'), showingEnd: $('showingEnd'), totalRecords: $('totalRecords'),
    prevPage: $('prevPage'), nextPage: $('nextPage'),
    addGastoBtn: $('addGastoBtn'), addFirstGastoBtn: $('addFirstGastoBtn'), fabBtn: $('fabBtn'),
    // Gasto Modal
    gastoModal: $('gastoModal'), gastoForm: $('gastoForm'), modalTitle: $('modalTitle'),
    closeModal: $('closeModal'), cancelModal: $('cancelModal'), submitModal: $('submitModal'),
    concepto: $('concepto'), proveedorId: $('proveedorId'), fecha: $('fecha'), fechaVencimiento: $('fechaVencimiento'),
    categoriaId: $('categoriaId'), subcategoriaId: $('subcategoriaId'),
    subtotal: $('subtotal'), impuesto: $('impuesto'), total: $('total'), moneda: $('moneda'), metodoPago: $('metodoPago'),
    esFiscal: $('esFiscal'), fiscalFields: $('fiscalFields'), facturaRecibida: $('facturaRecibida'),
    validadaRow: $('validadaRow'), facturaValidada: $('facturaValidada'), uuidCfdi: $('uuidCfdi'), folioCfdi: $('folioCfdi'),
    comprobanteUpload: $('comprobanteUpload'), comprobanteFile: $('comprobanteFile'),
    comprobantePreview: $('comprobantePreview'), comprobanteFileName: $('comprobanteFileName'),
    viewComprobante: $('viewComprobante'), removeComprobante: $('removeComprobante'),
    transaccionId: $('transaccionId'), notas: $('notas'),
    // Quick create modals
    addProveedorBtn: $('addProveedorBtn'), addCategoriaBtn: $('addCategoriaBtn'),
    addSubcategoriaBtn: $('addSubcategoriaBtn'), addTransaccionBtn: $('addTransaccionBtn'), addCuentaBtn: $('addCuentaBtn'),
    // Categoria Modal
    categoriaModal: $('categoriaModal'), categoriaForm: $('categoriaForm'), closeCategoriaModal: $('closeCategoriaModal'),
    cancelCategoriaModal: $('cancelCategoriaModal'), categoriaNombre: $('categoriaNombre'), categoriaDescripcion: $('categoriaDescripcion'),
    // Subcategoria Modal
    subcategoriaModal: $('subcategoriaModal'), subcategoriaForm: $('subcategoriaForm'), closeSubcategoriaModal: $('closeSubcategoriaModal'),
    cancelSubcategoriaModal: $('cancelSubcategoriaModal'), subcategoriaPadre: $('subcategoriaPadre'), subcategoriaNombre: $('subcategoriaNombre'),
    // Proveedor Modal
    proveedorModal: $('proveedorModal'), proveedorForm: $('proveedorForm'), closeProveedorModal: $('closeProveedorModal'),
    cancelProveedorModal: $('cancelProveedorModal'), proveedorNombre: $('proveedorNombre'),
    proveedorRfc: $('proveedorRfc'), proveedorTelefono: $('proveedorTelefono'), proveedorEmail: $('proveedorEmail'),
    // Transaccion Modal
    transaccionModal: $('transaccionModal'), transaccionForm: $('transaccionForm'), closeTransaccionModal: $('closeTransaccionModal'),
    cancelTransaccionModal: $('cancelTransaccionModal'), txCuentaId: $('txCuentaId'), txMonto: $('txMonto'), txFecha: $('txFecha'), txReferencia: $('txReferencia'),
    // Cuenta Modal
    cuentaModal: $('cuentaModal'), cuentaForm: $('cuentaForm'), closeCuentaModal: $('closeCuentaModal'),
    cancelCuentaModal: $('cancelCuentaModal'), cuentaNombre: $('cuentaNombre'), cuentaBanco: $('cuentaBanco'), cuentaSaldo: $('cuentaSaldo'),
    // Delete Modal
    deleteModal: $('deleteModal'), closeDeleteModal: $('closeDeleteModal'), cancelDeleteModal: $('cancelDeleteModal'),
    confirmDelete: $('confirmDelete'), deleteGastoName: $('deleteGastoName')
  };

  let state = {
    user: null, org: null, gastos: [], proveedores: [], categorias: [], subcategorias: [], cuentas: [], transacciones: [],
    impuestosCatalogo: [], impuestosTemp: [],
    paginacion: { pagina: 1, limite: 20, total: 0 },
    editingId: null, deletingId: null, comprobanteData: null,
    filters: { buscar: '', estatus: '', categoria: '', es_fiscal: '' }
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
    getGastos(p = {}) {
      const q = new URLSearchParams({ pagina: p.pagina || 1, limite: p.limite || 20, ...Object.fromEntries(Object.entries(p).filter(([k, v]) => v)) });
      return this.request(`/api/gastos?${q}`);
    },
    getGasto(id) { return this.request(`/api/gastos/${id}`); },
    createGasto(d) { return this.request('/api/gastos', { method: 'POST', body: JSON.stringify(d) }); },
    updateGasto(id, d) { return this.request(`/api/gastos/${id}`, { method: 'PUT', body: JSON.stringify(d) }); },
    deleteGasto(id) { return this.request(`/api/gastos/${id}`, { method: 'DELETE' }); },
    getProveedores() { return this.request('/api/contactos?tipo=proveedor&limite=200'); },
    createProveedor(d) { return this.request('/api/contactos', { method: 'POST', body: JSON.stringify({ ...d, tipo: 'proveedor' }) }); },
    getCategorias() { return this.request('/api/categorias?tipo=gasto'); },
    createCategoria(d) { return this.request('/api/categorias', { method: 'POST', body: JSON.stringify({ ...d, tipo: 'gasto' }) }); },
    getSubcategorias(catId) { return this.request(`/api/categorias/${catId}/subcategorias`); },
    createSubcategoria(catId, d) { return this.request(`/api/categorias/${catId}/subcategorias`, { method: 'POST', body: JSON.stringify(d) }); },
    getCuentas() { return this.request('/api/cuentas-bancarias'); },
    createCuenta(d) { return this.request('/api/cuentas-bancarias', { method: 'POST', body: JSON.stringify(d) }); },
    getTransacciones() { return this.request('/api/transacciones?tipo=egreso&limite=50&sin_conciliar=1'); },
    createTransaccion(d) { return this.request('/api/transacciones', { method: 'POST', body: JSON.stringify(d) }); },
    getImpuestos() { return this.request('/api/impuestos'); }
  };

  const render = {
    user() { if (state.user) elements.userAvatar.textContent = utils.getInitials(state.user.nombre); },
    org() { if (state.org) { elements.orgName.textContent = state.org.nombre; elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`; } },
    stats() {
      const now = new Date(), m = now.getMonth(), y = now.getFullYear();
      let totalMes = 0, pendientes = 0, sinFactura = 0, pagados = 0;
      state.gastos.forEach(g => {
        const f = new Date(g.fecha), tot = parseFloat(g.total) || 0;
        if (f.getMonth() === m && f.getFullYear() === y) totalMes += tot;
        if (g.estatus_pago === 'pagado') pagados += tot;
        else pendientes += tot;
        if (g.es_fiscal && !g.factura_recibida) sinFactura++;
      });
      elements.totalMes.textContent = utils.formatMoney(totalMes);
      elements.pendientes.textContent = utils.formatMoney(pendientes);
      elements.sinFactura.textContent = sinFactura;
      elements.pagados.textContent = utils.formatMoney(pagados);
    },
    gastos() {
      const { gastos, paginacion } = state;
      if (!gastos.length) { elements.tableContainer.style.display = 'none'; elements.mobileCards.innerHTML = ''; elements.emptyState.style.display = 'block'; elements.pagination.style.display = 'none'; return; }
      elements.emptyState.style.display = 'none'; elements.tableContainer.style.display = 'block'; elements.pagination.style.display = 'flex';
      const start = (paginacion.pagina - 1) * paginacion.limite + 1, end = Math.min(paginacion.pagina * paginacion.limite, paginacion.total);
      elements.showingStart.textContent = start; elements.showingEnd.textContent = end; elements.totalRecords.textContent = paginacion.total;
      elements.prevPage.disabled = paginacion.pagina <= 1; elements.nextPage.disabled = paginacion.pagina >= paginacion.paginas;

      elements.tableBody.innerHTML = gastos.map(g => {
        const badges = [];
        if (g.es_fiscal) badges.push(`<span class="badge fiscal">Fiscal</span>`);
        if (g.es_fiscal && g.factura_validada) badges.push(`<span class="badge validada">Validada</span>`);
        else if (g.es_fiscal && !g.factura_recibida) badges.push(`<span class="badge sin-factura">Sin factura</span>`);
        if (g.transaccion_id) badges.push(`<span class="badge conciliado">Conciliado</span>`);
        const statusBadge = { pendiente: 'pendiente', pagado: 'pagado', vencido: 'vencido', cancelado: 'cancelado' }[g.estatus_pago] || 'pendiente';
        const statusLabel = { pendiente: 'Pendiente', pagado: 'Pagado', vencido: 'Vencido', cancelado: 'Cancelado' }[g.estatus_pago] || 'Pendiente';

        return `<tr data-id="${g.id}">
          <td><div class="cell-main">${g.concepto || 'Sin concepto'}</div><div class="cell-sub">${g.nombre_proveedor || ''}</div></td>
          <td>${utils.formatDate(g.fecha)}</td>
          <td>${g.nombre_categoria || '-'}${g.nombre_subcategoria ? ` / ${g.nombre_subcategoria}` : ''}</td>
          <td><div class="badges-group">${badges.join('') || '<span class="badge no-fiscal">No fiscal</span>'}</div></td>
          <td><span class="badge ${statusBadge}">${statusLabel}</span></td>
          <td style="text-align:right;"><div class="cell-amount expense">${utils.formatMoney(g.total, g.moneda)}</div></td>
          <td><div class="table-actions">
            <button class="action-btn" title="Editar" data-action="edit" data-id="${g.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${g.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div></td></tr>`;
      }).join('');

      elements.mobileCards.innerHTML = gastos.map(g => {
        const badges = [];
        if (g.es_fiscal) badges.push(`<span class="badge fiscal">Fiscal</span>`);
        if (g.transaccion_id) badges.push(`<span class="badge conciliado">Conciliado</span>`);
        const statusBadge = g.estatus_pago || 'pendiente';
        const statusLabel = { pendiente: 'Pendiente', pagado: 'Pagado', vencido: 'Vencido' }[g.estatus_pago] || 'Pendiente';
        return `<div class="mobile-card" data-id="${g.id}">
          <div class="mobile-card-header"><div class="mobile-card-title">${g.concepto || 'Sin concepto'}</div><div class="mobile-card-amount">${utils.formatMoney(g.total)}</div></div>
          <div class="mobile-card-meta"><span>${utils.formatDate(g.fecha)}</span><span>${g.nombre_proveedor || ''}</span></div>
          <div class="mobile-card-badges">${badges.join('')}<span class="badge ${statusBadge}">${statusLabel}</span></div>
          <div class="mobile-card-footer"><span>${g.nombre_categoria || ''}</span>
            <div class="table-actions">
              <button class="action-btn" data-action="edit" data-id="${g.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
              <button class="action-btn danger" data-action="delete" data-id="${g.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
            </div>
          </div></div>`;
      }).join('');

      document.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); handlers.handleAction(b.dataset.action, b.dataset.id); }));
    },
    proveedores() {
      const opts = state.proveedores.map(p => `<option value="${p.id}">${p.nombre}</option>`).join('');
      elements.proveedorId.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
    },
    categorias() {
      const opts = state.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      elements.categoriaId.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
      elements.subcategoriaPadre.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
      elements.filterCategoria.innerHTML = '<option value="">Categoría</option>' + opts;
    },
    subcategorias() {
      const opts = state.subcategorias.map(s => `<option value="${s.id}">${s.nombre}</option>`).join('');
      elements.subcategoriaId.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
    },
    impuestos() {
      const container = $('impuestosContainer');
      if (!container) return;
      
      if (!state.impuestosTemp.length) {
        container.innerHTML = '<div class="impuestos-empty">Sin impuestos agregados</div>';
        return;
      }
      
      const selectOpts = state.impuestosCatalogo.map(i => 
        `<option value="${i.id}" data-tasa="${i.tasa}" data-tipo="${i.tipo}">${i.nombre}</option>`
      ).join('');
      
      container.innerHTML = state.impuestosTemp.map((imp, idx) => {
        const selected = state.impuestosCatalogo.find(i => i.id === imp.impuesto_id);
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
      
      // Set selected values and bind events
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
          // Auto-calculate importe
          const subtotal = parseFloat(elements.subtotal.value) || 0;
          if (subtotal > 0 && tasa > 0) {
            impInput.value = (subtotal * tasa).toFixed(2);
            state.impuestosTemp[idx].importe = parseFloat(impInput.value);
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
    cuentas() {
      const opts = state.cuentas.map(c => `<option value="${c.id}">${c.nombre} (${utils.formatMoney(c.saldo_actual)})</option>`).join('');
      elements.txCuentaId.innerHTML = '<option value="">-- Seleccionar --</option>' + opts;
    },
    transacciones() {
      const opts = state.transacciones.map(t => `<option value="${t.id}">${utils.formatDate(t.fecha)} - ${utils.formatMoney(t.monto)} - ${t.descripcion || t.referencia || 'Sin desc'}</option>`).join('');
      elements.transaccionId.innerHTML = '<option value="">-- Sin conciliar --</option>' + opts;
    }
  };

  const handlers = {
    async loadData() {
      try {
        const [gastosData, provData, catData, cuentasData, txData, impData] = await Promise.all([
          api.getGastos({ ...state.filters, pagina: state.paginacion.pagina }),
          api.getProveedores().catch(() => ({ contactos: [] })),
          api.getCategorias().catch(() => ({ categorias: [] })),
          api.getCuentas().catch(() => ({ cuentas: [] })),
          api.getTransacciones().catch(() => ({ transacciones: [] })),
          api.getImpuestos().catch(() => ({ impuestos: [] }))
        ]);
        state.gastos = gastosData.gastos || [];
        state.paginacion = gastosData.paginacion || state.paginacion;
        state.proveedores = provData.contactos || [];
        state.categorias = catData.categorias || [];
        state.cuentas = cuentasData.cuentas || [];
        state.transacciones = txData.transacciones || [];
        state.impuestosCatalogo = impData.impuestos || [];
        render.gastos(); render.stats(); render.proveedores(); render.categorias(); render.cuentas(); render.transacciones();
      } catch (e) { console.error('Error:', e); }
    },
    async loadSubcategorias(catId) {
      if (!catId) { state.subcategorias = []; render.subcategorias(); return; }
      try {
        const data = await api.getSubcategorias(catId);
        state.subcategorias = data.subcategorias || [];
        render.subcategorias();
      } catch (e) { state.subcategorias = []; render.subcategorias(); }
    },
    toggleSidebar() { elements.sidebar.classList.toggle('open'); elements.sidebarOverlay.classList.toggle('active'); },
    closeSidebar() { elements.sidebar.classList.remove('open'); elements.sidebarOverlay.classList.remove('active'); },
    handleAction(action, id) {
      const g = state.gastos.find(x => x.id === id);
      if (action === 'edit') this.openEditModal(g);
      else if (action === 'delete') this.openDeleteModal(g);
    },
    // Gasto Modal
    openCreateModal() {
      state.editingId = null; state.comprobanteData = null;
      state.impuestosTemp = [];
      elements.modalTitle.textContent = 'Nuevo Gasto';
      elements.gastoForm.reset();
      elements.fecha.value = utils.today();
      elements.fiscalFields.style.display = 'none';
      elements.validadaRow.style.display = 'none';
      elements.comprobanteUpload.classList.remove('has-file');
      elements.comprobantePreview.style.display = 'none';
      render.impuestos();
      elements.gastoModal.classList.add('active');
      elements.concepto.focus();
    },
    async openEditModal(g) {
      state.editingId = g.id; state.comprobanteData = g.comprobante_url || null;
      state.impuestosTemp = [];
      elements.modalTitle.textContent = 'Editar Gasto';
      elements.concepto.value = g.concepto || '';
      elements.proveedorId.value = g.proveedor_id || '';
      elements.fecha.value = utils.formatDateInput(g.fecha);
      elements.fechaVencimiento.value = utils.formatDateInput(g.fecha_vencimiento);
      elements.categoriaId.value = g.categoria_id || '';
      if (g.categoria_id) await this.loadSubcategorias(g.categoria_id);
      elements.subcategoriaId.value = g.subcategoria_id || '';
      elements.subtotal.value = g.subtotal || '';
      elements.total.value = g.total || '';
      elements.moneda.value = g.moneda || 'MXN';
      elements.metodoPago.value = g.metodo_pago || '';
      elements.esFiscal.checked = g.es_fiscal || false;
      elements.fiscalFields.style.display = g.es_fiscal ? 'block' : 'none';
      elements.facturaRecibida.checked = g.factura_recibida || false;
      elements.validadaRow.style.display = g.factura_recibida ? 'flex' : 'none';
      elements.facturaValidada.checked = g.factura_validada || false;
      elements.uuidCfdi.value = g.uuid_cfdi || '';
      elements.folioCfdi.value = g.folio_cfdi || '';
      elements.transaccionId.value = g.transaccion_id || '';
      elements.notas.value = g.notas || '';
      // Legacy: si hay impuesto simple, agregarlo como IVA
      if (g.impuesto && parseFloat(g.impuesto) > 0) {
        const iva16 = state.impuestosCatalogo.find(i => i.nombre.includes('IVA 16'));
        if (iva16) {
          state.impuestosTemp.push({ impuesto_id: iva16.id, tasa: iva16.tasa, tipo: iva16.tipo, importe: parseFloat(g.impuesto) });
        }
      }
      render.impuestos();
      if (g.comprobante_url) {
        elements.comprobanteUpload.classList.add('has-file');
        elements.comprobantePreview.style.display = 'flex';
        elements.comprobanteFileName.textContent = 'Comprobante guardado';
      } else {
        elements.comprobanteUpload.classList.remove('has-file');
        elements.comprobantePreview.style.display = 'none';
      }
      elements.gastoModal.classList.add('active');
    },
    closeGastoModal() { elements.gastoModal.classList.remove('active'); elements.gastoForm.reset(); state.editingId = null; state.comprobanteData = null; },
    async submitGasto(e) {
      e.preventDefault();
      // Calcular impuesto total para compatibilidad
      let totalImpuesto = 0;
      state.impuestosTemp.forEach(imp => {
        if (imp.tipo === 'traslado') totalImpuesto += (imp.importe || 0);
        else totalImpuesto -= (imp.importe || 0);
      });
      
      const d = {
        concepto: elements.concepto.value.trim(),
        proveedor_id: elements.proveedorId.value || null,
        fecha: elements.fecha.value,
        fecha_vencimiento: elements.fechaVencimiento.value || null,
        categoria_id: elements.categoriaId.value || null,
        subcategoria_id: elements.subcategoriaId.value || null,
        subtotal: parseFloat(elements.subtotal.value) || parseFloat(elements.total.value),
        impuesto: Math.abs(totalImpuesto),
        total: parseFloat(elements.total.value),
        moneda: elements.moneda.value,
        metodo_pago: elements.metodoPago.value || null,
        es_fiscal: elements.esFiscal.checked,
        factura_recibida: elements.facturaRecibida.checked,
        factura_validada: elements.facturaValidada.checked,
        uuid_cfdi: elements.uuidCfdi.value.trim() || null,
        folio_cfdi: elements.folioCfdi.value.trim() || null,
        transaccion_id: elements.transaccionId.value || null,
        notas: elements.notas.value.trim() || null,
        comprobante_url: state.comprobanteData || null,
        impuestos: state.impuestosTemp.filter(i => i.impuesto_id).map(i => ({
          impuesto_id: i.impuesto_id,
          base: parseFloat(elements.subtotal.value) || parseFloat(elements.total.value),
          importe: i.importe || 0
        }))
      };
      elements.submitModal.classList.add('loading'); elements.submitModal.disabled = true;
      try {
        if (state.editingId) await api.updateGasto(state.editingId, d); else await api.createGasto(d);
        this.closeGastoModal(); await this.loadData();
      } catch (e) { alert(e.message); }
      finally { elements.submitModal.classList.remove('loading'); elements.submitModal.disabled = false; }
    },
    // Quick creates
    openCategoriaModal() { elements.categoriaForm.reset(); elements.categoriaModal.classList.add('active'); elements.categoriaNombre.focus(); },
    closeCategoriaModal() { elements.categoriaModal.classList.remove('active'); },
    async submitCategoria(e) {
      e.preventDefault();
      try {
        const data = await api.createCategoria({ nombre: elements.categoriaNombre.value.trim(), descripcion: elements.categoriaDescripcion.value.trim() || null });
        state.categorias.push(data.categoria || data);
        render.categorias();
        elements.categoriaId.value = data.categoria?.id || data.id;
        this.closeCategoriaModal();
      } catch (e) { alert(e.message); }
    },
    openSubcategoriaModal() {
      elements.subcategoriaForm.reset();
      elements.subcategoriaPadre.innerHTML = '<option value="">-- Seleccionar --</option>' + state.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      if (elements.categoriaId.value) elements.subcategoriaPadre.value = elements.categoriaId.value;
      elements.subcategoriaModal.classList.add('active');
      elements.subcategoriaNombre.focus();
    },
    closeSubcategoriaModal() { elements.subcategoriaModal.classList.remove('active'); },
    async submitSubcategoria(e) {
      e.preventDefault();
      const catId = elements.subcategoriaPadre.value;
      if (!catId) { alert('Selecciona categoría padre'); return; }
      try {
        const data = await api.createSubcategoria(catId, { nombre: elements.subcategoriaNombre.value.trim() });
        if (catId === elements.categoriaId.value) {
          state.subcategorias.push(data.subcategoria || data);
          render.subcategorias();
          elements.subcategoriaId.value = data.subcategoria?.id || data.id;
        }
        this.closeSubcategoriaModal();
      } catch (e) { alert(e.message); }
    },
    openProveedorModal() { elements.proveedorForm.reset(); elements.proveedorModal.classList.add('active'); elements.proveedorNombre.focus(); },
    closeProveedorModal() { elements.proveedorModal.classList.remove('active'); },
    async submitProveedor(e) {
      e.preventDefault();
      try {
        const data = await api.createProveedor({
          nombre: elements.proveedorNombre.value.trim(),
          rfc: elements.proveedorRfc.value.trim().toUpperCase() || null,
          telefono: elements.proveedorTelefono.value.trim() || null,
          email: elements.proveedorEmail.value.trim() || null
        });
        state.proveedores.push(data.contacto || data);
        render.proveedores();
        elements.proveedorId.value = data.contacto?.id || data.id;
        this.closeProveedorModal();
      } catch (e) { alert(e.message); }
    },
    openTransaccionModal() {
      elements.transaccionForm.reset();
      elements.txFecha.value = elements.fecha.value || utils.today();
      elements.txMonto.value = elements.total.value || '';
      render.cuentas();
      elements.transaccionModal.classList.add('active');
    },
    closeTransaccionModal() { elements.transaccionModal.classList.remove('active'); },
    async submitTransaccion(e) {
      e.preventDefault();
      try {
        const data = await api.createTransaccion({
          tipo: 'egreso',
          cuenta_bancaria_id: elements.txCuentaId.value,
          monto: parseFloat(elements.txMonto.value),
          fecha: elements.txFecha.value,
          referencia: elements.txReferencia.value.trim() || null,
          descripcion: elements.concepto.value || 'Gasto'
        });
        state.transacciones.unshift(data.transaccion || data);
        render.transacciones();
        elements.transaccionId.value = data.transaccion?.id || data.id;
        this.closeTransaccionModal();
      } catch (e) { alert(e.message); }
    },
    openCuentaModal() { elements.cuentaForm.reset(); elements.cuentaModal.classList.add('active'); elements.cuentaNombre.focus(); },
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
        elements.txCuentaId.value = data.cuenta?.id || data.id;
        this.closeCuentaModal();
      } catch (e) { alert(e.message); }
    },
    // Delete
    openDeleteModal(g) { state.deletingId = g.id; elements.deleteGastoName.textContent = g.concepto || 'este gasto'; elements.deleteModal.classList.add('active'); },
    closeDeleteModal() { elements.deleteModal.classList.remove('active'); state.deletingId = null; },
    async confirmDelete() {
      elements.confirmDelete.classList.add('loading'); elements.confirmDelete.disabled = true;
      try { await api.deleteGasto(state.deletingId); this.closeDeleteModal(); await this.loadData(); }
      catch (e) { alert(e.message); }
      finally { elements.confirmDelete.classList.remove('loading'); elements.confirmDelete.disabled = false; }
    },
    // Filters
    applyFilters() {
      state.filters.buscar = elements.searchInput.value.trim();
      state.filters.estatus = elements.filterStatus.value;
      state.filters.categoria = elements.filterCategoria.value;
      state.filters.es_fiscal = elements.filterFiscal.value;
      state.paginacion.pagina = 1;
      this.loadData();
    },
    prevPage() { if (state.paginacion.pagina > 1) { state.paginacion.pagina--; this.loadData(); } },
    nextPage() { if (state.paginacion.pagina < state.paginacion.paginas) { state.paginacion.pagina++; this.loadData(); } },
    calcTotal() { 
      const subtotal = parseFloat(elements.subtotal.value) || 0;
      let traslados = 0, retenciones = 0;
      state.impuestosTemp.forEach(imp => {
        if (imp.tipo === 'retencion') retenciones += (imp.importe || 0);
        else traslados += (imp.importe || 0);
      });
      const total = subtotal + traslados - retenciones;
      if (subtotal > 0 || state.impuestosTemp.length > 0) {
        elements.total.value = total.toFixed(2);
      }
    },
    addImpuesto() {
      state.impuestosTemp.push({ impuesto_id: '', tasa: 0, tipo: 'traslado', importe: 0 });
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
    handleFiscalToggle() { elements.fiscalFields.style.display = elements.esFiscal.checked ? 'block' : 'none'; },
    handleFacturaRecibidaToggle() { elements.validadaRow.style.display = elements.facturaRecibida.checked ? 'flex' : 'none'; },
    handleFileSelect(e) {
      const file = e.target.files[0];
      if (file) {
        // Por ahora solo guardamos el nombre, en producción subirías a Cloudinary
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
    elements.addGastoBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.addFirstGastoBtn.addEventListener('click', () => handlers.openCreateModal());
    elements.fabBtn.addEventListener('click', () => handlers.openCreateModal());

    // Gasto modal
    elements.closeModal.addEventListener('click', () => handlers.closeGastoModal());
    elements.cancelModal.addEventListener('click', () => handlers.closeGastoModal());
    elements.gastoForm.addEventListener('submit', e => handlers.submitGasto(e));
    elements.gastoModal.addEventListener('click', e => { if (e.target === elements.gastoModal) handlers.closeGastoModal(); });

    // Form interactions
    elements.subtotal.addEventListener('input', () => handlers.recalcImpuestos());
    elements.esFiscal.addEventListener('change', () => handlers.handleFiscalToggle());
    elements.facturaRecibida.addEventListener('change', () => handlers.handleFacturaRecibidaToggle());
    elements.categoriaId.addEventListener('change', () => handlers.loadSubcategorias(elements.categoriaId.value));
    elements.comprobanteUpload.addEventListener('click', () => elements.comprobanteFile.click());
    elements.comprobanteFile.addEventListener('change', e => handlers.handleFileSelect(e));
    elements.removeComprobante.addEventListener('click', e => { e.stopPropagation(); handlers.removeComprobante(); });
    
    // Impuestos
    $('addImpuestoBtn')?.addEventListener('click', () => handlers.addImpuesto());

    // Quick create buttons
    elements.addProveedorBtn.addEventListener('click', () => handlers.openProveedorModal());
    elements.addCategoriaBtn.addEventListener('click', () => handlers.openCategoriaModal());
    elements.addSubcategoriaBtn.addEventListener('click', () => handlers.openSubcategoriaModal());
    elements.addTransaccionBtn.addEventListener('click', () => handlers.openTransaccionModal());
    elements.addCuentaBtn.addEventListener('click', () => handlers.openCuentaModal());

    // Categoria modal
    elements.closeCategoriaModal.addEventListener('click', () => handlers.closeCategoriaModal());
    elements.cancelCategoriaModal.addEventListener('click', () => handlers.closeCategoriaModal());
    elements.categoriaForm.addEventListener('submit', e => handlers.submitCategoria(e));
    elements.categoriaModal.addEventListener('click', e => { if (e.target === elements.categoriaModal) handlers.closeCategoriaModal(); });

    // Subcategoria modal
    elements.closeSubcategoriaModal.addEventListener('click', () => handlers.closeSubcategoriaModal());
    elements.cancelSubcategoriaModal.addEventListener('click', () => handlers.closeSubcategoriaModal());
    elements.subcategoriaForm.addEventListener('submit', e => handlers.submitSubcategoria(e));
    elements.subcategoriaModal.addEventListener('click', e => { if (e.target === elements.subcategoriaModal) handlers.closeSubcategoriaModal(); });

    // Proveedor modal
    elements.closeProveedorModal.addEventListener('click', () => handlers.closeProveedorModal());
    elements.cancelProveedorModal.addEventListener('click', () => handlers.closeProveedorModal());
    elements.proveedorForm.addEventListener('submit', e => handlers.submitProveedor(e));
    elements.proveedorModal.addEventListener('click', e => { if (e.target === elements.proveedorModal) handlers.closeProveedorModal(); });

    // Transaccion modal
    elements.closeTransaccionModal.addEventListener('click', () => handlers.closeTransaccionModal());
    elements.cancelTransaccionModal.addEventListener('click', () => handlers.closeTransaccionModal());
    elements.transaccionForm.addEventListener('submit', e => handlers.submitTransaccion(e));
    elements.transaccionModal.addEventListener('click', e => { if (e.target === elements.transaccionModal) handlers.closeTransaccionModal(); });

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
    elements.filterStatus.addEventListener('change', () => handlers.applyFilters());
    elements.filterCategoria.addEventListener('change', () => handlers.applyFilters());
    elements.filterFiscal.addEventListener('change', () => handlers.applyFilters());
    elements.prevPage.addEventListener('click', () => handlers.prevPage());
    elements.nextPage.addEventListener('click', () => handlers.nextPage());

    // ESC key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        handlers.closeGastoModal(); handlers.closeCategoriaModal(); handlers.closeSubcategoriaModal();
        handlers.closeProveedorModal(); handlers.closeTransaccionModal(); handlers.closeCuentaModal();
        handlers.closeDeleteModal();
      }
    });

    handlers.loadData().then(() => {
      // Check URL params for creating from transaccion
      const params = new URLSearchParams(window.location.search);
      if (params.get('crear') === '1') {
        setTimeout(() => {
          handlers.openCreateModal();
          // Prellenar datos desde transacción
          if (params.get('monto')) elements.total.value = params.get('monto');
          if (params.get('fecha')) elements.fecha.value = params.get('fecha');
          if (params.get('contacto_id')) elements.proveedorId.value = params.get('contacto_id');
          if (params.get('descripcion')) elements.concepto.value = params.get('descripcion');
          if (params.get('from_tx')) {
            // Guardar referencia a transacción para conciliar después
            state.fromTransaccionId = params.get('from_tx');
          }
          // Limpiar URL
          window.history.replaceState({}, '', window.location.pathname);
        }, 300);
      }
    });
    console.log('🚀 TRUNO Gastos v3');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
