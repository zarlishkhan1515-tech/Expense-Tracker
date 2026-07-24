/**
 * ApexFinance - Main Application Entry Point & Controller (app.js)
 * Orchestrates State Management, Event Delegation, Filtering, Drag & Drop,
 * Context Menus, Keyboard Shortcuts, and Module Lifecycle.
 */

import { StorageManager } from './storage.js';
import { UIManager } from './ui.js';
import { ChartEngine } from './chart.js';
import { debounce, generateId, calculateDailyAverage } from './utils.js';
import { validateTransactionData, validateCategoryData } from './validation.js';

class App {
  constructor() {
    this.storage = new StorageManager();
    this.ui = new UIManager();
    this.chartEngine = new ChartEngine();

    // App State
    this.filters = {
      search: '',
      category: 'ALL',
      type: 'ALL',
      month: '',
      sortBy: 'DATE_DESC'
    };

    this.pagination = {
      page: 1,
      pageSize: 8
    };

    this.editingTxId = null;
    this.draggedRowId = null;

    this.init();
  }

  /**
   * Application Initialization Lifecycle
   */
  init() {
    // Apply saved Theme & Currency
    const currentTheme = this.storage.getTheme();
    document.documentElement.setAttribute('data-theme', currentTheme);

    const currentCurrency = this.storage.getCurrency();
    const currSelect = document.getElementById('currency-select');
    if (currSelect) currSelect.value = currentCurrency;

    // Populate Category Dropdowns
    this.refreshCategoriesUI();

    // Update greeting & month display
    this.updateGreeting();

    // Attach Event Listeners
    this.bindEvents();

    // Initial State Render
    this.updateDashboard();

    // Hide Loading Screen with smooth animation
    setTimeout(() => {
      this.ui.hideLoadingScreen();
    }, 400);
  }

  updateGreeting() {
    const now = new Date();
    const monthDisplay = now.toLocaleString('en-US', { month: 'long', year: 'numeric' });
    const el = document.getElementById('current-month-display');
    if (el) el.textContent = monthDisplay;

    const settingsName = this.storage.getCategories ? 'Alex' : 'Alex';
    const greetingEl = document.getElementById('user-greeting-name');
    if (greetingEl) greetingEl.textContent = settingsName;
  }

  refreshCategoriesUI() {
    const categories = this.storage.getCategories();
    this.ui.populateCategorySelects(categories);
    this.ui.renderCategoriesModal(categories);
  }

  /**
   * Main calculation & render pipeline
   */
  updateDashboard() {
    const allTransactions = this.storage.getTransactions();
    const categoriesList = this.storage.getCategories();
    const categoriesMap = {};
    categoriesList.forEach(c => categoriesMap[c.name] = c);

    const currency = this.storage.getCurrency();

    // Calculate Financial Statistics
    let totalIncome = 0;
    let totalExpense = 0;
    let largestIncome = 0;
    let largestExpense = 0;

    allTransactions.forEach(tx => {
      const amt = Number(tx.amount) || 0;
      if (tx.type === 'INCOME') {
        totalIncome += amt;
        if (amt > largestIncome) largestIncome = amt;
      } else {
        totalExpense += amt;
        if (amt > largestExpense) largestExpense = amt;
      }
    });

    const netBalance = totalIncome - totalExpense;
    const totalSavings = Math.max(0, netBalance);
    const dailyAvg = calculateDailyAverage(totalExpense, 30);

    const stats = {
      balance: netBalance,
      totalIncome,
      totalExpense,
      totalSavings,
      largestIncome,
      largestExpense,
      dailyAvg
    };

    // Update Summary Cards
    this.ui.updateDashboardCards(stats, currency);

    // Apply Search, Filters & Sorting
    const filteredTx = this.applyFiltersAndSort(allTransactions);

    // Render Table
    this.ui.renderTransactionsTable(filteredTx, categoriesMap, currency, this.pagination);
    // Re-bind drag & drop after each render since rows are recreated
    this.bindDragAndDrop();


    // Render Charts
    this.chartEngine.renderMonthlyBarChart(allTransactions, currency);
    this.chartEngine.renderCategoryDonutChart(allTransactions, categoriesMap, currency);
    this.chartEngine.renderCategoryProgressBars(allTransactions, categoriesMap, currency);

    // Update Recently Deleted Bin Badge
    const binCount = this.storage.getBin().length;
    this.ui.updateBinBadge(binCount);
  }

