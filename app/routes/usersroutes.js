/**
 * Created by tonim on 14/10/2016.
 */
var express = require('express');
var router = express.Router();
var passport = require('passport');
var User = require('../models/modeluser');
var Adventures = require('../models/modeladventures');
var LocalStrategy = require('passport-local').Strategy;
var TwitterStrategy = require('passport-twitter').Strategy;
var FacebookStrategy = require('passport-facebook').Strategy;
var config = require('./auth');
var multer = require('multer');
var upload = multer({dest: __dirname+'/../uploads'});
var cloudinary  = require('cloudinary');
var uuid = require('node-uuid');
cloudinary.config({
    cloud_name: config.cloudinary.cloud_name,
    api_key: config.cloudinary.api_key,
    api_secret: config.cloudinary.api_secret
});


router.post('/signup', function(req, res) {
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var description = 'Soy nuevo en Geofinder';
    var photo = 'http://i66.tinypic.com/2yopwmr.jpg';
    var referalid = uuid.v1();
    var friendid = req.body.friendid;

    // Validation
    req.checkBody('name', 'Name is required').notEmpty();
    req.checkBody('email', 'Email is required').notEmpty();
    req.checkBody('username', 'Username is required').notEmpty();
    req.checkBody('password', 'Password is required').notEmpty();

    var errors = req.validationErrors();

    if(errors){
       console.log('faltan campos');
        res.status(400).send('Faltan campos por rellenar');
    } else {
        var newUser = new User({
            name: name,
            email: email,
            username: username,
            password: password,
            description: description,
            photo: photo,
            referalid: referalid
        });

    var query = {username: username};
    User.findOne(query, function(err, existingUser) {
         if (existingUser) {
         res.status(400).send('Este nombre de usuario ya existe prueba con otro :)')
         }
         else{
             var queryid = {referalid: friendid};
             console.log('refid', friendid);
             var update = {$inc : {"score": 10}};
             if (friendid != null || friendid != " ") {
                 console.log('if dentro');
                 User.findOne(queryid, function(err, existingid) {
                     if (existingid) {
                         console.log('existingid', existingid)
                         User.update(queryid, update, function (err, user) {
                             if (err) {
                                 console.log('show err', err);
                                 res.status(400).send('Some wrong')
                             }
                             if (user) {
                                 console.log('amihooooasodsaodoasodosad', user);
                                 User.createUser(newUser, function (err, user) {
                                     if (err) throw err;
                                     console.log(user);
                                     res.send(user);
                                 });
                             }
                         });
                     }
                     else{
                         console.log('estoy en el else del existingid')
                         res.status(400).send('Este Id no exsiste prueba con otro')
                     }
                 });
             }
             else{
                 console.log('else undefined');
                 User.createUser(newUser, function (err, user) {
                     if (err) throw err;
                     console.log(user);
                     res.send(user);
                 });
             }
    }
    });
}
});

//Local Strategy
passport.use(new LocalStrategy(
    function(username, password, done) {
        console.log('Estoy aqui' + username + password);
        User.getUserByUsername(username, function(err, user){
            console.log('este el usuario encontrado' + user);
            if(err) throw err;
            if(!user){
                console.log('No encontrado');
                return done(null, false, {message: 'Unknown User'});
            }

            User.comparePassword(password, user.password, function(err, isMatch){
                console.log('he comparado el password');
                console.log('match= ' + isMatch);
                console.log('error= ' + err);
                if(err) throw err;
                if(isMatch){
                    console.log('ok' + user);
                    return done(null, user);
                } else {
                    console.log('contranseña incorrecta');
                    return done(null, false, {message: 'Invalid password'});
                }
            });
        });
    }));

//Twitter strategy
passport.use(new TwitterStrategy({
    consumerKey		 : config.twitter.key,
    consumerSecret	: config.twitter.secret,
    callbackURL		 : config.twitter.callback
}, function(accessToken, refreshToken, profile, done) {

    User.findOne({provider_id: profile.id}, function(err, user) {
        if(err) throw(err);

        if(!err && user!= null) return done(null, user);


        var usertweet = new User({
            provider_id	: profile.id,
            name				: profile.displayName,
            photo				: profile.photos[0].value,
            username            : profile.id,
            description         : 'Soy nuevo en Geofinder',
            referalid           : uuid.v1()
        });

        usertweet.save(function(err) {
            if(err) throw err;
            done(null, user);
        });
    });
}));

