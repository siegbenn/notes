// Requirements:
var restify = require('restify');
var cassandra = require('cassandra-driver');

// Cassandra:
var client = new cassandra.Client({
    contactPoints: ['54.164.173.50', '54.165.34.88', '54.164.173.50'],
    keyspace: 'notes'
});

exports.createNote = function(req, res, next) {
    
    // Set note variables.
    var email = req.params.email;
    var body = req.params.body;
    var tag = req.params.tag;
    var bucket = req.params.bucket;
    
    if (email == undefined || body == undefined || tag == undefined || bucket == undefined || email == "" || tag == "" || bucket == "" || body == "") {
        res.send(400, {
            'STATUS_KEY': 'Please define all body, tag, and bucket.'
        });
    }
    else {
        // Create note.
        var query = 'insert into notes (email, id, body, tag, bucket) values (?, now(), ?, ?, ?)';
        client.execute(query, [email, body, tag, bucket], function(err, result) {
            
            if (err) {
                res.send(err);
                client.shutdown();
            }
            else {
                // Check if tag exists.
                query = 'select id, count from tags where email =? and tag =? and bucket=? allow filtering';
                client.execute(query, [email, tag, bucket], function(err, result) {
                   
                    if (err) {
                        res.send(err);
                        client.shutdown();
                    }
                    else {
                        
                        // If tag does not exist.
                        if (result.rows[0] === undefined) {
                            // Create new tag record.
                            query = 'insert into tags (email, id, tag, count, bucket) values (?, now(), ?, 1, ?)';
                            client.execute(query, [email, tag, bucket], function(err, result) {
                                
                                if (err) {
                                    res.send(err);
                                    client.shutdown();
                                }
                                else {
                                    res.send(200, {
                                        'STATUS_KEY': 'Success'
                                    });
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
                                query: 'insert into tags (email, id, tag, count, bucket) values (?, now(), ?, ?, ?)',
                                params: [email, tag, count, bucket]
                            }];
                            
                            client.batch(queries, function(err, result) {
                                if (err) {
                                    res.send(err);
                                    client.shutdown();
                                }
                                else {
                                    res.send(200, {
                                        'STATUS_KEY': 'Success'
                                    })
                                    client.shutdown();
                                }
                            })
                        }
                    }
                })
            }
        });
    }
}
exports.getNotes = function(req, res, next) {
    
    // Set note variables.
    var email = req.params.email;
    var arr = [];
    var page = req.params.page;
    
    if (email == undefined || email == "") {
        res.send(400, {
            'STATUS_KEY': 'Please define email.'
        });
    }
    else {
        // Query for note.
        query = 'select id from notes where email =? limit 1';
        client.execute(query, [email], function(err, result) {
            if (err) {
                res.send(err);
                client.shutdown();
            }
            else {
                // If note does not exist.
                if (result.rows[0] === undefined) {
                    res.send(404, {
                        'STATUS_KEY': 'Not Found'
                    });
                    client.shutdown();
                }
                else {

        // Check for defined page.
        if (page !== undefined) {

            // Convert page to hex buffer and query on top of it.
            page = page.toString();
            page = new Buffer(page, 'hex');
            query = 'select id, body, tag, dateOf(id) from notes where email =?';
            client.eachRow(query, [email], {
                pageState: page,
                prepare: 1,
                fetchSize: 100
            }, function(n, row) {
                arr.push({
                    id: row.id,
                    body: row.body,
                    tag: row.tag
                });
            }, function(err, result) {
                
                console.log(result)
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

                if (arr[0] == undefined) {
                    res.send(404, {
                    'STATUS_KEY': 'Error',
                    'DATA': 'Not Found'
                    })
                } else {
                    res.send(200, {
                        'STATUS_KEY': 'Success',
                        'DATA': notesObject
                    });
                }
            });
        }
        else {

            // Query without page.
            query = 'select id, body, tag, dateOf(id) from notes where email =?';
            client.eachRow(query, [email], {
                prepare: 1,
                fetchSize: 100
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
                res.send(200, {
                    'STATUS_KEY': 'Success',
                    'DATA': notesObject
                });
            });
        }
                    }
            }
        })

    }

}
exports.getNote = function(req, res, next) {
    
    // Set note variables.
    var email = req.params.email;
    var id = req.params.id;
    
    if (email == undefined || id == undefined || email == "" || id == "") {
        res.send(400, {
            'STATUS_KEY': 'Please define id.'
        });
    }
    else {
        
        // Query for note.
        query = 'select id, tag, bucket, body from notes where email =? and id =? allow filtering';
        client.execute(query, [email, id], function(err, result) {
            if (err) {
                res.send(err);
                client.shutdown();
            }
            else {
               
                // If note does not exist.
                if (result.rows[0] === undefined) {
                    res.send(404, {
                        'STATUS_KEY': 'Not Found'
                    });
                    client.shutdown();
                }
                else {
                    res.send(200, result.rows[0])
                    client.shutdown();
                }
            }
        })
    }
}
exports.deleteNote = function(req, res, next) {
    
    // Set note variables.    
    var email = req.params.email;
    var id = req.params.id;
    
    if (email == undefined || id == undefined || email == "" || id == "") {
        res.send(400, {
            'STATUS_KEY': 'Please define id.'
        });
    }
    else {

        // Delete the note.
        query = 'delete from tags where email =? and id =?';
        client.execute(query, [email, id], function(err, result) {
            if (err) {
                res.send(err);
                client.shutdown();
            }
            else {
                res.send(200, {
                    'STATUS_KEY': 'Deleted'
                })
                client.shutdown();
            }
        })
    }
}