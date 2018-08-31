//@flow
export default class StringUtil {

  static separate(num:number):string{
    if(!num && num !== 0)return ""
    return String(num).replace( /(\d)(?=(\d\d\d)+(?!\d))/g, '$1,');
  }

  static convertToFileSize(size:number):string {
    if(!size && size !== 0)return ""
    const units = [" B", " KB", " MB", " GB", " TB"];
    let i = 0
    for (i = 0; size > 1024; i++) {
      size /= 1024;
    }
    return this.separate(Math.round(size * 100 / 100)) + units[i];
  }
}