  /**
   * Filter, Search & Sort Logic (Higher-Order Functions: Array.filter, Array.sort)
   * @param {Array} list 
   * @returns {Array} Filtered list
   */
  applyFiltersAndSort(list) {
    let result = [...list];

    // Live Search (title & description)
    if (this.filters.search) {
      const q = this.filters.search.toLowerCase();
      result = result.filter(tx => 
        (tx.title && tx.title.toLowerCase().includes(q)) ||
        (tx.description && tx.description.toLowerCase().includes(q))
      );
    }

    // Category Filter
    if (this.filters.category !== 'ALL') {
      result = result.filter(tx => tx.category === this.filters.category);
    }

    // Type Filter
    if (this.filters.type !== 'ALL') {
      result = result.filter(tx => tx.type === this.filters.type);
    }

    // Month Filter (YYYY-MM)
    if (this.filters.month) {
      result = result.filter(tx => tx.date && tx.date.startsWith(this.filters.month));
    }

    // Multi-field Sorting
    result.sort((a, b) => {
      switch (this.filters.sortBy) {
        case 'DATE_ASC':
          return new Date(a.date) - new Date(b.date);
        case 'AMOUNT_DESC':
          return b.amount - a.amount;
        case 'AMOUNT_ASC':
          return a.amount - b.amount;
        case 'TITLE_ASC':
          return a.title.localeCompare(b.title);
        case 'DATE_DESC':
        default:
          return new Date(b.date) - new Date(a.date);
      }
    });

    return result;
  }

