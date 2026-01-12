/**
 * TRUNO - Catálogos Module
 * CRUD para: Categorías, Subcategorías, Impuestos, Métodos de Pago, Monedas
 */

(function() {
  'use strict';

  // Usar configuración centralizada desde config.js
  // Relacionado con: config.js (configuración global)
  const CONFIG = window.TRUNO_CONFIG || {
    API_URL: 'http://localhost:3000',
    STORAGE_KEYS: { TOKEN: 'truno_token', USER: 'truno_user', ORG: 'truno_org' },
    REDIRECT: { LOGIN: '/login/login.html', SELECT_ORG: '/organizaciones/seleccionar.html' }
  };

  const $ = id => document.getElementById(id);

  // State global
  let state = {
    user: null,
    org: null,
    activeTab: 'categorias',
    categorias: [],
    subcategorias: [],
    impuestos: [],
    metodosPago: [],
    monedas: [],
    editingId: null,
    deletingId: null,
    deletingType: null
  };

  // ========== TOAST ==========
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
      const el = document.createElement('div');
      el.className = `toast toast-${type}`;
      const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>'
      };
      el.innerHTML = `
        <div class="toast-icon">${icons[type] || icons.success}</div>
        <div class="toast-message">${message}</div>
        <button class="toast-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>
      `;
      this.container.appendChild(el);
      requestAnimationFrame(() => el.classList.add('show'));
      el.querySelector('.toast-close').addEventListener('click', () => this.hide(el));
      if (duration > 0) setTimeout(() => this.hide(el), duration);
    },
    hide(el) {
      if (!el?.parentNode) return;
      el.classList.remove('show');
      el.classList.add('hide');
      setTimeout(() => el.remove(), 300);
    },
    success(msg) { this.show(msg, 'success'); },
    error(msg) { this.show(msg, 'error'); }
  };

  // ========== UTILS ==========
  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: url => window.location.href = url,
    getInitials: (n, a) => (n?.charAt(0) || '') + (a?.charAt(0) || '') || '??'
  };

  // ========== API ==========
  const api = {
    async request(endpoint, options = {}) {
      const r = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${utils.getToken()}`,
          'X-Organization-Id': state.org?.id,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });
      if (r.status === 401) { utils.redirect(CONFIG.REDIRECT.LOGIN); return; }
      const data = await r.json();
      if (!r.ok) throw new Error(data.error || 'Error');
      return data;
    },
    // Categorías
    getCategorias: () => api.request('/api/categorias'),
    createCategoria: d => api.request('/api/categorias', { method: 'POST', body: JSON.stringify(d) }),
    updateCategoria: (id, d) => api.request(`/api/categorias/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    deleteCategoria: id => api.request(`/api/categorias/${id}`, { method: 'DELETE' }),
    // Subcategorías
    getSubcategorias: () => api.request('/api/subcategorias'),
    createSubcategoria: d => api.request('/api/subcategorias', { method: 'POST', body: JSON.stringify(d) }),
    updateSubcategoria: (id, d) => api.request(`/api/subcategorias/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    deleteSubcategoria: id => api.request(`/api/subcategorias/${id}`, { method: 'DELETE' }),
    // Impuestos
    getImpuestos: () => api.request('/api/impuestos'),
    createImpuesto: d => api.request('/api/impuestos', { method: 'POST', body: JSON.stringify(d) }),
    updateImpuesto: (id, d) => api.request(`/api/impuestos/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    deleteImpuesto: id => api.request(`/api/impuestos/${id}`, { method: 'DELETE' }),
    // Métodos de Pago
    getMetodosPago: () => api.request('/api/metodos-pago'),
    createMetodoPago: d => api.request('/api/metodos-pago', { method: 'POST', body: JSON.stringify(d) }),
    updateMetodoPago: (id, d) => api.request(`/api/metodos-pago/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    deleteMetodoPago: id => api.request(`/api/metodos-pago/${id}`, { method: 'DELETE' }),
    // Monedas
    getMonedas: () => api.request('/api/monedas'),
    createMoneda: d => api.request('/api/monedas', { method: 'POST', body: JSON.stringify(d) }),
    updateMoneda: (id, d) => api.request(`/api/monedas/${id}`, { method: 'PUT', body: JSON.stringify(d) }),
    deleteMoneda: id => api.request(`/api/monedas/${id}`, { method: 'DELETE' })
  };

  // ========== RENDER ==========
  const render = {
    user() {
      const el = $('userAvatar');
      if (el && state.user) el.textContent = utils.getInitials(state.user.nombre, state.user.apellido);
    },
    org() {
      const nameEl = $('orgName');
      const planEl = $('orgPlan');
      if (nameEl && state.org) nameEl.textContent = state.org.nombre;
      if (planEl && state.org) planEl.textContent = `Plan ${state.org.plan || 'Free'}`;
    },
    tabs() {
      document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === state.activeTab);
      });
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.toggle('active', content.id === `tab-${state.activeTab}`);
      });
    },
    
    // ===== CATEGORÍAS =====
    categorias() {
      const tbody = $('tableCategorias');
      const empty = $('emptyCategoria');
      if (!tbody) return;
      
      if (!state.categorias.length) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';
      
      tbody.innerHTML = state.categorias.map(c => `
        <tr>
          <td>
            <div class="cell-main">${c.nombre}</div>
          </td>
          <td><div class="color-preview" style="background:${c.color || '#6366f1'}"></div></td>
          <td><span class="badge badge-${c.tipo === 'ingreso' ? 'success' : c.tipo === 'gasto' ? 'error' : 'info'}">${c.tipo}</span></td>
          <td><span class="badge ${c.activo ? 'badge-success' : 'badge-neutral'}">${c.activo ? 'Activo' : 'Inactivo'}</span></td>
          <td>
            <div class="table-actions">
              <button class="action-btn" title="Editar" data-action="edit" data-type="categoria" data-id="${c.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="action-btn danger" title="Eliminar" data-action="delete" data-type="categoria" data-id="${c.id}" data-name="${c.nombre}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
      
      this.bindActions();
    },
    
    // ===== SUBCATEGORÍAS =====
    subcategorias() {
      const tbody = $('tableSubcategorias');
      const empty = $('emptySubcategoria');
      const select = $('subcatCategoriaId');
      
      // Llenar select de categorías
      if (select) {
        select.innerHTML = '<option value="">-- Seleccionar --</option>' + 
          state.categorias.map(c => `<option value="${c.id}">${c.nombre}</option>`).join('');
      }
      
      if (!tbody) return;
      
      if (!state.subcategorias.length) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';
      
      tbody.innerHTML = state.subcategorias.map(s => {
        const cat = state.categorias.find(c => c.id === s.categoria_id);
        return `
          <tr>
            <td><div class="cell-main">${s.nombre}</div></td>
            <td>${cat?.nombre || '-'}</td>
            <td><span class="badge ${s.activo ? 'badge-success' : 'badge-neutral'}">${s.activo ? 'Activo' : 'Inactivo'}</span></td>
            <td>
              <div class="table-actions">
                <button class="action-btn" title="Editar" data-action="edit" data-type="subcategoria" data-id="${s.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                </button>
                <button class="action-btn danger" title="Eliminar" data-action="delete" data-type="subcategoria" data-id="${s.id}" data-name="${s.nombre}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                </button>
              </div>
            </td>
          </tr>
        `;
      }).join('');
      
      this.bindActions();
    },
    
    // ===== IMPUESTOS =====
    impuestos() {
      const tbody = $('tableImpuestos');
      const empty = $('emptyImpuesto');
      if (!tbody) return;
      
      if (!state.impuestos.length) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';
      
      tbody.innerHTML = state.impuestos.map(i => `
        <tr>
          <td><div class="cell-main">${i.nombre}</div></td>
          <td>${i.clave_sat || '-'}</td>
          <td><span class="badge ${i.tipo === 'traslado' ? 'badge-success' : 'badge-error'}">${i.tipo === 'traslado' ? 'Traslado' : 'Retención'}</span></td>
          <td>${(i.tasa * 100).toFixed(2)}%</td>
          <td><span class="badge ${i.activo ? 'badge-success' : 'badge-neutral'}">${i.activo ? 'Activo' : 'Inactivo'}</span></td>
          <td>
            <div class="table-actions">
              <button class="action-btn" title="Editar" data-action="edit" data-type="impuesto" data-id="${i.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="action-btn danger" title="Eliminar" data-action="delete" data-type="impuesto" data-id="${i.id}" data-name="${i.nombre}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
      
      this.bindActions();
    },
    
    // ===== MÉTODOS DE PAGO =====
    metodosPago() {
      const tbody = $('tableMetodosPago');
      const empty = $('emptyMetodoPago');
      if (!tbody) return;
      
      if (!state.metodosPago.length) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';
      
      tbody.innerHTML = state.metodosPago.map(m => `
        <tr>
          <td><div class="cell-main">${m.nombre}</div></td>
          <td>${m.clave || '-'}</td>
          <td>${m.descripcion || '-'}</td>
          <td><span class="badge ${m.activo ? 'badge-success' : 'badge-neutral'}">${m.activo ? 'Activo' : 'Inactivo'}</span></td>
          <td>
            <div class="table-actions">
              <button class="action-btn" title="Editar" data-action="edit" data-type="metodoPago" data-id="${m.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="action-btn danger" title="Eliminar" data-action="delete" data-type="metodoPago" data-id="${m.id}" data-name="${m.nombre}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
      
      this.bindActions();
    },
    
    // ===== MONEDAS =====
    monedas() {
      const tbody = $('tableMonedas');
      const empty = $('emptyMoneda');
      if (!tbody) return;
      
      if (!state.monedas.length) {
        tbody.innerHTML = '';
        if (empty) empty.style.display = 'block';
        return;
      }
      if (empty) empty.style.display = 'none';
      
      tbody.innerHTML = state.monedas.map(m => `
        <tr>
          <td><div class="cell-main">${m.codigo}</div></td>
          <td>${m.nombre}</td>
          <td>${m.simbolo}</td>
          <td>${m.decimales}</td>
          <td>${m.es_default ? '<span class="badge badge-info">Default</span>' : ''}</td>
          <td><span class="badge ${m.activo ? 'badge-success' : 'badge-neutral'}">${m.activo ? 'Activo' : 'Inactivo'}</span></td>
          <td>
            <div class="table-actions">
              <button class="action-btn" title="Editar" data-action="edit" data-type="moneda" data-id="${m.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="action-btn danger" title="Eliminar" data-action="delete" data-type="moneda" data-id="${m.id}" data-name="${m.codigo}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');
      
      this.bindActions();
    },
    
    bindActions() {
      document.querySelectorAll('[data-action]').forEach(btn => {
        btn.onclick = e => {
          e.stopPropagation();
          const { action, type, id, name } = btn.dataset;
          if (action === 'edit') handlers.openEditModal(type, id);
          else if (action === 'delete') handlers.openDeleteModal(type, id, name);
        };
      });
    }
  };

  // ========== HANDLERS ==========
  const handlers = {
    async loadData() {
      try {
        const [catRes, subRes, impRes, metRes, monRes] = await Promise.all([
          api.getCategorias().catch(() => ({ categorias: [] })),
          api.getSubcategorias().catch(() => ({ subcategorias: [] })),
          api.getImpuestos().catch(() => ({ impuestos: [] })),
          api.getMetodosPago().catch(() => ({ metodos_pago: [] })),
          api.getMonedas().catch(() => ({ monedas: [] }))
        ]);
        
        state.categorias = catRes.categorias || [];
        state.subcategorias = subRes.subcategorias || [];
        state.impuestos = impRes.impuestos || [];
        state.metodosPago = metRes.metodos_pago || [];
        state.monedas = monRes.monedas || [];
        
        render.categorias();
        render.subcategorias();
        render.impuestos();
        render.metodosPago();
        render.monedas();
      } catch (e) {
        console.error(e);
        toast.error('Error al cargar datos');
      }
    },
    
    setTab(tab) {
      state.activeTab = tab;
      render.tabs();
    },
    
    toggleSidebar() {
      $('sidebar')?.classList.toggle('open');
      $('sidebarOverlay')?.classList.toggle('active');
    },
    
    closeSidebar() {
      $('sidebar')?.classList.remove('open');
      $('sidebarOverlay')?.classList.remove('active');
    },
    
    // ===== MODALS CATEGORÍA =====
    openCategoriaModal() {
      state.editingId = null;
      $('modalCategoriaTitle').textContent = 'Nueva Categoría';
      $('categoriaForm').reset();
      $('catColor').value = '#6366f1';
      $('catActivo').checked = true;
      $('categoriaModal').classList.add('active');
    },
    
    closeCategoriaModal() {
      $('categoriaModal')?.classList.remove('active');
      state.editingId = null;
    },
    
    async submitCategoria(e) {
      e.preventDefault();
      const data = {
        nombre: $('catNombre').value.trim(),
        tipo: $('catTipo').value,
        color: $('catColor').value,
        activo: $('catActivo').checked
      };
      
      try {
        if (state.editingId) {
          await api.updateCategoria(state.editingId, data);
          toast.success('Categoría actualizada');
        } else {
          await api.createCategoria(data);
          toast.success('Categoría creada');
        }
        this.closeCategoriaModal();
        await this.loadData();
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    // ===== MODALS SUBCATEGORÍA =====
    openSubcategoriaModal() {
      state.editingId = null;
      $('modalSubcategoriaTitle').textContent = 'Nueva Subcategoría';
      $('subcategoriaForm').reset();
      $('subcatActivo').checked = true;
      $('subcategoriaModal').classList.add('active');
    },
    
    closeSubcategoriaModal() {
      $('subcategoriaModal')?.classList.remove('active');
      state.editingId = null;
    },
    
    async submitSubcategoria(e) {
      e.preventDefault();
      const data = {
        nombre: $('subcatNombre').value.trim(),
        categoria_id: $('subcatCategoriaId').value,
        activo: $('subcatActivo').checked
      };
      
      try {
        if (state.editingId) {
          await api.updateSubcategoria(state.editingId, data);
          toast.success('Subcategoría actualizada');
        } else {
          await api.createSubcategoria(data);
          toast.success('Subcategoría creada');
        }
        this.closeSubcategoriaModal();
        await this.loadData();
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    // ===== MODALS IMPUESTO =====
    openImpuestoModal() {
      state.editingId = null;
      $('modalImpuestoTitle').textContent = 'Nuevo Impuesto';
      $('impuestoForm').reset();
      $('impActivo').checked = true;
      $('impuestoModal').classList.add('active');
    },
    
    closeImpuestoModal() {
      $('impuestoModal')?.classList.remove('active');
      state.editingId = null;
    },
    
    async submitImpuesto(e) {
      e.preventDefault();
      const tasaInput = parseFloat($('impTasa').value);
      const tasa = tasaInput > 1 ? tasaInput / 100 : tasaInput;
      
      const data = {
        nombre: $('impNombre').value.trim(),
        clave_sat: $('impClaveSat').value.trim() || null,
        tipo: $('impTipo').value,
        tasa: tasa,
        activo: $('impActivo').checked
      };
      
      try {
        if (state.editingId) {
          await api.updateImpuesto(state.editingId, data);
          toast.success('Impuesto actualizado');
        } else {
          await api.createImpuesto(data);
          toast.success('Impuesto creado');
        }
        this.closeImpuestoModal();
        await this.loadData();
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    // ===== MODALS MÉTODO DE PAGO =====
    openMetodoPagoModal() {
      state.editingId = null;
      $('modalMetodoPagoTitle').textContent = 'Nuevo Método de Pago';
      $('metodoPagoForm').reset();
      $('metActivo').checked = true;
      $('metodoPagoModal').classList.add('active');
    },
    
    closeMetodoPagoModal() {
      $('metodoPagoModal')?.classList.remove('active');
      state.editingId = null;
    },
    
    async submitMetodoPago(e) {
      e.preventDefault();
      const data = {
        nombre: $('metNombre').value.trim(),
        clave: $('metClave').value.trim() || null,
        descripcion: $('metDescripcion').value.trim() || null,
        activo: $('metActivo').checked
      };
      
      try {
        if (state.editingId) {
          await api.updateMetodoPago(state.editingId, data);
          toast.success('Método de pago actualizado');
        } else {
          await api.createMetodoPago(data);
          toast.success('Método de pago creado');
        }
        this.closeMetodoPagoModal();
        await this.loadData();
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    // ===== MODALS MONEDA =====
    openMonedaModal() {
      state.editingId = null;
      $('modalMonedaTitle').textContent = 'Nueva Moneda';
      $('monedaForm').reset();
      $('monActivo').checked = true;
      $('monedaModal').classList.add('active');
    },
    
    closeMonedaModal() {
      $('monedaModal')?.classList.remove('active');
      state.editingId = null;
    },
    
    async submitMoneda(e) {
      e.preventDefault();
      const data = {
        codigo: $('monCodigo').value.trim().toUpperCase(),
        nombre: $('monNombre').value.trim(),
        simbolo: $('monSimbolo').value.trim() || '$',
        decimales: parseInt($('monDecimales').value) || 2,
        es_default: $('monDefault').checked,
        activo: $('monActivo').checked
      };
      
      try {
        if (state.editingId) {
          await api.updateMoneda(state.editingId, data);
          toast.success('Moneda actualizada');
        } else {
          await api.createMoneda(data);
          toast.success('Moneda creada');
        }
        this.closeMonedaModal();
        await this.loadData();
      } catch (e) {
        toast.error(e.message);
      }
    },
    
    // ===== EDIT MODAL =====
    openEditModal(type, id) {
      state.editingId = id;
      
      if (type === 'categoria') {
        const item = state.categorias.find(c => c.id === id);
        if (!item) return;
        $('modalCategoriaTitle').textContent = 'Editar Categoría';
        $('catNombre').value = item.nombre;
        $('catTipo').value = item.tipo;
        $('catColor').value = item.color || '#6366f1';
        $('catActivo').checked = item.activo;
        $('categoriaModal').classList.add('active');
      }
      else if (type === 'subcategoria') {
        const item = state.subcategorias.find(s => s.id === id);
        if (!item) return;
        $('modalSubcategoriaTitle').textContent = 'Editar Subcategoría';
        $('subcatNombre').value = item.nombre;
        $('subcatCategoriaId').value = item.categoria_id;
        $('subcatActivo').checked = item.activo;
        $('subcategoriaModal').classList.add('active');
      }
      else if (type === 'impuesto') {
        const item = state.impuestos.find(i => i.id === id);
        if (!item) return;
        $('modalImpuestoTitle').textContent = 'Editar Impuesto';
        $('impNombre').value = item.nombre;
        $('impClaveSat').value = item.clave_sat || '';
        $('impTipo').value = item.tipo;
        $('impTasa').value = (item.tasa * 100).toFixed(2);
        $('impActivo').checked = item.activo;
        $('impuestoModal').classList.add('active');
      }
      else if (type === 'metodoPago') {
        const item = state.metodosPago.find(m => m.id === id);
        if (!item) return;
        $('modalMetodoPagoTitle').textContent = 'Editar Método de Pago';
        $('metNombre').value = item.nombre;
        $('metClave').value = item.clave || '';
        $('metDescripcion').value = item.descripcion || '';
        $('metActivo').checked = item.activo;
        $('metodoPagoModal').classList.add('active');
      }
      else if (type === 'moneda') {
        const item = state.monedas.find(m => m.id === id);
        if (!item) return;
        $('modalMonedaTitle').textContent = 'Editar Moneda';
        $('monCodigo').value = item.codigo;
        $('monNombre').value = item.nombre;
        $('monSimbolo').value = item.simbolo;
        $('monDecimales').value = item.decimales;
        $('monDefault').checked = item.es_default;
        $('monActivo').checked = item.activo;
        $('monedaModal').classList.add('active');
      }
    },
    
    // ===== DELETE MODAL =====
    openDeleteModal(type, id, name) {
      state.deletingId = id;
      state.deletingType = type;
      $('deleteItemName').textContent = name;
      $('deleteModal').classList.add('active');
    },
    
    closeDeleteModal() {
      $('deleteModal')?.classList.remove('active');
      state.deletingId = null;
      state.deletingType = null;
    },
    
    async confirmDelete() {
      const { deletingId, deletingType } = state;
      if (!deletingId || !deletingType) return;
      
      const btn = $('confirmDelete');
      btn.classList.add('loading');
      btn.disabled = true;
      
      try {
        if (deletingType === 'categoria') await api.deleteCategoria(deletingId);
        else if (deletingType === 'subcategoria') await api.deleteSubcategoria(deletingId);
        else if (deletingType === 'impuesto') await api.deleteImpuesto(deletingId);
        else if (deletingType === 'metodoPago') await api.deleteMetodoPago(deletingId);
        else if (deletingType === 'moneda') await api.deleteMoneda(deletingId);
        
        toast.success('Eliminado correctamente');
        this.closeDeleteModal();
        await this.loadData();
      } catch (e) {
        toast.error(e.message);
      } finally {
        btn.classList.remove('loading');
        btn.disabled = false;
      }
    },
    
    switchOrg() {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG);
      utils.redirect(CONFIG.REDIRECT.SELECT_ORG);
    }
  };

  // ========== INIT ==========
  function init() {
    if (!utils.getToken()) { utils.redirect(CONFIG.REDIRECT.LOGIN); return; }
    state.org = utils.getOrg();
    if (!state.org) { utils.redirect(CONFIG.REDIRECT.SELECT_ORG); return; }
    state.user = utils.getUser();
    
    render.user();
    render.org();
    render.tabs();
    
    // Sidebar
    $('menuToggle')?.addEventListener('click', () => handlers.toggleSidebar());
    $('sidebarClose')?.addEventListener('click', () => handlers.closeSidebar());
    $('sidebarOverlay')?.addEventListener('click', () => handlers.closeSidebar());
    $('orgSwitcher')?.addEventListener('click', () => handlers.switchOrg());
    
    // Tabs
    document.querySelectorAll('.tab-btn').forEach(btn => {
      btn.addEventListener('click', () => handlers.setTab(btn.dataset.tab));
    });
    
    // Botones agregar
    $('addCategoriaBtn')?.addEventListener('click', () => handlers.openCategoriaModal());
    $('addSubcategoriaBtn')?.addEventListener('click', () => handlers.openSubcategoriaModal());
    $('addImpuestoBtn')?.addEventListener('click', () => handlers.openImpuestoModal());
    $('addMetodoPagoBtn')?.addEventListener('click', () => handlers.openMetodoPagoModal());
    $('addMonedaBtn')?.addEventListener('click', () => handlers.openMonedaModal());
    
    // Modal Categoría
    $('closeCategoriaModal')?.addEventListener('click', () => handlers.closeCategoriaModal());
    $('cancelCategoriaModal')?.addEventListener('click', () => handlers.closeCategoriaModal());
    $('categoriaForm')?.addEventListener('submit', e => handlers.submitCategoria(e));
    $('categoriaModal')?.addEventListener('click', e => { if (e.target.id === 'categoriaModal') handlers.closeCategoriaModal(); });
    
    // Modal Subcategoría
    $('closeSubcategoriaModal')?.addEventListener('click', () => handlers.closeSubcategoriaModal());
    $('cancelSubcategoriaModal')?.addEventListener('click', () => handlers.closeSubcategoriaModal());
    $('subcategoriaForm')?.addEventListener('submit', e => handlers.submitSubcategoria(e));
    $('subcategoriaModal')?.addEventListener('click', e => { if (e.target.id === 'subcategoriaModal') handlers.closeSubcategoriaModal(); });
    
    // Modal Impuesto
    $('closeImpuestoModal')?.addEventListener('click', () => handlers.closeImpuestoModal());
    $('cancelImpuestoModal')?.addEventListener('click', () => handlers.closeImpuestoModal());
    $('impuestoForm')?.addEventListener('submit', e => handlers.submitImpuesto(e));
    $('impuestoModal')?.addEventListener('click', e => { if (e.target.id === 'impuestoModal') handlers.closeImpuestoModal(); });
    
    // Modal Método de Pago
    $('closeMetodoPagoModal')?.addEventListener('click', () => handlers.closeMetodoPagoModal());
    $('cancelMetodoPagoModal')?.addEventListener('click', () => handlers.closeMetodoPagoModal());
    $('metodoPagoForm')?.addEventListener('submit', e => handlers.submitMetodoPago(e));
    $('metodoPagoModal')?.addEventListener('click', e => { if (e.target.id === 'metodoPagoModal') handlers.closeMetodoPagoModal(); });
    
    // Modal Moneda
    $('closeMonedaModal')?.addEventListener('click', () => handlers.closeMonedaModal());
    $('cancelMonedaModal')?.addEventListener('click', () => handlers.closeMonedaModal());
    $('monedaForm')?.addEventListener('submit', e => handlers.submitMoneda(e));
    $('monedaModal')?.addEventListener('click', e => { if (e.target.id === 'monedaModal') handlers.closeMonedaModal(); });
    
    // Modal Delete
    $('closeDeleteModal')?.addEventListener('click', () => handlers.closeDeleteModal());
    $('cancelDeleteModal')?.addEventListener('click', () => handlers.closeDeleteModal());
    $('confirmDelete')?.addEventListener('click', () => handlers.confirmDelete());
    $('deleteModal')?.addEventListener('click', e => { if (e.target.id === 'deleteModal') handlers.closeDeleteModal(); });
    
    // Escape
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        handlers.closeCategoriaModal();
        handlers.closeSubcategoriaModal();
        handlers.closeImpuestoModal();
        handlers.closeMetodoPagoModal();
        handlers.closeMonedaModal();
        handlers.closeDeleteModal();
      }
    });
    
    handlers.loadData();
    console.log('🚀 TRUNO Catálogos v1');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
