const Reservation = require('../models/Reservation');
const Hotel = require('../models/Hotel');
const createCsvWriter = require('csv-writer').createObjectCsvWriter;

//@desc         Get all reservation
//@route        GET /api/v1/reservation
//@access       Public
exports.getReservations = async (req, res, next) => {
    let query;
    if (req.user.role !== 'admin'){
        query = Reservation.find({user : req.user.id}).populate({
            path: 'hotel',
            select: 'name province tel'
        });
    } else {
        if (req.params.hotelId){
            query = Reservation.find({hotel : req.params.hotelId}).populate({
                path: 'hotel',
                select: 'name province tel'
            });
        } else {
            query = Reservation.find().populate({
                path: 'hotel',
                select: 'name province tel'
            });
        }
    }
    try {
        const reservation = await query;
        return res.status(200).json({success: true , count: reservation.length, data: reservation});
    } catch (error) {
        console.error(error);
        return res.status(400).json({success: false ,message: "Cannot find Reservation"});
    }
};

//@desc         Get single reservation
//@route        GET /api/v1/reservation/:id
//@access       Public
exports.getReservation = async (req, res, next) => {
    try {
        const reservation = await Reservation.findById(req.params.id).populate({
            path: 'hotel',
            select: 'name description tel'
        });

        if (!reservation) {
            return res.status(404).json({success: false ,message: `No reservation with the id of ${req.params.id}`});
        }
        res.status(200).json({success: true, data: reservation});
    } catch (error) {
        console.error(error);
        return res.status(500).json({success: false ,message: "Cannot find Reservation"});
    }
};

//@desc         Add reservation
//@route        POST /api/v1/hotels/:hotelId/reservation
//@access       Private
exports.addReservation= async (req, res, next) => {
    try {
        req.body.hotel = req.params.hotelId;
        const hotel = await Hotel.findById(req.params.hotelId);

        if (!hotel) {
            return res.status(404).json({success: false ,message: `No hotel with the id of ${req.params.hotelId}`});
        }

        req.body.user = req.user.id;
        const existedReservation = await Reservation.find({user:req.user.id});
        if (existedReservation.length >= 3 && req.user.role !== 'admin'){
            return res.status(400).json({success: false ,message: `The user with the ID ${req.user.id} has already made 3 reservation`});
        }

        const reservation = await Reservation.create(req.body);
        res.status(200).json({success: true, data: reservation});

    }catch (error) {
        console.error(error);
        return res.status(500).json({success: false ,message: "Cannot create Reservation"});
    }
};

//@desc         Update reservation
//@route        PUT /api/v1/reservation/:id
//@access       Private
exports.updateReservation = async (req, res, next) => {
    try {

        const {bookingDate, hotel} = req.body;
        let reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({success: false ,message: `No reservation with the id of ${req.params.id}`});
        }

        if(reservation.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success: false ,message: `User ${req.user.id} is not authorized to update this reservation`});
        }
        reservation = await Reservation.findByIdAndUpdate(req.params.id, {bookingDate, hotel}, {
            new : true,
            runValidators: true
        });
        res.status(200).json({success: true, data: reservation});

    } catch (error) {
        console.error(error);
        return res.status(500).json({success: false ,message: "Cannot update Reservation"});
    }
};

//@desc         Delete reservation
//@route        DELETE /api/v1/reservation/:id
//@access       Private
exports.deleteReservation = async (req, res, next) => {
    try {
        let reservation = await Reservation.findById(req.params.id);
        if (!reservation) {
            return res.status(404).json({success: false ,message: `No reservation with the id of ${req.params.id}`});
        }
        if(reservation.user.toString() !== req.user.id && req.user.role !== 'admin'){
            return res.status(401).json({success: false ,message: `User ${req.user.id} is not authorized to delete this reservation`});
        }
        var now = new Date();
        const nextThreeDays = new Date(now.setDate(now.getDate() + 3));
        if (reservation.bookingDate <= nextThreeDays){
            return res.status(401).json({success: false ,message: "can only delete reservation 3 days before reservation date"});
        }

        await reservation.deleteOne();
        res.status(200).json({success: true, data: reservation});
    } catch (error) {
        console.error(error);
        return res.status(500).json({success: false ,message: "Cannot delete Reservation"});
    }
};

exports.getReservationReport = async (req, res, next) => {
    const currentDate = new Date();

    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();

    const startDate = new Date(currentYear, currentMonth - 1, 1);
    const endDate = new Date(currentYear, currentMonth, 0);
    const query = {
        bookingDate: {
            $gte: startDate,
            $lte: endDate
        }
    };

    var reservation = await Reservation.find(query).populate({
        path: 'hotel',
        select: 'name province tel'
    }).populate({
        path: 'user',
        select: 'name email tel'
    });

    const extractedData = reservation.map(item => ({
        hotelName: item.hotel.name,
        userName: item.user.name,
        bookingDate : item.bookingDate
    }));
    
    const csvWriter = createCsvWriter({
        path: '/tmp/report.csv',
        header: [
            {id: 'userName', title: 'NAME'},
            {id: 'hotelName', title: 'HOTEL'},
            {id: 'bookingDate', title: 'DATE'},
        ]
    });
     
    await csvWriter.writeRecords(extractedData)
    res.download('/tmp/report.csv');
}