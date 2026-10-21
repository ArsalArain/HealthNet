import React, { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { clearAuthSession, getAuthUser } from "../utils/authStorage";
import AdminLayout from "./AdminLayout";
import AdminHome from "./AdminHome";
import AdminDepartments from "./AdminDepartments";
import AdminDoctors from "./AdminDoctors";
import AdminStaff from "./AdminStaff";
import AdminPatients from "./AdminPatients";
import AdminReports from "./AdminReports";
import AdminProfile from "./AdminProfile";
import AdminPatientFlowAI from "./AdminPatientFlowAI";
import AdminRosterOptimization from "./AdminRosterOptimization";
import AdminResourceOptimization from "./AdminResourceOptimization";
import AdminOperationsCenter from "./AdminOperationsCenter";

export default function Dashboard() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const user = getAuthUser();

  const currentPage = searchParams.get("page") || localStorage.getItem("adminPage") || "home";

  const setCurrentPage = (page) => {
    setSearchParams({ page });
    localStorage.setItem("adminPage", page);
  };

  useEffect(() => {
    if (!searchParams.get("page")) {
      setSearchParams({ page: currentPage }, { replace: true });
    }
  }, [searchParams, setSearchParams, currentPage]);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (user.role !== "hospital_admin") {
      navigate("/login");
      return;
    }
  }, [user, navigate]);

  const renderPage = () => {
    switch (currentPage) {
      case "home":
        return <AdminHome onNavigate={setCurrentPage} />;
      case "departments":
        return <AdminDepartments />;
      case "doctors":
        return <AdminDoctors />;
      case "staff":
        return <AdminStaff />;
      case "patients":
        return <AdminPatients />;
      case "reports":
        return <AdminReports />;
      case "operations-center":
        return <AdminOperationsCenter />;
      case "ai-patient-flow":
        return <AdminPatientFlowAI />;
      case "roster-optimization":
        return <AdminRosterOptimization />;
      case "resource-optimization":
        return <AdminResourceOptimization />;
      case "profile":
        return <AdminProfile />;
      default:
        return <AdminHome onNavigate={setCurrentPage} />;
    }
  };

  if (!user || user.role !== "hospital_admin") {
    return (
      <div className="hn-access-screen">
        <div className="hn-access-card">
          <h1>Access Denied</h1>
          <p>
            This page is only accessible to hospital administrators.
          </p>
          <button
            onClick={() => {
              clearAuthSession();
              navigate("/login");
            }}
            className="hn-access-btn"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <AdminLayout currentPage={currentPage} setCurrentPage={setCurrentPage}>
      {renderPage()}
    </AdminLayout>
  );
}
