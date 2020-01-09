import axios from 'axios'

export function Get(url: string, queryParam: {} = {}) {
    return axios.get(url, (queryParam) ? { params: queryParam } : {})
}

export function Post(url: string, data: {}, config: {} = {}) {
    return axios.post(url, data, config)
}

export function Put(url: string, data: {}, config: {} = {}) {
    return axios.put(url, data, config)
}

export function Delete(url: string, queryParam: {} = {}, data = {}) {
    const params = (queryParam) ? { params: queryParam } : {}
    const datas = { data } ? { data: data } : {}
    return axios.delete(url, { ...params, ...datas })
}
