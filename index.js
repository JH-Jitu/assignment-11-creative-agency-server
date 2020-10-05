const express = require('express')
const bodyParser = require('body-parser');
const cors = require('cors');
// const { ObjectId } = require('mongodb');
const app = express()
const port = 4200
require("dotenv").config();
const ObjectId = require('mongodb').ObjectId;


const MongoClient = require('mongodb').MongoClient;
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.hdbqd.mongodb.net/${process.env.DB_USER}?retryWrites=true&w=majority`;
app.use(bodyParser.json());
app.use(cors());
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true });
client.connect(err => {
    const productsCollection = client.db("assignment10").collection("events");
    const userEventCollection = client.db("assignment10").collection("userEvents");
    const ordersCollection = client.db("emaJohnStore").collection("order");

    // Uploading Events
    app.post("/addEvent", (req, res) => {
        const products = req.body;
        productsCollection.insertOne(products)
            .then(result => {
                res.send(result.insertedCount);
            })
    })

    //   all Events
    app.get('/events', (req, res) => {
        productsCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    //   Adding User Events
    app.post("/addUserEvent", (req, res) => {
        const userEvent = req.body;
        userEventCollection.insertOne(userEvent)
            .then(result => {
                res.send(result.insertedCount);
            })
    })

    //   all User Events
    app.get('/userEventsAll', (req, res) => {
        userEventCollection.find({})
            .toArray((err, documents) => {
                res.send(documents);
            })
    })

    // Delete User Events
    app.delete("/delete/:id", (req, res) => {
        userEventCollection.deleteOne({ _id: ObjectId(req.params.id) })
            .then(result => {
                // console.log(result);
                res.send(result.deletedCount > 0)
            })
    })

    // Using firebase backend controller
    const admin = require('firebase-admin');
    var serviceAccount = require("./earn-2018-firebase-adminsdk-7kbrn-e239f4c90e.json");
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: process.env.FIRE_DB
    });

    //   // CRUD এর  READ method (R) //     //
    app.get("/userEvents", (req, res) => {
        const bearer = req.headers.authorization
        if (bearer && bearer.startsWith('Bearer ')) {

            const idToken = bearer.split(' ')[1];

            // idToken comes from the client app
            admin.auth().verifyIdToken(idToken)
                .then(function (decodedToken) {
                    const tokenEmail = decodedToken.email;
                    const queryEmail = req.query.email;
                    // let uid = decodedToken.uid;
                    // console.log({uid});

                    // // custom verification with email // //
                    if (tokenEmail == queryEmail) {
                        userEventCollection.find({ email: queryEmail })
                            .toArray((err, documents) => {
                                res.status(200).send(documents);
                            })
                    }
                    else {
                        res.status(401).send("Unauthorized access!!")
                    }
                }).catch(function (error) {
                    res.status(401).send("Unauthorized access!!")
                    // Handle error
                });
        }

        else {
            res.status(401).send("Unauthorized access!!")
        }
    })
});


app.get('/', (req, res) => {
    res.send('Hello World!')
})

app.listen(port)