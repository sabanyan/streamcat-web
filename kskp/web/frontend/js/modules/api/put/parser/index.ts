import {NavigationModel} from "Model/index";
// Navigation

type RESPONSE_NAVIGATION = {
    data : {
        success : boolean,
        data : {
            user_id     : string | "",
            user_name   : string | "",
            project_uuid: string | "",
            project_name: string | "",
            flow_uuid   : string | "",
            flow_name   : string | ""
        }
    }
}

export function Navigation(res:RESPONSE_NAVIGATION):NavigationModel | undefined {
    let result
    try {
        result = new NavigationModel(res.data.data)
    } catch(e) {
        console.log(e)
    } finally {
        return result
    }   
}