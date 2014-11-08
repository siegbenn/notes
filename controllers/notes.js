// Requirements:
var restify = require('restify');
var cassandra = require('cassandra-driver');

// Cassandra:
var client = new cassandra.Client({
    contactPoints: ['localhost'],
    keyspace: 'notes'
});

exports.createNote = function(req, res, next) {
// Set note variables.
var email = req.params.email;
var body = req.params.body;
var tag = req.params.tag;

// Create note.
var query = 'insert into notes (email, id, body, tag) values (?, now(), ?, ?)';
client.execute(query, [email, body, tag], function(err, result) {
    if (err) {
        res.send(err);
        client.shutdown();
    }
    else {

        // Check if tag exists.
        query = 'select id, count from tags where email =? and tag =?';
        client.execute(query, [email, tag], function(err, result) {
            if (err) {
                res.send(err);
                client.shutdown();
            }
            else {

                // If tag does not exist.
                if (result.rows[0] === undefined) {

                    // Create new tag record.
                    query = 'insert into tags (email, id, tag, count) values (?, now(), ?, 1)';
                    client.execute(query, [email, tag], function(err, result) {
                        if (err) {
                            res.send(err);
                            client.shutdown();
                        }
                        else {
                            res.send(200, {'STATUS_KEY' : 'Success'});
                            client.shutdown();
                        }
                    });
                }
                else {

                    // If tag exists.
                    var id = result.rows[0].id;
                    var count = result.rows[0].count + 1;

                    // Delete tag and make new one with updated id(time) and count.
                    var queries = [{
                        query: 'delete from tags where email =? and id =?',
                        params: [email, id]
                    }, {
                        query: 'insert into tags (email, id, tag, count) values (?, now(), ?, ?)',
                        params: [email, tag, count]
                    }];
                    client.batch(queries, function(err, result) {
                        if (err) {
                            res.send(err);
                            client.shutdown();
                        }
                        else {
                            res.send(200, {'STATUS_KEY' : 'Success'})
                            client.shutdown();
                        }
                    })
                }
            }
        })
    }
});
}

exports.getNotes = function(req, res, next) {
    var email = req.params.email;
    var arr = [];
    var page = req.params.page;

    if (page !== undefined) {

      page = page.toString();
      page = new Buffer(page, 'hex');
        query = 'select id, body, tag, dateOf(id) from notes where email =?';
        client.eachRow(query, [email], {
            pageState: page,
            prepare: 1,
            fetchSize: 1000
        }, function(n, row) {
            arr.push({
                id: row.id,
                body: row.body,
                tag: row.tag
            });
        }, function(err, result) {
            var page = result.meta.pageState;
            if (page !== undefined) {
                page = page.toString('hex')
                var notesObject = {
                    notes: arr,
                    page: page
                }
            }
            else {
                var notesObject = {
                    notes: arr
                }
            }
            res.send(200, {'STATUS_KEY' : 'Success', 'DATA': notesObject});
        });
    }
    else {
        query = 'select id, body, tag, dateOf(id) from notes where email =?';
        client.eachRow(query, [email], {
            prepare: 1,
            fetchSize: 1000
        }, function(n, row) {
            arr.push({
                id: row.id,
                body: row.body,
                tag: row.tag
            });
        }, function(err, result) {
            var page = result.meta.pageState;
            if (page !== undefined) {
                page = page.toString('hex')
                var notesObject = {
                    notes: arr,
                    page: page
                }
            }
            else {
                var notesObject = {
                    notes: arr
                }
            }
            res.send(200, {'STATUS_KEY' : 'Success', 'DATA': notesObject});
        });
    }
}
