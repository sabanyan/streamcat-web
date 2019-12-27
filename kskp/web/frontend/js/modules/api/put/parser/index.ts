import { NavigationModel, NavigationModelProps } from "Model/index";
// Navigation

type RESPONSE_NAVIGATION = {
    data : {
        success : boolean,
        data : NavigationModelProps
    }
}

export function Navigation(res: RESPONSE_NAVIGATION):NavigationModel | undefined {
    let result
    try {
        result = new NavigationModel(res.data.data)
    } catch(e) {
        console.log(e)
    } finally {
        return result
    }   
}