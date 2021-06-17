import * as core from '@actions/core'
import * as github from '@actions/github'
import {readFileSync} from 'fs'
import {Tree} from '../types/main'
import {getOwnerAndRepo} from './utils'

const [owner, repo] = getOwnerAndRepo(process.env.GITHUB_REPOSITORY as string)
const token: string = core.getInput('token', {required: true})
const octokit = github.getOctokit(token)
const files = [core.getInput('gradleLintBaselineReportPath', {required: true})]

export async function commitGradleLintFiles(): Promise<boolean> {
  const ref = `heads/${github.context.payload.pull_request?.head.ref}`
  octokit.log.debug(`ref is ${ref}`)
  const latestCommitSha = await getShaOfLatestCommit(ref)
  const latestTreeSha = await getShaOfLatestTree(latestCommitSha)

  const tree: Tree[] = []

  for (const file of files) {
    tree.push({
      path: file,
      mode: '100644',
      type: 'blob',
      content: readFileSync(file, {encoding: 'utf8'})
    })
  }
  const treeSha = await createTreeSha(tree, latestTreeSha)
  const commitSha = await createCommitSha('Automated commit', treeSha, [latestCommitSha])
  await updateRef(ref, commitSha)
  return true
}

async function getShaOfLatestCommit(ref: string): Promise<string> {
  octokit.log.debug('\n\n getShaOfLatestCommit()')
  const {data} = await octokit.rest.git.getRef({
    owner,
    repo,
    ref
  })
  octokit.log.debug(JSON.stringify(data, null, 2))
  return data.object.sha
}

async function getShaOfLatestTree(commit_sha: string): Promise<string> {
  octokit.log.debug('\n\n getShaOfLatestTree()')
  const {data} = await octokit.rest.git.getCommit({
    owner,
    repo,
    commit_sha
  })
  octokit.log.debug(JSON.stringify(data, null, 2))
  return data.tree.sha
}

async function createTreeSha(tree: Tree[], base_tree: string): Promise<string> {
  octokit.log.debug('\n\n createTreeSha()')
  const {data} = await octokit.rest.git.createTree({
    owner,
    repo,
    tree,
    base_tree
  })
  octokit.log.debug(JSON.stringify(data, null, 2))
  return data.sha
}

async function createCommitSha(message: string, tree: string, parents: string[]): Promise<string> {
  octokit.log.debug('\n\n createCommitSha()')
  const {data} = await octokit.rest.git.createCommit({
    owner,
    repo,
    message,
    tree,
    parents
  })
  octokit.log.debug(JSON.stringify(data, null, 2))
  return data.sha
}

async function updateRef(ref: string, sha: string): Promise<string> {
  octokit.log.debug('\n\n updateRef()')
  const {data} = await octokit.rest.git.updateRef({
    owner,
    repo,
    ref,
    sha
  })
  octokit.log.debug(JSON.stringify(data, null, 2))
  return data.ref
}
