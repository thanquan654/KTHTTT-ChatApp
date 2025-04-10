const router = require('express').Router();
router.post("/register",authController.registerUser);
//register
const authController = require('../controller/authControllers');


//login
router.post("/login", authController.loginUser);

module.exports = router;