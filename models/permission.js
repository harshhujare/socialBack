const { Schema, model } = require("mongoose");

const permissionSchema = new Schema(
  {
    role: {
      type: String,
      enum: ["USER", "ADMIN", "APPROVER"],
      required: true,
    },
    permissions: {
      comment: { type: Boolean, default: false },
      addBlog: { type: Boolean, default: false },
      adminPanel: { type: Boolean, default: false },
      approverPanel: { type: Boolean, default: false },
      userPanel: { type: Boolean, default: false },
      like: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

// Ensure unique role
permissionSchema.index({ role: 1 }, { unique: true });

const Permission = model("Permission", permissionSchema);

module.exports = Permission;
