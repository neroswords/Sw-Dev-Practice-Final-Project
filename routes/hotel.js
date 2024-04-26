const express = require('express');

const reservationRouter = require('./reservation');

const router = express.Router();
const {getHotels, getHotel, createHotel, updateHotel, deleteHotel} = require('../controllers/hotel')
const {protect, authorize} = require('../middleware/auth');

router.use('/:hotelId/reservation/', reservationRouter);

router.route('/').get(getHotels).post(protect, authorize('admin'), createHotel);
router.route('/:id').get(getHotel).put(protect, authorize('admin'), updateHotel).delete(protect, authorize('admin'), deleteHotel);


module.exports = router;