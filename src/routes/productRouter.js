const router = require("express").Router();
const Product = require("../models/product.model");
const auth = require("../middleware/auth");
const multer = require("multer");
const Photo = require("../models/photo.model");

// http://localhost:3001/api/products

router.post('/', auth, async (req, res) => {
  try {
    const newProduct = new Product({
      ...req.body,
      owner: req.user._id,
    });

    const product = await newProduct.save();
    res.status(200).send(product);
  } catch (e) {
    res.status(500).send(e);
  }
});

// edit products
router.patch('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const updates = Object.keys(req.body);
    const product = await Product.findOne({ _id: id, owner: req.user._id });
    
    if (!product) {
      return res.status(404).send({ error: "Product not found" });
    }

    updates.forEach((update) => {
      product[update] = req.body[update];
    });

    await req.save();
    res.status(200).send(product);
  } catch (e) {
    res.status(500).send(e);
  }
});

router.delete('/:id', auth, async (req, res) => {
  try {
    const product = await Product.findOneAndDelete({ _id: req.params.id, owner: req.user._id });
    if (!product) {
      return res.status(404).send({ error: "Item not found" });
    }
    for (let i = 0; i < product.photos.length; i++) {
      await Photo.findOneAndRemove({ _id: product.photos[i] })
    }
    res.status(200).send({ message: "Successfully deleted" });
  } catch (e) {
    res.status(200).send(e);
  }
});

// get own products
router.get('/my-products', auth, async (req, res) => {
  try {
    const products = await Product.find({ owner: req.user._id });
    res.status(200).send(products);
  } catch (e) {
    res.status(500).send(e);
  }
});

const upload = multer({
  limits: {
    fileSize: 3000000,
  },
  fileFilter: (req, file, db) => {
    const allowed = ["jpg", "png", "jpeg"];
    if (!allowed.includes(file.originalname.split(".")[1])) {
      return db(new Error("Please upload png, jpg, or jpeg files."));
    }
    db(null, true);
  }
});

// save product image
router.post('/images', auth, upload.single("photo") ,async (req, res) => {
  try {
    const photo = await Photo({
      photo: req.file.buffer,
    }).save();
    res.status(200).send({ _id: photo._id });
  } catch (e) {
    res.status(500).send(e);
  }
});

// get product image
router.get('/images/:id', async (req, res) => {
  try {
     const photo = await Photo.findOne({ _id: req.params.id });
     res.set('Content-Type', 'image/jpg');
     res.send(photo.photo);
  } catch (e) {
    res.status(500).send(e);
  }
});

// remove product image
router.delete('/images/:id', auth, async (req, res) => {
  try {
    await Photo.findOneAndRemove({ _id: req.params.id });
    res.status(200).send();
  } catch (e) {
    res.status(500).send(e);
  }
});

module.exports = router;