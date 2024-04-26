const Hotel = require("../models/Hotel");

//@desc         Get all hotels
//@route        GET /api/v1/hotels
//@access       Public
exports.getHotels=async(req, res, next) => {
    try {
        let query;

        const reqQuery = {...req.query};
        const removeFields = ['select', 'sort', 'page', 'limit']

        removeFields.forEach(param => delete reqQuery[param]);
        

        let queryString = JSON.stringify(req.query);
        queryString = queryString.replace(/\b(gt|gte|lt|lte|in)\b/g, match=>`$${match}`);

        query = Hotel.find(JSON.parse(queryString)).populate('reservation');
        

        if(req.query.select){
            const fields = req.query.select.split(',').join(' ');
            query = query.select(fields);
        }

        if(req.query.sort){
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
        } else {
            query = query.sort('name');
        }
        
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 25;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const total = await Hotel.countDocuments();

        query = query.skip(startIndex).limit(limit);

        const hotels = await query;
        const pagination = {};

        if (endIndex < total){
            pagination.next = {
                page : page + 1,
                limit
            }
        }
        if (startIndex > 0){
            pagination.prev = {
                page : page - 1,
                limit
            }
        }
        res.status(200).json({success: true, count: hotels.length, pagination, data: hotels});
    } catch (err) {
        console.error(err);
        res.status(400).json({success: false});
    };
};

//@desc         Get single hotel
//@route        GET /api/v1/hotels/:id
//@access       Public
exports.getHotel=async(req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel) {
            return res.status(400).json({success: false});
        }
        res.status(200).json({success: true, data: hotel});
    } catch (err) {
        res.status(400).json({success: false});
    };
};

//@desc         Create a hotel
//@route        POST /api/v1/hotels
//@access       Private
exports.createHotel= async(req, res, next) => {
    const hotel = await Hotel.create(req.body);
    res.status(201).json({success: true, data: hotel});
};

//@desc         Update single hotel
//@route        PUT /api/v1/hotel/:id
//@access       Private
exports.updateHotel= async(req, res, next) => {
    try {
        const hotel = await Hotel.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true,
        });
        if (!hotel){
            return res.status(400).json({success: false});
        }
            res.status(200).json({success: true, data: hotel});
    } catch{
        res.status(400).json({success: false});

    }
};

//@desc         Delete single hotel
//@route        DELETE /api/v1/hotel/:id
//@access       Private
exports.deleteHotel= async (req, res, next) => {
    try {
        const hotel = await Hotel.findById(req.params.id);
        if (!hotel){
            return res.status(400).json({success: false});
        }
        await hotel.deleteOne();
        res.status(200).json({success: true, data: {}});
    } catch{
        res.status(400).json({success: false});

    }
};