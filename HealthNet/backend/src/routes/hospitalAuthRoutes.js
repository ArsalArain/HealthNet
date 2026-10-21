const express = require("express");

const {
  registerHospitalAdmin,
  loginHospitalAdmin,
} = require("../controllers/hospitalAuthController");
const { verifyToken, authorizeRole } = require("../middleware/authMiddleware");

const router = express.Router();

router.post("/register", registerHospitalAdmin);
router.post("/login", loginHospitalAdmin);

// Sample protected endpoint to verify token + role middleware for hospital admins.
router.get("/me", verifyToken, authorizeRole("hospital_admin"), (req, res) => {
  return res.json({
    success: true,
    user: {
      id: String(req.user._id),
      name: req.user.username,
      email: req.user.email,
      role: req.user.role,
      hospital_id: req.user.hospital_id ? String(req.user.hospital_id) : null,
    },
  });
});

module.exports = router;
