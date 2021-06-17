export function escapeSpecialHtmlCharacters(str: string): string {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

export function getOwnerAndRepo(str: string): [string, string] {
  const [owner, repo] = str.split('/', 2)
  return [owner, repo]
}
