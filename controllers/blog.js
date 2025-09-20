const blog = require("../models/bolg");
const fs = require("fs");
const path = require("path");
const { getFileUrl } = require("../config/multerconfig");
function toWebPath(p)   {
  if (!p || typeof p !== 'string') return p;
  const norm = p.replace(/\\/g, '/');
  if (norm.startsWith('/public/')) return norm;
  if (norm.startsWith('public/')) return '/' + norm;
  const idx = norm.lastIndexOf('/public/');
  if (idx !== -1) return norm.slice(idx);
  return '/' + norm.replace(/^\//, '');
}
//post a blog
const handelblog = async (req, res) => {
  const { userid, description, title, createdby, summary } = req.body;

  const uploadedFsPath = req.file?.path;
  console.log("Uploaded file path:", uploadedFsPath);
 
  const webPath =  req.file 
      ? getFileUrl(req, req.file, req.file.fieldname)
      : `${req.protocol}://${req.get("host")}/public/uploads/profile/image.png`;
      console.log("Web accessible path:", webPath);
  try {
    await blog.create({
      userid: userid,
      description: description,
      title: title,
      titalimg: webPath,
      createdby: createdby,
      summary: summary,
    });
    res.status(200).json({ message: "blog created", success: true });
  } catch (err) {
    console.error('Create blog failed:', err);
    res
      .status(500)
      .json({
        message: "Failed to create blog",
        success: false,
        error: err.message,
      });
  }
};
// get all blogs - supports search and pagination
const getblog = async (req, res) => {
  try {
    const { search = "", page = 1, limit = 12 } = req.query;
    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(50, Math.max(1, parseInt(limit, 10) || 12));

    const filter = search
      ? { $text: { $search: search }, AP_Status: "Accepted" }
      : {AP_Status: "Accepted"};

    const [total, items] = await Promise.all([
      blog.countDocuments(filter),
      blog
        .find(filter)
        .sort(search ? { score: { $meta: "textScore" } } : { createdAt: -1 })
        .skip((pageNum - 1) * pageSize)
        .limit(pageSize),
    ]);

    // normalize image paths
 
// console.log("these are itsms",items)
    return res.json({
      success: true,
      blogs: items,
      pagination: {
        total,
        page: pageNum,
        limit: pageSize,
        pages: Math.ceil(total / pageSize),
      },
    });
  } catch (err) {
    console.error('Fetch blogs failed:', err);
    res.status(500).json({ success: false, message: "Failed to fetch blogs" });
  }
};
//get blog by id
const getblogbyid = async (req, res) => {
  const { id } = req.params;
  try {
    const Blog = await blog.findById(id);
    if (!Blog) {
      return res
        .status(400)
        .json({ message: "no blog found", success: false });
    }
   
    return res.json({ success: true, blog: Blog });
  } catch (err) {
    console.error('Get blog by id failed:', err);
    res.status(500).json({
      message: "Failed to get blog",
      success: false,
      error: err.message,
    });
  }
};

//get blogs by user id
const getBlogsByUserId = async (req, res) => {
  const { userid } = req.params;
  try {
    const userBlogs = await blog.find({ userid: userid });
    if (!userBlogs) {
      return res.status(400).json({
        message: "no blogs found for this user",
        success: false,
      });
    }
  
    return res.json({ success: true, blogs: userBlogs });
  } catch (err) {
    console.error('Get user blogs failed:', err);
    res.status(500).json({
      message: "Failed to get user blogs",
      success: false,
      error: err.message,
    });
  }
};

//delete blog by id
const deleteBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const found = await blog.findById(id);
    if (!found) {
      return res
        .status(400)
        .json({ message: "blog not found", success: false });
    }

    const imagePath = found.titalimg; // stored as e.g. /public/uploads/blogimg/<file>

    await found.deleteOne();

    if (imagePath && typeof imagePath === "string") {
      try {
        const absolutePath = imagePath.startsWith('/public/')
          ? path.join(process.cwd(), imagePath.replace(/^\//, ''))
          : (path.isAbsolute(imagePath) ? imagePath : path.join(process.cwd(), imagePath));
        await fs.promises.unlink(absolutePath);
      } catch (unlinkErr) {
        // Log but do not fail the whole request
        console.error("Failed to delete blog image:", unlinkErr?.message || unlinkErr);
      }
    }

    return res.json({ success: true, message: "Blog and image deleted successfully" });
  } catch (err) {
    console.error('Delete blog failed:', err);
    res.status(500).json({
      message: "Failed to delete blog",
      success: false,
      error: err.message,
    });
  }
};

// like/unlike toggle
const toggleLike = async (req, res) => {
  const { id } = req.params; // blog id
  const userId = req.user?._id || req.user?.id || req.body.userId; // safety fallback
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing user context" });
  }

  try {
    const found = await blog.findById(id);
    if (!found) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    const alreadyLiked = found.likedBy.includes(String(userId));
    if (alreadyLiked) {
      found.likedBy = found.likedBy.filter((uid) => String(uid) !== String(userId));
    } else {
      found.likedBy.push(String(userId));
    }
    await found.save();

    return res.json({ success: true, liked: !alreadyLiked, likes: found.likedBy.length });
  } catch (err) {
    console.error('Toggle like failed:', err);
    res.status(500).json({ success: false, message: "Failed to toggle like" });
  }
};