//Facebook strategy
passport.use(new FacebookStrategy({
    clientID			: config.facebook.key,
    clientSecret	: config.facebook.secret,
    callbackURL	 : config.facebook.callback,
    profileFields : ['id', 'displayName', 'photos']
}, function(accessToken, refreshToken, profile, done) {
    User.findOne({provider_id: profile.id}, function(err, user) {
        if(err) throw(err);
        if(!err && user!= null) return done(null, user);

        // Al igual que antes, si el usuario ya existe lo devuelve
        // y si no, lo crea y salva en la base de datos
        var userface = new User({
            provider_id	: profile.id,
            name				 : profile.displayName,
            photo				: profile.photos[0].value,
            username            :profile.id,
            description         : 'Soy nuevo en Geofinder',
            referalid           : uuid.v1()
        });
        userface.save(function(err) {
            if(err) throw err;
            done(null, user);
        });
    });
}));


passport.serializeUser(function(user, done) {
    console.log('serializedID abans ' + user.id);
    done(null, user.id);
    console.log('serializedID ' + user.id);

});

passport.deserializeUser(function(id, done) {
    console.log('hola deserialize');
    User.findById(id, function(err, user) {
        console.log('Deserialized User' + user);
        if(!err) done(err, user);
        else done(err, null);

    });
});

router.post('/login',
    passport.authenticate('local'),
    function(req, res) {
        console.log('hi my friend');
        res.send(req.user);
    });

router.get('/logout', function(req, res){
    req.logout();
    console.log('he hecho logout');
    res.redirect('/#/index');

});

//GEt user by ID
router.get('/my/:user_id', function(req, res){
    //La variable pathdeepPopulate se utiliza para no repetir los paths en cada pathdeepPopulate
    //La variable se guarda en la Adventure Zone
    User.findById(req.params.user_id).deepPopulate(pathdeepPopulate).populate(['following','followers']).exec().then(function(err, user){
        if(err)
            res.send(err)
        if(user)
            res.send(user);
    });
});

//Modify the name of a user
router.put('/update/name/:user_id', function(req, res) {
    User.update({_id : req.params.user_id
        },{$set:{name: req.body.name
        }},
        function(err, user) {
            if (err)
                res.send(err);

            User.findById(req.params.user_id, function(err, user) {
                if(err)
                    res.send(err)
                if(user)
                    console.log("hola usuariooooo");
                    console.log(user);
                    res.send(user);
            });
        });
});

//Modify the description of a user
router.put('/update/description/:user_id', function(req, res) {
    User.update({_id : req.params.user_id
        },{$set:{description: req.body.description
        }},
        function(err, user) {
            if (err)
                res.send(err);

            User.findById(req.params.user_id, function(err, user) {
                if(err)
                    res.send(err)
                res.send(user);
            });
        });
});

//Modify the photo of a user
router.put('/update/photo/:user_id', function(req, res) {
    User.update({_id : req.params.user_id
        },{$set:{photo: req.body.photo
        }},
        function(err, user) {
            if (err)
                res.send(err);

            User.findById(req.params.user_id, function(err, user) {
                if(err)
                    res.send(err)
                res.send(user);
            });
        });
});

//Modify the photo of a user
router.post('/update/image/:user_id', upload.single('myFile'), function(req, res) {
    cloudinary.uploader.upload(req.file.path, function(result) {
        console.log(result);
        User.update({_id : req.params.user_id
            },{$set:{photo: result.url
            }},
            function(err, user) {
                if (err)
                    res.send(err);

                User.findById(req.params.user_id, function(err, user) {
                    if(err)
                        res.send(err)
                    res.redirect('/#/profile');
                });
            });
    });
});


//Modify the username of a user
router.put('/update/username/:user_id', function(req, res) {
    var query = {username: req.body.username};
    User.findOne(query, function(err, existingUser) {
        if (existingUser) {
            res.status(400).send('Este usuario ya existe prueba con otro :)')
        }
        else {
            console.log('Estoy en User diferente');
            User.update({
                    _id: req.params.user_id
                }, {
                    $set: {
                        username: req.body.username
                    }
                },
                function (err, user) {
                    if (err)
                        res.send(err);
                    User.findById(req.params.user_id, function (err, user) {
                        if (err)
                            res.send(err)
                        res.send(user);
                    });
                });
        }
    });
});


//Modify the user password
router.put('/update/password/:user_id', function(req, res) {
    var newpassword = req.body.password;
    User.hashPassword(newpassword, function (err, password) {
        if(password) {
            User.update({
                    _id: req.params.user_id
                }, {
                    $set: {
                        password: password
                    }
                },
                function (err, user) {
                    if (err)
                        res.send(err);
                    User.findById(req.params.user_id, function (err, user) {
                        if (err)
                            res.send(err)
                        res.send(user);
                    });
                });
        }
        else{
            res.status(400).send('Error en el password');
        }
    });
});

