const express = require('express');
const router = express.Router();
const Plant = require('../models/Plant');
const Wishlist = require('../models/Wishlist');
const Order = require('../models/Order');
const OrderItem = require('../models/OrderItem');
const Cart = require('../models/Cart');
const { authenticateSession } = require('../middleware/auth');

// Customer dashboard - WEB PAGE
router.get('/dashboard', authenticateSession, (req, res) => {
  if (req.session.user.role !== 'customer') {
    return res.redirect('/auth/login');
  }

  res.render('customer/dashboard', {
    title: 'Customer Dashboard',
    user: req.session.user
  });
});

// View all plants - WEB PAGE
router.get('/plants', authenticateSession, async (req, res) => {
  try {
    const plants = await Plant.getAll();
    res.render('customer/plants', {
      title: 'Browse Plants',
      user: req.session.user,
      plants: plants
    });
  } catch (error) {
    console.error('Plants page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error loading plants'
    });
  }
});

// View single plant details - WEB PAGE
router.get('/plants/:plantId', authenticateSession, async (req, res) => {
  try {
    if (req.session.user.role !== 'customer') {
      return res.redirect('/auth/login');
    }

    const plant = await Plant.findById(req.params.plantId);
    if (!plant) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Plant not found'
      });
    }

    res.render('customer/plant-details', {
      title: plant.name,
      user: req.session.user,
      plant: plant
    });
  } catch (error) {
    console.error('Plant details error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error loading plant details'
    });
  }
});

// View wishlist - WEB PAGE
router.get('/wishlist', authenticateSession, async (req, res) => {
  try {
    const wishlist = await Wishlist.getWishlist(req.session.user.id);
    res.render('customer/wishlist', {
      title: 'My Wishlist',
      user: req.session.user,
      wishlist: wishlist
    });
  } catch (error) {
    console.error('Wishlist page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error loading wishlist'
    });
  }
});

// Add to wishlist - API ENDPOINT
router.post('/wishlist/add/:plantId', authenticateSession, async (req, res) => {
  try {
    const added = await Wishlist.addToWishlist(req.session.user.id, req.params.plantId);
    res.json({
      success: true,
      message: added ? 'Added to wishlist' : 'Already in wishlist'
    });
  } catch (error) {
    console.error('Add to wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to wishlist'
    });
  }
});

// Remove from wishlist - API ENDPOINT
router.post('/wishlist/remove/:plantId', authenticateSession, async (req, res) => {
  try {
    const removed = await Wishlist.removeFromWishlist(req.session.user.id, req.params.plantId);
    res.json({
      success: true,
      message: removed ? 'Removed from wishlist' : 'Not in wishlist'
    });
  } catch (error) {
    console.error('Remove from wishlist error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from wishlist'
    });
  }
});


// View orders - WEB PAGE
router.get('/orders', authenticateSession, async (req, res) => {
  try {
    if (req.session.user.role !== 'customer') {
      return res.redirect('/auth/login');
    }

    const orders = await Order.findByCustomerId(req.session.user.id);
    
    res.render('customer/orders', {
      title: 'My Orders',
      user: req.session.user,
      orders: orders
    });
  } catch (error) {
    console.error('Orders page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error loading orders'
    });
  }
});

// View order details - WEB PAGE
router.get('/orders/:orderId', authenticateSession, async (req, res) => {
  try {
    if (req.session.user.role !== 'customer') {
      return res.redirect('/auth/login');
    }

    // Get order with customer validation
    const order = await Order.findByIdAndCustomer(req.params.orderId, req.session.user.id);
    
    if (!order) {
      return res.status(404).render('error', {
        title: 'Not Found',
        message: 'Order not found'
      });
    }

    // Get order items
    const items = await OrderItem.findByOrderId(req.params.orderId);
    
    res.render('customer/order-details', {
      title: 'Order Details',
      user: req.session.user,
      order: order,
      items: items
    });
  } catch (error) {
    console.error('Order details error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error loading order details'
    });
  }
});