// add a comment
const addComment = async (req, res) => {
  const { id } = req.params; // blog id
  const { text } = req.body;
  const userId = req.user?._id || req.user?.id;
  const userName = req.user?.fullname || req.user?.name || "Anonymous";
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing user context" });
  }
  if (!text || !text.trim()) {
    return res
      .status(400)
      .json({ success: false, message: "Comment text required" });
  }

  try {
    const found = await blog.findById(id);
    if (!found) {
      return res
        .status(404)
        .json({ success: false, message: "Blog not found" });
    }

    found.comments.push({ userId: String(userId), userName, text: text.trim() });
    await found.save();
    return res.json({ success: true, comments: found.comments });
  } catch (err) {
    console.error('Add comment failed:', err);
    res.status(500).json({ success: false, message: "Failed to add comment" });
  }
};

// delete a specific comment
const deleteComment = async (req, res) => {
  const { id, commentId } = req.params;
  const userId = req.user?._id || req.user?.id;
  if (!userId) {
    return res
      .status(400)
      .json({ success: false, message: "Missing user context" });
  }

  try {
    const found = await blog.findById(id);
    if (!found) return res.status(404).json({ success: false, message: "Blog not found" });

    const comment = found.comments.id(commentId);
    if (!comment) return res.status(404).json({ success: false, message: "Comment not found" });

    // Only allow the comment owner or blog owner to delete
    if (String(comment.userId) !== String(userId) && String(found.userid) !== String(userId)) {
      return res.status(403).json({ success: false, message: "Not allowed" });
    }

    // Remove the comment using the pull method
    found.comments.pull(commentId);
    await found.save();
    return res.json({ success: true, comments: found.comments });
  } catch (err) {
    console.error('Delete comment failed:', err);
    res.status(500).json({ success: false, message: "Failed to delete comment" });
  }
};

// list blogs pending approval (AP_Status: Rejected)
const getRejectedBlogs = async (req, res) => {
  try {
    const pending = await blog.find({ AP_Status: "Rejected" }).sort({ createdAt: -1 });
    const normalized = pending.map((b) => {
      if (!b) return b;
      b.titalimg = toWebPath(b.titalimg);
      return b;
    });
    return res.json({ success: true, blogs: normalized });
  } catch (err) {
    console.error('Fetch rejected blogs failed:', err);
    res.status(500).json({ success: false, message: "Failed to fetch pending blogs" });
  }
};

// approve a blog (set AP_Status: Accepted)
const approveBlog = async (req, res) => {
  const { id } = req.params;
  try {
    const updated = await blog.findByIdAndUpdate(
      id,
      { $set: { AP_Status: "Accepted" } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ success: false, message: "Blog not found" });
    updated.titalimg = toWebPath(updated.titalimg);
    return res.json({ success: true, blog: updated });
  } catch (err) {
    console.error('Approve blog failed:', err);
    res.status(500).json({ success: false, message: "Failed to approve blog" });
  }
};

module.exports = {
  handelblog,
  getblog,
  getblogbyid,
  getBlogsByUserId,
  deleteBlog,
  toggleLike,
  addComment,
  deleteComment,
  getRejectedBlogs,
  approveBlog,
};