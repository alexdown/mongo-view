# VIEW/MATERIALIZED VIEW in MongoDB

This is just a train of thoughts about how to reproduce the functionality of a SQL VIEW/MATERIALIZED VIEW in mongoDB.


## Setup

You need **the following software**:
- Mongo shell to run `bad.js` (the 1st example).
  You start a single instance (no rs) using `mongod --dbpath <YOUR_DATA_PATH> --smallfiles`
- Node.js, and the mongodb, mongo-oplog packages (install via npm) to run `bad3.js` (the 3rd example).
  You start a replica set (can be even just a single member) using `mongod --dbpath <YOUR_DATA_PATH> --smallfiles --replSet "rstest"`
- If you're curious about what happened to `bad2.js`... I'll tell you if you help me making oplog tailing work in the mongo shell ;)

The **data model** is:
- One db `test1` with one collection `sales`.
  You can add elements in it by:
```json
    {
        "desc" : "fourth sale in october",
        "date" : ISODate("2014-10-14T23:00:00.000Z")
    }
```
  change the description and the date as you wish (as the aggregation is grouping by month, you need several entries on different months)
- `bad2.js` uses aggregation framework `$out` to create the collection `monthlySalesReport`
- same is done by `bad3.js` on every new insert into the `sales` collection (sort of a "trigger")

## Presentation
The **"presentation"** (such a pretentious word) goes like that:

1. Although mostly used to store and retrieve data via CRUD operations, MongoDB have an [aggregation framework](http://docs.mongodb.org/manual/core/aggregation-pipeline/) that allows to write more complex queries (e.g. group, sum, etc).
I can then use this aggregation framework to write queries that aggregate and reports on data.

2. I would like, at this point, to be able to create the equivalent of an `SQL VIEW`, that is, a virtual _table_ (_collection_, in mongo jargon), whose content is the result of a query, that I can query as any other normal table (oops... collection! :). Unfortunately, this seems [not to be a priority](https://jira.mongodb.org/browse/SERVER-142?focusedCommentId=73119&page=com.atlassian.jira.plugin.system.issuetabpanels:comment-tabpanel#comment-73119) (the jira issue has been updated in Sept 2014 but the "will do" from Eliot dates back 2011...) 

3. As of 2.6, I can use [`$out`](http://docs.mongodb.org/manual/reference/operator/aggregation/out/) to output the result of an aggregation query to a new collection. This is great but not optimal, for instance because the new collection is a completely new collection that takes spaces for both data and index storage, ... (more a _MATERIALIZED VIEW_ than a _VIEW_)

4. Anyway, the `$out` it's better than nothing. However, we can't tell mongodb to _continuously update the target collection_, and [we can't even _schedule_ the aggregation query to run periodically](https://jira.mongodb.org/browse/SERVER-2573) to update the `$out` target collection. We need to do it from outside mongoDB.

5. First thing that pops to mind is wrap the query into a `setTimeout` and execute it via mongo shell. Something like:
  ```javascript
  setTimeout(function(){
      // run the aggregation framework query here
  }, 5000);
  ```
  to invoke via mongo shell `mongo <FILENAME>.js`. Too bad, no window.setTimeout() :(

6. Quick&dirty solution is what you see in `bad.js` (that's why it's called "bad" in the first place: a `while(true)`. If you launch `mongo bad.js` on a mongo instance with `test1` db and the `sales` collection, you'll find a new `monthlySalesReport` collection with the aggregated data. so far so good.
 
7. `while(true)` is really ugly. You may want to remove it, so that the script run the query only once, and schedule the execution via cron: no realtime update, but that's all we can get. 

8. Another solution that have seen much buzz recently is _oplog tailing_. Google it if you want to know what that is, but basically, the oplog is a [capped collection](http://docs.mongodb.org/manual/core/capped-collections/) that mongo uses to replicate data between nodes of a replica set. The gist is that we tap that collection and we update our `monthlySalesReport` collection with data as soon as this is written in the original `sales` collection.

9. So how do we do that. [mongo-oplog](https://github.com/cayasso/mongo-oplog) and many other libraries makes our life easier. Just `npm install mongo-oplog` and `npm install mongodb` and we're ready to run `node bad3.js`. Please note that I implemented only the `insert` case... do the others as exercise, and continue reading below when you are doing `update` ;)

10. This looks good. So much like [TRIGGERS](http://www.postgresql.org/docs/9.3/static/sql-createtrigger.html). But is it? The answer is no, as it's still external to the db, and most important because the _update_ "trigger" don't have access to the old value of the updated document... :(

11. Please please please MongoDB: implement native VIEWs!!!

Bedtime reading, if you like the topic: http://docs.mongodb.org/manual/reference/sql-comparison/

## SQL

As a reference, the SQL equivalent of the data model above is (PostgreSQL):
- **`sales` table**: 
  CREATE TABLE sales ( date date, "desc" character varying)

- **`sales` table entries**:
  INSERT INTO sales VALUES ('2014-09-03', 'another sale')

- **`monthlySalesReport` query/view** (to create the view, prefix the query with `CREATE VIEW AS`):
  SELECT 
    concat(date_part('year', date), '-', date_part('month', date)) as id,
    count(*)
  FROM
    sales
  GROUP BY id

