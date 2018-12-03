var express = require('express');
var app = express();
var session = require('cookie-session');
var bodyParser = require('body-parser');
var MongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var formidable = require('formidable');
var fs = require('fs');
var mongo = require('mongodb');
var mongourl = 'mongodb://user123:user123@ds243501.mlab.com:43501/s11660947';
var SECRETKEY1 = 'I want to pass COMPS381F';
var SECRETKEY2 = 'Keep this to yourself';
var url  = require('url');

app.set('view engine', 'ejs');
app.listen(app.listen(process.env.PORT || 8099));
// RESTFUL

// Middleware__〆(￣ー￣ )
app.use(session({
  name: 'session',
  keys: [SECRETKEY1, SECRETKEY2],
}));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

app.get('/api/restaurant/read/:key/:value', function (req, res) {
  var key = req.params.key;
  if (key == "name" || key == "borough" || key == "cuisine") {
    var str = '{"' + key + '":"' + req.params.value + '"}';
    var criteria = JSON.parse(str);
    MongoClient.connect(mongourl, function (err, db) {
      try {
        assert.equal(err, null);
      } catch (err) {
        res.status(500);
        res.render("error",{message : "MongoClient connect() failed!"});
      }
      findDocument(db, criteria, "restaurant2", function (result) {
        db.close();
        res.status(200).json(result).end();


      });
    });
  } else {
    res.status(404).end("Error");
  }
});

app.post('/api/restaurant/create', function (req, res) {
  var new_r = req.body;
  console.log(new_r);
  var msg = {};
  MongoClient.connect(mongourl, function (err, db) {
    try {
      assert.equal(err, null);
    } catch (err) {
      res.status(500);
      res.render("error",{message : "MongoClient connect() failed!"});
    }
    if (new_r.hasOwnProperty("name") && new_r.hasOwnProperty("owner")) {
      if(new_r['address']==null){
        new_r['address'] = {
          street: "",
          building: "",
          zipcode: "",
          coord: ["", ""]
        };
      }
      if(new_r['grades']==null){
        new_r['grades'] = [];
      }

      insertDocument(db, new_r, "restaurant2", function (result) {
        db.close();

        if (result) {
          msg.status = "ok";
          msg._id = result.ops[0]._id;
        } else {
          msg.status = "failed";
        }
        console.log(msg);
        res.status(200).json(msg).end();
        //res.redirect('/');
      });
    } else {
      msg.status = "failed";
      console.log(msg);
      res.status(200).json(msg).end();

    }
  });
}
);


app.use(function(req,res,next) {
  var url_parts = url.parse(req.url);
  console.log(url_parts.pathname);
  if(req.session.userid==null && url_parts.pathname != "/login" && url_parts.pathname != "/register"){
    res.redirect('/login');
  }else{
    next();
  }
  });


// ヽ(・∀・)ﾉ url handling ヽ(・∀・)ﾉ

app.get('/', function (req, res) {
  if (req.session.userid != null) {
    res.render('home', { userid: req.session.userid });
  } else {
    res.redirect('/login');
  }
});

app.get('/register', function (req, res) {
  res.render('register', {});
});

app.post('/register', function (req, res) {
  MongoClient.connect(mongourl, function (err, db) {
    try {
      assert.equal(err, null);
    } catch (err) {
      res.status(500);
      res.render("error",{message : "MongoClient connect() failed!"});
    }
    var new_r = {};
    new_r['userid'] = req.body.userid;
    new_r['password'] = req.body.password;
    console.log(new_r); // testing123
    insertDocument(db, new_r, "user", function (result) {
      db.close();
      req.session.userid = req.body.userid;
      res.redirect('/');
    });
  });
});

app.get('/login', function (req, res) {
  res.render('login', {});
});

app.post('/login', function (req, res) {
  MongoClient.connect(mongourl, function (err, db) {
    try {
      assert.equal(err, null);
    } catch (err) {
      res.status(500);
      res.render("error",{message : "MongoClient connect() failed!"});
    }
    var new_r = {};
    new_r['userid'] = req.body.userid;
    new_r['password'] = req.body.password;
    console.log(new_r); // testing123
    findDocument(db, new_r, "user", function (result) {
      if (result.length == 0) {
        res.status(500);
        res.render("error",{message : "UserID / password not found!"});
      } else {
        db.close();
        req.session.userid = req.body.userid;
        res.redirect('/');
      }
    });
  });
});


app.get('/logout', function (req, res , next) {
  req.session = null;
  res.redirect('/');
});

app.get('/createRestaurant', function (req, res, next) {
  res.render('createRestaurant', {});
});

