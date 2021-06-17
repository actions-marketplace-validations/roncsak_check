import parseGradleReport from '../src/tools/androidGradleLint'

test('parseGradleReport(lint-single.xml)', async () => {
  const received = await parseGradleReport(`${__dirname}/reports/lint-single.xml`)
  expect(received).toHaveLength(1)
})
