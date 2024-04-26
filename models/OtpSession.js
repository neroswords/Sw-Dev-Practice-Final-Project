const mongoose = require('mongoose');

const OtpSessionSchema = new mongoose.Schema({
    user : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true
    },
    ref : {
        type : String,
        required : true,
    },
    code : {
        type : String,
        required : true,
    },
    status : {
        type : String,
        enum: ['pending','error'],
        default: 'pending'
    },
    createdAt : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model('OtpSession', OtpSessionSchema);