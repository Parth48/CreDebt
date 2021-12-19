require("dotenv").config();
const express=require("express");
const bodyParser=require("body-parser");
const mongoose=require("mongoose");
const _=require("lodash");
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
  const PORT=process.env.PORT || 3000;
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
