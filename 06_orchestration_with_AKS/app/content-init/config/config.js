exports.appSettings = {
    db: (function() {
        return process.env.MONGODB_CONNECTION || 'mongodb://mongo:27017/contentdb';
    })()
};