  /**
   * Bind event delegation and interactive UI triggers
   */
  bindEvents() {
    // --- Mobile Sidebar Controls ---
    const sidebarToggle = document.getElementById('sidebar-toggle-btn');
    const sidebarClose = document.getElementById('sidebar-close-btn');
    const sidebarBackdrop = document.getElementById('sidebar-backdrop');
    const sidebar = document.getElementById('sidebar');

    const toggleSidebar = () => {
      sidebar.classList.toggle('mobile-open');
      sidebarBackdrop.classList.toggle('active');
    };

    if (sidebarToggle) sidebarToggle.addEventListener('click', toggleSidebar);
    if (sidebarClose) sidebarClose.addEventListener('click', toggleSidebar);
    if (sidebarBackdrop) sidebarBackdrop.addEventListener('click', toggleSidebar);

    // --- Theme Switcher ---
    const themeBtn = document.getElementById('theme-toggle-btn');
    if (themeBtn) {
      themeBtn.addEventListener('click', () => {
        const current = this.storage.getTheme();
        const next = current === 'dark' ? 'light' : 'dark';
        this.storage.setTheme(next);
        document.documentElement.setAttribute('data-theme', next);
        this.ui.showToast(`Switched to ${next} theme mode`, 'info');
      });
    }

    // --- Currency Selector ---
    const currSelect = document.getElementById('currency-select');
    if (currSelect) {
      currSelect.addEventListener('change', (e) => {
        const curr = e.target.value;
        this.storage.setCurrency(curr);
        const formSymbol = document.getElementById('form-currency-symbol');
        if (formSymbol) formSymbol.textContent = curr === 'EUR' ? '€' : curr === 'GBP' ? '£' : '$';
        this.updateDashboard();
        this.ui.showToast(`Currency display changed to ${curr}`, 'info');
      });
    }

    // --- Debounced Live Search Listener ---
    const globalSearch = document.getElementById('global-search-input');
    const tableSearch = document.getElementById('table-search-input');

    const handleSearch = debounce((val) => {
      this.filters.search = val;
      this.pagination.page = 1;
      this.updateDashboard();
    }, 300);

    if (globalSearch) {
      globalSearch.addEventListener('input', (e) => {
        if (tableSearch) tableSearch.value = e.target.value;
        handleSearch(e.target.value);
      });
    }

    if (tableSearch) {
      tableSearch.addEventListener('input', (e) => {
        if (globalSearch) globalSearch.value = e.target.value;
        handleSearch(e.target.value);
      });
    }

    // --- Filter Toolbar Controls ---
    const filterCat = document.getElementById('filter-category');
    const filterType = document.getElementById('filter-type');
    const filterMonth = document.getElementById('filter-month');
    const sortBy = document.getElementById('sort-by');
    const resetBtn = document.getElementById('reset-filters-btn');

    if (filterCat) filterCat.addEventListener('change', (e) => { this.filters.category = e.target.value; this.pagination.page = 1; this.updateDashboard(); });
    if (filterType) filterType.addEventListener('change', (e) => { this.filters.type = e.target.value; this.pagination.page = 1; this.updateDashboard(); });
    if (filterMonth) filterMonth.addEventListener('change', (e) => { this.filters.month = e.target.value; this.pagination.page = 1; this.updateDashboard(); });
    if (sortBy) sortBy.addEventListener('change', (e) => { this.filters.sortBy = e.target.value; this.updateDashboard(); });

    if (resetBtn) {
      resetBtn.addEventListener('click', () => {
        this.filters = { search: '', category: 'ALL', type: 'ALL', month: '', sortBy: 'DATE_DESC' };
        if (globalSearch) globalSearch.value = '';
        if (tableSearch) tableSearch.value = '';
        if (filterCat) filterCat.value = 'ALL';
        if (filterType) filterType.value = 'ALL';
        if (filterMonth) filterMonth.value = '';
        if (sortBy) sortBy.value = 'DATE_DESC';
        this.pagination.page = 1;
        this.updateDashboard();
        this.ui.showToast('Filters reset to default', 'info');
      });
    }

    // --- Transaction Type Selector (Radio Buttons Active State) ---
    document.querySelectorAll('input[name="tx-type"]').forEach(radio => {
      radio.addEventListener('change', () => {
        document.querySelectorAll('.type-btn').forEach(btn => btn.classList.remove('active'));
        const label = radio.closest('.type-btn');
        if (label) label.classList.add('active');
      });
    });

    // --- Transaction Form Submit ---
    const txForm = document.getElementById('transaction-form');
    if (txForm) {
      txForm.addEventListener('submit', (e) => {
        e.preventDefault();
        this.handleTransactionSubmit();
      });
    }

    // Modal Triggers
    const quickAddBtn = document.getElementById('quick-add-btn');
    const addTxBtn = document.getElementById('add-transaction-btn');
    const emptyAddBtn = document.getElementById('empty-state-add-btn');

    const openAddModal = () => {
      this.editingTxId = null;
      document.getElementById('modal-title').textContent = 'Add New Transaction';
      txForm.reset();
      document.getElementById('tx-date').value = new Date().toISOString().substring(0, 10);
      this.ui.openModal(this.ui.txModalBackdrop);
    };

    if (quickAddBtn) quickAddBtn.addEventListener('click', openAddModal);
    if (addTxBtn) addTxBtn.addEventListener('click', openAddModal);
    if (emptyAddBtn) emptyAddBtn.addEventListener('click', openAddModal);

    // Close Modals buttons
    const closeBtns = document.querySelectorAll('.modal-close-btn, #modal-cancel-btn');
    closeBtns.forEach(btn => {
      btn.addEventListener('click', () => this.ui.closeAllModals());
    });

    // --- Event Delegation on Transaction Table (Edit, Delete, Details) ---
    if (this.ui.tableBody) {
      this.ui.tableBody.addEventListener('click', (e) => {
        const editBtn = e.target.closest('.btn-edit-tx');
        const deleteBtn = e.target.closest('.btn-delete-tx');

        if (editBtn) {
          const id = editBtn.getAttribute('data-id');
          this.openEditModal(id);
        } else if (deleteBtn) {
          const id = deleteBtn.getAttribute('data-id');
          this.handleDeleteTransaction(id);
        }
      });

      // Custom Context Menu Right Click
      this.ui.tableBody.addEventListener('contextmenu', (e) => {
        const row = e.target.closest('.tx-table-row');
        if (row) {
          e.preventDefault();
          const id = row.getAttribute('data-id');
          this.ui.showContextMenu(e.clientX, e.clientY, id);
        }
      });

      // Drag & Drop Transactions List Reordering
      this.bindDragAndDrop();
    }

    // --- Context Menu Actions ---
    document.addEventListener('click', () => this.ui.hideContextMenu());
    
    const ctxEdit = document.getElementById('ctx-edit');
    const ctxDuplicate = document.getElementById('ctx-duplicate');
    const ctxDetails = document.getElementById('ctx-details');
    const ctxDelete = document.getElementById('ctx-delete');

    if (ctxEdit) ctxEdit.addEventListener('click', () => {
      const id = this.ui.contextMenu.getAttribute('data-target-id');
      if (id) this.openEditModal(id);
    });

    if (ctxDuplicate) ctxDuplicate.addEventListener('click', () => {
      const id = this.ui.contextMenu.getAttribute('data-target-id');
      if (id) this.handleDuplicateTransaction(id);
    });

    if (ctxDetails) ctxDetails.addEventListener('click', () => {
      const id = this.ui.contextMenu.getAttribute('data-target-id');
      const tx = this.storage.getTransactions().find(t => t.id === id);
      if (tx) this.ui.showDetailsModal(tx, this.storage.getCurrency());
    });

    if (ctxDelete) ctxDelete.addEventListener('click', () => {
      const id = this.ui.contextMenu.getAttribute('data-target-id');
      if (id) this.handleDeleteTransaction(id);
    });

    // --- Category Manager Form & Modals ---
    const openCatBtn = document.getElementById('open-categories-btn');
    if (openCatBtn) openCatBtn.addEventListener('click', () => this.ui.openModal(this.ui.catModalBackdrop));

    const createCatForm = document.getElementById('create-category-form');
    if (createCatForm) {
      createCatForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameInput = document.getElementById('new-cat-name');
        const colorInput = document.getElementById('new-cat-color');
        const result = validateCategoryData(nameInput.value, this.storage.getCategories());

        if (!result.isValid) {
          this.ui.showToast(result.error, 'danger');
          return;
        }

        const newCat = {
          id: 'cat_' + Date.now(),
          name: nameInput.value.trim(),
          color: colorInput.value,
          isDefault: false
        };

        this.storage.addCategory(newCat);
        this.refreshCategoriesUI();
        nameInput.value = '';
        this.ui.showToast(`Custom category "${newCat.name}" created`, 'success');
        this.updateDashboard();
      });
    }

    // Category Delete Event Delegation
    const catListModal = document.getElementById('modal-categories-list');
    if (catListModal) {
      catListModal.addEventListener('click', (e) => {
        const delBtn = e.target.closest('.btn-delete-cat');
        if (delBtn) {
          const catId = delBtn.getAttribute('data-id');
          this.storage.deleteCategory(catId);
          this.refreshCategoriesUI();
          this.ui.showToast('Category deleted', 'info');
          this.updateDashboard();
        }
      });
    }

    // --- Import / Export Modal Controls ---
    const openImportBtn = document.getElementById('open-import-modal-btn');
    if (openImportBtn) openImportBtn.addEventListener('click', () => this.ui.openModal(this.ui.dataModalBackdrop));

    const exportBtn = document.getElementById('export-json-btn');
    const exportQuickBtn = document.getElementById('export-json-quick-btn');
    
    const handleExport = () => {
      const jsonStr = this.storage.exportDataJSON();
      const blob = new Blob([jsonStr], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `apex-finance-backup-${new Date().toISOString().substring(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      this.ui.showToast('Data exported successfully to JSON file', 'success');
    };

    if (exportBtn) exportBtn.addEventListener('click', handleExport);
    if (exportQuickBtn) exportQuickBtn.addEventListener('click', handleExport);

    const triggerImport = document.getElementById('trigger-import-btn');
    const importFile = document.getElementById('import-json-file');

    if (triggerImport && importFile) {
      triggerImport.addEventListener('click', () => importFile.click());
      importFile.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
          const res = this.storage.importDataJSON(event.target.result);
          if (res.success) {
            this.refreshCategoriesUI();
            this.updateDashboard();
            this.ui.closeAllModals();
            this.ui.showToast(res.message, 'success');
          } else {
            this.ui.showToast(res.message, 'danger');
          }
        };
        reader.readAsText(file);
      });
    }

    // Danger Zone Clear All Data
    const clearAllBtn = document.getElementById('clear-all-data-btn');
    if (clearAllBtn) {
      clearAllBtn.addEventListener('click', () => {
        this.ui.openModal(this.ui.confirmModalBackdrop);
        const confirmProceed = document.getElementById('confirm-proceed-btn');
        const confirmCancel = document.getElementById('confirm-cancel-btn');

        const onProceed = () => {
          this.storage.clearAllData();
          this.refreshCategoriesUI();
          this.updateDashboard();
          this.ui.closeAllModals();
          this.ui.showToast('All transaction data cleared!', 'warning');
          cleanup();
        };

        const cleanup = () => {
          confirmProceed.removeEventListener('click', onProceed);
        };

        confirmProceed.addEventListener('click', onProceed, { once: true });
        if (confirmCancel) confirmCancel.addEventListener('click', () => this.ui.closeModal(this.ui.confirmModalBackdrop));
      });
    }

    // --- Pagination Buttons ---
    if (this.ui.prevPageBtn) {
      this.ui.prevPageBtn.addEventListener('click', () => {
        if (this.pagination.page > 1) {
          this.pagination.page--;
          this.updateDashboard();
        }
      });
    }
    if (this.ui.nextPageBtn) {
      this.ui.nextPageBtn.addEventListener('click', () => {
        this.pagination.page++;
        this.updateDashboard();
      });
    }

    // --- Recently Deleted Bin Link Listener ---
    const binNavBtn = document.getElementById('nav-bin-link');
    if (binNavBtn) {
      binNavBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const binItems = this.storage.getBin();
        if (binItems.length === 0) {
          this.ui.showToast('Recently Deleted Bin is empty', 'info');
          return;
        }
        // Undo last deleted item
        const lastDeleted = binItems[0];
        this.storage.restoreFromBin(lastDeleted.id);
        this.updateDashboard();
        this.ui.showToast(`Restored "${lastDeleted.title}" from Bin`, 'success');
      });
    }

    // --- Keyboard Shortcuts Listener ---
    const shortcutsHelpBtn = document.getElementById('shortcuts-help-btn');
    if (shortcutsHelpBtn) shortcutsHelpBtn.addEventListener('click', () => this.ui.openModal(this.ui.shortcutsModalBackdrop));

    document.addEventListener('keydown', (e) => {
      // Don't trigger when typing inside inputs
      if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        if (e.key === 'Escape') this.ui.closeAllModals();
        return;
      }

      if (e.key === 'Escape') {
        this.ui.closeAllModals();
      } else if (e.key === 'n' || e.key === 'N') {
        e.preventDefault();
        openAddModal();
      } else if ((e.ctrlKey || e.metaKey) && e.key === 'f') {
        e.preventDefault();
        const searchInput = document.getElementById('global-search-input');
        if (searchInput) searchInput.focus();
      } else if (e.key === '?') {
        this.ui.openModal(this.ui.shortcutsModalBackdrop);
      } else if (e.key === 't' || e.key === 'T') {
        themeBtn.click();
      } else if (e.key === 'c' || e.key === 'C') {
        this.ui.openModal(this.ui.catModalBackdrop);
      }
    });
  }

  // --- Handlers ---
  handleTransactionSubmit() {
    const type = document.querySelector('input[name="tx-type"]:checked').value;
    const title = document.getElementById('tx-title').value;
    const amount = document.getElementById('tx-amount').value;
    const category = document.getElementById('tx-category').value;
    const date = document.getElementById('tx-date').value;
    const paymentMethod = document.getElementById('tx-payment').value;
    const description = document.getElementById('tx-description').value;

    const payload = { title, amount, category, date, type, paymentMethod, description };
    const validation = validateTransactionData(payload);

    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      this.ui.showToast(firstError, 'danger');
      return;
    }

    if (this.editingTxId) {
      // Update
      const updated = {
        id: this.editingTxId,
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date,
        type,
        paymentMethod,
        description: description.trim()
      };
      this.storage.updateTransaction(updated);
      this.ui.showToast('Transaction updated successfully', 'success');
    } else {
      // Create
      const newTx = {
        id: generateId(),
        title: title.trim(),
        amount: parseFloat(amount),
        category,
        date,
        type,
        paymentMethod,
        description: description.trim(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      this.storage.addTransaction(newTx);
      this.ui.showToast('New transaction added successfully', 'success');
    }

    this.ui.closeAllModals();
    this.updateDashboard();
  }

  openEditModal(id) {
    const list = this.storage.getTransactions();
    const tx = list.find(t => t.id === id);
    if (!tx) return;

    this.editingTxId = id;
    document.getElementById('modal-title').textContent = 'Edit Transaction';

    document.getElementById('tx-title').value = tx.title;
    document.getElementById('tx-amount').value = tx.amount;
    document.getElementById('tx-category').value = tx.category;
    document.getElementById('tx-date').value = tx.date;
    document.getElementById('tx-payment').value = tx.paymentMethod || 'Credit Card';
    document.getElementById('tx-description').value = tx.description || '';

    const typeRadio = document.querySelector(`input[name="tx-type"][value="${tx.type}"]`);
    if (typeRadio) typeRadio.checked = true;

    this.ui.openModal(this.ui.txModalBackdrop);
  }

  handleDeleteTransaction(id) {
    const success = this.storage.deleteTransaction(id);
    if (success) {
      this.updateDashboard();
      this.ui.showToast('Transaction moved to Bin. Click Recently Deleted to Undo.', 'info');
    }
  }

  handleDuplicateTransaction(id) {
    const list = this.storage.getTransactions();
    const tx = list.find(t => t.id === id);
    if (!tx) return;

    const copy = {
      ...tx,
      id: generateId(),
      title: `${tx.title} (Copy)`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    this.storage.addTransaction(copy);
    this.updateDashboard();
    this.ui.showToast('Transaction duplicated', 'success');
  }

  /**
   * Drag and Drop HTML5 Event Handlers - rebinds after each render
   */
  bindDragAndDrop() {
    if (!this.ui.tableBody) return;
    const rows = this.ui.tableBody.querySelectorAll('.tx-table-row');
    rows.forEach(row => {
      row.addEventListener('dragstart', (e) => {
        this.draggedRowId = row.getAttribute('data-id');
        e.dataTransfer.effectAllowed = 'move';
        row.style.opacity = '0.5';
      });

      row.addEventListener('dragend', () => {
        row.style.opacity = '1';
        this.ui.tableBody.querySelectorAll('.tx-table-row').forEach(r => r.classList.remove('drag-over'));
      });

      row.addEventListener('dragover', (e) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = 'move';
        this.ui.tableBody.querySelectorAll('.tx-table-row').forEach(r => r.classList.remove('drag-over'));
        row.classList.add('drag-over');
      });

      row.addEventListener('dragleave', () => {
        row.classList.remove('drag-over');
      });

      row.addEventListener('drop', (e) => {
        e.preventDefault();
        row.classList.remove('drag-over');
        const targetId = row.getAttribute('data-id');
        if (this.draggedRowId && targetId && this.draggedRowId !== targetId) {
          const list = this.storage.getTransactions();
          const fromIdx = list.findIndex(t => t.id === this.draggedRowId);
          const toIdx = list.findIndex(t => t.id === targetId);

          if (fromIdx !== -1 && toIdx !== -1) {
            const [moved] = list.splice(fromIdx, 1);
            list.splice(toIdx, 0, moved);
            this.storage.saveTransactions(list);
            this.updateDashboard();
            this.ui.showToast('Transactions reordered', 'info');
          }
        }
      });
    });
  }
}

// Instantiate App when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  window.ApexApp = new App();
});
