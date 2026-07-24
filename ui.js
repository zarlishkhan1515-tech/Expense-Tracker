/**
 * ApexFinance - UI & Interaction Engine (ui.js)
 * DOM Manipulation, Dynamic Template Literals, Modal Controller, Toast Notifications,
 * Theme Switcher, and Context Menu Engine.
 */

import { formatCurrency, formatDate, escapeHTML, calculatePercentage } from './utils.js';

export class UIManager {
  constructor() {
    this.initElements();
  }

  /**
   * Cache critical DOM elements
   */
  initElements() {
    // Loading Screen
    this.loadingScreen = document.getElementById('app-loading-screen');

    // Cards
    this.cardTotalBalance = document.getElementById('card-total-balance');
    this.cardTotalIncome = document.getElementById('card-total-income');
    this.cardTotalExpense = document.getElementById('card-total-expense');
    this.cardTotalSavings = document.getElementById('card-total-savings');
    this.balanceSavingsRate = document.getElementById('balance-savings-rate');
    this.statLargestIncome = document.getElementById('stat-largest-income');
    this.statLargestExpense = document.getElementById('stat-largest-expense');
    this.statDailyAvg = document.getElementById('stat-daily-avg');

    // Sidebar & Navigation
    this.sidebar = document.getElementById('sidebar');
    this.sidebarBackdrop = document.getElementById('sidebar-backdrop');
    this.binCountBadge = document.getElementById('bin-count-badge');
    this.sidebarGoalProgress = document.getElementById('sidebar-goal-progress');

    // Table
    this.tableBody = document.getElementById('transaction-table-body');
    this.emptyState = document.getElementById('table-empty-state');
    this.countBadge = document.getElementById('transactions-count-badge');
    this.pageStartIdx = document.getElementById('page-start-idx');
    this.pageEndIdx = document.getElementById('page-end-idx');
    this.totalCountIdx = document.getElementById('total-count-idx');
    this.currentPageNum = document.getElementById('current-page-num');
    this.prevPageBtn = document.getElementById('prev-page-btn');
    this.nextPageBtn = document.getElementById('next-page-btn');

    // Modals
    this.txModalBackdrop = document.getElementById('transaction-modal-backdrop');
    this.txForm = document.getElementById('transaction-form');
    this.catModalBackdrop = document.getElementById('category-modal-backdrop');
    this.dataModalBackdrop = document.getElementById('data-modal-backdrop');
    this.shortcutsModalBackdrop = document.getElementById('shortcuts-modal-backdrop');
    this.detailsModalBackdrop = document.getElementById('details-modal-backdrop');
    this.confirmModalBackdrop = document.getElementById('confirm-modal-backdrop');
    this.categorySelect = document.getElementById('tx-category');

    // Toast Container
    this.toastContainer = document.getElementById('toast-container');
    
    // Custom Context Menu
    this.contextMenu = document.getElementById('custom-context-menu');
  }

  hideLoadingScreen() {
    if (this.loadingScreen) {
      this.loadingScreen.classList.add('fade-out');
      setTimeout(() => {
        this.loadingScreen.classList.add('hidden');
      }, 300);
    }
  }

  /**
   * Update Dashboard summary card displays
   * @param {Object} stats 
   * @param {string} currency 
   */
  updateDashboardCards(stats, currency = 'USD') {
    if (this.cardTotalBalance) this.cardTotalBalance.textContent = formatCurrency(stats.balance, currency);
    if (this.cardTotalIncome) this.cardTotalIncome.textContent = formatCurrency(stats.totalIncome, currency);
    if (this.cardTotalExpense) this.cardTotalExpense.textContent = formatCurrency(stats.totalExpense, currency);
    if (this.cardTotalSavings) this.cardTotalSavings.textContent = formatCurrency(stats.totalSavings, currency);

    if (this.statLargestIncome) this.statLargestIncome.textContent = formatCurrency(stats.largestIncome, currency);
    if (this.statLargestExpense) this.statLargestExpense.textContent = formatCurrency(stats.largestExpense, currency);
    if (this.statDailyAvg) this.statDailyAvg.textContent = formatCurrency(stats.dailyAvg, currency);

    const savingsRate = calculatePercentage(stats.totalSavings, stats.totalIncome);
    if (this.balanceSavingsRate) this.balanceSavingsRate.textContent = `${savingsRate}% Savings Rate`;
    if (this.sidebarGoalProgress) this.sidebarGoalProgress.style.width = `${Math.min(100, savingsRate)}%`;
  }

