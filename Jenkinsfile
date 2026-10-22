pipeline {
    agent any

    options {
        // Batasi build yang disimpan; tiap build menyimpan salinan dashboard (screenshot + video)
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }

    parameters {
        choice(
            name: 'TAGS',
            choices: ['all', '@webtables', '@droppable', '@resizable', '@practiceForm'],
            description: 'Pilih tag scenario yang mau dijalankan'
        )
    }

    environment {
        // /opt/homebrew/bin = Homebrew di Mac Apple Silicon, /usr/local/bin = Mac Intel / Linux
        PATH = "/opt/homebrew/bin:/usr/local/bin:${env.PATH}"
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
                sh 'npm ci'
            }
        }

        stage('Install Playwright Browsers') {
            steps {
                sh 'npx playwright install chromium'
            }
        }

        stage('Run Tests') {
            steps {
                // run-tests.js: jalankan test + Allure, lalu selalu generate dashboard (juga saat ada yang gagal)
                sh params.TAGS == 'all'
                    ? 'node run-tests.js --allure'
                    : "node run-tests.js --allure --tags '${params.TAGS}'"
            }
        }
    }

    post {
        always {
            // Dibuat di sini (bukan di stage) supaya tetap jalan walaupun ada test yang gagal
            sh 'npm run report || true'
            publishHTML(target: [
                allowMissing: true,
                alwaysLinkToLastBuild: true,
                keepAll: true,
                reportDir: 'reports/dashboard',
                reportFiles: 'index.html',
                reportName: 'Test Dashboard'
            ])
            publishHTML(target: [
                allowMissing: true,
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
