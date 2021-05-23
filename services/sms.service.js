const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const client = require('twilio')(accountSid, authToken);

async function sendOTPSMS(to, otp) {
  const response = await client.messages
    .create({
      body: `Your TainTalk verification code is ${otp}`,
      from: process.env.TWILIO_PHONE_NUMBER,
      to
    });
  return response;
}

module.exports = { sendOTPSMS };
