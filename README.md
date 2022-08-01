# How to run this project

1. [Install AWS CLI](https://docs.aws.amazon.com/cli/latest/userguide/getting-started-install.html)
2. Add an IAM user with proper access, then set up `aws configuration`, [read docs here](https://docs.aws.amazon.com/cli/latest/reference/configure/index.html)
3. Clone this project
4. Run `npm i`
5. If you want to invoke function locally, try
   **npx serverless invoke local -f [function name] --data '{ "pathParameters": {"id":"userID"}}'**
   Ex. `npx serverless invoke local -f listUser`
6. If you want to deploy to cloud, make sure you have configured aws credentials (the step 2), then run
   `npx serverless deploy`
