const JWT = require("jsonwebtoken");

function CreateTokenForUser(fuser) {
  if (!fuser || !fuser._id || !fuser.email || !fuser.fullname) {
    throw new Error("Invalid user object provided");
  }

  if (!process.env.JWT_SECRET) {
    throw new Error("JWT_SECRET is not configured");
  }

  const payLoad = {
    _id: fuser._id,
    fullname: fuser.fullname,
    email: fuser.email,
    role: fuser.role || "USER", // Default to USER if role is not set
  };

  const token = JWT.sign(payLoad, process.env.JWT_SECRET);
  return token;
}

function validateToken(token) {
  
  const payload = JWT.verify(token, process.env.JWT_SECRET);

  return payload;
}
module.exports = { CreateTokenForUser, validateToken };
