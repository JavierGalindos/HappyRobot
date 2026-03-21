export const config = {
  account: "346133363539",
  region: "us-east-1",

  projectName: "happyrobot",
  stackName: "HappyRobotStack",
  dashboardStackName: "HappyRobotDashboardStack",

  // S3
  dataBucketPrefix: "happyrobot-data",
  dashboardBucketPrefix: "happyrobot-dashboard",
  loadsS3Key: "data/loads.json",
  callLogsPrefix: "call-logs/",

  // Lambda
  lambdaMemorySize: 512,
  lambdaTimeout: 30,

  // API Gateway
  apiName: "HappyRobot Carrier Sales",
  throttleRateLimit: 50,
  throttleBurstLimit: 100,
};
