const mongoose = require("mongoose");

const productSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: String,
    required: true,
    lowercase: true,
  },
  brand: {
    type: String,
  },
  model: {
    type: String,
  },
  varient: {
    type: String,
  },
  year: {
    type: Number,
  },
  fuel: {
    type: String,
  },
  transmission: {
    type: String,
  },
  drivern: {
    type: Number,
  },
  owner: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'users'
  },
  photos: {
    type: Array,
    required: true,
  },
}, {timestamps: true});

const Product = mongoose.model("products", productSchema);

module.exports = Product;