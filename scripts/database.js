const MongoClient = require('mongodb').MongoClient;
const assert = require('assert');

// Connection URL
const url = MONGODB_URL;

// Database Name
const dbName = 'database';

// Create a new MongoClient
const client = new MongoClient(url);

// Use connect method to connect to the Server
client.connect(function(err) {
  assert.equal(null, err);
  console.log("Connected successfully to server");

  const db = client.db(dbName);

  client.close();
});

/*
const mongoose = require("mongoose")

const { MONGODB_URL } = process.env

exports.connect = () => {
    console.log(typeof MONGODB_URL);
    mongoose.connect(MONGODB_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true
    })
    .then(
        console.log('DB connected successfully')
    )
    .catch((error) => {
        console.log('DB connection FAILED');
        console.log(error);
        process.exit(1)
    })
}

//connect the client to the server
await client.connect();

const database = client.db('RetrieverRoutes');
//const movies = database.collection('movies');
const buildings = database.collection('Buildings');
const Food = database.collection('Food');
const parkingLots = database.collection('ParkingLots');
const resources = database.collection('ResourcesOffices');
*/