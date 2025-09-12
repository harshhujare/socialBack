const { Schema, model } = require("mongoose");

const followSchema = new Schema({
  follower: { type: Schema.Types.ObjectId, ref: "user", required: true }, // person who follows
  following: { type: Schema.Types.ObjectId, ref: "user", required: true } // person being followed
}, { timestamps: true });

const followers =model("followers",followSchema);
module.exports=followers;