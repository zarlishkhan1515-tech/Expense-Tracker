/**
 * ApexFinance - Storage & Persistence Engine (storage.js)
 * Object-Oriented ES6 Class encapsulating LocalStorage & SessionStorage operations,
 * state persistence, categories, recently deleted bin, and JSON import/export validation.
 */

export const DEFAULT_CATEGORIES = [
  { id: 'cat_salary', name: 'Salary', color: '#10b981', isDefault: true },
  { id: 'cat_food', name: 'Food', color: '#f59e0b', isDefault: true },
  { id: 'cat_shopping', name: 'Shopping', color: '#ec4899', isDefault: true },
  { id: 'cat_bills', name: 'Bills', color: '#ef4444', isDefault: true },
  { id: 'cat_entertainment', name: 'Entertainment', color: '#8b5cf6', isDefault: true },
  { id: 'cat_travel', name: 'Travel', color: '#06b6d4', isDefault: true },
  { id: 'cat_medical', name: 'Medical', color: '#14b8a6', isDefault: true },
  { id: 'cat_education', name: 'Education', color: '#3b82f6', isDefault: true },
  { id: 'cat_other', name: 'Other', color: '#6b7280', isDefault: true }
];

export const INITIAL_MOCK_TRANSACTIONS = [
  {
    id: 'tx_demo_1',
    title: 'Monthly Tech Salary',
    description: 'Direct deposit payroll salary for July',
    amount: 5400.00,
    category: 'Salary',
    date: '2026-07-01',
    paymentMethod: 'Bank Transfer',
    type: 'INCOME',
    createdAt: '2026-07-01T09:00:00.000Z',
    updatedAt: '2026-07-01T09:00:00.000Z'
  },
  {
    id: 'tx_demo_2',
    title: 'Whole Foods Grocery',
    description: 'Weekly organic groceries & home items',
    amount: 184.50,
    category: 'Food',
    date: '2026-07-05',
    paymentMethod: 'Credit Card',
    type: 'EXPENSE',
    createdAt: '2026-07-05T14:20:00.000Z',
    updatedAt: '2026-07-05T14:20:00.000Z'
  },
  {
    id: 'tx_demo_3',
    title: 'Apartment Rent & Utilities',
    description: 'Monthly lease and electric bill',
    amount: 1450.00,
    category: 'Bills',
    date: '2026-07-07',
    paymentMethod: 'Bank Transfer',
    type: 'EXPENSE',
    createdAt: '2026-07-07T10:15:00.000Z',
    updatedAt: '2026-07-07T10:15:00.000Z'
  },
  {
    id: 'tx_demo_4',
    title: 'Freelance Design Retainer',
    description: 'UI/UX consulting milestone payment',
    amount: 1200.00,
    category: 'Salary',
    date: '2026-07-12',
    paymentMethod: 'Digital Wallet',
    type: 'INCOME',
    createdAt: '2026-07-12T16:00:00.000Z',
    updatedAt: '2026-07-12T16:00:00.000Z'
  },
  {
    id: 'tx_demo_5',
    title: 'Flight Ticket - Summer Vacation',
    description: 'Roundtrip flight tickets to Barcelona',
    amount: 620.00,
    category: 'Travel',
    date: '2026-07-18',
    paymentMethod: 'Credit Card',
    type: 'EXPENSE',
    createdAt: '2026-07-18T11:45:00.000Z',
    updatedAt: '2026-07-18T11:45:00.000Z'
  },
  {
    id: 'tx_demo_6',
    title: 'Cinema & Dinner Weekend',
    description: 'Movie IMAX tickets and sushi dinner',
    amount: 95.00,
    category: 'Entertainment',
    date: '2026-07-22',
    paymentMethod: 'Debit Card',
    type: 'EXPENSE',
    createdAt: '2026-07-22T20:30:00.000Z',
    updatedAt: '2026-07-22T20:30:00.000Z'
  }
];

export class StorageManager {
  constructor() {
    this.KEYS = {
      TRANSACTIONS: 'apex_finance_transactions',
      CATEGORIES: 'apex_finance_categories',
      THEME: 'apex_finance_theme',
      CURRENCY: 'apex_finance_currency',
      BIN: 'apex_finance_bin',
      SETTINGS: 'apex_finance_settings'
    };

    this.init();
  }

  /**
   * Initialize Local Storage state with default mock data if empty
   */
  init() {
    if (!localStorage.getItem(this.KEYS.TRANSACTIONS)) {
      this.saveTransactions(INITIAL_MOCK_TRANSACTIONS);
    }
    if (!localStorage.getItem(this.KEYS.CATEGORIES)) {
      this.saveCategories(DEFAULT_CATEGORIES);
    }
    if (!localStorage.getItem(this.KEYS.THEME)) {
      localStorage.setItem(this.KEYS.THEME, 'dark');
    }
    if (!localStorage.getItem(this.KEYS.CURRENCY)) {
      localStorage.setItem(this.KEYS.CURRENCY, 'USD');
    }
    if (!localStorage.getItem(this.KEYS.BIN)) {
      localStorage.setItem(this.KEYS.BIN, JSON.stringify([]));
    }
  }

