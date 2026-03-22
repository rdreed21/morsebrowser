export class GeneralUtils {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  static booleanize = (x: string): any => {
    if (x === 'true' || x === 'false') {
      return x === 'true'
    } else {
      return x
    }
  }

  // helper
  // https://stackoverflow.com/questions/901115/how-can-i-get-query-string-values-in-javascript
  static getParameterByName = (name: string, url: string = window.location.href) => {
    // eslint-disable-next-line no-useless-escape
    name = name.replace(/[\[\]]/g, '\\$&')
    const regex = new RegExp('[?&]' + name + '(=([^&#]*)|&|#|$)')
    const results = regex.exec(url)
    if (!results) return null
    if (!results[2]) return ''
    return decodeURIComponent(results[2].replace(/\+/g, ' '))
  }
}
