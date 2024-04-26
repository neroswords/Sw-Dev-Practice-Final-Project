const mongoose = require('mongoose');

const ReservationSchema = new mongoose.Schema({
    bookingDate : {
        type : Date,
        required : true
    },
    user : {
        type : mongoose.Schema.ObjectId,
        ref : 'User',
        required : true
    },
    hotel : {
        type : mongoose.Schema.ObjectId,
        ref : 'Hotel',
        required : true
    },
    status : {
        type : String,
        enum: ['booking','cancelled'],
        default: 'booking'
    },
    createdAt : {
        type : Date,
        default : Date.now()
    }
});

module.exports = mongoose.model('Reservation', ReservationSchema);