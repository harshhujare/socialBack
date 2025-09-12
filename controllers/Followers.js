const Follow = require("../models/followers");

const FollowUser = async (req, res) => {
  const idToFollow = req.params.id;
  const currentUserid = req.user._id; //auth middleware
  if (idToFollow == currentUserid) {
    return res.status(400).json({ message: "You can't follow yourself " });
    
  }
  const alreadyfollowing = await Follow.findOne({
    follower: currentUserid,
    following: idToFollow,
  });
  if (alreadyfollowing) {
    return res.status(400).json({ message: "You can't follow yourself " });
  }

  await Follow.create({ follower: currentUserid, following: idToFollow });
  res.json({ message: "Followed successfully",sucess:true });
};

const Unfollow = async (req, res) => {
  const useridtofollow = req.params.id;
  const currentUserId = req.user._id;  

  await Follow.findOneAndDelete({
    follower: currentUserId,
    following: useridtofollow,
  });
  res.json({ message: "Unfollowed successfully", success: true });
};

// Get followers of a user
const getFollowers = async (req, res) => {
  try {
    const userId = req.params.userId;
    const followers = await Follow.find({ following: userId })
      .populate('follower', 'fullname email profileImgUrl')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, followers });
  } catch (err) {
    console.error('Error getting followers:', err);
    res.status(500).json({ success: false, message: 'Failed to get followers' });
  }
};

// Get users that a user is following
const getFollowing = async (req, res) => {
  try {
    const userId = req.params.userId;
    const following = await Follow.find({ follower: userId })
      .populate('following', 'fullname email profileImgUrl')
      .sort({ createdAt: -1 });
    
    res.json({ success: true, following });
  } catch (err) {
    console.error('Error getting following:', err);
    res.status(500).json({ success: false, message: 'Failed to get following' });
  }
};

module.exports = { FollowUser, Unfollow, getFollowers, getFollowing };