  // --- Transactions Persistence ---
  getTransactions() {
    try {
      const data = localStorage.getItem(this.KEYS.TRANSACTIONS);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      console.error('Failed to parse transactions from LocalStorage', e);
      return [];
    }
  }

  saveTransactions(transactions) {
    try {
      localStorage.setItem(this.KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to save transactions to LocalStorage', e);
    }
  }

  addTransaction(transaction) {
    const list = this.getTransactions();
    list.unshift(transaction); // Prepend new transaction
    this.saveTransactions(list);
    return transaction;
  }

  updateTransaction(updatedTx) {
    const list = this.getTransactions();
    const index = list.findIndex(tx => tx.id === updatedTx.id);
    if (index !== -1) {
      list[index] = { ...list[index], ...updatedTx, updatedAt: new Date().toISOString() };
      this.saveTransactions(list);
      return list[index];
    }
    return null;
  }

  /**
   * Soft Delete: Move transaction to Recently Deleted Bin
   * @param {string} id 
   */
  deleteTransaction(id) {
    const list = this.getTransactions();
    const target = list.find(tx => tx.id === id);
    if (!target) return false;

    // Remove from active list
    const filtered = list.filter(tx => tx.id !== id);
    this.saveTransactions(filtered);

    // Push to Bin with deleted timestamp
    const bin = this.getBin();
    bin.unshift({ ...target, deletedAt: new Date().toISOString() });
    localStorage.setItem(this.KEYS.BIN, JSON.stringify(bin));

    return true;
  }

  // --- Bin & Undo System ---
  getBin() {
    try {
      const data = localStorage.getItem(this.KEYS.BIN);
      return data ? JSON.parse(data) : [];
    } catch (e) {
      return [];
    }
  }

  restoreFromBin(id) {
    const bin = this.getBin();
    const target = bin.find(tx => tx.id === id);
    if (!target) return false;

    // Remove from bin
    const updatedBin = bin.filter(tx => tx.id !== id);
    localStorage.setItem(this.KEYS.BIN, JSON.stringify(updatedBin));

    // Restore to transactions
    delete target.deletedAt;
    this.addTransaction(target);
    return true;
  }

  clearBin() {
    localStorage.setItem(this.KEYS.BIN, JSON.stringify([]));
  }

  // --- Categories Persistence ---
  getCategories() {
    try {
      const data = localStorage.getItem(this.KEYS.CATEGORIES);
      return data ? JSON.parse(data) : DEFAULT_CATEGORIES;
    } catch (e) {
      return DEFAULT_CATEGORIES;
    }
  }

  saveCategories(categories) {
    localStorage.setItem(this.KEYS.CATEGORIES, JSON.stringify(categories));
  }

  addCategory(categoryObj) {
    const cats = this.getCategories();
    cats.push(categoryObj);
    this.saveCategories(cats);
    return categoryObj;
  }

  deleteCategory(catId) {
    const cats = this.getCategories().filter(c => c.id !== catId);
    this.saveCategories(cats);
  }

  // --- Theme & Currency Preferences ---
  getTheme() {
    return localStorage.getItem(this.KEYS.THEME) || 'dark';
  }

  setTheme(theme) {
    localStorage.setItem(this.KEYS.THEME, theme);
  }

  getCurrency() {
    return localStorage.getItem(this.KEYS.CURRENCY) || 'USD';
  }

  setCurrency(curr) {
    localStorage.setItem(this.KEYS.CURRENCY, curr);
  }

  // --- Import / Export System ---
  exportDataJSON() {
    const exportObject = {
      app: 'ApexFinance',
      version: '1.0',
      exportedAt: new Date().toISOString(),
      transactions: this.getTransactions(),
      categories: this.getCategories(),
      theme: this.getTheme(),
      currency: this.getCurrency()
    };
    return JSON.stringify(exportObject, null, 2);
  }

  /**
   * Validates and imports JSON backup string
   * @param {string} jsonString 
   * @returns {{ success: boolean, message: string, count?: number }}
   */
  importDataJSON(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      if (!data || !Array.isArray(data.transactions)) {
        return { success: false, message: 'Invalid JSON format: missing transactions array.' };
      }

      // Validate transaction objects
      const isValid = data.transactions.every(tx => 
        tx.id && tx.title && typeof tx.amount === 'number' && tx.category && tx.type
      );

      if (!isValid) {
        return { success: false, message: 'Data validation failed: transaction items are missing required fields.' };
      }

      this.saveTransactions(data.transactions);
      if (Array.isArray(data.categories)) {
        this.saveCategories(data.categories);
      }
      if (data.theme) this.setTheme(data.theme);
      if (data.currency) this.setCurrency(data.currency);

      return { success: true, message: 'Data imported successfully!', count: data.transactions.length };
    } catch (err) {
      return { success: false, message: `Failed to parse JSON file: ${err.message}` };
    }
  }

  clearAllData() {
    localStorage.removeItem(this.KEYS.TRANSACTIONS);
    localStorage.removeItem(this.KEYS.CATEGORIES);
    localStorage.removeItem(this.KEYS.BIN);
    this.init(); // Reset to fresh defaults
  }
}
