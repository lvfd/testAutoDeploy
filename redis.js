const Redis = require('ioredis')

const host = '10.1.85.160'
// const wwwHost = '10.1.82.105'
const cluster = (config) => new Redis.Cluster([
	{
		port: 7000,
		host: host
	},
	{
		port: 7001,
		host: host
	},
	{
		port: 7002,
		host: host
	},
	{
		port: 7003,
		host: host
	},
	{
		port: 7004,
		host: host
	},
	{
		port: 7005,
		host: host
	}
], {
	redisOptions: {
		password: 'Acca@1234',
	},
	enableReadyCheck: true,
	keyPrefix: config.keyPrefix
})

module.exports = {
	cluster: cluster
}