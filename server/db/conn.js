const mongoose = require("mongoose");

const dotenv = require("dotenv");

dotenv.config();

const DB=process.env.MONGODB_URL;

mongoose.connect(DB,{
    useUnifiedTopology : true,
    useNewUrlParser : true
}).then(()=>console.log("database connected"))
.catch((errr)=>{
    console.log(errr);
})

