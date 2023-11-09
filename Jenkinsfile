import java.text.SimpleDateFormat

Boolean isMaster = branch_name.equalsIgnoreCase('master')
String gitAddress = 'http://10.1.85.161:8888/lvfudi/testAutoDeploy.git'
String gitAuth = "${gitAuth}"
//定义一个版本号作为当次构建的版本，输出结果 20191210175842_69
SimpleDateFormat dateFormat = new SimpleDateFormat('yyyyMMddHHmm')
String dockerTag = dateFormat.format(new Date()) + "_${env.BUILD_ID}"

String harborUrl = isMaster ? 'registry.ocp.dovepay' : '10.1.85.22:1034'
String harborAuth = "${harborAuth}"
String src = isMaster ? 'registry.ocp.dovepay/imagepri' : '10.1.85.22:1034/library'

//构建版本的名称
String imageUrl = "${env.JOB_NAME}:${dockerTag}"

//k8s的凭证
//def k8s_auth="3f1ac32a-d688-4934-8cf4-9df6c7cee03f"
//定义k8s-barbor的凭证
//def secret_name="访问k8stoken"

String deploymentFilename = isMaster ? 'deployment-prod' : 'deployment'

node('jenkins-slave') {
    container('tools') {
        // 第一步
      stage('代码下载') {
        checkout([
          $class: 'GitSCM',
          branches: [[name: "*/${branch_name}"]],
          extensions: [],
          userRemoteConfigs: [[
            credentialsId: "${gitAuth}",
            url: "${gitAddress}"
          ]]
        ])
      }

        // 第二步
        stage('上传镜像') {
      //创建镜像
      sh "docker build --build-arg src=${src} -t ${imageUrl} --rm=true ./"

      //给镜像打标签
      sh "docker tag ${imageUrl} ${harborUrl}/project_library/${imageUrl}"

      //登录Harbor，并上传镜像
      withCredentials([
        usernamePassword(credentialsId: "${harborAuth}", passwordVariable: 'password', usernameVariable: 'username')
      ])
      {
        //登录
        sh "docker login -u ${username} -p ${password} ${harborUrl}"
        //上传镜像
        sh "docker push ${harborUrl}/project_library/${imageUrl}"
      }

      //删除本地镜像
      sh "docker rmi -f ${imageUrl}"
      sh "docker rmi -f ${harborUrl}/project_library/${imageUrl}"
        }

        // 第四步
        stage('部署到k8s平台') {
      //替换变量
      String deployImageName = "${harborUrl}/project_library/${imageUrl}"
      sh "sed -i 's#\$IMAGE_NAME#${deployImageName}#' kubectl/${deploymentFilename}.yaml"
      sh "sed -i 's#\$PROJECT#${JOB_NAME}#' kubectl/${deploymentFilename}.yaml"
      sh "sed -i 's#\$PROJECT#${JOB_NAME}#' kubectl/pvpvc-test.yml"

      //替换yml名称，以便滚动更新
      sh "mv kubectl/${deploymentFilename}.yaml kubectl/deployment_${env.BUILD_ID}.yaml"

      //创建PVPVC
      sh 'kubectl apply -f kubectl/pvpvc-test.yml'

      //清理启动失败的进程
      sh '''
          NUM=`kubectl get deployment -n dovepay-b2b | grep ${JOB_NAME} | awk -F "/" '{print $1}' | awk -F " " '{print $2}'`
          COUNT=`kubectl get deployment -n dovepay-b2b | grep ${JOB_NAME} | wc -l`
          if [ $COUNT -ne 0 ];then
              if [ $NUM -eq 0 ];then
              kubectl delete deployment ${JOB_NAME}-latest -n dovepay-b2b
              sleep 8s
                  echo "清理进程完成！"
              fi
          else
                echo "第一次部署！"
          fi
      '''

      //部署到K8S
      sh "kubectl apply -f kubectl/deployment_${env.BUILD_ID}.yaml --record"
        }

        // 第五步
        stage('检查部署应用') {
      //获取日志
      sh 'sleep 20s'
      timeout(time: 3, unit: 'MINUTES') {
        sh '''
          ID_NAME=`kubectl get pods  -n dovepay-b2b  | grep  ${JOB_NAME} | awk -F " " '{print $1}' | head -1`
          kubectl logs --tail  3000 -n dovepay-b2b ${ID_NAME}
        '''
      }

      //判断部署应用是否启动成功
      sh '''
          NUM=`kubectl get deployment -n dovepay-b2b | grep ${JOB_NAME} | awk -F "/" '{print $1}' | awk -F " " '{print $2}'`
          if [ $NUM -eq 1 ];then
              echo "部署应用成功！"
          else
              echo "部署应用失败！"
              exit 1
          fi
        '''
      sh "kubectl rollout history deployment  ${JOB_NAME}-latest -n dovepay-b2b"
        }
        // 第六步
        stage('清理镜像') {
      sh '''
        NUM_NEW=`docker images | grep ${JOB_NAME} | awk 'NR==1{print $2}'`
        NUM_OLD=`docker images | grep ${JOB_NAME}  | awk -F" " '{print $2}'`
        for i in $NUM_OLD
        do
          if [  $i != $NUM_NEW ]
          then
            docker rmi -f 10.1.85.22:1034/project_library/${JOB_NAME}:$i
            echo "$i清理成功!"
          fi
        done

      '''
        }
    }
}
