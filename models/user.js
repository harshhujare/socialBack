const { Schema, model } = require("mongoose");
const bcrypt = require("bcrypt");
const userSchema = new Schema(
  {
    fullname: {
      type: String,
      required: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    about:{
      type: String,
    
    }
    ,
    salt: {
      type: String,
    },
    password: {
      type: String,
      required: true,
    },
    profileImgUrl: {
      type: String,
      default: "/public/uploads/profile/image.png",
    },
    role: {
      type: String,
      enum: ["USER", "ADMIN","APPROVER"],
      default: "USER",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    failedLoginAttempts: {
      type: Number,
      default: 0,
    },
    lockUntil: {
      type: Date,
      default: null,
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function (next) {
  const user = this;
  if (!user.isModified("password")) return next();

  try {
    const saltRounds = 10;
    const password = user.password;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashed = await bcrypt.hash(user.password, salt);
    user.password = hashed;
    user.salt = salt;
    next();
  } catch (err) {
    next(err);
  }
});

const user = model("user", userSchema);

module.exports = user;
