const mongoose = require('mongoose');

mongoose.connect("mongodb+srv://yousseflaribi2004:ehgihXNLFjOLDPCx@cluster0.uq2hrtp.mongodb.net/?retryWrites=true&w=majority&appName=SMATCH")
    .then( 
        ()=>{console.log('Connected to MongoDB Atlas');}
    )
    .catch( (err) => console.error('Could not connect to MongoDB Atlas', err));




module.exports = mongoose;