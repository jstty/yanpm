module.exports = [{
    "group":   "util",
    "package": "stumpy",
    "factory": function (Stumpy) {
        return new Stumpy();
    },
    "args": [
        "Logger2",
        {
            showTrace: true
        }
    ]
}];