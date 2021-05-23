const nodemailer = require('nodemailer');
const Mailclient = nodemailer.createTransport({
  host: process.env.MAILER_HOST || "smtp.gmail.com",
  secureConnection: false,
  port: process.env.MAILER_PORT || 587,
  authentication: 'OAuth',
  auth: {
    user: process.env.MAILER_EMAIL,
    pass: process.env.MAILER_PASSWORD
  }
});



async function sendMail(payload) {
  var mailOptions = {
    from: (payload.senderName ? `<${payload.senderName}> ` : '') + process.env.MAILER_EMAIL,
    to: payload.to,
    subject: payload.subject,
    text: 'Sample email for verification'
    // html: '<html xmlns="http://www.w3.org/1999/xhtml"><head><meta http-equiv="Content-Type" content="text/html; charset=utf-8" /><title>Verification Code</title><link href="https://fonts.googleapis.com/css?family=Roboto:100,300,400,500" rel="stylesheet"></head><body style="padding:15px 0; background: url(img/bgplait.png) repeat #dddddd; margin:0px auto; font-family: "Roboto", sans-serif; font-weight:400; background-size: 160px;"><table width="600" border="0" cellpadding="10" cellspacing="0" style="margin:0px auto; background:#fffefb; text-align:center;"><tr style="background:#fff;" ><td style="text-align:center; padding-top:10px; padding-bottom:10px; border-bottom:2px solid #00306b;">Clubs.com</td></tr><tr><td align="center"><h2 style="text-align:center;">Hi, </h2><h3 style="margin-top:0 ;font-weight: 600; font-size: 18px;">We received verification code request for your account.</h3><p>Copy this code: </p></td></tr><tr><td align="center"><p style="color:#000; font-weight:500;"></p></td></tr><tr><td align="center"><p style="color:#000; font-weight:500;">Thank You,<br>Clubs.com</p></td></tr></table></body></html>'
  };

  return await Mailclient.sendMail(mailOptions);
}

function sendCustomerInquiryEmail(payload) {
  return sendMail(payload);
}

function sendEmailVerificationEmail(payload) {
  return sendMail({ to: 'yousharizvi@gmail.com', subject: 'Testing email service' });
}

module.exports = { sendCustomerInquiryEmail, sendEmailVerificationEmail };