// View cart - WEB PAGE
// View cart - WEB PAGE
router.get('/cart', authenticateSession, async (req, res) => {
  try {
    console.log('🛒 Accessing cart for user:', req.session.user.id);
    
    const cartItems = await Cart.getCart(req.session.user.id);
    const cartTotal = await Cart.getCartTotal(req.session.user.id);
    
    console.log('Cart items:', cartItems);
    
    res.render('customer/cart', {
      title: 'Shopping Cart',
      user: req.session.user,
      cartItems: cartItems,
      cartTotal: cartTotal
    });
  } catch (error) {
    console.error('❌ Cart page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error loading cart'
    });
  }
});

// Add to cart - API ENDPOINT
router.post('/cart/add/:plantId', authenticateSession, async (req, res) => {
  try {
    const { quantity } = req.body;
    await Cart.addItem(req.session.user.id, req.params.plantId, parseInt(quantity) || 1);
    
    res.json({
      success: true,
      message: 'Added to cart successfully'
    });
  } catch (error) {
    console.error('Add to cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error adding to cart'
    });
  }
});







// Add these routes to your customer.js file:

// Update cart quantity
router.post('/cart/update/:plantId', authenticateSession, async (req, res) => {
  try {
    const { quantity } = req.body;
    await Cart.updateQuantity(req.session.user.id, req.params.plantId, parseInt(quantity));
    
    res.json({
      success: true,
      message: 'Cart updated successfully'
    });
  } catch (error) {
    console.error('Update cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error updating cart'
    });
  }
});

// Remove from cart
router.post('/cart/remove/:plantId', authenticateSession, async (req, res) => {
  try {
    await Cart.removeItem(req.session.user.id, req.params.plantId);
    
    res.json({
      success: true,
      message: 'Removed from cart successfully'
    });
  } catch (error) {
    console.error('Remove from cart error:', error);
    res.status(500).json({
      success: false,
      message: 'Error removing from cart'
    });
  }
});



// Checkout page - WEB PAGE
router.get('/checkout', authenticateSession, async (req, res) => {
  try {
    if (req.session.user.role !== 'customer') {
      return res.redirect('/auth/login');
    }

    const cartItems = await Cart.getCart(req.session.user.id);
    const cartTotal = await Cart.getCartTotal(req.session.user.id);
    
    if (cartItems.length === 0) {
      return res.redirect('/customer/cart');
    }
    
    res.render('customer/checkout', {
      title: 'Checkout',
      user: req.session.user,
      cartItems: cartItems || [],
      cartTotal: cartTotal || 0,
      error: null, // Always pass error, even if null
      message: null 
    });
  } catch (error) {
    console.error('Checkout page error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error loading checkout'
    });
  }
});





// Place order - FORM HANDLER
router.post('/orders/place', authenticateSession, async (req, res) => {
  try {
    const { delivery_address } = req.body;
    
    if (!delivery_address) {
      return res.render('customer/checkout', {
        title: 'Checkout',
        user: req.session.user,
        cartItems: await Cart.getCart(req.session.user.id),
        cartTotal: await Cart.getCartTotal(req.session.user.id),
        error: 'Delivery address is required'
      });
    }

    // Get cart items and total
    const cartItems = await Cart.getCart(req.session.user.id);
    const cartTotal = await Cart.getCartTotal(req.session.user.id);
    
    if (cartItems.length === 0) {
      return res.redirect('/customer/cart');
    }

    // Create order
    const orderId = await Order.create({
      customer_id: req.session.user.id,
      total_amount: cartTotal,
      delivery_address: delivery_address
    });

    // Add order items
    const orderItems = cartItems.map(item => ({
      plant_id: item.plant_id,
      quantity: item.quantity,
      price: item.price
    }));
    
    await OrderItem.addItems(orderId, orderItems);

    // Clear cart
    await Cart.clearCart(req.session.user.id);

    // Redirect to order confirmation
    res.redirect(`/customer/orders/${orderId}?success=true`);
    
  } catch (error) {
    console.error('Place order error:', error);
    res.status(500).render('error', {
      title: 'Error',
      message: 'Error placing order'
    });
  }
});

module.exports = router;