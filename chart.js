/**
 * ApexFinance - Pure Vanilla SVG & CSS Chart Module (chart.js)
 * Rendering custom responsive SVG Monthly Bar Charts, SVG Donut Charts, and Animated Progress Bars
 * WITHOUT any external libraries (No Chart.js, No D3).
 */

import { formatCurrency, calculatePercentage, escapeHTML } from './utils.js';

export class ChartEngine {
  constructor() {
    this.monthlyChartContainer = document.getElementById('monthly-chart-container');
    this.donutContainer = document.getElementById('category-donut-container');
    this.legendContainer = document.getElementById('category-legend-list');
    this.progressGrid = document.getElementById('category-progress-grid');
  }

  /**
   * Render Monthly Income vs Expense Bar Chart using native SVG
   * @param {Array} transactions 
   * @param {string} currency 
   */
  renderMonthlyBarChart(transactions = [], currency = 'USD') {
    if (!this.monthlyChartContainer) return;

    // Group transactions by YYYY-MM
    const monthlyData = {};

    transactions.forEach(tx => {
      if (!tx.date) return;
      const monthKey = tx.date.substring(0, 7); // e.g. 2026-07
      if (!monthlyData[monthKey]) {
        monthlyData[monthKey] = { income: 0, expense: 0 };
      }
      if (tx.type === 'INCOME') {
        monthlyData[monthKey].income += Number(tx.amount) || 0;
      } else {
        monthlyData[monthKey].expense += Number(tx.amount) || 0;
      }
    });

    const months = Object.keys(monthlyData).sort().slice(-6); // Last 6 months

    if (months.length === 0) {
      this.monthlyChartContainer.innerHTML = `<div class="empty-state">No transaction history to plot charts</div>`;
      return;
    }

    // Find max value for Y-axis scale
    let maxVal = 100;
    months.forEach(m => {
      maxVal = Math.max(maxVal, monthlyData[m].income, monthlyData[m].expense);
    });

    const chartHeight = 220;
    const barWidth = 18;
    const groupGap = 60;
    const svgWidth = Math.max(300, months.length * groupGap + 40);

    const svgBars = months.map((mKey, idx) => {
      const data = monthlyData[mKey];
      const incomeH = (data.income / maxVal) * (chartHeight - 40);
      const expenseH = (data.expense / maxVal) * (chartHeight - 40);

      const xGroup = 30 + idx * groupGap;
      const yIncome = chartHeight - 25 - incomeH;
      const yExpense = chartHeight - 25 - expenseH;

      const dateObj = new Date(mKey + '-01');
      const monthLabel = dateObj.toLocaleString('en-US', { month: 'short' });

      return `
        <!-- Income Bar -->
        <rect x="${xGroup}" y="${yIncome}" width="${barWidth}" height="${incomeH}" 
              fill="url(#incomeGradient)" rx="4" class="svg-bar">
          <title>${monthLabel} Income: ${formatCurrency(data.income, currency)}</title>
        </rect>
        
        <!-- Expense Bar -->
        <rect x="${xGroup + barWidth + 4}" y="${yExpense}" width="${barWidth}" height="${expenseH}" 
              fill="url(#expenseGradient)" rx="4" class="svg-bar">
          <title>${monthLabel} Expense: ${formatCurrency(data.expense, currency)}</title>
        </rect>

        <!-- Month X-Label -->
        <text x="${xGroup + barWidth}" y="${chartHeight - 5}" text-anchor="middle" 
              fill="currentColor" font-size="11" opacity="0.75">${monthLabel}</text>
      `;
    }).join('');

    const svgHTML = `
      <svg class="svg-bar-chart" viewBox="0 0 ${svgWidth} ${chartHeight}">
        <defs>
          <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="hsl(160, 84%, 39%)" />
            <stop offset="100%" stop-color="hsl(160, 84%, 25%)" />
          </linearGradient>
          <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="hsl(346, 84%, 61%)" />
            <stop offset="100%" stop-color="hsl(346, 84%, 45%)" />
          </linearGradient>
        </defs>
        <!-- Horizontal grid lines -->
        <line x1="0" y1="${chartHeight - 25}" x2="${svgWidth}" y2="${chartHeight - 25}" stroke="var(--border-color)" stroke-width="1"/>
        <line x1="0" y1="${(chartHeight - 25) / 2}" x2="${svgWidth}" y2="${(chartHeight - 25) / 2}" stroke="var(--border-color)" stroke-dasharray="4" opacity="0.4"/>
        
        ${svgBars}
      </svg>
    `;

    this.monthlyChartContainer.innerHTML = svgHTML;
  }