  /**
   * Render Transaction Table Rows dynamically
   */
  renderTransactionsTable(transactions, categoriesMap, currency = 'USD', pagination = { page: 1, pageSize: 10 }) {
    if (!this.tableBody) return;

    if (transactions.length === 0) {
      this.tableBody.innerHTML = '';
      if (this.emptyState) this.emptyState.classList.remove('hidden');
      this.updatePaginationInfo(0, 0, 0, 1, 1);
      if (this.countBadge) this.countBadge.textContent = '0 items';
      return;
    }

    if (this.emptyState) this.emptyState.classList.add('hidden');

    const total = transactions.length;
    const totalPages = Math.ceil(total / pagination.pageSize) || 1;
    const currentPage = Math.min(pagination.page, totalPages);
    const startIdx = (currentPage - 1) * pagination.pageSize;
    const endIdx = Math.min(startIdx + pagination.pageSize, total);

    const pageItems = transactions.slice(startIdx, endIdx);

    const rowsHTML = pageItems.map(tx => {
      const catObj = categoriesMap[tx.category] || { color: '#6b7280', name: tx.category };
      const isIncome = tx.type === 'INCOME';
      const amountFormatted = (isIncome ? '+' : '-') + formatCurrency(tx.amount, currency);
      const amountClass = isIncome ? 'amount-income' : 'amount-expense';

      return `
        <tr data-id="${tx.id}" draggable="true" class="tx-table-row">
          <td class="cell-drag th-drag">
            <span class="drag-handle" title="Drag to reorder">⋮⋮</span>
          </td>
          <td>
            <div class="tx-title-wrapper">
              <span class="tx-title">${escapeHTML(tx.title)}</span>
              ${tx.description ? `<span class="tx-desc">${escapeHTML(tx.description)}</span>` : ''}
            </div>
          </td>
          <td>
            <span class="category-pill">
              <span class="cat-dot" style="background-color: ${catObj.color}"></span>
              ${escapeHTML(catObj.name || tx.category)}
            </span>
          </td>
          <td>${formatDate(tx.date)}</td>
          <td class="cell-payment">${escapeHTML(tx.paymentMethod || 'Other')}</td>
          <td class="th-right ${amountClass}">${amountFormatted}</td>
          <td class="th-center">
            <div class="action-btns-cell">
              <button class="btn btn-icon btn-sm btn-edit-tx" data-id="${tx.id}" title="Edit Transaction">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
              </button>
              <button class="btn btn-icon btn-sm btn-delete-tx" data-id="${tx.id}" title="Delete Transaction">
                <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
              </button>
            </div>
          </td>
        </tr>
      `;
    }).join('');

    this.tableBody.innerHTML = rowsHTML;
    this.updatePaginationInfo(startIdx + 1, endIdx, total, currentPage, totalPages);
    if (this.countBadge) this.countBadge.textContent = `${total} item${total === 1 ? '' : 's'}`;
  }

  updatePaginationInfo(start, end, total, current, totalPages) {
    if (this.pageStartIdx) this.pageStartIdx.textContent = start;
    if (this.pageEndIdx) this.pageEndIdx.textContent = end;
    if (this.totalCountIdx) this.totalCountIdx.textContent = total;
    if (this.currentPageNum) this.currentPageNum.textContent = `Page ${current} of ${totalPages}`;

    if (this.prevPageBtn) this.prevPageBtn.disabled = current <= 1;
    if (this.nextPageBtn) this.nextPageBtn.disabled = current >= totalPages;
  }

  /**
   * Populate Category Dropdowns
   */
  populateCategorySelects(categories = []) {
    if (!this.categorySelect) return;
    const optionsHTML = categories.map(cat => 
      `<option value="${escapeHTML(cat.name)}">${escapeHTML(cat.name)}</option>`
    ).join('');
    this.categorySelect.innerHTML = optionsHTML;

    // Filter Category Select
    const filterCat = document.getElementById('filter-category');
    if (filterCat) {
      filterCat.innerHTML = `<option value="ALL">All Categories</option>` + optionsHTML;
    }
  }

