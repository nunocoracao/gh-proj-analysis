const INTERVAL = 100 //ms
var semaphore = false
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
            this.setTimer(item, INTERVAL)
            totalItems++
        }
        endCheck = setInterval(() => this.end(cb), INTERVAL)
    },

    setTimer: function (item, timeout) {
        setTimeout(() => this.nextStep(item), timeout)
    },

    nextStep: function (item) {

        if (!semaphore) {
            semaphore = !semaphore
            //this.print('processing item - ' + item.repo)
            item.action(() => {
                totalItems--
                semaphore = !semaphore
            })
        } else {
            //this.print('waiting my turn - ' + item.repo)
            setTimeout(() => this.nextStep(item), INTERVAL)
        }
    },

    end: function (cb) {
        if (totalItems <= 0) {
            clearInterval(endCheck);
            this.print('end cycle invoking callback')
            cb()
        }
    }

};