/**
 * Created by mbmarkus on 26/10/16.
 */
var mongoose = require('mongoose');

var adventures = new mongoose.Schema({
    name: String,
    description: String,
    difficulty: String,
    location:
    {
        type: { type: String },
        coordinates: []
    }
});

adventures.index({location: '2dsphere'});

module.exports = mongoose.model('Adventures', adventures);





