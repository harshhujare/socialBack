const express = require('express');
const router = express.Router();
const { AuthMiddleWare, RequirePermission } = require('../middlewares/auth');
const { handelblog, getblog, getblogbyid, getBlogsByUserId, deleteBlog, toggleLike, addComment, deleteComment, getRejectedBlogs, approveBlog } = require("../controllers/blog");
const { upload } = require("../config/multerconfig");

// create - requires addBlog permission
router.post('/upload', AuthMiddleWare, RequirePermission('addBlog'), upload.single("blogimg"), handelblog);

// read
router.get('/getblog', getblog);
router.get('/getblog/:id', getblogbyid);
router.get('/user/:userid', getBlogsByUserId);
router.get('/rejected', AuthMiddleWare, RequirePermission('approverPanel'), getRejectedBlogs);

// delete
router.delete('/delete/:id', AuthMiddleWare, deleteBlog);

// likes - requires like permission
router.post('/:id/like', AuthMiddleWare, RequirePermission('like'), toggleLike);

// comments - requires comment permission
router.post('/:id/comments', AuthMiddleWare, RequirePermission('comment'), addComment);
router.delete('/:id/comments/:commentId', AuthMiddleWare, deleteComment);

// approval - requires approverPanel permission
router.put('/:id/approve', AuthMiddleWare, RequirePermission('approverPanel'), approveBlog);

module.exports = router;