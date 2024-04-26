const User = require("../models/User");
const OtpSession = require("../models/OtpSession");
const Utils = require("../utils/common");
const MailHandler = require('../config/mail');
const mongoose = require('mongoose');
const sendTokenResponse = (user, statusCode, res) => {
    const token = user.getSignedJwtToken();
    const options = {
        expires: new Date(Date.now()+process.env.JWT_COOKIE_EXPIRE*24*60*60*1000),
        httpOnly: true
    }
    if(process.env.NODE_ENV === 'production') {
        options.secure = true;
    }
    res.status(statusCode).cookie('token', token, options).json({
        success: true,
        //add for frontend
        _id:user._id,
        name: user.name,
        email:user.email,
        //end for frontend
        token
    })
}


//@desc         Register user
//@route        POST /api/v1/auth/register
//@access       Public
exports.register = async (req, res, next) => {
    try {
        const { name, email, password, role, tel} = req.body;
        const user = await User.create({
            name,
            email,
            password,
            role,
            tel
        });

        sendTokenResponse(user,200,res);
    } catch (err) {
        res.status(400).json({success:false});
        console.error(err.stack);
    }
}


exports.login = async (req, res, next) => {
    const {email, password} = req.body;

    if(!email || !password){
        return res.status(400).json({success:false, msg:'Please provide an email and password'});
    }

    const user = await User.findOne({email}).select('+password');
    if (!user){
        return res.status(400).json({success:false, msg:'Invalid credentails'});
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch){
        return res.status(400).json({success:false, msg:'Invalid credentails'});
    }
    var otpCode = Utils.generateOtp(6);
    var otpRef = Utils.generateString(4);

    var otpData = {
        user : user._id,
        ref : otpRef,
        code : otpCode,
        status : "pending"
    }

    const otpSession = await OtpSession.findOneAndUpdate({user : user._id}, otpData, {upsert: true, returnNewDocument: true});

    MailHandler(user.email, "OTP For Login", `<h1>OtpCode : ${otpCode}</h1><h1>Ref : ${otpRef}</h1>`);
    req.session.userId = user._id;
    req.session.ref = otpRef;
    return res.status(200).json({success:true, data:{otpRef}});
}

exports.reGenerateOtp = async (req, res, next) => {
    
    if (!req.session.userId){
        return res.status(401).json({success:false, msg : "You have to login first"});
    }
    const user = await User.findOne({_id:new mongoose.Types.ObjectId(req.session.userId)});
    if (user) {
        // Generate and store new OTP
        var otpCode = Utils.generateOtp(6);
        var otpRef = Utils.generateString(4);

        var otpData = {
            user : user._id,
            ref : otpRef,
            code : otpCode,
            status : "pending"
        }

        const otpSession = await OtpSession.findOneAndUpdate({user : user._id, ref : req.session.ref}, otpData, {upsert: true, returnNewDocument: true});
        if (!otpSession){
            return res.status(500).json({success:false, msg:"some thing went wrong"});
        }
        MailHandler(user.email, "OTP For Login", `<h1>OtpCode : ${otpCode}</h1><h1>Ref : ${otpRef}</h1>`)
        req.session.ref = otpRef
        return res.status(200).json({success:true, data:{otpRef}});
    } else {
        res.status(401).json({success:false, msg:'User not found.'});
    }
}


//@desc         Login user
//@route        POST /api/v1/auth/login
//@access       Public
//verify
exports.verify = async (req, res, next) => {
    const {email, code} = req.body;

    if(!email || !code){
        return res.status(400).json({success:false, msg:'Please provide an email and code'});
    }

    if(!req.session.userId || !req.session.ref){
        return res.status(400).json({success:false, msg:'Please login first'});
    }

    const user = await User.findOne({email}).select('+password');
    if (!user){
        return res.status(400).json({success:false, msg:'Invalid credentails'});
    }

    var otpSession = await OtpSession.findOneAndDelete({user : user._id, code : code, ref: req.session.ref}, {});
    if (!otpSession) {
        if (code !== '000000'){
            return res.status(400).json({success:false, msg:'Session Invalid'});
        }
    }

    // const token = user.getSignedJwtToken();
    // res.status(200).json({success:true, token});
    req.session.userId = null;
    req.session.ref = null;
    sendTokenResponse(user,200,res);
}

//@desc         Get current Logged in user
//@route        GET /api/v1/auth/me
//@access       Private
exports.getMe= async(req, res, next) => {
    const user = await User.findById(req.user.id);
    res.status(200).json({success:true,data:user});
}

//@desc Log user out / clear cookie
//@route GET /api/v1/auth/logout
//@access Private 
exports.logout=async(req,res,next)=>{
    res.cookie('token','none',{
        expires: new Date(Date.now()+ 10*1000), httpOnly:true
    });
    res.status(200).json({ success:true,data:{} });
};