const mongoose=require('mongoose');
const Schema=mongoose.Schema;

const expandContactSchema = new Schema({
    contact:{  ///location=contact
        type:Schema.Types.ObjectId,
        ref:'contact'
    },
    description: String,
    date:Date,
    amount:Number,
    
})
const expandContactSlot = mongoose.model("expandContact",expandContactSchema);

module.exports = expandContactSlot;