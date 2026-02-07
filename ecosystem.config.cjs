module.exports = {
	apps: [
		{
			name: 'crossing-guard-bot',
			script: './dist/index.js',
			exec_mode: 'fork',
			interpreter: 'node',
			node_args: [],
			watch: false,
			autorestart: true,
			env: {
				NODE_ENV: 'development'
			}
		}
	]
};
