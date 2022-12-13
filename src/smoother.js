const { time } = require("console");

const INTERVAL = 2000 //2 seconds

module.exports = {

    print: function(text){
        console.log('Smoother > ' + text)
    },

    start: function (list) {
        var timeout = 0
        for(var i in list){
            setTimeout(() => this.nextStep(list[i]), timeout)
            timeout += INTERVAL
        }
        setTimeout(() => this.end(cb), timeout)
    },

    nextStep: function (item) {
        this.print('processing item - ' + item.name)
        item.action()
    },

    end: function (cb) {
        this.print('end cycle invoking callback')
    }

};