const express = require("express");
const cors = require("cors");
const { MongoClient } = require("mongodb");
const ObjectId = require("mongodb").ObjectId;
require("dotenv").config();
const fileUpload = require("express-fileupload");
const app = express();
const port = process.env.PORT || 5000;
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(fileUpload());

// Database Info
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.whfic.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

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
        const designationCollection = database.collection("designations");
        const categoryCollection = database.collection("category");

        /* ------- GET API ------- */
        /* Write down your GET API here */

        // GET : Customers
        app.get("/customers", async (req, res) => {
            const result = await customerCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Products
        app.get("/products", async (req, res) => {
            const result = await productCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Category
        app.get("/category", async (req, res) => {
            const result = await categoryCollection.find({}).toArray();
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
                employeeId,
                phone,
                email,
                salary,
                bloodGroup,
                country,
                city,
                zip,
                address,
                image,
            } = req.body;
            const employee = {
                name,
                designation,
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
            // Extract image data and convert it to binary base 64
            const pic = req.files.image;
            const picData = pic.data;
            const encodedPic = picData.toString("base64");
            const imageBuffer = Buffer.from(encodedPic, "base64");

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

            const employee = {
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

        // GET : Transactions
        app.get("/transactions", async (req, res) => {
            const result = await transsactionCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Suppliers
        app.get("/suppliers", async (req, res) => {
            const result = await supplierCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Expenses
        app.get("/expenses", async (req, res) => {
            const result = await expenseCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Designations
        app.get("/designations", async (req, res) => {
            const result = await designationCollection.find({}).toArray();
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

        // POST : Add Supplier
        app.post("/suppliers", async (req, res) => {
            const newSupplier = req.body;
            const result = await supplierCollection.insertOne(newSupplier);
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


        /* SUPPLIER SECTION */

        //POST API- Add Supplier
        app.post('/suppliers', async (req, res) => {
            const supplier = await supplierCollection.insertOne(req.body);
            res.json(supplier);
        });

        //Delete API -supplier

        app.delete("/suppliers/:id", async (req, res) => {
            const deletedSupplier = await supplierCollection.deleteOne({ _id: ObjectId(req.params.id) });
            res.json(deletedSupplier);
        });



        /* CUSTOMER SECTION */




        /* REPORT SECTION */




        /* PRODUCT SECTION */






    } finally {
        // client.close();
    }
}

run().catch(console.dir);

app.get("/", (req, res) => {
    res.send("Smart Shop POS server is running ...");
});

app.listen(port, (req, res) => {
    console.log("Smart Shop POS server is listning at port", port);
});
