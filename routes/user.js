const router = require("express").Router();
//get all users
router.get("/",userController.getAllUsers);


//delete user
router.delete("/:id",userController.deleteUser);
module.exports = router;
