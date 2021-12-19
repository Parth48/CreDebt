const { request } = require("express");
const express = require("express");
const router = express.Router();
const passport = require("passport");
const Usercontact=require("../models/Usercontacts");
var User=require('../models/Users');
const bcrypt = require("bcryptjs");
const fs = require('fs');
const path = require('path');
const ejs=require('ejs');
const _=require("lodash");
const bodyParser=require("body-parser");
const expandContact=require('../models/expandContact');
const mongoose=require("mongoose");
const nodemailer = require('nodemailer');
const hbs=require('nodemailer-handlebars');
const url = require('url');   
const moment= require('moment-timezone'); 
var Feedback=require('../models/Feedback');




// Get user index page //dashboard
router.get("/:id/home", async(req, res) => {
	const id=req.params.id;
    res.render("homeee_main",{id});
});

////form to add new contact
router.get('/:id/new',(req,res)=>{
        const id=req.params.id;
    	res.render('new',{id});
    });

    ///show list of existing contacts
router.get('/:id/exist',(req,res)=>{
        const id=req.params.id;
        data=Usercontact.find({
            user:id,
          },(err,data)=>{
              res.render('list',{id,data});
            });
        

    });

   ////post method to add new contact 
router.post('/:id/newContact',async(req,res)=>{
    const name=req.body.Name;
    const phoneNo=req.body.phoneNumber;
    const email=req.body.emailId;
    const address=req.body.address;
    const id=req.params.id;
    const newUserContact=new Usercontact({
        name:name,
        phoneNo:phoneNo,
        email:email,
        address:address,
        user:id,
        total:0
    });
    newUserContact.save();
    req.flash('success_msg','Contact Added successfully');
    res.redirect(`/user/${id}/exist`);
});

////expand a certain contact
router.get('/:id/:p_id',async(req,res)=>{
    const thiscontact=await Usercontact.findById(req.params.p_id);
	const id=req.params.id;
    const p_id=req.params.p_id;
    const expandedInfo= await expandContact.find({contact: req.params.p_id});
    res.render('names',{thiscontact,id,expandedInfo,p_id});
});

var transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_ID,
        pass: process.env.EMAIL_PASS
    }
});

router.post('/:id/:p_id/sendEmail',async(req,res)=>{
    const thiscontact=await Usercontact.findById(req.params.p_id);
	const id=req.params.id;
    const currAcc=await User.findById(id);
    const p_id=req.params.p_id;
    const amtt=Math.abs(thiscontact.total);
    let email_content;
    if(thiscontact.total>=0)
    {
        email_content= "This is a reminder email to pay "+currAcc.name+" the amount of "+amtt+" rupees."
    }
    else
    {
        email_content= "This is a notification email that "+currAcc.name+" will pay you the amount of "+amtt+" rupees soon."

    }

    var mailOptions = {
        from:process.env.EMAIL_ID,
        to: thiscontact.email,
        subject: 'Notification from CreDebt',
        html: email_content
    };   
    
    transporter.sendMail(mailOptions, async function(error, info) {
        if (error) {
            console.log(error);
        }
    });
    req.flash('success_msg','Mail sent successfully');

    res.redirect(`/user/${id}/${p_id}`);
});

//delete a contact
router.get('/:id/:p_id/delete',async(req,res)=>{
    const thiscontact=await Usercontact.findByIdAndDelete(req.params.p_id);
	const id=req.params.id;
    const p_id=req.params.p_id;
    expandContact.deleteMany({contact:req.params.p_id},function(err){
        if(err)
        {
            console.log(err);
        }
    });
    req.flash('success_msg','Contact deleted successfully');

    res.redirect(`/user/${req.params.id}/exist`)
});

///add a new transaction
router.post('/:id/:p_id/add',async(req,res)=>{
    const contact=req.params.p_id;
    const description=req.body.desc;
    const date=req.body.date;
    const amount=req.body.amount;
    const id=req.params.id;
    const p_id=req.params.p_id;
    const newexpandContact=new expandContact({
        
        amount:amount,
        description:description,
        date:date,
        contact:p_id,
    });
    newexpandContact.save();
    const thiscontact=await Usercontact.findById(req.params.p_id);
    Usercontact.findByIdAndUpdate(req.params.p_id,{total:thiscontact.total+Number(amount)},function(err){
        if(err)
        console.log(err);
        
    });
    req.flash('success_msg','Transaction added successfully');

    res.redirect(`/user/${req.params.id}/${req.params.p_id}`);

});


///reset transactions for a given contact
router.post('/:id/:p_id/reset',async(req,res)=>{
    expandContact.deleteMany({contact:req.params.p_id},function(err){
        if(err)
        {
            console.log(err);
        }
    });
    
    Usercontact.findByIdAndUpdate(req.params.p_id,{total:Number(0)},function(err){
        if(err)
        console.log(err);
        
    });
    req.flash('success_msg','Data Reset successfull');

    res.redirect(`/user/${req.params.id}/${req.params.p_id}`);

});

router.post('/:id/feedbacko_main',async(req,res)=>{
    const id=req.params.id;
    const currAcc=await User.findById(id);
    const fd=new Feedback({
		name:currAcc.name,
		email:currAcc.email,
		desc:req.body.message
	});
	fd.save();	
    req.flash('success_msg','Feedback added successfully');
    res.redirect(`/user/${id}/home`);
    

});
module.exports = router;