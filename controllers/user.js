const user = require("../models/user");
const Follow = require("../models/followers");
const { getFileUrl } = require("../config/multerconfig");
const cloudinary = require("cloudinary").v2;
const bcrypt = require("bcrypt");
const { CreateTokenForUser, validateToken } = require("../services/auth");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const isProd = process.env.NODE_ENV === "production";
const cookieOptions = {
  httpOnly: true,
  secure: isProd,
  sameSite: isProd ? "none" : "lax",
  path: "/",
  maxAge: 24 * 60 * 60 * 1000,
};

function toWebPath(p) {
  if (!p || typeof p !== "string") return p;
  const norm = p.replace(/\\/g, "/");
  if (norm.startsWith("/public/")) return norm;
  if (norm.startsWith("public/")) return "/" + norm;
  const idx = norm.lastIndexOf("/public/");
  if (idx !== -1) return norm.slice(idx);
  return "/" + norm.replace(/^\//, "");
}

const handelSignup = async (req, res) => {
  const { fullname, email, password } = req.body;

  try {
    const User = await user.create({
      fullname,
      email,
      password,
    });
    //token creation
    const token = CreateTokenForUser(User);
    // Set cookie

    // ensure web path on fresh user
    User.profileImgUrl = toWebPath(User.profileImgUrl);
    return res
      .cookie("token", token, cookieOptions)
      .status(200)
      .json({ message: "usercreated successfully", success: true, User });
  } catch (err) {
    if (err.code === 11000 && err.keyPattern && err.keyPattern.email) {
      return res.status(400).json({
        message: "Email already exist .Plese use a different email.",
        sucess: false,
        error: "DUPLICATE_EMAIL",
      });
    } else {
      console.error("Signup failed:", err);
    }
  }
};
const handelLogin = async (req, res) => {
  const { email, password } = req.body;

  try {
    const fuser = await user.findOne({ email });

    if (!fuser) {
      return res
        .status(401)
        .json({ message: "Wrong_Email_Password", sucess: false });
    }

    const isMatch = await bcrypt.compare(password, fuser.password);
    if (!isMatch) {
      return res
        .status(401)
        .json({ message: "Wrong_Email_Password", sucess: false });
    }
    let token;
    try {
      //token creation
      token = CreateTokenForUser(fuser);

      // Set cookie with proper options
      // Prepare user data to send back (excluding sensitive fields)
      const userData = {
        _id: fuser._id,
        fullname: fuser.fullname,
        email: fuser.email,
        profileImgUrl: toWebPath(fuser.profileImgUrl),
        role: fuser.role,
        isActive: fuser.isActive,
        createdAt: fuser.createdAt,
        updatedAt: fuser.updatedAt
      };
      
      res.cookie("token", token, cookieOptions).status(200).json({
        message: "login successful",
        success: true,
        token: token, // Also send token in response for frontend storage
        user: userData // Include user data in response
      });
    } catch (tokenError) {
      console.error("Token creation failed:", tokenError);
      return res.status(500).json({
        message: "Authentication failed",
        success: false,
        error: "Token creation failed",
      });
    }
  } catch (error) {
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Validation_failed",
        error: error.message,
      });
    }
  }
};
//handelCheck
const handelCheck = async (req, res) => {
  const token = req.cookies?.token;
  if (!token) {
    return res.json({ loggedIn: false });
  }
  try {
    const payload = validateToken(token);
    if (!payload || !payload._id) {
      return res.json({ loggedIn: false });
    }
    const fresh = await user
      .findById(payload._id)
      .select("fullname email profileImgUrl role isActive createdAt updatedAt");
    if (!fresh) {
      return res.json({ loggedIn: false });
    }
    // const normalized = {
    //   ...fresh.toObject(),
    //   profileImgUrl: toWebPath(fresh.profileImgUrl),
    // };
    return res.json({ loggedIn: true, user: fresh });
  } catch (error) {
    return res.json({ loggedIn: false });
  }
};

