pipeline {
    agent any
    parameters {
      string(name: 'BRANCH', defaultValue: 'development', description: 'Branch a desplegar')
      string(name: 'MONGO_PORT', defaultValue: '27018', description: 'Puerto host para MongoDB')
      string(name: 'BACKEND_PORT', defaultValue: '3001', description: 'Puerto host para el backend (API + Swagger)')
      string(name: 'FRONTEND_PORT', defaultValue: '8081', description: 'Puerto host para el frontend')
    }

    environment {
        PROJECT_NAME = "shieldtrack"
        GITHUB_REPO = "https://github.com/cdc-netics/ShiedTrack.git"
        QA_HOST = "10.0.101.70"
        QA_DEPLOY_DIR = "/opt/shieldtrack"
        SSH_USER = "root"
        AMBIENTE = "qa"
    }

    stages {
        stage('Checkout') {
            steps {
                echo "🔄 Clonando repositorio..."
                checkout([
                    $class: 'GitSCM',
                    branches: [[name: "${params.BRANCH}"]],
                    userRemoteConfigs: [[
                        url: "${GITHUB_REPO}",
                        credentialsId: 'github-token'
                    ]]
                ])
            }
        }

        stage('Generate .env') {
            steps {
                echo "🔧 Componiendo .env para el ambiente '${AMBIENTE}'..."
                withCredentials([
                    string(credentialsId: 'certvault-mongo-password', variable: 'MONGO_INITDB_ROOT_PASSWORD'),
                    string(credentialsId: 'certvault-jwt-secret', variable: 'JWT_SECRET'),
                    string(credentialsId: 'certvault-admin-password', variable: 'ADMIN_PASSWORD')
                ]) {
                    sh '''
                        export MONGO_PORT="${MONGO_PORT}"
                        export BACKEND_PORT="${BACKEND_PORT}"
                        export FRONTEND_PORT="${FRONTEND_PORT}"
                        sh ./deploy/compose-env.sh "$AMBIENTE"
                    '''
                }
            }
        }

        stage('Deploy to QA') {
            steps {
                echo "📦 Deployando a QA (${QA_HOST})..."
                withCredentials([sshUserPrivateKey(credentialsId: 'jenkins-ssh-key', keyFileVariable: 'SSH_KEY', usernameVariable: 'SSH_USER')]) {
                    sh '''
                        echo "🧹 Limpiando deploy anterior..."
                        ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${SSH_USER}@${QA_HOST} "cd ${QA_DEPLOY_DIR} && docker compose down || true" 2>/dev/null || true
                        ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${SSH_USER}@${QA_HOST} "rm -rf ${QA_DEPLOY_DIR}"

                        echo "📤 Copiando código desde Jenkins..."
                        ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${SSH_USER}@${QA_HOST} "mkdir -p ${QA_DEPLOY_DIR}"
                        scp -i ${SSH_KEY} -r -o StrictHostKeyChecking=no . ${SSH_USER}@${QA_HOST}:${QA_DEPLOY_DIR}/

                        echo "🚀 Iniciando docker compose..."
                        ssh -i ${SSH_KEY} -o StrictHostKeyChecking=no ${SSH_USER}@${QA_HOST} "cd ${QA_DEPLOY_DIR} && docker compose up -d --build"

                        echo "✓ Deploy completado"
                    '''
                }
            }
        }

        stage('Health Check QA') {
            steps {
                echo "🏥 Health check QA..."
                sh '''
                    for attempt in $(seq 1 60); do
                      if curl -fs http://${QA_HOST}:${BACKEND_PORT}/api/docs >/dev/null 2>&1; then
                        echo "✓ QA healthy"
                        exit 0
                      fi
                      echo "Intento $attempt/60..."
                      sleep 2
                    done
                    echo "✗ Health check falló"
                    exit 1
                '''
            }
        }
    }

    post {
        always {
            script {
                def status = currentBuild.currentResult
                def icon = status == 'SUCCESS' ? '✅' : '❌'

                emailext(
                    to:          "gserrano@netics.cl",
                    subject:     "${icon} [${env.PROJECT_NAME}] ${status} - ${params.BRANCH} (#${env.BUILD_NUMBER})",
                    body: """
                        <p>Resultado: <b>${status}</b></p>
                        <p><a href="${env.BUILD_URL}">${env.BUILD_URL}</a></p>
                        <p>Frontend: <a href="http://${env.QA_HOST}:${params.FRONTEND_PORT}">http://${env.QA_HOST}:${params.FRONTEND_PORT}</a></p>
                        <p>API / Swagger: <a href="http://${env.QA_HOST}:${params.BACKEND_PORT}/api/docs">http://${env.QA_HOST}:${params.BACKEND_PORT}/api/docs</a></p>
                        <pre>
 /\\_/\\
( ^.^ )
 > ~
  | |
 (__|__)
                        </pre>
                    """,
                    mimeType:    'text/html',
                    attachLog:   status != 'SUCCESS',
                    compressLog: status != 'SUCCESS'
                )
            }

            echo "🧹 Limpiando workspace..."
            cleanWs()
        }
    }
}
