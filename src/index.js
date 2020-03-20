const express = require("express");
const app = express();
const cors = require("cors");
const bodyParser = require("body-parser");
const mongodb = require("mongodb");
const jwt = require("jsonwebtoken");
const ObjectID = mongodb.ObjectID;
const mongoClient = mongodb.MongoClient;
const url =
  "mongodb://localhost:27017";
const bcrypt = require("bcrypt");
const saltRounds = 10;

app.use(cors());
app.use(bodyParser.json());
app.listen(8080, function() {
  console.log("Server is running");
});

let incomid = null;

function authenticate(req, res, next) {
  var incomingToken = req.header("Authorization");
  jwt.verify(incomingToken, "jdjfhdjfhdksffjdshgfdjshfa", function(
    err,
    decoded
  ) {
    if (decoded !== undefined) {
      incomid = decoded.userId;
      next();
    } else {
      res.status(401).json({
        message: "Not authenticate"
      });
    }
  });
}

app.get("/feed", authenticate, function(req, res) {
  mongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var db = client.db("socialDB");
    var result = db
      .collection("users")
      .findOne(
        { _id: ObjectID(incomid) },
        { projection: { _id: false, feed: true } }
      );
    result.then(function(data) {
      if (data !== null) {
        res.status(200).json({
          feed: data
        });
        db.close();
      }
    });
  });
});

app.post("/register", function(req, res) {
  mongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var db = client.db("socialDB");
    bcrypt.genSalt(saltRounds, function(err, salt) {
      bcrypt.hash(req.body.password, salt, function(err, hashResult) {
        db.collection("users").insertOne(
          { email: req.body.email, password: hashResult, feed: req.body.email + "feed" },
          function(err, data) {
            if (err) throw err;
            res.status(200).send("success");
            client.close();
          }
        );
      });
    });
  });
});

app.post("/login", function(req, res) {
  mongoClient.connect(url, function(err, client) {
    if (err) throw err;
    var db = client.db("socialDB");
    var result = db.collection("users").findOne({ email: req.body.email });
    result.then(function(userData) {
      if (userData !== null) {
        bcrypt.compare(req.body.password, userData.password, function(
          err,
          hashResult
        ) {
          if (hashResult == true) {
            const userId = userData._id;
            jwt.sign(
              {
                exp: Math.floor(Date.now() / 1000) + 60 * 60,
                date: "foobar",
                userId
              },
              "jdjfhdjfhdksffjdshgfdjshfa",
              function(err, token) {
                if (err) throw err;
                res.json({
                  message: "success",
                  token: token
                });
              }
            );
          } else {
            res.status(402).json({
              message: "wrong password"
            });
          }
        });
        db.close();
      } else {
        res.json({
          message: "No email id"
        });
      }
    });
  });
});
