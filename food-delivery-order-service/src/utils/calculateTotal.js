/**
 * Calculate the total amount for an order
 * @param {Array} items Array of order items with quantity and price
 * @param {Number} deliveryFee Delivery fee
 * @param {Number} taxRate Tax rate as decimal (e.g., 0.05 for 5%)
 * @returns {Object} Object containing subtotal, tax, deliveryFee, and total
 */
const calculateTotal = (items, deliveryFee = 0, taxRate = 0.05) => {
    // Calculate subtotal
    const subtotal = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    // Calculate tax
    const tax = subtotal * taxRate;
    
    // Calculate total
    const total = subtotal + tax + deliveryFee;
    
    return {
      subtotal: parseFloat(subtotal.toFixed(2)),
      tax: parseFloat(tax.toFixed(2)),
      deliveryFee: parseFloat(deliveryFee.toFixed(2)),
      total: parseFloat(total.toFixed(2))
    };
  };
  
  module.exports = calculateTotal;