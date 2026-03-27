import { GeneralUtils } from './general'

describe('GeneralUtils.booleanize', () => {
  it('parses true/false strings', () => {
    expect(GeneralUtils.booleanize('true')).toBe(true)
    expect(GeneralUtils.booleanize('false')).toBe(false)
  })

  it('returns other strings unchanged', () => {
    expect(GeneralUtils.booleanize('12')).toBe('12')
    expect(GeneralUtils.booleanize('maybe')).toBe('maybe')
  })
})

describe('GeneralUtils.getParameterByName', () => {
  it('reads query parameters from a URL string', () => {
    const url = 'https://example.com/path?adminMode=1&x=y'
    expect(GeneralUtils.getParameterByName('adminMode', url)).toBe('1')
    expect(GeneralUtils.getParameterByName('x', url)).toBe('y')
    expect(GeneralUtils.getParameterByName('missing', url)).toBeNull()
  })
})