  /**
   * Render Category List inside Category Manager Modal
   */
  renderCategoriesModal(categories = []) {
    const listEl = document.getElementById('modal-categories-list');
    if (!listEl) return;

    listEl.innerHTML = categories.map(cat => `
      <div class="cat-item-row" data-id="${cat.id}">
        <div class="cat-item-left">
          <span class="cat-dot" style="background-color: ${cat.color};"></span>
          <span>${escapeHTML(cat.name)}</span>
        </div>
        ${!cat.isDefault ? `
          <button class="btn btn-icon btn-sm btn-delete-cat" data-id="${cat.id}" title="Delete Category">
            <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="12"/></svg>
          </button>
        ` : '<span class="badge" style="font-size:0.7rem;">Default</span>'}
      </div>
    `).join('');
  }

  // --- Modals Logic ---
  openModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.remove('hidden');
  }

  closeModal(modalElement) {
    if (!modalElement) return;
    modalElement.classList.add('hidden');
  }

  closeAllModals() {
    [
      this.txModalBackdrop,
      this.catModalBackdrop,
      this.dataModalBackdrop,
      this.shortcutsModalBackdrop,
      this.detailsModalBackdrop,
      this.confirmModalBackdrop
    ].forEach(modal => {
      if (modal) modal.classList.add('hidden');
    });
  }

  // --- Toast System ---
  showToast(message, type = 'info', duration = 3500) {
    if (!this.toastContainer) return;
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    
    let iconSVG = '';
    if (type === 'success') {
      iconSVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>`;
    } else if (type === 'danger') {
      iconSVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>`;
    } else {
      iconSVG = `<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`;
    }

    toast.innerHTML = `
      ${iconSVG}
      <span>${escapeHTML(message)}</span>
      <button class="toast-close">&times;</button>
    `;

    this.toastContainer.appendChild(toast);

    toast.querySelector('.toast-close').addEventListener('click', () => {
      toast.remove();
    });

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateX(100%)';
      setTimeout(() => toast.remove(), 300);
    }, duration);
  }

  // --- Context Menu ---
  showContextMenu(x, y, txId) {
    if (!this.contextMenu) return;
    this.contextMenu.style.left = `${x}px`;
    this.contextMenu.style.top = `${y}px`;
    this.contextMenu.setAttribute('data-target-id', txId);
    this.contextMenu.classList.remove('hidden');
  }

  hideContextMenu() {
    if (this.contextMenu) this.contextMenu.classList.add('hidden');
  }

  // --- Details Modal ---
  showDetailsModal(tx, currency = 'USD') {
    const body = document.getElementById('details-modal-body');
    if (!body) return;

    body.innerHTML = `
      <div class="tx-details-card">
        <div class="detail-row"><strong>ID:</strong> <span>${tx.id}</span></div>
        <div class="detail-row"><strong>Title:</strong> <span>${escapeHTML(tx.title)}</span></div>
        <div class="detail-row"><strong>Type:</strong> <span class="badge ${tx.type === 'INCOME' ? 'trend-up' : 'trend-down'}">${tx.type}</span></div>
        <div class="detail-row"><strong>Amount:</strong> <span style="font-weight:700;">${formatCurrency(tx.amount, currency)}</span></div>
        <div class="detail-row"><strong>Category:</strong> <span>${escapeHTML(tx.category)}</span></div>
        <div class="detail-row"><strong>Date:</strong> <span>${formatDate(tx.date)}</span></div>
        <div class="detail-row"><strong>Payment Method:</strong> <span>${escapeHTML(tx.paymentMethod)}</span></div>
        <div class="detail-row"><strong>Description:</strong> <span>${escapeHTML(tx.description || 'N/A')}</span></div>
        <div class="detail-row"><strong>Created At:</strong> <span>${new Date(tx.createdAt).toLocaleString()}</span></div>
      </div>
    `;

    this.openModal(this.detailsModalBackdrop);
  }

  updateBinBadge(count = 0) {
    if (this.binCountBadge) {
      this.binCountBadge.textContent = count;
    }
  }
}
