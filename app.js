var express = require('express')
var bodyParser = require('body-parser')
var quiet = require('quiet')
var path = require('path')
var _ = require('underscore')
var async = require('async')

var db = quiet(
  path.resolve(__dirname, 'data/tasks.json')
)
var app = express()
var port = process.env.PORT || 8011 // port

app.use(bodyParser.urlencoded({
  extended: false // extended
}))

app.use('/', express.static(
  path.resolve(__dirname, 'static')
))

app.get('/api/tasks', function(req, res){
  var tags = req.query['tags'] ?
    req.query['tags'].split('|') : []
  if (tags.length <= 0) {
    return res.json(db.data) // all
  }
  res.json({ // filter list
    meta: db.data.meta,
    list: _.filter(db.data.list, function(v){
      return _.some(v.tags, function(tag){
        return _.contains(tags, tag)
      })
    })
  })
})

app.post('/api/tasks', function(req, res){
  var task
  try {
    task = JSON.parse(req.body['json'])
  } catch(err) {
    return res.status(400).end() // broken json
  }
  task.id = db.data.meta.nextId++ // next id
  task.ts = Date.now() // timestamp

  db.data.list.push(task)
  res.status(204).end() // success no content
  db.save()
})

app.patch('/api/tasks/:id', function(req, res){
  var task
  try {
    patch = JSON.parse(req.body['json'])
  } catch(err) {
    return res.status(400).end()
  }
  // hack
  var exists = _.some(db.data.list, function(v, i, list){
    if (v.id == req.params['id']) { // param id
      list[i] = _.extend(v, patch) // extend
      return true // break from loop
    }
  })
  if (!exists) {
    return res.status(404).end()
  }
  res.status(204).end()
  db.save()
})

app.delete('/api/tasks/:id', function(req, res){
  var exists = _.some(db.data.list, function(v, i, list){
    if (v.id == req.params['id']) {
      list[i]._deleted = true // flag deleted
      return true
    }
  })
  if (!exists) {
    return res.status(404).end()
  }
  res.status(204).end()
  db.save()
})

async.series([
  function(cb){
    db.once('load', cb).load()
  },
  function(cb){
    app.listen(port, cb)
  }
], function(err){
  if (err) throw err
  console.log('Task App starts on %d', port)
})