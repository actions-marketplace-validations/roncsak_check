import * as core from '@actions/core'
import * as github from '@actions/github'
import {PullRequestEvent} from '@octokit/webhooks-definitions/schema'
import path from 'path'
import {commitGradleLintFiles} from './tools/git'
import {Issue} from './types/main'
import parseGradleReport from './tools/androidGradleLint'
import {getOwnerAndRepo} from './tools/utils'

const [owner, repo] = getOwnerAndRepo(process.env.GITHUB_REPOSITORY as string)
const token: string = core.getInput('token', {required: true})
const octokit = github.getOctokit(token)
const payload = github.context.payload as PullRequestEvent

async function run(): Promise<void> {
  if (github.context.eventName === 'pull_request') {
    await commitGradleLintFiles()

    const filePath: string = path.join(
      process.env.GITHUB_WORKSPACE as string,
      core.getInput('gradleLintReportPath', {required: true})
    )

    const issues = await parseGradleReport(filePath)
    commentIssuesToGithub(issues, payload.pull_request.number, github.context.payload.after)
  }
}

async function commentIssuesToGithub(
  issues: Issue[],
  pull_number: number,
  commit_id: string
): Promise<void> {
  for await (const issue of issues) {
    let urls = ''
    const urlPrefix = `https://github.com/${owner}/${repo}/blob/${payload.pull_request.head.ref}/`
    const gradleLintBaselineReportBaseName = path.parse(
      core.getInput('gradleLintBaselineReportPath')
    ).base
    const message =
      issue.severity.includes('Information') &&
      issue.message.includes(gradleLintBaselineReportBaseName)
        ? issue.message.replace(
            gradleLintBaselineReportBaseName,
            `[${gradleLintBaselineReportBaseName}](${urlPrefix}${core.getInput(
              'gradleLintBaselineReportPath'
            )})`
          )
        : issue.message
    const body = `${issue.title}\n\n${message}\n\n${issue.explanation}\n${urls}\n`

    const filePath = issue.location.file.includes(process.env.GITHUB_WORKSPACE as string)
      ? issue.location.file.replace(process.env.GITHUB_WORKSPACE as string, '').substr(1)
      : issue.location.file

    if (issue.urls) {
      urls += 'More info:\n\n'
      for (const url of issue.urls) {
        urls += ` - ${url}\n`
      }
      urls += '\n'
    }

    if (issue.location.line) {
      try {
        await octokit.rest.pulls.createReviewComment({
          owner,
          repo,
          pull_number,
          body,
          position: issue.location.line,
          commit_id,
          path: filePath
        })
      } catch (error) {
        console.log(`Problem with the following issue: \n${JSON.stringify(issue, null, 2)}`)
        core.setFailed(error.message)
      }
    } else {
      try {
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: pull_number,
          body
        })
      } catch (error) {
        console.log(`Problem with the following issue: \n${JSON.stringify(issue, null, 2)}`)
        core.setFailed(error.message)
      }
    }
  }
}

run()
