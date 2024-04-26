const express = require('express');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');
const bodyParser = require('body-parser');
const connectDB = require('./config/db');
const session = require('express-session');
const cors = require('cors');
dotenv.config({path:'./config/config.env'})

//connect to database
connectDB();

const app = express();
app.use(cors());

app.use(session({
    secret: 'secret-key',
    resave: false,
    saveUninitialized: true
}));
app.use(bodyParser.urlencoded({ extended: false }));

//Body parser
app.use(express.json());

//Cookie parser
app.use(cookieParser());


app.get('/', (req, res) => {
    res.status(200).json({success: true, data: {id:1}});
});

const hotels = require('./routes/hotel');
const auth = require('./routes/auth');
const reservation = require('./routes/reservation');

app.use('/api/v1/hotels', hotels);
app.use('/api/v1/auth', auth);
app.use('/api/v1/reservation', reservation);

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, console.log('Server running in mode '+ process.env.NODE_ENV +' on port ' + PORT));

//Handle unhandle promise rejections
process.on('unhandledRejection', (err, promise) => {
    console.error(`Error : ${err.message}`);
    //Close server & exit process
    server.close(()=>process.exit(1));
})