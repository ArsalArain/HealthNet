import React, { useEffect, useState } from "react";
import api from "../services/api";
import { getAuthUser } from "../utils/authStorage";

export default function AdminProfile() {
  const authUser = getAuthUser();
  const [profile, setProfile] = useState(null);
  const [profileForm, setProfileForm] = useState({
    name: "",
    phone: "",
    current_password: "",
    password: "",
  });
  const [actionMessage, setActionMessage] = useState({ type: "", text: "" });
  const [profileSaving, setProfileSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(true);

  const hospitalId =
    profile?.hospital?._id ||
    profile?.hospital?.id ||
    authUser?.hospital_id ||
    "N/A";

  const hospitalCity =
    profile?.hospital?.city ||
    authUser?.city ||
    "";

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    try {
      const { data } = await api.get("/hospital-admin/profile");
      setProfile(data?.profile);
      setProfileForm((prev) => ({
        ...prev,
        name: data?.profile?.name || "",
        phone: data?.profile?.phone || "",
      }));
    } catch (err) {
      console.error("Error loading profile:", err);
      setActionMessage({ type: "error", text: "Failed to load profile." });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setActionMessage({ type: "", text: "" });
    setProfileSaving(true);

    try {
      const updateData = {
        name: profileForm.name,
        phone: profileForm.phone,
      };

      if (profileForm.password) {
        updateData.current_password = profileForm.current_password;
        updateData.password = profileForm.password;
      }

      await api.put("/hospital-admin/profile", updateData);
      setActionMessage({ type: "success", text: "Profile updated successfully!" });
      setProfileForm((prev) => ({
        ...prev,
        current_password: "",
        password: "",
      }));
      await loadProfile();
    } catch (err) {
      setActionMessage({
        type: "error",
        text: err.response?.data?.message || "Failed to update profile.",
      });
    } finally {
      setProfileSaving(false);
    }
  };

  return (
    <div>
      <h2 style={{ margin: "0 0 20px 0", color: "#0f172a" }}>Admin Profile</h2>

      {loading ? (
        <p style={{ color: "#64748b" }}>Loading profile...</p>
      ) : (
        <div style={{
          background: "#fff",
          border: "1px solid #e2e8f0",
          borderRadius: 12,
          padding: 24,
          maxWidth: 500,
        }}>
          {actionMessage.text && (
            <div style={{
              marginBottom: 16,
              borderRadius: 8,
              padding: "12px 16px",
              border: actionMessage.type === "success" ? "1px solid #86efac" : "1px solid #fecaca",
              background: actionMessage.type === "success" ? "#f0fdf4" : "#fef2f2",
              color: actionMessage.type === "success" ? "#166534" : "#991b1b",
            }}>
              {actionMessage.text}
            </div>
          )}

          <form onSubmit={handleUpdateProfile} style={{ display: "grid", gap: 12 }}>
            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>
                Hospital ID
              </label>
              <input
                type="text"
                value={hospitalId}
                readOnly
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "10px 12px",
                  boxSizing: "border-box",
                  fontSize: 14,
                  background: "#f8fafc",
                  color: "#334155",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>
                Full Name
              </label>
              <input
                type="text"
                value={profileForm.name}
                onChange={(e) => setProfileForm((p) => ({ ...p, name: e.target.value }))}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "10px 12px",
                  boxSizing: "border-box",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>
                City
              </label>
              <input
                type="text"
                value={hospitalCity}
                readOnly
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "10px 12px",
                  boxSizing: "border-box",
                  fontSize: 14,
                  background: "#f8fafc",
                  color: "#334155",
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>
                Phone Number
              </label>
              <input
                type="tel"
                value={profileForm.phone}
                onChange={(e) => setProfileForm((p) => ({ ...p, phone: e.target.value }))}
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "10px 12px",
                  boxSizing: "border-box",
                  fontSize: 14,
                }}
              />
            </div>

            <hr style={{ margin: "16px 0", border: "1px solid #e2e8f0" }} />

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>
                Current Password (to change password)
              </label>
              <input
                type="password"
                value={profileForm.current_password}
                onChange={(e) => setProfileForm((p) => ({ ...p, current_password: e.target.value }))}
                placeholder="Leave blank if not changing password"
                style={{
                  width: "100%",
                  border: "1px solid #cbd5e1",
                  borderRadius: 8,
                  padding: "10px 12px",
                  boxSizing: "border-box",
                  fontSize: 14,
                }}
              />
            </div>

            <div>
              <label style={{ display: "block", marginBottom: 6, fontWeight: 600, color: "#0f172a" }}>
                New Password
              </label>
              <div style={{ display: "flex", gap: 8 }}>
                <input
                  type={showPassword ? "text" : "password"}
                  value={profileForm.password}
                  onChange={(e) => setProfileForm((p) => ({ ...p, password: e.target.value }))}
                  placeholder="Leave blank to keep current password"
                  style={{
                    flex: 1,
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    padding: "10px 12px",
                    fontSize: 14,
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  style={{
                    border: "1px solid #cbd5e1",
                    borderRadius: 8,
                    background: "#f8fafc",
                    padding: "10px 12px",
                    cursor: "pointer",
                    fontSize: 12,
                  }}
                >
                  {showPassword ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={profileSaving}
              style={{
                border: "none",
                borderRadius: 8,
                background: "#0284c7",
                color: "#fff",
                padding: "12px",
                fontWeight: 700,
                cursor: profileSaving ? "not-allowed" : "pointer",
                opacity: profileSaving ? 0.6 : 1,
                marginTop: 8,
              }}
            >
              {profileSaving ? "Saving..." : "Save Changes"}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
