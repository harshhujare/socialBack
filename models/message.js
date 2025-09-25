const { Schema, model } = require("mongoose");

const messageschema = new Schema(
  {
    from: { type: Schema.Types.ObjectId, ref: "user", required: true },
    to: { type: Schema.Types.ObjectId, ref: "user", required: true },
    content: { type: String, required: true ,maxlength:600},
    read: { type: Boolean, defult: false },
  },
  { timestamps: true }
);
const message = model("message", messageschema);
module.exports = message;
