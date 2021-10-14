
const baseUrl = "/api/v0"
export const URL = {
    GET: {
        flows: baseUrl + "/flows",
        frames: baseUrl + "/frames",
        commands: baseUrl + "/commands",
        visualizers: baseUrl + "/visualizers",
        subflows: baseUrl + "/subflows",
        libraries: baseUrl + "/libraries",
        navigation: baseUrl + "/navigation"
    },
    PUT: {
        flows: baseUrl + "/flows"
    },
    POST: {
        locks: baseUrl + "/locks",
        extend_locks: baseUrl + "/extend-locks",
        vizs: baseUrl + "/vizs",
        activities: baseUrl + "/activities"
    },
    DELETE: {
        locks: baseUrl + "/delete-locks",
        flow: baseUrl + "/flows"
    }
}