/**
 * TRUNO - Bancos Module
 * Soporta: Cuentas Bancarias, Efectivo y Tarjetas de Crédito
 */

(function() {
  'use strict';

  const CONFIG = window.TRUNO_CONFIG || {
    API_URL: 'http://localhost:3000',
    STORAGE_KEYS: {
      TOKEN: 'truno_token',
      USER: 'truno_user',
      ORG: 'truno_org'
    },
    REDIRECT: {
      LOGIN: '/login/login.html',
      SELECT_ORG: '/organizaciones/seleccionar.html'
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
    tableContainer: document.getElementById('tableContainer'),
    tableBody: document.getElementById('tableBody'),
    viewToggle: document.getElementById('viewToggle'),
    loadingState: document.getElementById('loadingState'),
    emptyState: document.getElementById('emptyState'),
    totalBalance: document.getElementById('totalBalance'),
    accountCount: document.getElementById('accountCount'),
    // Plataformas
    platformsSection: document.getElementById('platformsSection'),
    platformsGrid: document.getElementById('platformsGrid'),
    platformTotal: document.getElementById('platformTotal'),
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
    accountType: document.getElementById('accountType'),
    accountName: document.getElementById('accountName'),
    accountBank: document.getElementById('accountBank'),
    accountNumber: document.getElementById('accountNumber'),
    accountClabe: document.getElementById('accountClabe'),
    accountCurrency: document.getElementById('accountCurrency'),
    accountBalance: document.getElementById('accountBalance'),
    accountNotes: document.getElementById('accountNotes'),
    // Campos de Tarjeta de Crédito
    creditCardFields: document.getElementById('creditCardFields'),
    accountLimit: document.getElementById('accountLimit'),
    accountCutoffDay: document.getElementById('accountCutoffDay'),
    accountPaymentDay: document.getElementById('accountPaymentDay'),
    // Grupos condicionales
    bankGroup: document.getElementById('bankGroup'),
    accountNumbersGroup: document.getElementById('accountNumbersGroup'),
    balanceGroup: document.getElementById('balanceGroup'),
    balanceLabel: document.getElementById('balanceLabel'),
    balanceHint: document.getElementById('balanceHint'),
    // Moneda rápida
    addCurrencyQuickBtn: document.getElementById('addCurrencyQuickBtn'),
    quickMonedaModal: document.getElementById('quickMonedaModal'),
    quickMonedaForm: document.getElementById('quickMonedaForm'),
    closeQuickMonedaModal: document.getElementById('closeQuickMonedaModal'),
    cancelQuickMonedaModal: document.getElementById('cancelQuickMonedaModal'),
    submitQuickMoneda: document.getElementById('submitQuickMoneda'),
    quickMonCodigo: document.getElementById('quickMonCodigo'),
    quickMonNombre: document.getElementById('quickMonNombre'),
    quickMonSimbolo: document.getElementById('quickMonSimbolo'),
    quickMonDecimales: document.getElementById('quickMonDecimales'),
    quickMonDefault: document.getElementById('quickMonDefault'),
    quickMonActivo: document.getElementById('quickMonActivo'),
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
    monedas: [],
    monedasLoaded: false,
    plataformas: [],
    plataformasSaldos: [],
    editingId: null,
    deletingId: null,
    adjustingId: null,
    currentView: 'cards'
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
    },

    getMonedas() {
      return this.request('/api/monedas');
    },

    createMoneda(data) {
      return this.request('/api/monedas', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },

    getPlataformas() {
      return this.request('/api/plataformas?activo=1');
    },

    getPlataformasSaldos() {
      return this.request('/api/transacciones/plataformas/saldos');
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
      const { accounts, currentView } = state;

      elements.loadingState.style.display = 'none';

      if (!accounts.length) {
        elements.accountsGrid.style.display = 'none';
        elements.tableContainer.style.display = 'none';
        elements.emptyState.style.display = 'block';
        elements.totalBalance.textContent = utils.formatMoney(0);
        elements.accountCount.textContent = '0';
        return;
      }

      elements.emptyState.style.display = 'none';

      // Calcular total: bancarias y efectivo suman, TC resta (es deuda)
      const total = accounts.reduce((sum, acc) => {
        const saldo = parseFloat(acc.saldo_actual || 0);
        if (acc.tipo === 'tarjeta_credito') {
          // TC: el saldo es deuda, restamos del disponible
          return sum - saldo;
        }
        return sum + saldo;
      }, 0);

      elements.totalBalance.textContent = utils.formatMoney(total);
      elements.accountCount.textContent = accounts.length;

      if (currentView === 'table') {
        elements.accountsGrid.style.display = 'none';
        elements.tableContainer.style.display = 'block';
        this.accountsTable();
      } else {
        elements.accountsGrid.style.display = 'grid';
        elements.tableContainer.style.display = 'none';
        this.accountsCards();
      }
    },

    plataformas() {
      if (!elements.platformsSection || !elements.platformsGrid || !elements.platformTotal) return;

      const plataformas = Array.isArray(state.plataformas) ? state.plataformas : [];
      const saldos = Array.isArray(state.plataformasSaldos) ? state.plataformasSaldos : [];

      const saldoByName = new Map();
      saldos.forEach(r => {
        const key = String(r.plataforma_origen || '').trim();
        if (!key) return;
        saldoByName.set(key, parseFloat(r.total) || 0);
      });

      const rows = plataformas
        .filter(p => p && p.activo !== false)
        .map(p => {
          const nombre = p.nombre || '';
          return {
            nombre,
            total: saldoByName.get(nombre) || 0
          };
        })
        .sort((a, b) => (b.total - a.total) || String(a.nombre).localeCompare(String(b.nombre)));

      const total = rows.reduce((sum, r) => sum + (parseFloat(r.total) || 0), 0);
      elements.platformTotal.textContent = utils.formatMoney(total);

      elements.platformsSection.style.display = rows.length ? 'block' : 'none';

      elements.platformsGrid.innerHTML = rows.map(r => `
        <div class="platform-card">
          <div class="platform-card-header">
            <div class="platform-name">${r.nombre || 'Sin nombre'}</div>
            <div class="platform-balance">${utils.formatMoney(r.total)}</div>
          </div>
          <div class="platform-meta">Ingresos en tránsito (pendientes de caer al banco)</div>
        </div>
      `).join('');
    },

    accountsCards() {
      const { accounts } = state;

      // Configuración visual por tipo
      const tipoConfig = {
        bancaria: {
          label: 'Cuenta Bancaria',
          icon: `<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/>`,
          iconBg: 'var(--info-bg)',
          iconColor: 'var(--info)'
        },
        efectivo: {
          label: 'Efectivo',
          icon: `<rect x="2" y="4" width="20" height="16" rx="2"/><line x1="6" y1="12" x2="6" y2="12.01"/><line x1="12" y1="12" x2="18" y2="12"/>`,
          iconBg: 'var(--success-bg)',
          iconColor: 'var(--success)'
        },
        tarjeta_credito: {
          label: 'Tarjeta de Crédito',
          icon: `<rect x="1" y="4" width="22" height="16" rx="2" ry="2"/><line x1="1" y1="10" x2="23" y2="10"/><circle cx="7" cy="15" r="1.5"/>`,
          iconBg: 'var(--warning-bg)',
          iconColor: 'var(--warning)'
        }
      };

      elements.accountsGrid.innerHTML = accounts.map(acc => {
        const balance = parseFloat(acc.saldo_actual || 0);
        const tipo = acc.tipo || 'bancaria';
        const isTC = tipo === 'tarjeta_credito';
        const config = tipoConfig[tipo] || tipoConfig.bancaria;

        // Para TC: saldo > 0 = deuda (rojo), 0 = limpio (verde)
        // Para otras: positivo = bien, negativo = mal
        const balanceClass = isTC
          ? (balance > 0 ? 'negative' : 'positive')
          : (balance >= 0 ? 'positive' : 'negative');

        const limite = parseFloat(acc.limite_credito || 0);
        const disponible = isTC ? limite - balance : null;

        return `
          <div class="account-card" data-id="${acc.id}">
            <div class="account-header">
              <div class="account-icon" style="background:${config.iconBg};color:${config.iconColor};">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  ${config.icon}
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
            <div class="account-bank">${acc.nombre_banco || config.label}</div>
            <div class="account-balance-label">${isTC ? 'Deuda Actual' : 'Saldo Actual'}</div>
            <div class="account-balance ${balanceClass}">${utils.formatMoney(Math.abs(balance), acc.moneda || 'MXN')}</div>
            ${isTC ? `
              <div class="account-credit-info">
                <div class="credit-row">
                  <span>Disponible</span>
                  <span class="credit-available">${utils.formatMoney(disponible, acc.moneda || 'MXN')}</span>
                </div>
                <div class="credit-row">
                  <span>Límite</span>
                  <span>${utils.formatMoney(limite, acc.moneda || 'MXN')}</span>
                </div>
                ${acc.fecha_corte ? `<div class="credit-row"><span>Corte día</span><span>${acc.fecha_corte}</span></div>` : ''}
                ${acc.fecha_pago ? `<div class="credit-row"><span>Pago día</span><span>${acc.fecha_pago}</span></div>` : ''}
              </div>
            ` : ''}
            <div class="account-footer">
              <span>${acc.moneda || 'MXN'}</span>
              <span>${acc.total_transacciones || 0} movimientos</span>
            </div>
          </div>
        `;
      }).join('');

      // Event listeners para menús
      document.querySelectorAll('.account-menu-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handlers.toggleAccountMenu(btn.dataset.menu);
        });
      });

      document.querySelectorAll('.account-dropdown-item').forEach(item => {
        item.addEventListener('click', (e) => {
          e.stopPropagation();
          const action = item.dataset.action;
          const id = item.dataset.id;
          handlers.handleAccountAction(action, id);
        });
      });

      document.querySelectorAll('.account-card').forEach(card => {
        card.addEventListener('click', (e) => {
          if (!e.target.closest('.account-menu')) {
            const id = card.dataset.id;
            utils.redirect(`../transacciones/index.html?cuenta_id=${id}`);
          }
        });
      });
    },

    accountsTable() {
      const { accounts } = state;

      const tipoLabels = {
        bancaria: 'Bancaria',
        efectivo: 'Efectivo',
        tarjeta_credito: 'T. Crédito'
      };

      elements.tableBody.innerHTML = accounts.map(acc => {
        const balance = parseFloat(acc.saldo_actual || 0);
        const tipo = acc.tipo || 'bancaria';
        const isTC = tipo === 'tarjeta_credito';

        const balanceClass = isTC
          ? (balance > 0 ? 'negative' : 'positive')
          : (balance >= 0 ? 'positive' : 'negative');

        return `<tr data-id="${acc.id}">
          <td><div class="cell-main">${acc.nombre}</div></td>
          <td><span class="tipo-badge tipo-${tipo}">${tipoLabels[tipo]}</span></td>
          <td>${acc.nombre_banco || '-'}</td>
          <td>${acc.numero_cuenta || '-'}</td>
          <td style="text-align:right;">
            <span class="balance-value ${balanceClass}">
              ${isTC ? '-' : ''}${utils.formatMoney(Math.abs(balance), acc.moneda || 'MXN')}
            </span>
          </td>
          <td>
            <div class="table-actions">
              <button class="action-btn" title="Editar" data-action="edit" data-id="${acc.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="action-btn" title="Ajustar Saldo" data-action="adjust" data-id="${acc.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
              </button>
              <button class="action-btn danger" title="Eliminar" data-action="delete" data-id="${acc.id}">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>`;
      }).join('');

      elements.tableBody.querySelectorAll('[data-action]').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          handlers.handleAccountAction(btn.dataset.action, btn.dataset.id);
        });
      });

      elements.tableBody.querySelectorAll('tr').forEach(row => {
        row.addEventListener('click', (e) => {
          if (!e.target.closest('.table-actions')) {
            utils.redirect(`../transacciones/index.html?cuenta_id=${row.dataset.id}`);
          }
        });
      });
    },

    currencies(keepValue = null) {
      if (!elements.accountCurrency) return;

      const previous = keepValue ?? elements.accountCurrency.value;
      const monedas = Array.isArray(state.monedas) ? state.monedas : [];

      if (!state.monedasLoaded || !monedas.length) {
        if (!elements.accountCurrency.options.length || elements.accountCurrency.options[0]?.value === '') {
          elements.accountCurrency.innerHTML = `
            <option value="MXN">MXN - Peso Mexicano</option>
            <option value="USD">USD - Dólar</option>
            <option value="EUR">EUR - Euro</option>
          `;
        }
        if (previous) elements.accountCurrency.value = previous;
        return;
      }

      elements.accountCurrency.innerHTML = monedas.map(m => {
        const codigo = (m.codigo || '').toUpperCase();
        const nombre = m.nombre || '';
        return `<option value="${codigo}">${codigo} - ${nombre}</option>`;
      }).join('');

      if (previous && monedas.some(m => (m.codigo || '').toUpperCase() === previous)) {
        elements.accountCurrency.value = previous;
        return;
      }

      const def = monedas.find(m => m.es_default);
      elements.accountCurrency.value = def ? (def.codigo || 'MXN') : (monedas[0]?.codigo || 'MXN');
    }
  };

  // ============================================
  // HANDLERS
  // ============================================
  const handlers = {
    async loadMonedas() {
      try {
        const data = await api.getMonedas();
        state.monedas = data.monedas || [];
        state.monedasLoaded = true;
        render.currencies();
      } catch (error) {
        console.error('Error loading monedas:', error);
        state.monedasLoaded = true;
        render.currencies();
      }
    },

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

    async loadPlataformas() {
      try {
        const [plRes, saldosRes] = await Promise.all([
          api.getPlataformas().catch(() => ({ plataformas: [] })),
          api.getPlataformasSaldos().catch(() => ({ plataformas: [] }))
        ]);
        state.plataformas = plRes.plataformas || [];
        state.plataformasSaldos = saldosRes.plataformas || [];
        render.plataformas();
      } catch (error) {
        console.error('Error loading plataformas:', error);
        state.plataformas = [];
        state.plataformasSaldos = [];
        render.plataformas();
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
      document.querySelectorAll('.account-dropdown').forEach(menu => {
        if (menu.id !== `menu-${id}`) {
          menu.classList.remove('active');
        }
      });
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

    // Maneja cambio de tipo de cuenta
    handleTypeChange() {
      const tipo = elements.accountType.value;
      const isTC = tipo === 'tarjeta_credito';
      const isEfectivo = tipo === 'efectivo';

      // Mostrar/ocultar campos de TC
      elements.creditCardFields.style.display = isTC ? 'block' : 'none';
      elements.accountLimit.required = isTC;

      // Ocultar banco y números para efectivo
      elements.bankGroup.style.display = isEfectivo ? 'none' : 'block';
      elements.accountNumbersGroup.style.display = isEfectivo ? 'none' : 'grid';

      // Cambiar etiqueta del saldo según tipo
      if (isTC) {
        elements.balanceLabel.textContent = 'Deuda Actual';
        elements.balanceHint.textContent = 'Lo que debes actualmente (0 si está limpia)';
      } else {
        elements.balanceLabel.textContent = 'Saldo Inicial';
        elements.balanceHint.textContent = 'Solo para cuentas nuevas';
      }
    },

    openCreateModal() {
      state.editingId = null;
      elements.modalTitle.textContent = 'Nueva Cuenta';
      elements.accountForm.reset();
      elements.accountType.value = 'bancaria';
      this.handleTypeChange();
      elements.accountBalance.disabled = false;
      elements.balanceGroup.style.display = 'block';
      elements.accountModal.classList.add('active');
      render.currencies();
      elements.accountType.focus();
    },

    openEditModal(account) {
      state.editingId = account.id;
      elements.modalTitle.textContent = 'Editar Cuenta';

      // Setear tipo y actualizar campos condicionales
      elements.accountType.value = account.tipo || 'bancaria';
      this.handleTypeChange();

      // Campos generales
      elements.accountName.value = account.nombre || '';
      elements.accountBank.value = account.nombre_banco || '';
      elements.accountNumber.value = account.numero_cuenta || '';
      elements.accountClabe.value = account.clabe || '';

      // Campos de TC
      elements.accountLimit.value = account.limite_credito || '';
      elements.accountCutoffDay.value = account.fecha_corte || '';
      elements.accountPaymentDay.value = account.fecha_pago || '';

      // Moneda
      render.currencies(account.moneda || 'MXN');
      elements.accountCurrency.value = account.moneda || elements.accountCurrency.value || 'MXN';

      // Saldo (deshabilitado en edición)
      elements.accountBalance.value = '';
      elements.accountBalance.disabled = true;
      elements.balanceGroup.style.display = 'none';

      elements.accountNotes.value = account.notas || '';
      elements.accountModal.classList.add('active');
      elements.accountName.focus();
    },

    closeAccountModal() {
      elements.accountModal.classList.remove('active');
      elements.accountForm.reset();
      state.editingId = null;
    },

    // Moneda rápida
    openQuickMonedaModal() {
      if (!elements.quickMonedaModal) return;
      elements.quickMonedaForm?.reset();
      if (elements.quickMonActivo) elements.quickMonActivo.checked = true;
      if (elements.quickMonDefault) elements.quickMonDefault.checked = false;
      if (elements.quickMonDecimales) elements.quickMonDecimales.value = 2;
      elements.quickMonedaModal.classList.add('active');
      elements.quickMonCodigo?.focus();
    },

    closeQuickMonedaModal() {
      elements.quickMonedaModal?.classList.remove('active');
      elements.quickMonedaForm?.reset();
    },

    async submitQuickMoneda(e) {
      e.preventDefault();

      const payload = {
        codigo: elements.quickMonCodigo.value.trim().toUpperCase(),
        nombre: elements.quickMonNombre.value.trim(),
        simbolo: elements.quickMonSimbolo.value.trim() || '$',
        decimales: parseInt(elements.quickMonDecimales.value, 10) || 2,
        es_default: !!elements.quickMonDefault.checked,
        activo: !!elements.quickMonActivo.checked
      };

      elements.submitQuickMoneda.classList.add('loading');
      elements.submitQuickMoneda.disabled = true;

      try {
        const res = await api.createMoneda(payload);
        const createdCode = res?.moneda?.codigo || payload.codigo;

        await this.loadMonedas();
        if (elements.accountCurrency) {
          elements.accountCurrency.value = createdCode;
        }

        this.closeQuickMonedaModal();
      } catch (error) {
        alert(error.message);
      } finally {
        elements.submitQuickMoneda.classList.remove('loading');
        elements.submitQuickMoneda.disabled = false;
      }
    },

    async submitAccount(e) {
      e.preventDefault();

      const tipo = elements.accountType.value;
      const data = {
        tipo,
        nombre: elements.accountName.value.trim(),
        nombre_banco: elements.accountBank.value.trim() || null,
        numero_cuenta: elements.accountNumber.value.trim() || null,
        clabe: elements.accountClabe.value.trim() || null,
        moneda: elements.accountCurrency.value,
        notas: elements.accountNotes.value.trim() || null
      };

      // Campos específicos de TC
      if (tipo === 'tarjeta_credito') {
        data.limite_credito = parseFloat(elements.accountLimit.value) || 0;
        data.fecha_corte = parseInt(elements.accountCutoffDay.value) || null;
        data.fecha_pago = parseInt(elements.accountPaymentDay.value) || null;
      } else {
        // Limpiar campos TC si no es tarjeta
        data.limite_credito = null;
        data.fecha_corte = null;
        data.fecha_pago = null;
      }

      // Saldo inicial solo en creación
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
      const isTC = account.tipo === 'tarjeta_credito';
      const label = isTC ? 'Deuda Actual' : 'Saldo Actual';
      elements.currentBalance.value = `${label}: ${utils.formatMoney(account.saldo_actual, account.moneda)}`;
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

      const submitBtn = elements.adjustModal.querySelector('[type="submit"]') || document.getElementById('submitAdjust');
      submitBtn.classList.add('loading');
      submitBtn.disabled = true;

      try {
        await api.adjustBalance(state.adjustingId, data);
        this.closeAdjustModal();
        await this.loadAccounts();
      } catch (error) {
        alert(error.message);
      } finally {
        submitBtn.classList.remove('loading');
        submitBtn.disabled = false;
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
    },

    switchView(view) {
      state.currentView = view;
      elements.viewToggle.querySelectorAll('.view-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.view === view);
      });
      render.accounts();
    }
  };

  // ============================================
  // INIT
  // ============================================
  function init() {
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

    // View toggle
    elements.viewToggle?.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => handlers.switchView(btn.dataset.view));
    });

    // Account modal
    elements.closeModal.addEventListener('click', handlers.closeAccountModal.bind(handlers));
    elements.cancelModal.addEventListener('click', handlers.closeAccountModal.bind(handlers));
    elements.accountForm.addEventListener('submit', handlers.submitAccount.bind(handlers));
    elements.accountModal.addEventListener('click', (e) => {
      if (e.target === elements.accountModal) handlers.closeAccountModal();
    });

    // Tipo de cuenta change
    elements.accountType.addEventListener('change', handlers.handleTypeChange.bind(handlers));

    // Moneda rápida
    elements.addCurrencyQuickBtn?.addEventListener('click', handlers.openQuickMonedaModal.bind(handlers));
    elements.closeQuickMonedaModal?.addEventListener('click', handlers.closeQuickMonedaModal.bind(handlers));
    elements.cancelQuickMonedaModal?.addEventListener('click', handlers.closeQuickMonedaModal.bind(handlers));
    elements.quickMonedaForm?.addEventListener('submit', handlers.submitQuickMoneda.bind(handlers));
    elements.quickMonedaModal?.addEventListener('click', (e) => {
      if (e.target === elements.quickMonedaModal) handlers.closeQuickMonedaModal();
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
        handlers.closeQuickMonedaModal();
        handlers.closeAdjustModal();
        handlers.closeDeleteModal();
        handlers.closeAllMenus();
      }
    });

    // Load data
    handlers.loadAccounts();
    handlers.loadMonedas();
    handlers.loadPlataformas();

    console.log('🚀 TRUNO Bancos initialized');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
