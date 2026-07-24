/**
 * ApexFinance - Custom Validation Module (validation.js)
 * Form validation engine for transaction inputs, category creation, and error mapping.
 */

/**
 * Validates transaction creation/editing form payload
 * @param {Object} formData 
 * @returns {{ isValid: boolean, errors: Object }}
 */
export function validateTransactionData(formData) {
  const errors = {};

  // Title Validation
  const title = (formData.title || '').trim();
  if (!title) {
    errors.title = 'Title is required.';
  } else if (title.length < 2) {
    errors.title = 'Title must be at least 2 characters long.';
  } else if (title.length > 60) {
    errors.title = 'Title cannot exceed 60 characters.';
  }

  // Amount Validation
  const amount = Number(formData.amount);
  if (isNaN(amount) || formData.amount === '' || formData.amount === null) {
    errors.amount = 'Amount is required.';
  } else if (amount <= 0) {
    errors.amount = 'Amount must be greater than $0.00.';
  } else if (amount > 1000000000) {
    errors.amount = 'Amount exceeds maximum allowable limit.';
  }

  // Category Validation
  const category = (formData.category || '').trim();
  if (!category) {
    errors.category = 'Please select a category.';
  }

  // Date Validation
  const date = (formData.date || '').trim();
  if (!date) {
    errors.date = 'Date is required.';
  } else {
    const parsedDate = new Date(date);
    if (isNaN(parsedDate.getTime())) {
      errors.date = 'Please enter a valid date.';
    }
  }

  // Type Validation
  const type = formData.type;
  if (type !== 'INCOME' && type !== 'EXPENSE') {
    errors.type = 'Transaction type must be Income or Expense.';
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}

/**
 * Validates custom category creation input
 * @param {string} categoryName 
 * @param {Array} existingCategories 
 * @returns {{ isValid: boolean, error?: string }}
 */
export function validateCategoryData(categoryName, existingCategories = []) {
  const name = (categoryName || '').trim();
  if (!name) {
    return { isValid: false, error: 'Category name cannot be empty.' };
  }
  if (name.length < 2 || name.length > 25) {
    return { isValid: false, error: 'Category name must be between 2 and 25 characters.' };
  }

  const isDuplicate = existingCategories.some(
    cat => cat.name.toLowerCase() === name.toLowerCase()
  );

  if (isDuplicate) {
    return { isValid: false, error: 'A category with this name already exists.' };
  }

  return { isValid: true };
}
