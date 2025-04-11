const User = require("../models/User");

const UserController = {
    //get all users
    getAllUsers: async (req, res) => {
        try {
            const users = await User.find();
            res.status(200).json(users);
        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    },
    //delete user
    deleteUser: async (req, res) => {
        try {
            const user = await User.findByIdAndDelete(req.params.id);
            if (!user) return res.status(404).json("User not found");
            res.status(200).json("User deleted successfully");
        } catch (err) {
            console.log(err);
            res.status(500).json(err);
        }
    },
}

module.exports = UserController;