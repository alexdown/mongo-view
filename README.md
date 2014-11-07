VIEW/MATERIALIZED VIEW in MongoDB
---

This is just a train of thoughts about how to reproduce the functionality of a SQL VIEW/MATERIALIZED VIEW on mongoDB.

--

First, the setup.

You need:
- Mongo shell to run `bad.js` (the 1st example).
  You start a single instance (no rs) using `mongod --dbpath <YOUR_DATA_PATH> --smallfiles`
- Node.js, mongodb, mongo-oplog to run `bad3.js` (the 3rd example).
  You start a replica set (can be even just a single member) using `mongod --dbpath <YOUR_DATA_PATH> --smallfiles --replSet "rstest"`
- If you're curious about what happened to `bad2.js`... I'll tell you if you help me making oplog tailing work in the mongo shell ;)

The data model is:
- One db `test1` with one collection `sales`.
  You can add elements in it by:

    {
        "desc" : "fourth sale in october",
        "date" : ISODate("2014-10-14T23:00:00.000Z")
    }

  change the description and the date as you wish (as the aggregation is grouping by month, you need several entries on different months)
- `bad2.js` uses aggregation framework `$out` to create the collection `monthlySalesReport`
- same is done by `bad3.js` on every new insert into the `sales` collection (sort of a "trigger")

--

The "presentation" (such a pretentious word) goes like that:

1. aggregation framework

- how to create views
  ...jira :(

- $out
  ...still, it's a different collection! waste space (data&index)

- schedule query execution? 
  ...jira :(

- client loading script with setTimeout 
  :(

- client loading script with while(true) 
  :/

- if a materialized view is enough, can use cron
  :/

- tailing oplog? can write "triggers"! https://github.com/cayasso/mongo-oplog
  ...it's external to the db :(
  ...don't have the previous value in case of update :(