import {VisualizeModel, LocksModel, FlowModel} from "Model/index";
import ApiConstants from '../constants/index'

export default function Modelizer(data, API_DATA_KEY) {
    let result = data
    try {
        switch (API_DATA_KEY) {
            case ApiConstants.VISUALIZERS.KEY    :
                result = data.map((visualize)=>{
                    return new VisualizeModel(visualize)
                })
                break;
            case ApiConstants.FLOWS.KEY          :
                result = new FlowModel(data)
                break;
            case ApiConstants.LOCKS.KEY          :
                result = new LocksModel(data)
                break;
        }    
    } catch(e) {
        console.log(e)
    } finally {
        return result
    }
}