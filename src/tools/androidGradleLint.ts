import {Issue} from '../types/main'
import {escapeSpecialHtmlCharacters} from './utils'
import {promises as fs} from 'fs'
import * as xml2js from 'xml2js'

export default async function parseGradleReport(filePath: string): Promise<Issue[]> {
  const issues: Issue[] = []
  let xmlData = ''

  try {
    xmlData = await fs.readFile(filePath, {encoding: 'utf8'})
  } catch (error) {
    console.error(error.message)
  }

  xml2js.parseString(xmlData, (xml2jsError, result) => {
    if (xml2jsError) {
      console.error(xml2jsError)
      return
    }
    if (!result.hasOwnProperty('issues')) {
      console.error('xml file does not contain <issues>')
    }
    if (!result.issues.hasOwnProperty('issue')) {
      console.error('xml file does not contain any <issue> inside <issues>')
    }
    for (const issue of result.issues.issue) {
      const title = escapeSpecialHtmlCharacters(
        `__${issue.$.category} ${issue.$.severity} (${issue.$.priority}/10):__ ${issue.$.summary}`
      )
      const message = escapeSpecialHtmlCharacters(`${issue.$.message}`)
      const explanation = `<details>\n<summary>Explanation</summary>\n${escapeSpecialHtmlCharacters(
        issue.$.explanation
      )}\n</details>`
      const urls: string[] = []
      if (issue.$.hasOwnProperty('urls')) {
        for (const url of issue.$.urls.split(',')) {
          urls.push(url)
        }
      }
      if (issue.hasOwnProperty('location')) {
        for (const location of issue.location) {
          if (location.$.hasOwnProperty('line')) {
            issues.push({
              id: issue.$.id,
              severity: issue.$.severity,
              title,
              message,
              explanation,
              urls,
              location: {
                file: location.$.file,
                line: parseInt(location.$.line)
              }
            })
          } else {
            issues.push({
              id: issue.$.id,
              severity: issue.$.severity,
              title,
              message,
              explanation,
              urls,
              location: {
                file: location.$.file
              }
            })
          }
        }
      }
    }
  })
  return issues
}