  /**
   * Render Category Breakdown SVG Donut Chart
   */
  renderCategoryDonutChart(transactions = [], categoriesMap = {}, currency = 'USD') {
    if (!this.donutContainer) return;

    // Filter expenses only
    const categoryTotals = {};
    let totalExpense = 0;

    transactions.forEach(tx => {
      if (tx.type === 'EXPENSE') {
        const amt = Number(tx.amount) || 0;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
        totalExpense += amt;
      }
    });

    const catKeys = Object.keys(categoryTotals);

    if (catKeys.length === 0 || totalExpense === 0) {
      this.donutContainer.innerHTML = `<div class="empty-state" style="padding:1rem;">No Expense Data</div>`;
      if (this.legendContainer) this.legendContainer.innerHTML = '';
      return;
    }

    // SVG Donut Circle Math
    const radius = 70;
    const circumference = 2 * Math.PI * radius; // ~439.8
    let currentOffset = 0;

    const circles = catKeys.map(catName => {
      const amt = categoryTotals[catName];
      const percent = amt / totalExpense;
      const strokeDash = percent * circumference;
      const strokeGap = circumference - strokeDash;
      const catObj = categoriesMap[catName] || { color: '#6b7280' };

      const circleSvg = `
        <circle cx="90" cy="90" r="${radius}" 
                fill="none" 
                stroke="${catObj.color}" 
                stroke-width="22" 
                stroke-dasharray="${strokeDash} ${strokeGap}" 
                stroke-dashoffset="-${currentOffset}" 
                style="transition: stroke-dashoffset 0.6s ease;">
          <title>${catName}: ${formatCurrency(amt, currency)} (${Math.round(percent * 100)}%)</title>
        </circle>
      `;

      currentOffset += strokeDash;
      return circleSvg;
    }).join('');

    const donutHTML = `
      <svg viewBox="0 0 180 180" width="180" height="180" style="transform: rotate(-90deg);">
        ${circles}
      </svg>
      <div class="donut-center-text">
        <span class="donut-total-val">${formatCurrency(totalExpense, currency)}</span>
        <span class="donut-total-lbl">Total Spent</span>
      </div>
    `;

    this.donutContainer.innerHTML = donutHTML;

    // Render Category Legend List
    if (this.legendContainer) {
      const legendRows = catKeys.map(catName => {
        const amt = categoryTotals[catName];
        const percent = Math.round((amt / totalExpense) * 100);
        const catObj = categoriesMap[catName] || { color: '#6b7280' };

        return `
          <div class="legend-row">
            <div class="cat-item-left">
              <span class="cat-dot" style="background-color: ${catObj.color};"></span>
              <span>${escapeHTML(catName)}</span>
            </div>
            <div>
              <strong>${formatCurrency(amt, currency)}</strong>
              <span style="color:var(--text-muted); font-size:0.75rem;">(${percent}%)</span>
            </div>
          </div>
        `;
      }).join('');

      this.legendContainer.innerHTML = legendRows;
    }
  }

  /**
   * Render Category Progress Bars
   */
  renderCategoryProgressBars(transactions = [], categoriesMap = {}, currency = 'USD') {
    if (!this.progressGrid) return;

    const categoryTotals = {};
    let totalExpense = 0;

    transactions.forEach(tx => {
      if (tx.type === 'EXPENSE') {
        const amt = Number(tx.amount) || 0;
        categoryTotals[tx.category] = (categoryTotals[tx.category] || 0) + amt;
        totalExpense += amt;
      }
    });

    const catKeys = Object.keys(categoryTotals);

    if (catKeys.length === 0 || totalExpense === 0) {
      this.progressGrid.innerHTML = `<div class="empty-state">No category spending activity available</div>`;
      return;
    }

    const cardsHTML = catKeys.map(catName => {
      const amt = categoryTotals[catName];
      const percent = calculatePercentage(amt, totalExpense);
      const catObj = categoriesMap[catName] || { color: '#6366f1' };

      return `
        <div class="progress-card">
          <div class="progress-card-top">
            <span class="cat-item-left">
              <span class="cat-dot" style="background-color:${catObj.color}"></span>
              ${escapeHTML(catName)}
            </span>
            <span>${formatCurrency(amt, currency)} (${percent}%)</span>
          </div>
          <div class="cat-bar-track">
            <div class="cat-bar-fill" style="width: ${percent}%; background-color: ${catObj.color};"></div>
          </div>
        </div>
      `;
    }).join('');

    this.progressGrid.innerHTML = cardsHTML;
  }
}
