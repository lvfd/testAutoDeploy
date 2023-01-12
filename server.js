const express = require('express')
const app = express()
const port = 3000
const path = require('path')

/* index page */
app.get('/', express.static(path.join(__dirname, 'pages')))

/* redis */
const redisCluster = require('./redis').cluster({keyPrefix: 'NODEJS:TEST:'})
redisCluster.on('error', (e) => {
  console.error('<--redis连接失败-->', e)
  redisCluster.quit()
})
redisCluster.set('TEST_FOR_AUTODEPLOY', 'success').catch(e => console.error('<--写入redis失败-->', e))
app.get('/redis', (req, res) => redisCluster.get('TEST_FOR_AUTODEPLOY').then(value => res.send(value)).catch(e => res.send('error')))

/* listener */
app.listen(port, () => {
  console.log(`--------------Express Server listening on port ${port}`)
})