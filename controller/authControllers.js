const bcrypt = require("bcrypt");
const User = require("../models/User");
const jwt = require("jsonwebtoken");

const authController = {
    registerUser: async (req, res) => {
        try{
            const salt = await bcrypt.genSalt(10);
            const hashed = await bcrypt.hash(req.body.password, salt);

            //new user
            const newUser = await new User({
                username: req.body.username,
                email: req.body.email,
                password: hashed
            });
            //save user and respond
            const user = await newUser.save();
            res.status(200).json(user);
        }catch(err){
            console.log(err);
            res.status(500).json(err);
        }
        //login
        loginUser: async (req, res) => {
            try{
                const user = await User.findOne({username: req.body.username});
                if(!user) return res.status(404).json("User not found");

                const validPassword = await bcrypt.compare(req.body.password, user.password);
                if(!validPassword) return res.status(400).json("Wrong password");

                res.status(200).json(user);
                if(user && validPassword){
                    jwt.sign({id: user._id, isAdmin: user.isAdmin}, process.env.JWT_SECRET, {expiresIn: "3d"}, (err, token) => {
                        if(err) return res.status(500).json(err);
                   
                })
                res.status(200).json(user);}
            }catch(err){
                console.log(err);
                res.status(500).json(err);
            }
    
}}};

module.exports = authController;