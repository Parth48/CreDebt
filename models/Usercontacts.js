const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const usercontactObj={
    name:String,
    phoneNo:String,
    email:String,
    user:{
        type:Schema.Types.ObjectId,
        ref:'user'
    },
    address:String,
    total:Number    
};
const usercontactSchema = new Schema(usercontactObj,{timestamps:true});
const Usercontact=mongoose.model("usercontact",usercontactSchema);
module.exports=Usercontact;