//Modify the emailof a user
router.put('/update/email/:user_id', function(req, res) {
    User.update({_id : req.params.user_id
        },{$set:{email: req.body.email
        }},
        function(err, user) {
            if (err)
                res.send(err);
            User.findById(req.params.user_id, function(err, user) {
                if(err)
                    res.send(err)
                res.send(user);
            });
        });
});

router.get('/twitter', passport.authenticate('twitter'));

router.get('/facebook', passport.authenticate('facebook'));

router.get('/twitter/callback', passport.authenticate('twitter',
    { successRedirect: '/#/index', failureRedirect: '/#/login' }
    ));

router.get('/facebook/callback', passport.authenticate('facebook',
    { successRedirect: '/#/index', failureRedirect: '/#/login' }
));

// route middleware to make sure a user is logged in
function isLoggedIn(req, res, next) {

    // if user is authenticated in the session, carry on
    if (req.isAuthenticated())
        return next();

    // if they aren't redirect them to the home page
    res.status(400).send('The user is not logged');
}

//route for get the seesion id in the front
router.get('/sessionid', isLoggedIn, function(req, res) {
    console.log('entro en el get de sesion id');
    console.log('profile:' + req.user);
    res.send(req.user);
});

//Get all users
router.get('/', function(req, res) {

    User.find(function (err, user) {
        if (err)
            res.send(err);
        if(user)
            res.json(user);
 
    });

});

/**
 *
 * Followers Zone
 *
 */

//Follow a user
router.post('/follow/:user_id', function(req, res) {
    //The id recived in the uri is the id of the user public profile and the id recived in the req is the id of the user logged in
    //Here we save the user wich i follow in the mongo database using the season id of the user logged in
    var query = {_id: req.body._id};
    var update = {$addToSet : {"following" : req.params.user_id}};
    var options = {};
    User.findOneAndUpdate(query, update, options, function(err, user) {
        if (err) {
            res.send(err);
        }
        if(user){
            //Then if this works we add these id to the other user making a simple relationship
            var query2 = {_id: req.params.user_id};
            var update2 = {$addToSet : {"followers" : req.body._id}};
            User.findOneAndUpdate(query2, update2, options, function(err, user) {
                if (err) {
                    res.send(err);
                }
                if(user){
                    User.find({_id: req.body._id}).populate('following').exec().then(function (err, user) {
                        if(err)
                            res.send(err)
                        res.send(user);
                    });
                }
            });
        }
    });
});

//Function to know if a user is following another one
router.get('/isfollowing/:user_public/:user_logged',function (req, res) {
        if (req.params.user_logged == 'undefined'){
            res.send('notlogged');
        }
        else{
            var query = {_id: req.params.user_logged, following: req.params.user_public};
            User.findOne(query, function (err, userisfollowing) {
                console.log(err);
                console.log(userisfollowing);
                if (userisfollowing) {
                    res.send('true');
                }
                else {
                    res.send('false');
                }
            });
        }
});

//function to unfollow a user
router.delete('/unfollow/:user_public/:user_logged', function (req, res) {
    var query = {_id: req.params.user_logged};
    var update = {$pull : {"following" : req.params.user_public}};
    var options = {};
    User.findOneAndUpdate(query, update, options, function(err, user) {
        console.log(err);
        console.log(user);
        if (err) {
            res.status(400).send('Probelmas al dejar de seguir el usuario pruebe mas tarde')
        }
        if (user) {
            var query2 = {_id: req.params.user_public};
            var update2 = {$pull : {"followers" : req.params.user_logged}};
            User.findOneAndUpdate(query2, update2, options, function(err, user) {
                console.log(err);
                console.log(user);
                if (err) {
                    res.status(400).send('Probelmas al dejar de seguir el usuario pruebe mas tarde');
                }
                if (user) {
                    User.findById(req.params.user_logged).populate('following').exec().then(function (err, user) {
                        if(err)
                            res.send(err)
                        res.send(user);
                    });
                }
            });

        }
    });
});

//Recomended adventures of your followers
router.get('/recomendedadv/:user_id', function(req, res){
    //La variable pathdeepPopulate se utiliza para no repetir los paths en cada pathdeepPopulate
    //La variable se guarda en la Adventure Zone
    User.findById(req.params.user_id).deepPopulate(['following.adventures.created']).exec().then(function(err, user){
        if(err){
            res.send(err)
        }
        if(user){
            console.log(user);
        res.send(user);
        }
    });
});
/**
 *
 * Adventures Zone
 *
 */

