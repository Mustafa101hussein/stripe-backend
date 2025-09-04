// This allows our server to handle requests from Android app
const Stripe = require('stripe');

// Get the secret key from environment variables (we'll set this up later)
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// This is the function that will handle payment requests
module.exports = async (req, res) => {
  // Set up headers to allow requests from anywhere (CORS)
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

  // Handle browser preflight requests
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  // Only allow POST requests (GET requests will be rejected)
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Get the amount from the request body
    const { amount } = req.body;
    
    // Check if amount is valid
    if (!amount || amount <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    // Create a payment intent with Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(amount * 100), // Convert dollars to cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
    });

    // Send back the client secret to the Android app
    res.status(200).json({ 
      clientSecret: paymentIntent.client_secret 
    });
  } catch (error) {
    console.error('Error creating payment intent:', error);
    res.status(500).json({ error: error.message });
  }
};