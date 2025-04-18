import { useState, useCallback, useMemo } from 'react';

export function useSubmissions() {
  const [submissions, setSubmissions] = useState([
    { id: '1', name: 'Project A', date: 'Apr 1, 2025', status: 'Pending', designer: 'Alice Johnson', product: 'Smart Watch' },
    { id: '2', name: 'Project B', date: 'Apr 2, 2025', status: 'Approved', designer: 'Bob Smith', product: 'Wireless Headphones' },
    { id: '3', name: 'Project C', date: 'Apr 3, 2025', status: 'Rejected', designer: 'Charlie Lee', product: 'Bluetooth Speaker' },
  ]);

  const [selectedTab, setSelectedTab] = useState('Pending');
  const [searchQuery, setSearchQuery] = useState('');
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [selectedItems, setSelectedItems] = useState([]);

  const handleApprove = useCallback((id) => {
    setSubmissions(prev => 
      prev.map(sub => 
        sub.id === id ? { ...sub, status: 'Approved' } : sub
      )
    );
  }, []);

  const handleReject = useCallback((id) => {
    setSubmissions(prev => 
      prev.map(sub => 
        sub.id === id ? { ...sub, status: 'Rejected' } : sub
      )
    );
  }, []);

  const handleSelectionChange = useCallback((selected) => {
    setSelectedItems(selected);
  }, []);

  const filteredAndSortedSubmissions = useMemo(() => {
    let result = [...submissions];

    // Filter by status
    if (selectedTab !== 'All') {
      result = result.filter(sub => sub.status.toLowerCase() === selectedTab.toLowerCase());
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(sub => 
        sub.name.toLowerCase().includes(query) ||
        sub.designer.toLowerCase().includes(query) ||
        sub.product.toLowerCase().includes(query)
      );
    }

    // Sort
    result.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const direction = sortDirection === 'asc' ? 1 : -1;
      
      if (typeof aValue === 'string') {
        return direction * aValue.localeCompare(bValue);
      }
      return direction * (aValue - bValue);
    });

    return result;
  }, [submissions, selectedTab, searchQuery, sortField, sortDirection]);

  return {
    submissions: filteredAndSortedSubmissions,
    selectedTab,
    setSelectedTab,
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortDirection,
    setSortDirection,
    handleApprove,
    handleReject,
    selectedItems,
    handleSelectionChange,
  };
} 