import java.text.SimpleDateFormat
import java.lang.String

//定义一个版本号作为当次构建的版本，输出结果 20191210175842_69
def dateFormat = new SimpleDateFormat("yyyyMMddHHmm")
def dockerTag = dateFormat.format(new Date()) + "_${env.BUILD_ID}"



//定义变量

def git_address = "http://10.1.85.161:8888/lvfudi/testAutoDeploy.git" 
def git_auth = "8dccd9d7-19d6-47ab-87c5-4173a88c4661"
//def git_branch = "${branch_name}"


//Harbor私服地址
def harbor_url = "10.1.85.22:1034"
//Harbor的凭证
def harbor_auth = "6b8facae-6afc-4818-a4e3-2e2a8b16432a"


//构建版本的名称
def imageUrl = "${env.JOB_NAME}:${dockerTag}"

//k8s的凭证
//def k8s_auth="3f1ac32a-d688-4934-8cf4-9df6c7cee03f"
//定义k8s-barbor的凭证
//def secret_name="访问k8stoken"




node("jenkins-slave"){
  container('tools'){
    // 第一步
    stage('代码下载'){
      checkout([$class: 'GitSCM', branches: [[name: '*/${branch_name}']], extensions: [], userRemoteConfigs: [[credentialsId: "${git_auth}", url: "${git_address}"]]])
    }
    

    // 第二步
    stage('上传镜像'){  
      
      //创建镜像
      sh "docker build -t ${imageUrl} --rm=true ./"

        
      //给镜像打标签
      sh "docker tag ${imageUrl} ${harbor_url}/project_library/${imageUrl}"

            //登录Harbor，并上传镜像
            withCredentials([usernamePassword(credentialsId: "${harbor_auth}", passwordVariable: 'password', usernameVariable: 'username')])
            {
                //登录
                sh "docker login -u ${username} -p ${password} ${harbor_url}"
                //上传镜像
                sh "docker push ${harbor_url}/project_library/${imageUrl}"
            }
      
      //删除本地镜像
            sh "docker rmi -f ${imageUrl}" 
            sh "docker rmi -f ${harbor_url}/project_library/${imageUrl}"
    }
    
    // 第四步
    stage('部署到k8s平台'){
        
      //替换变量
      def deploy_image_name = "${harbor_url}/project_library/${imageUrl}"
      sh "sed -i 's#\$IMAGE_NAME#${deploy_image_name}#' kubectl/deployment.yaml"
      sh "sed -i 's#\$PROJECT#${JOB_NAME}#' kubectl/deployment.yaml"
      sh "sed -i 's#\$PROJECT#${JOB_NAME}#' kubectl/pvpvc-test.yml"
        
      //替换yml名称，以便滚动更新
      sh "mv kubectl/deployment.yaml kubectl/deployment_${env.BUILD_ID}.yaml"
        
      //创建PVPVC
      sh "kubectl apply -f kubectl/pvpvc-test.yml"
      
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
    stage('检查部署应用'){
        
      //获取日志
      sh 'sleep 40s'
      timeout(time: 3, unit: 'MINUTES'){
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
    stage('清理镜像'){
    
      sh '''
        NUM_NEW=`docker images | grep ${JOB_NAME} | awk 'NR==1{print $2}'`
        NUM_OLD=`docker images | grep ${JOB_NAME}  | awk -F" " '{print $2}'`
        for i in $NUM_OLD
        do
          if [  $i != $NUM_NEW ]
          then
            docker rmi -f 10.1.85.22:1034/project_library/${JOB_NAME}:$i
            echo "$i清理成功！"
          fi
        done
        
      '''
    }
  }
}