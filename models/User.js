const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username:{
        type:String,
        required:true,
        unique: true,
        minlength: 6,
        maxlength: 20
    },
    email:{
        type:String,
        required:true,
        unique: true,
        minlength: 10,
        maxlength: 50
    },
    password:{
        type:String,
        required:true,
        minlength: 6,
        maxlength: 1024
    }, 
    isAdmin:{
        type:Boolean,
        default:false
    },
},
    {
        timestamps: true
    }
);

module.exports = mongoose.model('User', userSchema);
// module.exports = mongoose.model('User', userSchema);

