/**
 * TRUNO - Bancos Module
 */

(function() {
  'use strict';

  const CONFIG = {
    API_URL: 'https://truno-9bbbe9cf4d78.herokuapp.com',
    STORAGE_KEYS: {
      TOKEN: 'truno_token',
      USER: 'truno_user',
      ORG: 'truno_org'
    },
    REDIRECT: {
      LOGIN: '/truno-front/login/login.html',
      SELECT_ORG: '/truno-front/organizaciones/seleccionar.html'
    }
  };

  const elements = {
    // Sidebar
    sidebar: document.getElementById('sidebar'),
    sidebarOverlay: document.getElementById('sidebarOverlay'),
    menuToggle: document.getElementById('menuToggle'),
    orgSwitcher: document.getElementById('orgSwitcher'),
    orgName: document.getElementById('orgName'),
    orgPlan: document.getElementById('orgPlan'),
    userAvatar: document.getElementById('userAvatar'),
    // Content
    accountsGrid: document.getElementById('accountsGrid'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    totalBalance: document.getElementById('totalBalance'),
    accountCount: document.getElementById('accountCount'),
    // Buttons
    addAccountBtn: document.getElementById('addAccountBtn'),
    addFirstAccountBtn: document.getElementById('addFirstAccountBtn'),
    fabBtn: document.getElementById('fabBtn'),
    // Account Modal
    accountModal: document.getElementById('accountModal'),
    accountForm: document.getElementById('accountForm'),
    modalTitle: document.getElementById('modalTitle'),
    closeModal: document.getElementById('closeModal'),
    cancelModal: document.getElementById('cancelModal'),
    submitModal: document.getElementById('submitModal'),
    accountName: document.getElementById('accountName'),
    accountBank: document.getElementById('accountBank'),
    accountNumber: document.getElementById('accountNumber'),
    accountClabe: document.getElementById('accountClabe'),
    accountCurrency: document.getElementById('accountCurrency'),
    accountBalance: document.getElementById('accountBalance'),
    accountNotes: document.getElementById('accountNotes'),
    // Adjust Modal
    adjustModal: document.getElementById('adjustModal'),
    adjustForm: document.getElementById('adjustForm'),
    closeAdjustModal: document.getElementById('closeAdjustModal'),
    cancelAdjustModal: document.getElementById('cancelAdjustModal'),
    currentBalance: document.getElementById('currentBalance'),
    newBalance: document.getElementById('newBalance'),
    adjustReason: document.getElementById('adjustReason'),
    // Delete Modal
    deleteModal: document.getElementById('deleteModal'),
    closeDeleteModal: document.getElementById('closeDeleteModal'),
    cancelDeleteModal: document.getElementById('cancelDeleteModal'),
    confirmDelete: document.getElementById('confirmDelete'),
    deleteAccountName: document.getElementById('deleteAccountName')
  };

  let state = {
    user: null,
    org: null,
    accounts: [],
    editingId: null,
    deletingId: null,
    adjustingId: null
  };

  // ============================================
  // UTILITIES
  // ============================================
  const utils = {
    getToken: () => localStorage.getItem(CONFIG.STORAGE_KEYS.TOKEN),
    getUser: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.USER) || 'null'),
    getOrg: () => JSON.parse(localStorage.getItem(CONFIG.STORAGE_KEYS.ORG) || 'null'),
    redirect: (url) => window.location.href = url,

    getInitials(nombre, apellido) {
      const n = nombre?.charAt(0).toUpperCase() || '';
      const a = apellido?.charAt(0).toUpperCase() || '';
      return n + a || '??';
    },

    formatMoney(amount, currency = 'MXN') {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: currency
      }).format(amount || 0);
    }
  };

  // ============================================
  // API
  // ============================================
  const api = {
    async request(endpoint, options = {}) {
      const response = await fetch(`${CONFIG.API_URL}${endpoint}`, {
        ...options,
        headers: {
          'Authorization': `Bearer ${utils.getToken()}`,
          'X-Organization-Id': state.org?.id,
          'Content-Type': 'application/json',
          ...options.headers
        }
      });

      if (response.status === 401) {
        utils.redirect(CONFIG.REDIRECT.LOGIN);
        return;
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error en la petición');
      }

      return data;
    },

    getAccounts() {
      return this.request('/api/cuentas-bancarias');
    },

    createAccount(data) {
      return this.request('/api/cuentas-bancarias', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    updateAccount(id, data) {
      return this.request(`/api/cuentas-bancarias/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },

    deleteAccount(id) {
      return this.request(`/api/cuentas-bancarias/${id}`, {
        method: 'DELETE'
      });
    },

    adjustBalance(id, data) {
      return this.request(`/api/cuentas-bancarias/${id}/ajustar`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    }
  };

  // ============================================
  // RENDER
  // ============================================
  const render = {
    user() {
      if (!state.user) return;
      elements.userAvatar.textContent = utils.getInitials(state.user.nombre, state.user.apellido);
    },

    org() {
      if (!state.org) return;
      elements.orgName.textContent = state.org.nombre;
      elements.orgPlan.textContent = `Plan ${state.org.plan || 'Free'}`;
    },

    accounts() {
      const { accounts } = state;

      // Hide loading
      elements.loadingState.style.display = 'none';

      if (!accounts.length) {
        elements.accountsGrid.style.display = 'none';
        elements.emptyState.style.display = 'block';
        elements.totalBalance.textContent = utils.formatMoney(0);
        elements.accountCount.textContent = '0';
        return;
      }

      elements.emptyState.style.display = 'none';
      elements.accountsGrid.style.display = 'grid';

      // Calculate total
      const total = accounts.reduce((sum, acc) => sum + parseFloat(acc.saldo_actual || 0), 0);
      elements.totalBalance.textContent = utils.formatMoney(total);
      elements.accountCount.textContent = accounts.length;

      // Render cards
      elements.accountsGrid.innerHTML = accounts.map(acc => {
        const balance = parseFloat(acc.saldo_actual || 0);
        const balanceClass = balance >= 0 ? 'positive' : 'negative';

        return `
          <div class="account-card" data-id="${acc.id}">
            <div class="account-header">
              <div class="account-icon">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2"/>
                  <line x1="1" y1="10" x2="23" y2="10"/>
                </svg>
              </div>
              <div class="account-menu">
                <button class="account-menu-btn" data-menu="${acc.id}">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/>
                  </svg>
                </button>
                <div class="account-dropdown" id="menu-${acc.id}">
                  <button class="account-dropdown-item" data-action="edit" data-id="${acc.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
                    </svg>
                    Editar
                  </button>
                  <button class="account-dropdown-item" data-action="adjust" data-id="${acc.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
                    </svg>
                    Ajustar Saldo
                  </button>
                  <button class="account-dropdown-item" data-action="transactions" data-id="${acc.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/>
                    </svg>
                    Ver Movimientos
                  </button>
                  <button class="account-dropdown-item danger" data-action="delete" data-id="${acc.id}">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                      <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>
                    </svg>
                    Eliminar
                  </button>
                </div>
              </div>
            </div>
            <div class="account-name">${acc.nombre}</div>
            <div class="account-bank">${acc.nombre_banco || 'Sin banco asignado'}</div>
            <div class="account-balance-label">Saldo Actual</div>
            <div class="account-balance ${balanceClass}">${utils.formatMoney(balance, acc.moneda || 'MXN')}</div>
            <div class="account-footer">
              <span>${acc.moneda || 'MXN'}</span>
              <span>${acc.total_transacciones || 0} movimientos</span>
            </div>
          </div>
        `;
      }).join('');

      // Add event listeners to menus
      document.querySelectorAll('.account-menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handlers.toggleAccountMenu(btn.dataset.menu);
        });
      });

      // Add event listeners to dropdown items
      document.querySelectorAll('.account-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.dataset.action;
          const id = item.dataset.id;
          handlers.handleAccountAction(action, id);
        });
      });

      // Click on card goes to transactions
      document.querySelectorAll('.account-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.account-menu')) {
            const id = card.dataset.id;
            utils.redirect(`../transacciones/index.html?cuenta_id=${id}`);
          }
        });
      });
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handlers = {
    async loadAccounts() {
      try {
        const data = await api.getAccounts();
        state.accounts = data.cuentas || [];
        render.accounts();
      } catch (error) {
        console.error('Error loading accounts:', error);
        elements.loadingState.innerHTML = `
          <div class="empty-state-icon">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
          </div>
          <h3>Error al cargar cuentas</h3>
          <p>${error.message}</p>
        `;
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

    toggleAccountMenu(id) {
      // Close all menus first
      document.querySelectorAll('.account-dropdown').forEach(menu => {
        if (menu.id !== `menu-${id}`) {
          menu.classList.remove('active');
        }
      });
      // Toggle this menu
      const menu = document.getElementById(`menu-${id}`);
      menu.classList.toggle('active');
    },

    closeAllMenus() {
      document.querySelectorAll('.account-dropdown').forEach(menu => {
        menu.classList.remove('active');
      });
    },

    handleAccountAction(action, id) {
      this.closeAllMenus();
      const account = state.accounts.find(a => a.id === id);

      switch (action) {
        case 'edit':
          this.openEditModal(account);
          break;
        case 'adjust':
          this.openAdjustModal(account);
          break;
        case 'transactions':
          utils.redirect(`../transacciones/index.html?cuenta_id=${id}`);
          break;
        case 'delete':
          this.openDeleteModal(account);
          break;
      }
    },

    // Account Modal
    openCreateModal() {
      state.editingId = null;
      elements.modalTitle.textContent = 'Nueva Cuenta';
      elements.accountForm.reset();
      elements.accountBalance.disabled = false;
      elements.accountBalance.parentElement.style.display = 'block';
      elements.accountModal.classList.add('active');
      elements.accountName.focus();
    },

    openEditModal(account) {
      state.editingId = account.id;
      elements.modalTitle.textContent = 'Editar Cuenta';
      elements.accountName.value = account.nombre || '';
      elements.accountBank.value = account.nombre_banco || '';
      elements.accountNumber.value = account.numero_cuenta || '';
      elements.accountClabe.value = account.clabe || '';
      elements.accountCurrency.value = account.moneda || 'MXN';
      elements.accountBalance.value = '';
      elements.accountBalance.disabled = true;
      elements.accountBalance.parentElement.style.display = 'none';
      elements.accountNotes.value = account.notas || '';
      elements.accountModal.classList.add('active');
      elements.accountName.focus();
    },

    closeAccountModal() {
      elements.accountModal.classList.remove('active');
      elements.accountForm.reset();
      state.editingId = null;
    },

    async submitAccount(e) {
      e.preventDefault();

      const data = {
        nombre: elements.accountName.value.trim(),
        nombre_banco: elements.accountBank.value.trim() || null,
        numero_cuenta: elements.accountNumber.value.trim() || null,
        clabe: elements.accountClabe.value.trim() || null,
        moneda: elements.accountCurrency.value,
        notas: elements.accountNotes.value.trim() || null
      };

      if (!state.editingId) {
        data.saldo_inicial = parseFloat(elements.accountBalance.value) || 0;
      }

      elements.submitModal.classList.add('loading');
      elements.submitModal.disabled = true;

      try {
        if (state.editingId) {
          await api.updateAccount(state.editingId, data);
        } else {
          await api.createAccount(data);
        }

        this.closeAccountModal();
        await this.loadAccounts();
      } catch (error) {
        alert(error.message);
      } finally {
        elements.submitModal.classList.remove('loading');
        elements.submitModal.disabled = false;
      }
    },

    // Adjust Modal
    openAdjustModal(account) {
      state.adjustingId = account.id;
      elements.currentBalance.value = utils.formatMoney(account.saldo_actual, account.moneda);
      elements.newBalance.value = '';
      elements.adjustReason.value = '';
      elements.adjustModal.classList.add('active');
      elements.newBalance.focus();
    },

    closeAdjustModal() {
      elements.adjustModal.classList.remove('active');
      elements.adjustForm.reset();
      state.adjustingId = null;
    },

    async submitAdjust(e) {
      e.preventDefault();

      const data = {
        nuevo_saldo: parseFloat(elements.newBalance.value),
        motivo: elements.adjustReason.value.trim()
      };

      elements.submitAdjust.classList.add('loading');
      elements.submitAdjust.disabled = true;

      try {
        await api.adjustBalance(state.adjustingId, data);
        this.closeAdjustModal();
        await this.loadAccounts();
      } catch (error) {
        alert(error.message);
      } finally {
        elements.submitAdjust.classList.remove('loading');
        elements.submitAdjust.disabled = false;
      }
    },

    // Delete Modal
    openDeleteModal(account) {
      state.deletingId = account.id;
      elements.deleteAccountName.textContent = account.nombre;
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
        await api.deleteAccount(state.deletingId);
        this.closeDeleteModal();
        await this.loadAccounts();
      } catch (error) {
        alert(error.message);
      } finally {
        elements.confirmDelete.classList.remove('loading');
        elements.confirmDelete.disabled = false;
      }
    },

    switchOrg() {
      localStorage.removeItem(CONFIG.STORAGE_KEYS.ORG);
      utils.redirect(CONFIG.REDIRECT.SELECT_ORG);
    }
  };

  // ============================================
  // INIT
  // ============================================
  function init() {
    // Check auth
    if (!utils.getToken()) {
      utils.redirect(CONFIG.REDIRECT.LOGIN);
      return;
    }

    state.org = utils.getOrg();
    if (!state.org) {
      utils.redirect(CONFIG.REDIRECT.SELECT_ORG);
      return;
    }

    state.user = utils.getUser();

    render.user();
    render.org();

    // Event listeners
    elements.menuToggle.addEventListener('click', handlers.toggleSidebar.bind(handlers));
    elements.sidebarOverlay.addEventListener('click', handlers.closeSidebar.bind(handlers));
    elements.orgSwitcher.addEventListener('click', handlers.switchOrg.bind(handlers));

    // Add account buttons
    elements.addAccountBtn.addEventListener('click', handlers.openCreateModal.bind(handlers));
    elements.addFirstAccountBtn.addEventListener('click', handlers.openCreateModal.bind(handlers));
    elements.fabBtn.addEventListener('click', handlers.openCreateModal.bind(handlers));

    // Account modal
    elements.closeModal.addEventListener('click', handlers.closeAccountModal.bind(handlers));
    elements.cancelModal.addEventListener('click', handlers.closeAccountModal.bind(handlers));
    elements.accountForm.addEventListener('submit', handlers.submitAccount.bind(handlers));
    elements.accountModal.addEventListener('click', (e) => {
      if (e.target === elements.accountModal) handlers.closeAccountModal();
    });

    // Adjust modal
    elements.closeAdjustModal.addEventListener('click', handlers.closeAdjustModal.bind(handlers));
    elements.cancelAdjustModal.addEventListener('click', handlers.closeAdjustModal.bind(handlers));
    elements.adjustForm.addEventListener('submit', handlers.submitAdjust.bind(handlers));
    elements.adjustModal.addEventListener('click', (e) => {
      if (e.target === elements.adjustModal) handlers.closeAdjustModal();
    });

    // Delete modal
    elements.closeDeleteModal.addEventListener('click', handlers.closeDeleteModal.bind(handlers));
    elements.cancelDeleteModal.addEventListener('click', handlers.closeDeleteModal.bind(handlers));
    elements.confirmDelete.addEventListener('click', handlers.confirmDelete.bind(handlers));
    elements.deleteModal.addEventListener('click', (e) => {
      if (e.target === elements.deleteModal) handlers.closeDeleteModal();
    });

    // Close menus on click outside
    document.addEventListener('click', (e) => {
      if (!e.target.closest('.account-menu')) {
        handlers.closeAllMenus();
      }
    });

    // ESC key closes modals
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape') {
        handlers.closeAccountModal();
        handlers.closeAdjustModal();
        handlers.closeDeleteModal();
        handlers.closeAllMenus();
      }
    });

    // Load data
    handlers.loadAccounts();

    console.log('🚀 TRUNO Bancos initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
