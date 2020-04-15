//@flow
export default class StringUtil {

  static separate (num: number): string {
    if (!num && num !== 0) return ''
    return String(num).replace(/(\d)(?=(\d\d\d)+(?!\d))/g, '$1,')
  }

  static convertToFileSize (size: number): string {
    if (!size && size !== 0) return ''
    const units = [' B', ' KB', ' MB', ' GB', ' TB']
    let i = 0
    for (i = 0; size > 1024; i++) {
      size /= 1024
    }
    return this.separate(Math.round(size * 100 / 100)) + units[i]
  }

  static stripHtmlToText (html: string) {
    let tmp = document.createElement('DIV')
    tmp.innerHTML = html
    return tmp.textContent || tmp.innerText || ''
  }

  static getTextWidth (text, font) {
    let canvas = StringUtil.getTextWidth.canvas || (StringUtil.getTextWidth.canvas = document.createElement('canvas'))
    let context = canvas.getContext('2d')
    context.font = font
    let metrics = context.measureText(text)

    return metrics.width
  }

  static urlEncode(value:string):string{
   return encodeURIComponent(value);
  }

  static urlDecode(value:string):string{
    return decodeURIComponent(value);
  }
}

