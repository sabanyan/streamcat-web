
const baseUrl = "/api/v0"
export const URL = {
    GET : {
        flows: baseUrl + "/flows",
        commands: baseUrl + "/commands",
        visualizers: baseUrl + "/visualizers",
        subflows: baseUrl + "/subflows",
        libraries: baseUrl + "/libraries",
        navigation: baseUrl + "/navagation"
    },
    PUT : {
        flows: baseUrl + "/flows"
    },
    POST : {
        locks: baseUrl + "/locks",
        vizs: baseUrl + "/vizs"
    },
    DELETE : {
        locks: baseUrl + "/locks"
    }
}