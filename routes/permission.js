const express = require("express");
const router = express.Router();
const { AuthMiddleWare, RequireRoles } = require("../middlewares/auth");
const {
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
  initializePermissions
} = require("../controllers/permission");

// All routes require authentication
router.use(AuthMiddleWare);

// Get all permissions (admin only)
router.get("/", RequireRoles("ADMIN"), getAllPermissions);


router.get("/:role", getRolePermissions);

// Update permissions for a role (admin only)
router.put("/:role", RequireRoles("ADMIN"), updateRolePermissions);

// Initialize default permissions (useful for first-time setup) (admin only)
router.post("/initialize", RequireRoles("ADMIN"), initializePermissions);

module.exports = router;

