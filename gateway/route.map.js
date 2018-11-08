module.exports = [{
  pin: 'role:web, cmd:*',
  prefix: '/v1',
  map: {
    getById: { GET: true, alias: '/items/:id' },
		create: { POST: true, alias: '/items' },
		search: { POST: true, alias: '/items/_search' },
  },
}]