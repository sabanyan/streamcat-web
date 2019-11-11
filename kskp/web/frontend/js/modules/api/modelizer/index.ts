import {VisualizeModel, LocksModel, FlowModel} from "Model/index";
import { API } from '../core/index'

export function Modelizer(data, API_DATA_KEY) {
    let result = data
    try {
        switch (API_DATA_KEY) {
            case API.VISUALIZERS.KEY    :
                result = data.map((visualize)=>{
                    return new VisualizeModel(visualize)
                })
                break;
            case API.FLOWS.KEY          :
                result = new FlowModel(data)
                break;
            case API.LOCKS.KEY          :
                result = new LocksModel(data)
                break;
        }    
    } catch(e) {
        console.log(e)
    } finally {
        return result
    }
}