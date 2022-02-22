const { MongoClient } = require('mongodb');
const express = require('express');
const cors = require('cors');
const res = require("express/lib/response");
require('dotenv').config();
const app = express();
const port = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.whfic.mongodb.net/myFirstDatabase?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });


async function run() {
    try {
        await client.connect();

        /* Smart Shop POS database */
        const database = client.db('smart-shop-pos');

        /* Collections */
        const customerCollection = database.collection('customers');
        const productCollection = database.collection('products');
        const userCollection = database.collection('users');
        const employeeCollection = database.collection('employees');
        const transsactionCollection = database.collection('transactions');
        const supplierCollection = database.collection('suppliers');
        const expenseCollection = database.collection('expenses');
        const designationCollection = database.collection('designations');
        const categoryCollection = database.collection('category');



        /* ------- GET API ------- */
        /* Write down your GET API here */

        // GET : Customers
        app.get('/customers', async (req, res) => {
            const result = await customerCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Products
        app.get('/products', async (req, res) => {
            const result = await productCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Category
        app.get('/category', async (req, res) => {
            const result = await categoryCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Users
        app.get('/users', async (req, res) => {
            const result = await userCollection.find({}).toArray();
            res.send(result);
        });

        // GET : Employees
        app.get('/employees', async (req, res) => {
            const result = await employeeCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Transactions
        app.get('/transactions', async (req, res) => {
            const result = await transsactionCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Suppliers
        app.get('/suppliers', async (req, res) => {
            const result = await supplierCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Expenses
        app.get('/expenses', async (req, res) => {
            const result = await expenseCollection.find({}).toArray();
            res.json(result);
        });

        // GET : Designations
        app.get('/designations', async (req, res) => {
            const result = await designationCollection.find({}).toArray();
            res.json(result);
        });





        /* ------- POST API ------- */
        /* Write down your POST API here */

        // POST : Designation
        app.post('/designations', async (req, res) => {
            const newDesignation = req.body;
            const result = await designationCollection.insertOne(newDesignation);
            res.json(result);
        });

        // POST : Add Supplier
        app.post('/suppliers', async (req, res) => {
            const newSupplier = req.body;
            const result = await supplierCollection.insertOne(newSupplier);
            res.json(result);
        });

        // POST : Add Expense
        app.post('/expenses', async (req, res) => {
            const newExpense = req.body;
            const result = await expenseCollection.insertOne(newExpense);
            res.json(result);
        });





        /* ------- PUT API ------- */
        /* Write down your PUT API here */

        // PUT : Demo
        app.put('/demo', async (req, res) => {
            console.log('UPDATED');
        });




        /* ------- DELETE API ------- */
        /* Write down your DELETE API here */

        // DELETE : Demo
        app.delete('/demo', async (req, res) => {
            console.log('DELETED');
        });



    }

    finally {
        // client.close();
    }
};

run().catch(console.dir);

app.get('/', (req, res) => {
    res.send('Smart Shop POS server is running ...');
});

app.listen(port, (req, res) => {
    console.log('Smart Shop POS server is listning at port', port);
});