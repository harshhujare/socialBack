const express=require ('express')
const router =express.Router();
const { AuthMiddleWare, RequireRoles } = require('../middlewares/auth')
const { handelSignup, handelLogin, handelLogout, handelupdate, handelgetuser, handellistusers, handleUpdateUserRole, handelGoogleLogin} = require('../controllers/user')


router.post('/signup',handelSignup);
router.post('/Login',handelLogin);
router.get('/logout',handelLogout);
router.put('/update',AuthMiddleWare,handelupdate);
router.get('/getuser/:userid',AuthMiddleWare, handelgetuser)
router.get('/list', handellistusers)
router.put('/role', AuthMiddleWare, RequireRoles('ADMIN'), handleUpdateUserRole)
router.post('/googleIn', handelGoogleLogin)
module.exports=router;
