const express = require('express');
const { getReservations, getReservation, addReservation, updateReservation, deleteReservation ,getReservationReport } = require('../controllers/reservation');

const router = express.Router({mergeParams : true});

const {protect, authorize} = require('../middleware/auth');

router.route('/')
    .get(protect, getReservations)
    .post(protect, authorize('admin', 'user'), addReservation);

router.route('/:id')
    .get(protect, getReservation)
    .put(protect, authorize('admin', 'user'), updateReservation)
    .delete(protect, authorize('admin', 'user'), deleteReservation);

router.post('/reports',protect, authorize('admin'), getReservationReport)

module.exports = router;