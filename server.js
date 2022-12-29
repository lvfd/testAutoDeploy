const express = require('express')
const app = express()
const port = 8013
const path = require('path')

app.get('/', express.static(path.join(__dirname, 'pages')))

app.listen(port, () => {
  console.log(path.resolve(__dirname, 'pages'))
  console.log(`Express Server listening on port ${port}`)
})