const Permission = require("../models/permission");

// Get all permissions for all roles
const getAllPermissions = async (req, res) => {
  try {
    const permissions = await Permission.find();
    res.status(200).json({ success: true, data: permissions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get permissions for a specific role
const getRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    // enforce: only ADMIN or users requesting their own role can fetch
    const requesterRole = req.user?.role;
    if (!requesterRole) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }
    if (requesterRole !== "ADMIN" && requesterRole !== role) {
      return res.status(403).json({ success: false, message: "Forbidden" });
    }

    const permission = await Permission.findOne({ role });
    
    if (!permission) {
      return res.status(404).json({ success: false, message: "Role permissions not found" });
    }
    
    res.status(200).json({ success: true, data: permission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update permissions for a role
const updateRolePermissions = async (req, res) => {
  try {
    const { role } = req.params;
    const { permissions } = req.body;
    
    const updatedPermission = await Permission.findOneAndUpdate(
      { role },
      { permissions },
      { new: true, upsert: true }
    );
    
    res.status(200).json({ success: true, data: updatedPermission });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Initialize default permissions for all roles
const initializePermissions = async (req, res) => {
  try {
    const defaultPermissions = [
      {
        role: "USER",
        permissions: {
          comment: true,
          addBlog: true,
          adminPanel: false,
          approverPanel: false,
          userPanel: true,
          like: true,
        }
      },
      {
        role: "APPROVER",
        permissions: {
          comment: true,
          addBlog: true,
          adminPanel: false,
          approverPanel: true,
          userPanel: true,
          like: true,
        }
      },
      {
        role: "ADMIN",
        permissions: {
          comment: true,
          addBlog: true,
          adminPanel: true,
          approverPanel: true,
          userPanel: true,
          like: true,
        }
      }
    ];

    const results = [];
    for (const permission of defaultPermissions) {
      const result = await Permission.findOneAndUpdate(
        { role: permission.role },
        permission,
        { new: true, upsert: true }
      );
      results.push(result);
    }

    res.status(200).json({ success: true, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getAllPermissions,
  getRolePermissions,
  updateRolePermissions,
  initializePermissions
};

