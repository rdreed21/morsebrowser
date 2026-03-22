export default class SavedSettingsInfo {
  key:string
  value:any
  comment?:string | null
  constructor (key:string, value:any, comment:string | null = null) {
    this.key = key
    this.value = value
    this.comment = comment
  }
}
