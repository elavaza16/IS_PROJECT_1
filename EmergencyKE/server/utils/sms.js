const AfricasTalking = require('africastalking')({
  username: process.env.AT_USERNAME,
  apiKey:   process.env.AT_API_KEY,
});

const smsService = AfricasTalking.SMS;

exports.sendSMS = async (phone, message) => {
  try {
    const result = await smsService.send({
      to:      phone,
      message: message,
      // No 'from' needed — sandbox uses Africa's Talking's default sender
    });
    console.log('SMS sent:', result);
    return result;
  } catch (err) {
    console.error('SMS send error:', err);
    // Don't throw — SMS failure should never block the main flow
  }
};