const express = require("express");
require("dotenv").config();
require("./db/config");

const app = express();
const PORT = process.env.PORT || 3001;

// middle wares
app.use(express.json());
app.use(express.urlencoded({extended: true}));

const userRouter = require("./routes/userRouter");
const productRouter = require("./routes/productRouter");

app.use("/api/user", userRouter);
app.use('/api/products', productRouter);

app.listen(PORT, () => {
  console.log(`Server is up on port ${PORT}`);
});