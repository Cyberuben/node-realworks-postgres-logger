const pg = require("pg");
const escape = require("sql-template-strings");

if (!('toJSON' in Error.prototype))
Object.defineProperty(Error.prototype, 'toJSON', {
	value: () => {
		var alt = {};

		Object.getOwnPropertyNames(this).forEach((key) => {
			alt[key] = this[key];
		}, this);

		return alt;
	},
	configurable: true,
	writable: true
});

const logLevels = {
	EMERG: 0,
	ALERT: 1,
	CRIT: 2,
	ERR: 3,
	WARNING: 4,
	NOTICE: 5,
	INFO: 6,
	DEBUG: 7
}

class PostgresLogTransport {
	constructor(options) {
		if(!options) options = {};

		this._options = options;

		if(!this._options.pg && !this._options.db) {
			throw new TypeError("'options.pg' or 'options.db' must be set");
		}

		if(this._options.db) {
			this.pool = new pg.Pool(this._options.db);
		}else if(this._options.pg) {
			this.pool = pg;
		}
	}

	get() {
		throw new Error("Not yet implemented");
	}

	log(type, msg, property, meta) {
		if(!Object.keys(logLevels).some((key) => { return key == type; })) {
			console.error(new Error("Log level '"+type+"' is not a valid level"));
			return;
		}

		const level = logLevels[type];
		if(!property) {
			property = null;
		}

		if(meta) {
			meta = JSON.stringify(meta);
		}else{
			meta = null;
		}

		this.pool.query(escape`
			INSERT INTO
				log (
					level,
					message,
					property,
					meta
				)
			VALUES (
				${level},
				${msg},
				${property},
				${meta}
			)
		`)
		.catch((err) => {
			console.error("Something went wrong using the Postgres logger", err);
		});
	}
}

module.exports = PostgresLogTransport;