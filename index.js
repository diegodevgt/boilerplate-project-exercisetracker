const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

console.log(process.env.MONGO_URI);

// Basic Configuration
const port = process.env.PORT || 3000;

//BodyParser
app.use(bodyParser.urlencoded({ extended: false }));
 
//DB connect
mongoose.connect(process.env.MONGO_URI, { useNewUrlParser: true, useUnifiedTopology: true });
 
const { Schema } = mongoose;
 
//User Schema
const userSchema = new Schema({
    username: { type: String, required: true },
});
const User = mongoose.model("User", userSchema);
 
//Exercise Schema
const exerciseSchema = new Schema({
    userId: Schema.Types.ObjectId,
    description: { type: String, required: true },
    duration: { type: Number, required: true },
    date: { type: Date, default: Date.now }
});
const Exercise = mongoose.model("Exercise", exerciseSchema);
 
 
//POST user to DB
app.post("/api/users", (req, res) => {
 
    let user = new User({ username: req.body.username });
 
    user.save((err, data) => {
        //console.log("created User: " + data);
        if (err) return console.error(err);
        res.json({ username: data.username, _id: data._id });
    });
 
});
 
 
//GET all users from DB
app.get("/api/users", (req, res) => {
    User.find((err, usersFound) => {
        if (err) return console.error(err);
        //console.error("users found: " + usersFound);
        res.json(usersFound);
    })
});
 
 
//POST exercise form data
app.post("/api/add", (req, res) => {
 
    let exercise = new Exercise({
        userId: req.body.userId,
        description: req.body.description,
        duration: req.body.duration,
        date: req.body.date ? req.body.date : Date.now()
    });
 
    exercise.save((err, data) => {
        //console.log("created exercise: " + data);
        if (err) return console.error(err);
        User.findById(exercise.userId, (err, userFound) => {
            if (err) return console.error(err);
            //console.log("userFound " + userFound.username); 
            res.json({
                _id: data.userId,
                username: userFound.username,
                date: data.date.toDateString(),
                duration: data.duration,
                description: data.description
            });
        });
    });
});
 
 
//GET exercise log
app.get("/api/log", (req, res) => {
    console.log(req.query.userId);
    console.log(req.query.from);
    console.log(req.query.to);
    console.log(req.query.limit);
 
    let userId = req.query.userId;
    let limit = Number(req.query.limit);
 
    //create query filter
    let filter = {};
    filter.userId = userId;
 
    if (req.query.from && req.query.to) {
        let fromDate = new Date(req.query.from);
        let toDate = new Date(req.query.to);
        filter.date = { $gte: fromDate, $lte: toDate };
    }
 
    console.log("Filter " + JSON.stringify(filter));
 
    const queryExercises = (done) => {
        Exercise.find(filter)
            .limit(limit)
            .exec((err, exercices) => {
                if (err) return console.error(err);
                done(exercices);
            })
    };
 
    const paseExercises = (exercices) => {
        let logArray = [];
 
        for (let i = 0; i < exercices.length; i++) {
            var obj = exercices[i];
            logArray.push({
                description: obj.description,
                duration: obj.duration,
                date: obj.date.toDateString()
            });
        }
        console.log(logArray);
 
        User.findById(userId, (err, userFound) => {
            if (err) return console.error(err);
            let logger = {
                _id: userId,
                username: userFound.username,
                count: logArray.length,
                log: logArray
            };
            res.json(logger);
        });
    }
 
    //Execute Query
    queryExercises(paseExercises);
 
});

app.listen(port, function() {
  console.log(`Listening on port ${port}`);
});