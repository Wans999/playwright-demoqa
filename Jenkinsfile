pipeline {
    agent any

    parameters {
        choice(
            name: 'TAGS',
            choices: ['all', '@webtables', '@droppable', '@resizable', '@practiceForm'],
            description: 'Pilih tag scenario yang mau dijalankan'
        )
    }

    environment {
        PATH = "/usr/local/bin:${env.PATH}"
        CI = "true"
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Install Dependencies') {
            steps {
                sh 'npm install'
            }
        }

        stage('Install Playwright Browsers') {
            steps {
                sh 'npx playwright install chromium'
            }
        }

        stage('Run Tests') {
            steps {
                sh params.TAGS == 'all' ? 'npm test' : "npm test -- --tags '${params.TAGS}'"
            }
        }

        stage('Generate Report') {
            steps {
                sh 'npm run report'
            }
        }
    }

    post {
        always {
            sh 'npm run dashboard || true'
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'reports/dashboard',
                reportFiles: 'index.html',
                reportName: 'Test Dashboard'
            ])
            publishHTML(target: [
                allowMissing: false,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'reports/html',
                reportFiles: 'index.html',
                reportName: 'Cucumber HTML Report'
            ])
            allure([
                includeProperties: false,
                jdk: '',
                results: [[path: 'allure-results']]
            ])
        }
    }
}
