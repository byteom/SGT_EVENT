// Utility functions for filtering, sorting, and pagination

export function filterData(data, searchTerm, searchFields) {
  if (!searchTerm) return data;
  
  const term = searchTerm.toLowerCase();
  return data.filter(item => {
    return searchFields.some(field => {
      const value = getNestedValue(item, field);
      return value && String(value).toLowerCase().includes(term);
    });
  });
}

export function filterByField(data, field, value) {
  if (!value || value === 'all') return data;
  return data.filter(item => {
    const itemValue = getNestedValue(item, field);
    return String(itemValue).toLowerCase() === String(value).toLowerCase();
  });
}

export function sortData(data, sortField, sortDirection) {
  if (!sortField) return data;
  
  return [...data].sort((a, b) => {
    const aVal = getNestedValue(a, sortField);
    const bVal = getNestedValue(b, sortField);
    
    // Handle null/undefined values
    if (aVal == null && bVal == null) return 0;
    if (aVal == null) return 1;
    if (bVal == null) return -1;
    
    // Handle numbers
    if (typeof aVal === 'number' && typeof bVal === 'number') {
      return sortDirection === 'asc' ? aVal - bVal : bVal - aVal;
    }
    
    // Handle dates
    if (aVal instanceof Date || (typeof aVal === 'string' && aVal.match(/^\d{4}-\d{2}-\d{2}/))) {
      const aDate = new Date(aVal);
      const bDate = new Date(bVal);
      return sortDirection === 'asc' ? aDate - bDate : bDate - aDate;
    }
    
    // Handle strings
    const aStr = String(aVal).toLowerCase();
    const bStr = String(bVal).toLowerCase();
    if (sortDirection === 'asc') {
      return aStr.localeCompare(bStr);
    } else {
      return bStr.localeCompare(aStr);
    }
  });
}

export function paginateData(data, currentPage, itemsPerPage) {
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  return {
    paginatedData: data.slice(startIndex, endIndex),
    totalPages: Math.ceil(data.length / itemsPerPage),
    totalItems: data.length
  };
}

function getNestedValue(obj, path) {
  return path.split('.').reduce((current, prop) => current?.[prop], obj);
}

export function getUniqueValues(data, field) {
  const values = data.map(item => getNestedValue(item, field)).filter(Boolean);
  return [...new Set(values)].sort();
}

