const report = require('multiple-cucumber-html-reporter');

report.generate({
  // Folder khusus: reporter membaca SEMUA file .json di folder ini (termasuk subfolder)
  jsonDir: 'reports/cucumber',
  reportPath: 'reports/html',
  metadata: {
    browser: { name: 'chrome', version: '120' },
    device: 'Local Machine',
    platform: { name: 'macOS' }
  },
  customData: {
    title: 'Test Report',
    data: [
      { label: 'Project', value: 'Playwright + Cucumber' },
      { label: 'Environment', value: 'Development' }
    ]
  }
});