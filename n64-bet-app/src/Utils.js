let numberWithCommas = function(x) {
    x = x.toFixed(2)
    let values = x.toString().split(".")
    if(values.length == 1)
        return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    else{
        let lhs = values[0].toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return lhs + '.' + values[1]
    }
}

let toPercentString = function(x){
    x = x * 100
    x = x.toFixed(2)
    return x.toString() + "%"
}

exports.numberWithCommas = numberWithCommas;
exports.toPercentString  = toPercentString;