app.post('/createRestaurant', function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    console.log(JSON.stringify(files));
    var filename = files.photo.path;
    if (files.photo.type) {
      var mimetype = files.photo.type;
    }
    fs.readFile(filename, function (err, data) {
      MongoClient.connect(mongourl, function (err, db) {
        try {
          assert.equal(err, null);
        } catch (err) {
          res.status(500);
          res.render("error",{message : "MongoClient connect() failed!"});
        }
        var new_r = {};
        new_r['restaurant_id'] = fields.restaurant_id;
        new_r['name'] = fields.name;
        new_r['borough'] = fields.borough;
        new_r['cuisine'] = fields.cuisine;
        if (data) {
          new_r['photo'] = new Buffer(data).toString('base64');
          new_r['mimetype'] = mimetype;
        }
        new_r['address'] = {
          street: fields.street,
          building: fields.building,
          zipcode: fields.zipcode,
          coord: [fields.x, fields.y]
        };
        new_r['grades'] = [];
        new_r['owner'] = req.session.userid;

        console.log(new_r); // testing123
        insertDocument(db, new_r, "restaurant2", function (result) {
          db.close();
          //req.session.userid = fields.userid;
          res.redirect('/');
        });
      });
    });
  });

});

app.get('/updateRestaurant', function (req, res, next) {
  MongoClient.connect(mongourl, function (err, db) {
    try {
      assert.equal(err, null);
    } catch (err) {
      res.status(500);
      res.render("error",{message : "MongoClient connect() failed!"});
    }
    var o_id = new mongo.ObjectID(req.query._id);
    var query = { _id: o_id };
    findDocument(db, query, "restaurant2", function (result) {
      db.close();
      console.log(result);
      res.render('updateRestaurant', { result: result[0] });
    });
  });

})

app.post('/updateRestaurant', function (req, res, next) {
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if (req.session.userid === fields.owner) {
      //console.log(JSON.stringify(files));
      var filename = files.photo.path;
      if (files.photo.type) {
        var mimetype = files.photo.type;
      }
      fs.readFile(filename, function (err, data) {
        MongoClient.connect(mongourl, function (err, db) {
          try {
            assert.equal(err, null);
          } catch (err) {
            res.status(500);
            res.render("error",{message : "MongoClient connect() failed!"});
          }
          var new_r = {};
          new_r['restaurant_id'] = fields.restaurant_id;
          new_r['name'] = fields.name;
          new_r['borough'] = fields.borough;
          new_r['cuisine'] = fields.cuisine;
          console.log(data);
          if (data.length > 0) {
            console.log("true");
            new_r['photo'] = new Buffer(data).toString('base64');
            new_r['mimetype'] = mimetype;
          }
          new_r['address'] = {
            street: fields.street,
            building: fields.building,
            zipcode: fields.zipcode,
            coord: [fields.x, fields.y]
          };
          //new_r['grade'] = [];                

          var o_id = new mongo.ObjectID(fields._id);
          var query = { _id: o_id };
          updateDocument(db, query, new_r, "restaurant2", function (result) {
            db.close();
            res.redirect('/');
          });
        });
      });
    } else {
      console.log("NOT OWNER");
      res.status(500);
      res.render("error",{message : "Not owner of the restaurant"});
    }
  });
});

app.get('/display', function (req, res, next) {
  MongoClient.connect(mongourl, function (err, db) {
    try {
      assert.equal(err, null);
    } catch (err) {
      res.status(500);
      res.render("error",{message : "MongoClient connect() failed!"});
    }

    findDocument(db, {}, "restaurant2", function (result) {
      db.close();
      res.render('display', { result: result });
    });
  });
});

app.get('/showDetails', function (req, res, next) {
  MongoClient.connect(mongourl, function (err, db) {
    try {
      assert.equal(err, null);
    } catch (err) {
      res.status(500);
      res.render("error",{message : "MongoClient connect() failed!"});
    }
    var o_id = new mongo.ObjectID(req.query._id);
    findDocument(db, { _id: o_id }, "restaurant2", function (result) {
      db.close();
      console.log(result);

      if(result[0].mimetype!=null && result[0].mimetype.indexOf("image") == -1 ){
        result[0].photo = null;
      }
      res.render('showDetails', { result: result[0], userid: req.session.userid });
    });
  });
});

app.get('/map', function (req, res, next) {
  res.render("gmap.ejs", {
    lat: req.query.x,
    lon: req.query.y,
    zoom: 15
  });
  res.end();
});

