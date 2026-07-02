// Pipeline CI/CD - TaskList Frontend
// Étapes : Install -> Tests+Coverage -> SonarQube -> Build Docker -> Trivy -> Push Docker Hub
//
// Pré-requis à configurer dans Jenkins (Manage Jenkins > Credentials) :
//   - remi-sonar-token          : Secret text  = token d'analyse SonarQube
//   - remi-dockerhub-credentials : Username/password = identifiants Docker Hub (projet2efrei)
// Agent : doit disposer de node, npm, docker et sonar-scanner.

pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 30, unit: 'MINUTES')
  }

  environment {
    IMAGE_NAME  = 'projet2efrei/certif-tasklist-frontend'
    IMAGE_TAG   = '1.0.0'
    SONAR_HOST  = 'https://sonarqube.cicd.kits.ext.educentre.fr'
  }

  stages {
    stage('Install dependencies') {
      steps {
        sh 'npm ci'
      }
    }

    stage('Unit Tests + Coverage') {
      steps {
        sh 'npm run test:coverage'
      }
      post {
        always {
          junit testResults: 'reports/junit.xml', allowEmptyResults: true
        }
      }
    }

    stage('Analyse SonarQube') {
      steps {
        withCredentials([string(credentialsId: 'remi-sonar-token', variable: 'SONAR_TOKEN')]) {
          sh 'sonar-scanner -Dsonar.host.url=$SONAR_HOST -Dsonar.token=$SONAR_TOKEN'
        }
      }
    }

    stage('Build Docker Image') {
      steps {
        sh 'docker build -t $IMAGE_NAME:$IMAGE_TAG -t $IMAGE_NAME:latest .'
      }
    }

    stage('Scan Trivy') {
      steps {
        // Échoue le build si des vulnérabilités HIGH/CRITICAL sont détectées
        sh '''
          docker run --rm \
            -v /var/run/docker.sock:/var/run/docker.sock \
            -v trivy-cache:/root/.cache/ \
            aquasec/trivy:latest image \
            --scanners vuln --severity HIGH,CRITICAL --exit-code 1 \
            $IMAGE_NAME:$IMAGE_TAG
        '''
      }
    }

    stage('Push Docker Hub') {
      steps {
        withCredentials([usernamePassword(credentialsId: 'remi-dockerhub-credentials', usernameVariable: 'DOCKER_USER', passwordVariable: 'DOCKER_PASS')]) {
          sh '''
            echo "$DOCKER_PASS" | docker login -u "$DOCKER_USER" --password-stdin
            docker push $IMAGE_NAME:$IMAGE_TAG
            docker push $IMAGE_NAME:latest
            docker logout
          '''
        }
      }
    }
  }

  post {
    always {
      sh 'docker image rm $IMAGE_NAME:$IMAGE_TAG $IMAGE_NAME:latest || true'
      cleanWs()
    }
  }
}
