const express = require('express');
const app = express();
const cors = require('cors');
const jwt = require('jsonwebtoken')
require('dotenv').config()
const stripe = require('stripe')(process.env.PAYMENT_SECRET_KEY)
const port = process.env.PORT || 5000;


// meddleware
app.use(cors());
app.use(express.json());





const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');
const uri = `mongodb+srv://${process.env.USER_DB}:${process.env.PASS_DB}@cluster0.tfb4xbn.mongodb.net/?retryWrites=true&w=majority`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
    serverApi: {
        version: ServerApiVersion.v1,
        strict: true,
        deprecationErrors: true,
    }
});

async function run() {
    try {
        // Connect the client to the server	(optional starting in v4.7)
        await client.connect();




        // Create payment inint
        app.post('/create-payment-intent', async (req, res) => {
            const { price } = req.body;
            const amount = parseInt(price * 100);
            const paymentIntent = await stripe.paymentIntents.create({
                amount: amount,
                currency: 'INR',
                payment_method_types: ['card']
            })
            res.send({
                clientSecret: paymentIntent.client_secret
            })
        })


        // Payment releted api
        app.post('/payments', async (req, res) => {
            const payment = req.body;
            const insertResult = await paymentCollection.insertOne(payment)

            const query = { _id: { $in: payment.cartItems.map(id => new ObjectId(id)) } }
            const deleteResult = await selectCollection.deleteMany(query)

            res.send({ insertResult, deleteResult })
        })



        // BD Collection

        const classCollection = client.db("play-u").collection("class");
        const usersCollection = client.db("play-u").collection("users");
        const homeClassCollection = client.db("play-u").collection("homeclass");
        const selectCollection = client.db("play-u").collection("select");
        const paymentCollection = client.db("play-u").collection("payment");




        app.post('/jwt', (req, res) => {
            const user = req.body;
            const token = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, { expiresIn: '1h' })

            res.send({ token })
        })

        const verifyAdmin = async (req, res, next) => {
            const email = req.decoded.email;
            const query = { email: email }
            const user = await usersCollection.findOne(query);
            if (user?.roal !== 'admin') {
                return res.status(403).send({ error: true, message: 'forbidden message' });
            }
            next();
        }





        // Users releted apis

        app.get('/users', async (req, res) => {
            const result = await usersCollection.find().toArray();
            res.send(result);
        })

        app.post('/users', async (req, res) => {
            const user = req.body;
            console.log(user)
            const query = { email: user.email }
            const existingUser = await usersCollection.findOne(query);
            console.log('ExistingUser', existingUser)

            if (existingUser) {
                return res.send({ message: 'User alerady exists' })
            }
            const result = await usersCollection.insertOne(user);
            res.send(result);
        })





        // Payment Histery

        app.get('/paymenthestery', async (req, res) => {
            try {
                console.log(req.query.email);
                let query = {};

                if (req.query?.email) {
                    query = { email: req.query.email };
                }

                const result = await paymentCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.log(error);
                res.status(500).send('Error retrieving data');
            }
        });





        // chatgpt
        app.get('/myclass', async (req, res) => {
            try {
                console.log(req.query.email);
                let query = {};

                if (req.query?.email) {
                    query = { email: req.query.email };
                }

                const result = await classCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.log(error);
                res.status(500).send('Error retrieving data');
            }
        });



        // home class 

        app.post('/homeclass', async (req, res) => {
            const postclass = req.body;
            console.log(postclass)

            const result = await homeClassCollection.insertOne(postclass);
            res.send(result);
        })




        app.get('/homeclass', async (req, res) => {
            const result = await homeClassCollection.find().toArray();
            res.send(result)
        })



        // ------ homeClass
        app.delete('/class/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await classCollection.deleteOne(query)
            res.send(result)
        })



        // ------ myclass
        app.delete('/myclass/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await classCollection.deleteOne(query)
            res.send(result)
        })

// -------------------------For after vercel deploy--------------------------------------------------
        app.delete('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const query = { _id: new ObjectId(id) }
            const result = await usersCollection.deleteOne(query)
            res.send(result)
        })

// ---------------------------------------------------------------------------




        app.get('/users/admin/:email', async (req, res) => {
            const email = req.params.email;


            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.roal === 'admin' }
            res.send(result);
        })


        app.get('/users/instructor/:email', async (req, res) => {
            const email = req.params.email;


            const query = { email: email }
            const user = await usersCollection.findOne(query);
            const result = { admin: user?.roal === 'instructor' }
            res.send(result);
        })






        app.get('/instructor/', async (req, res) => {
            const query = { roal: 'instructor' }; // Specify the query criteria
            const result = await usersCollection.find(query).toArray();
            res.send(result);
        });


        // User My class

        app.post('/usermyclass', async (req, res) => {
            const newItem = req.body;
            const result = await selectCollection.insertOne(newItem);
            res.send(result)
        })




        app.get('/usermyclass', async (req, res) => {
            try {
                console.log(req.query.email);
                let query = {};

                if (req.query?.email) {
                    query = { email: req.query.email };
                }

                const result = await selectCollection.find(query).toArray();
                res.send(result);
            } catch (error) {
                console.log(error);
                res.status(500).send('Error retrieving data');
            }
        });







        // Update user role to instructor
        app.patch('/users/instructor/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    roal: 'instructor'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        });




        // Update user role to instructor
        app.patch('/users/admin/:id', async (req, res) => {
            const id = req.params.id;
            const filter = { _id: new ObjectId(id) };
            const updateDoc = {
                $set: {
                    roal: 'admin'
                },
            };
            const result = await usersCollection.updateOne(filter, updateDoc);
            res.send(result);
        });






        // Class releted
        app.post('/class', async (req, res) => {
            const newItem = req.body;
            const result = await classCollection.insertOne(newItem);
            res.send(result)
        })

        app.get('/class', jwt.verify, async (req, res) => {
            const result = await classCollection.find().toArray();
            res.send(result);
        })




        // Send a ping to confirm a successful connection
        await client.db("admin").command({ ping: 1 });
        console.log("Pinged your deployment. You successfully connected to MongoDB!");
    } finally {
        // Ensures that the client will close when you finish/error
        // await client.close();
    }
}
run().catch(console.dir);












app.get('/', (req, res) => {
    res.send('Play-u Server is running');
})

app.listen(port, () => {
    console.log(`Play-u Server is running on port: ${port}`)
})