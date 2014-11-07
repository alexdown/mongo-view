MongoOplog = require('mongo-oplog');
MongoClient = require('mongodb').MongoClient;
Server = require('mongodb').Server;

var oplog = MongoOplog('mongodb://127.0.0.1:27017/local', 'test1.sales').tail();
var mongoclient = new MongoClient(new Server("localhost", 27017), {native_parser: true});

oplog.on('insert', function (doc) {
  console.log(doc); //doc.o.date.getMonth() + 1
  
  mongoclient.open(function(err, mongoclient) {
    var db = mongoclient.db("test1");
    db.collection('monthlySalesReport').update({_id: (doc.o.date.getMonth() + 1)}, { $inc: {count: 1} }, {upsert:true}, function(err, result) {
    	console.log("count incremented successfully!");
    	db.close();
    });
  });
});
