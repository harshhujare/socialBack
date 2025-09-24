import { validateToken } from "../services/auth.js";
import Permission from "../models/permission.js";
import cookie from 'cookie-parser';
function AuthMiddleWare(req, res, next) {
  
  const token = req.cookies?.token;
  console.log(token ,"token from cookie");
  if (!token) return res.status(401).json({ message: "Access_Denied", success: false });
  try {
    const users = validateToken(token);
    req.user = users;
    next();
  } catch (err) {
    res.status(400).json({ message: "invalid token" });
  }
}

function RequireRoles() {
  const allowed = Array.from(arguments);
  return function (req, res, next) {
    if (!req.user || !req.user.role || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden", success: false });
    }
    next();
  };
}

// Check if user has specific permission
function RequirePermission(permission) {
  return async function (req, res, next) {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({ message: "Forbidden", success: false });
      }

      const rolePermission = await Permission.findOne({ role: req.user.role });
      
      if (!rolePermission || !rolePermission.permissions[permission]) {
        return res.status(403).json({ message: "Insufficient permissions", success: false });
      }
      
      next();
    } catch (error) {
      res.status(500).json({ message: "Permission check failed", success: false });
    }
  };
}

const IoMiddleware = (socket, next) => {
  try {
    console.log("IoMiddleware: handshake headers:", socket.handshake.headers);
    const rawCookie = socket.handshake.headers.cookie || '';
    console.log("IoMiddleware: rawCookie=", rawCookie);
    const parsed = cookie.parse(rawCookie);
    const token = parsed.token;
    if (!token) {
      console.warn('IoMiddleware: No token cookie found in handshake');
      return next(new Error('No token found'));
    }

    const payload = validateToken(token); // will give {_id, fullname, email, role}
    socket.user = payload;
    next();
  } catch (err) {
    next(new Error('Authentication error'));
  }
}
  
export { AuthMiddleWare, RequireRoles, RequirePermission,IoMiddleware };