app.get('/delete', function (req, res, next) {
  if (req.query._id != null) {
    var o_id = new mongo.ObjectID(req.query._id);
    var criteria = { _id: o_id };
  } else {
    res.status(500);
    res.render("error",{message : "_id is null"});
    return;
  }
  if (req.session.userid == null)
    res.redirect("/login");
  else {
    MongoClient.connect(mongourl, function (err, db) {
      try {
        assert.equal(err, null);
      } catch (err) {
        res.status(500);
        res.render("error",{message : "MongoClient connect() failed!"});
      }
      findDocument(db, criteria, "restaurant2", function (result) {

        temp = result;
        if (req.session.userid != temp[0].owner) {
          console.log(req.session.userid);
          console.log(temp[0].owner);
          console.log(temp);
          res.status(500);
          res.render("error",{message : "Cannot delete restaurant of other owners"});
        }
        else {
          deleteRestaurant(db, criteria, "restaurant2", function (result) {
            console.log(criteria);

            res.render('delete', {});
            console.log("Criteria :" + JSON.stringify(criteria) + " was deleted");
          });

        }
        db.close();
      });

    });
  }
});




app.get('/search', function (req, res, next) {
  var criteria = {};
  for (key in req.query) {
    if (req.query[key] != '')
      criteria[key] = req.query[key];
  }
  var temp = JSON.stringify(criteria);
  if (temp == "{}")
    res.render("search.ejs", {});
  else {

    //console.log(JSON.stringify(criteria));
    MongoClient.connect(mongourl, function (err, db) {
      try {
        assert.equal(err, null);
      } catch (err) {
        res.status(500);
        res.render("error",{message : "MongoClient connect() failed!"});
      }
      
      findDocument(db, criteria, "restaurant2", function (result) {
        db.close();
        res.render('display', { result: result });
      });
    });
  }
});

app.get('/rateRestaurant', function (req, res, next) {
  if (req.query._id == null) {
    res.status(500);
    res.render("error",{message : "_id is null"});
    return;
  }else if(req.query._id.length!=24){
    res.status(500);
    res.render("error",{message : "_id is invalid"});
  }
  if (req.session.userid != null) {
    var o_id = new mongo.ObjectID(req.query._id);
    console.log(req.query._id);
    res.render('rate', { _id: o_id });
  } else
    res.redirect('/login');
});

app.post('/rateRestaurant', function (req, res, next) {
  var score = Number(req.body.score);
  var o_id = new mongo.ObjectID(req.body._id);
  var query = { _id: o_id };
  // var temp={};
  if (score < 1 || score > 10 || isNaN(score)) {
    res.status(500);
    res.render("error",{message : "Score should be 1-10"});
  } else {

    MongoClient.connect(mongourl, function (err, db) {
      try {
        assert.equal(err, null);
      } catch (err) {
        res.status(500);
        res.render("error",{message : "MongoClient connect() failed!"});
      }
      findDocument(db, query, "restaurant2", function (result) {
        if(result.length==0){
          res.status(500);
          res.render("error",{message : "No such _id"});
        }
        for (x in result[0].grades) {
          console.log(result[0].grades[x].user);
          if (result[0].grades[x].user == req.session.userid) {
            db.close();
            res.status(500);
            res.render("error",{message : "You have rated this restaurant"});
            return;
          }
        }
        var new_r = {};
        new_r['user'] = req.session.userid;
        new_r['score'] = req.body.score;
        console.log(new_r); // testing123
        console.log(query);
        pushDocument(db, query, new_r, "restaurant2", function (result) {
          db.close();
          res.redirect('/');
        });
      });
    });
  }
});



// (ಠ o ಠ)¤=[]:::::> function list

function insertDocument(db, r, collection, callback) {
  db.collection(collection).insertOne(r, function (err, result) {
    assert.equal(err, null);
    console.log("insert was successful!");
    callback(result);
  });
}

function findDocument(db, r, collection, callback) {
  var cursor = db.collection(collection).find(r);
  var result = [];
  cursor.each(function (err, doc) {
    assert.equal(err, null);
    if (doc != null) {
      result.push(doc);
    } else {
      callback(result);
    }
  });
}


function updateDocument(db, query, r, collection, callback) {
  db.collection(collection).update(query, { $set: r }, function (err, result) {
    assert.equal(err, null);
    console.log("update was successful!");
    callback(result);
  });
}

function pushDocument(db, query, r, collection, callback) {
  db.collection(collection).update(query, { $push: { grades: r } }, function (err, result) {
    console.log(r);
    assert.equal(err, null);
    console.log("Rating was successful!");
    callback(result);
  });
}


function deleteRestaurant(db, criteria, collection, callback) {
  console.log(JSON.stringify(criteria) + " " + collection);
  db.collection(collection).deleteOne(criteria, function (err, result) {
    assert.equal(err, null);
    console.log("Delete was successfully");
    callback(result);
  });
}