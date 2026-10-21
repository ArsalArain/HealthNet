import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../services/api";
import "./DepartmentResources.css"; // We'll create a dedicated stylesheet for custom styles

export default function DepartmentResources({ hospitalId }) {
  const [departmentsData, setDepartmentsData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all', 'healthy', 'low_stock'
  const [expandedDeptId, setExpandedDeptId] = useState(null);

  // Editing state
  const [editingResourceId, setEditingResourceId] = useState(null);
  const [editForm, setEditForm] = useState({
    name: "",
    category: "",
    minQuantity: 0,
    maxQuantity: 0,
    currentQuantity: 0,
    status: ""
  });

  // Adding state
  const [addingResourceDeptId, setAddingResourceDeptId] = useState(null);
  const [addForm, setAddForm] = useState({
    name: "",
    category: "General",
    minQuantity: 10,
    maxQuantity: 50,
    currentQuantity: 25,
    status: "Medium"
  });

  const handleEditClick = (res) => {
    setEditingResourceId(res.id);
    setEditForm({
      name: res.name,
      category: res.category,
      minQuantity: res.minQuantity,
      maxQuantity: res.maxQuantity,
      currentQuantity: res.currentQuantity,
      status: res.status
    });
  };

  const handleSaveEdit = async (resId) => {
    try {
      if (!editForm.name.trim()) {
        alert("Resource name is required.");
        return;
      }
      const response = await api.put(`/department-resources/${resId}`, {
        name: editForm.name,
        category: editForm.category,
        min_quantity: editForm.minQuantity,
        max_quantity: editForm.maxQuantity,
        current_quantity: editForm.currentQuantity,
        status: editForm.status
      });
      if (response.data && response.data.success) {
        setDepartmentsData(prev => prev.map(dept => {
          const updatedResources = (dept.resources || []).map(r => {
            if (r.id === resId) {
              const currentQty = response.data.data.available_quantity;
              const minQty = response.data.data.min_quantity;
              const status = response.data.data.status;
              return {
                id: resId,
                name: response.data.data.name,
                category: response.data.data.category,
                minQuantity: minQty,
                maxQuantity: response.data.data.max_quantity,
                currentQuantity: currentQty,
                status: status,
                isLowStock: status.toLowerCase() === "low" || currentQty <= minQty
              };
            }
            return r;
          });
          return {
            ...dept,
            resources: updatedResources
          };
        }));
        setEditingResourceId(null);
      }
    } catch (err) {
      console.error("Error updating resource:", err);
      alert(err.response?.data?.message || "Failed to update resource.");
    }
  };

  const handleAddClick = (deptId) => {
    setAddingResourceDeptId(deptId);
    setAddForm({
      name: "",
      category: "General",
      minQuantity: 10,
      maxQuantity: 50,
      currentQuantity: 25,
      status: "Medium"
    });
  };

  const handleSaveAdd = async (deptId) => {
    try {
      if (!addForm.name.trim()) {
        alert("Resource name is required.");
        return;
      }
      const response = await api.post("/department-resources", {
        hospital_id: hospitalId,
        department_id: deptId,
        name: addForm.name,
        category: addForm.category,
        min_quantity: addForm.minQuantity,
        max_quantity: addForm.maxQuantity,
        current_quantity: addForm.currentQuantity,
        status: addForm.status
      });
      if (response.data && response.data.success) {
        const newRes = response.data.data;
        const mappedRes = {
          id: String(newRes._id),
          name: newRes.name,
          category: newRes.category,
          minQuantity: newRes.min_quantity,
          maxQuantity: newRes.max_quantity,
          currentQuantity: newRes.available_quantity,
          status: newRes.status,
          isLowStock: newRes.status.toLowerCase() === "low" || newRes.available_quantity <= newRes.min_quantity
        };
        
        setDepartmentsData(prev => prev.map(dept => {
          if (String(dept._id) === String(deptId)) {
            return {
              ...dept,
              resources: [...(dept.resources || []), mappedRes]
            };
          }
          return dept;
        }));
        setAddingResourceDeptId(null);
      }
    } catch (err) {
      console.error("Error adding resource:", err);
      alert(err.response?.data?.message || "Failed to add resource.");
    }
  };

  const handleDeleteResource = async (resId, deptId) => {
    if (!window.confirm("Are you sure you want to delete this resource?")) return;
    try {
      const response = await api.delete(`/department-resources/${resId}`);
      if (response.data && response.data.success) {
        setDepartmentsData(prev => prev.map(dept => {
          if (String(dept._id) === String(deptId)) {
            return {
              ...dept,
              resources: (dept.resources || []).filter(r => r.id !== resId)
            };
          }
          return dept;
        }));
      }
    } catch (err) {
      console.error("Error deleting resource:", err);
      alert(err.response?.data?.message || "Failed to delete resource.");
    }
  };

  // Fetch department resources on mount and when hospitalId changes
  const fetchResources = useCallback(async (silent = false) => {
    if (!hospitalId) {
      setLoading(false);
      return;
    }
    try {
      if (!silent) {
        setLoading(true);
        setError(null);
      }
      const response = await api.get(`/department-resources?hospital_id=${hospitalId}`);
      if (response.data && response.data.success) {
        setDepartmentsData(response.data.data || []);
      } else {
        setError("Failed to fetch department resources.");
      }
    } catch (err) {
      console.error("Error fetching department resources:", err);
      setError(err.response?.data?.message || "An error occurred while loading resource data.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, [hospitalId]);

  useEffect(() => {
    fetchResources(false);
  }, [fetchResources]);

  // Extract all unique categories present in the data for the category filter dropdown
  const categories = useMemo(() => {
    const set = new Set();
    departmentsData.forEach((dept) => {
      (dept.resources || []).forEach((res) => {
        if (res.category) set.add(res.category);
      });
    });
    return ["all", ...Array.from(set).sort()];
  }, [departmentsData]);

  // Process data based on Search and Filters
  const filteredData = useMemo(() => {
    return departmentsData
      .map((dept) => {
        // Filter resources of this department by search term and category
        const filteredResources = (dept.resources || []).filter((res) => {
          const matchesSearch =
            (res.name && res.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (dept.name && dept.name.toLowerCase().includes(searchTerm.toLowerCase()));
          
          const matchesCategory =
            categoryFilter === "all" || res.category === categoryFilter;

          return matchesSearch && matchesCategory;
        });

        // Compute updated totals for filtered subset
        const totalUnits = filteredResources.reduce((sum, r) => sum + r.currentQuantity, 0);
        const lowStockResources = filteredResources.filter((r) => r.isLowStock);
        const hasLowStock = lowStockResources.length > 0;

        return {
          ...dept,
          resources: filteredResources,
          resourceCount: filteredResources.length,
          totalUnits,
          lowStockCount: lowStockResources.length,
          hasLowStock,
        };
      })
      // Filter department level records
      .filter((dept) => {
        // If we filtered out all resources and search term or category filter is active, 
        // keep department only if its name matches the search query.
        if (dept.resourceCount === 0 && (searchTerm || categoryFilter !== "all")) {
          return dept.name.toLowerCase().includes(searchTerm.toLowerCase());
        }

        // Apply status filter
        if (statusFilter === "low_stock") {
          return dept.hasLowStock;
        } else if (statusFilter === "healthy") {
          return !dept.hasLowStock && dept.resourceCount > 0;
        }

        return true;
      });
  }, [departmentsData, searchTerm, categoryFilter, statusFilter]);

  // Overall counts and summaries calculated from the matching data
  const summaryMetrics = useMemo(() => {
    let totalDepts = 0;
    let totalResources = 0;
    let totalUnits = 0;
    let lowStockCount = 0;

    filteredData.forEach((dept) => {
      totalDepts++;
      totalResources += dept.resourceCount;
      totalUnits += dept.totalUnits;
      if (dept.hasLowStock) {
        lowStockCount++;
      }
    });

    return {
      totalDepts,
      totalResources,
      totalUnits,
      lowStockCount,
    };
  }, [filteredData]);

  const toggleExpandDept = (id) => {
    setExpandedDeptId((prev) => (prev === id ? null : id));
  };

  // Helper for rendering status badges
  const getStatusBadgeClass = (statusStr) => {
    switch (statusStr.toLowerCase()) {
      case "very high":
        return "dr-badge-very-high";
      case "high":
        return "dr-badge-high";
      case "medium":
        return "dr-badge-medium";
      case "low":
        return "dr-badge-low";
      case "out of stock":
        return "dr-badge-out";
      default:
        return "dr-badge-neutral";
    }
  };

  return (
    <div className="dr-container">
      {/* Header Info */}
      <div className="dr-header">
        <div className="dr-header-title">
          <h2>Departmental Inventory &amp; Resources</h2>
          <p>Real-time tracking and audit of materials mapped by department</p>
        </div>
        <button className="dr-btn-refresh" onClick={() => fetchResources(true)}>
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67"/></svg>
          Refresh Data
        </button>
      </div>

      {error && (
        <div className="dr-error-card">
          <svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
          <div className="dr-error-text">
            <h4>Failed to load data</h4>
            <p>{error}</p>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div className="dr-summary-grid">
        <div className="dr-summary-card">
          <div className="dr-card-icon icon-depts">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>
          </div>
          <div className="dr-card-details">
            <span className="dr-card-label">Active Departments</span>
            <h3 className="dr-card-value">{loading ? "..." : summaryMetrics.totalDepts}</h3>
          </div>
        </div>

        <div className="dr-summary-card">
          <div className="dr-card-icon icon-resources">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="2" y="7" width="20" height="14" rx="2" ry="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
          </div>
          <div className="dr-card-details">
            <span className="dr-card-label">Tracked Resource Types</span>
            <h3 className="dr-card-value">{loading ? "..." : summaryMetrics.totalResources}</h3>
          </div>
        </div>

        <div className="dr-summary-card">
          <div className="dr-card-icon icon-units">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
          </div>
          <div className="dr-card-details">
            <span className="dr-card-label">Total Stock Units</span>
            <h3 className="dr-card-value">{loading ? "..." : summaryMetrics.totalUnits.toLocaleString()}</h3>
          </div>
        </div>

        <div className={`dr-summary-card ${summaryMetrics.lowStockCount > 0 ? "dr-card-warning-active" : ""}`}>
          <div className="dr-card-icon icon-warning">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div className="dr-card-details">
            <span className="dr-card-label">Low Stock Warnings</span>
            <h3 className="dr-card-value text-danger">
              {loading ? "..." : `${summaryMetrics.lowStockCount} Depts`}
            </h3>
          </div>
        </div>
      </div>

      {/* Filters Area */}
      <div className="dr-filters-row">
        <div className="dr-select-wrapper dr-search-wrapper">
          <label htmlFor="search-input">Search Inventory</label>
          <div className="dr-search-box">
            <svg className="search-icon" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input
              id="search-input"
              type="text"
              placeholder="Search by department name or resource..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        <div className="dr-dropdowns">
          <div className="dr-select-wrapper">
            <label htmlFor="category-select">Category</label>
            <select
              id="category-select"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat === "all" ? "All Categories" : cat}
                </option>
              ))}
            </select>
          </div>

          <div className="dr-select-wrapper">
            <label htmlFor="status-select">Stock Status</label>
            <select
              id="status-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All Departments</option>
              <option value="healthy">Healthy Stock</option>
              <option value="low_stock">Low Stock Warnings</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table Data */}
      <div className="dr-table-container">
        {loading ? (
          <div className="dr-loading-state">
            <div className="dr-spinner"></div>
            <p>Loading departmental resource matrix...</p>
          </div>
        ) : filteredData.length === 0 ? (
          <div className="dr-empty-state">
            <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1.5"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
            <h3>No departments match your criteria</h3>
            <p>Try clearing filters or checking spelling of search query.</p>
          </div>
        ) : (
          <table className="dr-main-table">
            <thead>
              <tr>
                <th>Department Name</th>
                <th>Status</th>
                <th>Head Doctor</th>
                <th>Resource Types</th>
                <th>Total Units</th>
                <th>Stock Health</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.map((dept) => {
                const isExpanded = expandedDeptId === dept._id;
                return (
                  <React.Fragment key={dept._id}>
                    <tr className={`dr-row-main ${isExpanded ? "dr-row-expanded-header" : ""}`}>
                      <td className="dr-cell-name">
                        <div className="dr-dept-indicator"></div>
                        <span>{dept.name}</span>
                      </td>
                      <td>
                        <span className={`dr-badge-status ${dept.status === "active" ? "dr-status-active" : "dr-status-inactive"}`}>
                          {dept.status}
                        </span>
                      </td>
                      <td>
                        <div className="dr-doctor-info">
                          <span className="dr-doctor-name">{dept.headDoctor}</span>
                          {dept.headDoctorSpecialization && (
                            <span className="dr-doctor-spec">{dept.headDoctorSpecialization}</span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="dr-cell-number">{dept.resourceCount} items</span>
                      </td>
                      <td>
                        <span className="dr-cell-number text-bold">{dept.totalUnits.toLocaleString()}</span>
                      </td>
                      <td>
                        {dept.hasLowStock ? (
                          <span className="dr-stock-warning-badge">
                            <svg viewBox="0 0 24 24" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="3"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                            Low Stock ({dept.lowStockCount})
                          </span>
                        ) : dept.resourceCount === 0 ? (
                          <span className="dr-stock-none-badge">No resources mapped</span>
                        ) : (
                          <span className="dr-stock-healthy-badge">Healthy</span>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className={`dr-btn-expand ${isExpanded ? "dr-btn-expanded-active" : ""}`}
                          onClick={() => toggleExpandDept(dept._id)}
                        >
                          {isExpanded ? "Hide Resources" : "View Resources"}
                          <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" className="chevron-icon"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                      </td>
                    </tr>

                    {/* Sub-table expansion */}
                    {isExpanded && (
                      <tr className="dr-row-subtable">
                        <td colSpan="7">
                          <div className="dr-subtable-wrapper">
                            <div className="dr-subtable-header">
                              <h4>Resources under {dept.name} Department</h4>
                            </div>
                            <table className="dr-inner-table">
                              <thead>
                                <tr>
                                  <th>Resource Name</th>
                                  <th>Category</th>
                                  <th style={{ textAlign: "center" }}>Required Range</th>
                                  <th style={{ textAlign: "center" }}>Current Quantity</th>
                                  <th>Stock Level Ratio</th>
                                  <th>Status</th>
                                  <th style={{ textAlign: "right" }}>Actions</th>
                                </tr>
                              </thead>
                              <tbody>
                                {dept.resources.length === 0 && addingResourceDeptId !== dept._id ? (
                                  <tr>
                                    <td colSpan="7" className="dr-sub-empty" style={{ textAlign: "center" }}>
                                      No resources matching filters for this department.
                                    </td>
                                  </tr>
                                ) : (
                                  dept.resources.map((res) => {
                                    if (editingResourceId === res.id) {
                                      return (
                                        <tr key={res.id} className="dr-sub-row-editing">
                                          <td>
                                            <input
                                              type="text"
                                              className="dr-edit-input-text"
                                              value={editForm.name}
                                              onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                                              placeholder="Resource name"
                                              required
                                            />
                                          </td>
                                          <td>
                                            <select
                                              className="dr-edit-select"
                                              value={editForm.category}
                                              onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                                            >
                                              <option value="General">General</option>
                                              <option value="Diagnostic">Diagnostic</option>
                                              <option value="Monitoring">Monitoring</option>
                                              <option value="PPE">PPE</option>
                                              <option value="Medication">Medication</option>
                                              <option value="Consumable">Consumable</option>
                                              <option value="Therapeutic">Therapeutic</option>
                                              <option value="Life support">Life Support</option>
                                              <option value="Other">Other</option>
                                            </select>
                                          </td>
                                          <td style={{ textAlign: "center" }}>
                                            <div className="dr-range-inputs">
                                              <input
                                                type="number"
                                                className="dr-edit-input-num"
                                                value={editForm.minQuantity}
                                                onChange={(e) => setEditForm({ ...editForm, minQuantity: parseInt(e.target.value) || 0 })}
                                                placeholder="Min"
                                              />
                                              <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>-</span>
                                              <input
                                                type="number"
                                                className="dr-edit-input-num"
                                                value={editForm.maxQuantity}
                                                onChange={(e) => setEditForm({ ...editForm, maxQuantity: parseInt(e.target.value) || 0 })}
                                                placeholder="Max"
                                              />
                                            </div>
                                          </td>
                                          <td style={{ textAlign: "center" }}>
                                            <input
                                              type="number"
                                              className="dr-edit-input-num"
                                              value={editForm.currentQuantity}
                                              onChange={(e) => setEditForm({ ...editForm, currentQuantity: parseInt(e.target.value) || 0 })}
                                              placeholder="Current"
                                            />
                                          </td>
                                          <td className="dr-progress-cell">
                                            <span>{editForm.maxQuantity > 0 ? Math.round((editForm.currentQuantity / editForm.maxQuantity) * 100) : 0}%</span>
                                          </td>
                                          <td>
                                            <select
                                              className="dr-edit-select"
                                              value={editForm.status}
                                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                                            >
                                              <option value="Very High">Very High</option>
                                              <option value="High">High</option>
                                              <option value="Medium">Medium</option>
                                              <option value="Low">Low</option>
                                              <option value="Out of stock">Out of Stock</option>
                                            </select>
                                          </td>
                                          <td style={{ textAlign: "right" }}>
                                            <div className="dr-edit-actions">
                                              <button className="dr-btn-action-save" onClick={() => handleSaveEdit(res.id)}>Save</button>
                                              <button className="dr-btn-action-cancel" onClick={() => setEditingResourceId(null)}>Cancel</button>
                                            </div>
                                          </td>
                                        </tr>
                                      );
                                    }

                                    const ratio = res.maxQuantity > 0 ? (res.currentQuantity / res.maxQuantity) * 100 : 0;
                                    const progressColor = res.isLowStock ? "var(--danger)" : "var(--accent-500)";
                                    
                                    return (
                                      <tr key={res.id} className={res.isLowStock ? "dr-sub-row-warning" : ""}>
                                        <td className="dr-sub-cell-name">
                                          {res.isLowStock && (
                                            <span className="dr-warning-dot" title="Low stock threshold breached"></span>
                                          )}
                                          {res.name}
                                        </td>
                                        <td>
                                          <span className="dr-category-badge">{res.category}</span>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                          <span className="dr-range-text">{res.minQuantity} - {res.maxQuantity}</span>
                                        </td>
                                        <td style={{ textAlign: "center" }}>
                                          <span className={`dr-qty-text ${res.isLowStock ? "text-danger text-bold" : ""}`}>
                                            {res.currentQuantity}
                                          </span>
                                        </td>
                                        <td className="dr-progress-cell">
                                          <div className="dr-progress-container">
                                            <div
                                              className="dr-progress-bar"
                                              style={{
                                                width: `${Math.min(100, ratio)}%`,
                                                backgroundColor: progressColor,
                                              }}
                                            ></div>
                                          </div>
                                          <span className="dr-ratio-label">{Math.round(ratio)}%</span>
                                        </td>
                                        <td>
                                          <span className={`dr-level-badge ${getStatusBadgeClass(res.status)}`}>
                                            {res.status}
                                          </span>
                                        </td>
                                        <td style={{ textAlign: "right" }}>
                                          <div className="dr-sub-actions">
                                            <button
                                              className="dr-btn-icon dr-btn-edit"
                                              onClick={() => handleEditClick(res)}
                                              title="Edit Resource"
                                            >
                                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4z"/></svg>
                                            </button>
                                            <button
                                              className="dr-btn-icon dr-btn-delete"
                                              onClick={() => handleDeleteResource(res.id, dept._id)}
                                              title="Delete Resource"
                                            >
                                              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    );
                                  })
                                )}

                                {addingResourceDeptId === dept._id && (
                                  <tr className="dr-sub-row-adding">
                                    <td>
                                      <input
                                        type="text"
                                        className="dr-edit-input-text"
                                        placeholder="New Resource Name"
                                        value={addForm.name}
                                        onChange={(e) => setAddForm({ ...addForm, name: e.target.value })}
                                        required
                                      />
                                    </td>
                                    <td>
                                      <select
                                        className="dr-edit-select"
                                        value={addForm.category}
                                        onChange={(e) => setAddForm({ ...addForm, category: e.target.value })}
                                      >
                                        <option value="General">General</option>
                                        <option value="Diagnostic">Diagnostic</option>
                                        <option value="Monitoring">Monitoring</option>
                                        <option value="PPE">PPE</option>
                                        <option value="Medication">Medication</option>
                                        <option value="Consumable">Consumable</option>
                                        <option value="Therapeutic">Therapeutic</option>
                                        <option value="Life support">Life Support</option>
                                        <option value="Other">Other</option>
                                      </select>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <div className="dr-range-inputs">
                                        <input
                                          type="number"
                                          className="dr-edit-input-num"
                                          placeholder="Min"
                                          value={addForm.minQuantity}
                                          onChange={(e) => setAddForm({ ...addForm, minQuantity: parseInt(e.target.value) || 0 })}
                                        />
                                        <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>-</span>
                                        <input
                                          type="number"
                                          className="dr-edit-input-num"
                                          placeholder="Max"
                                          value={addForm.maxQuantity}
                                          onChange={(e) => setAddForm({ ...addForm, maxQuantity: parseInt(e.target.value) || 0 })}
                                        />
                                      </div>
                                    </td>
                                    <td style={{ textAlign: "center" }}>
                                      <input
                                        type="number"
                                        className="dr-edit-input-num"
                                        placeholder="Current"
                                        value={addForm.currentQuantity}
                                        onChange={(e) => setAddForm({ ...addForm, currentQuantity: parseInt(e.target.value) || 0 })}
                                      />
                                    </td>
                                    <td className="dr-progress-cell">
                                      <span>{addForm.maxQuantity > 0 ? Math.round((addForm.currentQuantity / addForm.maxQuantity) * 100) : 0}%</span>
                                    </td>
                                    <td>
                                      <select
                                        className="dr-edit-select"
                                        value={addForm.status}
                                        onChange={(e) => setAddForm({ ...addForm, status: e.target.value })}
                                      >
                                        <option value="Very High">Very High</option>
                                        <option value="High">High</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Low">Low</option>
                                        <option value="Out of stock">Out of Stock</option>
                                      </select>
                                    </td>
                                    <td style={{ textAlign: "right" }}>
                                      <div className="dr-edit-actions">
                                        <button className="dr-btn-action-save" onClick={() => handleSaveAdd(dept._id)}>Add</button>
                                        <button className="dr-btn-action-cancel" onClick={() => setAddingResourceDeptId(null)}>Cancel</button>
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </tbody>
                            </table>

                            {addingResourceDeptId !== dept._id && (
                              <div style={{ marginTop: 14 }}>
                                <button
                                  className="dr-btn-add-resource"
                                  onClick={() => handleAddClick(dept._id)}
                                >
                                  <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" style={{ marginRight: 6 }}><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                                  Add Resource
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
