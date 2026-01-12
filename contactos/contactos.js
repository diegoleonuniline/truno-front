/**
 * TRUNO - Contactos Module v2
 * Mobile-First optimizado
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

  const elements = {
    sidebar: $('sidebar'),
    sidebarOverlay: $('sidebarOverlay'),
    sidebarClose: $('sidebarClose'),
    menuToggle: $('menuToggle'),
    orgSwitcher: $('orgSwitcher'),
    orgName: $('orgName'),
    orgPlan: $('orgPlan'),
    userAvatar: $('userAvatar'),
    totalContactos: $('totalContactos'),
    totalClientes: $('totalClientes'),
    totalProveedores: $('totalProveedores'),
    totalAmbos: $('totalAmbos'),
    searchInput: $('searchInput'),
    filterType: $('filterType'),
    contactsGrid: $('contactsGrid'),
    tableContainer: $('tableContainer'),
    tableBody: $('tableBody'),
    viewToggle: $('viewToggle'),
    emptyState: $('emptyState'),
    addContactBtn: $('addContactBtn'),
    addFirstContactBtn: $('addFirstContactBtn'),
    fabBtn: $('fabBtn'),
    contactModal: $('contactModal'),
    contactForm: $('contactForm'),
    modalTitle: $('modalTitle'),
    closeModal: $('closeModal'),
    cancelModal: $('cancelModal'),
    submitModal: $('submitModal'),
    nombre: $('nombre'),
    tipo: $('tipo'),
    email: $('email'),
    telefono: $('telefono'),
    empresa: $('empresa'),
    rfc: $('rfc'),
    codigoPostal: $('codigoPostal'),
    direccion: $('direccion'),
    notas: $('notas'),
    deleteModal: $('deleteModal'),
    closeDeleteModal: $('closeDeleteModal'),
    cancelDeleteModal: $('cancelDeleteModal'),
    confirmDelete: $('confirmDelete'),
    deleteContactName: $('deleteContactName'),
    toastContainer: $('toastContainer')
  };

  let state = {
    user: null, org: null, contactos: [], allContactos: [],
    editingId: null, deletingId: null, currentView: 'cards',
    filters: { buscar: '', tipo: '' }
  };

  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: (url) => window.location.href = url,
    getInitials(n, a) { return (n?.charAt(0).toUpperCase() || '') + (a?.charAt(0).toUpperCase() || n?.charAt(1)?.toUpperCase() || '') || '??'; },
    debounce(fn, delay) { let t; return (...a) => { clearTimeout(t); t = setTimeout(() => fn(...a), delay); }; }
  };

  const toast = {
    show(message, type = 'info') {
      const container = elements.toastContainer;
      if (!container) return;
      const icons = {
        success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>',
        error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>',
        warning: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>',
        info: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>'
      };
      const t = document.createElement('div');
      t.className = `toast toast-${type}`;
      t.innerHTML = `<div class="toast-icon">${icons[type]}</div><div class="toast-message">${message}</div><button class="toast-close"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg></button>`;
      container.appendChild(t);
      setTimeout(() => t.classList.add('show'), 10);
      const close = () => { t.classList.remove('show'); t.classList.add('hide'); setTimeout(() => t.remove(), 300); };
      t.querySelector('.toast-close').addEventListener('click', close);
      setTimeout(close, 4000);
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
    getContactos(p = {}) {
      const q = new URLSearchParams({ limite: 200, ...(p.buscar && { buscar: p.buscar }), ...(p.tipo && { tipo: p.tipo }) });
      return this.request(`/api/contactos?${q}`);
    },
    createContacto(d) { return this.request('/api/contactos', { method: 'POST', body: JSON.stringify(d) }); },
    updateContacto(id, d) { return this.request(`/api/contactos/${id}`, { method: 'PUT', body: JSON.stringify(d) }); },
    deleteContacto(id) { return this.request(`/api/contactos/${id}`, { method: 'DELETE' }); }
  };

  const render = {
    user() { if (state.user) elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido); },
    org() { if (state.org) { elements.orgName.textContent = state.org.nombre; elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`; } },
    stats() {
      const all = state.allContactos;
      elements.totalContactos.textContent = all.length;
      elements.totalClientes.textContent = all.filter(c => c.tipo === 'cliente').length;
      elements.totalProveedores.textContent = all.filter(c => c.tipo === 'proveedor').length;
      elements.totalAmbos.textContent = all.filter(c => c.tipo === 'ambos').length;
    },
    contactos() {
      const { contactos, currentView } = state;
      if (!contactos.length) {
        elements.contactsGrid.style.display = 'none';
        elements.tableContainer.style.display = 'none';
        elements.emptyState.style.display = 'block';
        return;
      }
      elements.emptyState.style.display = 'none';

      if (currentView === 'table') {
        elements.contactsGrid.style.display = 'none';
        elements.tableContainer.style.display = 'block';
        this.contactosTable();
      } else {
        elements.contactsGrid.style.display = '';
        elements.tableContainer.style.display = 'none';
        this.contactosCards();
      }
    },
    contactosCards() {
      const { contactos } = state;
      const typeLabels = { cliente: 'Cliente', proveedor: 'Proveedor', ambos: 'Ambos' };

      elements.contactsGrid.innerHTML = contactos.map(c => `
        <div class="contact-card" data-id="${c.id}">
          <div class="contact-header">
            <div class="contact-avatar ${c.tipo}">${utils.getInitials(c.nombre)}</div>
            <div class="contact-info">
              <div class="contact-name">${c.nombre}</div>
              ${c.empresa ? `<div class="contact-company">${c.empresa}</div>` : ''}
            </div>
            <span class="contact-type ${c.tipo}">${typeLabels[c.tipo] || c.tipo}</span>
          </div>
          <div class="contact-details">
            ${c.email ? `<div class="contact-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>${c.email}</div>` : ''}
            ${c.telefono ? `<div class="contact-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/></svg>${c.telefono}</div>` : ''}
            ${c.rfc ? `<div class="contact-detail"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>${c.rfc}</div>` : ''}
          </div>
          <div class="contact-actions">
            <button class="action-btn" title="Editar" data-action="edit" data-id="${c.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg></button>
            <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${c.id}"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
          </div>
        </div>
      `).join('');

      elements.contactsGrid.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); handlers.handleAction(b.dataset.action, b.dataset.id); }));
    },
    contactosTable() {
      const { contactos } = state;
      const typeLabels = { cliente: 'Cliente', proveedor: 'Proveedor', ambos: 'Ambos' };

      elements.tableBody.innerHTML = contactos.map(c => `
        <tr data-id="${c.id}">
          <td><div class="cell-main">${c.nombre}</div>${c.empresa ? `<div class="cell-sub">${c.empresa}</div>` : ''}</td>
          <td><span class="contact-type ${c.tipo}">${typeLabels[c.tipo] || c.tipo}</span></td>
          <td>${c.email || '-'}</td>
          <td>${c.telefono || '-'}</td>
          <td>${c.rfc || '-'}</td>
          <td>
            <div class="table-actions">
              <button class="action-btn" title="Editar" data-action="edit" data-id="${c.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${c.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `).join('');

      elements.tableBody.querySelectorAll('[data-action]').forEach(b => b.addEventListener('click', e => { e.stopPropagation(); handlers.handleAction(b.dataset.action, b.dataset.id); }));
    }
  };

  const handlers = {
    async loadData() {
      try {
        const data = await api.getContactos();
        state.allContactos = data.contactos || [];
        this.applyLocalFilters();
        render.stats();
      } catch (e) { console.error('Error:', e); toast.show('Error cargando datos', 'error'); }
    },
    applyLocalFilters() {
      let filtered = [...state.allContactos];
      if (state.filters.tipo) filtered = filtered.filter(c => c.tipo === state.filters.tipo);
      if (state.filters.buscar) {
        const q = state.filters.buscar.toLowerCase();
        filtered = filtered.filter(c => 
          c.nombre?.toLowerCase().includes(q) ||
          c.email?.toLowerCase().includes(q) ||
          c.telefono?.includes(q) ||
          c.empresa?.toLowerCase().includes(q) ||
          c.rfc?.toLowerCase().includes(q)
        );
      }
      state.contactos = filtered;
      render.contactos();
    },
    toggleSidebar() { elements.sidebar.classList.toggle('open'); elements.sidebarOverlay.classList.toggle('active'); },
    closeSidebar() { elements.sidebar.classList.remove('open'); elements.sidebarOverlay.classList.remove('active'); },
    handleAction(action, id) {
      const c = state.allContactos.find(x => x.id === id);
      if (action === 'edit') this.openEditModal(c);
      else if (action === 'delete') this.openDeleteModal(c);
    },
    openCreateModal() {
      state.editingId = null;
      elements.modalTitle.textContent = 'Nuevo Contacto';
      elements.contactForm.reset();
      elements.tipo.value = 'cliente';
      elements.contactModal.classList.add('active');
      setTimeout(() => elements.nombre.focus(), 100);
    },
    openEditModal(c) {
      state.editingId = c.id;
      elements.modalTitle.textContent = 'Editar Contacto';
      elements.nombre.value = c.nombre || '';
      elements.tipo.value = c.tipo || 'cliente';
      elements.email.value = c.email || '';
      elements.telefono.value = c.telefono || '';
      elements.empresa.value = c.empresa || '';
      elements.rfc.value = c.rfc || '';
      elements.codigoPostal.value = c.codigo_postal || '';
      elements.direccion.value = c.direccion || '';
      elements.notas.value = c.notas || '';
      elements.contactModal.classList.add('active');
    },
    closeContactModal() { elements.contactModal.classList.remove('active'); elements.contactForm.reset(); state.editingId = null; },
    async submitContact(e) {
      e.preventDefault();
      const d = {
        nombre: elements.nombre.value.trim(),
        tipo: elements.tipo.value,
        email: elements.email.value.trim() || null,
        telefono: elements.telefono.value.trim() || null,
        empresa: elements.empresa.value.trim() || null,
        rfc: elements.rfc.value.trim().toUpperCase() || null,
        codigo_postal: elements.codigoPostal.value.trim() || null,
        direccion: elements.direccion.value.trim() || null,
        notas: elements.notas.value.trim() || null
      };
      elements.submitModal.classList.add('loading'); elements.submitModal.disabled = true;
      try {
        if (state.editingId) await api.updateContacto(state.editingId, d); else await api.createContacto(d);
        this.closeContactModal(); await this.loadData();
        toast.show(state.editingId ? 'Contacto actualizado' : 'Contacto creado', 'success');
      } catch (e) { toast.show(e.message, 'error'); }
      finally { elements.submitModal.classList.remove('loading'); elements.submitModal.disabled = false; }
    },
    openDeleteModal(c) { state.deletingId = c.id; elements.deleteContactName.textContent = c.nombre; elements.deleteModal.classList.add('active'); },
    closeDeleteModal() { elements.deleteModal.classList.remove('active'); state.deletingId = null; },
    async confirmDelete() {
      elements.confirmDelete.classList.add('loading'); elements.confirmDelete.disabled = true;
      try { await api.deleteContacto(state.deletingId); this.closeDeleteModal(); await this.loadData(); toast.show('Contacto eliminado', 'success'); }
      catch (e) { toast.show(e.message, 'error'); }
      finally { elements.confirmDelete.classList.remove('loading'); elements.confirmDelete.disabled = false; }
    },
    applyFilters() {
      state.filters.buscar = elements.searchInput.value.trim();
      state.filters.tipo = elements.filterType.value;
      this.applyLocalFilters();
    },
    switchOrg() { localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG); utils.redirect(CONFIG.REDIRECT.SELECT_ORG); },
    switchView(view) {
      state.currentView = view;
      elements.viewToggle?.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
      });
      render.contactos();
    }
  };

  function init() {
    if (!utils.getToken()) { utils.redirect(CONFIG.REDIRECT.LOGIN); return; }
    state.org = utils.getOrg(); if (!state.org) { utils.redirect(CONFIG.REDIRECT.SELECT_ORG); return; }
    state.user = utils.getUser(); render.user(); render.org();

    // Sidebar
    elements.menuToggle?.addEventListener('click', () => handlers.toggleSidebar());
    elements.sidebarClose?.addEventListener('click', () => handlers.closeSidebar());
    elements.sidebarOverlay?.addEventListener('click', () => handlers.closeSidebar());
    elements.orgSwitcher?.addEventListener('click', () => handlers.switchOrg());

    // Add buttons
    elements.addContactBtn?.addEventListener('click', () => handlers.openCreateModal());
    elements.addFirstContactBtn?.addEventListener('click', () => handlers.openCreateModal());
    elements.fabBtn?.addEventListener('click', () => handlers.openCreateModal());

    // View toggle
    elements.viewToggle?.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => handlers.switchView(btn.dataset.view));
    });

    // Contact modal
    elements.closeModal?.addEventListener('click', () => handlers.closeContactModal());
    elements.cancelModal?.addEventListener('click', () => handlers.closeContactModal());
    elements.contactForm?.addEventListener('submit', e => handlers.submitContact(e));
    elements.contactModal?.addEventListener('click', e => { if (e.target === elements.contactModal) handlers.closeContactModal(); });

    // Delete modal
    elements.closeDeleteModal?.addEventListener('click', () => handlers.closeDeleteModal());
    elements.cancelDeleteModal?.addEventListener('click', () => handlers.closeDeleteModal());
    elements.confirmDelete?.addEventListener('click', () => handlers.confirmDelete());
    elements.deleteModal?.addEventListener('click', e => { if (e.target === elements.deleteModal) handlers.closeDeleteModal(); });

    // Filters
    const df = utils.debounce(() => handlers.applyFilters(), 300);
    elements.searchInput?.addEventListener('input', df);
    elements.filterType?.addEventListener('change', () => handlers.applyFilters());

    // ESC key
    document.addEventListener('keydown', e => {
      if (e.key === 'Escape') {
        handlers.closeContactModal();
        handlers.closeDeleteModal();
      }
    });

    handlers.loadData();
    console.log('🚀 TRUNO Contactos v2 - Mobile First');
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
