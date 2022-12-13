const INTERVAL = 5000 //2 seconds

var totalItems = 0
var endCheck = null

module.exports = {

    print: function (text) {
        console.log('Smoother > ' + text)
    },

    start: function (list, cb) {
        var timeout = 0
        for (var i in list) {
            var item = list[i]
            this.setTimer(item, timeout)
            timeout += INTERVAL
            totalItems++
        }
        endCheck = setInterval(() => this.end(cb), INTERVAL)
    },

    setTimer: function (item, timeout) {
        setTimeout(() => this.nextStep(item), timeout)
    },

    nextStep: function (item) {
        this.print('processing item - ' + item.repo)
        item.action(() => {
            totalItems--
        })
    },

    end: function (cb) {
        if (totalItems <= 0) {
            clearInterval(endCheck);
            this.print('end cycle invoking callback')
        }
    }

};