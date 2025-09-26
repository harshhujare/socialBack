const Message = require("../models/message");
const Conversation = require("../models/conversation.model");

const SendMessage = async (req, res) => {
  try {
    const { id: reciverid } = req.params;
    const { message } = req.body;
    const senderid = req.user._id;

    let conversation = await Conversation.findOne({
      participants: { $all: [senderid, reciverid] },
    });
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderid, reciverid],
      });
      const newMessage = new Message({
        content: message,
        from: senderid,
        to: reciverid,
      });
      if (newMessage) {
        conversation.messages.push(newMessage._id);
      }
      await Promise.all([newMessage.save(), conversation.save()]);
      return res.status(200).json({
        message: "message sent successfully",
        success: true,
        newMessage,
      });
    }
  } catch (error) {
    console.error("Error sending message:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

const GetMessage = async (req, res) => {
  const { id: chatuser } = req.params;
  const senderid = req.user._id;

  try {
    const conversation = await Conversation.findOne({
      participants: { $all: [senderid, chatuser] },
    }).populate("messages");
    if(!conversation){
        return res.status(201).json({ message: "No conversation found", success: true });
    }
   const messages = conversation.messages;
    res.status(200).json({ message: "Messages retrieved successfully", success: true, messages });
  } catch (error) {
    console.error("Error getting messages:", error);
    res.status(500).json({ message: "Internal server error", success: false });
  }
};

module.exports = { SendMessage, GetMessage };
