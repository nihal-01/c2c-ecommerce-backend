const mongoose = require("mongoose");

const photoSchema = new mongoose.Schema({
  photo: {
    type: Buffer,
    required: true,
  }
});

const Photo = mongoose.model("photos", photoSchema);

module.exports = Photo;