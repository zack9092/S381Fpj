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

app.set('view engine', 'ejs');
app.listen(app.listen(process.env.PORT || 8099));
// Middleware__〆(￣ー￣ )
app.use(session({
  name: 'session',
  keys: [SECRETKEY1,SECRETKEY2],
}));

app.use(bodyParser.urlencoded({ extended: false }));

app.use(bodyParser.json());

// ヽ(・∀・)ﾉ url handling ヽ(・∀・)ﾉ

app.get('/',function(req,res){
  if(req.session.userid!=null){
    res.render('home',{userid:req.session.userid});
  }else{
    res.redirect('/login');
  }
});

app.get('/register',function(req,res){
  res.render('register',{});
});

app.post('/register',function(req,res){
    MongoClient.connect(mongourl,function(err,db) {
        try {
          assert.equal(err,null);
        } catch (err) {
          res.set({"Content-Type":"text/plain"});
          res.status(500).end("MongoClient connect() failed!");
        }       
        var new_r = {};
        new_r['userid'] = req.body.userid;
        new_r['password'] = req.body.password;
        console.log(new_r); // testing123
        insertDocument(db,new_r,"user",function(result) {
            db.close();
            req.session.userid = req.body.userid;
            res.redirect('/');
          });
      });  
});

app.get('/login',function(req,res){
  res.render('login',{});
});

app.post('/login',function(req,res){
    MongoClient.connect(mongourl,function(err,db) {
        try {
          assert.equal(err,null);
        } catch (err) {
          res.set({"Content-Type":"text/plain"});
          res.status(500).end("MongoClient connect() failed!");
        }       
        var new_r = {};
        new_r['userid'] = req.body.userid;
        new_r['password'] = req.body.password;
        console.log(new_r); // testing123
        findDocument(db,new_r,"user",function(result) {
          if(result.length == 0){
            res.writeHead(500, {"Content-Type": "text/plain"});
            res.end('UserID / password not found!');
          }else{
            db.close();
            req.session.userid = req.body.userid;
            res.redirect('/');
          }
          });
      });  
});

app.get('/createRestaurant',function(req,res){
  res.render('createRestaurant',{});
});

app.post('/createRestaurant',function(req,res){
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    console.log(JSON.stringify(files));
    var filename = files.photo.path;
    if (files.photo.type) {
      var mimetype = files.photo.type;
    }
    fs.readFile(filename, function(err,data) {
    MongoClient.connect(mongourl,function(err,db) {
      try {
        assert.equal(err,null);
      } catch (err) {
        res.set({"Content-Type":"text/plain"});
        res.status(500).end("MongoClient connect() failed!");
     }   
    var new_r = {};    
    new_r['restaurant_id'] = fields.restaurant_id;
    new_r['name'] = fields.name;
    new_r['borough'] = fields.borough;
    new_r['cuisine'] = fields.cuisine;
    if(data){
      new_r['photo'] = new Buffer(data).toString('base64');
      new_r['mimetype'] = mimetype;
    }
    new_r['address'] = {street : fields.street,
                        building : fields.building,
                        zipcode : fields.zipcode,
                        coord : [fields.x,fields.y]
                      };
    new_r['grades'] = [];
    new_r['owner'] = req.session.userid;

    console.log(new_r); // testing123
    insertDocument(db,new_r,"restaurant2",function(result) {
        db.close();
        req.session.userid = fields.userid;
        res.redirect('/');
      });
  }); 
});
});

});

app.get('/updateRestaurant',function(req,res){
  MongoClient.connect(mongourl,function(err,db) {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.set({"Content-Type":"text/plain"});
      res.status(500).end("MongoClient connect() failed!");
    }
    var o_id = new mongo.ObjectID(req.query._id);         
    var query = {_id:o_id};
    findDocument(db,query,"restaurant2",function(result) {
        db.close();
        console.log(result);
        res.render('updateRestaurant',{result:result[0]});
      });
  }); 
  
})

app.post('/updateRestaurant',function(req,res){
  var form = new formidable.IncomingForm();
  form.parse(req, function (err, fields, files) {
    if(req.session.userid===fields.owner){
    //console.log(JSON.stringify(files));
    var filename = files.photo.path;
    if (files.photo.type) {
      var mimetype = files.photo.type;
    }
    fs.readFile(filename, function(err,data) {
    MongoClient.connect(mongourl,function(err,db) {
      try {
        assert.equal(err,null);
      } catch (err) {
        res.set({"Content-Type":"text/plain"});
        res.status(500).end("MongoClient connect() failed!");
     }   
    var new_r = {};    
    new_r['restaurant_id'] = fields.restaurant_id;
    new_r['name'] = fields.name;
    new_r['borough'] = fields.borough;
    new_r['cuisine'] = fields.cuisine;
    console.log(data);
    if(data.length>0){
      console.log("true");
      new_r['photo'] = new Buffer(data).toString('base64');
      new_r['mimetype'] = mimetype;
    }
    new_r['address'] = {street : fields.street,
                        building : fields.building,
                        zipcode : fields.zipcode,
                        coord : [fields.x,fields.y]
                      };
    //new_r['grade'] = [];                

    var o_id = new mongo.ObjectID(fields._id);         
    var query = {_id:o_id};
    updateDocument(db,query,new_r,"restaurant2",function(result) {
        db.close();
        res.redirect('/');
      });
  }); 
});
}else{
  console.log("NOT OWNER");
  res.end("NOT OWNER");
}
});
});

app.get('/display',function(req,res){
  MongoClient.connect(mongourl,function(err,db) {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.set({"Content-Type":"text/plain"});
      res.status(500).end("MongoClient connect() failed!");
    }       

    findDocument(db,{},"restaurant2",function(result) {
        db.close();
        res.render('display',{result:result});
      });
  });  
});

app.get('/showDetails',function(req,res){
  MongoClient.connect(mongourl,function(err,db) {
    try {
      assert.equal(err,null);
    } catch (err) {
      res.set({"Content-Type":"text/plain"});
      res.status(500).end("MongoClient connect() failed!");
    }     
    var o_id = new mongo.ObjectID(req.query._id);  
    findDocument(db,{_id : o_id},"restaurant2",function(result) {
        db.close();
        console.log(result);

        res.render('showDetails',{result:result[0],userid:req.session.userid});
      });
  }); 
});

app.get('/map',function(req,res){
  res.render("gmap.ejs", {
		lat:req.query.x,
		lon:req.query.y,
		zoom:15
	});
	res.end();
});
// (ಠ o ಠ)¤=[]:::::> function list

function insertDocument(db,r,collection,callback) {
    db.collection(collection).insertOne(r,function(err,result) {
      assert.equal(err,null);
      console.log("insert was successful!");
      callback(result);
    });
  }

  function findDocument(db,r,collection,callback) {
    var cursor = db.collection(collection).find(r);
    var result = [];
    cursor.each(function(err, doc) {
      assert.equal(err, null); 
      if (doc != null) {
        result.push(doc);
      } else {
        callback(result);
      }
    });
  }
 
  function updateDocument(db,query,r,collection,callback) {
    db.collection(collection).update(query,{$set:r},function(err,result) {
      assert.equal(err,null);
      console.log("update was successful!");
      callback(result);
    });
  }