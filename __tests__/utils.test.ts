import {escapeSpecialHtmlCharacters, getOwnerAndRepo} from '../src/tools/utils'

test('getOwnerAndRepo(octokit/core)', async () => {
  const testString = 'octokit/core'
  const [owner, repo] = getOwnerAndRepo(testString)

  expect(owner).toBe('octokit')
  expect(repo).toBe('core')
})

test('escapeSpecialHtmlCharacters(<fragment>)', async () => {
  const testString = '<fragment>'
  const expected = '&lt;fragment&gt;'
  const received = escapeSpecialHtmlCharacters(testString)

  expect(received).toBe(expected)
})

test('escapeSpecialHtmlCharacters(<fragment>smg</fragment>)', async () => {
  const testString = '<fragment>smg</fragment>'
  const expected = '&lt;fragment&gt;smg&lt;/fragment&gt;'
  const received = escapeSpecialHtmlCharacters(testString)

  expect(received).toBe(expected)
})
