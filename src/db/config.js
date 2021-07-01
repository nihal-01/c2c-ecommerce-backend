const mongoose = require("mongoose");

const URL = process.env.MONGOURL;

mongoose.connect(URL, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useFindAndModify: false,
})
  .then(() => {
    console.log("Database connection established succesfully");
  })
  .catch((e) => {
    console.log(e);
  });