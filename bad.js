load("Utils.js")
load("Logger.js")

function refreshMonthlyReport() {

	log.info("Running the aggregation framework query that refresh 'monthlySalesReport'");
	db.sales.aggregate(
	   [
	      {
	        $group : {
	           _id : { $month: "$date" },
	           count: { $sum: 1 }
	        }
	      },
	      { $out: "monthlySalesReport" }
	   ]
	)
}

conn = new Mongo();
db = conn.getDB("test1");

while (true) {
	refreshMonthlyReport();
	sleep(5000); 
}

//	
// db.sales.aggregate([{$group : {_id : { $month: "$date" },count: { $sum: 1 }}},{ $out: "monthlySalesReport" }])