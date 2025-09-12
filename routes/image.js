const express= require('express')
const router=express.Router();
const {handelupload} =require('../controllers/user')
const {upload}=require("../config/multerconfig")

router.put('/upload/:userid',upload.single("image"),handelupload);
module.exports=router;