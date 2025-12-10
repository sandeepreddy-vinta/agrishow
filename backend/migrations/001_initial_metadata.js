module.exports = {
    version: 1,
    up: (db) => {
        // Just ensuring structure for the first version
        if (!db._metadata) {
            db._metadata = { version: 1, created: new Date().toISOString() };
        }
        if (!db.assignments) db.assignments = {};

        // Example: Add a new field to all franchises if missing
        db.franchises.forEach(f => {
            if (!f.createdAt) f.createdAt = new Date().toISOString();
        });
    }
};
