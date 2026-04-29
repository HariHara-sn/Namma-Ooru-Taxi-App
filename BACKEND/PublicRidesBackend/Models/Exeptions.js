
class DatabaseInsertFailed extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseInsertFailed';
    }
}

class DatabaseDeleteFailed extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseDeleteFailed';
    }
}

class DatabaseUpdateFailed extends Error {
    constructor(message) {
        super(message);
        this.name = 'DatabaseUpdateFailed';
    }
}

module.exports = {DatabaseInsertFailed, DatabaseDeleteFailed, DatabaseUpdateFailed}

