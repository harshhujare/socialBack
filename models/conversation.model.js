const { Schema, model } = require("mongoose");

const conversation = new Schema({
  participants: [
    {
      type: Schema.Types.ObjectId,
      ref: "user",
      required: true,
    },
  ],
  messages: [
    {
      type: Schema.Types.ObjectId,
      ref: "message",
      required: true,
      default: [],
    },
  ],
  lastUpdated: { type: Date, default: Date.now },
});

const Conversation = model("conversation", conversation);

module.exports = Conversation;
