const express=require('express')
const router=express.Router();
const {handelCheck}=require("../controllers/user")

router.get('/check',handelCheck)

module.exports=router;