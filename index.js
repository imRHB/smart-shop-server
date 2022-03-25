const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const fileUpload = require("express-fileupload");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
var admin = require("firebase-admin");

const app = express();
const port = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

/* Firebase Admin */
// var serviceAccount = require("./smart-shop-pos-firebase-adminsdk-km3ga-21151d26c2.json");

// admin.initializeApp({
//   credential: admin.credential.cert(serviceAccount),
// });

// Database Info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.whfic.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// async function verifyToken(req, res, next) {
//   if (req.headers?.authorization?.startsWith("Bearer ")) {
//     const idToken = req.headers.authorization.split("Bearer ")[1];

//     try {
//       const decodedUser = await admin.auth().verifyIdToken(idToken);
//       req.decodedUserEmail = decodedUser.email;
//     } catch {
//       /* some space for error */
//     }
//   }
//   next();
// }

async function run() {
  try {
    await client.connect();

    /* Smart Shop POS database */
    const database = client.db("smart-shop-pos");

    /* Collections */
    const customerCollection = database.collection("customers");
    const productCollection = database.collection("products");
    const userCollection = database.collection("users");
    const employeeCollection = database.collection("employees");
    const transactionCollection = database.collection("transactions");
    const supplierCollection = database.collection("suppliers");
    const expenseCollection = database.collection("expenses");
    const expenseItemCollection = database.collection("expense-items");
    const designationCollection = database.collection("designations");
    const categoryCollection = database.collection("category");
    const eventsCollection = database.collection("events");
    const ordersCollection = database.collection("orders");
    const loansCollection = database.collection("loans");
    const storeCollection = database.collection("stores");

    /* ------- GET API ------- */
    /* Write down your GET API here */

    // GET : Products
    /* app.get("/products", async (req, res) => {
      const result = await productCollection.find({}).toArray();
      res.json(result);
    }); */

    // GET : Stores
    app.get("/stores", async (req, res) => {
      const stores = await storeCollection.find({}).toArray();
      res.json(stores);
    });

    // POST : Add store products
    app.post("/stores", async (req, res) => {
      const newProduct = req.body;
      const result = await storeCollection.insertOne(newProduct);
      res.json(result);
    });

    app.get("/stores/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await storeCollection.findOne(query);
      res.json(result);
    });

    // GET : Category
    app.get("/category", async (req, res) => {
      const result = await categoryCollection.find({}).toArray();
      res.json(result);
    });

    app.post("/category", async (req, res) => {
      const newCategory = req.body;
      const result = await categoryCollection.insertOne(newCategory);
      res.json(result);
    });

    app.delete("/category/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await categoryCollection.deleteOne(query);
      res.json(result);
    });

    app.get("/expense-items", async (req, res) => {
      const expenseItems = await expenseItemCollection.find({}).toArray();
      res.json(expenseItems);
    });

    app.post("/expense-items", async (req, res) => {
      const newExpenseItem = req.body;
      const result = await expenseItemCollection.insertOne(newExpenseItem);
      res.json(result);
    });

    app.delete("/expense-items/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await expenseItemCollection.deleteOne(query);
      res.json(result);
    });

    // GET : Users
    app.get("/users", async (req, res) => {
      const result = await userCollection.find({}).toArray();
      res.send(result);
    });

    /* ========================= Employees Collection START ======================= */

    // GET - Get all employees
    app.get("/employees", async (req, res) => {
      const cursor = employeeCollection.find({});
      if ((await cursor.count()) > 0) {
        const employees = await cursor.toArray();
        res.json(employees);
      } else {
        res.json({ message: "Employee Not Found!" });
      }
    });

    // GET API - Single employee Details
    app.get("/employees/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const employeeDetails = await employeeCollection.findOne(query);
      res.json(employeeDetails);
    });

    // POST - Add a employee by - Admin
    app.post("/employees", async (req, res) => {
      // Extract image data and convert it to binary base 64
      const pic = req.files.image;
      const picData = pic.data;
      const encodedPic = picData.toString("base64");
      const imageBuffer = Buffer.from(encodedPic, "base64");
      // Extract other information and make our employee object including image for saving into MongoDB
      const {
        name,
        designation,
        role,
        employeeId,
        phone,
        email,
        salary,
        bloodGroup,
        country,
        city,
        zip,
        address,
      } = req.body;
      const employee = {
        name,
        designation,
        role,
        employeeId,
        phone,
        email,
        salary,
        bloodGroup,
        country,
        city,
        zip,
        address,
        image: imageBuffer,
      };
      const result = await employeeCollection.insertOne(employee);
      res.json(result);
    });

    // Delete - Delete a employee by admin
    app.delete("/employees/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await employeeCollection.deleteOne(query);
      res.json({ _id: id, deletedCount: result.deletedCount });
    });

    // PUT - Update an employee details
    app.put("/employees", async (req, res) => {
      // Extract other information and make our employee object including image for saveing into MongoDB
      const {
        _id,
        name,
        designation,
        phone,
        salary,
        bloodGroup,
        country,
        city,
        zip,
        address,
      } = req.body;

      let employee = {};

      // Extract image data and convert it to binary base 64
      if (req?.files?.image) {
        const pic = req.files.image;
        const picData = pic.data;
        const encodedPic = picData.toString("base64");
        const imageBuffer = Buffer.from(encodedPic, "base64");

        employee = {
          name,
          designation,
          phone,
          salary,
          bloodGroup,
          country,
          city,
          zip,
          address,
          image: imageBuffer,
        };
      } else {
        employee = {
          name,
          designation,
          phone,
          salary,
          bloodGroup,
          country,
          city,
          zip,
          address,
        };
      }

      const filter = { _id: ObjectId(_id) };
      const options = { upsert: false };
      const updateDoc = { $set: employee };
      const result = await employeeCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    /* ========================= Employees Collection End ======================= */

    /* ========================= Designation Collection START ======================= */

    // GET - Get all designations
    app.get("/designations", async (req, res) => {
      const cursor = designationCollection.find({});
      if ((await cursor.count()) > 0) {
        const designations = await cursor.toArray();
        res.json(designations);
      } else {
        res.json({ message: "Designation Not Found!" });
      }
    });

    // GET API - Single designation Details
    app.get("/designations/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const designationDetails = await designationCollection.findOne(query);
      res.json(designationDetails);
    });

    // POST - Add a designation by - Admin
    app.post("/designations", async (req, res) => {
      const designation = req.body;
      const result = await designationCollection.insertOne(designation);
      res.json(result);
    });

    // Delete - Delete designation by admin
    app.delete("/designations/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await designationCollection.deleteOne(query);
      res.json({ _id: id, deletedCount: result.deletedCount });
    });

    // PUT - Update an designation details
    app.put("/designations", async (req, res) => {
      const designation = req.body;

      const filter = { _id: ObjectId(_id) };
      const options = { upsert: false };
      const updateDoc = { $set: designation };
      const result = await designationCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    /* ========================= Designation Collection END ======================= */

    /* ========================= Suppler Collection Start ======================= */

    // GET - Get all Suppliers
    app.get("/suppliers", async (req, res) => {
      const cursor = supplierCollection.find({});
      if ((await cursor.count()) > 0) {
        const suppliers = await cursor.toArray();
        res.json(suppliers);
      } else {
        res.json({ message: "Supplier Not Found!" });
      }
    });

    // GET API - Single Supplier Details
    app.get("/suppliers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const supplierDetails = await supplierCollection.findOne(query);
      res.json(supplierDetails);
    });

    // POST : Add Supplier
    app.post("/suppliers", async (req, res) => {
      const newSupplier = req.body;
      const result = await supplierCollection.insertOne(newSupplier);
      res.json(result);
    });

    //Delete API -supplier
    app.delete("/suppliers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await supplierCollection.deleteOne(query);
      res.json({ _id: id, deletedCount: result.deletedCount });
    });

    // PUT - Update an supplier details
    app.put("/suppliers", async (req, res) => {
      const { _id, name, contact, email, company, companyAddress } = req.body;
      const supplier = {
        name,
        contact,
        email,
        company,
        companyAddress,
      };
      const filter = { _id: ObjectId(_id) };
      const options = { upsert: false };
      const updateDoc = { $set: supplier };
      const result = await supplierCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    /* ========================= Supplier Collection END ======================= */

    /* ========================= Customer Collection Start ======================= */

    // GET : All Customers
    app.get("/customers", async (req, res) => {
      const cursor = customerCollection.find({});
      if ((await cursor.count()) > 0) {
        const customers = await cursor.toArray();
        res.json(customers);
      } else {
        res.json({ message: "Customer Not Found!" });
      }
    });

    // GET API - Single Customer Details
    app.get("/customers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const customerDetails = await customerCollection.findOne(query);
      res.json(customerDetails);
    });

    // POST : Add Customer
    app.post("/customers", async (req, res) => {
      const newCustomer = req.body;
      const result = await customerCollection.insertOne(newCustomer);
      res.json(result);
    });

    //Delete API - Customer
    app.delete("/customers/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await customerCollection.deleteOne(query);
      res.json({ _id: id, deletedCount: result.deletedCount });
    });

    // PUT - Update an customer details
    app.put("/customers", async (req, res) => {
      const { _id, name, email, city, zip, address } = req.body;

      const customer = {
        name,
        email,
        city,
        zip,
        address,
      };
      const filter = { _id: ObjectId(_id) };
      const options = { upsert: false };
      const updateDoc = { $set: customer };
      const result = await customerCollection.updateOne(
        filter,
        updateDoc,
        options
      );
      res.json(result);
    });

    /* ========================= Customer Collection End ======================= */

    /* ========================= Events Collection Start ======================= */

    // POST : Events
    app.post("/events", async (req, res) => {
      const event = req.body;
      const result = await eventsCollection.insertOne(event);
      console.log(result);
      res.json(result);
    });

    //GET : Events
    app.get("/events", async (req, res) => {
      const result = await eventsCollection.find({}).toArray();
      res.json(result);
    });

    /* ========================= Events Collection End ======================= */

    // GET : Transactions
    app.get("/transactions", async (req, res) => {
      const result = await transactionCollection.find({}).toArray();
      res.json(result);
    });

    // GET : Expenses
    app.get("/expenses", async (req, res) => {
      const result = await expenseCollection.find({}).toArray();
      res.json(result);
    });

    /* ------- POST API ------- */
    /* Write down your POST API here */

    // POST : Designation
    app.post("/designations", async (req, res) => {
      const newDesignation = req.body;
      const result = await designationCollection.insertOne(newDesignation);
      res.json(result);
    });

    // POST : Add Expense
    app.post("/expenses", async (req, res) => {
      const newExpense = req.body;
      const result = await expenseCollection.insertOne(newExpense);
      res.json(result);
    });

    /* ------- PUT API ------- */
    /* Write down your PUT API here */

    // PUT : Demo
    app.put("/demo", async (req, res) => {
      console.log("UPDATED");
    });

    /* ------- DELETE API ------- */
    /* Write down your DELETE API here */

    // DELETE : Demo
    app.delete("/demo", async (req, res) => {
      console.log("DELETED");
    });

    /* --------------------------- WRITE DOWN YOUR POST, PUT, DELETE APIs --------------------------- */

    /* STRIPE SECTION */

    // Stripe Payment
    app.post("/create-payment-intent", async (req, res) => {
      const paymentInfo = req.body;
      const paymentIntent = await stripe.paymentIntents.create({
        amount: paymentInfo.payAmount * 100,
        currency: "usd",
        automatic_payment_methods: {
          enabled: true,
        },
      });
      res.send({
        clientSecret: paymentIntent.client_secret,
      });
    });

    /* REPORT SECTION */

    //--------/* PRODUCT SECTION *------------//

    // GET : Products
    app.get("/products", async (req, res) => {
      const result = await productCollection.find({}).toArray();
      res.json(result);
    });

    // //Get: single product
    app.get("/details/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = await productCollection.findOne(query);
      // console.log(cursor);
      res.send(cursor);
    });

    // POST : Products
    app.post("/products", async (req, res) => {
      const img = req.files.img;
      const imgData = img.data;
      const encodedImg = imgData.toString("base64");
      const imgBuffer = Buffer.from(encodedImg, "base64");
      const {
        name,
        category,
        productId,
        supplierPrice,
        sellPrice,
        quantity,
        unit,
        description,
      } = req.body;
      const newProduct = {
        name,
        category,
        productId,
        supplierPrice: parseInt(supplierPrice),
        sellPrice: parseInt(sellPrice),
        quantity: parseInt(quantity),
        unit,
        description,
        img: imgBuffer,
      };
      const result = await productCollection.insertOne(newProduct);
      res.json(result);
    });

    //Remove : Product
    app.delete("/products/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      // console.log(result);
      res.send(result);
    });

    // Update : Products information
    app.put("/products/:id", async (req, res) => {
      const id = req.params.id;
      const updateData = req.body;
      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updateDoc = {
        $set: updateData,
      };
      const result = await productCollection.updateOne(
        filter,
        updateDoc,
        options
      );

      console.log(result);
      // console.log(req.body);
      res.json(result);
    });

    //   ------------- End Products Section  -----------//

    /* ========================= order Collection Start ======================= */

    // POST : orders
    app.post("/orders", async (req, res) => {
      const order = req.body;
      const result = await ordersCollection.insertOne(order);
      console.log(result);
      res.json(result);
    });

    //GET : orders
    app.get("/orders", async (req, res) => {
      const result = await ordersCollection.find({}).toArray();
      res.json(result);
    });

    //UPDATE API - orders payment status
    app.put("/orders/:id", async (req, res) => {
      const order = req.body;
      const options = { upsert: true };
      const updatedPayment = { _id: ObjectId(req.params.id) };
      const updatedPaymentStatus = {
        $set: {
          payment: order.payment,
        },
      };
      const result = await ordersCollection.updateOne(
        updatedPayment,
        updatedPaymentStatus,
        options
      );
      res.json(result);
    });

    // //Get: single order
    app.get("/orders/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = await ordersCollection.findOne(query);
      res.send(cursor);
    });

    //Remove : order

    app.delete("/orders/:id", async (req, res) => {
      const deletedOrder = await ordersCollection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.json(deletedOrder);
    });

    /* ========================= order Collection End ======================= */

    /* ========================= Transaction Collection Start ======================= */

    //POST : transactions
    app.post("/transactions", async (req, res) => {
      const transaction = req.body;
      const result = await transactionCollection.insertOne(transaction);
      res.json(result);
    });

    //UPDATE API - transactions status
    app.put("/transactions/:id", async (req, res) => {
      const transaction = req.body;
      const options = { upsert: true };
      const updatedPayment = { _id: ObjectId(req.params.id) };
      const updatedPaymentStatus = {
        $set: {
          payment: transaction.payment,
        },
      };
      const result = await transactionCollection.updateOne(
        updatedPayment,
        updatedPaymentStatus,
        options
      );
      res.json(result);
    });

    // //Get: single transaction
    app.get("/transactions/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const cursor = await transactionCollection.findOne(query);
      res.send(cursor);
    });

    //Remove : transaction

    app.delete("/transactions/:id", async (req, res) => {
      const deletedTransaction = await transactionCollection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.json(deletedTransaction);
    });

    /* ========================= Transaction Collection End ======================= */

    /* ========================= Loans Collection Start ======================= */

    // POST : loans
    app.post("/loans", async (req, res) => {
      const pic = req.files?.img;
      const picData = pic?.data;
      const encodedPic = picData?.toString("base64");
      const imageBuffer = Buffer?.from(encodedPic, "base64");

      const { amount, details, duration, status } = req.body;
      const newLoan = { amount: parseInt(amount), details, duration: parseInt(duration), status, img: imageBuffer };
      const result = await loansCollection.insertOne(newLoan);
      res.json(result);
    });
    //GET : loans
    app.get("/loans", async (req, res) => {
      const result = await loansCollection.find({}).toArray();
      res.json(result);
    });

    //Delete Single Loan by ID
    app.delete("/loans/:id", async (req, res) => {
      const deletedLoans = await loansCollection.deleteOne({
        _id: ObjectId(req.params.id),
      });
      res.json(deletedLoans);
    });

    //UPDATE API - loans status
    app.put("/loans/:id", async (req, res) => {
      const loan = req.body;
      const options = { upsert: true };
      const approvedLoan = { _id: ObjectId(req.params.id) };
      const approvedLoanStatus = {
        $set: {
          status: loan.status,
        },
      };
      const result = await transactionCollection.updateOne(
        approvedLoan,
        approvedLoanStatus,
        options
      );
      res.json(result);
    });
    /* ========================= Loans Collection End ======================= */
  } finally {
    // client.close();
  }
}

run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("<h1>Smart Shop POS server is running ...</h1>");
});

app.listen(port, (req, res) => {
  console.log("Smart Shop POS server is listning at port", port);
});
