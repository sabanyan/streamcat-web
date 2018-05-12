export default class DataSourcePropertyModel {
  constructor ({oveview = "", basic_operations = [], custom_operations = []} = {}) {
    this.overview = oveview
    this.basic_operations = basic_operations
    this.custom_operations = custom_operations
  }
}