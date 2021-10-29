import axios from 'axios';
import $ from 'jquery'; 

var headers = {
    'token' : sessionStorage.token,
    'Content-Type': 'application/x-www-form-urlencoded',
    'sessionId': sessionStorage.sessionId
}

const transform = function (data) {
    return $.param(data)
}

const post = (url, data, callback) => {
    axios({
        method: 'post',
        url: url,
        headers: {
            'Authorization' : headers.token,
            'session-id': headers.sessionId,
        },
        data: data,
        transformRequest : transform
    })
    .then((results) => {
        console.log('results-------------',results)
        callback('',results);
    })
    .catch((err) => {
        console.log('err----------------',err)
        callback(err,'');
    })
}

const get = (url, params, callback) => {
    axios({
        method: 'get',
        url: url,
        params: params,
        headers: {
            authorization : headers.token
        }
    })
    .then((results) => {
        callback('',results);
    })
    .catch((err) => {
        console.log('err----------------',err)
        callback(err,'');
    })
}

const put = () => {

}

const del = () => {

}

export var Data = {
    post : post,
    put : put,
    get : get,
    del : del
}