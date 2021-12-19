require("dotenv").config();
const jwt = require("jsonwebtoken");
const passportLocal = require("passport-local");
const LocalStrategy = passportLocal.Strategy;
const passportJWT = require("passport-jwt");
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;
const bcryptjs = require("bcryptjs");
const User = require("../models/Users.js");
const axios=require('axios');
const mongoose= require('mongoose');

function userStrategy(email, password, done) {

	User.findOne({ email: email })
		.then((user) => {
			if (!user) {
				return done(null, false, { message: "Email not registered" });
			}
			// Match Password
			bcryptjs.compare(password, user.password, (err, isMatch) => {
				if (err) {
					throw err;
				}
				if (isMatch) {
					return done(null, user, { message: "Login successful" });
				} else {
					return done(null, false, { message: "Incorrect Password" });
				}
			});
		})
		.catch((err) => {
			console.log(err);
		});
}


module.exports = function (passport) {
	var usercookieExtractor = function (req) {
		var token = null;
		if (req) {
			token = req.cookies.token;
		}
		return token;
	};
	
	function userjwtCallback(req,token, done) {
		User.findById(token.user._id, function(err, user) {
			
			if (err) { return done(err, false); }
	  
			if (user) {
			  req.user = user; 
			  done(null, user);
			} else {
			  done(null, false);
			}
		  });
	}
	passport.use(
		"user",
		new LocalStrategy({ usernameField: "email" }, userStrategy)
	);
	
	passport.use(
		"jwt_user",
		new JWTStrategy(
			{
				secretOrKey: ""+process.env.ACCESS_TOKEN,
				jwtFromRequest: ExtractJWT.fromExtractors([usercookieExtractor]),
				passReqToCallback: true
			},
			userjwtCallback
		)
	);
	
	passport.serializeUser((user,done)=>{
        done(null,user.id)
    })

    passport.deserializeUser((id,done)=>{
        User.findById(id,(err,user)=>done(err,user))
    })
};
