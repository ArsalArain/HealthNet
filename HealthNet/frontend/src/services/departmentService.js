import api from "./api";

/**
 * Department Service - Handles all department-related API calls
 */

export const departmentService = {
  /**
   * Get available default departments with their creation status
   * @returns {Promise} List of available departments with status
   */
  getAvailableDepartments: async () => {
    return api.get("/hospital-admin/departments/batch/available");
  },

  /**
   * Create default 13 departments for AI section
   * @param {Array} departments - Optional array of department names to create
   * @returns {Promise} Response with created departments info
   */
  createDefaultDepartments: async (departments = null) => {
    return api.post("/hospital-admin/departments/batch/create-defaults", {
      departments: Array.isArray(departments) ? departments : [],
    });
  },

  /**
   * Get all departments for the hospital
   * @param {Object} params - Query parameters (status, etc.)
   * @returns {Promise} List of departments
   */
  getAllDepartments: async (params = {}) => {
    return api.get("/hospital-admin/departments", { params });
  },

  /**
   * Get a single department by ID
   * @param {string} departmentId - Department ID
   * @returns {Promise} Department details
   */
  getDepartmentById: async (departmentId) => {
    return api.get(`/hospital-admin/departments/${departmentId}`);
  },

  /**
   * Get stored prediction cache entries for a department
   * @param {string} departmentId - Department ID
   * @param {number} limit - Maximum number of entries
   * @returns {Promise} Stored prediction entries
   */
  getStoredPredictions: async (departmentId, limit = 10) => {
    return api.get("/hospital-admin/ai/stored-predictions", {
      params: { department_id: departmentId, limit },
    });
  },

  /**
   * Create a new department
   * @param {Object} departmentData - Department information (name, description, head_doctor_id)
   * @returns {Promise} Created department
   */
  createDepartment: async (departmentData) => {
    return api.post("/hospital-admin/departments", departmentData);
  },

  /**
   * Update a department
   * @param {string} departmentId - Department ID
   * @param {Object} updateData - Data to update (name, description, status, head_doctor_id)
   * @returns {Promise} Updated department
   */
  updateDepartment: async (departmentId, updateData) => {
    return api.patch(`/hospital-admin/departments/${departmentId}`, updateData);
  },

  /**
   * Delete a department
   * @param {string} departmentId - Department ID
   * @returns {Promise} Delete confirmation
   */
  deleteDepartment: async (departmentId) => {
    return api.delete(`/hospital-admin/departments/${departmentId}`);
  },
};

export default departmentService;
