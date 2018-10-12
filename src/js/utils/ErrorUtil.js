//@flow
export default class ErrorUtil {
  constructor (message:string):Error {
    throw new Error(message)
  }
}

