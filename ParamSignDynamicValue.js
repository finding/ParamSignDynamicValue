const md5 = require('./md5')

const ParamSignDynamicValue = function() {
  this.evaluate = function (context) {
    const request = context.getCurrentRequest()
    var params = {}
    console.log(JSON.stringify(request))
    if (request.getHeaderByName("Content-Type") && request.getHeaderByName("Content-Type").indexOf('application/json') >= 0) {
      // const requestBody = request.getJsonBodyKeyPath('')
      params = {
        method: request.getMethod(),
        url: request.getUrl().replace(this.host.getCurrentValue(), ''),
        body: unescape(request.getBody().replace(/(\\\u){1}/g, "%u")),
        timestamp: request.getHeaders().timestamp
      }
    } else if (request.getMethod() == 'POST') {
      const bodyKeys = request.urlEncodedBodyKeys
      for (var i in bodyKeys) {
        if (bodyKeys[i] != 'sign') {
          params[bodyKeys[i]] = decodeURI(request.getUrlEncodedBodyKey(bodyKeys[i]))
        }
      }
    } else {
      params = request.urlParameters
    }

    return getSign(params, this.secret)

  }
  this.title = function() {
    return "signature"
  }
  // this.text = function () {
  //   return ''
  // }
}

ParamSignDynamicValue.identifier = "com.Ken.ParamSignDynamicValue"
ParamSignDynamicValue.title = "Request parameter signature"
ParamSignDynamicValue.inputs = [
  InputField("secret", "Secret", "SecureValue"),
  InputField("host", "Host", "EnvironmentVariable")
]

registerDynamicValueClass(ParamSignDynamicValue)


//传入需要签名的参数
function getSign(params, secret) {
  if (typeof params == "string") {
    return paramsSort(params, secret)
  } else if (typeof params == "object") {
    const arr = []
    for (var i in params) {
      // if (params[i] != '' && params[i] != undefined && params[i] != null) {
      if (params[i] != 'sign' && params[i] != 'signature') {
        arr.push((i + "=" + params[i]))
      }
    }
    return paramsSort(arr.join(("###")), secret)
  }
  return ''
}

function paramsSort(params, secret) {
  const str = params.split("###").sort().join("&")
  const newStr = decodeURI(str) + '&key=' + secret
  console.log(md5(newStr).toUpperCase(), newStr)
  return md5(newStr).toUpperCase()
}