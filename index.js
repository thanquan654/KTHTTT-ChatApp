const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");

const authRoute=require("./routes/auth");
const app = express();
dotenv.config();
const userRoute = require("./routes/user");

mongoose.connect(process.env.MONGODB_URL,()=> {
    console.log("Connected to MongoDB")
})
mongoose.connect(process.env.MONGODB_URL, () => {
    console.log("Connected to MongoDB");
});
app.use(cors({
    origin: 'http://localhost:3000',
    credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));



//route
app.use("/v1/auth",authRoute);
app.use("/v1/users", userRoute);

app.listen(3000, () => {
    console.log("Server is running on port 3000")
});

//JSON WEB TOKEN

