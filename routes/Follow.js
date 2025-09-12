const express =require('express');
const router =express.Router();
const { AuthMiddleWare } = require('../middlewares/auth');
const { FollowUser, Unfollow, getFollowers, getFollowing } = require('../controllers/Followers');


router.post('/followuser/:id', AuthMiddleWare, FollowUser);
router.delete('/unfollowuser/:id', AuthMiddleWare, Unfollow);
router.get('/followers/:userId', AuthMiddleWare, getFollowers);
router.get('/following/:userId', AuthMiddleWare, getFollowing);

module.exports=router;