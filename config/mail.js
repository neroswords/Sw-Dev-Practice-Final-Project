const nodemailer = require('nodemailer');

const sendMailAsHtml = (sendTo, subject, message) => {
    var transporter = nodemailer.createTransport({
        host: process.env.EMAIL_SERVER, //set to your host name or ip
        port: process.env.EMAIL_SERVER_PORT, //25, 465, 587 depend on your 
        secure: false, // use SSL
    });

    var mailOptions = {
        from: process.env.EMAIL_DOMAIN_NAME,
        to: sendTo,
        subject: subject,
        html: message
    };
      
    transporter.sendMail(mailOptions, function(error, info){
        transporter.close();
        if (error) {
          console.error(error);
        } else {
          console.log('Email sent: ' + info.response);
        }
    });
}

module.exports = sendMailAsHtml;