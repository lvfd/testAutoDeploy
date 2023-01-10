const express = require('express')
const app = express()
const port = 3000
const path = require('path')
const redisCluster = require('./redis')

let redisStatus
redisCluster.on('ready', () => {
  redisStatus = 'ready'
})
redisCluster.on('error', (e) => {
  console.log(e)
  redisStatus = 'error'
})

app.get('/', express.static(path.join(__dirname, 'pages')))
app.get('/redis', (req, res) => {
  res.send(`redis is on ${redisStatus}`)
})

app.listen(port, () => {
  console.log(path.resolve(__dirname, 'pages'))
  console.log(`Express Server listening on port ${port}`)
})