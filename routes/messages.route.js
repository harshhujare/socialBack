const {Router} = require("express");
const router = Router();
const {SendMessage,GetMessage}=require('../controllers/Messages.controller')
const { AuthMiddleWare} = require('../middlewares/auth')


router.post("/send/:id", AuthMiddleWare, SendMessage);
router.get("/get/:id", AuthMiddleWare, GetMessage);
module.exports = router;