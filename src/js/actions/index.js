import Constants from '../constants'

/**
 * ステップの追加
 * @param step
 * @returns {{type: string, step: *}}
 */
export const addStepAction = (add_step, from_step_id) => {
  return {
    type: Constants.action.ADD_STEP_ACTION,
    add_step: add_step,
    from_step_id: from_step_id
  }
}

export const addMasterAction = (context) => {
  return {
    type: Constants.action.ADD_MASTER_ACTION,
    context: context,
  }
}



/**
 * ステップの更新
 * @param step
 * @returns {{type: string, step: *}}
 */
export const updateStepAction = step => {
  return {
    type: Constants.action.UPDATE_STEP_ACTION,
    step: step
  }
}

/**
 * ステップの削除
 * @param step
 * @returns {{type: string, step: *}}
 */
export const deleteStepAction = step => {
  return {
    type: Constants.action.DELETE_STEP_ACTION,
    step: step
  }
}

/**
 * ステップの選択
 * @param selected_steps
 * @returns {{type: string, selected_steps: *}}
 */
export const selectStepsAction = selected_steps => {
  return {
    type: Constants.action.SELECT_STEPS_ACTION,
    selected_steps: selected_steps
  }
}

/**
 * フローの実行
 * @param flowid
 * @returns {{type: string, step: *}}
 */
export const executeFlowAction = flowid => {
  return {
    type: Constants.action.EXECUTE_FLOW_ACTION
  }
}

/**
 * ステップの選択
 * @param selected_steps
 * @returns {{type: string, selected_steps: *}}
 */
export const sortFlowAction = () => {
  return {
    type: Constants.action.SORT_FLOW_ACTION,
  }
}
