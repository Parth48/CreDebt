const express = require("express");
const router = express.Router();
const dotenv = require("dotenv");
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
const passport = require("passport");
const User = require("../models/Users");
const axios=require('axios'); 
const jwtExpirySeconds = 30000;

// GET home page
router.get("/", (req, res) => {
	res.render("homeee");
});

// GET register form
router.get("/signup", (req, res) => {
	res.render("signup");
});

// GET login form
router.get("/login", (req, res) => {
	res.render("login");
});

// finds email according to category
async function registration(category, email) 
{
	if (category === "user") 
	{
		return User.findOne({ email: email });
	} 
}

// POST /register
router.post("/signup", (req, res) => {
	const {name, contact, email, password, password2 } = req.body;
	const category="user";
	if (password !== password2) 
	{
		req.flash('error_msg','Passwords did not match');
		res.redirect("/signup");
	}
	else 
	{
		registration(category, email)
			.then((user) => {
				if (user) 
				{
					req.flash('error_msg','Email is already in use');
					res.redirect("/signup");
				} 
				else 
				{
					let newUser;
					if (category === "user") 
					{
						newUser = new User({
							name,
							email,
							password,
							contact,
						});
					} 
					// Hash Password
					bcrypt.genSalt(10, (err, salt) => {
						bcrypt.hash(newUser.password, salt, (err, hash) => {
							if (err) throw err;

							// Set Password to Hash
							newUser.password = hash;
							newUser
								.save()
								.then((user) => {
									req.flash('success_msg','You are now registered and can login');
									res.redirect("/login");
								})
								.catch((err) => console.log(err));
						});
					});
				}
			})
			.catch((err) => console.log(err));
	}
});

// POST /users/login
router.post("/user/login", (req, res, next) => {
	passport.authenticate("user", (err, user) => {
		if (err) {
			res.send(err);
			return;
		}
		if (!user) {
			req.flash('error_msg','Enter valid login credentials');
			res.redirect("/login");
			return;
		}
		req.login(user, { session: false }, async (error) => {
			if (error) {
				console.log(error);
			}
			const token = jwt.sign({ user }, process.env.ACCESS_TOKEN, {
				algorithm: "HS256",
				expiresIn: jwtExpirySeconds,
			});
			res.cookie("token", token, { maxAge: jwtExpirySeconds * 1000 });
			req.flash('success_msg','Logged in successfully');
			
			if(mongoose.Types.ObjectId.isValid(user._id))
			{
				res.redirect(`/user/${user._id}/home`);
			}
			
			
		});
	})(req, res, next);
});


// GET on /users/logout
router.get("/users/logout", (req, res) => {
	if(req.cookies && req.cookies.hasOwnProperty("token")) {
		res.cookie("token","",{expires: new Date(0)});
	}
	req.flash('success_msg','Logged out successfully');
	res.redirect("/");
})


module.exports = router;