//La variable pathdeepPopulate se utiliza para no repetir los paths en cada pathdeepPopulate
var pathdeepPopulate = ['adventures.created', 'adventures.favs', 'adventures.played'];

// Assign Created Adventure <--> User
router.post('/acreatedadv/', function(req, res) {
    var query = {_id: req.body.user_id};
    var update = {$addToSet : {"adventures.created" : req.body.adventure_id}};
    var options = {};

    User.findOneAndUpdate(query, update, options, function(err, user) {
        if (err) {
            res.send(err);
        }
        console.log(user);
    });

    User.find({_id: req.body.user_id}).deepPopulate(pathdeepPopulate).exec().then(function (err, user) {
        if(err)
            res.send(err)
        res.send(user);
    });
});


// Unassign Created Adventure <--> User
router.delete('/uacreatedadv/', function (req, res) {

    var query = {_id: req.body.user_id};
    var update = {$pull : {"adventures.created" : req.body.adventure_id}};
    var options = {};

    User.findOneAndUpdate(query, update, options, function(err, user) {
        if (err) {
            res.send(err)
        }
        res.send("Unassigned:" + req.body.adventure_id);
    });
});

// Assign Fav Adventure <--> User
router.post('/afavadv/:adv_id', function(req, res) {
    console.log(req.body._id);
    console.log(req.params.adv_id);
    var query = {_id: req.body._id};
    var update = {$addToSet : {"adventures.favs" : req.params.adv_id}};
    var options = {};

    User.findOneAndUpdate(query, update, options, function(err, user) {
        if (err) {
            res.send(err);
        }
        if(user){
            var query = {_id: req.params.adv_id};
            var update = {$inc : {"favs": 1}};
            Adventures.findOneAndUpdate(query, update, options, function(err, adv) {
                if (err) {
                    res.send(err);
                }
                if(adv){
                    Adventures.findById(adv._id).deepPopulate(['adventures.comments', 'comments.user']).exec().then(function (err, adventure) {
                        if(err)
                            res.send(err)
                        if(adventure)
                        res.send(adventure);
                    });
                }
            });
        }
    });
});

// Unassign Fav Adventure <--> User
router.delete('/uafavadv/:adv_id/:user_id', function (req, res) {
    var query = {_id: req.params.user_id};
    var update = {$pull : {"adventures.favs" : req.params.adv_id}};
    var options = {};

    User.findOneAndUpdate(query, update, options, function(err, user) {
        if (err) {
            res.send(err);
        }
        if(user){
            var query = {_id: req.params.adv_id};
            var update = {$inc : {"favs": -1}};
            Adventures.findOneAndUpdate(query, update, options, function(err, adv) {
                if (err) {
                    res.send(err);
                }
                if(adv){
                    console.log('Hola he pasado el segundo update');
                    Adventures.findById(adv._id).deepPopulate(['adventures.comments', 'comments.user']).exec().then(function (err, adventure) {
                        if(err)
                            res.send(err)
                        if(adventure)
                            res.send(adventure);
                    });
                }
            });
        }
    });
});

//Is a fav adventure right now?
router.get('/isadvfav/:adv_id/:user_id', function (req, res) {
    if (req.params.user_id == 'undefined'){
        res.send('notlogged');
    }
    else{
        var query = {_id: req.params.user_id, "adventures.favs": req.params.adv_id};
        User.findOne(query, function (err, userisfollowing) {
            console.log(err);
            console.log(userisfollowing);
            if (userisfollowing) {
                res.send('true');
            }
            else {
                res.send('false');
            }
        });
    }
});


// Assign Played Adventure <--> User
router.post('/aplayedadv/', function(req, res) {
    var query = {_id: req.body.user_id};
    var update = {$addToSet : {"adventures.played" : req.body.adventure_id}};
    var options = {};

    User.findOneAndUpdate(query, update, options, function(err, user) {
        if (err) {
            res.send(err);
        }
        console.log(user);
    });

    User.find({_id: req.body.user_id}).deepPopulate(pathdeepPopulate).exec().then(function (err, user) {
        if(err)
            res.send(err)
        res.send(user);
    });
});

// Unassign Played Adventure <--> User
router.delete('/uaplayedadv/', function (req, res) {

    var query = {_id: req.body.user_id};
    var update = {$pull : {"adventures.played" : req.body.adventure_id}};
    var options = {};

    User.findOneAndUpdate(query, update, options, function(err, user) {
        if (err) {
            res.send(err)
        }
        res.send("Unplayed:" + req.body.adventure_id);

    });
});

module.exports = router;



