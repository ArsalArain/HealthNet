import api from "./api";

const receptionistService = {
  getDepartments() {
    return api.get("/receptionist/departments");
  },

  getDoctors(params = {}) {
    return api.get("/receptionist/doctors", { params });
  },

  getDoctorAvailability(params = {}) {
    return api.get("/receptionist/doctors/availability", { params });
  },

  createPatient(payload) {
    return api.post("/receptionist/patients", payload);
  },

  updatePatient(patientId, payload) {
    return api.put(`/receptionist/patients/${patientId}`, payload);
  },

  getPatients(params = {}) {
    return api.get("/receptionist/patients", { params });
  },

  getPatientHistory(patientId) {
    return api.get(`/receptionist/patients/${patientId}/history`);
  },

  createAppointment(payload) {
    return api.post("/receptionist/appointments", payload);
  },

  getAppointments(params = {}) {
    return api.get("/receptionist/appointments", { params });
  },

  updateAppointment(appointmentId, payload) {
    return api.put(`/receptionist/appointments/${appointmentId}`, payload);
  },

  getQueue(params = {}) {
    return api.get("/receptionist/queue", { params });
  },

  updateQueue(queueId, payload) {
    return api.put(`/receptionist/queue/${queueId}`, payload);
  },
};

export default receptionistService;
