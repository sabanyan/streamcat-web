export default class ModalUtil { 
    static getSortedContents(contents:[], compare = (a,b) => ModalUtil.defaultCompare(a,b)) : [] {
      return contents.sort((a, b) => compare(a,b))
    }
  
    static defaultCompare(a, b) {
      // ある順序の基準において a が b より小
      if (a.order < b.order) {
        return -1;
      }
      //その順序の基準において a が b より大
      if (a.order > b.order) {
        return 1;
      }
      // a は b と等しいはず
      return 0;
    }
  }