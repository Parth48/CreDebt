//new list-app for existing contacts
require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");
//const twilio = require('twilio'); //for sending message
const db = process.env.DBURI;
const indexControllers = require("./controllers/indexControllers");
const cookieParser = require("cookie-parser");
const path=require('path');
const passport = require("passport");
const methodOverride = require('method-override');
const session = require('express-session');
const flash= require('connect-flash');
const userControllers = require("./controllers/userControllers");
var Feedback=require('./models/Feedback');


const app=express();
app.use(passport.initialize());
app.use(cookieParser());

app.use(methodOverride('_method'));

app.set('view engine','ejs');
app.set('views',path.join(__dirname,'views'));
app.use(bodyParser.urlencoded({extended:true}));
app.use(express.static("public"));
mongoose.connect(db, { useNewUrlParser: true, useUnifiedTopology: true,useFindAndModify: false })
.then(() => {
  const PORT =5000;
  app.listen(PORT, console.log("Server Started"));
  console.log("Connected to DB");
})
.catch((err) => {
  console.log(err);
});;
require("./config/passport")(passport);

app.use(session({
  secret: 'secret',
  resave: true,
  saveUninitialized: true,
}));

// Connect Flash
app.use(flash());
//////////////send message system////simple code from twilio/////////////////////
const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
//const client = require('twilio')(accountSid, authToken);
/////////////////////////////////////////////////////////

app.use((req,res,next)=>{
  res.locals.success_msg = req.flash('success_msg');
  res.locals.error_msg = req.flash('error_msg');
  next();
});


const subSchema={
  amount: Number,
  desc: String,
  date: String
}
const Sub=mongoose.model("Sub",subSchema);

const mainSchema={
  name:String,
  phoneNumber:String,
  emailId:String,
  address:String,
  total:Number,
  items: [subSchema]
}
const Main=mongoose.model("Main",mainSchema);


//loading new contacts page
app.get("/New",function(req,res){
  res.render("new");
});

app.get("/Exist",function(req,res){
  Main.find(function(err,foundItem){
    res.render("list",{items:foundItem});
  });
});


app.post("/edit",function(req,res){

  let buttonType="add";
  buttonType=req.body.checker;
  let name=req.body.button;

  if(buttonType==="reset")
  {
    Main.findOne({name:name},function(err,found){
      found.total=0;
      found.items=[];
      found.save();
      res.redirect("/"+name);
    });
  }
  else{
    let amount=req.body.amount;
    let desc=req.body.desc;
    let date=req.body.date;
    let total=0;
  const sub=new Sub({
    date:date,
    amount:amount,
    desc:desc
  });

  Main.findOne({name:name},function(err,found){
    found.total=Number(found.total)+Number(amount);
    found.items.push(sub);
    found.save();
    res.redirect("/"+name);
  });
}
});

// send message system
// app.post("/sendMsg",function(req,res){
//   let number=req.body.sendNumber;
//   let amount=req.body.sendAmount;
//   let sent;
//   if(amount>=0){
//   sent="You need to pay Parth Naghera an amount of "+amount+" rupees.";
// }
// else{
//   sent="Parth Naghera will pay you an amount of "+-1*amount+" rupees.";
// }
//   client.messages
//   .create({
//      body: sent,
//      from: "+12517141469",
//      to: "+916355395164"
//    });
//   res.redirect("/Exist");
// });

app.post("/delete",function(req,res){
  let name=req.body.button;
  Main.deleteOne({name:name},function(err){
    res.redirect("/Exist");
  });
});


app.use("/", indexControllers);

app.use(
	"/user",
  passport.authenticate("jwt_user", { session: false }),
  userControllers
);


app.listen(3000,function(){
  console.log("Server is running on port 3000")
});