//handelLogout
const handelLogout = (req, res) => {
  try {
    const clearOpts = { ...cookieOptions };
    delete clearOpts.maxAge;
    res.clearCookie("token", clearOpts);
    res.json({ success: true });
  } catch (error) {
    console.error("Logout failed:", error);
  }
};
const handelupdate = async (req, res) => {
  try {
    const { fullname, email, password } = req.body;
    const updatedUser = await user.findOneAndUpdate(
      { email },
      { $set: { fullname } },
      { new: true }
    );

    if (!updatedUser)
      return res.status(400).json({ message: "no user found", sucess: false });

    res.status(200).json({ sucess: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Update failed" });
  }
};
const handelgetuser = async (req, res) => {
  try {
    const result = await user.findById(req.params.userid).select("-password");

    if (!result) {
      return res
        .status(400)
        .json({ sucess: false, error: "faild to get user" });
    }
    // normalize image path for client
   
    // Check if the user is following the requested user
   
    const followDoc = await Follow.exists({
      follower: req.user._id,
      following: req.params.userid,
    });
    const isFollowing = !!followDoc;

    // Get followers and following counts
    const followersCount = await Follow.countDocuments({ following: req.params.userid });
    const followingCount = await Follow.countDocuments({ follower: req.params.userid });
   
    res.status(200).json({ 
      user: result, 
      sucess: true, 
      isFollowing,
      followersCount,
      followingCount
    });
  } catch (err) {
    console.error("Get user failed:", err);
  }
};

// List users (basic directory)
const handellistusers = async (req, res) => {
  try {
    const { q } = req.query;
    const query = q
      ? {
          $or: [
            { fullname: { $regex: q, $options: "i" } },
            { email: { $regex: q, $options: "i" } },
          ],
        }
      : {};

    const users = await user
      .find(query)
      .select("fullname email profileImgUrl role isActive createdAt updatedAt");

    const normalized = users.map((u) => ({
      ...u.toObject(),
      profileImgUrl: toWebPath(u.profileImgUrl),
    }));

    return res.status(200).json({ success: true, users: normalized });
  } catch (err) {
    console.error("Failed to list users", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to list users" });
  }
};
const handelupload = async (req, res) => {

  const id = req.params.userid;
  const uploadedFsPath = req.file?.path;

  if (!uploadedFsPath) {
    return res.status(400).json({ error: "No file uploaded" });
  }

  try {
    const nuser = await user.findById(id);
    if (!nuser) return res.status(404).json({ error: "User not found" });

    // Build web path (/public/...) for client consumption
    const webPath =  getFileUrl(req, req.file, req.file.fieldname);

    // Delete old image if present and not default
    if (
  nuser.profileImgUrl &&
  nuser.profileImgUrl !== "/public/uploads/profile/image.png"
) {
  const oldWebPath = nuser.profileImgUrl;

  let oldAbsPath;
   if (process.env.NODE_ENV === "production") {
      // Extract public_id from Cloudinary URL
      const urlParts = oldWebPath.split("/");
      const filename = urlParts[urlParts.length - 1]; // e.g. abc123.png
      const folder = urlParts[urlParts.length - 2];   // e.g. profile
      const publicId = `${folder}/${filename.split(".")[0]}`;

      const result = await cloudinary.uploader.destroy(publicId);
      console.log("Cloudinary delete result:", result);
    } else {
      // Local delete
      const urlPath = new URL(oldWebPath).pathname; // /public/uploads/profile/abc123.png
      const absPath = path.join(process.cwd(), urlPath.replace(/^\//, ""));

      fs.unlink(absPath, (err) => {
        if (err) console.error("Local delete error:", err.message);
        else console.log("Local image deleted:", absPath);
      });
    }
 
}
console.log(webPath,"webpath is");
    nuser.profileImgUrl = webPath;
    await nuser.save();
    res.status(200).json({ success: true, nuser });
  } catch (err) {
    res.status(500).json({ error: "Server error", details: err.message });
  }
};

// Update a user's role (admin-only controller)
const handleUpdateUserRole = async (req, res) => {
  try {
    const { userId, role } = req.body;
    const allowedRoles = ["USER", "Admin", "APPROVER"];
    if (!userId || !role || !allowedRoles.includes(role)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid payload" });
    }

    // Prevent self-demotion lockouts optionally (allow changing others only)
    const isSelf = req.user && req.user._id === userId;
    if (isSelf) {
      return res
        .status(400)
        .json({ success: false, message: "Cannot change your own role" });
    }

    const targetUser = await user.findById(userId);
    if (!targetUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    targetUser.role = role;
    await targetUser.save();
    return res.status(200).json({ success: true });
  } catch (err) {
    console.error("Failed to update user role", err);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update user role" });
  }
};
module.exports = {
  handelSignup,
  handelLogin,
  handelCheck,
  handelLogout,
  handelupdate,
  handelgetuser,
  handellistusers,
  handelupload,
  handleUpdateUserRole,
};
