<a href="https://github.com/roncsak/check"><img alt="typescript-action status" src="https://github.com/roncsak/check/workflows/test/badge.svg"></a>

# Parse results of Android's linter run by gradle and post comments to Pull Requests

The main goal of this action to have a visual representation of lint results on the UI.  
Currently the severity of issues have no effect on the PR: The PR is not blocked in case a lint error found.

## Prerequisite

 - (Source code) Configure lint in build.gradle of the module
 - (GH Action) You need to checkout the project with the following head ref of the pull request. (Example below)
 - (GH Action) Run gradle lint with basefile option 

```groovy
android {
  lintOptions {
    baseline file("lint-baseline.xml")
    abortOnError false
  }
}

```

```yaml
- name: Checkout project
  uses: actions/checkout@v2
  with:
    ref: ${{ github.event.pull_request.head.ref }}

- name: Lint with gradle
  run : gradle lint -Dlint.baselines.continue=true

- name: Parse and report gradle lint issues
  uses: roncsak/check@v0.1.0
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    gradleLintBaselineReportPath: 'app/lint-baseline.xml'
    gradleLintReportPath: 'app/build/reports/lint-results.xml'

```

## Optional input arguments

### `token`
A token (GitHub or PAT) with write permission to the repository.
**Default:** `secrets.GITHUB_TOKEN`

### `gradleLintBaselineReportPath`
The relative path of the lint-baseline.xml
**Default:** `app/lint-baseline.xml`

### `gradleLintReportPath`
The relative path of the lint-results.xml
**Default:** `app/build/reports/lint-results.xml`

## Workflow

 1. The action is triggered by a Pull Request (creating or updating one)
 1. The baseline report file is commited to the source code
 1. Parse report file into a JSON array
 1. Iterate through the JSON array and create review/regular comments to the PR

## Example usage

```yaml
- name: Parse and report gradle lint issues
  uses: roncsak/check@v0.1.0
  with:
    token: ${{ secrets.GITHUB_TOKEN }}
    gradleLintBaselineReportPath: 'app/lint-baseline.xml'
    gradleLintReportPath: 'app/build/reports/lint-results.xml'
```

## Planned features and improvements
 - Throttling
   This action uses GitHub's REST API. When the action sends too many requests in too little time the action will likely hit errors due to rate and/or abuse limits. In order to automatically throttle requests as recommended in (GitHub’s best practices for integrators)[https://docs.github.com/en/rest/guides/best-practices-for-integrators] some improvements needed.
 - Put the reports to GitHub artifacts  
   Android's linter produce html reports beside xml reports. It would be good to download those html reports and check issues visually.
 - Have control over blocking the merge of PR in case of specific severity issues  
   Currently if an issue with Error severity is found the merge is still allowed, however it would be crucial to not let source code to be merged with errors in it. For greater control, an input variable will be introduced what is used to define which severity level blocks the merge.
 - Have control over what type of issues (based on severity) want to post to GitHub comments.
 - Integrate other tools ?