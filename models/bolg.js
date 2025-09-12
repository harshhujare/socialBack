const { model, Schema } = require("mongoose");

const blogSchema = new Schema(
  {
    userid: {
      type: String,
    },
    titalimg: {
      type: String,
    },
    title: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      required: true,
    },
    createdby: {
      type: String,
    },
    summary: {
      type: String,
    },
    AP_Status:{
      type:String,
      default:"Rejected"
    },
    // Array of userIds who liked this blog. Length of this array is the like count.
    likedBy: {
      type: [String],
      default: [],
    },
    // Embedded comments
    comments: {
      type: [
        new Schema(
          {
            userId: { type: String, required: true },
            userName: { type: String, required: true },
            text: { type: String, required: true },
            createdAt: { type: Date, default: Date.now },
          },
          { _id: true }
        ),
      ],
      default: [],
    },
  },
  { timestamps: true }
);

// Text index for search across title, description, and summary
blogSchema.index({ title: "text", description: "text", summary: "text" });

const blog = model("blog", blogSchema);
module.exports = blog;