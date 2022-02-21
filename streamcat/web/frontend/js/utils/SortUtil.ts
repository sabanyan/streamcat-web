type Sortable = {
  order: number;
}

export default class SortUtil { 
  public static getSortedContents<T extends Sortable>(contents:T[], compare=SortUtil.defaultCompare) {
    return contents.sort((a, b) => compare(a,b));
  }

  private static defaultCompare(a:Sortable, b:Sortable) {
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
